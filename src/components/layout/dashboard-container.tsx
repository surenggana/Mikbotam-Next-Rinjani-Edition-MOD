"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardContainerProps {
  children: React.ReactNode;
  header: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function DashboardContainer({ children, header, headerActions }: DashboardContainerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden font-sans">
      {/* Desktop Sidebar - Locked Height */}
      <div className={cn(
        "hidden md:block h-full transition-all duration-500 ease-in-out shrink-0 border-r border-slate-200/60 shadow-xl z-40",
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
            className="w-72 h-full animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Sticky Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200 shrink-0 z-30 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 md:hidden hover:bg-slate-200 transition-colors shadow-sm"
            >
              <Menu size={20} />
            </button>
            {header}
          </div>
          {headerActions}
        </header>
        
        {/* Content Wrapper - The only scrollable part */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-transparent relative">
          <div className="p-4 md:p-10 max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 ease-out">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
