import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { topupReseller, getTopupRequests } from "@/lib/actions/transactions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TableSearch } from "@/components/dashboard/table-search";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default async function TopupRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");
  const search = resolvedParams.search || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="text-emerald-600" size={24} />
          Permintaan Topup
        </h1>
        <p className="text-sm text-slate-500">Kelola permintaan pengisian saldo dari reseller Anda.</p>
      </div>

      <Card className="shadow-md border-slate-100 overflow-hidden">
        <CardHeader className="pb-4 border-b bg-white">
          <div className="flex items-center gap-4">
             <TableSearch placeholder="Cari reseller, metode, atau status..." defaultValue={search} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense key={search + page} fallback={<TableSkeleton columns={6} rows={10} />}>
            <TopupListContainer page={page} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function TopupListContainer({ page, search }: { page: number; search: string }) {
  const { requests, totalPages, totalCount } = await getTopupRequests({ page, search });

  async function handleApprove(id: number) {
    "use server";
    const session = await auth();
    const adminId = parseInt(session?.user?.id || "0");
    
    const req = await prisma.topupRequest.findUnique({ where: { id } });
    if (!req || req.status !== 'Pending' || req.adminId !== adminId) return;

    await topupReseller(req.userId, req.amount);
    await prisma.topupRequest.update({
      where: { id },
      data: { status: 'Success' }
    });
    revalidatePath("/topup-requests");
  }

  async function handleReject(id: number) {
    "use server";
    const session = await auth();
    const adminId = parseInt(session?.user?.id || "0");

    const req = await prisma.topupRequest.findUnique({ where: { id } });
    if (!req || req.adminId !== adminId) return;

    await prisma.topupRequest.update({
      where: { id, status: 'Pending' },
      data: { status: 'Rejected' }
    });
    revalidatePath("/topup-requests");
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="font-bold py-4 px-6">Waktu</TableHead>
            <TableHead className="font-bold">Reseller</TableHead>
            <TableHead className="font-bold">Jumlah</TableHead>
            <TableHead className="font-bold">Metode</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="text-right font-bold py-4 px-6">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-slate-400 italic">
                Tidak ada permintaan topup ditemukan.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="text-xs text-slate-500 font-mono py-4 px-6">
                  {req.date} {req.time}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-slate-800">{req.sellerName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{req.userId}</div>
                </TableCell>
                <TableCell className="font-black text-emerald-600">
                  Rp {req.amount.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="text-xs font-bold text-slate-600 uppercase">
                  {req.method}
                </TableCell>
                <TableCell>
                  <Badge className={
                    req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    req.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-4 px-6">
                  {req.status === 'Pending' && (
                    <div className="flex justify-end gap-2">
                      <form action={handleApprove.bind(null, req.id)}>
                        <Button size="sm" variant="outline" className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest h-9 px-4">
                          <CheckCircle size={14} className="mr-1" /> Setujui
                        </Button>
                      </form>
                      <form action={handleReject.bind(null, req.id)}>
                        <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-[10px] tracking-widest h-9 px-4">
                          <XCircle size={14} className="mr-1" /> Tolak
                        </Button>
                      </form>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
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
