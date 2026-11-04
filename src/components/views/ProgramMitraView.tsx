import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  School, 
  Eye, 
  Edit3, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  GraduationCap, 
  Award, 
  Building2, 
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ProgramMitraItem, ProgramMitraJenis, SekolahMitra } from '../../types';
import { STANDARD_TAHUN_AJARAN_LIST } from '../../lib/invoiceUtils';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { FlyerPreviewModal } from './program-mitra/FlyerPreviewModal';
import { ProgramFormModal } from './program-mitra/ProgramFormModal';
import { ProgramDetailModal } from './program-mitra/ProgramDetailModal';

export const ProgramMitraView: React.FC = () => {
  const { currentUser, isAdmin, isSekolahMitra, isGuruMitra } = useAuth();
  const { 
    programMitraList, 
    sekolahList, 
    addProgramMitra, 
    updateProgramMitra, 
    deleteProgramMitra 
  } = useData();

  // Filter States
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('ALL');
  const [selectedSekolah, setSelectedSekolah] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramMitraItem | null>(null);
  
  const [detailProgram, setDetailProgram] = useState<ProgramMitraItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramMitraItem | null>(null);

  const [flyerPreviewTarget, setFlyerPreviewTarget] = useState<{
    url: string;
    title: string;
    caption?: string;
    school?: string;
  } | null>(null);

  // Kategori List
  const kategoriTabs: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'Semua Program', icon: <Layers size={14} /> },
    { id: 'Visitasi', label: 'Visitasi', icon: <Building2 size={14} /> },
    { id: 'LATOF', label: 'LATOF', icon: <Sparkles size={14} /> },
    { id: 'Training of Trainers', label: 'Training of Trainers', icon: <Award size={14} /> },
    { id: 'Magang', label: 'Magang Guru', icon: <GraduationCap size={14} /> },
  ];

  // Base list filtered by current user school if logged in as school
  const basePrograms = useMemo(() => {
    if (isAdmin) return programMitraList;
    if (isSekolahMitra && currentUser?.sekolahId) {
      return programMitraList.filter(p => 
        !p.mitraId || 
        p.mitraId === 'ALL' || 
        p.mitraId === currentUser.sekolahId ||
        p.sasaranSekolahIds?.includes(currentUser.sekolahId) ||
        p.sasaranSekolahNama === 'Semua Sekolah Mitra'
      );
    }
    if (isGuruMitra) {
      // Guru can see programs targeting all schools, their school, or where they are enrolled
      return programMitraList.filter(p => {
        const isTargetSchool = !p.mitraId || 
          p.mitraId === 'ALL' || 
          p.mitraId === currentUser?.sekolahId ||
          p.sasaranSekolahIds?.includes(currentUser?.sekolahId || '') ||
          p.sasaranSekolahNama === 'Semua Sekolah Mitra';

        const isUserEnrolled = (p.pesertaMagang || []).some(peserta => {
          if (currentUser?.email && peserta.email && peserta.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
          if (currentUser?.nama && peserta.nama && (peserta.nama.toLowerCase().includes(currentUser.nama.toLowerCase()) || currentUser.nama.toLowerCase().includes(peserta.nama.toLowerCase()))) return true;
          return false;
        });

        return isTargetSchool || isUserEnrolled;
      });
    }
    return programMitraList;
  }, [programMitraList, isAdmin, isSekolahMitra, isGuruMitra, currentUser]);

  // Available academic years
  const availableYears = useMemo(() => {
    const set = new Set<string>(STANDARD_TAHUN_AJARAN_LIST);
    basePrograms.forEach(p => {
      if (p.tahunAjaran) set.add(p.tahunAjaran);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [basePrograms]);

  // Filtered programs
  const filteredPrograms = useMemo(() => {
    return basePrograms.filter(item => {
      // Kategori Filter
      if (selectedKategori !== 'ALL') {
        const itemKat = (item.jenis || '').toLowerCase();
        const targetKat = selectedKategori.toLowerCase();
        if (targetKat === 'magang') {
          if (!itemKat.includes('magang')) return false;
        } else if (targetKat === 'training of trainers') {
          if (!itemKat.includes('trainer') && !itemKat.includes('tot')) return false;
        } else if (targetKat === 'latof') {
          if (!itemKat.includes('latof')) return false;
        } else if (targetKat === 'visitasi') {
          if (!itemKat.includes('visitasi')) return false;
        } else {
          if (itemKat !== targetKat) return false;
        }
      }

      // Tahun Ajaran Filter
      if (selectedTahunAjaran !== 'ALL') {
        const itemTA = item.tahunAjaran || '2026/2027';
        if (itemTA !== selectedTahunAjaran) return false;
      }

      // Sekolah Filter
      if (selectedSekolah !== 'ALL') {
        const matchSchool = item.mitraId === selectedSekolah || 
          item.sasaranSekolahIds?.includes(selectedSekolah) ||
          item.mitraId === 'ALL' ||
          item.sasaranSekolahNama === 'Semua Sekolah Mitra';
        if (!matchSchool) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (item.judul || '').toLowerCase().includes(q);
        const matchDesc = (item.deskripsi || '').toLowerCase().includes(q);
        const matchSchool = (item.namaSekolah || '').toLowerCase().includes(q);
        const matchPeserta = (item.peserta || '').toLowerCase().includes(q) ||
          (item.pesertaMagang || []).some(p => p.nama.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSchool && !matchPeserta) return false;
      }

      return true;
    });
  }, [basePrograms, selectedKategori, selectedTahunAjaran, selectedSekolah, searchQuery]);

  // Summary counts
  const countVisitasi = basePrograms.filter(p => (p.jenis || '').toLowerCase().includes('visitasi')).length;
  const countLatof = basePrograms.filter(p => (p.jenis || '').toLowerCase().includes('latof')).length;
  const countTot = basePrograms.filter(p => (p.jenis || '').toLowerCase().includes('trainer') || (p.jenis || '').toLowerCase().includes('tot')).length;
  const countMagang = basePrograms.filter(p => (p.jenis || '').toLowerCase().includes('magang')).length;

  // Handlers
  const handleOpenAdd = () => {
    setEditingProgram(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (program: ProgramMitraItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProgram(program);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (program: ProgramMitraItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(program);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteProgramMitra(deleteTarget.id);
    if (detailProgram?.id === deleteTarget.id) {
      setDetailProgram(null);
    }
    setDeleteTarget(null);
  };

  const handleSaveProgram = async (programData: Partial<ProgramMitraItem>) => {
    if (editingProgram) {
      await updateProgramMitra({
        ...editingProgram,
        ...programData,
      } as ProgramMitraItem);
      // Update detail if open
      if (detailProgram?.id === editingProgram.id) {
        setDetailProgram({
          ...detailProgram,
          ...programData,
        } as ProgramMitraItem);
      }
    } else {
      await addProgramMitra(programData as ProgramMitraItem);
    }
  };

  const handleUpdateProgramFromDetail = async (updated: ProgramMitraItem) => {
    await updateProgramMitra(updated);
    setDetailProgram(updated);
  };

  const getCategoryTheme = (kat?: string) => {
    const k = (kat || '').toLowerCase();
    if (k.includes('visitasi')) {
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        iconBg: 'bg-blue-600 text-white',
        icon: <Building2 size={16} />,
      };
    }
    if (k.includes('latof')) {
      return {
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        iconBg: 'bg-indigo-600 text-white',
        icon: <Sparkles size={16} />,
      };
    }
    if (k.includes('trainer') || k.includes('tot')) {
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-600 text-white',
        icon: <Award size={16} />,
      };
    }
    if (k.includes('magang')) {
      return {
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-600 text-white',
        icon: <GraduationCap size={16} />,
      };
    }
    return {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      icon: <Briefcase size={16} />,
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & SUMMARY BAR */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Peningkatan Mutu Kemitraan
              </span>
              {isGuruMitra && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <UserCheck size={11} />
                  <span>Akses Guru Mitra</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Program Mitra
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
              Program kegiatan kemitraan Lazuardi: Visitasi, LATOF, Training of Trainers, dan Magang Guru.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 sm:px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Plus size={18} />
              <span>+ Buat Program Baru</span>
            </button>
          )}
        </div>

        {/* Quick KPI Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Total Program</span>
            <strong className="text-lg font-black text-white mt-0.5 block">{basePrograms.length}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Visitasi</span>
            <strong className="text-lg font-black text-blue-300 mt-0.5 block">{countVisitasi}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">LATOF</span>
            <strong className="text-lg font-black text-indigo-300 mt-0.5 block">{countLatof}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block">ToT</span>
            <strong className="text-lg font-black text-amber-300 mt-0.5 block">{countTot}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Magang Guru</span>
            <strong className="text-lg font-black text-emerald-300 mt-0.5 block">{countMagang}</strong>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {kategoriTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedKategori(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedKategori === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Filter Dropdowns & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama program, nama kegiatan, atau peserta..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Tahun Ajaran */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={selectedTahunAjaran}
              onChange={(e) => setSelectedTahunAjaran(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Semua Tahun Ajaran</option>
              {availableYears.map(ta => (
                <option key={ta} value={ta}>TA {ta}</option>
              ))}
            </select>
          </div>

          {/* Filter Sekolah (for Admin) */}
          {isAdmin && (
            <div className="w-full sm:w-52 shrink-0">
              <select
                value={selectedSekolah}
                onChange={(e) => setSelectedSekolah(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">Semua Sekolah Sasaran</option>
                {sekolahList.map(s => (
                  <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 3. PROGRAM CARDS LIST */}
      {filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrograms.map((item) => {
            const theme = getCategoryTheme(item.jenis);
            const userEmail = (currentUser?.email || '').toLowerCase().trim();
            const userNama = (currentUser?.nama || '').toLowerCase().trim();

            const myPesertaInCard = (item.pesertaMagang || []).find(p => {
              if (userEmail && p.email && p.email.toLowerCase().trim() === userEmail) return true;
              if (userNama && p.nama && (p.nama.toLowerCase().includes(userNama) || userNama.includes(p.nama.toLowerCase()))) return true;
              return false;
            });

            const isUserEnrolled = Boolean(myPesertaInCard);
            const myDocsCount = myPesertaInCard?.dokumenPribadi?.length || 0;

            return (
              <div
                key={item.id}
                onClick={() => setDetailProgram(item)}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  {/* Flyer Portrait Thumbnail */}
                  <div 
                    onClick={(e) => {
                      if (item.flyerUrl) {
                        e.stopPropagation();
                        setFlyerPreviewTarget({
                          url: item.flyerUrl,
                          title: item.judul,
                          caption: item.flyerCaption,
                          school: item.namaSekolah,
                        });
                      }
                    }}
                    className="w-24 h-32 rounded-2xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0 shadow-xs relative group/img cursor-pointer"
                  >
                    {item.flyerUrl ? (
                      <>
                        <img
                          src={item.flyerUrl}
                          alt={item.judul}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                          <Eye size={14} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-50">
                        {theme.icon}
                        <span className="text-[9px] font-bold mt-1 text-slate-500">Flyer Potret</span>
                      </div>
                    )}
                  </div>

                  {/* Program Main Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${theme.badge}`}>
                        {item.jenis}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        TA {item.tahunAjaran || '2026/2027'}
                      </span>
                      {isUserEnrolled && isGuruMitra && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          <span>Anda Terdaftar</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-800 leading-snug group-hover:text-blue-600 transition">
                      {item.judul}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-600 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.tanggalMulai} {item.tanggalSelesai ? `s/d ${item.tanggalSelesai}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <School size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.sasaranSekolahNama || item.namaSekolah}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section of Card */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                      <Users size={12} className="text-slate-500" />
                      <span>{item.pesertaMagang?.length || item.jumlahPeserta || 0} Peserta</span>
                    </span>

                    {isGuruMitra && isUserEnrolled && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        {myDocsCount} Dokumen Saya
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(item, e)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Program"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(item, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Hapus Program"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600 group-hover:translate-x-0.5 transition ml-1">
                      <span>Buka</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 space-y-3">
          <Briefcase size={36} className="mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-800">
            Tidak Ada Program Ditemukan
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedKategori !== 'ALL' || selectedTahunAjaran !== 'ALL'
              ? 'Coba sesuaikan kata kunci atau bersihkan filter di atas.'
              : 'Belum ada program mitra terdaftar. Admin dapat membuat program baru.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Buat Program Baru</span>
            </button>
          )}
        </div>
      )}

      {/* 4. MODALS */}
      {/* Create / Edit Program Modal (Admin only) */}
      <ProgramFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingProgram={editingProgram}
        sekolahList={sekolahList}
        onSave={handleSaveProgram}
      />

      {/* Program Detail & Personal Documents Management Modal */}
      <ProgramDetailModal
        isOpen={Boolean(detailProgram)}
        onClose={() => setDetailProgram(null)}
        program={detailProgram}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isGuruMitra={isGuruMitra}
        isSekolahMitra={isSekolahMitra}
        sekolahList={sekolahList}
        onUpdateProgram={handleUpdateProgramFromDetail}
        onOpenFlyerPreview={(flyer) => setFlyerPreviewTarget(flyer)}
      />

      {/* Flyer Full-Screen Preview Modal */}
      <FlyerPreviewModal
        isOpen={Boolean(flyerPreviewTarget)}
        onClose={() => setFlyerPreviewTarget(null)}
        flyer={flyerPreviewTarget}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Program Mitra"
        message={`Apakah Anda yakin ingin menghapus program "${deleteTarget?.judul}"? Seluruh data peserta dan dokumen terkait akan dihapus.`}
        confirmText="Ya, Hapus Program"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
