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
      if (user.comment && (user.comment.startsWith("vc-") || user.comment.startsWith("vc-bot"))) {
        let expiryDate: Date | null = null;

        // Handle vc-bot|... format (date at end)
        if (user.comment.includes("|")) {
          const parts = user.comment.split("|");
          const dateStr = parts[parts.length - 1]; // "DD/MM/YYYY" or similar from toLocaleDateString
          try {
            expiryDate = new Date(dateStr);
          } catch(e) {}
        } 
        // Handle vc-yyyy-mm-dd format
        else {
          const parts = user.comment.split("-");
          if (parts.length >= 4) {
            const expiryStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
            try {
              expiryDate = parse(expiryStr, "yyyy-MM-dd", new Date());
            } catch (e) {}
          }
        }
        
        if (expiryDate && !isNaN(expiryDate.getTime()) && isBefore(expiryDate, today)) {
          // Format remove: ["/path/remove", "=.id=*ID"]
          await conn.write(["/ip/hotspot/user/remove", "=.id=" + user[".id"]]);
          
          // Kick active session
          const activeSessions = await conn.write(["/ip/hotspot/active/print", "?user=" + user.name]);
          for (const session of activeSessions) {
            await conn.write(["/ip/hotspot/active/remove", "=.id=" + session[".id"]]);
          }
          
          deletedCount++;
        }
      }
    }
    return { success: true, deletedCount };
  } finally {
    conn.close();
  }
}
