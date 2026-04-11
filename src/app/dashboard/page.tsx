import { getDashboardStats, getRecentTransactions } from "@/lib/actions/stats";
import { formatUptime } from "@/lib/formatters";
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
import IncomeChart from "@/components/dashboard/income-chart";
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
        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher Terjual</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Ticket size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.voucherCount}</div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> TERJUAL
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Bulan ini</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Top Up</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
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

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendapatan</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
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

        <Card className="shadow-sm border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reseller Baru</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
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
        <Card className="lg:col-span-2 shadow-sm border-slate-200/60">
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

        <Card className="lg:col-span-1 shadow-sm border-slate-200/60 flex flex-col">
          <CardHeader className="border-b border-slate-50 bg-slate-50/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  MikroTik Status
                </CardTitle>
                {router && (
                  <span className="text-[11px] font-bold text-slate-500 pl-6 tracking-tight">
                    {router.routerName}
                  </span>
                )}
              </div>
              {router && (
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Online</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {router ? (
              <div className="divide-y divide-slate-50">
                <div className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Cpu size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CPU Load</span>
                  </div>
                  <span className={cn("text-xs font-mono font-black", parseInt(router.cpuLoad) > 80 ? "text-red-500" : "text-emerald-600")}>
                    {router.cpuLoad}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Zap size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{router.board}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Activity size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RouterOS</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">v{router.version}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uptime</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{formatUptime(router.uptime)}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <HardDrive size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Memory</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{Math.round(parseInt(router.freeMemory) / 1024 / 1024)} MB</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 italic text-xs font-medium">
                Gagal memuat status router.
              </div>
            )}
          </CardContent>
          {router && (
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-[9px] text-slate-400 flex justify-between items-center font-mono font-bold px-4">
              <span>LAST SYNC</span>
              <span>{new Date().toLocaleTimeString('id-ID')}</span>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-slate-200/60 overflow-hidden">
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
                      <TableCell className={cn("font-black text-right py-4", tx.topUp ? "text-emerald-600" : "text-slate-900")}>
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
