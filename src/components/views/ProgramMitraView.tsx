import React, { useState, useRef } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  ExternalLink, 
  X, 
  School, 
  FileText, 
  Table, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Link2, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  ProgramMitraItem, 
  ProgramMitraTemplate, 
  ProgramMitraJenis, 
  ProgramMitraStatus 
} from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const ProgramMitraView: React.FC = () => {
  const { currentUser, isAdmin, isSekolahMitra } = useAuth();
  const { 
    programMitraList, 
    programMitraTemplates, 
    sekolahList, 
    addProgramMitra, 
    updateProgramMitra, 
    deleteProgramMitra,
    updateProgramMitraTemplate 
  } = useData();

  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'semua' | 'visitasi' | 'magang' | 'template'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSekolahFilter, setSelectedSekolahFilter] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramMitraItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramMitraItem | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProgramMitraTemplate | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ProgramMitraItem | null>(null);

  // Form State
  const [formJenis, setFormJenis] = useState<ProgramMitraJenis>('Visitasi');
  const [formJudul, setFormJudul] = useState('');
  const [formSekolahId, setFormSekolahId] = useState(
    isSekolahMitra && currentUser?.sekolahId ? currentUser.sekolahId : (sekolahList[0]?.id || '')
  );
  const [formTanggalMulai, setFormTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [formTanggalSelesai, setFormTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [formPeserta, setFormPeserta] = useState('');
  const [formJumlahPeserta, setFormJumlahPeserta] = useState<number>(2);
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formLinkDocs, setFormLinkDocs] = useState('');
  const [formLinkSheet, setFormLinkSheet] = useState('');
  const [formLinkPdf, setFormLinkPdf] = useState('');
  const [formLinkCanva, setFormLinkCanva] = useState('');
  const [formStatus, setFormStatus] = useState<ProgramMitraStatus>('Diajukan');
  const [formCatatanAdmin, setFormCatatanAdmin] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileData, setFormFileData] = useState('');
  const [formFileType, setFormFileType] = useState('');

  // Template Form State
  const [templateNama, setTemplateNama] = useState('');
  const [templateDeskripsi, setTemplateDeskripsi] = useState('');
  const [templateLink, setTemplateLink] = useState('');

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState<ProgramMitraStatus>('Disetujui');
  const [reviewCatatan, setReviewCatatan] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered program items
  const filteredItems = programMitraList.filter(item => {
    // If Sekolah Mitra, only show their school's submissions
    if (isSekolahMitra && currentUser?.sekolahId && item.mitraId !== currentUser.sekolahId) {
      return false;
    }

    // Filter by subtab
    if (activeSubTab === 'visitasi' && item.jenis !== 'Visitasi') return false;
    if (activeSubTab === 'magang' && item.jenis !== 'Magang') return false;

    // Filter by status
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

    // Filter by school
    if (selectedSekolahFilter !== 'ALL' && item.mitraId !== selectedSekolahFilter) return false;

    // Search query
    const matchSearch = 
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.peserta && item.peserta.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchSearch;
  });

  // Filter templates based on active subtab
  const filteredTemplates = programMitraTemplates.filter(tmpl => {
    if (activeSubTab === 'visitasi') return tmpl.jenis === 'Visitasi';
    if (activeSubTab === 'magang') return tmpl.jenis === 'Magang';
    return true;
  });

  const handleOpenAdd = (defaultJenis: ProgramMitraJenis = 'Visitasi') => {
    setEditingItem(null);
    setFormJenis(defaultJenis);
    setFormJudul('');
    setFormSekolahId(
      isSekolahMitra && currentUser?.sekolahId 
        ? currentUser.sekolahId 
        : (sekolahList[0]?.id || 'MO004')
    );
    setFormTanggalMulai(new Date().toISOString().split('T')[0]);
    setFormTanggalSelesai(new Date().toISOString().split('T')[0]);
    setFormPeserta('');
    setFormJumlahPeserta(2);
    setFormDeskripsi('');
    setFormLinkDocs('');
    setFormLinkSheet('');
    setFormLinkPdf('');
    setFormLinkCanva('');
    setFormStatus('Diajukan');
    setFormCatatanAdmin('');
    setFormFileName('');
    setFormFileData('');
    setFormFileType('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: ProgramMitraItem) => {
    setEditingItem(item);
    setFormJenis(item.jenis);
    setFormJudul(item.judul);
    setFormSekolahId(item.mitraId);
    setFormTanggalMulai(item.tanggalMulai);
    setFormTanggalSelesai(item.tanggalSelesai || item.tanggalMulai);
    setFormPeserta(item.peserta || '');
    setFormJumlahPeserta(item.jumlahPeserta || 1);
    setFormDeskripsi(item.deskripsi || '');
    setFormLinkDocs(item.linkDocs || '');
    setFormLinkSheet(item.linkSheet || '');
    setFormLinkPdf(item.linkPdf || '');
    setFormLinkCanva(item.linkCanva || '');
    setFormStatus(item.status);
    setFormCatatanAdmin(item.catatanAdmin || '');
    setFormFileName(item.fileUploadedName || '');
    setFormFileData(item.fileUploadedData || '');
    setFormFileType(item.fileUploadedType || '');
    setIsFormModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB. Untuk dokumen besar silakan gunakan link Google Docs/Drive/Canva.');
      return;
    }

    setFormFileName(file.name);
    setFormFileType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormFileData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSchool = sekolahList.find(s => s.id === formSekolahId);
    const namaSekolah = selectedSchool ? selectedSchool.namaSekolah : (currentUser?.nama || 'Sekolah Mitra');

    if (editingItem) {
      await updateProgramMitra({
        ...editingItem,
        jenis: formJenis,
        judul: formJudul,
        mitraId: formSekolahId,
        namaSekolah,
        tanggalMulai: formTanggalMulai,
        tanggalSelesai: formTanggalSelesai,
        peserta: formPeserta.trim() || undefined,
        jumlahPeserta: Number(formJumlahPeserta) || 1,
        deskripsi: formDeskripsi.trim() || undefined,
        linkDocs: formLinkDocs.trim() || undefined,
        linkSheet: formLinkSheet.trim() || undefined,
        linkPdf: formLinkPdf.trim() || undefined,
        linkCanva: formLinkCanva.trim() || undefined,
        fileUploadedName: formFileName.trim() || undefined,
        fileUploadedData: formFileData || undefined,
        fileUploadedType: formFileType || undefined,
        status: isAdmin ? formStatus : editingItem.status,
        catatanAdmin: isAdmin ? formCatatanAdmin.trim() || undefined : editingItem.catatanAdmin,
      });
    } else {
      await addProgramMitra({
        jenis: formJenis,
        judul: formJudul,
        mitraId: formSekolahId,
        namaSekolah,
        tanggalMulai: formTanggalMulai,
        tanggalSelesai: formTanggalSelesai,
        peserta: formPeserta.trim() || undefined,
        jumlahPeserta: Number(formJumlahPeserta) || 1,
        deskripsi: formDeskripsi.trim() || undefined,
        linkDocs: formLinkDocs.trim() || undefined,
        linkSheet: formLinkSheet.trim() || undefined,
        linkPdf: formLinkPdf.trim() || undefined,
        linkCanva: formLinkCanva.trim() || undefined,
        fileUploadedName: formFileName.trim() || undefined,
        fileUploadedData: formFileData || undefined,
        fileUploadedType: formFileType || undefined,
        status: isAdmin ? formStatus : 'Diajukan',
        catatanAdmin: isAdmin ? formCatatanAdmin.trim() || undefined : undefined,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleOpenReview = (item: ProgramMitraItem) => {
    setReviewTarget(item);
    setReviewStatus(item.status);
    setReviewCatatan(item.catatanAdmin || '');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;

    await updateProgramMitra({
      ...reviewTarget,
      status: reviewStatus,
      catatanAdmin: reviewCatatan.trim() || undefined,
    });

    setReviewTarget(null);
  };

  const handleOpenEditTemplate = (tmpl: ProgramMitraTemplate) => {
    setEditingTemplate(tmpl);
    setTemplateNama(tmpl.nama);
    setTemplateDeskripsi(tmpl.deskripsi);
    setTemplateLink(tmpl.linkTemplate);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    await updateProgramMitraTemplate({
      ...editingTemplate,
      nama: templateNama,
      deskripsi: templateDeskripsi,
      linkTemplate: templateLink,
    });

    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  const getStatusBadge = (status: ProgramMitraStatus) => {
    switch (status) {
      case 'Disetujui':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={12} />
            <span>Disetujui</span>
          </span>
        );
      case 'Sedang Berjalan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse">
            <Clock size={12} />
            <span>Sedang Berjalan</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <span>Selesai</span>
          </span>
        );
      case 'Perlu Revisi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
            <AlertTriangle size={12} />
            <span>Perlu Revisi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Clock size={12} />
            <span>Diajukan</span>
          </span>
        );
    }
  };

  const getFormatBadge = (tipe: 'Docs' | 'Sheet' | 'PDF' | 'Canva') => {
    switch (tipe) {
      case 'Docs':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500 text-white">Google Docs</span>;
      case 'Sheet':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">Google Sheet</span>;
      case 'PDF':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">Dokumen PDF</span>;
      case 'Canva':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 text-white">Canva Slide</span>;
    }
  };

  // Stats calculation
  const totalVisitasi = programMitraList.filter(p => p.jenis === 'Visitasi').length;
  const totalMagang = programMitraList.filter(p => p.jenis === 'Magang').length;
  const activeCount = programMitraList.filter(p => p.status === 'Sedang Berjalan' || p.status === 'Disetujui').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase size={22} className="text-blue-600" />
            <span>Program Mitra: Visitasi & Magang Guru</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan kunjungan visitasi sekolah mitra, program magang pendidik inklusi, repositori template, dan upload berkas
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => handleOpenAdd(activeSubTab === 'magang' ? 'Magang' : 'Visitasi')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Ajukan Program & Upload Dokumen</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveSubTab('visitasi')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'visitasi' 
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Program Visitasi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <School size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalVisitasi}</span>
            <span className="text-xs text-slate-500">Kegiatan Kunjungan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Benchmarking & supervisi lapangan</p>
        </div>

        <div 
          onClick={() => setActiveSubTab('magang')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'magang' 
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Program Magang Guru</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalMagang}</span>
            <span className="text-xs text-slate-500">Program Magang</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Guru sentra, shadow teacher & TU</p>
        </div>

        <div 
          onClick={() => setActiveSubTab('template')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'template' 
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Resmi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{programMitraTemplates.length}</span>
            <span className="text-xs text-slate-500">Template Dokumen</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Docs, Sheet, PDF & Canva</p>
        </div>
      </div>

      {/* Subtab Navigator */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-full sm:w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('semua')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSubTab === 'semua' 
              ? 'bg-white text-slate-900 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Agenda ({programMitraList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('visitasi')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'visitasi' 
              ? 'bg-white text-blue-700 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <School size={14} />
          <span>Visitasi ({totalVisitasi})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('magang')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'magang' 
              ? 'bg-white text-indigo-700 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          <span>Magang Guru ({totalMagang})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('template')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'template' 
              ? 'bg-white text-purple-700 shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} />
          <span>Template Dokumen ({programMitraTemplates.length})</span>
        </button>
      </div>

      {/* Official Templates Quick Bar (Visible in 'semua', 'visitasi', 'magang', or 'template') */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Pusat Unduhan & Template Resmi
              </span>
              <span className="text-xs text-slate-300">Format Google Docs, Sheet, PDF & Canva</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <span>Template Pengajuan & Laporan Program Mitra</span>
            </h3>
          </div>

          <button
            onClick={() => setActiveSubTab('template')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto border border-white/10"
          >
            <span>Lihat Semua Template</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Template Grid Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {filteredTemplates.slice(0, 4).map(tmpl => (
            <div 
              key={tmpl.id} 
              className="bg-white/10 hover:bg-white/15 p-3.5 rounded-2xl border border-white/10 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    tmpl.jenis === 'Visitasi' ? 'bg-blue-500/30 text-blue-200' : 'bg-purple-500/30 text-purple-200'
                  }`}>
                    {tmpl.jenis}
                  </span>
                  {getFormatBadge(tmpl.tipeFormat)}
                </div>
                <h4 className="font-bold text-white text-xs leading-snug line-clamp-2 mb-1.5">
                  {tmpl.nama}
                </h4>
                <p className="text-[11px] text-slate-300/80 line-clamp-2 leading-relaxed">
                  {tmpl.deskripsi}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between">
                <a
                  href={tmpl.linkTemplate}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white transition"
                >
                  <span>Buka Template</span>
                  <ExternalLink size={12} />
                </a>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEditTemplate(tmpl)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                    title="Ubah Link Template"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIEW: TEMPLATE CATALOG ONLY */}
      {activeSubTab === 'template' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Lengkap Template Resmi ({filteredTemplates.length})
            </h3>
            {isAdmin && (
              <span className="text-xs text-slate-500">
                Administrator dapat mengubah tautan dan rincian template resmi
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(tmpl => (
              <div 
                key={tmpl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tmpl.jenis === 'Visitasi' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        Program {tmpl.jenis}
                      </span>
                      {getFormatBadge(tmpl.tipeFormat)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{tmpl.id}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">
                    {tmpl.nama}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {tmpl.deskripsi}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Diperbarui: {tmpl.diperbarui}
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={tmpl.linkTemplate}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Buka Template</span>
                      <ExternalLink size={12} />
                    </a>

                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEditTemplate(tmpl)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Edit Tautan Template"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW: PROGRAM MITRA SUBMISSIONS (ALL / VISITASI / MAGANG) */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul program, nama sekolah, peserta..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">Semua Status</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Sedang Berjalan">Sedang Berjalan</option>
                <option value="Selesai">Selesai</option>
                <option value="Perlu Revisi">Perlu Revisi</option>
              </select>

              {isAdmin && (
                <select
                  value={selectedSekolahFilter}
                  onChange={(e) => setSelectedSekolahFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[200px]"
                >
                  <option value="ALL">Semua Sekolah</option>
                  {sekolahList.map(s => (
                    <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Submissions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
                <Briefcase size={36} className="mx-auto text-slate-300 mb-2.5" />
                <p className="text-sm font-semibold text-slate-700">Belum ada pengajuan program yang sesuai.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Klik tombol &quot;Ajukan Program & Upload Dokumen&quot; untuk mengajukan jadwal visitasi atau magang baru.
                </p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.jenis === 'Visitasi' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                          {item.jenis}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.namaSekolah}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({item.id})</span>
                      </div>

                      {getStatusBadge(item.status)}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5">
                      {item.judul}
                    </h3>

                    {/* Description */}
                    {item.deskripsi && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {item.deskripsi}
                      </p>
                    )}

                    {/* Details Info Box */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <Calendar size={14} className="text-blue-600 shrink-0" />
                        <span>
                          {item.tanggalMulai} {item.tanggalSelesai && item.tanggalSelesai !== item.tanggalMulai ? `s/d ${item.tanggalSelesai}` : ''}
                        </span>
                      </div>

                      {item.peserta && (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-indigo-600 shrink-0" />
                          <span className="truncate">
                            Peserta ({item.jumlahPeserta || 1} orang): <strong className="text-slate-800">{item.peserta}</strong>
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 pt-0.5">
                        Diajukan: {item.tanggalPengajuan}
                      </div>
                    </div>

                    {/* Catatan Admin / Feedback */}
                    {item.catatanAdmin && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                        <div className="font-bold flex items-center gap-1.5 text-amber-950 mb-0.5">
                          <Sparkles size={13} className="text-amber-600" />
                          <span>Catatan Mitra Office:</span>
                        </div>
                        <p className="leading-relaxed">{item.catatanAdmin}</p>
                      </div>
                    )}
                  </div>

                  {/* Document & Upload Buttons Area */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                        Dokumen Terkait (Docs, Sheet, PDF, Canva & Berkas):
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        {item.linkDocs ? (
                          <a
                            href={item.linkDocs}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition flex items-center gap-1.5"
                            title="Buka Dokumen Google Docs"
                          >
                            <FileText size={13} className="text-blue-600" />
                            <span>Google Docs</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : null}

                        {item.linkSheet ? (
                          <a
                            href={item.linkSheet}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5"
                            title="Buka Google Sheets"
                          >
                            <Table size={13} className="text-emerald-600" />
                            <span>Google Sheet</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : null}

                        {item.linkPdf ? (
                          <a
                            href={item.linkPdf}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1.5"
                            title="Buka Dokumen PDF / Drive"
                          >
                            <FileText size={13} className="text-rose-600" />
                            <span>PDF File</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : null}

                        {item.linkCanva ? (
                          <a
                            href={item.linkCanva}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition flex items-center gap-1.5"
                            title="Buka Desain / Slide Canva"
                          >
                            <Sparkles size={13} className="text-purple-600" />
                            <span>Canva Slide</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : null}

                        {item.fileUploadedName ? (
                          <a
                            href={item.fileUploadedData || '#'}
                            download={item.fileUploadedName}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5"
                            title="Unduh Berkas Lampiran Lokal"
                          >
                            <Download size={13} />
                            <span className="max-w-[120px] truncate">{item.fileUploadedName}</span>
                          </a>
                        ) : null}

                        {!item.linkDocs && !item.linkSheet && !item.linkPdf && !item.linkCanva && !item.fileUploadedName && (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada dokumen yang dilampirkan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Upload / Perbarui Dokumen</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenReview(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                            title="Review Status & Beri Catatan"
                          >
                            Review
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Edit Pengajuan"
                        >
                          <Edit3 size={14} />
                        </button>

                        {(isAdmin || isSekolahMitra) && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus Pengajuan"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: AJUKAN / EDIT PROGRAM & UPLOAD DOKUMEN */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-600" />
                <span>{editingItem ? 'Edit Dokumen & Program Mitra' : 'Ajukan Program & Upload Dokumen'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsFormModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 mt-4 text-xs">
              {/* Jenis Program */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Jenis Program <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormJenis('Visitasi')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      formJenis === 'Visitasi'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <School size={15} />
                    <span>Program Visitasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormJenis('Magang')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      formJenis === 'Magang'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={15} />
                    <span>Program Magang Guru</span>
                  </button>
                </div>
              </div>

              {/* Judul Kegiatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Kegiatan / Topik Pengajuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Judul pengajuan visitasi atau program magang guru"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Sekolah Mitra (Dropdown jika admin, locked jika mitra) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sekolah Mitra Pengaju
                </label>
                {isAdmin ? (
                  <select
                    value={formSekolahId}
                    onChange={(e) => setFormSekolahId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {sekolahList.map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah} ({s.id})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={currentUser?.nama || 'Sekolah Mitra'}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  />
                )}
              </div>

              {/* Tanggal Pelaksanaan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formTanggalMulai}
                    onChange={(e) => setFormTanggalMulai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={formTanggalSelesai}
                    onChange={(e) => setFormTanggalSelesai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Peserta & Jumlah */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Peserta / Delegasi</label>
                  <input
                    type="text"
                    value={formPeserta}
                    onChange={(e) => setFormPeserta(e.target.value)}
                    placeholder="Nama kepala sekolah, guru pendamping, staf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Orang</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formJumlahPeserta}
                    onChange={(e) => setFormJumlahPeserta(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan & Deskripsi Kegiatan</label>
                <textarea
                  rows={2}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Rencana kegiatan, topik observasi, fokus magang"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* SECTION: TAUTAN & UPLOAD DOKUMEN (Docs, Sheet, PDF, Canva) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Link2 size={15} className="text-blue-600" />
                    <span>Tautan Dokumen Cloud (Docs, Sheet, PDF, Canva)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Opsional / sesuai kebutuhan</span>
                </div>

                {/* Google Docs */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText size={13} className="text-blue-600" />
                    <span>Link Google Docs (Proposal / TOR / Hasil Observasi)</span>
                  </label>
                  <input
                    type="url"
                    value={formLinkDocs}
                    onChange={(e) => setFormLinkDocs(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Google Sheets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Table size={13} className="text-emerald-600" />
                    <span>Link Google Sheet (Jadwal, Logbook Harian, Presensi)</span>
                  </label>
                  <input
                    type="url"
                    value={formLinkSheet}
                    onChange={(e) => setFormLinkSheet(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* PDF */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText size={13} className="text-rose-600" />
                    <span>Link Dokumen PDF / Google Drive (Surat Tugas / Panduan)</span>
                  </label>
                  <input
                    type="url"
                    value={formLinkPdf}
                    onChange={(e) => setFormLinkPdf(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... atau tautan PDF"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                {/* Canva */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-purple-600" />
                    <span>Link Canva (Desain Slide Presentasi / Portofolio Magang)</span>
                  </label>
                  <input
                    type="url"
                    value={formLinkCanva}
                    onChange={(e) => setFormLinkCanva(e.target.value)}
                    placeholder="https://www.canva.com/design/.../view"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* File Upload Lokal */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Upload size={13} className="text-slate-600" />
                    <span>Upload File Dokumen Fisik (PDF / DOCX / XLSX - maks 5 MB)</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {formFileName ? (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={15} className="text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800 text-xs truncate">{formFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormFileName('');
                          setFormFileData('');
                          setFormFileType('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Hapus file lampiran"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-xl p-3 text-center cursor-pointer transition flex items-center justify-center gap-2"
                    >
                      <Upload size={15} className="text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-600">
                        Klik untuk memilih file dokumen dari komputer
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Catatan (Khusus Admin) */}
              {isAdmin && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status Pengajuan</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as ProgramMitraStatus)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Diajukan">Diajukan</option>
                        <option value="Disetujui">Disetujui</option>
                        <option value="Sedang Berjalan">Sedang Berjalan</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Perlu Revisi">Perlu Revisi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan / Umpan Balik Admin</label>
                    <textarea
                      rows={2}
                      value={formCatatanAdmin}
                      onChange={(e) => setFormCatatanAdmin(e.target.value)}
                      placeholder="Instruksi tambahan, rekomendasi jadwal, catatan persetujuan"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {editingItem ? 'Simpan Pembaruan' : 'Kirim Pengajuan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW STATUS & CATATAN ADMIN */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-600" />
                <span>Review Pengajuan Program Mitra</span>
              </h3>
              <button 
                type="button"
                onClick={() => setReviewTarget(null)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sekolah & Judul</span>
                <p className="font-bold text-slate-900">{reviewTarget.namaSekolah}</p>
                <p className="text-slate-600 mt-0.5">{reviewTarget.judul}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perbarui Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as ProgramMitraStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Diajukan">Diajukan</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Perlu Revisi">Perlu Revisi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Umpan Balik Mitra Office</label>
                <textarea
                  rows={3}
                  value={reviewCatatan}
                  onChange={(e) => setReviewCatatan(e.target.value)}
                  placeholder="Instruksi mentor, persetujuan jadwal, perbaikan dokumen..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Simpan Status Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT LINK TEMPLATE DOKUMEN */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-purple-600" />
                <span>Ubah Tautan Template Resmi</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsTemplateModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Template</label>
                <input
                  type="text"
                  required
                  value={templateNama}
                  onChange={(e) => setTemplateNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Petunjuk</label>
                <textarea
                  rows={2}
                  value={templateDeskripsi}
                  onChange={(e) => setTemplateDeskripsi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tautan Template ({editingTemplate.tipeFormat})
                </label>
                <input
                  type="url"
                  required
                  value={templateLink}
                  onChange={(e) => setTemplateLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteProgramMitra(deleteTarget.id);
          }
        }}
        title="Hapus Agenda Program Mitra"
        message="Apakah Anda yakin ingin menghapus agenda pengajuan program ini dari database?"
        itemName={deleteTarget ? `${deleteTarget.judul} (${deleteTarget.namaSekolah})` : ''}
        confirmLabel="Hapus Program"
      />
    </div>
  );
};
