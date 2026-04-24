"use server";

import {
  getHotspotUsers,
  getHotspotProfiles,
  addHotspotUser,
  addHotspotProfile,
  removeHotspotUser,
  removeHotspotProfile,
  updateHotspotProfile,
  setHotspotUserStatus,
} from "@/lib/mikrotik/hotspot";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function validateSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return parseInt(session.user.id);
}

export async function getHotspotUsersAction() {
  await validateSession();
  return await getHotspotUsers().catch(() => []);
}

export async function getHotspotProfilesAction() {
  await validateSession();
  return await getHotspotProfiles().catch(() => []);
}

export async function addHotspotUserAction(params: {
  name: string;
  password?: string;
  profile: string;
  limitUptime?: string;
}) {
  await validateSession();
  const res = await addHotspotUser({ server: "all", ...params });
  revalidatePath("/hotspot-users");
  return res;
}

export async function addHotspotProfileAction(params: {
  name: string;
  sharedUsers?: string;
  rateLimit?: string;
  lockMac?: boolean;
  validity?: string;
}) {
  await validateSession();
  const res = await addHotspotProfile(params);
  revalidatePath("/hotspot-profiles");
  return res;
}

export async function updateHotspotProfileAction(id: string, params: {
  name: string;
  sharedUsers?: string;
  rateLimit?: string;
  validity?: string;
  lockMac?: boolean;
}) {
  await validateSession();
  try {
    const res = await updateHotspotProfile(id, params);
    revalidatePath("/hotspot-profiles");
    return res;
  } catch (error: any) {
    // Melempar pesan error asli agar bisa ditangkap oleh toast.error
    throw new Error(error.message || "Gagal memperbarui profil.");
  }
}

export async function removeHotspotUserAction(id: string) {
  await validateSession();
  const res = await removeHotspotUser(id);
  revalidatePath("/hotspot-users");
  return res;
}

export async function removeHotspotProfileAction(id: string) {
  await validateSession();
  const res = await removeHotspotProfile(id);
  revalidatePath("/hotspot-profiles");
  return res;
}

export async function toggleHotspotUserAction(id: string, action: "enable" | "disable") {
  await validateSession();
  const res = await setHotspotUserStatus(id, action);
  revalidatePath("/hotspot-users");
  return res;
}
