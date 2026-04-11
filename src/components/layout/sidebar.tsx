"use client";

import React, { useState } from "react";
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
  Wifi, 
  X, 
  PanelLeftClose, 
  PanelLeft,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const menuItems = [
  { group: "Main", items: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Reseller Management", href: "/dashboard/users", icon: Users },
    { name: "Transaction History", href: "/dashboard/transactions", icon: History },
  ]},
  { group: "Hotspot Service", items: [
    { name: "Hotspot Users", href: "/dashboard/mikrotik/hotspot/users", icon: Users },
    { name: "User Profiles", href: "/dashboard/mikrotik/hotspot/profiles", icon: Ticket },
    { name: "Voucher Generator", href: "/dashboard/settings/vouchers", icon: Zap },
  ]},
  { group: "PPP Service", items: [
    { name: "PPP Secrets", href: "/dashboard/mikrotik/ppp/secrets", icon: ShieldCheck },
    { name: "PPP Profiles", href: "/dashboard/mikrotik/ppp/profiles", icon: Settings },
  ]},
  { group: "Communication", items: [
    { name: "Broadcast Center", href: "/dashboard/broadcast", icon: Send },
    { name: "Bot Configuration", href: "/dashboard/settings/bot-editor", icon: MessageSquare },
  ]},
  { group: "System", items: [
    { name: "My Profile", href: "/dashboard/profile", icon: UserCircle },
    { name: "App Settings", href: "/dashboard/settings", icon: Settings },
    { name: "About System", href: "/dashboard/about", icon: Info },
  ]},
];

interface SidebarProps {
  onClose?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Logo = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="flex items-center gap-3">
    <div className="relative group cursor-pointer">
      <div className="absolute -inset-1 bg-gradient-to-tr from-[#0ea5e9] to-[#14b8a6] rounded-xl blur-md opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-300"></div>
      <div className="relative w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-[#0ea5e9]/50 transition-all duration-500 overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:8px_8px]"></div>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 group-hover:scale-110 transition-transform duration-500">
          <path 
            d="M4 18V6L12 14L20 6V18" 
            stroke="url(#logo-gradient-sidebar-v2)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <defs>
            <linearGradient id="logo-gradient-sidebar-v2" x1="4" y1="6" x2="20" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    {!isCollapsed && (
      <div className="animate-in fade-in slide-in-from-left-2 duration-500">
        <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">MIKBOTAM</h1>
        <p className="text-[9px] font-black text-[#0ea5e9] uppercase tracking-[0.25em] mt-1">Rinjani Edition</p>
      </div>
    )}
  </div>
);

export function Sidebar({ onClose, className, isCollapsed: forcedCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [localCollapsed, setLocalCollapsed] = useState(false);
  
  const isCollapsed = forcedCollapsed !== undefined ? forcedCollapsed : localCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed(!localCollapsed);
    }
  };

  return (
    <div className={cn(
      "bg-white text-slate-600 h-screen flex flex-col border-r border-slate-200 shadow-sm relative transition-all duration-500 ease-in-out z-[60]",
      isCollapsed ? "w-20" : "w-72",
      className
    )}>
      <div className="absolute inset-0 bg-white -z-10" />

      <div className={cn(
        "p-6 flex items-center justify-between h-24",
        isCollapsed ? "px-5" : "px-8"
      )}>
        <Logo isCollapsed={isCollapsed} />
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 md:hidden transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {!onClose && (
          <button 
            onClick={handleToggle}
            className={cn(
              "hidden md:flex p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#0ea5e9] hover:border-[#0ea5e9]/50 transition-all duration-300",
              isCollapsed && "mx-auto mt-2"
            )}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-6">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] animate-in fade-in duration-500">
                {group.group}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
                      isActive 
                        ? "bg-[#0ea5e9]/10 text-[#0ea5e9] font-bold" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                      isCollapsed ? "justify-center" : "justify-between"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1 h-5 bg-[#0ea5e9] rounded-r-full animate-in fade-in slide-in-from-left-2 duration-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
                    )}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        isActive ? "bg-white shadow-sm ring-1 ring-[#0ea5e9]/20" : "bg-transparent group-hover:bg-white"
                      )}>
                        <item.icon size={18} className={cn(
                          "transition-all duration-300",
                          isActive ? "text-[#0ea5e9] scale-110" : "text-slate-400 group-hover:text-slate-600 group-hover:scale-110"
                        )} />
                      </div>
                      {!isCollapsed && (
                        <span className="text-sm tracking-tight">
                          {item.name}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && (
                      isActive ? (
                        <ChevronRight size={14} className="text-[#0ea5e9]/50 animate-in slide-in-from-left-2 duration-300" />
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
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn(
        "p-5 mt-auto border-t border-slate-100 bg-slate-50/50 transition-all duration-300",
        isCollapsed ? "items-center" : ""
      )}>
        {!isCollapsed && (
          <div className="px-4 py-3 mb-4 rounded-xl bg-white border border-slate-200 flex flex-col gap-1 hover:border-[#0ea5e9]/30 transition-all duration-300 cursor-default group overflow-hidden relative shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Version Status</span>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px] font-mono font-bold text-slate-600">v2.1.0-rinjani</span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            </div>
          </div>
        )}

        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group overflow-hidden relative",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="p-1.5 rounded-lg bg-transparent group-hover:bg-red-100 transition-all duration-300">
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          {!isCollapsed && <span className="text-sm font-bold tracking-tight">Keluar Sesi</span>}
        </button>
      </div>
    </div>
  );
}
