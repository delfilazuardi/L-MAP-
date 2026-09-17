/**
 * Google Sheets Synchronization & CSV Parser for L-MAP
 */
import { UserAccount, UserRole, UserAccess, SekolahMitra, Invoice, Pembayaran, InvoiceKategori, InvoiceStatus, InvoiceOperationalStatus, PembayaranStatus } from '../types';
import { HISTORICAL_TRANSACTIONS_SINCE_2022, convertHistoricalToCSV } from './historicalSheetData';

export interface SheetSyncResult {
  success: boolean;
  message: string;
  syncedRows?: number;
  users?: UserAccount[];
  mitra?: SekolahMitra[];
  invoices?: Invoice[];
  pembayaran?: Pembayaran[];
}

/**
 * Parses CSV text to array of objects
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV split respecting quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    results.push(row);
  }

  return results;
}

/**
 * Convert array of objects to CSV string
 */
export function exportToCSV<T extends Record<string, any>>(data: T[], columns?: (keyof T)[]): string {
  if (data.length === 0) return '';
  const keys = columns || (Object.keys(data[0]) as (keyof T)[]);
  const headerLine = keys.map(k => `"${String(k)}"`).join(',');
  
  const rowLines = data.map(item => {
    return keys.map(k => {
      const val = item[k];
      const strVal = val === null || val === undefined ? '' : String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',');
  });

  return [headerLine, ...rowLines].join('\n');
}

/**
 * Fetch and sync data directly from a public Google Sheets CSV URL
 */
export async function fetchGoogleSheetCSV(sheetUrlOrId: string): Promise<string> {
  let url = sheetUrlOrId.trim();

  // If a full Google Sheets URL is provided, convert to export CSV url
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    const sheetId = idMatch[1];
    // Check if gid is present
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Gagal mengambil Google Sheet: Status ${response.status} ${response.statusText}`);
    }
    const csvData = await response.text();
    return csvData;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Koneksi ke Google Sheet gagal. Pastikan link dapat diakses publik atau format CSV valid.');
  }
}

/**
 * Parse prompt user table format:
 * ID User,Nama,Email, Password ,Role,Akses,Status
 */
export function parseUserSheetData(csvText: string): UserAccount[] {
  const rows = parseCSV(csvText);
  return rows.map(r => {
    const userId = r['ID User'] || r['id'] || r['userId'] || '';
    const nama = r['Nama'] || r['nama'] || '';
    const email = r['Email'] || r['email'] || `${userId.toLowerCase()}@lazuardi.sch.id`;
    const password = r['Password'] || r['Password '] || r['password'] || 'admin123';
    const roleRaw = r['Role'] || r['role'] || 'Sekolah Mitra';
    const aksesRaw = r['Akses'] || r['akses'] || (roleRaw.includes('Mitra Office') ? 'Full Akses' : 'Akses Terbatas');
    const statusRaw = r['Status'] || r['status'] || 'Aktif';

    const role: UserRole = (
      roleRaw.includes('Kepala') ? 'Kepala Bagian Mitra Office' :
      roleRaw.includes('Officer') ? 'Officer' :
      roleRaw.includes('Afiliasi') ? 'Sekolah Afiliasi' :
      'Sekolah Mitra'
    );

    const akses: UserAccess = aksesRaw.includes('Full') ? 'Full Akses' : 'Akses Terbatas';
    const status: 'Aktif' | 'Nonaktif' = statusRaw.includes('Non') ? 'Nonaktif' : 'Aktif';

    return {
      userId: userId.trim(),
      nama: nama.trim(),
      email: email.trim(),
      password: password.trim(),
      role,
      akses,
      status,
      sekolahId: role === 'Sekolah Mitra' || role === 'Sekolah Afiliasi' ? userId.trim() : undefined,
    };

  }).filter(u => u.userId.length > 0);
}

/**
 * Export full application snapshot to formatted CSV
 */
export function exportAllToCsv(data: {
  sekolahList: SekolahMitra[];
  laporanList: any[];
  invoiceList: Invoice[];
  pembayaranList: Pembayaran[];
}): string {
  const sections: string[] = [];

  // Section 1: Sekolah Mitra
  sections.push('# DATA SEKOLAH MITRA LAZUARDI');
  sections.push(exportToCSV(data.sekolahList));
  sections.push('');

  // Section 2: Invoice & Tagihan
  sections.push('# INVOICE & TAGIHAN RESMI');
  sections.push(exportToCSV(data.invoiceList));
  sections.push('');

  // Section 3: Pembayaran
  sections.push('# RIWAYAT PEMBAYARAN MITRA');
  sections.push(exportToCSV(data.pembayaranList));
  sections.push('');

  // Section 4: Laporan Bulanan
  sections.push('# LAPORAN BULANAN MITRA');
  sections.push(exportToCSV(data.laporanList));

  return sections.join('\n');
}

/**
 * Pembersih angka dari format mata uang / string CSV
 */
export function parseCurrencyString(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/Rp\.?/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Menghasilkan template CSV untuk pengisian sheet invoice & pembayaran sejak 2022
 */
export function getInvoicePaymentSheetTemplateCSV(): string {
  return convertHistoricalToCSV();
}

/**
 * Parsing data sheet atau CSV invoice & pembayaran yang diinput user
 * Menghasilkan daftar invoice dan pembayaran yang saling tertaut
 */
export function parseInvoicePaymentSheetData(csvOrTsvText: string): {
  invoices: Invoice[];
  pembayaran: Pembayaran[];
  totalParsed: number;
  errors: string[];
} {
  // Support tab-delimited or comma-delimited
  let normalizedText = csvOrTsvText.trim();
  if (normalizedText.includes('\t') && !normalizedText.includes(',')) {
    normalizedText = normalizedText.split('\n').map(line => {
      const parts = line.split('\t').map(p => `"${p.replace(/"/g, '""')}"`);
      return parts.join(',');
    }).join('\n');
  }

  const rawRows = parseCSV(normalizedText);
  const invoices: Invoice[] = [];
  const pembayaran: Pembayaran[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    // Normalisasi kunci header
    const findValue = (keys: string[]): string => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(
          rk => rk.trim().toLowerCase().replace(/[_\s-]+/g, '') === k.toLowerCase().replace(/[_\s-]+/g, '')
        );
        if (foundKey && row[foundKey] !== undefined) {
          return String(row[foundKey]).trim();
        }
      }
      return '';
    };

    const nomorInvoice = findValue(['nomor_invoice', 'nomor invoice', 'no invoice', 'no_invoice', 'id', 'invoice']);
    const namaSekolah = findValue(['nama_sekolah', 'nama sekolah', 'sekolah', 'mitra', 'nama']);
    const kodeMitra = findValue(['kode_mitra', 'kode mitra', 'mitra_id', 'id mitra', 'mitra id', 'id_user', 'id sekolah']) || 'MO004';
    const bulan = findValue(['bulan', 'periode bulan', 'month']) || 'Juli';
    const tahunStr = findValue(['tahun', 'year']) || '2026';
    const tahunAjaran = findValue(['tahun_ajaran', 'tahun ajaran', 'ta', 'periode']) || '2026/2027';
    const kategoriRaw = findValue(['kategori', 'kategori tagihan', 'jenis tagihan', 'type']) || 'Renewal Fee';
    const tanggalKirim = findValue(['tanggal_kirim', 'tanggal kirim', 'tgl kirim', 'tanggal terbit', 'tgl terbit']) || '2026-07-01';
    const tanggalDibayar = findValue(['tanggal_dibayar', 'tanggal dibayar', 'tgl bayar', 'tanggal bayar', 'tgl dibayar']);
    
    const tagihanFullRaw = findValue(['tagihan_full', 'tagihan full', 'tagihan bruto', 'nominal full', 'full']);
    const tagihanRealisasiRaw = findValue(['tagihan_realisasi', 'tagihan realisasi', 'tagihan netto', 'nominal realisasi', 'realisasi', 'nominal']);
    const nominalPembayaranRaw = findValue(['nominal_pembayaran', 'nominal pembayaran', 'sudah dibayar', 'dibayar', 'jumlah bayar', 'terbayar']);
    
    const statusInvoiceRaw = findValue(['status_invoice', 'status invoice', 'status kirim', 'operational status']) || 'Terkirim';
    const statusBayarRaw = findValue(['status_bayar', 'status bayar', 'status pembayaran', 'status']) || 'Belum Bayar';
    const metodeBayar = findValue(['metode_bayar', 'metode bayar', 'metode', 'rekening', 'bank']) || 'Bank Mandiri Transfer';
    const noReferensi = findValue(['no_referensi', 'no referensi', 'no ref', 'ref', 'nomor referensi']);
    const keterangan = findValue(['keterangan', 'deskripsi', 'rincian', 'catatan']) || `Tagihan ${kategoriRaw} ${namaSekolah}`;

    if (!nomorInvoice && !namaSekolah) {
      // Lewati baris kosong
      return;
    }

    const cleanedNomorInvoice = nomorInvoice || `INV/${bulan.toUpperCase().slice(0, 3)}/${tahunStr}/${String(index + 1).padStart(3, '0')}/MO`;
    const tagihanFull = parseCurrencyString(tagihanFullRaw) || parseCurrencyString(tagihanRealisasiRaw) || 35000000;
    const tagihanRealisasi = parseCurrencyString(tagihanRealisasiRaw) || tagihanFull;
    const nominalPembayaran = parseCurrencyString(nominalPembayaranRaw) || (statusBayarRaw.toLowerCase().includes('lunas') ? tagihanRealisasi : 0);

    // Kategori mapping
    let kategori: InvoiceKategori = 'Renewal Fee';
    if (kategoriRaw.toLowerCase().includes('franchise')) kategori = 'Franchise Fee';
    else if (kategoriRaw.toLowerCase().includes('piutang') || kategoriRaw.toLowerCase().includes('seragam') || kategoriRaw.toLowerCase().includes('buku')) kategori = 'Piutang Mitra';
    else if (kategoriRaw.toLowerCase().includes('jenjang') || kategoriRaw.toLowerCase().includes('baru')) kategori = 'Jenjang Baru';

    // Status Invoice
    let statusInvoice: InvoiceOperationalStatus = 'Terkirim';
    if (statusInvoiceRaw.toLowerCase().includes('draft')) statusInvoice = 'Draft';
    else if (statusInvoiceRaw.toLowerCase().includes('revisi')) statusInvoice = 'Revisi';
    else if (statusInvoiceRaw.toLowerCase().includes('batal')) statusInvoice = 'Dibatalkan';

    // Status Pembayaran
    let status: InvoiceStatus = 'Belum Bayar';
    if (nominalPembayaran >= tagihanRealisasi && tagihanRealisasi > 0) {
      status = 'Lunas';
    } else if (nominalPembayaran > 0 && nominalPembayaran < tagihanRealisasi) {
      status = 'Sebagian';
    } else if (statusBayarRaw.toLowerCase().includes('konfirmasi') || statusBayarRaw.toLowerCase().includes('tunggu')) {
      status = 'Menunggu Konfirmasi';
    } else if (statusBayarRaw.toLowerCase().includes('tempo')) {
      status = 'Jatuh Tempo';
    }

    const invoiceItem: Invoice = {
      id: cleanedNomorInvoice,
      nomorInvoice: cleanedNomorInvoice,
      mitraId: kodeMitra,
      namaSekolah: namaSekolah || 'Sekolah Mitra',
      bulan,
      tahunAjaran,
      kategori,
      nominal: tagihanRealisasi,
      tagihanFull,
      tagihanRealisasi,
      nominalPembayaran,
      tanggalKirim,
      tanggalDibayar: tanggalDibayar || (nominalPembayaran > 0 ? tanggalKirim : undefined),
      tanggalTerbit: tanggalKirim,
      jatuhTempo: `${tahunStr}-10-15`,
      statusInvoice,
      status,
      keterangan,
    };

    invoices.push(invoiceItem);

    // Buat entri pembayaran jika ada nominal yang dibayar (> 0)
    if (nominalPembayaran > 0) {
      const payStatus: PembayaranStatus = status === 'Menunggu Konfirmasi' ? 'Menunggu Verifikasi' : 'Terverifikasi';
      const payItem: Pembayaran = {
        id: `PAY-${cleanedNomorInvoice.replace(/[^a-zA-Z0-9]/g, '')}`,
        invoiceId: cleanedNomorInvoice,
        mitraId: kodeMitra,
        namaSekolah: namaSekolah || 'Sekolah Mitra',
        kategori: kategori === 'Piutang Mitra' ? 'Piutang' : kategori,
        jumlah: nominalPembayaran,
        tanggalBayar: tanggalDibayar || tanggalKirim,
        metodeBayar,
        noReferensi: noReferensi || `REF-${tahunStr}-${String(index + 100).padStart(4, '0')}`,
        buktiUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
        status: payStatus,
        catatan: `Pembayaran ${kategori} ${tahunAjaran} terinput dari sheet sinkronisasi`,
      };
      pembayaran.push(payItem);
    }
  });

  return {
    invoices,
    pembayaran,
    totalParsed: invoices.length,
    errors,
  };
}


