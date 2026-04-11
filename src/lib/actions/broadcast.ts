"use server";

import { prisma } from "../prisma";
import { getBotInstance } from "../bot";
import { auth } from "@/auth";

export async function sendBroadcast(message: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const sellers = await prisma.seller.findMany({
    where: { 
      userId: { not: null },
      status: "Active"
    },
    select: { userId: true, sellerName: true }
  });

  if (sellers.length === 0) return { success: false, message: "Tidak ada reseller aktif." };

  // Ambil bot pertama yang aktif (atau bisa di-loop jika ingin kirim dari semua bot)
  const config = await prisma.systemConfig.findFirst({ where: { botToken: { not: null } } });
  if (!config?.botToken) throw new Error("Bot Token tidak ditemukan.");

  const bot = await getBotInstance(config.botToken);
  
  let successCount = 0;
  let failCount = 0;

  for (const seller of sellers) {
    try {
      await bot.telegram.sendMessage(seller.userId!, message, { parse_mode: "HTML" });
      successCount++;
    } catch (e) {
      console.error(`Gagal kirim broadcast ke ${seller.sellerName}:`, e);
      failCount++;
    }
  }

  return { 
    success: true, 
    message: `Broadcast selesai. Terkirim: ${successCount}, Gagal: ${failCount}.` 
  };
}
