import { prisma } from "../prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function getDashboardStats() {
  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  // 1. Count Vouchers (re_operating where keterangan = 'Success')
  const voucherCount = await prisma.transaction.count({
    where: {
      description: "Success",
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  // 2. Total Topup (re_operating where keterangan = 'topup')
  const topupSum = await prisma.transaction.aggregate({
    where: {
      description: "topup",
      date: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      topUp: true,
    },
  });

  // 3. Mutation Estimasi (st_reportdata sum pendapatan)
  const revenueSum = await prisma.report.aggregate({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      revenue: true,
    },
  });

  // 4. New Users (re_settings)
  const newUserCount = await prisma.seller.count({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return {
    voucherCount,
    totalTopup: parseFloat(topupSum._sum.topUp || "0"),
    totalRevenue: parseFloat(revenueSum._sum.revenue || "0"),
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
  const skip = (page - 1) * limit;
  const where = search 
    ? {
        OR: [
          { sellerName: { contains: search } },
          { description: { contains: search } },
          { userId: { contains: search } },
          { routerName: { contains: search } },
        ],
      }
    : {};

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
