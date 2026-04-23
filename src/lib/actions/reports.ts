"use server";

import { prisma } from "../prisma";
import { auth } from "@/auth";

export async function getDailyReport(date?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const targetDate = date || new Date().toISOString().split("T")[0];

  const reports = await prisma.report.findMany({
    where: { 
      date: targetDate,
      adminId: adminId
    },
    orderBy: { no: "desc" },
  });

  const totalRevenue = reports.reduce((sum, r) => sum + parseFloat(r.revenue || "0"), 0);
  const totalCount = reports.length;

  // Group by seller
  const grouped: Record<string, { userName: string; count: number; revenue: number }> = {};
  for (const r of reports) {
    const key = r.userId || "unknown";
    if (!grouped[key]) {
      grouped[key] = { userName: r.userName || "Unknown", count: 0, revenue: 0 };
    }
    grouped[key].count++;
    grouped[key].revenue += parseFloat(r.revenue || "0");
  }

  return {
    date: targetDate,
    reports,
    grouped: Object.entries(grouped).map(([userId, data]) => ({ userId, ...data })),
    totalRevenue,
    totalCount,
  };
}

export async function getMonthlyReport(month?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const reports = await prisma.report.findMany({
    where: { 
      date: { startsWith: targetMonth },
      adminId: adminId
    },
    orderBy: { no: "desc" },
  });

  // Group by date
  const byDate: Record<string, { count: number; revenue: number }> = {};
  for (const r of reports) {
    const key = r.date || "unknown";
    if (!byDate[key]) byDate[key] = { count: 0, revenue: 0 };
    byDate[key].count++;
    byDate[key].revenue += parseFloat(r.revenue || "0");
  }

  // Group by seller
  const bySeller: Record<string, { userName: string; count: number; revenue: number }> = {};
  for (const r of reports) {
    const key = r.userId || "unknown";
    if (!bySeller[key]) {
      bySeller[key] = { userName: r.userName || "Unknown", count: 0, revenue: 0 };
    }
    bySeller[key].count++;
    bySeller[key].revenue += parseFloat(r.revenue || "0");
  }

  return {
    month: targetMonth,
    totalRevenue: reports.reduce((sum, r) => sum + parseFloat(r.revenue || "0"), 0),
    totalCount: reports.length,
    byDate: Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ date, ...data })),
    bySeller: Object.entries(bySeller)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([userId, data]) => ({ userId, ...data })),
  };
}
