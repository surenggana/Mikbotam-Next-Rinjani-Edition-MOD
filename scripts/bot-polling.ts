// @ts-nocheck
const { Telegraf } = require("telegraf");
const { PrismaClient } = require("../src/generated/client/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

function initializePrisma() {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/mikbotam.db';
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  
  return new PrismaClient({ adapter });
}

const prisma = initializePrisma();

async function startMultiBotPolling() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { 
        botToken: { not: null },
        status: { not: "Inactive" }
      }
    });

    if (configs.length === 0) {
      console.log("Tidak ada bot yang aktif di database.");
      process.exit(0);
    }

    console.log(`Ditemukan ${configs.length} bot. Meluncurkan polling...`);

    for (const config of configs) {
      const bot = new Telegraf(config.botToken);
      const routerName = config.routerName || "Unknown Router";

      // Logika Bot (Cukup satu set logika untuk semua bot)
      bot.start((ctx) => ctx.reply(`Bot Aktif (Polling)!\nRouter: ${routerName}`));
      
      bot.command("cek_saldo", async (ctx) => {
        const telegramId = ctx.from.id.toString();
        const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
        if (!seller) return ctx.reply("Anda belum terdaftar.");
        const saldo = parseFloat(seller.balance || "0");
        return ctx.reply(`Saldo Anda: Rp ${saldo.toLocaleString("id-ID")}\nRouter: ${routerName}`);
      });

      // Launch bot
      bot.launch().then(() => {
        console.log(`[STARTED] Bot: @${config.botUsername || config.id} | Router: ${routerName}`);
      }).catch((err) => {
        console.error(`[ERROR] Gagal menjalankan bot @${config.id}:`, err.message);
      });

      // Enable graceful stop per bot
      process.once("SIGINT", () => bot.stop("SIGINT"));
      process.once("SIGTERM", () => bot.stop("SIGTERM"));
    }

  } catch (error) {
    console.error("Gagal menjalankan polling:", error);
  }
}

startMultiBotPolling();
