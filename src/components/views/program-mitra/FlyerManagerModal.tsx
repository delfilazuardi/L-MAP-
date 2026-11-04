import React, { useState, useRef } from 'react';
import { ImageIcon, X, Upload, Link2, Sparkles, AlertCircle, Building2, Calendar } from 'lucide-react';
import { ProgramMitraItem, SekolahMitra } from '../../../types';
import { INITIAL_PROGRAM_MITRA } from '../../../lib/initialData';

interface FlyerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  programList: ProgramMitraItem[];
  sekolahList: SekolahMitra[];
  initialProgram?: ProgramMitraItem | null;
  onSaveFlyer: (programId: string, flyerData: {
    flyerUrl?: string;
    flyerCaption?: string;
    flyerFileData?: string;
    flyerFileName?: string;
  }) => Promise<void>;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export const FlyerManagerModal: React.FC<FlyerManagerModalProps> = ({
  isOpen,
  onClose,
  programList,
  sekolahList,
  initialProgram,
  onSaveFlyer,
  onShowFeedback,
}) => {
  const effectiveProgramList = (programList && programList.length > 0) ? programList : INITIAL_PROGRAM_MITRA;

  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    initialProgram?.id || effectiveProgramList[0]?.id || ''
  );
  const [flyerCaption, setFlyerCaption] = useState<string>(
    initialProgram?.flyerCaption || initialProgram?.judul || ''
  );
  const [flyerUrl, setFlyerUrl] = useState<string>(
    initialProgram?.flyerUrl || ''
  );
  const [flyerFileName, setFlyerFileName] = useState<string>(
    initialProgram?.flyerFileName || ''
  );
  const [flyerFileData, setFlyerFileData] = useState<string>(
    initialProgram?.flyerFileData || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentProg = effectiveProgramList.find(p => p.id === selectedProgramId) || effectiveProgramList[0];

  const handleProgramChange = (id: string) => {
    setSelectedProgramId(id);
    const target = effectiveProgramList.find(p => p.id === id);
    if (target) {
      setFlyerCaption(target.flyerCaption || target.judul);
      setFlyerUrl(target.flyerUrl || '');
      setFlyerFileName(target.flyerFileName || '');
      setFlyerFileData(target.flyerFileData || '');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WebP) untuk flyer.');
      return;
    }

    if (file.size > 500 * 1024) {
      alert('Ukuran file gambar melebihi 500 KB. Silakan pilih gambar yang lebih kecil atau gunakan tautan URL eksternal (Canva / Drive / CDN) untuk performa terbaik.');
      return;
    }

    setFlyerFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFlyerFileData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) {
      alert('Pilih program atau agenda kegiatan yang terkait.');
      return;
    }

    if (!flyerUrl.trim() && !flyerFileData) {
      alert('Mohon masukkan tautan URL gambar atau unggah file flyer gambar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveFlyer(selectedProgramId, {
        flyerUrl: flyerUrl.trim() || undefined,
        flyerCaption: flyerCaption.trim() || undefined,
        flyerFileData: flyerFileData || undefined,
        flyerFileName: flyerFileName || undefined,
      });
      onShowFeedback('success', 'Flyer kegiatan berhasil diunggah dan tersimpan ke Firebase Firestore.');
      onClose();
    } catch (err) {
      console.error('Failed to save flyer:', err);
      onShowFeedback('error', 'Gagal menyimpan flyer ke Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewImage = flyerFileData || flyerUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Upload & Kelola Flyer Kegiatan / Program
              </h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Fitur Khusus Administrator Mitra Office
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* Target Program Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Pilih Program / Agenda Kemitraan Sasaran <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {effectiveProgramList.length} Program
              </span>
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => handleProgramChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer mb-2"
            >
              {effectiveProgramList.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.jenis}] {p.namaSekolah} - {p.judul}
                </option>
              ))}
            </select>

            {/* Visual Clickable Program Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-100/80 rounded-xl border border-slate-200">
              {effectiveProgramList.map(p => {
                const isSelected = selectedProgramId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProgramChange(p.id)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                        p.jenis === 'Visitasi' ? 'bg-blue-100 text-blue-800' :
                        p.jenis === 'Magang' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.jenis}
                      </span>
                      <p className="font-bold text-slate-900 text-xs line-clamp-1">{p.judul}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">{p.namaSekolah}</p>
                  </div>
                );
              })}
            </div>
            {currentProg && (
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span>Sekolah: <strong>{currentProg.namaSekolah}</strong> ({currentProg.tanggalMulai})</span>
              </p>
            )}
          </div>

          {/* Flyer Caption */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Judul / Caption Flyer Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={flyerCaption}
              onChange={(e) => setFlyerCaption(e.target.value)}
              placeholder="Misal: Brosur Resmi Magang Guru Inklusi Lazuardi 2026"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* File Upload Option */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <label className="block font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Upload size={14} className="text-blue-600" />
                <span>Upload File Gambar Flyer (JPG / PNG / WebP, maks 500 KB)</span>
              </span>
              {flyerFileData && (
                <span className="text-[10px] text-emerald-600 font-bold">File Terpilih</span>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {flyerFileName ? (
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon size={15} className="text-amber-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{flyerFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFlyerFileName('');
                    setFlyerFileData('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Hapus"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Upload size={15} className="text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-600">
                  Pilih file gambar flyer dari perangkat
                </span>
              </div>
            )}
          </div>

          {/* URL Option */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Link2 size={13} className="text-purple-600" />
              <span>Atau Masukkan URL Gambar Flyer (Canva / Drive / CDN)</span>
            </label>
            <input
              type="url"
              value={flyerUrl}
              onChange={(e) => setFlyerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... atau tautan gambar Canva/Drive"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 font-mono text-[11px]"
            />
          </div>

          {/* Live Preview */}
          {previewImage && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700 block text-[11px]">
                Pratinjau Tampilan Flyer:
              </span>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-56 flex items-center justify-center">
                <img 
                  src={previewImage} 
                  alt="Pratinjau Flyer" 
                  className="w-full h-auto max-h-56 object-contain"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan ke Firebase...' : 'Simpan & Publikasikan Flyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
