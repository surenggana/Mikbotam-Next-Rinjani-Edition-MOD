"use server";

import { getActiveHotspotUsers } from "@/lib/mikrotik/hotspot";
import { getActivePppUsers } from "@/lib/mikrotik/ppp";
import { getInterfaces } from "@/lib/mikrotik";

export async function getLiveMonitoringData() {
  try {
    const [hotspot, ppp, interfaces] = await Promise.all([
      getActiveHotspotUsers().catch(() => []),
      getActivePppUsers().catch(() => []),
      getInterfaces().catch(() => [])
    ]);
    
    return {
      hotspot,
      ppp,
      interfaces,
      success: true
    };
  } catch (error) {
    console.error("Failed to fetch live monitoring data:", error);
    return {
      hotspot: [],
      ppp: [],
      interfaces: [],
      success: false,
      error: "Failed to sync with router"
    };
  }
}

import { getMikrotikConnection } from "@/lib/mikrotik";

export async function getInterfaceTraffic(interfaceName: string) {
  try {
    const conn = await getMikrotikConnection();
    await conn.connect();
    const data = await conn.write([
      "/interface/monitor-traffic",
      "=interface=" + interfaceName,
      "=once="
    ]);
    return {
      rx: parseInt(data[0]["rx-bits-per-second"] || "0"),
      tx: parseInt(data[0]["tx-bits-per-second"] || "0"),
      success: true
    };
  } catch (error) {
    // Return quiet failure instead of throwing
    return { rx: 0, tx: 0, success: false };
  }
}
