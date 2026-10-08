import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ChevronDown
} from 'lucide-react';
import { Pembayaran, PembayaranStatus } from '../../../types';
import { formatRupiah } from './types';
import {
  extractInvoiceSequenceNumber,
  comparePaymentByInvoiceSequenceAsc,
} from '../../../lib/invoiceUtils';

interface PembayaranTableProps {
  payments: Pembayaran[];
  isAdmin: boolean;
  onPreviewBukti: (url: string) => void;
  onEdit: (pay: Pembayaran) => void;
  onDelete: (id: string, namaSekolah: string, noRef: string) => void;
  onVerify: (id: string, status: PembayaranStatus) => void;
}

export const PembayaranTable: React.FC<PembayaranTableProps> = ({
  payments,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [sortOrder, setSortOrder] = useState<'terkecil' | 'terbesar'>('terkecil');

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const cmp = comparePaymentByInvoiceSequenceAsc(a, b);
      return sortOrder === 'terkecil' ? cmp : -cmp;
    });
  }, [payments, sortOrder]);

  if (payments.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 my-3">
        <CreditCard size={36} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-700">Belum ada riwayat pembayaran di kategori ini</p>
        <p className="text-xs text-slate-400 mt-1">
          {isAdmin
            ? 'Gunakan Ceklis Bayar pada tabel tagihan atau tombol + Pembayaran untuk mencatat pembayaran.'
            : 'Belum ada data pembayaran yang tercatat untuk sekolah Anda.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs my-3">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4 min-w-[230px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 font-extrabold">No. Invoice</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'terkecil' | 'terbesar')}
                    className="text-[10px] font-extrabold pl-2 pr-6 py-1 rounded-lg bg-white text-blue-900 border border-blue-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer appearance-none"
                    title="Urutkan berdasarkan Nomor Urut Invoice (misal 292, 293, dst)"
                  >
                    <option value="terkecil">Urut: Terkecil → Terbesar</option>
                    <option value="terbesar">Urut: Terbesar → Terkecil</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-1.5 pointer-events-none text-blue-700 font-bold" />
                </div>
              </div>
            </th>
            <th className="py-3 px-4">Sekolah Mitra</th>
            <th className="py-3 px-4">Tanggal Pembayaran</th>
            <th className="py-3 px-4 text-right">Nominal Bayar</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {sortedPayments.map((pay) => {
            const invSeq = pay.invoiceId ? extractInvoiceSequenceNumber(pay.invoiceId) : 0;
            return (
            <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors">
              {/* Tautan Invoice */}
              <td className="py-3.5 px-4">
                {pay.invoiceId ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {invSeq > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[10px] font-black">
                        #{invSeq}
                      </span>
                    )}
                    <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block truncate max-w-[180px]">
                      {pay.invoiceId}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-slate-700 text-xs block">{pay.noReferensi || pay.id}</span>
                )}
                {pay.catatan && (
                  <span className="text-[10px] text-slate-500 block truncate max-w-[220px] mt-0.5" title={pay.catatan}>
                    {pay.catatan}
                  </span>
                )}
              </td>

              {/* Sekolah Mitra */}
              <td className="py-3.5 px-4">
                <span className="font-bold text-slate-800 block">{pay.namaSekolah}</span>
                <span className="text-[10px] text-slate-400 font-mono">{pay.mitraId}</span>
              </td>

              {/* Tanggal Pembayaran */}
              <td className="py-3.5 px-4 font-semibold text-slate-700">
                {pay.tanggalBayar}
              </td>

              {/* Nominal Bayar */}
              <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                {formatRupiah(pay.jumlah)}
              </td>

              {/* Status */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={12} /> Sudah Bayar
                </span>
              </td>

              {/* Aksi */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {/* Edit (Admin only) */}
                  {isAdmin && (
                    <button
                      onClick={() => onEdit(pay)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition cursor-pointer"
                      title="Edit Pembayaran"
                    >
                      <Edit3 size={15} />
                    </button>
                  )}

                  {/* Delete (Admin only) */}
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(pay.id, pay.namaSekolah, pay.noReferensi || pay.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title="Hapus Pembayaran"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  {/* Non-admin read-only indicator */}
                  {!isAdmin && (
                    <span className="text-[11px] text-slate-400 font-medium italic">
                      Mode Lihat
                    </span>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
