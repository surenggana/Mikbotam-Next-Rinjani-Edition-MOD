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
 * Format MikroTik uptime string (e.g. 1d05:20:10) to more readable version
 */
export function formatUptime(uptime: string | undefined) {
  if (!uptime) return "-";
  
  // MikroTik format: 1d05:20:10 or 05:20:10 or 1w2d...
  // Just clean up slightly if needed, or return as is if already decent
  return uptime.replace('w', 'w ').replace('d', 'd ').trim();
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
