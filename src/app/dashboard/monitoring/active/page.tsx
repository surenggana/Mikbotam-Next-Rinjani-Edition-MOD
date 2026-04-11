"use client";

import React, { useState, useEffect } from "react";
import { getLiveMonitoringData } from "@/lib/actions/monitoring";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, ShieldCheck, Network, Clock, Maximize2, Minimize2, 
  Users, Activity, ArrowDownUp, RefreshCcw, Loader2 
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatBytes, formatUptime } from "@/lib/formatters";

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
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-slate-100 animate-pulse rounded-md" />
        </div>
        <TableSkeleton columns={5} rows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header with Stats Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Monitoring</h1>
          <p className="text-sm font-medium text-slate-500">Real-time status synchronization from your MikroTik core engine.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <Users size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase leading-none">Hotspot</span>
              <span className="text-sm font-black text-slate-900 leading-tight">{data.hotspot.length} Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
              <ShieldCheck size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase leading-none">PPPoE</span>
              <span className="text-sm font-black text-slate-900 leading-tight">{data.ppp.length} Active</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchData}
            className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-teal-600 transition-all"
          >
            <RefreshCcw size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 relative">
        {/* Interface Section */}
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

        <div className={cn(
          "grid grid-cols-1 gap-8",
          expandedSection ? "lg:grid-cols-1" : "lg:grid-cols-2"
        )}>
          {/* Hotspot Section */}
          {(!expandedSection || expandedSection === 'hotspot') && (
            <MonitoringCard
              title="Hotspot Active Sessions"
              description={`${data.hotspot.length} users currently connected via wireless`}
              icon={<Wifi size={20} />}
              iconBg="bg-orange-50 text-orange-600 border-orange-100"
              isExpanded={expandedSection === 'hotspot'}
              onExpand={() => toggleExpand('hotspot')}
              badge={`${data.hotspot.length} Users`}
            >
              <HotspotTable users={data.hotspot} />
            </MonitoringCard>
          )}

          {/* PPP Section */}
          {(!expandedSection || expandedSection === 'ppp') && (
            <MonitoringCard
              title="PPPoE Active Sessions"
              description={`${data.ppp.length} tunnel connections active`}
              icon={<ShieldCheck size={20} />}
              iconBg="bg-blue-50 text-blue-600 border-blue-100"
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

function MonitoringCard({ 
  title, 
  description, 
  icon, 
  iconBg, 
  children, 
  isExpanded, 
  onExpand,
  badge
}: any) {
  return (
    <Card className={cn(
      "shadow-md border-slate-200/60 overflow-hidden bg-white transition-all duration-500",
      isExpanded ? "ring-2 ring-teal-500 ring-offset-4" : ""
    )}>
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl border", iconBg)}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">{title}</CardTitle>
                {badge && (
                  <Badge className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-tighter hover:bg-slate-800">
                    {badge}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onExpand}
            className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto max-h-[600px] custom-scrollbar">
        {children}
      </CardContent>
    </Card>
  );
}

function InterfacesTable({ interfaces }: any) {
  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Name</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Type</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Traffic TX/RX</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Status</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 text-right">MAC Address</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {interfaces.map((iface: any) => (
          <TableRow key={iface[".id"]} className="hover:bg-slate-50/50 transition-colors group border-slate-50">
            <TableCell className="font-bold text-slate-700 py-4 px-6 flex items-center gap-3">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full shadow-sm",
                iface.running === "true" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
              )} />
              {iface.name}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-slate-50 border-slate-200">{iface.type}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-4 text-[11px] font-mono font-black">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[8px] uppercase">Upload</span>
                  <span className="text-blue-600 flex items-center gap-1"><ArrowDownUp size={10} className="rotate-180" /> {formatBytes(iface["tx-byte"])}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[8px] uppercase">Download</span>
                  <span className="text-emerald-600 flex items-center gap-1"><ArrowDownUp size={10} /> {formatBytes(iface["rx-byte"])}</span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-1 rounded-lg border",
                iface.running === "true" ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-400 bg-slate-100 border-slate-200"
              )}>
                {iface.running === "true" ? "Online" : "Down"}
              </span>
            </TableCell>
            <TableCell className="text-[10px] font-mono text-slate-400 px-6 text-right">{iface["mac-address"] || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HotspotTable({ users }: any) {
  if (users.length === 0) return <EmptyState message="Tidak ada user hotspot aktif." />;
  return (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Username</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Network Info</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Uptime</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user: any) => (
          <TableRow key={user[".id"]} className="hover:bg-slate-50/50 border-slate-50">
            <TableCell className="font-bold text-slate-700 py-4 px-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">
                  {user.user.substring(0, 2).toUpperCase()}
                </div>
                {user.user}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-slate-600">{user.address}</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{user["mac-address"]}</span>
              </div>
            </TableCell>
            <TableCell className="px-6 text-right">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-sky-50 text-[#0ea5e9] text-xs font-mono font-black border border-sky-100">
                <Clock size={12} /> {formatUptime(user.uptime)}
              </span>
            </TableCell>
          </TableRow>
        ))}
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
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Service Type</TableHead>
          <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6 text-right">Session Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user: any) => (
          <TableRow key={user[".id"]} className="hover:bg-slate-50/50 border-slate-50">
            <TableCell className="font-bold text-slate-700 py-4 px-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                  PP
                </div>
                {user.name}
              </div>
            </TableCell>
            <TableCell>
              <Badge className="bg-blue-600 text-white font-black text-[9px] uppercase tracking-tighter px-2">
                {user.service}
              </Badge>
            </TableCell>
            <TableCell className="px-6 text-right">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-mono font-black border border-emerald-100">
                <Activity size={12} /> {formatUptime(user.uptime)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="p-4 bg-slate-50 rounded-full border border-slate-100">
        <Users size={32} className="opacity-20" />
      </div>
      <p className="text-xs font-medium italic">{message}</p>
    </div>
  );
}
