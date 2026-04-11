import { addHotspotUser, removeHotspotUser } from "./hotspot";
import { getMikrotikConnection } from "../mikrotik";
import { format, addDays, isBefore, parse } from "date-fns";

/**
 * Mengambil log sistem terbaru dari MikroTik
 */
export async function getSystemLogs() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    // Ambil 50 log terbaru
    return await conn.write("/log/print", { ".proplist": ".id,time,topics,message" });
  } finally {
    conn.close();
  }
}

/**
 * Logika penghapusan paksa untuk ROS 7
 * ROS 7 terkadang bermasalah dengan script scheduler internal, 
 * maka kita handle penghapusan dari sisi Server Next.js
 */
export async function forceDeleteExpiredUsers() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    // 1. Ambil semua user hotspot
    const users = await conn.write("/ip/hotspot/user/print");
    const today = new Date();
    let deletedCount = 0;

    for (const user of users) {
      if (user.comment && user.comment.startsWith("vc-")) {
        const parts = user.comment.split("-");
        // Format: vc-[price]-[expiry_yyyy-mm-dd]-[sellerId]
        if (parts.length >= 4) {
          const expiryStr = `${parts[2]}-${parts[3]}-${parts[4]}`;
          try {
            const expiryDate = parse(expiryStr, "yyyy-MM-dd", new Date());
            
            if (isBefore(expiryDate, today)) {
              // Hapus User secara paksa
              await conn.write("/ip/hotspot/user/remove", { ".id": user[".id"] });
              
              // Jika ada active session, kick juga
              const activeSessions = await conn.write("/ip/hotspot/active/print", { "?user": user.name });
              for (const session of activeSessions) {
                await conn.write("/ip/hotspot/active/remove", { ".id": session[".id"] });
              }
              
              deletedCount++;
              console.log(`[ROS 7 Cleaner] Berhasil menghapus user expired: ${user.name}`);
            }
          } catch (e) { /* ignore invalid date format */ }
        }
      }
    }
    return { success: true, deletedCount };
  } finally {
    conn.close();
  }
}
