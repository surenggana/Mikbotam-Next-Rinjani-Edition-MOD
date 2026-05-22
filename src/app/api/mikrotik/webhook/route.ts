import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Telegraf } from "telegraf";
import { parseMikrotikDuration, formatToMikbotamDate } from "@/lib/mikrotik/utils";

type MikbotamCallback = {
  idtelegram?: string | null;
  status?: string | null;
  info?: string | null;
  routerId?: string | null;
};

type NotificationTarget = "legacy" | "reseller" | "admin" | "both" | "none";

function parseCallbackInfo(info?: string | null) {
  const parts = (info || "").split("|");
  return {
    user: parts[0] || "",
    voucher: parts[1] || "",
    mac: parts[2] || "",
    reseller: parts[3] || "",
    startTime: parts[4] || "",
    startDate: parts[5] || "",
    endTime: parts[6] || "",
    endDate: parts[7] || "",
    rmcde: parts.slice(8).join("|") || "",
  };
}

function shouldBroadcast(rmcde: string, index: number, fallback = true) {
  if (!rmcde) return fallback;
  return rmcde[index] === "1";
}

function getNotificationTarget(settings?: string | null): NotificationTarget {
  if (!settings) return "legacy";

  try {
    const parsed = JSON.parse(settings);
    const target = parsed?.voucherLoginNotificationTarget;
    return ["legacy", "reseller", "admin", "both", "none"].includes(target) ? target : "legacy";
  } catch {
    return "legacy";
  }
}

async function readPostPayload(req: NextRequest): Promise<MikbotamCallback> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await req.json();
  }

  const raw = await req.text();
  const params = new URLSearchParams(raw);
  return {
    idtelegram: params.get("idtelegram"),
    status: params.get("status"),
    info: params.get("info"),
    routerId: params.get("routerId"),
  };
}

async function getConfig(routerId?: string | null, adminId?: number | null) {
  if (routerId) {
    const byRouter = await prisma.systemConfig.findUnique({
      where: { no: parseInt(routerId, 10) },
    });
    if (byRouter) return byRouter;
  }

  if (adminId) {
    const byAdmin = await prisma.systemConfig.findFirst({ where: { adminId } });
    if (byAdmin) return byAdmin;
  }

  return await prisma.systemConfig.findFirst();
}

async function findVoucherTransaction(user: string, adminId?: number | null) {
  const where: any = {
    voucherUsername: user,
    description: { not: { contains: "Failed" } },
  };

  if (adminId) where.adminId = adminId;

  return await prisma.transaction.findFirst({
    where,
    orderBy: { no: "desc" },
  });
}

async function sendTelegram(bot: Telegraf, chatId: string | number | null | undefined, message: string) {
  if (!chatId) return;
  if (!message.trim()) return;
  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (err) {
    console.error(`Gagal mengirim notifikasi Telegram ke ${chatId}:`, err);
  }
}

async function sendVoucherNotification({
  bot,
  config,
  resellerChatId,
  rmcde,
  message,
}: {
  bot: Telegraf;
  config: Awaited<ReturnType<typeof getConfig>>;
  resellerChatId: string | number | null | undefined;
  rmcde: string;
  message: string;
}) {
  const target = getNotificationTarget(config?.settings);
  const chatIds = new Set<string>();

  if (target === "legacy") {
    if (shouldBroadcast(rmcde, 3, true) && resellerChatId) chatIds.add(String(resellerChatId));
    if (shouldBroadcast(rmcde, 0, false) && config?.ownerId) chatIds.add(String(config.ownerId));
  } else if (target === "reseller") {
    if (resellerChatId) chatIds.add(String(resellerChatId));
  } else if (target === "admin") {
    if (config?.ownerId) chatIds.add(String(config.ownerId));
  } else if (target === "both") {
    if (resellerChatId) chatIds.add(String(resellerChatId));
    if (config?.ownerId) chatIds.add(String(config.ownerId));
  }

  for (const chatId of chatIds) {
    await sendTelegram(bot, chatId, message);
  }
}

