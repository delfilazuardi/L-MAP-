import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Calendar,
  Building,
  X,
  Printer,
  Sparkles,
  RefreshCw,
  Edit,
  Trash2,
  Table as TableIcon,
  LayoutGrid,
  ArrowRight,
  Info,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { InputSheetInvoicePembayaranModal } from '../modals/InputSheetInvoicePembayaranModal';
import { 
  Invoice, 
  InvoiceKategori, 
  InvoiceStatus, 
  InvoiceOperationalStatus 
} from '../../types';
import { 
  generateNomorInvoiceBaru, 
  formatRupiah, 
  NAMA_BULAN_LIST 
} from '../../lib/invoiceUtils';

interface InvoiceViewProps {
  onNavigateToPayment?: (invoiceId?: string) => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ onNavigateToPayment }) => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    invoiceList, 
    sekolahList, 
    addInvoice, 
    updateInvoice, 
    deleteInvoice, 
    updateInvoiceStatus 
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedStatusInvoice, setSelectedStatusInvoice] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Form State
  const [formNomorInvoice, setFormNomorInvoice] = useState<string>('');
  const [hasGeneratedNumber, setHasGeneratedNumber] = useState<boolean>(false);
  const [formMitraId, setFormMitraId] = useState<string>(sekolahList[0]?.id || 'MO004');
  const [formBulan, setFormBulan] = useState<string>('September');
  const [formTahunAjaran, setFormTahunAjaran] = useState<string>('2026/2027');
  const [formStatusInvoice, setFormStatusInvoice] = useState<InvoiceOperationalStatus>('Terkirim');
  const [formTanggalKirim, setFormTanggalKirim] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTanggalDibayar, setFormTanggalDibayar] = useState<string>('');
  const [formTagihanFull, setFormTagihanFull] = useState<number>(45000000);
  const [formTagihanRealisasi, setFormTagihanRealisasi] = useState<number>(45000000);
  const [formNominalPembayaran, setFormNominalPembayaran] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<InvoiceStatus>('Belum Bayar');
  const [formKategori, setFormKategori] = useState<InvoiceKategori>('Renewal Fee');
  const [formJatuhTempo, setFormJatuhTempo] = useState<string>('2026-10-31');
  const [formKeterangan, setFormKeterangan] = useState<string>('');

  const baseList = isAdmin 
    ? invoiceList 
    : invoiceList.filter(i => i.mitraId === currentUser?.sekolahId);

  const filtered = baseList.filter(inv => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      inv.namaSekolah.toLowerCase().includes(query) ||
      inv.id.toLowerCase().includes(query) ||
      (inv.nomorInvoice && inv.nomorInvoice.toLowerCase().includes(query)) ||
      (inv.keterangan && inv.keterangan.toLowerCase().includes(query)) ||
      (inv.bulan && inv.bulan.toLowerCase().includes(query));
    
    const matchBulan = selectedBulan === 'ALL' || inv.bulan === selectedBulan;
    const matchTahun = selectedTahun === 'ALL' || 
      (inv.tahunAjaran && inv.tahunAjaran.includes(selectedTahun)) || 
      (inv.nomorInvoice && inv.nomorInvoice.includes(selectedTahun)) || 
      (inv.tanggalKirim && inv.tanggalKirim.startsWith(selectedTahun));
    const matchStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
    const matchStatusInvoice = selectedStatusInvoice === 'ALL' || (inv.statusInvoice || 'Terkirim') === selectedStatusInvoice;

    return matchSearch && matchBulan && matchTahun && matchStatus && matchStatusInvoice;
  });

  // Metrik Statistik
  const totalTagihanFull = filtered.reduce((acc, inv) => acc + (inv.tagihanFull || inv.nominal || 0), 0);
  const totalTagihanRealisasi = filtered.reduce((acc, inv) => acc + (inv.tagihanRealisasi || inv.nominal || 0), 0);
  const totalNominalPembayaran = filtered.reduce((acc, inv) => acc + (inv.nominalPembayaran || 0), 0);
  const sisaPiutang = Math.max(0, totalTagihanRealisasi - totalNominalPembayaran);

  // Buka Modal Tambah Baru
  const handleOpenAddModal = () => {
    setEditingInvoice(null);
    setFormNomorInvoice('');
    setHasGeneratedNumber(false);
    setFormMitraId(sekolahList[0]?.id || 'MO004');
    setFormBulan('September');
    setFormTahunAjaran('2026/2027');
    setFormStatusInvoice('Terkirim');
    setFormTanggalKirim(new Date().toISOString().split('T')[0]);
    setFormTanggalDibayar('');
    setFormTagihanFull(45000000);
    setFormTagihanRealisasi(45000000);
    setFormNominalPembayaran(0);
    setFormStatus('Belum Bayar');
    setFormKategori('Renewal Fee');
    setFormJatuhTempo('2026-10-31');
    setFormKeterangan('');
    setIsModalOpen(true);
  };

  // Buka Modal Edit Invoice
  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormNomorInvoice(inv.id);
    setHasGeneratedNumber(true);
    setFormMitraId(inv.mitraId);
    setFormBulan(inv.bulan || 'September');
    setFormTahunAjaran(inv.tahunAjaran || '2026/2027');
    setFormStatusInvoice(inv.statusInvoice || 'Terkirim');
    setFormTanggalKirim(inv.tanggalKirim || inv.tanggalTerbit || '');
    setFormTanggalDibayar(inv.tanggalDibayar || '');
    setFormTagihanFull(inv.tagihanFull || inv.nominal || 0);
    setFormTagihanRealisasi(inv.tagihanRealisasi || inv.nominal || 0);
    setFormNominalPembayaran(inv.nominalPembayaran || 0);
    setFormStatus(inv.status || 'Belum Bayar');
    setFormKategori(inv.kategori || 'Renewal Fee');
    setFormJatuhTempo(inv.jatuhTempo || '');
    setFormKeterangan(inv.keterangan || '');
    setIsModalOpen(true);
  };

  // Tombol Klik Generate Nomor Invoice Baru
  const handleGenerateNomorInvoice = () => {
    const generated = generateNomorInvoiceBaru(invoiceList);
    setFormNomorInvoice(generated.nomorInvoice);
    setHasGeneratedNumber(true);
  };

  // Handle Perubahan Nominal Pembayaran
  const handleNominalPembayaranChange = (val: number) => {
    setFormNominalPembayaran(val);
    // Otomatis rekomendasikan status
    if (val >= formTagihanRealisasi && formTagihanRealisasi > 0) {
      setFormStatus('Lunas');
      if (!formTanggalDibayar) {
        setFormTanggalDibayar(new Date().toISOString().split('T')[0]);
      }
    } else if (val > 0 && val < formTagihanRealisasi) {
      setFormStatus('Sebagian');
    } else if (val === 0) {
      setFormStatus('Belum Bayar');
    }
  };

  // Simpan Invoice (Tambah atau Update)
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNomorInvoice.trim()) {
      alert('Silakan klik tombol "Dapatkan Nomor Invoice Baru" terlebih dahulu untuk mendapatkan nomor invoice resmi.');
      return;
    }

    const targetSchool = sekolahList.find(s => s.id === formMitraId);
    const namaSekolah = targetSchool ? targetSchool.namaSekolah : 'Sekolah Mitra';

    const invoicePayload = {
      id: formNomorInvoice.trim(),
      nomorInvoice: formNomorInvoice.trim(),
      mitraId: formMitraId,
      namaSekolah,
      bulan: formBulan,
      tahunAjaran: formTahunAjaran,
      kategori: formKategori,
      tagihanFull: Number(formTagihanFull) || 0,
      tagihanRealisasi: Number(formTagihanRealisasi) || 0,
      nominalPembayaran: Number(formNominalPembayaran) || 0,
      nominal: Number(formTagihanRealisasi) || Number(formTagihanFull) || 0,
      tanggalKirim: formTanggalKirim,
      tanggalDibayar: formTanggalDibayar ? formTanggalDibayar : undefined,
      tanggalTerbit: formTanggalKirim,
      jatuhTempo: formJatuhTempo,
      statusInvoice: formStatusInvoice,
      status: formStatus,
      keterangan: formKeterangan || `Tagihan Invoice ${namaSekolah} (${formBulan} - TA ${formTahunAjaran})`,
    };

    if (editingInvoice) {
      await updateInvoice(invoicePayload);
    } else {
      await addInvoice(invoicePayload, formNomorInvoice.trim());
    }

    setIsModalOpen(false);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus invoice ${id}?`)) {
      await deleteInvoice(id);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Lunas':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={12} /> Lunas
          </span>
        );
      case 'Sebagian':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800">
            <Clock size={12} /> Sebagian
          </span>
        );
      case 'Menunggu Konfirmasi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            <Clock size={12} /> Menunggu Konfirmasi
          </span>
        );
      case 'Jatuh Tempo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
            <AlertCircle size={12} /> Jatuh Tempo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            <Clock size={12} /> Belum Bayar
          </span>
        );
    }
  };

  const getOperationalBadge = (opStatus?: InvoiceOperationalStatus) => {
    const status = opStatus || 'Terkirim';
    switch (status) {
      case 'Terkirim':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
            Terkirim
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            Draft
          </span>
        );
      case 'Menunggu Persetujuan':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Menunggu Persetujuan
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt size={22} className="text-blue-600" />
            <span>Invoice & Keuangan Mitra Office</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan nomor faktur resmi (INV/romawi/tahun/urutan/MO), tagihan full, realisasi, dan nominal pembayaran
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Switch View Mode */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              id="view-table-btn"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon size={14} />
              <span>Tabel Data</span>
            </button>
            <button
              id="view-cards-btn"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kartu Faktur</span>
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                id="btn-input-sheet-invoice"
                onClick={() => setIsSheetModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet size={16} className="text-blue-600" />
                <span className="hidden sm:inline">Input Sheet Invoice & Pembayaran</span>
                <span className="sm:hidden">Input Sheet</span>
              </button>

              <button
                id="btn-tambah-invoice"
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Terbitkan Invoice Baru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">Total Tagihan Full</span>
          <div className="text-lg sm:text-xl font-black text-slate-900">{formatRupiah(totalTagihanFull)}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Bruto tagihan kemitraan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">Tagihan Realisasi</span>
          <div className="text-lg sm:text-xl font-black text-blue-700">{formatRupiah(totalTagihanRealisasi)}</div>
          <span className="text-[10px] text-blue-600 mt-1 block">Realisasi netto tagihan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 block mb-1">Nominal Pembayaran (Kas Masuk)</span>
          <div className="text-lg sm:text-xl font-black text-emerald-800">{formatRupiah(totalNominalPembayaran)}</div>
          <span className="text-[10px] text-emerald-600 mt-1 block font-medium">Realisasi pembayaran diterima</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 block mb-1">Sisa Piutang Berjalan</span>
          <div className="text-lg sm:text-xl font-black text-rose-700">{formatRupiah(sisaPiutang)}</div>
          <span className="text-[10px] text-amber-700 mt-1 block">Sisa belum tertagih/lunas</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-invoice"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor invoice (INV/IX/2026/001/MO), nama sekolah, bulan..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          id="filter-tahun-invoice"
          value={selectedTahun}
          onChange={(e) => setSelectedTahun(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Tahun (2022-2026)</option>
          <option value="2026">Tahun 2026</option>
          <option value="2025">Tahun 2025</option>
          <option value="2024">Tahun 2024</option>
          <option value="2023">Tahun 2023</option>
          <option value="2022">Tahun 2022</option>
        </select>

        <select
          id="filter-bulan-invoice"
          value={selectedBulan}
          onChange={(e) => setSelectedBulan(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Bulan</option>
          {NAMA_BULAN_LIST.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          id="filter-status-invoice"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Status Bayar</option>
          <option value="Belum Bayar">Belum Bayar</option>
          <option value="Sebagian">Sebagian</option>
          <option value="Lunas">Lunas</option>
          <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
          <option value="Jatuh Tempo">Jatuh Tempo</option>
        </select>

        <select
          id="filter-status-operasional"
          value={selectedStatusInvoice}
          onChange={(e) => setSelectedStatusInvoice(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Status Invoice</option>
          <option value="Terkirim">Terkirim</option>
          <option value="Draft">Draft</option>
          <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
      </div>

      {/* KESELURUHAN DATA INVOICE: TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Keseluruhan Data Invoice Mitra Office</h3>
              <p className="text-xs text-slate-500">
                Daftar lengkap mencakup nomor invoice, sekolah, periode, tagihan, dan nominal pembayaran yang diterima.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {filtered.length} Invoice Ditemukan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3.5 whitespace-nowrap">No. Invoice</th>
                  <th className="p-3.5 whitespace-nowrap">Nama Sekolah Mitra</th>
                  <th className="p-3.5 whitespace-nowrap">Bulan & TA</th>
                  <th className="p-3.5 whitespace-nowrap">Tgl Kirim</th>
                  <th className="p-3.5 whitespace-nowrap">Tgl Dibayar</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Tagihan Full</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Tagihan Realisasi</th>
                  {/* Kolom Nominal Pembayaran sesuai instruksi spesifik user */}
                  <th className="p-3.5 whitespace-nowrap text-right bg-emerald-50/70 text-emerald-950 font-extrabold border-x border-emerald-100">
                    Nominal Pembayaran
                  </th>
                  <th className="p-3.5 whitespace-nowrap text-right">Sisa Tagihan</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Status Invoice</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Status Bayar</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-12 text-center text-slate-400">
                      <Receipt size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada data invoice yang sesuai kriteria.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const tagFull = inv.tagihanFull || inv.nominal || 0;
                    const tagReal = inv.tagihanRealisasi || inv.nominal || 0;
                    const nomBayar = inv.nominalPembayaran || 0;
                    const sisa = Math.max(0, tagReal - nomBayar);

                    return (
                      <tr key={inv.id} className="hover:bg-blue-50/30 transition">
                        <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {inv.id}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{inv.namaSekolah}</div>
                          <div className="text-[11px] text-slate-500">{inv.kategori || 'Invoice Layanan'}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{inv.bulan || '-'}</span>
                          <span className="text-slate-400 block text-[11px]">{inv.tahunAjaran || '2026/2027'}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-600">
                          {inv.tanggalKirim || inv.tanggalTerbit || '-'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-600">
                          {inv.tanggalDibayar ? (
                            <span className="text-emerald-700 font-semibold">{inv.tanggalDibayar}</span>
                          ) : (
                            <span className="text-slate-400 italic">Belum bayar</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                          {formatRupiah(tagFull)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(tagReal)}
                        </td>
                        {/* Kolom Nominal Pembayaran */}
                        <td className="p-3.5 text-right font-black text-emerald-700 bg-emerald-50/40 border-x border-emerald-100 whitespace-nowrap">
                          {formatRupiah(nomBayar)}
                        </td>
                        <td className="p-3.5 text-right font-semibold whitespace-nowrap">
                          {sisa === 0 ? (
                            <span className="text-emerald-600 font-bold">Lunas (Rp 0)</span>
                          ) : (
                            <span className="text-rose-600 font-bold">{formatRupiah(sisa)}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {getOperationalBadge(inv.statusInvoice)}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailInvoice(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Lihat Detail Invoice"
                            >
                              <Info size={14} />
                            </button>
                            <button
                              onClick={() => setPrintInvoice(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Cetak Salinan Faktur"
                            >
                              <Printer size={14} />
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(inv)}
                                  className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 transition"
                                  title="Edit Invoice"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                                  title="Hapus Invoice"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {inv.status !== 'Lunas' && onNavigateToPayment && (
                              <button
                                onClick={() => onNavigateToPayment(inv.id)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1 cursor-pointer"
                                title="Proses Pembayaran"
                              >
                                <CreditCard size={12} />
                                <span>Bayar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KESELURUHAN DATA INVOICE: CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada data invoice yang sesuai kriteria.</p>
            </div>
          ) : (
            filtered.map((inv) => {
              const tagFull = inv.tagihanFull || inv.nominal || 0;
              const tagReal = inv.tagihanRealisasi || inv.nominal || 0;
              const nomBayar = inv.nominalPembayaran || 0;
              const sisa = Math.max(0, tagReal - nomBayar);

              return (
                <div 
                  key={inv.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {inv.id}
                          </span>
                          {getOperationalBadge(inv.statusInvoice)}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">{inv.namaSekolah}</h3>
                        <p className="text-xs font-semibold text-slate-500">
                          Bulan: <strong className="text-slate-700">{inv.bulan || '-'}</strong> • TA: {inv.tahunAjaran || '2026/2027'}
                        </p>
                      </div>
                      {getStatusBadge(inv.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Tanggal Kirim:</span>
                        <span className="font-semibold text-slate-800">{inv.tanggalKirim || inv.tanggalTerbit || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tanggal Dibayar:</span>
                        <span className="font-semibold text-slate-800">
                          {inv.tanggalDibayar ? inv.tanggalDibayar : <span className="text-slate-400 italic">Belum Dibayar</span>}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Nominal Tagihan */}
                    <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Tagihan Full</span>
                        <span className="text-xs font-bold text-slate-700">{formatRupiah(tagFull)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Realisasi</span>
                        <span className="text-xs font-bold text-blue-800">{formatRupiah(tagReal)}</span>
                      </div>
                      <div className="bg-emerald-50 rounded-lg py-0.5 border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 block font-extrabold uppercase">Pembayaran</span>
                        <span className="text-xs font-black text-emerald-700">{formatRupiah(nomBayar)}</span>
                      </div>
                    </div>

                    {sisa > 0 && (
                      <div className="text-[11px] text-rose-700 font-bold mb-3 flex items-center justify-between px-1">
                        <span>Sisa Tagihan Belum Terbayar:</span>
                        <span>{formatRupiah(sisa)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Realisasi:</span>
                      <span className="text-base font-black text-slate-900">{formatRupiah(tagReal)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailInvoice(inv)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        title="Detail Invoice"
                      >
                        <Info size={15} />
                      </button>

                      <button
                        onClick={() => setPrintInvoice(inv)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        title="Cetak Salinan Faktur"
                      >
                        <Printer size={15} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="p-2 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-600 transition"
                          title="Edit Data Invoice"
                        >
                          <Edit size={15} />
                        </button>
                      )}

                      {inv.status !== 'Lunas' && onNavigateToPayment && (
                        <button
                          onClick={() => onNavigateToPayment(inv.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard size={13} />
                          <span>{isAdmin ? 'Verifikasi Bayar' : 'Bayar Sekarang'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: FORM INVOICE BARU & EDIT INVOICE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-100 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt size={20} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingInvoice ? 'Edit Data Invoice' : 'Form Terbitkan Invoice Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="space-y-4 mt-4 text-xs">
              
              {/* FIELD 1: NOMOR INVOICE DENGAN TOMBOL KLIK */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Nomor Invoice Resmi</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-slate-500">
                    Format: INV/romawi bulan/tahun/nomor lanjutan/MO
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <input
                      id="input-nomor-invoice"
                      type="text"
                      required
                      placeholder="Klik tombol di samping untuk mendapatkan nomor invoice"
                      value={formNomorInvoice}
                      onChange={(e) => {
                        setFormNomorInvoice(e.target.value);
                        setHasGeneratedNumber(true);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    id="btn-generate-nomor-invoice"
                    type="button"
                    onClick={handleGenerateNomorInvoice}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/20 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles size={14} />
                    <span>{formNomorInvoice ? 'Generate Ulang No. Invoice' : 'Dapatkan Nomor Invoice Baru'}</span>
                  </button>
                </div>

                {hasGeneratedNumber && formNomorInvoice && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 size={13} />
                    <span>Nomor invoice terupdate otomatis: <strong>{formNomorInvoice}</strong></span>
                  </p>
                )}
                {!hasGeneratedNumber && !editingInvoice && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <Info size={13} className="shrink-0" />
                    <span>Perhatian: Untuk bisa mendapatkan nomor invoice baru, silakan klik tombol di atas terlebih dahulu.</span>
                  </p>
                )}
              </div>

              {/* GRID: NAMA SEKOLAH, BULAN, TAHUN AJARAN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Nama Sekolah Mitra</label>
                  <select
                    id="select-sekolah-invoice"
                    value={formMitraId}
                    onChange={(e) => setFormMitraId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {sekolahList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.namaSekolah} ({s.kota})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulan Layanan/Invoice</label>
                  <select
                    id="select-bulan-invoice"
                    value={formBulan}
                    onChange={(e) => setFormBulan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {NAMA_BULAN_LIST.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <select
                    id="select-ta-invoice"
                    value={formTahunAjaran}
                    onChange={(e) => setFormTahunAjaran(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="2026/2027">2026/2027 (Aktif)</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>
              </div>

              {/* GRID: STATUS INVOICE & STATUS PEMBAYARAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Invoice (Operasional)</label>
                  <select
                    id="select-status-invoice-operasional"
                    value={formStatusInvoice}
                    onChange={(e) => setFormStatusInvoice(e.target.value as InvoiceOperationalStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Terkirim">Terkirim (Resmi ke Sekolah)</option>
                    <option value="Draft">Draft (Internal Kantor)</option>
                    <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status (Pelunasan/Pembayaran)</label>
                  <select
                    id="select-status-bayar"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as InvoiceStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Sebagian">Sebagian (Cicilan/Parsial)</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                    <option value="Jatuh Tempo">Jatuh Tempo</option>
                  </select>
                </div>
              </div>

              {/* GRID: TANGGAL KIRIM & TANGGAL DIBAYAR & JATUH TEMPO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kirim</label>
                  <input
                    id="input-tanggal-kirim"
                    type="date"
                    required
                    value={formTanggalKirim}
                    onChange={(e) => setFormTanggalKirim(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Dibayar (Opsional)</label>
                  <input
                    id="input-tanggal-dibayar"
                    type="date"
                    value={formTanggalDibayar}
                    onChange={(e) => setFormTanggalDibayar(e.target.value)}
                    placeholder="Tanggal pembayaran diterima"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    id="input-jatuh-tempo"
                    type="date"
                    required
                    value={formJatuhTempo}
                    onChange={(e) => setFormJatuhTempo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* BREAKDOWN KEUANGAN: TAGIHAN FULL, TAGIHAN REALISASI, NOMINAL PEMBAYARAN */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block text-xs">Rincian Nominal Keuangan</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tagihan Full (IDR)</label>
                    <input
                      id="input-tagihan-full"
                      type="number"
                      required
                      min={0}
                      value={formTagihanFull}
                      onChange={(e) => setFormTagihanFull(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatRupiah(formTagihanFull)}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Tagihan Realisasi (IDR)</label>
                      <button
                        type="button"
                        onClick={() => setFormTagihanRealisasi(formTagihanFull)}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        = Full
                      </button>
                    </div>
                    <input
                      id="input-tagihan-realisasi"
                      type="number"
                      required
                      min={0}
                      value={formTagihanRealisasi}
                      onChange={(e) => setFormTagihanRealisasi(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-blue-600 mt-0.5 block">{formatRupiah(formTagihanRealisasi)}</span>
                  </div>

                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-black text-emerald-900">Nominal Pembayaran (IDR)</label>
                      <button
                        type="button"
                        onClick={() => handleNominalPembayaranChange(formTagihanRealisasi)}
                        className="text-[10px] text-emerald-700 font-bold hover:underline"
                      >
                        = Lunas
                      </button>
                    </div>
                    <input
                      id="input-nominal-pembayaran"
                      type="number"
                      required
                      min={0}
                      value={formNominalPembayaran}
                      onChange={(e) => handleNominalPembayaranChange(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <span className="text-[10px] text-emerald-700 mt-0.5 block font-bold">
                      {formatRupiah(formNominalPembayaran)}
                    </span>
                  </div>
                </div>

                {/* Sisa Piutang Info */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-semibold">
                  <span className="text-slate-600">Sisa Tagihan yang Belum Terbayar:</span>
                  <span className={formTagihanRealisasi - formNominalPembayaran > 0 ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>
                    {formatRupiah(Math.max(0, formTagihanRealisasi - formNominalPembayaran))}
                  </span>
                </div>
              </div>

              {/* KATEGORI & KETERANGAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Tagihan</label>
                  <select
                    id="select-kategori-invoice"
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as InvoiceKategori)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Renewal Fee">Renewal Fee (Lisensi Tahunan)</option>
                    <option value="Piutang Mitra">Piutang Mitra (Seragam & Dokumen)</option>
                    <option value="Jenjang Baru">Jenjang Baru (Ekspansi Sekolah)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan / Rincian Tagihan</label>
                  <input
                    id="input-keterangan-invoice"
                    type="text"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Misal: Biaya Lisensi MenDAKI TA 2026/2027..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  id="btn-simpan-invoice"
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 transition cursor-pointer"
                >
                  {editingInvoice ? 'Simpan Perubahan Invoice' : 'Simpan & Terbitkan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL INVOICE MODAL */}
      {detailInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Rincian Lengkap Faktur Invoice</h3>
              </div>
              <button onClick={() => setDetailInvoice(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Nomor Invoice Resmi</span>
                  <span className="text-base font-mono font-black text-slate-900">{detailInvoice.id}</span>
                </div>
                <div className="text-right">
                  {getStatusBadge(detailInvoice.status)}
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sekolah Mitra:</span>
                  <span className="font-bold text-slate-900">{detailInvoice.namaSekolah}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bulan & Tahun Ajaran:</span>
                  <span className="font-semibold text-slate-800">{detailInvoice.bulan || '-'} (TA {detailInvoice.tahunAjaran || '2026/2027'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Invoice:</span>
                  <span>{getOperationalBadge(detailInvoice.statusInvoice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Kirim:</span>
                  <span className="font-medium text-slate-800">{detailInvoice.tanggalKirim || detailInvoice.tanggalTerbit || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Dibayar:</span>
                  <span className="font-semibold text-emerald-700">{detailInvoice.tanggalDibayar || 'Belum Dibayar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Jatuh Tempo:</span>
                  <span className="font-semibold text-rose-600">{detailInvoice.jatuhTempo}</span>
                </div>
              </div>

              {/* Rincian Finansial */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tagihan Full:</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(detailInvoice.tagihanFull || detailInvoice.nominal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tagihan Realisasi:</span>
                  <span className="font-bold text-blue-900">{formatRupiah(detailInvoice.tagihanRealisasi || detailInvoice.nominal || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1.5">
                  <span>Nominal Pembayaran Diterima:</span>
                  <span>{formatRupiah(detailInvoice.nominalPembayaran || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-black">
                  <span>Sisa Tagihan Belum Terbayar:</span>
                  <span>{formatRupiah(Math.max(0, (detailInvoice.tagihanRealisasi || detailInvoice.nominal || 0) - (detailInvoice.nominalPembayaran || 0)))}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Rincian / Keterangan:</span>
                <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700">{detailInvoice.keterangan || '-'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setDetailInvoice(null);
                  setPrintInvoice(detailInvoice);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Cetak Faktur</span>
              </button>

              <button
                onClick={() => setDetailInvoice(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT / CETAK FAKTUR INVOICE MODAL */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Salinan Faktur Tagihan Resmi</h3>
              </div>
              <button onClick={() => setPrintInvoice(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="text-center p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                <p className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Lazuardi Mitra Office</p>
                <h4 className="text-sm font-black text-slate-900 mt-0.5 font-mono">{printInvoice.id}</h4>
              </div>

              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <div className="flex justify-between"><span className="text-slate-400">Kepada:</span><span className="font-bold text-slate-800">{printInvoice.namaSekolah}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Bulan & TA:</span><span className="font-semibold text-slate-800">{printInvoice.bulan || '-'} • TA {printInvoice.tahunAjaran || '2026/2027'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tanggal Kirim:</span><span>{printInvoice.tanggalKirim || printInvoice.tanggalTerbit || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tanggal Dibayar:</span><span className="font-bold text-emerald-700">{printInvoice.tanggalDibayar || 'Belum Dibayar'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Jatuh Tempo:</span><span className="font-semibold text-rose-600">{printInvoice.jatuhTempo}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status Bayar:</span><span>{printInvoice.status}</span></div>
              </div>

              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex justify-between text-[11px]"><span className="text-slate-500">Tagihan Full:</span><span>{formatRupiah(printInvoice.tagihanFull || printInvoice.nominal || 0)}</span></div>
                <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-700">Tagihan Realisasi:</span><span>{formatRupiah(printInvoice.tagihanRealisasi || printInvoice.nominal || 0)}</span></div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-700"><span>Nominal Pembayaran Diterima:</span><span>{formatRupiah(printInvoice.nominalPembayaran || 0)}</span></div>
              </div>

              <div className="p-3 bg-blue-900 text-white rounded-xl flex justify-between items-center">
                <span className="font-medium text-xs">Total Realisasi Tagihan:</span>
                <span className="text-base font-black">{formatRupiah(printInvoice.tagihanRealisasi || printInvoice.nominal || 0)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} />
                <span>Cetak / PDF</span>
              </button>
              <button
                onClick={() => setPrintInvoice(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT SHEET INVOICE & PEMBAYARAN */}
      <InputSheetInvoicePembayaranModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
      />
    </div>
  );
};
