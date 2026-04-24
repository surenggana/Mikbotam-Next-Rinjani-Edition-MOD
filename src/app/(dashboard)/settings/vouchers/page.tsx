import { prisma } from "@/lib/prisma";
import { getHotspotProfiles } from "@/lib/mikrotik/hotspot";
import { auth } from "@/auth";
import { VouchersClient } from "@/components/settings/vouchers-client";

export default async function VouchersSettingsPage() {
  const session = await auth();
  if (!session) return null;

  // Ambil profil dari router untuk dropdown nanti
  const profiles = await getHotspotProfiles().catch(() => []);
  
  // Ambil data voucher yang tersimpan (Scoping per adminId)
  const adminId = parseInt(session?.user?.id || "0");
  const voucherConfig = await prisma.voucherConfig.findFirst({
    where: { adminId }
  });
  let packages: any[] = [];
  try {
    packages = voucherConfig?.settings ? JSON.parse(voucherConfig.settings) : [];
  } catch(e) { packages = []; }

  return (
    <div className="space-y-6">
      <VouchersClient initialPackages={packages} profiles={profiles} />

      <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-md">
        <div className="flex items-center gap-3">
          <Info className="text-emerald-500" size={20} />
          <p className="text-sm text-emerald-700">
            <strong>Tips:</strong> Pastikan nama <strong>Profil MikroTik</strong> sama persis dengan yang ada di Winbox agar pembuatan voucher tidak gagal.
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
