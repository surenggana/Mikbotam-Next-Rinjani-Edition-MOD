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

  // AUTH MIDDLEWARE — runs before every handler
  bot.use(async (ctx, next) => {
    if (!ctx.from) return;

    // For callback_query: set seller on ctx if active, then pass through
    if (ctx.callbackQuery) {
      const telegramId = ctx.from.id.toString();
      const seller = await prisma.seller.findFirst({
        where: { userId: telegramId, adminId: config.adminId },
      });
      if (seller?.status === "Active") (ctx as any).seller = seller;
      return next();
    }

    const text = ctx.message && "text" in ctx.message ? ctx.message.text || "" : "";
    // Allow public commands through without auth check
    if (
      text.startsWith("/start") ||
      text.startsWith("/daftar") ||
      text.startsWith("/help")
    ) {
      return next();
    }

    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({
      where: { userId: telegramId, adminId: config.adminId },
    });
    if (!seller) {
      return ctx.replyWithHTML(
        "<b>Akses Ditolak!</b>\n\nAkun Anda belum terdaftar.\nKetik /daftar untuk mendaftar sebagai reseller."
      );
    }
    if (seller.status === "Pending") {
      return ctx.replyWithHTML(
        "<b>Akses Ditolak!</b>\n\nAkun Anda masih dalam status <b>Pending</b>.\nMohon tunggu persetujuan Admin."
      );
    }
    (ctx as any).seller = seller;
    return next();
  });

  // /start — cek status registrasi
  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({
      where: { userId: telegramId, adminId: config.adminId },
    });

    if (!seller) {
      return ctx.replyWithHTML(
        `👋 <b>Selamat Datang di ${config.routerName || "Mikbotam"}!</b>\n\n` +
        `Akun Anda belum terdaftar.\n` +
        `Ketik /daftar untuk mendaftar sebagai reseller.`
      );
    }
    if (seller.status === "Pending") {
      return ctx.replyWithHTML(
        `⏳ <b>Akun Pending</b>\n\nPendaftaran Anda sedang menunggu persetujuan Admin.`
      );
    }
    return ctx.replyWithHTML(
      `👋 <b>Halo, ${seller.sellerName}!</b>\n\n${botTexts.welcome}`,
      mainMenu
    );
  });

  // /daftar — pendaftaran reseller baru
  bot.command("daftar", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name || "Reseller";

    const existing = await prisma.seller.findFirst({
      where: { userId: telegramId, adminId: config.adminId },
    });
    if (existing) {
      if (existing.status === "Pending") {
        return ctx.replyWithHTML("⏳ Pendaftaran Anda sudah diterima.\nMohon tunggu persetujuan Admin.");
      }
      return ctx.reply("✅ Anda sudah terdaftar dan aktif.");
    }

    try {
      await prisma.seller.create({
        data: {
          adminId: config.adminId,
          userId: telegramId,
          sellerName: username,
          balance: "0",
          vouchersSold: "0",
          status: "Pending",
          time: new Date().toLocaleTimeString("id-ID"),
          date: new Date().toISOString().split("T")[0],
        },
      });

      // Beritahu admin dengan tombol setujui/tolak
      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ SETUJUI", `adm_appr|${telegramId}`),
            Markup.button.callback("❌ TOLAK", `adm_rejt|${telegramId}`),
          ],
        ]);
        bot.telegram
          .sendMessage(
            config.ownerId,
            `🆕 <b>PENDAFTARAN RESELLER BARU</b>\n\n👤 Nama: <b>${username}</b>\n🆔 ID: <code>${telegramId}</code>\n\nSetujui atau tolak pendaftaran ini.`,
            { parse_mode: "HTML", ...btns }
          )
          .catch(() => {});
      }

      return ctx.replyWithHTML(
        `✅ <b>Pendaftaran Berhasil!</b>\n\n👤 Nama: <b>${username}</b>\n🆔 ID: <code>${telegramId}</code>\n\n` +
        `⏳ Status: <b>Pending</b>\nMohon tunggu persetujuan Admin.`
      );
    } catch (err: any) {
      return ctx.reply(`❌ Gagal mendaftar: ${err.message}`);
    }
  });

  // /help & Bantuan
  const helpAction = async (ctx: any) => {
    return ctx.replyWithHTML(
      `<b>${botTexts.help}</b>\n\n` +
      `/beli — Beli Voucher\n` +
      `/saldo — Cek Saldo\n` +
      `/transfer — Kirim Saldo\n` +
      `/topup — Request Topup\n` +
      `/mutasi — Riwayat Transaksi\n` +
      `/report — Laporan Penjualan\n\n` +
      `🆔 ID Anda: <code>${ctx.from.id}</code>`,
      mainMenu
    );
  };
  bot.command("help", helpAction);
  bot.hears("⚙️ Bantuan", helpAction);

  // /saldo
  const saldoAction = async (ctx: any) => {
    const seller = (ctx as any).seller;
    return ctx.replyWithHTML(
      `💳 Saldo Anda: <b>${formatIDR(parseFloat(seller.balance || "0"))}</b>`
    );
  };
  bot.command("saldo", saldoAction);
  bot.hears("💰 Cek Saldo", saldoAction);

  // /beli & Menu Voucher
  const menuVoucherAction = async (ctx: any) => {
    const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
    const pkgs = JSON.parse(vConfig?.settings || "[]");
    if (pkgs.length === 0) return ctx.reply("Belum ada paket voucher.");

    const buttons: any[] = [];
    for (let i = 0; i < pkgs.length; i += 2) {
      const row = [
        Markup.button.callback(
          pkgs[i].Voucher || pkgs[i].name || `Paket ${i + 1}`,
          `buy_vcr|${i}`
        ),
      ];
      if (pkgs[i + 1]) {
        row.push(
          Markup.button.callback(
            pkgs[i + 1].Voucher || pkgs[i + 1].name || `Paket ${i + 2}`,
            `buy_vcr|${i + 1}`
          )
        );
      }
      buttons.push(row);
    }
    return ctx.replyWithHTML("<b>Pilih paket voucher:</b>", Markup.inlineKeyboard(buttons));
  };
  bot.command("beli", menuVoucherAction);
  bot.command("menu", menuVoucherAction);
  bot.hears("🎫 Menu Voucher", menuVoucherAction);

  // /transfer
  const handleTransferInit = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const otherSellers = await prisma.seller.findMany({
      where: {
        adminId: config.adminId,
        userId: { not: telegramId },
        status: "Active",
      },
      take: 10,
    });
    if (otherSellers.length === 0) {
      return ctx.reply("❌ Tidak ada reseller lain yang terdaftar.");
    }
    const buttons = otherSellers.map((s) => [
      Markup.button.callback(`👤 ${s.sellerName}`, `tr_to|${s.userId}|${s.sellerName}`),
    ]);
    return ctx.replyWithHTML(
      "<b>Pilih Reseller Penerima:</b>",
      Markup.inlineKeyboard(buttons)
    );
  };
  bot.command("transfer", handleTransferInit);
  bot.hears("💸 Transfer Saldo", handleTransferInit);

  // /topup
  const handleTopupInit = async (ctx: any) => {
    topupStates.set(ctx.from.id.toString(), {});
    return ctx.reply(
      "💰 Masukkan jumlah saldo yang ingin Anda topup:\n(Ketik nominal angka saja, misal: 50000)"
    );
  };
  bot.command("topup", handleTopupInit);
  bot.hears("💳 Request Topup", handleTopupInit);

  // /mutasi
  const mutasiAction = async (ctx: any) => {
    const txs = await prisma.transaction.findMany({
      where: { userId: ctx.from.id.toString() },
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

  // /report
  const reportAction = async (ctx: any) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({
      where: { userId: ctx.from.id.toString(), date: today },
    });
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(
      `📊 <b>Laporan Hari Ini</b>\n📅 ${today}\n\n` +
      `✅ Terjual: <b>${reports.length} Voucher</b>\n` +
      `💰 Omset: <b>${formatIDR(total)}</b>`
    );
  };
  bot.command("report", reportAction);
  bot.hears("📊 Report", reportAction);

  // Status Router
  bot.hears("📡 Status Router", async (ctx) => {
    try {
      const stats = await getRouterStats({
        routerIp: config.routerIp,
        routerUsername: config.routerUsername,
        routerPassword: config.routerPassword,
        port: config.port,
      });
      return ctx.replyWithHTML(
        `📊 <b>Status: ${stats.routerName}</b>\n` +
        `🌡 CPU: ${stats.cpuLoad}%\n` +
        `🧠 RAM: ${Math.round(parseInt(stats.freeMemory) / 1024 / 1024)}MB free\n` +
        `🕒 Uptime: ${stats.uptime}`
      );
    } catch {
      return ctx.reply("❌ Gagal mengambil status router.");
    }
  });

  // CALLBACK QUERY HANDLER
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // Beli voucher
    if (data.startsWith("buy_vcr|")) {
      const pkgIdx = parseInt(data.split("|")[1]);
      const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const pkgs = JSON.parse(vConfig?.settings || "[]");
      const pkg = pkgs[pkgIdx];
      if (!pkg) return ctx.answerCbQuery("Paket tidak ditemukan.", { show_alert: true });

      const seller = (ctx as any).seller;
      if (!seller) return ctx.answerCbQuery("Sesi habis, ketik /beli ulang.", { show_alert: true });

      const price = parseFloat(pkg.price);
      const markup = parseFloat(pkg.markup || "0");
      const adminPrice = price - markup;

      if (parseFloat(seller.balance || "0") < adminPrice) {
        return ctx.answerCbQuery("❌ Saldo tidak cukup!", { show_alert: true });
      }

      try {
        const vCode = generateVoucher({
          length: parseInt(pkg.length || "6"),
          type: (pkg.typechar || "mix") as any,
        });

        await beliVoucher({
          userId: telegramId,
          sellerName: seller.sellerName || "Unknown",
          price,
          markup,
          username: vCode,
          password: vCode,
          expiry: pkg.validity || "30d",
          status: "Success",
          routerName: config.routerName || "MikroTik",
          origin: "BOT",
        });

        // Kirim ke MikroTik dengan limit-uptime sesuai validity paket
        await addHotspotUser({
          server: pkg.server || "all",
          name: vCode,
          password: vCode,
          profile: pkg.profile,
          limitUptime: pkg.validity || undefined,
          comment: `vc-bot|${seller.sellerName}`,
        });

        await ctx.deleteMessage().catch(() => {});
        return ctx.replyWithHTML(
          `✅ <b>Voucher Berhasil!</b>\n\n` +
          `👤 User: <code>${vCode}</code>\n` +
          `🔑 Pass: <code>${vCode}</code>\n` +
          `📦 Profil: ${pkg.profile}\n` +
          `⏰ Masa Aktif: ${pkg.validity || "-"}\n` +
          `💰 Harga: ${formatIDR(price)}\n` +
          `----------------------------\n` +
          `GUNAKAN INTERNET DENGAN BIJAK`
        );
      } catch (e: any) {
        return ctx.reply(`❌ Gagal: ${e.message}`);
      }
    }

    // Transfer — pilih penerima
    if (data.startsWith("tr_to|")) {
      const [, tId, tName] = data.split("|");
      transferStates.set(telegramId, { targetId: tId, targetName: tName });
      await ctx.editMessageText(
        `Kamu akan mengirim saldo ke <b>${tName}</b>.\n\n<b>Ketik jumlah yang ingin dikirim:</b>`,
        { parse_mode: "HTML" }
      );
      return ctx.answerCbQuery();
    }

    // Admin: setujui reseller
    if (data.startsWith("adm_appr|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const tId = data.split("|")[1];
      await prisma.seller.updateMany({
        where: { userId: tId, adminId: config.adminId },
        data: { status: "Active" },
      });
      await ctx.editMessageText("✅ Reseller disetujui!");
      bot.telegram
        .sendMessage(tId, "🎊 Akun reseller Anda sudah <b>Aktif</b>!\nKetik /start untuk mulai.", {
          parse_mode: "HTML",
        })
        .catch(() => {});
      return ctx.answerCbQuery();
    }

    // Admin: tolak reseller
    if (data.startsWith("adm_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const tId = data.split("|")[1];
      await prisma.seller.deleteMany({
        where: { userId: tId, adminId: config.adminId, status: "Pending" },
      });
      await ctx.editMessageText("❌ Pendaftaran ditolak.");
      bot.telegram
        .sendMessage(tId, "❌ Maaf, pendaftaran reseller Anda ditolak oleh Admin.")
        .catch(() => {});
      return ctx.answerCbQuery();
    }

    // Admin: setujui topup
    if (data.startsWith("tp_appr|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const [, tId, amt] = data.split("|");
      await topupReseller(tId, parseFloat(amt), "Admin Bot", parseInt(config.adminId));
      await ctx.editMessageText(`✅ Topup ${formatIDR(parseFloat(amt))} berhasil!`);
      bot.telegram
        .sendMessage(
          tId,
          `💰 Saldo Anda bertambah <b>${formatIDR(parseFloat(amt))}</b>!\nKetik /saldo untuk cek saldo.`,
          { parse_mode: "HTML" }
        )
        .catch(() => {});
      return ctx.answerCbQuery();
    }

    // Admin: tolak topup
    if (data.startsWith("tp_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const tId = data.split("|")[1];
      await ctx.editMessageText("❌ Request topup ditolak.");
      bot.telegram
        .sendMessage(tId, "❌ Request topup Anda ditolak oleh Admin.")
        .catch(() => {});
      return ctx.answerCbQuery();
    }

    return ctx.answerCbQuery();
  });

  // TEXT HANDLER — state machine untuk transfer & topup
  bot.on("text", async (ctx, next) => {
    const telegramId = ctx.from.id.toString();

    // Proses jumlah transfer
    const trState = transferStates.get(telegramId);
    if (trState?.targetId && !trState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount <= 0) return ctx.reply("❌ Masukkan angka nominal yang valid.");
      try {
        await transferBalance(telegramId, trState.targetId, amount);
        transferStates.delete(telegramId);
        return ctx.replyWithHTML(
          `✅ <b>Transfer Berhasil!</b>\n\nKe: <b>${trState.targetName}</b>\nJumlah: <b>${formatIDR(amount)}</b>`
        );
      } catch (e: any) {
        transferStates.delete(telegramId);
        return ctx.reply(`❌ Gagal transfer: ${e.message}`);
      }
    }

    // Proses jumlah topup
    const tpState = topupStates.get(telegramId);
    if (tpState && !tpState.amount) {
      const amount = parseFloat(ctx.message.text.replace(/\D/g, ""));
      if (isNaN(amount) || amount < 1000) return ctx.reply("❌ Minimal topup adalah Rp 1.000");
      topupStates.delete(telegramId);

      const seller = (ctx as any).seller;
      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ TERIMA", `tp_appr|${telegramId}|${amount}`),
            Markup.button.callback("❌ TOLAK", `tp_rejt|${telegramId}`),
          ],
        ]);
        bot.telegram
          .sendMessage(
            config.ownerId,
            `💰 <b>REQUEST TOPUP</b>\n\nReseller: ${seller?.sellerName || "-"}\nID: <code>${telegramId}</code>\nJumlah: <b>${formatIDR(amount)}</b>`,
            { parse_mode: "HTML", ...btns }
          )
          .catch(() => {});
      }
      return ctx.replyWithHTML(
        `✅ Request topup <b>${formatIDR(amount)}</b> terkirim.\nMohon tunggu persetujuan Admin.`
      );
    }

    return next();
  });

  // Daftarkan daftar perintah ke Telegram
  bot.telegram
    .setMyCommands([
      { command: "start", description: "Mulai / Menu Utama" },
      { command: "daftar", description: "Daftar sebagai reseller" },
      { command: "beli", description: "Beli Voucher" },
      { command: "saldo", description: "Cek Saldo" },
      { command: "transfer", description: "Kirim Saldo ke Reseller Lain" },
      { command: "topup", description: "Request Topup Saldo" },
      { command: "mutasi", description: "Riwayat Transaksi" },
      { command: "report", description: "Laporan Penjualan Hari Ini" },
      { command: "help", description: "Bantuan" },
    ])
    .catch(() => {});
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
    const config = await prisma.systemConfig.findFirst({
      where: { adminId: adminId, botToken: { not: null } },
    });
    if (!config?.botToken) return;
    const bot = new Telegraf(config.botToken);
    await bot.telegram.sendMessage(userId, message, { parse_mode: "HTML" });
  } catch (err: any) {
    console.error(`sendBotMessage failed: ${err.message}`);
  }
}