async function handleMikbotamStatus(payload: MikbotamCallback) {
  const status = (payload.status || "").toLowerCase();
  const parsed = parseCallbackInfo(payload.info);

  if (!parsed.user || !["start", "expired"].includes(status)) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const routerConfig = payload.routerId ? await getConfig(payload.routerId) : null;
  const transaction = await findVoucherTransaction(parsed.user, routerConfig?.adminId);
  const config = routerConfig || await getConfig(null, transaction?.adminId);
  if (!config || !config.botToken) {
    return NextResponse.json({ error: "Sistem belum dikonfigurasi" }, { status: 500 });
  }

  if (!transaction) {
    return NextResponse.json({ status: "ignored", reason: "Transaksi voucher tidak ditemukan" });
  }

  const bot = new Telegraf(config.botToken);
  const routerName = config.routerName || transaction?.routerName || "MikroTik";
  const resellerKey = payload.idtelegram || parsed.reseller || transaction?.sellerName || "";
  const seller = resellerKey
    ? await prisma.seller.findFirst({
        where: {
          adminId: transaction?.adminId || config.adminId || undefined,
          OR: [{ sellerName: resellerKey }, { userId: resellerKey }],
        },
      })
    : null;

  if (status === "start") {
    const updateResult = await prisma.transaction.updateMany({
      where: { no: transaction.no, useTime: null },
      data: {
        useTime: `${parsed.startDate} ${parsed.startTime}`.trim(),
        expiredTime: `${parsed.endDate} ${parsed.endTime}`.trim(),
        description: "Hotspot Active",
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ status: "ok", duplicate: true });
    }

    const message =
      `🔔 <b>VOUCHER MULAI DIPAKAI</b>\n\n` +
      `👤 User: <code>${parsed.user}</code>\n` +
      `📦 Paket: <b>${parsed.voucher || "-"}</b>\n` +
      `🔗 MAC: <code>${parsed.mac || "-"}</code>\n` +
      `👥 Seller: <b>${seller?.sellerName || parsed.reseller || "-"}</b>\n` +
      `▶️ Mulai: <b>${parsed.startDate || "-"} ${parsed.startTime || "-"}</b>\n` +
      `⏰ Expired: <b>${parsed.endDate || "-"} ${parsed.endTime || "-"}</b>\n` +
      `🏢 Router: <b>${routerName}</b>`;

    await sendVoucherNotification({
      bot,
      config,
      resellerChatId: seller?.userId || resellerKey,
      rmcde: parsed.rmcde,
      message,
    });
  }

  if (status === "expired") {
    const updateResult = await prisma.transaction.updateMany({
      where: { no: transaction.no, description: { not: "Hotspot Expired" } },
      data: { description: "Hotspot Expired" },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ status: "ok", duplicate: true });
    }

    const message =
      `⏰ <b>VOUCHER EXPIRED</b>\n\n` +
      `👤 User: <code>${parsed.user}</code>\n` +
      `📦 Paket: <b>${parsed.voucher || "-"}</b>\n` +
      `👥 Seller: <b>${seller?.sellerName || parsed.reseller || "-"}</b>\n` +
      `📌 Status: <b>${parsed.rmcde[1] === "1" ? "Masuk masa tenggat / hapus otomatis" : "User dinonaktifkan"}</b>\n` +
      `🏢 Router: <b>${routerName}</b>`;

    await sendVoucherNotification({
      bot,
      config,
      resellerChatId: seller?.userId || resellerKey,
      rmcde: parsed.rmcde,
      message,
    });
  }

  return NextResponse.json({ status: "ok" });
}

/**
 * Webhook MikroTik:
 * - GET lama: /api/mikrotik/webhook?action=login&user=$user&mac=...&ip=...
 * - POST Mikbotam: idtelegram=<seller>&status=start|expired&info=user|voucher|mac|seller|...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const user = searchParams.get("user");
  const mac = searchParams.get("mac");
  const ip = searchParams.get("ip");
  const routerId = searchParams.get("routerId");

  if (searchParams.get("status")) {
    return handleMikbotamStatus({
      idtelegram: searchParams.get("idtelegram"),
      status: searchParams.get("status"),
      info: searchParams.get("info"),
      routerId,
    });
  }

  const routerConfig = routerId ? await getConfig(routerId) : null;
  const transaction = user ? await findVoucherTransaction(user, routerConfig?.adminId) : null;
  const config = routerConfig || await getConfig(null, transaction?.adminId);
  if (!config || !config.botToken || !config.ownerId) {
    return NextResponse.json({ error: "Sistem belum dikonfigurasi" }, { status: 500 });
  }

  const bot = new Telegraf(config.botToken);
  let message = "";
  const routerName = config.routerName || "MikroTik";

  if (action === "login") {
    const now = new Date();
    const { time, date } = formatToMikbotamDate(now);

    if (transaction && !transaction.useTime) {
      let expiredStr = "";
      if (transaction.voucherExpiry) {
        const seconds = parseMikrotikDuration(transaction.voucherExpiry);
        if (seconds > 0) {
          const expDate = new Date(now.getTime() + seconds * 1000);
          const { time: eTime, date: eDate } = formatToMikbotamDate(expDate);
          expiredStr = `${eDate} ${eTime}`;
        }
      }

      await prisma.transaction.update({
        where: { no: transaction.no },
        data: {
          useTime: `${date} ${time}`,
          expiredTime: expiredStr || "Session",
        },
      });
    }

    // Notifikasi login dinonaktifkan
    message = "";
  } else if (action === "logout") {
    // Notifikasi logout dinonaktifkan
    message = "";
  } else if (action === "expired") {
    message =
      `⏰ <b>Voucher Expired</b>\n\n` +
      `👤 User: <code>${user}</code>\n` +
      `🏢 Router: <b>${routerName}</b>\nTelah dihapus otomatis.`;
  }

  await sendTelegram(bot, config.ownerId, message);
  return NextResponse.json({ status: "ok" });
}

export async function POST(req: NextRequest) {
  return handleMikbotamStatus(await readPostPayload(req));
}
