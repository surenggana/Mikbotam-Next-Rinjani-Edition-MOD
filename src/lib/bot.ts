import { Telegraf, Markup } from "telegraf";
import { prisma } from "./prisma";
import { addHotspotUser } from "./mikrotik/hotspot";
import { generateVoucher } from "./mikrotik/generator";
import { beliVoucher, topupReseller } from "./actions/transactions";
import { getRouterStats } from "./mikrotik";

const botRegistry: Map<string, Telegraf> = new Map();

export async function attachBotLogic(bot: Telegraf, config: any) {
  let botTexts = {
    welcome: "Selamat datang di Bot MikroTik kami!",
    help: "Gunakan menu di bawah untuk mengelola akun Anda.",
    success_buy: "✅ <b>Voucher Berhasil Dibuat!</b>",
    fail_balance: "❌ <b>Maaf, saldo Anda tidak cukup.</b>"
  };

  if (config.settingsText) {
    try {
      const custom = JSON.parse(config.settingsText);
      botTexts = { ...botTexts, ...custom };
    } catch (e) {}
  }

  const mainMenu = Markup.keyboard([
    ["💰 Cek Saldo", "🎫 Menu Voucher"],
    ["📂 Mutasi", "📊 Report"],
    ["💳 Topup Saldo", "📡 Status Router"],
    ["⚙️ Bantuan"]
  ]).resize();

  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });

    if (!seller) {
      return ctx.replyWithHTML(
        "<b>Akses Ditolak!</b>\n" +
        "ID Telegram Anda belum terdaftar.\n\n" +
        "Ketik <code>/daftar</code> untuk mendaftar."
      );
    }
    return ctx.replyWithHTML(`<b>${botTexts.welcome}</b>`, mainMenu);
  });

  bot.command("daftar", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name;
    const existing = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (existing) return ctx.reply("Anda sudah terdaftar.");

    try {
      await prisma.seller.create({
        data: {
          userId: telegramId,
          sellerName: username,
          balance: "0",
          status: "Active",
          time: new Date().toLocaleTimeString(),
          date: new Date().toISOString().split("T")[0]
        }
      });
      return ctx.replyWithHTML(`✅ <b>Pendaftaran Berhasil!</b>\nID: <code>${telegramId}</code>`, mainMenu);
    } catch (err: any) { return ctx.reply(`Gagal mendaftar: ${err.message}`); }
  });

  // --- MENU VOUCHER (Adaptasi Core.php /menu) ---
  const showVoucherMenu = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Akses ditolak.");

    const voucherConfig = await prisma.voucherConfig.findFirst();
    if (!voucherConfig?.settings) return ctx.reply("Maaf, sistem tidak terdapat voucher.");

    const packages = JSON.parse(voucherConfig.settings);
    if (packages.length === 0) return ctx.reply("Belum ada paket voucher.");

    let msg = "<i>Silahkan Pilih voucher dibawah ini</i>\n\n<code>Daftar Voucher :</code>\n";
    const buttons = [];

    for (let i = 0; i < packages.length; i += 2) {
      const row = [];
      const pkg1 = packages[i];
      row.push(Markup.button.callback(`${pkg1.name}`, `buy_vcr|${i}`));
      
      if (packages[i+1]) {
        const pkg2 = packages[i+1];
        row.push(Markup.button.callback(`${pkg2.name}`, `buy_vcr|${i+1}`));
      }
      buttons.push(row);
    }

    buttons.push([
      Markup.button.callback("💰 Cek Saldo", "inline_ceksaldo"),
      Markup.button.callback("🔖 Informasi", "inline_info")
    ]);

    return ctx.replyWithHTML(msg, Markup.inlineKeyboard(buttons));
  };

  bot.hears("🎫 Menu Voucher", showVoucherMenu);
  bot.command("menu", showVoucherMenu);

  // --- CALLBACK HANDLER (Adaptasi Core.php Callback) ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    if (data.startsWith("buy_vcr|")) {
      const pkgIndex = parseInt(data.split("|")[1]);
      const voucherConfig = await prisma.voucherConfig.findFirst();
      const packages = JSON.parse(voucherConfig?.settings || "[]");
      const pkg = packages[pkgIndex];

      if (!pkg) return ctx.answerCbQuery("Paket tidak ditemukan.");

      const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
      const balance = parseFloat(seller?.balance || "0");
      const price = parseFloat(pkg.price);

      if (balance < price) {
        return ctx.replyWithHTML(botTexts.fail_balance);
      }

      await ctx.editMessageText("<code>Sedang memproses voucher...</code>", { parse_mode: "HTML" });

      try {
        const code = generateVoucher({ length: 6, type: "mix" });
        const username = code;
        const password = code;

        await beliVoucher({
          userId: telegramId,
          sellerName: seller?.sellerName || "Unknown",
          price: price,
          markup: 0,
          username: username,
          password: password,
          expiry: pkg.validity || "30d",
          status: "Success",
          routerName: config.routerName || "MikroTik"
        });

        let quotaBytes: number | undefined;
        if (pkg.quotaGB && parseFloat(pkg.quotaGB) > 0) {
          quotaBytes = Math.round(parseFloat(pkg.quotaGB) * 1024 * 1024 * 1024);
        }

        await addHotspotUser({
          server: "all",
          name: username,
          password: password,
          profile: pkg.profile,
          limitBytesIn: quotaBytes,
          limitBytesOut: quotaBytes,
          comment: `vc-bot|${seller?.sellerName}|${price}|${new Date().toLocaleDateString()}`
        });

        const caption = `<b>VOUCHER BERHASIL</b>\n\n` +
          `👤 User: <code>${username}</code>\n` +
          `🔑 Pass: <code>${password}</code>\n` +
          `📦 Profil: ${pkg.profile}\n` +
          `⏰ Masa Aktif: ${pkg.validity || "-"}\n` +
          `--------------------------\n` +
          `GUNAKAN INTERNET DENGAN BIJAK`;

        await ctx.deleteMessage();
        return ctx.replyWithHTML(caption);

      } catch (err: any) {
        return ctx.reply(`Gagal: ${err.message}`);
      }
    }

    if (data === "inline_ceksaldo") {
      const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
      const saldo = parseFloat(seller?.balance || "0");
      return ctx.answerCbQuery(`Saldo Anda: Rp ${saldo.toLocaleString("id-ID")}`, { show_alert: true });
    }
  });

  // --- PHOTO HANDLER (Adaptasi Core.php #konfirmasi) ---
  bot.on("photo", async (ctx) => {
    const caption = (ctx.message as any).caption?.toLowerCase() || "";
    if (caption.includes("#konfirmasi") || caption.includes("deposit")) {
      const telegramId = ctx.from.id.toString();
      const username = ctx.from.username || ctx.from.first_name;
      
      await ctx.reply("✅ Bukti pembayaran diterima. Admin akan segera memverifikasi. Mohon tunggu.");
      
      if (config.ownerId) {
        const photoId = (ctx.message as any).photo.pop().file_id;
        await bot.telegram.sendPhoto(config.ownerId, photoId, {
          caption: `🔔 <b>LAPOR! Konfirmasi Deposit</b>\n\n👤 Dari: @${username} (<code>${telegramId}</code>)\n📝 Keterangan: <i>${caption}</i>`,
          parse_mode: "HTML"
        });
      }
    }
  });

  bot.hears("💰 Cek Saldo", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    const saldo = parseFloat(seller.balance || "0");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>Rp ${saldo.toLocaleString("id-ID")}</b>`);
  });

  bot.hears("📡 Status Router", async (ctx) => {
    try {
      const stats = await getRouterStats();
      const msg = `📊 <b>Status Router: ${stats.routerName}</b>\n\n` +
        `🌡 CPU: ${stats.cpuLoad}%\n` +
        `🧠 RAM: ${Math.round(parseInt(stats.freeMemory) / 1024 / 1024)} MB free\n` +
        `🕒 Uptime: ${stats.uptime}\n` +
        `🛠 Version: ${stats.version}`;
      return ctx.replyWithHTML(msg);
    } catch (err) { return ctx.reply("Gagal mengambil status router."); }
  });

  bot.command("topup", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /topup [id_reseller] [jumlah]");
    try {
      const result = await topupReseller(args[1], parseFloat(args[2]));
      bot.telegram.sendMessage(args[1], `✅ Saldo ditambahkan! Sisa saldo: Rp ${result.newBalance.toLocaleString("id-ID")}`);
      return ctx.reply(`Berhasil!`);
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });
}

export async function getBotInstance(token: string) {
  if (botRegistry.has(token)) return botRegistry.get(token)!;
  const config = await prisma.systemConfig.findFirst({ where: { botToken: token } });
  if (!config) throw new Error(`Token ${token} tidak valid.`);
  const bot = new Telegraf(token);
  await attachBotLogic(bot, config);
  botRegistry.set(token, bot);
  return bot;
}

export async function getAllBots() {
  return await prisma.systemConfig.findMany({ where: { botToken: { not: null } } });
}
