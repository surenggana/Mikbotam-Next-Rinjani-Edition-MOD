"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getVoucherPackages() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const voucherData = await prisma.voucherConfig.findFirst();
  if (!voucherData?.settings) return [];

  try {
    // Di PHP ini disimpan sebagai serialized array, kita perlu handle parsingnya
    // Untuk saat ini kita asumsikan kita menyimpan sebagai JSON String agar lebih mudah di Next.js
    return JSON.parse(voucherData.settings);
  } catch (e) {
    return [];
  }
}

export async function updateVoucherPackages(packages: any[]) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.voucherConfig.findFirst();
  const settingsJson = JSON.stringify(packages);

  if (existing) {
    await prisma.voucherConfig.update({
      where: { no: existing.no },
      data: { settings: settingsJson },
    });
  } else {
    await prisma.voucherConfig.create({
      data: {
        type: "hotspot",
        settings: settingsJson,
        generate: "auto",
        lastDate: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/dashboard/settings/vouchers");
  return { success: true };
}
