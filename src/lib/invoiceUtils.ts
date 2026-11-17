import { Invoice, InvoiceStatus, SekolahMitra } from '../types';

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
 * Mengekstrak nomor urut (sequence) dari kode Nomor Invoice.
 * Contoh:
 * - "INV/IX/25/292/MO" -> 292
 * - "INV/X/25/293/MO" -> 293
 * - "INV/VII/2022/001/MO" -> 1
 */
export function extractInvoiceSequenceNumber(nomorInvoice?: string | null): number {
  if (!nomorInvoice) return 0;
  const str = String(nomorInvoice).trim();
  if (!str) return 0;

  // Prioritas 1: Angka tepat sebelum "/MO" (misal INV/IX/25/292/MO -> 292)
  const matchBeforeMO = str.match(/\/(\d+)\/MO\b/i);
  if (matchBeforeMO && matchBeforeMO[1]) {
    const n = parseInt(matchBeforeMO[1], 10);
    if (!isNaN(n)) return n;
  }

  // Prioritas 2: Format bagian dipisah "/" -> INV / ROMAWI / TAHUN / NOMOR_URUT / ...
  const parts = str.split('/').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 4 && /^INV$/i.test(parts[0])) {
    const seqCandidate = parts[3].replace(/\D/g, '');
    if (seqCandidate) {
      const n = parseInt(seqCandidate, 10);
      if (!isNaN(n)) return n;
    }
  }

  // Prioritas 3: Ambil grup angka terakhir pada string
  const allNumbers = str.match(/\d+/g);
  if (allNumbers && allNumbers.length > 0) {
    const lastNum = parseInt(allNumbers[allNumbers.length - 1], 10);
    if (!isNaN(lastNum)) return lastNum;
  }

  return 0;
}

/**
 * Mengekstrak tahun & bulan dari kode Nomor Invoice (sebagai tie-breaker jika nomor urut sama)
 */
function extractYearAndMonthFromInvoiceCode(nomorInvoice?: string | null): { year: number; month: number } {
  if (!nomorInvoice) return { year: 0, month: 0 };
  const parts = String(nomorInvoice).trim().split('/').map(p => p.trim());
  let month = 0;
  let year = 0;

  if (parts.length >= 3) {
    const rom = parts[1]?.toUpperCase();
    const foundMonth = ALL_MONTHS.find(m => m.romawi === rom);
    if (foundMonth) month = foundMonth.no;

    const rawYear = parseInt(parts[2], 10);
    if (!isNaN(rawYear)) {
      year = rawYear < 100 ? 2000 + rawYear : rawYear;
    }
  }
  return { year, month };
}

/**
 * Comparator standar untuk mengurutkan Invoice dari Nomor Urut Terkecil hingga Terbesar
 * (contoh: 292 -> 293 -> 294 dst). Tidak menggunakan createdAt/updatedAt agar posisi
 * tidak berubah/naik ke atas saat di-edit.
 */
