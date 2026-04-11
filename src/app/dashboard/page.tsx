import { getDashboardStats, getRecentTransactions } from "@/lib/actions/stats";
import { getRouterStats } from "@/lib/mikrotik";
import { prisma } from "@/lib/prisma";
import { subDays, format as formatDate } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Ticket, 
  ArrowUpCircle, 
  TrendingUp, 
  UserPlus,
  Cpu,
  HardDrive,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Wifi
} from "lucide-react";
import { IncomeChart } from "@/components/dashboard/income-chart";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SystemIntegrityBanner } from "@/components/layout/system-info";

export default async function DashboardPage() {
  const [stats, txData, router] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions({ limit: 10 }),
    getRouterStats().catch(() => null)
  ]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return formatDate(d, "yyyy-MM-dd");
  }).reverse();

  const chartDataRaw = await prisma.report.findMany({
    where: {
      date: { in: last7Days }
    },
    select: {
      date: true,
      revenue: true
    }
  });

  const chartData = last7Days.map(date => {
    const dayRecords = chartDataRaw.filter(d => d.date === date);
    const totalDayRevenue = dayRecords.reduce((acc, curr) => acc + parseFloat(curr.revenue || "0"), 0);
    return {
      date: formatDate(new Date(date), "dd MMM"),
      amount: totalDayRevenue
    };
  });

  const transactions = txData.transactions;

  const rupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <SystemIntegrityBanner />

      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ringkasan Sistem</h1>
        <p className="text-sm font-medium text-slate-500">Pantau performa hotspot dan transaksi reseller Anda secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher Terjual</CardTitle>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
              <Ticket size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.voucherCount}</div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> TERJUAL
              </span>
              <span className="text-[10px] font-bold text-slate-400">Bulan ini</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Top Up</CardTitle>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
              <ArrowUpCircle size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{rupiah(stats.totalTopup)}</div>
            <div className="mt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setoran Reseller</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendapatan</CardTitle>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
              <Zap size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{rupiah(stats.totalRevenue)}</div>
            <div className="mt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mutasi Saldo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reseller Baru</CardTitle>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
              <UserPlus size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.newUserCount}</div>
            <div className="mt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terdaftar Aktif</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
            <div>
              <CardTitle>Tren Pendapatan</CardTitle>
              <CardDescription>Performa penjualan dalam 7 hari terakhir.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/dashboard/transactions" className="gap-2">
                Detail Transaksi <ArrowRight size={14} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-8">
            <IncomeChart data={chartData} />
          </CardContent>
        </Card>

        {/* Upgraded MikroTik Status Card */}
        <Card className="lg:col-span-1 shadow-md flex flex-col bg-slate-950 text-white overflow-hidden relative group border-none">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0ea5e9]/10 blur-[80px] group-hover:bg-[#0ea5e9]/20 transition-all duration-700" />
          
          <CardHeader className="border-b border-white/5 bg-white/5 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0ea5e9]/10 rounded-xl border border-[#0ea5e9]/20">
                  <Activity className="h-4 w-4 text-[#0ea5e9] animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-white/90">MikroTik Engine</CardTitle>
                  <CardDescription className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Live Monitoring</CardDescription>
                </div>
              </div>
              {router && (
                <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Active</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col gap-6 relative z-10">
            {router ? (
              <>
                {/* Large Center Icon & CPU Metric */}
                <div className="flex flex-col items-center justify-center py-2 gap-4">
                  <div className="relative group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-[#0ea5e9]/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group-hover:border-[#0ea5e9]/50 transition-all duration-500">
                       {/* Subtle tech pattern inside icon box */}
                       <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
                       <Wifi size={40} className="text-[#0ea5e9] relative z-10" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black tracking-tighter text-white">{router.cpuLoad}</span>
                      <span className="text-sm font-bold text-[#0ea5e9]">%</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">CPU Utilization</p>
                  </div>
                </div>

                {/* Metrics with Progress Bars */}
                <div className="space-y-5">
                  {/* CPU Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={12} className="text-[#0ea5e9]" /> Processor
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#0ea5e9]">{router.cpuLoad}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          parseInt(router.cpuLoad) > 80 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-[#0ea5e9] shadow-[0_0_8px_rgba(14,165,233,0.4)]"
                        )}
                        style={{ width: `${router.cpuLoad}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM Usage */}
                  {(() => {
                    const freeMem = parseInt(router.freeMemory);
                    const totalMem = 128 * 1024 * 1024; // Fallback estimate
                    const usedPercent = Math.min(Math.round(((totalMem - freeMem) / totalMem) * 100), 100);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <HardDrive size={12} className="text-teal-400" /> Memory
                          </span>
                          <span className="text-[10px] font-mono font-bold text-teal-400">{Math.round(freeMem / 1024 / 1024)}MB Free</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                          <div 
                            className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Details Footer Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-tighter">OS Version</span>
                    <span className="text-[11px] font-mono font-bold text-slate-200 truncate">v{router.version}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-tighter">Hardware</span>
                    <span className="text-[11px] font-mono font-bold text-slate-200 truncate">{router.board}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0ea5e9]/5 border border-[#0ea5e9]/10 col-span-2 flex items-center justify-between">
                    <span className="text-[8px] font-black text-[#0ea5e9] uppercase tracking-widest">Uptime</span>
                    <span className="text-[11px] font-mono font-black text-[#0ea5e9]">{router.uptime}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 animate-bounce">
                  <Zap size={32} className="text-red-500" />
                </div>
                <div>
                  <p className="text-red-400 text-sm font-black uppercase tracking-widest mb-1">Link Broken</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Connection Failed</p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl text-[10px] uppercase font-black" asChild>
                  <Link href="/dashboard/settings">Troubleshoot</Link>
                </Button>
              </div>
            )}
          </CardContent>
          
          <div className="p-4 bg-black/40 border-t border-white/5 text-[8px] font-bold text-slate-600 flex justify-between items-center font-mono relative z-10 tracking-widest">
            <span className="flex items-center gap-1.5 uppercase"><Clock size={10}/> Synced</span>
            <span className="text-[#0ea5e9]/50">{new Date().toLocaleTimeString('id-ID')}</span>
          </div>
        </Card>

        <Card className="lg:col-span-3 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle>10 Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Reseller</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Keterangan</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right">Jumlah</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4">Waktu</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 py-4 px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium italic">
                      Belum ada riwayat transaksi hari ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.no} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700 py-4 px-6">{tx.sellerName}</TableCell>
                      <TableCell className="text-slate-500 text-sm py-4">{tx.description}</TableCell>
                      <TableCell className={cn("font-black text-right py-4", tx.topUp ? "text-blue-600" : "text-slate-900")}>
                        {tx.topUp ? "+" : ""}{rupiah(parseFloat(tx.voucherBuy || tx.topUp || "0"))}
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-400 font-mono py-4">{tx.date} {tx.time}</TableCell>
                      <TableCell className="py-4 px-6">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          tx.description === 'Success' || tx.description === 'topup' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {tx.description === 'Success' || tx.description === 'topup' ? 'Success' : 'Process'}
                        </span>
                      </TableCell>
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
