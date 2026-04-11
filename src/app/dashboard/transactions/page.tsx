import { Suspense } from "react";
import { getRecentTransactions } from "@/lib/actions/stats";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, History, Ticket, ArrowUpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");
  const search = resolvedParams.search || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="text-teal-600" size={24} />
            Transaction History
          </h1>
          <p className="text-sm text-slate-500">Riwayat lengkap aktivitas penjualan voucher dan topup saldo.</p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 transition-colors">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <Card className="shadow-md border-slate-100 overflow-hidden">
        <CardHeader className="pb-4 border-b bg-white">
          <form className="flex flex-col md:flex-row md:items-center gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  name="search"
                  placeholder="Cari seller, voucher, atau keterangan..." 
                  className="pl-10 bg-slate-50 border-none focus-visible:ring-teal-500" 
                  defaultValue={search}
                />
             </div>
             <Button type="submit" variant="secondary" size="sm" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200">
               <Filter size={14} />
               Terapkan Filter
             </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense key={search + page} fallback={<TableSkeleton columns={7} rows={15} />}>
            <TransactionListContainer page={page} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function TransactionListContainer({ page, search }: { page: number; search: string }) {
  const { transactions, totalPages, totalCount } = await getRecentTransactions({
    page,
    limit: 20,
    search,
  });

  const rupiah = (amount: string | null) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(parseFloat(amount || "0"));
  };

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 italic">
        <p>Tidak ada riwayat transaksi ditemukan.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px] font-bold">Waktu & Tanggal</TableHead>
            <TableHead className="font-bold">Reseller</TableHead>
            <TableHead className="font-bold">Aktivitas</TableHead>
            <TableHead className="font-bold text-right">Nominal</TableHead>
            <TableHead className="font-bold text-right">Saldo Akhir</TableHead>
            <TableHead className="font-bold">Router</TableHead>
            <TableHead className="font-bold text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.no} className="hover:bg-slate-50/30 transition-colors group">
              <TableCell className="text-xs text-slate-500 font-mono">
                <div className="font-bold text-slate-700">{tx.date}</div>
                <div className="opacity-70">{tx.time}</div>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
                  {tx.sellerName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{tx.userId}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium flex items-center gap-2">
                  {tx.description === 'Success' ? (
                    <>
                      <Ticket size={14} className="text-teal-500" />
                      <span>Voucher {tx.voucherExpiry}</span>
                    </>
                  ) : tx.topUp ? (
                    <>
                      <ArrowUpCircle size={14} className="text-blue-500" />
                      <span>Isi Saldo (Topup)</span>
                    </>
                  ) : (
                    tx.description
                  )}
                </div>
                {tx.voucherUsername && (
                  <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-1 font-mono">
                    ID: {tx.voucherUsername}
                  </div>
                )}
              </TableCell>
              <TableCell className={cn("text-right font-bold", tx.topUp ? "text-blue-600" : "text-slate-900")}>
                {tx.topUp ? "+" : ""}{rupiah(tx.voucherBuy || tx.topUp)}
              </TableCell>
              <TableCell className="text-right text-slate-500 font-mono text-xs italic">
                {rupiah(tx.balanceEnd)}
              </TableCell>
              <TableCell className="text-xs font-medium text-slate-600">
                {tx.routerName || '-'}
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter rounded-md border shadow-none",
                    tx.description === 'Success' || tx.description === 'topup' 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  )}
                >
                  {tx.description === 'Success' || tx.description === 'topup' ? 'Success' : 'Pending'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <PaginationControls 
        currentPage={page} 
        totalPages={totalPages} 
        totalCount={totalCount} 
      />
    </>
  );
}
