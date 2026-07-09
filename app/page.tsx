"use client";
import React, { useState, useEffect } from 'react';
import { Layout } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import HomeTab from '../components/HomeTab';
import TakeawayTab from '../components/TakeawayTab';
import LandingPage from '../components/LandingPage';// Import the new layout

type TabType = 'home' | 'upcoming' | 'previous' | 'takeaway' | 'room';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Starts unauthenticated
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // If the user hasn't signed in, render the clean UI/UX landing view
  if (!isAuthenticated) {
    return <LandingPage onSignIn={() => setIsAuthenticated(true)} />;
  }

  // Otherwise, load up the modular workspace application dashboard
  return (
    <div className="flex min-h-screen bg-[#0f111a] text-white font-sans">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {currentTab === 'home' && (
          <HomeTab time={time} date={date} onNavigate={setCurrentTab} />
        )}

        {currentTab === 'takeaway' && (
          <TakeawayTab />
        )}

        {['upcoming', 'previous', 'room'].includes(currentTab) && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-gray-800/30 p-4 rounded-full text-gray-500 mb-4">
              <Layout size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-300 capitalize">{currentTab} Section</h3>
            <p className="text-gray-500 max-w-xs mt-1">This panel view is ready for data integration.</p>
          </div>
        )}
      </main>
    </div>
  );
}