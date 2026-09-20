import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Layers, 
  Filter, 
  ArrowDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  School,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Invoice, Pembayaran, PembayaranStatus } from '../../types';
import { 
  RUANG_CONFIGS, 
  RuangConfig, 
  RuangKategoriId, 
  normalizeRuang, 
  formatRupiah 
} from './invoice-pembayaran/types';
import { RuangReportCard } from './invoice-pembayaran/RuangReportCard';
import { InvoiceTable } from './invoice-pembayaran/InvoiceTable';
import { PembayaranTable } from './invoice-pembayaran/PembayaranTable';
import { InvoiceModal } from './invoice-pembayaran/InvoiceModal';
import { PembayaranModal } from './invoice-pembayaran/PembayaranModal';
import { InvoiceDetailModal } from './invoice-pembayaran/InvoiceDetailModal';
import { BuktiPreviewModal } from './invoice-pembayaran/BuktiPreviewModal';
import { InputSheetInvoicePembayaranModal } from '../modals/InputSheetInvoicePembayaranModal';

interface InvoicePembayaranViewProps {
  initialInvoiceId?: string;
  onNavigateToPayment?: (invoiceId?: string) => void;
}

export const InvoicePembayaranView: React.FC<InvoicePembayaranViewProps> = ({
  initialInvoiceId,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    invoiceList, 
    pembayaranList, 
    sekolahList, 
    addInvoice, 
    updateInvoice, 
    deleteInvoice,
    addPembayaran,
    updatePembayaran,
    deletePembayaran,
    verifyPembayaran
  } = useData();

  // Search & Global Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSekolah, setFilterSekolah] = useState<string>('ALL');
  const [filterTahun, setFilterTahun] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Per-room active sub-view ('invoices' or 'payments')
  const [roomActiveView, setRoomActiveView] = useState<Record<RuangKategoriId, 'invoices' | 'payments'>>({
    'Franchise Fee': 'invoices',
    'Piutang Lampau': 'invoices',
    'Renewal Fee': 'invoices',
    'Jenjang Baru': 'invoices',
  });

  // Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [activeKategoriForInvoice, setActiveKategoriForInvoice] = useState<RuangKategoriId>('Renewal Fee');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPembayaran, setEditingPembayaran] = useState<Pembayaran | null>(null);
  const [activeKategoriForPayment, setActiveKategoriForPayment] = useState<RuangKategoriId>('Renewal Fee');
  const [targetInvoiceIdForPayment, setTargetInvoiceIdForPayment] = useState<string | undefined>(initialInvoiceId);

  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [previewBuktiUrl, setPreviewBuktiUrl] = useState<string | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Active anchor highlighting
  const [activeAnchor, setActiveAnchor] = useState<string>('all');

  // Base list filtered by current user school if not admin
  const baseInvoices = useMemo(() => {
    return isAdmin 
      ? invoiceList 
      : invoiceList.filter(i => i.mitraId === currentUser?.sekolahId);
  }, [isAdmin, invoiceList, currentUser]);

  const basePayments = useMemo(() => {
    return isAdmin 
      ? pembayaranList 
      : pembayaranList.filter(p => p.mitraId === currentUser?.sekolahId);
  }, [isAdmin, pembayaranList, currentUser]);

  // Global filtered lists
  const filteredInvoices = useMemo(() => {
    return baseInvoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        inv.namaSekolah.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        (inv.nomorInvoice && inv.nomorInvoice.toLowerCase().includes(q)) ||
        (inv.keterangan && inv.keterangan.toLowerCase().includes(q)) ||
        (inv.bulan && inv.bulan.toLowerCase().includes(q));

      const matchSekolah = filterSekolah === 'ALL' || inv.mitraId === filterSekolah;
      const matchTahun = filterTahun === 'ALL' || 
        (inv.tahunAjaran && inv.tahunAjaran.includes(filterTahun)) ||
        (inv.nomorInvoice && inv.nomorInvoice.includes(filterTahun)) ||
        (inv.tanggalKirim && inv.tanggalKirim.startsWith(filterTahun));

      const matchStatus = filterStatus === 'ALL' || inv.status === filterStatus;

      return matchSearch && matchSekolah && matchTahun && matchStatus;
    });
  }, [baseInvoices, searchQuery, filterSekolah, filterTahun, filterStatus]);

  const filteredPayments = useMemo(() => {
    return basePayments.filter(pay => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        !q ||
        pay.namaSekolah.toLowerCase().includes(q) ||
        pay.noReferensi.toLowerCase().includes(q) ||
        pay.id.toLowerCase().includes(q) ||
        (pay.catatan && pay.catatan.toLowerCase().includes(q)) ||
        (pay.invoiceId && pay.invoiceId.toLowerCase().includes(q));

      const matchSekolah = filterSekolah === 'ALL' || pay.mitraId === filterSekolah;
      const matchTahun = filterTahun === 'ALL' || 
        pay.tanggalBayar.startsWith(filterTahun) ||
        (pay.invoiceId && pay.invoiceId.includes(filterTahun));

      const matchStatus = filterStatus === 'ALL' || pay.status === filterStatus;

      return matchSearch && matchSekolah && matchTahun && matchStatus;
    });
  }, [basePayments, searchQuery, filterSekolah, filterTahun, filterStatus]);

  // Grand Totals across all 4 categories
  const grandTotals = useMemo(() => {
    const totalTagihanFull = filteredInvoices.reduce(
      (acc, i) => acc + (i.tagihanFull || i.nominal || 0), 0
    );
    const totalTagihanRealisasi = filteredInvoices.reduce(
      (acc, i) => acc + (i.tagihanRealisasi || i.nominal || 0), 0
    );
    const totalPembayaranMasuk = filteredPayments
      .filter(p => p.status === 'Terverifikasi')
      .reduce((acc, p) => acc + p.jumlah, 0);

    const totalSisaPiutang = Math.max(0, totalTagihanRealisasi - totalPembayaranMasuk);
    const totalUnpaidInvoices = filteredInvoices.filter(
      i => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo'
    ).length;
    const totalPendingPayments = filteredPayments.filter(
      p => p.status === 'Menunggu Verifikasi'
    ).length;

    return {
      totalTagihanFull,
      totalTagihanRealisasi,
      totalPembayaranMasuk,
      totalSisaPiutang,
      totalUnpaidInvoices,
      totalPendingPayments,
      persenLunas: totalTagihanRealisasi > 0 
        ? Math.min(100, Math.round((totalPembayaranMasuk / totalTagihanRealisasi) * 100))
        : 0,
    };
  }, [filteredInvoices, filteredPayments]);

  // Smooth scroll handler
  const scrollToAnchor = (anchorId: string) => {
    setActiveAnchor(anchorId);
    if (anchorId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handlers for Invoice CRUD
  const handleOpenAddInvoice = (kategori: RuangKategoriId = 'Renewal Fee') => {
    setEditingInvoice(null);
    setActiveKategoriForInvoice(kategori);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setActiveKategoriForInvoice(normalizeRuang(inv.kategori));
    setIsInvoiceModalOpen(true);
  };

  const handleDeleteInvoice = async (id: string, nomor: string) => {
    if (window.confirm(`Hapus invoice ${nomor}? Tindakan ini tidak dapat dibatalkan.`)) {
      await deleteInvoice(id);
    }
  };

  const handleSaveInvoice = async (data: Partial<Invoice>) => {
    if (editingInvoice) {
      await updateInvoice({
        ...editingInvoice,
        ...data,
      } as Invoice);
    } else {
      await addInvoice(data as Omit<Invoice, 'id'>);
    }
  };

  // Handlers for Payment CRUD
  const handleOpenAddPayment = (kategori: RuangKategoriId = 'Renewal Fee', invoiceId?: string) => {
    setEditingPembayaran(null);
    setActiveKategoriForPayment(kategori);
    setTargetInvoiceIdForPayment(invoiceId);
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (pay: Pembayaran) => {
    setEditingPembayaran(pay);
    setActiveKategoriForPayment(normalizeRuang(pay.kategori));
    setIsPaymentModalOpen(true);
  };

  const handleDeletePayment = async (id: string, namaSekolah: string, noRef: string) => {
    if (window.confirm(`Hapus catatan pembayaran ${namaSekolah} (${noRef})?`)) {
      await deletePembayaran(id);
    }
  };

  const handleVerifyPayment = async (id: string, status: PembayaranStatus) => {
    await verifyPembayaran(id, status);
  };

  const handleSavePayment = async (data: Partial<Pembayaran>) => {
    if (editingPembayaran) {
      await updatePembayaran({
        ...editingPembayaran,
        ...data,
      } as Pembayaran);
    } else {
      await addPembayaran(data as Omit<Pembayaran, 'id'>);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER & COMPREHENSIVE OVERVIEW */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-900/50">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-bold text-amber-300 mb-2">
                <Sparkles size={14} className="text-amber-400" />
                <span>Modul Terpadu 4 Item Ruang</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Receipt size={28} className="text-blue-400" />
                <span>Invoice & Pembayaran Mitra</span>
              </h2>
              <p className="text-blue-200/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                Pusat monitoring tagihan & realisasi pembayaran terpadu 4 kategori: Franchise Fee, Piutang Lampau, Renewal Fee, dan Jenjang Baru. Cukup scroll ke bawah untuk melihat masing-masing ruang.
              </p>
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
              {isAdmin && (
                <button
                  id="btn-global-sheet-import"
                  onClick={() => setIsSheetModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                  title="Impor transaksi sheet sejak 2022"
                >
                  <FileSpreadsheet size={16} className="text-emerald-400" />
                  <span className="hidden sm:inline">Input Sheet Transaksi</span>
                  <span className="sm:hidden">Sheet</span>
                </button>
              )}

              <button
                id="btn-global-add-invoice"
                onClick={() => handleOpenAddInvoice('Renewal Fee')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Buat Invoice</span>
              </button>

              <button
                id="btn-global-add-pembayaran"
                onClick={() => handleOpenAddPayment('Renewal Fee')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <CreditCard size={16} />
                <span>+ Catat Pembayaran</span>
              </button>
            </div>
          </div>

          {/* Aggregate Stats Cards (4 Core Numbers) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Total Tagihan Full (Kotor)
              </span>
              <div className="text-lg sm:text-xl font-black text-white mt-1 truncate">
                {formatRupiah(grandTotals.totalTagihanFull)}
              </div>
              <span className="text-[11px] text-blue-200/80 mt-0.5 block">
                Total {filteredInvoices.length} invoice terbit
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Total Tagihan Realisasi
              </span>
              <div className="text-lg sm:text-xl font-black text-amber-300 mt-1 truncate">
                {formatRupiah(grandTotals.totalTagihanRealisasi)}
              </div>
              <span className="text-[11px] text-blue-200/80 mt-0.5 block">
                Netto kewajiban seluruh mitra
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Pembayaran Terverifikasi
              </span>
              <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1 truncate">
                {formatRupiah(grandTotals.totalPembayaranMasuk)}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 mt-0.5">
                <CheckCircle2 size={12} />
                <span>{grandTotals.persenLunas}% lunas terbayar</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Sisa Piutang Berjalan
              </span>
              <div className="text-lg sm:text-xl font-black text-rose-400 mt-1 truncate">
                {formatRupiah(grandTotals.totalSisaPiutang)}
              </div>
              <span className="text-[11px] text-rose-200/90 mt-0.5 block">
                {grandTotals.totalUnpaidInvoices} invoice belum lunas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY QUICK-JUMP ANCHOR & SEARCH FILTER BAR */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md p-3 sm:p-4 space-y-3">
        {/* Navigation pills for smooth scrolling to 4 rooms */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollToAnchor('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                activeAnchor === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Layers size={14} />
              <span>Semua Ruang</span>
            </button>

            {RUANG_CONFIGS.map((config, index) => {
              const invoicesInRuang = filteredInvoices.filter(i => normalizeRuang(i.kategori) === config.id);
              const paymentsInRuang = filteredPayments.filter(p => normalizeRuang(p.kategori) === config.id);
              const realisasiInRuang = invoicesInRuang.reduce((acc, i) => acc + (i.tagihanRealisasi || i.nominal || 0), 0);
              const bayarInRuang = paymentsInRuang.filter(p => p.status === 'Terverifikasi').reduce((acc, p) => acc + p.jumlah, 0);
              const sisaInRuang = Math.max(0, realisasiInRuang - bayarInRuang);

              return (
                <button
                  key={config.id}
                  onClick={() => scrollToAnchor(config.anchorId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeAnchor === config.anchorId
                      ? `${config.colors.pillActive}`
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{index + 1}. {config.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeAnchor === config.anchorId ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {invoicesInRuang.length} tagihan
                  </span>
                  {sisaInRuang > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Ada sisa piutang" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-400 shrink-0">
            <ArrowDown size={14} className="animate-bounce" />
            <span>Scroll ke bawah untuk melihat setiap ruang</span>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor invoice, nama sekolah mitra, no referensi pembayaran..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Sekolah (if Admin) */}
          {isAdmin && (
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={filterSekolah}
                onChange={(e) => setFilterSekolah(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Sekolah Mitra</option>
                {sekolahList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Tahun */}
          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
              <option value="2023">Tahun 2023</option>
              <option value="2022">Tahun 2022</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-auto shrink-0">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Belum Bayar">Invoice: Belum Bayar</option>
              <option value="Lunas">Invoice: Lunas</option>
              <option value="Jatuh Tempo">Invoice: Jatuh Tempo</option>
              <option value="Terverifikasi">Bayar: Terverifikasi</option>
              <option value="Menunggu Verifikasi">Bayar: Menunggu Verifikasi</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. THE 4 ITEM RUANG (SEPARATED & CONTINUOUSLY SCROLLABLE WITH REPORT ON TOP OF EACH) */}
      <div className="space-y-12">
        {RUANG_CONFIGS.map((config) => {
          // Filter data for this room
          const roomInvoices = filteredInvoices.filter(i => normalizeRuang(i.kategori) === config.id);
          const roomPayments = filteredPayments.filter(p => normalizeRuang(p.kategori) === config.id);

          // Calculate metrics for this room
          const tagihanFull = roomInvoices.reduce((acc, i) => acc + (i.tagihanFull || i.nominal || 0), 0);
          const tagihanRealisasi = roomInvoices.reduce((acc, i) => acc + (i.tagihanRealisasi || i.nominal || 0), 0);
          const totalDibayar = roomPayments
            .filter(p => p.status === 'Terverifikasi')
            .reduce((acc, p) => acc + p.jumlah, 0);
          const sisaPiutang = Math.max(0, tagihanRealisasi - totalDibayar);
          const persenLunas = tagihanRealisasi > 0 
            ? Math.min(100, Math.round((totalDibayar / tagihanRealisasi) * 100)) 
            : 0;

          const lunasCount = roomInvoices.filter(i => i.status === 'Lunas').length;
          const unpaidCount = roomInvoices.filter(i => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo').length;
          const verifiedPaymentsCount = roomPayments.filter(p => p.status === 'Terverifikasi').length;
          const pendingPaymentsCount = roomPayments.filter(p => p.status === 'Menunggu Verifikasi').length;

          const currentSubView = roomActiveView[config.id];

          return (
            <section
              key={config.id}
              id={config.anchorId}
              className="scroll-mt-44 space-y-3"
            >
              {/* Report Card at top of the room */}
              <RuangReportCard
                config={config}
                invoicesCount={roomInvoices.length}
                paymentsCount={roomPayments.length}
                tagihanFull={tagihanFull}
                tagihanRealisasi={tagihanRealisasi}
                totalDibayar={totalDibayar}
                sisaPiutang={sisaPiutang}
                persenLunas={persenLunas}
                lunasCount={lunasCount}
                unpaidCount={unpaidCount}
                verifiedPaymentsCount={verifiedPaymentsCount}
                pendingPaymentsCount={pendingPaymentsCount}
                onAddInvoice={() => handleOpenAddInvoice(config.id)}
                onAddPembayaran={() => handleOpenAddPayment(config.id)}
                activeView={currentSubView}
                onChangeView={(view) => setRoomActiveView(prev => ({ ...prev, [config.id]: view }))}
              />

              {/* Data Table / Content for the room based on active sub-view */}
              {currentSubView === 'invoices' ? (
                <InvoiceTable
                  invoices={roomInvoices}
                  isAdmin={isAdmin}
                  onDetail={(inv) => setDetailInvoice(inv)}
                  onEdit={handleOpenEditInvoice}
                  onDelete={handleDeleteInvoice}
                  onPay={(inv) => handleOpenAddPayment(config.id, inv.nomorInvoice || inv.id)}
                />
              ) : (
                <PembayaranTable
                  payments={roomPayments}
                  isAdmin={isAdmin}
                  onPreviewBukti={(url) => setPreviewBuktiUrl(url)}
                  onEdit={handleOpenEditPayment}
                  onDelete={handleDeletePayment}
                  onVerify={handleVerifyPayment}
                />
              )}
            </section>
          );
        })}
      </div>

      {/* 4. MODALS */}
      {/* Invoice Create / Edit Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        editingInvoice={editingInvoice}
        defaultKategori={activeKategoriForInvoice}
        sekolahList={sekolahList}
        existingInvoices={invoiceList}
        onSave={handleSaveInvoice}
      />

      {/* Pembayaran Create / Edit Modal */}
      <PembayaranModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        editingPembayaran={editingPembayaran}
        defaultKategori={activeKategoriForPayment}
        defaultInvoiceId={targetInvoiceIdForPayment}
        sekolahList={sekolahList}
        invoiceList={invoiceList}
        currentSekolahId={currentUser?.sekolahId}
        isAdmin={isAdmin}
        onSave={handleSavePayment}
      />

      {/* Invoice Detail / Printable Preview Modal */}
      <InvoiceDetailModal
        invoice={detailInvoice}
        onClose={() => setDetailInvoice(null)}
      />

      {/* Proof of Payment Fullscreen Preview */}
      <BuktiPreviewModal
        url={previewBuktiUrl}
        onClose={() => setPreviewBuktiUrl(null)}
      />

      {/* Sheet Bulk Import Modal */}
      {isSheetModalOpen && (
        <InputSheetInvoicePembayaranModal
          isOpen={isSheetModalOpen}
          onClose={() => setIsSheetModalOpen(false)}
        />
      )}
    </div>
  );
};
