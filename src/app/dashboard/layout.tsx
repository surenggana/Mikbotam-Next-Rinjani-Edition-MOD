import { Sidebar } from "@/components/layout/sidebar";
import { RouterSelector } from "@/components/layout/router-selector";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SystemIntegrityProvider } from "@/components/layout/system-info";
import { UserCircle } from "lucide-react";

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
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Administrator</span>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Welcome back, {session.user?.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <RouterSelector routers={routers} />
            </div>
            
            <div className="h-8 w-[1px] bg-slate-200" />
            
            <div className="flex items-center gap-3 pl-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900">{session.user?.name}</span>
                <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      <SystemIntegrityProvider />
    </div>
  );
}
