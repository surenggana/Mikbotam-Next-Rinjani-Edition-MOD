"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addPppSecretAction } from "@/lib/actions/mikrotik-ppp";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function PppSecretModal({
  isOpen,
  onClose,
  profiles,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  profiles: any[];
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<"pppoe" | "pptp" | "l2tp" | "any">("pppoe");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await addPppSecretAction({
        name: fd.get("name") as string,
        password: fd.get("password") as string || undefined,
        service,
        profile: fd.get("profile") as string,
        remoteAddress: fd.get("remoteAddress") as string || undefined,
        comment: fd.get("comment") as string || undefined,
      });
      toast.success("PPP secret berhasil ditambahkan!");
      (e.target as HTMLFormElement).reset();
      onClose();
      onSuccess?.();
    } catch {
      toast.error("Gagal menambah PPP secret.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Tambah PPP Secret
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</Label>
              <Input name="name" required className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</Label>
              <Input name="password" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service</Label>
              <Select value={service} onValueChange={(v) => setService(v as any)}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                  <SelectItem value="pptp">PPTP</SelectItem>
                  <SelectItem value="l2tp">L2TP</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile</Label>
              <Select name="profile" required>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 rounded-xl h-10">
                  <SelectValue placeholder="Pilih Profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p[".id"]} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remote Address (opsional)</Label>
              <Input name="remoteAddress" placeholder="0.0.0.0" className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comment (opsional)</Label>
              <Input name="comment" className="bg-slate-50/50 border-slate-200" />
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
