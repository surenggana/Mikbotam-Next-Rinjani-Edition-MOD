import { getMikrotikConnection, getActiveConfig } from "../mikrotik";
import { buildHotspotVoucherOnLoginScript } from "./scripts";

export async function getHotspotUsers(customConfig?: any) {
  const conn = await getMikrotikConnection(customConfig);
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
  validity?: string;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    // Ambil URL server dari config untuk default script jika tidak disediakan
    const config = await getActiveConfig();
    const serverUrl = config?.dnsName || "https://mikbotam.angelicadigital.id";
    
    let onLoginScript = params.onLogin || "";
    
    if (!onLoginScript && params.validity && params.validity !== "0") {
      onLoginScript = buildHotspotVoucherOnLoginScript({
        validity: params.validity,
        serverUrl,
        lockMac: params.lockMac,
        removeAccount: true,
        broadcastAdmin: false,
        broadcastReseller: true,
      });
    }

    const defaultOnLogout = `:local ipaddr $"address";/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=logout&user=$user&ip=$ipaddr" mode=http keep-result=no;`;

    const cmd = ["/ip/hotspot/user/profile/add", "=name=" + params.name];
    if (params.sharedUsers) cmd.push("=shared-users=" + params.sharedUsers);
    if (params.rateLimit) cmd.push("=rate-limit=" + params.rateLimit);
    
    cmd.push("=on-login=" + onLoginScript);
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
  limitBytesTotal?: number;
  comment?: string;
}, customConfig?: any) {
  const conn = await getMikrotikConnection(customConfig);
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
    if (params.limitBytesTotal) cmd.push("=limit-bytes-total=" + params.limitBytesTotal);
    if (params.comment) cmd.push("=comment=" + params.comment);
    
    return await conn.write(cmd);
  } finally {
    conn.close();
  }
}

export async function removeHotspotUser(id: string, customConfig?: any) {
  const conn = await getMikrotikConnection(customConfig);
  try {
    await conn.connect();
    return await conn.write(["/ip/hotspot/user/remove", "=.id=" + id]);
  } finally {
    conn.close();
  }
}

export async function removeHotspotProfile(id: string) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write(["/ip/hotspot/user/profile/remove", "=.id=" + id]);
  } finally {
    conn.close();
  }
}

export async function updateHotspotProfile(id: string, params: {
  name: string;
  sharedUsers?: string;
  rateLimit?: string;
  validity?: string;
  lockMac?: boolean;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    const config = await getActiveConfig();
    const serverUrl = config?.dnsName || "https://mikbotam.angelicadigital.id";
    
    let onLoginScript = "";
    if (params.validity && params.validity !== "0") {
      onLoginScript = buildHotspotVoucherOnLoginScript({
        validity: params.validity,
        serverUrl,
        lockMac: params.lockMac,
        removeAccount: true,
        broadcastAdmin: false,
        broadcastReseller: true,
      });
    }
    
    const onLogoutScript = `:local ipaddr $"address";/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=logout&user=$user&ip=$ipaddr" mode=http keep-result=no;`;

    const cmd = ["/ip/hotspot/user/profile/set", "=.id=" + id, "=name=" + params.name];
    if (params.sharedUsers) cmd.push("=shared-users=" + params.sharedUsers);
    if (params.rateLimit) cmd.push("=rate-limit=" + params.rateLimit);
    
    cmd.push("=on-login=" + onLoginScript);
    cmd.push("=on-logout=" + onLogoutScript);
    
    return await conn.write(cmd);
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
    // Ambil data active sessions dan data user list secara bersamaan untuk mendapatkan limit-uptime
    const [active, users] = await Promise.all([
      conn.write("/ip/hotspot/active/print"),
      conn.write("/ip/hotspot/user/print")
    ]);

    // Map limit-uptime ke data active berdasarkan username
    return active.map((a: any) => {
      const u = users.find((usr: any) => usr.name === a.user);
      return {
        ...a,
        "limit-uptime": u ? u["limit-uptime"] : "0"
      };
    });
  } finally {
    conn.close();
  }
}
