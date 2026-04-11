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
  Calendar,
  Zap,
  Clock,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { IncomeChart } from "@/components/dashboard/income-chart";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const [stats, txData, router] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions({ limit: 10 }),
    getRouterStats().catch(() => null)
  ]);

  // Ambil data chart 7 hari terakhir
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
      {/* Header Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ringkasan Sistem</h1>
        <p className="text-slate-500">Pantau performa hotspot dan transaksi reseller Anda secara real-time.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-white to-teal-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Voucher Terjual</CardTitle>
            <div className="p-2 bg-teal-100 rounded-lg text-teal-600 group-hover:scale-110 transition-transform">
              <Ticket size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.voucherCount}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-teal-500" /> 
              Akumulasi bulan ini
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Top Up</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{rupiah(stats.totalTopup)}</div>
            <p className="text-xs text-slate-400 mt-1">Setoran saldo reseller</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Pendapatan</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{rupiah(stats.totalRevenue)}</div>
            <p className="text-xs text-slate-400 mt-1">Total mutasi voucher</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Reseller Baru</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
              <UserPlus size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.newUserCount}</div>
            <p className="text-xs text-slate-400 mt-1">Bergabung bulan ini</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income Chart */}
        <Card className="lg:col-span-2 shadow-md border-none bg-white overflow-hidden">
          <CardHeader className="border-b bg-white/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Tren Pendapatan</CardTitle>
                <CardDescription>Performa penjualan 7 hari terakhir.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/transactions" className="gap-2">
                  Lihat Detail <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <IncomeChart data={chartData} />
          </CardContent>
        </Card>

        {/* Router Status */}
        <Card className="lg:col-span-1 shadow-2xl border-none bg-slate-900 text-white overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-800/50 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-400" />
                MikroTik Status
              </CardTitle>
              {router && (
                <div className="flex items-center gap-1.5 bg-teal-500/10 px-2 py-1 rounded-full border border-teal-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-tighter">Online</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col justify-center">
            {router ? (
              <div className="divide-y divide-slate-800">
                <div className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-sm text-slate-400 flex items-center gap-3"><Cpu size={18} className="text-slate-500"/> CPU Load</span>
                  <span className={cn("text-sm font-mono font-bold px-2 py-0.5 rounded", parseInt(router.cpuLoad) > 80 ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400")}>
                    {router.cpuLoad}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-sm text-slate-400 flex items-center gap-3"><Zap size={18} className="text-slate-500"/> Model</span>
                  <span className="text-sm font-medium font-mono text-slate-200">{router.board}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-sm text-slate-400 flex items-center gap-3"><Activity size={18} className="text-slate-500"/> RouterOS</span>
                  <span className="text-sm font-medium font-mono text-slate-200">v{router.version}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-sm text-slate-400 flex items-center gap-3"><Clock size={18} className="text-slate-500"/> Uptime</span>
                  <span className="text-sm font-medium font-mono text-slate-200">{router.uptime}</span>
                </div>
                <div className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-sm text-slate-400 flex items-center gap-3"><HardDrive size={18} className="text-slate-500"/> Free Memory</span>
                  <span className="text-sm font-medium font-mono text-slate-200">{Math.round(parseInt(router.freeMemory) / 1024 / 1024)} MB</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                  <Activity size={24} />
                </div>
                <p className="text-red-400 text-sm font-medium italic">
                  Gagal terhubung ke router.
                </p>
                <Button variant="link" className="text-teal-400 text-xs p-0 h-auto" asChild>
                  <Link href="/dashboard/settings">Periksa Konfigurasi API</Link>
                </Button>
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center font-mono">
            <span>DATA TERAKHIR DIPERBARUI</span>
            <span>{new Date().toLocaleTimeString('id-ID')}</span>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-3 shadow-md border-none bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="text-lg font-bold text-slate-800">10 Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="font-bold">Reseller</TableHead>
                  <TableHead className="font-bold">Keterangan</TableHead>
                  <TableHead className="font-bold text-right">Jumlah</TableHead>
                  <TableHead className="font-bold">Waktu</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-slate-400 italic">
                      Belum ada riwayat transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.no} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-semibold text-slate-700">{tx.sellerName}</TableCell>
                      <TableCell className="text-slate-600">
                        {tx.description === 'Success' ? (
                          <span className="flex items-center gap-2">
                            <Ticket size={14} className="text-teal-500" />
                            Voucher {tx.voucherExpiry}
                          </span>
                        ) : (
                          tx.description
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 text-right">
                        <span className={cn(tx.topUp ? "text-blue-600" : "text-slate-900")}>
                          {tx.topUp ? "+" : ""}{rupiah(parseFloat(tx.voucherBuy || tx.topUp || "0"))}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {tx.date} <span className="text-[10px] opacity-70">{tx.time}</span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          tx.description === 'Success' || tx.description === 'topup' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
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
