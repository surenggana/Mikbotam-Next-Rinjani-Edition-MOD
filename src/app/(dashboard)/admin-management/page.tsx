import { getAdmins } from "@/lib/actions/admin";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldAlert, UserPlus, ShieldCheck, Trash2, Key } from "lucide-react";
import { AdminClientPage } from "./admin-client-page";

export default async function AdminManagementPage() {
  const session = await auth();

  // Proteksi Halaman: Hanya Superadmin
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    redirect("/");
  }

  const admins = await getAdmins();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-emerald-600" size={32} />
            Admin Management
          </h1>
          <p className="text-sm font-medium text-slate-500">Kelola akun administrator dan hak akses tenant.</p>
        </div>
      </div>

      <AdminClientPage initialAdmins={admins} />
    </div>
  );
}
