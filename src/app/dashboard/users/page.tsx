import { Suspense } from "react";
import { getSellers } from "@/lib/actions/users";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { UserTable } from "@/components/dashboard/users/user-table";
import { UserClientActions } from "@/components/dashboard/users/user-client-actions";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search || "";

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
             <form className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  name="search" 
                  placeholder="Cari nama atau ID user..." 
                  className="pl-10 bg-slate-50 border-none focus-visible:ring-teal-500" 
                  defaultValue={search}
                />
                {/* Submit on Enter is default for single input forms */}
             </form>
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
