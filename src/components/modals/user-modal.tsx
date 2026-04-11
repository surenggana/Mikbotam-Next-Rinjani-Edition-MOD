"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addSeller, updateSeller } from "@/lib/actions/users";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const userSchema = z.object({
  sellerName: z.string().min(3, "Nama minimal 3 karakter"),
  userId: z.string().min(5, "ID Telegram minimal 5 karakter"),
  balance: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Saldo harus berupa angka",
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const router = useRouter();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      sellerName: user?.sellerName || "",
      userId: user?.userId || "",
      balance: user?.balance?.toString() || "0",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: UserFormValues) => {
    try {
      const payload = {
        ...values,
        balance: parseFloat(values.balance),
      };
      
      if (user) {
        await updateSeller(user.no, payload);
        toast.success("User berhasil diperbarui");
      } else {
        const formData = new FormData();
        formData.append("sellerName", payload.sellerName);
        formData.append("userId", payload.userId);
        formData.append("balance", payload.balance.toString());
        await addSeller(formData);
        toast.success("User berhasil ditambahkan");
      }
      router.refresh();
      onClose();
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{user ? "Edit Reseller" : "Tambah Reseller Baru"}</DialogTitle>
              <DialogDescription>
                Isi data reseller di bawah ini. Pastikan ID Telegram benar.
              </DialogDescription>
            </DialogHeader>
            
            <FormField
              control={form.control}
              name="sellerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap / Seller</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Budi Sudarsono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Telegram (ChatID)</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Awal (Opsional)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                {user ? "Simpan Perubahan" : "Tambah User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
