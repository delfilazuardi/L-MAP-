import { SekolahMitra, LaporanBulanan } from '../types';

export const MONTH_TO_INDEX: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

export const INDEX_TO_MONTH: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
};

export type TimelinessStatus = 'SANGAT_CEPAT' | 'TEPAT_WAKTU' | 'TERLAMBAT' | 'BELUM_KIRIM';

export interface ReportDeadlineInfo {
  bulan: string;
  tahunAjaran: string;
  tahunKalender: number;
  bulanAngka: number;
  targetBulanBerjalan25: string; // YYYY-MM-25 (Bulan tersebut)
  batasAkhirBulanDepan25: string; // YYYY-MM-25 (Bulan depannya)
  namaBulanDepan: string;
  tahunBulanDepan: number;
}

export interface SchoolMonthlyEvaluation {
  sekolah: SekolahMitra;
  laporan?: LaporanBulanan;
  tanggalKirim?: string; // YYYY-MM-DD
  statusKepatuhan: TimelinessStatus;
  rank?: number; // 1, 2, 3, 4, ...
  isTop1: boolean;
  isTop2: boolean;
  isTop3: boolean;
  selisihHariBulanBerjalan?: number; // Negatif jika sebelum tgl 25 bulan berjalan
  selisihHariBulanDepan?: number; // Negatif jika sebelum tgl 25 bulan depannya
  keterangan: string;
  poin: number;
}

export interface SchoolConsortiumStanding {
  sekolah: SekolahMitra;
  totalPoin: number;
  top1Count: number; // Emas
  top2Count: number; // Perak
  top3Count: number; // Perunggu
  sangatCepatCount: number; // Dikirim <= 25 bulan berjalan
  tepatWaktuCount: number; // Dikirim <= 25 bulan berikutnya
  terlambatCount: number;
  belumKirimCount: number;
  totalLaporan: number;
  rank: number;
  kepatuhanRate: number;
}

/**
 * Mendapatkan indeks bulan (1-12) dari nama bulan (bahasa Indonesia)
 */
export function getBulanIndex(bulanName: string): number {
  if (!bulanName) return 1;
  const clean = bulanName.trim().toLowerCase();
  return MONTH_TO_INDEX[clean] || 1;
}

/**
 * Menghitung tahun kalender untuk bulan tertentu dalam tahun ajaran.
 * Contoh TA '2026/2027':
 * - Juli - Desember => 2026
 * - Januari - Juni => 2027
 */
export function getTahunKalender(tahunAjaran: string, bulan: string): number {
  const [startYearStr] = (tahunAjaran || '2026/2027').split('/');
  const startYear = parseInt(startYearStr, 10) || 2026;
  const bIdx = getBulanIndex(bulan);
  // Juli (7) s/d Desember (12) di tahun pertama; Januari (1) s/d Juni (6) di tahun kedua
  return bIdx >= 7 ? startYear : startYear + 1;
}

/**
 * Menghitung batas tenggat waktu pengiriman laporan bulanan:
 * 1. Target Sangat Cepat: Tanggal 25 di bulan tersebut
 * 2. Batas Akhir Tepat Waktu: Tanggal 25 di bulan depannya
 */
export function getReportDeadlineInfo(tahunAjaran: string, bulan: string): ReportDeadlineInfo {
  const tahunKalender = getTahunKalender(tahunAjaran, bulan);
  const bulanAngka = getBulanIndex(bulan);

  // Format YYYY-MM-25 untuk bulan tersebut
  const mStr = String(bulanAngka).padStart(2, '0');
  const targetBulanBerjalan25 = `${tahunKalender}-${mStr}-25`;

  // Bulan depannya
  let nextBulanAngka = bulanAngka + 1;
  let nextTahun = tahunKalender;
  if (nextBulanAngka > 12) {
    nextBulanAngka = 1;
    nextTahun = tahunKalender + 1;
  }

  const nextMStr = String(nextBulanAngka).padStart(2, '0');
  const batasAkhirBulanDepan25 = `${nextTahun}-${nextMStr}-25`;
  const namaBulanDepan = INDEX_TO_MONTH[nextBulanAngka] || 'Bulan Depan';

  return {
    bulan,
    tahunAjaran,
    tahunKalender,
    bulanAngka,
    targetBulanBerjalan25,
    batasAkhirBulanDepan25,
    namaBulanDepan,
    tahunBulanDepan: nextTahun,
  };
}

