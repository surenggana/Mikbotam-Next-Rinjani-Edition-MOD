import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ExternalLink, FacebookIcon, GithubIcon } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Card */}
        <Card className="md:w-1/3 bg-slate-900 text-white overflow-hidden border-none shadow-xl">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-teal-500/10 p-2 mb-4 border-2 border-teal-500/20">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold text-teal-400">M</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-teal-400">Mikbotam</h3>
            <p className="text-slate-400 mt-1">© BangAcil</p>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Professional MikroTik management via Telegram.
            </p>
          </div>
        </Card>

        {/* Content Card */}
        <Card className="flex-1 shadow-md border-none">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Info className="text-teal-600" size={24} />
              Mikrotik Hotspot Bot Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="mt-1 text-teal-600 font-bold text-sm min-w-[80px]">Version</div>
                  <div className="flex flex-col">
                    <span className="text-slate-600 font-medium font-mono">MOD v2.1.0 - Rinjani Edition</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Evolution of Krakatau Version</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="mt-1 text-teal-600 font-bold text-sm min-w-[80px]">Authors</div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                      <span className="text-slate-600 font-medium">BangAcil (Original Creator)</span>
                      <a 
                        href="https://mikrotik.com/training/certificates/b101043c12c303053eb3" 
                        target="_blank" 
                        className="text-xs text-blue-500 flex items-center gap-1 hover:underline mt-1"
                      >
                        <ExternalLink size={12} /> MTCNA Certificate
                      </a>
                    </div>
                    <div className="flex flex-col border-t pt-2 border-slate-200">
                      <span className="text-slate-600 font-medium">Sanrian Surenggana (Lead Developer - Next Gen)</span>
                      <span className="text-xs text-teal-600 font-semibold mt-1">MTCNA Certified</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="mt-1 text-teal-600 font-bold text-sm min-w-[80px]">APIs & Libs</div>
                  <div className="flex flex-col gap-2">
                    <a href="https://core.telegram.org/bots/api" target="_blank" className="text-sm text-slate-600 hover:text-blue-500 flex items-center gap-1 underline underline-offset-4 decoration-slate-200">
                      Telegram Bot API
                    </a>
                    <span className="text-sm text-slate-600">FrameBot by Bang Hasan</span>
                    <a href="https://github.com/BenMenking/routeros-api" target="_blank" className="text-sm text-slate-600 hover:text-blue-500 flex items-center gap-1 underline underline-offset-4 decoration-slate-200">
                      RouterOS API PHP Library
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="mt-1 text-teal-600 font-bold text-sm min-w-[80px]">Social</div>
                  <a 
                    href="https://www.facebook.com/bangachiilll" 
                    target="_blank" 
                    className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium"
                  >
                    <FacebookIcon size={18} />
                    fb.com/bangachiill
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm text-slate-500 italic text-center">
                  "Terima kasih kepada seluruh pendukung Mikbotam, baik support maupun para donatur yang telah membantu pengembangan proyek ini."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
