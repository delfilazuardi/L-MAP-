import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CalendarRange, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Printer, 
  CreditCard, 
  Layers, 
  Building2, 
  FileText, 
  Sparkles,
  Check,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { Invoice, Pembayaran, SekolahMitra } from '../../../types';
import { 
  formatRupiah, 
  generateJadwalCicilan, 
  allocateCicilanToInvoices, 
  CicilanAllocationResult,
  JadwalCicilanTermin
} from '../../../lib/invoiceUtils';
import { NominalInput } from './NominalInput';
import { useSettings } from '../../../context/SettingsContext';

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
      metodeBayar: string;
      noReferensi: string;
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
  payments,
  defaultSekolahId,
  onExecutePayment,
}) => {
  const { settings } = useSettings();

  // Selected school
  const [selectedMitraId, setSelectedMitraId] = useState<string>(
    defaultSekolahId || sekolahList[0]?.id || 'MO004'
  );

  // Sync selected school when defaultSekolahId or isOpen changes
  useEffect(() => {
    if (defaultSekolahId) {
      setSelectedMitraId(defaultSekolahId);
      setCustomTotalHutang(null);
    }
  }, [defaultSekolahId, isOpen]);

  // Active sub-tab in modal: 'jadwal' | 'simulasi' | 'berita-acara'
  const [activeTab, setActiveTab] = useState<'jadwal' | 'simulasi' | 'berita-acara'>('jadwal');

  // Plan parameters
  const [jumlahTermin, setJumlahTermin] = useState<number>(10);
  const [tanggalMulai, setTanggalMulai] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Custom total hutang override (null means use calculated unpaid debt)
  const [customTotalHutang, setCustomTotalHutang] = useState<number | null>(null);

  // Payment form states
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputBayarNominal, setInputBayarNominal] = useState<number>(4000000);
  const [inputTanggalBayar, setInputTanggalBayar] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputMetodeBayar, setInputMetodeBayar] = useState<string>('Bank Mandiri Transfer');
  const [inputNoRef, setInputNoRef] = useState<string>(`CICILAN-${Date.now().toString().slice(-6)}`);
  const [inputCatatan, setInputCatatan] = useState<string>('Cicilan Rekonsiliasi Tagihan Kemitraan (Alokasi FIFO)');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedSchool = useMemo(() => {
    return sekolahList.find(s => s.id === selectedMitraId) || sekolahList[0];
  }, [sekolahList, selectedMitraId]);

  // All unpaid invoices of selected school
  const schoolUnpaidInvoices = useMemo(() => {
    return invoices
      .filter(i => {
        if (i.mitraId !== selectedMitraId) return false;
        if (i.status === 'Lunas') return false;
        const full = i.tagihanFull || i.nominal || 0;
        const paid = i.nominalPembayaran || 0;
        return (full - paid) > 0;
      })
      .sort((a, b) => (a.tanggalKirim || '').localeCompare(b.tanggalKirim || ''));
  }, [invoices, selectedMitraId]);

  // Total current unpaid debt
  const calculatedTotalDebt = useMemo(() => {
    return schoolUnpaidInvoices.reduce((acc, inv) => {
      const full = inv.tagihanFull || inv.nominal || 0;
      const paid = inv.nominalPembayaran || 0;
      return acc + Math.max(0, full - paid);
    }, 0);
  }, [schoolUnpaidInvoices]);

  // Effective total hutang for the plan
  const effectiveTotalHutang = customTotalHutang !== null ? customTotalHutang : (calculatedTotalDebt > 0 ? calculatedTotalDebt : 40000000);

  // Count past installment payments recorded for this school
  const pastInstallmentPayments = useMemo(() => {
    return payments.filter(p => 
      p.mitraId === selectedMitraId && 
      (p.catatan?.toLowerCase().includes('cicilan') || p.catatan?.toLowerCase().includes('rekonsiliasi'))
    );
  }, [payments, selectedMitraId]);

  const totalPaidFromInstallments = useMemo(() => {
    return pastInstallmentPayments.reduce((acc, p) => acc + p.jumlah, 0);
  }, [pastInstallmentPayments]);

  // Nominal per termin
  const nominalPerTermin = useMemo(() => {
    if (jumlahTermin <= 0) return 0;
    return Math.floor(effectiveTotalHutang / jumlahTermin);
  }, [effectiveTotalHutang, jumlahTermin]);

  // Generate 10x (or Nx) schedule
  const jadwalList: JadwalCicilanTermin[] = useMemo(() => {
    const paidTerminCount = nominalPerTermin > 0 ? Math.floor(totalPaidFromInstallments / nominalPerTermin) : 0;
    return generateJadwalCicilan(effectiveTotalHutang, jumlahTermin, tanggalMulai, paidTerminCount);
  }, [effectiveTotalHutang, jumlahTermin, tanggalMulai, nominalPerTermin, totalPaidFromInstallments]);

  // Simulation preview of allocating inputBayarNominal with date
  const allocationSimulation = useMemo(() => {
    return allocateCicilanToInvoices(schoolUnpaidInvoices, inputBayarNominal, inputTanggalBayar);
  }, [schoolUnpaidInvoices, inputBayarNominal, inputTanggalBayar]);

  if (!isOpen) return null;

  const handleExecutePayment = async () => {
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
          noReferensi: inputNoRef || `CICILAN-${Date.now().toString().slice(-6)}`,
          catatan: inputCatatan || `Cicilan Rekonsiliasi Tagihan ${selectedSchool.namaSekolah}`,
        },
        allocationSimulation
      );

      setSuccessMessage(
        `Berhasil mengeksekusi cicilan sebesar ${formatRupiah(inputBayarNominal)}! Dana telah dialokasikan otomatis ke ${allocationSimulation.updatedInvoices.length} invoice tertua.`
      );
      setInputNoRef(`CICILAN-${Date.now().toString().slice(-6)}`);
    } catch (err: any) {
      alert(`Gagal mengeksekusi cicilan: ${err?.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col print:border-none print:shadow-none print:max-w-none">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-20 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <CalendarRange size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Rencana Cicilan Rekonsiliasi Hutang
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Multi-Invoice & FIFO
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulasi cicilan bulanan, jadwal termin kesepakatan, dan alokasi otomatis ke tagihan lama
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/70 print:hidden overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'jadwal'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <CalendarRange size={15} />
            <span>1. Jadwal & Eksekusi Cicilan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulasi')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'simulasi'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Layers size={15} />
            <span>2. Simulasi Alokasi Tagihan ({schoolUnpaidInvoices.length} Invoice)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('berita-acara')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'berita-acara'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileText size={15} />
            <span>3. Lembar Berita Acara (Cetak / PDF)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Top Config Card (Hidden on print) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md print:hidden space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* 1. Pilih Sekolah */}
              <div>
                <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">
                  1. Sekolah Mitra Pemohon
                </label>
                <select
                  value={selectedMitraId}
                  onChange={(e) => {
                    setSelectedMitraId(e.target.value);
                    setCustomTotalHutang(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {sekolahList.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900">
                      {s.namaSekolah} ({s.id})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-blue-300 block mt-1">
                  Terdeteksi {schoolUnpaidInvoices.length} invoice belum lunas
                </span>
              </div>

              {/* 2. Total Hutang Rekonsiliasi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                    2. Total Hutang Rekonsiliasi
                  </label>
                  {customTotalHutang !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomTotalHutang(null)}
                      className="text-[10px] text-amber-300 hover:text-white underline cursor-pointer font-bold"
                      title="Kembalikan ke hitungan otomatis sistem"
                    >
                      Reset Otomatis
                    </button>
                  )}
                </div>

                <NominalInput
                  value={effectiveTotalHutang}
                  onChange={(val) => setCustomTotalHutang(val)}
                  placeholder="Rp 0"
                  inputClassName="bg-white text-slate-900 font-mono font-black text-xs sm:text-sm border-2 border-amber-400 py-2"
                  showPreview={false}
                />

                <div className="flex items-center justify-between text-[10px] mt-1.5 gap-2 flex-wrap">
                  <span className="text-amber-300 font-semibold">
                    Tercatat sistem: <strong>{formatRupiah(calculatedTotalDebt)}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTotalHutang(80197000);
                        setJumlahTermin(10);
                        setInputBayarNominal(10000000);
                        setInputTanggalBayar('2026-01-15');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border border-amber-300 transition cursor-pointer"
                      title="Set total piutang Rp 80.197.000 (cicilan Rp 10 Juta di Januari)"
                    >
                      💡 Rp 80.197.000
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTotalHutang(40000000);
                        setJumlahTermin(10);
                        setInputBayarNominal(4000000);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 transition cursor-pointer font-bold"
                    >
                      Rp 40.000.000
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Jumlah Termin & Mulai */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">
                    Termin (Bulan)
                  </label>
                  <select
                    value={jumlahTermin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setJumlahTermin(val);
                      if (val > 0) {
                        setInputBayarNominal(Math.floor(effectiveTotalHutang / val));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {[3, 4, 5, 6, 8, 10, 12, 18, 24].map((t) => (
                      <option key={t} value={t} className="text-slate-900">
                        {t} Bulan ({t}x)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1">
                    Mulai Cicilan
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

            </div>

            {/* Quick Result Highlight */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-200">Skema Kesepakatan:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 border border-amber-400/30 font-black">
                  {formatRupiah(effectiveTotalHutang)} dicicil {jumlahTermin}x
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-blue-200">Kewajiban per Bulan:</span>
                <strong className="text-base sm:text-lg font-black text-amber-300 font-mono">
                  {formatRupiah(nominalPerTermin)} / bulan
                </strong>
              </div>
            </div>
          </div>

          {/* Alert Success */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-black">Eksekusi Berhasil!</strong>
                <p className="mt-0.5 text-emerald-800">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-900 p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB 1: JADWAL & EKSEKUSI PEMBAYARAN */}
          {activeTab === 'jadwal' && (
            <div className="space-y-6">
              
              {/* Form Input Pembayaran Cicilan Bulan Ini */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Catat Pembayaran Cicilan Bulan Berjalan
                      </h4>
                      <p className="text-xs text-slate-500">
                        Input transfer cicilan sekolah — sistem akan otomatis mengalokasikan (FIFO) melunasi invoice lama
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Cicilan Bulan Ini:</span>
                    <strong className="text-sm font-mono font-black text-blue-700">
                      {formatRupiah(nominalPerTermin)}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <NominalInput
                      label="Nominal Cicilan Dibayar"
                      required
                      value={inputBayarNominal}
                      onChange={(val) => setInputBayarNominal(val)}
                      inputClassName="border-slate-300 text-blue-900 font-black"
                    />
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold">Cepat:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setInputBayarNominal(10000000);
                          setInputTanggalBayar('2026-01-15');
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 transition cursor-pointer"
                        title="Bayar Rp 10.000.000 (Januari)"
                      >
                        10 Jt (Jan)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputBayarNominal(8000000);
                          setInputTanggalBayar('2026-02-15');
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 transition cursor-pointer"
                        title="Bayar Rp 8.000.000 (Februari / Bulan Depan)"
                      >
                        8 Jt (Bln Dpn)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputBayarNominal(nominalPerTermin)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                        title={`Sesuai Target Termin (${formatRupiah(nominalPerTermin)})`}
                      >
                        Target ({formatRupiah(nominalPerTermin)})
                      </button>
                      {calculatedTotalDebt > 0 && (
                        <button
                          type="button"
                          onClick={() => setInputBayarNominal(calculatedTotalDebt)}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition cursor-pointer"
                          title="Lunasi seluruh sisa piutang"
                        >
                          Sisa Penuh ({formatRupiah(calculatedTotalDebt)})
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pembayaran
                    </label>
                    <input
                      type="date"
                      value={inputTanggalBayar}
                      onChange={(e) => setInputTanggalBayar(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Metode Transfer
                    </label>
                    <select
                      value={inputMetodeBayar}
                      onChange={(e) => setInputMetodeBayar(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Bank Mandiri Transfer">Bank Mandiri Transfer</option>
                      <option value="BCA Transfer">BCA Transfer</option>
                      <option value="BSI Virtual Account">BSI Virtual Account</option>
                      <option value="BNI Transfer">BNI Transfer</option>
                      <option value="BSI Giro / Transfer">BSI Giro / Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. Referensi / Bukti
                    </label>
                    <input
                      type="text"
                      value={inputNoRef}
                      onChange={(e) => setInputNoRef(e.target.value)}
                      placeholder="MDR-20261015-001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Live Breakdown Box: Alokasi Otomatis FIFO ke Tagihan Bulanan */}
                {allocationSimulation.updatedInvoices.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white border border-blue-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>Rincian Otomatis Pengurangan Tagihan Bulanan (FIFO):</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Dana diserap: <strong className="text-emerald-700 font-mono font-bold">{formatRupiah(allocationSimulation.totalAllocated)}</strong>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto pr-1">
                      {allocationSimulation.updatedInvoices.map((item, idx) => {
                        const full = item.invoice.tagihanFull || item.invoice.nominal || 0;
                        return (
                          <div key={item.invoice.id || idx} className="py-2 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <strong className="text-slate-900 font-bold">
                                    {item.invoice.bulan || '-'} {item.invoice.tahunAjaran || ''}
                                  </strong>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    ({item.invoice.nomorInvoice || item.invoice.id})
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                    {item.invoice.kategori}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Tagihan Asli: {formatRupiah(full)} • Sblmnya: {formatRupiah(item.previousPaid)}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-emerald-700 text-xs block">
                                + {formatRupiah(item.allocatedAmount)}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                item.newStatus === 'Lunas' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {item.newStatus === 'Lunas' ? '✓ Lunas' : `Sebagian (Sisa ${formatRupiah(item.newRemaining)})`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-blue-700 bg-blue-50/70 p-2 rounded-xl border border-blue-100 leading-snug">
                      ℹ️ <strong>Otomatis Tercermin di Sheet Bawah</strong>: Saat tombol eksekusi diklik, setiap baris invoice bulan di atas (misal {allocationSimulation.updatedInvoices[0]?.invoice.bulan} {allocationSimulation.updatedInvoices[0]?.invoice.tahunAjaran}) akan langsung diperbarui kolom <em>Nominal Bayar</em>, <em>Sisa Piutang</em>, dan <em>Status</em>-nya di sheet tabel bawah.
                    </p>
                  </div>
                )}

                {/* Execution Button & Simulation Summary */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-blue-200/60">
                  <div className="text-xs text-slate-600">
                    <span>Alokasi: </span>
                    <strong className="text-slate-900 font-bold">
                      {formatRupiah(inputBayarNominal)}
                    </strong>
                    <span> akan melunasi/mengurangi </span>
                    <strong className="text-blue-700 font-black">
                      {allocationSimulation.updatedInvoices.length} invoice
                    </strong>
                    <span> milik {selectedSchool.namaSekolah}.</span>
                  </div>

                  <button
                    type="button"
                    disabled={isExecuting || inputBayarNominal <= 0}
                    onClick={handleExecutePayment}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-black shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isExecuting ? (
                      <span>Memproses Alokasi...</span>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Eksekusi Pembayaran Cicilan (FIFO)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Table of 10 Installments Schedule */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CalendarRange size={16} className="text-amber-500" />
                    <span>Jadwal {jumlahTermin} Termin Cicilan Rekonsiliasi</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total Cicilan: <strong>{formatRupiah(effectiveTotalHutang)}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-4 text-center">Termin</th>
                        <th className="py-3 px-4">Estimasi Jatuh Tempo</th>
                        <th className="py-3 px-4 text-right">Nominal Cicilan</th>
                        <th className="py-3 px-4 text-right">Sisa Hutang Setelah Bayar</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jadwalList.map((item) => (
                        <tr key={item.terminKe} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 text-center font-bold font-mono text-slate-700">
                            Termin #{item.terminKe} / {item.totalTermin}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">
                            {item.jatuhTempo}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-blue-900 font-mono text-xs">
                            {formatRupiah(item.nominalCicilan)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-600 font-mono">
                            {formatRupiah(item.sisaHutangSetelahBayar)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.status === 'Lunas' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                <Check size={11} /> Lunas
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                                <Clock size={11} /> Terjadwal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setInputBayarNominal(item.nominalCicilan);
                                setInputTanggalBayar(item.jatuhTempo);
                                setInputCatatan(`Cicilan Rekonsiliasi Termin #${item.terminKe} (${formatRupiah(item.nominalCicilan)})`);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold text-[11px] transition cursor-pointer"
                            >
                              Gunakan Termin Ini
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SIMULASI ALOKASI INVOICE (FIFO) */}
          {activeTab === 'simulasi' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900 block font-bold text-sm mb-1">
                  Mekanisme Alokasi FIFO (First-In, First-Out)
                </strong>
                Ketika sekolah membayar Rp 4.000.000 per bulan, sistem secara otomatis melunasi tagihan yang paling lampau terlebih dahulu. Jika tagihan tertua telah lunas, kelebihan pembayaran otomatis meluncur mengurangi invoice berikutnya sampai seluruh tagihan selesai.
              </div>

              {/* Simulation Breakdown Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">No. Invoice & Kategori</th>
                      <th className="py-3 px-4">Periode</th>
                      <th className="py-3 px-4 text-right">Tagihan Full</th>
                      <th className="py-3 px-4 text-right">Telah Dibayar</th>
                      <th className="py-3 px-4 text-right bg-blue-50/50 text-blue-900">Alokasi Cicilan ({formatRupiah(inputBayarNominal)})</th>
                      <th className="py-3 px-4 text-right">Sisa Setelah Alokasi</th>
                      <th className="py-3 px-4 text-center">Status Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schoolUnpaidInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ada invoice yang belum lunas untuk sekolah ini.
                        </td>
                      </tr>
                    ) : (
                      schoolUnpaidInvoices.map((inv) => {
                        const full = inv.tagihanFull || inv.nominal || 0;
                        const prevPaid = inv.nominalPembayaran || 0;
                        const currentRemaining = Math.max(0, full - prevPaid);
                        const matchAlloc = allocationSimulation.updatedInvoices.find(u => u.invoice.id === inv.id);
                        const allocAmt = matchAlloc ? matchAlloc.allocatedAmount : 0;
                        const newRem = matchAlloc ? matchAlloc.newRemaining : currentRemaining;
                        const newStat = matchAlloc ? matchAlloc.newStatus : inv.status;

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-blue-900 block">
                                {inv.nomorInvoice || inv.id}
                              </span>
                              <span className="text-[10px] text-slate-400">{inv.kategori}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {inv.bulan} • {inv.tahunAjaran}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700">
                              {formatRupiah(full)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-emerald-600">
                              {formatRupiah(prevPaid)}
                            </td>
                            <td className="py-3 px-4 text-right font-black font-mono text-blue-700 bg-blue-50/30">
                              {allocAmt > 0 ? `+ ${formatRupiah(allocAmt)}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-rose-600 font-mono">
                              {formatRupiah(newRem)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {newStat === 'Lunas' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                  <Check size={11} /> Lunas
                                </span>
                              ) : newStat === 'Sebagian' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                  Sebagian
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                  Belum Bayar
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BERITA ACARA PRINTABLE (PDF / CETAK) */}
          {activeTab === 'berita-acara' && (
            <div className="space-y-4">
              <div className="flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer size={16} />
                  <span>Cetak / Simpan PDF Berita Acara</span>
                </button>
              </div>

              {/* Printable Document Box */}
              <div className="p-8 sm:p-10 border border-slate-300 rounded-3xl bg-white shadow-xs space-y-6 text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
                {/* Header Kop Surat */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                  <div className="flex items-center gap-3">
                    <img
                      src={settings.logoUrl || '/lmap-logo.jpg'}
                      alt={`${settings.appTitle || 'L-MAP'} Logo`}
                      className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-0.5"
                    />
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-wider">
                        {settings.appTitle || 'L-MAP'}
                      </h2>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {settings.appSubtitle || 'Lazuardi Mitra Administration Platform'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {settings.namaLembaga || 'Mitra Office Yayasan Perguruan Lazuardi Hayati'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-widest block">
                      BERITA ACARA REKONSILIASI
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 block mt-1">
                      NO: BA-REKON/LZ/{new Date().getFullYear()}/{Date.now().toString().slice(-4)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                    </span>
                  </div>
                </div>

                {/* Opening statement */}
                <div className="text-xs leading-relaxed space-y-2">
                  <p>
                    Pada hari ini, bertempat di kantor Mitra Office Yayasan Perguruan Lazuardi Hayati, telah dilakukan rekonsiliasi dan kesepakatan bersama mengenai kewajiban pembayaran kemitraan antara pihak <strong>Mitra Office Lazuardi</strong> dengan <strong>{selectedSchool.namaSekolah}</strong>.
                  </p>
                  <p>
                    Berdasarkan hasil audit dan rekonsiliasi bersama, disepakati bahwa total kewajiban piutang tertunggak adalah sebesar:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-100 text-center border border-slate-300">
                    <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Hutang Hasil Rekonsiliasi:</span>
                    <strong className="text-xl sm:text-2xl font-mono font-black text-slate-900 block mt-0.5">
                      {formatRupiah(effectiveTotalHutang)}
                    </strong>
                  </div>
                  <p>
                    Kedua belah pihak sepakat bahwa pembayaran akan diselesaikan secara <strong>mencicil sebanyak {jumlahTermin} (sepuluh) kali termin bulanan</strong> sebesar <strong>{formatRupiah(nominalPerTermin)} per bulan</strong> dengan jadwal pembayaran sebagai berikut:
                  </p>
                </div>

                {/* Schedule in document */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                        <th className="py-2 px-3 text-center">Termin Ke</th>
                        <th className="py-2 px-3">Tanggal Jatuh Tempo</th>
                        <th className="py-2 px-3 text-right">Nominal Cicilan</th>
                        <th className="py-2 px-3 text-right">Sisa Hutang Berjalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {jadwalList.map((j) => (
                        <tr key={j.terminKe}>
                          <td className="py-1.5 px-3 text-center font-bold font-mono">#{j.terminKe}</td>
                          <td className="py-1.5 px-3">{j.jatuhTempo}</td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold">{formatRupiah(j.nominalCicilan)}</td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600">{formatRupiah(j.sisaHutangSetelahBayar)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Pihak Pertama,</span>
                    <strong className="font-bold text-slate-900 block mt-1">Kepala Bagian Mitra Office Lazuardi</strong>
                    <div className="h-16" />
                    <span className="font-bold underline block">Anita Sulastri / Delfi Dwi H.</span>
                    <span className="text-slate-400 text-[10px]">Yayasan Perguruan Lazuardi Hayati</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Pihak Kedua,</span>
                    <strong className="font-bold text-slate-900 block mt-1">Pimpinan / Kepala Sekolah</strong>
                    <div className="h-16" />
                    <span className="font-bold underline block">{selectedSchool.pimpinan || selectedSchool.namaSekolah}</span>
                    <span className="text-slate-400 text-[10px]">{selectedSchool.namaSekolah}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex items-center justify-between flex-wrap gap-2 text-xs print:hidden">
          <div className="text-slate-500">
            Sekolah: <strong className="text-slate-900">{selectedSchool.namaSekolah}</strong> ({selectedSchool.id})
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
