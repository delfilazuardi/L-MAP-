export type UserRole = 
  | 'Administrator'
  | 'Kepala Bagian Mitra Office' 
  | 'Officer' 
  | 'Sekolah Mitra' 
  | 'Sekolah Afiliasi'
  | 'Guru Mitra';

export type UserAccess = 'Full Akses' | 'Akses Terbatas';

export interface UserAccount {
  userId: string;
  nama: string;
  email: string;
  password?: string;
  role: UserRole;
  akses: UserAccess;
  status: 'Aktif' | 'Nonaktif';
  sekolahId?: string; // Tautan ke ID mitra jika role Sekolah Mitra / Afiliasi / Guru Mitra
  namaSekolah?: string; // Nama Sekolah Mitra asal
  mapel?: string; // Mata pelajaran / Bidang keahlian (khusus Guru Mitra)
  nip?: string; // Nomor Induk Pegawai / Guru
  photoUrl?: string; // Foto profil akun Google
  googleUid?: string; // UID akun Google
  lastLoginAt?: string; // Waktu login terakhir
  loginCount?: number; // Jumlah frekuensi login
  isDemo?: boolean; // Khusus akun demo terisolasi
}

export interface SekolahMitra {
  id: string;
  kodeMitra?: string; // e.g. MO004
  namaSekolah: string;
  alamat: string;
  kota?: string;
  pimpinan: string;
  kontak?: string;
  email?: string;
  kontakEmail?: string;
  kontakTelepon?: string;
  jenjang: string; // e.g. "TK, SD", "SMP", "SMA"
  jumlahSiswa: number;
  statusKerjasama: 'Aktif' | 'Masa Percobaan' | 'Perpanjangan' | 'Masa Perpanjangan' | 'Nonaktif' | 'Afiliasi';
  kategoriSekolah?: 'Mitra Reguler' | 'Sekolah Afiliasi' | 'Khusus Pelaporan';
  tahunBergabung: number;
  keteranganKhusus?: string;
  isDemo?: boolean; // Khusus sekolah mitra demo simulasi (terisolasi)
}


export type LaporanKategori = 'Akademik' | 'Kesiswaan' | 'Keuangan' | 'SDM & Operasional' | 'Komprehensif';
export type LaporanStatus = 'Diajukan' | 'Direview' | 'Diterima' | 'Perlu Revisi';

export interface SheetPerhitunganRow {
  id: string;
  kode?: string;
  deskripsi: string;
  kategori: 'Pemasukan' | 'Pengeluaran' | 'Operasional' | 'Akademik' | 'Kesiswaan' | string;
  volume: number;
  satuan: string;
  tarifSatuan: number;
  totalHitungan: number; // Hasil rumus: volume * tarifSatuan
  totalTercatat: number; // Nilai tercatat dari dokumen/sheet upload
  selisih: number; // totalHitungan - totalTercatat
  statusAudit: 'Sesuai' | 'Selisih Perhitungan' | 'Diperbaiki Otomatis';
  catatanKoreksi?: string;
}

export interface SheetPerhitunganData {
  namaSheet: string;
  namaFile?: string;
  tanggalUpload?: string;
  rows: SheetPerhitunganRow[];
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoBersih: number;
  totalSelisihDitemukan: number;
  statusPerbaikan: 'Belum Diperiksa' | 'Ada Selisih' | 'Otomatis Diperbaiki' | 'Sesuai / Valid';
  catatanAudit?: string[];
}

export interface LaporanBulanan {
  id: string;
  mitraId: string;
  namaSekolah: string;
  bulan: string; // e.g. "September"
  tahun: number; // e.g. 2026
  tahunAjaran?: string; // e.g. "2026/2027"
  tanggalKirim?: string; // e.g. "2026-09-16"
  kategori?: LaporanKategori;
  ringkasan?: string;
  kendala?: string;
  solusi?: string;
  linkDokumen?: string;
  status: LaporanStatus;
  catatanAdmin?: string;
  tanggalDiajukan: string;
  updatedAt?: string;
  sheetPerhitungan?: SheetPerhitunganData;
  isDemo?: boolean;
}

