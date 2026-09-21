import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Building, 
  Calendar, 
  Clock, 
  Send, 
  CheckCircle2,
  CalendarDays,
  Plus,
  Check
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

export const BASE_TAHUN_AJARAN_OPTIONS: string[] = [
  '2022/2023',
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029'
];

export const TAHUN_AJARAN_OPTIONS = BASE_TAHUN_AJARAN_OPTIONS;

interface FormLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sekolahList: SekolahMitra[];
  initialData?: LaporanBulanan | null;
  defaultSekolahId?: string;
  defaultBulan?: string;
  defaultTahunAjaran?: string;
  existingTahunAjaranList?: string[];
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
  existingTahunAjaranList,
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

  // Dynamic academic year list starting from 2022/2023 + user added
  const [availableTahunAjaranList, setAvailableTahunAjaranList] = useState<string[]>(() => {
    const set = new Set<string>(BASE_TAHUN_AJARAN_OPTIONS);
    if (existingTahunAjaranList) {
      existingTahunAjaranList.forEach(ta => ta && set.add(ta.trim()));
    }
    if (initialData?.tahunAjaran) {
      set.add(initialData.tahunAjaran.trim());
    }
    if (defaultTahunAjaran) {
      set.add(defaultTahunAjaran.trim());
    }
    return Array.from(set).sort((a, b) => {
      const yA = parseInt(a.split('/')[0], 10) || 0;
      const yB = parseInt(b.split('/')[0], 10) || 0;
      return yA - yB;
    });
  });

  const [isCustomTAMode, setIsCustomTAMode] = useState(false);
  const [customTAInput, setCustomTAInput] = useState('');
  const [customTAError, setCustomTAError] = useState('');

  useEffect(() => {
    if (existingTahunAjaranList && existingTahunAjaranList.length > 0) {
      setAvailableTahunAjaranList(prev => {
        const set = new Set<string>([...prev, ...existingTahunAjaranList]);
        return Array.from(set).sort((a, b) => {
          const yA = parseInt(a.split('/')[0], 10) || 0;
          const yB = parseInt(b.split('/')[0], 10) || 0;
          return yA - yB;
        });
      });
    }
  }, [existingTahunAjaranList]);

  useEffect(() => {
    if (initialData) {
      setSekolahId(initialData.mitraId);
      setBulan(initialData.bulan);
      const ta = initialData.tahunAjaran || '2026/2027';
      setTahunAjaran(ta);
      setAvailableTahunAjaranList(prev => {
        if (!prev.includes(ta)) {
          return [...prev, ta].sort((a, b) => {
            const yA = parseInt(a.split('/')[0], 10) || 0;
            const yB = parseInt(b.split('/')[0], 10) || 0;
            return yA - yB;
          });
        }
        return prev;
      });
      setTanggalKirim(initialData.tanggalKirim || initialData.tanggalDiajukan || new Date().toISOString().split('T')[0]);
      setStatusLaporan(initialData.status);
      setIsCustomTAMode(false);
    } else {
      const initialSchId = defaultSekolahId || (currentUserSchoolId ? currentUserSchoolId : sekolahList[0]?.id || 'MO004');
      setSekolahId(initialSchId);
      setBulan(defaultBulan || 'September');
      setTahunAjaran(defaultTahunAjaran);
      setTanggalKirim(new Date().toISOString().split('T')[0]);
      setStatusLaporan('Diajukan');
      setIsCustomTAMode(false);
    }
  }, [initialData, defaultSekolahId, defaultBulan, defaultTahunAjaran, currentUserSchoolId, sekolahList]);

  const formatTahunAjaran = (val: string) => {
    const clean = val.trim();
    if (!clean) return '';
    if (clean.includes('-')) {
      const parts = clean.split('-').map(p => p.trim());
      if (parts.length === 2) return `${parts[0]}/${parts[1]}`;
    }
    if (clean.includes(' ')) {
      const parts = clean.split(/\s+/);
      if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 4) {
        return `${parts[0]}/${parts[1]}`;
      }
    }
    if (/^\d{4}$/.test(clean)) {
      const y = parseInt(clean, 10);
      return `${y}/${y + 1}`;
    }
    return clean;
  };

  const handleApplyCustomTA = () => {
    const formatted = formatTahunAjaran(customTAInput);
    if (!formatted) {
      setCustomTAError('Harap masukkan tahun ajaran (contoh: 2029/2030).');
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(formatted)) {
      setCustomTAError('Format harus berupa tahun/tahun (contoh: 2029/2030).');
      return;
    }

    setAvailableTahunAjaranList(prev => {
      const set = new Set<string>([...prev, formatted]);
      return Array.from(set).sort((a, b) => {
        const yA = parseInt(a.split('/')[0], 10) || 0;
        const yB = parseInt(b.split('/')[0], 10) || 0;
        return yA - yB;
      });
    });

    setTahunAjaran(formatted);
    setIsCustomTAMode(false);
    setCustomTAInput('');
    setCustomTAError('');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sekolahId) return;

    setIsSubmitting(true);
    try {
      const selectedSchool = sekolahList.find(s => s.id === sekolahId);
      const namaSekolah = selectedSchool ? selectedSchool.namaSekolah : 'Sekolah Mitra';
      
      let finalTahunAjaran = tahunAjaran;
      if (isCustomTAMode && customTAInput.trim()) {
        const formatted = formatTahunAjaran(customTAInput);
        if (formatted) {
          finalTahunAjaran = formatted;
        }
      }

      // Calculate numeric calendar year from academic year and month:
      // In academic year '2026/2027', Juli-Desember is 2026, Januari-Juni is 2027
      const startYear = parseInt(finalTahunAjaran.split('/')[0], 10) || 2026;
      const isSecondHalf = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'].includes(bulan);
      const calculatedYear = isSecondHalf ? startYear + 1 : startYear;

      await onSave({
        mitraId: sekolahId,
        namaSekolah,
        bulan,
        tahun: calculatedYear,
        tahunAjaran: finalTahunAjaran,
        tanggalKirim,
        status: statusLaporan,
        kategori: initialData?.kategori || 'Komprehensif',
        ringkasan: initialData?.ringkasan || `Laporan Bulanan periode ${bulan} ${calculatedYear} TA ${finalTahunAjaran}`,
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
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                  <CalendarDays size={14} className="text-blue-600" />
                  <span>Tahun Ajaran <span className="text-rose-500">*</span></span>
                </label>
                {!isCustomTAMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTAMode(true);
                      setCustomTAInput('');
                      setCustomTAError('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Tambah TA Baru</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTAMode(false);
                      setCustomTAError('');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  >
                    ← Pilih dari List
                  </button>
                )}
              </div>

              {!isCustomTAMode ? (
                <>
                  <select
                    id="form-tahun-ajaran"
                    value={tahunAjaran}
                    onChange={(e) => {
                      if (e.target.value === '__TAMBAH_BARU__') {
                        setIsCustomTAMode(true);
                        setCustomTAInput('');
                        setCustomTAError('');
                      } else {
                        setTahunAjaran(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                    required
                  >
                    {availableTahunAjaranList.map(ta => (
                      <option key={ta} value={ta}>TA {ta}</option>
                    ))}
                    <option value="__TAMBAH_BARU__" className="text-blue-600 font-bold bg-blue-50">
                      ➕ Tambah Tahun Ajaran Baru...
                    </option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">Tahun ajaran operasional (mulai 2022/2023)</span>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-custom-ta"
                      type="text"
                      value={customTAInput}
                      onChange={(e) => {
                        setCustomTAInput(e.target.value);
                        if (customTAError) setCustomTAError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCustomTA();
                        }
                      }}
                      placeholder="Contoh: 2029/2030"
                      className="flex-1 px-3.5 py-2 bg-blue-50/50 border border-blue-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomTA}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Check size={14} />
                      <span>Gunakan</span>
                    </button>
                  </div>
                  {customTAError ? (
                    <span className="text-[10px] text-rose-500 font-semibold block">{customTAError}</span>
                  ) : (
                    <span className="text-[10px] text-blue-600 block">Ketik format YYYY/YYYY (misal: 2029/2030) lalu klik Gunakan</span>
                  )}
                </div>
              )}
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
