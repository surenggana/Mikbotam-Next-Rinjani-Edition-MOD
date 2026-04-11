import { getActiveHotspotUsers } from "@/lib/mikrotik/hotspot";
import { getActivePppUsers } from "@/lib/mikrotik/ppp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wifi, Network, Clock, ShieldCheck } from "lucide-react";

export default async function ActiveSessionsPage() {
  const [hotspotActive, pppActive] = await Promise.all([
    getActiveHotspotUsers().catch(() => []),
    getActivePppUsers().catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Active Sessions Monitoring</h1>
        <p className="text-slate-500">Data real-time dari router saat ini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hotspot Active */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-orange-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <Wifi size={20} />
              Hotspot Active ({hotspotActive.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotspotActive.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">Tidak ada user hotspot aktif.</TableCell>
                  </TableRow>
                ) : (
                  hotspotActive.map((user: any) => (
                    <TableRow key={user[".id"]}>
                      <TableCell className="font-medium">{user.user}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {user.address} <br/> 
                        <span className="text-[10px] text-slate-400">{user["mac-address"]}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-blue-600 flex items-center gap-1">
                        <Clock size={12} /> {user.uptime}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PPP Active */}
        <Card className="border-none shadow-sm">
          <CardHeader className="bg-blue-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <ShieldCheck size={20} />
              PPP Active ({pppActive.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Caller ID</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pppActive.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">Tidak ada user PPP aktif.</TableCell>
                  </TableRow>
                ) : (
                  pppActive.map((user: any) => (
                    <TableRow key={user[".id"]}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{user.service}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">{user["caller-id"]}</TableCell>
                      <TableCell className="text-xs font-mono text-green-600">{user.uptime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
