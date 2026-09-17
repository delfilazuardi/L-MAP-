import React, { useState, useId } from 'react';
import { 
  Calculator, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Check, 
  RefreshCw,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText
} from 'lucide-react';
import { SheetPerhitunganData, SheetPerhitunganRow } from '../../../types';

interface SheetPerhitunganModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaSekolah: string;
  bulan: string;
  tahun: number;
  initialData?: SheetPerhitunganData;
  onSave: (data: SheetPerhitunganData) => void;
  isReadOnly?: boolean;
}

const TEMPLATE_PRESETS = [
  {
    name: 'Rekap SPP & Operasional Bulanan',
    rows: [
      {
        id: 'PRE-01',
        kode: 'IN-01',
        deskripsi: 'Penerimaan SPP Reguler Siswa (Grade 1 - 6)',
        kategori: 'Pemasukan',
        volume: 220,
        satuan: 'Siswa',
        tarifSatuan: 1300000,
        totalHitungan: 286000000,
        totalTercatat: 275000000, // Discrepancy intentional for demo
        selisih: 11000000,
        statusAudit: 'Selisih Perhitungan' as const,
        catatanKoreksi: 'Tercatat Rp 275.000.000, seharusnya 220 × 1.300.000 = Rp 286.000.000 (Selisih +Rp 11.000.000)'
      },
      {
        id: 'PRE-02',
        kode: 'IN-02',
        deskripsi: 'Penerimaan Biaya Program Inklusi & Shadow Teacher',
        kategori: 'Pemasukan',
        volume: 16,
        satuan: 'Siswa',
        tarifSatuan: 2000000,
        totalHitungan: 32000000,
        totalTercatat: 32000000,
        selisih: 0,
        statusAudit: 'Sesuai' as const
      },
      {
        id: 'PRE-03',
        kode: 'OUT-01',
        deskripsi: 'Gaji & Tunjangan Guru Serta Karyawan Sekolah',
        kategori: 'Pengeluaran',
        volume: 28,
        satuan: 'Orang',
        tarifSatuan: 4600000,
        totalHitungan: 128800000,
        totalTercatat: 132800000, // Discrepancy
        selisih: -4000000,
        statusAudit: 'Selisih Perhitungan' as const,
        catatanKoreksi: 'Tercatat Rp 132.800.000, seharusnya 28 × 4.600.000 = Rp 128.800.000 (Selisih -Rp 4.000.000)'
      },
      {
        id: 'PRE-04',
        kode: 'OUT-02',
        deskripsi: 'Operasional Listrik, Internet & Kebersihan Kampus',
        kategori: 'Pengeluaran',
        volume: 1,
        satuan: 'Bulan',
        tarifSatuan: 14500000,
        totalHitungan: 14500000,
        totalTercatat: 14500000,
        selisih: 0,
        statusAudit: 'Sesuai' as const
      }
    ]
  },
  {
    name: 'Anggaran Kegiatan & Kurikulum MenDAKI',
    rows: [
      {
        id: 'PRE-05',
        kode: 'IN-03',
        deskripsi: 'Alokasi Dana Kegiatan Siswa Kurikulum MenDAKI',
        kategori: 'Pemasukan',
        volume: 180,
        satuan: 'Siswa',
        tarifSatuan: 250000,
        totalHitungan: 45000000,
        totalTercatat: 45000000,
        selisih: 0,
        statusAudit: 'Sesuai' as const
      },
      {
        id: 'PRE-06',
        kode: 'OUT-03',
        deskripsi: 'Pengadaan Bahan Projek & Modul Compassionate Action',
        kategori: 'Pengeluaran',
        volume: 180,
        satuan: 'Paket',
        tarifSatuan: 120000,
        totalHitungan: 21600000,
        totalTercatat: 24000000, // Discrepancy
        selisih: -2400000,
        statusAudit: 'Selisih Perhitungan' as const,
        catatanKoreksi: 'Tercatat Rp 24.000.000, seharusnya 180 × 120.000 = Rp 21.600.000'
      },
      {
        id: 'PRE-07',
        kode: 'OUT-04',
        deskripsi: 'Workshop Guru Pembimbing & Review MenDAKI',
        kategori: 'Pengeluaran',
        volume: 12,
        satuan: 'Sesi',
        tarifSatuan: 750000,
        totalHitungan: 9000000,
        totalTercatat: 9000000,
        selisih: 0,
        statusAudit: 'Sesuai' as const
      }
    ]
  }
];

