"use server";

import { prisma } from "../prisma";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendBotMessage } from "@/lib/bot";
import { formatIDR } from "@/lib/formatters";
import { formatToMikbotamDate } from "@/lib/mikrotik/utils";

export async function beliVoucher(params: {
  userId: string;
  adminId: number;
  sellerName: string;
  price: number; // Public Selling Price (e.g. 2000)
  markup: number; // Reseller Commission (e.g. 500)
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
    const sellerRef = await tx.seller.findFirst({
      where: { userId: params.userId, adminId: params.adminId },
      select: { no: true },
    });

    if (!sellerRef) throw new Error("Reseller tidak ditemukan.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${sellerRef.no})`;

    // 1. Get seller after the lock, so parallel purchases see the latest balance.
    const seller = await tx.seller.findUnique({
      where: { no: sellerRef.no },
    });

    if (!seller) throw new Error("Reseller tidak ditemukan.");

    // DEDUCTION: Reseller pays Admin (Price - Commission)
    const adminPrice = params.price - params.markup;
    const currentBalance = parseFloat(seller.balance || "0");
    
    if (currentBalance < adminPrice) {
      throw new Error("Saldo tidak mencukupi.");
    }

    const newBalance = currentBalance - adminPrice;

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
        voucherBuy: adminPrice.toString(), // The actual amount deducted
        voucherMarkup: params.markup.toString(), // Reseller profit
        voucherUsername: params.username,
        voucherPassword: params.password,
        voucherExpiry: params.expiry, // Duration string (e.g., 3h, 1d)
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
        price: params.price.toString(), // Public price
        status: "Success",
        transaction: params.service === "ppp" ? "ppp" : "vc",
        revenue: adminPrice.toString(), // What Admin receives
        time: timeStr,
        date: dateStr,
      },
    });

    return { success: true, newBalance };
  });
}

export async function logVoucherFailure(params: {
  userId: string;
  adminId: number;
  sellerName: string;
  price: number;
  markup: number;
  username?: string;
  password?: string;
  expiry: string;
  routerName: string;
  service?: "hotspot" | "ppp";
  origin?: string;
  errorMessage?: string;
}) {
  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  const seller = await prisma.seller.findFirst({
    where: { userId: params.userId, adminId: params.adminId },
  });

  if (!seller) throw new Error("Reseller tidak ditemukan.");

  const currentBalance = parseFloat(seller.balance || "0");
  const adminPrice = params.price - params.markup;
  const serviceName = params.service === "ppp" ? "PPP" : "Hotspot";
  const errorMessage = (params.errorMessage || "Gagal membuat voucher").slice(0, 180);

  if (params.username) {
    const existingFailure = await prisma.transaction.findFirst({
      where: {
        adminId: params.adminId,
        voucherUsername: params.username,
        description: { contains: `${serviceName} Failed` },
      },
      select: { no: true },
    });
    if (existingFailure) return { success: false, balance: currentBalance, adminPrice, skipped: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        adminId: seller.adminId,
        userId: params.userId,
        sellerName: params.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: currentBalance.toString(),
        voucherBuy: "0",
        voucherMarkup: params.markup.toString(),
        voucherUsername: params.username,
        voucherPassword: params.password,
        voucherExpiry: params.expiry,
        description: `${serviceName} Failed: ${errorMessage}`,
        routerName: params.routerName,
        origin: params.origin || "BOT",
        time: timeStr,
        date: dateStr,
      },
    });

    await tx.report.create({
      data: {
        adminId: seller.adminId,
        userId: params.userId,
        userName: params.sellerName,
        price: params.price.toString(),
        status: "Failed",
        transaction: params.service === "ppp" ? "ppp" : "vc",
        revenue: "0",
        time: timeStr,
        date: dateStr,
      },
    });
  });

  return { success: false, balance: currentBalance, adminPrice };
}

export async function topupReseller(targetUserId: string, amount: number, origin: string = "WEB", forcedAdminId?: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal topup tidak valid.");
  }

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
    const sellerRef = await tx.seller.findFirst({
      where: { userId: targetUserId, adminId },
      select: { no: true },
    });

    if (!sellerRef) throw new Error("Seller tidak ditemukan di bawah manajemen Anda.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${sellerRef.no})`;

    // 1. Get current balance (filtered by adminId for security)
    const seller = await tx.seller.findUnique({
      where: { no: sellerRef.no },
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

    return {
      success: true,
      sellerName: seller.sellerName,
      balanceStart: currentBalance,
      newBalance,
      adminName,
      time: timeStr,
      date: dateStr,
    };
  });

  // NOTIFICATION: Inform the reseller about the topup
  if (result.success) {
    const msg = 
      `✅ <b>TOPUP BERHASIL</b>\n\n` +
      `👤 Reseller: <b>${result.sellerName || "-"}</b>\n` +
      `🆔 ID Telegram: <code>${targetUserId}</code>\n` +
      `💵 Nominal Topup: <b>${formatIDR(amount)}</b>\n\n` +
      `💳 Saldo Sebelumnya: ${formatIDR(result.balanceStart)}\n` +
      `💰 Saldo Sekarang: <b>${formatIDR(result.newBalance)}</b>\n\n` +
      `📌 Status: <b>Success</b>\n` +
      `👮 Diproses oleh: ${result.adminName}\n` +
      `🕒 Waktu: ${result.date} ${result.time}\n\n` +
      `Silakan gunakan saldo untuk membeli voucher melalui /menu.`;
    
    // Non-blocking notification
    sendBotMessage(adminId, targetUserId, msg).catch(() => {});
  }

  return result;
}

