/**
 * Memformat string rate-limit standar MikroTik
 * Format: rx-rate[/tx-rate] [rx-burst-limit[/tx-burst-limit] [rx-burst-threshold[/tx-burst-threshold] [rx-burst-time[/tx-burst-time] [priority] [rx-limit-at[/tx-limit-at]]]]
 */
export function formatRateLimit(params: {
  rate: string;           // Contoh: 1M/1M
  burstLimit?: string;    // Contoh: 2M/2M
  burstThreshold?: string; // Contoh: 1500k/1500k
  burstTime?: string;     // Contoh: 30s/30s
  priority?: number;      // 1 - 8
  limitAt?: string;       // Contoh: 512k/512k
}) {
  let parts = [params.rate];
  
  if (params.burstLimit) {
    parts.push(params.burstLimit);
    if (params.burstThreshold) {
      parts.push(params.burstThreshold);
      if (params.burstTime) {
        // Fix: MikroTik burst-time requires unit (e.g., 30s). 
        // If user input is just "30", we append "s/s" or "30s/30s"
        let bTime = params.burstTime;
        if (/^\d+$/.test(bTime)) {
          bTime = `${bTime}s/${bTime}s`;
        } else if (/^\d+\/\d+$/.test(bTime)) {
          // If input is "30/30", convert to "30s/30s"
          const [rx, tx] = bTime.split("/");
          bTime = `${rx}s/${tx}s`;
        }
        
        parts.push(bTime);
        if (params.priority) {
          parts.push(params.priority.toString());
          if (params.limitAt) {
            parts.push(params.limitAt);
          }
        }
      }
    }
  }
  
  return parts.join(" ");
}
