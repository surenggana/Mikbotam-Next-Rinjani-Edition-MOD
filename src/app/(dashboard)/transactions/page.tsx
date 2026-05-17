import { Suspense } from "react";
import { getRecentTransactions } from "@/lib/actions/stats";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { History } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ExportTransactionsButton } from "@/components/dashboard/transactions/export-button";
import { TransactionTableClient } from "@/components/dashboard/transactions/transaction-table-client";
import { TableSearch } from "@/components/dashboard/table-search";

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
            <History className="text-emerald-600" size={24} />
            Transaction History
          </h1>
          <p className="text-sm text-slate-500">Riwayat lengkap aktivitas penjualan voucher dan topup saldo.</p>
        </div>
        <ExportTransactionsButton />
      </div>

      <Card className="shadow-md border-slate-100 overflow-hidden">
        <CardHeader className="pb-4 border-b bg-white">
          <div className="flex items-center gap-4">
             <TableSearch placeholder="Cari seller, voucher, atau keterangan..." defaultValue={search} />
          </div>
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

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 italic">
        <p>Tidak ada riwayat transaksi ditemukan.</p>
      </div>
    );
  }

  return (
    <>
      <TransactionTableClient transactions={transactions} />
      
      <PaginationControls 
        currentPage={page} 
        totalPages={totalPages} 
        totalCount={totalCount} 
      />
    </>
  );
}
