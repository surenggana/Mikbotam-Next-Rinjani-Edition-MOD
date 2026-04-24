"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit2, Wallet, Trash2, MoreHorizontal, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserModal } from "@/components/modals/user-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteSeller, approveSeller } from "@/lib/actions/users";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserClientActionsProps {
  user?: any;
  mode: "page-header" | "table-row";
}

export function UserClientActions({ user, mode }: UserClientActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSeller(user.no);
      toast.success("User berhasil dihapus");
      router.refresh();
    } catch (error) {
      toast.error("Gagal menghapus user");
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveSeller(user.no);
      toast.success("User berhasil disetujui");
      router.refresh();
    } catch (error) {
      toast.error("Gagal menyetujui user");
    } finally {
      setIsApproving(false);
    }
  };

  if (mode === "page-header") {
    return (
      <>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-emerald-700 flex items-center gap-2 shadow-sm">
          <UserPlus size={18} />
          Tambah User
        </Button>
        <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          {user?.status === "Pending" && (
            <DropdownMenuItem 
              onClick={handleApprove} 
              disabled={isApproving}
              className="flex items-center gap-2 cursor-pointer text-emerald-600 font-bold focus:text-emerald-700 focus:bg-emerald-50"
            >
              <CheckCircle className="h-4 w-4" />
              {isApproving ? "Memproses..." : "Setujui User"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Topup Saldo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer">
            <Edit2 className="h-4 w-4 text-slate-600" />
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsConfirmOpen(true)} 
            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Hapus User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus User"
        description={`Apakah Anda yakin ingin menghapus user ${user?.sellerName}? Semua riwayat transaksi user ini juga akan terpengaruh.`}
        confirmText="Hapus"
        variant="destructive"
      />
    </>
  );
}
