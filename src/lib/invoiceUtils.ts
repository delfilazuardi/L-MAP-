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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}
