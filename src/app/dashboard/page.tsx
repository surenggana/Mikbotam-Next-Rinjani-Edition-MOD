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
  Clock
} from "lucide-react";
import { IncomeChart } from "@/components/dashboard/income-chart";

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
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Voucher (Bulan Ini)</CardTitle>
            <Ticket className="h-5 w-5 text-teal-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.voucherCount} Voucher</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Top Up Debit (Bulan Ini)</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{rupiah(stats.totalTopup)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Mutasi Voucher (Bulan Ini)</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{rupiah(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">User Baru (Bulan Ini)</CardTitle>
            <UserPlus className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">+{stats.newUserCount} User</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income Chart */}
        <Card className="lg:col-span-2 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-teal-600" size={20} />
              Tren Pendapatan 7 Hari Terakhir
            </CardTitle>
            <CardDescription>Ringkasan akumulasi harian dari tabel report.</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeChart data={chartData} />
          </CardContent>
        </Card>

        {/* Router Status */}
        <Card className="lg:col-span-1 shadow-xl border-none bg-slate-900 text-white overflow-hidden">
          <CardHeader className="bg-slate-800/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-400" />
              Router OS Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {router ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400 flex items-center gap-2"><Cpu size={16}/> CPU Load</span>
                  <span className={cn("text-sm font-bold", parseInt(router.cpuLoad) > 80 ? "text-red-400" : "text-teal-400")}>
                    {router.cpuLoad}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400 flex items-center gap-2"><Zap size={16}/> Model</span>
                  <span className="text-sm font-medium">{router.board}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400 flex items-center gap-2"><Activity size={16}/> Router OS</span>
                  <span className="text-sm font-medium text-slate-200">v{router.version}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400 flex items-center gap-2"><Clock size={16}/> Uptime</span>
                  <span className="text-sm font-medium text-slate-200">{router.uptime}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400 flex items-center gap-2"><HardDrive size={16}/> Memory Free</span>
                  <span className="text-sm font-medium text-slate-200">{Math.round(parseInt(router.freeMemory) / 1024 / 1024)} MB</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400 flex items-center gap-2"><Calendar size={16}/> Tanggal</span>
                  <span className="text-sm font-medium text-slate-200">{new Date().toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-red-400 text-sm italic">
                Gagal terhubung ke router. Periksa konfigurasi API.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-3 shadow-sm border-none bg-white">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold">10 Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.no}>
                    <TableCell className="font-medium text-slate-700">{tx.sellerName}</TableCell>
                    <TableCell className="text-slate-600">{tx.description === 'Success' ? `Voucher ${tx.voucherExpiry}` : tx.description}</TableCell>
                    <TableCell className="font-bold text-slate-900">{rupiah(parseFloat(tx.voucherBuy || tx.topUp || "0"))}</TableCell>
                    <TableCell className="text-xs text-slate-400">{tx.date} {tx.time}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        tx.description === 'Success' || tx.description === 'topup' 
                          ? "bg-green-100 text-green-700" 
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {tx.description === 'Success' || tx.description === 'topup' ? 'Success' : 'Pending'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
