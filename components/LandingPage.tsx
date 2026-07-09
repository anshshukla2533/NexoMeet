"use client";
import React from 'react';
import { Layout, ArrowRight, Video, FileText, Sparkles, Shield, Zap } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="border-b border-gray-800/60 bg-[#0f111a]/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#22c55e] p-2 rounded-xl text-white shadow-lg shadow-green-500/20">
              <Layout size={20} />
            </div>
            <span className="text-xl font-bold tracking-wide">NexoMeet</span>
          </div>
          
          <button 
            onClick={onSignIn}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-gray-200 active:scale-95 transition-all shadow-md"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles size={14} />
          <span>Next-Gen Video Platform</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.15] bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500">
          Meetings Redefined.<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Takeaways Automated.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl font-normal leading-relaxed">
          Host crystal-clear video calls and walk away with production-ready AI summaries, action milestones, and complete bullet transcripts instantly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
          <button 
            onClick={onSignIn}
            className="w-full sm:w-auto px-8 py-4 bg-[#1a73e8] hover:bg-blue-600 font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all group"
          >
            <span>Get Started For Free</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 3. APP PREVIEW MOCKUP */}
      <section className="px-6 max-w-5xl mx-auto pb-24">
        <div className="relative rounded-2xl border border-gray-800 bg-[#161925]/40 p-2 shadow-2xl backdrop-blur-sm group hover:border-gray-700/80 transition-all">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
          <div className="bg-[#0f111a] rounded-xl border border-gray-800/80 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              <div className="text-xs text-gray-500 font-mono tracking-wider">NEXOMEET_DASHBOARD.EXE</div>
              <div className="w-14" />
            </div>
            {/* Fake layout representation for visual depth */}
            <div className="grid grid-cols-3 gap-4 h-48 animate-pulse">
              <div className="col-span-1 bg-gray-900/50 rounded-xl border border-gray-800/50" />
              <div className="col-span-2 bg-gradient-to-br from-gray-900/80 to-slate-900/40 rounded-xl border border-gray-800/50" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION FEATURES */}
      <section className="bg-[#131622]/40 border-t border-gray-800/60 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Built for rapid-execution teams</h2>
            <p className="text-gray-400 mt-2">Stop digging through hours of session footage. Get the straight facts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#161925] border border-gray-800 p-8 rounded-2xl flex flex-col gap-4 hover:border-blue-500/30 transition-all group">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 w-fit group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Video size={24} />
              </div>
              <h3 className="text-xl font-bold">HD Video Conferences</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Flawless real-time audio and high-definition video feeds with adaptive bitrate streaming mechanics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#161925] border border-gray-800 p-8 rounded-2xl flex flex-col gap-4 hover:border-emerald-500/30 transition-all group">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold">Instant Smart Takeaways</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Advanced AI parsing engine automatically converts meeting speech paths into structured summaries right away.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#161925] border border-gray-800 p-8 rounded-2xl flex flex-col gap-4 hover:border-purple-500/30 transition-all group">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 w-fit group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold">Action-Item Triggers</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Isolates explicit deadlines, user tasks, and context shifts dynamically as the conversation unfolds.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}