"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { exportTransactionsToCSV } from "@/lib/actions/export";
import { toast } from "sonner";

export function ExportTransactionsButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const csv = await exportTransactionsToCSV();
      if (!csv) {
        toast.error("Tidak ada data untuk diekspor.");
        return;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data berhasil diekspor ke CSV!");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengekspor data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 transition-colors"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Export CSV
    </Button>
  );
}
