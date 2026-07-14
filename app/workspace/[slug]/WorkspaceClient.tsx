"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check,
  Users, Clock, Wifi, WifiOff, Maximize2, Minimize2
} from 'lucide-react';

type Props = { slug: string };

type RemoteStream = {
  id: string;
  stream: MediaStream;
  userId?: string;
};

type PeerInfo = {
  id: string;
  userId?: string;
};

const SIGNALING_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || 'ws://localhost:3005';

export default function WorkspaceClient({ slug }: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcMap = useRef(new Map<string, RTCPeerConnection>());
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [participants, setParticipants] = useState<PeerInfo[]>([]);
  const [roomUrl, setRoomUrl] = useState('');
  const localStreamRef = useRef<MediaStream | null>(null);
  const clientIdRef = useRef<string>(`c_${Math.random().toString(36).slice(2, 9)}`);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setRoomUrl(typeof window !== 'undefined' ? window.location.href : '');
  }, []);

  // Meeting timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // WebRTC + Signaling
  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => {});
        }

        const socket = new WebSocket(SIGNALING_URL);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!mounted) return;
          setConnected(true);
          socket.send(JSON.stringify({ type: 'join-room', roomId: slug, from: clientIdRef.current, userId }));
        };

        socket.onclose = () => {
          if (mounted) setConnected(false);
        };

        socket.onerror = () => {
          if (mounted) setConnected(false);
        };

        socket.onmessage = async (ev) => {
          if (!mounted) return;
          const msg = JSON.parse(ev.data);
          const type = msg.type;

          if (type === 'room-state') {
            setParticipants(msg.participants || []);
            return;
          }

          if (type === 'peer-joined') {
            const peerId = msg.from;
            await createOffer(peerId, socket);
            return;
          }

          if (type === 'offer') {
            const from = msg.from;
            await handleOffer(from, msg.payload, socket);
            return;
          }

          if (type === 'answer') {
            const from = msg.from;
            const pc = pcMap.current.get(from);
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            }
            return;
          }

          if (type === 'ice-candidate') {
            const from = msg.from;
            const pc = pcMap.current.get(from);
            if (pc && msg.payload) {
              try {
                await pc.addIceCandidate(msg.payload);
              } catch (e) {
                console.warn('addIceCandidate failed', e);
              }
            }
            return;
          }

          if (type === 'peer-left') {
            const from = msg.from;
            removePeer(from);
            setParticipants((prev) => prev.filter((p) => p.id !== from));
            return;
          }
        };
      } catch (e) {
        console.error('media/init error', e);
        alert('Failed to access camera/microphone: ' + (e as Error).message);
      }
    }

    start();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcMap.current.forEach((pc) => pc.close());
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'leave', roomId: slug, from: clientIdRef.current }));
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, userId]);

  async function createOffer(peerId: string, socket: WebSocket) {
    if (pcMap.current.has(peerId)) return;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const localStream = localStreamRef.current;
    if (!localStream) return;

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket.send(JSON.stringify({ type: 'ice-candidate', roomId: slug, from: clientIdRef.current, to: peerId, payload: ev.candidate }));
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (!stream) return;
      setRemoteStreams((prev) => {
        if (prev.find((p) => p.id === peerId)) return prev;
        return [...prev, { id: peerId, stream }];
      });
    };

    pcMap.current.set(peerId, pc);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.send(JSON.stringify({ type: 'offer', roomId: slug, from: clientIdRef.current, to: peerId, payload: offer }));
    } catch (e) {
      console.error('createOffer error', e);
    }
  }

  async function handleOffer(from: string, offer: RTCSessionDescriptionInit, socket: WebSocket) {
    if (pcMap.current.has(from)) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    const localStream = localStreamRef.current;
    if (!localStream) return;
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket.send(JSON.stringify({ type: 'ice-candidate', roomId: slug, from: clientIdRef.current, to: from, payload: ev.candidate }));
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (!stream) return;
      setRemoteStreams((prev) => {
        if (prev.find((p) => p.id === from)) return prev;
        return [...prev, { id: from, stream }];
      });
    };

    pcMap.current.set(from, pc);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.send(JSON.stringify({ type: 'answer', roomId: slug, from: clientIdRef.current, to: from, payload: answer }));
    } catch (e) {
      console.error('handleOffer error', e);
    }
  }

  function removePeer(peerId: string) {
    const pc = pcMap.current.get(peerId);
    if (pc) {
      pc.close();
      pcMap.current.delete(peerId);
    }
    setRemoteStreams((prev) => prev.filter((r) => r.id !== peerId));
  }

  function toggleMic() {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setMicOn((v) => !v);
  }

  function toggleCam() {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    tracks.forEach((t) => (t.enabled = !t.enabled));
    setCamOn((v) => !v);
  }

  function copyRoomLink() {
    if (!roomUrl) return;
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function leaveRoom() {
    // Send leave signal
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave', roomId: slug, from: clientIdRef.current }));
      wsRef.current.close();
    }
    // Close all peer connections
    pcMap.current.forEach((pc) => pc.close());
    // Stop local tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    // End the room in DB (best-effort, don't block navigation)
    try {
      await fetch(`/api/room/${slug}`, { method: 'PATCH' });
    } catch {
      // Silently fail — room will remain "active" but user still leaves
    }

    router.push('/dashboard');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }

  const participantCount = 1 + remoteStreams.length;
  const totalStreams = 1 + remoteStreams.length;

  // Compute grid layout based on participant count
  const gridCols = totalStreams <= 1 ? 'grid-cols-1' :
    totalStreams <= 4 ? 'grid-cols-2' :
    totalStreams <= 9 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white font-sans flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#111219] border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Video size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">NexoMeet</span>
          </div>
          <div className="h-5 w-px bg-white/10" />
          <span className="text-xs text-gray-400 font-mono">{slug}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <Wifi size={13} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">Disconnected</span>
              </>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
            <Clock size={13} className="text-gray-400" />
            <span className="text-xs font-mono text-gray-300">{formatTime(elapsed)}</span>
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
            <Users size={13} className="text-gray-400" />
            <span className="text-xs text-gray-300">{participantCount}</span>
          </div>

          {/* Copy invite link */}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg transition-all text-xs font-medium cursor-pointer"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Invite'}</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            {fullscreen ? <Minimize2 size={15} className="text-gray-400" /> : <Maximize2 size={15} className="text-gray-400" />}
          </button>
        </div>
      </header>

      {/* Video Grid */}
      <main className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <div className={`grid ${gridCols} gap-3 w-full max-w-7xl h-full max-h-[calc(100vh-140px)]`}>
          {/* Local Video */}
          <div className="relative bg-[#16171f] rounded-2xl overflow-hidden border border-white/5 group min-h-[240px]">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {!camOn && (
              <div className="absolute inset-0 bg-[#16171f] flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                  {userId ? userId.charAt(0).toUpperCase() : 'Y'}
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                You
              </span>
              {!micOn && (
                <span className="bg-red-500/80 backdrop-blur-sm p-1 rounded-lg">
                  <MicOff size={11} className="text-white" />
                </span>
              )}
            </div>
          </div>

          {/* Remote Streams */}
          {remoteStreams.map((r) => (
            <RemoteVideo key={r.id} stream={r.stream} id={r.id} />
          ))}

          {/* Waiting state — show when alone */}
          {remoteStreams.length === 0 && (
            <div className="relative bg-[#16171f] rounded-2xl overflow-hidden border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 min-h-[240px]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Users size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Waiting for others to join...</p>
              <button
                onClick={copyRoomLink}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Copy size={11} />
                <span>Share invite link</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Toolbar */}
      <footer className="flex items-center justify-center gap-3 py-4 bg-[#111219] border-t border-white/5">
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`p-4 rounded-2xl transition-all cursor-pointer ${
            micOn
              ? 'bg-white/10 hover:bg-white/15 text-white'
              : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
          }`}
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCam}
          className={`p-4 rounded-2xl transition-all cursor-pointer ${
            camOn
              ? 'bg-white/10 hover:bg-white/15 text-white'
              : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
          }`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Leave Room */}
        <button
          onClick={leaveRoom}
          className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-red-900/30"
          title="Leave meeting"
        >
          <PhoneOff size={18} />
          <span className="text-sm">Leave</span>
        </button>
      </footer>
    </div>
  );
}

function RemoteVideo({ stream, id }: { stream: MediaStream; id: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <div className="relative bg-[#16171f] rounded-2xl overflow-hidden border border-white/5 group min-h-[240px]">
      <video ref={ref} className="w-full h-full object-cover" autoPlay playsInline />
      <div className="absolute bottom-3 left-3">
        <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
          {id.startsWith('c_') ? `Guest ${id.slice(2, 6)}` : id}
        </span>
      </div>
    </div>
  );
}
