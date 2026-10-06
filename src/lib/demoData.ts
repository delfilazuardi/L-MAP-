import { 
  SekolahMitra, 
  UserAccount, 
  LaporanBulanan, 
  Invoice, 
  Pembayaran, 
  EventItem, 
  PermintaanMitra, 
  PerformanceMenDAKI, 
  MendakiFormSubmission,
  ProgramMitraItem 
} from '../types';

export const DEMO_SEKOLAH_ID = 'DEMO-MITRA';

/**
 * Entitas Profil Sekolah Mitra Demo (Simulasi / Sandbox)
 * Terisolasi khusus agar tidak mempengaruhi data riil atau kalkulasi dashboard.
 */
export const DEMO_SEKOLAH: SekolahMitra = {
  id: DEMO_SEKOLAH_ID,
  kodeMitra: 'MO-CINERE',
  namaSekolah: 'Sekolah Lazuardi Cinere',
  alamat: 'Jl. Cinere Raya No. 17, Cinere, Kota Depok, Jawa Barat',
  kota: 'Depok',
  pimpinan: 'Drs. H. Mulyadi Kusuma, M.Pd.',
  kontak: '0812-9876-5432 (Bpk. Mulyadi)',
  email: 'lazuardi.cinere@lazuardi.sch.id',
  kontakEmail: 'lazuardi.cinere@lazuardi.sch.id',
  kontakTelepon: '021-7548901',
  jenjang: 'TK, SD, SMP',
  jumlahSiswa: 260,
  statusKerjasama: 'Aktif',
  kategoriSekolah: 'Mitra Reguler',
  tahunBergabung: 2023,
  keteranganKhusus: 'Kampus Sekolah Lazuardi Cinere',
  isDemo: true,
};

/**
 * Akun Pengguna Khusus Sekolah Lazuardi Cinere
 */
export const DEMO_USER: UserAccount = {
  userId: DEMO_SEKOLAH_ID,
  nama: 'Sekolah Lazuardi Cinere',
  email: 'lazuardi.cinere@lazuardi.sch.id',
  password: 'admin123',
  role: 'Sekolah Mitra',
  akses: 'Akses Terbatas',
  status: 'Aktif',
  sekolahId: DEMO_SEKOLAH_ID,
  isDemo: true,
};

/**
 * Data Laporan Bulanan untuk Sekolah Lazuardi Cinere
 */
export const DEMO_LAPORAN: LaporanBulanan[] = [
  {
    id: 'LAP-DEMO-001',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    bulan: 'Agustus',
    tahun: 2026,
    tahunAjaran: '2026/2027',
    tanggalKirim: '2026-08-30',
    tanggalDiajukan: '2026-08-30',
    kategori: 'Komprehensif',
    ringkasan: 'Laporan Bulanan: Seluruh program kurikulum compassionate dan asesmen awal semester berjalan lancar. Kehadiran siswa 99.1%.',
    kendala: 'Kebutuhan modul pengayaan kurikulum Cambridge untuk jenjang SMP.',
    solusi: 'Mengajukan pemesanan modul via portal L-MAP ke Mitra Office.',
    linkDokumen: 'https://docs.google.com/document/d/demo-lazuardi-mitra/edit',
    status: 'Diterima',
    catatanAdmin: 'Laporan telah diverifikasi oleh tim kurikulum Mitra Office.',
    isDemo: true,
  },
  {
    id: 'LAP-DEMO-002',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    bulan: 'September',
    tahun: 2026,
    tahunAjaran: '2026/2027',
    tanggalKirim: '2026-09-28',
    tanggalDiajukan: '2026-09-28',
    kategori: 'Akademik',
    ringkasan: 'Laporan Bulanan: Evaluasi pembelajaran tengah semester dan rencana workshop guru inklusi.',
    linkDokumen: 'https://docs.google.com/document/d/demo-lazuardi-mitra-sept/edit',
    status: 'Diajukan',
    isDemo: true,
  }
];

/**
 * Data Invoice untuk Sekolah Lazuardi Cinere
 */
export const DEMO_INVOICES: Invoice[] = [
  {
    id: 'INV-DEMO-2026-01',
    nomorInvoice: 'INV/DEMO/2026/08/001',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategori: 'Renewal Fee',
    bulan: 'Agustus',
    tahunAjaran: '2026/2027',
    tanggalTerbit: '2026-08-01',
    tanggalKirim: '2026-08-01',
    jatuhTempo: '2026-08-25',
    nominal: 12500000,
    tagihanFull: 12500000,
    tagihanRealisasi: 12500000,
    nominalPembayaran: 12500000,
    status: 'Lunas',
    keterangan: 'Invoice Renewal Fee Semester Ganjil TA 2026/2027',
    isDemo: true,
  },
  {
    id: 'INV-DEMO-2026-02',
    nomorInvoice: 'INV/DEMO/2026/09/002',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategori: 'Renewal Fee',
    bulan: 'September',
    tahunAjaran: '2026/2027',
    tanggalTerbit: '2026-09-01',
    tanggalKirim: '2026-09-01',
    jatuhTempo: '2026-09-25',
    nominal: 12500000,
    tagihanFull: 12500000,
    tagihanRealisasi: 12500000,
    nominalPembayaran: 0,
    status: 'Belum Bayar',
    keterangan: 'Invoice Berjalan Bulan September 2026',
    isDemo: true,
  }
];

