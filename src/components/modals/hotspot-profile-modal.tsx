"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHotspotProfileAction } from "@/lib/actions/mikrotik-hotspot";
import { formatRateLimit } from "@/lib/mikrotik/utils";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export function HotspotProfileModal({
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

    const rateLimit = formatRateLimit({
      rate: fd.get("rate") as string,
      burstLimit: fd.get("burstLimit") as string,
      burstThreshold: fd.get("burstThreshold") as string,
      burstTime: fd.get("burstTime") as string,
      priority: parseInt(fd.get("priority") as string) || 8,
    });

    try {
      await addHotspotProfileAction({
        name: fd.get("name") as string,
        sharedUsers: fd.get("sharedUsers") as string,
        rateLimit,
      });
      toast.success("Profil hotspot berhasil ditambahkan!");
      (e.target as HTMLFormElement).reset();
      onClose();
      onSuccess?.();
    } catch {
      toast.error("Gagal menambah profil hotspot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="text-emerald-600" size={18} />
              Tambah Profil Hotspot
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Profil</Label>
              <Input name="name" placeholder="Contoh: 1Mbps_Member" required className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate Limit (Rx/Tx)</Label>
              <Input name="rate" placeholder="1M/1M" required className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shared Users</Label>
              <Input name="sharedUsers" type="number" defaultValue="1" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Burst Settings (Opsional)</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Limit</Label>
              <Input name="burstLimit" placeholder="2M/2M" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Threshold</Label>
              <Input name="burstThreshold" placeholder="1500k/1500k" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Time</Label>
              <Input name="burstTime" placeholder="30s/30s" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority (1-8)</Label>
              <Input name="priority" type="number" min="1" max="8" defaultValue="8" className="bg-slate-50/50 border-slate-200" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              Simpan Profil
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
