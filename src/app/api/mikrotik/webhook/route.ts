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

async function sendTelegram(bot: Telegraf, chatId: string | number | null | undefined, message: string) {
  if (!chatId) return;
  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (err) {
    console.error(`Gagal mengirim notifikasi Telegram ke ${chatId}:`, err);
  }
}

async function handleMikbotamStatus(payload: MikbotamCallback) {
  const status = (payload.status || "").toLowerCase();
  const parsed = parseCallbackInfo(payload.info);

  if (!parsed.user || !["start", "expired"].includes(status)) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { voucherUsername: parsed.user },
    orderBy: { no: "desc" },
  });

  const config = await getConfig(payload.routerId, transaction?.adminId);
  if (!config || !config.botToken) {
    return NextResponse.json({ error: "Sistem belum dikonfigurasi" }, { status: 500 });
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
    await prisma.transaction.updateMany({
      where: { voucherUsername: parsed.user, useTime: null },
      data: {
        useTime: `${parsed.startDate} ${parsed.startTime}`.trim(),
        expiredTime: `${parsed.endDate} ${parsed.endTime}`.trim(),
        description: "Hotspot Active",
      },
    });

    // Notifikasi voucher mulai dipakai dinonaktifkan atas permintaan user
  }

  if (status === "expired") {
    await prisma.transaction.updateMany({
      where: { voucherUsername: parsed.user },
      data: { description: "Hotspot Expired" },
    });

    const message =
      `⏰ <b>VOUCHER EXPIRED</b>\n\n` +
      `👤 User: <code>${parsed.user}</code>\n` +
      `📦 Paket: <b>${parsed.voucher || "-"}</b>\n` +
      `👥 Seller: <b>${seller?.sellerName || parsed.reseller || "-"}</b>\n` +
      `📌 Status: <b>${parsed.rmcde[1] === "1" ? "Masuk masa tenggat / hapus otomatis" : "User dinonaktifkan"}</b>\n` +
      `🏢 Router: <b>${routerName}</b>`;

    if (shouldBroadcast(parsed.rmcde, 3, true)) {
      await sendTelegram(bot, seller?.userId || resellerKey, message);
    }
    if (shouldBroadcast(parsed.rmcde, 0, false)) {
      await sendTelegram(bot, config.ownerId, message);
    }
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

  const transaction = user
    ? await prisma.transaction.findFirst({
        where: { voucherUsername: user },
        orderBy: { no: "desc" },
      })
    : null;

  const config = await getConfig(routerId, transaction?.adminId);
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
