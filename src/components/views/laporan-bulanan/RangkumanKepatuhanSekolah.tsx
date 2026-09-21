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
  HelpCircle
} from 'lucide-react';
import { SekolahMitra, LaporanBulanan, LaporanStatus } from '../../../types';
import { BULAN_ACADEMIC_LIST } from './FormLaporanModal';

interface RangkumanKepatuhanSekolahProps {
  sekolahList: SekolahMitra[];
  laporanList: LaporanBulanan[];
  selectedTahunAjaran: string;
  onChangeTahunAjaran: (ta: string) => void;
  onOpenCreateModal: (sekolahId?: string, bulan?: string) => void;
  onViewLaporanDetail: (laporan: LaporanBulanan) => void;
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
      const complianceRate = Math.round((totalSubmittedExpected / EXPECTED_PASSED_MONTHS.length) * 100);
      const diterimaCount = schoolReports.filter(r => r.status === 'Diterima').length;
      const direviewCount = schoolReports.filter(r => r.status === 'Direview').length;
      const diajukanCount = schoolReports.filter(r => r.status === 'Diajukan').length;
      const revisiCount = schoolReports.filter(r => r.status === 'Perlu Revisi').length;

      // Weight score for ranking: Diterima = 100, Direview = 85, Diajukan = 75, Revisi = 50
      const totalScore = (diterimaCount * 100) + (direviewCount * 85) + (diajukanCount * 75) + (revisiCount * 50);

