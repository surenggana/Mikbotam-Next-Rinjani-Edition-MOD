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
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "User Management", href: "/dashboard/users", icon: Users },
  { name: "Transactions", href: "/dashboard/transactions", icon: History },
  { name: "Hotspot Manager", href: "/dashboard/mikrotik/hotspot", icon: Wifi },
  { name: "PPP Manager", href: "/dashboard/mikrotik/ppp", icon: ShieldCheck },
  { name: "Voucher & Pricing", href: "/dashboard/settings/vouchers", icon: Ticket },
  { name: "Monitoring Active", href: "/dashboard/monitoring/active", icon: Activity },
  { name: "System Logs", href: "/dashboard/monitoring/logs", icon: Terminal },
  { name: "Broadcast Telegram", href: "/dashboard/broadcast", icon: Send },
  { name: "Bot Message Editor", href: "/dashboard/settings/bot-editor", icon: MessageSquare },
  { name: "My Profile", href: "/dashboard/profile", icon: UserCircle },
  { name: "About", href: "/dashboard/about", icon: Info },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-teal-400">MIKBOTAM</h1>
        <p className="text-xs text-slate-400 mt-1">Next Generation</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 group",
                isActive 
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-900/50 scale-[1.02]" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={cn(
                  "transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={16} className="animate-in fade-in slide-in-from-left-2" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="px-3 py-2 mb-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/50 rounded border border-slate-800/50">
          Mikbotam MOD v2.1.0
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
