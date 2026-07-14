import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';

type ScheduleItem = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  duration: number;
};

interface TakeawayTabProps {
  previousSchedules?: ScheduleItem[];
}

export default function TakeawayTab({ previousSchedules = [] }: TakeawayTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meeting Takeaways</h2>
        <p className="text-gray-400 mt-1">Access AI-generated bullet summaries and key task updates from your previous calls.</p>
      </div>
      
      {previousSchedules.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-700 p-10 text-center text-gray-400">
          No previous meetings found. Complete some meetings to see your takeaways here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {previousSchedules.map((item) => (
            <div key={item.id} className="bg-[#161925] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between h-44 group hover:border-gray-700 transition-all">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                  <Clock size={16} />
                  <span>{new Date(item.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-lg font-bold group-hover:text-[#1a73e8] transition-colors line-clamp-2">{item.title}</h4>
                {item.description ? <p className="text-sm text-gray-500 mt-2 line-clamp-1">{item.description}</p> : null}
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold text-[#1a73e8] w-fit">
                <span>Open Smart Summary</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}