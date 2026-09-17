import { MasterKpiStandar, TahapanBobotItem } from '../types';

/**
 * 15 STANDAR DENGAN 15 KPI LAZUARDI MITRA OFFICE
 * Dilengkapi dengan detail program, target indikator keberhasilan, dan target output.
 */
export const DAFTAR_15_STANDAR_KPI: MasterKpiStandar[] = [
  {
    id: 'STD-01',
    nomor: 1,
    noKpi: 'KPI-01',
    namaStandar: 'Standar 1: Kurikulum & Pendampingan MenDAKI',
    programKpi: 'Supervisi & Pendampingan Kurikulum/MenDAKI',
    penjelasanKpi: 'Ketercapaian supervisi implementasi kurikulum MenDAKI, modul ajar berbasis projek, integrasi karakter welas asih, dan pendampingan micro-teaching guru minimal 90% pada periode berjalan.',
    targetOutput: 'Rekap nilai supervisi modul ajar & laporan visitasi berkala',
    defaultBobot: 100,
  },
  {
    id: 'STD-02',
    nomor: 2,
    noKpi: 'KPI-02',
    namaStandar: 'Standar 2: Tata Kelola Lisensi, Kontrak & Legalitas Mitra',
    programKpi: 'Layanan Administrasi, Kontrak Lisensi & Legalitas',
    penjelasanKpi: 'Penyelesaian dan pembaharuan perjanjian lisensi kerja sama (MoU/MoA), kepatuhan legalitas jenjang baru, dan verifikasi izin operasional sekolah mitra tepat waktu 100%.',
    targetOutput: 'Dokumen MoU/MoA legal bertandatangan resmi & sertifikat lisensi',
    defaultBobot: 100,
  },
  {
    id: 'STD-03',
    nomor: 3,
    noKpi: 'KPI-03',
    namaStandar: 'Standar 3: Peningkatan Mutu SDM & Pelatihan Guru Inklusi',
    programKpi: 'Pelatihan & Peningkatan Mutu SDM / Guru Inklusi',
    penjelasanKpi: 'Terlaksananya pelatihan kompetensi guru inklusi, workshop IEP (Individualized Education Program), dan sertifikasi shadow teacher minimal 2 sesi per semester dengan tingkat kepuasan >= 85%.',
    targetOutput: 'Sertifikat pelatihan, presensi peserta & modul diklat inklusi',
    defaultBobot: 100,
  },
  {
    id: 'STD-04',
    nomor: 4,
    noKpi: 'KPI-04',
    namaStandar: 'Standar 4: Audit Kepatuhan Administrasi & Monitoring SOP',
    programKpi: 'Audit Lisensi, Kepatuhan & Keuangan Mitra',
    penjelasanKpi: 'Pelaksanaan audit kepatuhan SOP akademik, administrasi kesiswaan, dan standarisasi operasional sekolah mitra minimal 1 kali per semester dengan skor kepatuhan minimal 80%.',
    targetOutput: 'Berita acara audit kepatuhan & lembar rekomendasi perbaikan',
    defaultBobot: 100,
  },
  {
    id: 'STD-05',
    nomor: 5,
    noKpi: 'KPI-05',
    namaStandar: 'Standar 5: Evaluasi Kinerja & Pelaporan Bulanan Mitra',
    programKpi: 'Evaluasi Kinerja, Rekapitulasi & Pelaporan Bulanan',
    penjelasanKpi: 'Ketepatan waktu penerimaan, verifikasi perkalian sheet biaya, dan review laporan bulanan dari 100% sekolah mitra aktif sebelum tanggal 10 setiap bulan.',
    targetOutput: 'Rekapitulasi status verifikasi laporan & sheet perhitungan terarsip',
    defaultBobot: 100,
  },
  {
    id: 'STD-06',
    nomor: 6,
    noKpi: 'KPI-06',
    namaStandar: 'Standar 6: Pengelolaan Keuangan, Billing Invoice & Rekonsiliasi',
    programKpi: 'Pengelolaan Keuangan, Billing & Verifikasi Pembayaran',
    penjelasanKpi: 'Penerbitan invoice lisensi (renewal fee, franchise fee, royalti siswa) tepat waktu dan verifikasi bukti transfer pembayaran mitra dengan tingkat rekonsiliasi nihil selisih.',
    targetOutput: 'Lembar invoice tervalidasi, kuitansi resmi & rekonsiliasi kas masuk',
    defaultBobot: 100,
  },
  {
    id: 'STD-07',
    nomor: 7,
    noKpi: 'KPI-07',
    namaStandar: 'Standar 7: Pengadaan Logistik, Seragam Batik & Dokumen Cetak',
    programKpi: 'Pengadaan Logistik & Pengiriman Dokumen Mitra',
    penjelasanKpi: 'Pemenuhan permintaan logistik seragam batik khas, rapor karakter, dan buku panduan kurikulum mitra selesai diproses dan dikirim maksimal 14 hari kerja setelah verifikasi.',
    targetOutput: 'Resi pengiriman logistik, surat jalan & bukti terima barang',
    defaultBobot: 100,
  },
  {
    id: 'STD-08',
    nomor: 8,
    noKpi: 'KPI-08',
    namaStandar: 'Standar 8: Layanan Konsultasi Khusus & Pendampingan Siswa ABK',
    programKpi: 'Pendampingan Inklusi & Konsultasi Kasus Siswa',
    penjelasanKpi: 'Respons cepat konsultasi kasus siswa berkebutuhan khusus, asesmen psikopedagogis, dan pendampingan shadow teacher maksimal 2x24 jam sejak permohonan masuk.',
    targetOutput: 'Lembar catatan asesmen psikopedagogis / rekomendasi penanganan',
    defaultBobot: 100,
  },
  {
    id: 'STD-09',
    nomor: 9,
    noKpi: 'KPI-09',
    namaStandar: 'Standar 9: Ekspansi Kemitraan & Penjajakan Sekolah Mitra Baru',
    programKpi: 'Ekspansi Kemitraan & Penjajakan Sekolah Baru',
    penjelasanKpi: 'Penjajakan potensi kerja sama sekolah baru, presentasi kurikulum MenDAKI, dan proses studi kelayakan (feasibility study) minimal 2 calon mitra per kuartal.',
    targetOutput: 'Proposal penawaran kemitraan & laporan studi kelayakan lokasi',
    defaultBobot: 100,
  },
  {
    id: 'STD-10',
    nomor: 10,
    noKpi: 'KPI-10',
    namaStandar: 'Standar 10: Komunikasi, Branding Bersama & Portal Digital L-MAP',
    programKpi: 'Manajemen Portal L-MAP & Publikasi Branding',
    penjelasanKpi: 'Pemeliharaan data real-time portal L-MAP, pembaruan template dokumen, dan publikasi agenda kegiatan kemitraan di kanal digital resmi tanpa hambatan teknis.',
    targetOutput: 'Log sinkronisasi data portal & materi promosi bersama',
    defaultBobot: 100,
  },
  {
    id: 'STD-11',
    nomor: 11,
    noKpi: 'KPI-11',
    namaStandar: 'Standar 11: Koordinasi Pimpinan Mitra & Rapat Evaluasi Triwulan',
    programKpi: 'Koordinasi Pimpinan & Rapat Kerja Triwulan',
    penjelasanKpi: 'Penyelenggaraan forum koordinasi pimpinan sekolah mitra per triwulan dengan kehadiran minimal 90% pimpinan/yayasan mitra dan notulensi tersirkulasi dalam 3 hari kerja.',
    targetOutput: 'Notulensi raker, daftar hadir kepala sekolah & materi paparan pimpinan',
    defaultBobot: 100,
  },
  {
    id: 'STD-12',
    nomor: 12,
    noKpi: 'KPI-12',
    namaStandar: 'Standar 12: Penjaminan Mutu Asesmen Karakter & Budaya Welas Asih',
    programKpi: 'Penjaminan Mutu Asesmen Karakter Siswa',
    penjelasanKpi: 'Standarisasi format raport karakter Lazuardi dan pengawasan implementasi budaya sekolah welas asih (compassionate culture) di seluruh unit mitra secara konsisten.',
    targetOutput: 'Bank instrumen asesmen karakter & laporan audit budaya sekolah',
    defaultBobot: 100,
  },
  {
    id: 'STD-13',
    nomor: 13,
    noKpi: 'KPI-13',
    namaStandar: 'Standar 13: Manajemen Keluhan, Helpdesk & Eskalasi Permintaan',
    programKpi: 'Layanan Helpdesk & Penanganan Keluhan Mitra',
    penjelasanKpi: 'Penyelesaian keluhan mitra dan tindak lanjut permohonan darurat (SLA) dengan tingkat resolusi tuntas 100% dan tingkat kepuasan mitra minimal kategori Sangat Baik.',
    targetOutput: 'Tiket keluhan tereskalasi & berita acara penyelesaian masalah',
    defaultBobot: 100,
  },
  {
    id: 'STD-14',
    nomor: 14,
    noKpi: 'KPI-14',
    namaStandar: 'Standar 14: Sinkronisasi Kalender Pendidikan & Agenda Terpadu',
    programKpi: 'Event Tracker & Sinkronisasi Kalender Pendidikan',
    penjelasanKpi: 'Sinkronisasi agenda kegiatan gabungan (workshop kurikulum, lomba siswa, parenting, rapat kerja) ke Google Calendar dan Google Classroom Mitra secara real-time.',
    targetOutput: 'Kalender terpadu tersinkronisasi & undangan event terdistribusi',
    defaultBobot: 100,
  },
  {
    id: 'STD-15',
    nomor: 15,
    noKpi: 'KPI-15',
    namaStandar: 'Standar 15: Manajemen Arsip Pusat, Akreditasi & Operasional',
    programKpi: 'Operasional Internal & Koordinasi Mitra Office',
    penjelasanKpi: 'Ketertiban pengarsipan berkas fisik dan digital, kesiapan dokumen pendukung akreditasi nasional/lisensi, serta kelancaran rapat koordinasi internal mingguan tim Mitra Office.',
    targetOutput: 'Repositori dokumen terindeks, berkas akreditasi rapi & notulensi tim',
    defaultBobot: 100,
  },
];

