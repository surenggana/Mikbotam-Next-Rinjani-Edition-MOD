"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHotspotProfileAction, updateHotspotProfileAction } from "@/lib/actions/mikrotik-hotspot";
import { formatRateLimit } from "@/lib/mikrotik/utils";
import { Loader2, Zap, Edit2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Format valid: angka + unit opsional (k/M/G) / angka + unit opsional
// Contoh: 1M/1M, 512k/256k, 1.5M/512k, 1024/512
const RX_TX_RE = /^\d+(\.\d+)?[kKmMgG]?\/\d+(\.\d+)?[kKmMgG]?$/;

function validateRxTx(val: string, label: string): string {
  if (!val) return "";
  if (!RX_TX_RE.test(val.trim())) return `${label} harus format Rx/Tx — contoh: 2M/2M atau 512k/256k`;
  return "";
}

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[10px] text-red-500 font-semibold mt-0.5">
      <AlertCircle size={10} /> {msg}
    </p>
  );
}

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rate        = (fd.get("rate") as string).trim();
    const burstLimit  = (fd.get("burstLimit") as string).trim();
    const burstThold  = (fd.get("burstThreshold") as string).trim();
    const burstTime   = (fd.get("burstTime") as string).trim();
    const limitAt     = (fd.get("limitAt") as string).trim();

    // Validasi format Rx/Tx untuk semua field yang diisi
    const newErrors: Record<string, string> = {
      rate:           validateRxTx(rate, "Rate Limit"),
      burstLimit:     validateRxTx(burstLimit, "Burst Limit"),
      burstThreshold: validateRxTx(burstThold, "Burst Threshold"),
      limitAt:        validateRxTx(limitAt, "Limit At"),
    };

    // Burst Time boleh "30s/30s" atau "30/30" — validasi longgar
    if (burstTime && !/^\d+s?\/\d+s?$/.test(burstTime)) {
      newErrors.burstTime = "Burst Time harus format Ns/Ns — contoh: 30s/30s";
    }

    // Kalau ada salah satu burst field diisi, sisanya wajib diisi juga
    const burstFields = [burstLimit, burstThold, burstTime];
    const burstFilled = burstFields.filter(Boolean).length;
    if (burstFilled > 0 && burstFilled < 3) {
      if (!burstLimit)  newErrors.burstLimit     = "Wajib diisi jika menggunakan Burst";
      if (!burstThold)  newErrors.burstThreshold = "Wajib diisi jika menggunakan Burst";
      if (!burstTime)   newErrors.burstTime      = "Wajib diisi jika menggunakan Burst";
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const rateLimit = formatRateLimit({
      rate,
      burstLimit:     burstLimit || undefined,
      burstThreshold: burstThold || undefined,
      burstTime:      burstTime || undefined,
      priority:       parseInt(fd.get("priority") as string) || 8,
      limitAt:        limitAt || undefined,
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

  // Parse rate-limit string "rx/tx burst-limit burst-threshold burst-time priority limit-at"
  const parseRateLimit = (rl: string) => {
    if (!rl) return { rate: "", burstLimit: "", burstThreshold: "", burstTime: "", priority: "8", limitAt: "" };
    const parts = rl.split(" ");
    return {
      rate:           parts[0] || "",
      burstLimit:     parts[1] || "",
      burstThreshold: parts[2] || "",
      burstTime:      parts[3] || "",
      priority:       parts[4] || "8",
      limitAt:        parts[5] || "",
    };
  };

  const parseOnLogin = (script: string) => {
    if (!script) return { validity: "0", lockMac: false };
    const valMatch = script.match(/uptime\s+["']?\(?([\w]+)\)?["']?/i) || script.match(/uptime\s+([\w]+)/i);
    return {
      validity: valMatch ? valMatch[1] : "0",
      lockMac:  script.includes("mac-address=$"),
    };
  };

  const currentRL       = isEdit ? parseRateLimit(initialData["rate-limit"]) : null;
  const currentOnLogin  = isEdit ? parseOnLogin(initialData["on-login"]) : { validity: "0", lockMac: false };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? <Edit2 className="text-emerald-600" size={18} /> : <Zap className="text-emerald-600" size={18} />}
              {isEdit ? "Edit Profil Hotspot" : "Tambah Profil Hotspot"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4 overflow-y-auto max-h-[70vh] px-1">

            {/* Nama Profil */}
            <div className="col-span-2 grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Profil</Label>
              <Input name="name" defaultValue={initialData?.name} placeholder="Contoh: 1Mbps_Member" required className="bg-slate-50/50 border-slate-200" />
            </div>

            {/* Rate Limit + Shared Users */}
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rate Limit (Rx/Tx)</Label>
              <Input
                name="rate"
                defaultValue={currentRL?.rate}
                placeholder="1M/1M"
                required
                className={`bg-slate-50/50 border-slate-200 ${errors.rate ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                onChange={() => setErrors(e => ({ ...e, rate: "" }))}
              />
              <FieldError msg={errors.rate} />
              <p className="text-[9px] text-slate-400">Download/Upload — contoh: <span className="font-mono">2M/1M</span></p>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shared Users</Label>
              <Input name="sharedUsers" type="number" min="1" defaultValue={initialData?.["shared-users"] || "1"} className="bg-slate-50/50 border-slate-200" />
            </div>

            {/* Validity */}
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Clock size={12} /> Validity (Masa Aktif)
              </Label>
              <Input name="validity" defaultValue={currentOnLogin.validity} placeholder="1d / 12h / 30m / 0 (Unlimited)" className="bg-slate-50/50 border-slate-200" />
              <p className="text-[9px] text-slate-400 italic">User dihapus otomatis setelah masa aktif habis sejak login pertama.</p>
            </div>

            {/* ── Burst Settings ── */}
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Burst Settings (Opsional)</p>
              <p className="text-[9px] text-slate-400 mb-3">Jika salah satu diisi, ketiganya wajib diisi.</p>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Limit (Rx/Tx)</Label>
              <Input
                name="burstLimit"
                defaultValue={currentRL?.burstLimit}
                placeholder="2M/2M"
                className={`bg-slate-50/50 border-slate-200 ${errors.burstLimit ? "border-red-400" : ""}`}
                onChange={() => setErrors(e => ({ ...e, burstLimit: "" }))}
              />
              <FieldError msg={errors.burstLimit} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Threshold (Rx/Tx)</Label>
              <Input
                name="burstThreshold"
                defaultValue={currentRL?.burstThreshold}
                placeholder="1500k/1500k"
                className={`bg-slate-50/50 border-slate-200 ${errors.burstThreshold ? "border-red-400" : ""}`}
                onChange={() => setErrors(e => ({ ...e, burstThreshold: "" }))}
              />
              <FieldError msg={errors.burstThreshold} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Burst Time (Rx/Tx)</Label>
              <Input
                name="burstTime"
                defaultValue={currentRL?.burstTime}
                placeholder="30s/30s"
                className={`bg-slate-50/50 border-slate-200 ${errors.burstTime ? "border-red-400" : ""}`}
                onChange={() => setErrors(e => ({ ...e, burstTime: "" }))}
              />
              <FieldError msg={errors.burstTime} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority (1–8)</Label>
              <Input name="priority" type="number" min="1" max="8" defaultValue={currentRL?.priority || "8"} className="bg-slate-50/50 border-slate-200" />
              <p className="text-[9px] text-slate-400">1 = tertinggi, 8 = terendah</p>
            </div>

            {/* Limit At */}
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Limit At / Min Rate (Rx/Tx) — Opsional</Label>
              <Input
                name="limitAt"
                defaultValue={currentRL?.limitAt}
                placeholder="512k/256k"
                className={`bg-slate-50/50 border-slate-200 ${errors.limitAt ? "border-red-400" : ""}`}
                onChange={() => setErrors(e => ({ ...e, limitAt: "" }))}
              />
              <FieldError msg={errors.limitAt} />
              <p className="text-[9px] text-slate-400 italic">Kecepatan minimum terjamin saat jaringan sibuk (Guaranteed Rate).</p>
            </div>

            {/* Lock MAC */}
            <div className="col-span-2 flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200 hover:bg-emerald-50/30 transition-colors">
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
