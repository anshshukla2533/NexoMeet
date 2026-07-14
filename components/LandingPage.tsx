"use client";

import React from "react";
import {
  Play,
  ArrowRight,
  Zap,
  Terminal,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF5F5] text-zinc-900 font-sans overflow-x-hidden selection:bg-[#4E46E5]/10 relative flex items-center justify-center p-4 sm:p-8">

     

      
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#FFE885] rounded-full -translate-x-12 -translate-y-12 mix-blend-multiply opacity-80 pointer-events-none" />

      <div className="absolute top-0 left-0 w-56 h-56 bg-[#FFAEBC] rounded-full -translate-x-20 -translate-y-6 mix-blend-multiply opacity-70 pointer-events-none" />

      
      <div className="absolute top-1/4 left-[38%] w-4 h-4 bg-[#FFAEBC] rounded-full pointer-events-none" />

      <div className="absolute top-1/3 left-[45%] w-16 h-16 bg-[#FFE885] rounded-full pointer-events-none opacity-90" />

      <div className="absolute left-[10%] top-1/2 w-5 h-5 bg-[#FFAEBC] rounded-full pointer-events-none" />

      <div className="absolute bottom-[15%] left-[46%] w-6 h-6 bg-[#4E46E5] rounded-full pointer-events-none opacity-80" />

      <div className="absolute bottom-0 left-[50%] w-32 h-32 bg-[#FFAEBC] rounded-full translate-y-12 pointer-events-none opacity-90" />

      {/* MAIN WHITE CANVAS CONTAINER */}
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-[0_32px_120px_rgba(0,0,0,0.06)] border border-white/60 relative overflow-hidden min-h-[640px] flex flex-col justify-between">

      
        <div className="absolute right-0 top-0 bottom-0 w-[42%] bg-[#4E46E5] rounded-l-[180px] hidden lg:block pointer-events-none" />

       
        <nav className="w-full pl-12 pr-6 pt-8 flex items-center justify-between relative z-20">


          <div className="flex items-center gap-10">

        
            <div className="flex items-center gap-2.5 cursor-pointer">

              <div className="flex gap-1 bg-[#4E46E5] p-2 rounded-xl text-white shadow-xs">
                <div className="w-2 h-2 bg-white rounded-full" />

                <div className="w-2 h-2 bg-[#FFE885] rounded-full" />
              </div>

              <span className="text-xl font-bold tracking-tight text-zinc-900">
                NexoMeet.
              </span>

            </div>
          </div>

      
          <div className="flex items-center ml-auto lg:pr-8">

            <SignInButton mode="modal" forceRedirectUrl="/dashboard">

              <button
                className="
                  min-w-[180px]
                  px-10
                  py-3
                  rounded-full

                  text-sm
                  font-bold

                  bg-white
                  text-[#4E46E5]

                  border
                  border-white/80

                  hover:bg-[#FFF5F5]
                  hover:-translate-y-0.5

                  active:scale-[0.98]

                  transition-all
                  duration-300

                  cursor-pointer

                  shadow-[0_10px_30px_rgba(0,0,0,0.15)]
                "
              >
                Get Started
              </button>

            </SignInButton>

          </div>
        </nav>

    
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-12 py-10 items-center relative z-10 flex-1">

        
          <div className="lg:col-span-6 flex flex-col items-start text-left max-w-lg">

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
              Meet Like
              <span className="text-[#4E46E5]">—</span>
              <br />

              Never
              <br />

              Before.
            </h1>

            <p className="mt-6 text-sm text-zinc-400 leading-relaxed font-medium">
              Host crystal-clear video streams, collaborate in real time, and
              map instant automated action logs from your conversations
              natively.
            </p>

           
            <div className="mt-8 flex flex-wrap items-center gap-6">

              <SignInButton mode="modal" forceRedirectUrl="/dashboard">

                <button className="px-7 py-3.5 bg-[#4E46E5] hover:bg-[#433bc9] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer">

                  <span>Start Hosting</span>

                  <ArrowRight size={14} />

                </button>

              </SignInButton>

              <button className="flex items-center gap-2.5 text-xs font-bold text-[#4E46E5] hover:text-[#3d36b8] transition-colors cursor-pointer">

                <div className="w-7 h-7 bg-[#4E46E5]/10 rounded-full flex items-center justify-center">

                  <Play
                    size={10}
                    className="fill-[#4E46E5] text-[#4E46E5] translate-x-0.5"
                  />

                </div>

                <span>See it in action!</span>

              </button>

            </div>
          </div>

        
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end items-center h-full w-full min-h-[380px]">

            <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-2xl w-full max-w-[420px] relative z-10">

              <div className="bg-[#fcfdfe] rounded-xl border border-zinc-100 flex flex-col h-[260px] overflow-hidden text-[10px]">

             
                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-3 py-2">

                  <div className="flex items-center gap-1">

                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />

                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />

                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />

                  </div>

                  <div className="px-2 py-0.5 bg-white border border-zinc-200/60 rounded text-[8px] text-zinc-400 font-mono w-40 text-center">
                    nexomeet.app/workspace/call_delta
                  </div>

                  <div className="w-4" />

                </div>

                {/* DASHBOARD FLEX LAYOUT */}
                <div className="flex flex-1 overflow-hidden">

                  {/* MICRO STREAM GRID */}
                  <div className="flex-1 p-3 flex flex-col gap-2">

                    <div className="grid grid-cols-2 gap-2 flex-1">

                      <div className="bg-zinc-900 rounded-lg relative overflow-hidden shadow-xs border border-zinc-800">

                        <div className="absolute bottom-1.5 left-2 text-white font-medium text-[8px] tracking-wide flex items-center gap-1">

                          <span className="w-1 h-1 bg-[#4E46E5] rounded-full" />

                          LEAD_DEV

                        </div>

                      </div>

                      <div className="bg-zinc-100 rounded-lg border border-zinc-200/60 flex items-center justify-center text-zinc-400 font-medium font-mono text-[8px]">
                        REMOTE_PEER
                      </div>

                    </div>

                    {/* TOOLBAR */}
                    <div className="h-8 bg-white border border-zinc-200/80 rounded-lg shadow-2xs px-2 flex items-center justify-between">

                      <span className="text-zinc-400 font-mono text-[8px]">
                        00:14:02
                      </span>

                      <div className="px-2 py-1 bg-red-500 text-white rounded font-medium text-[8px]">
                        End
                      </div>

                    </div>

                  </div>

                  {/* RIGHT LIVE SUMMARY DRAWER */}
                  <div className="w-32 border-l border-zinc-100 bg-white p-2 flex flex-col gap-2">

                    <div className="flex items-center gap-1 pb-1 border-b border-zinc-100 font-bold text-zinc-800 text-[8px]">

                      <Terminal size={9} className="text-[#4E46E5]" />

                      <span>LIVE_LOG</span>

                    </div>

                    <div className="bg-zinc-50 p-1.5 rounded border border-zinc-100">

                      <div className="text-[7px] font-bold text-emerald-600 flex items-center gap-0.5 mb-0.5">

                        <Zap size={7} className="fill-emerald-500" />

                        ACTION

                      </div>

                      <p className="text-zinc-500 leading-tight text-[8px]">
                        Deploy custom hooks router setup.
                      </p>

                    </div>

                  </div>

                </div>
              </div>
            </div>

            {/* FLOATING VIDEO THUMBNAIL */}
            <div className="absolute -top-6 right-6 bg-white border border-zinc-200 p-2 rounded-xl shadow-xl z-20 flex flex-col gap-1 w-24 transform rotate-6 pointer-events-none hidden sm:flex">

              <div className="h-14 bg-[#4E46E5] rounded-lg flex items-center justify-center text-white">

                <Play size={14} className="fill-white" />

              </div>

              <span className="text-[8px] font-bold text-zinc-400 text-center">
                Sync_File.mp4
              </span>

            </div>

            {/* FLOATING MESSAGE */}
            <div className="absolute -bottom-4 left-6 bg-white border border-zinc-200 px-3 py-2 rounded-xl shadow-lg z-20 flex items-center gap-2 max-w-[140px] transform -rotate-3 pointer-events-none hidden sm:flex">

              <div className="w-4 h-4 rounded-full bg-emerald-400 flex-shrink-0" />

              <div className="flex flex-col">

                <span className="text-[8px] font-bold text-zinc-800">
                  Pipeline Ready
                </span>

                <span className="text-[6px] text-zinc-400 leading-none">
                  AI automated logs active
                </span>

              </div>

            </div>

          </div>
        </div>

        {/* FOOTER */}
        <footer className="w-full border-t border-zinc-100 px-12 py-5 flex items-center justify-between text-[10px] font-mono text-zinc-400 relative z-20 bg-zinc-50/50 rounded-b-[40px]">

          <div className="flex items-center gap-6">

            <span className="flex items-center gap-1.5">
              <Globe size={11} />
              SERVERLESS_EDGE_DISTRIBUTION: TRUE
            </span>

            <span className="hidden md:inline">|</span>

            <span className="hidden md:flex items-center gap-1.5">
              <ShieldCheck size={11} />
              ZERO_TRUST_AUTH_LAYER
            </span>

          </div>

          <span>© NEXOMEET CORE SYSTEMS</span>

        </footer>

      </div>
    </div>
  );
}