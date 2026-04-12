import { Telegraf, Markup } from "telegraf";
import { prisma } from "./prisma";
import { addHotspotUser } from "./mikrotik/hotspot";
import { generateVoucher } from "./mikrotik/generator";
import { beliVoucher, topupReseller } from "./actions/transactions";
import { getRouterStats } from "./mikrotik";

// Map untuk menyimpan instance bot yang sedang berjalan agar tidak duplikat
const botRegistry: Map<string, Telegraf> = new Map();

export async function attachBotLogic(bot: Telegraf, config: any) {
  // Ambil teks kustom dari config
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

  // Keyboard Menu Utama (Item 3)
  const mainMenu = Markup.keyboard([
    ["💰 Cek Saldo", "🎫 Beli Voucher"],
    ["📂 Mutasi", "📊 Report"],
    ["💳 Topup Saldo", "📡 Ping Router"],
    ["⚙️ Bantuan"]
  ]).resize();

  bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({
      where: { userId: telegramId },
    });

    if (!seller) {
      return ctx.replyWithHTML("<b>Akses Ditolak!</b>\nID Telegram Anda belum terdaftar di sistem.");
    }

    return ctx.replyWithHTML(
      `<b>${botTexts.welcome}</b>\n\n` +
      `Halo @${ctx.from.username || ctx.from.first_name}, Anda terhubung ke Router: <b>${config.routerName}</b>`,
      mainMenu
    );
  });

  bot.hears("💰 Cek Saldo", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    const saldo = parseFloat(seller.balance || "0");
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>Rp ${saldo.toLocaleString("id-ID")}</b>`);
  });

  bot.hears("⚙️ Bantuan", (ctx) => {
    return ctx.replyWithHTML(`<b>${botTexts.help}</b>\n\nPerintah manual:\n/vc [profil] [harga]\n/up [profil] [harga]`);
  });

  bot.hears("📡 Ping Router", async (ctx) => {
    ctx.reply("Sedang mengecek status router...");
    try {
      const stats = await getRouterStats();
      const msg = `📊 <b>Status Router: ${stats.routerName}</b>\n\n` +
        `🌡 CPU: ${stats.cpuLoad}%\n` +
        `🧠 RAM: ${Math.round(parseInt(stats.freeMemory) / 1024 / 1024)} MB free\n` +
        `🕒 Uptime: ${stats.uptime}\n` +
        `🛠 Version: ${stats.version}`;
      return ctx.replyWithHTML(msg);
    } catch (err) {
      return ctx.reply("Gagal mengambil status router.");
    }
  });

  bot.hears("📂 Mutasi", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const transactions = await prisma.transaction.findMany({
      where: { userId: telegramId },
      orderBy: { no: "desc" },
      take: 5
    });

    if (transactions.length === 0) return ctx.reply("Belum ada riwayat transaksi.");

    let msg = "<b>5 Transaksi Terakhir:</b>\n\n";
    transactions.forEach(t => {
      msg += `📅 ${t.date} ${t.time}\n` +
             `📝 ${t.description || "Beli Voucher"}\n` +
             `💰 Rp ${parseFloat(t.voucherBuy || t.topUp || "0").toLocaleString("id-ID")}\n` +
             `------------------\n`;
    });
    return ctx.replyWithHTML(msg);
  });

  bot.hears("📊 Report", async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const reports = await prisma.report.findMany({ where: { date: today } });

    if (reports.length === 0) return ctx.reply(`Belum ada penjualan untuk hari ini (${today}).`);

    const totalRevenue = reports.reduce((sum, r) => sum + parseFloat(r.revenue || "0"), 0);
    const msg = `📊 <b>Laporan Penjualan Hari Ini</b>\n` +
      `📅 Tanggal: ${today}\n\n` +
      `✅ Terjual: <b>${reports.length} Voucher</b>\n` +
      `💰 Total Omset: <b>Rp ${totalRevenue.toLocaleString("id-ID")}</b>`;
    return ctx.replyWithHTML(msg);
  });

  bot.hears("💳 Topup Saldo", async (ctx) => {
    const methods = await prisma.depositMethod.findMany({ where: { active: true } });
    if (methods.length === 0) return ctx.reply("Maaf, belum ada metode deposit yang tersedia.");

    let msg = "<b>Pilih Metode Deposit:</b>\n\n";
    methods.forEach(m => {
      msg += `🔹 <b>${m.name}</b>\n   <code>${m.number}</code>\n   a/n ${m.owner}\n\n`;
    });
    msg += "Ketik: <code>/deposit [jumlah] [metode]</code>\nContoh: <code>/deposit 50000 Dana</code>";
    return ctx.replyWithHTML(msg, mainMenu);
  });

  bot.hears("🎫 Beli Voucher", async (ctx) => {
    return ctx.reply("Gunakan perintah manual untuk saat ini:\n/vc [profil] [harga]\nContoh: /vc 1Jam 2000");
  });

  bot.help((ctx) => {
    const helpMsg = `<b>Daftar Perintah:</b>\n\n` +
      `/cek_saldo - Cek saldo Anda\n` +
      `/vc [profil] [harga] - Buat voucher Hotspot\n` +
      `/up [profil] [harga] - Buat akun PPP\n` +
      `/deposit [jumlah] [metode] - Request topup saldo\n` +
      `/mutasi - Riwayat transaksi terakhir\n` +
      `/ping - Cek status router\n` +
      `/report - Laporan penjualan hari ini\n` +
      `/help - Tampilkan bantuan ini\n\n` +
      `<b>Perintah Admin:</b>\n` +
      `/topup [id_user] [jumlah]\n` +
      `/approve_topup [id]\n` +
      `/reject_topup [id]\n` +
      `/list_reseller\n` +
      `/hapus_reseller [id_user]\n` +
      `/setup_cron - Pasang scheduler MikroTik`;
    return ctx.replyWithHTML(helpMsg, mainMenu);
  });

  bot.command("deposit", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Gunakan format: /deposit [jumlah] [metode]");

    const amount = parseFloat(args[1]);
    const method = args.slice(2).join(" ");
    const telegramId = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const dateStr = now.toISOString().split("T")[0];

      const req = await prisma.topupRequest.create({
        data: {
          userId: telegramId,
          sellerName: seller.sellerName || "Unknown",
          amount: amount,
          method: method,
          status: "Pending",
          time: timeStr,
          date: dateStr
        }
      });

      if (config.ownerId) {
        bot.telegram.sendMessage(config.ownerId, 
          `🔔 <b>Permintaan Topup Baru!</b>\n\n` +
          `🆔 ID Req: <code>${req.id}</code>\n` +
          `👤 Dari: ${seller.sellerName} (<code>${telegramId}</code>)\n` +
          `💰 Jumlah: Rp ${amount.toLocaleString("id-ID")}\n` +
          `💳 Metode: ${method}\n\n` +
          `Gunakan <code>/approve_topup ${req.id}</code> atau <code>/reject_topup ${req.id}</code>`,
          { parse_mode: "HTML" }
        );
      }

      return ctx.reply("✅ Permintaan topup berhasil dikirim. Admin akan segera memverifikasi.");
    } catch (err: any) {
      return ctx.reply(`Gagal: ${err.message}`);
    }
  });

  bot.command("approve_topup", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    const reqId = parseInt(args[1]);
    if (!reqId) return ctx.reply("Format: /approve_topup [id_request]");

    try {
      const req = await prisma.topupRequest.findUnique({ where: { id: reqId } });
      if (!req || req.status !== "Pending") return ctx.reply("Request tidak ditemukan atau sudah diproses.");

      await topupReseller(req.userId, req.amount);
      await prisma.topupRequest.update({ where: { id: reqId }, data: { status: "Success" } });

      bot.telegram.sendMessage(req.userId, `✅ Topup Rp ${req.amount.toLocaleString("id-ID")} berhasil disetujui!`);
      return ctx.reply("✅ Request disetujui!");
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  bot.command("reject_topup", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    const reqId = parseInt(args[1]);
    if (!reqId) return ctx.reply("Format: /reject_topup [id_request]");

    try {
      const req = await prisma.topupRequest.update({
        where: { id: reqId, status: "Pending" },
        data: { status: "Rejected" }
      });
      bot.telegram.sendMessage(req.userId, `❌ Permintaan Topup Rp ${req.amount.toLocaleString("id-ID")} ditolak oleh Admin.`);
      return ctx.reply("❌ Request ditolak!");
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  bot.command("cek_saldo", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");
    const saldo = parseFloat(seller.balance || "0");
    return ctx.replyWithHTML(`Saldo Anda: <b>Rp ${saldo.toLocaleString("id-ID")}</b>`);
  });

  // /vc [profil] [harga]
  bot.command("vc", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format salah. Gunakan: /vc [profil] [harga]");

    const profile = args[1];
    const price = parseFloat(args[2]);
    const telegramId = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");

    try {
      const code = generateVoucher({ length: 6, type: "mix" });
      const username = code;
      const password = code; 

      const result = await beliVoucher({
        userId: telegramId,
        sellerName: seller.sellerName || "Unknown",
        price: price,
        markup: 0,
        username: username,
        password: password,
        expiry: "30d",
        status: "Success",
        routerName: config.routerName || "MikroTik"
      });

      // Cari quota dari VoucherConfig berdasarkan profil
      let quotaBytes: number | undefined;
      try {
        const voucherConfig = await prisma.voucherConfig.findFirst();
        if (voucherConfig?.settings) {
          const packages = JSON.parse(voucherConfig.settings);
          const pkg = packages.find((p: any) => p.profile === profile);
          if (pkg?.quotaGB && parseFloat(pkg.quotaGB) > 0) {
            quotaBytes = Math.round(parseFloat(pkg.quotaGB) * 1024 * 1024 * 1024);
          }
        }
      } catch (e) { /* abaikan jika config tidak ada */ }

      await addHotspotUser({
        server: "all",
        name: username,
        password: password,
        profile: profile,
        limitBytesIn: quotaBytes,
        limitBytesOut: quotaBytes,
        comment: `vc-bot-${new Date().toISOString().split("T")[0]}`
      });

      let response = `${botTexts.success_buy}\n\n` +
        `👤 User: <code>${username}</code>\n` +
        `🔑 Pass: <code>${password}</code>\n` +
        `📦 Profil: <b>${profile}</b>\n` +
        `💰 Harga: Rp ${price.toLocaleString("id-ID")}\n` +
        `💳 Sisa Saldo: Rp ${result.newBalance.toLocaleString("id-ID")}`;

      if (result.newBalance < 10000) {
        response += `\n\n⚠️ <b>PERINGATAN:</b> Saldo Anda menipis! Segera lakukan Topup.`;
      }

      return ctx.replyWithHTML(response);
    } catch (err: any) {
      if (err.message === "Saldo tidak mencukupi") {
        return ctx.replyWithHTML(`${botTexts.fail_balance}`);
      }
      return ctx.reply(`Gagal membuat voucher: ${err.message}`);
    }
  });

  bot.command("up", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format salah. Gunakan: /up [profil] [harga]");

    const profile = args[1];
    const price = parseFloat(args[2]);
    const telegramId = ctx.from.id.toString();

    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller) return ctx.reply("Anda tidak terdaftar.");

    try {
      const username = generateVoucher({ length: 6, type: "low" });
      const password = username; 

      const result = await beliVoucher({
        userId: telegramId,
        sellerName: seller.sellerName || "Unknown",
        price: price,
        markup: 0,
        username: username,
        password: password,
        expiry: "30d",
        status: "Success",
        routerName: config.routerName || "MikroTik"
      });

      const { addPppSecret } = await import("./mikrotik/ppp");
      await addPppSecret({
        name: username,
        password: password,
        service: "any",
        profile: profile,
        comment: `up-bot-${new Date().toISOString().split("T")[0]}`
      });

      let response = `${botTexts.success_buy} (PPP)\n\n` +
        `👤 User: <code>${username}</code>\n` +
        `🔑 Pass: <code>${password}</code>\n` +
        `📦 Profil: <b>${profile}</b>\n` +
        `💰 Harga: Rp ${price.toLocaleString("id-ID")}\n` +
        `💳 Sisa Saldo: Rp ${result.newBalance.toLocaleString("id-ID")}`;

      if (result.newBalance < 10000) {
        response += `\n\n⚠️ <b>PERINGATAN:</b> Saldo Anda menipis! Segera lakukan Topup.`;
      }

      return ctx.replyWithHTML(response);
    } catch (err: any) {
      if (err.message === "Saldo tidak mencukupi") {
        return ctx.replyWithHTML(`${botTexts.fail_balance}`);
      }
      return ctx.reply(`Gagal membuat akun PPP: ${err.message}`);
    }
  });

  bot.command("topup", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    if (args.length < 3) return ctx.reply("Format: /topup [id_reseller] [jumlah]");
    try {
      const result = await topupReseller(args[1], parseFloat(args[2]));
      return ctx.reply(`Berhasil! Saldo ${args[1]} sekarang: Rp ${result.newBalance.toLocaleString("id-ID")}`);
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  bot.command("list_reseller", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const sellers = await prisma.seller.findMany({ take: 20 });
    let msg = "<b>Daftar Reseller:</b>\n\n";
    sellers.forEach(s => msg += `👤 ${s.sellerName} (<code>${s.userId}</code>)\n💰 Rp ${parseFloat(s.balance || "0").toLocaleString("id-ID")}\n\n`);
    return ctx.replyWithHTML(msg);
  });

  bot.command("hapus_reseller", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    const args = ctx.message.text.split(" ");
    if (args.length < 2) return ctx.reply("Format: /hapus_reseller [id_user]");
    try {
      await prisma.seller.deleteMany({ where: { userId: args[1] } });
      return ctx.reply(`Reseller ${args[1]} telah dihapus.`);
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });

  bot.command("setup_cron", async (ctx) => {
    if (ctx.from.id.toString() !== config.ownerId) return ctx.reply("Akses ditolak.");
    try {
      const { getMikrotikConnection } = await import("./mikrotik");
      const conn = await getMikrotikConnection();
      await conn.connect();
      const serverUrl = config.dnsName || "http://your-server.com";
      const cronUrl = `${serverUrl}/api/mikrotik/cron`;
      const old = await conn.write(["/system/scheduler/print", "?name=MikbotamCleaner"]);
      for (const o of old) await conn.write(["/system/scheduler/remove", "=.id=" + o[".id"]]);
      await conn.write(["/system/scheduler/add", "=name=MikbotamCleaner", "=interval=01:00:00", "=on-event=/tool fetch url=\"" + cronUrl + "\" mode=http keep-result=no"]);
      conn.close();
      return ctx.reply("✅ MikroTik Scheduler dipasang (1 Jam)!");
    } catch (err: any) { return ctx.reply(`Gagal: ${err.message}`); }
  });
}

export async function getBotInstance(token: string) {
  if (botRegistry.has(token)) {
    return botRegistry.get(token)!;
  }

  const config = await prisma.systemConfig.findFirst({
    where: { botToken: token }
  });

  if (!config) {
    throw new Error(`Konfigurasi untuk bot token ${token} tidak ditemukan.`);
  }

  const bot = new Telegraf(token);
  
  await attachBotLogic(bot, config);

  botRegistry.set(token, bot);
  return bot;
}

export async function getAllBots() {
  const configs = await prisma.systemConfig.findMany({
    where: { 
      botToken: { not: null }
    }
  });
  return configs;
}
