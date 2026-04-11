import { Sidebar } from "@/components/layout/sidebar";
import { RouterSelector } from "@/components/layout/router-selector";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SystemIntegrityProvider } from "@/components/layout/system-info";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const routers = await prisma.systemConfig.findMany({
    select: { no: true, routerName: true, routerIp: true }
  });

  return (
    <div className="flex min-h-screen bg-slate-50 pb-6">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b bg-white -mx-8 -mt-8 p-8 sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-sm font-medium text-slate-500">Administrator Dashboard</h2>
            <h1 className="text-2xl font-semibold text-slate-900">{session.user?.name}</h1>
          </div>
          <div className="flex items-center gap-6">
            <RouterSelector routers={routers} />
            <div className="flex flex-col items-end border-l pl-6">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Router Engine</span>
              <span className="text-xs font-bold text-green-500 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE MONITORING
              </span>
            </div>
          </div>
        </header>
        <div className="mt-4">
          {children}
        </div>
      </main>
      <SystemIntegrityProvider />
    </div>
  );
}
