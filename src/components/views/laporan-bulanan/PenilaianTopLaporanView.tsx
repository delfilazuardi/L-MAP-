import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  Medal, 
  CalendarDays, 
  Info, 
  TrendingUp, 
  Send, 
  Eye, 
  ChevronRight,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { SekolahMitra, LaporanBulanan } from '../../../types';
import { BULAN_ACADEMIC_LIST } from './FormLaporanModal';
import { 
  rankMonthlyReports, 
  computeConsortiumYearlyRankings, 
  getReportDeadlineInfo,
  SchoolMonthlyEvaluation,
  TimelinessStatus
} from '../../../lib/laporanTimeliness';

interface PenilaianTopLaporanViewProps {
  sekolahList: SekolahMitra[];
  laporanList: LaporanBulanan[];
  selectedTahunAjaran: string;
  onViewLaporanDetail: (laporan: LaporanBulanan) => void;
  onOpenCreateModal?: (sekolahId?: string, bulan?: string) => void;
}

export const PenilaianTopLaporanView: React.FC<PenilaianTopLaporanViewProps> = ({
  sekolahList,
  laporanList,
  selectedTahunAjaran,
  onViewLaporanDetail,
  onOpenCreateModal,
}) => {
  // Mode: 'bulanan' (Per Bulan) vs 'akumulasi' (Juara Umum Tahun Ajaran)
  const [viewMode, setViewMode] = useState<'bulanan' | 'akumulasi'>('bulanan');

  // Selected Month (default to September or the latest active month)
  const [selectedBulan, setSelectedBulan] = useState<string>('September');

  // Determine passed months in academic year
  const passedMonths = useMemo(() => {
    const [startYearStr] = (selectedTahunAjaran || '2026/2027').split('/');
    const startYear = parseInt(startYearStr, 10);
    if (isNaN(startYear) || startYear < 2026) {
      return [...BULAN_ACADEMIC_LIST];
    } else if (startYear === 2026) {
      return ['Juli', 'Agustus', 'September'];
    } else {
      return ['Juli'];
    }
  }, [selectedTahunAjaran]);

  // Compute monthly evaluation for selected month
  const monthlyData = useMemo(() => {
    return rankMonthlyReports(sekolahList, laporanList, selectedTahunAjaran, selectedBulan);
  }, [sekolahList, laporanList, selectedTahunAjaran, selectedBulan]);

  // Compute consortium yearly standings
  const yearlyStandings = useMemo(() => {
    return computeConsortiumYearlyRankings(sekolahList, laporanList, selectedTahunAjaran, passedMonths);
  }, [sekolahList, laporanList, selectedTahunAjaran, passedMonths]);

  const { top1, top2, top3, evaluations, deadlineInfo } = monthlyData;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: TimelinessStatus) => {
    switch (status) {
      case 'SANGAT_CEPAT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
            <Sparkles size={12} className="text-emerald-600" />
            Sangat Cepat (s/d Tgl 25)
          </span>
        );
      case 'TEPAT_WAKTU':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-[11px]">
            <CheckCircle2 size={12} className="text-blue-600" />
            Tepat Waktu (s/d Tgl 25 Bln Depan)
          </span>
        );
      case 'TERLAMBAT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px]">
            <AlertTriangle size={12} className="text-amber-600" />
            Terlambat
          </span>
        );
      case 'BELUM_KIRIM':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[11px]">
            <Clock size={12} className="text-rose-600" />
            Belum Mengirim
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Official Assessment Rules Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl text-white p-6 shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-4 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black tracking-wide uppercase flex items-center gap-1.5 shadow-xs">
                <Trophy size={14} className="text-amber-400" />
                Sistem Peringkat Resmi L-MAP
              </span>
              <span className="text-xs font-mono text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-md font-bold">
                TA {selectedTahunAjaran}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Penilaian Top 1, 2, dan 3 Laporan Bulanan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Penetapan juara ketepatan waktu pengiriman laporan bulanan sekolah mitra Lazuardi. 
              Peringkat dinilai secara objektif berdasarkan kecepatan tanggal pengiriman dokumen ke Mitra Office.
            </p>

            {/* Criteria Badges */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-bold text-emerald-300 block">Target Sangat Cepat (Bulan Berjalan):</span>
                  <span className="text-slate-300 text-[11px]">
                    Dikirim hingga <strong>tanggal 25 di bulan tersebut</strong> (contoh: s/d 25 {selectedBulan}).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-bold text-blue-300 block">Batas Akhir Tepat Waktu (Bulan Depannya):</span>
                  <span className="text-slate-300 text-[11px]">
                    Maksimal hingga <strong>tanggal 25 di bulan depannya</strong> (contoh: s/d 25 {deadlineInfo.namaBulanDepan}).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
            <div className="bg-white/10 p-1 rounded-2xl border border-white/15 flex">
              <button
                type="button"
                onClick={() => setViewMode('bulanan')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'bulanan'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Calendar size={14} />
                <span>Peringkat Bulanan</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('akumulasi')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  viewMode === 'akumulasi'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Trophy size={14} />
                <span>Juara Umum TA</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 text-center lg:text-right px-1">
              {viewMode === 'bulanan' ? `Bulan: ${selectedBulan} ${deadlineInfo.tahunKalender}` : `Akumulasi Seluruh Bulan`}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Month Selector Bar (If in Bulanan Mode) */}
      {viewMode === 'bulanan' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarDays size={15} className="text-blue-600" />
              Pilih Bulan Laporan yang Dinilai:
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Batas Akhir Resmi: 25 {deadlineInfo.namaBulanDepan} {deadlineInfo.tahunBulanDepan}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {BULAN_ACADEMIC_LIST.map((bulan) => {
              const isSelected = selectedBulan === bulan;
              const isPassed = passedMonths.includes(bulan);
              const mData = rankMonthlyReports(sekolahList, laporanList, selectedTahunAjaran, bulan);
              const hasReports = mData.evaluations.some(e => e.statusKepatuhan !== 'BELUM_KIRIM');

              return (
                <button
                  key={bulan}
                  type="button"
                  onClick={() => setSelectedBulan(bulan)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 ring-2 ring-blue-400'
                      : isPassed
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  <span>{bulan}</span>
                  {hasReports && (
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-emerald-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MODE BULANAN: PODIUM + DETAIL DAFTAR PERINGKAT */}
      {viewMode === 'bulanan' && (
        <>
          {/* Visual 3-Pillar Podium */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

            <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-400/30">
                <Medal size={14} className="text-amber-400" />
                Podium Kehormatan Bulan {selectedBulan} {deadlineInfo.tahunKalender}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Top 3 Pengirim Tercepat & Tepat Waktu
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Batas pengiriman: Hingga 25 {selectedBulan} (Sangat Cepat) atau 25 {deadlineInfo.namaBulanDepan} (Bulan Depan)
              </p>
            </div>

            {/* The 3 Podium Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto relative z-10">
              {/* JUARA 2: PERAK (Kiri) */}
              <div className="order-2 md:order-1 flex flex-col items-center">
                {top2 ? (
                  <div className="w-full bg-slate-800/80 backdrop-blur-md rounded-2xl border-2 border-slate-400/60 p-5 shadow-lg text-center hover:border-slate-300 transition duration-300 flex flex-col justify-between">
                    <div>
                      <div className="w-14 h-14 mx-auto -mt-10 rounded-2xl bg-gradient-to-tr from-slate-300 via-slate-100 to-slate-400 text-slate-900 flex items-center justify-center font-black text-xl shadow-lg border-2 border-white">
                        🥈 2
                      </div>
                      <div className="mt-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Juara 2 Perak
                        </span>
                        <h4 className="font-extrabold text-base text-white mt-0.5 line-clamp-1">
                          {top2.sekolah.namaSekolah}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {top2.sekolah.kota || 'Sekolah Mitra'}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-700/80 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Tgl Kirim:</span>
                          <span className="font-bold text-slate-100">
                            {formatDateDisplay(top2.tanggalKirim)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Ketepatan:</span>
                          <span className="text-slate-200 font-medium">{top2.keterangan}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Skor:</span>
                          <span className="font-mono font-bold text-amber-300">+{top2.poin} Poin</span>
                        </div>
                      </div>
                    </div>

                    {top2.laporan && (
                      <button
                        type="button"
                        onClick={() => onViewLaporanDetail(top2.laporan!)}
                        className="mt-4 w-full py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Lihat Berkas</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 text-center text-slate-500">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center text-slate-400 text-lg font-bold mb-2">
                      2
                    </div>
                    <p className="text-xs font-medium">Belum Ada Juara 2</p>
                  </div>
                )}
                {/* Pillar Base */}
                <div className="w-full h-12 bg-slate-700/60 rounded-b-2xl border-t border-slate-600 flex items-center justify-center text-xs font-black text-slate-300 mt-2">
                  PERINGKAT 2
                </div>
              </div>

              {/* JUARA 1: EMAS (Tengah - Elevated) */}
              <div className="order-1 md:order-2 flex flex-col items-center -mt-4 md:-mt-6">
                {top1 ? (
                  <div className="w-full bg-gradient-to-b from-amber-500/20 via-slate-800/90 to-slate-900/95 backdrop-blur-md rounded-3xl border-2 border-amber-400 p-6 shadow-2xl shadow-amber-500/10 text-center hover:border-amber-300 transition duration-300 flex flex-col justify-between relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                      👑 Tercepat
                    </div>

                    <div>
                      <div className="w-18 h-18 mx-auto -mt-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl border-2 border-white ring-4 ring-amber-400/30">
                        🥇 1
                      </div>

                      <div className="mt-3">
                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-300">
                          Juara 1 Emas
                        </span>
                        <h4 className="font-black text-lg text-white mt-0.5 line-clamp-1">
                          {top1.sekolah.namaSekolah}
                        </h4>
                        <p className="text-xs text-amber-200/80">
                          {top1.sekolah.kota || 'Sekolah Mitra'}
                        </p>
                      </div>

                      <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-1.5 text-xs text-slate-200">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-amber-200/70 font-semibold">Tgl Pengiriman:</span>
                          <span className="font-extrabold text-amber-300">
                            {formatDateDisplay(top1.tanggalKirim)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-amber-200/70 font-semibold">Ketepatan:</span>
                          <span className="text-white font-bold">{top1.keterangan}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-amber-200/70 font-semibold">Total Poin:</span>
                          <span className="font-mono font-black text-amber-300">+{top1.poin} Poin</span>
                        </div>
                      </div>
                    </div>

                    {top1.laporan && (
                      <button
                        type="button"
                        onClick={() => onViewLaporanDetail(top1.laporan!)}
                        className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Lihat Berkas Laporan</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-slate-800/40 border border-amber-400/30 rounded-3xl p-8 text-center text-slate-500">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-xl font-bold mb-2">
                      1
                    </div>
                    <p className="text-xs font-bold text-slate-300">Belum Ada Pengiriman</p>
                    <p className="text-[11px] text-slate-500 mt-1">Menunggu sekolah mengirimkan laporan pertama</p>
                  </div>
                )}
                {/* Pillar Base */}
                <div className="w-full h-20 bg-gradient-to-b from-amber-500/30 to-amber-600/40 rounded-b-3xl border-t border-amber-400/50 flex items-center justify-center text-xs font-black text-amber-200 mt-2">
                  🏆 TOP 1 KONSORSIUM
                </div>
              </div>

              {/* JUARA 3: PERUNGGU (Kanan) */}
              <div className="order-3 md:order-3 flex flex-col items-center">
                {top3 ? (
                  <div className="w-full bg-slate-800/80 backdrop-blur-md rounded-2xl border-2 border-amber-700/60 p-5 shadow-lg text-center hover:border-amber-600 transition duration-300 flex flex-col justify-between">
                    <div>
                      <div className="w-14 h-14 mx-auto -mt-10 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-800 text-white flex items-center justify-center font-black text-xl shadow-lg border-2 border-white">
                        🥉 3
                      </div>
                      <div className="mt-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300/80">
                          Juara 3 Perunggu
                        </span>
                        <h4 className="font-extrabold text-base text-white mt-0.5 line-clamp-1">
                          {top3.sekolah.namaSekolah}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {top3.sekolah.kota || 'Sekolah Mitra'}
                        </p>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-700/80 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Tgl Kirim:</span>
                          <span className="font-bold text-slate-100">
                            {formatDateDisplay(top3.tanggalKirim)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Ketepatan:</span>
                          <span className="text-slate-200 font-medium">{top3.keterangan}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Skor:</span>
                          <span className="font-mono font-bold text-amber-300">+{top3.poin} Poin</span>
                        </div>
                      </div>
                    </div>

                    {top3.laporan && (
                      <button
                        type="button"
                        onClick={() => onViewLaporanDetail(top3.laporan!)}
                        className="mt-4 w-full py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Lihat Berkas</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 text-center text-slate-500">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-700/50 flex items-center justify-center text-slate-400 text-lg font-bold mb-2">
                      3
                    </div>
                    <p className="text-xs font-medium">Belum Ada Juara 3</p>
                  </div>
                )}
                {/* Pillar Base */}
                <div className="w-full h-8 bg-slate-700/40 rounded-b-2xl border-t border-slate-700 flex items-center justify-center text-xs font-black text-slate-400 mt-2">
                  PERINGKAT 3
                </div>
              </div>
            </div>
          </div>

          {/* Key Stat Badges for Selected Month */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Target 25 Bulan Ini ({selectedBulan})
              </span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">
                25 {selectedBulan} {deadlineInfo.tahunKalender}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                {monthlyData.totalSangatCepat} Sekolah Sangat Cepat
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Batas Akhir 25 Bulan Depan
              </span>
              <span className="text-base font-extrabold text-blue-700 mt-1 block">
                25 {deadlineInfo.namaBulanDepan} {deadlineInfo.tahunBulanDepan}
              </span>
              <span className="text-[10px] text-blue-600 font-bold">
                {monthlyData.totalTepatWaktu} Sekolah Tepat Waktu
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Masuk Tepat Waktu
              </span>
              <span className="text-base font-extrabold text-emerald-700 mt-1 block">
                {monthlyData.totalSangatCepat + monthlyData.totalTepatWaktu} / {sekolahList.length} Mitra
              </span>
              <span className="text-[10px] text-slate-500">
                Terkirim sebelum batas 25
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Belum Mengirim / Terlambat
              </span>
              <span className="text-base font-extrabold text-rose-700 mt-1 block">
                {monthlyData.totalBelumKirim + monthlyData.totalTerlambat} Sekolah
              </span>
              <span className="text-[10px] text-rose-600 font-bold">
                {monthlyData.totalTerlambat} Lewat Batas 25
              </span>
            </div>
          </div>

          {/* Full Monthly Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" />
                  <span>Daftar Lengkap Peringkat & Evaluasi Tanggal Pengiriman</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periode Laporan: <strong>{selectedBulan} {deadlineInfo.tahunKalender}</strong> (Tahun Ajaran {selectedTahunAjaran})
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>Sistem Penilaian Transparan & Objektif</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Peringkat</th>
                    <th className="py-3 px-4">Sekolah Mitra</th>
                    <th className="py-3 px-4">Waktu Pengiriman</th>
                    <th className="py-3 px-4">Kategori Kepatuhan</th>
                    <th className="py-3 px-4">Selisih Terhadap Batas Tgl 25</th>
                    <th className="py-3 px-4 text-center">Poin L-MAP</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {evaluations.map((item) => {
                    const isPodium = item.rank && item.rank <= 3 && item.statusKepatuhan !== 'BELUM_KIRIM';
                    return (
                      <tr 
                        key={item.sekolah.id}
                        className={`hover:bg-slate-50/80 transition ${
                          item.isTop1 
                            ? 'bg-amber-50/40 font-semibold' 
                            : item.isTop2 
                            ? 'bg-slate-50/50' 
                            : item.isTop3 
                            ? 'bg-amber-50/20' 
                            : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">
                          {item.isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                              🥇 1
                            </span>
                          ) : item.isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 text-slate-900 font-bold text-xs shadow-xs">
                              🥈 2
                            </span>
                          ) : item.isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-white font-bold text-xs shadow-xs">
                              🥉 3
                            </span>
                          ) : item.statusKepatuhan === 'BELUM_KIRIM' ? (
                            <span className="text-slate-400 font-mono">-</span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold font-mono text-xs">
                              #{item.rank}
                            </span>
                          )}
                        </td>

                        {/* School Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isPodium ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.sekolah.namaSekolah.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{item.sekolah.namaSekolah}</span>
                                {item.isTop1 && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                                    TOP 1
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {item.sekolah.kota || 'Kota'} • {item.sekolah.pimpinan || 'Pimpinan'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tanggal Pengiriman */}
                        <td className="py-3 px-4">
                          {item.tanggalKirim ? (
                            <div>
                              <span className="font-bold text-slate-900 block font-mono">
                                {formatDateDisplay(item.tanggalKirim)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Via L-MAP Portal
                              </span>
                            </div>
                          ) : (
                            <span className="text-rose-600 italic text-[11px] font-medium">
                              Belum Dikirimkan
                            </span>
                          )}
                        </td>

                        {/* Status Kepatuhan */}
                        <td className="py-3 px-4">
                          {renderStatusBadge(item.statusKepatuhan)}
                        </td>

                        {/* Selisih Waktu */}
                        <td className="py-3 px-4">
                          <span className={`text-xs ${
                            item.statusKepatuhan === 'SANGAT_CEPAT' 
                              ? 'text-emerald-700 font-bold' 
                              : item.statusKepatuhan === 'TEPAT_WAKTU' 
                              ? 'text-blue-700 font-semibold' 
                              : item.statusKepatuhan === 'TERLAMBAT'
                              ? 'text-amber-800 font-bold'
                              : 'text-slate-400'
                          }`}>
                            {item.keterangan}
                          </span>
                        </td>

                        {/* Poin */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-slate-800 px-2 py-1 rounded-lg bg-slate-100">
                            +{item.poin}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          {item.laporan ? (
                            <button
                              type="button"
                              onClick={() => onViewLaporanDetail(item.laporan!)}
                              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>Detail</span>
                            </button>
                          ) : onOpenCreateModal ? (
                            <button
                              type="button"
                              onClick={() => onOpenCreateModal(item.sekolah.id, selectedBulan)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Input Laporan</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 4. MODE AKUMULASI / STANDINGS TAHUN AJARAN */}
      {viewMode === 'akumulasi' && (
        <div className="space-y-6">
          {/* Top Podium Konsorsium Tahun Ajaran */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/20 text-amber-100 text-xs font-black uppercase">
                <Trophy size={13} className="text-yellow-300" />
                Juara Umum Ketepatan Waktu TA {selectedTahunAjaran}
              </span>
              <h3 className="text-2xl font-black mt-2">
                Klasemen Akumulasi Konsorsium Lazuardi
              </h3>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                Diakumulasi dari seluruh perolehan medali Top 1 (Emas), Top 2 (Perak), dan Top 3 (Perunggu) 
                serta poin ketepatan waktu pengiriman laporan setiap bulannya.
              </p>
            </div>
          </div>

          {/* Standings Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Award size={16} className="text-blue-600" />
                <span>Peringkat Akumulasi Sekolah Mitra (Sepanjang TA {selectedTahunAjaran})</span>
              </h4>
              <span className="text-xs text-slate-500">
                Total {passedMonths.length} Bulan Aktif Dievaluasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Nama Sekolah Mitra</th>
                    <th className="py-3 px-4 text-center">🥇 Top 1</th>
                    <th className="py-3 px-4 text-center">🥈 Top 2</th>
                    <th className="py-3 px-4 text-center">🥉 Top 3</th>
                    <th className="py-3 px-4 text-center">⚡ Sangat Cepat</th>
                    <th className="py-3 px-4 text-center">✅ Tepat Waktu</th>
                    <th className="py-3 px-4 text-center">Tingkat Kepatuhan</th>
                    <th className="py-3 px-4 text-right">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {yearlyStandings.map((standing) => {
                    const isTop1 = standing.rank === 1;
                    const isTop2 = standing.rank === 2;
                    const isTop3 = standing.rank === 3;

                    return (
                      <tr 
                        key={standing.sekolah.id}
                        className={`hover:bg-slate-50 transition ${
                          isTop1 ? 'bg-amber-50/50 font-bold' : isTop2 ? 'bg-slate-50/50' : isTop3 ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                              🥇 1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 text-slate-900 font-bold text-xs shadow-xs">
                              🥈 2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-white font-bold text-xs shadow-xs">
                              🥉 3
                            </span>
                          ) : (
                            <span className="font-mono text-slate-500 font-bold">
                              #{standing.rank}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {standing.sekolah.namaSekolah}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {standing.sekolah.kota} • {standing.sekolah.pimpinan}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs ${
                            standing.top1Count > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-400'
                          }`}>
                            {standing.top1Count}x
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            standing.top2Count > 0 ? 'bg-slate-200 text-slate-800' : 'text-slate-400'
                          }`}>
                            {standing.top2Count}x
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            standing.top3Count > 0 ? 'bg-amber-800/15 text-amber-900' : 'text-slate-400'
                          }`}>
                            {standing.top3Count}x
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-emerald-700">
                            {standing.sangatCepatCount} bln
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-blue-700">
                            {standing.tepatWaktuCount} bln
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              {standing.kepatuhanRate}%
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${standing.kepatuhanRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                            {standing.totalPoin} Poin
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
