/**
 * L-MAP Multi-Language Internationalization & Auto-Translation Engine
 * Supports seamless Bahasa Indonesia (ID) and English (EN) translation.
 * Translates navigation, dashboards, invoices, reports, events, dialogs,
 * forms, buttons, and statuses automatically.
 */

// Comprehensive dictionary: Indonesian -> English
export const ID_TO_EN_DICTIONARY: Record<string, string> = {
  // Navigation & System
  'Dashboard': 'Dashboard',
  'Dashboard Eksekutif': 'Executive Dashboard',
  'Dashboard Eksekutif L-MAP': 'L-MAP Executive Dashboard',
  'Ringkasan Eksekutif': 'Executive Summary',
  'Laporan Bulanan': 'Monthly Reports',
  'Laporan Bulanan Sekolah Mitra': 'Partner School Monthly Reports',
  'Akademik & Operasional': 'Academic & Operations',
  'Invoice & Pembayaran': 'Invoices & Payments',
  'Invoice & Pembayaran Mitra': 'Partner Invoices & Payments',
  'Franchise, Piutang, Renewal, Jenjang': 'Franchise, Receivables, Renewal, Levels',
  'Event Tracker': 'Event Tracker',
  'Event Tracker & Kalender Agenda': 'Event Tracker & Agenda Calendar',
  'Agenda & Workshop Mitra': 'Partner Agenda & Workshops',
  'Permintaan Mitra': 'Partner Requests',
  'Permintaan Logistik Mitra': 'Partner Logistics Requests',
  'Seragam & Dokumen Cetak': 'Uniforms & Printed Documents',
  'Program Mitra': 'Partner Programs',
  'Program Mitra: Visitasi & Magang Guru': 'Partner Programs: School Visit & Teacher Internship',
  'Visitasi & Magang Guru': 'School Visit & Teacher Internship',
  'Data Mitra': 'Partner Data',
  'Direktori Data Sekolah Mitra': 'Partner School Directory',
  'Profil Sekolah & Murid': 'School Profiles & Students',
  'Staff Activity': 'Staff Activity',
  'Staff Activity & Google Calendar': 'Staff Activity & Google Calendar',
  'Kegiatan & Google Calendar': 'Activities & Google Calendar',
  'Template & Berkas': 'Templates & Files',
  'Template & Berkas Dokumen Resmi': 'Official Templates & Documents',
  'SOP, Panduan & Handbook': 'SOPs, Guides & Handbooks',
  'Performance (MenDAKI)': 'Performance (MenDAKI)',
  'Evaluasi Mutu MenDAKI Lazuardi': 'Lazuardi MenDAKI Quality Evaluation',
  'Form Refleksi & Mutu Lazuardi': 'Lazuardi Reflection & Quality Form',
  'Isi Form Evaluasi Kegiatan': 'Fill Activity Evaluation Form',
  'Pengaturan': 'Settings',
  'Pengaturan Sistem': 'System Settings',
  'Pengaturan Sistem, Bahasa & Logo': 'System, Language & Logo Settings',
  'Bahasa, Logo & Konfigurasi': 'Language, Logo & Configuration',
  'L-MAP Platform': 'L-MAP Platform',
  'Together for Greater Impact': 'Together for Greater Impact',
  'Lazuardi Mitra Administration Platform': 'Lazuardi Mitra Administration Platform',

  // Authentication & Roles
  'Administrator': 'Administrator',
  'Administrator L-MAP': 'L-MAP Administrator',
  'Sekolah Mitra': 'Partner School',
  'Guru Mitra': 'Partner Teacher',
  'Ganti Akun Pengguna': 'Switch User Account',
  'Khusus Administrator': 'Administrator Only',
  'Profil Akun': 'Account Profile',
  'Ubah Kata Sandi': 'Change Password',
  'Kata Sandi Baru': 'New Password',
  'Konfirmasi Kata Sandi': 'Confirm Password',
  'Keluar': 'Logout',
  'Keluar Akun': 'Log Out',
  'Masuk': 'Login',
  'Masuk ke Akun': 'Sign In to Account',
  'Surel': 'Email',
  'Kata Sandi': 'Password',
  'Ingat Saya': 'Remember Me',
  'Gagal Masuk': 'Login Failed',
  'Pengguna Aktif': 'Active User',
  'Hak Akses': 'Access Rights',
  'Peran': 'Role',

  // Common Actions & Buttons
  'Simpan': 'Save',
  'Simpan Perubahan': 'Save Changes',
  'Simpan Pengaturan': 'Save Settings',
  'Simpan Pengaturan Bahasa': 'Save Language Settings',
  'Batal': 'Cancel',
  'Tutup': 'Close',
  'Kembali': 'Back',
  'Hapus': 'Delete',
  'Edit': 'Edit',
  'Ubah': 'Modify',
  'Tambah': 'Add',
  'Tambah Data': 'Add Data',
  'Buat Baru': 'Create New',
  'Unduh': 'Download',
  'Unduh Laporan': 'Download Report',
  'Unduh Rekap': 'Download Summary',
  'Unggah': 'Upload',
  'Unggah Dokumen': 'Upload Document',
  'Pilih File': 'Choose File',
  'Cari': 'Search',
  'Cari...': 'Search...',
  'Cari data...': 'Search data...',
  'Cari invoice atau sekolah...': 'Search invoice or school...',
  'Cari nama sekolah...': 'Search school name...',
  'Filter': 'Filter',
  'Filter Sekolah': 'Filter School',
  'Semua': 'All',
  'Semua Sekolah': 'All Schools',
  'Semua Status': 'All Statuses',
  'Semua Jenjang': 'All Levels',
  'Semua Tahun Ajaran': 'All Academic Years',
  'Semua Periode': 'All Periods',
  'Terapkan': 'Apply',
  'Reset': 'Reset',
  'Reset Filter': 'Reset Filter',
  'Aksi': 'Action',
  'Tindakan': 'Action',
  'Detail': 'Details',
  'Lihat Detail': 'View Details',
  'Lihat Berkas': 'View File',
  'Kirim': 'Submit',
  'Kirimkan': 'Submit',
  'Kirim Laporan': 'Submit Report',
  'Ajukan': 'Submit',
  'Ajukan Permintaan': 'Submit Request',
  'Proses': 'Process',
  'Setujui': 'Approve',
  'Tolak': 'Reject',
  'Verifikasi': 'Verify',
  'Cetak': 'Print',
  'Cetak PDF': 'Print PDF',
  'Ekspor Excel': 'Export Excel',
  'Sinkronisasi': 'Synchronize',
  'Sinkronkan Data': 'Sync Data',

  // Statuses & Badges
  'Status': 'Status',
  'Lunas': 'Paid',
  'Belum Bayar': 'Unpaid',
  'Jatuh Tempo': 'Overdue',
  'Menunggu Verifikasi': 'Pending Verification',
  'Terverifikasi': 'Verified',
  'Diajukan': 'Submitted',
  'Direview': 'Under Review',
  'Disetujui': 'Approved',
  'Ditolak': 'Rejected',
  'Diproses': 'Processing',
  'Selesai': 'Completed',
  'Dibatalkan': 'Cancelled',
  'Tepat Waktu': 'On Time',
  'Terlambat': 'Late',
  'Belum Mengirim': 'Not Submitted',
  'Aktif': 'Active',
  'Nonaktif': 'Inactive',
  'Terkirim': 'Sent',
  'Belum Dikirim': 'Not Sent',
  'Terbayar Sebagian': 'Partially Paid',
  'Dicicil Sebagian': 'Partially Paid',
  '✓ Lunas Terbayar': '✓ Paid in Full',
  'Bebas Biaya / Pelaporan': 'Free of Charge / Reporting',

  // Financial & Invoice Terminology
  'REKONSILIASI KEUANGAN': 'FINANCIAL RECONCILIATION',
  'Rekonsiliasi Keuangan': 'Financial Reconciliation',
  'SEMUA KEWAJIBAN': 'ALL OBLIGATIONS',
  'TAGIHAN BULANAN': 'MONTHLY INVOICES',
  'DAFTAR PEMBAYARAN': 'PAYMENT RECORDS',
  'RENCANA CICILAN': 'INSTALLMENT PLAN',
  'Rencana Cicilan': 'Installment Plan',
  'Total Piutang': 'Total Receivables',
  'Total Piutang Berjalan': 'Total Outstanding Receivables',
  'Sisa Piutang Berjalan': 'Current Outstanding Receivables',
  'Sisa Piutang': 'Remaining Balance',
  'Total Tagihan': 'Total Invoiced',
  'Total Pembayaran': 'Total Paid',
  'Total Hutang': 'Total Debt',
  'Total Hutang Rekonsiliasi': 'Reconciled Total Debt',
  'Nominal Tagihan': 'Invoice Amount',
  'Nominal Bayar': 'Amount Paid',
  'Nominal Cicilan': 'Installment Amount',
  'Nominal Cicilan Dibayar': 'Installment Paid Amount',
  'Cicilan Pembayaran': 'Installment Payment',
  'Klik Cicilan Pembayaran': 'Click Installment Payment',
  'Simulasi Cicilan Multi-Bulan (FIFO)': 'Multi-Month Installment Simulation (FIFO)',
  'Eksekusi Pembayaran Cicilan (FIFO)': 'Execute Installment Payment (FIFO)',
  'Metode Pembayaran': 'Payment Method',
  'Transfer Bank': 'Bank Transfer',
  'Bukti Pembayaran': 'Payment Proof',
  'Nomor Referensi': 'Reference Number',
  'Tanggal Bayar': 'Payment Date',
  'Tanggal Terbit': 'Issue Date',
  'Tanggal Kirim': 'Sent Date',
  'Nomor Invoice': 'Invoice Number',
  'Bulan Tagihan': 'Billing Month',
  'Tahun Ajaran': 'Academic Year',
  'Kategori Tagihan': 'Invoice Category',
  'Biaya Lisensi Franchise': 'Franchise License Fee',
  'Biaya Renewal Tahunan': 'Annual Renewal Fee',
  'Pembinaan Jenjang Baru': 'New Level Mentoring',
  'Audit Lisensi': 'License Audit',
  'Tagihan Bulanan': 'Monthly Bill',
  'Riwayat Pembayaran': 'Payment History',
  'Rincian Invoice': 'Invoice Details',
  'Status Pembayaran': 'Payment Status',
  'Jatuh Tempo Pada': 'Due Date',
  'Belum ada pembayaran': 'No payments yet',
  'Sudah dibayar': 'Paid',
  'Sisa yang harus dibayar': 'Remaining amount to pay',

  // Laporan Bulanan (Monthly Reports)
  'Rekap Kepatuhan Laporan': 'Report Compliance Summary',
  'Laporan Masuk': 'Reports Received',
  'Review Laporan': 'Report Review',
  'Catatan Reviewer': 'Reviewer Notes',
  'Kepatuhan Pengiriman': 'Submission Compliance',
  'Tingkat Kepatuhan': 'Compliance Rate',
  'Beri Nilai & Feedback': 'Give Score & Feedback',
  'Bulan Laporan': 'Report Month',
  'Tanggal Pengiriman': 'Submission Date',
  'Berkas Laporan': 'Report File',
  'Laporan Akademik': 'Academic Report',
  'Laporan Keuangan': 'Financial Report',
  'Laporan Sarpras': 'Facilities Report',
  'Laporan SDM & Guru': 'HR & Teacher Report',
  'Semua Laporan Telah Direview': 'All reports have been reviewed',
  'Belum ada laporan yang dikirim': 'No reports submitted yet',

  // Event Tracker
  'Agenda Kegiatan': 'Activity Agenda',
  'Agenda Kegiatan Mitra': 'Partner Activity Agenda',
  'Kalender Agenda': 'Agenda Calendar',
  'Tambah Event Baru': 'Add New Event',
  'Nama Event': 'Event Name',
  'Judul Kegiatan': 'Activity Title',
  'Kategori Event': 'Event Category',
  'Tanggal Mulai': 'Start Date',
  'Tanggal Selesai': 'End Date',
  'Waktu Pelaksanaan': 'Time',
  'Lokasi Pelaksanaan': 'Location',
  'Narasumber / Fasilitator': 'Speaker / Facilitator',
  'Target Peserta': 'Target Participants',
  'Jumlah Peserta': 'Participant Count',
  'Deskripsi Kegiatan': 'Activity Description',
  'Tautan Form Evaluasi': 'Evaluation Form Link',
  'Isi Form': 'Fill Form',
  'Form Evaluasi Kegiatan': 'Activity Evaluation Form',
  'Workshop & Pelatihan': 'Workshop & Training',
  'Supervisi & Visitasi': 'Supervision & Visitation',
  'Rapat Koordinasi': 'Coordination Meeting',
  'Webinar Nasional': 'National Webinar',

  // Permintaan Mitra (Logistics)
  'Pengajuan Permintaan': 'Request Submission',
  'Permintaan Barang': 'Item Request',
  'Daftar Permintaan': 'Request List',
  'Buat Permintaan Logistik': 'Create Logistics Request',
  'Kategori Kebutuhan': 'Requirement Category',
  'Nama Barang / Kebutuhan': 'Item / Need Name',
  'Jumlah (Qty)': 'Quantity (Qty)',
  'Satuan': 'Unit',
  'Tingkat Kebutuhan': 'Urgency Level',
  'Biasa (Normal)': 'Normal',
  'Mendesak (Urgent)': 'Urgent',
  'Sangat Mendesak': 'Very Urgent',
  'Alasan Pengajuan': 'Reason for Request',
  'Seragam Siswa & Guru': 'Student & Teacher Uniforms',
  'Dokumen Cetak & Sertifikat': 'Printed Documents & Certificates',
  'Buku & Modul Kurikulum': 'Curriculum Books & Modules',
  'Merchandise & Atribut Sekolah': 'Merchandise & School Attributes',
  'Tanggal Pengajuan': 'Submission Date',
  'Estimasi Pengiriman': 'Estimated Delivery',
  'Resi Pengiriman': 'Tracking Number',
  'Jasa Pengiriman': 'Courier Service',

  // Program Mitra
  'Program Kemitraan': 'Partnership Programs',
  'Program Kemitraan & Pelatihan': 'Partnership & Training Programs',
  'Daftar Program': 'Program List',
  'Ajukan Program Mitra': 'Apply for Partner Program',
  'Training of Trainers (ToT)': 'Training of Trainers (ToT)',
  'Training of Trainers': 'Training of Trainers',
  'Visitasi Sekolah': 'School Visitation',
  'Magang Guru': 'Teacher Internship',
  'Durasi Program': 'Program Duration',
  'Lokasi Program': 'Program Location',
  'Biaya Investasi': 'Investment Cost',
  'Kuota Peserta': 'Participant Quota',
  'Persyaratan': 'Requirements',
  'Fasilitas': 'Facilities',
  'Sertifikat Resmi': 'Official Certificate',
  'Modul Pelatihan': 'Training Modules',
  'Makan & Coffee Break': 'Meals & Coffee Break',
  'Akomodasi': 'Accommodation',

  // Data Mitra
  'Direktori Sekolah Mitra': 'Partner School Directory',
  'Data Sekolah': 'School Data',
  'Nama Sekolah': 'School Name',
  'Kode Sekolah': 'School Code',
  'Jenjang': 'Level',
  'Kepala Sekolah': 'Principal',
  'Jumlah Guru': 'Teacher Count',
  'Jumlah Siswa': 'Student Count',
  'Alamat': 'Address',
  'Alamat Kantor': 'Office Address',
  'Kota / Kabupaten': 'City / Regency',
  'Provinsi': 'Province',
  'No. Telepon': 'Phone Number',
  'Email Sekolah': 'School Email',
  'Tanggal Bergabung': 'Join Date',
  'Masa Berlaku Lisensi': 'License Expiration',
  'Sekolah Afiliasi': 'Affiliated School',
  'Sekolah Mandiri': 'Independent School',

  // Performance MenDAKI
  'Evaluasi MenDAKI': 'MenDAKI Evaluation',
  'MenDAKI (Mendampingi, Menilai, Mengembangkan)': 'MenDAKI (Mentoring, Assessing, Developing)',
  'Form Evaluasi': 'Evaluation Form',
  'Form Refleksi': 'Reflection Form',
  'Aspek Penilaian': 'Assessment Aspects',
  'Skor Mutu': 'Quality Score',
  'Tindak Lanjut Rekomendasi': 'Follow-Up Recommendations',
  'Sangat Baik': 'Excellent',
  'Baik': 'Good',
  'Cukup': 'Fair',
  'Perlu Perbaikan': 'Needs Improvement',
  'Saran & Masukan': 'Suggestions & Feedback',

  // Settings
  'Pengaturan Aplikasi': 'App Settings',
  'Identitas Aplikasi': 'App Identity',
  'Bahasa & Lokalisasi': 'Language & Localization',
  'Profil Lembaga & Kontak': 'Institution Profile & Contact',
  'Profil Lembaga Pengelola & Layanan Bantuan': 'Institution Profile & Support Services',
  'Notifikasi & Peringatan': 'Notifications & Alerts',
  'Sistem & Database': 'System & Database',
  'Pengaturan Bahasa & Format Lokalisasi': 'Language & Localization Settings',
  'Bahasa Utama Antarmuka (Interface Language)': 'Interface Language',
  'Bahasa Indonesia': 'Indonesian',
  'English (Global)': 'English (Global)',
  'Standar bahasa resmi seluruh modul dan pelaporan Lazuardi.': 'Official language standard for all Lazuardi modules and reports.',
  'Interface elements with English localization.': 'Interface elements with English localization.',
  'Default Tahun Ajaran Aktif': 'Default Active Academic Year',
  'Format Mata Uang': 'Currency Format',
  'Format Tampilan Tanggal': 'Date Display Format',
  'Nama Badan / Kantor Pengelola': 'Managing Organization / Office Name',
  'Email Hotline / Support': 'Hotline / Support Email',
  'WhatsApp Hotline': 'WhatsApp Hotline',
  'Jam Operasional Layanan': 'Service Operating Hours',
  'Kembalikan ke Setelan Pabrik': 'Restore to Factory Defaults',
  'Pengaturan aplikasi berhasil disimpan': 'App settings successfully saved',

  // Months
  'Januari': 'January',
  'Februari': 'February',
  'Maret': 'March',
  'April': 'April',
  'Mei': 'May',
  'Juni': 'June',
  'Juli': 'July',
  'Agustus': 'August',
  'September': 'September',
  'Oktober': 'October',
  'November': 'November',
  'Desember': 'December',

  // Days
  'Senin': 'Monday',
  'Selasa': 'Tuesday',
  'Rabu': 'Wednesday',
  'Kamis': 'Thursday',
  'Jumat': 'Friday',
  'Sabtu': 'Saturday',
  'Minggu': 'Sunday',

  // Dashboard & Metrics
  'Total Mitra Sekolah': 'Total Partner Schools',
  'Siswa': 'Students',
  'Murid': 'Students',
  'Perlu Review': 'Needs Review',
  'Dalam Proses': 'In Progress',
  'Total laporan terdaftar': 'Total registered reports',
  'Status Kewajiban': 'Obligation Status',
  'Tagihan & Piutang': 'Invoices & Receivables',
  'Khusus Pelaporan': 'Reporting Only',
  'Selamat Datang': 'Welcome',
  'Kelola Invoice': 'Manage Invoices',
  'Cek Tagihan': 'Check Invoices',
  'Data & Profil Sekolah': 'School Data & Profile',
  'Kelola & Edit Data Sekolah': 'Manage & Edit School Data',
  'Pimpinan Sekolah': 'School Leadership',
  'Jenjang & Murid': 'Level & Students',
  'Alamat & Wilayah': 'Address & Region',
  'Kontak Operasional': 'Operational Contact',
  'Buka direktori mitra': 'Open partner directory',
  'Mitra Office Administrator Hub': 'Mitra Office Administrator Hub',
  'Sekolah Mitra Portal': 'Partner School Portal',
  'Aktivitas Terkini': 'Recent Activities',
  'Statistik Ringkasan': 'Summary Statistics',
  'Grafik Pembayaran': 'Payment Chart',
  'Kepatuhan Pelaporan': 'Reporting Compliance',
  'Jadwal Agenda Terdekat': 'Upcoming Agenda Schedule',
  'Permintaan Menunggu Tindakan': 'Requests Pending Action',

  // Invoices & Payments Additional
  'Tagihan Bulanan & Piutang Berjalan': 'Monthly Bills & Ongoing Receivables',
  'Rincian Kewajiban': 'Obligations Details',
  'Total Pembayaran Diterima': 'Total Payments Received',
  'Sisa Piutang Berjalan Saat Ini': 'Current Outstanding Receivables',
  'Pilih Sekolah Mitra': 'Select Partner School',
  'Nominal Pembayaran Diterima': 'Payment Amount Received',
  'Tanggal Pembayaran': 'Payment Date',
  'Bank Tujuan': 'Destination Bank',
  'Kirim Bukti Pembayaran': 'Submit Payment Proof',
  'Simpan Transaksi': 'Save Transaction',
  'Daftar Invoice': 'Invoice List',
  'Semua Tagihan': 'All Bills',
  'Piutang Berjalan': 'Current Receivables',
  'Tagihan Lunas': 'Paid Invoices',
  'Belum Terbayar': 'Unpaid',
  'Konfirmasi Pembayaran': 'Payment Confirmation',
  'Rencana Pembayaran Cicilan': 'Installment Payment Plan',
  'Rencana Angsuran': 'Installment Plan',
  'Simulasi Alokasi Pembayaran': 'Payment Allocation Simulation',
  'Tercatat di sistem': 'Recorded in system',
  'Jumlah Tagihan': 'Invoice Amount',
  'Sudah Dibayar': 'Already Paid',
  'Sisa Tagihan': 'Remaining Bill',
  'Potongan Cicilan': 'Installment Deduction',
  'Alokasi Cicilan': 'Installment Allocation',
  'Sisa Setelah Cicilan': 'Balance After Installment',
  'Status Akhir': 'Final Status',
  'Cicilan Berjalan': 'Ongoing Installment',
  'Sisa Hutang': 'Remaining Debt',
  'Total Hutang Berjalan': 'Total Outstanding Debt',
  'Nominal Transfer': 'Transfer Amount',
  'Bukti Transfer': 'Transfer Proof',
  'Lihat Bukti': 'View Proof',
  'Catatan Pembayaran': 'Payment Notes',
  'Riwayat Cicilan': 'Installment History',
  'Tambah Invoice Manual': 'Add Manual Invoice',
  'Eksekusi Alokasi': 'Execute Allocation',

  // Logistics & Requests Additional
  'Daftar Permintaan Logistik': 'Logistics Request List',
  'Ajukan Kebutuhan': 'Request Items',
  'Status Pengiriman': 'Shipping Status',
  'Catatan Admin': 'Admin Notes',
  'Disposisi': 'Disposition',
  'Rincian Permintaan': 'Request Details',
  'Kirim Barang': 'Ship Items',
  'Nomor Resi': 'Tracking Number',
  'Kurir Pengiriman': 'Shipping Courier',
  'Diterima Sekolah': 'Received by School',

  // Programs Additional
  'Program Pelatihan & Visitasi': 'Training & Visitation Programs',
  'Daftar Program Tersedia': 'Available Programs List',
  'Ajukan Keikutsertaan': 'Apply for Participation',
  'Riwayat Keikutsertaan': 'Participation History',
  'Status Pendaftaran': 'Registration Status',
  'Peserta Terdaftar': 'Registered Participants',
  'Unduh Sertifikat': 'Download Certificate',

  // Events Additional
  'Daftar Kegiatan & Agenda': 'Activities & Agenda List',
  'Kalender Bulan Ini': 'This Month Calendar',
  'Tambah Agenda': 'Add Agenda',
  'Isi Evaluasi': 'Fill Evaluation',
  'Lihat Agenda': 'View Agenda',
  'Lokasi Acara': 'Event Location',
  'Waktu Mulai': 'Start Time',
  'Waktu Selesai': 'End Time',

  // MenDAKI Additional
  'Refleksi Diri & Penilaian Mutu': 'Self-Reflection & Quality Assessment',
  'Laporan Hasil Evaluasi': 'Evaluation Results Report',
  'Nilai Rata-rata': 'Average Score',
  'Tahun Akademik': 'Academic Year',
  'Semester': 'Semester',
  'Aspek Pembelajaran': 'Learning Aspects',
  'Aspek Kepemimpinan': 'Leadership Aspects',
  'Aspek Budaya Sekolah': 'School Culture Aspects',

  // Templates & Files Additional
  'Kategori Dokumen': 'Document Category',
  'Format File': 'File Format',
  'Ukuran': 'Size',
  'Tanggal Update': 'Update Date',
  'Unduh File': 'Download File',
  'Daftar Berkas Resmi': 'Official Files Directory',

  // Common UI words
  'Ya': 'Yes',
  'Tidak': 'No',
  'Bulan': 'Month',
  'Tahun': 'Year',
  'Hari': 'Day',
  'Waktu': 'Time',
  'Tanggal': 'Date',
  'Kategori': 'Category',
  'Keterangan': 'Notes / Description',
  'Catatan': 'Notes',
  'Total': 'Total',
  'Jumlah': 'Amount',
  'Informasi': 'Information',
  'Pemberitahuan': 'Notice',
  'Sukses': 'Success',
  'Gagal': 'Failed',
  'Peringatan': 'Warning',
  'Konfirmasi': 'Confirmation',
  'Tidak ada data': 'No data available',
  'Belum ada data': 'No data yet',
  'Data tidak ditemukan': 'Data not found',
  'Memuat...': 'Loading...',
  'Menyimpan...': 'Saving...',
  'Sinkronisasi Otomatis': 'Auto Sync',
  'Tersinkronisasi': 'Synchronized',
  'Belum Tersinkronisasi': 'Not Synchronized',
  'Wajib diisi': 'Required',
  'Pilihan': 'Options',
  'Menu Platform': 'Platform Menu',
  'Keluar dari sesi': 'Logout of session',
  'Akses Terbatas Guru': 'Teacher Limited Access',
  'Akses Terbatas': 'Limited Access',
  'Buka Pengaturan Sistem, Bahasa & Logo': 'Open System, Language & Logo Settings',
  'Pilihan Bahasa / Language Options': 'Interface Language Options',
  'Ganti Bahasa Antarmuka ke Bahasa Indonesia': 'Switch Interface Language to Indonesian',
  'Switch Interface Language to English': 'Switch Interface Language to English',
};

