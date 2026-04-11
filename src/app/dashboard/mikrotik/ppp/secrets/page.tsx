import { getPppSecrets } from "@/lib/mikrotik/ppp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PppSecretsPage() {
  const secrets = await getPppSecrets().catch(() => []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PPP Secrets</h1>
          <p className="text-sm font-medium text-slate-500">Manajemen akun PPPoE dan VPN pelanggan Anda.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
          <Plus size={16} className="mr-2" />
          Tambah Secret
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck size={18} />
            </div>
            <CardTitle>Daftar Pelanggan PPP</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Username</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Service</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Profile</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Remote Address</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Status</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium italic">
                    Tidak ada data PPP secret.
                  </TableCell>
                </TableRow>
              ) : (
                secrets.map((secret: any) => (
                  <TableRow key={secret[".id"]} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-700 py-4 px-6">{secret.name}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase text-slate-400">{secret.service}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary">{secret.profile}</span>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-slate-500">{secret["remote-address"] || "-"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        secret.disabled === "true" 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {secret.disabled === "true" ? "Disabled" : "Active"}
                      </span>
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
