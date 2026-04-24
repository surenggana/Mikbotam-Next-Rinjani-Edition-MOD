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

  // --- DAFTAR COMMAND ---
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

      await ctx.replyWithHTML(`✅ <b>Pendaftaran Terkirim!</b>\nID: <code>${telegramId}</code>\n\nStatus: <b>Pending</b>\nMohon tunggu, Admin telah menerima notifikasi pendaftaran Anda.`);

      if (config.ownerId) {
        const adminMsg = 
          `🔔 <b>RESELLER BARU MENDAFTAR</b>\n\n` +
          `👤 Nama: <b>${username}</b>\n` +
          `🆔 Telegram ID: <code>${telegramId}</code>\n` +
          `Silahkan pilih tindakan:`;

        const adminButtons = Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ SETUJUI", `adm_appr|${telegramId}`),
            Markup.button.callback("❌ TOLAK", `adm_rejt|${telegramId}`)
          ]
        ]);

        bot.telegram.sendMessage(config.ownerId, adminMsg, { parse_mode: "HTML", ...adminButtons }).catch(() => {});
      }
    } catch (err: any) { return ctx.reply(`Gagal mendaftar: ${err.message}`); }
  });

  // --- TOPUP COMMAND ---
  bot.command("topup", async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
    if (!seller || seller.status !== "Active") return ctx.reply("Akses ditolak.");

    const args = ctx.message.text.split(" ");
    if (args.length >= 2) {
      const amount = parseFloat(args[1].replace(/\D/g, ""));
      if (isNaN(amount) || amount < 1000) return ctx.reply("Minimal topup Rp 1.000");

      if (config.ownerId) {
        const adminMsg = `💰 <b>REQUEST TOPUP</b>\n\nReseller: <b>${seller.sellerName}</b>\nID: <code>${telegramId}</code>\nJumlah: <b>${formatIDR(amount)}</b>`;
        const adminButtons = Markup.inlineKeyboard([
          [Markup.button.callback("✅ TERIMA", `tp_appr|${telegramId}|${amount}`), Markup.button.callback("❌ TOLAK", `tp_rejt|${telegramId}`)]
        ]);
        bot.telegram.sendMessage(config.ownerId, adminMsg, { parse_mode: "HTML", ...adminButtons }).catch(() => {});
        return ctx.replyWithHTML(`✅ Request topup <b>${formatIDR(amount)}</b> terkirim ke Admin.`);
      }
    }
    topupStates.set(telegramId, {});
    return ctx.reply("Ketik jumlah saldo yang ingin diisi:");
  });

  // --- CALLBACK HANDLER ---
  bot.on("callback_query", async (ctx) => {
    const data = (ctx.callbackQuery as any).data;
    const telegramId = ctx.from.id.toString();

    // 1. Buy Voucher (Identical to Core.php logic)
    if (data.startsWith("buy_vcr|")) {
      const pkgIndex = parseInt(data.split("|")[1]);
      const voucherConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
      const packages = JSON.parse(voucherConfig?.settings || "[]");
      const pkg = packages[pkgIndex];

      if (!pkg) return ctx.answerCbQuery("Paket tidak ditemukan.");

      const seller = await prisma.seller.findFirst({ where: { userId: telegramId } });
      const balance = parseFloat(seller?.balance || "0");
      
      const price = parseFloat(pkg.price); // Harga Jual
      const markup = parseFloat(pkg.markup || "0"); // Komisi
      const adminPrice = price - markup; // Potong Saldo

      if (balance < adminPrice) {
        return ctx.replyWithHTML(botTexts.fail_balance);
      }

      await ctx.editMessageText("<code>Sedang memproses voucher...</code>", { parse_mode: "HTML" });

      try {
        // --- LOGIC FROM CORE.PHP ---
        const vLength = parseInt(pkg.length || "6");
        const vTypeChar = (pkg.typechar || "mix") as any;
        const vTypeMode = pkg.type; // 'up' means user != pass

        let userVcr, passVcr;
        if (vTypeMode === "up") {
          userVcr = generateVoucher({ length: vLength, type: vTypeChar });
          passVcr = generateVoucher({ length: vLength, type: vTypeChar });
        } else {
          userVcr = generateVoucher({ length: vLength, type: vTypeChar });
          passVcr = userVcr;
        }

        // --- DEDUCTION ---
        await beliVoucher({
          userId: telegramId,
          sellerName: seller?.sellerName || "Unknown",
          price: price, // Public Price
          markup: markup, // Commission
          username: userVcr,
          password: passVcr,
          expiry: pkg.validity || "30d",
          status: "Success",
          routerName: config.routerName || "MikroTik",
          origin: "BOT"
        });

        // --- MIKROTIK LIMITS ---
        const limitUptime = pkg.validity || "0";
        const limitBytesIn = pkg.limit_download ? parseInt(pkg.limit_download) : undefined;
        const limitBytesOut = pkg.limit_upload ? parseInt(pkg.limit_upload) : undefined;
        const limitTotal = pkg.limit_total ? parseInt(pkg.limit_total) : undefined;

        const routerConfig = {
          routerIp: config.routerIp,
          routerUsername: config.routerUsername,
          routerPassword: config.routerPassword,
          port: config.port
        };

        await addHotspotUser({
          server: pkg.server || "all",
          name: userVcr,
          password: passVcr,
          profile: pkg.profile,
          limitUptime: limitUptime,
          limitBytesIn: limitBytesIn,
          limitBytesOut: limitBytesOut,
          comment: `vc-bot|${seller?.sellerName}|${price}|${new Date().toLocaleDateString()}`
        }, routerConfig);

        const dns = config.dnsName || "login.net";
        const loginUrl = dns.startsWith("http") ? `${dns}/login?username=${userVcr}&password=${passVcr}` : `http://${dns}/login?username=${userVcr}&password=${passVcr}`;

        let caption = `<b>${botTexts.success_buy}</b>\n\n`;
        if (vTypeMode === "up") {
          caption += `👤 User: <code>${userVcr}</code>\n🔑 Pass: <code>${passVcr}</code>\n`;
        } else {
          caption += `🎫 Kode: <code>${userVcr}</code>\n`;
        }
        caption += `📦 Profil: <b>${pkg.profile}</b>\n⏰ Masa Aktif: <b>${limitUptime}</b>\n💰 Harga: <b>${formatIDR(price)}</b>\n\nGUNAKAN INTERNET DENGAN BIJAK`;

        await ctx.deleteMessage();
        return ctx.replyWithHTML(caption, Markup.inlineKeyboard([
          [Markup.button.url("🚀 Login ke Jaringan", loginUrl)]
        ]));

      } catch (err: any) { 
        return ctx.reply(`Gagal: ${err.message}`); 
      }
    }

    // 2. Admin: Approve Registration
    if (data.startsWith("adm_appr|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const targetId = data.split("|")[1];
      const target = await prisma.seller.findFirst({ where: { userId: targetId, adminId: config.adminId } });
      if (!target) return ctx.answerCbQuery("User tidak ditemukan.");
      await prisma.seller.update({ where: { no: target.no }, data: { status: "Active" } });
      await ctx.editMessageText(`✅ Reseller <b>${target.sellerName}</b> aktif!`, { parse_mode: "HTML" });
      bot.telegram.sendMessage(targetId, "🎊 Akun Anda telah diaktifkan Admin!").catch(() => {});
      return ctx.answerCbQuery();
    }

    // 3. Admin: Reject Registration
    if (data.startsWith("adm_rejt|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const targetId = data.split("|")[1];
      await prisma.seller.deleteMany({ where: { userId: targetId, adminId: config.adminId } });
      await ctx.editMessageText(`❌ Pendaftaran <code>${targetId}</code> ditolak.`, { parse_mode: "HTML" });
      bot.telegram.sendMessage(targetId, "⚠️ Pendaftaran Anda ditolak Admin.").catch(() => {});
      return ctx.answerCbQuery();
    }

    // 4. Admin: Approve Topup
    if (data.startsWith("tp_appr|")) {
      if (telegramId !== config.ownerId) return ctx.answerCbQuery("Akses ditolak.");
      const [, targetId, amountStr] = data.split("|");
      const amount = parseFloat(amountStr);
      try {
        const res = await topupReseller(targetId, amount, "Admin Bot", parseInt(config.adminId));
        await ctx.editMessageText(`✅ Topup <b>${formatIDR(amount)}</b> Berhasil!`, { parse_mode: "HTML" });
        bot.telegram.sendMessage(targetId, `💰 Saldo bertambah <b>${formatIDR(amount)}</b>!\nTotal: ${formatIDR(res.newBalance)}`, { parse_mode: "HTML" }).catch(() => {});
      } catch (err: any) { await ctx.editMessageText(`❌ Gagal: ${err.message}`); }
      return ctx.answerCbQuery();
    }
    
    if (data === "inline_ceksaldo") {
      const s = await prisma.seller.findFirst({ where: { userId: telegramId } });
      return ctx.answerCbQuery(`Saldo: ${formatIDR(parseFloat(s?.balance || "0"))}`, { show_alert: true });
    }
  });

  // --- MENU HELPERS ---
  const showVoucherMenu = async (ctx: any) => {
    const s = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    if (!s || s.status !== "Active") return ctx.reply("Akses ditolak.");
    const vConfig = await prisma.voucherConfig.findFirst({ where: { adminId: config.adminId } });
    const pkgs = JSON.parse(vConfig?.settings || "[]");
    if (pkgs.length === 0) return ctx.reply("Belum ada paket.");
    const buttons = [];
    for (let i = 0; i < pkgs.length; i += 2) {
      const row = [Markup.button.callback(pkgs[i].Voucher || pkgs[i].name, `buy_vcr|${i}`)];
      if (pkgs[i+1]) row.push(Markup.button.callback(pkgs[i+1].Voucher || pkgs[i+1].name, `buy_vcr|${i+1}`));
      buttons.push(row);
    }
    buttons.push([Markup.button.callback("💰 Cek Saldo", "inline_ceksaldo")]);
    return ctx.replyWithHTML("<b>Pilih paket voucher:</b>", Markup.inlineKeyboard(buttons));
  };

  bot.hears("🎫 Menu Voucher", showVoucherMenu);
  bot.hears("💰 Cek Saldo", async (ctx) => {
    const s = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    return ctx.replyWithHTML(`💳 Saldo Anda: <b>${formatIDR(parseFloat(s?.balance || "0"))}</b>`);
  });
  bot.hears("📡 Status Router", async (ctx) => {
    try {
      const stats = await getRouterStats({ routerIp: config.routerIp, routerUsername: config.routerUsername, routerPassword: config.routerPassword, port: config.port });
      return ctx.replyWithHTML(`📊 <b>Router: ${stats.routerName}</b>\n🌡 CPU: ${stats.cpuLoad}%\n🧠 RAM: ${Math.round(parseInt(stats.freeMemory)/1024/1024)}MB\n🕒 Uptime: ${stats.uptime}`);
    } catch { return ctx.reply("Gagal ambil status."); }
  });
  bot.hears("⚙️ Bantuan", (ctx) => {
    ctx.replyWithHTML(`<b>${botTexts.help}</b>\n\n/beli - Daftar Voucher\n/saldo - Cek Saldo\n/topup - Isi Saldo\n/transfer - Kirim Saldo\n/mutasi - Riwayat`);
  });

  bot.command("beli", showVoucherMenu);
  bot.command("saldo", async (ctx) => {
    const s = await prisma.seller.findFirst({ where: { userId: ctx.from.id.toString() } });
    return ctx.replyWithHTML(`Saldo Anda: <b>${formatIDR(parseFloat(s?.balance || "0"))}</b>`);
  });
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
