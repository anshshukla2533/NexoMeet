import React from 'react';
import { Clock, FileText } from 'lucide-react';

type Takeaway = {
  id: string;
  content: string;
  createdAt: string;
  room: { slug: string; createdAt: string; endedAt: string | null };
};

export default function TakeawayTab({ takeaways = [] }: { takeaways?: Takeaway[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meeting Takeaways</h2>
        <p className="text-gray-400 mt-1">Notes saved during your meetings, newest first.</p>
      </div>
      {takeaways.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-700 p-10 text-center text-gray-400">
          No takeaways yet. Use the Notes panel in a meeting to save decisions and action items here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {takeaways.map((item) => (
            <article key={item.id} className="bg-[#161925] p-6 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3"><Clock size={15} />
                {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">{item.content}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 font-mono"><FileText size={13} />{item.room.slug}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
