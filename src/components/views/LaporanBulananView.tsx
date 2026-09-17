import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  X, 
  MessageSquare,
  Building,
  Check,
  RotateCcw,
  Calculator,
  FileSpreadsheet,
  Sparkles,
  AlertTriangle,
  Trophy,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  CalendarDays,
  Send,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LaporanBulanan, LaporanKategori, LaporanStatus, SheetPerhitunganData } from '../../types';
import { SheetPerhitunganModal } from './laporan-bulanan/SheetPerhitunganModal';
import { FormLaporanModal, BULAN_ACADEMIC_LIST, TAHUN_AJARAN_OPTIONS } from './laporan-bulanan/FormLaporanModal';
import { RangkumanKepatuhanSekolah } from './laporan-bulanan/RangkumanKepatuhanSekolah';

export const LaporanBulananView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    laporanList, 
    sekolahList, 
    addLaporan, 
    updateLaporan, 
    deleteLaporan, 
    reviewLaporan, 
    updateLaporanSheet 
  } = useData();

  // Active Main Sub-Tab
  const [activeTab, setActiveTab] = useState<'rangkuman' | 'daftar'>('rangkuman');

  // Academic Year State
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('2026/2027');

  // Search & Filter State for Daftar Arsip
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSekolah, setSelectedSekolah] = useState<string>('ALL');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLaporan, setEditingLaporan] = useState<LaporanBulanan | null>(null);
  const [defaultFormSekolahId, setDefaultFormSekolahId] = useState<string | undefined>(undefined);
  const [defaultFormBulan, setDefaultFormBulan] = useState<string | undefined>(undefined);

  // Review Modal State
  const [selectedLaporanForReview, setSelectedLaporanForReview] = useState<LaporanBulanan | null>(null);
  const [reviewCatatan, setReviewCatatan] = useState('');

  // Sheet Modal State
  const [activeSheetLaporan, setActiveSheetLaporan] = useState<LaporanBulanan | null>(null);
  const [isDraftSheetModalOpen, setIsDraftSheetModalOpen] = useState(false);
  const [draftSheetData, setDraftSheetData] = useState<SheetPerhitunganData | null>(null);
  const [onSaveDraftSheetCallback, setOnSaveDraftSheetCallback] = useState<((s: SheetPerhitunganData) => void) | null>(null);

  // Detail Modal State (when clicked from matrix)
  const [detailLaporan, setDetailLaporan] = useState<LaporanBulanan | null>(null);

  // Filter based on user role
  const baseList = useMemo(() => {
    return isAdmin 
      ? laporanList 
      : laporanList.filter(l => l.mitraId === currentUser?.sekolahId);
  }, [isAdmin, laporanList, currentUser?.sekolahId]);

  // Filtered reports for the table/cards
  const filteredList = useMemo(() => {
    return baseList.filter(l => {
      const matchTA = !selectedTahunAjaran || (l.tahunAjaran || '2026/2027') === selectedTahunAjaran;
      const matchSearch = l.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.ringkasan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.bulan || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchSekolah = selectedSekolah === 'ALL' || l.mitraId === selectedSekolah;
      const matchBulan = selectedBulan === 'ALL' || l.bulan === selectedBulan;
      const matchStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
      const matchKategori = selectedKategori === 'ALL' || l.kategori === selectedKategori;
      return matchTA && matchSearch && matchSekolah && matchBulan && matchStatus && matchKategori;
    });
  }, [baseList, selectedTahunAjaran, searchQuery, selectedSekolah, selectedBulan, selectedStatus, selectedKategori]);

  // Open create modal with prefilled info
  const handleOpenCreateModal = (sekolahId?: string, bulan?: string) => {
    setEditingLaporan(null);
    setDefaultFormSekolahId(sekolahId || currentUser?.sekolahId || sekolahList[0]?.id);
    setDefaultFormBulan(bulan || 'September');
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (laporan: LaporanBulanan) => {
    setEditingLaporan(laporan);
    setDefaultFormSekolahId(laporan.mitraId);
    setDefaultFormBulan(laporan.bulan);
    setIsFormModalOpen(true);
  };

  // Handle Save Laporan (Create or Update)
  const handleSaveLaporan = async (
    laporanData: Omit<LaporanBulanan, 'id' | 'tanggalDiajukan'>,
    editId?: string
  ) => {
    if (editId && editingLaporan) {
      const updated: LaporanBulanan = {
        ...editingLaporan,
        ...laporanData,
        id: editId,
        tanggalDiajukan: editingLaporan.tanggalDiajukan || laporanData.tanggalKirim || new Date().toISOString().split('T')[0],
      };
      await updateLaporan(updated);
    } else {
      await addLaporan(laporanData);
    }
  };

  // Handle Review Action
  const handleReviewAction = async (status: LaporanStatus) => {
    if (!selectedLaporanForReview) return;
    await reviewLaporan(selectedLaporanForReview.id, status, reviewCatatan);
    setSelectedLaporanForReview(null);
    setReviewCatatan('');
  };

  // Handle Delete
  const handleDeleteLaporan = async (id: string, nama: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus arsip laporan untuk ${nama}?`)) {
      await deleteLaporan(id);
    }
  };

  const getStatusBadge = (status: LaporanStatus) => {
    switch (status) {
      case 'Diterima':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-700" /> Diterima
          </span>
        );
      case 'Direview':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} className="text-blue-700" /> Sedang Direview
          </span>
        );
      case 'Perlu Revisi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle size={12} className="text-rose-700" /> Perlu Revisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            <Clock size={12} className="text-amber-700" /> Diajukan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Laporan Bulanan Sekolah Mitra</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  TA {selectedTahunAjaran}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring berkala kepatuhan sekolah, rangkuman sekolah paling rajin, dan audit perhitungan
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-tambah-laporan"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Buat Laporan Bulanan</span>
          </button>
        </div>
      </div>

      {/* Main Sub-Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('rangkuman')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rangkuman'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trophy size={14} className={activeTab === 'rangkuman' ? 'text-yellow-300' : 'text-slate-400'} />
            <span>Rangkuman & Matriks Kepatuhan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'rangkuman' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              Paling Rajin & Belum Lapor
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daftar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'daftar'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers size={14} />
            <span>Daftar Arsip & Audit Laporan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'daftar' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredList.length}
            </span>
          </button>
        </div>

        {/* Global Academic Year Selector */}
        <div className="flex items-center gap-2 text-xs">
          <CalendarDays size={14} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Tahun Ajaran:</span>
          <select
            value={selectedTahunAjaran}
            onChange={(e) => setSelectedTahunAjaran(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-blue-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            {TAHUN_AJARAN_OPTIONS.map(ta => (
              <option key={ta} value={ta}>TA {ta}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 1: Rangkuman & Matriks Kepatuhan (Paling Rajin & Laporan Belum Lapor) */}
      {activeTab === 'rangkuman' && (
        <RangkumanKepatuhanSekolah
          sekolahList={sekolahList}
          laporanList={laporanList}
          selectedTahunAjaran={selectedTahunAjaran}
          onChangeTahunAjaran={setSelectedTahunAjaran}
          onOpenCreateModal={(sekolahId, bulan) => handleOpenCreateModal(sekolahId, bulan)}
          onViewLaporanDetail={(laporan) => setDetailLaporan(laporan)}
        />
      )}

      {/* Tab 2: Daftar Arsip & Audit Laporan */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-laporan"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama sekolah, isi ringkasan, atau kendala..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            {/* Filter Sekolah (for Admin) */}
            {isAdmin && (
              <select
                id="filter-sekolah-laporan"
                value={selectedSekolah}
                onChange={(e) => setSelectedSekolah(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">Semua Sekolah Mitra</option>
                {sekolahList.map(s => (
                  <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                ))}
              </select>
            )}

            {/* Filter Bulan */}
            <select
              id="filter-bulan-laporan"
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Semua Bulan</option>
              {BULAN_ACADEMIC_LIST.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              id="filter-status-laporan"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Direview">Direview</option>
              <option value="Diterima">Diterima</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
            </select>

            {/* Filter Kategori */}
            <select
              id="filter-kategori-laporan"
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Komprehensif">Komprehensif</option>
              <option value="Akademik">Akademik</option>
              <option value="Kesiswaan">Kesiswaan</option>
              <option value="Keuangan">Keuangan</option>
              <option value="SDM & Operasional">SDM & Operasional</option>
            </select>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredList.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300">
                <FileText size={38} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum ada laporan bulanan yang cocok dengan filter.</p>
                <p className="text-xs text-slate-400 mt-1">Silakan ganti kriteria pencarian atau klik tombol &quot;+ Buat Laporan Bulanan&quot;.</p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition space-y-3.5"
                >
                  {/* Top Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                        <Building size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{item.namaSekolah}</h3>
                          <span className="text-[10px] font-mono text-slate-400">({item.id})</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            TA {item.tahunAjaran || '2026/2027'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-semibold text-blue-700">
                            Bulan: {item.bulan} {item.tahun}
                          </span>
                          <span>•</span>
                          <span className="text-slate-600">
                            Tanggal Kirim: <strong className="text-slate-800">{item.tanggalKirim || item.tanggalDiajukan}</strong>
                          </span>
                          {item.kategori && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">Kategori: {item.kategori}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Content Grid (if present) */}
                  {(item.ringkasan || item.kendala || item.solusi) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {item.ringkasan && (
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-1">Ringkasan Capaian:</span>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{item.ringkasan}</p>
                        </div>
                      )}
                      {item.kendala && (
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-1">Kendala / Masalah:</span>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{item.kendala}</p>
                        </div>
                      )}
                      {item.solusi && (
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-1">Solusi / Mitigasi:</span>
                          <p className="text-slate-600 leading-relaxed text-[11px]">{item.solusi}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sheet Perhitungan Preview */}
                  {item.sheetPerhitungan ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
                          <Calculator size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{item.sheetPerhitungan.namaSheet}</span>
                            {item.sheetPerhitungan.statusPerbaikan === 'Ada Selisih' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle size={11} className="text-amber-700" />
                                Ada Selisih ({item.sheetPerhitungan.rows.filter(r => r.selisih !== 0).length} Baris)
                              </span>
                            ) : item.sheetPerhitungan.statusPerbaikan === 'Otomatis Diperbaiki' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                                <Sparkles size={11} className="text-blue-600" />
                                Otomatis Diperbaiki
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 size={11} className="text-emerald-700" />
                                Sesuai / Valid
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                            Pemasukan: <strong className="text-emerald-800">Rp {item.sheetPerhitungan.totalPemasukan.toLocaleString('id-ID')}</strong> • 
                            Pengeluaran: <strong className="text-rose-800">Rp {item.sheetPerhitungan.totalPengeluaran.toLocaleString('id-ID')}</strong> • 
                            Saldo: <strong className="text-blue-800">Rp {item.sheetPerhitungan.saldoBersih.toLocaleString('id-ID')}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSheetLaporan(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
                      >
                        <FileSpreadsheet size={14} className="text-emerald-700" />
                        <span>Buka & Audit Sheet</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs">
                      <span className="text-slate-500 text-[11px]">Belum ada sheet perhitungan terlampir untuk laporan ini.</span>
                      <button
                        type="button"
                        onClick={() => setActiveSheetLaporan(item)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>+ Tambah Sheet Perhitungan</span>
                      </button>
                    </div>
                  )}

                  {/* Admin Feedback Notes */}
                  {item.catatanAdmin && (
                    <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs flex items-start gap-2 text-blue-900">
                      <MessageSquare size={15} className="shrink-0 text-blue-600 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-950">Catatan Review Mitra Office:</span>
                        <p className="mt-0.5">{item.catatanAdmin}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                    <span className="text-slate-400 text-[11px]">
                      Tanggal Pengiriman: <strong className="text-slate-600">{item.tanggalKirim || item.tanggalDiajukan}</strong>
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {item.linkDokumen && (
                        <a
                          href={item.linkDokumen}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 transition"
                        >
                          <span>Dokumen Google Docs</span>
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                        title="Edit data laporan ini"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLaporanForReview(item);
                              setReviewCatatan(item.catatanAdmin || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare size={13} />
                            <span>Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLaporan(item.id, item.namaSekolah)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                            title="Hapus laporan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Input / Edit Laporan Bulanan (FormLaporanModal) */}
      {isFormModalOpen && (
        <FormLaporanModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingLaporan(null);
          }}
          sekolahList={sekolahList}
          initialData={editingLaporan}
          defaultSekolahId={defaultFormSekolahId}
          defaultBulan={defaultFormBulan}
          defaultTahunAjaran={selectedTahunAjaran}
          isAdmin={isAdmin}
          currentUserSchoolId={currentUser?.sekolahId}
          onSave={handleSaveLaporan}
          onOpenSheetModal={(currentSheet, onSaveCallback) => {
            setDraftSheetData(currentSheet);
            setOnSaveDraftSheetCallback(() => onSaveCallback);
            setIsDraftSheetModalOpen(true);
          }}
        />
      )}

      {/* MODAL: Draft Sheet Perhitungan from inside FormLaporanModal */}
      {isDraftSheetModalOpen && (
        <SheetPerhitunganModal
          isOpen={true}
          onClose={() => setIsDraftSheetModalOpen(false)}
          namaSekolah={sekolahList.find(s => s.id === defaultFormSekolahId)?.namaSekolah || 'Sekolah Mitra'}
          bulan={defaultFormBulan || 'September'}
          tahun={2026}
          initialData={draftSheetData || undefined}
          onSave={(newSheet) => {
            if (onSaveDraftSheetCallback) {
              onSaveDraftSheetCallback(newSheet);
            }
            setIsDraftSheetModalOpen(false);
          }}
          isReadOnly={false}
        />
      )}

      {/* MODAL: Sheet Perhitungan for existing report in list */}
      {activeSheetLaporan && (
        <SheetPerhitunganModal
          isOpen={true}
          onClose={() => setActiveSheetLaporan(null)}
          namaSekolah={activeSheetLaporan.namaSekolah}
          bulan={activeSheetLaporan.bulan}
          tahun={activeSheetLaporan.tahun}
          initialData={activeSheetLaporan.sheetPerhitungan}
          onSave={async (updatedSheet) => {
            await updateLaporanSheet(activeSheetLaporan.id, updatedSheet);
            setActiveSheetLaporan(null);
          }}
          isReadOnly={false}
        />
      )}

      {/* MODAL: Review Laporan (Mitra Office) */}
      {selectedLaporanForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Review Laporan: {selectedLaporanForReview.namaSekolah}
              </h3>
              <button 
                onClick={() => setSelectedLaporanForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 text-xs space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-600">
                  Periode: <strong className="text-slate-900">{selectedLaporanForReview.bulan} {selectedLaporanForReview.tahun}</strong>
                </p>
                <p className="text-slate-600">
                  Tahun Ajaran: <strong className="text-slate-900">{selectedLaporanForReview.tahunAjaran || '2026/2027'}</strong>
                </p>
                <p className="text-slate-600">
                  Tanggal Kirim: <strong className="text-slate-900">{selectedLaporanForReview.tanggalKirim || selectedLaporanForReview.tanggalDiajukan}</strong>
                </p>
                <p className="text-slate-600">
                  Status Saat Ini: <strong className="text-blue-700">{selectedLaporanForReview.status}</strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Evaluasi / Arahan Mitra Office</label>
                <textarea
                  rows={3}
                  value={reviewCatatan}
                  onChange={(e) => setReviewCatatan(e.target.value)}
                  placeholder="Berikan umpan balik atau instruksi perbaikan kepada sekolah..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => handleReviewAction('Perlu Revisi')}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Minta Revisi</span>
              </button>

              <button
                type="button"
                onClick={() => handleReviewAction('Diterima')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                <span>Setujui & Terima</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detail Laporan Quick Inspection (from Matrix click) */}
      {detailLaporan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Detail Laporan {detailLaporan.namaSekolah}
                </h3>
              </div>
              <button 
                onClick={() => setDetailLaporan(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bulan & Tahun:</span>
                  <span className="font-bold text-slate-900">{detailLaporan.bulan} {detailLaporan.tahun}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tahun Ajaran:</span>
                  <span className="font-bold text-slate-900">{detailLaporan.tahunAjaran || '2026/2027'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Kirim:</span>
                  <span className="font-bold text-slate-900">{detailLaporan.tanggalKirim || detailLaporan.tanggalDiajukan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status:</span>
                  <span>{getStatusBadge(detailLaporan.status)}</span>
                </div>
              </div>

              {detailLaporan.ringkasan && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Ringkasan Kegiatan:</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed">
                    {detailLaporan.ringkasan}
                  </p>
                </div>
              )}

              {detailLaporan.kendala && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Kendala:</span>
                  <p className="p-2.5 bg-rose-50/50 text-slate-700 rounded-xl border border-rose-100">
                    {detailLaporan.kendala}
                  </p>
                </div>
              )}

              {detailLaporan.solusi && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Solusi / Rekomendasi:</span>
                  <p className="p-2.5 bg-emerald-50/50 text-slate-700 rounded-xl border border-emerald-100">
                    {detailLaporan.solusi}
                  </p>
                </div>
              )}

              {detailLaporan.catatanAdmin && (
                <div>
                  <span className="font-bold text-blue-900 block mb-1">Catatan Mitra Office:</span>
                  <p className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
                    {detailLaporan.catatanAdmin}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {detailLaporan.linkDokumen ? (
                  <a
                    href={detailLaporan.linkDokumen}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Buka Dokumen Lampiran</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs italic">Tidak ada link dokumen</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rep = detailLaporan;
                      setDetailLaporan(null);
                      handleOpenEditModal(rep);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition cursor-pointer"
                  >
                    Edit Laporan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailLaporan(null)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
