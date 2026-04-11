import { getHotspotProfiles } from "@/lib/mikrotik/hotspot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, MoreHorizontal } from "lucide-react";

export default async function HotspotProfilesPage() {
  const profiles = await getHotspotProfiles().catch(() => []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hotspot Profiles</h1>
          <p className="text-sm font-medium text-slate-500">Kelola paket dan limitasi bandwidth user hotspot.</p>
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
              <BookOpen size={18} />
            </div>
            <CardTitle>Daftar User Profiles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Profile Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Shared Users</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Rate Limit (Rx/Tx)</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Status/Comment</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium italic">
                    Tidak ada data profil hotspot.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((prof: any) => (
                  <TableRow key={prof[".id"]} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-700 py-4 px-6">{prof.name}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-500">{prof["shared-users"] || "1"}</TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-emerald-600">{prof["rate-limit"] || "Unlimited"}</TableCell>
                    <TableCell className="text-[11px] italic text-slate-400">{prof.comment || "-"}</TableCell>
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
