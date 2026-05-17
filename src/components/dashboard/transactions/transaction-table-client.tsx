"use client";

import React, { useState, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Ticket, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VoucherPrintModal } from "./voucher-print-modal";

const rupiah = (amount: string | null) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(parseFloat(amount || "0"));
};

const splitDateTime = (value?: string | null) => {
  if (!value) return null;
  const parts = value.trim().split(/\s+/);
  if (parts.length >= 2) return { date: parts[0], time: parts.slice(1).join(" ") };
  return { date: "", time: value };
};

const TransactionRow = memo(({ tx, onPrint }: { tx: any, onPrint: (tx: any) => void }) => (
  <TableRow key={tx.no} className="hover:bg-slate-50/30 transition-colors group">
    <TableCell className="text-xs text-slate-500 font-mono">
      <div className="font-bold text-slate-700">{tx.date}</div>
      <div className="opacity-70">{tx.time}</div>
    </TableCell>
    <TableCell>
      <div className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
        {tx.sellerName}
      </div>
      <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{tx.userId}</div>
    </TableCell>
    <TableCell>
      <div className="text-sm font-medium flex items-center gap-2">
        {tx.voucherUsername ? (
          <>
            <Ticket size={14} className="text-emerald-500" />
            <span>Voucher {tx.voucherExpiry || ""}</span>
          </>
        ) : tx.topUp ? (
          <>
            <ArrowUpCircle size={14} className="text-emerald-500" />
            <span>Isi Saldo (Topup)</span>
          </>
        ) : (
          tx.description
        )}
      </div>
      {tx.voucherUsername && (
        <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-1 font-mono">
          U: {tx.voucherUsername} {tx.voucherPassword ? `/ P: ${tx.voucherPassword}` : ""}
        </div>
      )}
    </TableCell>
    <TableCell>
      {tx.voucherUsername ? (
        <div className="space-y-1">
          {(() => {
            const start = splitDateTime(tx.useTime);
            const exp = splitDateTime(tx.expiredTime);
            if (!start) {
              return (
                <span className="text-[10px] font-black px-2 py-1 rounded-md inline-block border bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-wider">
                  belum terdata
                </span>
              );
            }
            return (
              <>
                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block border bg-blue-50 text-blue-700 border-blue-100">
                  Start : {start.time} | {start.date}
                </div>
                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100">
                  Expired : {exp ? `${exp.time} | ${exp.date}` : "-"}
                </div>
              </>
            );
          })()}
          {tx.description === "Hotspot Expired" && (
            <div className="text-[9px] font-black text-red-600 uppercase tracking-widest">Expired</div>
          )}
        </div>
      ) : "-"}
    </TableCell>
    <TableCell className={cn("text-right font-bold", tx.topUp ? "text-emerald-600" : "text-slate-900")}>
      {tx.topUp ? "+" : ""}{rupiah(tx.voucherBuy || tx.topUp)}
    </TableCell>
    <TableCell className="text-right text-slate-500 font-mono text-xs italic">
      {rupiah(tx.balanceEnd)}
    </TableCell>
    <TableCell className="text-center">
      {tx.voucherUsername && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onPrint(tx)}
          className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
        >
          <Printer size={16} />
        </Button>
      )}
    </TableCell>
  </TableRow>
));

TransactionRow.displayName = "TransactionRow";

export function TransactionTableClient({ transactions }: { transactions: any[] }) {
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrint = (tx: any) => {
    setSelectedVoucher({
      username: tx.voucherUsername,
      password: tx.voucherPassword,
      profile: tx.description.includes("Voucher") ? tx.description.split(" ")[1] : "Hotspot",
      price: tx.voucherBuy || "0",
      routerName: tx.routerName
    });
    setIsModalOpen(true);
  };

  return (
    <>
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px] font-bold">Waktu & Tanggal</TableHead>
            <TableHead className="font-bold">Reseller</TableHead>
            <TableHead className="font-bold">Aktivitas / Voucher</TableHead>
            <TableHead className="font-bold">Masa Aktif</TableHead>
            <TableHead className="font-bold text-right">Nominal</TableHead>
            <TableHead className="font-bold text-right">Saldo Akhir</TableHead>
            <TableHead className="text-center font-bold">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TransactionRow key={tx.no} tx={tx} onPrint={handlePrint} />
          ))}
        </TableBody>
      </Table>

      <VoucherPrintModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        voucher={selectedVoucher} 
      />
    </>
  );
}