export function compareInvoiceBySequenceAsc(
  a: { nomorInvoice?: string; id?: string; tanggalKirim?: string },
  b: { nomorInvoice?: string; id?: string; tanggalKirim?: string }
): number {
  const codeA = a.nomorInvoice || a.id || '';
  const codeB = b.nomorInvoice || b.id || '';

  const seqA = extractInvoiceSequenceNumber(codeA);
  const seqB = extractInvoiceSequenceNumber(codeB);

  // Jika kedua item memiliki nomor urut invoice valid (> 0)
  if (seqA > 0 && seqB > 0) {
    if (seqA !== seqB) {
      return seqA - seqB;
    }
  } else if (seqA > 0 && seqB === 0) {
    // Invoice bernomor diletakkan berurutan
    return -1;
  } else if (seqA === 0 && seqB > 0) {
    return 1;
  }

  // Jika sama-sama non-invoice (pendataan afiliasi) atau urutan sama:
  if (a.tanggalKirim && b.tanggalKirim && a.tanggalKirim !== b.tanggalKirim) {
    return a.tanggalKirim.localeCompare(b.tanggalKirim);
  }

  const ymA = extractYearAndMonthFromInvoiceCode(codeA);
  const ymB = extractYearAndMonthFromInvoiceCode(codeB);
  if (ymA.year !== ymB.year) return ymA.year - ymB.year;
  if (ymA.month !== ymB.month) return ymA.month - ymB.month;

  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Comparator standar untuk mengurutkan Pembayaran berdasarkan Nomor Urut Invoice Terkecil hingga Terbesar
 */
export function comparePaymentByInvoiceSequenceAsc(
  a: { invoiceId?: string; noReferensi?: string; id?: string; tanggalBayar?: string },
  b: { invoiceId?: string; noReferensi?: string; id?: string; tanggalBayar?: string }
): number {
  const invCodeA = a.invoiceId || '';
  const invCodeB = b.invoiceId || '';

  const seqA = invCodeA ? extractInvoiceSequenceNumber(invCodeA) : Number.MAX_SAFE_INTEGER;
  const seqB = invCodeB ? extractInvoiceSequenceNumber(invCodeB) : Number.MAX_SAFE_INTEGER;

  if (seqA !== seqB) {
    return seqA - seqB;
  }

  const refSeqA = extractInvoiceSequenceNumber(a.noReferensi || a.id || '');
  const refSeqB = extractInvoiceSequenceNumber(b.noReferensi || b.id || '');
  if (refSeqA !== refSeqB) {
    return refSeqA - refSeqB;
  }

  return (invCodeA || a.noReferensi || a.id || '').localeCompare(
    invCodeB || b.noReferensi || b.id || '',
    undefined,
    { numeric: true, sensitivity: 'base' }
  );
}

/**
 * Generate Nomor Invoice Baru dengan format:
 * INV/romawi bulan dibuat invoice/angka tahun dibuat invoice/nomor lanjutan/MO
 * Contoh: INV/IX/25/292/MO -> selanjutnya INV/X/25/293/MO
 */
export function generateNomorInvoiceBaru(
  existingInvoices: Invoice[],
  date: Date = new Date()
): { nomorInvoice: string; sequence: number; romawi: string; tahun: number } {
  const month = date.getMonth() + 1; // 1-12
  const romawi = getRomawiBulan(month);
  const tahunFull = date.getFullYear();
  const tahunShort = String(tahunFull).slice(-2);

  // Cari sequence tertinggi dari nomor invoice yang ada
  let maxSeq = 0;

  existingInvoices.forEach((inv) => {
    const rawCode = inv.nomorInvoice || inv.id || '';
    const num = extractInvoiceSequenceNumber(rawCode);
    if (!isNaN(num) && num > maxSeq && num < 100000) {
      maxSeq = num;
    }
  });

  const nextSeq = maxSeq + 1;
  const seqFormatted = String(nextSeq).padStart(3, '0');
  const nomorInvoice = `INV/${romawi}/${tahunShort}/${seqFormatted}/MO`;

  return {
    nomorInvoice,
    sequence: nextSeq,
    romawi,
    tahun: tahunFull,
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
    keterangan: 'Sekolah Afiliasi (Khusus Pendataan Kemitraan Saja, Tanpa Invoice)',
    badge: 'SMA GCS'
  },
  {
    id: 'MO010',
    namaSekolah: 'Lazuardi Kamila',
    kota: 'Solo',
    keterangan: 'Sekolah Afiliasi (Khusus Pendataan Kemitraan Saja, Tanpa Invoice)',
    badge: 'Kamila Solo'
  },
  {
    id: 'MO013',
    namaSekolah: 'Lazuardi Athaillah',
    kota: 'Makassar',
    keterangan: 'Sekolah Mitra ber-Invoice s/d 2024; Mulai 2025 dst beralih menjadi Afiliasi (Khusus Pendataan, Tanpa Invoice)',
    badge: 'Afiliasi Makassar'
  },
];

/**
  * Memeriksa apakah suatu sekolah & konteks tahun merupakan Sekolah Afiliasi
  * yang TIDAK PERLU menggunakan nomor invoice (hanya pendataan saja).
  *
  * Aturan spesifik:
  * 1. Sekolah Afiliasi tidak perlu pakai nomor invoice (hanya pendataan saja).
  * 2. PENGECUALIAN: Lazuardi Athaillah (MO013) hingga tahun 2024 (<= 2024 / TA 2022-2024)
  *    masih menggunakan nomor invoice resmi kemitraan.
  * 3. Untuk tahun-tahun berikutnya (setelah 2024, yaitu 2025 ke atas / TA 2025/2026 dst),
  *    data Lazuardi Athaillah juga beralih menjadi HANYA PENDATAAN SAJA tanpa nomor invoice yang harus diisi.
  * 4. Sekolah afiliasi lainnya (SMA Lazuardi, Lazuardi Kamila) sepanjang masa hanya pendataan saja (tanpa nomor invoice).
  */
export function isAfiliasiTanpaInvoice(
  sekolahIdOrName?: string | null,
  context?: {
    date?: string;
    tahunAjaran?: string;
    tahun?: number;
    sekolahList?: { id: string; statusKerjasama?: string; kategoriSekolah?: string }[];
  }
): boolean {
  if (!sekolahIdOrName) return false;
  const norm = String(sekolahIdOrName).toLowerCase();

  // 1. Cek apakah entitas ini termasuk sekolah afiliasi
  const isKnownAfiliasi = isSekolahAfiliasiTab(sekolahIdOrName);
  const isListAfiliasi = context?.sekolahList?.some(
    s =>
      (s.id.toLowerCase() === norm || s.id === sekolahIdOrName) &&
      (s.statusKerjasama === 'Afiliasi' || s.kategoriSekolah === 'Sekolah Afiliasi' || s.kategoriSekolah === 'Khusus Pelaporan')
  );

  if (!isKnownAfiliasi && !isListAfiliasi) {
    return false; // Bukan sekolah afiliasi -> tetap menggunakan nomor invoice
  }

  // 2. Jika Lazuardi Athaillah Makassar (MO013):
  const isAthaillah = norm.includes('mo013') || norm.includes('athaillah');
  if (isAthaillah) {
    // Tentukan tahun
    let year = context?.tahun;
    if (!year && context?.date) {
      const parsedYear = parseInt(context.date.slice(0, 4), 10);
      if (!isNaN(parsedYear)) year = parsedYear;
    }
    if (!year && context?.tahunAjaran) {
      const match = context.tahunAjaran.match(/(\d{4})/);
      if (match) year = parseInt(match[1], 10);
    }

    // Hingga tahun 2024 (<= 2024): Athaillah MASIH MENGGUNAKAN NOMOR INVOICE
    if (year && year <= 2024) {
      return false;
    }

    // Tanggal spesifik: jika sebelum 2025-01-01
    if (context?.date && context.date < '2025-01-01') {
      return false;
    }

    // Tahun-tahun berikutnya (2025 ke atas): HANYA PENDATAAN SAJA (tanpa nomor invoice)
    return true;
  }

  // 3. Untuk sekolah afiliasi lainnya (SMA Lazuardi, Lazuardi Kamila, dll):
  // Sepanjang masa tidak perlu pakai invoice, hanya pendataan saja.
  return true;
}

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

/**
 * Daftar baku Tahun Ajaran resmi untuk dropdown dan filter
 */
export const STANDARD_TAHUN_AJARAN_LIST = [
  '2028/2029',
  '2027/2028',
  '2026/2027',
  '2025/2026',
  '2024/2025',
  '2023/2024',
  '2022/2023',
] as const;

/**
 * Cek apakah string memiliki format baku Tahun Ajaran "YYYY/YYYY" (contoh: 2024/2025)
 */
export function isValidTahunAjaranFormat(str?: string | null): boolean {
  if (!str) return false;
  return /^\d{4}\/\d{4}$/.test(str.trim());
}

/**
 * Mendapatkan Tahun Ajaran (misal 2026/2027) dari string tanggal (YYYY-MM-DD atau ISO)
 * Di Indonesia tahun ajaran baru dimulai bulan Juli (bulan ke-7)
 */
export function getTahunAjaranFromDate(dateInput?: string | Date): string {
  if (!dateInput) return '2026/2027';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '2026/2027';
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

/**
 * Menormalisasi string Tahun Ajaran menjadi format baku "YYYY/YYYY" (contoh: "2024/2025").
 * Menangani berbagai format masukan:
 * - "2024/2025" -> "2024/2025"
 * - "2024-2025" -> "2024/2025"
 * - "TA 2024/2025" -> "2024/2025"
 * - "2024" -> "2024/2025"
 * - "24/25" -> "2024/2025"
 * Jika raw kosong/tidak valid dan fallbackDate diberikan, akan dihitung dari fallbackDate.
 */
export function normalizeTahunAjaran(raw?: string | null, fallbackDate?: string | Date): string {
  if (raw) {
    const cleaned = String(raw).trim();
    // 1. Cek pattern 4 digit / 4 digit dengan berbagai pemisah (/ - _)
    const matchDoubleYear = cleaned.match(/(\d{4})\s*[\/\-_]\s*(\d{4})/);
    if (matchDoubleYear) {
      const y1 = parseInt(matchDoubleYear[1], 10);
      const y2 = parseInt(matchDoubleYear[2], 10);
      if (y1 >= 2000 && y2 >= 2000) {
        return `${y1}/${y2}`;
      }
    }

    // 2. Cek pattern 2 digit / 2 digit, misal "24/25" atau "24-25"
    const matchShortDouble = cleaned.match(/\b(\d{2})\s*[\/\-_]\s*(\d{2})\b/);
    if (matchShortDouble) {
      const y1 = 2000 + parseInt(matchShortDouble[1], 10);
      const y2 = 2000 + parseInt(matchShortDouble[2], 10);
      return `${y1}/${y2}`;
    }

    // 3. Cek single 4-digit year, misal "2024" -> asumsi "2024/2025"
    const matchSingleYear = cleaned.match(/\b(20\d{2})\b/);
    if (matchSingleYear) {
      const y = parseInt(matchSingleYear[1], 10);
      return `${y}/${y + 1}`;
    }
  }

  // 4. Jika ada fallbackDate valid
  if (fallbackDate) {
    return getTahunAjaranFromDate(fallbackDate);
  }

  return '';
}

/**
 * Mengambil Tahun Ajaran terstandarisasi (YYYY/YYYY) untuk sebuah invoice.
 * Mengevaluasi inv.tahunAjaran, dan jika tidak ada, fallback ke tanggalKirim / tanggalTerbit / jatuhTempo / createdAt.
 */
export function getInvoiceTahunAjaran(inv: {
  tahunAjaran?: string;
  tanggalKirim?: string;
  tanggalTerbit?: string;
  jatuhTempo?: string;
  createdAt?: string;
}): string {
  const normalized = normalizeTahunAjaran(inv.tahunAjaran);
  if (normalized) return normalized;
  const dateCandidate = inv.tanggalKirim || inv.tanggalTerbit || inv.jatuhTempo || inv.createdAt;
  if (dateCandidate) return getTahunAjaranFromDate(dateCandidate);
  return '2026/2027';
}

/**
 * Mengambil Tahun Ajaran terstandarisasi (YYYY/YYYY) untuk sebuah pembayaran.
 * Prioritas:
 * 1. Tahun Ajaran dari linked invoice (jika ada)
 * 2. pay.tahunAjaran (dinormalisasi)
 * 3. Tahun ajaran dari pay.tanggalBayar / pay.createdAt
 */
export function getPaymentTahunAjaran(
  pay: {
    tahunAjaran?: string;
    tanggalBayar?: string;
    createdAt?: string;
  },
  linkedInvoice?: {
    tahunAjaran?: string;
    tanggalKirim?: string;
    tanggalTerbit?: string;
  } | null
): string {
  if (linkedInvoice) {
    const invTA = getInvoiceTahunAjaran(linkedInvoice);
    if (invTA) return invTA;
  }
  const normalized = normalizeTahunAjaran(pay.tahunAjaran);
  if (normalized) return normalized;
  const dateCandidate = pay.tanggalBayar || pay.createdAt;
  if (dateCandidate) return getTahunAjaranFromDate(dateCandidate);
  return '2026/2027';
}

/**
 * Memeriksa apakah suatu ID atau nama entitas merupakan Akun Khusus Demo Simulasi (Terisolasi)
 */
export function isDemoSchool(sekolahIdOrName?: string | null): boolean {
  if (!sekolahIdOrName) return false;
  const s = sekolahIdOrName.toLowerCase();
  return s === 'mo-demo' || s === 'demo-mitra' || s.includes('demo');
}

export interface CicilanAllocationItem {
  invoice: Invoice;
  allocatedAmount: number;
  previousPaid: number;
  newPaid: number;
  previousRemaining: number;
  newRemaining: number;
  newStatus: InvoiceStatus;
}

export interface CicilanAllocationResult {
  updatedInvoices: CicilanAllocationItem[];
  totalAllocated: number;
  remainingInstallment: number;
  totalDebtBefore: number;
  totalDebtAfter: number;
}

/**
 * Mengambil tanggal efektif untuk pengurutan invoice tertua (FIFO).
 */
export function getInvoiceEffectiveSortDate(inv: {
  tanggalKirim?: string;
  tanggalTerbit?: string;
  tahunAjaran?: string;
  bulan?: string;
  nomorInvoice?: string;
}): string {
  if (inv.tanggalKirim) return inv.tanggalKirim;
  if (inv.tanggalTerbit) return inv.tanggalTerbit;

  const monthMap: Record<string, string> = {
    'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12',
    'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06'
  };
  const m = inv.bulan ? monthMap[inv.bulan] : '01';
  let year = '2026';
  if (inv.tahunAjaran) {
    const parts = inv.tahunAjaran.split('/');
    if (['07', '08', '09', '10', '11', '12'].includes(m || '')) {
      year = parts[0] || '2025';
    } else {
      year = parts[1] || parts[0] || '2026';
    }
  }
  return `${year}-${m || '01'}-01`;
}

/**
 * Memeriksa apakah sebuah record (Invoice / Pembayaran) milik sekolah tertentu
 * dengan pencocokan ID (case-insensitive & trimmed) serta fallback nama sekolah.
 */
export function isRecordBelongsToSchool(
  record: {
    mitraId?: string;
    kodeMitra?: string;
    sekolahId?: string;
    namaSekolah?: string;
  },
  schoolOrId:
    | { id: string; kodeMitra?: string; namaSekolah?: string }
    | string,
  allSchools?: { id: string; kodeMitra?: string; namaSekolah?: string }[]
): boolean {
  const targetObj =
    typeof schoolOrId === 'string'
      ? allSchools?.find(
          (s) =>
            s.id.trim().toLowerCase() === schoolOrId.trim().toLowerCase() ||
            (s.kodeMitra &&
              s.kodeMitra.trim().toLowerCase() === schoolOrId.trim().toLowerCase())
        ) || { id: schoolOrId, kodeMitra: schoolOrId, namaSekolah: '' }
      : schoolOrId;

  const targetIds = [targetObj.id, targetObj.kodeMitra]
    .filter(Boolean)
    .map((x) => String(x).trim().toLowerCase());

  const recId = String(
    record.mitraId || record.kodeMitra || record.sekolahId || ''
  )
    .trim()
    .toLowerCase();

  if (recId && targetIds.includes(recId)) {
    return true;
  }

  // Fallback jika ID pada record kosong atau tidak cocok ke sekolah manapun,
  // cocokan berdasarkan nama sekolah (mis. "Lazuardi Tursina Bandung" vs "Lazuardi Tursina")
  const recName = String(record.namaSekolah || '')
    .toLowerCase()
    .replace(/\blazuardi\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const targetName = String(targetObj.namaSekolah || '')
    .toLowerCase()
    .replace(/\blazuardi\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!recId || (allSchools && !allSchools.some((s) => s.id.trim().toLowerCase() === recId))) {
    if (recName && targetName) {
      if (recName === targetName || recName.includes(targetName) || targetName.includes(recName)) {
        return true;
      }
      // Pencocokan token kata unik sekolah (min 4 huruf, bukan kata kota umum kecuali bagian dari nama)
      const tokens = targetName.split(' ').filter((w) => w.length >= 4);
      if (tokens.some((t) => recName.split(' ').includes(t))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Single Source of Truth untuk menghitung Sisa Piutang Invoice (Rp).
 * Sekolah Afiliasi / Pelaporan Saja selalu bernilai 0.
 * Selain itu: max(0, Tagihan Full - Nominal Pembayaran).
 */
export function getInvoiceRemainingDebt(inv: Invoice): number {
  const isPelaporan = Boolean(
    inv.isPelaporanSaja ||
      isSchoolPelaporanSaja(inv.mitraId || inv.namaSekolah || '', {
        date: inv.tanggalKirim,
        tahunAjaran: inv.tahunAjaran,
      })
  );
  if (isPelaporan) return 0;

  const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
  const paid = Number(inv.nominalPembayaran) || 0;
  return Math.max(0, full - paid);
}

/**
 * Menghitung kelebihan bayar (surplus) pada satu invoice ketika Nominal Full < Nominal Pembayaran.
 * Sekolah Afiliasi / Pelaporan Saja selalu 0.
 */
export function getInvoiceOverpayment(inv: Invoice): number {
  const isPelaporan = Boolean(
    inv.isPelaporanSaja ||
      isSchoolPelaporanSaja(inv.mitraId || inv.namaSekolah || '', {
        date: inv.tanggalKirim,
        tahunAjaran: inv.tahunAjaran,
      })
  );
  if (isPelaporan) return 0;

  const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
  const paid = Number(inv.nominalPembayaran) || 0;
  return Math.max(0, paid - full);
}

/**
 * Single Source of Truth untuk Status Pembayaran Efektif sebuah Invoice
 * agar konsisten antara tabel utama, filter status, dan modal cicilan.
 * Jika pembayaran melebihi Tagihan Full (full < paid), jangan dikatakan Lunas -> 'Akumulasi'.
 */
export function getEffectiveInvoiceStatus(inv: Invoice): InvoiceStatus {
  const isPelaporan = Boolean(
    inv.isPelaporanSaja ||
      isSchoolPelaporanSaja(inv.mitraId || inv.namaSekolah || '', {
        date: inv.tanggalKirim,
        tahunAjaran: inv.tahunAjaran,
      })
  );
  if (isPelaporan) return 'Lunas';

  const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
  const paid = Number(inv.nominalPembayaran) || 0;
  const remaining = Math.max(0, full - paid);

  if (paid > full && paid > 0) return 'Akumulasi';
  if (full > 0 && remaining === 0) return 'Lunas';
  if (paid > 0 && remaining > 0) return 'Sebagian';
  if (inv.status === 'Jatuh Tempo' || inv.status === 'Menunggu Konfirmasi') {
    return inv.status;
  }
  return 'Belum Bayar';
}

/**
 * Urutan baku FIFO untuk daftar & alokasi cicilan multi-invoice:
 * 1. Piutang Lampau terlebih dahulu
 * 2. Periode / tanggal tertua
 * 3. Nomor urut invoice terkecil
 */
export function compareInvoicesForCicilanFIFO(a: Invoice, b: Invoice): number {
  const isLampauA =
    a.kategori === 'Piutang Lampau' ||
    String(a.kategori || '').toLowerCase().includes('lampau');
  const isLampauB =
    b.kategori === 'Piutang Lampau' ||
    String(b.kategori || '').toLowerCase().includes('lampau');
  if (isLampauA && !isLampauB) return -1;
  if (!isLampauA && isLampauB) return 1;

  const dateA = getInvoiceEffectiveSortDate(a);
  const dateB = getInvoiceEffectiveSortDate(b);
  if (dateA !== dateB) {
    return dateA.localeCompare(dateB);
  }

  return compareInvoiceBySequenceAsc(a, b);
}

/**
 * Mengalokasikan dana cicilan (misal Rp 5.000.000) secara otomatis ke seluruh invoice
 * yang masih memiliki sisa piutang > 0 milik sekolah tersebut berdasarkan urutan invoice terlama (FIFO).
 */
export function allocateCicilanToInvoices(
  schoolInvoices: Invoice[],
  installmentAmount: number,
  paymentDate?: string
): CicilanAllocationResult {
  // Ambil semua invoice yang masih memiliki sisa piutang > 0 (tidak bergantung pada label status yang mungkin usang)
  const payableInvoices = [...schoolInvoices]
    .filter(inv => getInvoiceRemainingDebt(inv) > 0)
    .sort(compareInvoicesForCicilanFIFO);

  let fundsToAllocate = Math.max(0, Number(installmentAmount) || 0);
  const updatedInvoices: CicilanAllocationItem[] = [];
  let totalDebtBefore = 0;
  let totalDebtAfter = 0;
  const payDate = paymentDate || new Date().toISOString().split('T')[0];

  payableInvoices.forEach(inv => {
    const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
    const previousPaid = Number(inv.nominalPembayaran) || 0;
    const remainingBefore = Math.max(0, full - previousPaid);
    totalDebtBefore += remainingBefore;

    if (fundsToAllocate <= 0) {
      totalDebtAfter += remainingBefore;
      return;
    }

    const allocation = Math.min(fundsToAllocate, remainingBefore);
    const newPaid = previousPaid + allocation;
    const newRemaining = Math.max(0, full - newPaid);
    fundsToAllocate -= allocation;
    totalDebtAfter += newRemaining;

    const newStatus: InvoiceStatus = newRemaining === 0 
      ? 'Lunas' 
      : (newPaid > 0 ? 'Sebagian' : 'Belum Bayar');

    const updatedInv: Invoice = {
      ...inv,
      nominalPembayaran: newPaid,
      status: newStatus,
      tanggalDibayar: payDate,
      updatedAt: new Date().toISOString(),
    };

    updatedInvoices.push({
      invoice: updatedInv,
      allocatedAmount: allocation,
      previousPaid,
      newPaid,
      previousRemaining: remainingBefore,
      newRemaining,
      newStatus,
    });
  });

  return {
    updatedInvoices,
    totalAllocated: (Math.max(0, Number(installmentAmount) || 0)) - fundsToAllocate,
    remainingInstallment: fundsToAllocate,
    totalDebtBefore,
    totalDebtAfter,
  };
}

export interface JadwalCicilanTermin {
  terminKe: number;
  totalTermin: number;
  jatuhTempo: string; // YYYY-MM-DD
  nominalCicilan: number;
  sisaHutangSetelahBayar: number;
  status: 'Lunas' | 'Jatuh Tempo' | 'Menunggu';
}

/**
 * Menghasilkan simulasi jadwal cicilan termin bulanan berdasarkan total hutang dan jumlah termin
 * Contoh: Total Rp 40.000.000, 10 termin -> Rp 4.000.000 per bulan
 */
export function generateJadwalCicilan(
  totalHutang: number,
  jumlahTermin: number,
  tanggalMulai: string = new Date().toISOString().split('T')[0],
  existingPaidCount: number = 0
): JadwalCicilanTermin[] {
  if (jumlahTermin <= 0 || totalHutang <= 0) return [];
  const baseCicilan = Math.floor(totalHutang / jumlahTermin);
  const remainder = totalHutang - (baseCicilan * jumlahTermin);

  const startDate = new Date(tanggalMulai);
  const result: JadwalCicilanTermin[] = [];
  let sisa = totalHutang;

  for (let i = 1; i <= jumlahTermin; i++) {
    const nominal = i === jumlahTermin ? baseCicilan + remainder : baseCicilan;
    sisa = Math.max(0, sisa - nominal);

    const d = new Date(startDate);
    d.setMonth(d.getMonth() + (i - 1));
    const jatuhTempo = d.toISOString().split('T')[0];

    const isPaid = i <= existingPaidCount;

    result.push({
      terminKe: i,
      totalTermin: jumlahTermin,
      jatuhTempo,
      nominalCicilan: nominal,
      sisaHutangSetelahBayar: sisa,
      status: isPaid ? 'Lunas' : 'Menunggu',
    });
  }

  return result;
}

export interface AccumulationTargetRef {
  invoiceId: string;
  nomorInvoice: string;
  kategori?: string;
  amount: number;
}

export interface InvoiceAccumulationInfo {
  invoiceId: string;
  isPelaporan: boolean;
  tagihanFull: number;
  storedPaid: number;
  rawSurplus: number; // storedPaid > tagihanFull
  accumulatedOut: number; // bagian rawSurplus yang terserap ke tagihan lain yg kurang/sebagian
  accumulatedOutTargets: AccumulationTargetRef[];
  unallocatedSurplus: number; // sisa lebih bayar setelah semua tagihan lain tertutup
  accumulatedIn: number; // tambahan pelunasan dari kelebihan bayar tagihan lain sekolah yg sama
  accumulatedInSources: AccumulationTargetRef[];
  effectivePaid: number; // Untuk donor: tagihanFull + unallocatedSurplus; untuk penerima: storedPaid + accumulatedIn
  effectiveNominalLunas: number; // min(tagihanFull, storedPaid + accumulatedIn)
  effectiveRemainingDebt: number; // max(0, tagihanFull - (storedPaid + accumulatedIn))
  effectiveStatus: InvoiceStatus;
}

/**
 * Mengembalikan key sekolah kanonik agar variasi mitraId / namaSekolah selalu terakumulasi ke sekolah yg sama.
 */
export function resolveCanonicalSchoolKey(
  record: { mitraId?: string | null; sekolahId?: string | null; kodeMitra?: string | null; namaSekolah?: string | null },
  sekolahList?: Array<Pick<SekolahMitra, 'id' | 'kodeMitra' | 'namaSekolah'>>
): string {
  if (sekolahList && sekolahList.length > 0) {
    const matched = sekolahList.find(s => isRecordBelongsToSchool(record, s, sekolahList));
    if (matched) return String(matched.id).trim().toUpperCase();
  }
  const raw = String(record.mitraId || record.kodeMitra || record.sekolahId || record.namaSekolah || 'UNKNOWN')
    .trim()
    .toUpperCase();
  return raw || 'UNKNOWN';
}

/**
 * Mesin Akumulasi Lintas-Tagihan per Sekolah:
 * Jika ada invoice dengan Tagihan Full < Pembayaran (rawSurplus > 0), kelebihannya TIDAK hilang/dianggap Lunas biasa,
 * melainkan otomatis diakumulasikan secara FIFO ke tagihan lain milik sekolah yang sama yang masih kurang bayar / sebagian.
 */
export function computeInvoiceAccumulationMap(
  invoices: Invoice[],
  sekolahList?: Array<Pick<SekolahMitra, 'id' | 'kodeMitra' | 'namaSekolah'>>
): Map<string, InvoiceAccumulationInfo> {
  const result = new Map<string, InvoiceAccumulationInfo>();
  const schoolGroups = new Map<string, Invoice[]>();

  invoices.forEach(inv => {
    const isPelaporan = Boolean(
      inv.isPelaporanSaja ||
        isSchoolPelaporanSaja(inv.mitraId || inv.namaSekolah || '', {
          date: inv.tanggalKirim,
          tahunAjaran: inv.tahunAjaran,
        })
    );
    const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
    const paid = isPelaporan ? 0 : (Number(inv.nominalPembayaran) || 0);
    const rawSurplus = isPelaporan ? 0 : Math.max(0, paid - full);
    const rawDeficit = isPelaporan ? 0 : Math.max(0, full - paid);

    result.set(inv.id, {
      invoiceId: inv.id,
      isPelaporan,
      tagihanFull: full,
      storedPaid: paid,
      rawSurplus,
      accumulatedOut: 0,
      accumulatedOutTargets: [],
      unallocatedSurplus: rawSurplus,
      accumulatedIn: 0,
      accumulatedInSources: [],
      effectivePaid: paid,
      effectiveNominalLunas: isPelaporan ? full : Math.min(full, paid),
      effectiveRemainingDebt: rawDeficit,
      effectiveStatus: getEffectiveInvoiceStatus(inv),
    });

    if (!isPelaporan) {
      const key = resolveCanonicalSchoolKey(inv, sekolahList);
      const list = schoolGroups.get(key) || [];
      list.push(inv);
      schoolGroups.set(key, list);
    }
  });

  // Distribusikan surplus ke tagihan yg kurang bayar/sebagian dalam sekolah yg sama (urutan FIFO)
  schoolGroups.forEach(group => {
    const donors = group
      .filter(inv => (result.get(inv.id)?.rawSurplus || 0) > 0)
      .sort(compareInvoicesForCicilanFIFO);
    const recipients = group
      .filter(inv => (result.get(inv.id)?.effectiveRemainingDebt || 0) > 0)
      .sort(compareInvoicesForCicilanFIFO);

    if (donors.length === 0) return;

    donors.forEach(donor => {
      const donorInfo = result.get(donor.id)!;
      let available = donorInfo.unallocatedSurplus;

      recipients.forEach(recipient => {
        if (available <= 0) return;
        const recInfo = result.get(recipient.id)!;
        if (recInfo.effectiveRemainingDebt <= 0) return;

        const transfer = Math.min(available, recInfo.effectiveRemainingDebt);
        available -= transfer;

        donorInfo.accumulatedOut += transfer;
        donorInfo.unallocatedSurplus -= transfer;
        donorInfo.accumulatedOutTargets.push({
          invoiceId: recipient.id,
          nomorInvoice: recipient.nomorInvoice || recipient.id,
          kategori: recipient.kategori,
          amount: transfer,
        });

        recInfo.accumulatedIn += transfer;
        recInfo.accumulatedInSources.push({
          invoiceId: donor.id,
          nomorInvoice: donor.nomorInvoice || donor.id,
          kategori: donor.kategori,
          amount: transfer,
        });
        recInfo.effectivePaid = recInfo.storedPaid + recInfo.accumulatedIn;
        recInfo.effectiveNominalLunas = Math.min(recInfo.tagihanFull, recInfo.effectivePaid);
        recInfo.effectiveRemainingDebt = Math.max(0, recInfo.tagihanFull - recInfo.effectivePaid);

        if (recInfo.tagihanFull > 0 && recInfo.effectiveRemainingDebt === 0) {
          recInfo.effectiveStatus = 'Lunas';
        } else if (recInfo.effectivePaid > 0 && recInfo.effectiveRemainingDebt > 0) {
          recInfo.effectiveStatus = 'Sebagian';
        }
      });

      donorInfo.effectivePaid = donorInfo.tagihanFull + donorInfo.unallocatedSurplus;
      donorInfo.effectiveNominalLunas = donorInfo.tagihanFull;
      donorInfo.effectiveRemainingDebt = 0;
      // Jangan dikatakan Lunas jika nominal full lebih kecil dari pembayaran -> Akumulasi
      donorInfo.effectiveStatus = 'Akumulasi';
    });
  });

  return result;
}

export function getAccumulationEntry(
  accMap: Map<string, InvoiceAccumulationInfo> | undefined,
  inv: Invoice
): InvoiceAccumulationInfo {
  const existing = accMap?.get(inv.id);
  if (existing) return existing;

  const isPelaporan = Boolean(
    inv.isPelaporanSaja ||
      isSchoolPelaporanSaja(inv.mitraId || inv.namaSekolah || '', {
        date: inv.tanggalKirim,
        tahunAjaran: inv.tahunAjaran,
      })
  );
  const full = Number(inv.tagihanFull) || Number(inv.nominal) || 0;
  const paid = isPelaporan ? 0 : (Number(inv.nominalPembayaran) || 0);
  const rawSurplus = isPelaporan ? 0 : Math.max(0, paid - full);
  const remaining = isPelaporan ? 0 : Math.max(0, full - paid);

  return {
    invoiceId: inv.id,
    isPelaporan,
    tagihanFull: full,
    storedPaid: paid,
    rawSurplus,
    accumulatedOut: 0,
    accumulatedOutTargets: [],
    unallocatedSurplus: rawSurplus,
    accumulatedIn: 0,
    accumulatedInSources: [],
    effectivePaid: paid,
    effectiveNominalLunas: isPelaporan ? full : Math.min(full, paid),
    effectiveRemainingDebt: remaining,
    effectiveStatus: getEffectiveInvoiceStatus(inv),
  };
}

export interface OverpaymentDistributionPlan {
  excess: number;
  allocation: CicilanAllocationResult;
  adjustedTargetPaid: number;
  adjustedTargetStatus: InvoiceStatus;
}

/**
 * Merencanakan pemecahan kelebihan bayar (Nominal Full < Nominal Pembayaran)
 * untuk langsung diakumulasikan ke tagihan lain milik sekolah yang masih kurang bayar / bayar sebagian.
 */
export function buildOverpaymentDistributionPlan(
  targetInvoice: {
    id?: string;
    nomorInvoice?: string;
    mitraId: string;
    namaSekolah?: string;
    tagihanFull: number;
    nominalPembayaran: number;
    tanggalDibayar?: string;
  },
  allInvoices: Invoice[],
  sekolahList?: Array<Pick<SekolahMitra, 'id' | 'kodeMitra' | 'namaSekolah'>>
): OverpaymentDistributionPlan {
  const full = Math.max(0, Number(targetInvoice.tagihanFull) || 0);
  const paid = Math.max(0, Number(targetInvoice.nominalPembayaran) || 0);
  const excess = Math.max(0, paid - full);

  const targetSchool = sekolahList?.find(s => isRecordBelongsToSchool(targetInvoice, s, sekolahList)) || targetInvoice.mitraId;
  const otherUnderpaid = allInvoices.filter(inv => {
    if (targetInvoice.id && inv.id === targetInvoice.id) return false;
    if (targetInvoice.nomorInvoice && inv.nomorInvoice === targetInvoice.nomorInvoice) return false;
    if (!isRecordBelongsToSchool(inv, targetSchool, sekolahList)) return false;
    return getInvoiceRemainingDebt(inv) > 0;
  });

  const allocation = allocateCicilanToInvoices(
    otherUnderpaid,
    excess,
    targetInvoice.tanggalDibayar
  );

  // Jika masih ada sisa kelebihan setelah menutup seluruh tagihan kurang bayar, tetap simpan sebagai Akumulasi
  const adjustedTargetPaid = full + allocation.remainingInstallment;
  const adjustedTargetStatus: InvoiceStatus =
    allocation.remainingInstallment > 0 ? 'Akumulasi' : 'Lunas';

  return {
    excess,
    allocation,
    adjustedTargetPaid,
    adjustedTargetStatus,
  };
}

export interface BulkAccumulationReconciliationPlan {
  donorCount: number;
  recipientCount: number;
  totalTransferred: number;
  affectedCount: number;
  updates: Invoice[];
}

/**
 * Menghasilkan daftar pembaruan Invoice untuk menyimpan permanen hasil akumulasi
 * dari invoice yang kelebihan bayar (Nominal Full < Bayar) ke invoice kurang bayar / sebagian di Firestore.
 */
export function planBulkAccumulationReconciliation(
  invoices: Invoice[],
  sekolahList?: Array<Pick<SekolahMitra, 'id' | 'kodeMitra' | 'namaSekolah'>>
): BulkAccumulationReconciliationPlan {
  const accMap = computeInvoiceAccumulationMap(invoices, sekolahList);
  const updates: Invoice[] = [];
  let donorCount = 0;
  let recipientCount = 0;
  let totalTransferred = 0;
  const nowIso = new Date().toISOString();

  invoices.forEach(inv => {
    const info = accMap.get(inv.id);
    if (!info) return;

    if (info.accumulatedOut > 0) {
      donorCount += 1;
      totalTransferred += info.accumulatedOut;
      const newPaid = info.tagihanFull + info.unallocatedSurplus;
      const targetLabels = info.accumulatedOutTargets
        .map(t => `${t.nomorInvoice} (${formatRupiah(t.amount)})`)
        .join(', ');
      const appendNote = `Akumulasi ${formatRupiah(info.accumulatedOut)} dialihkan ke: ${targetLabels}`;
      const prevKet = String(inv.keterangan || '').trim();
      const newStatus: InvoiceStatus = info.unallocatedSurplus > 0 ? 'Akumulasi' : 'Lunas';

      updates.push({
        ...inv,
        nominalPembayaran: newPaid,
        status: newStatus,
        keterangan: prevKet.includes(appendNote)
          ? prevKet
          : (prevKet ? `${prevKet} | ${appendNote}` : appendNote),
        updatedAt: nowIso,
      });
    } else if (info.accumulatedIn > 0) {
      recipientCount += 1;
      const newPaid = info.storedPaid + info.accumulatedIn;
      const newRemaining = Math.max(0, info.tagihanFull - newPaid);
      const sourceLabels = info.accumulatedInSources
        .map(s => `${s.nomorInvoice} (+${formatRupiah(s.amount)})`)
        .join(', ');
      const appendNote = `Terima akumulasi dari: ${sourceLabels}`;
      const prevKet = String(inv.keterangan || '').trim();
      const newStatus: InvoiceStatus =
        newRemaining === 0 && info.tagihanFull > 0
          ? 'Lunas'
          : newPaid > 0
          ? 'Sebagian'
          : 'Belum Bayar';

      updates.push({
        ...inv,
        nominalPembayaran: newPaid,
        status: newStatus,
        tanggalDibayar: inv.tanggalDibayar || nowIso.split('T')[0],
        keterangan: prevKet.includes(appendNote)
          ? prevKet
          : (prevKet ? `${prevKet} | ${appendNote}` : appendNote),
        updatedAt: nowIso,
      });
    }
  });

  return {
    donorCount,
    recipientCount,
    totalTransferred,
    affectedCount: updates.length,
    updates,
  };
}



