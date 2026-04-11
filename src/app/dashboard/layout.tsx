import { RouterSelector } from "@/components/layout/router-selector";
import { UserMenu } from "@/components/layout/user-menu";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Administrator</span>
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

      <div className="md:pl-2">
        <UserMenu name={session.user?.name || "Admin"} />
      </div>
    </>
  );


  return (
    <DashboardContainer 
      header={headerContent}
      headerActions={headerActions}
    >
      {children}
    </DashboardContainer>
  );
}
