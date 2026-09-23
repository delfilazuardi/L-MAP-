import React from 'react';
import { 
  Receipt, 
  Printer, 
  CreditCard, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceOperationalStatus } from '../../../types';
import { formatRupiah } from './types';
import { isSchoolPelaporanSaja, getSchoolObligationBadgeInfo } from '../../../lib/invoiceUtils';

interface InvoiceTableProps {
  invoices: Invoice[];
  isAdmin: boolean;
  onDetail: (inv: Invoice) => void;
  onEdit: (inv: Invoice) => void;
  onDelete: (id: string, nomor: string) => void;
  onPay: (inv: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  isAdmin,
  onDetail,
  onEdit,
  onDelete,
  onPay,
}) => {
  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 my-3">
        <Receipt size={36} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-700">Belum ada tagihan di kategori ini</p>
        <p className="text-xs text-slate-400 mt-1">
          Gunakan tombol di report card atas untuk menambahkan tagihan baru.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Lunas':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> Lunas
          </span>
        );
      case 'Sebagian':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} /> Sebagian
          </span>
        );
      case 'Jatuh Tempo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle size={12} /> Jatuh Tempo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> Belum Bayar
          </span>
        );
    }
  };

  const getOperationalBadge = (status?: InvoiceOperationalStatus) => {
    switch (status) {
      case 'Terkirim':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">Terkirim</span>;
      case 'Draft':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">Draft</span>;
      case 'Revisi':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">Revisi</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">Terkirim</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs my-3">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">No. Invoice & Tanggal</th>
            <th className="py-3 px-4">Sekolah Mitra</th>
            <th className="py-3 px-4">Bulan & TA</th>
            <th className="py-3 px-4">Status Kirim</th>
            <th className="py-3 px-4 text-right">Tagihan Full</th>
            <th className="py-3 px-4 text-right">Realisasi</th>
            <th className="py-3 px-4 text-right">Dibayar</th>
            <th className="py-3 px-4 text-right">Sisa Piutang</th>
            <th className="py-3 px-4 text-center">Status Bayar</th>
            <th className="py-3 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {invoices.map((inv) => {
            const isPelaporan = inv.isPelaporanSaja || isSchoolPelaporanSaja(inv.mitraId, {
              date: inv.tanggalKirim,
              tahunAjaran: inv.tahunAjaran,
            });
            const obligationInfo = getSchoolObligationBadgeInfo(inv.mitraId, {
              date: inv.tanggalKirim,
              tahunAjaran: inv.tahunAjaran,
            });

            const realisasi = inv.tagihanRealisasi || inv.nominal || 0;
            const dibayar = inv.nominalPembayaran || 0;
            const sisa = Math.max(0, realisasi - dibayar);

            return (
              <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                {/* No. Invoice & Tanggal */}
                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-blue-900 text-xs block">
                    {inv.nomorInvoice || inv.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Kirim: {inv.tanggalKirim || '-'}
                  </span>
                </td>

                {/* Sekolah Mitra */}
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-800 block">{inv.namaSekolah}</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-[10px] text-slate-400 font-mono">{inv.mitraId}</span>
                    {isPelaporan && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${obligationInfo.badgeClass}`}>
                        {obligationInfo.label}
                      </span>
                    )}
                  </div>
                </td>

                {/* Periode */}
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-slate-700 block">{inv.bulan || '-'}</span>
                  <span className="text-[10px] text-slate-400">{inv.tahunAjaran || '2026/2027'}</span>
                </td>

                {/* Status Kirim */}
                <td className="py-3.5 px-4">
                  {getOperationalBadge(inv.statusInvoice)}
                  {inv.tanggalKirim && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Kirim: {inv.tanggalKirim}
                    </span>
                  )}
                </td>

                {/* Tagihan Full */}
                <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                  {formatRupiah(inv.tagihanFull || inv.nominal || 0)}
                </td>

                {/* Realisasi */}
                <td className="py-3.5 px-4 text-right font-black text-blue-800">
                  {formatRupiah(realisasi)}
                </td>

                {/* Dibayar */}
                <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                  {isPelaporan ? '-' : formatRupiah(dibayar)}
                </td>

                {/* Sisa Piutang */}
                <td className="py-3.5 px-4 text-right">
                  {isPelaporan ? (
                    <div>
                      <span className="font-bold text-slate-400">Rp 0</span>
                      <span className="text-[9px] font-semibold text-purple-700 block">Bebas Bayar</span>
                    </div>
                  ) : (
                    <span className="font-black text-rose-600">{formatRupiah(sisa)}</span>
                  )}
                </td>

                {/* Status Bayar */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  {isPelaporan ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Pelaporan Saja
                    </span>
                  ) : (
                    getStatusBadge(inv.status)
                  )}
                </td>

                {/* Aksi */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {/* Detail & Print */}
                    <button
                      onClick={() => onDetail(inv)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer"
                      title="Lihat Detail & Cetak Invoice"
                    >
                      <Printer size={15} />
                    </button>

                    {/* Quick Pay - Only for schools with payment obligation */}
                    {!isPelaporan && inv.status !== 'Lunas' && (
                      <button
                        onClick={() => onPay(inv)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                        title="Catat Pembayaran untuk Invoice ini"
                      >
                        <CreditCard size={15} />
                      </button>
                    )}

                    {/* Edit (Admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => onEdit(inv)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition cursor-pointer"
                        title="Edit Data Invoice"
                      >
                        <Edit size={15} />
                      </button>
                    )}

                    {/* Delete (Admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(inv.id, inv.nomorInvoice || inv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Hapus Invoice"
                      >
                        <Trash2 size={15} />
                      </button>
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
