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
      <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-teal-400 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-300"></div>
      <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-primary/50 transition-all duration-500 shadow-2xl">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-500">
          {/* Main Stylized 'M' with sharp outline */}
          <path 
            d="M4 18V6L12 14L20 6V18" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary"
          />
          {/* Subtle accent line */}
          <path 
            d="M8 14L12 18L16 14" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-teal-600/30"
          />
        </svg>
      </div>
    </div>
    {!isCollapsed && (
      <div className="animate-in fade-in slide-in-from-left-2 duration-500">
        <h1 className="text-xl font-black tracking-tighter text-sidebar-foreground leading-none">MIKBOTAM</h1>
        <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mt-1">Rinjani Edition</p>
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
      "bg-sidebar text-sidebar-foreground h-screen flex flex-col border-r border-sidebar-border shadow-xl relative transition-all duration-500 ease-in-out z-[60]",
      isCollapsed ? "w-20" : "w-72",
      className
    )}>
      {/* Header Section */}
      <div className={cn(
        "p-6 flex items-center justify-between h-24",
        isCollapsed ? "px-5" : "px-8"
      )}>
        <Logo isCollapsed={isCollapsed} />
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-sidebar-foreground/50 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        )}

        {!onClose && (
          <button 
            onClick={handleToggle}
            className={cn(
              "hidden md:flex p-1.5 rounded-lg bg-white/5 border border-white/10 text-sidebar-foreground/50 hover:text-primary hover:border-primary/50 transition-all duration-300",
              isCollapsed && "mx-auto mt-2"
            )}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
      
      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-6">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-5 text-[10px] font-black text-sidebar-foreground/30 uppercase tracking-[0.25em] animate-in fade-in duration-500">
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
                        ? "bg-primary/10 text-primary font-bold shadow-[inset_0_0_12px_rgba(20,184,166,0.02)]" 
                        : "text-sidebar-foreground/50 hover:bg-white/5 hover:text-sidebar-foreground",
                      isCollapsed ? "justify-center" : "justify-between"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1 h-5 bg-primary rounded-r-full animate-in fade-in slide-in-from-left-2 duration-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" />
                    )}
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-all duration-300",
                        isActive ? "bg-primary/20" : "bg-transparent group-hover:bg-white/5"
                      )}>
                        <item.icon size={18} className={cn(
                          "transition-all duration-300",
                          isActive ? "text-primary scale-110" : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/70 group-hover:scale-110"
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
                        <ChevronRight size={14} className="text-primary/50 animate-in slide-in-from-left-2 duration-300" />
                      ) : (
                        <ChevronRight size={14} className="text-sidebar-foreground/20 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      )
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-sidebar-accent text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl border border-white/10 z-[100] whitespace-nowrap">
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
        "p-5 mt-auto border-t border-sidebar-border bg-black/5 backdrop-blur-md transition-all duration-300",
        isCollapsed ? "items-center" : ""
      )}>
        {!isCollapsed && (
          <div className="px-4 py-3 mb-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 hover:border-primary/30 transition-all duration-300 cursor-default group overflow-hidden relative">
            <span className="text-[9px] font-black text-sidebar-foreground/30 uppercase tracking-widest leading-none">Version Status</span>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px] font-mono font-bold text-primary/80">v2.1.0-rinjani</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse" />
            </div>
          </div>
        )}

        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group overflow-hidden relative",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="p-1.5 rounded-lg bg-transparent group-hover:bg-red-500/20 transition-all duration-300">
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          {!isCollapsed && <span className="text-sm font-bold tracking-tight">Keluar Sesi</span>}
        </button>
      </div>
    </div>
  );
}
