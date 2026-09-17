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
  TahapanBobotItem 
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

  // Master KPI Selection State
  const [selectedKpiId, setSelectedKpiId] = useState<string>('STD-01');
  const [noKpi, setNoKpi] = useState('KPI-01');
  const [standarKpi, setStandarKpi] = useState(masterKpiList[0]?.namaStandar || 'Standar 1: Kurikulum & Pendampingan MenDAKI');
  const [penjelasanKpi, setPenjelasanKpi] = useState(masterKpiList[0]?.penjelasanKpi || '');
  const [programKpi, setProgramKpi] = useState<string>(masterKpiList[0]?.programKpi || 'Supervisi & Pendampingan Kurikulum/MenDAKI');
  const [customProgram, setCustomProgram] = useState('');
  const [isCustomKpi, setIsCustomKpi] = useState(false);

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

  // Synchronize when initialData or modal opens
  useEffect(() => {
    if (initialData) {
      // In edit mode or when preselected from master KPI modal
      const hasSpecificKpi = Boolean(initialData.noKpi || initialData.standarKpi);
      setShowKpiSection(isEditMode || hasSpecificKpi);

      const matchKpi = masterKpiList.find(
        k => k.noKpi === initialData.noKpi || (initialData.standarKpi && k.namaStandar === initialData.standarKpi)
      );

      if (matchKpi) {
        setSelectedKpiId(matchKpi.id);
        setIsCustomKpi(false);
        setNoKpi(matchKpi.noKpi);
        setStandarKpi(matchKpi.namaStandar);
        setProgramKpi(matchKpi.programKpi);
        setPenjelasanKpi(initialData.penjelasanKpi || matchKpi.penjelasanKpi);
      } else if (initialData.standarKpi || initialData.noKpi) {
        setSelectedKpiId('CUSTOM');
        setIsCustomKpi(true);
        setNoKpi(initialData.noKpi || 'KPI-01');
        setStandarKpi(initialData.standarKpi || 'Standar Kustom');
        setProgramKpi(initialData.programKpi || 'Program Kustom');
        setCustomProgram(initialData.programKpi || '');
        setPenjelasanKpi(initialData.penjelasanKpi || '');
      } else {
        // Fallback default KPI for when they choose to add it
        const firstKpi = masterKpiList[0] || DAFTAR_15_STANDAR_KPI[0];
        setSelectedKpiId(firstKpi.id);
        setIsCustomKpi(false);
        setNoKpi(firstKpi.noKpi);
        setStandarKpi(firstKpi.namaStandar);
        setProgramKpi(firstKpi.programKpi);
        setPenjelasanKpi(firstKpi.penjelasanKpi);
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
        initialData.tahapanDipilih.forEach(thp => {
          const found = DEFAULT_TAHAPAN_BOBOT.find(d => d.nama.toLowerCase().includes(thp.nama.toLowerCase().slice(0, 5)));
          if (found) matchingIds.push(found.id);
        });
        setActiveTahapanIds(matchingIds.length > 0 ? matchingIds : ['thp-pelaksanaan']);
      } else {
        setActiveTahapanIds(initialData.bobotKpi && initialData.bobotKpi >= 40 ? ['thp-pelaksanaan'] : ['thp-draft', 'thp-followup']);
      }

      setBobotKpi(initialData.bobotKpi || 40);
      setManualBobotOverride(false);
      setHasilCatatan(initialData.hasilCatatan || initialData.hasilKegiatan || '');
      setCatatanTindakLanjut(initialData.catatanTindakLanjut || '');
    } else {
      // Clean New Task Mode: Just 5 core fields
      setShowKpiSection(false);

      const firstKpi = masterKpiList[0] || DAFTAR_15_STANDAR_KPI[0];
      setSelectedKpiId(firstKpi.id);
      setIsCustomKpi(false);
      setNoKpi(firstKpi.noKpi);
      setStandarKpi(firstKpi.namaStandar);
      setProgramKpi(firstKpi.programKpi);
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
      const selectedStages = DEFAULT_TAHAPAN_BOBOT.filter(thp => activeTahapanIds.includes(thp.id));
      const total = calculateTotalBobot(selectedStages);
      setBobotKpi(total > 0 ? total : 10);
    }
  }, [activeTahapanIds, manualBobotOverride]);

  if (!isOpen) return null;

  // Handler for KPI Dropdown selection
  const handleKpiDropdownChange = (val: string) => {
    setSelectedKpiId(val);
    if (val === 'CUSTOM') {
      setIsCustomKpi(true);
      setNoKpi('KPI-Kustom');
      setStandarKpi('Standar Kustom Mitra Office');
      setProgramKpi('');
      setPenjelasanKpi('');
    } else {
      setIsCustomKpi(false);
      const found = masterKpiList.find(k => k.id === val);
      if (found) {
        setNoKpi(found.noKpi);
        setStandarKpi(found.namaStandar);
        setProgramKpi(found.programKpi);
        setPenjelasanKpi(found.penjelasanKpi);
      }
    }
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
    if (hasKpi && isCustomKpi && !customProgram.trim()) {
      setErrorMsg('Nama sasaran program KPI kustom wajib diisi.');
      return;
    }

    const selectedProgramName = hasKpi ? (isCustomKpi ? customProgram.trim() : programKpi) : (initialData?.programKpi || 'Operasional Mitra Office');
    const selectedTahapanObjects = hasKpi 
      ? DEFAULT_TAHAPAN_BOBOT.filter(t => activeTahapanIds.includes(t.id)).map(t => ({
          nama: t.nama,
          bobot: t.bobot
        }))
      : (initialData?.tahapanDipilih || []);

    const finalNoKpi = hasKpi ? noKpi.trim() : (initialData?.noKpi || '-');
    const finalStandarKpi = hasKpi ? standarKpi.trim() : (initialData?.standarKpi || '');
    const finalPenjelasanKpi = hasKpi ? penjelasanKpi.trim() : (initialData?.penjelasanKpi || '');
    const finalBobotKpi = hasKpi ? (Number(bobotKpi) || 20) : (initialData?.bobotKpi || 20);

    try {
      setIsSubmitting(true);
      await onSave(
        {
          noKpi: finalNoKpi,
          standarKpi: finalStandarKpi,
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

  const selectedKpiObj = masterKpiList.find(k => k.id === selectedKpiId);

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
          {/* FIELD 1: TUGAS / URAIAN PEKERJAAN */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 text-xs">
              Tugas / Uraian Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={tugas}
              onChange={(e) => setTugas(e.target.value)}
              placeholder="Contoh: Menyiapkan materi kurikulum MenDAKI dan konfirmasi kehadiran kepala sekolah mitra..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-xs leading-relaxed"
            />
          </div>

          {/* FIELD 2 & 3: TANGGAL MULAI & DEADLINE (Grid 2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* FIELD 4 & PIC: STATUS & PENANGGUNG JAWAB (PIC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">
                Status Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffActivity['status'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
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

          {/* FIELD 5: CATATAN / KETERANGAN */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">
              Catatan / Progres Pekerjaan
            </label>
            <textarea
              rows={2}
              value={hasilCatatan}
              onChange={(e) => setHasilCatatan(e.target.value)}
              placeholder="Catatan perkembangan, link dokumen, atau catatan pelaksanaan..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 text-xs"
            />
          </div>

          {/* TOGGLE FOR KPI IN ADD MODE (OR ALWAYS VISIBLE IN EDIT / LOG MODE) */}
          {!isEditMode && (
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowKpiSection(!showKpiSection)}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-slate-700 hover:text-blue-800 font-semibold flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs">
                  <Target size={15} className="text-blue-600" />
                  <span>
                    {showKpiSection 
                      ? 'Sembunyikan Pengaturan KPI & Bobot' 
                      : '+ Hubungkan ke 15 Standar KPI Sekarang (Opsional)'}
                  </span>
                </div>
                {showKpiSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          )}

          {/* KPI SECTION: VISIBLE IN EDIT / RANGKUMAN LOG MODE, OR WHEN TOGGLED */}
          {(isEditMode || showKpiSection) && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-200">
              {/* SECTION: DROPDOWN 15 STANDAR & 15 KPI */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-2 border-blue-200/90 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-blue-700" />
                    <label className="font-black text-slate-900 text-xs">
                      Pilih Standar & KPI (15 Standar Tersedia)
                    </label>
                  </div>
                  {onOpenMasterKpiModal && (
                    <button
                      type="button"
                      onClick={onOpenMasterKpiModal}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Kelola Master 15 KPI</span>
                      <ExternalLink size={10} />
                    </button>
                  )}
                </div>

                {/* Dropdown with all 15 Standards & KPIs */}
                <div className="relative">
                  <select
                    id="select-kpi-standar-dropdown"
                    value={selectedKpiId}
                    onChange={(e) => handleKpiDropdownChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900 text-xs shadow-xs cursor-pointer"
                  >
                    <optgroup label="15 STANDAR MUTU & 15 KPI MITRA OFFICE">
                      {masterKpiList.map((kpi) => (
                        <option key={kpi.id} value={kpi.id}>
                          [{kpi.noKpi}] {kpi.namaStandar} — {kpi.programKpi}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="LAINNYA">
                      <option value="CUSTOM">+ Tulis Sasaran Program & KPI Kustom...</option>
                    </optgroup>
                  </select>
                </div>

                {/* If Custom KPI selected */}
                {isCustomKpi && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">No. KPI Kustom</label>
                      <input
                        type="text"
                        value={noKpi}
                        onChange={(e) => setNoKpi(e.target.value)}
                        placeholder="Contoh: KPI-16"
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sasaran Program Kustom</label>
                      <input
                        type="text"
                        value={customProgram}
                        onChange={(e) => setCustomProgram(e.target.value)}
                        placeholder="Ketik nama program..."
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* CARD DETAIL PENJELASAN KPI TERPILIH */}
                <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-700 text-white font-mono font-black text-xs">
                        {noKpi}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {standarKpi}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {programKpi}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Info size={12} className="text-blue-600" />
                      <span>Penjelasan KPI & Indikator Target Keberhasilan (Bisa Diedit):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={penjelasanKpi}
                      onChange={(e) => setPenjelasanKpi(e.target.value)}
                      placeholder="Uraian penjelasan KPI..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 leading-relaxed"
                    />
                  </div>

                  {selectedKpiObj?.targetOutput && (
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <span className="text-slate-700 font-semibold">Target Output:</span>
                      <span className="text-blue-700">{selectedKpiObj.targetOutput}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: KALKULATOR BOBOT OTOMATIS (TAHAPAN PEKERJAAN) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-2 border-emerald-300 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-emerald-700" />
                    <span className="font-black text-slate-900 text-xs">
                      Kalkulator Bobot Otomatis (Tahapan Pekerjaan)
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

                {/* Checkbox List for 6 Stages */}
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

              {/* SECTION: CATATAN TINDAK LANJUT (FOLLOW-UP) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  Rencana Tindak Lanjut (Follow-up)
                </label>
                <input
                  type="text"
                  value={catatanTindakLanjut}
                  onChange={(e) => setCatatanTindakLanjut(e.target.value)}
                  placeholder="Contoh: Kirimkan draft MoU ke yayasan dan follow-up pengesahan minggu depan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                />
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan Tugas & KPI' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
