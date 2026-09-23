import React, { useState, useId } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  History, 
  Database,
  ArrowRight,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { parseInvoicePaymentSheetData, getInvoicePaymentSheetTemplateCSV } from '../../lib/sheetsSync';
import { HISTORICAL_TRANSACTIONS_SINCE_2022, convertHistoricalToCSV } from '../../lib/historicalSheetData';
import { Invoice, Pembayaran } from '../../types';

interface InputSheetInvoicePembayaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'paste' | 'preset' | 'template';
}

export const InputSheetInvoicePembayaranModal: React.FC<InputSheetInvoicePembayaranModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'preset',
}) => {
  const modalId = useId();
  const { bulkImportInvoiceAndPayment, invoiceList, pembayaranList } = useData();

  const [activeTab, setActiveTab] = useState<'preset' | 'paste' | 'template'>(defaultTab);
  const [inputText, setInputText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Preview state
  const [previewInvoices, setPreviewInvoices] = useState<Invoice[]>([]);
  const [previewPayments, setPreviewPayments] = useState<Pembayaran[]>([]);
  const [filterYear, setFilterYear] = useState<string>('ALL');

  if (!isOpen) return null;

  const formatRupiah = (val: number) => {
    const hasDecimals = val % 1 !== 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(val || 0);
  };

  // Muat preset historis sejak 2022 ke input / preview
  const handleLoadHistoricalPreset = () => {
    const csv = convertHistoricalToCSV();
    setInputText(csv);
    const parsed = parseInvoicePaymentSheetData(csv);
    setPreviewInvoices(parsed.invoices);
    setPreviewPayments(parsed.pembayaran);
    setStatusMessage({
      type: 'info',
      text: `Berhasil memuat dataset historis transaksi sejak 2022: ${parsed.invoices.length} invoice dan ${parsed.pembayaran.length} record pembayaran siap diterapkan.`,
    });
  };

  // Parse input manual
  const handleParseInput = (textToParse: string) => {
    if (!textToParse.trim()) {
      setPreviewInvoices([]);
      setPreviewPayments([]);
      setStatusMessage(null);
      return;
    }

    try {
      const parsed = parseInvoicePaymentSheetData(textToParse);
      setPreviewInvoices(parsed.invoices);
      setPreviewPayments(parsed.pembayaran);

      if (parsed.invoices.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Tidak ada baris data invoice yang valid ditemukan. Pastikan format tabel memiliki baris header.',
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: `Terdeteksi ${parsed.invoices.length} baris invoice dan ${parsed.pembayaran.length} pembayaran tervalidasi.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal membaca format data: ${err.message || 'Error tidak diketahui'}`,
      });
    }
  };

  // Handle file drop/upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        handleParseInput(content);
      }
    };
    reader.readAsText(file);
  };

  // Salin template ke clipboard
  const handleCopyTemplate = () => {
    const template = getInvoicePaymentSheetTemplateCSV();
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  // Eksekusi Simpan ke Database
  const handleApplyToDatabase = async () => {
    if (previewInvoices.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Tidak ada data untuk disimpan. Silakan klik "Muat Data Transaksi 2022-2026" atau paste data sheet terlebih dahulu.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await bulkImportInvoiceAndPayment(previewInvoices, previewPayments, importMode);
      setStatusMessage({
        type: 'success',
        text: `Sukses! Berhasil menyinkronkan ${res.invoiceCount} invoice dan ${res.paymentCount} pembayaran ke sistem L-MAP.`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Terjadi kendala saat menyimpan: ${err.message || 'Error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter preview by year if needed
  const displayedPreviewInvoices = previewInvoices.filter(inv => {
    if (filterYear === 'ALL') return true;
    return inv.nomorInvoice.includes(filterYear) || inv.tahunAjaran.includes(filterYear) || inv.tanggalKirim.startsWith(filterYear);
  });

  const totalTagihanRealisasi = displayedPreviewInvoices.reduce((acc, curr) => acc + (curr.tagihanRealisasi || 0), 0);
  const totalDanaMasuk = displayedPreviewInvoices.reduce((acc, curr) => acc + (curr.nominalPembayaran || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id={`modal-${modalId}`}
        className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Input Sheet Invoice & Pembayaran (Sejak 2022)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/20">
                  Sinkronisasi Otomatis
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Pengisian massal data tagihan invoice sekaligus riwayat list payment sekolah mitra sejak tahun 2022
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <button
            id="tab-btn-preset-2022"
            onClick={() => {
              setActiveTab('preset');
              if (previewInvoices.length === 0) handleLoadHistoricalPreset();
            }}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'preset' ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold' : 'hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            <History size={14} className="text-blue-600" />
            <span>Data Transaksi 2022 - 2026</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">28 Record</span>
          </button>

          <button
            id="tab-btn-paste-sheet"
            onClick={() => setActiveTab('paste')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'paste' ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold' : 'hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            <Upload size={14} className="text-blue-600" />
            <span>Paste / Upload Sheet CSV</span>
          </button>

          <button
            id="tab-btn-template"
            onClick={() => setActiveTab('template')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'template' ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold' : 'hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            <Copy size={14} className="text-blue-600" />
            <span>Format Kolom Google Sheets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs font-medium animate-in fade-in duration-150 ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              statusMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> :
               statusMessage.type === 'error' ? <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" /> :
               <Database size={16} className="text-blue-600 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <span>{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* TAB 1: PRESET HISTORIS 2022-2026 */}
          {activeTab === 'preset' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History size={16} className="text-blue-600" />
                    <span>Rekam Jejak Transaksi Invoice & Pembayaran (2022 s/d 2026)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data mencakup seluruh sekolah mitra Lazuardi: Al-Falah Depok, Cordova, Ibnu Sina, Ideal, Tursina, Klaten, Haura, Kamila, & SMA Lazuardi.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-muat-preset-historis"
                    type="button"
                    onClick={handleLoadHistoricalPreset}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Muat Ulang Data 2022-2026</span>
                  </button>
                </div>
              </div>

              {/* Info highlight */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Total Invoice Sejak 2022</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">{HISTORICAL_TRANSACTIONS_SINCE_2022.length} Dokumen</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">List Payment Terisi</span>
                  <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                    {HISTORICAL_TRANSACTIONS_SINCE_2022.filter(h => h.nominalPembayaran > 0).length} Setoran Bank
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Rentang Tahun</span>
                  <span className="text-base font-bold text-blue-700 mt-0.5 block">2022 s/d 2026</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 block uppercase">Format Nomor Invoice</span>
                  <span className="text-xs font-mono font-bold text-slate-700 mt-1 block truncate">INV/romawi/tahun/no/MO</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE / UPLOAD SHEET CSV */}
          {activeTab === 'paste' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Upload size={16} className="text-blue-600" />
                    <span>Paste Data Spreadsheet (Google Sheets / Excel)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Salin baris tabel dari Google Sheets (termasuk header) lalu paste di kotak berikut, atau upload berkas .csv
                  </p>
                </div>

                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto">
                  <Upload size={14} className="text-blue-600" />
                  <span>Pilih File .CSV</span>
                  <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                id="textarea-sheet-input"
                rows={6}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleParseInput(e.target.value);
                }}
                placeholder="Paste kolom CSV atau data Google Sheet di sini...&#10;Contoh:&#10;nomor_invoice,nama_sekolah,kode_mitra,bulan,tahun,tahun_ajaran,kategori,tanggal_kirim,tanggal_dibayar,tagihan_full,tagihan_realisasi,nominal_pembayaran,status_invoice,status_bayar,metode_bayar,no_referensi,keterangan&#10;&quot;INV/VII/2022/001/MO&quot;,&quot;Al-Falah Depok&quot;,&quot;MO004&quot;,&quot;Juli&quot;,2022,&quot;2022/2023&quot;,&quot;Renewal Fee&quot;,&quot;2022-07-05&quot;,&quot;2022-07-20&quot;,35000000,35000000,35000000,&quot;Terkirim&quot;,&quot;Lunas&quot;,&quot;Bank Mandiri Transfer&quot;,&quot;MDR-20220720-001&quot;,&quot;Renewal Lisensi Tahunan 2022&quot;"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Mendukung pemisah koma (,), titik koma (;), atau tab sheet (\t).
                </span>
                <button
                  type="button"
                  onClick={() => handleParseInput(inputText)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Proses & Validasi Baris
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FORMAT & TEMPLATE GOOGLE SHEETS */}
          {activeTab === 'template' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-600" />
                    <span>Format Kolom Google Sheets untuk Invoice & Pembayaran</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Header kolom yang didukung sistem L-MAP untuk import transaksi sejak 2022
                  </p>
                </div>
                <button
                  id="btn-copy-template"
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {copiedTemplate ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedTemplate ? 'Tersalin ke Clipboard!' : 'Salin Template CSV'}</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Nama Kolom (Header)</th>
                      <th className="p-2.5">Contoh Nilai</th>
                      <th className="p-2.5">Wajib/Opsional</th>
                      <th className="p-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">nomor_invoice</td>
                      <td className="p-2.5 font-mono">INV/VII/2022/001/MO</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Format INV/romawi bulan/tahun/nomor/MO</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">nama_sekolah</td>
                      <td className="p-2.5">Lazuardi Al-Falah Depok</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Nama sekolah mitra atau afiliasi</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">kode_mitra</td>
                      <td className="p-2.5 font-mono">MO004</td>
                      <td className="p-2.5 text-slate-400">Opsional</td>
                      <td className="p-2.5">ID Akun Mitra (MO004 s/d MO012)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">bulan</td>
                      <td className="p-2.5">Juli</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Bulan diterbitkan invoice</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">tahun_ajaran</td>
                      <td className="p-2.5">2022/2023</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Tahun ajaran kemitraan</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">kategori</td>
                      <td className="p-2.5">Renewal Fee</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Renewal Fee, Franchise Fee, Piutang Mitra, Jenjang Baru</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">tanggal_kirim</td>
                      <td className="p-2.5 font-mono">2022-07-05</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Tanggal invoice dikirim ke mitra</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">tanggal_dibayar</td>
                      <td className="p-2.5 font-mono">2022-07-20</td>
                      <td className="p-2.5 text-slate-400">Jika ada</td>
                      <td className="p-2.5">Tanggal pembayaran diterima di rekening yayasan</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">tagihan_full</td>
                      <td className="p-2.5 font-mono">35000000</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Nominal tagihan bruto</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">tagihan_realisasi</td>
                      <td className="p-2.5 font-mono">35000000</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Nominal tagihan netto setelah diskon/penyesuaian</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">nominal_pembayaran</td>
                      <td className="p-2.5 font-mono">35000000</td>
                      <td className="p-2.5 text-slate-400">Jika ada</td>
                      <td className="p-2.5">Nominal yang telah disetor (mengisi list payment)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">status_bayar</td>
                      <td className="p-2.5">Lunas</td>
                      <td className="p-2.5 font-semibold text-emerald-600">Wajib</td>
                      <td className="p-2.5">Lunas, Sebagian, Menunggu Konfirmasi, Belum Bayar, Jatuh Tempo</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">metode_bayar</td>
                      <td className="p-2.5">Bank Mandiri Transfer</td>
                      <td className="p-2.5 text-slate-400">Opsional</td>
                      <td className="p-2.5">Metode pembayaran bank/VA/Giro</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-blue-700">no_referensi</td>
                      <td className="p-2.5 font-mono">MDR-20220720-001</td>
                      <td className="p-2.5 text-slate-400">Opsional</td>
                      <td className="p-2.5">Nomor referensi setoran bank</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PREVIEW TABLE HASIL PARSE */}
          {previewInvoices.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Preview Data Invoice & Pembayaran Terbaca</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {previewInvoices.length} Invoice
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {previewPayments.length} Payment List
                  </span>
                </div>

                {/* Filter Tahun Ajaran / Tahun */}
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="ALL">Semua Tahun (2022-2026)</option>
                    <option value="2022">Tahun 2022 (TA 2022/2023)</option>
                    <option value="2023">Tahun 2023 (TA 2023/2024)</option>
                    <option value="2024">Tahun 2024 (TA 2024/2025)</option>
                    <option value="2025">Tahun 2025 (TA 2025/2026)</option>
                    <option value="2026">Tahun 2026 (TA 2026/2027)</option>
                  </select>
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">No. Invoice</th>
                      <th className="p-2.5">Sekolah Mitra</th>
                      <th className="p-2.5">Bulan / TA</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Tgl Kirim</th>
                      <th className="p-2.5 text-right">Tagihan Realisasi</th>
                      <th className="p-2.5 text-right">Nominal Pembayaran</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5">List Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {displayedPreviewInvoices.map((inv, idx) => {
                      const hasPayment = (inv.nominalPembayaran || 0) > 0;
                      return (
                        <tr key={inv.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-2.5 font-mono text-[11px] font-semibold text-blue-900 whitespace-nowrap">
                            {inv.nomorInvoice}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 whitespace-nowrap">
                            {inv.namaSekolah}
                          </td>
                          <td className="p-2.5 text-slate-600 whitespace-nowrap">
                            {inv.bulan} • {inv.tahunAjaran}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                              {inv.kategori}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {inv.tanggalKirim}
                          </td>
                          <td className="p-2.5 font-mono text-right font-semibold text-slate-900 whitespace-nowrap">
                            {formatRupiah(inv.tagihanRealisasi)}
                          </td>
                          <td className="p-2.5 font-mono text-right font-bold text-emerald-700 whitespace-nowrap">
                            {formatRupiah(inv.nominalPembayaran || 0)}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' :
                              inv.status === 'Sebagian' ? 'bg-amber-100 text-amber-800' :
                              inv.status === 'Menunggu Konfirmasi' ? 'bg-blue-100 text-blue-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {hasPayment ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 size={12} />
                                <span>Tercatat ({inv.tanggalDibayar || inv.tanggalKirim})</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Belum Ada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total stats */}
              <div className="p-3 bg-slate-100/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 font-medium">
                  Menampilkan <strong>{displayedPreviewInvoices.length}</strong> invoice dari total <strong>{previewInvoices.length}</strong> data ter-load.
                </span>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 mr-1.5">Total Tagihan:</span>
                    <strong className="font-mono text-slate-900">{formatRupiah(totalTagihanRealisasi)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-1.5">Total Terbayar:</span>
                    <strong className="font-mono text-emerald-700">{formatRupiah(totalDanaMasuk)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opsi Mode Impor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-800 block">Metode Sinkronisasi Database:</span>
              <span className="text-slate-500 text-[11px]">
                Tentukan bagaimana data sheet akan diaplikasikan terhadap data saat ini di sistem L-MAP.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="text-blue-600"
                />
                <span>Gabungkan (Update/Merge)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 ml-3">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-blue-600"
                />
                <span>Gantikan Seluruhnya (Replace)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Saat data sheet diterapkan, <strong>list payment</strong> dan <strong>list invoice</strong> otomatis terisi & tersinkronisasi.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-terapkan-sheet-invoice"
              type="button"
              disabled={isProcessing || previewInvoices.length === 0}
              onClick={handleApplyToDatabase}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Database size={15} />
                  <span>Terapkan ke List Invoice & Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
