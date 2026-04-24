import { Telegraf, Markup } from "telegraf";
import { prisma } from "./prisma";
import { addHotspotUser } from "./mikrotik/hotspot";
import { generateVoucher } from "./mikrotik/generator";
import { beliVoucher, topupReseller, transferBalance } from "./actions/transactions";
import { getRouterStats } from "./mikrotik";
import { formatIDR } from "./formatters";

const botRegistry: Map<string, Telegraf> = new Map();
const transferStates: Map<string, { targetId: string; targetName: string; amount?: number }> = new Map();
const topupStates: Map<string, { amount?: number }> = new Map();

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
    ["💸 Transfer Saldo", "💳 Request Topup"],
    ["📡 Status Router", "⚙️ Bantuan"]
  ]).resize();

  // --- MIDDLEWARE: Check User Registration ---
  bot.use(async (ctx, next) => {
    if (!ctx.from) return;
    const telegramId = ctx.from.id.toString();
    
    // Commands that don't require registration
    if (ctx.message && 'text' in ctx.message && (ctx.message.text === "/start" || ctx.message.text === "/daftar" || ctx.message.text === "/help")) {
      return next();
    }

    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) {
      return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nID Telegram Anda belum terdaftar.\n\nKetik /daftar untuk mendaftar.");
    }
    if (seller.status === "Pending") {
      return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nAkun Anda masih dalam status <b>Pending</b>. Mohon tunggu persetujuan Admin.");
    }
    
    // Store seller in state for convenience
    (ctx as any).seller = seller;
    return next();
  });

  // --- START & HELP ---
  bot.start(async (ctx) => {
    const seller = (ctx as any).seller;
    if (!seller) return ctx.replyWithHTML(`<b>${botTexts.welcome}</b>\n\nKetik /daftar untuk mulai menggunakan bot ini.`, mainMenu);
    return ctx.replyWithHTML(`<b>${botTexts.welcome}</b>\n\nID Anda: <code>${ctx.from.id}</code>`, mainMenu);
  });

  const helpAction = (ctx: any) => {
    ctx.replyWithHTML(
      `<b>${botTexts.help}</b>\n\n` +
      `🎫 /beli - Beli Voucher\n` +
      `💰 /saldo - Cek Saldo Anda\n` +
      `📂 /mutasi - 5 Transaksi Terakhir\n` +
      `📊 /report - Laporan Penjualan Hari Ini\n` +
      `💸 /transfer - Kirim Saldo ke Reseller Lain\n` +
      `💳 /topup - Request Topup Saldo\n` +
      `📡 /status - Cek Kondisi Router\n\n` +
      `🆔 ID Anda: <code>${ctx.from.id}</code>`,
      mainMenu
    );
  };
  bot.help(helpAction);
  bot.command("help", helpAction);
  bot.hears("⚙️ Bantuan", helpAction);

  // --- SALDO ---
  const saldoAction = async (ctx: any) => {
    const seller = (ctx as any).seller;
    const saldo = parseFloat(seller.balance || "0");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>${formatIDR(saldo)}</b>`);
  };
  bot.command("saldo", saldoAction);
  bot.hears("💰 Cek Saldo", saldoAction);

  // --- MENU VOUCHER ---
  const showVoucherMenu = async (ctx: any) => {
    const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
    const pkgs = JSON.parse(vConfig?.settings || "[]");
    if (pkgs.length === 0) return ctx.reply("Belum ada paket voucher yang dikonfigurasi.");
    
    const buttons = [];
    for (let i = 0; i < pkgs.length; i += 2) {
      const row = [Markup.button.callback(pkgs[i].Voucher || pkgs[i].name, `buy_vcr|${i}`)];
      if (pkgs[i+1]) row.push(Markup.button.callback(pkgs[i+1].Voucher || pkgs[i+1].name, `buy_vcr|${i+1}`));
      buttons.push(row);
    }
    buttons.push([Markup.button.callback("💰 Cek Saldo", "inline_ceksaldo")]);
    return ctx.replyWithHTML("<b>Pilih paket voucher:</b>", Markup.inlineKeyboard(buttons));
  };
  bot.command("beli", showVoucherMenu);
  bot.command("menu", showVoucherMenu);
  bot.hears("🎫 Menu Voucher", showVoucherMenu);

  // --- MUTASI ---
  const mutasiAction = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const txs = await prisma.transaction.findMany({
      where: { userId: telegramId },
      orderBy: { no: "desc" },
      take: 5,
    });
    if (!txs.length) return ctx.reply("Belum ada riwayat transaksi.");
    let msg = "<b>5 Transaksi Terakhir:</b>\n\n";
    txs.forEach((t) => {
      const amt = t.transferAmount || t.voucherBuy || t.topUp || "0";
      msg += `📅 ${t.date} ${t.time}\n📝 ${t.description || "Transaksi"}\n💰 ${formatIDR(amt)}\n------------------\n`;
    });
    return ctx.replyWithHTML(msg);
  };
  bot.command("mutasi", mutasiAction);
  bot.hears("📂 Mutasi", mutasiAction);

  // --- REPORT ---
  const reportAction = async (ctx: any) => {
    const today = new Date().toISOString().split("T")[0];
    const telegramId = ctx.from.id.toString();
    const reports = await prisma.report.findMany({ 
      where: { 
        userId: telegramId,
        date: today 
      } 
    });
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(
      `📊 <b>Laporan Anda Hari Ini</b>\n📅 ${today}\n\n` +
      `✅ Terjual: <b>${reports.length} Voucher</b>\n` +
      `💰 Omset: <b>${formatIDR(total)}</b>`
    );
  };
  bot.command("report", reportAction);
  bot.hears("📊 Report", reportAction);

  // --- STATUS ROUTER ---
  const statusAction = async (ctx: any) => {
    try {
      const stats = await getRouterStats({ 
        routerIp: config.routerIp, 
        routerUsername: config.routerUsername, 
        routerPassword: config.routerPassword, 
        port: config.port 
      });
      return ctx.replyWithHTML(
        `📊 <b>Status Router: ${stats.routerName}</b>\n\n` +
        `🌡 CPU: ${stats.cpuLoad}%\n` +
        `🧠 RAM: ${Math.round(parseInt(stats.freeMemory)/1024/1024)}MB free\n` +
        `🕒 Uptime: ${stats.uptime}\n` +
        `🛠 Version: ${stats.version}`
      );
    } catch { return ctx.reply("Gagal mengambil status router."); }
  };
  bot.command("status", statusAction);
  bot.hears("📡 Status Router", statusAction);

  // --- DAFTAR & APPROVAL LOGIC (Sesuai kode sebelumnya) ---
  bot.command("daftar", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name;
    const existing = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (existing) return ctx.reply("Anda sudah terdaftar.");

    try {
      await prisma.seller.create({
        data: {
          adminId: config.adminId,
          userId: telegramId,
          sellerName: username,
          balance: "0",
          status: "Pending",
          time: new Date().toLocaleTimeString(),
          date: new Date().toISOString().split("T")[0]
        }
      });
      await ctx.replyWithHTML(`✅ <b>Pendaftaran Terkirim!</b>\nID: <code>${telegramId}</code>\n\nStatus: <b>Pending</b>\nMohon tunggu persetujuan Admin.`);
      if (config.ownerId) {
        const adminButtons = Markup.inlineKeyboard([
          [Markup.button.callback("✅ SETUJUI", `adm_appr|${telegramId}`), Markup.button.callback("❌ TOLAK", `adm_rejt|${telegramId}`)]
        ]);
        bot.telegram.sendMessage(config.ownerId, `🔔 <b>RESELLER BARU</b>\nNama: ${username}\nID: ${telegramId}`, { parse_mode: "HTML", ...adminButtons }).catch(() => {});
      }
    } catch (err: any) { return ctx.reply(`Gagal mendaftar: ${err.message}`); }
  });

  // --- TRANSFER & TOPUP LOGIC (Sesuai kode sebelumnya) ---
  const handleTransfer = async (ctx: any) => {
    const args = ctx.message.text.split(" ");
    if (args.length >= 3) {
      const targetId = args[1];
      const amount = parseFloat(args[2].replace(/\D/g, ""));
      try {
        const res = await transferBalance(ctx.from.id.toString(), targetId, amount);
        return ctx.replyWithHTML(`✅ <b>Transfer Berhasil!</b>\nKe: ${res.receiverName}\nJumlah: ${formatIDR(amount)}`);
      } catch (err: any) { return ctx.reply(`❌ Gagal: ${err.message}`); }
    }
    return ctx.reply("Format: /transfer [ID_PENERIMA] [JUMLAH]");
  };
  bot.command("transfer", handleTransfer);
  bot.hears("💸 Transfer Saldo", (ctx) => ctx.reply("Gunakan perintah:\n/transfer [ID_PENERIMA] [JUMLAH]"));

  const handleTopupRequest = async (ctx: any) => {
    const args = ctx.message.text.split(" ");
    if (args.length >= 2) {
      const amount = parseFloat(args[1].replace(/\D/g, ""));
      if (config.ownerId) {
        const adminButtons = Markup.inlineKeyboard([[Markup.button.callback("✅ TERIMA", `tp_appr|${ctx.from.id}|${amount}`), Markup.button.callback("❌ TOLAK", `tp_rejt|${ctx.from.id}`)]]);
        bot.telegram.sendMessage(config.ownerId, `💰 <b>REQUEST TOPUP</b>\nID: ${ctx.from.id}\nJumlah: ${formatIDR(amount)}`, { parse_mode: "HTML", ...adminButtons }).catch(() => {});
        return ctx.replyWithHTML(`✅ Permintaan topup ${formatIDR(amount)} terkirim.`);
      }
    }
    return ctx.reply("Format: /topup [JUMLAH]");
  };
  bot.command("topup", handleTopupRequest);
  bot.hears("💳 Request Topup", (ctx) => ctx.reply("Gunakan perintah:\n/topup [JUMLAH]"));

  // --- CALLBACK QUERY HANDLER ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // Buy Voucher Logic
    if (data.startsWith("buy_vcr|")) {
      const pkgIndex = parseInt(data.split("|")[1]);
      const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const pkgs = JSON.parse(vConfig?.settings || "[]");
      const pkg = pkgs[pkgIndex];
      const s = await prisma.seller.findFirst({ where: { userId: telegramId } });
      const adminPrice = parseFloat(pkg.price) - parseFloat(pkg.markup || "0");
      
      if (parseFloat(s?.balance || "0") < adminPrice) return ctx.answerCbQuery("Saldo tidak cukup!", { show_alert: true });

      try {
        const vCode = generateVoucher({ length: parseInt(pkg.length || "6"), type: (pkg.typechar || "mix") as any });
        await beliVoucher({ userId: telegramId, sellerName: s?.sellerName || "User", price: parseFloat(pkg.price), markup: parseFloat(pkg.markup || "0"), username: vCode, password: vCode, expiry: pkg.validity || "30d", status: "Success", routerName: config.routerName || "MikroTik", origin: "BOT" });
        await addHotspotUser({ server: "all", name: vCode, password: vCode, profile: pkg.profile, limitUptime: pkg.validity || "0", comment: `vc-bot|${s?.sellerName}` }, { routerIp: config.routerIp, routerUsername: config.routerUsername, routerPassword: config.routerPassword, port: config.port });
        await ctx.deleteMessage();
        return ctx.replyWithHTML(`✅ <b>Voucher Berhasil!</b>\n\nKode: <code>${vCode}</code>\nProfil: ${pkg.profile}\nHarga: ${formatIDR(pkg.price)}`);
      } catch (e: any) { return ctx.reply(`Gagal: ${e.message}`); }
    }

    // Admin Approval Registration
    if (data.startsWith("adm_appr|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const tId = data.split("|")[1];
      await prisma.seller.updateMany({ where: { userId: tId, adminId: config.adminId }, data: { status: "Active" } });
      await ctx.editMessageText("✅ Reseller disetujui!");
      bot.telegram.sendMessage(tId, "🎊 Akun Anda sudah aktif!").catch(() => {});
      return ctx.answerCbQuery();
    }

    // Inline Cek Saldo
    if (data === "inline_ceksaldo") {
      const s = await prisma.seller.findFirst({ where: { userId: telegramId } });
      return ctx.answerCbQuery(`Saldo: ${formatIDR(parseFloat(s?.balance || "0"))}`, { show_alert: true });
    }
  });

  // Daftarkan command list ke Telegram secara resmi
  bot.telegram.setMyCommands([
    { command: "beli", description: "Beli Voucher" },
    { command: "saldo", description: "Cek Saldo" },
    { command: "mutasi", description: "Riwayat Transaksi" },
    { command: "report", description: "Laporan Hari Ini" },
    { command: "transfer", description: "Kirim Saldo" },
    { command: "topup", description: "Request Saldo" },
    { command: "status", description: "Cek Router" },
    { command: "help", description: "Bantuan" },
  ]).catch(() => {});
}

export async function getBotInstance(token: string) {
  if (botRegistry.has(token)) return botRegistry.get(token)!;
  const config = await prisma.systemConfig.findFirst({ where: { botToken: token } });
  if (!config) throw new Error("Token tidak valid.");
  const bot = new Telegraf(token);
  await attachBotLogic(bot, config);
  botRegistry.set(token, bot);
  return bot;
}

export async function getAllBots() {
  return await prisma.systemConfig.findMany({ where: { botToken: { not: null } } });
}

export async function sendBotMessage(adminId: number, userId: string, message: string) {
  try {
    const config = await prisma.systemConfig.findFirst({ where: { adminId: adminId, botToken: { not: null } } });
    if (!config?.botToken) return;
    const bot = new Telegraf(config.botToken);
    await bot.telegram.sendMessage(userId, message, { parse_mode: "HTML" });
  } catch (err: any) { console.error(`Failed to send bot notification: ${err.message}`); }
}
