"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAdmin, updateAdmin } from "@/lib/actions/admin";
import { Loader2, ShieldPlus, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function AdminModal({
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

    try {
      if (isEdit) {
        const data = {
          role: fd.get("role"),
          status: fd.get("status"),
          password: fd.get("password") || undefined, // Hanya update jika diisi
        };
        await updateAdmin(initialData.u_id, data);
        toast.success("Akun admin berhasil diperbarui!");
      } else {
        const res = await createAdmin(fd);
        if (res.success) toast.success("Akun admin baru berhasil dibuat!");
      }
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? <Edit2 className="text-emerald-600" size={20} /> : <ShieldPlus className="text-emerald-600" size={20} />}
              {isEdit ? `Edit Admin: ${initialData.u_user}` : "Daftarkan Admin Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            {!isEdit && (
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</Label>
                <Input name="username" placeholder="Masukkan username login" required className="bg-slate-50/50 border-slate-200" />
              </div>
            )}
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isEdit ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"}
              </Label>
              <Input name="password" type="password" placeholder="Masukkan password" required={!isEdit} className="bg-slate-50/50 border-slate-200" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role Akses</Label>
              <Select name="role" defaultValue={initialData?.role || "ADMIN"}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN (Tenant)</SelectItem>
                  <SelectItem value="SUPERADMIN">SUPERADMIN (Global)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Akun</Label>
                <Select name="status" defaultValue={initialData?.status || "Active"}>
                  <SelectTrigger className="bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              {isEdit ? "Simpan Perubahan" : "Buat Akun Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