export const SheetPerhitunganModal: React.FC<SheetPerhitunganModalProps> = ({
  isOpen,
  onClose,
  namaSekolah,
  bulan,
  tahun,
  initialData,
  onSave,
  isReadOnly = false,
}) => {
  const fileInputId = useId();
  // State for rows
  const [rows, setRows] = useState<SheetPerhitunganRow[]>(() => {
    if (initialData && initialData.rows.length > 0) {
      return initialData.rows;
    }
    return TEMPLATE_PRESETS[0].rows;
  });

  const [sheetName, setSheetName] = useState<string>(
    initialData?.namaSheet || `Sheet Perhitungan Bulanan - ${namaSekolah} (${bulan} ${tahun})`
  );
  const [fileName, setFileName] = useState<string>(initialData?.namaFile || '');
  const [auditLogs, setAuditLogs] = useState<string[]>(initialData?.catatanAudit || []);
  const [showAutoFixBanner, setShowAutoFixBanner] = useState<boolean>(false);
  const [lastFixSummary, setLastFixSummary] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real-time calculations
  const calculateTotals = (currentRows: SheetPerhitunganRow[]) => {
    let totalIn = 0;
    let totalOut = 0;
    let totalDiscrepancy = 0;

    currentRows.forEach(r => {
      const calculatedVal = Number(r.volume || 0) * Number(r.tarifSatuan || 0);
      if (r.kategori === 'Pemasukan') {
        totalIn += calculatedVal;
      } else {
        totalOut += calculatedVal;
      }
      totalDiscrepancy += Math.abs(Number(r.selisih || 0));
    });

    return {
      totalPemasukan: totalIn,
      totalPengeluaran: totalOut,
      saldoBersih: totalIn - totalOut,
      totalSelisihDitemukan: totalDiscrepancy,
    };
  };

  const totals = calculateTotals(rows);

  const hasDiscrepancies = rows.some(r => r.statusAudit === 'Selisih Perhitungan' || r.selisih !== 0);

  /**
   * Automatically repairs all calculation formulas and discrepancies
   */
  const handleAutoRepairCalculations = () => {
    let fixedCount = 0;
    const newLogs: string[] = [];

    const repairedRows = rows.map((r) => {
      const correctExpected = Number(r.volume || 0) * Number(r.tarifSatuan || 0);
      const recorded = Number(r.totalTercatat || 0);
      const diff = correctExpected - recorded;

      if (diff !== 0 || r.statusAudit === 'Selisih Perhitungan') {
        fixedCount++;
        const logMsg = `Baris [${r.deskripsi}]: diperbaiki dari Rp ${recorded.toLocaleString('id-ID')} menjadi Rp ${correctExpected.toLocaleString('id-ID')} (Rumus: ${r.volume} ${r.satuan} × Rp ${r.tarifSatuan.toLocaleString('id-ID')}).`;
        newLogs.push(logMsg);

        return {
          ...r,
          totalHitungan: correctExpected,
          totalTercatat: correctExpected,
          selisih: 0,
          statusAudit: 'Diperbaiki Otomatis' as const,
          catatanKoreksi: `Otomatis diselaraskan dengan rumus: ${r.volume} ${r.satuan} × Rp ${r.tarifSatuan.toLocaleString('id-ID')} = Rp ${correctExpected.toLocaleString('id-ID')}.`,
        };
      }

      return {
        ...r,
        totalHitungan: correctExpected,
        selisih: 0,
        statusAudit: (r.statusAudit === 'Diperbaiki Otomatis' ? 'Diperbaiki Otomatis' : 'Sesuai') as 'Sesuai' | 'Diperbaiki Otomatis',
      };
    });

    setRows(repairedRows);
    const summary = fixedCount > 0 
      ? `Berhasil memperbaiki ${fixedCount} selisih perhitungan secara otomatis! Nilai total dan saldo kas kini seimbang dan akurat.`
      : 'Semua baris perhitungan sudah sesuai dengan rumus perkalian matematika.';
    
    setLastFixSummary(summary);
    setShowAutoFixBanner(true);
    setAuditLogs(prev => [...newLogs, ...prev]);
  };

  /**
   * Handle changing cell values
   */
  const handleCellChange = (id: string, field: keyof SheetPerhitunganRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;

      const updated = { ...r, [field]: value };
      const vol = field === 'volume' ? Number(value) : updated.volume;
      const tarif = field === 'tarifSatuan' ? Number(value) : updated.tarifSatuan;
      const recorded = field === 'totalTercatat' ? Number(value) : updated.totalTercatat;

      const expected = vol * tarif;
      const selisih = expected - recorded;

      updated.totalHitungan = expected;
      updated.selisih = selisih;
      
      if (selisih === 0) {
        updated.statusAudit = 'Sesuai';
        updated.catatanKoreksi = undefined;
      } else {
        updated.statusAudit = 'Selisih Perhitungan';
        updated.catatanKoreksi = `Tercatat Rp ${recorded.toLocaleString('id-ID')}, seharusnya ${vol} × ${tarif.toLocaleString('id-ID')} = Rp ${expected.toLocaleString('id-ID')}`;
      }

      return updated;
    }));
  };

  const handleAddRow = () => {
    const newRow: SheetPerhitunganRow = {
      id: `ROW-${Date.now().toString().slice(-4)}`,
      kode: `ITEM-${rows.length + 1}`,
      deskripsi: 'Item Baru Perhitungan',
      kategori: 'Pengeluaran',
      volume: 1,
      satuan: 'Unit',
      tarifSatuan: 500000,
      totalHitungan: 500000,
      totalTercatat: 500000,
      selisih: 0,
      statusAudit: 'Sesuai',
    };
    setRows(prev => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  /**
   * Parse uploaded CSV file or text
   */
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) return;

      const newRows: SheetPerhitunganRow[] = [];
      let isHeader = true;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma or semicolon or tab
        const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

        // Check if header row
        if (isHeader && (cols[0]?.toLowerCase().includes('deskripsi') || cols[0]?.toLowerCase().includes('item') || cols[0]?.toLowerCase().includes('no'))) {
          isHeader = false;
          continue;
        }
        isHeader = false;

        if (cols.length >= 3) {
          const deskripsi = cols[0] || `Item ${i + 1}`;
          const kategori = (cols[1]?.toLowerCase().includes('masuk') || cols[1]?.toLowerCase().includes('spp') || cols[1]?.toLowerCase().includes('pendapatan'))
            ? 'Pemasukan' 
            : (cols[1] || 'Pengeluaran');

          // Parse numeric values (strip Rp, dots, spaces)
          const parseNum = (str: string, defVal: number) => {
            if (!str) return defVal;
            const cleaned = str.replace(/[^0-9.-]/g, '');
            const val = parseFloat(cleaned);
            return isNaN(val) ? defVal : val;
          };

          const volume = parseNum(cols[2], 1);
          const satuan = cols[3] && isNaN(Number(cols[3])) ? cols[3] : 'Unit';
          const tarif = parseNum(cols[4] || cols[3], 100000);
          const tercatat = parseNum(cols[5] || cols[4], volume * tarif);

          const expected = volume * tarif;
          const selisih = expected - tercatat;

          newRows.push({
            id: `CSV-${i}-${Date.now().toString().slice(-3)}`,
            kode: `UPL-${i + 1}`,
            deskripsi,
            kategori,
            volume,
            satuan,
            tarifSatuan: tarif,
            totalHitungan: expected,
            totalTercatat: tercatat,
            selisih,
            statusAudit: selisih === 0 ? 'Sesuai' : 'Selisih Perhitungan',
            catatanKoreksi: selisih !== 0 
              ? `Tercatat Rp ${tercatat.toLocaleString('id-ID')}, rumus: ${volume} × ${tarif.toLocaleString('id-ID')} = Rp ${expected.toLocaleString('id-ID')}`
              : undefined,
          });
        }
      }

      if (newRows.length > 0) {
        setRows(newRows);
        setFileName(file.name);
        setSheetName(`Sheet Upload: ${file.name.replace(/\.[^/.]+$/, '')}`);
        setAuditLogs(prev => [
          `File '${file.name}' berhasil dimuat (${newRows.length} baris data). Sistem otomatis menganalisis kesesuaian formula.`,
          ...prev
        ]);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Export the corrected sheet to CSV
   */
  const handleExportCSV = () => {
    const headers = ['Kode', 'Deskripsi', 'Kategori', 'Volume', 'Satuan', 'Tarif_Satuan', 'Total_Hitungan', 'Total_Tercatat', 'Selisih', 'Status_Audit'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const rowData = [
        `"${r.kode || ''}"`,
        `"${r.deskripsi.replace(/"/g, '""')}"`,
        `"${r.kategori}"`,
        r.volume,
        `"${r.satuan}"`,
        r.tarifSatuan,
        r.totalHitungan,
        r.totalTercatat,
        r.selisih,
        `"${r.statusAudit}"`
      ];
      csvLines.push(rowData.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sheet_perhitungan_${namaSekolah.toLowerCase().replace(/\s+/g, '_')}_${bulan}_${tahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSheet = () => {
    const finalData: SheetPerhitunganData = {
      namaSheet: sheetName,
      namaFile: fileName || undefined,
      tanggalUpload: new Date().toISOString().split('T')[0],
      rows,
      totalPemasukan: totals.totalPemasukan,
      totalPengeluaran: totals.totalPengeluaran,
      saldoBersih: totals.saldoBersih,
      totalSelisihDitemukan: totals.totalSelisihDitemukan,
      statusPerbaikan: hasDiscrepancies ? 'Ada Selisih' : (rows.some(r => r.statusAudit === 'Diperbaiki Otomatis') ? 'Otomatis Diperbaiki' : 'Sesuai / Valid'),
      catatanAudit: auditLogs,
    };

    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Sheet Perhitungan & Rekonsiliasi Otomatis
                </h3>
                {hasDiscrepancies ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-700" />
                    Ada Selisih Perhitungan
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Perhitungan Valid & Seimbang
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {namaSekolah} • Periode {bulan} {tahun} {fileName && `• File: ${fileName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Unduh format CSV hasil perbaikan"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Action & Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Pemasukan */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <ArrowDownCircle size={14} className="text-emerald-600" />
                Total Pemasukan (Hitungan)
              </span>
              <p className="text-lg font-bold text-emerald-950 font-mono mt-1">
                Rp {totals.totalPemasukan.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Total Pengeluaran */}
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <ArrowUpCircle size={14} className="text-rose-600" />
                Total Pengeluaran (Hitungan)
              </span>
              <p className="text-lg font-bold text-rose-950 font-mono mt-1">
                Rp {totals.totalPengeluaran.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Saldo Bersih */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                <Calculator size={14} className="text-blue-600" />
                Saldo Bersih / Surplus
              </span>
              <p className={`text-lg font-bold font-mono mt-1 ${totals.saldoBersih >= 0 ? 'text-blue-950' : 'text-rose-700'}`}>
                Rp {totals.saldoBersih.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Status Audit & Auto-Fix Trigger */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
              hasDiscrepancies ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Status Selisih Data:</span>
                <p className={`font-semibold mt-0.5 ${hasDiscrepancies ? 'text-amber-900 font-bold' : 'text-slate-700'}`}>
                  {hasDiscrepancies 
                    ? `Ditemukan selisih total Rp ${totals.totalSelisihDitemukan.toLocaleString('id-ID')}` 
                    : 'Tidak ada selisih perhitungan'}
                </p>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  id="btn-auto-perbaiki-sheet"
                  onClick={handleAutoRepairCalculations}
                  className={`mt-2 w-full py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer ${
                    hasDiscrepancies 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 animate-pulse' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{hasDiscrepancies ? '✨ Perbaiki Otomatis Sekarang' : 'Rekalkulasi Formula'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Auto-fix Notification Banner */}
          {showAutoFixBanner && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950 block">Pembaruan & Perbaikan Otomatis Selesai!</span>
                  <p className="mt-0.5 text-emerald-800 leading-relaxed">{lastFixSummary}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAutoFixBanner(false)}
                className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Upload & Preset Options */}
          {!isReadOnly && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Dropzone / Upload button */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`flex-1 flex items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed transition ${
                  dragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Upload File Sheet / CSV Perhitungan</span>
                    <span className="text-[10px] text-slate-400">Tarik & lepas file (.csv, .xlsx, .txt) atau klik tombol unggah</span>
                  </div>
                </div>

                <label 
                  htmlFor={fileInputId}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer shrink-0"
                >
                  Pilih File
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Template Presets */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500">Muat Template:</span>
                {TEMPLATE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRows(preset.rows);
                      setSheetName(preset.name);
                      setFileName('');
                      setAuditLogs(prev => [`Memuat template '${preset.name}'.`, ...prev]);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-800 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                  >
                    {preset.name.split(' ')[0]} {preset.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Calculation Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-700" />
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  disabled={isReadOnly}
                  className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-none px-1 text-xs"
                />
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Tambah Baris</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Deskripsi Akun / Item</th>
                    <th className="py-2.5 px-3 w-28">Kategori</th>
                    <th className="py-2.5 px-3 w-20 text-right">Volume</th>
                    <th className="py-2.5 px-3 w-20">Satuan</th>
                    <th className="py-2.5 px-3 w-28 text-right">Tarif (Rp)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Hasil Rumus (Vol × Tarif)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Tercatat Asli</th>
                    <th className="py-2.5 px-3 w-28 text-center">Status Audit</th>
                    {!isReadOnly && <th className="py-2.5 px-3 w-12 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => {
                    const isDiscrepant = row.statusAudit === 'Selisih Perhitungan' || row.selisih !== 0;
                    return (
                      <tr 
                        key={row.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isDiscrepant ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Deskripsi */}
                        <td className="py-2.5 px-3">
                          {isReadOnly ? (
                            <span className="font-semibold text-slate-900">{row.deskripsi}</span>
                          ) : (
                            <input
                              type="text"
                              value={row.deskripsi}
                              onChange={(e) => handleCellChange(row.id, 'deskripsi', e.target.value)}
                              className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded px-1.5 py-0.5 font-medium text-slate-900"
                            />
                          )}
                          {row.catatanKoreksi && (
                            <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                              ⚠️ {row.catatanKoreksi}
                            </span>
                          )}
                        </td>

                        {/* Kategori */}
                        <td className="py-2.5 px-3">
                          {isReadOnly ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              row.kategori === 'Pemasukan' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {row.kategori}
                            </span>
                          ) : (
                            <select
                              value={row.kategori}
                              onChange={(e) => handleCellChange(row.id, 'kategori', e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              <option value="Pemasukan">Pemasukan</option>
                              <option value="Pengeluaran">Pengeluaran</option>
                              <option value="Operasional">Operasional</option>
                              <option value="Akademik">Akademik</option>
                            </select>
                          )}
                        </td>

                        {/* Volume */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {isReadOnly ? (
                            row.volume
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={row.volume}
                              onChange={(e) => handleCellChange(row.id, 'volume', parseFloat(e.target.value) || 0)}
                              className="w-16 text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono"
                            />
                          )}
                        </td>

                        {/* Satuan */}
                        <td className="py-2.5 px-3 text-slate-600">
                          {isReadOnly ? (
                            row.satuan
                          ) : (
                            <input
                              type="text"
                              value={row.satuan}
                              onChange={(e) => handleCellChange(row.id, 'satuan', e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                            />
                          )}
                        </td>

                        {/* Tarif Satuan */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {isReadOnly ? (
                            `Rp ${row.tarifSatuan.toLocaleString('id-ID')}`
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={row.tarifSatuan}
                              onChange={(e) => handleCellChange(row.id, 'tarifSatuan', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono"
                            />
                          )}
                        </td>

                        {/* Total Hitungan Rumus */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                          Rp {row.totalHitungan.toLocaleString('id-ID')}
                        </td>

                        {/* Total Tercatat Asli */}
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                          isDiscrepant ? 'text-amber-700 bg-amber-50/60' : 'text-slate-800'
                        }`}>
                          {isReadOnly ? (
                            `Rp ${row.totalTercatat.toLocaleString('id-ID')}`
                          ) : (
                            <input
                              type="number"
                              value={row.totalTercatat}
                              onChange={(e) => handleCellChange(row.id, 'totalTercatat', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right bg-transparent border-b border-slate-300 font-mono font-bold"
                            />
                          )}
                        </td>

                        {/* Status Audit */}
                        <td className="py-2.5 px-3 text-center">
                          {row.statusAudit === 'Sesuai' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check size={11} /> Sesuai
                            </span>
                          )}
                          {row.statusAudit === 'Selisih Perhitungan' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                              <AlertTriangle size={11} /> Selisih
                            </span>
                          )}
                          {row.statusAudit === 'Diperbaiki Otomatis' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <Sparkles size={11} /> Diperbaiki
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        {!isReadOnly && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
              <span>Menampilkan {rows.length} baris akun perhitungan</span>
              <div className="flex items-center gap-4">
                <span>Total Pemasukan: <strong className="font-mono text-emerald-800">Rp {totals.totalPemasukan.toLocaleString('id-ID')}</strong></span>
                <span>Total Pengeluaran: <strong className="font-mono text-rose-800">Rp {totals.totalPengeluaran.toLocaleString('id-ID')}</strong></span>
                <span>Surplus: <strong className="font-mono text-blue-800">Rp {totals.saldoBersih.toLocaleString('id-ID')}</strong></span>
              </div>
            </div>
          </div>

          {/* Audit Logs Section */}
          {auditLogs.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 block flex items-center gap-1">
                <Info size={14} className="text-blue-600" />
                Catatan Rekonsiliasi & Audit Sistem:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] pl-1 max-h-28 overflow-y-auto">
                {auditLogs.map((log, idx) => (
                  <li key={idx}>{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleSaveSheet}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>Simpan Sheet ke Laporan</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
