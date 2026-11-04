import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  X, 
  FileSpreadsheet,
  CalendarDays,
  Sparkles,
  Eye,
  Trash2,
  Edit3,
  Search,
  Filter,
  Building,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LaporanBulanan, LaporanStatus, SheetPerhitunganData } from '../../types';
import { SheetPerhitunganModal } from './laporan-bulanan/SheetPerhitunganModal';
import { FormLaporanModal, BASE_TAHUN_AJARAN_OPTIONS, BULAN_ACADEMIC_LIST } from './laporan-bulanan/FormLaporanModal';
import { RangkumanKepatuhanSekolah } from './laporan-bulanan/RangkumanKepatuhanSekolah';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const LaporanBulananView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    laporanList, 
    sekolahList, 
    addLaporan, 
    updateLaporan, 
    deleteLaporan, 
    updateLaporanSheet 
  } = useData();

  // Sub-view Tab State: Matriks 12 Bulan vs Daftar Riwayat Laporan Terkirim
  const [activeSubView, setActiveSubView] = useState<'matriks' | 'riwayat'>('matriks');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Academic Year State
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('2026/2027');

  // Filter state for "Daftar Riwayat Laporan Terkirim" table
  const [searchRiwayat, setSearchRiwayat] = useState('');
  const [filterBulanRiwayat, setFilterBulanRiwayat] = useState<string>('ALL');
  const [filterStatusRiwayat, setFilterStatusRiwayat] = useState<string>('ALL');
  const [filterSekolahRiwayat, setFilterSekolahRiwayat] = useState<string>('ALL');

  // Dynamically aggregate all academic years from base options (starting 2022/2023) + all reports
  const allTahunAjaranOptions = useMemo(() => {
    const set = new Set<string>(BASE_TAHUN_AJARAN_OPTIONS);
    laporanList.forEach(l => {
      if (l.tahunAjaran && l.tahunAjaran.trim()) {
        set.add(l.tahunAjaran.trim());
      }
    });
    return Array.from(set).sort((a, b) => {
      const yA = parseInt(a.split('/')[0], 10) || 0;
      const yB = parseInt(b.split('/')[0], 10) || 0;
      return yA - yB;
    });
  }, [laporanList]);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLaporan, setEditingLaporan] = useState<LaporanBulanan | null>(null);
  const [defaultFormSekolahId, setDefaultFormSekolahId] = useState<string | undefined>(undefined);
  const [defaultFormBulan, setDefaultFormBulan] = useState<string | undefined>(undefined);

  // Sheet Modal State
  const [activeSheetLaporan, setActiveSheetLaporan] = useState<LaporanBulanan | null>(null);
  const [isDraftSheetModalOpen, setIsDraftSheetModalOpen] = useState(false);
  const [draftSheetData, setDraftSheetData] = useState<SheetPerhitunganData | null>(null);
  const [onSaveDraftSheetCallback, setOnSaveDraftSheetCallback] = useState<((s: SheetPerhitunganData) => void) | null>(null);

  // Detail Modal State (when clicked from matrix or table)
  const [detailLaporan, setDetailLaporan] = useState<LaporanBulanan | null>(null);

  // Delete Target State (used for deleting / canceling reports)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string; bulan: string; tahunAjaran: string } | null>(null);

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
    try {
      if (editId && editingLaporan) {
        const updated: LaporanBulanan = {
          ...editingLaporan,
          ...laporanData,
          id: editId,
          tanggalDiajukan: editingLaporan.tanggalDiajukan || laporanData.tanggalKirim || new Date().toISOString().split('T')[0],
        };
        await updateLaporan(updated);
        showFeedback('success', `Perubahan laporan "${laporanData.namaSekolah}" (${laporanData.bulan} - TA ${laporanData.tahunAjaran}) berhasil disimpan ke Firebase.`);
      } else {
        await addLaporan(laporanData);
        showFeedback('success', `Laporan "${laporanData.namaSekolah}" (${laporanData.bulan} - TA ${laporanData.tahunAjaran}) berhasil disimpan.`);
      }
    } catch (err) {
      showFeedback('error', `Gagal menyimpan data laporan: ${err instanceof Error ? err.message : String(err)}`);
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

  const isDemoUser = Boolean(currentUser?.isDemo || currentUser?.sekolahId === 'DEMO-MITRA');

  // Strictly isolate schools and reports for RangkumanKepatuhanSekolah
  const effectiveSekolahList = useMemo(() => {
    if (isDemoUser) {
      return sekolahList.filter(s => s.id === 'DEMO-MITRA');
    }
    return sekolahList.filter(s => !s.isDemo && s.id !== 'DEMO-MITRA');
  }, [sekolahList, isDemoUser]);

  const effectiveLaporanList = useMemo(() => {
    if (isDemoUser) {
      return laporanList.filter(l => l.isDemo || l.mitraId === 'DEMO-MITRA' || (l as any).sekolahId === 'DEMO-MITRA');
    }
    return laporanList.filter(l => !l.isDemo && l.mitraId !== 'DEMO-MITRA' && (l as any).sekolahId !== 'DEMO-MITRA');
  }, [laporanList, isDemoUser]);

  // Reports for currently selected Academic Year
  const reportsForSelectedTA = useMemo(() => {
    return effectiveLaporanList.filter(l => (l.tahunAjaran || '2026/2027') === selectedTahunAjaran);
  }, [effectiveLaporanList, selectedTahunAjaran]);

  // Filtered reports for "Daftar Riwayat Laporan" table
  const filteredRiwayatList = useMemo(() => {
    return reportsForSelectedTA.filter(item => {
      if (filterBulanRiwayat !== 'ALL' && item.bulan !== filterBulanRiwayat) return false;
      if (filterStatusRiwayat !== 'ALL' && item.status !== filterStatusRiwayat) return false;
      if (filterSekolahRiwayat !== 'ALL' && item.mitraId !== filterSekolahRiwayat) return false;

      if (searchRiwayat.trim()) {
        const q = searchRiwayat.toLowerCase();
        const matchSekolah = item.namaSekolah.toLowerCase().includes(q);
        const matchBulan = item.bulan.toLowerCase().includes(q);
        const matchRingkasan = (item.ringkasan || '').toLowerCase().includes(q);
        const matchCatatan = (item.catatanAdmin || '').toLowerCase().includes(q);
        if (!matchSekolah && !matchBulan && !matchRingkasan && !matchCatatan) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.tanggalKirim || a.tanggalDiajukan || '';
      const dateB = b.tanggalKirim || b.tanggalDiajukan || '';
      return dateB.localeCompare(dateA);
    });
  }, [reportsForSelectedTA, filterBulanRiwayat, filterStatusRiwayat, filterSekolahRiwayat, searchRiwayat]);

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
                Monitoring kepatuhan sekolah, kelola data pengiriman, atau batalkan laporan jika sekolah ternyata belum kirim
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Year Selector */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Global Academic Year Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="text-slate-500 font-medium">Tahun Ajaran:</span>
            <select
              value={selectedTahunAjaran}
              onChange={(e) => setSelectedTahunAjaran(e.target.value)}
              className="bg-transparent font-bold text-blue-700 text-xs focus:outline-none cursor-pointer"
            >
              {allTahunAjaranOptions.map(ta => (
                <option key={ta} value={ta}>TA {ta}</option>
              ))}
            </select>
          </div>

          {isAdmin ? (
            <button
              id="btn-tambah-laporan"
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Buat Laporan Bulanan</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
              <Eye size={14} className="text-blue-600" />
              <span>Mode View (Sekolah Mitra)</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Subtab Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-bold flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubView('matriks')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'matriks'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={14} />
            <span>Matriks Kepatuhan 12 Bulan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('riwayat')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'riwayat'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Daftar Riwayat Laporan ({reportsForSelectedTA.length})</span>
            {isAdmin && (
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Kelola / Hapus
              </span>
            )}
          </button>
        </div>

        {isAdmin && (
          <div className="text-[11px] text-slate-600 bg-amber-50/80 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600 shrink-0" />
            <span>
              Admin dapat <strong>mengubah</strong> data atau <strong>membatalkan/menghapus</strong> laporan jika sekolah ternyata belum kirim.
            </span>
          </div>
        )}
      </div>

      {/* 1. SUBVIEW: MATRIKS KEPATUHAN 12 BULAN & PERINGKAT TA */}
      {activeSubView === 'matriks' && (
        <RangkumanKepatuhanSekolah
          sekolahList={effectiveSekolahList}
          laporanList={effectiveLaporanList}
          selectedTahunAjaran={selectedTahunAjaran}
          onChangeTahunAjaran={setSelectedTahunAjaran}
          onOpenCreateModal={(sekolahId, bulan) => handleOpenCreateModal(sekolahId, bulan)}
          onViewLaporanDetail={(laporan) => setDetailLaporan(laporan)}
        />
      )}

      {/* 2. SUBVIEW: DAFTAR RIWAYAT LAPORAN TERKIRIM (TABEL KELOLA / EDIT / HAPUS) */}
      {activeSubView === 'riwayat' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span>Riwayat Laporan Bulanan Terkirim</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {filteredRiwayatList.length} Laporan
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kelola status, periksa tautan dokumen lampiran, lakukan perubahan data, atau batalkan laporan jika sekolah ternyata belum kirim.
              </p>
            </div>

            {/* Filter Group */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah / catatan..."
                  value={searchRiwayat}
                  onChange={(e) => setSearchRiwayat(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 w-44 sm:w-56"
                />
              </div>

              {/* Bulan Filter */}
              <select
                value={filterBulanRiwayat}
                onChange={(e) => setFilterBulanRiwayat(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Bulan</option>
                {BULAN_ACADEMIC_LIST.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatusRiwayat}
                onChange={(e) => setFilterStatusRiwayat(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Direview">Direview</option>
                <option value="Diterima">Diterima</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
              </select>

              {/* Sekolah Filter (Admin Only) */}
              {isAdmin && (
                <select
                  value={filterSekolahRiwayat}
                  onChange={(e) => setFilterSekolahRiwayat(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 max-w-[160px] cursor-pointer"
                >
                  <option value="ALL">Semua Sekolah</option>
                  {effectiveSekolahList.map(s => (
                    <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-4 min-w-[200px]">Sekolah Mitra</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Periode Laporan</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Tanggal Kirim</th>
                  <th className="py-2.5 px-3 text-center min-w-[110px]">Status</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Dokumen &amp; Sheet</th>
                  <th className="py-2.5 px-3 text-center min-w-[140px]">{isAdmin ? 'Aksi Admin' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiwayatList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600 text-xs">Belum ada laporan yang sesuai kriteria pencarian.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik &quot;+ Buat Laporan Bulanan&quot; untuk menginput data laporan baru.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRiwayatList.map((item, idx) => {
                    const day = parseInt((item.tanggalKirim || '').split('-')[2], 10);
                    const isLate = !isNaN(day) && day > 25;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.namaSekolah}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {item.mitraId}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{item.bulan} {item.tahun}</span>
                          <span className="text-[10px] text-slate-500">TA {item.tahunAjaran || selectedTahunAjaran}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{item.tanggalKirim || item.tanggalDiajukan || '-'}</span>
                          {item.tanggalKirim && (
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                              isLate 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isLate ? 'Lewat tgl 25' : 'Tepat Waktu'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.linkDokumen ? (
                              <a
                                href={item.linkDokumen}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] border border-blue-200 transition flex items-center gap-1"
                                title="Buka tautan dokumen lampiran"
                              >
                                <span>Dokumen</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : null}

                            {item.sheetPerhitungan ? (
                              <button
                                type="button"
                                onClick={() => setActiveSheetLaporan(item)}
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                                title="Buka Sheet Perhitungan"
                              >
                                <FileSpreadsheet size={10} />
                                <span>Sheet</span>
                              </button>
                            ) : null}

                            {!item.linkDokumen && !item.sheetPerhitungan && (
                              <span className="text-[10px] text-slate-400 italic">Tanpa lampiran</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailLaporan(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Lihat Detail Lengkap Laporan"
                            >
                              <Eye size={13} />
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                                  title="Ubah / Edit Data Laporan"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteTarget({
                                      id: item.id,
                                      nama: item.namaSekolah,
                                      bulan: item.bulan,
                                      tahunAjaran: item.tahunAjaran || selectedTahunAjaran
                                    });
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                  title="Hapus / Batalkan Laporan (Kembalikan ke status Belum Kirim jika sekolah ternyata belum kirim)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
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
          existingTahunAjaranList={allTahunAjaranOptions}
          isAdmin={isAdmin}
          currentUserSchoolId={currentUser?.sekolahId}
          onSave={handleSaveLaporan}
          onDelete={(laporan) => {
            setDeleteTarget({
              id: laporan.id,
              nama: laporan.namaSekolah,
              bulan: laporan.bulan,
              tahunAjaran: laporan.tahunAjaran || selectedTahunAjaran
            });
          }}
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

      {/* MODAL: Sheet Perhitungan Inspection / Edit */}
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
          isReadOnly={!isAdmin}
        />
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
                  <span className="text-slate-400 block text-[10px]">Bulan &amp; Tahun:</span>
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

              {detailLaporan.sheetPerhitungan && (
                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{detailLaporan.sheetPerhitungan.namaSheet}</span>
                      <span className="text-[11px] text-slate-600 font-mono">
                        Saldo: <strong className="text-blue-800">Rp {detailLaporan.sheetPerhitungan.saldoBersih.toLocaleString('id-ID')}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSheetLaporan(detailLaporan);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs cursor-pointer transition shadow-2xs"
                  >
                    Buka Sheet
                  </button>
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

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
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

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const rep = detailLaporan;
                          setDetailLaporan(null);
                          setDeleteTarget({
                            id: rep.id,
                            nama: rep.namaSekolah,
                            bulan: rep.bulan,
                            tahunAjaran: rep.tahunAjaran || selectedTahunAjaran
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer text-xs active:scale-95"
                        title="Hapus atau batalkan data laporan jika sekolah ternyata belum kirim"
                      >
                        <Trash2 size={13} />
                        <span>Hapus / Batalkan Laporan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const rep = detailLaporan;
                          setDetailLaporan(null);
                          handleOpenEditModal(rep);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs"
                        title="Ubah data tanggal, status, atau catatan laporan"
                      >
                        <Edit3 size={13} />
                        <span>Edit Laporan</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailLaporan(null)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer text-xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await deleteLaporan(deleteTarget.id);
              showFeedback('success', `Laporan "${deleteTarget.nama}" (${deleteTarget.bulan} - TA ${deleteTarget.tahunAjaran}) berhasil dibatalkan / dihapus dari Firebase Firestore. Status sekolah untuk bulan tersebut telah kembali menjadi "Belum Kirim".`);
            } catch (err) {
              showFeedback('error', `Gagal menghapus laporan: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }}
        title="Hapus / Batalkan Laporan Bulanan"
        message="Apakah Anda yakin ingin membatalkan atau menghapus data laporan bulanan ini? Jika sekolah ini ternyata belum mengirimkan berkas asli tetapi tertulis sudah kirim, menghapus laporan ini akan mengembalikan status sekolah menjadi 'Belum Kirim'."
        itemName={deleteTarget ? `${deleteTarget.nama} (${deleteTarget.bulan} - TA ${deleteTarget.tahunAjaran})` : ''}
        confirmLabel="Ya, Hapus / Batalkan Laporan"
      />
    </div>
  );
};
