/**
 * Memformat string rate-limit standar MikroTik
 * Format: rate [burst-limit [burst-threshold [burst-time [priority [limit-at]]]]]
 * Contoh: 3M/3M 5M/5M 4M/4M 30s/30s 8 1M/1M
 */
export function formatRateLimit(params: {
  rate: string;           
  burstLimit?: string;    
  burstThreshold?: string;
  burstTime?: string;     
  priority?: number;      
  limitAt?: string;       
}) {
  if (!params.rate) return "";
  
  // Jika hanya isi Rate Limit saja (tanpa burst/priority)
  if (!params.burstLimit && !params.burstThreshold && !params.burstTime && (!params.priority || params.priority === 8)) {
    return params.rate;
  }

  // Jika ada salah satu advance setting, MikroTik wajib dikirim lengkap urutannya
  const rate = params.rate;
  const bLimit = params.burstLimit || "0/0";
  const bThreshold = params.burstThreshold || "0/0";
  let bTime = params.burstTime || "0/0";
  const priority = params.priority || 8;

  // Pastikan format Burst Time ada detiknya 's' jika angka polos
  if (bTime !== "0/0") {
    if (/^\d+$/.test(bTime)) {
      bTime = `${bTime}s/${bTime}s`;
    } else if (/^\d+\/\d+$/.test(bTime)) {
      const [rx, tx] = bTime.split("/");
      bTime = `${rx.replace(/s$/, "")}s/${tx.replace(/s$/, "")}s`;
    }
  }

  let result = `${rate} ${bLimit} ${bThreshold} ${bTime} ${priority}`;
  
  if (params.limitAt) {
    result += ` ${params.limitAt}`;
  }
  
  return result;
}

/**
 * Utility to parse Mikrotik duration strings (e.g., 30m, 1h, 1d) into seconds.
 */
export function parseMikrotikDuration(duration: string): number {
  if (!duration) return 0;
  
  const regex = /(\d+)([dhms])/g;
  let seconds = 0;
  let match;

  while ((match = regex.exec(duration.toLowerCase())) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': seconds += value * 86400; break;
      case 'h': seconds += value * 3600; break;
      case 'm': seconds += value * 60; break;
      case 's': seconds += value; break;
    }
  }

  // Handle pure numbers as seconds
  if (seconds === 0 && !isNaN(parseInt(duration))) {
    return parseInt(duration);
  }

  return seconds;
}

/**
 * Utility to format Date into Mikbotam string formats.
 */
export function formatToMikbotamDate(date: Date): { time: string, date: string } {
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  const secs = String(date.getSeconds()).padStart(2, '0');
  const time = `${hours}:${mins}:${secs}`;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return { time, date: dateStr };
}
