"use client";

import { useState, useEffect } from "react";
import { 
  getSystemSettings, 
  updateSystemSettings, 
  testRouterConnection, 
  testBotConnection,
  setTelegramWebhook,
  downloadDatabaseAction 
} from "@/lib/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Router, Bot, User, Save, Wifi, Send, 
  CheckCircle2, XCircle, Loader2, Database, Download, Globe 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("system");

  useEffect(() => {
    getSystemSettings().then((res) => {
      setSettings(res);
      setLoading(false);
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
    const domain = window.location.origin;
    const res = await setTelegramWebhook(settings.botToken, domain);
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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2 text-teal-600"/> Memuat Pengaturan...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
          <p className="text-slate-500 text-sm">Kelola infrastruktur MikroTik dan integrasi Telegram Anda.</p>
        </div>
      </div>

      <form action={async (fd) => {
        const res = await updateSystemSettings(fd);
        if (res.success) toast.success("Konfigurasi berhasil disimpan!");
      }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        <input type="hidden" name="id" value={settings?.no || ""} />
        
        {/* Kolom Kiri: Router */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-lg flex items-center gap-2">
                <Router size={20} className="text-teal-400" />
                MikroTik RouterOS Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label>IP Address / Host</Label>
                <Input name="routerIp" defaultValue={settings?.routerIp || ""} placeholder="192.168.1.1" />
              </div>
              <div className="grid gap-2">
                <Label>API Port</Label>
                <Input name="port" defaultValue={settings?.port || "8728"} />
              </div>
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input name="routerUsername" defaultValue={settings?.routerUsername || ""} />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input name="routerPassword" type="password" defaultValue={settings?.routerPassword || ""} />
              </div>
              <div className="md:col-span-2 pt-2">
                <Button type="button" variant="outline" onClick={handleTestRouter} className="w-full md:w-auto border-teal-200 hover:bg-teal-50 text-teal-700">
                  <Wifi size={16} className="mr-2"/>
                  Uji Koneksi ke Router
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="bg-teal-700 text-white">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot size={20} />
                Telegram Bot Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-2">
                <Label>Bot API Token</Label>
                <div className="flex gap-2">
                  <Input name="botToken" defaultValue={settings?.botToken || ""} className="font-mono text-xs" />
                  <Button type="button" variant="secondary" onClick={handleSetWebhook} className="bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
                    <Globe size={16} className="mr-2" />
                    Set Webhook
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">Pastikan server Anda menggunakan HTTPS untuk fitur Webhook.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Maintenance & Save */}
        <div className="space-y-6">
          <Card className="shadow-sm border-none bg-orange-50 border border-orange-100">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-800">
                <Database size={16} />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" variant="outline" onClick={handleDownloadBackup} className="w-full bg-white border-orange-200 text-orange-700 hover:bg-orange-100">
                <Download size={16} className="mr-2" />
                Backup Database (.db)
              </Button>
              <p className="text-[10px] text-orange-600 italic">Disarankan melakukan backup rutin sebelum melakukan perubahan besar.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="bg-slate-100 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                <User size={16} />
                Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label>Owner Name</Label>
                <Input name="owner" defaultValue={settings?.owner || ""} />
              </div>
              <div className="grid gap-2">
                <Label>Admin ChatID</Label>
                <Input name="ownerId" defaultValue={settings?.ownerId || ""} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-14 text-lg shadow-lg">
            <Save className="mr-2" size={20}/>
            Simpan Konfigurasi
          </Button>
        </div>
      </form>
    </div>
  );
}
