import React from 'react';
import { Plus, UserPlus, Calendar, Video } from 'lucide-react';

interface HomeTabProps {
  time: string;
  date: string;
  nextMeetingTime?: string;
  onNewMeeting: () => void;
  onJoinMeeting: () => void;
  onScheduleMeeting: () => void;
  onViewTakeaways: () => void;
}

export default function HomeTab({
  time,
  date,
  nextMeetingTime,
  onNewMeeting,
  onJoinMeeting,
  onScheduleMeeting,
  onViewTakeaways,
}: HomeTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Clock Banner */}
      <div className="relative w-full h-72 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-gray-800">
        <div className="z-10 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-lg text-sm font-medium w-fit border border-white/10">
          Upcoming Meeting at: {nextMeetingTime ?? '12:30 PM'}
        </div>
        
        <div className="z-10 flex flex-col gap-1">
          <h1 className="text-6xl font-black tracking-tight">{time || "05:17 PM"}</h1>
          <p className="text-xl text-gray-400 font-medium">{date || "Thursday, July 9, 2026"}</p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600')` }}></div>
      </div>

      {/* Grid Interface */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
        <button
          onClick={onNewMeeting}
          className="bg-[#ff7a45] p-6 rounded-2xl flex flex-col justify-between h-48 transition-all shadow-lg shadow-orange-900/20 hover:scale-[1.02]"
        >
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white">
            <Plus size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">New Meeting</h3>
            <p className="text-white/80 text-sm mt-1">Start an instant meeting</p>
          </div>
        </button>

        <button
          onClick={onJoinMeeting}
          className="bg-[#1a73e8] p-6 rounded-2xl flex flex-col justify-between h-48 transition-all shadow-lg shadow-blue-900/20 hover:scale-[1.02]"
        >
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Join Meeting</h3>
            <p className="text-white/80 text-sm mt-1">via invitation link</p>
          </div>
        </button>

        <button
          onClick={onScheduleMeeting}
          className="bg-[#722ed1] p-6 rounded-2xl flex flex-col justify-between h-48 transition-all shadow-lg shadow-purple-900/20 hover:scale-[1.02]"
        >
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Schedule Meeting</h3>
            <p className="text-white/80 text-sm mt-1">Plan your meeting</p>
          </div>
        </button>

        <button
          onClick={onViewTakeaways}
          className="bg-[#ffc107] p-6 rounded-2xl flex flex-col justify-between h-48 text-slate-950 transition-all shadow-lg shadow-yellow-900/20 hover:scale-[1.02]"
        >
          <div className="bg-black/10 w-12 h-12 rounded-xl flex items-center justify-center">
            <Video size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">View Takeaways</h3>
            <p className="text-slate-900/80 text-sm mt-1">Meeting Takeaways</p>
          </div>
        </button>
      </div>
    </div>
  );
}