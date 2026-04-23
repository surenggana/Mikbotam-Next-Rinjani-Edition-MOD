"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getVoucherPackages() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const config = await prisma.voucherConfig.findFirst({
    where: { adminId }
  });
  
  if (!config?.settings) return [];
  try {
    return JSON.parse(config.settings);
  } catch (e) {
    return [];
  }
}

export async function saveVoucherPackages(packages: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const adminId = parseInt(session.user.id);

  const data = {
    adminId,
    settings: JSON.stringify(packages),
    type: "hotspot",
    generate: "mix",
    lastDate: new Date().toISOString(),
    settingsOther: "",
    voucherHotspot: "",
    hotspotUser: "",
    hotspotPass: "",
    username: "",
    usermanUser: "",
    usermanPass: "",
    expiry: "",
    routerName: "MikroTik",
    user: "",
    ip: "",
    setNow: "",
    other: "",
    updateDate: new Date().toISOString(),
  };

  const existing = await prisma.voucherConfig.findFirst({
    where: { adminId }
  });

  if (existing) {
    await prisma.voucherConfig.update({
      where: { no: existing.no },
      data: { settings: data.settings, updateDate: data.updateDate },
    });
  } else {
    await prisma.voucherConfig.create({
      data: data,
    });
  }

  revalidatePath("/settings/vouchers");
  return { success: true };
}
