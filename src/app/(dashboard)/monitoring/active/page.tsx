"use client";

import React, { useState, useEffect } from "react";
import { getLiveMonitoringData } from "@/lib/actions/monitoring";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, ShieldCheck, Network, Clock, Maximize2, Minimize2, 
  Users, Activity, ArrowDownUp, RefreshCcw, Loader2, Hourglass
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatBytes, formatUptime } from "@/lib/formatters";

// Helper to calculate remaining time from MikroTik format strings (e.g. 1h30m)
function calculateRemaining(limit: string, used: string) {
  if (!limit || limit === "0" || limit === "0s") return "Unlimited";
  
  const toSeconds = (str: string) => {
    let total = 0;
    const weeks = str.match(/(\d+)w/);
    const days = str.match(/(\d+)d/);
    const hours = str.match(/(\d+)h/);
    const mins = str.match(/(\d+)m/);
    const secs = str.match(/(\d+)s/);
    
    // Also handle HH:MM:SS format
    const colonParts = str.split(":");
    if (colonParts.length === 3) {
      return parseInt(colonParts[0]) * 3600 + parseInt(colonParts[1]) * 60 + parseInt(colonParts[2]);
    }

    if (weeks) total += parseInt(weeks[1]) * 604800;
    if (days) total += parseInt(days[1]) * 86400;
    if (hours) total += parseInt(hours[1]) * 3600;
    if (mins) total += parseInt(mins[1]) * 60;
    if (secs) total += parseInt(secs[1]);
    return total;
  };

  const limitSec = toSeconds(limit);
  const usedSec = toSeconds(used);
  const remainSec = Math.max(0, limitSec - usedSec);

  if (remainSec === 0) return "Expired";
  
  const h = Math.floor(remainSec / 3600);
  const m = Math.floor((remainSec % 3600) / 60);
  return `${h}j ${m}m`;
}

