"use server";

import { prisma } from "../prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { auth } from "@/auth";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  // 1. Count Vouchers (milik admin ini)
  const voucherCount = await prisma.transaction.count({
    where: {
      adminId,
      description: "Success",
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  // 2. Total Topup (milik admin ini)
  const topupData = await prisma.transaction.findMany({
    where: {
      adminId,
      description: "topup",
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { topUp: true }
  });
  const totalTopup = topupData.reduce((acc, curr) => acc + parseFloat(curr.topUp || "0"), 0);

  // 3. Mutation Estimasi (milik admin ini)
  const revenueData = await prisma.report.findMany({
    where: {
      adminId,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { revenue: true }
  });
  const totalRevenue = revenueData.reduce((acc, curr) => acc + parseFloat(curr.revenue || "0"), 0);

  // 4. New Users (milik admin ini)
  const newUserCount = await prisma.seller.count({
    where: {
      adminId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return {
    voucherCount,
    totalTopup,
    totalRevenue,
    newUserCount,
  };
}

export async function getRecentTransactions({
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
    adminId,
    ...(search ? {
      OR: [
        { sellerName: { contains: search } },
        { description: { contains: search } },
        { userId: { contains: search } },
        { routerName: { contains: search } },
      ],
    } : {})
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    totalPages: Math.ceil(total / limit),
    totalCount: total,
  };
}
