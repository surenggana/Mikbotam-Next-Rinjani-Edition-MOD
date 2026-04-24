"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHotspotProfileAction, updateHotspotProfileAction } from "@/lib/actions/mikrotik-hotspot";
import { formatRateLimit } from "@/lib/mikrotik/utils";
import { Loader2, Zap, Edit2, Clock } from "lucide-react";
import { toast } from "sonner";

export function HotspotProfileModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

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
      if (isEdit) {
        await updateHotspotProfileAction(initialData[".id"], {
          name: fd.get("name") as string,
          sharedUsers: fd.get("sharedUsers") as string,
          rateLimit,
          validity: fd.get("validity") as string,
          lockMac: fd.get("lockMac") === "on",
        });
        toast.success("Profil hotspot berhasil diperbarui!");
      } else {
        await addHotspotProfileAction({
          name: fd.get("name") as string,
          sharedUsers: fd.get("sharedUsers") as string,
          rateLimit,
          lockMac: fd.get("lockMac") === "on",
          validity: fd.get("validity") as string,
        });
        toast.success("Profil hotspot berhasil ditambahkan!");
      }
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || (isEdit ? "Gagal memperbarui profil." : "Gagal menambah profil."));
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse existing rate-limit string if editing
  const parseRateLimit = (rl: string) => {
    if (!rl) return { rate: "", burstLimit: "", burstThreshold: "", burstTime: "", priority: "8" };
    const parts = rl.split(" ");
    return {
      rate: parts[0] || "",
      burstLimit: parts[1] || "",
      burstThreshold: parts[2] || "",
      burstTime: parts[3] || "",
      priority: parts[4] || "8",
    };
  };

  // Helper to extract validity and lockMac from on-login script
  const parseOnLogin = (script: string) => {
    if (!script) return { validity: "0", lockMac: false };
    // Regex lebih fleksibel untuk menangkap :local uptime (1d) atau :local uptime "1d"
    const valMatch = script.match(/uptime\s+["']?\(?([\w]+)\)?["']?/i) || script.match(/uptime\s+([\w]+)/i);
    const lockMatch = script.includes("mac-address=$");
    return {
      validity: valMatch ? valMatch[1] : "0",
      lockMac: lockMatch
    };
  };

  const currentRL = isEdit ? parseRateLimit(initialData["rate-limit"]) : null;
  const currentOnLogin = isEdit ? parseOnLogin(initialData["on-login"]) : { validity: "0", lockMac: false };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? <Edit2 className="text-emerald-600" size={18} /> : <Zap className="text-emerald-600" size={18} />}
              {isEdit ? "Edit Profil Hotspot" : "Tambah Profil Hotspot"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 overflow-y-auto max-h-[70vh] px-1">
            <div className="col-span-2 grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Profil</Label>
              <Input name="name" defaultValue={initialData?.name} placeholder="Contoh: 1Mbps_Member" required className="bg-slate-50/50 border-slate-200" />
            </div>
            
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate Limit (Rx/Tx)</Label>
              <Input name="rate" defaultValue={currentRL?.rate} placeholder="1M/1M" required className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shared Users</Label>
              <Input name="sharedUsers" type="number" defaultValue={initialData?.["shared-users"] || "1"} className="bg-slate-50/50 border-slate-200" />
            </div>

            <div className="col-span-2 grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Clock size={12} /> Validity (Masa Aktif)
              </Label>
              <Input name="validity" defaultValue={currentOnLogin.validity} placeholder="Contoh: 1d (1 hari), 12h (12 jam), 0 (Unlimited)" className="bg-slate-50/50 border-slate-200" />
              <p className="text-[9px] text-slate-400 italic">User akan dihapus otomatis setelah masa aktif habis sejak login pertama.</p>
            </div>

            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Burst Settings (Opsional)</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Limit</Label>
              <Input name="burstLimit" defaultValue={currentRL?.burstLimit} placeholder="2M/2M" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Threshold</Label>
              <Input name="burstThreshold" defaultValue={currentRL?.burstThreshold} placeholder="1500k/1500k" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Time</Label>
              <Input name="burstTime" defaultValue={currentRL?.burstTime} placeholder="30s/30s" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority (1-8)</Label>
              <Input name="priority" type="number" min="1" max="8" defaultValue={currentRL?.priority || "8"} className="bg-slate-50/50 border-slate-200" />
            </div>

            <div className="col-span-2 flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200 mt-2 hover:bg-emerald-50/30 transition-colors">
              <input 
                type="checkbox" 
                id="lockMac" 
                name="lockMac" 
                defaultChecked={currentOnLogin.lockMac}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              />
              <div className="grid gap-0.5">
                <Label htmlFor="lockMac" className="text-xs font-bold text-slate-700 cursor-pointer">Lock MAC Address</Label>
                <p className="text-[9px] text-slate-500 font-medium">Kunci voucher hanya untuk perangkat pertama yang login.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              {isEdit ? "Simpan Perubahan" : "Simpan Profil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
