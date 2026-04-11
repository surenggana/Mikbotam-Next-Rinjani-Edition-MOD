"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { sendBroadcast } from "@/lib/actions/broadcast";

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!message) return;
    if (!confirm("Apakah Anda yakin ingin mengirim pesan ini ke SELURUH reseller?")) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await sendBroadcast(message);
      setResult(res);
      if (res.success) setMessage("");
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Broadcast Telegram</h1>
        <p className="text-slate-500">Kirim pesan massal ke seluruh reseller yang terdaftar di database.</p>
      </div>

      <Card className="shadow-lg border-none">
        <CardHeader className="bg-slate-900 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Send size={20} />
            Buat Pesan Baru
          </CardTitle>
          <CardDescription className="text-slate-400">
            Mendukung format HTML Telegram (contoh: &lt;b&gt;tebal&lt;/b&gt;, &lt;i&gt;miring&lt;/i&gt;)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Textarea 
            placeholder="Tulis pesan pengumuman di sini..." 
            className="min-h-[200px] text-base"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {result && (
            <div className={`p-4 rounded-md flex items-start gap-3 ${result.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {result.success ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span className="text-sm font-medium">{result.message}</span>
            </div>
          )}

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-0.5" size={18} />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold uppercase">Peringatan Penting:</p>
              <p>Pesan akan dikirimkan satu per satu ke seluruh reseller. Jangan menutup halaman ini sampai proses selesai untuk menghindari kegagalan pengiriman.</p>
            </div>
          </div>

          <Button 
            onClick={handleSend} 
            disabled={loading || !message}
            className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg font-semibold"
          >
            {loading ? "Sedang Mengirim..." : "Kirim Sekarang"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
