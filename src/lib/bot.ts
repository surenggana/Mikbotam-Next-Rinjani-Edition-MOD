import { Telegraf } from "telegraf";
import { prisma } from "./prisma";

// Map untuk menyimpan instance bot yang sedang berjalan agar tidak duplikat
const botRegistry: Map<string, Telegraf> = new Map();

export async function getBotInstance(token: string) {
  if (botRegistry.has(token)) {
    return botRegistry.get(token)!;
  }

  const config = await prisma.systemConfig.findFirst({
    where: { botToken: token }
  });

  if (!config) {
    throw new Error(`Konfigurasi untuk bot token ${token} tidak ditemukan.`);
  }

  const bot = new Telegraf(token);

  // LOGIKA BOT (Sama untuk semua bot)
  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({
      where: { userId: telegramId },
    });

    if (!seller) {
      return ctx.replyWithHTML("<b>Selamat datang!</b>\nAnda belum terdaftar di sistem ini.");
    }

    return ctx.replyWithHTML(
      `Halo @${ctx.from.username || ctx.from.first_name}, Anda terhubung ke Router: <b>${config.routerName}</b>\nKetik /help untuk bantuan.`
    );
  });

  bot.command("cek_saldo", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({
      where: { userId: telegramId },
    });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    const saldo = parseFloat(seller.balance || "0");
    return ctx.replyWithHTML(`Saldo Anda: <b>Rp ${saldo.toLocaleString("id-ID")}</b>`);
  });

  // Tambahkan perintah lainnya di sini...

  botRegistry.set(token, bot);
  return bot;
}

export async function getAllBots() {
  const configs = await prisma.systemConfig.findMany({
    where: { 
      botToken: { not: null }
    }
  });
  return configs;
}
