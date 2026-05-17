"use client";

import { useState, memo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserPlus, Trash2, Key, Loader2, UserCircle, Edit2 } from "lucide-react";
import { deleteAdmin } from "@/lib/actions/admin";
import { toast, Toaster } from "sonner";
import { AdminModal } from "./admin-modal";

const AdminRow = memo(({ admin, onDelete, onEdit }: { admin: any, onDelete: (id: number) => void, onEdit: (admin: any) => void }) => (
  <TableRow className="hover:bg-slate-50/50 transition-colors group">
    <TableCell className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 group-hover:bg-emerald-500 group-hover:text-white transition-all">
          <UserCircle size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{admin.u_user}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID: #{admin.u_id}</span>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        admin.role === 'SUPERADMIN' 
        ? "bg-purple-50 text-purple-600 border-purple-100" 
        : "bg-emerald-50 text-emerald-600 border-emerald-100"
      }`}>
        {admin.role}
      </span>
    </TableCell>
    <TableCell>
      <span className="text-xs font-bold text-slate-500">{admin.status || 'Active'}</span>
    </TableCell>
    <TableCell className="text-right px-6">
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-xl text-emerald-500 border-slate-200 hover:text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all"
          onClick={() => onEdit(admin)}
        >
          <Edit2 size={14} />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-xl text-slate-400 border-slate-200 hover:text-red-600 hover:bg-red-50 shadow-sm transition-all"
          onClick={() => onDelete(admin.u_id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

AdminRow.displayName = "AdminRow";

export function AdminClientPage({ initialAdmins }: { initialAdmins: any[] }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus akun admin ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      await deleteAdmin(id);
      setAdmins(admins.filter(a => a.u_id !== id));
      toast.success("Admin berhasil dihapus.");
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus admin.");
    }
  };

  const handleEdit = (admin: any) => {
    setSelectedAdmin(admin);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedAdmin(null);
    setShowModal(true);
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex justify-end mb-6">
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20">
          <UserPlus size={16} className="mr-2" />
          Tambah Admin Baru
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck size={18} />
            </div>
            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Daftar Administrator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Admin / Username</TableHead>
                <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Role</TableHead>
                <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <AdminRow key={admin.u_id} admin={admin} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdminModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        initialData={selectedAdmin}
        onSuccess={() => window.location.reload()} 
      />
    </>
  );
}
