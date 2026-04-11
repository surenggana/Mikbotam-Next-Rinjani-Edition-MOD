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

export function IncomeChart({ data }: { data: any[] }) {
  const rupiah = (value: number) => 
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  // Custom Tooltip Design
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 shadow-2xl rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{label}</p>
          <p className="text-sm font-bold text-emerald-400">{rupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[320px] w-full mt-6 group/chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#f1f5f9" 
          />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(value) => `Rp${value / 1000}k`}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone" // Smooth curve
            dataKey="amount"
            stroke="#059669"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorIncome)"
            animationDuration={2000}
            animationEasing="ease-in-out"
            activeDot={{ 
              r: 6, 
              stroke: '#ffffff', 
              strokeWidth: 3, 
              fill: '#059669',
              className: "shadow-lg shadow-emerald-500/50"
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