/**
 * Data Pembayaran untuk Sekolah Lazuardi Cinere
 */
export const DEMO_PEMBAYARAN: Pembayaran[] = [
  {
    id: 'BYR-DEMO-2026-01',
    invoiceId: 'INV-DEMO-2026-01',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategori: 'Renewal Fee',
    jumlah: 12500000,
    tanggalBayar: '2026-08-20',
    metodeBayar: 'Transfer Bank Mandiri',
    noReferensi: 'REF/DEMO/2026/08/001',
    buktiUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    status: 'Terverifikasi',
    catatan: 'Pembayaran telah diverifikasi Mitra Office.',
    isDemo: true,
  }
];

/**
 * Data Event Tracker untuk Sekolah Lazuardi Cinere
 */
export const DEMO_EVENTS: EventItem[] = [
  {
    id: 'EVT-DEMO-001',
    judul: 'Supervisi & Evaluasi Mutu MenDAKI Lazuardi Cinere',
    kategori: 'Supervisi Mutu',
    tanggal: '2026-10-18',
    waktu: '09:00 - 14:00 WIB',
    lokasi: 'Auditorium Lazuardi Cinere & Virtual Room',
    pic: 'Tim Asesor Mitra Office',
    mitraPeserta: 'Sekolah Lazuardi Cinere',
    sekolahId: DEMO_SEKOLAH_ID,
    deskripsi: 'Agenda supervisi mutu kurikulum dan pembelajaran ramah anak (Compassionate School).',
    status: 'Direncanakan',
    pembicara: 'Dr. Anita Rahayu (L-MAP Pusat)',
    flyerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&h=800&q=80',
    linkRegistrasi: 'https://forms.gle/supervisi-mendaki-cinere-2026',
    isDemo: true,
  },
  {
    id: 'EVT-DEMO-002',
    judul: 'Workshop Pembelajaran Karakter Compassionate Guru Mitra',
    kategori: 'Pelatihan Guru',
    tanggal: '2026-10-25',
    waktu: '08:30 - 12:00 WIB',
    lokasi: 'Hybrid Zoom Meeting',
    pic: 'Delfi Dwi Hermawati',
    mitraPeserta: 'Sekolah Lazuardi Cinere',
    sekolahId: DEMO_SEKOLAH_ID,
    deskripsi: 'Pelatihan modul compassionate school bagi guru sekolah mitra baru dan penyegaran semester.',
    status: 'Berjalan',
    pembicara: 'Tim Kurikulum Lazuardi Pusat',
    flyerUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&h=800&q=80',
    linkRegistrasi: 'https://forms.gle/workshop-compassionate-cinere-2026',
    isDemo: true,
  }
];

/**
 * Data Permintaan Logistik untuk Sekolah Lazuardi Cinere
 */
export const DEMO_PERMINTAAN: PermintaanMitra[] = [
  {
    id: 'REQ-DEMO-001',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategori: 'Dokumen Cetak',
    namaItem: 'Buku Panduan Karakter Compassionate Lazuardi',
    jumlah: 35,
    spesifikasi: 'Edisi Revisi 2026, Full Color, Cover Glossy',
    tanggalPengajuan: '2026-09-10',
    status: 'Dikirim',
    noResi: 'JNE-DEMO-889922',
    catatan: 'Pengiriman modul pegangan guru tahun ajaran baru.',
    catatanAdmin: 'Paket telah dikirimkan via ekspedisi ke alamat sekolah.',
    isDemo: true,
  },
  {
    id: 'REQ-DEMO-002',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategori: 'Dokumen Cetak',
    namaItem: 'Sertifikat Pelatihan Guru Cambridge Primary',
    jumlah: 15,
    spesifikasi: 'Kertas Concorde 220gr dengan stempel timbul L-MAP',
    tanggalPengajuan: '2026-09-22',
    status: 'Diproses',
    catatan: 'Permintaan sertifikat resmi untuk peserta pelatihan.',
    catatanAdmin: 'Sedang proses pencetakan dan penandatanganan Direktur Mitra Office.',
    isDemo: true,
  }
];

/**
 * Data Evaluasi Mutu MenDAKI untuk Sekolah Lazuardi Cinere
 */
export const DEMO_PERFORMANCE: PerformanceMenDAKI[] = [
  {
    id: 'PERF-DEMO-001',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    periode: '2026/2027 Ganjil',
    tanggalEvaluasi: '2026-09-15',
    tanggalPenilaian: '2026-09-15',
    pilarM: 90,
    pilarD: 88,
    pilarA: 92,
    pilarK: 85,
    pilarI: 87,
    totalSkor: 88.5,
    predikat: 'A',
    kekuatan: 'Penerapan budaya compassionate school dan keterlibatan komite sekolah sangat solid.',
    rekomendasi: 'Terus dorong pemanfaatan media digital dan pelaporan berkala secara konsisten.',
    isDemo: true,
  }
];

