import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceOperationalStatus } from '../../../types';
import { formatRupiah } from './types';
import { NominalInput } from './NominalInput';
import {
  isSchoolPelaporanSaja,
  getSchoolObligationBadgeInfo,
  extractInvoiceSequenceNumber,
  compareInvoiceBySequenceAsc,
} from '../../../lib/invoiceUtils';

interface InvoiceTableProps {
  invoices: Invoice[];
  isAdmin: boolean;
  onDetail: (inv: Invoice) => void;
  onEdit: (inv: Invoice) => void;
  onDelete: (id: string, nomor: string) => void;
  onPay: (inv: Invoice) => void;
  onQuickSavePayment?: (
    inv: Invoice,
    values: {
      isPaid: boolean;
      tagihanFull: number;
      tagihanRealisasi: number;
      tanggalDibayar: string;
      nominalPembayaran: number;
    }
  ) => Promise<void>;
  kategoriTitle?: string;
  defaultSortOrder?: 'terkecil' | 'terbesar';
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  isAdmin,
  onDetail,
  onEdit,
  onDelete,
  onPay,
  onQuickSavePayment,
  defaultSortOrder = 'terkecil',
}) => {
  // Urutan No. Invoice otomatis dari Terkecil -> Terbesar (mis: 292 -> 293 -> 294)
  const [sortOrder, setSortOrder] = useState<'terkecil' | 'terbesar'>(defaultSortOrder);

  // State untuk form Ceklis Bayar inline per baris invoice
  const [openPaymentRowId, setOpenPaymentRowId] = useState<string | null>(null);
  const [formTagihanFull, setFormTagihanFull] = useState<number>(0);
  const [formTagihanRealisasi, setFormTagihanRealisasi] = useState<number>(0);
  const [formTanggalBayar, setFormTanggalBayar] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNominalBayar, setFormNominalBayar] = useState<number>(0);
  const [isSavingRow, setIsSavingRow] = useState(false);

  const handleToggleRowPayForm = (inv: Invoice, forceUnpay = false) => {
    if (openPaymentRowId === inv.id && !forceUnpay) {
      setOpenPaymentRowId(null);
      return;
    }
    const full = inv.tagihanFull || inv.nominal || 0;
    const real = inv.tagihanRealisasi || inv.nominal || full;
    const paid = inv.nominalPembayaran || 0;
    setFormTagihanFull(full);
    setFormTagihanRealisasi(real);
    setFormTanggalBayar(inv.tanggalDibayar || new Date().toISOString().split('T')[0]);
    setFormNominalBayar(paid > 0 ? paid : real);
    setOpenPaymentRowId(inv.id);
  };

  const handleSaveInlinePay = async (inv: Invoice) => {
    if (!onQuickSavePayment) {
      onPay(inv);
      return;
    }
    setIsSavingRow(true);
    try {
      await onQuickSavePayment(inv, {
        isPaid: formNominalBayar > 0,
        tagihanFull: Number(formTagihanFull),
        tagihanRealisasi: Number(formTagihanRealisasi),
        tanggalDibayar: formTanggalBayar,
        nominalPembayaran: Number(formNominalBayar),
      });
      setOpenPaymentRowId(null);
    } finally {
      setIsSavingRow(false);
    }
  };

  // Invoices diurutkan murni berdasarkan nomor urut di kode Nomor Invoice (mis: INV/IX/25/292/MO -> 292)
  // Tanpa menggunakan createdAt / updatedAt sehingga saat diedit posisinya tetap sesuai urutan nomor.
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const cmp = compareInvoiceBySequenceAsc(a, b);
      return sortOrder === 'terkecil' ? cmp : -cmp;
    });
  }, [invoices, sortOrder]);

  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 my-3">
        <Receipt size={36} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-bold text-slate-700">Belum ada tagihan di kategori ini</p>
        <p className="text-xs text-slate-400 mt-1">
          {isAdmin 
            ? 'Gunakan tombol di report card atas untuk menambahkan tagihan baru.'
            : 'Belum ada data tagihan yang diterbitkan untuk sekolah Anda.'}
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
            {/* Kolom No. Invoice dengan Urutan Otomatis Terkecil -> Terbesar */}
            <th className="py-3 px-4 min-w-[240px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 font-extrabold">No. Invoice & Tanggal</span>
                <div className="flex items-center gap-1">
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
              </div>
            </th>
            <th className="py-3 px-4">Sekolah Mitra</th>
            <th className="py-3 px-4">Bulan & TA</th>
            <th className="py-3 px-4 text-right">Nominal Tagihan</th>
            <th className="py-3 px-4 text-right">Nominal Realisasi</th>
            <th className="py-3 px-4 text-right">Nominal Bayar</th>
            <th className="py-3 px-4 text-right">Sisa Piutang</th>
            <th className="py-3 px-4 text-center">Ceklis & Status Bayar</th>
            <th className="py-3 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {sortedInvoices.map((inv) => {
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
            const seqNumber = extractInvoiceSequenceNumber(inv.nomorInvoice || inv.id);
            const isCheckedPaid = dibayar > 0 || inv.status === 'Lunas' || inv.status === 'Sebagian';
            const isRowOpen = openPaymentRowId === inv.id;

            return (
              <React.Fragment key={inv.id}>
              <tr 
                className={`transition-colors ${isRowOpen ? 'bg-emerald-50/40' : 'hover:bg-blue-50/30'}`}
              >
                {/* No. Invoice & Tanggal sesuai urutan nomor */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {seqNumber > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[10px] font-black">
                        #{seqNumber}
                      </span>
                    )}
                    <span className="font-mono font-bold text-blue-900 text-xs block">
                      {inv.nomorInvoice || inv.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                    <span>Kirim: {inv.tanggalKirim || '-'}</span>
                    {inv.tanggalDibayar && (
                      <span className="text-emerald-600 font-semibold">• Bayar: {inv.tanggalDibayar}</span>
                    )}
                  </div>
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

                {/* Nominal Tagihan */}
                <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                  {formatRupiah(inv.tagihanFull || inv.nominal || 0)}
                </td>

                {/* Nominal Realisasi */}
                <td className="py-3.5 px-4 text-right font-black text-blue-800">
                  {formatRupiah(realisasi)}
                </td>

                {/* Nominal Bayar */}
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

                {/* Ceklis Bayar & Status */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  {isPelaporan ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Pelaporan Saja
                    </span>
                  ) : isAdmin ? (
                    <div className="flex flex-col items-center gap-1">
                      <label
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-extrabold cursor-pointer transition select-none ${
                          isCheckedPaid || isRowOpen
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40'
                        }`}
                        title="Ceklis untuk membuka form pembayaran (Nominal Tagihan, Realisasi, Tanggal Pembayaran & Nominal Bayar)"
                      >
                        <input
                          type="checkbox"
                          checked={isCheckedPaid || isRowOpen}
                          onChange={() => handleToggleRowPayForm(inv)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <span>{isCheckedPaid ? 'Sudah Bayar' : 'Ceklis Bayar'}</span>
                      </label>
                      {getStatusBadge(inv.status)}
                    </div>
                  ) : (
                    getStatusBadge(inv.status)
                  )}
                </td>

                {/* Aksi */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {/* Detail & Print / View */}
                    <button
                      onClick={() => onDetail(inv)}
                      className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        isAdmin
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                          : 'px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold'
                      }`}
                      title="Lihat Detail & Cetak Invoice"
                    >
                      <Eye size={15} className="text-blue-600" />
                      {!isAdmin && <span className="text-[11px]">Lihat Invoice</span>}
                    </button>

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

              {/* Inline Form Pembayaran yang terbuka saat Ceklis Bayar diklik */}
              {isAdmin && isRowOpen && (
                <tr className="bg-emerald-50/60 border-b border-emerald-200">
                  <td colSpan={9} className="p-4">
                    <div className="rounded-2xl bg-white border-2 border-emerald-400 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs">
                            ✓
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              Form Pembayaran Cepat — {inv.nomorInvoice || inv.id} ({inv.namaSekolah})
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Isi Nominal Tagihan, Nominal Realisasi, Tanggal Pembayaran, dan Nominal Bayar (langsung tersimpan tanpa verifikasi)
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setOpenPaymentRowId(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Nominal Tagihan */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <NominalInput
                            label="1. Nominal Tagihan"
                            value={formTagihanFull}
                            onChange={(val) => setFormTagihanFull(val)}
                            inputClassName="border-slate-300 text-slate-800 bg-white"
                          />
                        </div>

                        {/* 2. Nominal Realisasi */}
                        <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-200">
                          <NominalInput
                            label="2. Nominal Realisasi"
                            value={formTagihanRealisasi}
                            onChange={(val) => setFormTagihanRealisasi(val)}
                            inputClassName="border-blue-300 text-blue-800 bg-white"
                            helperAction={
                              <button
                                type="button"
                                onClick={() => setFormTagihanRealisasi(formTagihanFull)}
                                className="text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                              >
                                Samakan
                              </button>
                            }
                          />
                        </div>

                        {/* 3. Tanggal Pembayaran */}
                        <div className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            3. Tanggal Pembayaran
                          </label>
                          <input
                            type="date"
                            value={formTanggalBayar}
                            onChange={(e) => setFormTanggalBayar(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* 4. Nominal Bayar */}
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300">
                          <NominalInput
                            label="4. Nominal Bayar"
                            value={formNominalBayar}
                            onChange={(val) => setFormNominalBayar(val)}
                            inputClassName="border-emerald-400 text-emerald-800 bg-white"
                            helperAction={
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setFormNominalBayar(formTagihanRealisasi)}
                                  className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer"
                                >
                                  Lunas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormNominalBayar(0)}
                                  className="text-[10px] font-bold text-rose-600 bg-white px-1.5 py-0.5 rounded border border-rose-200 cursor-pointer"
                                  title="Reset belum bayar"
                                >
                                  Rp 0
                                </button>
                              </div>
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-600">
                          Sisa Piutang:{' '}
                          <strong className={formTagihanRealisasi - formNominalBayar > 0 ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                            {formatRupiah(Math.max(0, formTagihanRealisasi - formNominalBayar))}
                          </strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setOpenPaymentRowId(null)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={isSavingRow}
                            onClick={() => handleSaveInlinePay(inv)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Check size={14} />
                            <span>{isSavingRow ? 'Menyimpan...' : 'Simpan Pembayaran'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
