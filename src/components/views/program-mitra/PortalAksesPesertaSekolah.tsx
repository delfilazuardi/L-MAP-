import React, { useState, useRef } from 'react';
import { 
  Building2, 
  GraduationCap, 
  FileText, 
  Award, 
  Target, 
  Search, 
  Plus, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Edit3, 
  Trash2, 
  Sparkles, 
  FileCheck,
  ShieldCheck,
  BookOpen,
  Calendar,
  Layers,
  Eye,
  ImageIcon,
  Upload,
  Link2,
  FolderOpen,
  Copy,
  Info,
  Check,
  Lock,
  Filter,
  X
} from 'lucide-react';
import { 
  ProgramMitraItem, 
  SekolahMitra, 
  DokumenMitraSekolah, 
  PesertaMagangItem, 
  DokumenPribadiPeserta, 
  LaporanProgramMitra, 
  AgendaGapAnalysis,
  ProgramMitraTemplate
} from '../../../types';
import { INITIAL_PROGRAM_MITRA } from '../../../lib/initialData';

interface PortalAksesProps {
  programList: ProgramMitraItem[];
  sekolahList: SekolahMitra[];
  isAdmin: boolean;
  isSekolahMitra: boolean;
  currentUser: {
    userId?: string;
    nama?: string;
    email?: string;
    role?: string;
    sekolahId?: string;
    namaSekolah?: string;
  } | null;
  onUpdateProgram: (item: ProgramMitraItem) => Promise<void>;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
  onOpenFlyerPreview: (flyer: { url: string; title: string; caption?: string; school?: string }) => void;
  onOpenFlyerUpload: (program?: ProgramMitraItem) => void;
  initialCategory?: 'semua' | 'dokumen-sekolah' | 'dokumen-pribadi' | 'laporan' | 'gap-analysis';
  initialProgramFilter?: string;
  magangTemplates?: ProgramMitraTemplate[];
}

// Built-in official Magang templates
const DEFAULT_MAGANG_TEMPLATES = [
  {
    id: 'TMPL-MG-01',
    nama: 'Template Logbook Harian Aktivitas Magang Guru',
    format: 'Google Sheet / Excel',
    badge: 'Sheet',
    deskripsi: 'Catatan kegiatan harian, observasi kelas sentra/inklusi, jam mengajar, dan paraf mentor.',
    url: 'https://docs.google.com/spreadsheets/d/1lazuardi-logbook-magang-sheet/edit?usp=sharing'
  },
  {
    id: 'TMPL-MG-02',
    nama: 'Template Portofolio Studi Kasus Siswa Inklusi (IEP)',
    format: 'Google Docs / Word',
    badge: 'Docs',
    deskripsi: 'Panduan penyusunan profil sensori, analisis perilaku anak, dan evaluasi capaian intervensi.',
    url: 'https://docs.google.com/document/d/1lazuardi-proposal-magang-guru/edit?usp=sharing'
  },
  {
    id: 'TMPL-MG-03',
    nama: 'Template Portofolio Akhir & Slide Presentasi Magang',
    format: 'Canva Presentation',
    badge: 'Canva',
    deskripsi: 'Kit slide Canva untuk pemaparan hasil magang, dokumentasi foto sentra, dan rencana implementasi.',
    url: 'https://www.canva.com/design/DAF-portofolio-magang-lazuardi/view'
  },
  {
    id: 'TMPL-MG-04',
    nama: 'Template Laporan Akhir Magang Individu',
    format: 'Google Docs',
    badge: 'Docs',
    deskripsi: 'Format laporan resmi kelulusan magang pendidik: pendahuluan, observasi, evaluasi, dan rekomendasi.',
    url: 'https://docs.google.com/document/d/1lazuardi-panduan-tot-fasilitator/edit?usp=sharing'
  },
  {
    id: 'TMPL-MG-05',
    nama: 'Silabus & Panduan Teknis Magang Guru Lazuardi',
    format: 'Dokumen PDF',
    badge: 'PDF',
    deskripsi: 'Buku panduan kurikulum magang, jam terbang, rubrik kelulusan, dan tata tertib magang.',
    url: 'https://drive.google.com/file/d/1lazuardi-silabus-magang-guru.pdf/view'
  }
];