/**
 * Parse tanggal kirim ke format string standar YYYY-MM-DD
 */
export function normalizeDateString(dateVal?: string): string | null {
  if (!dateVal) return null;
  const clean = dateVal.trim();
  if (clean.length >= 10 && clean[4] === '-' && clean[7] === '-') {
    return clean.substring(0, 10);
  }
  // Try Date parsing
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
}

/**
 * Menghitung selisih hari antara 2 tanggal (targetDate - dateToCheck)
 * Jika hasil negatif, berarti dateToCheck melewati targetDate.
 * Jika hasil positif, berarti dateToCheck lebih awal sekian hari sebelum targetDate.
 */
export function diffDays(targetDateStr: string, actualDateStr: string): number {
  const t = new Date(targetDateStr + 'T00:00:00Z').getTime();
  const a = new Date(actualDateStr + 'T00:00:00Z').getTime();
  return Math.round((t - a) / (1000 * 60 * 60 * 24));
}

/**
 * Menilai kepatuhan waktu pengiriman sebuah laporan
 */
export function evaluateSingleReportTimeliness(
  tanggalKirimVal: string | undefined,
  tahunAjaran: string,
  bulan: string
): {
  status: TimelinessStatus;
  keterangan: string;
  selisihHariBulanBerjalan: number;
  selisihHariBulanDepan: number;
  normalizedDate: string | null;
  deadlineInfo: ReportDeadlineInfo;
} {
  const deadlineInfo = getReportDeadlineInfo(tahunAjaran, bulan);
  const normalizedDate = normalizeDateString(tanggalKirimVal);

  if (!normalizedDate) {
    return {
      status: 'BELUM_KIRIM',
      keterangan: 'Belum mengirimkan laporan',
      selisihHariBulanBerjalan: 0,
      selisihHariBulanDepan: 0,
      normalizedDate: null,
      deadlineInfo,
    };
  }

  const daysToBulanBerjalan = diffDays(deadlineInfo.targetBulanBerjalan25, normalizedDate);
  const daysToBulanDepan = diffDays(deadlineInfo.batasAkhirBulanDepan25, normalizedDate);

  if (daysToBulanBerjalan >= 0) {
    // Dikirim pada atau sebelum tanggal 25 di bulan tersebut
    return {
      status: 'SANGAT_CEPAT',
      keterangan: daysToBulanBerjalan === 0 
        ? `Tepat tgl 25 ${bulan} (Bulan Berjalan)` 
        : `${daysToBulanBerjalan} hari lebih awal dari 25 ${bulan}`,
      selisihHariBulanBerjalan: daysToBulanBerjalan,
      selisihHariBulanDepan: daysToBulanDepan,
      normalizedDate,
      deadlineInfo,
    };
  } else if (daysToBulanDepan >= 0) {
    // Dikirim setelah tgl 25 bulan tersebut, namun sebelum/pada tgl 25 bulan depannya
    return {
      status: 'TEPAT_WAKTU',
      keterangan: daysToBulanDepan === 0
        ? `Tepat batas akhir 25 ${deadlineInfo.namaBulanDepan}`
        : `${daysToBulanDepan} hari sebelum batas 25 ${deadlineInfo.namaBulanDepan}`,
      selisihHariBulanBerjalan: daysToBulanBerjalan,
      selisihHariBulanDepan: daysToBulanDepan,
      normalizedDate,
      deadlineInfo,
    };
  } else {
    // Terlambat (melewati tgl 25 bulan depannya)
    const lateDays = Math.abs(daysToBulanDepan);
    return {
      status: 'TERLAMBAT',
      keterangan: `Terlambat ${lateDays} hari melewati batas 25 ${deadlineInfo.namaBulanDepan}`,
      selisihHariBulanBerjalan: daysToBulanBerjalan,
      selisihHariBulanDepan: daysToBulanDepan,
      normalizedDate,
      deadlineInfo,
    };
  }
}

