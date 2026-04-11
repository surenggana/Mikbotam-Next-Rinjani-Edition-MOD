"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSeller, updateSeller } from "@/lib/actions/users";
import { Loader2 } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any; // Jika ada user, maka mode EDIT
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (user) {
        // Update
        const data = Object.fromEntries(formData.entries());
        await updateSeller(user.no, data);
      } else {
        // Add
        await addSeller(formData);
      }
      onClose();
    } catch (err) {
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit Reseller" : "Tambah Reseller Baru"}</DialogTitle>
            <DialogDescription>
              Isi data reseller di bawah ini. Pastikan ID Telegram benar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sellerName">Nama Lengkap / Seller</Label>
              <Input id="sellerName" name="sellerName" defaultValue={user?.sellerName || ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userId">ID Telegram (ChatID)</Label>
              <Input id="userId" name="userId" defaultValue={user?.userId || ""} placeholder="12345678" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="balance">Saldo Awal (Opsional)</Label>
              <Input id="balance" name="balance" type="number" defaultValue={user?.balance || "0"} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              {user ? "Simpan Perubahan" : "Tambah User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
