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

  // Form states
  const [formData, setFormData] = useState({
    Voucher: "",
    name: "", // bot sometimes uses 'name' as display
    profile: "",
    price: "",
    markup: "0",
    validity: "30d",
    quotaGB: "0"
  });

  const handleOpenAdd = () => {
    setEditingIdx(null);
    setFormData({
      Voucher: "",
      name: "",
      profile: profiles[0]?.name || "",
      price: "",
      markup: "0",
      validity: "30d",
      quotaGB: "0"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (idx: number) => {
    const pkg = packages[idx];
    setEditingIdx(idx);
    setFormData({
      Voucher: pkg.Voucher || pkg.name || "",
      name: pkg.name || pkg.Voucher || "",
      profile: pkg.profile || "",
      price: pkg.price?.toString() || "",
      markup: pkg.markup?.toString() || "0",
      validity: pkg.validity || pkg.Limit || "30d",
      quotaGB: pkg.quotaGB?.toString() || "0"
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
    
    // Bot expects 'Voucher' for name, 'profile', 'price', 'markup', 'validity' (or Limit)
    const pkgData = {
      ...formData,
      Voucher: formData.Voucher,
      name: formData.Voucher,
      Limit: formData.validity, // Compatibility
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Profil MikroTik</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Markup (Profit)</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Masa Aktif</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-400 italic">
                    Belum ada paket voucher yang dikonfigurasi.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-semibold text-emerald-700">{pkg.Voucher || pkg.name}</TableCell>
                    <TableCell>{pkg.profile}</TableCell>
                    <TableCell>{rupiah(parseFloat(pkg.price))}</TableCell>
                    <TableCell className="text-emerald-600">+{rupiah(parseFloat(pkg.markup))}</TableCell>
                    <TableCell className="font-bold">
                      {rupiah(parseFloat(pkg.price) + parseFloat(pkg.markup))}
                    </TableCell>
                    <TableCell>{pkg.validity || pkg.Limit || '-'}</TableCell>
                    <TableCell>
                      {pkg.quotaGB && parseFloat(pkg.quotaGB) > 0
                        ? `${pkg.quotaGB} GB`
                        : <span className="text-slate-400 text-xs">Unlimited</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button onClick={() => handleOpenEdit(idx)} variant="outline" size="icon" className="h-8 w-8 text-emerald-600">
                        <Edit size={16} />
                      </Button>
                      <Button onClick={() => handleDelete(idx)} variant="outline" size="icon" className="h-8 w-8 text-red-600">
                        <Trash2 size={16} />
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIdx !== null ? "Edit Paket" : "Tambah Paket Voucher"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="Voucher">Nama Paket (Tampil di Bot)</Label>
              <Input 
                id="Voucher" 
                value={formData.Voucher}
                onChange={(e) => setFormData({...formData, Voucher: e.target.value})}
                placeholder="Contoh: 1 Jam" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Profil MikroTik</Label>
              <Select 
                value={formData.profile} 
                onValueChange={(val) => setFormData({...formData, profile: val || ""})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih profil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga Beli (Modal)</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="2000" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (Profit)</Label>
                <Input 
                  id="markup" 
                  type="number"
                  value={formData.markup}
                  onChange={(e) => setFormData({...formData, markup: e.target.value})}
                  placeholder="500" 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validity">Masa Aktif</Label>
                <Input 
                  id="validity" 
                  value={formData.validity}
                  onChange={(e) => setFormData({...formData, validity: e.target.value})}
                  placeholder="1d atau 30d" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotaGB">Kuota (GB) - 0 = Unlimited</Label>
                <Input 
                  id="quotaGB" 
                  type="number"
                  value={formData.quotaGB}
                  onChange={(e) => setFormData({...formData, quotaGB: e.target.value})}
                  placeholder="0" 
                  required 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Paket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
