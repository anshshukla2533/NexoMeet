import React from 'react';

import { UserButton, SignOutButton } from '@clerk/nextjs';
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
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
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

      {/* User Profile Badge */}
<div className="flex items-center justify-between pt-4 border-t border-gray-800">
  <div className="flex items-center gap-3 truncate">
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-white tracking-wider shrink-0">
      N
    </div>
    <span className="font-medium truncate text-gray-200">Ansh</span>
  </div>

  {/* Explicit Visible Sign Out Action Button */}
  <SignOutButton>
    <button className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all font-medium cursor-pointer shrink-0">
      Sign Out
    </button>
  </SignOutButton>
</div>
   
    </aside>
  );
}