export type InvoiceKategori = 'Franchise Fee' | 'Piutang Lampau' | 'Piutang Mitra' | 'Renewal Fee' | 'Jenjang Baru' | 'Lainnya';
export type InvoiceStatus = 'Belum Bayar' | 'Menunggu Konfirmasi' | 'Lunas' | 'Jatuh Tempo' | 'Sebagian';
export type InvoiceOperationalStatus = 'Terkirim' | 'Draft' | 'Menunggu Persetujuan' | 'Revisi' | 'Dibatalkan';

export interface Invoice {
  id: string; // Nomor Invoice resmi, format: INV/romawi/tahun/nomor/MO (e.g. INV/IX/2026/001/MO)
  nomorInvoice?: string;
  mitraId: string;
  namaSekolah: string;
  bulan: string; // e.g. "September"
  tahunAjaran: string; // e.g. "2026/2027"
  kategori?: InvoiceKategori;
  nominal: number; // Backward compatibility (nilai tagihan realisasi)
  tagihanFull: number; // Tagihan Full (kotor/penuh)
  tagihanRealisasi: number; // Tagihan Realisasi
  nominalPembayaran: number; // Nominal Pembayaran yang telah dibayarkan
  tanggalTerbit?: string;
  tanggalKirim: string; // Tanggal Kirim invoice
  tanggalDibayar?: string; // Tanggal Pembayaran diterima/lunas
  jatuhTempo: string;
  statusInvoice?: InvoiceOperationalStatus; // Status penerbitan invoice
  status: InvoiceStatus; // Status pembayaran invoice (Lunas, Belum Bayar, dll)
  isPelaporanSaja?: boolean; // Khusus sekolah tanpa kewajiban pembayaran (hanya pelaporan)
  keterangan?: string;
  createdAt?: string; // Timestamp ISO pembuatan/input invoice
  updatedAt?: string; // Timestamp ISO update invoice
  isDemo?: boolean;
}

export type PembayaranKategori = 'Franchise Fee' | 'Piutang Lampau' | 'Renewal Fee' | 'Piutang' | 'Piutang Mitra' | 'Jenjang Baru' | 'Lainnya';
export type PembayaranStatus = 'Menunggu Verifikasi' | 'Terverifikasi' | 'Ditolak';

export interface Pembayaran {
  id: string;
  invoiceId?: string;
  mitraId: string;
  namaSekolah: string;
  kategori: PembayaranKategori;
  tahunAjaran?: string; // e.g. "2026/2027", "2025/2026", "2022/2023"
  jumlah: number;
  tanggalBayar: string;
  metodeBayar: string;
  noReferensi: string;
  buktiUrl: string;
  status: PembayaranStatus;
  catatan?: string;
  isDemo?: boolean;
}

export type EventKategori = string;
export type EventStatus = 'Direncanakan' | 'Berjalan' | 'Selesai' | 'Ditunda';

export interface EventItem {
  id: string;
  judul: string;
  kategori: EventKategori;
  tanggal: string;
  waktu: string;
  lokasi: string;
  pic: string;
  pembicara?: string; // Nama Pembicara / Narasumber
  flyerUrl?: string; // Foto flyer / banner poster event
  linkRegistrasi?: string; // Tautan Formulir / Google Form Registrasi
  linkGoogleSheet?: string; // Tautan Google Sheet Evaluasi MenDAKI eksternal (docs.google.com/spreadsheets/...)
  mendakiFormId?: string; // ID Form Evaluasi MenDAKI yang terhubung (default FORM-MENDAKI-01)
  mitraPeserta: string;
  sekolahId?: string;
  status: EventStatus;
  deskripsi: string;
  classroomUrl?: string; // Tautan Google Classroom (opsional)
  classCode?: string; // Kode Gabung Kelas Google Classroom (opsional)
  isDemo?: boolean;
}

export type PermintaanKategori = 'Seragam' | 'Dokumen Cetak' | 'Merchandise & Lainnya';
export type PermintaanStatus = 'Diajukan' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Ditolak';

export interface PermintaanMitra {
  id: string;
  mitraId: string;
  namaSekolah: string;
  kategori: PermintaanKategori;
  itemDetail?: string;
  namaItem?: string;
  spesifikasi?: string;
  catatan?: string;
  jumlah: number;
  tanggalPengajuan: string;
  status: PermintaanStatus;
  noResi?: string;
  estimasiSelesai?: string;
  catatanAdmin?: string;
  isDemo?: boolean;
}

