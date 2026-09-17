import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  Activity, 
  CalendarCheck,
  Target,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  User,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  StaffActivity, 
  AdminMitraStaff, 
  DEFAULT_KPI_PROGRAMS, 
  TAHUN_AJARAN_LIST, 
  BULAN_LIST 
} from '../../../types';

interface KpiSyncSectionProps {
  tasks: StaffActivity[];
  adminStaffList: AdminMitraStaff[];
}

export const KpiSyncSection: React.FC<KpiSyncSectionProps> = ({
  tasks,
  adminStaffList,
}) => {
  // Filter States: Tahun Ajaran & Bulan
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('Semua Tahun Ajaran');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Helper to determine Tahun Ajaran and Bulan from task
  const getTaskPeriod = (task: StaffActivity) => {
    let year = 2026;
    let month = '09';
    if (task.tanggal && task.tanggal.includes('-')) {
      const parts = task.tanggal.split('-');
      year = parseInt(parts[0], 10) || 2026;
      month = parts[1] || '09';
    }

    const monthNum = parseInt(month, 10);
    const derivedTahunAjaran =
      monthNum >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;

    const finalTahunAjaran = task.tahunAjaran || derivedTahunAjaran;
    return {
      tahunAjaran: finalTahunAjaran,
      monthStr: month,
    };
  };

  // Filtered tasks based on Tahun Ajaran & Bulan
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const { tahunAjaran, monthStr } = getTaskPeriod(t);
      const matchTahunAjaran =
        selectedTahunAjaran === 'Semua Tahun Ajaran' || tahunAjaran === selectedTahunAjaran;
      const matchBulan = selectedBulan === 'ALL' || monthStr === selectedBulan;
      return matchTahunAjaran && matchBulan;
    });
  }, [tasks, selectedTahunAjaran, selectedBulan]);

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'Selesai');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'Sedang Berjalan');
  const pendingTasks = filteredTasks.filter((t) => t.status === 'Belum Dimulai');
  const delayedTasks = filteredTasks.filter((t) => t.status === 'Tertunda' || t.status === 'Dibatalkan');

  // Overdue count (tasks not completed and deadline < today)
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = filteredTasks.filter(
    (t) => t.status !== 'Selesai' && t.deadline && t.deadline < today
  );

  // Completion Rate %
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Total KPI Weights
  const totalWeight = filteredTasks.reduce((sum, t) => sum + (t.bobotKpi || 20), 0);
  const earnedWeight = completedTasks.reduce((sum, t) => sum + (t.bobotKpi || 20), 0);
  const kpiScorePercent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // On-time rate
  const onTimeTasks = completedTasks.filter((t) => !t.deadline || t.tanggal <= t.deadline);
  const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 100;

  // Group KPIs strictly PER PROGRAM (Bukan Per Orang, seperti di sheet)
  const programGroups = useMemo(() => {
    // Collect all unique program names present in tasks or standard list
    const presentPrograms = new Set<string>();
    filteredTasks.forEach((t) => {
      if (t.programKpi) presentPrograms.add(t.programKpi);
    });

    // Also include default programs if filtered tasks has them or if no filters
    DEFAULT_KPI_PROGRAMS.forEach((prog) => {
      if (tasks.some(t => t.programKpi === prog)) {
        presentPrograms.add(prog);
      }
    });

    // If still empty (e.g. strict filter with no tasks), show present programs from filtered tasks
    const programList = Array.from(presentPrograms);
    if (programList.length === 0 && tasks.length > 0) {
      // fallback to all programs in unfiltered tasks
      tasks.forEach(t => { if (t.programKpi) presentPrograms.add(t.programKpi); });
    }

    return Array.from(presentPrograms).map((programName) => {
      const progTasks = filteredTasks.filter((t) => t.programKpi === programName);
      const progTotal = progTasks.length;
      const progDone = progTasks.filter((t) => t.status === 'Selesai').length;
      const progActive = progTasks.filter((t) => t.status === 'Sedang Berjalan').length;
      const progPending = progTasks.filter((t) => t.status === 'Belum Dimulai').length;
      const progOverdue = progTasks.filter(
        (t) => t.status !== 'Selesai' && t.deadline && t.deadline < today
      ).length;

      const progTotalWeight = progTasks.reduce((acc, curr) => acc + (curr.bobotKpi || 20), 0);
      const progEarnedWeight = progTasks
        .filter((t) => t.status === 'Selesai')
        .reduce((acc, curr) => acc + (curr.bobotKpi || 20), 0);

      const progScorePercent =
        progTotalWeight > 0 ? Math.round((progEarnedWeight / progTotalWeight) * 100) : 0;

      // PIC Staff involved
      const involvedStaff = Array.from(new Set(progTasks.map((t) => t.namaStaff)));

      let statusBadge = {
        label: 'Belum Dimulai',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
      };

      if (progTotal === 0) {
        statusBadge = {
          label: 'Tidak Ada Tugas',
          color: 'bg-slate-50 text-slate-400 border-slate-200',
        };
      } else if (progScorePercent >= 85) {
        statusBadge = {
          label: 'Target Tercapai',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        };
      } else if (progScorePercent >= 50) {
        statusBadge = {
          label: 'Baik & On-Track',
          color: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
        };
      } else if (progScorePercent > 0 || progActive > 0) {
        statusBadge = {
          label: 'Perlu Akselerasi',
          color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        };
      } else if (progOverdue > 0) {
        statusBadge = {
          label: 'Terlambat',
          color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        };
      }

      return {
        programName,
        tasks: progTasks,
        totalTasks: progTotal,
        completedCount: progDone,
        inProgressCount: progActive,
        pendingCount: progPending,
        overdueCount: progOverdue,
        totalWeight: progTotalWeight,
        earnedWeight: progEarnedWeight,
        scorePercent: progScorePercent,
        involvedStaff,
        statusBadge,
      };
    });
  }, [filteredTasks, tasks, today]);

  const hasActiveFilters = selectedTahunAjaran !== 'Semua Tahun Ajaran' || selectedBulan !== 'ALL';

  const resetFilters = () => {
    setSelectedTahunAjaran('Semua Tahun Ajaran');
    setSelectedBulan('ALL');
  };

  const selectedBulanLabel = BULAN_LIST.find((b) => b.value === selectedBulan)?.label || 'Semua Bulan';

  return (
    <div className="space-y-4 pt-2">
      {/* 1. Header with Title & Period Filters (Tahun Ajaran, Bulan) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Dashboard KPI Kinerja Per Program (Otomatis Sinkron Sheet)
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span>Live Sync Per Program</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Evaluasi KPI dihitung per program kerja sasaran (bukan per orang) sesuai lembar kerja sheet
            </p>
          </div>
        </div>

        {/* Filters: Tahun Ajaran & Bulan */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1 text-xs text-slate-600 font-semibold px-1">
            <Filter size={13} className="text-emerald-700" />
            <span>Filter KPI:</span>
          </div>

          {/* Filter Tahun Ajaran */}
          <select
            value={selectedTahunAjaran}
            onChange={(e) => setSelectedTahunAjaran(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          >
            {TAHUN_AJARAN_LIST.map((ta) => (
              <option key={ta} value={ta}>
                {ta === 'Semua Tahun Ajaran' ? 'Semua Th. Ajaran' : `T.A. ${ta}`}
              </option>
            ))}
          </select>

          {/* Filter Bulan */}
          <select
            value={selectedBulan}
            onChange={(e) => setSelectedBulan(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          >
            {BULAN_LIST.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          {/* Reset button if filter active */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title="Reset filter periode"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition cursor-pointer border border-transparent hover:border-slate-200"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Notice if applied */}
      {hasActiveFilters && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between gap-2">
          <span>
            Menampilkan data evaluasi KPI untuk:{' '}
            <strong>{selectedTahunAjaran}</strong> • Bulan: <strong>{selectedBulanLabel}</strong> ({filteredTasks.length} pekerjaan sinkron)
          </span>
          <button
            onClick={resetFilters}
            className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            Tampilkan Semua Periode
          </button>
        </div>
      )}

      {/* 2. KPI Highlight Cards (Recalculated from Filtered Tasks) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Skor KPI Terpenuhi */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Capaian KPI Rata-Rata</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpiScorePercent}%</span>
            <span className="text-[11px] font-mono text-slate-500">
              ({earnedWeight}/{totalWeight} pts)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(kpiScorePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Tugas Selesai */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tugas Program Selesai</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{completedTasks.length}</span>
            <span className="text-xs text-slate-500">dari {totalTasks} tugas ({completionRate}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Sedang Berjalan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Sedang Berjalan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{inProgressTasks.length}</span>
            <span className="text-xs text-slate-500">pekerjaan aktif</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {pendingTasks.length} pekerjaan belum dimulai
          </p>
        </div>

        {/* Card 4: Ketepatan Waktu / Overdue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Ketepatan Waktu</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{onTimeRate}%</span>
            {overdueTasks.length > 0 ? (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {overdueTasks.length} lewat deadline
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Tepat Waktu
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Berdasarkan deadline resmi pada sheet
          </p>
        </div>
      </div>

      {/* 3. Progress Distribution Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">Distribusi Status Pekerjaan Periode Ini</span>
          <span className="text-slate-500 text-[11px] font-mono">Total {totalTasks} Baris Sheet</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
          <div
            title={`Selesai: ${completedTasks.length}`}
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0}%` }}
          />
          <div
            title={`Sedang Berjalan: ${inProgressTasks.length}`}
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${totalTasks > 0 ? (inProgressTasks.length / totalTasks) * 100 : 0}%` }}
          />
          <div
            title={`Belum Dimulai: ${pendingTasks.length}`}
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${totalTasks > 0 ? (pendingTasks.length / totalTasks) * 100 : 0}%` }}
          />
          <div
            title={`Tertunda: ${delayedTasks.length}`}
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${totalTasks > 0 ? (delayedTasks.length / totalTasks) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Selesai ({completedTasks.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Sedang Berjalan ({inProgressTasks.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Belum Dimulai ({pendingTasks.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Tertunda / Lewat Deadline ({delayedTasks.length + overdueTasks.length})</span>
          </div>
        </div>
      </div>

      {/* 4. Core Table: Evaluasi KPI PER PROGRAM (Seperti di Sheet) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-emerald-600" />
            <span className="font-bold text-slate-900 text-sm">
              Evaluasi Capaian KPI Berdasarkan Program Mitra Office
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            Format Matriks Program KPI • {programGroups.length} Program Kerja
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafd] text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
                <th className="py-3 px-3 w-10 text-center font-mono text-slate-400">No</th>
                <th className="py-3 px-4 min-w-[260px]">Program KPI Mitra Office</th>
                <th className="py-3 px-3 text-center">Target Bobot</th>
                <th className="py-3 px-3 text-center">Poin Tercapai</th>
                <th className="py-3 px-3 text-center">Total Tugas</th>
                <th className="py-3 px-3 text-center">Selesai</th>
                <th className="py-3 px-3 text-center">On Progress</th>
                <th className="py-3 px-3 text-center">Lewat Deadline</th>
                <th className="py-3 px-3 text-center min-w-[140px]">% Capaian KPI</th>
                <th className="py-3 px-3 text-center min-w-[130px]">Status Capaian</th>
                <th className="py-3 px-4 min-w-[160px]">PIC Admin Terlibat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {programGroups.length === 0 || filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Target size={28} className="text-slate-300" />
                      <p className="font-medium text-xs">
                        Tidak ada penugasan program pada periode {selectedTahunAjaran} • {selectedBulanLabel}.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                      >
                        Reset Filter Periode
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                programGroups.map((group, idx) => {
                  const isExpanded = expandedProgram === group.programName;
                  return (
                    <React.Fragment key={group.programName}>
                      <tr 
                        onClick={() => setExpandedProgram(isExpanded ? null : group.programName)}
                        className={`transition cursor-pointer hover:bg-emerald-50/40 ${
                          isExpanded ? 'bg-emerald-50/60' : 'bg-white'
                        }`}
                      >
                        {/* No */}
                        <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Nama Program KPI */}
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-slate-100 text-slate-500 group-hover:text-emerald-700">
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </span>
                            <div>
                              <span className="text-xs leading-snug hover:text-emerald-700 transition">
                                {group.programName}
                              </span>
                              <span className="block text-[10px] font-normal text-slate-500">
                                {group.totalTasks} baris tugas terdaftar di sheet
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Target Bobot */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {group.totalWeight} pts
                        </td>

                        {/* Poin Tercapai */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                          {group.earnedWeight} pts
                        </td>

                        {/* Total Tugas */}
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {group.totalTasks}
                        </td>

                        {/* Selesai */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                          {group.completedCount}
                        </td>

                        {/* On Progress */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                          {group.inProgressCount}
                        </td>

                        {/* Overdue */}
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {group.overdueCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                              {group.overdueCount}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0</span>
                          )}
                        </td>

                        {/* % Capaian KPI Program */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono font-bold text-xs">
                              {group.scorePercent}%
                            </span>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  group.scorePercent >= 85
                                    ? 'bg-emerald-600'
                                    : group.scorePercent >= 50
                                    ? 'bg-blue-600'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(group.scorePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Capaian */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${group.statusBadge.color}`}
                          >
                            {group.statusBadge.label}
                          </span>
                        </td>

                        {/* Admin PIC Terlibat */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {group.involvedStaff.length === 0 ? (
                              <span className="text-slate-400 text-[11px] italic">-</span>
                            ) : (
                              group.involvedStaff.map((staffName) => (
                                <span
                                  key={staffName}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                                >
                                  <User size={10} className="text-slate-400" />
                                  <span>{staffName}</span>
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Drill-down of Tasks under this Program */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={11} className="py-3 px-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <Layers size={13} className="text-emerald-600" />
                                  <span>Rincian Pekerjaan Sheet untuk Program: {group.programName}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {group.tasks.length} Baris Terdaftar
                                </span>
                              </div>

                              {group.tasks.length === 0 ? (
                                <p className="text-slate-500 text-xs italic py-2">
                                  Belum ada baris pekerjaan yang diasosiasikan ke program KPI ini pada periode terpilih.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {group.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between gap-1 shadow-2xs"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="font-bold text-slate-900 leading-snug">
                                          {task.tugas || task.judulAktivitas}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                            task.status === 'Selesai'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : task.status === 'Sedang Berjalan'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {task.status}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-1">
                                        <span>PIC: <strong className="text-slate-700">{task.namaStaff}</strong></span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-emerald-800 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px]">
                                            {task.noKpi || 'KPI-01'}
                                          </span>
                                          {task.penjelasanKpi && (
                                            <span className="text-[10px] text-slate-500 max-w-[220px] truncate" title={task.penjelasanKpi}>
                                              {task.penjelasanKpi}
                                            </span>
                                          )}
                                        </div>
                                        <span className="font-mono text-emerald-700 font-bold">
                                          {task.bobotKpi || 20} pts
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Total Summary Row */}
            {filteredTasks.length > 0 && (
              <tfoot>
                <tr className="bg-[#f1f3f4] font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                  <td className="py-3 px-3 text-center text-slate-500">Σ</td>
                  <td className="py-3 px-4">TOTAL KESELURUHAN PROGRAM</td>
                  <td className="py-3 px-3 text-center font-mono">{totalWeight} pts</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-700">{earnedWeight} pts</td>
                  <td className="py-3 px-3 text-center font-mono">{totalTasks}</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-700">{completedTasks.length}</td>
                  <td className="py-3 px-3 text-center font-mono text-blue-700">{inProgressTasks.length}</td>
                  <td className="py-3 px-3 text-center font-mono text-rose-600">{overdueTasks.length}</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-800 text-sm">
                    {kpiScorePercent}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                      {kpiScorePercent >= 85 ? 'Target Tercapai' : 'On-Track'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] font-normal">
                    {adminStaffList.length} Personel Admin MO
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
