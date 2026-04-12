"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPppProfileAction } from "@/lib/actions/mikrotik-ppp";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

export function PppProfileModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await addPppProfileAction({
        name: fd.get("name") as string,
        localAddress: fd.get("localAddress") as string || undefined,
        remoteAddress: fd.get("remoteAddress") as string || undefined,
        rateLimit: fd.get("rateLimit") as string || undefined,
      });
      toast.success("PPP profile berhasil ditambahkan!");
      (e.target as HTMLFormElement).reset();
      onClose();
      onSuccess?.();
    } catch {
      toast.error("Gagal menambah PPP profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings size={18} className="text-emerald-600" />
              Tambah PPP Profile
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Profile</Label>
              <Input name="name" required className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Local Address</Label>
                <Input name="localAddress" placeholder="192.168.1.1" className="bg-slate-50/50 border-slate-200" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remote Address</Label>
                <Input name="remoteAddress" placeholder="192.168.1.0/24" className="bg-slate-50/50 border-slate-200" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate Limit (opsional)</Label>
              <Input name="rateLimit" placeholder="10M/10M" className="bg-slate-50/50 border-slate-200" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              Simpan ke Router
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