export default function ActiveSessionsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [data, setData] = useState<{
    hotspot: any[];
    ppp: any[];
    interfaces: any[];
    loading: boolean;
  }>({
    hotspot: [],
    ppp: [],
    interfaces: [],
    loading: true
  });

  const fetchData = async () => {
    const res = await getLiveMonitoringData();
    setData({ 
      hotspot: res.hotspot, 
      ppp: res.ppp, 
      interfaces: res.interfaces, 
      loading: false 
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (data.loading) {
    return (
      <div className="space-y-8 p-4">
        <TableSkeleton columns={5} rows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Monitoring</h1>
          <p className="text-sm font-medium text-slate-500">Real-time status synchronization from your MikroTik core engine.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-4 py-2 rounded-2xl border-slate-200 text-slate-600 font-bold gap-2">
            <Users size={14} className="text-orange-500" /> {data.hotspot.length} Hotspot
          </Badge>
          <Badge variant="outline" className="bg-white px-4 py-2 rounded-2xl border-slate-200 text-slate-600 font-bold gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> {data.ppp.length} PPPoE
          </Badge>
          <Button variant="outline" size="icon" onClick={fetchData} className="rounded-xl border-slate-200 text-slate-400 hover:text-emerald-600">
            <RefreshCcw size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 relative">
        {(!expandedSection || expandedSection === 'interfaces') && (
          <MonitoringCard
            title="System Interfaces"
            description="Hardware status & traffic throughput"
            icon={<Network size={20} />}
            iconBg="bg-indigo-50 text-indigo-600 border-indigo-100"
            isExpanded={expandedSection === 'interfaces'}
            onExpand={() => toggleExpand('interfaces')}
          >
            <InterfacesTable interfaces={data.interfaces} />
          </MonitoringCard>
        )}

        <div className={cn("grid grid-cols-1 gap-8", expandedSection ? "lg:grid-cols-1" : "lg:grid-cols-2")}>
          {(!expandedSection || expandedSection === 'hotspot') && (
            <MonitoringCard
              title="Hotspot Active Sessions"
              description="Connected users and voucher remaining time"
              icon={<Wifi size={20} />}
              iconBg="bg-orange-50 text-orange-600 border-orange-100"
              isExpanded={expandedSection === 'hotspot'}
              onExpand={() => toggleExpand('hotspot')}
              badge={`${data.hotspot.length} Users`}
            >
              <HotspotTable users={data.hotspot} />
            </MonitoringCard>
          )}

          {(!expandedSection || expandedSection === 'ppp') && (
            <MonitoringCard
              title="PPPoE Active Sessions"
              description="Tunnel connections performance"
              icon={<ShieldCheck size={20} />}
              iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              isExpanded={expandedSection === 'ppp'}
              onExpand={() => toggleExpand('ppp')}
              badge={`${data.ppp.length} Active`}
            >
              <PppTable users={data.ppp} />
            </MonitoringCard>
          )}
        </div>
      </div>
    </div>
  );
}

function MonitoringCard({ title, description, icon, iconBg, children, isExpanded, onExpand, badge }: any) {
  return (
    <Card className={cn("shadow-md border-slate-200/60 overflow-hidden bg-white transition-all duration-500", isExpanded ? "ring-2 ring-emerald-500 ring-offset-4" : "")}>
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl border", iconBg)}>{icon}</div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">{title}</CardTitle>
                {badge && <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-tighter">{badge}</Badge>}
              </div>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onExpand} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto max-h-[600px] custom-scrollbar">{children}</CardContent>
    </Card>
  );
}

function InterfacesTable({ interfaces }: any) {
  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Name</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Traffic TX/RX</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 text-right">MAC Address</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {interfaces.map((iface: any) => (
          <TableRow key={iface[".id"]} className="hover:bg-slate-50/50 border-slate-50">
            <TableCell className="font-bold text-slate-700 py-4 px-6 flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", iface.running === "true" ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              {iface.name}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-emerald-600">
                <span>↑ {formatBytes(iface["tx-byte"])}</span>
                <span>↓ {formatBytes(iface["rx-byte"])}</span>
              </div>
            </TableCell>
            <TableCell className="text-[10px] font-mono text-slate-400 px-6 text-right">{iface["mac-address"] || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HotspotTable({ users }: any) {
  if (users.length === 0) return <EmptyState message="Tidak ada user aktif." />;
  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">User</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Uptime</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Remaining / Limit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user: any) => {
          const remain = calculateRemaining(user["limit-uptime"], user.uptime);
          return (
            <TableRow key={user[".id"]} className="hover:bg-slate-50/50 border-slate-50">
              <TableCell className="py-4 px-6">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{user.user}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{user.address}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono font-bold text-slate-600">{formatUptime(user.uptime)}</span>
              </TableCell>
              <TableCell className="px-6 text-right">
                <div className="flex flex-col items-end">
                  <Badge className={cn(
                    "text-[10px] font-black uppercase px-2 py-0.5",
                    remain === "Unlimited" ? "bg-slate-100 text-slate-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {remain}
                  </Badge>
                  <span className="text-[9px] text-slate-400 font-mono mt-1">Limit: {user["limit-uptime"] || "∞"}</span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function PppTable({ users }: any) {
  if (users.length === 0) return <EmptyState message="Tidak ada koneksi PPPoE aktif." />;
  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Account</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Session Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user: any) => (
          <TableRow key={user[".id"]} className="hover:bg-slate-50/50 border-slate-50">
            <TableCell className="py-4 px-6">
              <span className="font-bold text-slate-800">{user.name}</span>
            </TableCell>
            <TableCell className="px-6 text-right font-mono font-bold text-emerald-600">{formatUptime(user.uptime)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
      <Users size={24} className="opacity-20" />
      <p className="text-[10px] font-bold uppercase tracking-widest">{message}</p>
    </div>
  );
}
