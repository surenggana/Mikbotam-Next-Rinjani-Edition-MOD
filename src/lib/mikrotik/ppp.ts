import { getMikrotikConnection, getActiveConfig } from "../mikrotik";

export async function getPppProfiles() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write("/ppp/profile/print");
  } finally {
    conn.close();
  }
}

export async function addPppProfile(params: {
  name: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string;
  onUp?: string;
  onDown?: string;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();

    // Ambil URL server dari config untuk default script jika tidak disediakan
    const config = await getActiveConfig();
    const serverUrl = config?.dnsName || "http://your-server.com";

    const defaultOnUp = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=login&user=$user&mac=$"remote-address"&ip=$"remote-address"" mode=http keep-result=no;`;
    const defaultOnDown = `/tool fetch url="${serverUrl}/api/mikrotik/webhook?action=logout&user=$user&mac=$"remote-address"&ip=$"remote-address"" mode=http keep-result=no;`;

    const cmd = ["/ppp/profile/add", "=name=" + params.name];
    if (params.localAddress) cmd.push("=local-address=" + params.localAddress);
    if (params.remoteAddress) cmd.push("=remote-address=" + params.remoteAddress);
    if (params.rateLimit) cmd.push("=rate-limit=" + params.rateLimit);

    cmd.push("=on-up=" + (params.onUp || defaultOnUp));
    cmd.push("=on-down=" + (params.onDown || defaultOnDown));

    return await conn.write(cmd);
  } finally {
    conn.close();
  }
}

export async function getPppSecrets() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write("/ppp/secret/print");
  } finally {
    conn.close();
  }
}

export async function addPppSecret(params: {
  name: string;
  password?: string;
  service: "pppoe" | "pptp" | "l2tp" | "any";
  profile: string;
  comment?: string;
  remoteAddress?: string;
}) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    const cmd = [
      "/ppp/secret/add",
      "=name=" + params.name,
      "=password=" + (params.password || ""),
      "=service=" + (params.service || "pppoe"),
      "=profile=" + params.profile,
    ];

    if (params.comment) cmd.push("=comment=" + params.comment);
    if (params.remoteAddress) cmd.push("=remote-address=" + params.remoteAddress);

    return await conn.write(cmd);
  } finally {
    conn.close();
  }
}

export async function removePppSecret(id: string) {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write(["/ppp/secret/remove", "=.id=" + id]);
  } finally {
    conn.close();
  }
}

export async function setPppSecretStatus(id: string, action: "enable" | "disable") {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write([`/ppp/secret/${action}`, "=.id=" + id]);
  } finally {
    conn.close();
  }
}

export async function getActivePppUsers() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    return await conn.write("/ppp/active/print");
  } finally {
    conn.close();
  }
}
