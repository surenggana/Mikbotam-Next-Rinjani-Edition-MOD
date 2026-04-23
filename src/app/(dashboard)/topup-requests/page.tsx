import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { topupReseller } from "@/lib/actions/transactions";
import { auth } from "@/auth";

export default async function TopupRequestsPage() {
  const session = await auth();
  const adminId = parseInt(session?.user?.id || "0");

  const requests = await prisma.topupRequest.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="text-emerald-600" size={24} />
          Permintaan Topup
        </h1>
        <p className="text-sm text-slate-500">Kelola permintaan pengisian saldo dari reseller Anda.</p>
      </div>

      <Card className="shadow-md border-slate-100 overflow-hidden">
        <CardContent className="p-0">
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
                    Belum ada permintaan topup.
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
                            <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-100 hover:bg-emerald-50">
                              <CheckCircle size={14} className="mr-1" /> Setujui
                            </Button>
                          </form>
                          <form action={handleReject.bind(null, req.id)}>
                            <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-100 hover:bg-red-50">
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
        </CardContent>
      </Card>
    </div>
  );
}
