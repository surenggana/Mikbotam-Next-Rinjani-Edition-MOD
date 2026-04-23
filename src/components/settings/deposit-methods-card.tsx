"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { 
  getDepositMethods, 
  addDepositMethod, 
  deleteDepositMethod, 
  toggleDepositMethod 
} from "@/lib/actions/deposit-methods";
import { toast } from "sonner";

export function DepositMethodsCard() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await getDepositMethods();
    setMethods(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addDepositMethod({
      name: fd.get("name") as string,
      number: fd.get("number") as string,
      owner: fd.get("owner") as string,
    });
    toast.success("Metode deposit ditambahkan.");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteDepositMethod(id);
    toast.success("Metode deposit dihapus.");
    load();
  };

  const handleToggle = async (id: number, active: boolean) => {
    await toggleDepositMethod(id, !active);
    load();
  };

  return (
    <Card className="shadow-sm border-slate-200/60 overflow-hidden">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CreditCard size={18} />
          </div>
          <div>
            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Deposit Methods</CardTitle>
            <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-slate-500">
              Metode pembayaran yang muncul di bot reseller.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400">Nama Bank/E-Wallet</Label>
            <Input name="name" placeholder="BCA / Dana" required className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400">Nomor Rekening</Label>
            <Input name="number" placeholder="12345678" required className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400">Atas Nama</Label>
            <Input name="owner" placeholder="Nama Pemilik" required className="h-9 text-xs" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Plus size={14} className="mr-1" /> Tambah
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleToggle(m.id, m.active)}
                  className={m.active ? "text-emerald-600" : "text-slate-300"}
                >
                  {m.active ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </Button>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{m.number} - a/n {m.owner}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDelete(m.id)}
                className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          {methods.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400 text-xs italic font-medium">
              Belum ada metode deposit yang ditambahkan.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
