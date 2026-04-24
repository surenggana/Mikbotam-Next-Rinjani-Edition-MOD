import { Telegraf, Markup } from "telegraf";
import { prisma } from "./prisma";
import { addHotspotUser } from "./mikrotik/hotspot";
import { generateVoucher } from "./mikrotik/generator";
import { beliVoucher, topupReseller, transferBalance } from "./actions/transactions";
import { getRouterStats } from "./mikrotik";
import { formatIDR } from "./formatters";

const botRegistry: Map<string, Telegraf> = new Map();
const transferStates: Map<string, { targetId?: string; targetName?: string; amount?: number }> = new Map();
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

  // --- MIDDLEWARE ---
  bot.use(async (ctx, next) => {
    if (!ctx.from) return;
    const telegramId = ctx.from.id.toString();
    if (ctx.message && 'text' in ctx.message && ["/start", "/daftar", "/help"].includes(ctx.message.text)) return next();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nKetik /daftar untuk mendaftar.");
    if (seller.status === "Pending") return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nAkun Anda masih dalam status Pending.");
    (ctx as any).seller = seller;
    return next();
  });

  // --- ACTIONS ---
  const helpAction = (ctx: any) => ctx.replyWithHTML(`<b>${botTexts.help}</b>\n\n/beli - Voucher\n/saldo - Cek Saldo\n/transfer - Kirim Saldo\n/mutasi - Riwayat\n/report - Laporan\n\n🆔 ID Anda: <code>${ctx.from.id}</code>`, mainMenu);
  bot.start(helpAction);
  bot.command("help", helpAction);
  bot.hears("⚙️ Bantuan", helpAction);

  const saldoAction = async (ctx: any) => ctx.replyWithHTML(`💳 Saldo Anda: <b>${formatIDR((ctx as any).seller.balance || 0)}</b>`);
  bot.command("saldo", saldoAction);
  bot.hears("💰 Cek Saldo", saldoAction);

  // --- TRANSFER LOGIC (ALWAYS INTERACTIVE) ---
  const handleTransferInit = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();

    // 1. Fetch other active sellers in the same tenant
    const otherSellers = await prisma.seller.findMany({ 
      where: { 
        adminId: config.adminId, 
        userId: { not: telegramId }, 
        status: "Active" 
      },
      take: 10 
    });

    if (otherSellers.length === 0) return ctx.reply("❌ Tidak ada reseller lain yang terdaftar dalam grup Anda.");

    // 2. Build user selection buttons
    const buttons = otherSellers.map(s => [
      Markup.button.callback(`👤 ${s.sellerName}`, `tr_to|${s.userId}|${s.sellerName}`)
    ]);

    return ctx.replyWithHTML("<b>Pilih Reseller Penerima:</b>\n(Silahkan klik salah satu nama di bawah)", Markup.inlineKeyboard(buttons));
  };
  bot.command("transfer", handleTransferInit);
  bot.hears("💸 Transfer Saldo", handleTransferInit);

  // --- TOPUP LOGIC (INTERACTIVE) ---
  const handleTopupInit = async (ctx: any) => {
    topupStates.set(ctx.from.id.toString(), {});
    return ctx.reply("💰 Masukkan jumlah saldo yang ingin Anda topup:\n(Ketik nominal angka saja, misal: 50000)");
  };
  bot.command("topup", handleTopupInit);
  bot.hears("💳 Request Topup", handleTopupInit);

  // --- CALLBACK HANDLER ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // Handle Transfer Selection
    if (data.startsWith("tr_to|")) {
      const [, tId, tName] = data.split("|");
      transferStates.set(telegramId, { targetId: tId, targetName: tName });
      await ctx.editMessageText(`Sip! Kamu akan mengirim saldo ke <b>${tName}</b>.\n\n<b>Silahkan ketik jumlah saldo yang ingin dikirim:</b>`, { parse_mode: "HTML" });
      return ctx.answerCbQuery();
    }

    // Handle Voucher Purchase
    if (data.startsWith("buy_vcr|")) {
      const pkgIdx = parseInt(data.split("|")[1]);
      const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const pkgs = JSON.parse(vConfig?.settings || "[]");
      const pkg = pkgs[pkgIdx];
      const adminPrice = parseFloat(pkg.price) - parseFloat(pkg.markup || "0");
      
      if (parseFloat((ctx as any).seller.balance || 0) < adminPrice) return ctx.answerCbQuery("Saldo tidak cukup!", { show_alert: true });

      try {
        const vCode = generateVoucher({ length: parseInt(pkg.length || "6"), type: (pkg.typechar || "mix") as any });
        await beliVoucher({ userId: telegramId, sellerName: (ctx as any).seller.sellerName, price: parseFloat(pkg.price), markup: parseFloat(pkg.markup || "0"), username: vCode, password: vCode, expiry: pkg.validity || "30d", status: "Success", routerName: config.routerName || "MikroTik", origin: "BOT" });
        await addHotspotUser({ server: pkg.server || "all", name: vCode, password: vCode, profile: pkg.profile, limitUptime: pkg.validity || "0", comment: `vc-bot|${(ctx as any).seller.sellerName}` }, { routerIp: config.routerIp, routerUsername: config.routerUsername, routerPassword: config.routerPassword, port: config.port });
        await ctx.deleteMessage();
        return ctx.replyWithHTML(`✅ <b>Voucher Berhasil!</b>\n\nKode: <code>${vCode}</code>\nHarga: ${formatIDR(pkg.price)}`);
      } catch (e: any) { return ctx.reply(`Gagal: ${e.message}`); }
    }

    // Admin Handlers
    if (data.startsWith("adm_appr|") || data.startsWith("tp_appr|") || data.startsWith("adm_rejt|") || data.startsWith("tp_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      
      if (data.startsWith("adm_appr|")) {
        const tId = data.split("|")[1];
        await prisma.seller.updateMany({ where: { userId: tId, adminId: config.adminId }, data: { status: "Active" } });
        await ctx.editMessageText("✅ Reseller disetujui!");
        bot.telegram.sendMessage(tId, "🎊 Akun Anda sudah aktif Admin!").catch(() => {});
      }
      
      if (data.startsWith("tp_appr|")) {
        const [, tId, amt] = data.split("|");
        const res = await topupReseller(tId, parseFloat(amt), "Admin Bot", parseInt(config.adminId));
        await ctx.editMessageText(`✅ Topup ${formatIDR(amt)} berhasil!`);
        bot.telegram.sendMessage(tId, `💰 Saldo bertambah <b>${formatIDR(amt)}</b>!`).catch(() => {});
      }
      
      if (data.startsWith("adm_rejt|") || data.startsWith("tp_rejt|")) {
        await ctx.editMessageText("❌ Permintaan ditolak.");
      }
      return ctx.answerCbQuery();
    }

    if (data === "inline_ceksaldo") {
      const s = await prisma.seller.findFirst({ where: { userId: telegramId } });
      return ctx.answerCbQuery(`Saldo: ${formatIDR(parseFloat(s?.balance || "0"))}`, { show_alert: true });
    }
  });

  // --- TEXT HANDLER FOR STATES ---
  bot.on("text", async (ctx, next) => {
    const telegramId = ctx.from.id.toString();
    
    // 1. Process Transfer Amount
    const trState = transferStates.get(telegramId);
    if (trState && trState.targetId && !trState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount <= 0) return ctx.reply("❌ Masukkan angka nominal yang valid.");
      
      try {
        const res = await transferBalance(telegramId, trState.targetId, amount);
        transferStates.delete(telegramId);
        return ctx.replyWithHTML(`✅ <b>Transfer Berhasil!</b>\n\nKe: <b>${trState.targetName}</b>\nJumlah: <b>${formatIDR(amount)}</b>`);
      } catch (e: any) { return ctx.reply(`❌ Gagal: ${e.message}`); }
    }

    // 2. Process Topup Amount
    const tpState = topupStates.get(telegramId);
    if (tpState && !tpState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount < 1000) return ctx.reply("❌ Minimal topup adalah Rp 1.000");
      
      topupStates.delete(telegramId);
      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([
          [Markup.button.callback("✅ TERIMA", `tp_appr|${telegramId}|${amount}`), Markup.button.callback("❌ TOLAK", `tp_rejt|${telegramId}`)]
        ]);
        bot.telegram.sendMessage(config.ownerId, `💰 <b>REQUEST TOPUP</b>\n\nReseller: ${(ctx as any).seller.sellerName}\nID: <code>${telegramId}</code>\nJumlah: <b>${formatIDR(amount)}</b>`, { parse_mode: "HTML", ...btns }).catch(() => {});
        return ctx.replyWithHTML(`✅ Request topup <b>${formatIDR(amount)}</b> terkirim. Mohon tunggu persetujuan Admin.`);
      }
    }
    return next();
  });

  // --- OTHERS ---
  const menuAction = async (ctx: any) => {
    const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
    const pkgs = JSON.parse(vConfig?.settings || "[]");
    if (pkgs.length === 0) return ctx.reply("Belum ada paket.");
    const buttons = [];
    for (let i = 0; i < pkgs.length; i += 2) {
      const row = [Markup.button.callback(pkgs[i].Voucher || pkgs[i].name, `buy_vcr|${i}`)];
      if (pkgs[i+1]) row.push(Markup.button.callback(pkgs[i+1].Voucher || pkgs[i+1].name, `buy_vcr|${i+1}`));
      buttons.push(row);
    }
    return ctx.replyWithHTML("<b>Pilih paket voucher:</b>", Markup.inlineKeyboard(buttons));
  };
  bot.command("beli", menuAction);
  bot.command("menu", menuAction);
  bot.hears("🎫 Menu Voucher", menuAction);

  bot.hears("📡 Status Router", async (ctx) => {
    try {
      const stats = await getRouterStats({ routerIp: config.routerIp, routerUsername: config.routerUsername, routerPassword: config.routerPassword, port: config.port });
      return ctx.replyWithHTML(`📊 <b>Status: ${stats.routerName}</b>\n🌡 CPU: ${stats.cpuLoad}%\n🧠 RAM: ${Math.round(parseInt(stats.freeMemory)/1024/1024)}MB free\n🕒 Uptime: ${stats.uptime}`);
    } catch { return ctx.reply("Gagal ambil status."); }
  });

  const mutasiAction = async (ctx: any) => {
    const txs = await prisma.transaction.findMany({ where: { userId: ctx.from.id.toString() }, orderBy: { no: "desc" }, take: 5 });
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

  const reportAction = async (ctx: any) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({ where: { userId: ctx.from.id.toString(), date: today } });
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(`📊 <b>Laporan Hari Ini</b>\n📅 ${today}\n\n✅ Terjual: <b>${reports.length} Voucher</b>\n💰 Omset: <b>${formatIDR(total)}</b>`);
  };
  bot.command("report", reportAction);
  bot.hears("📊 Report", reportAction);

  bot.telegram.setMyCommands([
    { command: "beli", description: "Beli Voucher" },
    { command: "saldo", description: "Cek Saldo" },
    { command: "transfer", description: "Kirim Saldo" },
    { command: "mutasi", description: "Riwayat Transaksi" },
    { command: "report", description: "Laporan Penjualan" },
    { command: "topup", description: "Request Saldo" },
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
  } catch (err: any) { console.error(`Failed: ${err.message}`); }
}
