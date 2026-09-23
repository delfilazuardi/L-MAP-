import { Invoice } from '../types';

export const ROMAWI_BULAN: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII',
};

export const NAMA_BULAN_LIST = [
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
  'Juni',
];

export const ALL_MONTHS = [
  { no: 1, nama: 'Januari', romawi: 'I' },
  { no: 2, nama: 'Februari', romawi: 'II' },
  { no: 3, nama: 'Maret', romawi: 'III' },
  { no: 4, nama: 'April', romawi: 'IV' },
  { no: 5, nama: 'Mei', romawi: 'V' },
  { no: 6, nama: 'Juni', romawi: 'VI' },
  { no: 7, nama: 'Juli', romawi: 'VII' },
  { no: 8, nama: 'Agustus', romawi: 'VIII' },
  { no: 9, nama: 'September', romawi: 'IX' },
  { no: 10, nama: 'Oktober', romawi: 'X' },
  { no: 11, nama: 'November', romawi: 'XI' },
  { no: 12, nama: 'Desember', romawi: 'XII' },
];

/**
 * Mendapatkan angka romawi dari bulan (1-12)
 */
export function getRomawiBulan(monthNumber: number): string {
  return ROMAWI_BULAN[monthNumber] || 'I';
}

/**
 * Generate Nomor Invoice Baru dengan format:
 * INV/romawi bulan dibuat invoice/angka tahun dibuat invoice/nomor lanjutan/MO
 * Contoh: INV/IX/2026/006/MO
 */
