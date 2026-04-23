import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Telegraf } from "telegraf";

/**
 * Webhook untuk menerima notifikasi dari MikroTik (Pengganti core.php)
 * Contoh URL: /api/mikrotik/webhook?action=login&user=$user&mac=$mac-address&ip=$address&token=SECRET
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const user = searchParams.get("user");
  const mac = searchParams.get("mac");
  const ip = searchParams.get("ip");
  const token = searchParams.get("token"); // Optional security token
  const routerId = searchParams.get("routerId");

  // Ambil konfigurasi sistem berdasarkan routerId jika disediakan
  let config;
  if (routerId) {
    config = await prisma.systemConfig.findUnique({
      where: { no: parseInt(routerId) }
    });
  } else {
    config = await prisma.systemConfig.findFirst();
  }

  if (!config || !config.botToken || !config.ownerId) {
    return NextResponse.json({ error: "Sistem belum dikonfigurasi" }, { status: 500 });
  }

  // Verifikasi token jika diperlukan (bisa disesuaikan)
  // if (token !== config.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bot = new Telegraf(config.botToken);
  let message = "";

  const routerName = config.routerName || "MikroTik";

  if (action === "login") {
    message = `🔔 <b>User Login</b>\n\n` +
              `👤 User: <code>${user}</code>\n` +
              `📍 IP: <code>${ip}</code>\n` +
              `🔗 MAC: <code>${mac}</code>\n` +
              `🏢 Router: <b>${routerName}</b>`;
  } else if (action === "logout") {
    message = `🔕 <b>User Logout</b>\n\n` +
              `👤 User: <code>${user}</code>\n` +
              `📍 IP: <code>${ip}</code>\n` +
              `🏢 Router: <b>${routerName}</b>`;
  } else if (action === "expired") {
    message = `⏰ <b>Voucher Expired</b>\n\n` +
              `👤 User: <code>${user}</code>\n` +
              `🏢 Router: <b>${routerName}</b>\nTelah dihapus otomatis.`;
  }

  if (message) {
    try {
      await bot.telegram.sendMessage(config.ownerId, message, { parse_mode: "HTML" });
    } catch (err) {
      console.error("Gagal mengirim notifikasi Telegram:", err);
    }
  }

  return NextResponse.json({ status: "ok" });
}