/**
 * Data Program Mitra untuk Sekolah Lazuardi Cinere
 */
export const DEMO_PROGRAM_MITRA: ProgramMitraItem[] = [
  {
    id: 'PRG-DEMO-001',
    jenis: 'Visitasi',
    judul: 'Pengajuan Visitasi Benchmarking Kurikulum Cambridge',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    tanggalMulai: '2026-11-05',
    tanggalSelesai: '2026-11-06',
    peserta: 'Kepala Sekolah & 3 Koordinator Kurikulum',
    jumlahPeserta: 4,
    deskripsi: 'Kunjungan studi banding pelaksanaan kurikulum internasional ke kampus Lazuardi.',
    status: 'Disetujui',
    tanggalPengajuan: '2026-09-20',
    catatanAdmin: 'Jadwal visitasi telah disetujui dan diagendakan pada kalender Mitra Office.',
    isDemo: true,
  }
];

/**
 * Data Isian Form Evaluasi MenDAKI untuk Sekolah Lazuardi Cinere
 */
export const DEMO_MENDAKI_SUBMISSIONS: MendakiFormSubmission[] = [
  {
    id: 'SUB-DEMO-001',
    formId: 'FORM-MENDAKI-01',
    judulForm: 'Form Evaluasi & Refleksi Kegiatan MenDAKI',
    email: 'lazuardi.cinere@lazuardi.sch.id',
    nama: 'Drs. H. Mulyadi Kusuma, M.Pd.',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategoriEvent: 'Supervisi Mutu',
    eventKegiatan: 'Supervisi Mutu',
    temaTopik: 'Penguatan Budaya Compassionate School',
    drop: 'Administrasi laporan manual berulang.',
    add: 'Sesi klinik konsultasi kurikulum bulanan.',
    keep: 'Pendampingan tim asesor yang sangat komunikatif dan solutif.',
    improve: 'Sinkronisasi jadwal supervisi lebih awal di awal semester.',
    halDisukai: 'Diskusi reflektif dua arah yang sangat membangun.',
    rating: 5,
    pengisiRole: 'Sekolah Mitra',
    tanggalIsi: '2026-09-20',
    isDemo: true,
  },
  {
    id: 'SUB-DEMO-002',
    formId: 'FORM-MENDAKI-01',
    judulForm: 'Form Evaluasi & Refleksi Kegiatan MenDAKI',
    email: 'guru.cinere@lazuardi.sch.id',
    nama: 'Dewi Sartika, S.Pd.',
    mitraId: DEMO_SEKOLAH_ID,
    namaSekolah: 'Sekolah Lazuardi Cinere',
    kategoriEvent: 'Pelatihan Guru',
    eventKegiatan: 'Pelatihan Guru',
    temaTopik: 'Desain Pembelajaran Berdiferensiasi Ramah Anak',
    drop: 'Sesi teori satu arah yang terlalu lama.',
    add: 'Contoh video micro-teaching di kelas inklusi.',
    keep: 'Praktik langsung penyusunan modul ajar kolaboratif.',
    improve: 'Penambahan waktu diskusi tanya jawab studi kasus.',
    halDisukai: 'Materi sangat aplikatif dan langsung bisa diterapkan di kelas.',
    rating: 5,
    pengisiRole: 'Guru Mitra',
    tanggalIsi: '2026-09-22',
    isDemo: true,
  }
];

/**
 * Pemeriksaan apakah suatu entitas atau ID merupakan bagian dari demo sandbox terisolasi
 */
export function isDemoEntity(idOrObj: any): boolean {
  if (!idOrObj) return false;
  if (typeof idOrObj === 'string') {
    const s = idOrObj.toLowerCase();
    return s === DEMO_SEKOLAH_ID.toLowerCase() || s === 'mo-demo' || s === 'mo-cinere' || s.startsWith('demo-') || s.startsWith('inv-demo-') || s.startsWith('byr-demo-') || s.startsWith('lap-demo-') || s.startsWith('evt-demo-') || s.startsWith('req-demo-') || s.startsWith('perf-demo-') || s.startsWith('prg-demo-') || s.startsWith('sub-demo-') || s.startsWith('form-demo-');
  }
  if (typeof idOrObj === 'object') {
    return Boolean(
      idOrObj.isDemo || 
      idOrObj.id === DEMO_SEKOLAH_ID || 
      idOrObj.sekolahId === DEMO_SEKOLAH_ID || 
      idOrObj.mitraId === DEMO_SEKOLAH_ID ||
      (idOrObj.kodeMitra && (idOrObj.kodeMitra.toLowerCase() === 'mo-demo' || idOrObj.kodeMitra.toLowerCase() === 'mo-cinere'))
    );
  }
  return false;
}
