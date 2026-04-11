"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addHotspotUser } from "@/lib/mikrotik/hotspot";
import { Loader2 } from "lucide-react";

export function HotspotUserModal({ isOpen, onClose, profiles }: { isOpen: boolean, onClose: () => void, profiles: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await addHotspotUser({
        server: "all",
        name: formData.get("name") as string,
        password: formData.get("password") as string,
        profile: formData.get("profile") as string,
        limitUptime: formData.get("limitUptime") as string,
      });
      onClose();
      window.location.reload();
    } catch (err) {
      alert("Gagal menambah user hotspot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah User Hotspot</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input name="name" required />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input name="password" type="text" />
            </div>
            <div className="grid gap-2">
              <Label>Profile</Label>
              <Select name="profile" required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Profil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p[".id"]} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Limit Uptime (Contoh: 1h, 1d)</Label>
              <Input name="limitUptime" placeholder="30d" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading && <Loader2 className="animate-spin mr-2" size={16} />}
              Simpan ke Router
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