      return {
        sekolah,
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
  }, [sekolahList, laporanList, selectedTahunAjaran, EXPECTED_PASSED_MONTHS]);

  // Sort by highest score / compliance rate to find "Paling Rajin"
  const sortedSchools = useMemo(() => {
    return [...analyticsData].sort((a, b) => {
      if (b.totalSubmittedExpected !== a.totalSubmittedExpected) {
        return b.totalSubmittedExpected - a.totalSubmittedExpected;
      }
      if (b.diterimaCount !== a.diterimaCount) {
        return b.diterimaCount - a.diterimaCount;
      }
      return b.totalScore - a.totalScore;
    });
  }, [analyticsData]);

  // Schools that have missing reports up to current month
  const schoolsWithMissingReports = useMemo(() => {
    return sortedSchools.filter(s => s.missingExpectedMonths.length > 0);
  }, [sortedSchools]);

  // Top Most Diligent School(s)
  const topSchools = useMemo(() => {
    if (sortedSchools.length === 0) return [];
    const highestCount = sortedSchools[0].totalSubmittedExpected;
    return sortedSchools.filter(s => s.totalSubmittedExpected === highestCount && highestCount > 0);
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
        {/* Card 1: Sekolah Paling Rajin */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-xs text-[11px] font-extrabold uppercase tracking-wide text-amber-100">
                <Trophy size={13} className="text-yellow-300" />
                Sekolah Paling Rajin
              </span>
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-md font-bold">
                TA {selectedTahunAjaran}
              </span>
            </div>

            <div className="mt-3">
              {topSchools.length > 0 ? (
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                    {topSchools.map(s => s.sekolah.namaSekolah).join(', ')}
                  </h3>
                  <p className="text-amber-100 text-xs mt-1">
                    Kepatuhan sempurna: <strong>{topSchools[0].totalSubmittedExpected} dari {EXPECTED_PASSED_MONTHS.length} bulan</strong> telah diserahkan dengan tertib.
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold mt-2">Belum ada laporan masuk.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-amber-100">
            <span>Tingkat Kepatuhan:</span>
            <span className="font-extrabold text-white text-sm">
              {topSchools[0]?.complianceRate || 0}% Tepat Waktu
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
                  {Math.round((analyticsData.reduce((acc, s) => acc + s.totalSubmittedExpected, 0) / (sekolahList.length * EXPECTED_PASSED_MONTHS.length || 1)) * 100)}%
                </span>
                <span className="text-xs text-slate-500">
                  {analyticsData.reduce((acc, s) => acc + s.totalSubmittedExpected, 0)} dari {sekolahList.length * EXPECTED_PASSED_MONTHS.length} Target
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.round((analyticsData.reduce((acc, s) => acc + s.totalSubmittedExpected, 0) / (sekolahList.length * EXPECTED_PASSED_MONTHS.length || 1)) * 100)}%` 
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Dihitung dari kepatuhan penyerahan laporan s/d bulan {EXPECTED_PASSED_MONTHS[EXPECTED_PASSED_MONTHS.length - 1]}.
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

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama sekolah mitra atau kota..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterMissingOnly(!filterMissingOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              filterMissingOnly 
                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <AlertTriangle size={13} className={filterMissingOnly ? 'text-rose-600' : 'text-slate-400'} />
            <span>{filterMissingOnly ? 'Filter: Belum Lengkap' : 'Hanya Sekolah Belum Lengkap'}</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-600 flex-wrap justify-end">
          <span className="font-bold text-slate-800">Keterangan:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Diterima
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Direview
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Diajukan
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span> Revisi
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> ⚠️ Belum Lapor
          </span>
        </div>
      </div>

      {/* 3. Interactive Monthly Matrix: Sekolah vs 12 Bulan Tahun Ajaran */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span>Matriks Pelaporan Bulanan Seluruh Sekolah Mitra</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik pada kotak bulan yang berstatus <strong>&quot;Belum Lapor&quot;</strong> untuk langsung mengisi laporan untuk sekolah tersebut
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => onOpenCreateModal()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>+ Input Laporan Baru</span>
          </button>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4 min-w-[200px]">Sekolah Mitra</th>
                <th className="py-3 px-3 text-center min-w-[110px]">Kepatuhan</th>
                <th className="py-3 px-2 text-center min-w-[140px]">Bulan Belum Lapor</th>
                {BULAN_ACADEMIC_LIST.map((m, idx) => {
                  const isExpected = EXPECTED_PASSED_MONTHS.includes(m);
                  return (
                    <th 
                      key={m} 
                      className={`py-3 px-1.5 text-center min-w-[58px] ${
                        isExpected ? 'bg-blue-50/70 text-blue-950 font-extrabold' : ''
                      }`}
                    >
                      <div>{m.slice(0, 3)}</div>
                      <div className="text-[9px] font-normal text-slate-400">
                        {idx < 6 ? '2026' : '2027'}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSchools.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-8 text-center text-slate-400">
                    Tidak ditemukan sekolah mitra yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                displayedSchools.map((item, idx) => {
                  const isTopRank = idx === 0 && item.totalSubmittedExpected > 0;
                  const isSecondRank = idx === 1 && item.totalSubmittedExpected > 0;

                  return (
                    <tr 
                      key={item.sekolah.id}
                      className={`hover:bg-blue-50/30 transition ${
                        isTopRank ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-4 text-center">
                        {isTopRank ? (
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                            1
                          </span>
                        ) : isSecondRank ? (
                          <span className="w-6 h-6 rounded-full bg-slate-400 text-white font-bold text-xs inline-flex items-center justify-center">
                            2
                          </span>
                        ) : (
                          <span className="font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                        )}
                      </td>

                      {/* School Name & Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 hover:text-blue-600 transition">
                                {item.sekolah.namaSekolah}
                              </span>
                              {isTopRank && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[9px] border border-amber-300">
                                  <Trophy size={10} className="text-amber-600" />
                                  Paling Rajin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {item.sekolah.kota} • {item.sekolah.jenjang} • {item.sekolah.jumlahSiswa} Siswa
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Compliance Rate Badge */}
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
                          <span className="text-[9px] text-slate-400 mt-0.5 font-medium">
                            {item.diterimaCount} Diterima
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

                      {/* 12 Month Cells */}
                      {BULAN_ACADEMIC_LIST.map((m) => {
                        const rep = item.monthMap.get(m);
                        const isExpected = EXPECTED_PASSED_MONTHS.includes(m);

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
                                className={`w-full py-1.5 px-0.5 rounded-lg border text-[9px] font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs hover:scale-105 ${badgeBg}`}
                                title={`${item.sekolah.namaSekolah} - Laporan ${m} (${rep.status}) - Klik untuk lihat`}
                              >
                                <span>{m.slice(0, 3)}</span>
                                <span className="text-[8px] font-normal opacity-90">{labelText}</span>
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
            <Sparkles size={13} className="text-blue-600 shrink-0" />
            <span>
              Status &quot;Paling Rajin&quot; dihitung secara dinamis dari persentase penyerahan tepat waktu, keterverifikasian dokumen, dan kelengkapan bulan kalender pendidikan.
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
