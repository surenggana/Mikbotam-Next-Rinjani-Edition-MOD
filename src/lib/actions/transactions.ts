"use server";

import { prisma } from "../prisma";
import { format } from "date-fns";
import { auth } from "@/auth";

export async function beliVoucher(params: {
  userId: string;
  sellerName: string;
  price: number;
  markup: number;
  username: string;
  password: string;
  expiry: string;
  status: string;
  routerName: string;
  service?: "hotspot" | "ppp";
  origin?: string;
}) {
  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  return await prisma.$transaction(async (tx) => {
    // 1. Get seller (using findFirst because userId is the telegram ID)
    const seller = await tx.seller.findFirst({
      where: { userId: params.userId },
    });

    if (!seller) throw new Error("Reseller tidak ditemukan.");

    const currentBalance = parseFloat(seller.balance || "0");
    if (currentBalance < params.price) {
      throw new Error("Saldo tidak mencukupi.");
    }

    const newBalance = currentBalance - params.price;

    // 2. Update balance
    await tx.seller.update({
      where: { no: seller.no },
      data: {
        balance: newBalance.toString(),
        vouchersSold: (parseInt(seller.vouchersSold || "0") + 1).toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    // 3. Log to Transaction (re_operating)
    await tx.transaction.create({
      data: {
        adminId: seller.adminId,
        userId: params.userId,
        sellerName: params.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        voucherBuy: params.price.toString(),
        voucherUsername: params.username,
        voucherPassword: params.password,
        voucherExpiry: params.expiry,
        description: params.service === "ppp" ? "PPP Success" : "Hotspot Success",
        routerName: params.routerName,
        origin: params.origin || "BOT",
        time: timeStr,
        date: dateStr,
      },
    });

    // 4. Log to Report (st_reportdata)
    await tx.report.create({
      data: {
        adminId: seller.adminId,
        userId: params.userId,
        userName: params.sellerName,
        price: params.price.toString(),
        status: "Success",
        transaction: params.service === "ppp" ? "ppp" : "vc",
        revenue: params.price.toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newBalance };
  });
}

export async function topupReseller(targetUserId: string, amount: number, origin: string = "WEB") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  return await prisma.$transaction(async (tx) => {
    // 1. Get current balance (filtered by adminId for security)
    const seller = await tx.seller.findFirst({
      where: { userId: targetUserId, adminId },
    });

    if (!seller) throw new Error("Seller tidak ditemukan di bawah manajemen Anda.");

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
        adminId, // Record tenant ID
        userId: targetUserId,
        sellerName: seller.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        topUp: amount.toString(),
        description: "topup",
        topUpFromId: session.user?.name || "Admin",
        origin,
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newBalance };
  });
}

export async function transferBalance(senderUserId: string, targetUserId: string, amount: number) {
  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  return await prisma.$transaction(async (tx) => {
    // 1. Get sender
    const sender = await tx.seller.findFirst({
      where: { userId: senderUserId },
    });
    if (!sender) throw new Error("Akun pengirim tidak ditemukan.");

    // 2. Get receiver
    const receiver = await tx.seller.findFirst({
      where: { userId: targetUserId },
    });
    
    // VALIDASI TENANT: Pastikan penerima ada DAN satu adminId dengan pengirim
    if (!receiver || receiver.adminId !== sender.adminId) {
      throw new Error("Akun tujuan tidak ditemukan dalam grup reseller Anda.");
    }

    // 3. Check balance
    const senderBalance = parseFloat(sender.balance || "0");
    if (senderBalance < amount) throw new Error("Saldo Anda tidak mencukupi.");

    // 4. Update Sender Balance
    const newSenderBalance = senderBalance - amount;
    await tx.seller.update({
      where: { no: sender.no },
      data: {
        balance: newSenderBalance.toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    // 5. Update Receiver Balance
    const receiverBalance = parseFloat(receiver.balance || "0");
    const newReceiverBalance = receiverBalance + amount;
    await tx.seller.update({
      where: { no: receiver.no },
      data: {
        balance: newReceiverBalance.toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    // 6. Log for Sender (Transfer Out)
    await tx.transaction.create({
      data: {
        adminId: sender.adminId,
        userId: senderUserId,
        sellerName: sender.sellerName,
        balanceStart: senderBalance.toString(),
        balanceEnd: newSenderBalance.toString(),
        transferAmount: amount.toString(),
        transferToId: targetUserId,
        description: `Transfer ke ${receiver.sellerName} (${targetUserId})`,
        time: timeStr,
        date: dateStr,
      },
    });

    // 7. Log for Receiver (Transfer In)
    await tx.transaction.create({
      data: {
        adminId: receiver.adminId,
        userId: targetUserId,
        sellerName: receiver.sellerName,
        balanceStart: receiverBalance.toString(),
        balanceEnd: newReceiverBalance.toString(),
        topUp: amount.toString(),
        topUpFromId: sender.sellerName || senderUserId,
        description: `Terima saldo dari ${sender.sellerName}`,
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newSenderBalance, receiverName: receiver.sellerName };
  });
}
