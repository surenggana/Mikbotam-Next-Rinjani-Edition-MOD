import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, ShieldLock, Save } from "lucide-react";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export default async function AdminProfilePage() {
  const session = await auth();
  const admin = await prisma.admin.findFirst({
    where: { u_user: session?.user?.name || "" }
  });

  async function updateProfile(formData: FormData) {
    "use server";
    const username = formData.get("username") as string;
    const newPassword = formData.get("password") as string;
    
    const updateData: any = { u_user: username };
    
    if (newPassword && newPassword.length >= 5) {
      updateData.u_pass = await bcrypt.hash(newPassword, 10);
    }

    const session = await auth();
    await prisma.admin.updateMany({
      where: { u_user: session?.user?.name || "" },
      data: updateData
    });

    revalidatePath("/dashboard/profile");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Profile</h1>
        <p className="text-slate-500 text-sm">Kelola keamanan dan identitas akun dashboard Anda.</p>
      </div>

      <form action={updateProfile}>
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-slate-900 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldLock size={20} className="text-teal-400" />
              Account Settings
            </CardTitle>
            <CardDescription className="text-slate-400">Pastikan password Anda kuat dan unik.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label>Username Login</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input name="username" defaultValue={admin?.u_user || ""} className="pl-10" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Password Baru (Kosongkan jika tidak ingin diubah)</Label>
              <Input name="password" type="password" placeholder="••••••••" />
              <p className="text-[10px] text-slate-400 italic">Password akan di-hash otomatis menggunakan BCrypt saat disimpan.</p>
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 h-12">
              <Save size={18} className="mr-2" />
              Simpan Perubahan Profil
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
