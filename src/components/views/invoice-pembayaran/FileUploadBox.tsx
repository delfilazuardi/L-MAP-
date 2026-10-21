import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, Eye, Image as ImageIcon } from 'lucide-react';

interface FileUploadBoxProps {
  id?: string;
  label: string;
  description?: string;
  value: string; // URL or Data URL
  onChange: (url: string) => void;
  accept?: string;
  badgeText?: string;
  required?: boolean;
  type?: 'bukti' | 'kwitansi';
}

export const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  id,
  label,
  description = 'Format JPG, PNG, atau PDF (maks. 5MB)',
  value,
  onChange,
  accept = 'image/*,application/pdf',
  badgeText,
  required = false,
  type = 'bukti',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const isImage = value.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(value);
  const isPdf = value.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(value);

  const handleFileProcess = (file: File) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate instant crisp mock SVG sample for testing without uploading
  const handleUseSample = () => {
    const isBuktiSample = type === 'bukti';
    const sampleTitle = isBuktiSample ? 'BUKTI TRANSFER BANK' : 'KWITANSI RESMI LAZUARDI';
    const sampleColor = isBuktiSample ? '#2563eb' : '#059669';
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#f8fafc" rx="16"/>
      <rect x="20" y="20" width="560" height="80" rx="12" fill="${sampleColor}"/>
      <text x="40" y="65" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">${sampleTitle}</text>
      <text x="40" y="85" font-family="Arial, sans-serif" font-size="12" fill="#e2e8f0">Yayasan Lazuardi Hayati • Validated e-Document</text>
      <rect x="40" y="120" width="520" height="1" fill="#cbd5e1"/>
      <text x="40" y="150" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Tanggal Dokumen:</text>
      <text x="200" y="150" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${new Date().toLocaleDateString('id-ID')}</text>
      <text x="40" y="180" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Status Transaksi:</text>
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${sampleColor}">BERHASIL / TERVERIFIKASI</text>
      <text x="40" y="210" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Dokumen:</text>
      <text x="200" y="210" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${isBuktiSample ? 'Slip Pembayaran Cicilan Rekonsiliasi' : 'Kwitansi Tanda Terima Sah'}</text>
      <rect x="40" y="240" width="520" height="100" rx="8" fill="#e2e8f0"/>
      <text x="60" y="295" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e293b">DOKUMEN VALID LAZUARDI FINANCE</text>
      <text x="60" y="320" font-family="Arial, sans-serif" font-size="12" fill="#475569">Otentikasi Sistem Terpadu Pembayaran Sekolah Mitra</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(sampleSvg)}`;
    onChange(dataUrl);
    setFileName(isBuktiSample ? 'contoh_slip_transfer.svg' : 'contoh_kwitansi_resmi.svg');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex items-center gap-1.5">
          {badgeText && (
            <span className="text-[10px] font-semibold text-slate-400">
              {badgeText}
            </span>
          )}
          {!value && (
            <button
              type="button"
              onClick={handleUseSample}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
              title="Gunakan contoh dokumen otomatis untuk pengujian"
            >
              + Contoh File
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-3.5 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer select-none ${
            isDragging
              ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-white text-blue-600 shadow-2xs border border-slate-200 flex items-center justify-center">
            <UploadCloud size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Klik atau Seret File ke Sini
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {description}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl border border-emerald-300 bg-emerald-50/60 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {isImage ? (
              <div className="w-12 h-12 rounded-xl border border-emerald-300 overflow-hidden bg-white shrink-0 shadow-2xs">
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : isPdf ? (
              <div className="w-12 h-12 rounded-xl border border-emerald-300 bg-white text-rose-600 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <FileText size={20} />
                <span className="text-[9px] font-black uppercase">PDF</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl border border-emerald-300 bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 size={20} />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  <CheckCircle2 size={11} /> File Terunggah
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px] sm:max-w-xs mt-0.5">
                {fileName || (type === 'bukti' ? 'Bukti Pembayaran Terlampir' : 'Kwitansi Pembayaran Terlampir')}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Siap disimpan bersama transaksi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (value.startsWith('data:')) {
                  const win = window.open();
                  if (win) {
                    if (isImage) {
                      win.document.write(`<img src="${value}" style="max-width:100%; height:auto;" />`);
                    } else {
                      win.document.write(`<iframe src="${value}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }
                  }
                } else {
                  window.open(value, '_blank');
                }
              }}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition cursor-pointer shadow-2xs"
              title="Lihat Pratinjau Dokumen"
            >
              <Eye size={15} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold transition cursor-pointer shadow-2xs"
              title="Ganti dengan file lain"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
              title="Hapus file ini"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
