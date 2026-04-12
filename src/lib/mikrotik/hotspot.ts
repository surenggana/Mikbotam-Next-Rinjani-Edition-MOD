import { getMikrotikConnection } from "../mikrotik";
import { prisma } from "../prisma";

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
  onLogin?: string;
  onLogout?: string;
  lockMac?: boolean;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    // Ambil URL server dari config untuk default script jika tidak disediakan
    const config = await prisma.systemConfig.findFirst();
    const serverUrl = config?.dnsName || "http://your-server.com";
    
    let defaultOnLogin = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=login&user=$user&mac=$mac-address&ip=$address" mode=http keep-result=no;`;
    
    // Poin 2: Lock MAC Address (Opsional per Profile)
    if (params.lockMac) {
      defaultOnLogin += ` :if ([/ip hotspot user get $user mac-address] = "00:00:00:00:00:00" || [/ip hotspot user get $user mac-address] = "") do={/ip hotspot user set $user mac-address=$"mac-address"}`;
    }

    const defaultOnLogout = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=logout&user=$user&mac=$mac-address&ip=$address" mode=http keep-result=no;`;

    const cmd = ["/ip/hotspot/user/profile/add", "=name=" + params.name];
    if (params.sharedUsers) cmd.push("=shared-users=" + params.sharedUsers);
    if (params.rateLimit) cmd.push("=rate-limit=" + params.rateLimit);
    
    cmd.push("=on-login=" + (params.onLogin || defaultOnLogin));
    cmd.push("=on-logout=" + (params.onLogout || defaultOnLogout));
    
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
    if (params.limitBytesIn) cmd.push("=limit-bytes-in=" + params.limitBytesIn);
    if (params.limitBytesOut) cmd.push("=limit-bytes-out=" + params.limitBytesOut);
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