// Sorted dictionary keys by descending length for greedy matching
const SORTED_KEYS_DESC = Object.keys(ID_TO_EN_DICTIONARY).sort((a, b) => b.length - a.length);

/**
 * Translates a single text string from Indonesian to English if language is 'en'.
 * If targetLang is 'id', returns the original text.
 */
export function translateText(text: string, targetLang: 'id' | 'en'): string {
  if (targetLang === 'id' || !text) {
    return text;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }

  // 1. Exact match in dictionary
  if (ID_TO_EN_DICTIONARY[trimmed]) {
    const translation = ID_TO_EN_DICTIONARY[trimmed];
    // Preserve leading and trailing whitespace
    const leadingSpace = text.match(/^\s*/)?.[0] || '';
    const trailingSpace = text.match(/\s*$/)?.[0] || '';
    return leadingSpace + translation + trailingSpace;
  }

  // 2. Case-insensitive exact match
  const lowerTrimmed = trimmed.toLowerCase();
  for (const key of SORTED_KEYS_DESC) {
    if (key.toLowerCase() === lowerTrimmed) {
      const translation = ID_TO_EN_DICTIONARY[key];
      const leadingSpace = text.match(/^\s*/)?.[0] || '';
      const trailingSpace = text.match(/\s*$/)?.[0] || '';
      return leadingSpace + translation + trailingSpace;
    }
  }

  // 3. Dynamic patterns (e.g., "12 invoice belum terbayar", "TA 2026/2027")
  let result = text;

  // Pattern: "X invoice belum terbayar"
  result = result.replace(/(\d+)\s+invoice belum terbayar/gi, '$1 unpaid invoices');
  // Pattern: "X invoice lunas"
  result = result.replace(/(\d+)\s+invoice lunas/gi, '$1 paid invoices');
  // Pattern: "TA 20" (Tahun Ajaran)
  result = result.replace(/\bTA\s+(20\d\d\/20\d\d)/gi, 'AY $1');
  // Pattern: "Tercatat di sistem: "
  result = result.replace(/Tercatat di sistem:\s*/gi, 'Recorded in system: ');
  // Pattern: "Sisa tagihan: "
  result = result.replace(/Sisa tagihan:\s*/gi, 'Remaining bill: ');
  // Pattern: "Total tagihan: "
  result = result.replace(/Total tagihan:\s*/gi, 'Total invoiced: ');
  // Pattern: "Total piutang: "
  result = result.replace(/Total piutang:\s*/gi, 'Total receivables: ');
  // Pattern: "Belum lunas"
  result = result.replace(/Belum lunas/gi, 'Unpaid');
  // Pattern: "Sudah lunas"
  result = result.replace(/Sudah lunas/gi, 'Fully paid');
  // Pattern: "Cicilan ke-"
  result = result.replace(/Cicilan ke-(\d+)/gi, 'Installment #$1');

  // 4. Key phrase replacement for longer text strings
  // Replace prominent whole-phrase matches without breaking words
  for (const key of SORTED_KEYS_DESC) {
    // Only attempt substring replacement for multi-word or long key phrases (> 4 chars)
    if (key.length >= 4 && result.includes(key)) {
      result = result.split(key).join(ID_TO_EN_DICTIONARY[key]);
    }
  }

  return result;
}

