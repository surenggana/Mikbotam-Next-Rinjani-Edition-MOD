"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllRouterConfigs, addRouterConfig, deleteRouterConfig, testRouterConnection } from "@/lib/actions/settings";
import { Router, Plus, Trash2, Wifi, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RouterManagementCard() {
  const [routers, setRouters] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadRouters = () => {
    getAllRouterConfigs().then(setRouters);
  };

  useEffect(() => {
    loadRouters();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await addRouterConfig(formData);
      toast.success(`Router "${res.routerName}" berhasil ditambahkan!`);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      loadRouters();
    } catch {
      toast.error("Gagal menambahkan router.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (no: number, name: string) => {
    setDeleting(no);
    try {
      await deleteRouterConfig(no);
      toast.success(`Router "${name}" dihapus.`);
      loadRouters();
    } catch {
      toast.error("Gagal menghapus router.");
    } finally {
      setDeleting(null);
    }
  };

  const handleTest = async (e: React.MouseEvent) => {
    const form = (e.currentTarget as HTMLElement).closest("form") as HTMLFormElement;
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.routerIp) return toast.error("Isi IP address terlebih dahulu.");
    setTesting(true);
    const res = await testRouterConnection(data);
    setTesting(false);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <Card className="shadow-sm border-slate-200/60 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Router size={18} />
            </div>
            <div>
              <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">
                Router Management
              </CardTitle>
              <p className="text-[11px] font-medium uppercase tracking-tight text-slate-500 mt-0.5">
                Kelola daftar MikroTik yang terhubung
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest h-9 px-4 gap-1.5"
          >
            {showForm ? <ChevronUp size={14} /> : <Plus size={14} />}
            {showForm ? "Tutup" : "Tambah Router"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Router List */}
        {routers.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs italic font-medium">
            Belum ada router yang dikonfigurasi.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {routers.map((r) => (
              <div
                key={r.no}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Router size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">
                      {r.routerName && r.routerName !== r.no.toString() ? r.routerName : r.routerIp}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {r.routerIp}:{r.port || "8728"} · {r.routerUsername}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 border-slate-200"
                  disabled={deleting === r.no}
                  onClick={() => handleDelete(r.no, r.routerName || r.routerIp)}
                >
                  {deleting === r.no ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Router Form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="border-t border-slate-100 bg-slate-50/40 p-6 space-y-5"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Tambah Router Baru
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  IP Address / Host
                </Label>
                <Input
                  name="routerIp"
                  placeholder="192.168.1.1"
                  required
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  API Port
                </Label>
                <Input
                  name="port"
                  defaultValue="8728"
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Username
                </Label>
                <Input
                  name="routerUsername"
                  placeholder="admin"
                  required
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Password
                </Label>
                <Input
                  name="routerPassword"
                  type="password"
                  className="bg-white border-slate-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testing}
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest h-10 px-5"
              >
                {testing ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Wifi size={14} className="mr-2" />
                )}
                Uji Koneksi
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-10 px-5"
              >
                {loading ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Plus size={14} className="mr-2" />
                )}
                Simpan Router
              </Button>
            </div>
            <p className="text-[9px] text-slate-400 italic">
              Identity MikroTik akan otomatis diambil saat menyimpan router baru.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
