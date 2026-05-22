import { Telegraf, Markup } from "telegraf";
import { prisma } from "./prisma";
import { addHotspotUser, getHotspotUsers, removeHotspotUser } from "./mikrotik/hotspot";
import { generateVoucher } from "./mikrotik/generator";
import { beliVoucher, logVoucherFailure, topdownReseller, topupReseller, transferBalance } from "./actions/transactions";
import { getMikrotikConnection, getRouterStats } from "./mikrotik";
import { formatBytes, formatIDR, formatUptime } from "./formatters";

const botRegistry: Map<string, Telegraf> = new Map();
const transferStates: Map<string, { targetId?: string; targetName?: string; amount?: number }> = new Map();
const topupStates: Map<string, { amount?: number }> = new Map();
const QUICK_TOPUP_AMOUNTS = [10000, 15000, 20000, 25000, 30000, 50000, 100000, 150000, 200000];

function isOwner(ctx: any, config: any) {
  return ctx.from?.id?.toString() === config.ownerId?.toString();
}

function getCommandArgs(ctx: any) {
  const text = ctx.message && "text" in ctx.message ? ctx.message.text || "" : "";
  return text.trim().split(/\s+/).slice(1);
}

function formatDateTime(date = new Date()) {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseAmount(input: string) {
  const amount = parseFloat((input || "").replace(/\D/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function splitMessage(text: string, max = 3900) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += max) chunks.push(text.slice(i, i + max));
  return chunks;
}

function routerConfig(config: any) {
  return {
    routerIp: config.routerIp,
    routerUsername: config.routerUsername,
    routerPassword: config.routerPassword,
    port: config.port,
  };
}

function getPackageName(pkg: any, idx: number) {
  return pkg.Text_List || pkg.Voucher || pkg.name || `Paket ${idx + 1}`;
}

function getPackagePrice(pkg: any) {
  return parseFloat(pkg.price || pkg.Prince || pkg.harga || "0");
}

function getPackageMarkup(pkg: any) {
  return parseFloat(pkg.markup || "0");
}

function getSellerVoucherGroup(seller: any) {
  try {
    return JSON.parse(seller?.settings || "{}").voucherGroup || "default";
  } catch {
    return "default";
  }
}

function packageMatchesGroup(pkg: any, sellerGroup: string) {
  const groups = String(pkg.grupvc || "|default|");
  return groups.includes(`|${sellerGroup}|`) || groups.includes("|default|");
}

function normalizeVoucherTypeChar(typechar: any) {
  const map: Record<string, string> = {
    "1": "num",
    "2": "up",
    "3": "low",
    "4": "letters",
    "5": "full",
    "6": "lowNum",
    "7": "mix",
    checkCode: "full",
  };
  return map[String(typechar || "")] || typechar || "mix";
}

function formatPackageDetails(pkg: any, idx: number) {
  const price = getPackagePrice(pkg);
  const markup = getPackageMarkup(pkg);
  const adminPrice = Math.max(price - markup, 0);
  const quota = pkg.limit_total && parseFloat(pkg.limit_total) > 0 ? `${pkg.limit_total} MB` : "-";
  return (
    `<b>${idx + 1}. ${getPackageName(pkg, idx)}</b>\n` +
    `Harga jual: <b>${formatIDR(price)}</b>\n` +
    `Modal reseller: <b>${formatIDR(adminPrice)}</b>\n` +
    `Komisi: ${formatIDR(markup)}\n` +
    `Profil: ${pkg.profile || "-"} | Aktif: ${pkg.validity || "-"} | Quota: ${quota}\n`
  );
}

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
    const telegramId = ctx.from.id.toString();
    if (telegramId === config.ownerId?.toString()) return next();

    // Allow public commands through without auth check
    if (
      text.startsWith("/start") ||
      text.startsWith("/daftar") ||
      text.startsWith("/help") ||
      text.startsWith("/cekid")
    ) {
      return next();
    }

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
    const adminHelp = isOwner(ctx, config)
      ? `\n<b>Admin Commands</b>\n` +
        `/resource — Detail resource router\n` +
        `/netwatch — Daftar host netwatch\n` +
        `/hotspot aktif — User hotspot aktif\n` +
        `/hotspot user — Daftar user hotspot\n` +
        `/cekuser username — Cari user hotspot\n` +
        `/daftarid id nama hp saldo — Tambah reseller manual\n` +
        `/topup id nominal — Tambah saldo reseller\n` +
        `/topdown id nominal — Kurangi saldo reseller\n`
      : "";

    return ctx.replyWithHTML(
      `<b>${botTexts.help}</b>\n\n` +
      `/menu atau /beli — Beli Voucher\n` +
      `/saldo atau /ceksaldo — Cek Saldo\n` +
      `/cekid — Info ID Telegram\n` +
      `/deposit atau /topup — Request Topup\n` +
      `/transfer — Kirim Saldo\n` +
      `/mutasi — Riwayat Transaksi\n` +
      `/report — Laporan Penjualan\n` +
      adminHelp +
      `\n` +
      `🆔 ID Anda: <code>${ctx.from.id}</code>`,
      mainMenu
    );
  };
  bot.command("help", helpAction);
  bot.hears("⚙️ Bantuan", helpAction);

  // /saldo
  const saldoAction = async (ctx: any) => {
    let seller = (ctx as any).seller;
    if (!seller) {
      seller = await prisma.seller.findFirst({
        where: { userId: ctx.from.id.toString(), adminId: config.adminId },
      });
    }
    if (!seller) return ctx.replyWithHTML("Akun belum terdaftar. Ketik /daftar untuk mendaftar.");

    return ctx.replyWithHTML(
      `💳 <b>INFORMASI SALDO</b>\n\n` +
      `👤 Reseller: <b>${seller.sellerName || "-"}</b>\n` +
      `🆔 ID Telegram: <code>${seller.userId || ctx.from.id}</code>\n` +
      `📌 Status: <b>${seller.status || "-"}</b>\n` +
      `🎫 Voucher Terjual: <b>${seller.vouchersSold || "0"}</b>\n\n` +
      `💰 Saldo Saat Ini: <b>${formatIDR(parseFloat(seller.balance || "0"))}</b>\n` +
      `🕒 Update: ${seller.date || "-"} ${seller.time || ""}`
    );
  };
  bot.command("saldo", saldoAction);
  bot.command("ceksaldo", saldoAction);
  bot.command("lihatsaldo", saldoAction);
  bot.hears("💰 Cek Saldo", saldoAction);

  // /cekid
  const cekIdAction = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({
      where: { userId: telegramId, adminId: config.adminId },
    });
    return ctx.replyWithHTML(
      `🆔 <b>INFORMASI ID ANDA</b>\n\n` +
      `ID Telegram: <code>${telegramId}</code>\n` +
      `Username: ${ctx.from.username ? `@${ctx.from.username}` : "-"}\n` +
      `Nama: ${ctx.from.first_name || "-"}\n` +
      `Status: <b>${seller ? seller.status || "Terdaftar" : "Belum Terdaftar"}</b>\n` +
      `Router: ${config.routerName || "Mikbotam"}`
    );
  };
  bot.command("cekid", cekIdAction);

  // /beli & Menu Voucher
  const menuVoucherAction = async (ctx: any) => {
    const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
    const seller = (ctx as any).seller;
    const sellerGroup = getSellerVoucherGroup(seller);
    const pkgs = JSON.parse(vConfig?.settings || "[]").filter((pkg: any) => packageMatchesGroup(pkg, sellerGroup));
    if (pkgs.length === 0) return ctx.reply("Belum ada paket voucher untuk group akun Anda.");

    const buttons: any[] = [];
    for (let i = 0; i < pkgs.length; i += 2) {
      const row = [
        Markup.button.callback(
          getPackageName(pkgs[i], i),
          `buy_vcr|${i}`
        ),
      ];
      if (pkgs[i + 1]) {
        row.push(
          Markup.button.callback(
            getPackageName(pkgs[i + 1], i + 1),
            `buy_vcr|${i + 1}`
          )
        );
      }
      buttons.push(row);
    }
    const packageList = pkgs.map(formatPackageDetails).join("\n");
    return ctx.replyWithHTML(
      `🎫 <b>MENU VOUCHER</b>\n\n` +
      `👤 Reseller: <b>${seller?.sellerName || "-"}</b>\n` +
      `🏷 Group: <b>${sellerGroup}</b>\n` +
      `💰 Saldo: <b>${formatIDR(parseFloat(seller?.balance || "0"))}</b>\n\n` +
      `${packageList}\n` +
      `<b>Pilih paket melalui tombol di bawah:</b>`,
      Markup.inlineKeyboard(buttons)
    );
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
    const args = getCommandArgs(ctx);
    if (isOwner(ctx, config) && args.length >= 2) {
      const [targetUserId, amountRaw] = args;
      const amount = parseAmount(amountRaw);
      if (!targetUserId || amount <= 0) return ctx.reply("Format: /topup id_telegram nominal");
      try {
        const result = await topupReseller(targetUserId, amount, "BOT_ADMIN", parseInt(config.adminId));
        return ctx.replyWithHTML(
          `✅ <b>TOPUP ADMIN BERHASIL</b>\n\n` +
          `👤 Reseller: <b>${result.sellerName || "-"}</b>\n` +
          `🆔 ID: <code>${targetUserId}</code>\n` +
          `💵 Nominal: <b>${formatIDR(amount)}</b>\n` +
          `💳 Saldo Awal: ${formatIDR(result.balanceStart)}\n` +
          `💰 Saldo Akhir: <b>${formatIDR(result.newBalance)}</b>\n` +
          `🕒 Waktu: ${result.date} ${result.time}`
        );
      } catch (e: any) {
        return ctx.reply(`❌ Gagal topup: ${e.message}`);
      }
    }

    topupStates.set(ctx.from.id.toString(), {});
    const rows = [];
    for (let i = 0; i < QUICK_TOPUP_AMOUNTS.length; i += 3) {
      rows.push(
        QUICK_TOPUP_AMOUNTS.slice(i, i + 3).map((amount) =>
          Markup.button.callback(formatIDR(amount), `tp_req|${amount}`)
        )
      );
    }

    const methods = await prisma.depositMethod.findMany({
      where: { adminId: config.adminId, active: true },
      take: 5,
      orderBy: { id: "asc" },
    }).catch(() => []);
    const methodText = methods.length
      ? methods.map((m) => `• ${m.name}: <code>${m.number}</code> a.n. ${m.owner}`).join("\n")
      : "Metode pembayaran belum diatur di dashboard. Hubungi admin setelah membuat request.";

    return ctx.replyWithHTML(
      `💳 <b>REQUEST TOPUP SALDO</b>\n\n` +
      `Pilih nominal cepat lewat tombol, atau ketik nominal angka saja.\n` +
      `Contoh: <code>50000</code>\n\n` +
      `<b>Metode Pembayaran:</b>\n${methodText}\n\n` +
      `Setelah transfer, kirim bukti pembayaran ke admin dengan mencantumkan ID Telegram Anda.`,
      Markup.inlineKeyboard(rows)
    );
  };
  bot.command("topup", handleTopupInit);
  bot.command("deposit", handleTopupInit);
  bot.command("request", handleTopupInit);
  bot.hears("💳 Request Topup", handleTopupInit);

  // /topdown khusus owner
  bot.command("topdown", async (ctx: any) => {
    if (!isOwner(ctx, config)) return ctx.reply("Maaf, akses hanya untuk Admin.");
    const [targetUserId, amountRaw] = getCommandArgs(ctx);
    const amount = parseAmount(amountRaw || "");
    if (!targetUserId || amount <= 0) return ctx.reply("Format: /topdown id_telegram nominal");
    try {
      const result = await topdownReseller(targetUserId, amount, "BOT_ADMIN", parseInt(config.adminId));
      return ctx.replyWithHTML(
        `✅ <b>TOPDOWN BERHASIL</b>\n\n` +
        `👤 Reseller: <b>${result.sellerName || "-"}</b>\n` +
        `🆔 ID: <code>${targetUserId}</code>\n` +
        `💵 Nominal: <b>${formatIDR(amount)}</b>\n` +
        `💳 Saldo Awal: ${formatIDR(result.balanceStart)}\n` +
        `💰 Saldo Akhir: <b>${formatIDR(result.newBalance)}</b>`
      );
    } catch (e: any) {
      return ctx.reply(`❌ Gagal topdown: ${e.message}`);
    }
  });

  // /daftarid khusus owner
  bot.command("daftarid", async (ctx: any) => {
    if (!isOwner(ctx, config)) return ctx.reply("Maaf, akses hanya untuk Admin.");
    const [targetUserId, name, phoneNumber, balanceRaw] = getCommandArgs(ctx);
    const balance = parseAmount(balanceRaw || "0");
    if (!targetUserId || !name) return ctx.reply("Format: /daftarid id_telegram nama no_hp saldo");
    const existing = await prisma.seller.findFirst({ where: { userId: targetUserId, adminId: config.adminId } });
    if (existing) return ctx.reply("User sudah terdaftar. Periksa kembali ID Telegram.");
    const now = new Date();
    await prisma.seller.create({
      data: {
        adminId: config.adminId,
        userId: targetUserId,
        sellerName: name,
        phoneNumber: phoneNumber || "",
        balance: balance.toString(),
        vouchersSold: "0",
        status: "Active",
        time: now.toLocaleTimeString("id-ID"),
        date: now.toISOString().split("T")[0],
      },
    });
    return ctx.replyWithHTML(
      `✅ <b>RESELLER DITAMBAHKAN</b>\n\n` +
      `👤 Nama: <b>${name}</b>\n` +
      `🆔 ID: <code>${targetUserId}</code>\n` +
      `📱 HP: ${phoneNumber || "-"}\n` +
      `💰 Saldo Awal: <b>${formatIDR(balance)}</b>`
    );
  });

  // /mutasi
  const mutasiAction = async (ctx: any) => {
    const txs = await prisma.transaction.findMany({
      where: { userId: ctx.from.id.toString(), adminId: config.adminId },
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
    if (isOwner(ctx, config)) {
      const monthPrefix = new Date().toISOString().slice(0, 7);
      const [reports, topups, sellers] = await Promise.all([
        prisma.report.findMany({
          where: { adminId: config.adminId, date: { startsWith: monthPrefix } },
        }),
        prisma.transaction.findMany({
          where: { adminId: config.adminId, topUp: { not: null }, date: { startsWith: monthPrefix } },
        }),
        prisma.seller.count({
          where: { adminId: config.adminId, date: { startsWith: monthPrefix } },
        }),
      ]);
      const voucherRevenue = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
      const topupTotal = topups.reduce((s, t) => s + Math.max(parseFloat(t.topUp || "0"), 0), 0);
      return ctx.replyWithHTML(
        `📊 <b>REPORT ADMIN BULAN INI</b>\n` +
        `📅 Periode: ${monthPrefix}\n\n` +
        `🎫 Total Voucher: <b>${reports.length}</b>\n` +
        `💰 Pendapatan Voucher: <b>${formatIDR(voucherRevenue)}</b>\n` +
        `💳 Total Topup: <b>${formatIDR(topupTotal)}</b>\n` +
        `👥 Reseller Baru: <b>${sellers}</b>`
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({
      where: { userId: ctx.from.id.toString(), adminId: config.adminId, date: today },
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
  const routerStatusAction = async (ctx: any) => {
    try {
      const stats = await getRouterStats(routerConfig(config));
      return ctx.replyWithHTML(
        `📡 <b>RESOURCE ROUTER</b>\n\n` +
        `Nama: <b>${stats.routerName || config.routerName || "-"}</b>\n` +
        `Board: ${stats.board || "-"}\n` +
        `RouterOS: ${stats.version || "-"}\n` +
        `CPU: ${stats.cpu || "-"} (${stats.cpuCount || "-"} core)\n` +
        `CPU Load: <b>${stats.cpuLoad || "0"}%</b>\n` +
        `Uptime: ${formatUptime(stats.uptime)}\n\n` +
        `Memory: ${formatBytes(stats.freeMemory)} free / ${formatBytes(stats.totalMemory)} total\n` +
        `Storage: ${formatBytes(stats.freeHdd)} free / ${formatBytes(stats.totalHdd)} total\n` +
        `Bad Blocks: ${stats.badBlocks || "0%"}`
      );
    } catch {
      return ctx.reply("❌ Gagal mengambil status router.");
    }
  };
  bot.command("resource", routerStatusAction);
  bot.hears("📡 Status Router", routerStatusAction);

  bot.command("netwatch", async (ctx: any) => {
    if (!isOwner(ctx, config)) return ctx.reply("Maaf, akses hanya untuk Admin.");
    const conn = await getMikrotikConnection(routerConfig(config));
    try {
      await conn.connect();
      const rows = await conn.write("/tool/netwatch/print");
      if (!rows.length) return ctx.reply("Belum ada host netwatch di router.");
      let text = `🛰 <b>DAFTAR NETWATCH</b>\nTotal: <b>${rows.length}</b>\n\n`;
      rows.forEach((row: any, idx: number) => {
        const status = row.status === "up" ? "UP" : "DOWN";
        text += `${idx + 1}. <code>${row.host || "-"}</code>\nStatus: <b>${status}</b>\nSince: ${row.since || "-"}\nInterval: ${row.interval || "-"}\n\n`;
      });
      for (const chunk of splitMessage(text)) await ctx.replyWithHTML(chunk);
    } catch (e: any) {
      return ctx.reply(`❌ Gagal mengambil netwatch: ${e.message}`);
    } finally {
      conn.close();
    }
  });

  bot.command("hotspot", async (ctx: any) => {
    if (!isOwner(ctx, config)) return ctx.reply("Maaf, akses hanya untuk Admin.");
    const [mode, server] = getCommandArgs(ctx);
    const conn = await getMikrotikConnection(routerConfig(config));
    try {
      await conn.connect();
      if (mode === "aktif" || mode === "active") {
        const cmd = server
          ? ["/ip/hotspot/active/print", `?server=${server}`]
          : "/ip/hotspot/active/print";
        const rows = await conn.write(cmd as any);
        if (!rows.length) return ctx.reply(`Tidak ada user aktif${server ? ` di server ${server}` : ""}.`);
        let text = `👥 <b>HOTSPOT AKTIF</b>\nTotal: <b>${rows.length}</b>\n\n`;
        rows.forEach((u: any, idx: number) => {
          text += `${idx + 1}. <b>${u.user || "-"}</b>\nIP: ${u.address || "-"}\nMAC: ${u["mac-address"] || "-"}\nUptime: ${formatUptime(u.uptime)}\nTraffic: ${formatBytes(u["bytes-in"])} / ${formatBytes(u["bytes-out"])}\nLogin: ${u["login-by"] || "-"}\n\n`;
        });
        for (const chunk of splitMessage(text)) await ctx.replyWithHTML(chunk);
        return;
      }

      if (mode === "user" || mode === "users") {
        const rows = await conn.write("/ip/hotspot/user/print");
        if (!rows.length) return ctx.reply("Belum ada user hotspot.");
        let text = `🎫 <b>USER HOTSPOT</b>\nTotal: <b>${rows.length}</b>\n\n`;
        rows.slice(0, 50).forEach((u: any, idx: number) => {
          text += `${idx + 1}. <b>${u.name || "-"}</b>\nPass: <code>${u.password || "-"}</code>\nProfile: ${u.profile || "-"}\nLimit: ${u["limit-uptime"] || "-"}\nMAC: ${u["mac-address"] || "-"}\nID: <code>${u[".id"] || "-"}</code>\n\n`;
        });
        if (rows.length > 50) text += `Ditampilkan 50 dari ${rows.length} user.`;
        for (const chunk of splitMessage(text)) await ctx.replyWithHTML(chunk);
        return;
      }

      return ctx.replyWithHTML(
        `<b>Format Hotspot:</b>\n` +
        `/hotspot aktif — lihat user aktif\n` +
        `/hotspot aktif nama-server — filter server\n` +
        `/hotspot user — lihat user hotspot\n` +
        `/cekuser username — cari user tertentu`
      );
    } catch (e: any) {
      return ctx.reply(`❌ Gagal mengambil data hotspot: ${e.message}`);
    } finally {
      conn.close();
    }
  });

  bot.command("cekuser", async (ctx: any) => {
    if (!isOwner(ctx, config)) return ctx.reply("Maaf, akses hanya untuk Admin.");
    const [name] = getCommandArgs(ctx);
    if (!name) return ctx.reply("Format: /cekuser username_hotspot");
    const conn = await getMikrotikConnection(routerConfig(config));
    try {
      await conn.connect();
      const [users, schedulers] = await Promise.all([
        conn.write(["/ip/hotspot/user/print", `?name=${name}`]),
        conn.write(["/system/scheduler/print", `?name=${name}`]).catch(() => []),
      ]);
      const user = users[0] as any;
      if (!user) return ctx.reply("User hotspot tidak ditemukan.");
      const sch = (schedulers as any[])[0];
      return ctx.replyWithHTML(
        `🎫 <b>HOTSPOT CLIENT</b>\n\n` +
        `Nama: <b>${user.name || "-"}</b>\n` +
        `Password: <code>${user.password || "-"}</code>\n` +
        `Profile: ${user.profile || "-"}\n` +
        `Limit: ${user["limit-uptime"] || "-"}\n` +
        `Uptime: ${formatUptime(user.uptime)}\n` +
        `Traffic: ${formatBytes(user["bytes-in"])} / ${formatBytes(user["bytes-out"])}\n` +
        `MAC: ${user["mac-address"] || "-"}\n` +
        `ID Router: <code>${user[".id"] || "-"}</code>\n\n` +
        `Expired: <b>${sch?.["next-run"] || "-"}</b>\n` +
        `Scheduler: ${sch ? `${sch["start-date"] || "-"} ${sch["start-time"] || "-"}` : "-"}`
      );
    } catch (e: any) {
      return ctx.reply(`❌ Gagal mencari user: ${e.message}`);
    } finally {
      conn.close();
    }
  });

  // CALLBACK QUERY HANDLER
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // Quick topup nominal from inline buttons
    if (data.startsWith("tp_req|")) {
      const amount = parseAmount(data.split("|")[1]);
      if (amount <= 0) return ctx.answerCbQuery("Nominal tidak valid.", { show_alert: true });
      topupStates.delete(telegramId);
      const seller = (ctx as any).seller;
      if (!seller) return ctx.answerCbQuery("Akun tidak ditemukan.", { show_alert: true });

      const now = new Date();
      const request = await prisma.topupRequest.create({
        data: {
          adminId: config.adminId,
          userId: telegramId,
          sellerName: seller.sellerName || "-",
          amount,
          method: "Telegram Bot",
          status: "Pending",
          time: now.toLocaleTimeString("id-ID"),
          date: now.toISOString().split("T")[0],
        },
      });

      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ TERIMA", `tp_appr|${telegramId}|${amount}|${request.id}`),
            Markup.button.callback("❌ TOLAK", `tp_rejt|${telegramId}|${request.id}`),
          ],
        ]);
        bot.telegram
          .sendMessage(
            config.ownerId,
            `💰 <b>REQUEST TOPUP</b>\n\n` +
            `👤 Reseller: <b>${seller.sellerName || "-"}</b>\n` +
            `🆔 ID: <code>${telegramId}</code>\n` +
            `💵 Jumlah: <b>${formatIDR(amount)}</b>\n` +
            `📌 Status: <b>Pending</b>\n` +
            `🕒 Waktu: ${formatDateTime(now)}\n\n` +
            `Request ID: <code>${request.id}</code>`,
            { parse_mode: "HTML", ...btns }
          )
          .catch(() => {});
      }

      await ctx.editMessageText(
        `✅ Request topup ${formatIDR(amount)} terkirim.\n\nStatus: Pending\nRequest ID: ${request.id}\n\nMohon transfer sesuai nominal dan tunggu persetujuan Admin.`,
      ).catch(() => {});
      return ctx.answerCbQuery("Request topup terkirim.");
    }

    // Beli voucher
    if (data.startsWith("buy_vcr|")) {
      const pkgIdx = parseInt(data.split("|")[1]);
      const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const seller = (ctx as any).seller;
      if (!seller) return ctx.answerCbQuery("Sesi habis, ketik /beli ulang.", { show_alert: true });
      const sellerGroup = getSellerVoucherGroup(seller);
      const pkgs = JSON.parse(vConfig?.settings || "[]").filter((item: any) => packageMatchesGroup(item, sellerGroup));
      const pkg = pkgs[pkgIdx];
      if (!pkg) return ctx.answerCbQuery("Paket tidak ditemukan.", { show_alert: true });

      const price = getPackagePrice(pkg);
      const markup = getPackageMarkup(pkg);
      const adminPrice = price - markup;

      if (parseFloat(seller.balance || "0") < adminPrice) {
        return ctx.answerCbQuery("❌ Saldo tidak cukup!", { show_alert: true });
      }

      let vUser = "";
      let vPass = "";
      let routerUserCreated = false;

      try {
        const vCode = generateVoucher({
          length: parseInt(pkg.length || "6"),
          type: normalizeVoucherTypeChar(pkg.typechar) as any,
          prefix: pkg.prefix || "",
        });

        // type='up' → username ≠ password (seperti PHP), selainnya voucher code (user=pass)
        vUser = vCode;
        vPass = pkg.type === "up"
          ? generateVoucher({ length: parseInt(pkg.length || "6"), type: normalizeVoucherTypeChar(pkg.typechar) as any, prefix: pkg.prefix || "" })
          : vCode;

        const mbToBytes = (value: any) => {
          const mb = parseFloat(value || "0");
          return mb > 0 ? Math.round(mb * 1024 * 1024) : undefined;
        };
        const quotaDownload = mbToBytes(pkg.limit_download);
        const quotaUpload = mbToBytes(pkg.limit_upload);
        const quotaTotal = mbToBytes(pkg.limit_total || pkg.quotaGB);

        const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
        const packageName = getPackageName(pkg, pkgIdx);
        await addHotspotUser({
          server: pkg.server || "all",
          name: vUser,
          password: vPass,
          profile: pkg.profile,
          limitUptime: pkg.validity || undefined,
          limitBytesIn: quotaUpload,
          limitBytesOut: quotaDownload,
          limitBytesTotal: quotaTotal,
          comment: `| ID : ${seller.sellerName || telegramId} | voc : ${packageName} | tgl : ${today} | MIKBOTAM |`,
        }, config);
        routerUserCreated = true;

        const txResult = await beliVoucher({
          userId: telegramId,
          adminId: config.adminId,
          sellerName: seller.sellerName || "Unknown",
          price,
          markup,
          username: vUser,
          password: vPass,
          expiry: pkg.validity || "30d",
          status: "Success",
          routerName: config.routerName || "MikroTik",
          origin: "BOT",
        });

        await ctx.deleteMessage().catch(() => {});
        const passLine = pkg.type === "up"
          ? `👤 User: <code>${vUser}</code>\n🔑 Pass: <code>${vPass}</code>`
          : `🎟 Voucher: <code>${vUser}</code>`;
        const quotaLine = quotaTotal ? `📶 Quota: ${pkg.limit_total || pkg.quotaGB} MB\n` : "";
        const loginLine = config.dnsName ? `🌐 Login: ${config.dnsName}\n` : "";
        return ctx.replyWithHTML(
          `✅ <b>VOUCHER BERHASIL DIBUAT</b>\n\n` +
          `${passLine}\n` +
          `📦 Paket: <b>${packageName}</b>\n` +
          `📡 Server: ${pkg.server || "all"}\n` +
          `📦 Profil: ${pkg.profile || "-"}\n` +
          `⏰ Masa Aktif: ${pkg.validity || "-"}\n` +
          `${quotaLine}` +
          `${loginLine}\n` +
          `💰 Harga Jual: <b>${formatIDR(price)}</b>\n` +
          `💳 Saldo Terpotong: ${formatIDR(adminPrice)}\n` +
          `💵 Komisi Anda: ${formatIDR(markup)}\n` +
          `💰 Sisa Saldo: <b>${formatIDR(txResult.newBalance)}</b>\n` +
          `🕒 Waktu: ${formatDateTime()}\n` +
          `----------------------------\n` +
          `GUNAKAN INTERNET DENGAN BIJAK`
        );
      } catch (e: any) {
        if (routerUserCreated && vUser) {
          try {
            const users = await getHotspotUsers(config);
            const createdUser = users.find((user: any) => user.name === vUser);
            if (createdUser?.[".id"]) await removeHotspotUser(createdUser[".id"], config);
          } catch (rollbackError) {
            console.error("Failed to rollback hotspot user after transaction failure:", rollbackError);
          }
        }

        await logVoucherFailure({
          userId: telegramId,
          adminId: config.adminId,
          sellerName: seller.sellerName || "Unknown",
          price,
          markup,
          username: vUser || undefined,
          password: vPass || undefined,
          expiry: pkg.validity || "30d",
          routerName: config.routerName || "MikroTik",
          origin: "BOT",
          errorMessage: e.message,
        }).catch((logError) => {
          console.error("Failed to log voucher failure:", logError);
        });

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
      const [, tId, amt, reqId] = data.split("|");
      const amount = parseFloat(amt);
      if (!Number.isFinite(amount) || amount <= 0) {
        return ctx.answerCbQuery("Nominal tidak valid.", { show_alert: true });
      }

      if (reqId) {
        const lockedRequest = await prisma.topupRequest.updateMany({
          where: { id: parseInt(reqId), adminId: config.adminId, status: "Pending" },
          data: { status: "Processing" },
        });
        if (lockedRequest.count === 0) {
          return ctx.answerCbQuery("Request ini sudah diproses.", { show_alert: true });
        }
      }

      let result;
      try {
        result = await topupReseller(tId, amount, "Admin Bot", parseInt(config.adminId));
        if (reqId) {
          await prisma.topupRequest.updateMany({
            where: { id: parseInt(reqId), adminId: config.adminId, status: "Processing" },
            data: { status: "Success" },
          });
        }
      } catch (e: any) {
        if (reqId) {
          await prisma.topupRequest.updateMany({
            where: { id: parseInt(reqId), adminId: config.adminId, status: "Processing" },
            data: { status: "Pending" },
          });
        }
        return ctx.answerCbQuery(`Gagal topup: ${e.message}`, { show_alert: true });
      }
      await ctx.editMessageText(
        `✅ TOPUP DISETUJUI\n\n` +
        `Reseller: ${result.sellerName || "-"}\n` +
        `ID: ${tId}\n` +
        `Nominal: ${formatIDR(amount)}\n` +
        `Saldo Awal: ${formatIDR(result.balanceStart)}\n` +
        `Saldo Akhir: ${formatIDR(result.newBalance)}\n` +
        `Waktu: ${result.date} ${result.time}`
      );
      return ctx.answerCbQuery();
    }

    // Admin: tolak topup
    if (data.startsWith("tp_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const [, tId, reqId] = data.split("|");
      if (reqId) {
        await prisma.topupRequest.updateMany({
          where: { id: parseInt(reqId), adminId: config.adminId, status: "Pending" },
          data: { status: "Rejected" },
        });
      }
      await ctx.editMessageText(`❌ REQUEST TOPUP DITOLAK\n\nID: ${tId}\nRequest ID: ${reqId || "-"}`);
      bot.telegram
        .sendMessage(
          tId,
          `❌ <b>REQUEST TOPUP DITOLAK</b>\n\nRequest topup Anda ditolak oleh Admin.\nSilakan hubungi admin jika ada pertanyaan.`,
          { parse_mode: "HTML" }
        )
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
        const result = await transferBalance(telegramId, trState.targetId, amount, config.adminId);
        transferStates.delete(telegramId);
        return ctx.replyWithHTML(
          `✅ <b>TRANSFER BERHASIL</b>\n\n` +
          `Ke: <b>${trState.targetName}</b>\n` +
          `ID Tujuan: <code>${trState.targetId}</code>\n` +
          `Jumlah: <b>${formatIDR(amount)}</b>\n` +
          `Saldo Sekarang: <b>${formatIDR(result.newSenderBalance)}</b>\n` +
          `🕒 Waktu: ${formatDateTime()}`
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
      const now = new Date();
      const request = await prisma.topupRequest.create({
        data: {
          adminId: config.adminId,
          userId: telegramId,
          sellerName: seller?.sellerName || "-",
          amount,
          method: "Telegram Bot",
          status: "Pending",
          time: now.toLocaleTimeString("id-ID"),
          date: now.toISOString().split("T")[0],
        },
      });

      if (config.ownerId) {
        const btns = Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ TERIMA", `tp_appr|${telegramId}|${amount}|${request.id}`),
            Markup.button.callback("❌ TOLAK", `tp_rejt|${telegramId}|${request.id}`),
          ],
        ]);
        bot.telegram
          .sendMessage(
            config.ownerId,
            `💰 <b>REQUEST TOPUP</b>\n\n` +
            `👤 Reseller: <b>${seller?.sellerName || "-"}</b>\n` +
            `🆔 ID: <code>${telegramId}</code>\n` +
            `💵 Jumlah: <b>${formatIDR(amount)}</b>\n` +
            `📌 Status: <b>Pending</b>\n` +
            `🕒 Waktu: ${formatDateTime(now)}\n\n` +
            `Request ID: <code>${request.id}</code>`,
            { parse_mode: "HTML", ...btns }
          )
          .catch(() => {});
      }
      return ctx.replyWithHTML(
        `✅ <b>REQUEST TOPUP TERKIRIM</b>\n\n` +
        `👤 Reseller: <b>${seller?.sellerName || "-"}</b>\n` +
        `🆔 ID Telegram: <code>${telegramId}</code>\n` +
        `💵 Nominal: <b>${formatIDR(amount)}</b>\n` +
        `📌 Status: <b>Pending</b>\n` +
        `🕒 Waktu: ${formatDateTime(now)}\n` +
        `Request ID: <code>${request.id}</code>\n\n` +
        `Mohon transfer sesuai nominal dan tunggu persetujuan Admin.`
      );
    }

    return next();
  });

  // Daftarkan daftar perintah ke Telegram
  bot.telegram
    .setMyCommands([
      { command: "start", description: "Mulai / Menu Utama" },
      { command: "daftar", description: "Daftar sebagai reseller" },
      { command: "menu", description: "Menu Voucher" },
      { command: "beli", description: "Beli Voucher" },
      { command: "saldo", description: "Cek Saldo Detail" },
      { command: "cekid", description: "Cek ID Telegram" },
      { command: "transfer", description: "Kirim Saldo ke Reseller Lain" },
      { command: "topup", description: "Request Topup Saldo" },
      { command: "deposit", description: "Request Deposit Saldo" },
      { command: "mutasi", description: "Riwayat Transaksi" },
      { command: "report", description: "Laporan Penjualan Hari Ini" },
      { command: "resource", description: "Status Resource Router" },
      { command: "netwatch", description: "Monitoring Netwatch" },
      { command: "hotspot", description: "Monitoring Hotspot" },
      { command: "cekuser", description: "Cari User Hotspot" },
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
