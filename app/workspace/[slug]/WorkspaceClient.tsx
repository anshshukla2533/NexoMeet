"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check,
  Users, Clock, Wifi, WifiOff, Maximize2, Minimize2, NotebookPen, Captions, RefreshCw
} from 'lucide-react';
import { useSpeechTranscription } from '@/hooks/useSpeechTranscription';

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

type Transcript = { id: string; speaker: string; text: string; timestamp: string };
type MeetingSummary = { id: string; summary: string; keyPoints: string[]; actionItems: string[]; decisions: string[]; updatedAt: string };

const SIGNALING_URL =
  process.env.NEXT_PUBLIC_WS_URL!;

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
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [meetingSummary, setMeetingSummary] = useState<MeetingSummary | null>(null);
  const [noteError, setNoteError] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const summarizedTranscriptCountRef = useRef(0);
  const speakerName = userId ? `Participant ${userId.slice(-4)}` : 'You';
  const { isListening, isSupported, toggleTranscription } = useSpeechTranscription(speakerName, slug);

  useEffect(() => {
    setRoomUrl(typeof window !== 'undefined' ? window.location.href : '');
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const [transcriptResponse, summaryResponse] = await Promise.all([
          fetch(`/api/room/${encodeURIComponent(slug)}/transcript`),
          fetch(`/api/room/${encodeURIComponent(slug)}/summary`),
        ]);
        if (transcriptResponse.ok) setTranscripts(await transcriptResponse.json());
        if (summaryResponse.ok) setMeetingSummary(await summaryResponse.json());
      } catch { setNoteError('Automatic notes are unavailable right now.'); }
    };
    void loadNotes();
    const interval = setInterval(loadNotes, 10_000);
    return () => clearInterval(interval);
  }, [slug]);

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

  async function generateSummary() {
    setSummarizing(true); setNoteError('');
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(slug)}/summary`, { method: 'POST' });
      const note = await res.json();
      if (!res.ok) throw new Error(note.error || 'Could not generate notes.');
      setMeetingSummary(note);
    } catch (error) { setNoteError(error instanceof Error ? error.message : 'Could not generate automatic notes.'); }
    finally { setSummarizing(false); }
  }

  // Regenerate the one room-level summary whenever new speech is persisted.
  useEffect(() => {
    if (!transcripts.length || summarizedTranscriptCountRef.current === transcripts.length) return;
    summarizedTranscriptCountRef.current = transcripts.length;
    void generateSummary();
    // generateSummary intentionally reads the current room slug and state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcripts.length]);

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
    <div className="h-dvh overflow-hidden bg-[#0b0c0f] text-white font-sans flex flex-col">
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#202124] border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#1a73e8] p-1.5 rounded-lg">
              <Video size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">NexoMeet</span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-white/10" />
          <span className="hidden sm:block text-xs text-gray-400 font-mono">{slug}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection status */}
          <div className="hidden md:flex items-center gap-1.5">
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
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
            <Clock size={13} className="text-gray-400" />
            <span className="text-xs font-mono text-gray-300">{formatTime(elapsed)}</span>
          </div>

          {/* Participant count */}
          <div className="hidden sm:flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
            <Users size={13} className="text-gray-400" />
            <span className="text-xs text-gray-300">{participantCount}</span>
          </div>

          {/* Copy invite link */}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#287ae6] text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium cursor-pointer"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Invite'}</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:block p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            {fullscreen ? <Minimize2 size={15} className="text-gray-400" /> : <Maximize2 size={15} className="text-gray-400" />}
          </button>
        </div>
      </header>

      {/* Video Grid */}
      <main className="min-h-0 flex-1 p-3 sm:p-6 flex gap-4 overflow-hidden justify-center items-center">
        <div className={`grid ${gridCols} gap-3 h-full w-full items-center justify-items-center ${notesOpen ? 'flex-1' : 'max-w-6xl'}`}>
          {/* Local Video */}
          <div className={`relative aspect-video w-full bg-[#202124] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group min-h-[180px] ${remoteStreams.length === 0 ? 'max-w-[calc((100dvh-10rem)*16/9)]' : ''}`}>
            <video
              ref={localVideoRef}
              className="w-full h-full object-contain"
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
              <span className="bg-[#202124]/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-md">
                You
              </span>
              {!micOn && (
                <span className="bg-red-500/80 backdrop-blur-sm p-1 rounded-lg">
                  <MicOff size={11} className="text-white" />
                </span>
              )}
            </div>
            {remoteStreams.length === 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-[#202124]/90 px-3 py-2 text-xs text-gray-200 backdrop-blur-sm">
                <Users size={14} className="text-gray-400" />
                Waiting for others
              </div>
            )}
          </div>

          {/* Remote Streams */}
          {remoteStreams.map((r) => (
            <RemoteVideo key={r.id} stream={r.stream} id={r.id} />
          ))}

        </div>
        {notesOpen && <aside className="hidden xl:flex w-96 shrink-0 h-full rounded-2xl bg-[#202124] border border-white/10 flex-col overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><NotebookPen size={16} className="text-blue-400" /><h2 className="font-semibold text-sm">Automatic meeting notes</h2></div><button onClick={generateSummary} disabled={summarizing || transcripts.length === 0} title="Refresh summary" className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-40"><RefreshCw size={15} className={summarizing ? 'animate-spin text-blue-400' : 'text-gray-300'} /></button></div>
          <div className="p-4 border-b border-white/5 text-xs text-gray-400 flex items-center gap-2"><Captions size={14} className={isListening ? 'text-red-400' : 'text-gray-500'} />{isListening ? 'Listening and capturing your speech' : isSupported ? 'Start captions to create live notes' : 'Speech recognition is not supported in this browser'}</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
            {noteError && <p className="rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{noteError}</p>}
            {meetingSummary ? <><NoteSection title="Summary" items={[meetingSummary.summary]} /><NoteSection title="Key points" items={meetingSummary.keyPoints} /><NoteSection title="Decisions" items={meetingSummary.decisions} /><NoteSection title="Action items" items={meetingSummary.actionItems} /></> : <p className="text-gray-500">Your meeting summary will appear here after transcript is captured and processed.</p>}
            <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Live transcript</h3><div className="space-y-2">{transcripts.length ? transcripts.slice(-30).map((item) => <p key={item.id} className="rounded-lg bg-white/5 p-2.5 text-xs text-gray-300"><span className="font-semibold text-blue-300">{item.speaker}: </span>{item.text}</p>) : <p className="text-xs text-gray-500">No speech captured yet.</p>}</div></div>
          </div>
        </aside>}
      </main>

      {/* Bottom Toolbar */}
      <footer className="shrink-0 flex items-center justify-center gap-3 py-3 sm:py-4 bg-[#202124] border-t border-white/10">
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`p-4 rounded-2xl transition-all cursor-pointer ${
            micOn
              ? 'bg-[#3c4043] hover:bg-[#4a4f53] text-white'
              : 'bg-[#ea4335] hover:bg-[#f06256] text-white'
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
              ? 'bg-[#3c4043] hover:bg-[#4a4f53] text-white'
              : 'bg-[#ea4335] hover:bg-[#f06256] text-white'
          }`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={() => setNotesOpen((open) => !open)}
          className={`p-4 rounded-2xl transition-all cursor-pointer ${notesOpen ? 'bg-[#1a73e8] text-white' : 'bg-[#3c4043] hover:bg-[#4a4f53] text-white'}`}
          title={notesOpen ? 'Close meeting notes' : 'Open meeting notes'}
        >
          <NotebookPen size={20} />
        </button>

        <button onClick={toggleTranscription} disabled={!isSupported} className={`p-4 rounded-2xl transition-all cursor-pointer disabled:opacity-40 ${isListening ? 'bg-red-500 hover:bg-red-400' : 'bg-[#3c4043] hover:bg-[#4a4f53]'} text-white`} title={isListening ? 'Stop live captions' : 'Start live captions'}>
          <Captions size={20} />
        </button>

        {/* Leave Room */}
        <button
          onClick={leaveRoom}
          className="px-7 py-4 rounded-2xl bg-[#ea4335] hover:bg-[#f06256] text-white font-semibold transition-all cursor-pointer flex items-center gap-2"
          title="Leave meeting"
        >
          <PhoneOff size={18} />
          <span className="text-sm">Leave</span>
        </button>
      </footer>
    </div>
  );
}

function NoteSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3><ul className="space-y-2">{items.map((item, index) => <li key={`${title}-${index}`} className="rounded-lg bg-white/5 p-2.5 text-gray-200">{item}</li>)}</ul></section>;
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
    <div className="relative aspect-video max-h-full bg-[#202124] rounded-2xl overflow-hidden border border-white/10 shadow-xl group min-h-[180px]">
      <video ref={ref} className="w-full h-full object-contain" autoPlay playsInline />
      <div className="absolute bottom-3 left-3">
        <span className="bg-[#202124]/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-md">
          {id.startsWith('c_') ? `Guest ${id.slice(2, 6)}` : id}
        </span>
      </div>
    </div>
  );
}
