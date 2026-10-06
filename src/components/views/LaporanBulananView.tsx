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
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LaporanBulanan, LaporanStatus, SheetPerhitunganData } from '../../types';
import { SheetPerhitunganModal } from './laporan-bulanan/SheetPerhitunganModal';
import { FormLaporanModal, BASE_TAHUN_AJARAN_OPTIONS } from './laporan-bulanan/FormLaporanModal';
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

  // Academic Year State
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('2026/2027');

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

  // Detail Modal State (when clicked from matrix)
  const [detailLaporan, setDetailLaporan] = useState<LaporanBulanan | null>(null);

  // Delete Target State
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
                Monitoring berkala kepatuhan sekolah dan rangkuman ketepatan waktu pelaporan bulanan
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

      {/* Rangkuman & Matriks Kepatuhan (Peringkat Top TA & Matriks 12 Bulan) */}
      <RangkumanKepatuhanSekolah
        sekolahList={effectiveSekolahList}
        laporanList={effectiveLaporanList}
        selectedTahunAjaran={selectedTahunAjaran}
        onChangeTahunAjaran={setSelectedTahunAjaran}
        onOpenCreateModal={(sekolahId, bulan) => handleOpenCreateModal(sekolahId, bulan)}
        onViewLaporanDetail={(laporan) => setDetailLaporan(laporan)}
      />

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
                  {isAdmin && (
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
                  )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteLaporan(deleteTarget.id);
          }
        }}
        title="Hapus Laporan Bulanan"
        message="Apakah Anda yakin ingin menghapus data laporan bulanan ini? Data yang telah dihapus tidak dapat dipulihkan."
        itemName={deleteTarget ? `${deleteTarget.nama} (${deleteTarget.bulan} - ${deleteTarget.tahunAjaran})` : ''}
        confirmLabel="Hapus Laporan"
      />
    </div>
  );
};
