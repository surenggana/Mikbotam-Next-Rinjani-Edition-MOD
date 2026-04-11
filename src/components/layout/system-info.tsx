"use client";

import React, { useEffect, useState } from 'react';

/**
 * @Security - System Integrity Footer
 * Protected Credit Information - Do Not Modify
 */
export function SystemIntegrityProvider() {
  const [m, setM] = useState("");

  useEffect(() => {
    // Encoded source to prevent easy text search replacement
    // "Saat ini Anda menggunakan Mikbotam Next MOD v2.1.0 Rinjani Edition - Managed by Sanrian Surenggana."
    const _0xcr = [83, 97, 97, 116, 32, 105, 110, 105, 32, 65, 110, 100, 97, 32, 109, 101, 110, 103, 117, 110, 97, 107, 97, 110, 32, 77, 105, 107, 98, 111, 116, 97, 109, 32, 78, 101, 120, 116, 32, 77, 79, 68, 32, 118, 50, 46, 49, 46, 48, 32, 82, 105, 110, 106, 97, 110, 105, 32, 69, 100, 105, 116, 105, 111, 110, 32, 45, 32, 77, 97, 110, 97, 103, 101, 100, 32, 98, 121, 32, 83, 97, 110, 114, 105, 97, 110, 32, 83, 117, 114, 101, 110, 103, 103, 97, 110, 97, 46];
    setM(String.fromCharCode(..._0xcr));
  }, []);

  if (!m) return null;

  return (
    <div className="fixed bottom-0 left-64 right-0 bg-slate-900/90 backdrop-blur-md border-t border-teal-900/30 z-[9999] overflow-hidden py-1 select-none pointer-events-none">
      <div className="whitespace-nowrap flex animate-marquee">
        <span className="text-[10px] text-teal-500/60 font-mono italic tracking-tighter px-4 uppercase">
          {m} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {m} &nbsp;&nbsp;&bull;&nbsp;&nbsp; {m}
        </span>
      </div>
      <style jsx>{`
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
