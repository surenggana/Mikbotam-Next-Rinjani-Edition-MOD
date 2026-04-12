// @ts-nocheck
const { Telegraf, Markup } = require("telegraf");
const { RouterOSAPI } = require("node-routeros");
const { PrismaClient } = require("../src/generated/client/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

// ─── Inisialisasi Prisma ─────────────────────────────────────────────────────
function initPrisma() {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/mikbotam.db";
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter });
}

const prisma = initPrisma();

// ─── Helper: Generate Voucher Code ───────────────────────────────────────────
function generateVoucher(length = 6, type = "mix") {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums  = "23456789";
  const charsets = { up: upper, low: lower, num: nums, mix: upper + nums };
  const charset = charsets[type] || upper + nums;
  let result = "";
  for (let i = 0; i < length; i++)
    result += charset[Math.floor(Math.random() * charset.length)];
  return result;
}

// ─── Helper: Rupiah format ────────────────────────────────────────────────────
function rp(n) {
  return "Rp " + parseFloat(n || 0).toLocaleString("id-ID");
}

// ─── Helper: Transaksi Beli Voucher (tanpa auth()) ───────────────────────────
async function beliVoucher({ userId, sellerName, price, username, password, expiry, routerName }) {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  const dateStr = now.toISOString().split("T")[0];

  return prisma.$transaction(async (tx) => {
    const seller = await tx.seller.findFirst({ where: { userId } });
    if (!seller) throw new Error("Seller tidak ditemukan");

    const currentBalance = parseFloat(seller.balance || "0");
    const newBalance = currentBalance - price;
    if (newBalance < 0) throw new Error("Saldo tidak mencukupi");

    await tx.transaction.create({
      data: {
        userId, sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        voucherBuy: price.toString(),
        voucherMarkup: "0",
        voucherUsername: username,
        voucherPassword: password,
        voucherExpiry: expiry,
        description: "Success",
        routerName,
        time: timeStr,
        date: dateStr,
      },
    });

    await tx.seller.update({
      where: { no: seller.no },
      data: {
        balance: newBalance.toString(),
        vouchersSold: (parseInt(seller.vouchersSold || "0") + 1).toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    await tx.report.create({
      data: {
        userId, userName: sellerName,
        price: price.toString(),
        status: "Success",
        transaction: "vc",
        revenue: price.toString(),
        time: timeStr,
        date: dateStr,
      },
    });

    return { newBalance };
  });
}

// ─── Helper: Topup Reseller (tanpa auth()) ────────────────────────────────────
async function topupReseller(targetUserId, amount, fromName = "Admin") {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  const dateStr = now.toISOString().split("T")[0];

  return prisma.$transaction(async (tx) => {
    const seller = await tx.seller.findFirst({ where: { userId: targetUserId } });
    if (!seller) throw new Error("Seller tidak ditemukan");

    const currentBalance = parseFloat(seller.balance || "0");
    const newBalance = currentBalance + amount;

    await tx.seller.update({
      where: { no: seller.no },
      data: { balance: newBalance.toString(), time: timeStr, date: dateStr },
    });

    await tx.transaction.create({
      data: {
        userId: targetUserId,
        sellerName: seller.sellerName,
        balanceStart: currentBalance.toString(),
        balanceEnd: newBalance.toString(),
        topUp: amount.toString(),
        topUpFromId: fromName,
        description: "topup",
        time: timeStr,
        date: dateStr,
      },
    });

    return { newBalance };
  });
}

// ─── Helper: Koneksi MikroTik dari config ─────────────────────────────────────
async function getMikrotikConn(config) {
  const conn = new RouterOSAPI({
    host: config.routerIp || "",
    user: config.routerUsername || "",
    password: config.routerPassword || "",
    port: parseInt(config.port || "8728"),
    timeout: 5,
  });
  await conn.connect();
  return conn;
}

// ─── Pasang Logic Bot ke Instance Telegraf ────────────────────────────────────
function attachBotLogic(bot, config) {
  const ownerId   = config.ownerId || "";
  const routerName = config.routerName || "MikroTik";

  let botTexts = {
    welcome: "Selamat datang di Bot MikroTik kami!",
    help: "Gunakan menu di bawah untuk mengelola akun Anda.",
    success_buy: "✅ <b>Voucher Berhasil Dibuat!</b>",
    fail_balance: "❌ <b>Maaf, saldo Anda tidak cukup.</b>",
  };
  if (config.settingsText) {
    try { Object.assign(botTexts, JSON.parse(config.settingsText)); } catch (e) {}
  }

  const mainMenu = Markup.keyboard([
    ["💰 Cek Saldo", "🎫 Beli Voucher"],
    ["📂 Mutasi", "📊 Report"],
    ["💳 Topup Saldo", "📡 Ping Router"],
    ["⚙️ Bantuan"],
  ]).resize();

  // ── /start ────────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    const seller = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    if (!seller)
      return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nID Telegram Anda belum terdaftar di sistem.");
    return ctx.replyWithHTML(
      `<b>${botTexts.welcome}</b>\n\nHalo @${ctx.from.username || ctx.from.first_name}, terhubung ke Router: <b>${routerName}</b>`,
      mainMenu
    );
  });

  // ── /help ─────────────────────────────────────────────────────────────────
  bot.help((ctx) =>
    ctx.replyWithHTML(
      `<b>Daftar Perintah:</b>\n\n` +
      `/cek_saldo - Cek saldo Anda\n` +
      `/vc [profil] [harga] - Buat voucher Hotspot\n` +
      `/up [profil] [harga] - Buat akun PPP\n` +
      `/mutasi - Riwayat 5 transaksi terakhir\n` +
      `/ping - Cek status router\n` +
      `/report - Laporan penjualan hari ini\n` +
      `/help - Tampilkan bantuan ini\n\n` +
      `<b>Perintah Admin:</b>\n` +
      `/topup [id_user] [jumlah]\n` +
      `/list_reseller\n` +
      `/hapus_reseller [id_user]\n` +
      `/setup_cron - Pasang scheduler MikroTik`,
      mainMenu
    )
  );

  // ── Keyboard handlers ─────────────────────────────────────────────────────
  bot.hears("💰 Cek Saldo", async (ctx) => {
    const seller = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>${rp(seller.balance)}</b>`);
  });

  bot.hears("📂 Mutasi", async (ctx) => {
    const txs = await prisma.transaction.findMany({
      where: { userId: ctx.from.id.toString() },
      orderBy: { no: "desc" },
      take: 5,
    });
    if (!txs.length) return ctx.reply("Belum ada riwayat transaksi.");
    let msg = "<b>5 Transaksi Terakhir:</b>\n\n";
    txs.forEach((t) => {
      msg += `📅 ${t.date} ${t.time}\n📝 ${t.description || "Beli Voucher"}\n💰 ${rp(t.voucherBuy || t.topUp || "0")}\n------------------\n`;
    });
    return ctx.replyWithHTML(msg);
  });

  bot.hears("📊 Report", async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({ where: { date: today } });
    if (!reports.length) return ctx.reply(`Belum ada penjualan hari ini (${today}).`);
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(
      `📊 <b>Laporan Hari Ini</b>\n📅 ${today}\n\n✅ Terjual: <b>${reports.length} Voucher</b>\n💰 Omset: <b>${rp(total)}</b>`
    );
  });

  bot.hears("📡 Ping Router", async (ctx) => {
    await ctx.reply("Sedang mengecek status router...");
    try {
      const conn = await getMikrotikConn(config);
      const [identity, resource] = await Promise.all([
        conn.write("/system/identity/print"),
        conn.write("/system/resource/print"),
      ]);
      conn.close();
      const id = identity[0]; const res = resource[0];
      return ctx.replyWithHTML(
        `📊 <b>Status Router: ${id.name}</b>\n\n🌡 CPU: ${res["cpu-load"]}%\n🧠 RAM: ${Math.round(parseInt(res["free-memory"]) / 1024 / 1024)} MB free\n🕒 Uptime: ${res.uptime}\n🛠 Version: ${res.version}`
      );
    } catch { return ctx.reply("Gagal mengambil status router."); }
  });

  bot.hears("🎫 Beli Voucher", (ctx) =>
    ctx.reply("Gunakan perintah:\n/vc [profil] [harga]\nContoh: /vc 1Jam 2000")
  );

  bot.hears("💳 Topup Saldo", (ctx) =>
    ctx.reply("Hubungi admin untuk melakukan topup saldo.")
  );

  bot.hears("⚙️ Bantuan", (ctx) =>
    ctx.replyWithHTML(`<b>${botTexts.help}</b>\n\nPerintah:\n/vc [profil] [harga]\n/up [profil] [harga]`)
  );

  // ── /cek_saldo ────────────────────────────────────────────────────────────
  bot.command("cek_saldo", async (ctx) => {
    const seller = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    return ctx.replyWithHTML(`Saldo Anda: <b>${rp(seller.balance)}</b>`);
  });

  // ── /ping ─────────────────────────────────────────────────────────────────
  bot.command("ping", async (ctx) => {
    await ctx.reply("Sedang mengecek status router...");
    try {
      const conn = await getMikrotikConn(config);
      const [identity, resource] = await Promise.all([
        conn.write("/system/identity/print"),
        conn.write("/system/resource/print"),
      ]);
      conn.close();
      const id = identity[0]; const res = resource[0];
      return ctx.replyWithHTML(
        `📊 <b>Status Router: ${id.name}</b>\n\n🌡 CPU: ${res["cpu-load"]}%\n🧠 RAM: ${Math.round(parseInt(res["free-memory"]) / 1024 / 1024)} MB free\n🕒 Uptime: ${res.uptime}\n🛠 Version: ${res.version}`
      );
    } catch { return ctx.reply("Gagal mengambil status router."); }
  });

  // ── /mutasi ───────────────────────────────────────────────────────────────
  bot.command("mutasi", async (ctx) => {
    const txs = await prisma.transaction.findMany({
      where: { userId: ctx.from.id.toString() },
      orderBy: { no: "desc" },
      take: 5,
    });
    if (!txs.length) return ctx.reply("Belum ada riwayat transaksi.");
    let msg = "<b>5 Transaksi Terakhir:</b>\n\n";
    txs.forEach((t) => {
      msg += `📅 ${t.date} ${t.time}\n📝 ${t.description || "Beli Voucher"}\n💰 ${rp(t.voucherBuy || t.topUp || "0")}\n------------------\n`;
    });
    return ctx.replyWithHTML(msg);
  });

  // ── /report ───────────────────────────────────────────────────────────────
  bot.command("report", async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({ where: { date: today } });
    if (!reports.length) return ctx.reply(`Belum ada penjualan hari ini (${today}).`);
    const total = reports.reduce((s, r) => s + parseFloat(r.revenue || "0"), 0);
    return ctx.replyWithHTML(
      `📊 <b>Laporan Hari Ini</b>\n📅 ${today}\n\n✅ Terjual: <b>${reports.length} Voucher</b>\n💰 Omset: <b>${rp(total)}</b>`
    );
  });

  // ── /vc [profil] [harga] ──────────────────────────────────────────────────
  bot.command("vc", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /vc [profil] [harga]\nContoh: /vc 1Jam 2000");

    const profile = args[1];
    const price   = parseFloat(args[2]);
    const id      = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: id } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");

    try {
      const code = generateVoucher(6, "mix");

      // Cari quota dari VoucherConfig
      let quotaBytesIn  = undefined;
      let quotaBytesOut = undefined;
      try {
        const vc  = await prisma.voucherConfig.findFirst();
        if (vc?.settings) {
          const pkg = JSON.parse(vc.settings).find((p) => p.profile === profile);
          if (pkg?.quotaGB && parseFloat(pkg.quotaGB) > 0) {
            const bytes = Math.round(parseFloat(pkg.quotaGB) * 1024 * 1024 * 1024);
            quotaBytesIn = quotaBytesOut = bytes;
          }
        }
      } catch { /* abaikan */ }

      const result = await beliVoucher({
        userId: id, sellerName: seller.sellerName || "Unknown",
        price, username: code, password: code, expiry: "30d", routerName,
      });

      const conn = await getMikrotikConn(config);
      const cmd  = [
        "/ip/hotspot/user/add",
        "=server=all", "=name=" + code, "=password=" + code,
        "=profile=" + profile,
        "=comment=vc-bot-" + new Date().toISOString().split("T")[0],
      ];
      if (quotaBytesIn)  cmd.push("=limit-bytes-in="  + quotaBytesIn);
      if (quotaBytesOut) cmd.push("=limit-bytes-out=" + quotaBytesOut);
      await conn.write(cmd);
      conn.close();

      let reply =
        `${botTexts.success_buy}\n\n` +
        `👤 User: <code>${code}</code>\n` +
        `🔑 Pass: <code>${code}</code>\n` +
        `📦 Profil: <b>${profile}</b>\n` +
        `💰 Harga: ${rp(price)}\n` +
        `📦 Kuota: ${quotaBytesIn ? (quotaBytesIn / 1073741824).toFixed(0) + " GB" : "Unlimited"}\n` +
        `💳 Sisa Saldo: ${rp(result.newBalance)}`;

      if (result.newBalance < 10000)
        reply += `\n\n⚠️ <b>PERINGATAN:</b> Saldo menipis! Segera Topup.`;

      return ctx.replyWithHTML(reply);
    } catch (err) {
      if (err.message === "Saldo tidak mencukupi") return ctx.replyWithHTML(botTexts.fail_balance);
      return ctx.reply(`Gagal membuat voucher: ${err.message}`);
    }
  });

  // ── /up [profil] [harga] ──────────────────────────────────────────────────
  bot.command("up", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /up [profil] [harga]\nContoh: /up PPPOE-1M 50000");

    const profile = args[1];
    const price   = parseFloat(args[2]);
    const id      = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: id } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");

    try {
      const code = generateVoucher(6, "low");

      const result = await beliVoucher({
        userId: id, sellerName: seller.sellerName || "Unknown",
        price, username: code, password: code, expiry: "30d", routerName,
      });

      const conn = await getMikrotikConn(config);
      await conn.write([
        "/ppp/secret/add",
        "=name=" + code, "=password=" + code,
        "=service=any", "=profile=" + profile,
        "=comment=up-bot-" + new Date().toISOString().split("T")[0],
      ]);
      conn.close();

      let reply =
        `${botTexts.success_buy} (PPP)\n\n` +
        `👤 User: <code>${code}</code>\n` +
        `🔑 Pass: <code>${code}</code>\n` +
        `📦 Profil: <b>${profile}</b>\n` +
        `💰 Harga: ${rp(price)}\n` +
        `💳 Sisa Saldo: ${rp(result.newBalance)}`;

      if (result.newBalance < 10000)
        reply += `\n\n⚠️ <b>PERINGATAN:</b> Saldo menipis! Segera Topup.`;

      return ctx.replyWithHTML(reply);
    } catch (err) {
      if (err.message === "Saldo tidak mencukupi") return ctx.replyWithHTML(botTexts.fail_balance);
      return ctx.reply(`Gagal membuat akun PPP: ${err.message}`);
    }
  });

  // ── /topup [id] [jumlah] — Admin only ────────────────────────────────────
  bot.command("topup", async (ctx) => {
    if (ctx.from.id.toString() !== ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /topup [id_reseller] [jumlah]");
    try {
      const result = await topupReseller(args[1], parseFloat(args[2]), "Admin Bot");
      return ctx.reply(`✅ Berhasil! Saldo ${args[1]} sekarang: ${rp(result.newBalance)}`);
    } catch (err) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  // ── /list_reseller — Admin only ───────────────────────────────────────────
  bot.command("list_reseller", async (ctx) => {
    if (ctx.from.id.toString() !== ownerId) return ctx.reply("Akses ditolak.");
    const sellers = await prisma.seller.findMany({ take: 20, orderBy: { no: "desc" } });
    if (!sellers.length) return ctx.reply("Belum ada reseller terdaftar.");
    let msg = "<b>Daftar Reseller:</b>\n\n";
    sellers.forEach((s) => { msg += `👤 ${s.sellerName} (<code>${s.userId}</code>)\n💰 ${rp(s.balance)}\n\n`; });
    return ctx.replyWithHTML(msg);
  });

  // ── /hapus_reseller [id] — Admin only ────────────────────────────────────
  bot.command("hapus_reseller", async (ctx) => {
    if (ctx.from.id.toString() !== ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("Format: /hapus_reseller [id_user]");
    try {
      await prisma.seller.deleteMany({ where: { userId: args[1] } });
      return ctx.reply(`✅ Reseller ${args[1]} telah dihapus.`);
    } catch (err) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  // ── /setup_cron — Admin only ──────────────────────────────────────────────
  bot.command("setup_cron", async (ctx) => {
    if (ctx.from.id.toString() !== ownerId) return ctx.reply("Akses ditolak.");
    try {
      const conn      = await getMikrotikConn(config);
      const serverUrl = config.dnsName || "http://your-server.com";
      const cronUrl   = `${serverUrl}/api/mikrotik/cron`;

      const old = await conn.write(["/system/scheduler/print", "?name=MikbotamCleaner"]);
      for (const o of old) await conn.write(["/system/scheduler/remove", "=.id=" + o[".id"]]);

      await conn.write([
        "/system/scheduler/add",
        "=name=MikbotamCleaner",
        "=interval=01:00:00",
        `=on-event=/tool fetch url="${cronUrl}" mode=http keep-result=no`,
      ]);
      conn.close();
      return ctx.reply(`✅ MikroTik Scheduler dipasang!\n⏱ Interval: 1 jam\n🔗 URL: ${cronUrl}`);
    } catch (err) { return ctx.reply(`Gagal: ${err.message}`); }
  });
}

// ─── Main: Jalankan semua bot dalam mode polling ──────────────────────────────
async function startPolling() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { botToken: { not: null } },
    });

    if (!configs.length) {
      console.log("Tidak ada bot yang dikonfigurasi di database.");
      process.exit(0);
    }

    console.log(`Ditemukan ${configs.length} konfigurasi bot. Meluncurkan polling...`);

    for (const config of configs) {
      if (!config.botToken) continue;

      const bot = new Telegraf(config.botToken);
      attachBotLogic(bot, config);

      bot
        .launch()
        .then(() => {
          console.log(`[OK] Bot @${config.botUsername || config.id} — Router: ${config.routerName || "?"}`);
        })
        .catch((err) => {
          console.error(`[ERR] Gagal menjalankan bot ${config.id}:`, err.message);
        });

      process.once("SIGINT",  () => bot.stop("SIGINT"));
      process.once("SIGTERM", () => bot.stop("SIGTERM"));
    }
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

startPolling();
