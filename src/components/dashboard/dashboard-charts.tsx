"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const IncomeChart = dynamic(() => import("./income-chart"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-xl animate-pulse"><Loader2 className="animate-spin text-slate-300" /></div>
});

const TrafficChart = dynamic(() => import("./traffic-chart").then(mod => mod.TrafficChart), { 
  ssr: false,
  loading: () => <div className="h-[200px] w-full flex items-center justify-center bg-slate-50 rounded-xl animate-pulse"><Loader2 className="animate-spin text-slate-300" /></div>
});

export function DashboardCharts({ chartData }: { chartData: any[] }) {
  return (
    <div className="space-y-8">
      <Card className="shadow-sm border-slate-200/60">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
          <div>
            <CardTitle>Tren Pendapatan</CardTitle>
            <CardDescription>Performa penjualan dalam 7 hari terakhir.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <Link href="/transactions" className="gap-2">
              Detail Transaksi <ArrowRight size={14} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-8">
          <IncomeChart data={chartData} />
        </CardContent>
      </Card>

      <TrafficChart interfaceName="ether1" />
    </div>
  );
}
