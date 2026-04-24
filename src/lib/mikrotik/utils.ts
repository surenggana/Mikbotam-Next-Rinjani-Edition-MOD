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
