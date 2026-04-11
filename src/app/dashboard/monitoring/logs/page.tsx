import { getSystemLogs } from "@/lib/mikrotik/automation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Terminal, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SystemLogsPage() {
  const logs = await getSystemLogs().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Router System Logs</h1>
          <p className="text-sm text-slate-500">Memantau aktivitas real-time langsung dari MikroTik.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCcw size={16} />
          Refresh
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-slate-950 text-slate-300">
        <CardHeader className="border-b border-slate-800 bg-slate-900/50">
          <CardTitle className="text-sm font-mono flex items-center gap-2 text-teal-400">
            <Terminal size={18} />
            mikrotik@system_logs ~ % tail -n 50
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="bg-slate-900 sticky top-0 z-10">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 w-[120px]">Time</TableHead>
                <TableHead className="text-slate-400 w-[150px]">Topics</TableHead>
                <TableHead className="text-slate-400">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-slate-600">Gagal mengambil log atau log kosong.</TableCell>
                </TableRow>
              ) : (
                logs.map((log: any, idx: number) => (
                  <TableRow key={idx} className="border-slate-900 hover:bg-slate-900/50 transition-colors">
                    <TableCell className="text-teal-500/70">{log.time}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {log.topics.split(',').map((topic: string) => (
                          <span key={topic} className={`px-1 rounded ${
                            topic === 'error' ? 'bg-red-900/30 text-red-400' : 
                            topic === 'warning' ? 'bg-amber-900/30 text-amber-400' :
                            topic === 'critical' ? 'bg-rose-900 text-white font-bold' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={
                      log.message.toLowerCase().includes('fail') || log.message.toLowerCase().includes('error') 
                      ? 'text-red-400' : 'text-slate-300'
                    }>
                      {log.message}
                    </TableCell>
                  </TableRow>
                )).reverse() // Menampilkan yang terbaru di atas
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
