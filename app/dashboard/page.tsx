"use client";
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Sidebar from '../../components/Sidebar';
import HomeTab from '../../components/HomeTab';
import TakeawayTab from '../../components/TakeawayTab';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, ExternalLink, RotateCcw } from 'lucide-react';

type TabType = 'home' | 'upcoming' | 'previous' | 'takeaway' | 'room';

type ScheduleItem = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  duration: number;
};

type RoomItem = {
  id: string;
  slug: string;
  hostId: string;
  isActive: boolean;
  createdAt: string;
  endedAt: string | null;
  _count: { logs: number };
};

export default function DashboardPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinSlug, setJoinSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 30,
  });

  const now = useMemo(() => new Date(), [currentTab, schedules]);
  const upcomingSchedules = useMemo(
    () => schedules.filter((s) => new Date(s.startTime) >= now).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [now, schedules]
  );
  const previousSchedules = useMemo(
    () => schedules.filter((s) => new Date(s.startTime) < now).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [now, schedules]
  );
  const previousRooms = useMemo(
    () => rooms.filter((r) => !r.isActive).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rooms]
  );
  const activeRooms = useMemo(
    () => rooms.filter((r) => r.isActive),
    [rooms]
  );
  const nextMeeting = upcomingSchedules[0];

  // Personal room slug is unique per user
  const personalRoomSlug = userId ? `personal-${userId.slice(0, 12)}` : 'personal-room';

  // Clock
  useEffect(() => {
    const updateDateTime = () => {
      const current = new Date();
      setTime(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDate(current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Data fetching
  useEffect(() => {
    fetchSchedules();
    fetchRooms();
  }, []);

  // Auto-clear success message
  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule');
      if (!res.ok) throw new Error('Unable to load schedules');
      const data = (await res.json()) as ScheduleItem[];
      setSchedules(data);
    } catch (error) {
      console.error('schedule-fetch-error', error);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/room');
      if (!res.ok) throw new Error('Unable to load rooms');
      const data = (await res.json()) as RoomItem[];
      setRooms(data);
    } catch (error) {
      console.error('room-fetch-error', error);
    }
  }, []);

  async function handleCreateMeeting() {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/room', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Unable to create room');
      }
      const { slug } = await res.json();
      router.push(`/workspace/${slug}`);
    } catch (error) {
      console.error('create-room-error', error);
      setErrorMessage('Unable to start a new meeting right now.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenJoin() {
    setJoinOpen(true);
    setErrorMessage('');
  }

  function handleOpenSchedule() {
    setScheduleOpen(true);
    setErrorMessage('');
  }

  function handleViewTakeaways() {
    setCurrentTab('takeaway');
  }

  async function handleJoinSubmit() {
    const slug = joinSlug.trim();
    if (!slug) {
      setErrorMessage('Please enter a meeting slug to join.');
      return;
    }
    setJoinOpen(false);
    setErrorMessage('');
    router.push(`/workspace/${slug}`);
  }

  async function handleScheduleSubmit() {
    if (!scheduleForm.title || !scheduleForm.startTime || !scheduleForm.duration) {
      setErrorMessage('Please complete all schedule fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scheduleForm.title,
          description: scheduleForm.description,
          startTime: scheduleForm.startTime,
          duration: scheduleForm.duration,
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Unable to schedule meeting');
      }

      await fetchSchedules();
      setScheduleOpen(false);
      setScheduleForm({ title: '', description: '', startTime: '', duration: 30 });
      setSuccessMessage('Meeting scheduled successfully!');
    } catch (error) {
      console.error('schedule-submit-error', error);
      setErrorMessage('Unable to create the schedule.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinScheduledMeeting() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/room', { method: 'POST' });
      if (!res.ok) throw new Error('Unable to create room');
      const { slug } = await res.json();
      router.push(`/workspace/${slug}`);
    } catch (error) {
      console.error('join-scheduled-error', error);
      setErrorMessage('Unable to start meeting. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function formatDuration(createdAt: string, endedAt: string | null): string {
    if (!endedAt) return 'Unknown';
    const diff = new Date(endedAt).getTime() - new Date(createdAt).getTime();
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return 'Less than a minute';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
  }

  return (
    <div className="flex min-h-screen bg-[#0f111a] text-white font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Success Toast */}
        {successMessage && (
          <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-200 flex items-center gap-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Error Toast */}
        {errorMessage && !joinOpen && !scheduleOpen && (
          <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {currentTab === 'home' && (
          <HomeTab
            time={time}
            date={date}
            nextMeetingTime={nextMeeting ? new Date(nextMeeting.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : undefined}
            onNewMeeting={handleCreateMeeting}
            onJoinMeeting={handleOpenJoin}
            onScheduleMeeting={handleOpenSchedule}
            onViewTakeaways={handleViewTakeaways}
          />
        )}

        {currentTab === 'takeaway' && <TakeawayTab previousSchedules={previousSchedules} />}

        {/* ── UPCOMING TAB ── */}
        {currentTab === 'upcoming' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Upcoming Meetings</h2>
                <p className="text-gray-400 mt-1">All scheduled meetings in your planner.</p>
              </div>
              <button
                onClick={handleOpenSchedule}
                disabled={isLoading}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Schedule New Meeting
              </button>
            </div>

            <div className="grid gap-4">
              {upcomingSchedules.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-700 p-10 text-center text-gray-400">
                  No upcoming meetings yet. Schedule one to get started.
                </div>
              ) : (
                upcomingSchedules.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-[#111827] border border-gray-800 p-6 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-gray-400 text-sm flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(item.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <h3 className="text-2xl font-semibold mt-1">{item.title}</h3>
                      </div>
                      <div className="rounded-2xl bg-blue-600/10 border border-blue-500/20 px-4 py-2 text-sm text-blue-300 font-medium">
                        {new Date(item.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                    {item.description ? <p className="mt-3 text-gray-400">{item.description}</p> : null}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Clock size={13} />
                        Duration: {item.duration} minutes
                      </div>
                      <button
                        onClick={handleJoinScheduledMeeting}
                        disabled={isLoading}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        Start Meeting
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ── PREVIOUS TAB ── */}
        {currentTab === 'previous' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Previous Meetings</h2>
                <p className="text-gray-400 mt-1">Your completed video sessions and past schedules.</p>
              </div>
              <button
                onClick={() => { fetchRooms(); fetchSchedules(); }}
                className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition cursor-pointer flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Refresh
              </button>
            </div>

            {/* Active Rooms */}
            {activeRooms.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Rooms
                </h3>
                <div className="grid gap-4">
                  {activeRooms.map((room) => (
                    <div key={room.id} className="rounded-3xl bg-[#111827] border border-emerald-500/20 p-6 shadow-lg shadow-black/20">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">
                            {new Date(room.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <h3 className="text-xl font-semibold mt-1 font-mono">{room.slug}</h3>
                        </div>
                        <span className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 font-medium">
                          Active
                        </span>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => router.push(`/workspace/${room.slug}`)}
                          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition cursor-pointer flex items-center gap-2"
                        >
                          <ExternalLink size={14} />
                          Rejoin Room
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ended Rooms */}
            {previousRooms.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-3">Completed Rooms</h3>
                <div className="grid gap-4">
                  {previousRooms.map((room) => (
                    <div key={room.id} className="rounded-3xl bg-[#111827] border border-gray-800 p-6 shadow-lg shadow-black/20">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">
                            {new Date(room.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <h3 className="text-xl font-semibold mt-1 font-mono">{room.slug}</h3>
                        </div>
                        <span className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
                          Ended
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          Duration: {formatDuration(room.createdAt, room.endedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Scheduled Meetings */}
            {previousSchedules.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-3">Past Scheduled Meetings</h3>
                <div className="grid gap-4">
                  {previousSchedules.map((item) => (
                    <div key={item.id} className="rounded-3xl bg-[#111827] border border-gray-800 p-6 shadow-lg shadow-black/20">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">
                            {new Date(item.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <h3 className="text-2xl font-semibold">{item.title}</h3>
                        </div>
                        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-slate-300">
                          Completed
                        </div>
                      </div>
                      {item.description ? <p className="mt-3 text-gray-400">{item.description}</p> : null}
                      <div className="mt-4 text-sm text-gray-500 flex items-center gap-1.5">
                        <Clock size={13} />
                        Duration: {item.duration} minutes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {previousRooms.length === 0 && previousSchedules.length === 0 && activeRooms.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-700 p-10 text-center text-gray-400">
                No previous meetings yet. Your completed sessions will appear here.
              </div>
            )}
          </section>
        )}

        {/* ── PERSONAL ROOM TAB ── */}
        {currentTab === 'room' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold">Personal Room</h2>
              <p className="text-gray-400 mt-1">Use your personal room link for quick catch-ups and guest access.</p>
            </div>

            <div className="rounded-3xl bg-[#111827] border border-gray-800 p-6 shadow-lg shadow-black/20 space-y-4">
              <p className="text-gray-300">Your personal room slug is:</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="rounded-2xl bg-slate-950 px-4 py-3 font-mono font-semibold text-white border border-gray-700">{personalRoomSlug}</div>
                <button
                  onClick={() => router.push(`/workspace/${personalRoomSlug}`)}
                  disabled={isLoading}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  Open Personal Room
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-[#111827] border border-gray-800 p-6 shadow-lg shadow-black/20">
              <h3 className="text-xl font-semibold">Join by invitation slug</h3>
              <p className="text-gray-400 mt-1">Paste a meeting slug to join an existing room instantly.</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  value={joinSlug}
                  onChange={(event) => setJoinSlug(event.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinSubmit(); }}
                  placeholder="Enter room slug (e.g. meet-a1b2c3d4)"
                  className="w-full rounded-2xl border border-gray-700 bg-slate-950 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleJoinSubmit}
                  className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-500 transition cursor-pointer shrink-0"
                >
                  Join Room
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── MODALS ── */}
        {(joinOpen || scheduleOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-[#0f111a] border border-gray-800 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{joinOpen ? 'Join a Meeting' : 'Schedule a Meeting'}</h2>
                  <p className="text-gray-400 mt-1">{joinOpen ? 'Enter the meeting slug to join the room.' : 'Create a meeting in your schedule and invite others.'}</p>
                </div>
                <button
                  onClick={() => { setJoinOpen(false); setScheduleOpen(false); setErrorMessage(''); }}
                  className="rounded-full border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>

              {joinOpen ? (
                <div className="mt-6 space-y-4">
                  <label className="block text-sm font-medium text-gray-300">Meeting Slug</label>
                  <input
                    value={joinSlug}
                    onChange={(event) => setJoinSlug(event.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleJoinSubmit(); }}
                    placeholder="e.g. meet-a1b2c3d4"
                    className="w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleJoinSubmit}
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-500 transition cursor-pointer"
                    >
                      Join Meeting
                    </button>
                    <button
                      onClick={() => setJoinOpen(false)}
                      className="rounded-2xl border border-gray-700 px-5 py-3 text-gray-300 hover:bg-white/5 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Meeting Title</label>
                    <input
                      value={scheduleForm.title}
                      onChange={(event) => setScheduleForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Weekly sync"
                      className="w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                    <textarea
                      value={scheduleForm.description}
                      onChange={(event) => setScheduleForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="Meeting agenda, guests, and notes"
                      rows={3}
                      className="w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.startTime}
                        onChange={(event) => setScheduleForm((prev) => ({ ...prev, startTime: event.target.value }))}
                        className="w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Duration</label>
                      <select
                        value={scheduleForm.duration}
                        onChange={(event) => setScheduleForm((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                        className="w-full rounded-2xl border border-gray-700 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                      >
                        {[15, 30, 45, 60, 90].map((minutes) => (
                          <option key={minutes} value={minutes}>{minutes} minutes</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleScheduleSubmit}
                        disabled={isLoading}
                        className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoading ? 'Saving...' : 'Save Schedule'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage ? <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">{errorMessage}</div> : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
