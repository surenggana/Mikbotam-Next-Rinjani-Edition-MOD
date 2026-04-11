import { getMikrotikConnection } from "../mikrotik";

export async function getHotspotUsers() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write("/ip/hotspot/user/print");
  } finally {
    conn.close();
  }
}

export async function getHotspotProfiles() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write("/ip/hotspot/user/profile/print");
  } finally {
    conn.close();
  }
}

export async function addHotspotProfile(params: {
  name: string;
  sharedUsers?: string;
  rateLimit?: string;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    const cmd = ["/ip/hotspot/user/profile/add", "=name=" + params.name];
    if (params.sharedUsers) cmd.push("=shared-users=" + params.sharedUsers);
    if (params.rateLimit) cmd.push("=rate-limit=" + params.rateLimit);
    return await conn.write(cmd);
  } finally {
    conn.close();
  }
}

export async function addHotspotUser(params: {
  server: string;
  name: string;
  password?: string;
  profile: string;
  limitUptime?: string;
  limitBytesIn?: number;
  limitBytesOut?: number;
  comment?: string;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    const cmd = [
      "/ip/hotspot/user/add",
      "=server=" + (params.server || "all"),
      "=name=" + params.name,
      "=password=" + (params.password || ""),
      "=profile=" + params.profile,
    ];

    if (params.limitUptime) cmd.push("=limit-uptime=" + params.limitUptime);
    if (params.comment) cmd.push("=comment=" + params.comment);

    return await conn.write(cmd);
  } finally {
    conn.close();
  }
}

export async function removeHotspotUser(id: string) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write(["/ip/hotspot/user/remove", "=.id=" + id]);
  } finally {
    conn.close();
  }
}

export async function setHotspotUserStatus(id: string, action: "enable" | "disable") {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write([`/ip/hotspot/user/${action}`, "=.id=" + id]);
  } finally {
    conn.close();
  }
}

export async function getActiveHotspotUsers() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write("/ip/hotspot/active/print");
  } finally {
    conn.close();
  }
}