export function generateNomorInvoiceBaru(
  existingInvoices: Invoice[],
  date: Date = new Date()
): { nomorInvoice: string; sequence: number; romawi: string; tahun: number } {
  const month = date.getMonth() + 1; // 1-12
  const romawi = getRomawiBulan(month);
  const tahun = date.getFullYear();

  // Cari sequence tertinggi dari nomor invoice yang ada
  let maxSeq = 0;

  existingInvoices.forEach((inv) => {
    const rawId = inv.id || inv.nomorInvoice || '';
    
    // Pola 1: INV/romawi/tahun/nomor/MO (e.g. INV/IX/2026/001/MO)
    const matchMO = rawId.match(/\/(\d+)\/MO$/i);
    if (matchMO && matchMO[1]) {
      const num = parseInt(matchMO[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    } else {
      // Pola 2: fallback format lama (e.g. INV/LZR/2026/09/001 atau sejenisnya)
      const matchAny = rawId.match(/(\d{3,4})$/);
      if (matchAny && matchAny[1]) {
        const num = parseInt(matchAny[1], 10);
        if (!isNaN(num) && num > maxSeq && num < 1000) {
          maxSeq = num;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqFormatted = String(nextSeq).padStart(3, '0');
  const nomorInvoice = `INV/${romawi}/${tahun}/${seqFormatted}/MO`;

  return {
    nomorInvoice,
    sequence: nextSeq,
    romawi,
    tahun,
  };
}

export function formatRupiah(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  const hasDecimals = val % 1 !== 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(val);
}

export const SEKOLAH_AFILIASI_3 = [
  {
    id: 'MO011',
    namaSekolah: 'SMA Lazuardi',
    kota: 'Depok',
    keterangan: 'Khusus pelaporan tagihan resmi (Bebas kewajiban pembayaran)',
    badge: 'SMA GCS'
  },
  {
    id: 'MO010',
    namaSekolah: 'Lazuardi Kamila',
    kota: 'Solo',
    keterangan: 'Khusus pelaporan tagihan resmi (Bebas kewajiban pembayaran)',
    badge: 'Kamila Solo'
  },
  {
    id: 'MO013',
    namaSekolah: 'Lazuardi Athaillah',
    kota: 'Makassar',
    keterangan: 'Sekolah Afiliasi per Juli 2024 (Bebas kewajiban pembayaran)',
    badge: 'Afiliasi Makassar'
  },
];

/**
 * Memeriksa apakah suatu sekolah masuk ke dalam 3 Sekolah Afiliasi / Khusus Pelaporan
 */
export function isSekolahAfiliasiTab(sekolahIdOrName: string): boolean {
  if (!sekolahIdOrName) return false;
  const s = sekolahIdOrName.toLowerCase();
  return (
    s.includes('mo011') ||
    s.includes('sma') ||
    s.includes('gcs') ||
    s.includes('mo010') ||
    s.includes('kamila') ||
    s.includes('mo013') ||
    s.includes('athaillah')
  );
}

/**
 * Memeriksa apakah suatu sekolah/transaksi termasuk kategori Khusus
 * "Hanya Pelaporan Tagihan Saja" (tidak memiliki kewajiban pembayaran):
 * 1. SMA Lazuardi GCS (MO011): Selalu pelaporan saja
 * 2. Lazuardi Kamila Solo (MO010): Selalu pelaporan saja
 * 3. Lazuardi Athaillah Makassar (MO013): 2022-2024 masih kategori mitra (kewajiban bayar),
 *    namun setelah Juli 2024 (TA 2024/2025 dst) beralih menjadi afiliasi (hanya pelaporan tagihan saja).
 */
export function isSchoolPelaporanSaja(
  sekolahIdOrName: string,
  context?: { date?: string; tahunAjaran?: string; tahun?: number }
): boolean {
  const norm = (sekolahIdOrName || '').toLowerCase();

  // 1. SMA Lazuardi GCS
  if (norm.includes('mo011') || norm.includes('sma lazuardi') || norm.includes('gcs')) {
    return true;
  }

  // 2. Lazuardi Kamila Solo
  if (norm.includes('mo010') || norm.includes('kamila')) {
    return true;
  }

  // 3. Lazuardi Athaillah Makassar
  if (norm.includes('mo013') || norm.includes('athaillah')) {
    if (!context) {
      // Default: saat ini sudah beralih menjadi afiliasi
      return true;
    }
    const { date, tahunAjaran, tahun } = context;
    if (tahunAjaran) {
      if (tahunAjaran.includes('2022/2023') || tahunAjaran.includes('2023/2024')) {
        return false; // Periode 2022-2024 masih Mitra Reguler
      }
      return true; // 2024/2025 dst sudah Afiliasi
    }
    if (tahun) {
      if (tahun < 2024) return false;
      if (tahun >= 2025) return true;
    }
    if (date) {
      // Pembatas: 1 Juli 2024
      return date >= '2024-07-01';
    }
    return true;
  }

  return false;
}

export function getSchoolObligationBadgeInfo(
  sekolahIdOrName: string,
  context?: { date?: string; tahunAjaran?: string; tahun?: number }
): {
  isPelaporanSaja: boolean;
  label: string;
  badgeClass: string;
  keterangan: string;
} {
  const isPelaporan = isSchoolPelaporanSaja(sekolahIdOrName, context);
  const norm = (sekolahIdOrName || '').toLowerCase();

  if (isPelaporan) {
    if (norm.includes('mo013') || norm.includes('athaillah')) {
      return {
        isPelaporanSaja: true,
        label: 'Afiliasi (Pelaporan Tagihan Saja)',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        keterangan: 'Beralih menjadi Sekolah Afiliasi per Juli 2024 (Bebas kewajiban pembayaran)',
      };
    }
    if (norm.includes('mo011') || norm.includes('sma')) {
      return {
        isPelaporanSaja: true,
        label: 'Khusus Pelaporan Tagihan',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        keterangan: 'SMA Lazuardi GCS (Hanya pelaporan tagihan, tidak ada kewajiban pembayaran)',
      };
    }
    return {
      isPelaporanSaja: true,
      label: 'Khusus Pelaporan Tagihan',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      keterangan: 'Lazuardi Kamila Solo (Hanya pelaporan tagihan, tidak ada kewajiban pembayaran)',
    };
  }

  return {
    isPelaporanSaja: false,
    label: 'Mitra Reguler (Kewajiban Pembayaran)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    keterangan: 'Memiliki kewajiban pembayaran tagihan kemitraan',
  };
}

