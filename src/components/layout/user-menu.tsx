"use client";

import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, User, LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface UserMenuProps {
  name: string;
}

export function UserMenu({ name }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 md:gap-3 cursor-pointer outline-none group">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-900">{name}</span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-200 transition-colors">
            <UserCircle size={20} className="md:size-6" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-slate-500 font-medium">
          {name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/profile"
            className="cursor-pointer flex items-center gap-2"
          >
            <User size={14} />
            Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/settings"
            className="cursor-pointer flex items-center gap-2"
          >
            <Settings size={14} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer flex items-center gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={14} />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
