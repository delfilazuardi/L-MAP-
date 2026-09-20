import React, { useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  BarChart3, 
  Plus, 
  X,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PerformanceMendaki } from '../../types';

export const PerformanceMendakiView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { performanceList, sekolahList, updatePerformance, deletePerformance } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSekolah, setSelectedSekolah] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PerformanceMendaki | null>(null);

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus evaluasi MenDAKI untuk "${nama}"?`)) {
      await deletePerformance(id);
    }
  };

  // Form State
  const [formMitraId, setFormMitraId] = useState(sekolahList[0]?.id || 'MO004');
  const [formSkorM, setFormSkorM] = useState<number>(88);
  const [formSkorD, setFormSkorD] = useState<number>(90);
  const [formSkorA, setFormSkorA] = useState<number>(92);
  const [formSkorK, setFormSkorK] = useState<number>(86);
  const [formSkorI, setFormSkorI] = useState<number>(85);
  const [formKekuatan, setFormKekuatan] = useState('');
  const [formRekomendasi, setFormRekomendasi] = useState('');

  const baseList = isAdmin 
    ? performanceList 
    : performanceList.filter(p => p.mitraId === currentUser?.sekolahId);

  const filtered = baseList.filter(p => {
    const matchSearch = p.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.predikat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSekolah = selectedSekolah === 'ALL' || p.mitraId === selectedSekolah;
    return matchSearch && matchSekolah;
  });

  const handleOpenEdit = (item: PerformanceMendaki) => {
    setEditingItem(item);
    setFormMitraId(item.mitraId);
    setFormSkorM(item.pilarM ?? item.skorManajemen ?? 85);
    setFormSkorD(item.pilarD ?? item.skorKurikulum ?? 85);
    setFormSkorA(item.pilarA ?? item.skorSDM ?? 88);
    setFormSkorK(item.pilarK ?? item.skorKemitraan ?? 85);
    setFormSkorI(item.pilarI ?? item.skorBranding ?? 85);
    setFormKekuatan(item.kekuatan || 'Penerapan nilai dan standar Lazuardi berjalan baik.');
    setFormRekomendasi(item.rekomendasi || item.catatanRekomendasi || 'Tingkatkan keterlibatan.');
    setIsModalOpen(true);
  };


  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormMitraId(sekolahList[0]?.id || 'MO004');
    setFormSkorM(88);
    setFormSkorD(88);
    setFormSkorA(90);
    setFormSkorK(85);
    setFormSkorI(85);
    setFormKekuatan('');
    setFormRekomendasi('');
    setIsModalOpen(true);
  };

  const calculateGrade = (total: number): 'A+' | 'A' | 'B' | 'C' => {
    if (total >= 92) return 'A+';
    if (total >= 85) return 'A';
    if (total >= 75) return 'B';
    return 'C';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSchool = sekolahList.find(s => s.id === formMitraId);
    const avg = Number(((formSkorM + formSkorD + formSkorA + formSkorK + formSkorI) / 5).toFixed(1));
    const grade = calculateGrade(avg);
    const today = new Date().toISOString().split('T')[0];

    await updatePerformance({
      id: editingItem ? editingItem.id : `PERF-${formMitraId}`,
      mitraId: formMitraId,
      namaSekolah: targetSchool ? targetSchool.namaSekolah : 'Sekolah Mitra',
      periode: 'Semester Ganjil 2026/2027',
      pilarM: formSkorM,
      pilarD: formSkorD,
      pilarA: formSkorA,
      pilarK: formSkorK,
      pilarI: formSkorI,
      totalSkor: avg,
      predikat: grade,
      tanggalEvaluasi: today,
      kekuatan: formKekuatan || 'Implementasi nilai Lazuardi terlaksana dengan tertib.',
      rekomendasi: formRekomendasi || 'Tingkatkan pendokumentasian pembelajaran diferensiasi.',
    });

    setIsModalOpen(false);
  };

  const pillarsInfo = [
    { code: 'M', title: 'Manajemen & Kepemimpinan', desc: 'Tata kelola institusi, kepatuhan legal, dan SOP' },
    { code: 'D', title: 'Didaktik & Kurikulum', desc: 'Pembelajaran inklusif & diferensiasi kelas' },
    { code: 'A', title: 'Akhlak & Karakter', desc: 'Budaya welas asih dan spiritualitas Lazuardi' },
    { code: 'K', title: 'Kolaborasi Orang Tua', desc: 'Parent partnership & keterlibatan komunitas' },
    { code: 'I', title: 'Inovasi & Budaya Sekolah', desc: 'Digitalisasi, riset guru, dan kreativitas' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={22} className="text-blue-600" />
            <span>Evaluasi Mutu & Kinerja MenDAKI</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standar Akreditasi Internal Lazuardi: Manajemen, Didaktik, Akhlak, Kolaborasi, dan Inovasi
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-input-mendaki"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Input Evaluasi MenDAKI Baru</span>
          </button>
        )}
      </div>

      {/* MenDAKI Pillars Framework Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            5 Pilar Penjaminan Mutu Lazuardi (MenDAKI)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {pillarsInfo.map((p) => (
            <div key={p.code} className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs mb-1.5 shadow-xs">
                  {p.code}
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">{p.title}</div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-mendaki"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari sekolah atau predikat (A+, A, B)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {isAdmin && (
          <select
            id="filter-sekolah-mendaki"
            value={selectedSekolah}
            onChange={(e) => setSelectedSekolah(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Sekolah Mitra</option>
            {sekolahList.map(s => (
              <option key={s.id} value={s.id}>{s.namaSekolah}</option>
            ))}
          </select>
        )}
      </div>

      {/* Performance Cards List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div 
            key={item.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-300 shadow-xs transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{item.namaSekolah}</h3>
                  <span className="text-xs font-mono text-slate-400">({item.mitraId})</span>
                </div>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">
                  Periode Evaluasi: {item.periode} • Tanggal Asesmen: {item.tanggalEvaluasi}
                </p>
              </div>

              {/* Overall Score Badge */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor Rata-Rata</span>
                  <span className="text-2xl font-black text-slate-900">{item.totalSkor}</span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
                  item.predikat === 'A+' ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white' :
                  item.predikat === 'A' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white' :
                  'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                }`}>
                  {item.predikat}
                </div>
              </div>
            </div>

            {/* 5 Pillars Score Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { code: 'M', name: 'Manajemen', val: item.pilarM ?? item.skorManajemen ?? 85 },
                { code: 'D', name: 'Didaktik', val: item.pilarD ?? item.skorKurikulum ?? 85 },
                { code: 'A', name: 'Akhlak', val: item.pilarA ?? item.skorSDM ?? 88 },
                { code: 'K', name: 'Kolaborasi', val: item.pilarK ?? item.skorKemitraan ?? 85 },
                { code: 'I', name: 'Inovasi', val: item.pilarI ?? item.skorBranding ?? 85 },
              ].map(pilar => (

                <div key={pilar.code} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Pilar {pilar.code}</span>
                    <span className="font-black text-blue-900">{pilar.val} / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        pilar.val >= 90 ? 'bg-emerald-500' : pilar.val >= 80 ? 'bg-blue-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pilar.val}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500">{pilar.name}</div>
                </div>
              ))}
            </div>

            {/* Analysis & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-emerald-950">
                <span className="font-bold text-emerald-900 block mb-1">Capaian Unggulan (Kekuatan):</span>
                <p className="text-emerald-900/90 leading-relaxed">{item.kekuatan}</p>
              </div>
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-blue-950">
                <span className="font-bold text-blue-900 block mb-1">Area Rekomendasi Perbaikan:</span>
                <p className="text-blue-900/90 leading-relaxed">{item.rekomendasi}</p>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="px-4 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Edit Penilaian MenDAKI
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.namaSekolah)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL: Form MenDAKI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Perbarui Evaluasi MenDAKI' : 'Form Penilaian Mutu MenDAKI'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sekolah Mitra Dievaluasi</label>
                <select
                  disabled={!!editingItem}
                  value={formMitraId}
                  onChange={(e) => setFormMitraId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {sekolahList.map(s => (
                    <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilar M (Manajemen)</label>
                  <input
                    type="number"
                    max={100}
                    min={50}
                    required
                    value={formSkorM}
                    onChange={(e) => setFormSkorM(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilar D (Didaktik)</label>
                  <input
                    type="number"
                    max={100}
                    min={50}
                    required
                    value={formSkorD}
                    onChange={(e) => setFormSkorD(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilar A (Akhlak)</label>
                  <input
                    type="number"
                    max={100}
                    min={50}
                    required
                    value={formSkorA}
                    onChange={(e) => setFormSkorA(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilar K (Kolaborasi)</label>
                  <input
                    type="number"
                    max={100}
                    min={50}
                    required
                    value={formSkorK}
                    onChange={(e) => setFormSkorK(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilar I (Inovasi)</label>
                  <input
                    type="number"
                    max={100}
                    min={50}
                    required
                    value={formSkorI}
                    onChange={(e) => setFormSkorI(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kekuatan & Keunggulan</label>
                <textarea
                  rows={2}
                  required
                  value={formKekuatan}
                  onChange={(e) => setFormKekuatan(e.target.value)}
                  placeholder="Hal positif yang sudah dicapai..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rekomendasi Tindak Lanjut</label>
                <textarea
                  rows={2}
                  required
                  value={formRekomendasi}
                  onChange={(e) => setFormRekomendasi(e.target.value)}
                  placeholder="Saran perbaikan untuk peningkatan mutu..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  Simpan Nilai MenDAKI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
