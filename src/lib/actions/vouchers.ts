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

  const data = {
    type: "hotspot",
    settings: settingsJson,
    generate: "auto",
    lastDate: new Date().toISOString(),
    settingsOther: "",
    voucherHotspot: "",
    hotspotUser: "",
    hotspotPass: "",
    username: "",
    usermanUser: "",
    usermanPass: "",
    expiry: "",
    routerName: "",
    user: "",
    ip: "",
    setNow: "",
    other: "",
    updateDate: new Date().toISOString(),
  };

  if (existing) {
    await prisma.voucherConfig.update({
      where: { no: existing.no },
      data: data,
    });
  } else {
    await prisma.voucherConfig.create({
      data: data,
    });
  }

  revalidatePath("/dashboard/settings/vouchers");
  return { success: true };
}