/**
 * TAHAPAN PEKERJAAN & BOBOT OTOMATIS
 * Sesuai instruksi: follow up (+10), draft (+10), reminder (+10), pengajuan ttd (+10),
 * persiapan checklist (+10), pelaksanaan (+40), dokumentasi laporan (+10)
 */
export const DEFAULT_TAHAPAN_BOBOT: TahapanBobotItem[] = [
  {
    id: 'thp-draft',
    nama: 'Draft / Konsep Dokumen',
    bobot: 10,
    isDefault: true,
  },
  {
    id: 'thp-reminder',
    nama: 'Reminder & Notifikasi Mitra',
    bobot: 10,
    isDefault: true,
  },
  {
    id: 'thp-persiapan',
    nama: 'Persiapan & Checklist Kelengkapan',
    bobot: 10,
    isDefault: true,
  },
  {
    id: 'thp-followup',
    nama: 'Follow-up & Koordinasi',
    bobot: 10,
    isDefault: true,
  },
  {
    id: 'thp-ttd',
    nama: 'Pengajuan Tanda Tangan (TTD) / Approval',
    bobot: 10,
    isDefault: true,
  },
  {
    id: 'thp-pelaksanaan',
    nama: 'Pelaksanaan / Eksekusi Kegiatan',
    bobot: 40,
    isDefault: true,
  },
  {
    id: 'thp-laporan',
    nama: 'Dokumentasi, Notulensi & Pelaporan',
    bobot: 10,
    isDefault: false,
  },
];

/**
 * Helper to calculate total bobot from active stages
 */
export function calculateTotalBobot(stages: { nama: string; bobot: number }[]): number {
  return stages.reduce((acc, curr) => acc + (Number(curr.bobot) || 0), 0);
}
