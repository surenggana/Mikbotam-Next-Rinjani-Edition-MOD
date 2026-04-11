import { getSystemLogs } from "@/lib/mikrotik/automation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Terminal, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function SystemLogsPage() {
  const logs = await getSystemLogs().catch(() => []);
  const sorted = [...logs].reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Logs</h1>
          <p className="text-sm font-medium text-slate-500">Aktivitas real-time langsung dari MikroTik.</p>
        </div>
        <form>
          <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold text-xs uppercase tracking-widest">
            <RefreshCcw size={14} />
            Refresh
          </Button>
        </form>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Terminal size={18} />
            </div>
            <div>
              <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">
                Router System Logs
              </CardTitle>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                mikrotik@system ~ % tail -n 50
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 w-[130px]">Time</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 w-[160px]">Topics</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-slate-400 italic text-xs font-medium">
                    Gagal mengambil log atau log kosong.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((log: any, idx: number) => (
                  <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-emerald-600 font-mono py-3 px-6 text-[11px]">
                      {log.time}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {log.topics.split(",").map((topic: string) => (
                          <span
                            key={topic}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                              topic.trim() === "error"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : topic.trim() === "warning"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : topic.trim() === "critical"
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            {topic.trim()}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-3 px-6 text-[11px]",
                        log.message.toLowerCase().includes("fail") ||
                        log.message.toLowerCase().includes("error")
                          ? "text-red-500 font-bold"
                          : "text-slate-600"
                      )}
                    >
                      {log.message}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
