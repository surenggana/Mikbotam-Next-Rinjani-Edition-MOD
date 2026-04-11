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
 * Format MikroTik uptime string to hari/jam/menit
 * Input examples: "1d05:20:10", "05:20:10", "1w2d05:20:10", "3d12:00:00"
 */
export function formatUptime(uptime: string | undefined) {
  if (!uptime) return "-";

  let str = uptime.trim();
  let weeks = 0, days = 0, hours = 0, minutes = 0;

  const weekMatch = str.match(/^(\d+)w/);
  if (weekMatch) {
    weeks = parseInt(weekMatch[1]);
    str = str.slice(weekMatch[0].length);
  }

  const dayMatch = str.match(/^(\d+)d/);
  if (dayMatch) {
    days = parseInt(dayMatch[1]);
    str = str.slice(dayMatch[0].length);
  }

  const timeParts = str.split(":");
  if (timeParts.length >= 2) {
    hours = parseInt(timeParts[0]) || 0;
    minutes = parseInt(timeParts[1]) || 0;
  }

  days += weeks * 7;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0 || days > 0) parts.push(`${hours}j`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
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
