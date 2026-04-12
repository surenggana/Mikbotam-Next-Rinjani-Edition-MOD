"use client";

import { useState, useEffect } from "react";
import { 
  getSystemSettings, 
  updateSystemSettings, 
  testRouterConnection, 
  setTelegramWebhook,
  downloadDatabaseAction 
} from "@/lib/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Router, Bot, User, Save, Wifi, 
  Loader2, Database, Download, Globe, ShieldCheck, Zap
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { RouterManagementCard } from "@/components/settings/router-management-card";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectionMode, setConnectionMode] = useState("polling");
  const [webhookDomain, setWebhookDomain] = useState("");

  useEffect(() => {
    getSystemSettings().then((res: any) => {
      setSettings(res);
      // Accessing settings property from the JSON column if it exists, or fallback
      let mode = "polling";
      if (res?.settings) {
        try {
          const parsed = JSON.parse(res.settings);
          mode = parsed.connectionMode || "polling";
        } catch (e) {}
      }
      setConnectionMode(mode);
      setLoading(false);
      setWebhookDomain(window.location.origin);
    });
  }, []);

  const handleTestRouter = async () => {
    const formData = new FormData(document.querySelector('form') as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    const promise = testRouterConnection(data);
    
    toast.promise(promise, {
      loading: 'Menghubungi Router...',
      success: (res: any) => res.success ? res.message : `Gagal: ${res.message}`,
      error: 'Terjadi kesalahan sistem',
    });
  };

  const handleSetWebhook = async () => {
    if (!settings?.botToken) return toast.error("Token bot belum diatur!");
    if (!webhookDomain) return toast.error("Isi domain webhook terlebih dahulu!");
    const res = await setTelegramWebhook(settings.botToken, webhookDomain.replace(/\/$/, ""));
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleDownloadBackup = async () => {
    const res = await downloadDatabaseAction();
    if (!res) return toast.error("File database tidak ditemukan");
    
    const blob = new Blob([new Uint8Array(res.data)], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.name;
    a.click();
    toast.success("Backup database berhasil didownload.");
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary size-8" />
      <p className="text-sm font-medium text-slate-500 italic">Memuat konfigurasi sistem...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <Toaster position="top-right" richColors />
      
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">App Configuration</h1>
        <p className="text-sm font-medium text-slate-500 text-balance">Kelola parameter infrastruktur MikroTik dan integrasi bot telegram Anda.</p>
      </div>

      <RouterManagementCard />

      <form action={async (fd) => {
        fd.append("connectionMode", connectionMode);
        const res = await updateSystemSettings(fd);
        if (res.success) toast.success("Konfigurasi berhasil disimpan!");
      }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <input type="hidden" name="id" value={settings?.no || ""} />
        
        {/* Connection Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* RouterOS Card */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Router size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">RouterOS Connection</CardTitle>
                  <CardDescription className="text-[11px] font-medium uppercase tracking-tight">API Interface MikroTik</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">IP Address / Host</Label>
                <Input name="routerIp" defaultValue={settings?.routerIp || ""} placeholder="192.168.1.1" className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Port</Label>
                <Input name="port" defaultValue={settings?.port || "8728"} className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Username</Label>
                <Input name="routerUsername" defaultValue={settings?.routerUsername || ""} className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Password</Label>
                <Input name="routerPassword" type="password" defaultValue={settings?.routerPassword || ""} className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Router Name</Label>
                <Input name="routerName" defaultValue={settings?.routerName || ""} placeholder="Nama router (opsional, diisi otomatis dari identity)" className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all" />
              </div>
              <div className="md:col-span-2 pt-2">
                <Button type="button" variant="outline" onClick={handleTestRouter} className="w-full md:w-auto rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest h-11 px-6">
                  <Wifi size={14} className="mr-2"/>
                  Uji Koneksi MikroTik
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Telegram Bot Card */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Bot size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Telegram Bot Integration</CardTitle>
                  <CardDescription className="text-[11px] font-medium uppercase tracking-tight">Metode Komunikasi Telegram</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bot API Token</Label>
                <Input name="botToken" defaultValue={settings?.botToken || ""} className="font-mono text-xs bg-slate-50/50 border-slate-200" placeholder="123456789:ABCDEF..." />
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connection Method</Label>
                <Select value={connectionMode} onValueChange={(val) => setConnectionMode(val || "polling")}>
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl h-11">
                    <SelectValue placeholder="Pilih metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polling" className="py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">Long Polling (Local)</span>
                        <span className="text-[10px] text-slate-400">Cocok untuk PC Lokal / STB / Local Server</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="webhook" className="py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">Webhook (Public)</span>
                        <span className="text-[10px] text-slate-400">Memerlukan Domain SSL / HTTPS Publik</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {connectionMode === "polling" && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Mode Polling — jalankan perintah berikut di server agar bot aktif menerima pesan:
                  </p>
                  <code className="mt-2 inline-block text-[11px] font-mono font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-lg">
                    npm run bot
                  </code>
                </div>
              )}

              {connectionMode === "webhook" && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 leading-relaxed space-y-1">
                    <p className="font-bold">Cara pakai Webhook:</p>
                    <ol className="list-decimal list-inside space-y-0.5 font-medium">
                      <li>Isi domain HTTPS publik Anda di bawah (contoh: <span className="font-mono">https://bot.domain.com</span>)</li>
                      <li>Klik <span className="font-bold">Aktifkan Webhook</span> — URL akan otomatis didaftarkan ke Telegram</li>
                      <li>Bot akan menerima pesan tanpa perlu <code className="font-mono bg-emerald-100 px-1 rounded">npm run bot</code></li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Domain HTTPS Publik
                    </Label>
                    <Input
                      value={webhookDomain}
                      onChange={(e) => setWebhookDomain(e.target.value)}
                      placeholder="https://bot.yourdomain.com"
                      className="font-mono text-xs bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                    {webhookDomain && settings?.botToken && (
                      <p className="text-[10px] font-mono text-slate-400 break-all">
                        URL yang akan didaftarkan:{" "}
                        <span className="text-slate-600 font-bold">
                          {webhookDomain.replace(/\/$/, "")}/api/telegram/{settings.botToken}
                        </span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleSetWebhook}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-11 px-6 shadow-md shadow-emerald-200"
                  >
                    <Globe size={14} className="mr-2" />
                    Aktifkan Webhook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="bg-slate-50/50 border-b border-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <User size={14} />
                Identity Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Owner Name</Label>
                <Input name="owner" defaultValue={settings?.owner || ""} className="bg-slate-50/50 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Admin Chat ID</Label>
                <Input name="ownerId" defaultValue={settings?.ownerId || ""} className="bg-slate-50/50 border-slate-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-amber-100 bg-amber-50/30">
            <CardHeader className="border-b border-amber-100/50">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                <Database size={14} />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Button type="button" variant="outline" onClick={handleDownloadBackup} className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 shadow-sm">
                <Download size={14} className="mr-2" />
                Backup Database
              </Button>
              <p className="text-[9px] text-amber-600 font-medium italic text-center">Disarankan backup rutin secara berkala.</p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-14 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 rounded-2xl">
            <Save className="mr-2" size={18}/>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
