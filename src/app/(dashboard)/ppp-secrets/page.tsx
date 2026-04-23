"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PppSecretModal } from "@/components/modals/ppp-secret-modal";
import { getPppSecretsAction, getPppProfilesAction, removePppSecretAction, togglePppSecretAction } from "@/lib/actions/mikrotik-ppp";
import { ShieldCheck, Plus, MoreHorizontal, Trash2, ShieldOff, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";

export default function PppSecretsPage() {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      getPppSecretsAction(),
      getPppProfilesAction(),
    ]);
    setSecrets(s as any[]);
    setProfiles(p as any[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    setActionId(id);
    try {
      await removePppSecretAction(id);
      toast.success(`Secret "${name}" dihapus.`);
      load();
    } catch {
      toast.error("Gagal menghapus secret.");
    } finally {
      setActionId(null);
    }
  };

  const handleToggle = async (id: string, disabled: string, name: string) => {
    setActionId(id);
    const action = disabled === "true" ? "enable" : "disable";
    try {
      await togglePppSecretAction(id, action);
      toast.success(`Secret "${name}" ${action === "enable" ? "diaktifkan" : "dinonaktifkan"}.`);
      load();
    } catch {
      toast.error("Gagal mengubah status.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PPP Secrets</h1>
          <p className="text-sm font-medium text-slate-500">Manajemen akun PPPoE dan VPN pelanggan Anda.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="rounded-xl border-slate-200 h-11 px-4">
            <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
            <Plus size={16} className="mr-2" />
            Tambah Secret
          </Button>
        </div>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                  </TableCell>
                </TableRow>
              ) : secrets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium italic">
                    Tidak ada data PPP secret.
                  </TableCell>
                </TableRow>
              ) : (
                secrets.map((s: any) => (
                  <TableRow key={s[".id"]} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-700 py-4 px-6">{s.name}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase text-slate-400">{s.service}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary">{s.profile}</span>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-slate-500">{s["remote-address"] || "-"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        s.disabled === "true"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {s.disabled === "true" ? "Disabled" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" disabled={actionId === s[".id"]}>
                            {actionId === s[".id"] ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl">
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 cursor-pointer"
                            onClick={() => handleToggle(s[".id"], s.disabled, s.name)}
                          >
                            {s.disabled === "true"
                              ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              : <ShieldOff className="h-4 w-4 text-amber-600" />}
                            {s.disabled === "true" ? "Enable" : "Disable"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 text-red-600 cursor-pointer"
                            onClick={() => handleDelete(s[".id"], s.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
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

      <PppSecretModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        profiles={profiles}
        onSuccess={load}
      />
    </div>
  );
}
