"use server";

import { prisma } from "../prisma";
import { format } from "date-fns";
import { auth } from "@/auth";
import { sendBotMessage } from "@/lib/bot";
import { formatIDR } from "@/lib/formatters";

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
    // 1. Get seller
    const seller = await tx.seller.findFirst({
      where: { userId: params.userId },
    });

    if (!seller) throw new Error("Reseller tidak ditemukan.");

    const totalPrice = params.price + params.markup;
    const currentBalance = parseFloat(seller.balance || "0");
    if (currentBalance < totalPrice) {
      throw new Error("Saldo tidak mencukupi.");
    }

    const newBalance = currentBalance - totalPrice;

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
        voucherMarkup: params.markup.toString(), // Record the profit!
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
        price: totalPrice.toString(),
        status: "Success",
        transaction: params.service === "ppp" ? "ppp" : "vc",
        revenue: totalPrice.toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newBalance };
  });
}

export async function topupReseller(targetUserId: string, amount: number, origin: string = "WEB", forcedAdminId?: number) {
  let adminId: number;
  let adminName: string = "Admin";

  if (forcedAdminId) {
    adminId = forcedAdminId;
    adminName = "Bot Admin";
  } else {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    adminId = parseInt(session.user.id);
    adminName = session.user.name || "Admin";
  }

  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  const result = await prisma.$transaction(async (tx) => {
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
        adminId, 
        userId: targetUserId,
        sellerName: seller.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        topUp: amount.toString(),
        description: "topup",
        topUpFromId: adminName,
        origin,
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newBalance };
  });

  // NOTIFICATION: Inform the reseller about the topup
  if (result.success) {
    const msg = 
      `💰 <b>SALDO DITAMBAHKAN!</b>\n\n` +
      `Halo, Admin telah menambahkan saldo ke akun Anda.\n\n` +
      `💵 Jumlah: <b>${formatIDR(amount)}</b>\n` +
      `💳 Saldo Sekarang: <b>${formatIDR(result.newBalance)}</b>\n` +
      `🕒 Waktu: ${timeStr} ${dateStr}\n\n` +
      `Terima kasih telah bergabung!`;
    
    // Non-blocking notification
    sendBotMessage(adminId, targetUserId, msg).catch(() => {});
  }

  return result;
}

// Alias for Web Dashboard Action
export async function topupResellerAction(targetUserId: string, amount: number) {
  return await topupReseller(targetUserId, amount, "WEB");
}

export async function transferBalance(senderUserId: string, targetUserId: string, amount: number) {
  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  const result = await prisma.$transaction(async (tx) => {
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

    return { 
      success: true, 
      newSenderBalance, 
      newReceiverBalance,
      senderName: sender.sellerName,
      receiverName: receiver.sellerName,
      adminId: sender.adminId
    };
  });

  // NOTIFICATION: Inform both parties about the transfer
  if (result.success && result.adminId) {
    // Notify Sender
    const senderMsg = 
      `💸 <b>TRANSFER BERHASIL!</b>\n\n` +
      `Ke: <b>${result.receiverName}</b> (<code>${targetUserId}</code>)\n` +
      `Jumlah: <b>${formatIDR(amount)}</b>\n` +
      `Sisa Saldo: <b>${formatIDR(result.newSenderBalance)}</b>`;
    
    sendBotMessage(result.adminId, senderUserId, senderMsg).catch(() => {});

    // Notify Receiver
    const receiverMsg = 
      `📩 <b>SALDO DITERIMA!</b>\n\n` +
      `Dari: <b>${result.senderName}</b> (<code>${senderUserId}</code>)\n` +
      `Jumlah: <b>${formatIDR(amount)}</b>\n` +
      `Saldo Sekarang: <b>${formatIDR(result.newReceiverBalance)}</b>`;

    sendBotMessage(result.adminId, targetUserId, receiverMsg).catch(() => {});
  }

  return result;
}
