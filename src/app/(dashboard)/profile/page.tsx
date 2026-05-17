import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, ShieldCheck, Save } from "lucide-react";
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

    revalidatePath("/profile");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Profile</h1>
        <p className="text-slate-500 text-sm">Kelola keamanan dan identitas akun dashboard Anda.</p>
      </div>

      <form action={updateProfile}>
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ShieldCheck size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Account Settings</CardTitle>
                <CardDescription className="text-[11px] font-medium uppercase tracking-tight text-slate-500">Pastikan password Anda kuat dan unik.</CardDescription>
              </div>
            </div>
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

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12">
              <Save size={18} className="mr-2" />
              Simpan Perubahan Profil
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
