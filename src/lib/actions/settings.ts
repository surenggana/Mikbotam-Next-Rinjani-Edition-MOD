"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { RouterOSAPI } from 'node-routeros';
import { Telegraf } from 'telegraf';

export async function setTelegramWebhook(token: string, url: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const bot = new Telegraf(token);
  const webhookUrl = `${url}/api/telegram/${token}`;
  try {
    await bot.telegram.setWebhook(webhookUrl);
    return { success: true, message: `Webhook berhasil dipasang ke: ${webhookUrl}` };
  } catch (e: any) {
    return { success: false, message: `Gagal set webhook: ${e.message}` };
  }
}

export async function unsetTelegramWebhook(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const bot = new Telegraf(token);
  try {
    await bot.telegram.deleteWebhook();
    return { success: true, message: "Webhook berhasil dinonaktifkan." };
  } catch (e: any) {
    return { success: false, message: `Gagal unset webhook: ${e.message}` };
  }
}

export async function getTelegramWebhookInfo(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bot = new Telegraf(token);
  try {
    const info = await bot.telegram.getWebhookInfo();
    return {
      success: true,
      info: {
        url: info.url || "",
        pendingUpdateCount: info.pending_update_count || 0,
        lastErrorDate: info.last_error_date || null,
        lastErrorMessage: info.last_error_message || "",
        maxConnections: info.max_connections || null,
        allowedUpdates: info.allowed_updates || [],
      },
    };
  } catch (e: any) {
    return { success: false, message: `Gagal mengambil info webhook: ${e.message}` };
  }
}

export async function getSystemSettings() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const settings = await prisma.systemConfig.findFirst({
    where: { adminId }
  });
  return settings;
}

export async function getAllRouterConfigs() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  return await prisma.systemConfig.findMany({
    where: { adminId },
    select: { no: true, routerName: true, routerIp: true, routerUsername: true, port: true },
    orderBy: { no: "asc" },
  });
}

export async function addRouterConfig(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const routerIp = formData.get("routerIp") as string;
  const port = (formData.get("port") as string) || "8728";
  const routerUsername = formData.get("routerUsername") as string;
  const routerPassword = formData.get("routerPassword") as string;

  let routerName = routerIp;
  try {
    const conn = new RouterOSAPI({
      host: routerIp,
      user: routerUsername,
      password: routerPassword,
      port: parseInt(port),
      timeout: 5,
    });
    await conn.connect();
    const identity = await conn.write("/system/identity/print");
    conn.close();
    routerName = (identity[0] as any)?.name || routerIp;
  } catch {}

  await prisma.systemConfig.create({
    data: {
      adminId,
      id: Date.now().toString(),
      routerIp,
      port,
      routerUsername,
      routerPassword,
      routerName,
    },
  });

  revalidatePath("/settings");
  return { success: true, routerName };
}

export async function deleteRouterConfig(no: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  // Security check: must own the router
  const existing = await prisma.systemConfig.findUnique({ where: { no } });
  if (!existing || existing.adminId !== adminId) throw new Error("Akses ditolak.");

  await prisma.systemConfig.delete({ where: { no } });
  revalidatePath("/settings");
  return { success: true };
}

export async function testRouterConnection(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const conn = new RouterOSAPI({
    host: data.routerIp,
    user: data.routerUsername,
    password: data.routerPassword,
    port: parseInt(data.port || '8728'),
    timeout: 5
  });

  try {
    await conn.connect();
    const identity = await conn.write('/system/identity/print');
    return { success: true, message: `Terhubung! Nama Router: ${identity[0].name}` };
  } catch (e: any) {
    return { success: false, message: `Gagal: ${e.message}` };
  } finally {
    conn.close();
  }
}

export async function updateSystemSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const connectionMode = formData.get("connectionMode") as string;
  const voucherLoginNotificationTarget = formData.get("voucherLoginNotificationTarget") as string;
  const existing = await prisma.systemConfig.findFirst({
    where: { adminId }
  });

  let settings = {};
  try {
    settings = existing?.settings ? JSON.parse(existing.settings) : {};
  } catch {}
  
  const data: any = {
    adminId,
    routerIp: formData.get("routerIp") as string,
    port: formData.get("port") as string,
    routerUsername: formData.get("routerUsername") as string,
    routerPassword: formData.get("routerPassword") as string,
    routerName: formData.get("routerName") as string,
    botToken: formData.get("botToken") as string,
    botUsername: formData.get("botUsername") as string,
    owner: formData.get("owner") as string,
    ownerId: formData.get("ownerId") as string,
    dnsName: formData.get("dnsName") as string,
  };

  data.settings = JSON.stringify({
    ...settings,
    ...(connectionMode ? { connectionMode } : {}),
    ...(voucherLoginNotificationTarget ? { voucherLoginNotificationTarget } : {}),
  });

  if (existing) {
    await prisma.systemConfig.update({
      where: { no: existing.no },
      data,
    });
  } else {
    await prisma.systemConfig.create({
      data: {
        ...data,
        id: Date.now().toString(),
      },
    });
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getBotTexts() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const config = await prisma.systemConfig.findFirst({
    where: { adminId },
    select: { textSetup: true }
  });

  const defaults = {
    daftar: "Selamat datang! Silakan ketik /daftar untuk registrasi.",
    menu: "Silakan pilih menu di bawah ini:",
    informasi: "Layanan Hotspot & PPP Aktif 24 Jam.",
    saldoFooter: "Terima kasih telah berlangganan.",
    voucherFooter: "Simpan voucher ini baik-baik.",
    depositInfo: "Transfer ke Rekening BRI 1234-5678-90 a/n Admin"
  };

  if (!config?.textSetup) return defaults;

  try {
    const saved = JSON.parse(config.textSetup);
    return { ...defaults, ...saved };
  } catch (e) {
    return defaults;
  }
}

export async function updateBotTexts(texts: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const existing = await prisma.systemConfig.findFirst({
    where: { adminId }
  });

  const jsonStr = JSON.stringify(texts);

  if (existing) {
    await prisma.systemConfig.update({
      where: { no: existing.no },
      data: { textSetup: jsonStr },
    });
  } else {
    await prisma.systemConfig.create({
      data: {
        adminId,
        id: Date.now().toString(),
        textSetup: jsonStr,
      },
    });
  }

  revalidatePath("/settings/bot-editor");
  return { success: true };
}
