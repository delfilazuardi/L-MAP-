import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building, 
  Calendar, 
  Filter, 
  Search, 
  Plus, 
  Eye, 
  Copy, 
  Check, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Award,
  Flame
} from 'lucide-react';
import { SekolahMitra, LaporanBulanan, LaporanStatus } from '../../../types';
import { BULAN_ACADEMIC_LIST } from './FormLaporanModal';
import { 
  rankMonthlyReports, 
  computeConsortiumYearlyRankings,
  SchoolConsortiumStanding,
  SchoolMonthlyEvaluation,
  getReportDeadlineInfo 
} from '../../../lib/laporanTimeliness';

interface RangkumanKepatuhanSekolahProps {
  sekolahList: SekolahMitra[];
  laporanList: LaporanBulanan[];
  selectedTahunAjaran: string;
  onChangeTahunAjaran: (ta: string) => void;
  onOpenCreateModal: (sekolahId?: string, bulan?: string) => void;
  onViewLaporanDetail: (laporan: LaporanBulanan) => void;
  onNavigateToPenilaian?: () => void;
}

export const RangkumanKepatuhanSekolah: React.FC<RangkumanKepatuhanSekolahProps> = ({
  sekolahList,
  laporanList,
  selectedTahunAjaran,
  onChangeTahunAjaran,
  onOpenCreateModal,
  onViewLaporanDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState<string | null>(null);

  // Determine expected passed months based on selected academic year:
  // For past academic years (e.g. 2022/2023 - 2025/2026), all 12 months are expected.
  // For current active academic year (2026/2027 as of September 2026), Juli - September are expected.
  const EXPECTED_PASSED_MONTHS = useMemo(() => {
    const [startYearStr] = (selectedTahunAjaran || '2026/2027').split('/');
    const startYear = parseInt(startYearStr, 10);
    if (isNaN(startYear)) return ['Juli', 'Agustus', 'September'];

    if (startYear < 2026) {
      return [...BULAN_ACADEMIC_LIST];
    } else if (startYear === 2026) {
      return ['Juli', 'Agustus', 'September'];
    } else {
      return [];
    }
  }, [selectedTahunAjaran]);

  // 1. Calculate Academic Year standings (cumulative timeliness, medals, and consistency)
  const yearlyStandings = useMemo(() => {
    return computeConsortiumYearlyRankings(
      sekolahList,
      laporanList,
      selectedTahunAjaran,
      EXPECTED_PASSED_MONTHS
    );
  }, [sekolahList, laporanList, selectedTahunAjaran, EXPECTED_PASSED_MONTHS]);

  const standingsMap = useMemo(() => {
    const map = new Map<string, SchoolConsortiumStanding>();
    yearlyStandings.forEach(s => map.set(s.sekolah.id, s));
    return map;
  }, [yearlyStandings]);

  // 2. Pre-calculate monthly timeliness evaluations for all 12 months in the academic year
  const monthlyEvalsMap = useMemo(() => {
    const map = new Map<string, Map<string, SchoolMonthlyEvaluation>>();
    BULAN_ACADEMIC_LIST.forEach(bulan => {
      const { evaluations } = rankMonthlyReports(sekolahList, laporanList, selectedTahunAjaran, bulan);
      const subMap = new Map<string, SchoolMonthlyEvaluation>();
      evaluations.forEach(ev => subMap.set(ev.sekolah.id, ev));
      map.set(bulan, subMap);
    });
    return map;
  }, [sekolahList, laporanList, selectedTahunAjaran]);

  // Top 1, 2, 3 of the selected Academic Year
  const top1Standing = useMemo(() => yearlyStandings.find(s => s.rank === 1), [yearlyStandings]);
  const top2Standing = useMemo(() => yearlyStandings.find(s => s.rank === 2), [yearlyStandings]);
  const top3Standing = useMemo(() => yearlyStandings.find(s => s.rank === 3), [yearlyStandings]);

  // Compute school compliance analytics
  const analyticsData = useMemo(() => {
    // Filter reports for the selected academic year
    const taReports = laporanList.filter(l => (l.tahunAjaran || '2026/2027') === selectedTahunAjaran);

    return sekolahList.map((sekolah) => {
      const schoolReports = taReports.filter(l => l.mitraId === sekolah.id);
      
      // Map reports by month
      const monthMap = new Map<string, LaporanBulanan>();
      schoolReports.forEach(rep => {
        monthMap.set(rep.bulan, rep);
      });

      // Find which expected months are missing
      const missingExpectedMonths = EXPECTED_PASSED_MONTHS.filter(m => !monthMap.has(m));
      
      // Find all remaining months in the 12-month calendar that have no report
      const allMissingMonths = BULAN_ACADEMIC_LIST.filter(m => !monthMap.has(m));

      // Calculate score & status
      const totalSubmittedExpected = EXPECTED_PASSED_MONTHS.length - missingExpectedMonths.length;
      const complianceRate = Math.round((totalSubmittedExpected / (EXPECTED_PASSED_MONTHS.length || 1)) * 100);
      const diterimaCount = schoolReports.filter(r => r.status === 'Diterima').length;
      const direviewCount = schoolReports.filter(r => r.status === 'Direview').length;
      const diajukanCount = schoolReports.filter(r => r.status === 'Diajukan').length;
      const revisiCount = schoolReports.filter(r => r.status === 'Perlu Revisi').length;

      // Weight score for ranking: Diterima = 100, Direview = 85, Diajukan = 75, Revisi = 50
      const totalScore = (diterimaCount * 100) + (direviewCount * 85) + (diajukanCount * 75) + (revisiCount * 50);

      const standing = standingsMap.get(sekolah.id);

      return {
        sekolah,
        standing,
        schoolReports,
        monthMap,
        missingExpectedMonths,
        allMissingMonths,
        totalSubmittedExpected,
        complianceRate,
        diterimaCount,
        direviewCount,
        diajukanCount,
        revisiCount,
        totalScore,
        isFullyCompliant: missingExpectedMonths.length === 0,
      };
    });
  }, [sekolahList, laporanList, selectedTahunAjaran, EXPECTED_PASSED_MONTHS, standingsMap]);

  // Sort by Academic Year Standing (Top 1, Top 2, Top 3, then subsequent ranks)
  const sortedSchools = useMemo(() => {
    return [...analyticsData].sort((a, b) => {
      const rankA = a.standing?.rank ?? 999;
      const rankB = b.standing?.rank ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      if (b.complianceRate !== a.complianceRate) return b.complianceRate - a.complianceRate;
      return b.totalScore - a.totalScore;
    });
  }, [analyticsData]);

  // Schools that have missing reports up to current month
  const schoolsWithMissingReports = useMemo(() => {
    return sortedSchools.filter(s => s.missingExpectedMonths.length > 0);
  }, [sortedSchools]);

  // Filter for display
  const displayedSchools = useMemo(() => {
    return sortedSchools.filter(item => {
      const matchSearch = item.sekolah.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sekolah.kota.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMissing = filterMissingOnly ? item.missingExpectedMonths.length > 0 : true;
      return matchSearch && matchMissing;
    });
  }, [sortedSchools, searchQuery, filterMissingOnly]);

  const handleCopyReminder = (sekolahNama: string, missing: string[]) => {
    const text = `Halo Admin ${sekolahNama}, mohon bantuan tindak lanjut pengiriman Laporan Bulanan ke Mitra Office Lazuardi untuk bulan: ${missing.join(', ')} (Tahun Ajaran ${selectedTahunAjaran}). Laporan dapat diajukan via portal L-MAP. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedReminder(sekolahNama);
    setTimeout(() => setCopiedReminder(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards: Paling Rajin, Belum Lapor Bulan Ini, Kepatuhan Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Sekolah Paling Rajin (Top 1 TA) */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-xs text-[11px] font-extrabold uppercase tracking-wide text-amber-100">
                <Trophy size={13} className="text-yellow-300" />
                Juara 1 Ketepatan TA
              </span>
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-md font-bold">
                TA {selectedTahunAjaran}
              </span>
            </div>

            <div className="mt-3">
              {top1Standing ? (
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                    {top1Standing.sekolah.namaSekolah}
                  </h3>
                  <p className="text-amber-100 text-xs mt-1">
                    {top1Standing.kepatuhanRate}% kepatuhan • <strong>{top1Standing.totalPoin} Poin Ketepatan</strong> ({top1Standing.top1Count}x Juara 1 Bulan, {top1Standing.sangatCepatCount}x Sangat Cepat $\le$ tgl 25).
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold mt-2">Belum ada laporan masuk.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-amber-100">
            <span>Tingkat Kepatuhan TA:</span>
            <span className="font-extrabold text-white text-sm">
              {top1Standing?.kepatuhanRate || 0}% Tepat Waktu
            </span>
          </div>
        </div>

        {/* Card 2: Laporan Bulan Apa yang Belum */}
        <div className="bg-white p-5 rounded-3xl border border-rose-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                <AlertTriangle size={13} className="text-rose-600" />
                Laporan Belum Lengkap
              </span>
              <span className="text-xs font-bold text-rose-600">
                {schoolsWithMissingReports.length} Sekolah
              </span>
            </div>

            <div className="mt-3">
              <h4 className="text-sm font-bold text-slate-800">
                Sekolah Perlu Menyerahkan Laporan:
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi bulan berjalan ({EXPECTED_PASSED_MONTHS.join(', ')})
              </p>
              
              <div className="mt-2.5 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {schoolsWithMissingReports.length > 0 ? (
                  schoolsWithMissingReports.map(s => (
                    <span 
                      key={s.sekolah.id}
                      className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-semibold text-rose-900"
                    >
                      {s.sekolah.namaSekolah}: Belum ({s.missingExpectedMonths.join(', ')})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Seluruh sekolah sudah menyerahkan laporan!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Target Bulan Ini:</span>
            <span className="font-bold text-slate-900">September 2026</span>
          </div>
        </div>

        {/* Card 3: Tingkat Kepatuhan Konsorsium */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold">
                <Building size={13} className="text-blue-600" />
                Monitoring Kepatuhan
              </span>
              <span className="text-xs font-bold text-blue-600">
                Total {sekolahList.length} Mitra
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {Math.round((analyticsData.reduce((acc, s) => acc + s.totalSubmittedExpected, 0) / (sekolahList.length * (EXPECTED_PASSED_MONTHS.length || 1) || 1)) * 100)}%
                </span>
                <span className="text-xs text-slate-500">
                  {analyticsData.reduce((acc, s) => acc + s.totalSubmittedExpected, 0)} dari {sekolahList.length * (EXPECTED_PASSED_MONTHS.length || 1)} Target
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.round((analyticsData.reduce((acc, s) => acc + s.totalSubmittedExpected, 0) / (sekolahList.length * (EXPECTED_PASSED_MONTHS.length || 1) || 1)) * 100)}%` 
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Dihitung dari kepatuhan penyerahan laporan s/d bulan {EXPECTED_PASSED_MONTHS[EXPECTED_PASSED_MONTHS.length - 1] || 'September'}.
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tahun Ajaran:</span>
            <select
              value={selectedTahunAjaran}
              onChange={(e) => onChangeTahunAjaran(e.target.value)}
              className="font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-200 text-xs cursor-pointer focus:outline-none"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Matriks Pelaporan Bulanan & Peringkat Ketepatan Waktu Rentang Tahun Ajaran */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Section */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar size={19} className="text-blue-600" />
                  <span>Matriks Pelaporan Bulanan &amp; Peringkat Ketepatan Waktu</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold border border-blue-200">
                  Rentang TA {selectedTahunAjaran}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Peringkat <strong>Top 1, 2, dan 3</strong> dinilai berdasarkan ketepatan waktu pengiriman dalam rentang Tahun Ajaran {selectedTahunAjaran}: <strong>target s/d tgl 25 bulan berjalan</strong> (Sangat Cepat) dan <strong>batas akhir tgl 25 bulan berikutnya</strong> (Tepat Waktu).
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => onOpenCreateModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus size={14} />
              <span>+ Input Laporan Baru</span>
            </button>
          </div>

          {/* Podium Top 1, 2, 3 Rentang Tahun Ajaran */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top 1 TA */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-2 border-amber-400/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                🥇
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
                    Top 1 TA {selectedTahunAjaran}
                  </span>
                </div>
                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                  {top1Standing ? top1Standing.sekolah.namaSekolah : 'Belum Ada'}
                </h5>
                <p className="text-[11px] text-slate-600">
                  {top1Standing 
                    ? `${top1Standing.totalPoin} Poin • ${top1Standing.kepatuhanRate}% Kepatuhan (${top1Standing.top1Count}x Juara Bulan)` 
                    : 'Menunggu penilaian'}
                </p>
              </div>
            </div>

            {/* Top 2 TA */}
            <div className="p-3.5 rounded-2xl bg-slate-100/90 border-2 border-slate-300/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 font-bold text-xl flex items-center justify-center shrink-0 shadow-xs border border-slate-300">
                🥈
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded">
                    Top 2 TA {selectedTahunAjaran}
                  </span>
                </div>
                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                  {top2Standing ? top2Standing.sekolah.namaSekolah : 'Belum Ada'}
                </h5>
                <p className="text-[11px] text-slate-600">
                  {top2Standing 
                    ? `${top2Standing.totalPoin} Poin • ${top2Standing.kepatuhanRate}% Kepatuhan (${top2Standing.top2Count}x Runner-up)` 
                    : 'Menunggu penilaian'}
                </p>
              </div>
            </div>

            {/* Top 3 TA */}
            <div className="p-3.5 rounded-2xl bg-amber-900/5 border-2 border-amber-700/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-700 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
                🥉
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                    Top 3 TA {selectedTahunAjaran}
                  </span>
                </div>
                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                  {top3Standing ? top3Standing.sekolah.namaSekolah : 'Belum Ada'}
                </h5>
                <p className="text-[11px] text-slate-600">
                  {top3Standing 
                    ? `${top3Standing.totalPoin} Poin • ${top3Standing.kepatuhanRate}% Kepatuhan (${top3Standing.top3Count}x Top 3)` 
                    : 'Menunggu penilaian'}
                </p>
              </div>
            </div>
          </div>

          {/* Matrix Search & Filter Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama sekolah mitra atau kota di matriks..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={() => setFilterMissingOnly(!filterMissingOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  filterMissingOnly 
                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <AlertTriangle size={13} className={filterMissingOnly ? 'text-rose-600' : 'text-slate-400'} />
                <span>{filterMissingOnly ? 'Filter: Belum Lengkap' : 'Hanya Sekolah Belum Lengkap'}</span>
              </button>
            </div>

            {/* Matrix Legend */}
            <div className="flex items-center gap-2 text-[10px] text-slate-600 flex-wrap justify-end">
              <span className="font-bold text-slate-800">Petunjuk Matriks:</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-black border border-amber-300">
                🥇 Top 1 / 🥈 Top 2 / 🥉 Top 3
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Diterima
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Review
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> + Kirim
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1020px]">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 w-24 text-center">Peringkat TA</th>
                <th className="py-3 px-4 min-w-[210px]">Sekolah Mitra</th>
                <th className="py-3 px-3 text-center min-w-[125px]">Kepatuhan &amp; Skor TA</th>
                <th className="py-3 px-2 text-center min-w-[130px]">Bulan Belum Lapor</th>
                {BULAN_ACADEMIC_LIST.map((m, idx) => {
                  const isExpected = EXPECTED_PASSED_MONTHS.includes(m);
                  return (
                    <th 
                      key={m} 
                      className={`py-3 px-1 text-center min-w-[62px] ${
                        isExpected ? 'bg-blue-50/80 text-blue-950 font-extrabold' : ''
                      }`}
                    >
                      <div>{m.slice(0, 3)}</div>
                      <div className="text-[9px] font-normal text-slate-400">
                        {idx < 6 ? selectedTahunAjaran.split('/')[0] : selectedTahunAjaran.split('/')[1]}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSchools.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-8 text-center text-slate-400">
                    Tidak ditemukan sekolah mitra yang cocok dengan pencarian / filter.
                  </td>
                </tr>
              ) : (
                displayedSchools.map((item) => {
                  const standing = item.standing;
                  const rank = standing?.rank ?? 999;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <tr 
                      key={item.sekolah.id}
                      className={`hover:bg-blue-50/40 transition ${
                        isTop1 
                          ? 'bg-amber-50/30' 
                          : isTop2 
                          ? 'bg-slate-50/50' 
                          : isTop3 
                          ? 'bg-amber-50/15' 
                          : ''
                      }`}
                    >
                      {/* Peringkat TA: Top 1, 2, 3 Indicator */}
                      <td className="py-3 px-3 text-center">
                        {isTop1 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] shadow-xs border border-amber-500 flex items-center gap-1">
                              🥇 <span>Top 1</span>
                            </span>
                            <span className="text-[9px] text-amber-800 font-extrabold mt-0.5">Juara 1</span>
                          </div>
                        ) : isTop2 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-bold text-[11px] border border-slate-300 flex items-center gap-1">
                              🥈 <span>Top 2</span>
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold mt-0.5">Juara 2</span>
                          </div>
                        ) : isTop3 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-700/15 text-amber-900 font-bold text-[11px] border border-amber-700/30 flex items-center gap-1">
                              🥉 <span>Top 3</span>
                            </span>
                            <span className="text-[9px] text-amber-800 font-bold mt-0.5">Juara 3</span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-400 font-mono text-xs">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* School Name & Academic Year Standings */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 hover:text-blue-600 transition">
                                {item.sekolah.namaSekolah}
                              </span>
                              {isTop1 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-black text-[9px] border border-amber-300">
                                  👑 Top 1 TA
                                </span>
                              )}
                              {isTop2 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-300">
                                  🥈 Top 2 TA
                                </span>
                              )}
                              {isTop3 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 font-bold text-[9px] border border-amber-200">
                                  🥉 Top 3 TA
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {item.sekolah.kota} • {item.sekolah.jenjang} • {item.sekolah.jumlahSiswa} Siswa
                            </p>
                            {/* Monthly Medals Summary */}
                            {standing && (standing.top1Count > 0 || standing.top2Count > 0 || standing.top3Count > 0) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {standing.top1Count > 0 && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1 rounded">
                                    🥇x{standing.top1Count}
                                  </span>
                                )}
                                {standing.top2Count > 0 && (
                                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-1 rounded">
                                    🥈x{standing.top2Count}
                                  </span>
                                )}
                                {standing.top3Count > 0 && (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200/60 px-1 rounded">
                                    🥉x{standing.top3Count}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Compliance & Academic Year Timeliness Score */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            item.complianceRate === 100 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : item.complianceRate >= 66
                              ? 'bg-blue-100 text-blue-900 border-blue-200'
                              : item.complianceRate > 0
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-rose-100 text-rose-900 border-rose-200'
                          }`}>
                            {item.totalSubmittedExpected} / {EXPECTED_PASSED_MONTHS.length} ({item.complianceRate}%)
                          </span>
                          <span className="text-[10px] font-black text-blue-700 mt-1">
                            +{standing?.totalPoin || 0} Poin TA
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {standing?.sangatCepatCount || 0} Cepat (≤25) • {standing?.tepatWaktuCount || 0} Tepat
                          </span>
                        </div>
                      </td>

                      {/* Bulan Belum Lapor Column */}
                      <td className="py-3 px-2 text-center">
                        {item.missingExpectedMonths.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={11} /> Lengkap
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 justify-center max-w-[130px] mx-auto">
                            {item.missingExpectedMonths.map(m => (
                              <span 
                                key={m}
                                className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-extrabold text-[9px] border border-rose-200"
                                title={`Belum ada laporan untuk bulan ${m}`}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 12 Month Cells with Top 1, 2, 3 Indicators */}
                      {BULAN_ACADEMIC_LIST.map((m) => {
                        const rep = item.monthMap.get(m);
                        const isExpected = EXPECTED_PASSED_MONTHS.includes(m);
                        const monthEval = monthlyEvalsMap.get(m)?.get(item.sekolah.id);

                        if (rep) {
                          // Report exists
                          let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          let labelText = 'Diterima';

                          if (rep.status === 'Direview') {
                            badgeBg = 'bg-blue-100 text-blue-800 border-blue-300';
                            labelText = 'Review';
                          } else if (rep.status === 'Diajukan') {
                            badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
                            labelText = 'Diajukan';
                          } else if (rep.status === 'Perlu Revisi') {
                            badgeBg = 'bg-purple-100 text-purple-800 border-purple-300';
                            labelText = 'Revisi';
                          }

                          return (
                            <td key={m} className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => onViewLaporanDetail(rep)}
                                className={`w-full py-1.5 px-0.5 rounded-lg border text-[9px] font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs hover:scale-105 relative ${badgeBg}`}
                                title={`${item.sekolah.namaSekolah} - Laporan ${m} (${rep.status})\nDikirim: ${monthEval?.tanggalKirim || rep.tanggalKirim || rep.tanggalDiajukan || '-'}\nKetepatan: ${monthEval?.keterangan || '-'}${monthEval?.isTop1 ? '\n🥇 Top 1 Tercepat Bulan Ini' : monthEval?.isTop2 ? '\n🥈 Top 2 Tercepat Bulan Ini' : monthEval?.isTop3 ? '\n🥉 Top 3 Tercepat Bulan Ini' : ''}`}
                              >
                                <div className="flex items-center gap-0.5">
                                  <span>{m.slice(0, 3)}</span>
                                  {monthEval?.isTop1 && <span className="text-[10px]" title="Top 1 Tercepat Bulan Ini">🥇</span>}
                                  {monthEval?.isTop2 && <span className="text-[10px]" title="Top 2 Tercepat Bulan Ini">🥈</span>}
                                  {monthEval?.isTop3 && <span className="text-[10px]" title="Top 3 Tercepat Bulan Ini">🥉</span>}
                                </div>
                                <span className="text-[8px] font-normal opacity-90 truncate max-w-full">
                                  {labelText}
                                </span>
                              </button>
                            </td>
                          );
                        } else {
                          // No report
                          if (isExpected) {
                            // Missing for past/current month!
                            return (
                              <td key={m} className="py-2 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => onOpenCreateModal(item.sekolah.id, m)}
                                  className="w-full py-1.5 px-0.5 rounded-lg border border-dashed border-rose-300 bg-rose-50/90 hover:bg-rose-100 text-rose-700 font-bold text-[9px] transition flex flex-col items-center justify-center cursor-pointer group"
                                  title={`Belum ada laporan bulan ${m} untuk ${item.sekolah.namaSekolah}. Klik untuk submit!`}
                                >
                                  <span className="text-rose-800 font-extrabold">{m.slice(0, 3)}</span>
                                  <span className="text-[8px] text-rose-600 font-medium group-hover:underline">+ Kirim</span>
                                </button>
                              </td>
                            );
                          } else {
                            // Future month
                            return (
                              <td key={m} className="py-2 px-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => onOpenCreateModal(item.sekolah.id, m)}
                                  className="w-full py-1.5 px-0.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-blue-50 text-slate-400 hover:text-blue-600 text-[9px] transition flex flex-col items-center justify-center cursor-pointer"
                                  title={`Bulan mendatang. Klik untuk mulai draf ${m}`}
                                >
                                  <span>{m.slice(0, 3)}</span>
                                  <span className="text-[8px] opacity-70">-</span>
                                </button>
                              </td>
                            );
                          }
                        }
                      })}

                      {/* Action Cell */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.missingExpectedMonths.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleCopyReminder(item.sekolah.namaSekolah, item.missingExpectedMonths)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Salin Pesan Pengingat WhatsApp / Email untuk PIC Sekolah Ini"
                            >
                              {copiedReminder === item.sekolah.namaSekolah ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenCreateModal(item.sekolah.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={11} />
                            <span>Input</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Note */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500 shrink-0" />
            <span>
              Peringkat <strong>Top 1, 2, dan 3</strong> dihitung secara dinamis dari akumulasi ketepatan waktu (&le; tgl 25), perolehan medali bulanan, serta tingkat kelengkapan laporan pada rentang Tahun Ajaran {selectedTahunAjaran}.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 shrink-0">
            Total Sekolah: {sekolahList.length} Mitra
          </span>
        </div>
      </div>
    </div>
  );
};
