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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const skip = (page - 1) * limit;

  const where: any = {
    adminId: adminId,
    ...(search ? {
      OR: [
        { sellerName: { contains: search } },
        { userId: { contains: search } },
      ],
    } : {})
  };

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
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const userId = formData.get("userId") as string;
  const sellerName = formData.get("sellerName") as string;
  const balance = formData.get("balance") as string;
  const voucherGroup = (formData.get("voucherGroup") as string) || "default";
  const now = new Date();

  await prisma.seller.create({
    data: {
      adminId,
      userId,
      sellerName,
      balance: balance || "0",
      vouchersSold: "0",
      settings: JSON.stringify({ voucherGroup }),
      status: "Active",
      time: now.toLocaleTimeString(),
      date: now.toISOString().split("T")[0],
    },
  });

  revalidatePath("/users");
  return { success: true };
}

export async function updateSeller(no: number, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  // Pastikan seller ini milik admin yang login (Security check)
  const existing = await prisma.seller.findUnique({ where: { no } });
  if (!existing || existing.adminId !== adminId) throw new Error("Akses ditolak.");

  const { voucherGroup, ...sellerData } = data;
  if (voucherGroup !== undefined) {
    let settings: any = {};
    try {
      settings = JSON.parse(existing.settings || "{}");
    } catch {}
    sellerData.settings = JSON.stringify({ ...settings, voucherGroup: voucherGroup || "default" });
  }

  await prisma.seller.update({
    where: { no },
    data: sellerData,
  });

  revalidatePath("/users");
  return { success: true };
}

export async function approveSeller(no: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const existing = await prisma.seller.findUnique({ where: { no } });
  if (!existing || existing.adminId !== adminId) throw new Error("Akses ditolak.");

  await prisma.seller.update({
    where: { no },
    data: { status: "Active" },
  });

  revalidatePath("/users");
  return { success: true };
}

export async function deleteSeller(no: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const existing = await prisma.seller.findUnique({ where: { no } });
  if (!existing || existing.adminId !== adminId) throw new Error("Akses ditolak.");

  await prisma.seller.delete({
    where: { no },
  });

  revalidatePath("/users");
  return { success: true };
}
