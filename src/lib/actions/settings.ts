"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { RouterOSAPI } from 'node-routeros';
import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';

export async function setTelegramWebhook(token: string, url: string) {
  const bot = new Telegraf(token);
  const webhookUrl = `${url}/api/telegram/${token}`;
  try {
    await bot.telegram.setWebhook(webhookUrl);
    return { success: true, message: `Webhook berhasil dipasang ke: ${webhookUrl}` };
  } catch (e: any) {
    return { success: false, message: `Gagal set webhook: ${e.message}` };
  }
}

export async function downloadDatabaseAction() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const dbPath = path.join(process.cwd(), 'prisma', 'mikbotam.db');
  if (!fs.existsSync(dbPath)) return null;

  const stats = fs.statSync(dbPath);
  const data = fs.readFileSync(dbPath);
  
  return {
    name: 'mikbotam_backup.db',
    data: Array.from(data),
    size: stats.size
  };
}

export async function getSystemSettings() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const settings = await prisma.systemConfig.findFirst();
  return settings;
}

export async function testRouterConnection(data: any) {
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

export async function testBotConnection(token: string) {
  if (!token) return { success: false, message: "Token kosong!" };
  const bot = new Telegraf(token);
  try {
    const me = await bot.telegram.getMe();
    return { success: true, message: `Bot Aktif! Username: @${me.username}` };
  } catch (e: any) {
    return { success: false, message: `Token tidak valid: ${e.message}` };
  }
}

export async function updateSystemSettings(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const data = {
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

  if (id) {
    await prisma.systemConfig.update({
      where: { no: parseInt(id) },
      data,
    });
  } else {
    await prisma.systemConfig.create({
      data: {
        ...data,
        id: "1", // Default ID
      },
    });
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
