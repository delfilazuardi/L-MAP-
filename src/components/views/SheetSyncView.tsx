import React, { useState } from 'react';
import { 
  Table, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Database, 
  Cloud, 
  Copy, 
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { exportAllToCsv } from '../../lib/sheetsSync';
import { InputSheetInvoicePembayaranModal } from '../modals/InputSheetInvoicePembayaranModal';
import { HISTORICAL_TRANSACTIONS_SINCE_2022 } from '../../lib/historicalSheetData';

export const SheetSyncView: React.FC = () => {
  const { 
    isFirebaseConnected, 
    isSyncing, 
    lastSyncTime, 
    syncWithGoogleSheet, 
    reseedDefaultData,
    loadHistoricalTransactionsSince2022,
    sekolahList,
    laporanList,
    invoiceList,
    pembayaranList
  } = useData();

  const [sheetUrl, setSheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/1XyZ_LazuardiMitraOfficeMasterData2026/export?format=csv'
  );
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activePreviewTable, setActivePreviewTable] = useState<'sekolah' | 'laporan' | 'invoice' | 'pembayaran'>('sekolah');
  const [isCopied, setIsCopied] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  const handleSync = async () => {
    setSyncStatusMsg(null);
    try {
      const result = await syncWithGoogleSheet(sheetUrl);
      if (result.success) {
        setSyncStatusMsg({
          type: 'success',
          text: `Berhasil tersinkronisasi! ${result.count || 0} entitas data Mitra Office berhasil diproses dan disimpan ke Firebase Firestore.`
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: `Gagal sinkronisasi: ${result.message || 'Cek format link publik Google Sheet (CSV export).'}`
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: `Error jaringan: ${err.message}`
      });
    }
  };

  const handleExportCsv = () => {
    const csvData = exportAllToCsv({
      sekolahList,
      laporanList,
      invoiceList,
      pembayaranList,
    });

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LMAP_Data_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(sheetUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Table size={22} className="text-blue-600" />
          <span>Sinkronisasi Google Sheets & Firebase Firestore</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Integrasi dua arah antara Google Spreadsheet operasional dan database awan Firebase Real-Time
        </p>
      </div>

      {/* Cloud & Sync Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Firebase Live Status */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Cloud size={24} className="text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Database Firebase Firestore</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isFirebaseConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isFirebaseConnected ? 'Aktif & Terhubung' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Semua perubahan data laporan, invoice, pembayaran, dan log aktivitas tersimpan otomatis ke Cloud Firestore sehingga seluruh pengguna dapat melihat update seketika.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 font-mono">
              Terakhir Sinkron: {lastSyncTime}
            </div>
          </div>
        </div>

        {/* Google Sheet API Sync */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <FileSpreadsheet size={24} className="text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Google Sheets API Connector</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                CSV / Sheets v4
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tarik data master sekolah dan transaksi dari Google Sheet atau ekspor seluruh database sistem ke format spreadsheet standar.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download size={13} />
                <span>Unduh CSV Backup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORICAL TRANSACTIONS SEJAK 2022 SPECIAL CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-800/40">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold tracking-wide uppercase">
            <FileSpreadsheet size={13} />
            <span>Migrasi Sheet Transaksi Sejak 2022</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white">
            Input Sheet Invoice & Pembayaran (Tahun 2022 s/d Sekarang)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sinkronkan rekaman invoice tagihan dan list payment sekolah mitra yang telah berjalan sejak tahun 2022 hingga 2026. Anda dapat menyalin baris dari Google Sheets, mengunggah berkas CSV, atau memuat langsung dataset komprehensif 28 transaksi historis.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-blue-200 font-medium">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>{invoiceList.length} Invoice Aktif di Sistem</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-200 font-medium">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>{pembayaranList.length} Pembayaran / Payment List Terisi</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
          <button
            id="btn-open-sheet-invoice-modal"
            onClick={() => setIsSheetModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
          >
            <Upload size={16} />
            <span>Buka Input Sheet Transaksi</span>
          </button>

          <button
            id="btn-quick-load-2022"
            onClick={async () => {
              const res = await loadHistoricalTransactionsSince2022();
              setSyncStatusMsg({
                type: 'success',
                text: `Sukses menerapkan ${res.invoiceCount} invoice dan ${res.paymentCount} pembayaran transaksi sejak tahun 2022 ke dalam database L-MAP.`
              });
            }}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Muat Data Historis 2022 Langsung</span>
          </button>
        </div>
      </div>

      {/* Sync Control Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Form Sinkronisasi Langsung dari Google Spreadsheet
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            URL Google Sheet (Publish to web CSV atau Sheet URL):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              onClick={handleCopyPublicUrl}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Salin URL"
            >
              {isCopied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Format yang didukung: Ekspor CSV Google Sheet publik atau ID spreadsheet terotentikasi.
          </p>
        </div>

        {/* Sync message alert */}
        {syncStatusMsg && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
            syncStatusMsg.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={reseedDefaultData}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Muat ulang dataset awal MO002 - MO012 dari prompt"
          >
            <Database size={14} />
            <span>Reset ke Data Master Awal (MO002 - MO012)</span>
          </button>

          <button
            id="btn-execute-sheet-sync"
            onClick={handleSync}
            disabled={isSyncing}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Data Preview Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pratinjau Data Aktif di Database Cloud
            </h3>
            <p className="text-xs text-slate-500">
              Pilih tabel untuk memeriksa rekaman data yang tersimpan
            </p>
          </div>

          {/* Table switch tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
            {(['sekolah', 'laporan', 'invoice', 'pembayaran'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActivePreviewTable(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  activePreviewTable === tab 
                    ? 'bg-white text-blue-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto max-h-80 scrollbar-thin">
          {activePreviewTable === 'sekolah' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Nama Sekolah</th>
                  <th className="py-2.5 px-4">Alamat</th>
                  <th className="py-2.5 px-4">Pimpinan</th>
                  <th className="py-2.5 px-4">Siswa</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sekolahList.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono font-bold text-blue-600">{s.id}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{s.namaSekolah}</td>
                    <td className="py-2 px-4 text-slate-600 max-w-xs truncate">{s.alamat}</td>
                    <td className="py-2 px-4 text-slate-800">{s.pimpinan}</td>
                    <td className="py-2 px-4 font-bold text-slate-900">{s.jumlahSiswa}</td>
                    <td className="py-2 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{s.statusKerjasama}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTable === 'laporan' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Sekolah Mitra</th>
                  <th className="py-2.5 px-4">Periode</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laporanList.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono text-slate-500">{l.id}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{l.namaSekolah}</td>
                    <td className="py-2 px-4 text-slate-700">{l.bulan} {l.tahun}</td>
                    <td className="py-2 px-4 text-blue-600 font-medium">{l.kategori}</td>
                    <td className="py-2 px-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTable === 'invoice' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">No. Invoice</th>
                  <th className="py-2.5 px-4">Sekolah</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4">Nominal</th>
                  <th className="py-2.5 px-4">Tanggal Kirim</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceList.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono font-bold text-blue-600">{i.id}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{i.namaSekolah}</td>
                    <td className="py-2 px-4 text-slate-700">{i.kategori}</td>
                    <td className="py-2 px-4 font-black text-slate-900">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(i.nominal)}
                    </td>
                    <td className="py-2 px-4 text-slate-600">{i.tanggalKirim || '-'}</td>
                    <td className="py-2 px-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTable === 'pembayaran' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Sekolah</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4">Jumlah</th>
                  <th className="py-2.5 px-4">Tanggal Bayar</th>
                  <th className="py-2.5 px-4">No. Ref</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pembayaranList.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono text-slate-500">{p.id}</td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{p.namaSekolah}</td>
                    <td className="py-2 px-4 text-slate-700">{p.kategori}</td>
                    <td className="py-2 px-4 font-bold text-slate-900">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.jumlah)}
                    </td>
                    <td className="py-2 px-4 text-slate-600">{p.tanggalBayar}</td>
                    <td className="py-2 px-4 font-mono text-slate-500">{p.noReferensi}</td>
                    <td className="py-2 px-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL INPUT SHEET INVOICE & PEMBAYARAN */}
      <InputSheetInvoicePembayaranModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
      />
    </div>
  );
};