export type ActivityKategori = 'Kunjungan Lapangan' | 'Supervisi Akademik' | 'Audit Keuangan' | 'Pendampingan Online' | 'Koordinasi Internal' | 'Administrasi & Laporan' | string;

export interface AdminMitraStaff {
  id: string; // e.g. MO002, MO003
  nama: string;
  email: string;
  role: string; // e.g. Kepala Bagian Mitra Office, Officer
  telepon?: string;
  status: 'Aktif' | 'Cuti' | 'Nonaktif';
}

export interface MasterKpiStandar {
  id: string; // e.g. 'STD-01'
  nomor: number; // 1 to 15
  noKpi: string; // 'KPI-01' to 'KPI-15'
  namaStandar: string; // e.g. 'Standar 1: Kurikulum & Pendampingan MenDAKI'
  programKpi: string; // e.g. 'Supervisi & Pendampingan Kurikulum/MenDAKI'
  penjelasanKpi: string; // Target & Indikator Keberhasilan KPI
  targetOutput?: string; // Berkas / Output Hasil
  defaultBobot?: number; // Nilai bobot standar (100)
}

export interface TahapanBobotItem {
  id: string;
  nama: string; // e.g. 'Draft / Konsep Dokumen', 'Reminder & Notifikasi'
  bobot: number; // e.g. 10, 40
  isDefault?: boolean;
}

export interface StaffActivity {
  id: string;
  noKpi?: string; // No. KPI / Kode Indikator utama atau gabungan (e.g. 'KPI-01' atau 'KPI-01, KPI-03')
  noKpiList?: string[]; // Daftar beberapa No. KPI jika 1 program mencakup banyak KPI (e.g. ['KPI-01', 'KPI-03'])
  standarKpi?: string; // Nama Standar (e.g. 'Standar 1: Kurikulum & Pendampingan MenDAKI')
  standarKpiList?: string[]; // Daftar Standar KPI terkait
  penjelasanKpi?: string; // Penjelasan / Uraian Target Indikator KPI
  programKpi?: string; // Sasaran Program KPI (e.g. 'LATOF Akademik', 'Supervisi & Pendampingan Kurikulum/MenDAKI')
  namaStaff: string; // PIC Admin Mitra Office
  tugas?: string; // Uraian Tugas / Pekerjaan
  judulAktivitas?: string;
  tahunAjaran?: string; // e.g. '2026/2027'
  tanggal: string; // date start/input
  deadline?: string; // date deadline
  status: 'Selesai' | 'Sedang Berjalan' | 'Belum Dimulai' | 'Terjadwal' | 'Ditunda' | 'Dibatalkan' | string;
  bobotKpi?: number; // bobot poin/kpi otomatis terhitung
  tahapanDipilih?: { nama: string; bobot: number }[]; // Tahapan rincian perhitungan bobot
  kpiScore?: number;
  hasilCatatan?: string;
  hasilKegiatan?: string;
  catatanTindakLanjut?: string;
  googleCalendarSynced?: boolean;
  // Legacy optional fields kept for backwards-compatibility:
  jenisKegiatan?: string;
  mitraTerkait?: string;
  mitraTujuan?: string;
  jamMulai?: string;
  jamSelesai?: string;
  waktu?: string;
  kategori?: string;
}

export const DEFAULT_KPI_PROGRAMS = [
  'LATOF Akademik',
  'LATOF Bisnis',
  'Training of Trainers',
  'Visitasi',
  'Magang',
  'Laporan Bulanan',
  'Pembayaran Mitra',
  'PLN',
  'In House Training',
  'Permintaan Mitra',
  'STEP UP',
  'SPARK',
  'Dashboard',
  'RAKER',
  'Pertemuan Feedback',
  'Konsultasi Mitra',
  'Monitoring Mitra',
  'Pelayanan (MoU, SOP, Panduan)',
] as const;

