import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Building, 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { SekolahMitra, LaporanBulanan, LaporanStatus, SheetPerhitunganData } from '../../../types';

export const BULAN_ACADEMIC_LIST = [
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni'
] as const;

export const TAHUN_AJARAN_OPTIONS = [
  '2026/2027',
  '2025/2026',
  '2027/2028'
] as const;

interface FormLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolahList: SekolahMitra[];
  initialData?: LaporanBulanan | null;
  defaultSekolahId?: string;
  defaultBulan?: string;
  defaultTahunAjaran?: string;
  isAdmin: boolean;
  currentUserSchoolId?: string;
  onSave: (data: Omit<LaporanBulanan, 'id' | 'tanggalDiajukan'>, editId?: string) => Promise<void>;
  onOpenSheetModal?: (sheetData: SheetPerhitunganData | null, onSaveSheet: (s: SheetPerhitunganData) => void) => void;
}

export const FormLaporanModal: React.FC<FormLaporanModalProps> = ({
  isOpen,
  onClose,
  sekolahList,
  initialData,
  defaultSekolahId,
  defaultBulan,
  defaultTahunAjaran = '2026/2027',
  isAdmin,
  currentUserSchoolId,
  onSave
}) => {
  const [sekolahId, setSekolahId] = useState<string>('');
  const [bulan, setBulan] = useState<string>('September');
  const [tahunAjaran, setTahunAjaran] = useState<string>(defaultTahunAjaran);
  const [tanggalKirim, setTanggalKirim] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusLaporan, setStatusLaporan] = useState<LaporanStatus>('Diajukan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSekolahId(initialData.mitraId);
      setBulan(initialData.bulan);
      setTahunAjaran(initialData.tahunAjaran || '2026/2027');
      setTanggalKirim(initialData.tanggalKirim || initialData.tanggalDiajukan || new Date().toISOString().split('T')[0]);
      setStatusLaporan(initialData.status);
    } else {
      const initialSchId = defaultSekolahId || (currentUserSchoolId ? currentUserSchoolId : sekolahList[0]?.id || 'MO004');
      setSekolahId(initialSchId);
      setBulan(defaultBulan || 'September');
      setTahunAjaran(defaultTahunAjaran);
      setTanggalKirim(new Date().toISOString().split('T')[0]);
      setStatusLaporan('Diajukan');
    }
  }, [initialData, defaultSekolahId, defaultBulan, defaultTahunAjaran, currentUserSchoolId, sekolahList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolahId) return;

    setIsSubmitting(true);
    try {
      const selectedSchool = sekolahList.find(s => s.id === sekolahId);
      const namaSekolah = selectedSchool ? selectedSchool.namaSekolah : 'Sekolah Mitra';
      
      // Calculate numeric calendar year from academic year and month:
      // In academic year '2026/2027', Juli-Desember is 2026, Januari-Juni is 2027
      const startYear = parseInt(tahunAjaran.split('/')[0], 10) || 2026;
      const isSecondHalf = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'].includes(bulan);
      const calculatedYear = isSecondHalf ? startYear + 1 : startYear;

      await onSave({
        mitraId: sekolahId,
        namaSekolah,
        bulan,
        tahun: calculatedYear,
        tahunAjaran,
        tanggalKirim,
        status: statusLaporan,
        kategori: initialData?.kategori || 'Komprehensif',
        ringkasan: initialData?.ringkasan || `Laporan Bulanan periode ${bulan} ${calculatedYear} TA ${tahunAjaran}`,
        kendala: initialData?.kendala || '',
        solusi: initialData?.solusi || '',
        linkDokumen: initialData?.linkDokumen || '',
        sheetPerhitungan: initialData?.sheetPerhitungan,
      }, initialData?.id);

      onClose();
    } catch (err) {
      console.error('Failed to save laporan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Laporan Bulanan' : 'Input Laporan Bulanan Sekolah'}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi identitas sekolah, periode, tanggal kirim, dan status
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* 1. Nama Sekolah Mitra */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
              <Building size={14} className="text-blue-600" />
              <span>Nama Sekolah Mitra <span className="text-rose-500">*</span></span>
            </label>
            {isAdmin ? (
              <select
                id="form-nama-sekolah"
                value={sekolahId}
                onChange={(e) => setSekolahId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                required
              >
                {sekolahList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah} ({s.kota} - {s.jenjang})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 flex items-center justify-between">
                <span>{sekolahList.find(s => s.id === sekolahId)?.namaSekolah || 'Sekolah Mitra'}</span>
                <span className="text-[11px] font-mono text-slate-400">ID: {sekolahId}</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400 block">
              {isAdmin ? 'Pilih sekolah mitra yang menyerahkan laporan bulanan ini' : 'Laporan terasosiasi dengan akun sekolah Anda'}
            </span>
          </div>

          {/* 2. Grid: Bulan Laporan & Tahun Ajaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <Calendar size={14} className="text-blue-600" />
                <span>Bulan Laporan <span className="text-rose-500">*</span></span>
              </label>
              <select
                id="form-bulan-laporan"
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                required
              >
                {BULAN_ACADEMIC_LIST.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 block">Kalender Pendidikan (Juli - Juni)</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <CalendarDays size={14} className="text-blue-600" />
                <span>Tahun Ajaran <span className="text-rose-500">*</span></span>
              </label>
              <select
                id="form-tahun-ajaran"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                required
              >
                {TAHUN_AJARAN_OPTIONS.map(ta => (
                  <option key={ta} value={ta}>TA {ta}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 block">Tahun ajaran operasional</span>
            </div>
          </div>

          {/* 3. Grid: Tanggal Kirim & Status Laporan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <Clock size={14} className="text-blue-600" />
                <span>Tanggal Kirim <span className="text-rose-500">*</span></span>
              </label>
              <input
                id="form-tanggal-kirim"
                type="date"
                value={tanggalKirim}
                onChange={(e) => setTanggalKirim(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 block">Tanggal penyerahan dokumen</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <CheckCircle2 size={14} className="text-blue-600" />
                <span>Status Laporan <span className="text-rose-500">*</span></span>
              </label>
              <select
                id="form-status-laporan"
                value={statusLaporan}
                onChange={(e) => setStatusLaporan(e.target.value as LaporanStatus)}
                disabled={!isAdmin && initialData?.status === 'Diterima'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                required
              >
                <option value="Diajukan">Diajukan (Menunggu Review)</option>
                <option value="Direview">Direview (Sedang Diverifikasi)</option>
                <option value="Diterima">Diterima (Disetujui)</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
              </select>
              <span className="text-[10px] text-slate-400 block">
                {isAdmin ? 'Verifikasi status oleh Mitra Office' : 'Default "Diajukan" untuk pengiriman baru'}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send size={14} />
              <span>{initialData ? 'Simpan Perubahan' : 'Kirim Laporan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
