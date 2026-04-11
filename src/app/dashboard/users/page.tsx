"use client";

import { useState, useEffect } from "react";
import { getSellers, deleteSeller } from "@/lib/actions/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Edit2, Wallet, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserModal } from "@/components/modals/user-modal";

export default function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const [data, setData] = useState<{users: any[], totalPages: number, totalCount: number} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search || "";

  useEffect(() => {
    setLoading(true);
    getSellers({ page, search }).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [page, search, isModalOpen]); // Reload data saat modal ditutup

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (no: number) => {
    if (confirm("Yakin ingin menghapus user ini? Semua riwayat transaksi user ini juga akan terpengaruh.")) {
      await deleteSeller(no);
      // Trigger reload
      setIsModalOpen(!isModalOpen); 
      setIsModalOpen(isModalOpen);
    }
  };

  const rupiah = (amount: string | null) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(parseFloat(amount || "0"));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <Button onClick={handleAdd} className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2 shadow-sm">
          <UserPlus size={18} />
          Tambah User
        </Button>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex items-center gap-4">
             <form className="relative flex-1 max-w-sm" onSubmit={(e) => {
               e.preventDefault();
               const val = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value;
               window.location.href = `/dashboard/users?search=${val}`;
             }}>
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  name="search" 
                  placeholder="Cari nama atau ID user..." 
                  className="pl-10 bg-white" 
                  defaultValue={search}
                />
             </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Mengambil data...</div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Nama Seller</TableHead>
                    <TableHead>ID Telegram</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Voucher Terjual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                        Tidak ada data user ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.users.map((user) => (
                      <TableRow key={user.no} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-700">{user.sellerName}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">{user.userId}</TableCell>
                        <TableCell className="text-teal-600 font-bold">{rupiah(user.balance)}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{user.vouchersSold} Voc</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                            {user.status || 'Active'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                                <Wallet className="h-4 w-4 text-blue-600" />
                                Topup Saldo
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(user)} className="flex items-center gap-2 cursor-pointer">
                                <Edit2 className="h-4 w-4 text-slate-600" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(user.no)} className="flex items-center gap-2 cursor-pointer text-red-600">
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
              
              {data && (
                <PaginationControls 
                  currentPage={page} 
                  totalPages={data.totalPages} 
                  totalCount={data.totalCount} 
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={selectedUser} 
      />
    </div>
  );
}
