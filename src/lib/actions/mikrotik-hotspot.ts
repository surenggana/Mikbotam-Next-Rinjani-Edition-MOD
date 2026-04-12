"use server";

import {
  getHotspotUsers,
  getHotspotProfiles,
  addHotspotUser,
  addHotspotProfile,
  removeHotspotUser,
  setHotspotUserStatus,
} from "@/lib/mikrotik/hotspot";

export async function getHotspotUsersAction() {
  return await getHotspotUsers().catch(() => []);
}

export async function getHotspotProfilesAction() {
  return await getHotspotProfiles().catch(() => []);
}

export async function addHotspotUserAction(params: {
  name: string;
  password?: string;
  profile: string;
  limitUptime?: string;
}) {
  return await addHotspotUser({ server: "all", ...params });
}

export async function addHotspotProfileAction(params: {
  name: string;
  sharedUsers?: string;
  rateLimit?: string;
}) {
  return await addHotspotProfile(params);
}

export async function removeHotspotUserAction(id: string) {
  return await removeHotspotUser(id);
}

export async function toggleHotspotUserAction(id: string, action: "enable" | "disable") {
  return await setHotspotUserStatus(id, action);
}
