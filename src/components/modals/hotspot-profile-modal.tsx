"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHotspotProfile } from "@/lib/mikrotik/hotspot";
import { formatRateLimit } from "@/lib/mikrotik/utils";
import { Loader2, Zap } from "lucide-react";

export function HotspotProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const rateLimit = formatRateLimit({
      rate: formData.get("rate") as string,
      burstLimit: formData.get("burstLimit") as string,
      burstThreshold: formData.get("burstThreshold") as string,
      burstTime: formData.get("burstTime") as string,
      priority: parseInt(formData.get("priority") as string) || 8,
    });

    try {
      await addHotspotProfile({
        name: formData.get("name") as string,
        sharedUsers: formData.get("sharedUsers") as string,
        rateLimit: rateLimit,
      });
      onClose();
      window.location.reload();
    } catch (err) {
      alert("Gagal menambah profil");
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
              <Zap className="text-amber-500" size={20} />
              Tambah Profil Hotspot (Burst Support)
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 grid gap-2">
              <Label>Nama Profil</Label>
              <Input name="name" placeholder="Contoh: 1Mbps_Member" required />
            </div>
            <div className="grid gap-2">
              <Label>Rate Limit (Rx/Tx)</Label>
              <Input name="rate" placeholder="1M/1M" required />
            </div>
            <div className="grid gap-2">
              <Label>Shared Users</Label>
              <Input name="sharedUsers" type="number" defaultValue="1" />
            </div>
            
            <div className="col-span-2 border-t pt-2 mt-2">
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase">Advanced Burst Settings (Opsional)</p>
            </div>

            <div className="grid gap-2">
              <Label>Burst Limit</Label>
              <Input name="burstLimit" placeholder="2M/2M" />
            </div>
            <div className="grid gap-2">
              <Label>Burst Threshold</Label>
              <Input name="burstThreshold" placeholder="1500k/1500k" />
            </div>
            <div className="grid gap-2">
              <Label>Burst Time</Label>
              <Input name="burstTime" placeholder="30s/30s" />
            </div>
            <div className="grid gap-2">
              <Label>Priority (1-8)</Label>
              <Input name="priority" type="number" min="1" max="8" defaultValue="8" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              Simpan Profil
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
