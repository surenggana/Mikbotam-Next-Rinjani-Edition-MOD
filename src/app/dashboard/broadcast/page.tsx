"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { sendBroadcast } from "@/lib/actions/broadcast";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSend = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      const res = await sendBroadcast(message);
      if (res.success) {
        toast.success(res.message);
        setMessage("");
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan saat mengirim broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Broadcast Telegram</h1>
        <p className="text-slate-500">Kirim pesan massal ke seluruh reseller yang terdaftar di database.</p>
      </div>

      <Card className="shadow-md border-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send size={20} className="text-emerald-400" />
                Buat Pesan Baru
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Mendukung format HTML Telegram (contoh: &lt;b&gt;tebal&lt;/b&gt;, &lt;i&gt;miring&lt;/i&gt;)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Textarea 
              placeholder="Tulis pesan pengumuman di sini..." 
              className="min-h-[250px] text-base bg-slate-50 border-slate-200 focus:bg-white focus:ring-emerald-500 transition-all"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end">
              <span className="text-xs text-slate-400">{message.length} karakter</span>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={18} />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold uppercase tracking-wider">Peringatan Penting</p>
              <p>Pesan akan dikirimkan secara berurutan. Jangan menutup atau merefresh halaman ini sampai proses selesai untuk memastikan semua reseller menerima pesan.</p>
            </div>
          </div>

          <Button 
            onClick={() => setIsConfirmOpen(true)} 
            disabled={loading || !message.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-semibold shadow-lg shadow-emerald-900/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mengirim Pesan...
              </>
            ) : (
              "Kirim Sekarang"
            )}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSend}
        title="Konfirmasi Broadcast"
        description="Apakah Anda yakin ingin mengirim pesan ini ke SELURUH reseller? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Kirim Sekarang"
        isLoading={loading}
      />
    </div>
  );
}
