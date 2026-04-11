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
    // Gunakan format array string untuk parameter RouterOS API
    return await conn.write(["/log/print", "=.proplist=.id,time,topics,message"]);
  } finally {
    conn.close();
  }
}

/**
 * Logika penghapusan paksa untuk ROS 7
 */
export async function forceDeleteExpiredUsers() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    const users = await conn.write("/ip/hotspot/user/print");
    const today = new Date();
    let deletedCount = 0;

    for (const user of users) {
      if (user.comment && user.comment.startsWith("vc-")) {
        const parts = user.comment.split("-");
        if (parts.length >= 4) {
          const expiryStr = `${parts[2]}-${parts[3]}-${parts[4]}`;
          try {
            const expiryDate = parse(expiryStr, "yyyy-MM-dd", new Date());
            
            if (isBefore(expiryDate, today)) {
              // Format remove: ["/path/remove", "=.id=*ID"]
              await conn.write(["/ip/hotspot/user/remove", "=.id=" + user[".id"]]);
              
              // Kick active session
              const activeSessions = await conn.write(["/ip/hotspot/active/print", "?user=" + user.name]);
              for (const session of activeSessions) {
                await conn.write(["/ip/hotspot/active/remove", "=.id=" + session[".id"]]);
              }
              
              deletedCount++;
            }
          } catch (e) { /* ignore */ }
        }
      }
    }
    return { success: true, deletedCount };
  } finally {
    conn.close();
  }
}
