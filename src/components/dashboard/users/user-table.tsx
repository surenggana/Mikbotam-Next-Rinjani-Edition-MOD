import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserClientActions } from "./user-client-actions";

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
      <div className="py-20 text-center text-slate-400">
        <p>Tidak ada data user ditemukan.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="w-[250px]">Nama Seller</TableHead>
          <TableHead>ID Telegram</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Voucher Terjual</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.no} className="hover:bg-slate-50/50 transition-colors group">
            <TableCell className="font-semibold text-slate-700 group-hover:text-teal-600 transition-colors">
              {user.sellerName}
            </TableCell>
            <TableCell className="font-mono text-xs text-slate-400">{user.userId}</TableCell>
            <TableCell className="text-teal-600 font-bold">{rupiah(user.balance)}</TableCell>
            <TableCell className="text-slate-600 font-medium">{user.vouchersSold} Voc</TableCell>
            <TableCell>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                {user.status || 'Active'}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <UserClientActions user={user} mode="table-row" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
