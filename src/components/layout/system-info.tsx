"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * @Security - System Integrity Banner
 * Refined for Dashboard view - Mixed case & smooth animation
 */
export function SystemIntegrityBanner() {
  const [m, setM] = useState("");

  useEffect(() => {
    // Encoded source: "Saat ini Anda menggunakan Mikbotam Next MOD v2.1.0 Rinjani Edition - Managed by Sanrian Surenggana."
    const _0xcr = [83, 97, 97, 116, 32, 105, 110, 105, 32, 65, 110, 100, 97, 32, 109, 101, 110, 103, 117, 110, 97, 107, 97, 110, 32, 77, 105, 107, 98, 111, 116, 97, 109, 32, 78, 101, 120, 116, 32, 77, 79, 68, 32, 118, 50, 46, 49, 46, 48, 32, 82, 105, 110, 106, 97, 110, 105, 32, 69, 100, 105, 116, 105, 111, 110, 32, 45, 32, 77, 97, 110, 97, 103, 101, 100, 32, 98, 121, 32, 83, 97, 110, 114, 105, 97, 110, 32, 83, 117, 114, 101, 110, 103, 116, 103, 97, 110, 97, 46];
    // Fixing the character array slightly if needed, but keeping the original decoded logic for consistency.
    // The previous array was correct for the Indonesian text.
    setM(String.fromCharCode(...[83, 97, 97, 116, 32, 105, 110, 105, 32, 65, 110, 100, 97, 32, 109, 101, 110, 103, 117, 110, 97, 107, 97, 110, 32, 77, 105, 107, 98, 111, 116, 97, 109, 32, 78, 101, 120, 116, 32, 77, 79, 68, 32, 118, 50, 46, 49, 46, 48, 32, 82, 105, 110, 106, 97, 110, 105, 32, 69, 100, 105, 116, 105, 111, 110, 32, 45, 32, 77, 97, 110, 97, 103, 101, 100, 32, 98, 121, 32, 83, 97, 110, 114, 105, 97, 110, 32, 83, 117, 114, 101, 110, 103, 103, 97, 110, 97, 46]));
  }, []);

  if (!m) return null;

  return (
    <div className="w-full bg-slate-900/5 border border-slate-200/60 rounded-xl py-2 px-4 overflow-hidden relative flex items-center group hover:bg-slate-900/10 transition-colors duration-500">
      <div className="flex items-center gap-2 px-2 border-r border-slate-200 mr-4 shrink-0 bg-transparent z-10">
        <ShieldCheck size={14} className="text-teal-600 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Status</span>
      </div>
      
      <div className="whitespace-nowrap flex animate-marquee-slow pointer-events-none">
        <span className="text-xs text-slate-600 font-medium tracking-tight px-4">
          {m} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {m} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {m}
        </span>
      </div>

      <style jsx>{`
        .animate-marquee-slow {
          animation: marquee 60s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
