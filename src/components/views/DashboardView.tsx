import React from 'react';
import { 
  School, 
  FileText, 
  Receipt, 
  CreditCard, 
  CalendarDays, 
  Package, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ActiveNavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface DashboardViewProps {
  onNavigate: (tab: ActiveNavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    sekolahList, 
    laporanList, 
    invoiceList, 
    pembayaranList, 
    eventList, 
    permintaanList, 
    performanceList,
    lastSyncTime
  } = useData();

  // Filter if logged in as school mitra
  const mySchoolId = currentUser?.sekolahId;
  const filteredLaporan = isAdmin ? laporanList : laporanList.filter(l => l.mitraId === mySchoolId);
  const filteredInvoices = isAdmin ? invoiceList : invoiceList.filter(i => i.mitraId === mySchoolId);
  const filteredPembayaran = isAdmin ? pembayaranList : pembayaranList.filter(p => p.mitraId === mySchoolId);
  const filteredPermintaan = isAdmin ? permintaanList : permintaanList.filter(p => p.mitraId === mySchoolId);
  const filteredPerf = isAdmin ? performanceList : performanceList.filter(p => p.mitraId === mySchoolId);

  // Statistics
  const totalSiswa = sekolahList.reduce((acc, s) => acc + s.jumlahSiswa, 0);
  const totalUnpaidNominal = filteredInvoices
    .filter(i => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo')
    .reduce((acc, i) => acc + i.nominal, 0);

  const pendingLaporanCount = filteredLaporan.filter(l => l.status === 'Diajukan' || l.status === 'Direview').length;
  const pendingPaymentCount = filteredPembayaran.filter(p => p.status === 'Menunggu Verifikasi').length;
  const upcomingEventsCount = eventList.filter(e => e.status === 'Direncanakan' || e.status === 'Berjalan').length;
  const activeRequestsCount = filteredPermintaan.filter(r => r.status === 'Diajukan' || r.status === 'Diproses' || r.status === 'Dikirim').length;

  const avgMenDaki = performanceList.length > 0 
    ? (performanceList.reduce((acc, p) => acc + p.totalSkor, 0) / performanceList.length).toFixed(1)
    : '0.0';

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-48 h-48 rounded-full bg-indigo-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold text-blue-200">
              {isAdmin ? <ShieldCheck size={14} className="text-amber-400" /> : <Building2 size={14} className="text-sky-300" />}
              <span>{isAdmin ? 'Mitra Office Administrator Hub' : 'Sekolah Mitra Portal'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {currentUser?.nama}
            </h2>
            <p className="text-blue-100/90 text-sm max-w-2xl leading-relaxed">
              {isAdmin 
                ? 'Kelola seluruh koordinasi, administrasi, validasi pembayaran, dan evaluasi MenDAKI 9 sekolah mitra aktif Lazuardi secara terpusat.'
                : `Akses status administrasi, laporan bulanan, invoice resmi, dan pengajuan seragam/dokumen untuk ${currentUser?.nama}.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              id="dash-btn-laporan"
              onClick={() => onNavigate('laporan-bulanan')}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={15} />
              <span>{isAdmin ? 'Review Laporan' : 'Submit Laporan'}</span>
            </button>
            <button
              id="dash-btn-invoice"
              onClick={() => onNavigate('invoice')}
              className="px-4 py-2.5 rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white text-xs font-bold border border-blue-400/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt size={15} />
              <span>{isAdmin ? 'Kelola Invoice' : 'Cek Tagihan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Data Mitra / Siswa */}
        <div 
          onClick={() => onNavigate('data-mitra')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total Mitra Sekolah' : 'Data Sekolah'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <School size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {isAdmin ? sekolahList.length : '1 Sekolah'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {isAdmin ? `(${totalSiswa.toLocaleString()} Siswa)` : 'Aktif'}
            </span>
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-2 flex items-center gap-1">
            <span>Buka direktori mitra</span>
            <ArrowUpRight size={12} />
          </p>
        </div>

        {/* KPI 2: Laporan Bulanan Pending */}
        <div 
          onClick={() => onNavigate('laporan-bulanan')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Laporan Bulanan
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <FileText size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {pendingLaporanCount}
            </span>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
              {isAdmin ? 'Perlu Review' : 'Dalam Proses'}
            </span>
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-2 flex items-center gap-1">
            <span>{filteredLaporan.length} Total laporan terdaftar</span>
            <ArrowUpRight size={12} />
          </p>
        </div>

        {/* KPI 3: Invoice & Piutang */}
        <div 
          onClick={() => onNavigate('invoice')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tagihan & Piutang
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <Receipt size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-black text-rose-600 truncate">
              {formatRupiah(totalUnpaidNominal)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{filteredInvoices.filter(i => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo').length} invoice belum selesai</span>
            <ArrowUpRight size={12} className="text-rose-600" />
          </p>
        </div>

        {/* KPI 4: MenDAKI Score */}
        <div 
          onClick={() => onNavigate('performance-mendaki')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-rata MenDAKI
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              {avgMenDaki}
            </span>
            <span className="text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
              Predikat A/B
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
            <span>5 Pilar Mutu Lazuardi</span>
            <ArrowUpRight size={12} />
          </p>
        </div>
      </div>

      {/* Middle Layout: Upcoming Agenda & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Invoices & Payments Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Item Nav Cards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Status Ringkas Item Navigasi L-MAP
                </h3>
                <p className="text-xs text-slate-500">
                  Pantau seluruh aliran berkas dan permohonan operasional mitra
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Real-time Sync
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Box 1: Invoice & Pembayaran */}
              <button
                id="dash-quick-pembayaran"
                onClick={() => onNavigate('invoice')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <CreditCard size={18} />
                  {pendingPaymentCount > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                      {pendingPaymentCount}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-800">Invoice & Pembayaran</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {pendingPaymentCount > 0 ? `${pendingPaymentCount} butuh cek` : 'Franchise, Renewal, Piutang'}
                </p>
              </button>

              {/* Box 2: Event Tracker */}
              <button
                id="dash-quick-events"
                onClick={() => onNavigate('event-tracker')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-left transition"
              >
                <div className="flex items-center justify-between text-indigo-600 mb-2">
                  <CalendarDays size={18} />
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded-full">
                    {upcomingEventsCount}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Event Tracker</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Agenda terdekat</p>
              </button>

              {/* Box 3: Permintaan Mitra */}
              <button
                id="dash-quick-permintaan"
                onClick={() => onNavigate('permintaan-mitra')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-left transition"
              >
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <Package size={18} />
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                    {activeRequestsCount}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Permintaan</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Seragam & Cetak</p>
              </button>

              {/* Box 4: Staff Activity */}
              <button
                id="dash-quick-staff"
                onClick={() => onNavigate('staff-activity')}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-left transition"
              >
                <div className="flex items-center justify-between text-amber-600 mb-2">
                  <Clock size={18} />
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                    GCal
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">Staff Activity</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Supervisi & GCal</p>
              </button>
            </div>
          </div>

          {/* Pending Action List (Laporan & Invoices) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {isAdmin ? 'Laporan & Tagihan Memerlukan Perhatian' : 'Status Tagihan & Laporan Sekolah Anda'}
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar transaksi dan dokumen yang aktif
                </p>
              </div>
              <button
                onClick={() => onNavigate('invoice')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredInvoices.slice(0, 3).map((inv) => (
                <div 
                  key={inv.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                      inv.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'Jatuh Tempo' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      <Receipt size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{inv.namaSekolah}</span>
                        <span className="text-[10px] font-mono text-slate-500">#{inv.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{inv.kategori} • {inv.keterangan}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {formatRupiah(inv.nominal)}
                    </div>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      inv.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' :
                      inv.status === 'Jatuh Tempo' ? 'bg-rose-100 text-rose-700 font-bold' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Agenda & Templates shortcut */}
        <div className="space-y-6">
          {/* Upcoming Events Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Agenda Mitra Terdekat</h3>
              </div>
              <button
                onClick={() => onNavigate('event-tracker')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Kalender
              </button>
            </div>

            <div className="space-y-3">
              {eventList.slice(0, 3).map((evt) => (
                <div key={evt.id} className="p-3 rounded-xl border border-slate-100 bg-blue-50/30">
                  <div className="flex items-center justify-between text-[11px] text-blue-700 font-semibold mb-1">
                    <span>{evt.tanggal} • {evt.waktu}</span>
                    <span className="text-[10px] bg-blue-100 px-1.5 py-0.2 rounded font-medium">{evt.kategori}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {evt.judul}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>PIC: {evt.pic}</span>
                    <span className="text-blue-600 font-medium truncate max-w-[130px]">{evt.mitraPeserta}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dokumen & Template Terpopuler */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Template & SOP Utama</h3>
              <button
                onClick={() => onNavigate('template')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Semua Link
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Tautan format laporan bulanan dan parent handbook resmi
            </p>

            <div className="space-y-2">
              <a 
                href="https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/template/preview"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-between text-xs transition"
              >
                <span className="font-semibold text-slate-800 truncate">Template Format Laporan Bulanan</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">DOCX</span>
              </a>

              <a 
                href="https://drive.google.com/file/d/1Parent-Handbook-Lazuardi/view"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-between text-xs transition"
              >
                <span className="font-semibold text-slate-800 truncate">Parent Handbook 2026/2027</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">PDF</span>
              </a>

              <a 
                href="https://drive.google.com/file/d/1SOP-Jenjang-Baru-Lazuardi/view"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 flex items-center justify-between text-xs transition"
              >
                <span className="font-semibold text-slate-800 truncate">SOP Pembukaan Jenjang Baru</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">SOP</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
