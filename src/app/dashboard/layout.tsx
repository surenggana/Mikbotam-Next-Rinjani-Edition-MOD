import { RouterSelector } from "@/components/layout/router-selector";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserCircle } from "lucide-react";
import { DashboardContainer } from "@/components/layout/dashboard-container";

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

  const headerContent = (
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Administrator</span>
      <h1 className="text-sm md:text-xl font-bold text-slate-900 flex items-center gap-2 truncate max-w-[150px] md:max-w-none">
        {session.user?.name}
      </h1>
    </div>
  );

  const headerActions = (
    <>
      <div className="hidden md:block">
        <RouterSelector routers={routers} />
      </div>
      
      <div className="hidden md:block h-8 w-[1px] bg-slate-200" />
      
      <div className="flex items-center gap-2 md:gap-3 md:pl-2">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-bold text-slate-900">{session.user?.name}</span>
          <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            ONLINE
          </span>
        </div>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 shrink-0">
          <UserCircle size={20} className="md:size-6" />
        </div>
      </div>
    </>
  );

  return (
    <DashboardContainer 
      header={headerContent}
    >
      <div className="relative">
        <div className="absolute top-0 right-0 -translate-y-[72px] flex items-center gap-4 z-40">
           {headerActions}
        </div>
        {children}
      </div>
    </DashboardContainer>
  );
}
