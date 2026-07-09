import React from 'react';
import { Home as HomeIcon, Calendar, History, FileText, User, Layout } from 'lucide-react';

type TabType = 'home' | 'upcoming' | 'previous' | 'takeaway' | 'room';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

export default function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'previous', label: 'Previous', icon: History },
    { id: 'takeaway', label: 'Takeaway', icon: FileText },
    { id: 'room', label: 'Personal Room', icon: User },
  ] as const;

  return (
    <aside className="w-64 bg-[#161925] p-6 flex flex-col justify-between border-r border-gray-800 shrink-0 h-screen sticky top-0">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-[#22c55e] p-2 rounded-xl text-white">
            <Layout size={20} />
          </div>
          <span className="text-xl font-bold tracking-wide">NexoMeet</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive ? 'bg-[#1a73e8] text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Badge */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-semibold shrink-0">
          A
        </div>
        <span className="font-medium truncate">Ansh</span>
      </div>
    </aside>
  );
}