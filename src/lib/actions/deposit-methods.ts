"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getDepositMethods() {
  return await prisma.depositMethod.findMany();
}

export async function addDepositMethod(data: { name: string, number: string, owner: string }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.depositMethod.create({
    data: {
      name: data.name,
      number: data.number,
      owner: data.owner,
      active: true
    }
  });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteDepositMethod(id: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.depositMethod.delete({ where: { id } });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleDepositMethod(id: number, active: boolean) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.depositMethod.update({
    where: { id },
    data: { active }
  });
  revalidatePath("/dashboard/settings");
  return { success: true };
}
