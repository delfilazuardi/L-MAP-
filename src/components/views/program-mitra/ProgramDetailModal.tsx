import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  School, 
  Users, 
  Plus, 
  Trash2, 
  FileText, 
  ExternalLink, 
  Upload, 
  Download, 
  Eye, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Lock,
  Sparkles,
  ChevronRight,
  BookOpen,
  Award
} from 'lucide-react';
import { ProgramMitraItem, PesertaMagangItem, DokumenPribadiPeserta, UserAccount, SekolahMitra } from '../../../types';
import { UploadDokumenModal } from './UploadDokumenModal';

interface ProgramDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: ProgramMitraItem | null;
  currentUser: UserAccount | null;
  isAdmin: boolean;
  isGuruMitra: boolean;
  isSekolahMitra: boolean;
  sekolahList: SekolahMitra[];
  onUpdateProgram: (updatedProgram: ProgramMitraItem) => Promise<void>;
  onOpenFlyerPreview: (flyer: { url: string; title: string; caption?: string; school?: string }) => void;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  isOpen,
  onClose,
  program,
  currentUser,
  isAdmin,
  isGuruMitra,
  isSekolahMitra,
  sekolahList,
  onUpdateProgram,
  onOpenFlyerPreview,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'peserta' | 'panduan'>('peserta');
  
  // State for Managing a Specific Participant's Documents (Admin mode)
  const [selectedPesertaForAdmin, setSelectedPesertaForAdmin] = useState<PesertaMagangItem | null>(null);

  // State for Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetPesertaForUpload, setTargetPesertaForUpload] = useState<PesertaMagangItem | null>(null);

  // State for Adding General Guide Document (Admin mode)
  const [isAddingPanduan, setIsAddingPanduan] = useState(false);
  const [newPanduanNama, setNewPanduanNama] = useState('');
  const [newPanduanTipe, setNewPanduanTipe] = useState<'Panduan' | 'MoU' | 'Surat Tugas' | 'Materi'>('Panduan');
  const [newPanduanUrl, setNewPanduanUrl] = useState('');

  // State for per-school inline participant creation (Admin mode)
  const [activeInlineSchoolId, setActiveInlineSchoolId] = useState<string | null>(null);
  const [inlinePesertaNama, setInlinePesertaNama] = useState('');
  const [inlinePesertaPeran, setInlinePesertaPeran] = useState('');
  const [inlinePesertaEmail, setInlinePesertaEmail] = useState('');

  // State for adding additional target school to program
  const [isAddingSchoolToProgram, setIsAddingSchoolToProgram] = useState(false);
  const [selectedSchoolToAdd, setSelectedSchoolToAdd] = useState('');

  if (!isOpen || !program) return null;

  // Find if current logged-in user is a Guru and if they are enrolled in this program
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const userNama = (currentUser?.nama || '').toLowerCase().trim();

  const myPesertaIndex = (program.pesertaMagang || []).findIndex(p => {
    if (userEmail && p.email && p.email.toLowerCase().trim() === userEmail) return true;
    if (userNama && p.nama && (p.nama.toLowerCase().includes(userNama) || userNama.includes(p.nama.toLowerCase()))) return true;
    return false;
  });

  const myPeserta: PesertaMagangItem | null = myPesertaIndex >= 0 ? program.pesertaMagang![myPesertaIndex] : null;

  // Handler: Guru enrolls self into program
  const handleEnrollSelf = async () => {
    if (!currentUser) return;
    const newP: PesertaMagangItem = {
      id: `PESERTA-${Date.now().toString().slice(-6)}`,
      nama: currentUser.nama,
      email: currentUser.email,
      peran: currentUser.mapel || 'Guru Mitra',
      sekolahId: currentUser.sekolahId || program.mitraId,
      namaSekolah: currentUser.namaSekolah || program.namaSekolah,
      dokumenPribadi: [],
    };

    const currentList = program.pesertaMagang || [];
    const updatedProgram: ProgramMitraItem = {
      ...program,
      pesertaMagang: [...currentList, newP],
      jumlahPeserta: currentList.length + 1,
      peserta: [...currentList.map(p => p.nama), newP.nama].join(', '),
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);
  };

  // Handler: Save personal document (uploaded by either guru or admin)
  const handleSaveDocument = async (doc: DokumenPribadiPeserta) => {
    const targetPeserta = targetPesertaForUpload || myPeserta;
    if (!targetPeserta) return;

    const currentPesertaList = program.pesertaMagang || [];
    const updatedPesertaList = currentPesertaList.map(p => {
      if (p.id === targetPeserta.id) {
        const currentDocs = p.dokumenPribadi || [];
        return {
          ...p,
          dokumenPribadi: [doc, ...currentDocs],
        };
      }
      return p;
    });

    const updatedProgram: ProgramMitraItem = {
      ...program,
      pesertaMagang: updatedPesertaList,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);

    // Update selected peserta in admin view if open
    if (selectedPesertaForAdmin && selectedPesertaForAdmin.id === targetPeserta.id) {
      setSelectedPesertaForAdmin({
        ...selectedPesertaForAdmin,
        dokumenPribadi: [doc, ...(selectedPesertaForAdmin.dokumenPribadi || [])],
      });
    }
  };

  // Handler: Delete personal document
  const handleDeleteDocument = async (pesertaId: string, docId: string) => {
    const currentPesertaList = program.pesertaMagang || [];
    const updatedPesertaList = currentPesertaList.map(p => {
      if (p.id === pesertaId) {
        return {
          ...p,
          dokumenPribadi: (p.dokumenPribadi || []).filter(d => d.id !== docId),
        };
      }
      return p;
    });

    const updatedProgram: ProgramMitraItem = {
      ...program,
      pesertaMagang: updatedPesertaList,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);

    if (selectedPesertaForAdmin && selectedPesertaForAdmin.id === pesertaId) {
      setSelectedPesertaForAdmin({
        ...selectedPesertaForAdmin,
        dokumenPribadi: (selectedPesertaForAdmin.dokumenPribadi || []).filter(d => d.id !== docId),
      });
    }
  };

  // Target schools for this program
  const targetSchools: SekolahMitra[] = useMemo(() => {
    if (!program) return [];
    if (program.sasaranSekolahIds && program.sasaranSekolahIds.length > 0) {
      const filtered = sekolahList.filter(s => program.sasaranSekolahIds!.includes(s.id));
      if (filtered.length > 0) return filtered;
    }
    if (program.mitraId && program.mitraId !== 'ALL') {
      const match = sekolahList.find(s => s.id === program.mitraId);
      if (match) return [match];
    }
    return sekolahList;
  }, [program, sekolahList]);

  // Available schools not yet targeted in this program
  const availableSchoolsToAdd = useMemo(() => {
    const existingIds = new Set(targetSchools.map(s => s.id));
    return sekolahList.filter(s => !existingIds.has(s.id));
  }, [targetSchools, sekolahList]);

  // Handler: Add participant directly to a specific target school
  const handleSaveParticipantForSchool = async (school: SekolahMitra) => {
    if (!inlinePesertaNama.trim()) return;

    const newPeserta: PesertaMagangItem = {
      id: `PESERTA-${Date.now().toString().slice(-6)}`,
      nama: inlinePesertaNama.trim(),
      peran: inlinePesertaPeran.trim() || 'Peserta Program',
      email: inlinePesertaEmail.trim() || undefined,
      sekolahId: school.id,
      namaSekolah: school.namaSekolah,
      dokumenPribadi: [],
    };

    const currentList = program.pesertaMagang || [];
    const updatedProgram: ProgramMitraItem = {
      ...program,
      pesertaMagang: [...currentList, newPeserta],
      jumlahPeserta: currentList.length + 1,
      peserta: [...currentList.map(p => p.nama), newPeserta.nama].join(', '),
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);
    setInlinePesertaNama('');
    setInlinePesertaPeran('');
    setInlinePesertaEmail('');
    setActiveInlineSchoolId(null);
  };

  // Handler: Add target school to program
  const handleAddSchoolTarget = async () => {
    if (!selectedSchoolToAdd) return;
    const currentIds = program.sasaranSekolahIds && program.sasaranSekolahIds.length > 0 
      ? program.sasaranSekolahIds 
      : targetSchools.map(s => s.id);

    if (currentIds.includes(selectedSchoolToAdd)) return;
    const newIds = [...currentIds, selectedSchoolToAdd];
    const newTargetSchools = sekolahList.filter(s => newIds.includes(s.id));
    const newNama = newTargetSchools.length === sekolahList.length
      ? 'Semua Sekolah Mitra'
      : (newTargetSchools.length === 1 
          ? newTargetSchools[0].namaSekolah 
          : `${newTargetSchools.length} Sekolah (${newTargetSchools.map(s => s.namaSekolah).join(', ')})`);

    const updatedProgram: ProgramMitraItem = {
      ...program,
      sasaranSekolahIds: newIds,
      sasaranSekolahNama: newNama,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);
    setSelectedSchoolToAdd('');
    setIsAddingSchoolToProgram(false);
  };

  // Handler: Remove target school from program
  const handleRemoveSchoolTarget = async (schoolId: string) => {
    const currentIds = program.sasaranSekolahIds && program.sasaranSekolahIds.length > 0
      ? program.sasaranSekolahIds
      : targetSchools.map(s => s.id);

    if (currentIds.length <= 1) return;
    const newIds = currentIds.filter(id => id !== schoolId);
    const newTargetSchools = sekolahList.filter(s => newIds.includes(s.id));
    const newNama = newTargetSchools.length === sekolahList.length
      ? 'Semua Sekolah Mitra'
      : (newTargetSchools.length === 1 
          ? newTargetSchools[0].namaSekolah 
          : `${newTargetSchools.length} Sekolah (${newTargetSchools.map(s => s.namaSekolah).join(', ')})`);

    const updatedProgram: ProgramMitraItem = {
      ...program,
      sasaranSekolahIds: newIds,
      sasaranSekolahNama: newNama,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);
  };

  // Handler: Remove participant by Admin
  const handleAdminRemovePeserta = async (pesertaId: string) => {
    const currentList = program.pesertaMagang || [];
    const updatedList = currentList.filter(p => p.id !== pesertaId);
    const updatedProgram: ProgramMitraItem = {
      ...program,
      pesertaMagang: updatedList,
      jumlahPeserta: updatedList.length,
      peserta: updatedList.map(p => p.nama).join(', ') || 'Belum ada peserta terdaftar',
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);
    if (selectedPesertaForAdmin && selectedPesertaForAdmin.id === pesertaId) {
      setSelectedPesertaForAdmin(null);
    }
  };

  // Handler: Add general guide document
  const handleAddPanduan = async () => {
    if (!newPanduanNama.trim() || !newPanduanUrl.trim()) return;
    const newDoc = {
      id: `DOK-SEK-${Date.now().toString().slice(-6)}`,
      nama: newPanduanNama.trim(),
      tipe: newPanduanTipe,
      url: newPanduanUrl.trim(),
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: 'Dokumen panduan resmi program dari Admin',
      uploadedBy: 'admin',
    };

    const currentDocs = program.dokumenSekolah || [];
    const updatedProgram: ProgramMitraItem = {
      ...program,
      dokumenSekolah: [...currentDocs, newDoc],
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProgram(updatedProgram);
    setNewPanduanNama('');
    setNewPanduanUrl('');
    setIsAddingPanduan(false);
  };

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case 'Visitasi': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LATOF': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Training of Trainers': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Magang': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
          
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(program.jenis)}`}>
                {program.jenis}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                TA {program.tahunAjaran || '2026/2027'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6 flex-1">
            {/* Top Program Banner & Flyer Portrait */}
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
              {/* Flyer Portrait Thumbnail */}
              <div className="w-24 sm:w-28 h-32 sm:h-36 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative group cursor-pointer">
                {program.flyerUrl ? (
                  <>
                    <img 
                      src={program.flyerUrl} 
                      alt={program.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenFlyerPreview({
                        url: program.flyerUrl!,
                        title: program.judul,
                        caption: program.flyerCaption,
                        school: program.namaSekolah,
                      })}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1"
                    >
                      <Eye size={14} />
                      <span>Lihat Flyer</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-100">
                    <Sparkles size={24} className="mb-1 text-slate-400" />
                    <span className="text-[10px] font-bold">Tanpa Flyer</span>
                  </div>
                )}
              </div>

              {/* Program Overview */}
              <div className="space-y-1.5 flex-1">
                <h2 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                  {program.judul}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{program.tanggalMulai} {program.tanggalSelesai ? `s/d ${program.tanggalSelesai}` : ''}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <School size={13} className="text-slate-400" />
                    <span>{program.sasaranSekolahNama || program.namaSekolah}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-700">
                    <Users size={13} />
                    <span>{program.pesertaMagang?.length || program.jumlahPeserta || 0} Peserta Terdaftar</span>
                  </span>
                </div>
                {program.deskripsi && (
                  <p className="text-xs text-slate-500 pt-1 leading-relaxed line-clamp-2">
                    {program.deskripsi}
                  </p>
                )}
              </div>
            </div>

            {/* VIEW A: IF LOGGED IN AS GURU MITRA / PESERTA (STRICT PRIVACY) */}
            {isGuruMitra && !isAdmin && (
              <div className="space-y-4">
                {/* Status Enrollment Box */}
                {myPeserta ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                            Status: Terdaftar Sebagai Peserta
                          </span>
                          <strong className="text-xs sm:text-sm font-black text-slate-900 block">
                            {myPeserta.nama}
                          </strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTargetPesertaForUpload(myPeserta);
                          setIsUploadModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <Upload size={14} />
                        <span>+ Unggah Dokumen Saya</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/70 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                      <Lock size={13} className="shrink-0 text-emerald-600" />
                      <span>
                        Dokumen pribadi Anda bersifat <strong>privat</strong>. Hanya Anda dan Admin Mitra Office yang dapat mengaksesnya.
                      </span>
                    </div>

                    {/* Personal Documents List */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-black text-slate-800 block">
                        Daftar Dokumen Pribadi Saya ({(myPeserta.dokumenPribadi || []).length} Dokumen)
                      </span>

                      {(myPeserta.dokumenPribadi || []).length > 0 ? (
                        <div className="divide-y divide-emerald-100 bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-xs">
                          {myPeserta.dokumenPribadi!.map((doc) => (
                            <div key={doc.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${
                                    doc.tipe === 'Sertifikat' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                    doc.tipe === 'Surat Tugas' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    doc.tipe === 'Penilaian' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                    'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}>
                                    {doc.tipe}
                                  </span>
                                  <strong className="text-xs font-bold text-slate-800">
                                    {doc.nama}
                                  </strong>
                                </div>
                                <span className="text-[11px] text-slate-500 block">
                                  {doc.tanggal} • {doc.uploadedBy === 'admin' ? 'Diberikan oleh Admin' : 'Diunggah oleh Anda'}
                                  {doc.keterangan ? ` • "${doc.keterangan}"` : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {doc.url && (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1 border border-blue-200"
                                  >
                                    <ExternalLink size={13} />
                                    <span>Buka</span>
                                  </a>
                                )}
                                {doc.uploadedBy !== 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDocument(myPeserta.id, doc.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Hapus dokumen"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center bg-white rounded-xl border border-dashed border-emerald-200 text-xs text-slate-500">
                          Belum ada dokumen pribadi yang diunggah. Silakan klik tombol <strong>Unggah Dokumen Saya</strong> di atas untuk menambahkan laporan atau berkas Anda.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-3">
                    <Users size={32} className="mx-auto text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Anda Belum Terdaftar Sebagai Peserta di Program Ini
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5">
                        Apakah Anda mengikuti kegiatan ini? Klik tombol di bawah untuk mendaftarkan nama Anda dan mulai mengunggah dokumen pribadi Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEnrollSelf}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      <Plus size={14} />
                      <span>Daftarkan Diri ke Program Ini</span>
                    </button>
                  </div>
                )}

                {/* General Guide / Support Documents for Participants */}
                {(program.dokumenSekolah || []).length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-slate-800 block">
                      Dokumen Panduan & Materi Resmi Program
                    </span>
                    <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                      {program.dokumenSekolah!.map(doc => (
                        <div key={doc.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                          <div>
                            <strong className="text-slate-800 font-bold block">{doc.nama}</strong>
                            <span className="text-[11px] text-slate-500">{doc.tipe} • {doc.tanggal}</span>
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                            >
                              <ExternalLink size={12} />
                              <span>Buka</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: IF LOGGED IN AS ADMIN (FULL MANAGEMENT: PESERTA & DOKUMEN TIAP PESERTA) */}
            {isAdmin && (
              <div className="space-y-4">
                {/* Tabs for Admin */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAdminTab('peserta');
                      setSelectedPesertaForAdmin(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      activeAdminTab === 'peserta'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Sasaran & Peserta ({program.pesertaMagang?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('panduan')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      activeAdminTab === 'panduan'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Dokumen Panduan & MoU ({program.dokumenSekolah?.length || 0})
                  </button>
                </div>

                {/* TAB 1: DAFTAR PESERTA & PENGELOLAAN DOKUMEN TIAP PESERTA */}
                {activeAdminTab === 'peserta' && (
                  <div className="space-y-4">
                    {/* Participant Details Drawer if Selected by Admin */}
                    {selectedPesertaForAdmin ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-300 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                              Kelola Dokumen Peserta
                            </span>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900">
                                {selectedPesertaForAdmin.nama}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-200 text-blue-900 font-mono font-bold">
                                {selectedPesertaForAdmin.namaSekolah || selectedPesertaForAdmin.sekolahId}
                              </span>
                            </div>
                            <span className="text-xs text-slate-600">
                              {selectedPesertaForAdmin.peran} {selectedPesertaForAdmin.email ? `• ${selectedPesertaForAdmin.email}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetPesertaForUpload(selectedPesertaForAdmin);
                                setIsUploadModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Plus size={14} />
                              <span>+ Unggah Dokumen untuk Peserta Ini</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPesertaForAdmin(null)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>

                        {/* List of Documents for this participant */}
                        <div className="space-y-2 pt-1">
                          <span className="text-xs font-black text-slate-800 block">
                            Berkas & Dokumen ({(selectedPesertaForAdmin.dokumenPribadi || []).length})
                          </span>

                          {(selectedPesertaForAdmin.dokumenPribadi || []).length > 0 ? (
                            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                              {selectedPesertaForAdmin.dokumenPribadi!.map(doc => (
                                <div key={doc.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${
                                        doc.tipe === 'Sertifikat' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                        doc.tipe === 'Surat Tugas' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                        doc.tipe === 'Penilaian' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      }`}>
                                        {doc.tipe}
                                      </span>
                                      <strong className="text-slate-800 font-bold">{doc.nama}</strong>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block mt-0.5">
                                      {doc.tanggal} • {doc.uploadedBy === 'admin' ? 'Diunggah oleh Admin' : 'Diunggah oleh Peserta'}
                                      {doc.keterangan ? ` • "${doc.keterangan}"` : ''}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {doc.url && (
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition flex items-center gap-1 border border-blue-200 text-xs"
                                      >
                                        <ExternalLink size={12} />
                                        <span>Buka</span>
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument(selectedPesertaForAdmin.id, doc.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                      title="Hapus berkas"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                              Belum ada berkas untuk peserta ini. Klik tombol di atas untuk mengunggah sertifikat, surat tugas, atau penilaian.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Sasaran Sekolah & Daftar Peserta Tiap Sekolah */}
                    <div className="space-y-4">
                      {/* Top Bar: Target Schools Chips & Quick Add School */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <School size={16} className="text-blue-600" />
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                Sasaran Sekolah ({targetSchools.length} Sekolah)
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Setiap sekolah dapat ditambahkan peserta khusus. Peserta guru hanya dapat melihat dokumen milik mereka sendiri.
                            </span>
                          </div>

                          {availableSchoolsToAdd.length > 0 && (
                            <div>
                              {!isAddingSchoolToProgram ? (
                                <button
                                  type="button"
                                  onClick={() => setIsAddingSchoolToProgram(true)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Plus size={14} />
                                  <span>+ Tambah Sekolah Sasaran</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={selectedSchoolToAdd}
                                    onChange={(e) => setSelectedSchoolToAdd(e.target.value)}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Pilih Sekolah Mitra...</option>
                                    {availableSchoolsToAdd.map(s => (
                                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={handleAddSchoolTarget}
                                    disabled={!selectedSchoolToAdd}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                                  >
                                    Tambah
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingSchoolToProgram(false);
                                      setSelectedSchoolToAdd('');
                                    }}
                                    className="px-2 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* School badges */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {targetSchools.map(sch => {
                            const countPeserta = (program.pesertaMagang || []).filter(
                              p => p.sekolahId === sch.id || (!p.sekolahId && sch.id === program.mitraId)
                            ).length;

                            return (
                              <div
                                key={sch.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <span>{sch.namaSekolah}</span>
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono">
                                  {countPeserta} Peserta
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Per-School Cards & Participants */}
                      <div className="space-y-4">
                        {targetSchools.map(school => {
                          const schoolPeserta = (program.pesertaMagang || []).filter(
                            p => p.sekolahId === school.id || (!p.sekolahId && school.id === program.mitraId)
                          );
                          const isAddingHere = activeInlineSchoolId === school.id;

                          return (
                            <div 
                              key={school.id} 
                              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3"
                            >
                              {/* School Card Header */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                    <School size={16} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-black text-slate-800">
                                        {school.namaSekolah}
                                      </h4>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                        {school.kodeMitra || school.id}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-800">
                                        {schoolPeserta.length} Peserta
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">
                                      {school.kota || 'Indonesia'} • {school.jenjang || 'Sekolah Mitra'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isAddingHere) {
                                        setActiveInlineSchoolId(null);
                                      } else {
                                        setActiveInlineSchoolId(school.id);
                                        setInlinePesertaNama('');
                                        setInlinePesertaPeran('');
                                        setInlinePesertaEmail('');
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Plus size={14} />
                                    <span>+ Tambah Peserta</span>
                                  </button>

                                  {targetSchools.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSchoolTarget(school.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                      title={`Keluarkan ${school.namaSekolah} dari sasaran program`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Inline Form to Add Participant to THIS school */}
                              {isAddingHere && (
                                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-300 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-blue-900">
                                      Tambah Peserta Baru untuk {school.namaSekolah}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => setActiveInlineSchoolId(null)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      value={inlinePesertaNama}
                                      onChange={(e) => setInlinePesertaNama(e.target.value)}
                                      placeholder="Nama Lengkap Peserta..."
                                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                    />
                                    <input
                                      type="text"
                                      value={inlinePesertaPeran}
                                      onChange={(e) => setInlinePesertaPeran(e.target.value)}
                                      placeholder="Peran / Jabatan (e.g. Guru Sentra)..."
                                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                      type="email"
                                      value={inlinePesertaEmail}
                                      onChange={(e) => setInlinePesertaEmail(e.target.value)}
                                      placeholder="Email guru (opsional)..."
                                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setActiveInlineSchoolId(null)}
                                      className="px-3 py-1 rounded-lg border border-slate-300 text-xs text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveParticipantForSchool(school)}
                                      className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                      Simpan Peserta
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Participants list for THIS school */}
                              {schoolPeserta.length > 0 ? (
                                <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-xl border border-slate-200 overflow-hidden">
                                  {schoolPeserta.map(p => {
                                    const docCount = (p.dokumenPribadi || []).length;
                                    const isCurrentSelected = selectedPesertaForAdmin?.id === p.id;

                                    return (
                                      <div 
                                        key={p.id} 
                                        className={`p-3 flex items-center justify-between gap-3 text-xs transition ${
                                          isCurrentSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className="space-y-0.5 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <strong className="text-slate-800 font-bold text-xs sm:text-sm">
                                              {p.nama}
                                            </strong>
                                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                              {docCount} Dokumen
                                            </span>
                                          </div>
                                          <span className="text-[11px] text-slate-500 block truncate">
                                            {p.peran || 'Peserta'} {p.email ? `• ${p.email}` : ''}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedPesertaForAdmin(p)}
                                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex items-center gap-1 border border-blue-200 text-xs cursor-pointer"
                                          >
                                            <span>Kelola Dokumen ({docCount})</span>
                                            <ChevronRight size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleAdminRemovePeserta(p.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                            title="Hapus peserta"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="p-4 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                                  Belum ada peserta dari {school.namaSekolah}. Klik tombol <strong>+ Tambah Peserta</strong> di atas untuk mendaftarkan.
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Any participants whose schoolId does not match any current targetSchools */}
                        {(() => {
                          const targetIds = new Set(targetSchools.map(s => s.id));
                          const unassigned = (program.pesertaMagang || []).filter(
                            p => p.sekolahId && !targetIds.has(p.sekolahId)
                          );
                          if (unassigned.length === 0) return null;

                          return (
                            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                                Peserta Sekolah Lainnya ({unassigned.length})
                              </h4>
                              <div className="divide-y divide-slate-100 bg-slate-50/60 rounded-xl border border-slate-200 overflow-hidden">
                                {unassigned.map(p => {
                                  const docCount = (p.dokumenPribadi || []).length;
                                  return (
                                    <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <strong className="text-slate-800 font-bold">{p.nama}</strong>
                                          <span className="text-[10px] px-2 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                                            {p.namaSekolah || p.sekolahId}
                                          </span>
                                        </div>
                                        <span className="text-[11px] text-slate-500">{p.peran}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedPesertaForAdmin(p)}
                                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs"
                                        >
                                          Kelola Dokumen ({docCount})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleAdminRemovePeserta(p.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: DOKUMEN PANDUAN & SEKOLAH */}
                {activeAdminTab === 'panduan' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Dokumen Panduan Program & Berkas Sekolah
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Dokumen umum seperti MoU, Panduan Teknis, atau Surat Tugas Yayasan.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingPanduan(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                        <span>+ Tambah Dokumen</span>
                      </button>
                    </div>

                    {isAddingPanduan && (
                      <div className="p-3.5 rounded-xl bg-white border border-slate-300 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={newPanduanNama}
                            onChange={(e) => setNewPanduanNama(e.target.value)}
                            placeholder="Judul dokumen..."
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                          />
                          <select
                            value={newPanduanTipe}
                            onChange={(e) => setNewPanduanTipe(e.target.value as any)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                          >
                            <option value="Panduan">Panduan</option>
                            <option value="MoU">MoU</option>
                            <option value="Surat Tugas">Surat Tugas</option>
                            <option value="Materi">Materi</option>
                          </select>
                          <input
                            type="text"
                            value={newPanduanUrl}
                            onChange={(e) => setNewPanduanUrl(e.target.value)}
                            placeholder="Tautan URL Drive / Docs..."
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsAddingPanduan(false)}
                            className="px-3 py-1 rounded-lg border text-xs"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleAddPanduan}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                          >
                            Simpan Dokumen
                          </button>
                        </div>
                      </div>
                    )}

                    {(program.dokumenSekolah || []).length > 0 ? (
                      <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                        {program.dokumenSekolah!.map(doc => (
                          <div key={doc.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                            <div>
                              <strong className="text-slate-800 font-bold block">{doc.nama}</strong>
                              <span className="text-[11px] text-slate-500">{doc.tipe} • {doc.tanggal}</span>
                            </div>
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                              >
                                <ExternalLink size={12} />
                                <span>Buka</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                        Belum ada dokumen panduan ditambahkan.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW C: IF LOGGED IN AS SEKOLAH MITRA (READ ONLY OVERVIEW + SEKOLAH DOCS) */}
            {isSekolahMitra && !isAdmin && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                  <span className="text-xs font-black text-blue-900 block uppercase tracking-wider">
                    Peserta dari Sekolah Anda ({
                      (program.pesertaMagang || []).filter(p => p.sekolahId === currentUser?.sekolahId).length
                    } Guru)
                  </span>
                  <div className="divide-y divide-blue-100 bg-white rounded-xl border border-blue-200 overflow-hidden">
                    {(program.pesertaMagang || [])
                      .filter(p => p.sekolahId === currentUser?.sekolahId)
                      .map(p => (
                        <div key={p.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-800 font-bold block">{p.nama}</strong>
                            <span className="text-[11px] text-slate-500">{p.peran}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {(p.dokumenPribadi || []).length} Dokumen Tersimpan
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {(program.dokumenSekolah || []).length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-black text-slate-800 block">
                      Dokumen Sekolah & Panduan
                    </span>
                    <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden">
                      {program.dokumenSekolah!.map(doc => (
                        <div key={doc.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-800 font-bold block">{doc.nama}</strong>
                            <span className="text-[11px] text-slate-500">{doc.tipe} • {doc.tanggal}</span>
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                            >
                              Buka Dokumen
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal: Upload Personal Document */}
      <UploadDokumenModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setTargetPesertaForUpload(null);
        }}
        targetPesertaNama={targetPesertaForUpload?.nama || myPeserta?.nama || 'Peserta'}
        isUploaderAdmin={isAdmin}
        onSave={handleSaveDocument}
      />
    </>
  );
};
