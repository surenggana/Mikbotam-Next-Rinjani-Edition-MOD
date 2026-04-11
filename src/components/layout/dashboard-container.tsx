"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardContainerProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function DashboardContainer({ children, header }: DashboardContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/50 overflow-hidden relative">
      {/* Desktop Sidebar Wrapper */}
      <div className={cn(
        "hidden md:block h-screen sticky top-0 shrink-0 transition-all duration-500 ease-in-out bg-slate-950",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="w-72 h-full animate-in slide-in-from-left duration-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header with Mobile Toggle */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 md:hidden hover:bg-slate-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            {header}
          </div>
          <div id="header-actions" className="flex items-center gap-2 md:gap-6">
            {/* Portals Target */}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/30">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
