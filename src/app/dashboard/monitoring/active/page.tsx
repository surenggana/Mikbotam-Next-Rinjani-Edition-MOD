import { Suspense } from "react";
import { getActiveHotspotUsers } from "@/lib/mikrotik/hotspot";
import { getActivePppUsers } from "@/lib/mikrotik/ppp";
import { getInterfaces } from "@/lib/mikrotik";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wifi, ShieldCheck, Activity, Network, Clock, Zap, ArrowDownUp } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";

export default async function ActiveSessionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Real-time Monitoring</h1>
        <p className="text-sm font-medium text-slate-500">Pantau sesi aktif dan lalu lintas interface secara langsung dari router.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Interfaces Monitoring */}
        <Card className="shadow-md border-slate-200/60 overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Network size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">System Interfaces</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status & Traffic Flow</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<TableSkeleton columns={5} rows={5} />}>
              <InterfacesContainer />
            </Suspense>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hotspot Active */}
          <Card className="shadow-md border-slate-200/60 overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
                  <Wifi size={20} />
                </div>
                <div>
                  <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">Hotspot Active</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Sesi Pengguna Wireless</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={<TableSkeleton columns={3} rows={5} />}>
                <HotspotActiveContainer />
              </Suspense>
            </CardContent>
          </Card>

          {/* PPP Active */}
          <Card className="shadow-md border-slate-200/60 overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">PPP Active</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Koneksi Terowongan / Tunnel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
                <PppActiveContainer />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function InterfacesContainer() {
  const interfaces = await getInterfaces().catch(() => []);

  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Name</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Type</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">TX / RX Rate</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Status</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">MAC Address</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {interfaces.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-xs font-medium italic">Gagal mengambil data interface.</TableCell>
          </TableRow>
        ) : (
          interfaces.map((iface: any) => (
            <TableRow key={iface[".id"]} className="hover:bg-slate-50/50 transition-colors group">
              <TableCell className="font-bold text-slate-700 py-4 px-6 flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  iface.running === "true" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                )} />
                {iface.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-slate-50">{iface.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-600">
                  <span className="flex items-center gap-1 text-blue-600"><ArrowDownUp size={10} /> {iface["tx-byte"] || "0"}</span>
                  <span className="text-slate-300">/</span>
                  <span className="flex items-center gap-1 text-emerald-600">{iface["rx-byte"] || "0"}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                  iface.running === "true" ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"
                )}>
                  {iface.running === "true" ? "Running" : "Inactive"}
                </span>
              </TableCell>
              <TableCell className="text-[10px] font-mono text-slate-400 px-6">{iface["mac-address"] || "-"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

async function HotspotActiveContainer() {
  const hotspotActive = await getActiveHotspotUsers().catch(() => []);

  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">User</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">IP Address</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Uptime</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {hotspotActive.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs font-medium italic">Tidak ada user aktif.</TableCell>
          </TableRow>
        ) : (
          hotspotActive.map((user: any) => (
            <TableRow key={user[".id"]} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-bold text-slate-700 py-4 px-6">{user.user}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-slate-600">{user.address}</span>
                  <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{user["mac-address"]}</span>
                </div>
              </TableCell>
              <TableCell className="px-6">
                <span className="flex items-center gap-1.5 text-xs font-mono font-black text-[#0ea5e9]">
                  <Clock size={12} /> {user.uptime}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

async function PppActiveContainer() {
  const pppActive = await getActivePppUsers().catch(() => []);

  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Name</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Service</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Uptime</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pppActive.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs font-medium italic">Tidak ada user aktif.</TableCell>
          </TableRow>
        ) : (
          pppActive.map((user: any) => (
            <TableRow key={user[".id"]} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-bold text-slate-700 py-4 px-6">{user.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-blue-50 text-blue-600 border-blue-100">{user.service}</Badge>
              </TableCell>
              <TableCell className="px-6">
                <span className="flex items-center gap-1.5 text-xs font-mono font-black text-emerald-600">
                  <Clock size={12} /> {user.uptime}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
