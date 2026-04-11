import { getHotspotUsers } from "@/lib/mikrotik/hotspot";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, MoreHorizontal, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default async function HotspotUsersPage() {
  const users = await getHotspotUsers().catch(() => []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hotspot Users</h1>
          <p className="text-sm font-medium text-slate-500">Kelola akun pengguna hotspot langsung dari router.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
          <Plus size={16} className="mr-2" />
          Tambah User
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <CardTitle>Daftar User Hotspot</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Username</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Password</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Profile</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Uptime Limit</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Status</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium italic">
                    Tidak ada data user hotspot ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user[".id"]} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-bold text-slate-700 py-4 px-6">{user.name}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-[11px]">{user.password || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-50 text-slate-600 border-slate-200">
                        {user.profile}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono font-bold text-slate-400">{user["limit-uptime"] || "Unlimited"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        user.disabled === "true" 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {user.disabled === "true" ? "Disabled" : "Enabled"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl">
                          <DropdownMenuItem className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 cursor-pointer">
                            {user.disabled === "true" ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldOff className="h-4 w-4 text-amber-600" />}
                            {user.disabled === "true" ? "Enable User" : "Disable User"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 text-red-600 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                            Hapus User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
