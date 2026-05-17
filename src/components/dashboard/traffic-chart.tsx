"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowDown, ArrowUp } from "lucide-react";
import { getInterfaceTraffic } from "@/lib/actions/monitoring";

export function TrafficChart({ interfaceName = "ether1" }: { interfaceName?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [current, setCurrent] = useState({ rx: 0, tx: 0 });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stats = await getInterfaceTraffic(interfaceName);
        if (stats && stats.success) {
          const now = new Date();
          const time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
          
          setData(prev => {
            const newData = [...prev, { time, rx: stats.rx / 1024, tx: stats.tx / 1024 }];
            if (newData.length > 20) return newData.slice(1);
            return newData;
          });
          setCurrent({ rx: stats.rx, tx: stats.tx });
        }
      } catch (err) {
        console.debug("Traffic poll failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [interfaceName]);

  const formatSpeed = (bps: number) => {
    if (bps > 1024 * 1024) return (bps / 1024 / 1024).toFixed(2) + " Mbps";
    return (bps / 1024).toFixed(2) + " Kbps";
  };

  return (
    <Card className="shadow-md border-slate-100 overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Activity size={18} />
          </div>
          <CardTitle className="text-sm font-black uppercase tracking-wider">Traffic Monitor: {interfaceName}</CardTitle>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <ArrowDown size={10} /> {formatSpeed(current.rx)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <ArrowUp size={10} /> {formatSpeed(current.tx)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                stroke="#94a3b8"
              />
              <YAxis 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                stroke="#94a3b8" 
                tickFormatter={(val) => `${val}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', fontSize: '10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="rx" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRx)" 
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="tx" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTx)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
