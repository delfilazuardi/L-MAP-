import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CalendarRange, 
  CheckCircle2, 
  CreditCard, 
  Building2, 
  Sparkles,
  Check,
  TrendingDown,
  AlertCircle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { Invoice, Pembayaran, SekolahMitra } from '../../../types';
import { 
  formatRupiah, 
  allocateCicilanToInvoices, 
  CicilanAllocationResult,
  getInvoiceRemainingDebt,
  getEffectiveInvoiceStatus,
  isRecordBelongsToSchool,
  compareInvoicesForCicilanFIFO
} from '../../../lib/invoiceUtils';
import { NominalInput } from './NominalInput';
import { FileUploadBox } from './FileUploadBox';

interface RencanaCicilanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolahList: SekolahMitra[];
  invoices: Invoice[];
  payments: Pembayaran[];
  defaultSekolahId?: string;
  onExecutePayment: (
    school: SekolahMitra,
    amount: number,
    paymentMeta: {
      tanggalBayar: string;
      metodeBayar?: string;
      noReferensi?: string;
      buktiUrl?: string;
      kwitansiUrl?: string;
      catatan: string;
    },
    allocationResult: CicilanAllocationResult
  ) => Promise<void>;
}

export const RencanaCicilanModal: React.FC<RencanaCicilanModalProps> = ({
  isOpen,
  onClose,
  sekolahList,
  invoices,
  defaultSekolahId,
  onExecutePayment,
}) => {
  // Filter out demo & special reporting-only schools
  const payableSchools = useMemo(() => {
    return sekolahList.filter(s => 
      !s.isDemo && 
      s.id !== 'DEMO-MITRA' &&
      s.kategoriSekolah !== 'Khusus Pelaporan' &&
      s.statusKerjasama !== 'Afiliasi'
    );
  }, [sekolahList]);

  // Selected school
  const [selectedMitraId, setSelectedMitraId] = useState<string>(
    defaultSekolahId || payableSchools[0]?.id || 'MO004'
  );

  // Sync selected school ONLY when modal opens or defaultSekolahId changes
  useEffect(() => {
    if (!isOpen) return;
    if (defaultSekolahId) {
      setSelectedMitraId(defaultSekolahId);
    } else if (payableSchools.length > 0 && !payableSchools.some(s => s.id === selectedMitraId)) {
      setSelectedMitraId(payableSchools[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSekolahId, isOpen]);

  // Payment form states
  const [inputBayarNominal, setInputBayarNominal] = useState<number>(5000000);
  const [inputTanggalBayar, setInputTanggalBayar] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [inputMetodeBayar, setInputMetodeBayar] = useState<string>('Bank Mandiri Transfer');
  const [inputNoReferensi, setInputNoReferensi] = useState<string>(() => `BYR-CICIL-${Date.now().toString().slice(-6)}`);
  const [inputBuktiUrl, setInputBuktiUrl] = useState<string>('');
  const [inputKwitansiUrl, setInputKwitansiUrl] = useState<string>('');
  const [inputCatatan, setInputCatatan] = useState<string>('Pembayaran cicilan / alokasi potong invoice');
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedSchool = useMemo(() => {
    return sekolahList.find(s => s.id === selectedMitraId) || payableSchools[0] || sekolahList[0];
  }, [sekolahList, payableSchools, selectedMitraId]);

  // All invoices of selected school with remaining debt > 0 (sorted FIFO, matches main screen 100%)
  const schoolUnpaidInvoices = useMemo(() => {
    const targetSchool = selectedSchool || selectedMitraId;
    return invoices
      .filter(i => {
        if (!isRecordBelongsToSchool(i, targetSchool, sekolahList)) return false;
        return getInvoiceRemainingDebt(i) > 0;
      })
      .sort(compareInvoicesForCicilanFIFO);
  }, [invoices, selectedSchool, selectedMitraId, sekolahList]);

  // Total current unpaid debt of selected school (exact sum of table remaining debts)
  const totalHutangSekolah = useMemo(() => {
    return schoolUnpaidInvoices.reduce((acc, inv) => {
      return acc + getInvoiceRemainingDebt(inv);
    }, 0);
  }, [schoolUnpaidInvoices]);

  // When school changes, adjust default input amount sensibly
  useEffect(() => {
    if (totalHutangSekolah > 0) {
      setInputBayarNominal(totalHutangSekolah >= 5000000 ? 5000000 : totalHutangSekolah);
    } else {
      setInputBayarNominal(0);
    }
    setSuccessMessage(null);
  }, [selectedMitraId, totalHutangSekolah]);

  // Real-time FIFO allocation simulation based on inputBayarNominal
  const allocationSimulation: CicilanAllocationResult = useMemo(() => {
    return allocateCicilanToInvoices(schoolUnpaidInvoices, inputBayarNominal, inputTanggalBayar);
  }, [schoolUnpaidInvoices, inputBayarNominal, inputTanggalBayar]);

  const sisaHutangSetelahBayar = Math.max(0, totalHutangSekolah - inputBayarNominal);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!selectedSchool || inputBayarNominal <= 0) return;
    setIsExecuting(true);
    setSuccessMessage(null);

    try {
      await onExecutePayment(
        selectedSchool,
        inputBayarNominal,
        {
          tanggalBayar: inputTanggalBayar,
          metodeBayar: inputMetodeBayar,
          noReferensi: inputNoReferensi || `CICIL-${Date.now().toString().slice(-6)}`,
          buktiUrl: inputBuktiUrl,
          kwitansiUrl: inputKwitansiUrl,
          catatan: inputCatatan || `Pembayaran cicilan ${formatRupiah(inputBayarNominal)} (${selectedSchool.namaSekolah})`,
        },
        allocationSimulation
      );

      const lunasCount = allocationSimulation.updatedInvoices.filter(i => i.newStatus === 'Lunas').length;
      const sebagianCount = allocationSimulation.updatedInvoices.filter(i => i.newStatus === 'Sebagian').length;

      setSuccessMessage(
        `Pembayaran ${formatRupiah(inputBayarNominal)} berhasil disimpan! Alokasi memotong ${allocationSimulation.updatedInvoices.length} invoice (${lunasCount} lunas, ${sebagianCount} sebagian). Sisa hutang sekolah kini menjadi ${formatRupiah(sisaHutangSetelahBayar)}.`
      );

      // Auto close after 2 seconds or user can close immediately
      setTimeout(() => {
        onClose();
      }, 2200);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Coins size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Pembayaran Cicilan Multi-Invoice
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Potong Piutang Fleksibel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Bayar sejumlah nominal saat ini (misal Rp 5.000.000 dari total piutang Rp 15.000.000). Dana langsung otomatis memotong invoice-invoice tertua (FIFO).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Pilih Sekolah Mitra & Ringkasan Hutang */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Pilih Sekolah Mitra
                </label>
                <span className="text-[11px] text-slate-500">
                  Pilih sekolah yang ingin mencatatkan pembayaran cicilan
                </span>
              </div>

              <select
                value={selectedMitraId}
                onChange={(e) => setSelectedMitraId(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
              >
                {payableSchools.map((s) => {
                  const sDebt = invoices
                    .filter(i => isRecordBelongsToSchool(i, s, sekolahList))
                    .reduce((acc, inv) => acc + getInvoiceRemainingDebt(inv), 0);

                  return (
                    <option key={s.id} value={s.id}>
                      {s.namaSekolah} {sDebt > 0 ? `(Sisa: ${formatRupiah(sDebt)})` : '(Lunas)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Total Hutang Belum Lunas */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Total Piutang Belum Lunas
                </span>
                <strong className="text-base sm:text-lg font-black text-rose-600 font-mono block mt-0.5">
                  {formatRupiah(totalHutangSekolah)}
                </strong>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {schoolUnpaidInvoices.length} invoice belum lunas
                </span>
              </div>

              {/* Mau Dibayar Sekarang */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  2. Mau Dibayar Sekarang
                </span>
                <strong className="text-base sm:text-lg font-black text-amber-900 font-mono block mt-0.5">
                  {formatRupiah(inputBayarNominal)}
                </strong>
                <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
                  {inputBayarNominal >= totalHutangSekolah && totalHutangSekolah > 0 
                    ? '✓ Melunasi Seluruh Hutang' 
                    : `Memotong ${allocationSimulation.updatedInvoices.length} invoice tertua`}
                </span>
              </div>

              {/* Sisa Piutang Setelah Bayar */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  3. Sisa Piutang Setelah Bayar
                </span>
                <strong className={`text-base sm:text-lg font-black font-mono block mt-0.5 ${
                  sisaHutangSetelahBayar === 0 ? 'text-emerald-700' : 'text-blue-900'
                }`}>
                  {formatRupiah(sisaHutangSetelahBayar)}
                </strong>
                <span className="text-[11px] text-blue-700 block mt-0.5 font-medium">
                  {sisaHutangSetelahBayar === 0 ? '✓ Bebas Piutang (Lunas)' : 'Piutang berkurang langsung'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Form Pembayaran Saat Ini */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-600" />
              <span>Detail Pembayaran Saat Ini</span>
            </h4>

            {/* Nominal Bayar Input with Quick Presets */}
            <div className="space-y-2">
              <NominalInput
                label="Nominal Pembayaran yang Diterima Sekarang (Rp)"
                value={inputBayarNominal}
                onChange={(val) => setInputBayarNominal(val)}
                inputClassName="border-slate-300 text-slate-900 font-black text-base"
                helperAction={
                  <span className="text-xs text-slate-500 font-normal">
                    Contoh: Ada hutang Rp 15 jt, mau bayar Rp 5 jt
                  </span>
                }
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Pilihan Cepat:</span>
                {totalHutangSekolah > 0 && (
                  <button
                    type="button"
                    onClick={() => setInputBayarNominal(totalHutangSekolah)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[11px] border border-emerald-300 transition cursor-pointer"
                  >
                    Lunasi Semua ({formatRupiah(totalHutangSekolah)})
                  </button>
                )}
                {totalHutangSekolah >= 2000000 && (
                  <button
                    type="button"
                    onClick={() => setInputBayarNominal(Math.round(totalHutangSekolah / 2))}
                    className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[11px] border border-blue-300 transition cursor-pointer"
                  >
                    50% ({formatRupiah(Math.round(totalHutangSekolah / 2))})
                  </button>
                )}
                {totalHutangSekolah >= 5000000 && (
                  <button
                    type="button"
                    onClick={() => setInputBayarNominal(5000000)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] border border-amber-300 transition cursor-pointer"
                  >
                    Rp 5.000.000
                  </button>
                )}
                {totalHutangSekolah >= 10000000 && (
                  <button
                    type="button"
                    onClick={() => setInputBayarNominal(10000000)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[11px] border border-indigo-300 transition cursor-pointer"
                  >
                    Rp 10.000.000
                  </button>
                )}
              </div>
            </div>

            {/* Grid Form Fields: Tanggal, Metode, No Referensi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  value={inputTanggalBayar}
                  onChange={(e) => setInputTanggalBayar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={inputMetodeBayar}
                  onChange={(e) => setInputMetodeBayar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Bank Mandiri Transfer">Bank Mandiri Transfer</option>
                  <option value="Bank BCA Transfer">Bank BCA Transfer</option>
                  <option value="Bank BSI Transfer">Bank BSI Transfer</option>
                  <option value="Bank BNI Transfer">Bank BNI Transfer</option>
                  <option value="Bank BRI Transfer">Bank BRI Transfer</option>
                  <option value="Kas / Tunai">Kas / Tunai</option>
                  <option value="Giro / Cek Bank">Giro / Cek Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Referensi Transaksi
                </label>
                <input
                  type="text"
                  value={inputNoReferensi}
                  onChange={(e) => setInputNoReferensi(e.target.value)}
                  placeholder="e.g. MDR-202611-001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Upload Bukti & Kwitansi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <FileUploadBox
                id="upload-bukti-cicilan-multi"
                label="Upload Bukti Pembayaran / Slip Bank"
                type="bukti"
                value={inputBuktiUrl}
                onChange={setInputBuktiUrl}
                description="Upload slip setoran / bukti transfer cicilan (JPG, PNG, PDF)"
              />
              <FileUploadBox
                id="upload-kwitansi-cicilan-multi"
                label="Upload Kwitansi Tanda Terima"
                type="kwitansi"
                value={inputKwitansiUrl}
                onChange={setInputKwitansiUrl}
                description="Upload kwitansi sah Mitra Office Lazuardi (JPG, PNG, PDF)"
              />
            </div>

            {/* Catatan Pembayaran */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Pembayaran
              </label>
              <input
                type="text"
                value={inputCatatan}
                onChange={(e) => setInputCatatan(e.target.value)}
                placeholder="Catatan keterangan transfer pembayaran..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* 3. Live Breakdown: Alokasi Pemotongan Masuk ke Invoice Mana Saja */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-blue-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Rincian Pemotongan Tagihan (Otomatis Masuk ke Invoice Belum Lunas)
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                Total dana dialokasikan: <strong className="text-emerald-700 font-mono font-bold">{formatRupiah(allocationSimulation.totalAllocated)}</strong>
              </span>
            </div>

            {schoolUnpaidInvoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Semua tagihan untuk {selectedSchool.namaSekolah} telah Lunas! Tidak ada piutang yang perlu dicicil.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">No. Invoice & Periode</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-right">Tagihan Asli</th>
                      <th className="py-2.5 px-3 text-right">Sisa Sebelum</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700 bg-emerald-50/50 font-black">
                        Dipotong Kali Ini
                      </th>
                      <th className="py-2.5 px-3 text-right">Sisa Setelah Bayar</th>
                      <th className="py-2.5 px-3 text-center">Status Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {schoolUnpaidInvoices.map((inv) => {
                      const allocItem = allocationSimulation.updatedInvoices.find(u => u.invoice.id === inv.id);
                      const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
                      const remBefore = getInvoiceRemainingDebt(inv);
                      const allocated = allocItem?.allocatedAmount || 0;
                      const newRemaining = Math.max(0, remBefore - allocated);
                      const newStatus = allocItem ? allocItem.newStatus : getEffectiveInvoiceStatus(inv);

                      return (
                        <tr 
                          key={inv.id} 
                          className={`transition ${allocated > 0 ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}
                        >
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-900 block font-bold text-xs">
                              {inv.nomorInvoice || inv.id}
                            </strong>
                            <span className="text-[10px] text-slate-500">
                              {inv.bulan || '-'} • TA {inv.tahunAjaran}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {inv.kategori || 'Renewal Fee'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right font-medium text-slate-600 font-mono">
                            {formatRupiah(full)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-bold text-slate-700 font-mono">
                            {formatRupiah(remBefore)}
                          </td>

                          <td className="py-2.5 px-3 text-right font-black font-mono bg-emerald-50/50">
                            {allocated > 0 ? (
                              <span className="text-emerald-700 font-bold">
                                + {formatRupiah(allocated)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={newRemaining === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {formatRupiah(newRemaining)}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            {allocated > 0 ? (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                                newStatus === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                <Check size={10} strokeWidth={3} />
                                <span>{newStatus}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Belum Terpotong
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex items-center justify-between flex-wrap gap-3 text-xs sticky bottom-0 z-20">
          <div className="text-slate-600">
            <span>Membayar untuk: </span>
            <strong className="text-slate-900">{selectedSchool.namaSekolah}</strong>
            <span className="text-slate-400 ml-1">({selectedSchool.id})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isExecuting || inputBayarNominal <= 0 || schoolUnpaidInvoices.length === 0}
              onClick={handleExecute}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              {isExecuting ? (
                <span>Menyimpan Pembayaran...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Simpan Pembayaran & Potong Tagihan ({formatRupiah(inputBayarNominal)})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
