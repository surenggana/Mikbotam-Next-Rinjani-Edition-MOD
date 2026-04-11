"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  History, 
  Settings, 
  LogOut,
  ChevronRight,
  Info,
  Ticket,
  Activity,
  Send,
  Terminal,
  UserCircle,
  MessageSquare,
  ShieldCheck,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const menuItems = [
  { group: "Main", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "User Management", href: "/dashboard/users", icon: Users },
    { name: "Transactions", href: "/dashboard/transactions", icon: History },
  ]},
  { group: "MikroTik Control", items: [
    { name: "Hotspot Manager", href: "/dashboard/mikrotik/hotspot", icon: Wifi },
    { name: "PPP Manager", href: "/dashboard/mikrotik/ppp", icon: ShieldCheck },
    { name: "Voucher & Pricing", href: "/dashboard/settings/vouchers", icon: Ticket },
  ]},
  { group: "Monitoring", items: [
    { name: "Monitoring Active", href: "/dashboard/monitoring/active", icon: Activity },
    { name: "System Logs", href: "/dashboard/monitoring/logs", icon: Terminal },
  ]},
  { group: "Communication", items: [
    { name: "Broadcast Telegram", href: "/dashboard/broadcast", icon: Send },
    { name: "Bot Editor", href: "/dashboard/settings/bot-editor", icon: MessageSquare },
  ]},
  { group: "Configuration", items: [
    { name: "My Profile", href: "/dashboard/profile", icon: UserCircle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "About", href: "/dashboard/about", icon: Info },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-slate-950 text-slate-300 min-h-screen flex flex-col border-r border-slate-800/50 shadow-2xl">
      <div className="p-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Wifi className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">MIKBOTAM</h1>
            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Rinjani Edition</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-8">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{group.group}</h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isActive 
                        ? "bg-teal-500/10 text-teal-400 font-semibold" 
                        : "hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={cn(
                        "transition-all duration-300",
                        isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                      )} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-teal-500/50" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-800/50 bg-slate-900/20">
        <div className="px-4 py-3 mb-4 rounded-xl bg-slate-900 border border-slate-800/50 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Version Control</span>
          <span className="text-xs font-mono text-teal-500/80">v2.1.0-stable</span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Keluar Sesi</span>
        </button>
      </div>
    </div>
  );
}
