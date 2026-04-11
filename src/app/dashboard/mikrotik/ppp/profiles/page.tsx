import { getPppProfiles } from "@/lib/mikrotik/ppp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Settings, Plus, MoreHorizontal } from "lucide-react";

export default async function PppProfilesPage() {
  const profiles = await getPppProfiles().catch(() => []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PPP Profiles</h1>
          <p className="text-sm font-medium text-slate-500">Konfigurasi profil layanan untuk pelanggan PPPoE dan VPN.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
          <Plus size={16} className="mr-2" />
          Tambah Profil
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings size={18} />
            </div>
            <CardTitle>Daftar User Profiles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Profile Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Local Address</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Remote Address</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Rate Limit</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium italic">
                    Tidak ada data profil PPP.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((prof: any) => (
                  <TableRow key={prof[".id"]} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-700 py-4 px-6">{prof.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{prof["local-address"] || "-"}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500">{prof["remote-address"] || "-"}</TableCell>
                    <TableCell>
                      <span className="text-[11px] font-mono font-bold text-emerald-600">{prof["rate-limit"] || "Unlimited"}</span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                        <MoreHorizontal size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
