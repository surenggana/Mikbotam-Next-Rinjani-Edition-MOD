"use server";

import { prisma } from "../prisma";
import { getBotInstance } from "../bot";
import { auth } from "@/auth";
import { getActiveConfig } from "../mikrotik";

export async function sendBroadcast(message: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const sellers = await prisma.seller.findMany({
    where: { 
      userId: { not: null },
      status: "Active",
      adminId: adminId
    },
    select: { userId: true, sellerName: true }
  });

  if (sellers.length === 0) return { success: false, message: "Tidak ada reseller aktif di bawah manajemen Anda." };

  // Ambil config aktif untuk mendapatkan bot token yang relevan
  const config = await getActiveConfig();
  if (!config?.botToken) throw new Error("Bot Token tidak ditemukan pada router aktif.");

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