export const BULAN_LIST = [
  { value: 'ALL', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
] as const;

export const TAHUN_AJARAN_LIST = [
  'Semua Tahun Ajaran',
  '2027/2028',
  '2026/2027',
  '2025/2026',
  '2024/2025',
  '2023/2024',
  '2022/2023',
] as const;

export type TemplateKategori = string;

export interface TemplateDokumen {
  id: string;
  judul: string;
  kategori: TemplateKategori;
  deskripsi: string;
  linkUrl: string;
  format?: 'PDF' | 'DOCX' | 'XLSX' | 'VIDEO' | 'LINK' | string;
  tipeFile?: string;
  terakhirUpdate?: string;
  versi?: string;
}

export interface PerformanceMenDAKI {
  id: string;
  mitraId: string;
  namaSekolah: string;
  periode: string;
  pilarM?: number;
  pilarD?: number;
  pilarA?: number;
  pilarK?: number;
  pilarI?: number;
  skorManajemen?: number; // 0-100
  skorKurikulum?: number; // 0-100
  skorSDM?: number; // 0-100
  skorKemitraan?: number; // 0-100
  skorBranding?: number; // 0-100
  totalSkor: number; // Average
  predikat: 'A+' | 'A' | 'B' | 'C' | string;
  kekuatan?: string;
  rekomendasi?: string;
  catatanRekomendasi?: string;
  tanggalEvaluasi?: string;
  tanggalPenilaian?: string;
  isDemo?: boolean;
}


export type PerformanceMendaki = PerformanceMenDAKI;

export interface MendakiFormDefinition {
  id: string; // e.g. 'FORM-MENDAKI-01'
  judulForm: string;
  deskripsiForm: string;
  kategoriEvent: string; // 'Semua Kategori' atau kategori spesifik
  eventKegiatanDefault?: string;
  temaTopikDefault?: string;
  daftarKategoriEvent: string[];
  labelEmail: string;
  labelNama: string;
  labelNamaSekolah: string;
  labelEventKegiatan: string;
  labelTemaTopik: string;
  labelDrop: string;
  labelAdd: string;
  labelKeep: string;
  labelImprove: string;
  labelHalDisukai: string;
  labelRating: string;
  status: 'Aktif' | 'Ditutup';
  createdAt: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface MendakiFormSubmission {
  id: string; // e.g. 'SUB-MENDAKI-001'
  formId: string;
  judulForm?: string;
  eventId?: string; // ID Event dari Event Tracker (e.g. 'EVT-01')
  email: string;
  nama: string;
  mitraId: string;
  namaSekolah: string;
  kategoriEvent: string;
  eventKegiatan: string;
  temaTopik: string;
  drop: string;
  add: string;
  keep: string;
  improve: string;
  halDisukai: string;
  rating: number; // 1 - 5
  pengisiRole?: 'Administrator' | 'Sekolah Mitra' | 'Guru Mitra';
  tanggalIsi: string;
  isDemo?: boolean;
}

export type ProgramMitraJenis = 'Visitasi' | 'Magang';
export type ProgramMitraStatus = 'Diajukan' | 'Disetujui' | 'Sedang Berjalan' | 'Selesai' | 'Perlu Revisi';

export interface ProgramMitraItem {
  id: string; // e.g. PRG-2026-001
  jenis: ProgramMitraJenis; // 'Visitasi' | 'Magang'
  judul: string;
  mitraId: string;
  namaSekolah: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  peserta?: string; // Nama guru / staff peserta
  jumlahPeserta?: number;
  deskripsi?: string;
  // Link & Upload Dokumen (Docs, Sheet, PDF, Canva)
  linkDocs?: string; // Tautan Google Docs
  linkSheet?: string; // Tautan Google Sheets
  linkPdf?: string; // Tautan File / Drive PDF
  linkCanva?: string; // Tautan Desain / Presentasi Canva
  fileUploadedName?: string; // Nama file fisik yang diupload
  fileUploadedData?: string; // Base64 data file lokal
  fileUploadedType?: string;
  status: ProgramMitraStatus;
  catatanAdmin?: string;
  tanggalPengajuan: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface ProgramMitraTemplate {
  id: string;
  jenis: ProgramMitraJenis; // 'Visitasi' | 'Magang'
  nama: string;
  deskripsi: string;
  tipeFormat: 'Docs' | 'Sheet' | 'PDF' | 'Canva';
  linkTemplate: string;
  diperbarui: string;
}

export type ActiveNavTab = 
  | 'dashboard'
  | 'laporan-bulanan'
  | 'invoice'
  | 'pembayaran'
  | 'event-tracker'
  | 'permintaan-mitra'
  | 'program-mitra'
  | 'data-mitra'
  | 'staff-activity'
  | 'template'
  | 'performance-mendaki'
  | 'pengaturan';