/**
 * Hook or function to translate dynamic strings directly in React components.
 */
export function t(text: string, lang: 'id' | 'en' = 'id'): string {
  return translateText(text, lang);
}

// Global registry of original text for DOM text nodes to enable clean reversal
const originalTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

/**
 * Walks and translates the active DOM tree when language is changed.
 * Restores original Indonesian text when switched back to 'id'.
 */
export function translateDOM(container: Element | Document, targetLang: 'id' | 'en'): void {
  if (typeof window === 'undefined' || !container) return;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tag = parent.tagName.toLowerCase();
        // Skip scripts, styles, code blocks, active text inputs
        if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre') {
          return NodeFilter.FILTER_REJECT;
        }

        // Do not alter value inside user-typing input elements
        if (tag === 'textarea' || (tag === 'input' && parent === document.activeElement)) {
          return NodeFilter.FILTER_REJECT;
        }

        const val = node.nodeValue?.trim();
        if (!val || val.length === 0) {
          return NodeFilter.FILTER_SKIP;
        }

        // Skip pure numeric or currency amounts without words
        if (/^[0-9.,:\-+/\\()%\sRp]+$/.test(val) && !val.includes('invoice') && !val.includes('TA')) {
          return NodeFilter.FILTER_SKIP;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  for (const node of textNodes) {
    const currentVal = node.nodeValue || '';
    let orig = originalTextMap.get(node);

    if (orig === undefined) {
      orig = currentVal;
      originalTextMap.set(node, orig);
    } else {
      // If node value changed and is not the translated text, React re-rendered with new content
      const lastTranslated = translateText(orig, 'en');
      if (currentVal !== orig && currentVal !== lastTranslated) {
        orig = currentVal;
        originalTextMap.set(node, orig);
      }
    }

    if (targetLang === 'en') {
      const translated = translateText(orig, 'en');
      if (translated !== node.nodeValue) {
        node.nodeValue = translated;
      }
    } else {
      if (node.nodeValue !== orig) {
        node.nodeValue = orig;
      }
    }
  }

  // Also translate element placeholders, titles, aria-labels
  const elementsWithAttrs = container.querySelectorAll<HTMLElement>('[placeholder], [title], [aria-label]');
  elementsWithAttrs.forEach(el => {
    let savedAttrs = originalAttrMap.get(el);
    if (!savedAttrs) {
      savedAttrs = {};
      if (el.hasAttribute('placeholder')) savedAttrs['placeholder'] = el.getAttribute('placeholder') || '';
      if (el.hasAttribute('title')) savedAttrs['title'] = el.getAttribute('title') || '';
      if (el.hasAttribute('aria-label')) savedAttrs['aria-label'] = el.getAttribute('aria-label') || '';
      originalAttrMap.set(el, savedAttrs);
    }

    ['placeholder', 'title', 'aria-label'].forEach(attr => {
      if (savedAttrs![attr] !== undefined) {
        const origAttr = savedAttrs![attr];
        if (targetLang === 'en') {
          const transAttr = translateText(origAttr, 'en');
          el.setAttribute(attr, transAttr);
        } else {
          el.setAttribute(attr, origAttr);
        }
      }
    });
  });
}