// Alias for Web Dashboard Action
export async function topupResellerAction(targetUserId: string, amount: number) {
  return await topupReseller(targetUserId, amount, "WEB");
}

export async function topdownReseller(targetUserId: string, amount: number, origin: string = "WEB", forcedAdminId?: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal penarikan tidak valid.");
  }

  let adminId: number;
  let adminName = "Admin";

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
  const { time: timeStr, date: dateStr } = formatToMikbotamDate(now);

  const result = await prisma.$transaction(async (tx) => {
    const sellerRef = await tx.seller.findFirst({
      where: { userId: targetUserId, adminId },
      select: { no: true },
    });

    if (!sellerRef) throw new Error("Seller tidak ditemukan.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${sellerRef.no})`;

    // 1. Get current balance
    const seller = await tx.seller.findUnique({
      where: { no: sellerRef.no },
    });

    if (!seller) throw new Error("Seller tidak ditemukan.");

    const currentBalance = parseFloat(seller.balance || "0");
    if (currentBalance < amount) throw new Error("Saldo reseller tidak mencukupi untuk ditarik.");
    
    const newBalance = currentBalance - amount;

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
        topUp: `-${amount}`, // Negative topup means topdown
        description: "topdown",
        topUpFromId: adminName,
        origin,
        time: timeStr,
        date: dateStr,
      },
    });

    return {
      success: true,
      sellerName: seller.sellerName,
      balanceStart: currentBalance,
      newBalance,
    };
  });

  // NOTIFICATION: Inform the reseller
  if (result.success) {
    const msg = 
      `📉 <b>PENARIKAN SALDO!</b>\n\n` +
      `Halo, Admin telah menarik saldo dari akun Anda.\n\n` +
      `👤 Reseller: <b>${result.sellerName || "-"}</b>\n` +
      `💵 Jumlah: <b>${formatIDR(amount)}</b>\n` +
      `💳 Saldo Sebelumnya: ${formatIDR(result.balanceStart)}\n` +
      `💳 Saldo Sekarang: <b>${formatIDR(result.newBalance)}</b>\n` +
      `🕒 Waktu: ${timeStr} ${dateStr}`;
    
    sendBotMessage(adminId, targetUserId, msg).catch(() => {});
  }

  revalidatePath("/users");
  return result;
}

export async function transferBalance(senderUserId: string, targetUserId: string, amount: number, adminId?: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal transfer tidak valid.");
  }

  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");
  const dateStr = format(now, "yyyy-MM-dd");

  const result = await prisma.$transaction(async (tx) => {
    const senderRef = await tx.seller.findFirst({
      where: adminId ? { userId: senderUserId, adminId } : { userId: senderUserId },
      select: { no: true, adminId: true },
    });

    if (!senderRef) throw new Error("Akun pengirim tidak ditemukan.");

    // 2. Get receiver
    const receiverRef = await tx.seller.findFirst({
      where: { userId: targetUserId },
      select: { no: true, adminId: true },
    });
    
    // VALIDASI TENANT: Pastikan penerima ada DAN satu adminId dengan pengirim
    if (!receiverRef || receiverRef.adminId !== senderRef.adminId) {
      throw new Error("Akun tujuan tidak ditemukan dalam grup reseller Anda.");
    }

    for (const sellerNo of [senderRef.no, receiverRef.no].sort((a, b) => a - b)) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${sellerNo})`;
    }

    // 1. Get sender after locks.
    const sender = await tx.seller.findUnique({
      where: { no: senderRef.no },
    });
    if (!sender) throw new Error("Akun pengirim tidak ditemukan.");

    const receiver = await tx.seller.findUnique({
      where: { no: receiverRef.no },
    });
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

export async function getTopupRequests({
  page = 1,
  limit = 20,
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
        { userId: { contains: search } },
        { method: { contains: search } },
        { status: { contains: search } },
      ],
    } : {})
  };

  const [requests, total] = await Promise.all([
    prisma.topupRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.topupRequest.count({ where }),
  ]);

  return {
    requests,
    totalPages: Math.ceil(total / limit),
    totalCount: total,
  };
}
