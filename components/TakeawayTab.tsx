import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';

export default function TakeawayTab() {
  const summaries = [
    { id: 1, title: 'Project Sync & Architecture Redesign', time: 'Yesterday at 4:15 PM' },
    { id: 2, title: 'NexoMeet UI/UX Alignment Sprint', time: 'July 7, 2026 at 11:00 AM' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meeting Takeaways</h2>
        <p className="text-gray-400 mt-1">Access AI-generated bullet summaries and key task updates from your previous calls.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaries.map((item) => (
          <div key={item.id} className="bg-[#161925] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between h-44 group hover:border-gray-700 transition-all">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                <Clock size={16} />
                <span>{item.time}</span>
              </div>
              <h4 className="text-lg font-bold group-hover:text-[#1a73e8] transition-colors">{item.title}</h4>
            </div>
            <button className="flex items-center gap-2 text-sm font-semibold text-[#1a73e8] w-fit">
              <span>Open Smart Summary</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}