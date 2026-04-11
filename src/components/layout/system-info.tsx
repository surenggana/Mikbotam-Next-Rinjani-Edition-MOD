"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * @Security - System Integrity Banner
 * Refined for Dashboard view - Mixed case & smooth animation
 * Fixed: Added masks to prevent text collision with icons
 */
export function SystemIntegrityBanner() {
  const [m, setM] = useState("");

  useEffect(() => {
    // Indonesian mixed-case message
    const msg = "Saat ini Anda menggunakan Mikbotam Next MOD v2.1.0 Rinjani Edition - Managed by Sanrian Surenggana.";
    setM(msg);
  }, []);

  if (!m) return null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl h-11 overflow-hidden relative flex items-center shadow-sm group hover:border-teal-500/30 transition-all duration-500">
      {/* Fixed Label with solid background and shadow to hide text passing under */}
      <div className="flex items-center gap-2 px-4 h-full border-r border-slate-100 bg-white z-20 shadow-[4px_0_10px_rgba(255,255,255,0.9)] shrink-0">
        <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600 group-hover:scale-110 transition-transform duration-500">
          <ShieldCheck size={14} className="animate-pulse" />
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">System Status</span>
      </div>
      
      {/* Marquee Container with fade effects at both ends */}
      <div className="flex-1 relative h-full overflow-hidden flex items-center">
        {/* Left Fade Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
        
        <div className="whitespace-nowrap flex animate-marquee-slow pointer-events-none">
          <span className="text-[13px] text-slate-600 font-medium tracking-tight px-8">
            {m} &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp; {m} &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp; {m}
          </span>
        </div>

        {/* Right Fade Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />
      </div>

      <style jsx>{`
        .animate-marquee-slow {
          animation: marquee 80s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
