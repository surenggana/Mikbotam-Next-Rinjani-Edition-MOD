"use client";

import React, { useState, useMemo, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  History, 
  Settings, 
  ChevronRight, 
  Info, 
  Ticket, 
  Activity, 
  Send, 
  Terminal, 
  UserCircle, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  PanelLeftClose, 
  PanelLeft,
  Zap,
  CreditCard,
  BarChart3,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { group: "Main", items: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reseller Management", href: "/users", icon: Users },
    { name: "Transaction History", href: "/transactions", icon: History },
    { name: "Permintaan Topup", href: "/topup-requests", icon: CreditCard },
    { name: "Laporan Penjualan", href: "/report", icon: BarChart3 },
  ]},
  { group: "Hotspot Service", items: [
    { name: "Hotspot Users", href: "/hotspot-users", icon: Users },
    { name: "User Profiles", href: "/hotspot-profiles", icon: Ticket },
    { name: "Voucher Generator", href: "/settings/vouchers", icon: Zap },
  ]},
  { group: "PPP Service", items: [
    { name: "PPP Secrets", href: "/ppp-secrets", icon: ShieldCheck },
    { name: "PPP Profiles", href: "/ppp-profiles", icon: Settings },
  ]},
  { group: "Monitoring", items: [
    { name: "Live Monitoring", href: "/monitoring/active", icon: Activity },
    { name: "System Logs", href: "/monitoring/logs", icon: Terminal },
  ]},
  { group: "Communication", items: [
    { name: "Broadcast Center", href: "/broadcast", icon: Send },
    { name: "Bot Configuration", href: "/settings/bot-editor", icon: MessageSquare },
  ]},
  { group: "System", items: [
    { name: "My Profile", href: "/profile", icon: UserCircle },
    { name: "App Settings", href: "/settings", icon: Settings },
    { name: "About System", href: "/about", icon: Info },
  ]},
];

const MenuItem = memo(({ item, isActive, isCollapsed, onClick }: any) => (
  <Link
    href={item.href}
    onClick={onClick}
    prefetch={true}
    className={cn(
      "flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
      isActive 
        ? "bg-emerald-50 text-emerald-600 font-bold" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      isCollapsed ? "justify-center" : "justify-between"
    )}
  >
    {isActive && (
      <span className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
    )}
    
    <div className="flex items-center gap-3 relative z-10">
      <div className={cn(
        "p-1.5 rounded-lg transition-all duration-200",
        isActive ? "bg-white shadow-sm ring-1 ring-emerald-500/20" : "bg-transparent group-hover:bg-white"
      )}>
        <item.icon size={18} className={cn(
          "transition-all duration-200",
          isActive ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-slate-600 group-hover:scale-110"
        )} />
      </div>
      {!isCollapsed && <span className="text-sm tracking-tight">{item.name}</span>}
    </div>

    {!isCollapsed && (
      isActive ? (
        <ChevronRight size={14} className="text-emerald-500/50" />
      ) : (
        <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      )
    )}

    {isCollapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-[100] whitespace-nowrap">
        {item.name}
      </div>
    )}
  </Link>
));

MenuItem.displayName = "MenuItem";

export const Sidebar = memo(({ onClose, className, isCollapsed: forcedCollapsed, onToggleCollapse }: any) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [localCollapsed, setLocalCollapsed] = useState(false);
  
  const isCollapsed = forcedCollapsed !== undefined ? forcedCollapsed : localCollapsed;
  const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";

  const handleToggle = () => {
    onToggleCollapse ? onToggleCollapse() : setLocalCollapsed(!localCollapsed);
  };

  return (
    <div className={cn(
      "bg-white text-slate-600 h-screen flex flex-col border-r border-slate-200 shadow-sm relative transition-all duration-300 ease-in-out z-[60]",
      isCollapsed ? "w-20" : "w-72",
      className
    )}>
      <div className={cn(
        "p-6 flex items-center justify-between h-24",
        isCollapsed ? "px-5" : "px-8"
      )}>
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18V6L12 14L20 6V18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">MIKBOTAM</h1>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">Rinjani Edition</p>
            </div>
          )}
        </div>
        
        {!onClose && (
          <button onClick={handleToggle} className="hidden md:flex p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-500 transition-all">
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-6">
        {isSuperAdmin ? (
          // MENU KHUSUS SUPERADMIN
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-5 text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Super Powers</h3>
            )}
            <MenuItem 
              item={{ name: "Admin Management", href: "/admin-management", icon: ShieldAlert }} 
              isActive={pathname === "/admin-management"} 
              isCollapsed={isCollapsed} 
              onClick={onClose} 
            />
            <MenuItem 
              item={{ name: "My Profile", href: "/profile", icon: UserCircle }} 
              isActive={pathname === "/profile"} 
              isCollapsed={isCollapsed} 
              onClick={onClose} 
            />
          </div>
        ) : (
          // MENU UNTUK ADMIN BIASA (TENANT)
          menuItems.map((group) => (
            <div key={group.group} className="space-y-2">
              {!isCollapsed && (
                <h3 className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.group}</h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MenuItem 
                    key={item.name} 
                    item={item} 
                    isActive={pathname === item.href} 
                    isCollapsed={isCollapsed} 
                    onClick={onClose} 
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      <div className="p-5 mt-auto border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed && (
          <div className="px-4 py-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-1 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">v2.3.0-rinjani</span>
          </div>
        )}
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";
