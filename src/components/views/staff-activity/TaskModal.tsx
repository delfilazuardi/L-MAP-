import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Award, 
  FileText, 
  Target, 
  Hash, 
  Info,
  CheckSquare,
  Square,
  Calculator,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  StaffActivity, 
  AdminMitraStaff, 
  MasterKpiStandar, 
  TAHUN_AJARAN_LIST, 
  TahapanBobotItem,
  DEFAULT_KPI_PROGRAMS
} from '../../../types';
import { 
  DAFTAR_15_STANDAR_KPI, 
  DEFAULT_TAHAPAN_BOBOT, 
  calculateTotalBobot 
} from '../../../data/masterKpiStandar';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<StaffActivity, 'id'>, id?: string) => Promise<void>;
  initialData?: StaffActivity | null;
  adminStaffList: AdminMitraStaff[];
  masterKpiList?: MasterKpiStandar[];
  onOpenMasterKpiModal?: () => void;
  sekolahList?: unknown;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  adminStaffList,
  masterKpiList = DAFTAR_15_STANDAR_KPI,
  onOpenMasterKpiModal,
}) => {
  const isEditMode = Boolean(initialData && initialData.id);

  // Toggle optional KPI section in Add Mode (in Edit Mode, it's always visible)
  const [showKpiSection, setShowKpiSection] = useState(false);

  // Master KPI Selection State (Supports Multi-KPI per Program/Task)
  const [selectedKpiIds, setSelectedKpiIds] = useState<string[]>(['STD-01']);
  const [noKpi, setNoKpi] = useState('KPI-01');
  const [standarKpi, setStandarKpi] = useState(masterKpiList[0]?.namaStandar || 'Standar 1: Kurikulum & Pendampingan MenDAKI');
  const [penjelasanKpi, setPenjelasanKpi] = useState(masterKpiList[0]?.penjelasanKpi || '');
  const [programKpi, setProgramKpi] = useState<string>('LATOF Akademik');
  const [customProgram, setCustomProgram] = useState('');
  const [isCustomProgram, setIsCustomProgram] = useState(false);

  // Task Details (The 5 core fields requested: tugas, tanggal mulai, deadline, status, catatan)
  const [tugas, setTugas] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<StaffActivity['status']>('Sedang Berjalan');
  const [hasilCatatan, setHasilCatatan] = useState('');

  // Secondary details
  const [namaStaff, setNamaStaff] = useState(adminStaffList[0]?.nama || 'Delfi Dwi Hermawati');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [catatanTindakLanjut, setCatatanTindakLanjut] = useState('');

  // Tahapan Pekerjaan & Bobot Otomatis State
  const [activeTahapanIds, setActiveTahapanIds] = useState<string[]>(['thp-pelaksanaan']);
  const [bobotKpi, setBobotKpi] = useState<number>(40);
  const [manualBobotOverride, setManualBobotOverride] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Available program options from the 18 official programs
  const availableProgramOptions = Array.from(
    new Set([
      ...DEFAULT_KPI_PROGRAMS,
    ])
  );

  // Helper to format KPI code display like "1.3 (KPI-03)" or "1.1 (KPI-01)"
  const getKpiDisplayLabel = (kpi: MasterKpiStandar) => {
    const subCode = `1.${kpi.nomor}`;
    return `${subCode} / ${kpi.noKpi}`;
  };

  // Synchronize when initialData or modal opens
  useEffect(() => {
    if (initialData) {
      const hasSpecificKpi = Boolean(
        (initialData.noKpi && initialData.noKpi !== '-') ||
          (initialData.noKpiList && initialData.noKpiList.length > 0) ||
          initialData.standarKpi
      );
      setShowKpiSection(isEditMode || hasSpecificKpi);

      // Parse existing KPI codes from noKpiList or comma-separated noKpi
      const codesFromData: string[] =
        initialData.noKpiList && initialData.noKpiList.length > 0
          ? initialData.noKpiList
          : initialData.noKpi && initialData.noKpi !== '-'
          ? initialData.noKpi
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const matchedKpis = masterKpiList.filter(
        (k) =>
          codesFromData.includes(k.noKpi) ||
          (initialData.standarKpi && initialData.standarKpi.includes(k.namaStandar))
      );

      if (matchedKpis.length > 0) {
        setSelectedKpiIds(matchedKpis.map((k) => k.id));
        setNoKpi(matchedKpis.map((k) => k.noKpi).join(', '));
        setStandarKpi(matchedKpis.map((k) => k.namaStandar).join(' | '));
        setPenjelasanKpi(
          initialData.penjelasanKpi ||
            matchedKpis.map((k) => `[${k.noKpi}] ${k.penjelasanKpi}`).join('\n')
        );
      } else {
        const firstKpi = masterKpiList[0] || DAFTAR_15_STANDAR_KPI[0];
        setSelectedKpiIds([firstKpi.id]);
        setNoKpi(initialData.noKpi && initialData.noKpi !== '-' ? initialData.noKpi : firstKpi.noKpi);
        setStandarKpi(initialData.standarKpi || firstKpi.namaStandar);
        setPenjelasanKpi(initialData.penjelasanKpi || firstKpi.penjelasanKpi);
      }

      const initProg = initialData.programKpi || matchedKpis[0]?.programKpi || 'LATOF Akademik';
      if (availableProgramOptions.includes(initProg)) {
        setIsCustomProgram(false);
        setProgramKpi(initProg);
        setCustomProgram('');
      } else {
        setIsCustomProgram(true);
        setProgramKpi('CUSTOM');
        setCustomProgram(initProg);
      }

      setTugas(initialData.tugas || initialData.judulAktivitas || '');
      setNamaStaff(initialData.namaStaff || adminStaffList[0]?.nama || 'Delfi Dwi Hermawati');
      setTahunAjaran(initialData.tahunAjaran || '2026/2027');
      setTanggal(initialData.tanggal || new Date().toISOString().split('T')[0]);
      setDeadline(
        initialData.deadline ||
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setStatus(initialData.status || 'Sedang Berjalan');

      // Restore tahapan if available
      if (initialData.tahapanDipilih && initialData.tahapanDipilih.length > 0) {
        const matchingIds: string[] = [];
        initialData.tahapanDipilih.forEach((thp) => {
          const found = DEFAULT_TAHAPAN_BOBOT.find((d) =>
            d.nama.toLowerCase().includes(thp.nama.toLowerCase().slice(0, 5))
          );
          if (found) matchingIds.push(found.id);
        });
        setActiveTahapanIds(matchingIds.length > 0 ? matchingIds : ['thp-pelaksanaan']);
      } else {
        setActiveTahapanIds(
          initialData.bobotKpi && initialData.bobotKpi >= 40
            ? ['thp-pelaksanaan']
            : ['thp-draft', 'thp-followup']
        );
      }

      setBobotKpi(initialData.bobotKpi || 40);
      setManualBobotOverride(false);
      setHasilCatatan(initialData.hasilCatatan || initialData.hasilKegiatan || '');
      setCatatanTindakLanjut(initialData.catatanTindakLanjut || '');
    } else {
      // Clean New Task Mode
      setShowKpiSection(true);

      const firstKpi = masterKpiList[0] || DAFTAR_15_STANDAR_KPI[0];
      setSelectedKpiIds([firstKpi.id]);
      setNoKpi(firstKpi.noKpi);
      setStandarKpi(firstKpi.namaStandar);
      setProgramKpi('SPARK');
      setIsCustomProgram(false);
      setPenjelasanKpi(firstKpi.penjelasanKpi);
      setCustomProgram('');

      setTugas('');
      setNamaStaff(adminStaffList[0]?.nama || 'Delfi Dwi Hermawati');
      setTahunAjaran('2026/2027');
      setTanggal(new Date().toISOString().split('T')[0]);
      setDeadline(
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setStatus('Sedang Berjalan');
      setActiveTahapanIds(['thp-pelaksanaan']);
      setBobotKpi(40);
      setManualBobotOverride(false);
      setHasilCatatan('');
      setCatatanTindakLanjut('');
    }
    setErrorMsg('');
  }, [initialData, isOpen, adminStaffList, masterKpiList, isEditMode]);

  // Recalculate bobot whenever active tahapan changes (unless manually overridden)
  useEffect(() => {
    if (!manualBobotOverride) {
      const selectedStages = DEFAULT_TAHAPAN_BOBOT.filter((thp) =>
        activeTahapanIds.includes(thp.id)
      );
      const total = calculateTotalBobot(selectedStages);
      setBobotKpi(total > 0 ? total : 10);
    }
  }, [activeTahapanIds, manualBobotOverride]);

  if (!isOpen) return null;

  // Toggle multi-KPI selection for a program/task
  const handleToggleKpiSelection = (kpiId: string) => {
    setSelectedKpiIds((prev) => {
      const exists = prev.includes(kpiId);
      const nextIds = exists
        ? prev.length > 1
          ? prev.filter((id) => id !== kpiId)
          : prev
        : [...prev, kpiId];

      const selectedObjs = masterKpiList.filter((k) => nextIds.includes(k.id));
      if (selectedObjs.length > 0) {
        setNoKpi(selectedObjs.map((k) => k.noKpi).join(', '));
        setStandarKpi(selectedObjs.map((k) => k.namaStandar).join(' | '));
        setPenjelasanKpi(
          selectedObjs.length === 1
            ? selectedObjs[0].penjelasanKpi
            : selectedObjs.map((k) => `[${k.noKpi}] ${k.penjelasanKpi}`).join('\n')
        );
      }
      return nextIds;
    });
  };

  // Toggle stage checkbox
  const handleToggleTahapan = (stageId: string) => {
    setManualBobotOverride(false);
    setActiveTahapanIds(prev => 
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    );
  };

  // Quick Preset Actions for Tahapan
  const applyPresetTahapan = (preset: 'lengkap' | 'eksekusi' | 'administrasi' | 'followup' | 'reset') => {
    setManualBobotOverride(false);
    switch (preset) {
      case 'lengkap':
        setActiveTahapanIds(DEFAULT_TAHAPAN_BOBOT.map(t => t.id));
        break;
      case 'eksekusi':
        setActiveTahapanIds(['thp-persiapan', 'thp-pelaksanaan']);
        break;
      case 'administrasi':
        setActiveTahapanIds(['thp-draft', 'thp-ttd']);
        break;
      case 'followup':
        setActiveTahapanIds(['thp-reminder', 'thp-followup']);
        break;
      case 'reset':
        setActiveTahapanIds(['thp-pelaksanaan']);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tugas.trim()) {
      setErrorMsg('Tugas / Uraian pekerjaan wajib diisi.');
      return;
    }
    if (!tanggal) {
      setErrorMsg('Tanggal mulai wajib diisi.');
      return;
    }
    if (!deadline) {
      setErrorMsg('Deadline wajib diisi.');
      return;
    }

    const hasKpi = isEditMode || showKpiSection;
    if (hasKpi && isCustomProgram && !customProgram.trim()) {
      setErrorMsg('Nama sasaran program kustom wajib diisi.');
      return;
    }

    const selectedKpiObjects = masterKpiList.filter((k) => selectedKpiIds.includes(k.id));
    const selectedProgramName = hasKpi
      ? isCustomProgram
        ? customProgram.trim()
        : programKpi
      : initialData?.programKpi || 'LATOF Akademik';

    const selectedTahapanObjects = hasKpi
      ? DEFAULT_TAHAPAN_BOBOT.filter((t) => activeTahapanIds.includes(t.id)).map((t) => ({
          nama: t.nama,
          bobot: t.bobot,
        }))
      : initialData?.tahapanDipilih || [];

    const finalNoKpiList = hasKpi
      ? selectedKpiObjects.map((k) => k.noKpi)
      : initialData?.noKpiList || [];
    const finalStandarKpiList = hasKpi
      ? selectedKpiObjects.map((k) => k.namaStandar)
      : initialData?.standarKpiList || [];

    const finalNoKpi = hasKpi
      ? finalNoKpiList.length > 0
        ? finalNoKpiList.join(', ')
        : noKpi.trim()
      : initialData?.noKpi || '-';
    const finalStandarKpi = hasKpi
      ? finalStandarKpiList.length > 0
        ? finalStandarKpiList.join(' | ')
        : standarKpi.trim()
      : initialData?.standarKpi || '';
    const finalPenjelasanKpi = hasKpi
      ? penjelasanKpi.trim()
      : initialData?.penjelasanKpi || '';
    const finalBobotKpi = hasKpi ? Number(bobotKpi) || 20 : initialData?.bobotKpi || 20;

    try {
      setIsSubmitting(true);
      await onSave(
        {
          noKpi: finalNoKpi,
          noKpiList: finalNoKpiList,
          standarKpi: finalStandarKpi,
          standarKpiList: finalStandarKpiList,
          penjelasanKpi: finalPenjelasanKpi,
          programKpi: selectedProgramName,
          tugas: tugas.trim(),
          judulAktivitas: tugas.trim(),
          namaStaff,
          tahunAjaran,
          tanggal,
          deadline,
          status,
          bobotKpi: finalBobotKpi,
          tahapanDipilih: selectedTahapanObjects,
          hasilCatatan: hasilCatatan.trim(),
          catatanTindakLanjut: catatanTindakLanjut.trim(),
          googleCalendarSynced: true,
        },
        initialData?.id
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data pekerjaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedKpiObjects = masterKpiList.filter((k) => selectedKpiIds.includes(k.id));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden text-slate-900 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold shadow-xs">
              {isEditMode ? <Target size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {isEditMode ? 'Rangkuman Log Pekerjaan & Kelola KPI' : 'Tambah Tugas Baru'}
              </h3>
              <p className="text-xs text-blue-100">
                {isEditMode 
                  ? 'Sesuaikan rincian tugas, hubungkan 15 Standar KPI, dan kalkulasi bobot'
                  : 'Lengkapi: Tugas, Tanggal Mulai, Deadline, Status, dan Catatan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* LANGKAH 1: TUGAS YANG DIKERJAKAN */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block font-black text-slate-900 text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <span>Tugas / Pekerjaan yang Dikerjakan <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              required
              rows={2}
              value={tugas}
              onChange={(e) => setTugas(e.target.value)}
              placeholder="Contoh: Menyiapkan pelaksanaan kegiatan SPARK dan koordinasi peserta sekolah mitra..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-xs leading-relaxed"
            />
          </div>

          {/* LANGKAH 2: DROPDOWN PROGRAM KERJA (MISAL: SPARK, LATOF AKADEMIK, DLL) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border-2 border-indigo-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-black text-slate-900 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
                <span>Pilih Program Kerja (Dropdown Program) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                Contoh: SPARK, LATOF Akademik, dll.
              </span>
            </div>

            <select
              value={isCustomProgram ? 'CUSTOM' : programKpi}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setIsCustomProgram(true);
                } else {
                  setIsCustomProgram(false);
                  setProgramKpi(e.target.value);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900 text-xs shadow-xs cursor-pointer"
            >
              <optgroup label="DAFTAR PROGRAM MITRA OFFICE">
                {availableProgramOptions.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </optgroup>
              <optgroup label="TAMBAH PROGRAM LAINNYA">
                <option value="CUSTOM">+ Ketik Nama Program Baru...</option>
              </optgroup>
            </select>

            {isCustomProgram && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customProgram}
                  onChange={(e) => setCustomProgram(e.target.value)}
                  placeholder="Ketik nama program (Contoh: SPARK / LATOF Akademik)..."
                  className="w-full px-3.5 py-2 bg-white border-2 border-indigo-400 rounded-xl font-bold text-slate-900 text-xs"
                />
              </div>
            )}
          </div>

          {/* LANGKAH 3: PILIH KPI (BISA PILIH MISAL 1.3 DAN 1.4 SEKALIGUS) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-2 border-blue-200/90 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="font-black text-slate-900 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
                <span>Pilih KPI Terkait (Bisa Pilih Lebih dari 1, misal 1.3 & 1.4)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px]">
                  {selectedKpiIds.length} KPI Dipilih
                </span>
                {onOpenMasterKpiModal && (
                  <button
                    type="button"
                    onClick={onOpenMasterKpiModal}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Master KPI</span>
                    <ExternalLink size={10} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto p-2 bg-white rounded-xl border border-blue-200">
              {masterKpiList.map((kpi) => {
                const isChecked = selectedKpiIds.includes(kpi.id);
                const kpiLabel = getKpiDisplayLabel(kpi);
                return (
                  <div
                    key={kpi.id}
                    onClick={() => handleToggleKpiSelection(kpi.id)}
                    className={`p-2 rounded-lg border transition cursor-pointer flex items-start gap-2 ${
                      isChecked
                        ? 'bg-blue-50/90 border-blue-500 text-slate-900 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square size={15} className="text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono font-black text-[10px] shrink-0 ${
                            isChecked
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {kpiLabel}
                        </span>
                        <span className="font-bold text-[11px] truncate">
                          {kpi.namaStandar.replace(/^Standar \d+:\s*/i, '')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {kpi.penjelasanKpi}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ringkasan KPI Terpilih */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-xl bg-white border border-blue-200">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-600">KPI Terpilih:</span>
                {selectedKpiObjects.map((k) => (
                  <span
                    key={k.id}
                    className="px-2 py-0.5 rounded-lg bg-blue-700 text-white font-mono font-black text-[11px]"
                  >
                    1.{k.nomor} ({k.noKpi})
                  </span>
                ))}
              </div>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Program: {isCustomProgram ? customProgram || 'Program Baru' : programKpi}
              </span>
            </div>
          </div>

          {/* LANGKAH 4: TAHAP PEKERJAAN (KALKULATOR BOBOT OTOMATIS) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-2 border-emerald-300 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                  4
                </span>
                <Calculator size={15} className="text-emerald-700" />
                <span className="font-black text-slate-900 text-xs">
                  Pilih Tahap Pekerjaan (Otomatis Hitung Bobot KPI)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-600 font-medium">Bobot Terhitung:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-black text-xs shadow-2xs">
                  {bobotKpi} Poin
                </span>
              </div>
            </div>

            {/* Preset Fast Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-semibold">Pilihan Cepat:</span>
              <button
                type="button"
                onClick={() => applyPresetTahapan('lengkap')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium cursor-pointer shadow-2xs"
              >
                Lengkap (100 Poin)
              </button>
              <button
                type="button"
                onClick={() => applyPresetTahapan('eksekusi')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium cursor-pointer shadow-2xs"
              >
                Persiapan + Pelaksanaan (50 Poin)
              </button>
              <button
                type="button"
                onClick={() => applyPresetTahapan('administrasi')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium cursor-pointer shadow-2xs"
              >
                Draft + TTD (20 Poin)
              </button>
              <button
                type="button"
                onClick={() => applyPresetTahapan('followup')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium cursor-pointer shadow-2xs"
              >
                Reminder + Follow-up (20 Poin)
              </button>
            </div>

            {/* Checkbox List for Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_TAHAPAN_BOBOT.map((stage) => {
                const isChecked = activeTahapanIds.includes(stage.id);
                return (
                  <div
                    key={stage.id}
                    onClick={() => handleToggleTahapan(stage.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-white border-emerald-500 shadow-2xs text-slate-900'
                        : 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-300 shrink-0" />
                      )}
                      <span className={`text-xs ${isChecked ? 'font-bold text-slate-900' : 'font-medium'}`}>
                        {stage.nama}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      +{stage.bobot}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Manual override option */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-[11px] text-slate-600">
              <span className="italic">Kombinasi tahapan menjumlahkan bobot otomatis.</span>
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700">Override Manual:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bobotKpi}
                  onChange={(e) => {
                    setManualBobotOverride(true);
                    setBobotKpi(Number(e.target.value));
                  }}
                  className="w-16 px-2 py-0.5 bg-white border border-emerald-300 rounded font-bold font-mono text-emerald-800 text-center"
                />
              </div>
            </div>
          </div>

          {/* LANGKAH 5: RENCANA TINDAK LANJUT & CATATAN PROGRES */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label className="block font-black text-slate-900 mb-1.5 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                  5
                </span>
                <span>Rencana Tindak Lanjut (Follow-up)</span>
              </label>
              <input
                type="text"
                value={catatanTindakLanjut}
                onChange={(e) => setCatatanTindakLanjut(e.target.value)}
                placeholder="Contoh: Koordinasi lanjutan dengan kepala sekolah mitra dan finalisasi jadwal SPARK..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                Catatan Hasil / Progres Pekerjaan (Opsional)
              </label>
              <textarea
                rows={2}
                value={hasilCatatan}
                onChange={(e) => setHasilCatatan(e.target.value)}
                placeholder="Catatan perkembangan, link dokumen, atau hasil pelaksanaan..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-xs"
              />
            </div>

            {/* TANGGAL MULAI, DEADLINE, STATUS & PIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Deadline <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Status Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StaffActivity['status'])}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900"
                >
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Belum Dimulai">Belum Dimulai</option>
                  <option value="Tertunda">Tertunda</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Penanggung Jawab (PIC)
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={namaStaff}
                    onChange={(e) => setNamaStaff(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  >
                    {adminStaffList.map((stf) => (
                      <option key={stf.id} value={stf.nama}>
                        {stf.nama} ({stf.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
