import { prisma } from "@/lib/prisma";
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
import { Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: [
      { date: 'desc' },
      { time: 'desc' }
    ],
  });

  const rupiah = (amount: string | null) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(parseFloat(amount || "0"));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Cari seller, voucher, atau keterangan..." className="pl-10 bg-white" />
             </div>
             <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  Filter
                </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px]">Waktu & Tanggal</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Saldo Akhir</TableHead>
                <TableHead>Router</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.no} className="hover:bg-slate-50/50">
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {tx.date} <br/> {tx.time}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {tx.sellerName}
                    <div className="text-[10px] text-slate-400 font-mono">{tx.userId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {tx.description === 'Success' ? `Voucher ${tx.voucherExpiry}` : tx.description}
                    </div>
                    {tx.voucherUsername && (
                      <div className="text-[10px] bg-slate-100 px-1 py-0.5 rounded inline-block mt-1 font-mono">
                        User: {tx.voucherUsername}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={tx.topUp ? "text-blue-600 font-bold" : "text-slate-700"}>
                    {rupiah(tx.voucherBuy || tx.topUp)}
                  </TableCell>
                  <TableCell className="text-slate-500 italic">
                    {rupiah(tx.balanceEnd)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {tx.routerName || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.description === 'Success' || tx.description === 'topup' ? 'default' : 'outline'} 
                      className={tx.description === 'Success' || tx.description === 'topup' ? "bg-green-500 hover:bg-green-600" : "text-amber-600 border-amber-200"}>
                      {tx.description === 'Success' || tx.description === 'topup' ? 'Success' : 'Pending'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
