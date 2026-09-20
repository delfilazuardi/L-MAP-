import React from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Pembayaran, PembayaranStatus } from '../../../types';
import { formatRupiah } from './types';

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
  onPreviewBukti,
  onEdit,
  onDelete,
  onVerify,
}) => {
  if (payments.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 my-3">
        <CreditCard size={36} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-700">Belum ada riwayat setoran pembayaran di kategori ini</p>
        <p className="text-xs text-slate-400 mt-1">
          Gunakan tombol di report card atas untuk mencatat setoran pembayaran baru.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: PembayaranStatus) => {
    switch (status) {
      case 'Terverifikasi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Terverifikasi
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle size={12} /> Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} /> Menunggu Verifikasi
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs my-3">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">No. Ref & Tanggal</th>
            <th className="py-3 px-4">Sekolah Mitra</th>
            <th className="py-3 px-4">Tautan Invoice</th>
            <th className="py-3 px-4 text-right">Nominal Setoran</th>
            <th className="py-3 px-4">Metode & Rekening</th>
            <th className="py-3 px-4 text-center">Bukti Transfer</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {payments.map((pay) => (
            <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors">
              {/* No. Ref & Tanggal */}
              <td className="py-3.5 px-4">
                <span className="font-mono font-bold text-slate-800 text-xs block">
                  {pay.noReferensi}
                </span>
                <span className="text-[10px] text-slate-400">
                  {pay.tanggalBayar}
                </span>
              </td>

              {/* Sekolah Mitra */}
              <td className="py-3.5 px-4">
                <span className="font-bold text-slate-800 block">{pay.namaSekolah}</span>
                <span className="text-[10px] text-slate-400 font-mono">{pay.mitraId}</span>
              </td>

              {/* Tautan Invoice */}
              <td className="py-3.5 px-4">
                {pay.invoiceId ? (
                  <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block truncate max-w-[160px]">
                    {pay.invoiceId}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Tanpa tautan</span>
                )}
                {pay.catatan && (
                  <span className="text-[10px] text-slate-500 block truncate max-w-[180px] mt-0.5" title={pay.catatan}>
                    {pay.catatan}
                  </span>
                )}
              </td>

              {/* Nominal Setoran */}
              <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                {formatRupiah(pay.jumlah)}
              </td>

              {/* Metode */}
              <td className="py-3.5 px-4 text-slate-700">
                <span className="font-medium block">{pay.metodeBayar}</span>
              </td>

              {/* Bukti Transfer */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                {pay.buktiUrl ? (
                  <button
                    onClick={() => onPreviewBukti(pay.buktiUrl)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 transition cursor-pointer border border-slate-200"
                    title="Lihat Bukti Transfer"
                  >
                    <ImageIcon size={13} />
                    <span>Lihat Bukti</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Tidak ada bukti</span>
                )}
              </td>

              {/* Status */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                {getStatusBadge(pay.status)}
              </td>

              {/* Aksi */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {/* Admin Verification buttons */}
                  {isAdmin && pay.status === 'Menunggu Verifikasi' && (
                    <>
                      <button
                        onClick={() => onVerify(pay.id, 'Terverifikasi')}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                        title="Verifikasi Pembayaran"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => onVerify(pay.id, 'Ditolak')}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                        title="Tolak Pembayaran"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => onEdit(pay)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition cursor-pointer"
                    title="Edit Pembayaran"
                  >
                    <Edit3 size={15} />
                  </button>

                  {/* Delete (Admin only) */}
                  {isAdmin && (
                    <button
                      onClick={() => onDelete(pay.id, pay.namaSekolah, pay.noReferensi)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title="Hapus Pembayaran"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
