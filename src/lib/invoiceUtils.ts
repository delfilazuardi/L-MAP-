import { Invoice, InvoiceStatus } from '../types';

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
 * Mengalokasikan dana cicilan (misal Rp 10.000.000 atau Rp 8.000.000) secara otomatis ke invoice-invoice
 * yang belum lunas milik sekolah tersebut berdasarkan urutan invoice terlama (FIFO).
 */
export function allocateCicilanToInvoices(
  schoolInvoices: Invoice[],
  installmentAmount: number,
  paymentDate?: string
): CicilanAllocationResult {
  // Ambil hanya invoice yang belum lunas dan masih memiliki sisa piutang > 0
  const payableInvoices = [...schoolInvoices]
    .filter(inv => {
      if (inv.status === 'Lunas') return false;
      const full = inv.tagihanFull || inv.nominal || 0;
      const paid = inv.nominalPembayaran || 0;
      return (full - paid) > 0;
    })
    .sort((a, b) => {
      // Prioritaskan Piutang Lampau terlebih dahulu jika ada
      const isLampauA = a.kategori === 'Piutang Lampau' || (a.kategori as string)?.toLowerCase().includes('lampau');
      const isLampauB = b.kategori === 'Piutang Lampau' || (b.kategori as string)?.toLowerCase().includes('lampau');
      if (isLampauA && !isLampauB) return -1;
      if (!isLampauA && isLampauB) return 1;

      // Urutkan berdasarkan tanggal periode tertua (FIFO)
      const dateA = getInvoiceEffectiveSortDate(a);
      const dateB = getInvoiceEffectiveSortDate(b);
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      return compareInvoiceBySequenceAsc(a, b);
    });

  let fundsToAllocate = installmentAmount;
  const updatedInvoices: CicilanAllocationItem[] = [];
  let totalDebtBefore = 0;
  let totalDebtAfter = 0;
  const payDate = paymentDate || new Date().toISOString().split('T')[0];

  payableInvoices.forEach(inv => {
    const full = inv.tagihanFull || inv.nominal || 0;
    const previousPaid = inv.nominalPembayaran || 0;
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
    totalAllocated: installmentAmount - fundsToAllocate,
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


