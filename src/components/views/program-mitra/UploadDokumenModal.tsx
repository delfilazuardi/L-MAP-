import React, { useState, useRef } from 'react';
import { X, Upload, Link2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DokumenPribadiPeserta } from '../../../types';

interface UploadDokumenModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPesertaNama: string;
  isUploaderAdmin: boolean;
  onSave: (doc: DokumenPribadiPeserta) => Promise<void>;
}

export const UploadDokumenModal: React.FC<UploadDokumenModalProps> = ({
  isOpen,
  onClose,
  targetPesertaNama,
  isUploaderAdmin,
  onSave,
}) => {
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'Sertifikat' | 'Surat Tugas' | 'Logbook' | 'Penilaian' | 'Portofolio' | 'Laporan' | 'Lainnya'>(
    isUploaderAdmin ? 'Sertifikat' : 'Laporan'
  );
  const [metode, setMetode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 8 MB.');
      return;
    }

    setFileName(file.name);
    if (!nama.trim()) {
      setNama(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFileData(base64);
      setUrl(base64);
    };
    reader.readAsDataURL(file);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama dokumen wajib diisi.');
      return;
    }
    if (metode === 'url' && !url.trim()) {
      setErrorMsg('Tautan dokumen wajib diisi.');
      return;
    }
    if (metode === 'file' && !fileData && !url) {
      setErrorMsg('Silakan pilih file dokumen terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newDoc: DokumenPribadiPeserta = {
        id: `DOK-PRIBADI-${Date.now().toString().slice(-6)}`,
        nama: nama.trim(),
        tipe,
        url: url.trim(),
        fileName: fileName || undefined,
        fileData: fileData || undefined,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: keterangan.trim() || undefined,
        uploadedBy: isUploaderAdmin ? 'admin' : 'peserta',
      };
      await onSave(newDoc);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunggah dokumen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-800">
              {isUploaderAdmin ? 'Unggah Dokumen untuk Peserta' : 'Unggah Dokumen Saya'}
            </h4>
            <span className="text-xs text-slate-500 block">
              Peserta: <strong className="text-slate-700">{targetPesertaNama}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Dokumen */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder={isUploaderAdmin ? 'Contoh: Sertifikat Kelulusan Magang / Surat Tugas' : 'Contoh: Laporan Akhir Magang / Logbook Pekan 1'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipe Dokumen */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipe Dokumen
            </label>
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Laporan">Laporan Kegiatan</option>
              <option value="Logbook">Logbook / Jurnal Harian</option>
              <option value="Portofolio">Portofolio & Modul</option>
              <option value="Sertifikat">Sertifikat Kelulusan / Partisipasi</option>
              <option value="Surat Tugas">Surat Tugas / Delegasi</option>
              <option value="Penilaian">Lembar Penilaian / Evaluasi</option>
              <option value="Lainnya">Dokumen Lainnya</option>
            </select>
          </div>

          {/* Pilihan Metode: Tautan atau File Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Format Berkas Dokumen
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  checked={metode === 'url'}
                  onChange={() => setMetode('url')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Tautan (Google Drive / Docs / Canva)</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  checked={metode === 'file'}
                  onChange={() => setMetode('file')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Unggah File PDF / Dokumen</span>
              </label>
            </div>

            {metode === 'url' ? (
              <div className="relative mt-1">
                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={url.startsWith('data:') ? '' : url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setFileData('');
                    setFileName('');
                  }}
                  placeholder="https://docs.google.com/... atau https://drive.google.com/..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="space-y-2 mt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 text-center cursor-pointer transition"
                >
                  <Upload size={22} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">
                    {fileName ? fileName : 'Klik untuk memilih file dari komputer'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Mendukung PDF, Word, Excel, PowerPoint, atau Gambar (Maks 8 MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Keterangan Singkat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Laporan akhir telah direview kepala sekolah"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? 'Mengunggah...' : 'Simpan Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
