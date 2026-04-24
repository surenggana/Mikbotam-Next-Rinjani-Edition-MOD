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

  // --- TRANSFER LOGIC (INTERACTIVE) ---
  const handleTransferInit = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const args = ctx.message.text.split(" ");

    // Direct command: /transfer [ID] [AMOUNT]
    if (args.length >= 3) {
      const targetId = args[1];
      const amount = parseFloat(args[2].replace(/\D/g, ""));
      try {
        const res = await transferBalance(telegramId, targetId, amount);
        return ctx.replyWithHTML(`✅ <b>Transfer Berhasil!</b>\nKe: <b>${res.receiverName}</b>\nJumlah: <b>${formatIDR(amount)}</b>`);
      } catch (err: any) { return ctx.reply(`❌ Gagal: ${err.message}`); }
    }

    // Interactive start: Choose receiver
    const otherSellers = await prisma.seller.findMany({ 
      where: { adminId: config.adminId, userId: { not: telegramId }, status: "Active" },
      take: 10 
    });

    if (otherSellers.length === 0) return ctx.reply("Tidak ada reseller lain yang aktif.");

    const buttons = otherSellers.map(s => [Markup.button.callback(`👤 ${s.sellerName}`, `tr_to|${s.userId}|${s.sellerName}`)]);
    return ctx.replyWithHTML("<b>Pilih Penerima:</b>", Markup.inlineKeyboard(buttons));
  };
  bot.command("transfer", handleTransferInit);
  bot.hears("💸 Transfer Saldo", handleTransferInit);

  // --- TOPUP LOGIC (INTERACTIVE) ---
  const handleTopupInit = async (ctx: any) => {
    const args = ctx.message.text.split(" ");
    if (args.length >= 2) {
      const amount = parseFloat(args[1].replace(/\D/g, ""));
      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([[Markup.button.callback("✅ TERIMA", `tp_appr|${ctx.from.id}|${amount}`), Markup.button.callback("❌ TOLAK", `tp_rejt|${ctx.from.id}`)]]);
        bot.telegram.sendMessage(config.ownerId, `💰 <b>REQUEST TOPUP</b>\nReseller: ${(ctx as any).seller.sellerName}\nJumlah: ${formatIDR(amount)}`, { parse_mode: "HTML", ...btns }).catch(() => {});
        return ctx.replyWithHTML(`✅ Request topup ${formatIDR(amount)} terkirim.`);
      }
    }
    topupStates.set(ctx.from.id.toString(), {});
    return ctx.reply("Masukkan jumlah saldo yang ingin diisi:");
  };
  bot.command("topup", handleTopupInit);
  bot.hears("💳 Request Topup", handleTopupInit);

  // --- CALLBACK HANDLER ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    if (data.startsWith("tr_to|")) {
      const [, tId, tName] = data.split("|");
      transferStates.set(telegramId, { targetId: tId, targetName: tName });
      await ctx.editMessageText(`Kirim ke <b>${tName}</b>.\nKetik jumlah saldo:`, { parse_mode: "HTML" });
      return ctx.answerCbQuery();
    }

    if (data.startsWith("buy_vcr|")) {
      const pkgIdx = parseInt(data.split("|")[1]);
      const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const pkg = JSON.parse(vConfig?.settings || "[]")[pkgIdx];
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

    // Admin handlers
    if (data.startsWith("adm_appr|") || data.startsWith("tp_appr|") || data.startsWith("adm_rejt|") || data.startsWith("tp_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      // registration approval
      if (data.startsWith("adm_appr|")) {
        const tId = data.split("|")[1];
        await prisma.seller.updateMany({ where: { userId: tId, adminId: config.adminId }, data: { status: "Active" } });
        await ctx.editMessageText("✅ Reseller disetujui!");
        bot.telegram.sendMessage(tId, "🎊 Akun Anda sudah aktif!").catch(() => {});
      }
      // topup approval
      if (data.startsWith("tp_appr|")) {
        const [, tId, amt] = data.split("|");
        const res = await topupReseller(tId, parseFloat(amt), "Admin Bot", parseInt(config.adminId));
        await ctx.editMessageText(`✅ Topup ${formatIDR(amt)} berhasil!`);
        bot.telegram.sendMessage(tId, `💰 Saldo bertambah ${formatIDR(amt)}!`).catch(() => {});
      }
      return ctx.answerCbQuery();
    }
  });

  // --- TEXT HANDLER FOR STATES ---
  bot.on("text", async (ctx, next) => {
    const telegramId = ctx.from.id.toString();
    
    // Process Transfer Amount
    const trState = transferStates.get(telegramId);
    if (trState && trState.targetId && !trState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount <= 0) return ctx.reply("Masukkan angka yang valid.");
      try {
        const res = await transferBalance(telegramId, trState.targetId, amount);
        transferStates.delete(telegramId);
        return ctx.replyWithHTML(`✅ <b>Transfer Berhasil!</b>\nKe: <b>${trState.targetName}</b>\nJumlah: <b>${formatIDR(amount)}</b>`);
      } catch (e: any) { return ctx.reply(`❌ Gagal: ${e.message}`); }
    }

    // Process Topup Amount
    const tpState = topupStates.get(telegramId);
    if (tpState && !tpState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount < 1000) return ctx.reply("Minimal Rp 1.000");
      topupStates.delete(telegramId);
      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([[Markup.button.callback("✅ TERIMA", `tp_appr|${telegramId}|${amount}`), Markup.button.callback("❌ TOLAK", `tp_rejt|${telegramId}`)]]);
        bot.telegram.sendMessage(config.ownerId, `💰 <b>REQUEST TOPUP</b>\nReseller: ${(ctx as any).seller.sellerName}\nJumlah: ${formatIDR(amount)}`, { parse_mode: "HTML", ...btns }).catch(() => {});
        return ctx.replyWithHTML(`✅ Request topup ${formatIDR(amount)} terkirim.`);
      }
    }
    return next();
  });

  // Menu Voucher
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
    return ctx.replyWithHTML("<b>Pilih paket:</b>", Markup.inlineKeyboard(buttons));
  };
  bot.command("beli", menuAction);
  bot.command("menu", menuAction);
  bot.hears("🎫 Menu Voucher", menuAction);
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