export const PortalAksesPesertaSekolah: React.FC<PortalAksesProps> = ({
  programList,
  sekolahList,
  isAdmin,
  isSekolahMitra,
  currentUser,
  onUpdateProgram,
  onShowFeedback,
  onOpenFlyerPreview,
  onOpenFlyerUpload,
  initialCategory = 'semua',
  initialProgramFilter = 'ALL',
  magangTemplates = []
}) => {
  const effectiveProgramList = (programList && programList.length > 0) ? programList : INITIAL_PROGRAM_MITRA;

  // Determine initial school selection
  const defaultSchoolId = isSekolahMitra && currentUser?.sekolahId 
    ? currentUser.sekolahId 
    : (effectiveProgramList[0]?.mitraId || sekolahList[0]?.id || 'ALL');

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(defaultSchoolId);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>(initialProgramFilter || 'ALL');
  const [activeCategory, setActiveCategory] = useState<'semua' | 'dokumen-sekolah' | 'dokumen-pribadi' | 'laporan' | 'gap-analysis'>(initialCategory);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPesertaFilter, setSelectedPesertaFilter] = useState<string>('ALL');
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Participant self-identity for non-admin privacy enforcement
  const [participantSelfIdentity, setParticipantSelfIdentity] = useState<string>(currentUser?.nama || '');

  // Filter programs based on selected school AND selected program
  const currentSchoolPrograms = effectiveProgramList.filter(p => {
    if (selectedProgramFilter !== 'ALL' && p.id !== selectedProgramFilter) return false;
    if (selectedSchoolId === 'ALL') return true;
    return p.mitraId === selectedSchoolId;
  });

  const activeProgram = currentSchoolPrograms[0] || effectiveProgramList[0];

  // Modals for adding/editing records
  const [isSchoolDocModalOpen, setIsSchoolDocModalOpen] = useState(false);
  const [editingSchoolDoc, setEditingSchoolDoc] = useState<{ docItem: DokumenMitraSekolah; programId: string } | null>(null);

  // Personal Doc Modal (supports self-service participant upload)
  const [isPersonalDocModalOpen, setIsPersonalDocModalOpen] = useState(false);
  const [editingPersonalDoc, setEditingPersonalDoc] = useState<{ 
    pesertaId: string; 
    docItem?: DokumenPribadiPeserta; 
    programId: string; 
    pesertaNama?: string;
  } | null>(null);

  const [isLaporanModalOpen, setIsLaporanModalOpen] = useState(false);
  const [editingLaporan, setEditingLaporan] = useState<{ laporan: LaporanProgramMitra; programId: string } | null>(null);

  const [isGapModalOpen, setIsGapModalOpen] = useState(false);
  const [editingGap, setEditingGap] = useState<{ gap: AgendaGapAnalysis; programId: string } | null>(null);

  // Form states for School Doc
  const [docNama, setDocNama] = useState('');
  const [docTipe, setDocTipe] = useState<DokumenMitraSekolah['tipe']>('MoU');
  const [docUrl, setDocUrl] = useState('');
  const [docKeterangan, setDocKeterangan] = useState('');

  // Form states for Personal Doc (Participant Upload)
  const [pProgramId, setPProgramId] = useState(activeProgram?.id || '');
  const [pPesertaNama, setPPesertaNama] = useState(currentUser?.nama || '');
  const [pPesertaPeran, setPPesertaPeran] = useState('');
  const [pPesertaEmail, setPPesertaEmail] = useState(currentUser?.email || '');
  const [pDocNama, setPDocNama] = useState('');
  const [pDocTipe, setPDocTipe] = useState<DokumenPribadiPeserta['tipe']>('Logbook');
  const [pUploadMethod, setPUploadMethod] = useState<'url' | 'file'>('url');
  const [pDocUrl, setPDocUrl] = useState('');
  const [pDocFileName, setPDocFileName] = useState('');
  const [pDocFileData, setPDocFileData] = useState('');
  const [pDocKeterangan, setPDocKeterangan] = useState('');
  const personalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for Laporan
  const [lapJudul, setLapJudul] = useState('');
  const [lapTipe, setLapTipe] = useState('Laporan Visitasi');
  const [lapPenulis, setLapPenulis] = useState('');
  const [lapRingkasan, setLapRingkasan] = useState('');
  const [lapUrl, setLapUrl] = useState('');
  const [lapStatus, setLapStatus] = useState<'Draft' | 'Final' | 'Disetujui'>('Disetujui');

  // Form states for Gap Analysis
  const [gapTopik, setGapTopik] = useState('');
  const [gapAspek, setGapAspek] = useState('Kurikulum & Pembelajaran');
  const [gapKondisiAwal, setGapKondisiAwal] = useState('');
  const [gapStandarLazuardi, setGapStandarLazuardi] = useState('');
  const [gapSelisih, setGapSelisih] = useState('');
  const [gapRencanaAksi, setGapRencanaAksi] = useState('');
  const [gapPic, setGapPic] = useState('');
  const [gapTargetSelesai, setGapTargetSelesai] = useState('');
  const [gapStatus, setGapStatus] = useState<AgendaGapAnalysis['status']>('Dalam Proses');
  const [gapDokumenUrl, setGapDokumenUrl] = useState('');
  const [gapCatatan, setGapCatatan] = useState('');

  // Handler: Open School Doc Modal
  const handleOpenAddSchoolDoc = () => {
    setEditingSchoolDoc(null);
    setDocNama('');
    setDocTipe('MoU');
    setDocUrl('');
    setDocKeterangan('');
    setIsSchoolDocModalOpen(true);
  };

  const handleOpenEditSchoolDoc = (docItem: DokumenMitraSekolah, programId: string) => {
    setEditingSchoolDoc({ docItem, programId });
    setDocNama(docItem.nama);
    setDocTipe(docItem.tipe);
    setDocUrl(docItem.url || '');
    setDocKeterangan(docItem.keterangan || '');
    setIsSchoolDocModalOpen(true);
  };

  const handleSaveSchoolDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;

    const programToUpdate = editingSchoolDoc 
      ? programList.find(p => p.id === editingSchoolDoc.programId) || activeProgram
      : activeProgram;

    const currentDocs = programToUpdate.dokumenSekolah || [];
    let updatedDocs: DokumenMitraSekolah[];

    if (editingSchoolDoc) {
      updatedDocs = currentDocs.map(d => d.id === editingSchoolDoc.docItem.id ? {
        ...d,
        nama: docNama.trim(),
        tipe: docTipe,
        url: docUrl.trim() || undefined,
        keterangan: docKeterangan.trim() || undefined,
        tanggal: d.tanggal || new Date().toISOString().split('T')[0]
      } : d);
    } else {
      const newDoc: DokumenMitraSekolah = {
        id: `DOK-SEK-${Date.now().toString().slice(-4)}`,
        nama: docNama.trim(),
        tipe: docTipe,
        url: docUrl.trim() || undefined,
        keterangan: docKeterangan.trim() || undefined,
        tanggal: new Date().toISOString().split('T')[0]
      };
      updatedDocs = [newDoc, ...currentDocs];
    }

    try {
      await onUpdateProgram({
        ...programToUpdate,
        dokumenSekolah: updatedDocs
      });
      setIsSchoolDocModalOpen(false);
      onShowFeedback('success', `Dokumen sekolah "${docNama}" berhasil disimpan ke Firebase.`);
    } catch {
      onShowFeedback('error', 'Gagal menyimpan dokumen sekolah.');
    }
  };

  const handleDeleteSchoolDoc = async (docId: string, programId: string) => {
    const program = programList.find(p => p.id === programId);
    if (!program) return;
    const updatedDocs = (program.dokumenSekolah || []).filter(d => d.id !== docId);
    try {
      await onUpdateProgram({
        ...program,
        dokumenSekolah: updatedDocs
      });
      onShowFeedback('success', 'Dokumen sekolah berhasil dihapus.');
    } catch {
      onShowFeedback('error', 'Gagal menghapus dokumen sekolah.');
    }
  };

  // Handler: Personal Doc (Participant Upload / Self-service)
  const handleOpenAddPersonalDoc = (pesertaId?: string, pesertaNama?: string, defaultProgramId?: string) => {
    setEditingPersonalDoc({ 
      pesertaId: pesertaId || '', 
      programId: defaultProgramId || activeProgram?.id || '',
      pesertaNama: pesertaNama || currentUser?.nama || ''
    });
    setPProgramId(defaultProgramId || activeProgram?.id || '');
    setPPesertaNama(pesertaNama || currentUser?.nama || '');
    setPPesertaPeran(currentUser?.role === 'Guru Mitra' ? 'Guru Magang' : '');
    setPPesertaEmail(currentUser?.email || '');
    setPDocNama('');
    setPDocTipe('Logbook');
    setPUploadMethod('url');
    setPDocUrl('');
    setPDocFileName('');
    setPDocFileData('');
    setPDocKeterangan('');
    setIsPersonalDocModalOpen(true);
  };

  const handleOpenEditPersonalDoc = (peserta: PesertaMagangItem, docItem: DokumenPribadiPeserta, programId: string) => {
    setEditingPersonalDoc({ pesertaId: peserta.id, docItem, programId, pesertaNama: peserta.nama });
    setPProgramId(programId);
    setPPesertaNama(peserta.nama);
    setPPesertaPeran(peserta.peran || '');
    setPPesertaEmail(peserta.email || '');
    setPDocNama(docItem.nama);
    setPDocTipe(docItem.tipe);
    setPUploadMethod(docItem.fileData ? 'file' : 'url');
    setPDocUrl(docItem.url || '');
    setPDocFileName(docItem.fileName || '');
    setPDocFileData(docItem.fileData || '');
    setPDocKeterangan(docItem.keterangan || '');
    setIsPersonalDocModalOpen(true);
  };

  const handlePersonalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 600 * 1024) {
      alert('Ukuran file maksimal 600 KB untuk disimpan langsung ke Firestore. Jika file Anda lebih besar (misal video atau portofolio besar), silakan gunakan tautan Google Drive / Google Docs / Canva.');
      return;
    }

    setPDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPDocFileData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePersonalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProgramId = pProgramId || editingPersonalDoc?.programId || activeProgram?.id;
    const programToUpdate = programList.find(p => p.id === targetProgramId) || activeProgram;
    if (!programToUpdate) return;

    const currentPesertaList = [...(programToUpdate.pesertaMagang || [])];
    const targetPesertaId = editingPersonalDoc?.pesertaId;

    let targetPeserta = currentPesertaList.find(p => (targetPesertaId && p.id === targetPesertaId) || p.nama.toLowerCase() === pPesertaNama.trim().toLowerCase());

    if (!targetPeserta) {
      targetPeserta = {
        id: `PESERTA-${Date.now().toString().slice(-4)}`,
        nama: pPesertaNama.trim() || 'Peserta Magang',
        peran: pPesertaPeran.trim() || 'Peserta Magang',
        email: pPesertaEmail.trim() || undefined,
        sekolahId: programToUpdate.mitraId,
        namaSekolah: programToUpdate.namaSekolah,
        dokumenPribadi: []
      };
      currentPesertaList.push(targetPeserta);
    } else {
      targetPeserta.nama = pPesertaNama.trim() || targetPeserta.nama;
      if (pPesertaPeran) targetPeserta.peran = pPesertaPeran.trim();
      if (pPesertaEmail) targetPeserta.email = pPesertaEmail.trim();
    }

    const currentDocs = targetPeserta.dokumenPribadi || [];
    let updatedDocs: DokumenPribadiPeserta[];

    if (editingPersonalDoc?.docItem) {
      updatedDocs = currentDocs.map(d => d.id === editingPersonalDoc.docItem?.id ? {
        ...d,
        nama: pDocNama.trim(),
        tipe: pDocTipe,
        url: pUploadMethod === 'url' ? (pDocUrl.trim() || undefined) : undefined,
        fileName: pUploadMethod === 'file' ? (pDocFileName.trim() || undefined) : undefined,
        fileData: pUploadMethod === 'file' ? (pDocFileData || undefined) : undefined,
        keterangan: pDocKeterangan.trim() || undefined,
        tanggal: d.tanggal || new Date().toISOString().split('T')[0]
      } : d);
    } else {
      const newDoc: DokumenPribadiPeserta = {
        id: `DP-${Date.now().toString().slice(-4)}`,
        nama: pDocNama.trim(),
        tipe: pDocTipe,
        url: pUploadMethod === 'url' ? (pDocUrl.trim() || undefined) : undefined,
        fileName: pUploadMethod === 'file' ? (pDocFileName.trim() || undefined) : undefined,
        fileData: pUploadMethod === 'file' ? (pDocFileData || undefined) : undefined,
        keterangan: pDocKeterangan.trim() || undefined,
        tanggal: new Date().toISOString().split('T')[0]
      };
      updatedDocs = [newDoc, ...currentDocs];
    }

    targetPeserta.dokumenPribadi = updatedDocs;

    try {
      await onUpdateProgram({
        ...programToUpdate,
        pesertaMagang: currentPesertaList
      });
      setIsPersonalDocModalOpen(false);
      onShowFeedback('success', `Dokumen "${pDocNama}" untuk peserta ${pPesertaNama} berhasil diunggah ke Firebase.`);
    } catch {
      onShowFeedback('error', 'Gagal mengunggah dokumen peserta.');
    }
  };

  const handleDeletePersonalDoc = async (pesertaId: string, docId: string, programId: string) => {
    const program = programList.find(p => p.id === programId);
    if (!program || !program.pesertaMagang) return;

    const updatedPesertaList = program.pesertaMagang.map(p => {
      if (p.id === pesertaId) {
        return {
          ...p,
          dokumenPribadi: (p.dokumenPribadi || []).filter(d => d.id !== docId)
        };
      }
      return p;
    });

    try {
      await onUpdateProgram({
        ...program,
        pesertaMagang: updatedPesertaList
      });
      onShowFeedback('success', 'Dokumen pribadi berhasil dihapus.');
    } catch {
      onShowFeedback('error', 'Gagal menghapus dokumen.');
    }
  };

  // Handler: Laporan
  const handleOpenAddLaporan = () => {
    setEditingLaporan(null);
    setLapJudul('');
    setLapTipe(activeProgram?.jenis === 'Visitasi' ? 'Laporan Visitasi' : activeProgram?.jenis === 'Magang' ? 'Laporan Akhir Magang' : 'Laporan ToT');
    setLapPenulis(currentUser?.nama || 'Tim Evaluator');
    setLapRingkasan('');
    setLapUrl('');
    setLapStatus('Disetujui');
    setIsLaporanModalOpen(true);
  };

  const handleOpenEditLaporan = (laporan: LaporanProgramMitra, programId: string) => {
    setEditingLaporan({ laporan, programId });
    setLapJudul(laporan.judul);
    setLapTipe(laporan.tipe);
    setLapPenulis(laporan.penulis || '');
    setLapRingkasan(laporan.ringkasan || '');
    setLapUrl(laporan.url || '');
    setLapStatus(laporan.status);
    setIsLaporanModalOpen(true);
  };

  const handleSaveLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;

    const programToUpdate = editingLaporan 
      ? programList.find(p => p.id === editingLaporan.programId) || activeProgram 
      : activeProgram;

    const currentLaporan = programToUpdate.laporanProgram || [];
    let updatedLaporan: LaporanProgramMitra[];

    if (editingLaporan) {
      updatedLaporan = currentLaporan.map(l => l.id === editingLaporan.laporan.id ? {
        ...l,
        judul: lapJudul.trim(),
        tipe: lapTipe,
        penulis: lapPenulis.trim() || undefined,
        ringkasan: lapRingkasan.trim() || undefined,
        url: lapUrl.trim() || undefined,
        status: lapStatus,
        tanggal: l.tanggal || new Date().toISOString().split('T')[0]
      } : l);
    } else {
      const newLap: LaporanProgramMitra = {
        id: `LAP-${Date.now().toString().slice(-4)}`,
        judul: lapJudul.trim(),
        tipe: lapTipe,
        penulis: lapPenulis.trim() || undefined,
        ringkasan: lapRingkasan.trim() || undefined,
        url: lapUrl.trim() || undefined,
        status: lapStatus,
        tanggal: new Date().toISOString().split('T')[0]
      };
      updatedLaporan = [newLap, ...currentLaporan];
    }

    try {
      await onUpdateProgram({
        ...programToUpdate,
        laporanProgram: updatedLaporan
      });
      setIsLaporanModalOpen(false);
      onShowFeedback('success', `Laporan "${lapJudul}" berhasil tersimpan ke Firebase.`);
    } catch {
      onShowFeedback('error', 'Gagal menyimpan laporan.');
    }
  };

  const handleDeleteLaporan = async (lapId: string, programId: string) => {
    const program = programList.find(p => p.id === programId);
    if (!program) return;
    const updated = (program.laporanProgram || []).filter(l => l.id !== lapId);
    try {
      await onUpdateProgram({ ...program, laporanProgram: updated });
      onShowFeedback('success', 'Laporan berhasil dihapus.');
    } catch {
      onShowFeedback('error', 'Gagal menghapus laporan.');
    }
  };

  // Handler: Gap Analysis
  const handleOpenAddGap = () => {
    setEditingGap(null);
    setGapTopik('');
    setGapAspek('Kurikulum & Pembelajaran');
    setGapKondisiAwal('');
    setGapStandarLazuardi('');
    setGapSelisih('');
    setGapRencanaAksi('');
    setGapPic('');
    setGapTargetSelesai(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setGapStatus('Dalam Proses');
    setGapDokumenUrl('');
    setGapCatatan('');
    setIsGapModalOpen(true);
  };

  const handleOpenEditGap = (gap: AgendaGapAnalysis, programId: string) => {
    setEditingGap({ gap, programId });
    setGapTopik(gap.topik);
    setGapAspek(gap.aspek);
    setGapKondisiAwal(gap.kondisiAwal);
    setGapStandarLazuardi(gap.standarLazuardi);
    setGapSelisih(gap.gapSelisih);
    setGapRencanaAksi(gap.rencanaAksi);
    setGapPic(gap.pic || '');
    setGapTargetSelesai(gap.targetSelesai || '');
    setGapStatus(gap.status);
    setGapDokumenUrl(gap.dokumenUrl || '');
    setGapCatatan(gap.catatan || '');
    setIsGapModalOpen(true);
  };

  const handleSaveGap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;

    const programToUpdate = editingGap 
      ? programList.find(p => p.id === editingGap.programId) || activeProgram 
      : activeProgram;

    const currentGaps = programToUpdate.agendaGapAnalysis || [];
    let updatedGaps: AgendaGapAnalysis[];

    if (editingGap) {
      updatedGaps = currentGaps.map(g => g.id === editingGap.gap.id ? {
        ...g,
        topik: gapTopik.trim(),
        aspek: gapAspek,
        kondisiAwal: gapKondisiAwal.trim(),
        standarLazuardi: gapStandarLazuardi.trim(),
        gapSelisih: gapSelisih.trim(),
        rencanaAksi: gapRencanaAksi.trim(),
        pic: gapPic.trim() || undefined,
        targetSelesai: gapTargetSelesai || undefined,
        status: gapStatus,
        dokumenUrl: gapDokumenUrl.trim() || undefined,
        catatan: gapCatatan.trim() || undefined,
        tanggal: g.tanggal || new Date().toISOString().split('T')[0]
      } : g);
    } else {
      const newGap: AgendaGapAnalysis = {
        id: `GAP-${Date.now().toString().slice(-4)}`,
        topik: gapTopik.trim(),
        aspek: gapAspek,
        kondisiAwal: gapKondisiAwal.trim(),
        standarLazuardi: gapStandarLazuardi.trim(),
        gapSelisih: gapSelisih.trim(),
        rencanaAksi: gapRencanaAksi.trim(),
        pic: gapPic.trim() || undefined,
        targetSelesai: gapTargetSelesai || undefined,
        status: gapStatus,
        dokumenUrl: gapDokumenUrl.trim() || undefined,
        catatan: gapCatatan.trim() || undefined,
        tanggal: new Date().toISOString().split('T')[0]
      };
      updatedGaps = [newGap, ...currentGaps];
    }

    try {
      await onUpdateProgram({
        ...programToUpdate,
        agendaGapAnalysis: updatedGaps
      });
      setIsGapModalOpen(false);
      onShowFeedback('success', `Agenda Gap Analysis "${gapTopik}" berhasil disimpan ke Firebase.`);
    } catch {
      onShowFeedback('error', 'Gagal menyimpan Gap Analysis.');
    }
  };

  const handleDeleteGap = async (gapId: string, programId: string) => {
    const program = programList.find(p => p.id === programId);
    if (!program) return;
    const updated = (program.agendaGapAnalysis || []).filter(g => g.id !== gapId);
    try {
      await onUpdateProgram({ ...program, agendaGapAnalysis: updated });
      onShowFeedback('success', 'Agenda Gap Analysis berhasil dihapus.');
    } catch {
      onShowFeedback('error', 'Gagal menghapus Gap Analysis.');
    }
  };

  const handleToggleGapStatus = async (gap: AgendaGapAnalysis, programId: string) => {
    const nextStatus: AgendaGapAnalysis['status'] = 
      gap.status === 'Belum Selesai' ? 'Dalam Proses' :
      gap.status === 'Dalam Proses' ? 'Terpenuhi' : 'Belum Selesai';

    const program = programList.find(p => p.id === programId);
    if (!program) return;

    const updated = (program.agendaGapAnalysis || []).map(g => g.id === gap.id ? { ...g, status: nextStatus } : g);
    try {
      await onUpdateProgram({ ...program, agendaGapAnalysis: updated });
      onShowFeedback('success', `Status Gap Analysis diubah menjadi "${nextStatus}".`);
    } catch {
      onShowFeedback('error', 'Gagal mengubah status Gap Analysis.');
    }
  };

  const handleCopyTemplateLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTemplateId(id);
    onShowFeedback('success', 'Tautan template disalin ke clipboard! Buka di tab baru lalu pilih File > Make a Copy.');
    setTimeout(() => setCopiedTemplateId(null), 3000);
  };

  // Aggregate Data for display
  const allSchoolDocs: Array<{ doc: DokumenMitraSekolah; program: ProgramMitraItem }> = [];
  const allPeserta: Array<{ peserta: PesertaMagangItem; program: ProgramMitraItem }> = [];
  const allLaporan: Array<{ laporan: LaporanProgramMitra; program: ProgramMitraItem }> = [];
  const allGapAnalysis: Array<{ gap: AgendaGapAnalysis; program: ProgramMitraItem }> = [];

  currentSchoolPrograms.forEach(prog => {
    (prog.dokumenSekolah || []).forEach(doc => allSchoolDocs.push({ doc, program: prog }));
    (prog.pesertaMagang || []).forEach(peserta => allPeserta.push({ peserta, program: prog }));
    (prog.laporanProgram || []).forEach(laporan => allLaporan.push({ laporan, program: prog }));
    (prog.agendaGapAnalysis || []).forEach(gap => allGapAnalysis.push({ gap, program: prog }));
  });

  // Unique list of participants across all selected programs
  const participantNames = Array.from(new Set(allPeserta.map(p => p.peserta.nama)));

  // Filtered collections based on search & PRIVACY RULES:
  // "dan hanya mereka yang lihat dan admin"
  const filteredPeserta = allPeserta.filter(item => {
    // If not admin: STRICT PRIVACY RULE (Only show participant's own documents)
    if (!isAdmin) {
      const myName = (participantSelfIdentity || currentUser?.nama || '').trim().toLowerCase();
      const myEmail = (currentUser?.email || '').trim().toLowerCase();
      
      const isMyOwn = 
        (myName && item.peserta.nama.toLowerCase().includes(myName)) ||
        (myEmail && item.peserta.email?.toLowerCase() === myEmail) ||
        (selectedPesertaFilter !== 'ALL' && item.peserta.nama === selectedPesertaFilter);

      if (!isMyOwn) return false;
    } else {
      // Admin can filter by participant dropdown
      if (selectedPesertaFilter !== 'ALL' && item.peserta.nama !== selectedPesertaFilter) return false;
    }

    return item.peserta.nama.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.peserta.peran && item.peserta.peran.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (item.peserta.email && item.peserta.email.toLowerCase().includes(searchFilter.toLowerCase()));
  });

  const filteredSchoolDocs = allSchoolDocs.filter(item => 
    item.doc.nama.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.doc.tipe.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (item.doc.keterangan && item.doc.keterangan.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredLaporan = allLaporan.filter(item => 
    item.laporan.judul.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.laporan.tipe.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (item.laporan.ringkasan && item.laporan.ringkasan.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredGaps = allGapAnalysis.filter(item => 
    item.gap.topik.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.gap.aspek.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.gap.gapSelisih.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.gap.rencanaAksi.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getDocTypeBadge = (tipe: DokumenMitraSekolah['tipe']) => {
    switch (tipe) {
      case 'MoU':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">MoU & Kontrak</span>;
      case 'Surat Tugas':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">Surat Tugas</span>;
      case 'Panduan':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">SOP & Panduan</span>;
      case 'Sertifikat Sekolah':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Sertifikat Kemitraan</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Materi</span>;
    }
  };

  const getPersonalDocBadge = (tipe: DokumenPribadiPeserta['tipe']) => {
    switch (tipe) {
      case 'Logbook':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Logbook Harian</span>;
      case 'Portofolio':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">Portofolio & IEP</span>;
      case 'Penilaian':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Penilaian Mentor</span>;
      case 'Sertifikat':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">Sertifikat Kelulusan</span>;
      case 'Surat Tugas':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">ID / Surat Tugas</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Tugas / Berkas</span>;
    }
  };

  const getGapStatusBadge = (status: AgendaGapAnalysis['status']) => {
    switch (status) {
      case 'Terpenuhi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Terpenuhi</span>
          </span>
        );
      case 'Dalam Proses':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={13} className="text-amber-600" />
            <span>Dalam Proses</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle size={13} className="text-rose-600" />
            <span>Belum Selesai</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice with Flyer Quick Button */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                Portal Akses Mandiri Peserta Magang &amp; Sekolah Mitra
              </span>
              <span className="text-xs text-slate-300 font-medium">L-MAP Mitra Office</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-emerald-400" />
              <span>Ruang Akses Dokumen, Template Mandiri &amp; Upload Berkas Tugas</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Khusus Admin dapat mengunggah flyer portrait program. Setiap peserta magang dapat langsung mengakses template pribadi dan mengunggah dokumen pengerjaannya secara privat (hanya dapat dilihat oleh peserta bersangkutan dan Admin L-MAP).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            {/* Self-service upload button for participants / anyone */}
            <button
              type="button"
              onClick={() => handleOpenAddPersonalDoc(undefined, participantSelfIdentity || currentUser?.nama, activeProgram?.id)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Upload size={15} />
              <span>+ Upload Dokumen Peserta</span>
            </button>

            {/* Admin Flyer Management Quick Action */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenFlyerUpload(activeProgram)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ImageIcon size={15} />
                <span>Upload Flyer Portrait (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: School Selector, Admin Program Filter, Participant Privacy Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap">
          {/* School Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Building2 size={15} className="text-blue-600" />
              <span>Sekolah:</span>
            </span>

            {isAdmin ? (
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">Semua Sekolah Mitra</option>
                {sekolahList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah} ({s.id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
                {currentUser?.namaSekolah || currentUser?.nama || 'Sekolah Mitra'}
              </div>
            )}
          </div>

          {/* Pilih Program: Dapat dilihat dan diklik oleh SEMUA pengguna (Admin & Mitra) */}
          <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-200">
            <span className="text-xs font-bold text-blue-950 flex items-center gap-1">
              <Filter size={14} className="text-blue-600" />
              <span>Pilih Program:</span>
            </span>
            <select
              value={selectedProgramFilter}
              onChange={(e) => {
                const newProgId = e.target.value;
                setSelectedProgramFilter(newProgId);
                if (newProgId !== 'ALL') {
                  const prog = effectiveProgramList.find(p => p.id === newProgId);
                  if (prog && selectedSchoolId !== 'ALL' && prog.mitraId !== selectedSchoolId) {
                    setSelectedSchoolId('ALL');
                  }
                }
              }}
              className="bg-transparent text-xs font-bold text-blue-900 focus:outline-none cursor-pointer max-w-[210px] truncate"
              title="Pilih program untuk melihat agenda atau berkas secara spesifik"
            >
              <option value="ALL">Semua Program ({effectiveProgramList.length})</option>
              {effectiveProgramList.map(prog => (
                <option key={prog.id} value={prog.id}>
                  [{prog.jenis}] {prog.judul} ({prog.namaSekolah})
                </option>
              ))}
            </select>
            {selectedProgramFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedProgramFilter('ALL')}
                className="p-0.5 text-blue-500 hover:text-rose-600 rounded cursor-pointer"
                title="Reset pilihan program"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Participant Filter (Admin: Filter peserta mana saja / Non-Admin: Identitas Saya) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <UserCheck size={15} className="text-indigo-600" />
              <span>{isAdmin ? 'Filter Peserta:' : 'Identitas Peserta Saya:'}</span>
            </span>
            {isAdmin ? (
              <select
                value={selectedPesertaFilter}
                onChange={(e) => setSelectedPesertaFilter(e.target.value)}
                className="px-3 py-1.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-600 max-w-[200px]"
              >
                <option value="ALL">Semua Peserta ({participantNames.length})</option>
                {participantNames.map(nama => (
                  <option key={nama} value={nama}>
                    👤 {nama}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedPesertaFilter === 'ALL' ? (participantSelfIdentity || participantNames[0] || 'ALL') : selectedPesertaFilter}
                  onChange={(e) => {
                    setSelectedPesertaFilter(e.target.value);
                    setParticipantSelfIdentity(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {participantNames.length > 0 ? (
                    participantNames.map(nama => (
                      <option key={nama} value={nama}>
                        👤 {nama} (Milik Saya)
                      </option>
                    ))
                  ) : (
                    <option value={currentUser?.nama || 'Saya'}>
                      👤 {currentUser?.nama || 'Peserta'}
                    </option>
                  )}
                </select>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Lock size={10} />
                  <span>Privat</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Cari berkas, nama peserta, tugas..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Program Flyers Showcase for Selected School / Programs with Portrait Aspect Ratio */}
      {currentSchoolPrograms.some(p => p.flyerUrl || p.flyerFileData) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-200/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <ImageIcon size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Flyer Portrait Resmi Program Kemitraan (Visitasi, Magang &amp; ToT)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Format poster portrait resmi berstandar Lazuardi yang dapat diakses langsung oleh peserta
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenFlyerUpload(activeProgram)}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs"
              >
                <Plus size={14} />
                <span>Upload Flyer Baru (Admin)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentSchoolPrograms.filter(p => p.flyerUrl || p.flyerFileData).map(prog => {
              const flyerImg = prog.flyerFileData || prog.flyerUrl;
              return (
                <div 
                  key={prog.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col justify-between"
                >
                  {/* Portrait aspect ratio container (3:4) */}
                  <div 
                    className="relative aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer" 
                    onClick={() => onOpenFlyerPreview({
                      url: flyerImg || '',
                      title: prog.flyerCaption || prog.judul,
                      caption: prog.deskripsi,
                      school: prog.namaSekolah
                    })}
                  >
                    {flyerImg ? (
                      <img 
                        src={flyerImg} 
                        alt={prog.flyerCaption || prog.judul} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-end p-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                            {prog.jenis}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                            Portrait
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white line-clamp-2">
                          {prog.flyerCaption || prog.judul}
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 text-xs flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
                    <span className="text-slate-500 font-medium truncate max-w-[120px]">{prog.namaSekolah}</span>
                    <button
                      type="button"
                      onClick={() => onOpenFlyerPreview({
                        url: flyerImg || '',
                        title: prog.flyerCaption || prog.judul,
                        caption: prog.deskripsi,
                        school: prog.namaSekolah
                      })}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Lihat Flyer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-bold flex-wrap">
        <button
          onClick={() => setActiveCategory('semua')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer ${
            activeCategory === 'semua' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Bagian
        </button>
        <button
          onClick={() => setActiveCategory('dokumen-pribadi')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeCategory === 'dokumen-pribadi' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
          }`}
        >
          <UserCheck size={14} className={activeCategory === 'dokumen-pribadi' ? 'text-white' : 'text-indigo-600'} />
          <span>Ruang Dokumen Peserta ({filteredPeserta.reduce((acc, p) => acc + (p.peserta.dokumenPribadi?.length || 0), 0)})</span>
        </button>
        <button
          onClick={() => setActiveCategory('dokumen-sekolah')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeCategory === 'dokumen-sekolah' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 size={14} />
          <span>Dokumen Milik Sekolah ({allSchoolDocs.length})</span>
        </button>
        <button
          onClick={() => setActiveCategory('laporan')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeCategory === 'laporan' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={14} />
          <span>Laporan Kegiatan ({allLaporan.length})</span>
        </button>
        <button
          onClick={() => setActiveCategory('gap-analysis')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeCategory === 'gap-analysis' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Target size={14} />
          <span>Agenda Gap Analysis ({allGapAnalysis.length})</span>
        </button>
      </div>

      {/* SECTION: RUANG DOKUMEN PESERTA (PRIVAT: HANYA PESERTA & ADMIN YANG MELIHAT) */}
      {(activeCategory === 'semua' || activeCategory === 'dokumen-pribadi') && (
        <div className="space-y-4">
          {/* Privacy Notice Banner for Participant */}
          {!isAdmin && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="font-bold">Mode Akses Privat Peserta Aktif</p>
                  <p className="text-[11px] text-emerald-800">
                    Dokumen tugas &amp; logbook di bawah ini <strong>hanya dapat dilihat oleh Anda dan Administrator L-MAP</strong>. Peserta lain tidak dapat mengakses berkas ini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddPersonalDoc(undefined, participantSelfIdentity || currentUser?.nama, activeProgram?.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Upload size={14} />
                <span>+ Upload Dokumen Saya</span>
              </button>
            </div>
          )}

          {/* 1. Template Khusus Peserta Magang Box */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-700/50 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Template Dokumen Khusus Peserta
                  </span>
                  <span className="text-xs text-indigo-300">Akses Langsung &amp; Salin Template</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <span>Template Tugas, Logbook &amp; Portofolio Mandiri</span>
                </h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed mt-0.5">
                  Klik <strong>&quot;Buka &amp; Buat Salinan&quot;</strong> pada template di bawah, kerjakan tugas Anda, lalu kumpulkan file atau link pengerjaan melalui tombol <strong>&quot;+ Upload Dokumen Peserta&quot;</strong>.
                </p>
              </div>

              {/* Action Button for Participant to Upload */}
              <button
                type="button"
                onClick={() => handleOpenAddPersonalDoc(undefined, participantSelfIdentity || currentUser?.nama, activeProgram?.id)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 self-start md:self-auto"
              >
                <Upload size={16} />
                <span>+ Upload Dokumen Peserta</span>
              </button>
            </div>

            {/* Template Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEFAULT_MAGANG_TEMPLATES.map(tmpl => (
                <div 
                  key={tmpl.id}
                  className="bg-white/10 hover:bg-white/15 p-3.5 rounded-2xl border border-white/10 transition flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tmpl.badge === 'Docs' ? 'bg-blue-500/30 text-blue-200' :
                        tmpl.badge === 'Sheet' ? 'bg-emerald-500/30 text-emerald-200' :
                        tmpl.badge === 'Canva' ? 'bg-purple-500/30 text-purple-200' :
                        'bg-rose-500/30 text-rose-200'
                      }`}>
                        {tmpl.format}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTemplateLink(tmpl.id, tmpl.url)}
                        className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer bg-white/10 px-2 py-0.5 rounded"
                        title="Salin tautan template"
                      >
                        {copiedTemplateId === tmpl.id ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Salin Tautan</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h5 className="text-xs font-bold text-white leading-snug line-clamp-2">
                      {tmpl.nama}
                    </h5>
                    <p className="text-[11px] text-indigo-200/80 line-clamp-2 mt-1 leading-relaxed">
                      {tmpl.deskripsi}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <a
                      href={tmpl.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white transition"
                    >
                      <span>Buka &amp; Buat Salinan</span>
                      <ExternalLink size={12} />
                    </a>
                    <span className="text-[10px] text-indigo-300/60 font-mono">Template Resmi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Daftar Peserta & Dokumen Yang Diunggah (Privat) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Dokumen Yang Telah Diunggah Peserta ({filteredPeserta.length} Peserta)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isAdmin 
                        ? 'Administrator dapat meninjau seluruh berkas yang dikumpulkan peserta di setiap program'
                        : 'Menampilkan dokumen milik Anda secara privat (hanya Anda dan Admin L-MAP yang dapat melihat)'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => handleOpenAddPersonalDoc(undefined, participantSelfIdentity || currentUser?.nama, activeProgram?.id)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>+ Upload Dokumen Peserta</span>
              </button>
            </div>

            {filteredPeserta.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <UserCheck size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">Belum ada dokumen yang diunggah.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Klik tombol <strong>&quot;+ Upload Dokumen Peserta&quot;</strong> untuk mengumpulkan berkas tugas atau logbook Anda.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPeserta.map(({ peserta, program }) => (
                  <div 
                    key={peserta.id}
                    className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3.5 hover:border-indigo-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-bold text-slate-900">
                            {peserta.nama}
                          </h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {peserta.peran || 'Peserta Magang'}
                          </span>
                          {!isAdmin && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Lock size={10} />
                              <span>Milik Anda (Privat)</span>
                            </span>
                          )}
                          {peserta.email && (
                            <span className="text-[11px] text-slate-500">
                              • {peserta.email}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Sekolah: <strong className="text-slate-700">{program.namaSekolah}</strong> • Program: {program.judul}
                        </p>
                      </div>

                      {/* Participant Card Action: Upload specifically to this participant */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddPersonalDoc(peserta.id, peserta.nama, program.id)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <Upload size={13} />
                        <span>Upload Berkas ({peserta.nama.split(' ')[0]})</span>
                      </button>
                    </div>

                    {/* Dokumen Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(peserta.dokumenPribadi || []).length === 0 ? (
                        <div className="p-4 bg-white/70 rounded-xl border border-dashed border-indigo-200 col-span-3 text-center">
                          <p className="text-xs text-slate-500 italic">
                            Belum ada dokumen yang diunggah untuk {peserta.nama}.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenAddPersonalDoc(peserta.id, peserta.nama, program.id)}
                            className="mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Upload size={12} />
                            <span>Unggah dokumen pertama sekarang</span>
                          </button>
                        </div>
                      ) : (
                        (peserta.dokumenPribadi || []).map(doc => (
                          <div 
                            key={doc.id}
                            className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between space-y-2.5 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                {getPersonalDocBadge(doc.tipe)}
                                <span className="text-[9px] text-slate-400 font-mono">{doc.tanggal}</span>
                              </div>
                              <h6 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                {doc.nama}
                              </h6>
                              {doc.keterangan && (
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                  {doc.keterangan}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              {/* Open link or Download file */}
                              {doc.fileData ? (
                                <a
                                  href={doc.fileData}
                                  download={doc.fileName || doc.nama}
                                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
                                >
                                  <Download size={13} />
                                  <span>Unduh File ({doc.fileName?.slice(-8) || 'File'})</span>
                                </a>
                              ) : doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                                >
                                  <span>Buka Tautan</span>
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Berkas fisik</span>
                              )}

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPersonalDoc(peserta, doc, program.id)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                                  title="Edit Dokumen"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePersonalDoc(peserta.id, doc.id, program.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="Hapus Dokumen"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: DOKUMEN MILIK SEKOLAH */}
      {(activeCategory === 'semua' || activeCategory === 'dokumen-sekolah') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Dokumen Milik Sekolah (MoU, Surat Tugas Resmi &amp; Panduan)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dokumen resmi kelembagaan sekolah yang dapat diakses langsung oleh pihak sekolah mitra
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddSchoolDoc}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Tambah Dokumen Sekolah</span>
              </button>
            )}
          </div>

          {filteredSchoolDocs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <Building2 size={28} className="mx-auto mb-1.5 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Belum ada dokumen sekolah yang tercatat.</p>
              {isAdmin && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol &quot;Tambah Dokumen Sekolah&quot; untuk mengunggah MoU atau surat tugas.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSchoolDocs.map(({ doc, program }) => (
                <div 
                  key={doc.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-blue-300 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getDocTypeBadge(doc.tipe)}
                        <span className="text-[11px] font-bold text-slate-700">
                          {program.namaSekolah}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.tanggal}</span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                      {doc.nama}
                    </h5>

                    {doc.keterangan && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {doc.keterangan}
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Buka / Unduh Dokumen</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Dokumen fisik tersimpan</span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSchoolDoc(doc, program.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Edit Dokumen"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchoolDoc(doc.id, program.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: AKSES LAPORAN KEGIATAN */}
      {(activeCategory === 'semua' || activeCategory === 'laporan') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Akses Laporan Kegiatan &amp; Hasil Evaluasi Kemitraan
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Laporan hasil visitasi, laporan akhir magang guru, dan ringkasan eksekutif mutu
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddLaporan}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Terbitkan Laporan Baru</span>
              </button>
            )}
          </div>

          {filteredLaporan.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <FileText size={28} className="mx-auto mb-1.5 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Belum ada laporan kegiatan yang diterbitkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLaporan.map(({ laporan, program }) => (
                <div 
                  key={laporan.id}
                  className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 hover:border-emerald-300 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {laporan.tipe}
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {program.namaSekolah}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {laporan.status}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                      {laporan.judul}
                    </h5>

                    {laporan.penulis && (
                      <p className="text-[11px] text-slate-500 mb-2">
                        Penyusun: <strong className="text-slate-700">{laporan.penulis}</strong> • {laporan.tanggal}
                      </p>
                    )}

                    {laporan.ringkasan && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                        {laporan.ringkasan}
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-emerald-100 flex items-center justify-between">
                    {laporan.url ? (
                      <a
                        href={laporan.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Buka Laporan Lengkap</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">Tersedia di arsip pusat</span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLaporan(laporan, program.id)}
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-pointer"
                          title="Edit Laporan"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLaporan(laporan.id, program.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Hapus Laporan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: AGENDA & MATRIKS GAP ANALYSIS */}
      {(activeCategory === 'semua' || activeCategory === 'gap-analysis') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <Target size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Agenda &amp; Matriks Gap Analysis Masing-Masing Sekolah / Peserta
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Analisis kesenjangan kondisi awal mitra terhadap standar mutu Lazuardi, rencana aksi, dan pelacakan status pemenuhan
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddGap}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Tambah Agenda Gap Analysis</span>
              </button>
            )}
          </div>

          {filteredGaps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <Target size={28} className="mx-auto mb-1.5 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Belum ada agenda Gap Analysis untuk sekolah ini.</p>
              {isAdmin && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik tombol &quot;Tambah Agenda Gap Analysis&quot; untuk menyusun evaluasi kesenjangan standar.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGaps.map(({ gap, program }) => (
                <div 
                  key={gap.id}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:border-purple-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        {gap.aspek}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900">
                        {gap.topik}
                      </h5>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({program.namaSekolah})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleGapStatus(gap, program.id)}
                        className="cursor-pointer hover:opacity-80 transition"
                        title="Klik untuk ubah status pemenuhan"
                      >
                        {getGapStatusBadge(gap.status)}
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGap(gap, program.id)}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded cursor-pointer"
                            title="Edit Gap Analysis"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGap(gap.id, program.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus Gap Analysis"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                        Kondisi Awal Sekolah Mitra
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {gap.kondisiAwal}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                        Standar Mutu Target Lazuardi
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {gap.standarLazuardi}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Gap (Selisih Kesenjangan)
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {gap.gapSelisih}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Agenda &amp; Rencana Aksi Pemenuhan:
                      </span>
                      <p className="text-slate-800 font-semibold text-xs leading-relaxed">
                        {gap.rencanaAksi}
                      </p>
                      {gap.pic && (
                        <p className="text-[11px] text-slate-500">
                          Penanggung Jawab (PIC): <strong className="text-slate-700">{gap.pic}</strong>
                          {gap.targetSelesai ? ` • Target: ${gap.targetSelesai}` : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {gap.dokumenUrl && (
                        <a
                          href={gap.dokumenUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold transition flex items-center gap-1.5"
                        >
                          <span>Bukti / Dokumen Checklist</span>
                          <ExternalLink size={12} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleGapStatus(gap, program.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition text-xs cursor-pointer"
                      >
                        Perbarui Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: TAMBAH / EDIT DOKUMEN SEKOLAH */}
      {isSchoolDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                <span>{editingSchoolDoc ? 'Edit Dokumen Sekolah' : 'Tambah Dokumen Sekolah'}</span>
              </h4>
              <button 
                type="button"
                onClick={() => setIsSchoolDocModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchoolDoc} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama / Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={docNama}
                  onChange={(e) => setDocNama(e.target.value)}
                  placeholder="Misal: MoU Kerjasama Visitasi No. 042/2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Dokumen</label>
                <select
                  value={docTipe}
                  onChange={(e) => setDocTipe(e.target.value as DokumenMitraSekolah['tipe'])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="MoU">MoU &amp; Perjanjian Kerjasama</option>
                  <option value="Surat Tugas">Surat Tugas Resmi</option>
                  <option value="Panduan">SOP &amp; Panduan Pelaksanaan</option>
                  <option value="Sertifikat Sekolah">Sertifikat / Piagam Kemitraan</option>
                  <option value="Materi">Materi Kunjungan / Slide</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan File (Drive / Docs / PDF)</label>
                <input
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan Dokumen</label>
                <textarea
                  rows={2}
                  value={docKeterangan}
                  onChange={(e) => setDocKeterangan(e.target.value)}
                  placeholder="Penjelasan ringkas isi dokumen bagi sekolah"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md"
                >
                  Simpan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD DOKUMEN / HASIL TUGAS PESERTA (SELF-SERVICE PESERTA) */}
      {isPersonalDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingPersonalDoc?.docItem ? 'Edit Dokumen Peserta' : 'Upload Dokumen / Kumpulkan Tugas Peserta'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Khusus pengumpulan berkas tugas, logbook &amp; portofolio peserta magang
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPersonalDocModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-900">
              <Lock size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Privasi Dokumen Terjamin:</strong> Dokumen yang Anda unggah hanya dapat dilihat oleh Anda dan Administrator L-MAP.
              </p>
            </div>

            <form onSubmit={handleSavePersonalDoc} className="space-y-3.5 mt-4 text-xs">
              {/* Program Target Selector: Dropdown & Kartu Visual Klik Langsung */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Pilih Program Kegiatan Terkait <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {effectiveProgramList.length} Program Tersedia
                  </span>
                </label>
                <select
                  value={pProgramId || effectiveProgramList[0]?.id || ''}
                  onChange={(e) => setPProgramId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {effectiveProgramList.map(prog => (
                    <option key={prog.id} value={prog.id}>
                      [{prog.jenis}] {prog.judul} ({prog.namaSekolah})
                    </option>
                  ))}
                </select>

                {/* Kartu Visual Program yang Dapat Dilihat & Diklik Langsung */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Atau klik langsung pada kartu program berikut:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                    {effectiveProgramList.map(prog => {
                      const isSelected = (pProgramId || effectiveProgramList[0]?.id) === prog.id;
                      return (
                        <div
                          key={prog.id}
                          onClick={() => setPProgramId(prog.id)}
                          className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                prog.jenis === 'Visitasi' ? 'bg-blue-100 text-blue-800' :
                                prog.jenis === 'Magang' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {prog.jenis}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                  <CheckCircle2 size={12} />
                                  <span>Terpilih</span>
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-slate-900 text-xs line-clamp-1">{prog.judul}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 truncate">{prog.namaSekolah} • {prog.tanggalMulai}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Nama Peserta */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Peserta Magang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pPesertaNama}
                  onChange={(e) => setPPesertaNama(e.target.value)}
                  placeholder="Misal: Fathur Rahman, S.Pd"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan</label>
                  <input
                    type="text"
                    value={pPesertaPeran}
                    onChange={(e) => setPPesertaPeran(e.target.value)}
                    placeholder="Shadow Teacher / Guru"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Peserta</label>
                  <input
                    type="email"
                    value={pPesertaEmail}
                    onChange={(e) => setPPesertaEmail(e.target.value)}
                    placeholder="email@sekolah.sch.id"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Judul Dokumen & Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Dokumen / Tugas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pDocNama}
                    onChange={(e) => setPDocNama(e.target.value)}
                    placeholder="Misal: Logbook Pekan 2 / Portofolio Kasus IEP"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Dokumen</label>
                  <select
                    value={pDocTipe}
                    onChange={(e) => setPDocTipe(e.target.value as DokumenPribadiPeserta['tipe'])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Logbook">Logbook &amp; Lembar Harian</option>
                    <option value="Portofolio">Portofolio &amp; IEP Kasus</option>
                    <option value="Sertifikat">Sertifikat Kelulusan</option>
                    <option value="Penilaian">Lembar Penilaian Mentor</option>
                    <option value="Surat Tugas">ID Card / Surat Tugas</option>
                    <option value="Lainnya">Laporan Akhir / Tugas Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Metode Upload: Tautan Online atau File Fisik */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-800">
                  Pilih Cara Pengumpulan Berkas:
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="radio"
                      name="uploadMethod"
                      checked={pUploadMethod === 'url'}
                      onChange={() => setPUploadMethod('url')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tautan Google Drive / Docs / Canva</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="radio"
                      name="uploadMethod"
                      checked={pUploadMethod === 'file'}
                      onChange={() => setPUploadMethod('file')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Upload File Langsung (PDF / Word / Gambar)</span>
                  </label>
                </div>

                {pUploadMethod === 'url' ? (
                  <div>
                    <input
                      type="url"
                      value={pDocUrl}
                      onChange={(e) => setPDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/... atau tautan Drive"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-indigo-600 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Pastikan hak akses tautan Google Drive / Docs diatur ke &quot;Anyone with the link can view / edit&quot;.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div 
                      onClick={() => personalFileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-xl p-4 text-center cursor-pointer transition"
                    >
                      <Upload size={20} className="mx-auto text-indigo-500 mb-1" />
                      <p className="text-xs font-bold text-slate-800">
                        {pDocFileName ? pDocFileName : 'Pilih File Dokumen Tugas (PDF, Word, Excel, Gambar)'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Maksimal ukuran file: 600 KB</p>
                    </div>
                    <input
                      ref={personalFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handlePersonalFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan Pengerjaan</label>
                <textarea
                  rows={2}
                  value={pDocKeterangan}
                  onChange={(e) => setPDocKeterangan(e.target.value)}
                  placeholder="Misal: Sudah disupervisi mentor hari Selasa, progres pekan ke-2..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPersonalDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>Simpan &amp; Kumpulkan Dokumen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH / EDIT LAPORAN */}
      {isLaporanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                <span>{editingLaporan ? 'Edit Laporan Kegiatan' : 'Terbitkan Laporan Kegiatan'}</span>
              </h4>
              <button 
                type="button"
                onClick={() => setIsLaporanModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLaporan} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Laporan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lapJudul}
                  onChange={(e) => setLapJudul(e.target.value)}
                  placeholder="Misal: Laporan Hasil Visitasi Sarana &amp; Kurikulum Sentra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Laporan</label>
                  <select
                    value={lapTipe}
                    onChange={(e) => setLapTipe(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Laporan Visitasi">Laporan Visitasi</option>
                    <option value="Laporan Akhir Magang">Laporan Akhir Magang</option>
                    <option value="Laporan ToT">Laporan ToT</option>
                    <option value="Evaluasi Mitra">Evaluasi Mutu Mitra</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Laporan</label>
                  <select
                    value={lapStatus}
                    onChange={(e) => setLapStatus(e.target.value as 'Draft' | 'Final' | 'Disetujui')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Disetujui">Disetujui</option>
                    <option value="Final">Final</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Penyusun / Penulis</label>
                <input
                  type="text"
                  value={lapPenulis}
                  onChange={(e) => setLapPenulis(e.target.value)}
                  placeholder="Nama petugas atau tim evaluator"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan Laporan Lengkap (Docs / PDF)</label>
                <input
                  type="url"
                  value={lapUrl}
                  onChange={(e) => setLapUrl(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ringkasan Eksekutif</label>
                <textarea
                  rows={3}
                  value={lapRingkasan}
                  onChange={(e) => setLapRingkasan(e.target.value)}
                  placeholder="Poin-poin penting hasil pelaksanaan kegiatan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLaporanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md"
                >
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH / EDIT AGENDA GAP ANALYSIS */}
      {isGapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target size={16} className="text-purple-600" />
                <span>{editingGap ? 'Edit Agenda Gap Analysis' : 'Tambah Agenda Gap Analysis'}</span>
              </h4>
              <button 
                type="button"
                onClick={() => setIsGapModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGap} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Topik Kesenjangan (Gap) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={gapTopik}
                  onChange={(e) => setGapTopik(e.target.value)}
                  placeholder="Misal: Penataan Loose Parts Sentra Balok"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aspek Kemitraan</label>
                  <select
                    value={gapAspek}
                    onChange={(e) => setGapAspek(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Kurikulum & Pembelajaran">Kurikulum &amp; Pembelajaran</option>
                    <option value="Inklusi & Welas Asih">Inklusi &amp; Welas Asih</option>
                    <option value="Sarana & Fasilitas">Sarana &amp; Fasilitas</option>
                    <option value="SDM & Guru">SDM &amp; Guru</option>
                    <option value="Tata Kelola">Tata Kelola &amp; SOP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pemenuhan</label>
                  <select
                    value={gapStatus}
                    onChange={(e) => setGapStatus(e.target.value as AgendaGapAnalysis['status'])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Belum Selesai">Belum Selesai</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Terpenuhi">Terpenuhi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kondisi Awal Sekolah Mitra</label>
                <textarea
                  rows={2}
                  required
                  value={gapKondisiAwal}
                  onChange={(e) => setGapKondisiAwal(e.target.value)}
                  placeholder="Gambaran fakta riil kondisi sekolah mitra saat ini..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Standar Mutu Target Lazuardi</label>
                <textarea
                  rows={2}
                  required
                  value={gapStandarLazuardi}
                  onChange={(e) => setGapStandarLazuardi(e.target.value)}
                  placeholder="Standar ideal mutu Lazuardi yang harus dipenuhi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Selisih Gap (Kesenjangan)</label>
                <textarea
                  rows={2}
                  required
                  value={gapSelisih}
                  onChange={(e) => setGapSelisih(e.target.value)}
                  placeholder="Analisis persentase atau hal-hal yang belum sesuai..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Agenda &amp; Rencana Aksi Pemenuhan</label>
                <textarea
                  rows={2}
                  required
                  value={gapRencanaAksi}
                  onChange={(e) => setGapRencanaAksi(e.target.value)}
                  placeholder="Langkah konkret untuk menutup selisih gap..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    value={gapPic}
                    onChange={(e) => setGapPic(e.target.value)}
                    placeholder="Nama staf / guru"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Tanggal Selesai</label>
                  <input
                    type="date"
                    value={gapTargetSelesai}
                    onChange={(e) => setGapTargetSelesai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan Bukti / Checklist (Sheet / Docs / PDF)</label>
                <input
                  type="url"
                  value={gapDokumenUrl}
                  onChange={(e) => setGapDokumenUrl(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-purple-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGapModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-md cursor-pointer"
                >
                  Simpan Agenda Gap Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
