import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-md border-none bg-white">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-end gap-2 px-6">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${Math.random() * 100}%` }} />
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-md border-none bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-800/50">
            <Skeleton className="h-6 w-32 bg-slate-700" />
          </CardHeader>
          <CardContent className="p-0 space-y-px bg-slate-800/20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-6 w-16 bg-slate-700" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