/**
 * Menghitung Peringkat Top 1, Top 2, Top 3 dan evaluasi seluruh sekolah mitra untuk 1 bulan tertentu.
 */
export function rankMonthlyReports(
  sekolahList: SekolahMitra[],
  laporanList: LaporanBulanan[],
  tahunAjaran: string,
  bulan: string
): {
  evaluations: SchoolMonthlyEvaluation[];
  top1?: SchoolMonthlyEvaluation;
  top2?: SchoolMonthlyEvaluation;
  top3?: SchoolMonthlyEvaluation;
  totalTepatWaktu: number;
  totalSangatCepat: number;
  totalTerlambat: number;
  totalBelumKirim: number;
  deadlineInfo: ReportDeadlineInfo;
} {
  const deadlineInfo = getReportDeadlineInfo(tahunAjaran, bulan);

  // Filter laporan untuk TA dan bulan yang dipilih
  const monthReports = laporanList.filter(
    l => (l.tahunAjaran || '2026/2027') === tahunAjaran && l.bulan === bulan
  );

  const reportMap = new Map<string, LaporanBulanan>();
  monthReports.forEach(r => {
    reportMap.set(r.mitraId, r);
  });

  // Evaluasi setiap sekolah
  const rawEvaluations = sekolahList.map(sekolah => {
    const laporan = reportMap.get(sekolah.id);
    const dateToCheck = laporan?.tanggalKirim || laporan?.tanggalDiajukan;
    const evalResult = evaluateSingleReportTimeliness(dateToCheck, tahunAjaran, bulan);

    let basePoints = 0;
    if (evalResult.status === 'SANGAT_CEPAT') {
      basePoints = 40;
    } else if (evalResult.status === 'TEPAT_WAKTU') {
      basePoints = 25;
    } else if (evalResult.status === 'TERLAMBAT') {
      basePoints = 5;
    } else {
      basePoints = 0;
    }

    return {
      sekolah,
      laporan,
      tanggalKirim: evalResult.normalizedDate || undefined,
      statusKepatuhan: evalResult.status,
      selisihHariBulanBerjalan: evalResult.selisihHariBulanBerjalan,
      selisihHariBulanDepan: evalResult.selisihHariBulanDepan,
      keterangan: evalResult.keterangan,
      poin: basePoints,
      isTop1: false,
      isTop2: false,
      isTop3: false,
    };
  });

  // Urutkan sekolah untuk penentuan peringkat:
  // 1. Yang sudah kirim & tepat waktu / sangat cepat (diurutkan tanggal kirim paling awal)
  // 2. Yang terlambat (diurutkan tanggal kirim paling awal)
  // 3. Yang belum kirim
  const submittedValid = rawEvaluations.filter(
    e => (e.statusKepatuhan === 'SANGAT_CEPAT' || e.statusKepatuhan === 'TEPAT_WAKTU') && !!e.tanggalKirim
  );
  submittedValid.sort((a, b) => {
    return (a.tanggalKirim || '').localeCompare(b.tanggalKirim || '');
  });

  const submittedLate = rawEvaluations.filter(
    e => e.statusKepatuhan === 'TERLAMBAT' && !!e.tanggalKirim
  );
  submittedLate.sort((a, b) => {
    return (a.tanggalKirim || '').localeCompare(b.tanggalKirim || '');
  });

  const notSubmitted = rawEvaluations.filter(e => e.statusKepatuhan === 'BELUM_KIRIM');
  notSubmitted.sort((a, b) => a.sekolah.namaSekolah.localeCompare(b.sekolah.namaSekolah));

  // Terapkan Top 1, Top 2, Top 3 pada submittedValid
  submittedValid.forEach((item, idx) => {
    const rank = idx + 1;
    (item as any).rank = rank;
    if (rank === 1) {
      item.isTop1 = true;
      item.poin += 30; // Bonus Top 1 Emas
    } else if (rank === 2) {
      item.isTop2 = true;
      item.poin += 20; // Bonus Top 2 Perak
    } else if (rank === 3) {
      item.isTop3 = true;
      item.poin += 10; // Bonus Top 3 Perunggu
    }
  });

  // Berikan ranking lanjutan untuk late & notSubmitted
  submittedLate.forEach((item, idx) => {
    (item as any).rank = submittedValid.length + idx + 1;
  });

  notSubmitted.forEach((item, idx) => {
    (item as any).rank = submittedValid.length + submittedLate.length + idx + 1;
  });

  const finalEvaluations: SchoolMonthlyEvaluation[] = [
    ...submittedValid,
    ...submittedLate,
    ...notSubmitted,
  ];

  return {
    evaluations: finalEvaluations,
    top1: submittedValid[0],
    top2: submittedValid[1],
    top3: submittedValid[2],
    totalTepatWaktu: submittedValid.filter(e => e.statusKepatuhan === 'TEPAT_WAKTU').length,
    totalSangatCepat: submittedValid.filter(e => e.statusKepatuhan === 'SANGAT_CEPAT').length,
    totalTerlambat: submittedLate.length,
    totalBelumKirim: notSubmitted.length,
    deadlineInfo,
  };
}

