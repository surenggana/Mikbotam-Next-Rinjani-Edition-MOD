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
