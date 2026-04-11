import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserClientActions } from "./user-client-actions";
import { Users, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserTableProps {
  users: any[];
}

export function UserTable({ users }: UserTableProps) {
  const rupiah = (amount: string | null) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(parseFloat(amount || "0"));
  };

  if (users.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4 border-4 border-white shadow-sm">
          <SearchX size={40} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Tidak ada data user</h3>
        <p className="text-sm text-slate-500 max-w-[250px] mt-1">
          Belum ada reseller yang terdaftar atau cobalah kata kunci pencarian lain.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px] py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Nama Seller</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">ID Telegram</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Saldo</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Voucher Terjual</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-500">Status</TableHead>
            <TableHead className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 px-6">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.no} className="hover:bg-slate-50/50 transition-colors group">
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs border border-teal-100 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                    {user.sellerName?.charAt(0) || 'U'}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-teal-600 transition-colors">
                    {user.sellerName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-slate-400">{user.userId}</TableCell>
              <TableCell>
                <span className="text-teal-600 font-black tracking-tight">{rupiah(user.balance)}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-700 font-bold text-sm">{user.vouchersSold} Voc</span>
                  <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500" 
                      style={{ width: `${Math.min((parseInt(user.vouchersSold || "0") / 100) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  user.status === 'Active' || !user.status
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {user.status || 'Active'}
                </span>
              </TableCell>
              <TableCell className="text-right px-6">
                <UserClientActions user={user} mode="table-row" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
