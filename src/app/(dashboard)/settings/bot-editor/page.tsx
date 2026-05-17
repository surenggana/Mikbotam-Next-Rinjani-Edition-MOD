"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, MessageSquare, Info, Ticket, Wallet, UserPlus, Loader2 } from "lucide-react";
import { getBotTexts, updateBotTexts } from "@/lib/actions/settings";
import { toast } from "sonner";

export default function BotEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [texts, setTexts] = useState({
    daftar: "",
    menu: "",
    informasi: "",
    saldoFooter: "",
    voucherFooter: "",
    depositInfo: ""
  });

  useEffect(() => {
    async function load() {
      const data = await getBotTexts();
      setTexts(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateBotTexts(texts);
      if (res.success) toast.success("Teks Bot berhasil diperbarui.");
    } catch (e) {
      toast.error("Gagal menyimpan teks bot.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Bot Settings</h1>
          <p className="text-sm text-slate-500">Kustomisasi balasan otomatis Bot Telegram Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        <Card className="shadow-md border-slate-100 overflow-hidden h-fit">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <UserPlus className="text-emerald-500" size={18} />
              Teks Registrasi & Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pesan /daftar (User Baru)</Label>
              <Textarea 
                value={texts.daftar} 
                onChange={(e) => setTexts({...texts, daftar: e.target.value})}
                placeholder="Pesan saat user mengetik /daftar pertama kali..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Header /menu</Label>
              <Textarea 
                value={texts.menu} 
                onChange={(e) => setTexts({...texts, menu: e.target.value})}
                placeholder="Teks pembuka saat user membuka menu bot..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white transition-all"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-100 overflow-hidden h-fit">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Info className="text-blue-500" size={18} />
              Informasi & Saldo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Konten Informasi</Label>
              <Textarea 
                value={texts.informasi} 
                onChange={(e) => setTexts({...texts, informasi: e.target.value})}
                placeholder="Pesan saat user mengklik menu informasi..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Footer Saldo</Label>
              <Input 
                value={texts.saldoFooter} 
                onChange={(e) => setTexts({...texts, saldoFooter: e.target.value})}
                placeholder="Teks tambahan di bawah info saldo..."
                className="rounded-xl bg-slate-50 border-slate-200 h-11 focus:bg-white transition-all"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-100 overflow-hidden h-fit">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Ticket className="text-amber-500" size={18} />
              Voucher & Deposit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Footer Voucher</Label>
              <Input 
                value={texts.voucherFooter} 
                onChange={(e) => setTexts({...texts, voucherFooter: e.target.value})}
                placeholder="Teks tambahan di bawah detail voucher..."
                className="rounded-xl bg-slate-50 border-slate-200 h-11 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instruksi Deposit (Topup)</Label>
              <Textarea 
                value={texts.depositInfo} 
                onChange={(e) => setTexts({...texts, depositInfo: e.target.value})}
                placeholder="Info nomor rekening atau cara bayar..."
                className="rounded-xl bg-slate-50 border-slate-200 min-h-[100px] focus:bg-white transition-all"
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
           <Button 
            type="submit" 
            disabled={saving} 
            className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] h-14 px-10 shadow-xl shadow-primary/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan Perubahan Teks
          </Button>
        </div>
      </form>
    </div>
  );
}
