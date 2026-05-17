import React, { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserClientActions } from "./user-client-actions";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

const rupiah = (amount: string | null) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(parseFloat(amount || "0"));
};

const getVoucherGroup = (settings?: string | null) => {
  try {
    return JSON.parse(settings || "{}").voucherGroup || "default";
  } catch {
    return "default";
  }
};

const UserRow = memo(({ user }: { user: any }) => (
  <TableRow key={user.no} className="hover:bg-slate-50/50 transition-colors group">
    <TableCell className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] border border-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
          {user.sellerName?.charAt(0) || 'U'}
        </div>
        <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
          {user.sellerName}
        </span>
      </div>
    </TableCell>
    <TableCell className="font-mono text-[11px] text-slate-400">{user.userId}</TableCell>
    <TableCell>
      <span className="text-slate-900 font-black tracking-tight">{rupiah(user.balance)}</span>
    </TableCell>
    <TableCell>
      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-black text-slate-600 uppercase border border-slate-200">
        {getVoucherGroup(user.settings)}
      </span>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <span className="text-slate-600 font-bold text-xs">{user.vouchersSold || 0}</span>
        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/40" 
            style={{ width: `${Math.min((parseInt(user.vouchersSold || "0") / 100) * 100, 100)}%` }} 
          />
        </div>
      </div>
    </TableCell>
    <TableCell>
      <span className={cn(
        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
        user.status === 'Active'
          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
          : user.status === 'Pending'
          ? "bg-amber-50 text-amber-600 border-amber-100"
          : "bg-red-50 text-red-600 border-red-100"
      )}>
        {user.status || 'Active'}
      </span>
    </TableCell>
    <TableCell className="text-right px-6">
      <UserClientActions user={user} mode="table-row" />
    </TableCell>
  </TableRow>
));

UserRow.displayName = "UserRow";

export function UserTable({ users }: { users: any[] }) {
  if (users.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 bg-white border border-slate-200/60 rounded-xl">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
          <SearchX size={32} />
        </div>
        <h3 className="text-base font-bold text-slate-900">Tidak ada data user</h3>
        <p className="text-xs text-slate-500 mt-1">Belum ada reseller yang terdaftar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[250px] py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Nama Seller</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">ID Telegram</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Saldo</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Group</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Voucher</TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
            <TableHead className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 px-6">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.no} user={user} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
