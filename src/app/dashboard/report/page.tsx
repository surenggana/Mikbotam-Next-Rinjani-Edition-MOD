"use client";

import { useState, useEffect, useTransition } from "react";
import { getDailyReport, getMonthlyReport } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { BarChart3, Calendar, TrendingUp, Users, RefreshCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const today = new Date().toISOString().split("T")[0];
const thisMonth = new Date().toISOString().slice(0, 7);

export default function ReportPage() {
  const [mode, setMode] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = () => {
    setLoading(true);
    startTransition(async () => {
      if (mode === "daily") {
        const res = await getDailyReport(date);
        setData(res);
      } else {
        const res = await getMonthlyReport(month);
        setData(res);
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [mode, date, month]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Penjualan</h1>
        <p className="text-slate-500">Pantau performa penjualan harian dan bulanan seluruh reseller.</p>
      </div>

      {/* Mode & Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setMode("daily")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              mode === "daily"
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setMode("monthly")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              mode === "monthly"
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Bulanan
          </button>
        </div>

        {mode === "daily" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        ) : (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        )}

        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isPending}
        >
          <RefreshCcw size={14} className={isPending ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Omset</p>
                <p className="text-xl font-black text-slate-900">{rupiah(data.totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {mode === "daily" ? "Voucher Terjual" : "Total Transaksi"}
                </p>
                <p className="text-xl font-black text-slate-900">{data.totalCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reseller Aktif</p>
                <p className="text-xl font-black text-slate-900">
                  {data.grouped?.length ?? data.bySeller?.length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-Seller Breakdown */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Users size={18} />
            </div>
            <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">
              Penjualan per Reseller
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reseller</TableHead>
                  <TableHead className="text-center">Jumlah Transaksi</TableHead>
                  <TableHead className="text-right">Total Omset</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.grouped ?? data?.bySeller ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">
                      Tidak ada data penjualan untuk periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  (data?.grouped ?? data?.bySeller ?? []).map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-800">{row.userName}</p>
                          <p className="text-xs text-slate-400">{row.userId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{row.count} transaksi</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {rupiah(row.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly: Per-Date Breakdown */}
      {mode === "monthly" && data?.byDate && (
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Calendar size={18} />
              </div>
              <CardTitle className="text-base font-black uppercase tracking-wider text-slate-800">
                Rincian per Tanggal
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-center">Transaksi</TableHead>
                    <TableHead className="text-right">Omset</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byDate.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-slate-400 italic">
                        Tidak ada data untuk bulan ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.byDate.map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-slate-700">{row.date}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{row.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {rupiah(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
