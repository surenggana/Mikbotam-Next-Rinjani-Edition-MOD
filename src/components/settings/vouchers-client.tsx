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

const normalizeTypeChar = (typechar?: string) => {
  const map: Record<string, string> = {
    "1": "num",
    "2": "up",
    "3": "low",
    "4": "letters",
    "5": "full",
    "6": "lowNum",
    "7": "mix",
    checkCode: "full",
  };
  return map[typechar || ""] || typechar || "mix";
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
    Text_List: "",
    price: "",
    markup: "0",
    validity: "30d",
    quotaGB: "0",
    limit_download: "0",
    limit_upload: "0",
    limit_total: "0",
    prefix: "",
    grupvc: "|default|",
    Color: "729FE8",
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
      Text_List: "",
      price: "",
      markup: "0",
      validity: "30d",
      quotaGB: "0",
      limit_download: "0",
      limit_upload: "0",
      limit_total: "0",
      prefix: "",
      grupvc: "|default|",
      Color: "729FE8",
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
      Text_List: pkg.Text_List || pkg.description || pkg.Voucher || pkg.name || "",
      price: pkg.price?.toString() || "",
      markup: pkg.markup?.toString() || "0",
      validity: pkg.validity || pkg.Limit || "30d",
      quotaGB: pkg.quotaGB?.toString() || "0",
      limit_download: pkg.limit_download?.toString() || "0",
      limit_upload: pkg.limit_upload?.toString() || "0",
      limit_total: pkg.limit_total?.toString() || pkg.quotaGB?.toString() || "0",
      prefix: pkg.prefix || "",
      grupvc: pkg.grupvc || "|default|",
      Color: (pkg.Color || "729FE8").replace("#", ""),
      length: pkg.length?.toString() || "6",
      type: pkg.type === "userpass" ? "vc" : pkg.type || "vc",
      typechar: normalizeTypeChar(pkg.typechar),
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
      description: formData.Text_List || formData.Voucher,
      Limit: formData.validity,
      type: formData.type === "vc" ? "userpass" : "up",
      typechar: formData.typechar,
      quotaGB: formData.limit_total,
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Voucher & Pricing</h1>
          <p className="text-sm text-slate-500">Konfigurasi paket voucher yang akan muncul di Bot Telegram.</p>
        </div>
        <Button 
          onClick={handleOpenAdd} 
          className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus size={16} />
          Tambah Paket
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Ticket className="text-emerald-600" size={18} />
            Daftar Paket Voucher (Bot Telegram)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 px-6">Nama Paket</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Profil</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Harga Jual</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Komisi</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Dipotong</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Limit</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Group</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Mode</TableHead>
                <TableHead className="py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Karakter</TableHead>
                <TableHead className="text-right py-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-400 italic">
                    Belum ada paket voucher terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-emerald-700 px-6">{pkg.Voucher || pkg.name}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">{pkg.profile}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{rupiah(parseFloat(pkg.price))}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">-{rupiah(parseFloat(pkg.markup))}</TableCell>
                    <TableCell className="font-black text-slate-900">{rupiah(parseFloat(pkg.price) - parseFloat(pkg.markup))}</TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-500">
                      {pkg.Limit || pkg.validity || "-"} / DL {pkg.limit_download || 0} MB / UL {pkg.limit_upload || 0} MB / TOT {pkg.limit_total || pkg.quotaGB || 0} MB
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-500">{pkg.grupvc || "|default|"}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-600 uppercase border border-slate-200">
                        {pkg.type === 'up' ? 'U != P' : 'U = P'}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      <span className="inline-block size-3 rounded-sm border border-slate-200 align-middle mr-1" style={{ backgroundColor: `#${pkg.Color || "729FE8"}` }} />
                      {pkg.prefix || "-"} {pkg.length} {pkg.typechar}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => handleOpenEdit(idx)} 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-emerald-500 border-slate-200 hover:text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(idx)} 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl text-slate-400 border-slate-200 hover:text-red-600 hover:bg-red-50 shadow-sm transition-all"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[720px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
            <DialogTitle className="text-lg font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Plus className="text-primary" size={20} />
              {editingIdx !== null ? "Edit Paket Voucher" : "Tambah Paket Baru"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="Voucher" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Paket (di Bot)</Label>
                <Input id="Voucher" value={formData.Voucher} onChange={(e) => setFormData({...formData, Voucher: e.target.value})} placeholder="1 Jam" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Profil MikroTik</Label>
                <Select value={formData.profile} onValueChange={(val) => setFormData({...formData, profile: val || ""})}>
                  <SelectTrigger className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all"><SelectValue placeholder="Pilih profil" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">{profiles.map((p) => (<SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Text_List" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deskripsi / Text List</Label>
              <Input id="Text_List" value={formData.Text_List} onChange={(e) => setFormData({...formData, Text_List: e.target.value})} placeholder="Teks singkat di menu bot dan cetak voucher" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Harga Jual (ke User)</Label>
                <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="2000" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 font-bold text-emerald-600 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Komisi Reseller</Label>
                <Input id="markup" type="number" value={formData.markup} onChange={(e) => setFormData({...formData, markup: e.target.value})} placeholder="500" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 font-bold text-blue-600 focus:bg-white transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipe Voucher</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val || "vc"})}>
                  <SelectTrigger className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="vc">User = Password</SelectItem>
                    <SelectItem value="up">User & Password Beda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Karakter</Label>
                <Select value={formData.typechar} onValueChange={(val) => setFormData({...formData, typechar: val || "mix"})}>
                  <SelectTrigger className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="num">Angka Saja (1234)</SelectItem>
                    <SelectItem value="up">Huruf Besar (ABCDE)</SelectItem>
                    <SelectItem value="low">Huruf Kecil (abcd)</SelectItem>
                    <SelectItem value="letters">Huruf Besar/Kecil</SelectItem>
                    <SelectItem value="full">Huruf + Angka</SelectItem>
                    <SelectItem value="lowNum">Huruf Kecil + Angka</SelectItem>
                    <SelectItem value="mix">Huruf Besar + Angka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prefix</Label>
                <Input id="prefix" value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value})} placeholder="Opsional" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Panjang Karakter</Label>
                <Input id="length" type="number" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})} placeholder="6" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Server MikroTik</Label>
                <Input id="server" value={formData.server} onChange={(e) => setFormData({...formData, server: e.target.value})} placeholder="all" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 border-t border-slate-100 pt-5">
              <div className="space-y-2">
                <Label htmlFor="validity" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Masa Aktif (Router)</Label>
                <Input id="validity" value={formData.validity} onChange={(e) => setFormData({...formData, validity: e.target.value})} placeholder="1h atau 1d" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit_download" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Download MB</Label>
                <Input id="limit_download" type="number" value={formData.limit_download} onChange={(e) => setFormData({...formData, limit_download: e.target.value})} placeholder="0" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit_upload" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Upload MB</Label>
                <Input id="limit_upload" type="number" value={formData.limit_upload} onChange={(e) => setFormData({...formData, limit_upload: e.target.value})} placeholder="0" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit_total" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total MB</Label>
                <Input id="limit_total" type="number" value={formData.limit_total} onChange={(e) => setFormData({...formData, limit_total: e.target.value})} placeholder="0" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupvc" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Group Voucher</Label>
                <Input id="grupvc" value={formData.grupvc} onChange={(e) => setFormData({...formData, grupvc: e.target.value})} placeholder="|1|default|" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Color" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Warna Voucher</Label>
                <div className="flex gap-2">
                  <Input id="Color" value={formData.Color} onChange={(e) => setFormData({...formData, Color: e.target.value.replace("#", "")})} placeholder="729FE8" className="rounded-xl bg-slate-50/50 border-slate-200 h-11 focus:bg-white transition-all" />
                  <input type="color" value={`#${formData.Color || "729FE8"}`} onChange={(e) => setFormData({...formData, Color: e.target.value.replace("#", "")})} className="h-11 w-14 rounded-xl border border-slate-200 bg-slate-50 p-1" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 pb-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest border-slate-200">
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-200 transition-all">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan Konfigurasi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
