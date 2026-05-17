"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit2, Wallet, Trash2, MoreHorizontal, CheckCircle, ArrowDownCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserModal } from "@/components/modals/user-modal";
import { TopupModal } from "@/components/modals/topup-modal";
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
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupMode, setTopupMode] = useState<"topup" | "topdown">("topup");
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

  const openTopup = () => {
    setTopupMode("topup");
    setIsTopupOpen(true);
  };

  const openTopdown = () => {
    setTopupMode("topdown");
    setIsTopupOpen(true);
  };

  if (mode === "page-header") {
    return (
      <>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-primary hover:bg-primary/90 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <UserPlus size={16} />
          Tambah User
        </Button>
        <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {user?.status === "Pending" && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleApprove} 
            disabled={isApproving}
            className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest h-8 px-3 shadow-sm transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isApproving ? "..." : "Approve"}
          </Button>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={openTopup}
          className="rounded-xl h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest px-3 flex items-center gap-1.5"
        >
          <Wallet className="h-3.5 w-3.5" />
          Topup
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={openTopdown}
          className="rounded-xl h-8 border-amber-100 text-amber-600 hover:bg-amber-50 font-bold uppercase text-[10px] tracking-widest px-3 flex items-center gap-1.5"
        >
          <ArrowDownCircle className="h-3.5 w-3.5" />
          Tarik
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-slate-200">
            <DropdownMenuItem onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider">
              <Edit2 className="h-4 w-4 text-slate-600" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsConfirmOpen(true)} 
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 text-xs font-bold uppercase tracking-wider"
            >
              <Trash2 className="h-4 w-4" />
              Hapus User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
      />

      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        user={user}
        mode={topupMode}
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
