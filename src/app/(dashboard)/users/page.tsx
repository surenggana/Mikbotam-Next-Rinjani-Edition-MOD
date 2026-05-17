import { Suspense } from "react";
import { getSellers } from "@/lib/actions/users";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { UserTable } from "@/components/dashboard/users/user-table";
import { UserClientActions } from "@/components/dashboard/users/user-client-actions";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { TableSearch } from "@/components/dashboard/table-search";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");
  const search = resolvedParams.search || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500">Kelola reseller dan saldo mereka secara terpusat.</p>
        </div>
        <UserClientActions mode="page-header" />
      </div>

      <Card className="shadow-md border-slate-100 overflow-hidden">
        <CardHeader className="pb-4 border-b bg-white">
          <div className="flex items-center gap-4">
             <TableSearch placeholder="Cari nama atau ID user..." defaultValue={search} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense key={search + page} fallback={<TableSkeleton columns={6} rows={10} />}>
            <UserListContainer page={page} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function UserListContainer({ page, search }: { page: number; search: string }) {
  const data = await getSellers({ page, search });

  return (
    <>
      <UserTable users={data.users} />
      <PaginationControls 
        currentPage={page} 
        totalPages={data.totalPages} 
        totalCount={data.totalCount} 
      />
    </>
  );
}
