"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Router } from "lucide-react";

export function RouterSelector({ routers }: { routers: any[] }) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("selected_router");
    if (saved) setSelected(saved);
    else if (routers.length > 0) setSelected(routers[0].no.toString());
  }, [routers]);

  const handleSelect = (val: string | null) => {
    if (!val) return;
    setSelected(val);
    localStorage.setItem("selected_router", val);
    document.cookie = `selected_router=${val}; path=/`;
    window.location.reload();
  };

  if (routers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Router size={16} className="text-slate-400" />
      <Select value={selected} onValueChange={handleSelect}>
        <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200">
          <SelectValue placeholder="Pilih Router" />
        </SelectTrigger>
        <SelectContent>
          {routers.map((r) => (
            <SelectItem key={r.no} value={r.no.toString()}>
              {r.routerName} ({r.routerIp})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
