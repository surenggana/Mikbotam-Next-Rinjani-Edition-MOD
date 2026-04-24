/**
 * Memformat string rate-limit standar MikroTik
 * Format: rate [burst-limit [burst-threshold [burst-time [priority [limit-at]]]]]
 */
export function formatRateLimit(params: {
  rate: string;           // Contoh: 1M/1M
  burstLimit?: string;    // Contoh: 2M/2M
  burstThreshold?: string; // Contoh: 1500k/1500k
  burstTime?: string;     // Contoh: 30s/30s
  priority?: number;      // 1 - 8
  limitAt?: string;       // Contoh: 512k/512k
}) {
  if (!params.rate) return "";
  
  // MikroTik requires strict order. If we want to set Priority (index 4), 
  // we MUST provide values for 0, 1, 2, and 3.
  
  const parts: string[] = [params.rate];
  
  const bLimit = params.burstLimit || "none";
  const bThreshold = params.burstThreshold || "none";
  let bTime = params.burstTime || "0s";
  const priority = params.priority || 8;
  const limitAt = params.limitAt || "none";

  // Normalize burst time format (ensure 's' is present)
  if (bTime !== "none" && bTime !== "0s") {
    if (/^\d+$/.test(bTime)) {
      bTime = `${bTime}s/${bTime}s`;
    } else if (/^\d+\/\d+$/.test(bTime)) {
      const [rx, tx] = bTime.split("/");
      bTime = `${rx.replace(/s$/, "")}s/${tx.replace(/s$/, "")}s`;
    }
  }

  // If any advanced setting is used, we must build the string up to that point
  if (params.burstLimit || params.burstThreshold || params.burstTime || params.priority !== 8 || params.limitAt) {
    parts.push(bLimit);
    parts.push(bThreshold);
    parts.push(bTime);
    parts.push(priority.toString());
    
    if (params.limitAt) {
      parts.push(limitAt);
    }
  }
  
  return parts.join(" ");
}
