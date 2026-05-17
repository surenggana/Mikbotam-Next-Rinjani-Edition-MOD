"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TableSearchProps {
  placeholder?: string;
  defaultValue?: string;
}

export function TableSearch({ 
  placeholder = "Cari data...", 
  defaultValue = "" 
}: TableSearchProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <Input
        placeholder={placeholder}
        className="pl-10 bg-slate-50 border-none focus-visible:ring-emerald-500"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={defaultValue}
      />
    </div>
  );
}
