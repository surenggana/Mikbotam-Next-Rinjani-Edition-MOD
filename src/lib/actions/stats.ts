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
  const topupData = await prisma.transaction.findMany({
    where: {
      description: "topup",
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { topUp: true }
  });
  const totalTopup = topupData.reduce((acc, curr) => acc + parseFloat(curr.topUp || "0"), 0);

  // 3. Mutation Estimasi (st_reportdata sum pendapatan)
  const revenueData = await prisma.report.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { revenue: true }
  });
  const totalRevenue = revenueData.reduce((acc, curr) => acc + parseFloat(curr.revenue || "0"), 0);

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
