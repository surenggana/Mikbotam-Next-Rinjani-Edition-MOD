"use server";

import { prisma } from "../prisma";
import { format } from "date-fns";
import { auth } from "@/auth";

export async function topupReseller(targetUserId: string, amount: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  return await prisma.$transaction(async (tx) => {
    // 1. Get current balance
    const seller = await tx.seller.findFirst({
      where: { userId: targetUserId },
    });

    if (!seller) throw new Error("Seller tidak ditemukan");

    const currentBalance = parseFloat(seller.balance || "0");
    const newBalance = currentBalance + amount;

    // 2. Update balance
    await tx.seller.update({
      where: { no: seller.no },
      data: {
        balance: newBalance.toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    // 3. Log to re_operating
    await tx.transaction.create({
      data: {
        userId: targetUserId,
        sellerName: seller.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        topUp: amount.toString(),
        description: "topup",
        topUpFromId: session.user?.name || "Admin", // Or owner ID
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newBalance };
  });
}

export async function beliVoucher(params: {
  userId: string;
  sellerName: string;
  price: number;
  markup: number;
  username: string;
  password: string;
  expiry: string;
  status: string;
  routerName: string; // Tambahkan routerName
}) {
  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  return await prisma.$transaction(async (tx) => {
    // 1. Get current balance
    const seller = await tx.seller.findFirst({
      where: { userId: params.userId },
    });

    if (!seller) throw new Error("Seller tidak ditemukan");

    const currentBalance = parseFloat(seller.balance || "0");
    const newBalance = currentBalance - params.price;

    if (newBalance < 0) throw new Error("Saldo tidak mencukupi");

    // 2. Log to re_operating dengan Router Name yang spesifik
    await tx.transaction.create({
      data: {
        userId: params.userId,
        sellerName: params.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        voucherBuy: params.price.toString(),
        voucherMarkup: params.markup.toString(),
        voucherUsername: params.username,
        voucherPassword: params.password,
        voucherExpiry: params.expiry,
        description: params.status,
        routerName: params.routerName, // Simpan nama router
        time: timeStr,
        date: dateStr,
      },
    });

    // 3. Update seller balance and count
    await tx.seller.update({
      where: { no: seller.no },
      data: {
        balance: newBalance.toString(),
        vouchersSold: (parseInt(seller.vouchersSold || "0") + 1).toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    // 4. Record to st_reportdata if success
    if (params.status === "Success") {
      await tx.report.create({
        data: {
          userId: params.userId,
          userName: params.sellerName,
          price: params.price.toString(),
          status: params.status,
          transaction: "halo", // Same as PHP
          revenue: params.price.toString(),
          time: timeStr,
          date: dateStr,
        },
      });
    }

    return { success: true, newBalance };
  });
}
