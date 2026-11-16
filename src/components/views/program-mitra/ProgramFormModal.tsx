import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertCircle,
  Building2,
  Check
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
  
  // Sasaran Sekolah (Bisa Beberapa Sekolah atau Semua Sekolah)
  const [targetScope, setTargetScope] = useState<'SEMUA' | 'BEBERAPA'>('SEMUA');
  const [selectedSekolahIds, setSelectedSekolahIds] = useState<string[]>([]);
  const [deskripsi, setDeskripsi] = useState('');

  // Flyer State (Portrait 3:4)
  const [flyerUrl, setFlyerUrl] = useState('');
  const [flyerCaption, setFlyerCaption] = useState('');
  const [flyerFileName, setFlyerFileName] = useState('');
  const [flyerFileData, setFlyerFileData] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sasaran Peserta List
  const [pesertaList, setPesertaList] = useState<PesertaMagangItem[]>([]);
  const [activeSchoolForNewPeserta, setActiveSchoolForNewPeserta] = useState<string>('');
  const [newPesertaNama, setNewPesertaNama] = useState('');
  const [newPesertaPeran, setNewPesertaPeran] = useState('');
  const [newPesertaEmail, setNewPesertaEmail] = useState('');

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
      
      const isSemua = editingProgram.sasaranSekolahNama === 'Semua Sekolah Mitra' || 
        !editingProgram.mitraId || 
        editingProgram.mitraId === 'ALL' ||
        (editingProgram.sasaranSekolahIds && editingProgram.sasaranSekolahIds.length === sekolahList.length);

      if (isSemua) {
        setTargetScope('SEMUA');
        setSelectedSekolahIds(sekolahList.map(s => s.id));
      } else {
        setTargetScope('BEBERAPA');
        const ids = editingProgram.sasaranSekolahIds && editingProgram.sasaranSekolahIds.length > 0 
          ? editingProgram.sasaranSekolahIds 
          : (editingProgram.mitraId ? [editingProgram.mitraId] : [sekolahList[0]?.id || 'MO004']);
        setSelectedSekolahIds(ids);
      }

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
      setSelectedSekolahIds(sekolahList.map(s => s.id));
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

  // Active target schools list based on targetScope
  const activeTargetSchools = useMemo(() => {
    if (targetScope === 'SEMUA') {
      return sekolahList;
    }
    return sekolahList.filter(s => selectedSekolahIds.includes(s.id));
  }, [targetScope, selectedSekolahIds, sekolahList]);

  // Set default active school for new participant
  useEffect(() => {
    if (activeTargetSchools.length > 0) {
      if (!activeSchoolForNewPeserta || !activeTargetSchools.some(s => s.id === activeSchoolForNewPeserta)) {
        setActiveSchoolForNewPeserta(activeTargetSchools[0].id);
      }
    } else {
      setActiveSchoolForNewPeserta('');
    }
  }, [activeTargetSchools, activeSchoolForNewPeserta]);

  if (!isOpen) return null;

  // Toggle school selection for multiple schools
  const handleToggleSchool = (schoolId: string) => {
    setSelectedSekolahIds(prev => {
      if (prev.includes(schoolId)) {
        if (prev.length === 1) {
          setErrorMsg('Minimal pilih 1 sekolah sasaran.');
          return prev;
        }
        setErrorMsg('');
        return prev.filter(id => id !== schoolId);
      } else {
        setErrorMsg('');
        return [...prev, schoolId];
      }
    });
  };

  const handleSelectAllSchools = () => {
    setTargetScope('SEMUA');
    setSelectedSekolahIds(sekolahList.map(s => s.id));
    setErrorMsg('');
  };

  const handleSelectMultipleMode = () => {
    setTargetScope('BEBERAPA');
    if (selectedSekolahIds.length === 0 || selectedSekolahIds.length === sekolahList.length) {
      // Default pick first 2 schools
      setSelectedSekolahIds(sekolahList.slice(0, 2).map(s => s.id));
    }
    setErrorMsg('');
  };

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

  // Add participant to a specific school
  const handleAddPesertaToSchool = (targetSchoolId: string) => {
    if (!newPesertaNama.trim()) {
      setErrorMsg('Masukkan nama peserta terlebih dahulu.');
      return;
    }

    const schoolObj = sekolahList.find(s => s.id === targetSchoolId);
    const newPeserta: PesertaMagangItem = {
      id: `PESERTA-${Date.now().toString().slice(-6)}`,
      nama: newPesertaNama.trim(),
      peran: newPesertaPeran.trim() || 'Peserta Program',
      email: newPesertaEmail.trim() || undefined,
      sekolahId: schoolObj?.id || targetSchoolId,
      namaSekolah: schoolObj?.namaSekolah || 'Sekolah Mitra',
      dokumenPribadi: [],
    };

    setPesertaList(prev => [...prev, newPeserta]);
    setNewPesertaNama('');
    setNewPesertaPeran('');
    setNewPesertaEmail('');
    setErrorMsg('');
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

    if (targetScope === 'BEBERAPA' && selectedSekolahIds.length === 0) {
      setErrorMsg('Pilih minimal satu sekolah sasaran.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const isSemua = targetScope === 'SEMUA' || selectedSekolahIds.length === sekolahList.length;
      const targetSchoolObjects = isSemua 
        ? sekolahList 
        : sekolahList.filter(s => selectedSekolahIds.includes(s.id));

      const sasaranSekolahNama = isSemua 
        ? 'Semua Sekolah Mitra' 
        : (targetSchoolObjects.length === 1 
            ? targetSchoolObjects[0].namaSekolah 
            : `${targetSchoolObjects.length} Sekolah (${targetSchoolObjects.map(s => s.namaSekolah).join(', ')})`);

      const finalSasaranIds = isSemua ? sekolahList.map(s => s.id) : selectedSekolahIds;
      const mitraId = isSemua ? 'ALL' : (selectedSekolahIds[0] || 'ALL');

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
        sasaranSekolahIds: finalSasaranIds,
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              {editingProgram ? 'Edit Program Mitra' : 'Buat Program Mitra Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan flyer, nama program, tahun ajaran, kategori, beberapa sekolah sasaran, serta peserta tiap sekolah.
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

          {/* 5. SASARAN SEKOLAH (BISA BEBERAPA SEKOLAH) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Sasaran Sekolah Mitra
                </label>
                <span className="text-[11px] text-slate-500">
                  Pilih semua sekolah atau tandai beberapa sekolah sekaligus.
                </span>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={handleSelectAllSchools}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    targetScope === 'SEMUA'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua Sekolah ({sekolahList.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectMultipleMode}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    targetScope === 'BEBERAPA'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pilih Beberapa Sekolah ({selectedSekolahIds.length})
                </button>
              </div>
            </div>

            {/* Checklist of Multiple Target Schools */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                Daftar Sekolah Mitra Sasaran ({activeTargetSchools.length} Sekolah Terpilih):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {sekolahList.map((s) => {
                  const isChecked = targetScope === 'SEMUA' || selectedSekolahIds.includes(s.id);

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (targetScope === 'SEMUA') {
                          // Switch to specific and uncheck this one
                          setTargetScope('BEBERAPA');
                          setSelectedSekolahIds(sekolahList.filter(item => item.id !== s.id).map(item => item.id));
                        } else {
                          handleToggleSchool(s.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                        isChecked 
                          ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold block truncate">{s.namaSekolah}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{s.id} • {s.kota}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. SASARAN PESERTA PER SETIAP SEKOLAH */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                  Peserta per Setiap Sekolah ({pesertaList.length} Peserta Terdaftar)
                </label>
                <span className="text-[11px] text-slate-500">
                  Tambahkan peserta untuk setiap sekolah sasaran. Peserta yang login hanya bisa melihat dokumen pribadinya sendiri.
                </span>
              </div>
            </div>

            {/* Quick Add Participant Input Form */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">
                + Tambah Peserta Baru
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Select School */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sekolah Asal</label>
                  <select
                    value={activeSchoolForNewPeserta}
                    onChange={(e) => setActiveSchoolForNewPeserta(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {activeTargetSchools.map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Peserta</label>
                  <input
                    type="text"
                    value={newPesertaNama}
                    onChange={(e) => setNewPesertaNama(e.target.value)}
                    placeholder="Nama guru / delegasi..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Role */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Peran / Posisi</label>
                  <input
                    type="text"
                    value={newPesertaPeran}
                    onChange={(e) => setNewPesertaPeran(e.target.value)}
                    placeholder="mis: Guru Inklusi"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Button */}
                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={() => handleAddPesertaToSchool(activeSchoolForNewPeserta)}
                    className="w-full px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* Optional Email input */}
              <div>
                <input
                  type="email"
                  value={newPesertaEmail}
                  onChange={(e) => setNewPesertaEmail(e.target.value)}
                  placeholder="Email peserta (opsional, untuk sinkronisasi akun saat login)"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* GROUPED PARTICIPANTS PER SCHOOL */}
            <div className="space-y-3 pt-1">
              {activeTargetSchools.map(school => {
                const schoolPeserta = pesertaList.filter(p => p.sekolahId === school.id);

                return (
                  <div key={school.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* School Header */}
                    <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-blue-600" />
                        <strong className="text-xs font-bold text-slate-800">{school.namaSekolah}</strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                          {school.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {schoolPeserta.length} Peserta
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSchoolForNewPeserta(school.id);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                        >
                          + Tambah Peserta
                        </button>
                      </div>
                    </div>

                    {/* School Participants List */}
                    {schoolPeserta.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {schoolPeserta.map(p => (
                          <div key={p.id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50">
                            <div>
                              <strong className="text-slate-800 font-bold block">{p.nama}</strong>
                              <span className="text-[11px] text-slate-500">
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
                      <div className="p-3 text-center text-[11px] text-slate-400">
                        Belum ada peserta dari {school.namaSekolah}.
                      </div>
                    )}
                  </div>
                );
              })}
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
