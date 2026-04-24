"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Ticket, Loader2 } from "lucide-react";
import { saveVoucherPackages } from "@/lib/actions/vouchers";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const rupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(amount);
};

export function VouchersClient({ 
  initialPackages, 
  profiles 
}: { 
  initialPackages: any[], 
  profiles: any[] 
}) {
  const [packages, setPackages] = useState(initialPackages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsApproving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Form states aligned with Core.php requirements
  const [formData, setFormData] = useState({
    Voucher: "",
    profile: "",
    price: "",
    markup: "0",
    validity: "30d",
    quotaGB: "0",
    length: "6",
    type: "vc", // vc = user=pass, up = user!=pass
    typechar: "mix", // up, low, num, mix
    server: "all"
  });

  const handleOpenAdd = () => {
    setEditingIdx(null);
    setFormData({
      Voucher: "",
      profile: profiles[0]?.name || "",
      price: "",
      markup: "0",
      validity: "30d",
      quotaGB: "0",
      length: "6",
      type: "vc",
      typechar: "mix",
      server: "all"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (idx: number) => {
    const pkg = packages[idx];
    setEditingIdx(idx);
    setFormData({
      Voucher: pkg.Voucher || pkg.name || "",
      profile: pkg.profile || "",
      price: pkg.price?.toString() || "",
      markup: pkg.markup?.toString() || "0",
      validity: pkg.validity || pkg.Limit || "30d",
      quotaGB: pkg.quotaGB?.toString() || "0",
      length: pkg.length?.toString() || "6",
      type: pkg.type || "vc",
      typechar: pkg.typechar || "mix",
      server: pkg.server || "all"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (idx: number) => {
    if (!confirm("Hapus paket ini?")) return;
    const newPackages = packages.filter((_, i) => i !== idx);
    try {
      await saveVoucherPackages(newPackages);
      setPackages(newPackages);
      toast.success("Paket dihapus");
    } catch (e) {
      toast.error("Gagal menghapus paket");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApproving(true);
    
    // Core.php expected format
    const pkgData = {
      ...formData,
      id: editingIdx !== null ? packages[editingIdx].id : Date.now().toString(),
      name: formData.Voucher,
      Limit: formData.validity,
    };

    let newPackages = [...packages];
    if (editingIdx !== null) {
      newPackages[editingIdx] = pkgData;
    } else {
      newPackages.push(pkgData);
    }

    try {
      await saveVoucherPackages(newPackages);
      setPackages(newPackages);
      setIsModalOpen(false);
      toast.success(editingIdx !== null ? "Paket diperbarui" : "Paket ditambah");
    } catch (e) {
      toast.error("Gagal menyimpan paket");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Voucher & Pricing</h1>
        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={18} />
          Tambah Paket
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="text-emerald-600" size={20} />
            Daftar Paket Voucher (Bot Telegram)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Profil</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Komisi</TableHead>
                <TableHead>Dipotong</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Karakter</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 italic">
                    Belum ada paket voucher.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-semibold text-emerald-700">{pkg.Voucher || pkg.name}</TableCell>
                    <TableCell className="text-xs">{pkg.profile}</TableCell>
                    <TableCell>{rupiah(parseFloat(pkg.price))}</TableCell>
                    <TableCell className="text-emerald-600">-{rupiah(parseFloat(pkg.markup))}</TableCell>
                    <TableCell className="font-bold">{rupiah(parseFloat(pkg.price) - parseFloat(pkg.markup))}</TableCell>
                    <TableCell className="text-[10px] uppercase font-bold">{pkg.type === 'up' ? 'U != P' : 'U = P'}</TableCell>
                    <TableCell className="text-[10px] uppercase">{pkg.length} {pkg.typechar}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button onClick={() => handleOpenEdit(idx)} variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50">
                        <Edit size={14} />
                      </Button>
                      <Button onClick={() => handleDelete(idx)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIdx !== null ? "Edit Paket" : "Tambah Paket Voucher"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Voucher">Nama Paket (di Bot)</Label>
                <Input id="Voucher" value={formData.Voucher} onChange={(e) => setFormData({...formData, Voucher: e.target.value})} placeholder="1 Jam" required />
              </div>
              <div className="space-y-2">
                <Label>Profil MikroTik</Label>
                <Select value={formData.profile} onValueChange={(val) => setFormData({...formData, profile: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="Pilih profil" /></SelectTrigger>
                  <SelectContent>{profiles.map((p) => (<SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga Jual (ke User)</Label>
                <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="2000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup">Komisi Reseller</Label>
                <Input id="markup" type="number" value={formData.markup} onChange={(e) => setFormData({...formData, markup: e.target.value})} placeholder="500" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Tipe Voucher</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val || "vc"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vc">User = Password</SelectItem>
                    <SelectItem value="up">User & Password Beda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Karakter</Label>
                <Select value={formData.typechar} onValueChange={(val) => setFormData({...formData, typechar: val || "mix"})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mix">Campuran (ABC234)</SelectItem>
                    <SelectItem value="num">Angka Saja (123456)</SelectItem>
                    <SelectItem value="up">Huruf Besar (ABCDEF)</SelectItem>
                    <SelectItem value="low">Huruf Kecil (abcdef)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Panjang Karakter</Label>
                <Input id="length" type="number" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})} placeholder="6" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server">Server MikroTik</Label>
                <Input id="server" value={formData.server} onChange={(e) => setFormData({...formData, server: e.target.value})} placeholder="all" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="validity">Masa Aktif (Router)</Label>
                <Input id="validity" value={formData.validity} onChange={(e) => setFormData({...formData, validity: e.target.value})} placeholder="1h atau 1d" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotaGB">Kuota (GB) - 0=Unlimited</Label>
                <Input id="quotaGB" type="number" value={formData.quotaGB} onChange={(e) => setFormData({...formData, quotaGB: e.target.value})} placeholder="0" required />
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                SIMPAN PENGATURAN PAKET
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
