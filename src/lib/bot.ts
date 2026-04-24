import { Telegraf, Markup } from "telegraf";
import { prisma } from "./prisma";
import { addHotspotUser } from "./mikrotik/hotspot";
import { generateVoucher } from "./mikrotik/generator";
import { beliVoucher, topupReseller, transferBalance } from "./actions/transactions";
import { getRouterStats } from "./mikrotik";
import { formatIDR } from "./formatters";

const botRegistry: Map<string, Telegraf> = new Map();
const transferStates: Map<string, { targetId: string; targetName: string; amount?: number }> = new Map();

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
    ["💸 Transfer Saldo", "📡 Status Router"],
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
    if (seller.status === "Pending") {
      return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nAkun Anda masih dalam status <b>Pending</b>. Mohon tunggu persetujuan Admin.");
    }
    return ctx.replyWithHTML(`<b>${botTexts.welcome}</b>\n\nID Anda: <code>${telegramId}</code>`, mainMenu);
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
          status: "Pending",
          time: new Date().toLocaleTimeString(),
          date: new Date().toISOString().split("T")[0]
        }
      });
      return ctx.replyWithHTML(`✅ <b>Pendaftaran Berhasil!</b>\nID: <code>${telegramId}</code>\n\nStatus: <b>Pending (Menunggu Persetujuan Admin)</b>\nMohon tunggu sampai Admin mengaktifkan akun Anda.`, mainMenu);
    } catch (err: any) { return ctx.reply(`Gagal mendaftar: ${err.message}`); }
  });

  // --- MENU VOUCHER ---
  const showVoucherMenu = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Akses ditolak.");
    if (seller.status === "Pending") return ctx.reply("Akun Anda masih dalam status Pending. Mohon tunggu persetujuan Admin.");

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

  // --- MUTASI & REPORT ---
  bot.hears("📂 Mutasi", async (ctx) => {
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
  });

  bot.command("mutasi", async (ctx) => {
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
  });

  bot.hears("📊 Report", async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({ 
      where: { 
        adminId: config.adminId,
        date: today 
      } 
    });
    if (!reports.length) return ctx.reply(`Belum ada penjualan hari ini (${today}).`);
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(
      `📊 <b>Laporan Hari Ini</b>\n📅 ${today}\n\n✅ Terjual: <b>${reports.length} Voucher</b>\n💰 Omset: <b>${formatIDR(total)}</b>`
    );
  });

  bot.command("report", async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({ 
      where: { 
        adminId: config.adminId,
        date: today 
      } 
    });
    if (!reports.length) return ctx.reply(`Belum ada penjualan hari ini (${today}).`);
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(
      `📊 <b>Laporan Hari Ini</b>\n📅 ${today}\n\n✅ Terjual: <b>${reports.length} Voucher</b>\n💰 Omset: <b>${formatIDR(total)}</b>`
    );
  });

  // --- TRANSFER FLOW (Direct & Interactive) ---
  const handleTransfer = async (ctx: any) => {
    const senderId = ctx.from.id.toString();

    // Ensure sender is registered
    const sender = await prisma.seller.findFirst({ where: { userId: senderId } });
    if (!sender) return ctx.reply("❌ Akses ditolak. Anda belum terdaftar sebagai reseller.");
    if (sender.status !== "Active") return ctx.reply("❌ Akun Anda sedang dinonaktifkan.");

    const args = ctx.message.text.split(" ");

    // 1. Direct Command: /transfer [targetId] [amount]
    if (args.length >= 3) {
      const targetId = args[1];
      const amount = parseFloat(args[2].replace(/\D/g, ""));

      if (isNaN(amount) || amount <= 0) {
        return ctx.reply("❌ Format salah. Gunakan: /transfer [ID_PENERIMA] [JUMLAH]");
      }

      if (targetId === senderId) {
        return ctx.reply("❌ Anda tidak bisa mengirim saldo ke diri sendiri.");
      }

      try {
        const result = await transferBalance(senderId, targetId, amount);
        
        // Notify Sender
        await ctx.replyWithHTML(
          `✅ <b>Transfer Berhasil!</b>\n\n` +
          `Ke: <b>${result.receiverName}</b> (<code>${targetId}</code>)\n` +
          `Jumlah: <b>${formatIDR(amount)}</b>\n` +
          `Sisa Saldo: <b>${formatIDR(result.newSenderBalance)}</b>`
        );

        // Notify Receiver
        bot.telegram.sendMessage(targetId, 
          `📩 <b>Anda Menerima Saldo!</b>\n\n` +
          `Dari: <b>${ctx.from.first_name}</b> (<code>${senderId}</code>)\n` +
          `Jumlah: <b>${formatIDR(amount)}</b>\n` +
          `Cek saldo dengan: 💰 Cek Saldo`, 
          { parse_mode: "HTML" }
        ).catch(() => {}); // Ignore if receiver hasn't started the bot

        return;
      } catch (err: any) {
        return ctx.reply(`❌ Gagal: ${err.message}`);
      }
    }

    // 2. Interactive Flow (if no args)
    const sellers = await prisma.seller.findMany({
      where: { 
        adminId: config.adminId,
        userId: { not: senderId },
        status: "Active"
      },
      take: 15
    });

    if (sellers.length === 0) {
      return ctx.reply("Tidak ada reseller lain dalam grup Anda yang terdaftar.");
    }

    const buttons = sellers.map(s => [
      Markup.button.callback(`👤 ${s.sellerName}`, `tr_select|${s.userId}|${s.sellerName}`)
    ]);

    return ctx.replyWithHTML("<b>Pilih Reseller Penerima:</b>", Markup.inlineKeyboard(buttons));
  };

  bot.hears("💸 Transfer Saldo", handleTransfer);
  bot.command("transfer", handleTransfer);

  // --- CALLBACK HANDLER ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // 1. Pilih Paket Voucher
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
        await beliVoucher({
          userId: telegramId,
          sellerName: seller?.sellerName || "Unknown",
          price: price,
          markup: 0,
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

        await addHotspotUser({
          server: "all",
          name: code,
          password: code,
          profile: pkg.profile,
          limitBytesIn: quotaBytes,
          limitBytesOut: quotaBytes,
          comment: `vc-bot|${seller?.sellerName}|${price}|${new Date().toLocaleDateString()}`
        });

        const caption = `<b>VOUCHER BERHASIL</b>\n\n👤 User: <code>${code}</code>\n🔑 Pass: <code>${code}</code>\n📦 Profil: ${pkg.profile}\n⏰ Masa Aktif: ${pkg.validity || "-"}\n--------------------------\nGUNAKAN INTERNET DENGAN BIJAK`;
        await ctx.deleteMessage();
        return ctx.replyWithHTML(caption);
      } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
    }

    // 2. Pilih Reseller Penerima Transfer
    if (data.startsWith("tr_select|")) {
      const [, targetId, targetName] = data.split("|");
      transferStates.set(telegramId, { targetId, targetName });
      await ctx.editMessageText(`Sip! Kamu akan mengirim saldo ke <b>${targetName}</b>.\n\n<b>Silahkan ketik jumlah saldo yang ingin dikirim:</b>`, { parse_mode: "HTML" });
      return ctx.answerCbQuery();
    }

    // 3. Konfirmasi Transfer
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
  });

  // --- TEXT HANDLER (Untuk Input Jumlah Transfer) ---
  bot.on("text", async (ctx, next) => {
    const telegramId = ctx.from.id.toString();
    const state = transferStates.get(telegramId);

    if (state && !state.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount <= 0) {
        return ctx.reply("Masukkan jumlah saldo yang valid (angka).");
      }

      state.amount = amount;
      transferStates.set(telegramId, state);

      const confirmButtons = Markup.inlineKeyboard([
        [Markup.button.callback("✅ KONFIRMASI", "tr_confirm")],
        [Markup.button.callback("❌ BATAL", "tr_cancel")]
      ]);

      return ctx.replyWithHTML(
        `<b>Konfirmasi Transfer:</b>\n\n` +
        `👤 Ke: <b>${state.targetName}</b>\n` +
        `💰 Jumlah: <b>${formatIDR(amount)}</b>\n\n` +
        `Apakah data di atas sudah benar?`,
        confirmButtons
      );
    }
    return next();
  });

  // --- POWER USER COMMANDS (/vc, /up) ---
  bot.command("vc", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /vc [profil] [harga]\nContoh: /vc 1Jam 2000");

    const profile = args[1];
    const price = parseFloat(args[2]);
    const telegramId = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");

    if (seller.status === "Pending") return ctx.reply("Akun Anda masih dalam status Pending. Mohon tunggu persetujuan Admin.");

    try {
      const code = generateVoucher({ length: 6, type: "mix" });
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

      await addHotspotUser({
        server: "all",
        name: code,
        password: code,
        profile: profile,
        comment: `vc-bot-direct|${seller.sellerName}|${price}`
      });

      return ctx.replyWithHTML(
        `✅ <b>Voucher Berhasil!</b>\n\n👤 User: <code>${code}</code>\n🔑 Pass: <code>${code}</code>\n📦 Profil: ${profile}\n💰 Harga: ${formatIDR(price)}`
      );
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  // --- ADMIN COMMANDS ---
  bot.command("topup", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /topup [id_reseller] [jumlah]");
    try {
      const result = await topupReseller(args[1], parseFloat(args[2]), "BOT");
      bot.telegram.sendMessage(args[1], `✅ Saldo ditambahkan! Sisa saldo: ${formatIDR(result.newBalance)}`);
      return ctx.reply(`Berhasil!`);
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  bot.command("list_reseller", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const sellers = await prisma.seller.findMany({ where: { adminId: config.adminId }, take: 20 });
    let msg = "<b>Daftar Reseller:</b>\n\n";
    sellers.forEach(s => {
      msg += `👤 ${s.sellerName} (<code>${s.userId}</code>)\n💰 ${formatIDR(s.balance || "0")}\n\n`;
    });
    return ctx.replyWithHTML(msg);
  });

  // --- OTHER HANDLERS ---
  bot.hears("💰 Cek Saldo", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    const saldo = parseFloat(seller.balance || "0");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>${formatIDR(saldo)}</b>`);
  });

  bot.hears("📡 Status Router", async (ctx) => {
    try {
      const stats = await getRouterStats();
      const msg = `📊 <b>Status Router: ${stats.routerName}</b>\n\n🌡 CPU: ${stats.cpuLoad}%\n🧠 RAM: ${Math.round(parseInt(stats.freeMemory) / 1024 / 1024)} MB free\n🕒 Uptime: ${stats.uptime}\n🛠 Version: ${stats.version}`;
      return ctx.replyWithHTML(msg);
    } catch (err) { return ctx.reply("Gagal mengambil status router."); }
  });

  bot.hears("⚙️ Bantuan", (ctx) => {
    const helpMsg = `<b>${botTexts.help}</b>\n\n` +
      `• 💰 <b>Cek Saldo</b> - Lihat saldo saat ini\n` +
      `• 🎫 <b>Menu Voucher</b> - Pilih & beli paket internet\n` +
      `• 💸 <b>Transfer Saldo</b> - Berbagi saldo antar reseller\n` +
      `• 📂 <b>Mutasi</b> - Riwayat 5 transaksi terakhir\n` +
      `• 📊 <b>Report</b> - Penjualan Anda hari ini\n\n` +
      `<b>Format Transfer Cepat:</b>\n<code>/transfer [ID_PENERIMA] [JUMLAH]</code>\n\n` +
      `ID Telegram Anda: <code>${ctx.from.id}</code>`;
    return ctx.replyWithHTML(helpMsg);
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
