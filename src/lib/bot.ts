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
    if (seller.status === "Pending") {
      return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nAkun Anda masih dalam status <b>Pending</b>. Mohon tunggu persetujuan Admin.");
    }
    return ctx.replyWithHTML(`<b>${botTexts.welcome}</b>\n\nID Anda: <code>${telegramId}</code>`, mainMenu);
  });

  bot.command("approve", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("❌ Akses ditolak. Hanya Admin yang bisa menyetujui reseller.");
    
    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("Format: /approve [ID_TELEGRAM_RESELLER]");

    const targetId = args[1];
    
    try {
      const targetSeller = await prisma.seller.findFirst({ 
        where: { userId: targetId, adminId: config.adminId } 
      });

      if (!targetSeller) return ctx.reply("❌ Reseller tidak ditemukan di bawah manajemen Anda.");
      if (targetSeller.status === "Active") return ctx.reply("✅ Reseller ini sudah aktif.");

      await prisma.seller.update({
        where: { no: targetSeller.no },
        data: { status: "Active" }
      });

      ctx.replyWithHTML(`✅ Reseller <b>${targetSeller.sellerName}</b> (<code>${targetId}</code>) berhasil diaktifkan!`);
      
      // Notify the reseller
      bot.telegram.sendMessage(targetId, "🎊 <b>Selamat!</b> Akun reseller Anda telah diaktifkan oleh Admin. Sekarang Anda bisa melakukan transaksi.", { parse_mode: "HTML" }).catch(() => {});
      
    } catch (err: any) {
      ctx.reply(`❌ Gagal menyetujui: ${err.message}`);
    }
  });

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

      // Notify Reseller
      await ctx.replyWithHTML(`✅ <b>Pendaftaran Terkirim!</b>\nID: <code>${telegramId}</code>\n\nStatus: <b>Pending</b>\nMohon tunggu, Admin telah menerima notifikasi pendaftaran Anda.`);

      // Notify Admin (Interactive)
      if (config.ownerId) {
        const adminMsg = 
          `🔔 <b>RESELLER BARU MENDAFTAR</b>\n\n` +
          `👤 Nama: <b>${username}</b>\n` +
          `🆔 Telegram ID: <code>${telegramId}</code>\n` +
          `📅 Tanggal: ${new Date().toLocaleDateString()}\n\n` +
          `Silahkan pilih tindakan di bawah ini:`;

        const adminButtons = Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ SETUJUI", `adm_appr|${telegramId}`),
            Markup.button.callback("❌ TOLAK", `adm_rejt|${telegramId}`)
          ]
        ]);

        bot.telegram.sendMessage(config.ownerId, adminMsg, { 
          parse_mode: "HTML",
          ...adminButtons
        }).catch(err => console.error("Gagal kirim notif ke Admin:", err.message));
      }

      return;
    } catch (err: any) { return ctx.reply(`Gagal mendaftar: ${err.message}`); }
  });

  // --- TOPUP FLOW ---
  const sendTopupToAdmin = async (ctx: any, userId: string, name: string, amount: number) => {
    if (!config.ownerId) return ctx.reply("❌ Gagal: Admin belum menyetel ID Owner.");

    const adminMsg = 
      `💰 <b>PERMINTAAN TOPUP SALDO</b>\n\n` +
      `👤 Reseller: <b>${name}</b>\n` +
      `🆔 ID: <code>${userId}</code>\n` +
      `💵 Jumlah: <b>${formatIDR(amount)}</b>\n\n` +
      `Apakah Anda ingin menyetujui topup ini?`;

    const adminButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback("✅ TERIMA", `tp_appr|${userId}|${amount}`),
        Markup.button.callback("❌ TOLAK", `tp_rejt|${userId}`)
      ]
    ]);

    try {
      await bot.telegram.sendMessage(config.ownerId, adminMsg, { parse_mode: "HTML", ...adminButtons });
      return ctx.replyWithHTML(`✅ <b>Permintaan Terkirim!</b>\n\nSedang menunggu persetujuan Admin untuk topup <b>${formatIDR(amount)}</b>.`);
    } catch (err: any) {
      return ctx.reply("❌ Gagal mengirim permintaan ke Admin.");
    }
  };

  const handleTopupRequest = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    
    if (!seller) return ctx.reply("❌ Anda belum terdaftar.");
    if (seller.status !== "Active") return ctx.reply("❌ Akun Anda belum aktif.");

    const args = ctx.message.text.split(" ");
    if (args.length >= 2) {
      const amount = parseFloat(args[1].replace(/\D/g, ""));
      if (isNaN(amount) || amount < 1000) return ctx.reply("❌ Minimal topup adalah Rp 1.000");
      
      return sendTopupToAdmin(ctx, telegramId, seller.sellerName || "", amount);
    }

    topupStates.set(telegramId, {});
    return ctx.replyWithHTML("<b>Silahkan ketik jumlah saldo yang ingin Anda topup:</b>\n(Contoh: 50000)");
  };

  bot.hears("💳 Request Topup", handleTopupRequest);
  bot.command("topup", handleTopupRequest);

  // --- CALLBACK HANDLER ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // Admin Action: Approve Topup
    if (data.startsWith("tp_appr|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("❌ Akses ditolak.");
      const [, targetId, amountStr] = data.split("|");
      const amount = parseFloat(amountStr);

      try {
        const result = await topupReseller(targetId, amount, "Admin Bot", parseInt(config.adminId));
        await ctx.editMessageText(`✅ <b>Topup Berhasil!</b>\n\nKe: <code>${targetId}</code>\nJumlah: <b>${formatIDR(amount)}</b>\nSaldo Baru: <b>${formatIDR(result.newBalance)}</b>`, { parse_mode: "HTML" });
        
        // Notify Reseller
        bot.telegram.sendMessage(targetId, `🎊 <b>Topup Berhasil!</b>\nSaldo Anda telah bertambah <b>${formatIDR(amount)}</b>.\n\nSaldo sekarang: <b>${formatIDR(result.newBalance)}</b>`, { parse_mode: "HTML" }).catch(() => {});
      } catch (err: any) {
        await ctx.editMessageText(`❌ Gagal: ${err.message}`);
      }
      return ctx.answerCbQuery();
    }

    // Admin: Reject Topup
    if (data.startsWith("tp_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("❌ Akses ditolak.");
      const targetId = data.split("|")[1];
      await ctx.editMessageText(`❌ Permintaan topup dari <code>${targetId}</code> telah DITOLAK.`, { parse_mode: "HTML" });
      bot.telegram.sendMessage(targetId, "⚠️ <b>Maaf!</b> Permintaan topup Anda ditolak oleh Admin.", { parse_mode: "HTML" }).catch(() => {});
      return ctx.answerCbQuery();
    }

    // Pilih Paket Voucher
    if (data.startsWith("buy_vcr|")) {
      const pkgIndex = parseInt(data.split("|")[1]);
      const voucherConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const packages = JSON.parse(voucherConfig?.settings || "[]");
      const pkg = packages[pkgIndex];

      if (!pkg) return ctx.answerCbQuery("Paket tidak ditemukan.");

      const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
      const balance = parseFloat(seller?.balance || "0");
      
      const price = parseFloat(pkg.price);
      const markup = parseFloat(pkg.markup || "0");
      const adminPrice = price - markup; // Reseller only pays this

      if (balance < adminPrice) {
        return ctx.replyWithHTML(botTexts.fail_balance);
      }

      await ctx.editMessageText("<code>Sedang memproses voucher...</code>", { parse_mode: "HTML" });

      try {
        const vLength = parseInt(config.voucher1 || "6");
        const vType = (config.voucherGenerate || "mix") as any;
        const code = generateVoucher({ length: vLength, type: vType });

        await beliVoucher({
          userId: telegramId,
          sellerName: seller?.sellerName || "Unknown",
          price: price,
          markup: markup,
          username: code,
          password: code,
          expiry: pkg.validity || "30d",
          status: "Success",
          routerName: config.routerName || "MikroTik",
          service: "hotspot",
          origin: "BOT"
        });

        let quotaBytes: number | undefined;
        if (pkg.quotaGB && parseFloat(pkg.quotaGB) > 0) {
          quotaBytes = Math.round(parseFloat(pkg.quotaGB) * 1024 * 1024 * 1024);
        }

        const routerConfig = {
          routerIp: config.routerIp,
          routerUsername: config.routerUsername,
          routerPassword: config.routerPassword,
          port: config.port
        };

        await addHotspotUser({
          server: "all",
          name: code,
          password: code,
          profile: pkg.profile,
          limitBytesIn: quotaBytes,
          limitBytesOut: quotaBytes,
          comment: `vc-bot|${seller?.sellerName}|${price}|${new Date().toLocaleDateString()}`
        }, routerConfig);

        const caption = `<b>VOUCHER BERHASIL</b>\n\n👤 User: <code>${code}</code>\n🔑 Pass: <code>${code}</code>\n📦 Profil: ${pkg.profile}\n💰 Harga: ${formatIDR(price)}\n⏰ Masa Aktif: ${pkg.validity || "-"}\n--------------------------\nGUNAKAN INTERNET DENGAN BIJAK`;
        await ctx.deleteMessage();
        return ctx.replyWithHTML(caption);
      } catch (err: any) { 
        console.error("Voucher creation error:", err);
        return ctx.reply(`Gagal: ${err.message}`); 
      }
    }

    // Pilih Reseller Penerima Transfer
    if (data.startsWith("tr_select|")) {
      const [, targetId, targetName] = data.split("|");
      transferStates.set(telegramId, { targetId, targetName });
      await ctx.editMessageText(`Sip! Kamu akan mengirim saldo ke <b>${targetName}</b>.\n\n<b>Silahkan ketik jumlah saldo yang ingin dikirim:</b>`, { parse_mode: "HTML" });
      return ctx.answerCbQuery();
    }

    // Konfirmasi Transfer
    if (data === "tr_confirm") {
      const state = transferStates.get(telegramId);
      if (!state || !state.amount) return ctx.answerCbQuery("Sesi kadaluarsa.");

      try {
        const result = await transferBalance(telegramId, state.targetId, state.amount);
        await ctx.editMessageText(`✅ <b>Transfer Berhasil!</b>\n\nKe: <b>${state.targetName}</b>\nJumlah: <b>${formatIDR(state.amount)}</b>\nSisa Saldo: <b>${formatIDR(result.newSenderBalance)}</b>`, { parse_mode: "HTML" });
        
        bot.telegram.sendMessage(state.targetId, `📩 <b>Anda Menerima Saldo!</b>\n\nDari: <b>${ctx.from.first_name}</b>\nJumlah: <b>${formatIDR(state.amount)}</b>\nCek saldo dengan: 💰 Cek Saldo`, { parse_mode: "HTML" });
        transferStates.delete(telegramId);
      } catch (err: any) {
        await ctx.editMessageText(`❌ Gagal: ${err.message}`);
      }
      return ctx.answerCbQuery();
    }

    if (data === "tr_cancel") {
      transferStates.delete(telegramId);
      await ctx.editMessageText("❌ Transfer dibatalkan.");
      return ctx.answerCbQuery();
    }

    if (data === "inline_ceksaldo") {
      const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
      const saldo = parseFloat(seller?.balance || "0");
      return ctx.answerCbQuery(`Saldo Anda: ${formatIDR(saldo)}`, { show_alert: true });
    }

    // Admin: Approve Registration
    if (data.startsWith("adm_appr|")) {
      const targetId = data.split("|")[1];
      try {
        const targetSeller = await prisma.seller.findFirst({ 
          where: { userId: targetId, adminId: config.adminId } 
        });

        if (!targetSeller) return ctx.answerCbQuery("Reseller tidak ditemukan.");
        
        await prisma.seller.update({
          where: { no: targetSeller.no },
          data: { status: "Active" }
        });

        await ctx.editMessageText(`✅ Reseller <b>${targetSeller.sellerName}</b> (<code>${targetId}</code>) telah DISERUJUI.`, { parse_mode: "HTML" });
        bot.telegram.sendMessage(targetId, "🎊 <b>Selamat!</b> Akun reseller Anda telah diaktifkan oleh Admin. Sekarang Anda bisa melakukan transaksi.", { parse_mode: "HTML" }).catch(() => {});
      } catch (err: any) {
        ctx.answerCbQuery(`Gagal: ${err.message}`);
      }
      return ctx.answerCbQuery();
    }

    // Admin: Reject Registration
    if (data.startsWith("adm_rejt|")) {
      const targetId = data.split("|")[1];
      try {
        const targetSeller = await prisma.seller.findFirst({ where: { userId: targetId, adminId: config.adminId } });
        if (!targetSeller) return ctx.answerCbQuery("Reseller tidak ditemukan.");
        await prisma.seller.delete({ where: { no: targetSeller.no } });
        await ctx.editMessageText(`❌ Pendaftaran reseller <b>${targetSeller.sellerName}</b> (<code>${targetId}</code>) telah DITOLAK.`, { parse_mode: "HTML" });
        bot.telegram.sendMessage(targetId, "⚠️ <b>Maaf!</b> Pendaftaran reseller Anda ditolak oleh Admin.", { parse_mode: "HTML" }).catch(() => {});
      } catch (err: any) { ctx.answerCbQuery(`Gagal: ${err.message}`); }
      return ctx.answerCbQuery();
    }
  });

  // --- TEXT HANDLER ---
  bot.on("text", async (ctx, next) => {
    const telegramId = ctx.from.id.toString();
    
    // Handle Transfer State
    const trState = transferStates.get(telegramId);
    if (trState && !trState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount <= 0) return ctx.reply("Masukkan jumlah saldo yang valid.");
      trState.amount = amount;
      transferStates.set(telegramId, trState);
      const confirmButtons = Markup.inlineKeyboard([
        [Markup.button.callback("✅ KONFIRMASI", "tr_confirm"), Markup.button.callback("❌ BATAL", "tr_cancel")]
      ]);
      return ctx.replyWithHTML(`<b>Konfirmasi Transfer:</b>\n👤 Ke: <b>${trState.targetName}</b>\n💰 Jumlah: <b>${formatIDR(amount)}</b>`, confirmButtons);
    }

    // Handle Topup State
    const tpState = topupStates.get(telegramId);
    if (tpState && !tpState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount < 1000) return ctx.reply("Minimal topup adalah Rp 1.000");
      
      const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
      topupStates.delete(telegramId);
      return sendTopupToAdmin(ctx, telegramId, seller?.sellerName || "Reseller", amount);
    }

    return next();
  });

  // --- POWER USER COMMANDS (/vc) ---
  bot.command("vc", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /vc [profil] [harga]\nContoh: /vc 1Jam 2000");

    const profile = args[1];
    const price = parseFloat(args[2]);
    const telegramId = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller || seller.status !== "Active") return ctx.reply("Akses ditolak.");

    try {
      const vLength = parseInt(config.voucher1 || "6");
      const vType = (config.voucherGenerate || "mix") as any;
      const code = generateVoucher({ length: vLength, type: vType });

      await beliVoucher({
        userId: telegramId,
        sellerName: seller.sellerName || "Unknown",
        price: price,
        markup: 0,
        username: code,
        password: code,
        expiry: "30d",
        status: "Success",
        routerName: config.routerName || "MikroTik",
        service: "hotspot",
        origin: "BOT"
      });

      const routerConfig = {
        routerIp: config.routerIp,
        routerUsername: config.routerUsername,
        routerPassword: config.routerPassword,
        port: config.port
      };

      await addHotspotUser({
        server: "all",
        name: code,
        password: code,
        profile: profile,
        comment: `vc-bot-direct|${seller.sellerName}|${price}`
      }, routerConfig);

      return ctx.replyWithHTML(
        `✅ <b>Voucher Berhasil!</b>\n\n👤 User: <code>${code}</code>\n🔑 Pass: <code>${code}</code>\n📦 Profil: ${profile}\n💰 Harga: ${formatIDR(price)}`
      );
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  // --- OTHER HANDLERS ---
  const showVoucherMenu = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller || seller.status !== "Active") return ctx.reply("Akses ditolak.");

    const voucherConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
    const packages = JSON.parse(voucherConfig?.settings || "[]");
    if (packages.length === 0) return ctx.reply("Belum ada paket voucher.");

    const buttons = [];
    for (let i = 0; i < packages.length; i += 2) {
      const row = [Markup.button.callback(packages[i].name, `buy_vcr|${i}`)];
      if (packages[i+1]) row.push(Markup.button.callback(packages[i+1].name, `buy_vcr|${i+1}`));
      buttons.push(row);
    }
    buttons.push([Markup.button.callback("💰 Cek Saldo", "inline_ceksaldo")]);

    return ctx.replyWithHTML("<b>Pilih paket voucher:</b>", Markup.inlineKeyboard(buttons));
  };

  bot.hears("🎫 Menu Voucher", showVoucherMenu);
  bot.command("menu", showVoucherMenu);
  bot.command("beli", showVoucherMenu);

  bot.hears("💰 Cek Saldo", async (ctx) => {
    const seller = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>${formatIDR(parseFloat(seller.balance || "0"))}</b>`);
  });
  bot.command("saldo", async (ctx) => {
    const seller = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>${formatIDR(parseFloat(seller.balance || "0"))}</b>`);
  });

  bot.hears("📡 Status Router", async (ctx) => {
    try {
      const routerConfig = {
        routerIp: config.routerIp,
        routerUsername: config.routerUsername,
        routerPassword: config.routerPassword,
        port: config.port
      };
      const stats = await getRouterStats(routerConfig);
      return ctx.replyWithHTML(`📊 <b>Status: ${stats.routerName}</b>\n🌡 CPU: ${stats.cpuLoad}%\n🧠 RAM: ${Math.round(parseInt(stats.freeMemory)/1024/1024)}MB free\n🕒 Uptime: ${stats.uptime}`);
    } catch { return ctx.reply("Gagal ambil status router."); }
  });

  const helpMsg = (ctx: any) => {
    ctx.replyWithHTML(`<b>${botTexts.help}</b>\n\n• /topup - Request Saldo\n• /transfer - Kirim Saldo\n• /daftar - Registrasi\n• /mutasi - Riwayat\n• /saldo - Cek Saldo\n• /menu - Daftar Voucher`);
  };
  bot.hears("⚙️ Bantuan", helpMsg);
  bot.command("help", helpMsg);

  // Daftarkan command list ke Telegram
  bot.telegram.setMyCommands([
    { command: "beli", description: "Beli Voucher" },
    { command: "menu", description: "Menu Utama" },
    { command: "saldo", description: "Cek Saldo" },
    { command: "transfer", description: "Transfer Saldo Antar Reseller" },
    { command: "daftar", description: "Daftar sebagai agen reseller" },
    { command: "mutasi", description: "Riwayat Transaksi" },
    { command: "report", description: "Laporan Penjualan Hari Ini" },
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

/**
 * Helper to send Telegram message from anywhere (Dashboard / Actions)
 */
export async function sendBotMessage(adminId: number, userId: string, message: string) {
  try {
    const config = await prisma.systemConfig.findFirst({ 
      where: { adminId: adminId, botToken: { not: null } } 
    });
    
    if (!config?.botToken) return;

    const bot = new Telegraf(config.botToken);
    await bot.telegram.sendMessage(userId, message, { parse_mode: "HTML" });
  } catch (err: any) {
    console.error(`Failed to send bot notification: ${err.message}`);
  }
}
