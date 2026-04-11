"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getSellers({
  page = 1,
  limit = 10,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const skip = (page - 1) * limit;

  const where = search 
    ? {
        OR: [
          { sellerName: { contains: search } },
          { userId: { contains: search } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.seller.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.seller.count({ where }),
  ]);

  return {
    users,
    totalPages: Math.ceil(total / limit),
    totalCount: total,
  };
}

export async function addSeller(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const userId = formData.get("userId") as string;
  const sellerName = formData.get("sellerName") as string;
  const balance = formData.get("balance") as string;
  const now = new Date();

  await prisma.seller.create({
    data: {
      userId,
      sellerName,
      balance: balance || "0",
      vouchersSold: "0",
      status: "Active",
      time: now.toLocaleTimeString(),
      date: now.toISOString().split("T")[0],
    },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function updateSeller(no: number, data: any) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.seller.update({
    where: { no },
    data,
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteSeller(no: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.seller.delete({
    where: { no },
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}
