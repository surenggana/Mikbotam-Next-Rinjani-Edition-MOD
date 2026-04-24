import { getMikrotikConnection, getActiveConfig } from "../mikrotik";

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
  validity?: string;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    // Ambil URL server dari config untuk default script jika tidak disediakan
    const config = await getActiveConfig();
    const serverUrl = config?.dnsName || "https://mikbotam.angelicadigital.id";
    
    // SCRIPT AUTO DELETE & LOCK MAC (Sesuai Mikbotam Master PHP)
    let onLoginScript = params.onLogin || "";
    
    if (!onLoginScript && params.validity && params.validity !== "0") {
      const lockMacCmd = params.lockMac ? `[/ip hotspot user set mac-address=$"mac-address" [find where name=$user]];` : "";
      
      // Logika asli BangAchil: Membuat scheduler otomatis saat login pertama kali
      onLoginScript = `{:local date [/system clock get date ];:local time [/system clock get time ];:local uptime (${params.validity});:local macadd $"mac-address";${lockMacCmd}[/system scheduler add disabled=no interval=$uptime name=$user on-event="[/ip hotspot active remove [find where user=$user]];[/ip hotspot user remove [find where name=$user]];[/ip hotspot cookie remove [find user=$user]];[/sys sch re [find where name=$user]]" start-date=$date start-time=$time];}`;
    }

    // Tambahkan notifikasi webhook ke Dashboard (Opsional, untuk monitoring real-time)
    const webhookLogin = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=login&user=$user&mac=$mac-address&ip=$address" mode=http keep-result=no;`;
    onLoginScript = webhookLogin + (onLoginScript ? " " + onLoginScript : "");

    const defaultOnLogout = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=logout&user=$user&mac=$mac-address&ip=$address" mode=http keep-result=no;`;

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
    const serverUrl = config?.dnsName || "http://your-server.com";
    
    let onLoginScript = "";
    if (params.validity && params.validity !== "0") {
      const lockMacCmd = params.lockMac ? `[/ip hotspot user set mac-address=$"mac-address" [find where name=$user]];` : "";
      onLoginScript = `{:local date [/system clock get date ];:local time [/system clock get time ];:local uptime (${params.validity});:local macadd $"mac-address";${lockMacCmd}[/system scheduler add disabled=no interval=$uptime name=$user on-event="[/ip hotspot active remove [find where user=$user]];[/ip hotspot user remove [find where name=$user]];[/ip hotspot cookie remove [find user=$user]];[/sys sch re [find where name=$user]]" start-date=$date start-time=$time];}`;
    }
    
    const webhookLogin = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=login&user=$user&mac=$mac-address&ip=$address" mode=http keep-result=no;`;
    onLoginScript = webhookLogin + (onLoginScript ? " " + onLoginScript : "");

    const cmd = ["/ip/hotspot/user/profile/set", "=.id=" + id, "=name=" + params.name];
    if (params.sharedUsers) cmd.push("=shared-users=" + params.sharedUsers);
    if (params.rateLimit) cmd.push("=rate-limit=" + params.rateLimit);
    cmd.push("=on-login=" + onLoginScript);
    
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
