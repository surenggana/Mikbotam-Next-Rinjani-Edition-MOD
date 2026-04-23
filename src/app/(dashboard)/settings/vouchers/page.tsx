import { prisma } from "@/lib/prisma";
import { getHotspotProfiles } from "@/lib/mikrotik/hotspot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Ticket } from "lucide-react";
import { auth } from "@/auth";

export default async function VouchersSettingsPage() {
  const session = await auth();
  if (!session) return null;

  // Ambil profil dari router untuk dropdown nanti
  const profiles = await getHotspotProfiles().catch(() => []);
  
  // Ambil data voucher yang tersimpan (Scoping per adminId)
  const adminId = parseInt(session?.user?.id || "0");
  const voucherConfig = await prisma.voucherConfig.findFirst({
    where: { adminId }
  });
  let packages: any[] = [];
  try {
    packages = voucherConfig?.settings ? JSON.parse(voucherConfig.settings) : [];
  } catch(e) { packages = []; }

  const rupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Voucher & Pricing</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
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
                    <TableCell className="font-semibold text-emerald-700">{pkg.Voucher}</TableCell>
                    <TableCell>{pkg.profile}</TableCell>
                    <TableCell>{rupiah(parseFloat(pkg.price))}</TableCell>
                    <TableCell className="text-emerald-600">+{rupiah(parseFloat(pkg.markup))}</TableCell>
                    <TableCell className="font-bold">
                      {rupiah(parseFloat(pkg.price) + parseFloat(pkg.markup))}
                    </TableCell>
                    <TableCell>{pkg.Limit || '-'}</TableCell>
                    <TableCell>
                      {pkg.quotaGB && parseFloat(pkg.quotaGB) > 0
                        ? `${pkg.quotaGB} GB`
                        : <span className="text-slate-400 text-xs">Unlimited</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-emerald-600">
                        <Edit size={16} />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-600">
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

      <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-md">
        <div className="flex items-center gap-3">
          <Info className="text-emerald-500" size={20} />
          <p className="text-sm text-emerald-700">
            <strong>Tips:</strong> Pastikan nama <strong>Profil MikroTik</strong> sama persis dengan yang ada di Winbox agar pembuatan voucher tidak gagal.
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
