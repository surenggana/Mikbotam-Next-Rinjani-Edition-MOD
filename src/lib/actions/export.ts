"use server";

import { prisma } from "../prisma";
import { auth } from "@/auth";

export async function exportTransactionsToCSV() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const transactions = await prisma.transaction.findMany({
    where: { adminId: adminId },
    orderBy: { no: "desc" },
  });

  if (transactions.length === 0) return "";

  // Header CSV
  const headers = [
    "No", "User ID", "Nama Seller", "Saldo Awal", "Saldo Akhir", 
    "Voucher", "Harga", "Topup", "Keterangan", "Waktu", "Tanggal"
  ];
  
  const rows = transactions.map(t => [
    t.no,
    t.userId,
    t.sellerName,
    t.balanceStart,
    t.balanceEnd,
    t.voucherUsername || "-",
    t.voucherBuy || "0",
    t.topUp || "0",
    t.description,
    t.time,
    t.date
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return csvContent;
}
