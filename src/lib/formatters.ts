/**
 * Format bytes to human readable string (KB, MB, GB, TB)
 */
export function formatBytes(bytes: number | string | undefined, decimals = 2) {
  if (!bytes || bytes === "0") return "0 B";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));

  return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Format MikroTik uptime string to human readable format
 * Supports: "1w2d05:20:10", "3d12:00:00", "05:20:10", "1h30m", "45s", etc.
 */
export function formatUptime(uptime: string | undefined) {
  if (!uptime || uptime === "0") return "0m";

  let str = uptime.trim();
  
  // Case 1: Format HH:MM:SS (e.g. 05:20:10)
  // Or with days: 1d05:20:10
  if (str.includes(":")) {
    let days = 0;
    const dayMatch = str.match(/(\d+)d/);
    if (dayMatch) {
      days = parseInt(dayMatch[1]);
      str = str.split("d")[1];
    }
    
    const weekMatch = uptime.match(/(\d+)w/);
    if (weekMatch) days += parseInt(weekMatch[1]) * 7;

    const [h, m, s] = str.split(":").map(n => parseInt(n) || 0);
    
    const parts = [];
    if (days > 0) parts.push(`${days}h`);
    if (h > 0 || days > 0) parts.push(`${h}j`);
    parts.push(`${m}m`);
    // Only show seconds if less than a minute
    if (days === 0 && h === 0 && m === 0) parts.push(`${s}s`);
    
    return parts.join(" ");
  }

  // Case 2: Shorthand format (e.g. 1h30m, 45s, 1d)
  const weeks = parseInt(str.match(/(\d+)w/)?.[1] || "0");
  const days = parseInt(str.match(/(\d+)d/)?.[1] || "0") + (weeks * 7);
  const hours = parseInt(str.match(/(\d+)h/)?.[1] || "0");
  const mins = parseInt(str.match(/(\d+)m/)?.[1] || "0");
  const secs = parseInt(str.match(/(\d+)s/)?.[1] || "0");

  const parts = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0 || days > 0) parts.push(`${hours}j`);
  if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
  if (parts.length === 0 && secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(" ") : "0m";
}

/**
 * Format currency to IDR
 */
export function formatIDR(amount: number | string | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(Number(amount || 0));
}