/**
 * Menghitung Klasemen Akumulasi / Juara Umum Sepanjang Tahun Ajaran
 */
export function computeConsortiumYearlyRankings(
  sekolahList: SekolahMitra[],
  laporanList: LaporanBulanan[],
  tahunAjaran: string,
  passedMonths: string[]
): SchoolConsortiumStanding[] {
  const standingsMap = new Map<string, SchoolConsortiumStanding>();

  sekolahList.forEach(sekolah => {
    standingsMap.set(sekolah.id, {
      sekolah,
      totalPoin: 0,
      top1Count: 0,
      top2Count: 0,
      top3Count: 0,
      sangatCepatCount: 0,
      tepatWaktuCount: 0,
      terlambatCount: 0,
      belumKirimCount: 0,
      totalLaporan: 0,
      rank: 1,
      kepatuhanRate: 0,
    });
  });

  passedMonths.forEach(bulan => {
    const { evaluations } = rankMonthlyReports(sekolahList, laporanList, tahunAjaran, bulan);
    evaluations.forEach(ev => {
      const standing = standingsMap.get(ev.sekolah.id);
      if (standing) {
        standing.totalPoin += ev.poin;
        if (ev.isTop1) standing.top1Count += 1;
        if (ev.isTop2) standing.top2Count += 1;
        if (ev.isTop3) standing.top3Count += 1;

        if (ev.statusKepatuhan === 'SANGAT_CEPAT') {
          standing.sangatCepatCount += 1;
          standing.totalLaporan += 1;
        } else if (ev.statusKepatuhan === 'TEPAT_WAKTU') {
          standing.tepatWaktuCount += 1;
          standing.totalLaporan += 1;
        } else if (ev.statusKepatuhan === 'TERLAMBAT') {
          standing.terlambatCount += 1;
          standing.totalLaporan += 1;
        } else {
          standing.belumKirimCount += 1;
        }
      }
    });
  });

  const standingsList = Array.from(standingsMap.values());
  const totalMonthsCount = passedMonths.length || 1;

  standingsList.forEach(item => {
    const onTimeTotal = item.sangatCepatCount + item.tepatWaktuCount;
    item.kepatuhanRate = Math.round((onTimeTotal / totalMonthsCount) * 100);
  });

  // Urutkan berdasarkan total poin, kemudian top1Count, top2Count, top3Count, kepatuhanRate
  standingsList.sort((a, b) => {
    if (b.totalPoin !== a.totalPoin) return b.totalPoin - a.totalPoin;
    if (b.top1Count !== a.top1Count) return b.top1Count - a.top1Count;
    if (b.top2Count !== a.top2Count) return b.top2Count - a.top2Count;
    if (b.top3Count !== a.top3Count) return b.top3Count - a.top3Count;
    return b.kepatuhanRate - a.kepatuhanRate;
  });

  standingsList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return standingsList;
}
