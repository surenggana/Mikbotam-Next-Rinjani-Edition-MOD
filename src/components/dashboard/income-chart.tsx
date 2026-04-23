"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface IncomeChartProps {
  data: { date: string; amount: number }[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(value);
}

export default function IncomeChart({ data }: IncomeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatRupiah}
          tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          formatter={(value: any) => [formatRupiah(Number(value) || 0), "Pendapatan"]}
          contentStyle={{
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            fontSize: 11,
            fontWeight: 700,
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#incomeGradient)"
          dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#10b981" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
