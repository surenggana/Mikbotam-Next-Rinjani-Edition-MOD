import React from "react";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-8">
        {/* Container Utama Logo */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 100 100" className="relative z-10">
            <defs>
              {/* Bentuk Perisai Mikbotam sebagai ClipPath */}
              <clipPath id="shieldClip">
                <path d="M50 10L80 22.5V47.5C80 62.5 67.5 77.5 50 85C32.5 77.5 20 62.5 20 47.5V22.5L50 10Z" />
              </clipPath>
            </defs>

            {/* Latar Belakang Logo (Wadah Kosong) */}
            <path 
              d="M50 10L80 22.5V47.5C80 62.5 67.5 77.5 50 85C32.5 77.5 20 62.5 20 47.5V22.5L50 10Z" 
              fill="#f1f5f9" 
              stroke="#e2e8f0" 
              strokeWidth="2"
            />

            {/* Animasi Cairan di dalam ClipPath */}
            <g clipPath="url(#shieldClip)">
              <rect width="100" height="100" fill="#f1f5f9" />
              
              {/* Gelombang Air */}
              <path className="liquid-wave" d="M-100 50 Q-75 40 -50 50 T0 50 T50 50 T100 50 T150 50 V100 H-100 Z" fill="url(#liquidGradient)">
                <animateTransform 
                  attributeName="transform" 
                  type="translate" 
                  from="0 0" 
                  to="100 0" 
                  dur="2s" 
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="d" 
                  values="M-100 50 Q-75 40 -50 50 T0 50 T50 50 T100 50 T150 50 V100 H-100 Z;
                          M-100 50 Q-75 60 -50 50 T0 50 T50 50 T100 50 T150 50 V100 H-100 Z;
                          M-100 50 Q-75 40 -50 50 T0 50 T50 50 T100 50 T150 50 V100 H-100 Z"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Efek air naik perlahan */}
              <rect width="100" height="100" fill="url(#liquidGradient)" className="liquid-rise" />
            </g>

            {/* Detail Router di tengah (Tetap terlihat) */}
            <g opacity="0.8">
              <rect x="35" y="42.5" width="30" height="15" rx="2" stroke="#64748b" strokeWidth="2"/>
              <path d="M40 42.5V32.5M50 42.5V27.5M60 42.5V32.5" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="50" cy="52.5" r="3" fill="#64748b"/>
            </g>

            <linearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </svg>

          {/* Glow Effect */}
          <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full animate-pulse"></div>
        </div>

        {/* Teks MIKBOTAM */}
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black tracking-[0.3em] text-slate-800 ml-[0.3em]">MIKBOTAM</h2>
          <div className="flex items-center gap-3 mt-4">
            <span className="h-[1px] w-8 bg-slate-200"></span>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] animate-pulse">
              Syncing Router...
            </p>
            <span className="h-[1px] w-8 bg-slate-200"></span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes liquid-rise-anim {
          0% { transform: translateY(80px); }
          50% { transform: translateY(20px); }
          100% { transform: translateY(80px); }
        }
        .liquid-rise {
          animation: liquid-rise-anim 8s ease-in-out infinite;
        }
        .liquid-wave {
          animation: liquid-rise-anim 8s ease-in-out infinite;
        }
      `}} />

      <div className="absolute bottom-10 flex flex-col items-center gap-1 opacity-40">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Rinjani Platform</span>
        <div className="h-0.5 w-4 bg-emerald-500 rounded-full"></div>
      </div>
    </div>
  );
}
