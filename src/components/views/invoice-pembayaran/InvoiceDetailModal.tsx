import React from 'react';
import { X, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Invoice } from '../../../types';
import { formatRupiah } from './types';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  const realisasi = invoice.tagihanRealisasi || invoice.nominal || 0;
  const dibayar = invoice.nominalPembayaran || 0;
  const sisa = Math.max(0, realisasi - dibayar);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none">
        {/* Modal Top Bar (hidden on print) */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Pratinjau Kuitansi / Invoice Resmi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {invoice.kategori || 'Invoice'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 text-slate-900 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-3">
              <img
                src="/lmap-logo.jpg"
                alt="L-MAP Logo"
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-0.5"
              />
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-wider">
                  L<span className="text-amber-500">-</span>MAP
                </h2>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Lazuardi Mitra Administration Platform
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mitra Office Yayasan Perguruan Lazuardi Hayati
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-blue-700 uppercase tracking-widest block">
                SURAT TAGIHAN RESMI
              </span>
              <span className="font-mono text-base font-black text-slate-900 block mt-1">
                {invoice.nomorInvoice || invoice.id}
              </span>
              <span className="text-xs text-slate-500 block">
                Tanggal: {invoice.tanggalKirim || '-'}
              </span>
            </div>
          </div>

          {/* Mitra Destination & Period */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block">
                Ditagihkan Kepada:
              </span>
              <strong className="text-sm font-black text-slate-900 block mt-0.5">
                {invoice.namaSekolah}
              </strong>
              <span className="text-slate-600 block mt-0.5">Kode Mitra: {invoice.mitraId}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 uppercase font-bold text-[10px] block">
                Periode & Jatuh Tempo:
              </span>
              <strong className="text-xs font-bold text-slate-900 block mt-0.5">
                {invoice.bulan || '-'} • TA {invoice.tahunAjaran || '2026/2027'}
              </strong>
              <span className="text-rose-600 font-bold block mt-0.5">
                Jatuh Tempo: {invoice.jatuhTempo || '-'}
              </span>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[11px] font-black text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Deskripsi Tagihan</th>
                  <th className="py-2.5 px-4 text-center">Kategori</th>
                  <th className="py-2.5 px-4 text-right">Tagihan Full</th>
                  <th className="py-2.5 px-4 text-right">Realisasi (Netto)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <strong className="font-bold text-slate-900 block">
                      {invoice.keterangan || `Biaya ${invoice.kategori || 'Kemitraan'} Periode ${invoice.bulan || ''}`}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Lisensi kurikulum & standarisasi mutu MenDAKI Lazuardi
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    {invoice.kategori || 'Renewal Fee'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">
                    {formatRupiah(invoice.tagihanFull || invoice.nominal || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {formatRupiah(realisasi)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-slate-600">
                    Total Tagihan Realisasi:
                  </td>
                  <td className="py-2 px-4 text-right font-black text-blue-900">
                    {formatRupiah(realisasi)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-slate-600">
                    Telah Dibayar:
                  </td>
                  <td className="py-2 px-4 text-right font-black text-emerald-600">
                    {formatRupiah(dibayar)}
                  </td>
                </tr>
                <tr className="bg-slate-100 text-sm">
                  <td colSpan={3} className="py-2.5 px-4 text-right font-black text-slate-800">
                    Sisa Tagihan / Piutang:
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-rose-600">
                    {formatRupiah(sisa)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Instructions */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 text-xs space-y-1">
            <span className="font-bold text-blue-900 block">Informasi Rekening Pembayaran Resmi:</span>
            <p className="text-slate-700">Bank Mandiri: <strong>157-00-0988776-5</strong> a.n. Yayasan Perguruan Lazuardi</p>
            <p className="text-slate-700">Bank BCA: <strong>546-0899-123</strong> a.n. Lazuardi Mitra Office</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Harap cantumkan nomor invoice <strong>{invoice.nomorInvoice || invoice.id}</strong> pada berita transfer.
            </p>
          </div>

          {/* Footer Signature */}
          <div className="pt-4 flex items-center justify-between text-xs text-slate-600">
            <div>
              <p>Status: <strong className="text-slate-900">{invoice.status}</strong></p>
              <p className="text-[11px] text-slate-400 mt-1">Dicetak otomatis dari L-MAP v2.6</p>
            </div>
            <div className="text-center w-48">
              <p className="text-[11px] text-slate-400">Mitra Office Lazuardi</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-xs text-blue-600 font-serif italic font-bold">Lazuardi Hayati</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                Bendahara / Keuangan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
