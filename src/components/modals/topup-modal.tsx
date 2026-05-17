"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2 } from "lucide-react";
import { topupResellerAction, topdownReseller } from "@/lib/actions/transactions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  mode?: "topup" | "topdown";
}

export function TopupModal({ isOpen, onClose, user, mode = "topup" }: TopupModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isTopup = mode === "topup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast.error("Masukkan jumlah yang valid");

    setLoading(true);
    try {
      const res = isTopup 
        ? await topupResellerAction(user.userId, parseFloat(amount))
        : await topdownReseller(user.userId, parseFloat(amount));

      if (res.success) {
        toast.success(`Berhasil ${isTopup ? 'topup' : 'menarik'} ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(amount))} ${isTopup ? 'ke' : 'dari'} ${user.sellerName}`);
        onClose();
        setAmount("");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || `Gagal melakukan ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className={isTopup ? "text-emerald-600" : "text-amber-600"} size={20} />
            {isTopup ? "Topup Saldo Reseller" : "Tarik Saldo Reseller"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reseller</p>
            <p className="font-bold text-slate-900">{user?.sellerName}</p>
            <p className="text-xs text-slate-500 font-mono">{user?.userId}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold uppercase text-slate-500">Jumlah {isTopup ? "Topup" : "Penarikan"} (Rp)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn("h-12 text-lg font-bold", isTopup ? "text-emerald-600" : "text-amber-600")}
              required
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest border-slate-200">
              Batal
            </Button>
            <Button type="submit" className={cn("rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all", isTopup ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-amber-600 hover:bg-amber-700 shadow-amber-200")} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
              Proses {isTopup ? "Topup" : "Tarik Saldo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
