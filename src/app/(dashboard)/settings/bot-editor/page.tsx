import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, Save } from "lucide-react";
import { revalidatePath } from "next/cache";
import { getActiveConfig } from "@/lib/mikrotik";

export default async function BotEditorPage() {
  const settings = await getActiveConfig();

  // Parse teks bot dari JSON string
  let botTexts = {
    welcome: "Selamat datang di Bot MikroTik kami!",
    help: "Gunakan perintah berikut:\n/cek_saldo - Cek saldo anda\n/deposit - Isi ulang saldo",
    success_buy: "Voucher berhasil dibeli!",
    fail_balance: "Maaf, saldo anda tidak cukup."
  };

  if (settings?.settingsText) {
    try { botTexts = JSON.parse(settings.settingsText); } catch(e) {}
  }

  async function handleSave(formData: FormData) {
    "use server";
    const data = {
      welcome: formData.get("welcome"),
      help: formData.get("help"),
      success_buy: formData.get("success_buy"),
      fail_balance: formData.get("fail_balance"),
    };

    const config = await getActiveConfig();
    if (config) {
      await prisma.systemConfig.update({
        where: { no: config.no },
        data: { settingsText: JSON.stringify(data) }
      });
    }
    revalidatePath("/dashboard/settings/bot-editor");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Bot Message Editor</h1>
      </div>

      <form action={handleSave}>
        <Card className="shadow-sm border-none">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <MessageSquare size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Kustomisasi Balasan Bot</CardTitle>
                <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-slate-500">
                  Ubah teks yang dikirimkan bot Telegram ke pengguna secara dinamis.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label>Pesan Sambutan (/start)</Label>
              <Textarea name="welcome" defaultValue={botTexts.welcome} className="min-h-[100px]" />
            </div>
            
            <div className="grid gap-2">
              <Label>Pesan Bantuan (/help)</Label>
              <Textarea name="help" defaultValue={botTexts.help} className="min-h-[100px]" />
            </div>

            <div className="grid gap-2">
              <Label>Notifikasi Sukses Beli Voucher</Label>
              <Textarea name="success_buy" defaultValue={botTexts.success_buy} className="min-h-[80px]" />
            </div>

            <div className="grid gap-2">
              <Label>Pesan Saldo Kurang</Label>
              <Textarea name="fail_balance" defaultValue={botTexts.fail_balance} className="min-h-[80px]" />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
              <Save className="mr-2" size={20} />
              Simpan Perubahan Teks Bot
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
