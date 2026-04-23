import { NextRequest, NextResponse } from "next/server";
import { forceDeleteExpiredUsers } from "@/lib/mikrotik/automation";

/**
 * Endpoint Cron untuk menghapus user expired otomatis
 * Dipanggil oleh MikroTik Scheduler atau Cron Job Eksternal
 */
export async function GET(req: NextRequest) {
  try {
    const result = await forceDeleteExpiredUsers();
    
    return NextResponse.json({ 
      status: "success", 
      message: "Proses pembersihan selesai.",
      deletedCount: result.deletedCount 
    });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ 
      status: "error", 
      message: err.message 
    }, { status: 500 });
  }
}
