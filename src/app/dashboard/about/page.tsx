import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ExternalLink, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <Card className="md:w-1/3 bg-slate-950 text-white overflow-hidden border-none shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent opacity-50" />
          <div className="p-8 flex flex-col items-center text-center relative z-10">
            <div className="w-32 h-32 rounded-3xl bg-teal-500/10 p-3 mb-6 border border-teal-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M4 18V6L12 14L20 6V18" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-teal-400"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">MIKBOTAM</h3>
            <p className="text-teal-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Rinjani Edition</p>
            
            <div className="mt-8 pt-8 border-t border-slate-800 w-full">
              <p className="text-xs text-slate-500 font-medium">© 2026 Mikbotam Next</p>
              <p className="text-[10px] text-slate-600 font-mono mt-1 uppercase">Build v2.1.0-stable</p>
            </div>
          </div>
        </Card>

        {/* Content Card */}
        <Card className="flex-1 shadow-md border-slate-100 overflow-hidden bg-white">
          <CardHeader className="border-b bg-slate-50/30 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <ShieldCheck className="text-teal-600" size={24} />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="flex items-start gap-6 p-6 hover:bg-slate-50/50 transition-colors">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 w-20 shrink-0">Version</div>
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold text-lg leading-none">MOD v2.1.0</span>
                  <span className="text-xs text-teal-600 font-semibold mt-1 uppercase tracking-tighter">Rinjani Next-Gen Evolution</span>
                </div>
              </div>
              
              <div className="flex items-start gap-6 p-6 hover:bg-slate-50/50 transition-colors">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 w-20 shrink-0">Engineers</div>
                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">BangAcil</span>
                    <span className="text-xs text-slate-500 font-medium">Original System Architecture</span>
                    <a 
                      href="https://mikrotik.com/training/certificates/b101043c12c303053eb3" 
                      target="_blank" 
                      className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline mt-2 bg-blue-50 px-2 py-1 rounded-md w-fit border border-blue-100"
                    >
                      <ExternalLink size={10} /> VERIFY MTCNA
                    </a>
                  </div>
                  
                  <div className="flex flex-col pt-4 border-t border-slate-50">
                    <span className="text-sm font-bold text-slate-800">Sanrian Surenggana</span>
                    <span className="text-xs text-slate-500 font-medium">Lead Developer - Next Gen Evolution</span>
                    <a 
                      href="https://mikrotik.com/training/certificates/c504881caf75ac7a4a3d" 
                      target="_blank" 
                      className="text-[10px] font-bold text-teal-600 flex items-center gap-1 hover:underline mt-2 bg-teal-50 px-2 py-1 rounded-md w-fit border border-teal-100"
                    >
                      <ExternalLink size={10} /> VERIFY MTCNA
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/30">
                <div className="flex items-center gap-3 text-slate-400">
                  <Info size={16} />
                  <p className="text-[11px] font-medium leading-relaxed italic">
                    Sistem ini dikembangkan untuk memberikan kemudahan dalam manajemen MikroTik Hotspot & PPP secara modern melalui integrasi Bot Telegram.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
