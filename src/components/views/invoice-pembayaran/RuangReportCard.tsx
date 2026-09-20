import React from 'react';
import { 
  Plus, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { RuangConfig, formatRupiah } from './types';

interface RuangReportCardProps {
  config: RuangConfig;
  invoicesCount: number;
  paymentsCount: number;
  tagihanFull: number;
  tagihanRealisasi: number;
  totalDibayar: number;
  sisaPiutang: number;
  persenLunas: number;
  lunasCount: number;
  unpaidCount: number;
  verifiedPaymentsCount: number;
  pendingPaymentsCount: number;
  onAddInvoice: () => void;
  onAddPembayaran: () => void;
  activeView: 'invoices' | 'payments';
  onChangeView: (view: 'invoices' | 'payments') => void;
}

export const RuangReportCard: React.FC<RuangReportCardProps> = ({
  config,
  invoicesCount,
  paymentsCount,
  tagihanFull,
  tagihanRealisasi,
  totalDibayar,
  sisaPiutang,
  persenLunas,
  lunasCount,
  unpaidCount,
  verifiedPaymentsCount,
  pendingPaymentsCount,
  onAddInvoice,
  onAddPembayaran,
  activeView,
  onChangeView,
}) => {
  const Icon = config.icon;

  return (
    <div className={`rounded-3xl border ${config.colors.border} bg-white shadow-md overflow-hidden transition-all duration-200`}>
      {/* Upper Report Header */}
      <div className={`bg-gradient-to-r ${config.colors.headerBg} text-white p-5 sm:p-6 relative overflow-hidden`}>
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${config.colors.iconBg} shrink-0`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {config.title}
                </h3>
                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border bg-white/10 text-white/90 backdrop-blur-xs`}>
                  {config.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {/* Action buttons on report */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={onAddInvoice}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              title={`Tambah Tagihan ${config.id}`}
            >
              <Plus size={14} className="text-blue-600 font-bold" />
              <span>+ Tagihan</span>
            </button>
            <button
              onClick={onAddPembayaran}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title={`Catat Pembayaran ${config.id}`}
            >
              <CreditCard size={14} className="text-amber-400 font-bold" />
              <span>+ Pembayaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid: 4 Core Figures + Collection Progress */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/80">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {/* Metric 1: Tagihan Full */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Tagihan Full (Kotor)
            </span>
            <div className="text-base sm:text-lg font-black text-slate-800 mt-0.5 truncate">
              {formatRupiah(tagihanFull)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Total {invoicesCount} invoice tercatat
            </span>
          </div>

          {/* Metric 2: Realisasi Netto */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Tagihan Realisasi (Netto)
            </span>
            <div className="text-base sm:text-lg font-black text-blue-700 mt-0.5 truncate">
              {formatRupiah(tagihanRealisasi)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Target penerimaan wajib
            </span>
          </div>

          {/* Metric 3: Pembayaran Diterima */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              3. Pembayaran Terverifikasi
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5 truncate">
              {formatRupiah(totalDibayar)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-0.5">
              <CheckCircle2 size={12} />
              <span>{verifiedPaymentsCount} transaksi berhasil</span>
            </div>
          </div>

          {/* Metric 4: Sisa Piutang */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              4. Sisa Piutang Berjalan
            </span>
            <div className={`text-base sm:text-lg font-black mt-0.5 truncate ${
              sisaPiutang > 0 ? 'text-rose-600' : 'text-slate-700'
            }`}>
              {formatRupiah(sisaPiutang)}
            </div>
            <span className={`text-[11px] font-semibold ${sisaPiutang > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {sisaPiutang > 0 ? `${unpaidCount} invoice belum lunas` : 'Semua tagihan lunas!'}
            </span>
          </div>
        </div>

        {/* Progress Bar & Sub-indicators */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} className={config.colors.accentText} />
                <span>Tingkat Pelunasan {config.title}</span>
              </span>
              <span className="font-mono text-sm font-black text-slate-900">
                {persenLunas}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${config.colors.progressBar} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(0, persenLunas))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4 shrink-0">
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-bold text-emerald-600">{lunasCount}</span>
              <span>Lunas</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-bold text-rose-600">{unpaidCount}</span>
              <span>Tertunda</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-slate-600">
              <span className="font-bold text-amber-600">{pendingPaymentsCount}</span>
              <span>Cek Bukti</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector: [Daftar Invoice & Tagihan] vs [Riwayat Pembayaran & Bukti] */}
      <div className="px-5 py-3 bg-white flex items-center justify-between border-b border-slate-200/80 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeView('invoices')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeView === 'invoices'
                ? `${config.colors.pillActive}`
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Receipt size={14} />
            <span>Daftar Tagihan & Invoice</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeView === 'invoices' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {invoicesCount}
            </span>
          </button>

          <button
            onClick={() => onChangeView('payments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeView === 'payments'
                ? `${config.colors.pillActive}`
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CreditCard size={14} />
            <span>Riwayat & Bukti Pembayaran</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeView === 'payments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {paymentsCount}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Menampilkan data item ruang {config.title}
        </span>
      </div>
    </div>
  );
};
