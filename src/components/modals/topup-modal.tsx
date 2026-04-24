"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2 } from "lucide-react";
import { topupResellerAction } from "@/lib/actions/transactions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function TopupModal({ isOpen, onClose, user }: TopupModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast.error("Masukkan jumlah yang valid");

    setLoading(true);
    try {
      const res = await topupResellerAction(user.userId, parseFloat(amount));
      if (res.success) {
        toast.success(`Berhasil topup ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(parseFloat(amount))} ke ${user.sellerName}`);
        onClose();
        setAmount("");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan topup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="text-emerald-600" size={20} />
            Topup Saldo Reseller
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reseller</p>
            <p className="font-bold text-slate-900">{user?.sellerName}</p>
            <p className="text-xs text-slate-500 font-mono">{user?.userId}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-bold uppercase text-slate-500">Jumlah Topup (Rp)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg font-bold text-emerald-600"
              required
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
              Proses Topup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
