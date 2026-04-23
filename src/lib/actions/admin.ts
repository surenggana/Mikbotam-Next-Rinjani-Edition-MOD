"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import bcrypt from "bcrypt";

export async function getAdmins() {
  const session = await auth();
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Superadmin only");
  }

  return await prisma.admin.findMany({
    orderBy: { u_id: "asc" }
  });
}

export async function createAdmin(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string || "ADMIN";

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      u_user: username,
      u_pass: hashedPassword,
      role: role,
      token: "",
      enct: "",
      lastlogin: "",
      ip: "",
      user: username,
      status: "Active"
    }
  });

  revalidatePath("/admin-management");
  return { success: true };
}

export async function deleteAdmin(id: number) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  // Jangan hapus diri sendiri
  if (id === parseInt(session.user.id)) {
    throw new Error("Cannot delete your own account");
  }

  await prisma.admin.delete({
    where: { u_id: id }
  });

  revalidatePath("/admin-management");
  return { success: true };
}

export async function updateAdmin(id: number, data: any) {
  const session = await auth();
  if (!session || (session.user as any).role !== "SUPERADMIN") {
    throw new Error("Unauthorized");
  }

  const updateData: any = {
    role: data.role,
    status: data.status
  };

  if (data.password) {
    updateData.u_pass = await bcrypt.hash(data.password, 10);
  }

  await prisma.admin.update({
    where: { u_id: id },
    data: updateData
  });

  revalidatePath("/admin-management");
  return { success: true };
}
