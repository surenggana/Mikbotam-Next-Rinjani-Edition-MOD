"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { HotspotProfileModal } from "@/components/modals/hotspot-profile-modal";
import { getHotspotProfilesAction } from "@/lib/actions/mikrotik-hotspot";
import { BookOpen, Plus, Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

export default function HotspotProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getHotspotProfilesAction();
    setProfiles(data as any[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hotspot Profiles</h1>
          <p className="text-sm font-medium text-slate-500">Kelola paket dan limitasi bandwidth user hotspot.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="rounded-xl border-slate-200 h-11 px-4">
            <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
            <Plus size={16} className="mr-2" />
            Tambah Profil
          </Button>
        </div>
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
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                  </TableCell>
                </TableRow>
              ) : profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-slate-400 text-xs font-medium italic">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <HotspotProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={load}
      />
    </div>
  );
}
