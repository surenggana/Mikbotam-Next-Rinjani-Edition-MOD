"use client";

import { Ticket, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VoucherData {
  username: string;
  password?: string;
  profile: string;
  price: string;
  routerName?: string;
}

export function VoucherPrintModal({
  isOpen,
  onClose,
  voucher
}: {
  isOpen: boolean;
  onClose: () => void;
  voucher: VoucherData | null;
}) {
  if (!voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white border-none shadow-2xl">
        <div className="print:hidden p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Cetak Voucher</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
        </div>

        <div className="p-8 flex justify-center bg-white" id="printable-voucher">
          {/* Voucher Card Design */}
          <div className="w-full max-w-[300px] border-2 border-dashed border-slate-300 rounded-2xl p-6 relative overflow-hidden bg-white shadow-sm">
            {/* Background pattern/logo */}
            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
              <Ticket size={120} />
            </div>

            <div className="text-center mb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{voucher.routerName || "MIKROTIK"}</h2>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Hotspot Voucher</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Username / Kode</p>
                <p className="text-2xl font-black text-slate-900 font-mono tracking-wider">{voucher.username}</p>
                {voucher.password && voucher.password !== voucher.username && (
                  <>
                    <div className="h-px bg-slate-200 my-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password</p>
                    <p className="text-lg font-bold text-slate-700 font-mono">{voucher.password}</p>
                  </>
                )}
              </div>

              <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Profil</p>
                  <p className="text-xs font-bold text-slate-700">{voucher.profile}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Harga</p>
                  <p className="text-sm font-black text-emerald-600">Rp {parseInt(voucher.price).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[8px] font-medium text-slate-400 italic">Terima kasih telah menggunakan layanan kami.</p>
            </div>
          </div>
        </div>

        <div className="print:hidden p-6 bg-slate-50 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Tutup</Button>
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20" onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Cetak Sekarang
          </Button>
        </div>

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-voucher, #printable-voucher * {
              visibility: visible;
            }
            #printable-voucher {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: flex !important;
              justify-content: center !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .border-2 { border-width: 2px !important; }
            .border-dashed { border-style: dashed !important; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
