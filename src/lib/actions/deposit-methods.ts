"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getDepositMethods() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  return await prisma.depositMethod.findMany({
    where: { adminId },
    orderBy: { id: "asc" },
  });
}

export async function addDepositMethod(data: { name: string, number: string, owner: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const name = (data.name || "").trim();
  const number = (data.number || "").trim();
  const owner = (data.owner || "").trim();
  if (!name || !number || !owner) throw new Error("Data metode deposit tidak lengkap.");

  await prisma.depositMethod.create({
    data: {
      adminId,
      name,
      number,
      owner,
      active: true
    }
  });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteDepositMethod(id: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  await prisma.depositMethod.deleteMany({ where: { id, adminId } });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleDepositMethod(id: number, active: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  await prisma.depositMethod.updateMany({
    where: { id, adminId },
    data: { active }
  });
  revalidatePath("/dashboard/settings");
  return { success: true };
}
