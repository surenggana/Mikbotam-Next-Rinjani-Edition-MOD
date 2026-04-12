"use server";

import {
  getPppSecrets,
  getPppProfiles,
  addPppSecret,
  addPppProfile,
  removePppSecret,
  setPppSecretStatus,
} from "@/lib/mikrotik/ppp";

export async function getPppSecretsAction() {
  return await getPppSecrets().catch(() => []);
}

export async function getPppProfilesAction() {
  return await getPppProfiles().catch(() => []);
}

export async function addPppSecretAction(params: {
  name: string;
  password?: string;
  service: "pppoe" | "pptp" | "l2tp" | "any";
  profile: string;
  remoteAddress?: string;
  comment?: string;
}) {
  return await addPppSecret(params);
}

export async function addPppProfileAction(params: {
  name: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string;
}) {
  return await addPppProfile(params);
}

export async function removePppSecretAction(id: string) {
  return await removePppSecret(id);
}

export async function togglePppSecretAction(id: string, action: "enable" | "disable") {
  return await setPppSecretStatus(id, action);
}
