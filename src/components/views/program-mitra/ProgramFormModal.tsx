import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  ImageIcon, 
  Calendar, 
  School, 
  Users, 
  Plus, 
  Trash2, 
  FileText, 
  Sparkles,
  Link2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProgramMitraItem, ProgramMitraJenis, PesertaMagangItem, SekolahMitra } from '../../../types';
import { STANDARD_TAHUN_AJARAN_LIST } from '../../../lib/invoiceUtils';

interface ProgramFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProgram: ProgramMitraItem | null;
  sekolahList: SekolahMitra[];
  onSave: (programData: Partial<ProgramMitraItem>) => Promise<void>;
}

export const KATEGORI_PROGRAM_OPTIONS: { value: ProgramMitraJenis; label: string; badge: string; desc: string }[] = [
  { value: 'Visitasi', label: 'Visitasi', badge: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Studi tiru dan benchmarking tata kelola sentra/kurikulum' },
  { value: 'LATOF', label: 'LATOF', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', desc: 'Lazuardi Training of Facilitators untuk guru & pimpinan' },
  { value: 'Training of Trainers', label: 'Training of Trainers', badge: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Pelatihan master trainer internal sekolah mitra' },
  { value: 'Magang', label: 'Magang Guru', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Praktik magang intensif guru pendamping/shadow/sentra' },
  { value: 'Pendampingan', label: 'Pendampingan', badge: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'Supervisi dan konsultasi berkala kurikulum' },
  { value: 'Workshop', label: 'Workshop', badge: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'Pelatihan tematik dan seminar praktis' },
];

export const ProgramFormModal: React.FC<ProgramFormModalProps> = ({
  isOpen,
  onClose,
  editingProgram,
  sekolahList,
  onSave,
}) => {
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<ProgramMitraJenis>('Visitasi');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [targetScope, setTargetScope] = useState<'SEMUA' | 'SPESIFIK'>('SEMUA');
  const [selectedSekolahId, setSelectedSekolahId] = useState(sekolahList[0]?.id || 'MO004');
  const [deskripsi, setDeskripsi] = useState('');

  // Flyer State (Portrait 3:4)
  const [flyerUrl, setFlyerUrl] = useState('');
  const [flyerCaption, setFlyerCaption] = useState('');
  const [flyerFileName, setFlyerFileName] = useState('');
  const [flyerFileData, setFlyerFileData] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sasaran Peserta List
  const [pesertaList, setPesertaList] = useState<PesertaMagangItem[]>([]);
  const [newPesertaNama, setNewPesertaNama] = useState('');
  const [newPesertaPeran, setNewPesertaPeran] = useState('');
  const [newPesertaEmail, setNewPesertaEmail] = useState('');
  const [newPesertaSekolahId, setNewPesertaSekolahId] = useState(sekolahList[0]?.id || 'MO004');

  // Dokumen Panduan / Template Pendukung
  const [panduanNama, setPanduanNama] = useState('');
  const [panduanUrl, setPanduanUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingProgram) {
      setJudul(editingProgram.judul || '');
      setKategori(editingProgram.jenis || 'Visitasi');
      setTahunAjaran(editingProgram.tahunAjaran || '2026/2027');
      setTanggalMulai(editingProgram.tanggalMulai || new Date().toISOString().split('T')[0]);
      setTanggalSelesai(editingProgram.tanggalSelesai || '');
      
      const isSemua = editingProgram.sasaranSekolahNama === 'Semua Sekolah Mitra' || !editingProgram.mitraId || editingProgram.mitraId === 'ALL';
      setTargetScope(isSemua ? 'SEMUA' : 'SPESIFIK');
      setSelectedSekolahId(editingProgram.mitraId || sekolahList[0]?.id || 'MO004');
      setDeskripsi(editingProgram.deskripsi || '');

      setFlyerUrl(editingProgram.flyerUrl || '');
      setFlyerCaption(editingProgram.flyerCaption || '');
      setFlyerFileName(editingProgram.flyerFileName || '');
      setFlyerFileData(editingProgram.flyerFileData || '');

      setPesertaList(editingProgram.pesertaMagang || []);
      
      const firstDoc = editingProgram.dokumenSekolah?.[0];
      setPanduanNama(firstDoc?.nama || '');
      setPanduanUrl(firstDoc?.url || '');
    } else {
      setJudul('');
      setKategori('Visitasi');
      setTahunAjaran('2026/2027');
      const today = new Date().toISOString().split('T')[0];
      setTanggalMulai(today);
      setTanggalSelesai('');
      setTargetScope('SEMUA');
      setSelectedSekolahId(sekolahList[0]?.id || 'MO004');
      setDeskripsi('');
      setFlyerUrl('');
      setFlyerCaption('');
      setFlyerFileName('');
      setFlyerFileData('');
      setPesertaList([]);
      setPanduanNama('');
      setPanduanUrl('');
    }
    setErrorMsg('');
  }, [isOpen, editingProgram, sekolahList]);

  if (!isOpen) return null;

  // Handle local image upload for Portrait Flyer
  const handleFlyerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file flyer harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Ukuran file flyer maksimal 4 MB.');
      return;
    }

    setFlyerFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setFlyerFileData(base64);
      setFlyerUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPeserta = () => {
    if (!newPesertaNama.trim()) return;
    const targetSchool = sekolahList.find(s => s.id === newPesertaSekolahId);
    const newPeserta: PesertaMagangItem = {
      id: `PESERTA-${Date.now().toString().slice(-6)}`,
      nama: newPesertaNama.trim(),
      peran: newPesertaPeran.trim() || 'Peserta Program',
      email: newPesertaEmail.trim() || undefined,
      sekolahId: targetSchool?.id || selectedSekolahId,
      namaSekolah: targetSchool?.namaSekolah || 'Sekolah Mitra',
      dokumenPribadi: [],
    };
    setPesertaList(prev => [...prev, newPeserta]);
    setNewPesertaNama('');
    setNewPesertaPeran('');
    setNewPesertaEmail('');
  };

  const handleRemovePeserta = (pesertaId: string) => {
    setPesertaList(prev => prev.filter(p => p.id !== pesertaId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      setErrorMsg('Nama program wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const targetSchool = sekolahList.find(s => s.id === selectedSekolahId);
      const sasaranSekolahNama = targetScope === 'SEMUA' ? 'Semua Sekolah Mitra' : (targetSchool?.namaSekolah || 'Sekolah Mitra');
      const mitraId = targetScope === 'SEMUA' ? 'ALL' : selectedSekolahId;

      // Dokumen panduan dari admin jika ada
      const existingDokumenSekolah = editingProgram?.dokumenSekolah || [];
      const updatedDokumenSekolah = [...existingDokumenSekolah];
      if (panduanNama.trim() && panduanUrl.trim()) {
        const foundIdx = updatedDokumenSekolah.findIndex(d => d.nama === panduanNama.trim());
        if (foundIdx >= 0) {
          updatedDokumenSekolah[foundIdx].url = panduanUrl.trim();
        } else {
          updatedDokumenSekolah.unshift({
            id: `DOK-PANDUAN-${Date.now().toString().slice(-6)}`,
            nama: panduanNama.trim(),
            tipe: 'Panduan',
            url: panduanUrl.trim(),
            tanggal: tanggalMulai,
            keterangan: 'Panduan dan materi resmi program dari Admin Mitra Office',
            uploadedBy: 'admin',
          });
        }
      }

      await onSave({
        id: editingProgram ? editingProgram.id : `PRG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        jenis: kategori,
        judul: judul.trim(),
        tahunAjaran,
        mitraId,
        namaSekolah: sasaranSekolahNama,
        sasaranSekolahNama,
        sasaranSekolahIds: targetScope === 'SEMUA' ? sekolahList.map(s => s.id) : [selectedSekolahId],
        tanggalMulai,
        tanggalSelesai: tanggalSelesai || undefined,
        deskripsi: deskripsi.trim() || `Program ${kategori} Kemitraan Lazuardi`,
        peserta: pesertaList.map(p => p.nama).join(', ') || 'Belum ada peserta terdaftar',
        jumlahPeserta: pesertaList.length,
        pesertaMagang: pesertaList,
        dokumenSekolah: updatedDokumenSekolah,
        flyerUrl: flyerUrl.trim() || undefined,
        flyerCaption: flyerCaption.trim() || undefined,
        flyerFileName: flyerFileName || undefined,
        flyerFileData: flyerFileData || undefined,
        status: editingProgram ? editingProgram.status : 'Sedang Berjalan',
        tanggalPengajuan: editingProgram?.tanggalPengajuan || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan program.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              {editingProgram ? 'Edit Program Mitra' : 'Buat Program Mitra Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Isi flyer, nama program, tahun ajaran, kategori, dan sasaran peserta.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. FLYER PORTRAIT UPLOAD / PREVIEW */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Flyer Program (Format Potret)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Thumbnail Box */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden transition shrink-0 group relative shadow-xs"
              >
                {flyerUrl ? (
                  <>
                    <img 
                      src={flyerUrl} 
                      alt="Flyer Preview" 
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                      Ganti Foto
                    </div>
                  </>
                ) : (
                  <div className="p-2 text-center text-slate-400 group-hover:text-blue-600">
                    <ImageIcon size={28} className="mx-auto mb-1" />
                    <span className="text-[10px] font-bold block leading-tight">Unggah Flyer Potret</span>
                  </div>
                )}
              </div>

              {/* Upload Controls & URL */}
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFlyerFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Upload size={14} />
                  <span>Pilih File Gambar</span>
                </button>
                <div className="relative">
                  <input
                    type="text"
                    value={flyerUrl.startsWith('data:') ? '' : flyerUrl}
                    onChange={(e) => {
                      setFlyerUrl(e.target.value);
                      setFlyerFileData('');
                    }}
                    placeholder="Atau tempel URL gambar / Canva..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={flyerCaption}
                  onChange={(e) => setFlyerCaption(e.target.value)}
                  placeholder="Keterangan singkat flyer (opsional)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 2. NAMA PROGRAM */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Program <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Magang Guru Inklusi & Shadow Teacher Gelombang II"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3. TAHUN AJARAN & KATEGORI PROGRAM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Ajaran (TA)
              </label>
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STANDARD_TAHUN_AJARAN_LIST.map((ta) => (
                  <option key={ta} value={ta}>
                    TA {ta}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Program
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as ProgramMitraJenis)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {KATEGORI_PROGRAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. TANGGAL KEGIATAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Selesai (Opsional)
              </label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 5. SASARAN SEKOLAH */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Sasaran Sekolah Mitra
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'SEMUA'}
                  onChange={() => setTargetScope('SEMUA')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Semua Sekolah Mitra</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'SPESIFIK'}
                  onChange={() => setTargetScope('SPESIFIK')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Sekolah Tertentu</span>
              </label>
            </div>

            {targetScope === 'SPESIFIK' && (
              <select
                value={selectedSekolahId}
                onChange={(e) => setSelectedSekolahId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
              >
                {sekolahList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah} ({s.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 6. SASARAN PESERTA (DIISI OLEH ADMIN) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Sasaran Peserta ({pesertaList.length} Peserta Terdaftar)
                </label>
                <span className="text-[11px] text-slate-500">
                  Peserta yang login hanya bisa melihat dokumen miliknya sendiri.
                </span>
              </div>
            </div>

            {/* List Peserta Terdaftar */}
            {pesertaList.length > 0 ? (
              <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden max-h-44 overflow-y-auto">
                {pesertaList.map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-800 font-bold">{p.nama}</strong>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {p.namaSekolah || p.sekolahId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {p.peran || 'Peserta'} {p.email ? `• ${p.email}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePeserta(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Hapus peserta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                Belum ada nama peserta ditambahkan. Anda dapat menambahkan peserta di bawah ini:
              </div>
            )}

            {/* Form Tambah Peserta Langsung */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
              <input
                type="text"
                value={newPesertaNama}
                onChange={(e) => setNewPesertaNama(e.target.value)}
                placeholder="Nama peserta / guru..."
                className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newPesertaPeran}
                onChange={(e) => setNewPesertaPeran(e.target.value)}
                placeholder="Peran (mis: Guru Inklusi)"
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddPeserta}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>+ Peserta</span>
              </button>
            </div>
          </div>

          {/* 7. DOKUMEN PANDUAN DARI ADMIN (OPSIONAL) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Dokumen Panduan / Template Pendukung (Opsional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={panduanNama}
                onChange={(e) => setPanduanNama(e.target.value)}
                placeholder="Judul (mis: Buku Panduan Magang & Rubrik)"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={panduanUrl}
                onChange={(e) => setPanduanUrl(e.target.value)}
                placeholder="Tautan Google Drive / Docs / PDF..."
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : (editingProgram ? 'Simpan Perubahan' : 'Buat Program')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
