"use client";

import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  PanelLeftClose,
  PanelLeft
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

interface SidebarProps {
  onClose?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Logo = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="flex items-center gap-3">
    <div className="relative group cursor-pointer">
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-slate-800 group-hover:border-teal-500/50 transition-colors">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-400 group-hover:scale-110 transition-transform duration-300">
          <path d="M12 4V20M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 12H20M4 12L8 16M4 12L8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
    </div>
    {!isCollapsed && (
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <h1 className="text-xl font-black tracking-tighter text-white leading-none">MIKBOTAM</h1>
        <p className="text-[9px] font-black text-teal-500 uppercase tracking-[0.2em] mt-1">Rinjani Edition</p>
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
      "bg-slate-950 text-slate-300 h-screen flex flex-col border-r border-slate-800/50 shadow-2xl relative transition-all duration-500 ease-in-out z-[60]",
      isCollapsed ? "w-20" : "w-72",
      className
    )}>
      {/* Scroll Background Fix: Ensure background covers everything */}
      <div className="absolute inset-0 bg-slate-950 -z-10" />

      {/* Header / Logo Section */}
      <div className={cn(
        "p-6 flex items-center justify-between h-24 transition-all duration-300",
        isCollapsed ? "px-5" : "px-8"
      )}>
        <Logo isCollapsed={isCollapsed} />
        
        {/* Mobile Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        )}

        {/* Desktop Toggle Button */}
        {!onClose && (
          <button 
            onClick={handleToggle}
            className={cn(
              "hidden md:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-teal-400 hover:border-teal-500/50 transition-all duration-300",
              isCollapsed && "mx-auto mt-2"
            )}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
      
      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-8">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] opacity-80 animate-in fade-in duration-500">
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
                      "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative",
                      isActive 
                        ? "bg-teal-500/10 text-teal-400 font-semibold shadow-[inset_0_0_20px_rgba(20,184,166,0.05)]" 
                        : "hover:bg-white/5 hover:text-white",
                      isCollapsed ? "justify-center" : "justify-between"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1 h-6 bg-teal-500 rounded-r-full animate-in fade-in slide-in-from-left-2 duration-500" />
                    )}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        isActive ? "bg-teal-500/20 shadow-lg shadow-teal-500/20" : "bg-transparent group-hover:bg-white/5"
                      )}>
                        <item.icon size={18} className={cn(
                          "transition-all duration-300",
                          isActive ? "text-teal-400 scale-110" : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                        )} />
                      </div>
                      {!isCollapsed && (
                        <span className="text-sm tracking-tight animate-in fade-in slide-in-from-left-1 duration-300">
                          {item.name}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && (
                      isActive ? (
                        <ChevronRight size={14} className="text-teal-500/50 animate-in slide-in-from-left-2 duration-300" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      )
                    )}

                    {/* Tooltip for Collapsed Sidebar */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl border border-slate-800 z-[100] whitespace-nowrap">
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

      {/* Footer Section */}
      <div className={cn(
        "p-5 mt-auto border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-md transition-all duration-300",
        isCollapsed ? "items-center" : ""
      )}>
        {!isCollapsed && (
          <div className="px-4 py-3 mb-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex flex-col gap-1 hover:border-teal-500/30 transition-all duration-300 cursor-default group overflow-hidden relative">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Version Status</span>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px] font-mono font-bold text-teal-500/90">v2.1.0-rinjani</span>
              <div className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-pulse" />
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={48} className="text-teal-400" />
            </div>
          </div>
        )}

        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group overflow-hidden relative",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="p-1.5 rounded-lg bg-transparent group-hover:bg-red-500/20 transition-all duration-300">
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          {!isCollapsed && <span className="text-sm font-bold tracking-tight">Keluar Sesi</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-red-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl border border-red-800 z-[100] whitespace-nowrap">
              Keluar Sesi
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
