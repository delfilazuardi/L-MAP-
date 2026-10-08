import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  CheckCircle2, 
  Star, 
  BarChart3, 
  Plus, 
  X,
  Edit3,
  Trash2,
  FileText,
  Send,
  Eye,
  Lock,
  Settings,
  ClipboardList,
  Calendar,
  Building2,
  Mail,
  User,
  Sparkles,
  MessageSquareHeart,
  Layers,
  Filter,
  Check,
  Table2,
  Trophy,
  Award,
  Medal,
  Crown,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  MendakiFormDefinition, 
  MendakiFormSubmission 
} from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

const DEFAULT_EVENT_KEGIATAN_OPTIONS = [
  'Workshop Kurikulum',
  'Pelatihan Guru',
  'Koordinasi Pimpinan',
  'Supervisi Mutu',
  'Parenting',
  'Lomba Siswa'
];

interface PerformanceMendakiViewProps {
  initialEventContext?: {
    eventId?: string;
    judul: string;
    kategori: string;
    mode?: 'isi-form' | 'kelola-form';
  } | null;
  onClearEventContext?: () => void;
  onNavigateToEventTracker?: () => void;
}

export const PerformanceMendakiView: React.FC<PerformanceMendakiViewProps> = ({
  initialEventContext,
  onClearEventContext,
  onNavigateToEventTracker,
}) => {
  const { currentUser, isAdmin, isSekolahMitra, isGuruMitra } = useAuth();
  const { 
    sekolahList, 
    eventList,
    mendakiFormList,
    mendakiSubmissionList,
    addMendakiForm,
    updateMendakiForm,
    deleteMendakiForm,
    addMendakiSubmission,
    updateMendakiSubmission,
    deleteMendakiSubmission
  } = useData();

  const isDemoUser = Boolean(currentUser?.isDemo || currentUser?.sekolahId === 'DEMO-MITRA');
  const mySchoolId = currentUser?.sekolahId || '';

  // Active events from Event Tracker (isolated Demo vs Real)
  const connectedEvents = useMemo(() => {
    if (isDemoUser) {
      return eventList.filter(evt => evt.isDemo || evt.sekolahId === 'DEMO-MITRA' || evt.mitra === 'Semua Sekolah Mitra');
    }
    return eventList.filter(evt => !evt.isDemo && evt.sekolahId !== 'DEMO-MITRA');
  }, [eventList, isDemoUser]);

  // Available schools (strictly isolate DEMO-MITRA from production schools)
  const realSchools = useMemo(
    () => sekolahList.filter(s => !s.isDemo && s.id !== 'DEMO-MITRA'),
    [sekolahList]
  );

  const selectableSchools = useMemo(() => {
    if (isDemoUser) {
      return sekolahList.filter(s => s.id === 'DEMO-MITRA' || s.isDemo);
    }
    return realSchools;
  }, [isDemoUser, sekolahList, realSchools]);

  const currentSchoolObj = useMemo(
    () => sekolahList.find(s => s.id === mySchoolId),
    [sekolahList, mySchoolId]
  );

  // Active Sub-Tab:
  // - Guru Mitra: locked to 'isi-form' only
  // - Sekolah Mitra: locked to 'isi-form' (shows Form + Rekap Jumlah per Kategori Event)
  // - Admin: 'kelola-form' (default: Report Setiap Event + Piala Sekolah + Sheet Hasil per Orang + Kelola Form) | 'report-event' | 'isi-form'
  const [activeSubTab, setActiveSubTab] = useState<'kelola-form' | 'report-event' | 'isi-form'>(
    isAdmin ? 'kelola-form' : 'isi-form'
  );
  const [selectedReportEventFilter, setSelectedReportEventFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isAdmin) {
      setActiveSubTab('isi-form');
    }
  }, [isAdmin, isGuruMitra, isSekolahMitra]);

  // Active forms available
  const activeForms = useMemo(() => {
    const list = mendakiFormList && mendakiFormList.length > 0 ? mendakiFormList : [];
    return isAdmin ? list : list.filter(f => f.status === 'Aktif');
  }, [mendakiFormList, isAdmin]);

  const [selectedFormId, setSelectedFormId] = useState<string>(
    activeForms[0]?.id || 'FORM-MENDAKI-01'
  );

  useEffect(() => {
    if (activeForms.length > 0 && !activeForms.some(f => f.id === selectedFormId)) {
      setSelectedFormId(activeForms[0].id);
    }
  }, [activeForms, selectedFormId]);

  const currentFormDef: MendakiFormDefinition = useMemo(() => {
    const found = mendakiFormList.find(f => f.id === selectedFormId) || mendakiFormList[0];
    if (found) {
      return {
        ...found,
        labelHalDisukai:
          !found.labelHalDisukai ||
          found.labelHalDisukai === 'Hal Disukai' ||
          found.labelHalDisukai.includes('Apa yang paling kamu suka')
            ? 'Hal yang anda sukai dari Kegiatan ini?'
            : found.labelHalDisukai,
      };
    }
    return {
      id: 'FORM-MENDAKI-01',
      judulForm: 'Form Evaluasi & Refleksi Kegiatan MenDAKI',
      deskripsiForm: 'Formulir evaluasi dan refleksi kegiatan kemitraan Lazuardi.',
      kategoriEvent: 'Semua Kategori',
      eventKegiatanDefault: '',
      temaTopikDefault: '',
      daftarKategoriEvent: DEFAULT_EVENT_KEGIATAN_OPTIONS,
      labelEmail: 'Email',
      labelNama: 'Nama',
      labelNamaSekolah: 'Nama Sekolah',
      labelEventKegiatan: 'Event / Kegiatan',
      labelTemaTopik: 'Tema / Topik',
      labelDrop: 'Drop',
      labelAdd: 'Add',
      labelKeep: 'Keep',
      labelImprove: 'Improve',
      labelHalDisukai: 'Hal yang anda sukai dari Kegiatan ini?',
      labelRating: 'Rating',
      status: 'Aktif',
      createdAt: '2026-09-01',
    };
  }, [mendakiFormList, selectedFormId]);

  // =====================================================
  // ISOLATED SUBMISSIONS LIST (Real vs Demo)
  // =====================================================
  const baseSubmissions = useMemo(() => {
    if (isDemoUser) {
      return mendakiSubmissionList.filter(s => s.isDemo || s.mitraId === 'DEMO-MITRA');
    }
    return mendakiSubmissionList.filter(s => !s.isDemo && s.mitraId !== 'DEMO-MITRA');
  }, [mendakiSubmissionList, isDemoUser]);

  // Dropdown options for Event / Kegiatan (combines Form Options + Event Tracker Categories + Event Tracker Titles)
  const eventDropdownOptions = useMemo(() => {
    const configured =
      currentFormDef.daftarKategoriEvent && currentFormDef.daftarKategoriEvent.length > 0
        ? currentFormDef.daftarKategoriEvent
        : DEFAULT_EVENT_KEGIATAN_OPTIONS;
    const fromEventTrackerCategories = connectedEvents.map(e => e.kategori).filter(Boolean);
    const fromEventTrackerTitles = connectedEvents.map(e => e.judul).filter(Boolean);
    return Array.from(
      new Set([...configured, ...fromEventTrackerCategories, ...fromEventTrackerTitles].filter(Boolean))
    );
  }, [currentFormDef, connectedEvents]);

  // All categories/events for rekapitulasi & filter
  const allEventCategories = useMemo(() => {
    const fromSubs = baseSubmissions.map(s => s.eventKegiatan || s.kategoriEvent).filter(Boolean);
    return Array.from(new Set([...eventDropdownOptions, ...fromSubs]));
  }, [eventDropdownOptions, baseSubmissions]);

  // =====================================================
  // REKAPITULASI JUMLAH PENGISI PER KATEGORI EVENT / KEGIATAN
  // =====================================================
  const [rekapScope, setRekapScope] = useState<'ALL' | 'MY_SCHOOL'>('ALL');

  const categoryCounts = useMemo(() => {
    const sourceList = (rekapScope === 'MY_SCHOOL' && mySchoolId)
      ? baseSubmissions.filter(s => s.mitraId === mySchoolId)
      : baseSubmissions;

    return allEventCategories.map(kategori => {
      const matching = sourceList.filter(
        s => s.eventKegiatan === kategori || s.kategoriEvent === kategori
      );
      const mySchoolMatching = mySchoolId
        ? baseSubmissions.filter(
            s => (s.eventKegiatan === kategori || s.kategoriEvent === kategori) && s.mitraId === mySchoolId
          )
        : [];
      const avgRating = matching.length > 0
        ? Number((matching.reduce((acc, item) => acc + (item.rating || 0), 0) / matching.length).toFixed(1))
        : 0;

      return {
        kategori,
        jumlahPengisi: matching.length,
        jumlahSekolahSaya: mySchoolMatching.length,
        avgRating,
      };
    });
  }, [allEventCategories, baseSubmissions, rekapScope, mySchoolId]);

  const totalAllResponses = useMemo(() => {
    if (rekapScope === 'MY_SCHOOL' && mySchoolId) {
      return baseSubmissions.filter(s => s.mitraId === mySchoolId).length;
    }
    return baseSubmissions.length;
  }, [baseSubmissions, rekapScope, mySchoolId]);

  // =====================================================
  // STATE: FORM ISIAN RESPON (10 FIELD UTAMA)
  // 1. Email
  // 2. Nama
  // 3. Nama Sekolah
  // 4. Event / Kegiatan (Dropdown - Admin bisa tambah & edit)
  // 5. Tema / Topik
  // 6. Drop
  // 7. Add
  // 8. Keep
  // 9. Improve
  // 10. Hal Disukai & Rating
  // =====================================================
  const [subEmail, setSubEmail] = useState(currentUser?.email || '');
  const [subNama, setSubNama] = useState(
    isGuruMitra || isAdmin ? (currentUser?.nama || '') : (currentSchoolObj?.pimpinan || '')
  );
  const [subMitraId, setSubMitraId] = useState(
    mySchoolId || selectableSchools[0]?.id || 'MO004'
  );
  const [subEventId, setSubEventId] = useState<string>('');
  const [subEventKegiatan, setSubEventKegiatan] = useState(
    currentFormDef.eventKegiatanDefault || eventDropdownOptions[0] || DEFAULT_EVENT_KEGIATAN_OPTIONS[0]
  );
  const [subTemaTopik, setSubTemaTopik] = useState(currentFormDef.temaTopikDefault || '');
  const [subDrop, setSubDrop] = useState('');
  const [subAdd, setSubAdd] = useState('');
  const [subKeep, setSubKeep] = useState('');
  const [subImprove, setSubImprove] = useState('');
  const [subHalDisukai, setSubHalDisukai] = useState('');
  const [subRating, setSubRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [editingSubmission, setEditingSubmission] = useState<MendakiFormSubmission | null>(null);
  const [submitSuccessBanner, setSubmitSuccessBanner] = useState<string | null>(null);

  // When user navigates from an Event card in Event Tracker, pre-select that event in MenDAKI
  useEffect(() => {
    if (initialEventContext) {
      if (initialEventContext.mode && isAdmin) {
        setActiveSubTab(initialEventContext.mode);
      } else {
        setActiveSubTab('isi-form');
      }
      setSubEventId(initialEventContext.eventId || '');
      setSubEventKegiatan(initialEventContext.kategori || initialEventContext.judul);
      setSubTemaTopik(initialEventContext.judul);
      if (initialEventContext.mode === 'kelola-form') {
        setSubFilterKategori('ALL');
        setSubSearchQuery(initialEventContext.judul);
      }
    }
  }, [initialEventContext, isAdmin]);

  // Sync default school/email when user or selected form changes
  useEffect(() => {
    if (!editingSubmission) {
      if (mySchoolId) {
        setSubMitraId(mySchoolId);
      } else if (selectableSchools.length > 0 && !selectableSchools.some(s => s.id === subMitraId)) {
        setSubMitraId(selectableSchools[0].id);
      }
      if (currentUser?.email && !subEmail) {
        setSubEmail(currentUser.email);
      }
    }
  }, [mySchoolId, selectableSchools, currentUser, editingSubmission, subMitraId, subEmail]);

  // Initialize default event only when form definition changes or if empty
  useEffect(() => {
    if (!editingSubmission && !initialEventContext) {
      setSubEventKegiatan(prev => {
        if (prev) return prev;
        if (currentFormDef.eventKegiatanDefault && eventDropdownOptions.includes(currentFormDef.eventKegiatanDefault)) {
          return currentFormDef.eventKegiatanDefault;
        }
        return eventDropdownOptions[0] || DEFAULT_EVENT_KEGIATAN_OPTIONS[0];
      });
      if (currentFormDef.temaTopikDefault) {
        setSubTemaTopik(prev => prev || currentFormDef.temaTopikDefault || '');
      }
    }
  }, [selectedFormId, editingSubmission, initialEventContext]);

  const handleResetSubmissionForm = () => {
    setEditingSubmission(null);
    setSubEmail(currentUser?.email || '');
    setSubNama(isGuruMitra || isAdmin ? (currentUser?.nama || '') : (currentSchoolObj?.pimpinan || ''));
    setSubMitraId(mySchoolId || selectableSchools[0]?.id || 'MO004');
    setSubEventKegiatan(
      currentFormDef.eventKegiatanDefault || eventDropdownOptions[0] || DEFAULT_EVENT_KEGIATAN_OPTIONS[0]
    );
    setSubTemaTopik(currentFormDef.temaTopikDefault || '');
    setSubDrop('');
    setSubAdd('');
    setSubKeep('');
    setSubImprove('');
    setSubHalDisukai('');
    setSubRating(5);
  };

  const handleSubmitFormResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    const schoolObj = sekolahList.find(s => s.id === subMitraId);
    const schoolName = schoolObj ? schoolObj.namaSekolah : (currentUser?.nama || 'Sekolah Mitra');
    const roleLabel: 'Administrator' | 'Sekolah Mitra' | 'Guru Mitra' = isAdmin
      ? 'Administrator'
      : isGuruMitra
      ? 'Guru Mitra'
      : 'Sekolah Mitra';

    const selectedEventVal = subEventKegiatan.trim() || eventDropdownOptions[0] || 'Workshop Kurikulum';

    const matchedTrackerEvent = connectedEvents.find(
      evt =>
        evt.id === subEventId ||
        evt.judul.toLowerCase() === selectedEventVal.toLowerCase() ||
        evt.judul.toLowerCase() === subTemaTopik.trim().toLowerCase()
    );
    const resolvedEventId = subEventId || matchedTrackerEvent?.id || undefined;
    const resolvedKategori = matchedTrackerEvent?.kategori || selectedEventVal;

    if (editingSubmission && isAdmin) {
      await updateMendakiSubmission({
        ...editingSubmission,
        formId: currentFormDef.id,
        judulForm: currentFormDef.judulForm,
        eventId: resolvedEventId,
        email: subEmail.trim(),
        nama: subNama.trim(),
        mitraId: subMitraId,
        namaSekolah: schoolName,
        kategoriEvent: resolvedKategori,
        eventKegiatan: selectedEventVal,
        temaTopik: subTemaTopik.trim(),
        drop: subDrop.trim(),
        add: subAdd.trim(),
        keep: subKeep.trim(),
        improve: subImprove.trim(),
        halDisukai: subHalDisukai.trim(),
        rating: subRating,
      });
      setSubmitSuccessBanner('Perubahan data isian form berhasil disimpan.');
      setEditingSubmission(null);
    } else {
      await addMendakiSubmission({
        formId: currentFormDef.id,
        judulForm: currentFormDef.judulForm,
        eventId: resolvedEventId,
        email: subEmail.trim(),
        nama: subNama.trim(),
        mitraId: subMitraId,
        namaSekolah: schoolName,
        kategoriEvent: resolvedKategori,
        eventKegiatan: selectedEventVal,
        temaTopik: subTemaTopik.trim(),
        drop: subDrop.trim(),
        add: subAdd.trim(),
        keep: subKeep.trim(),
        improve: subImprove.trim(),
        halDisukai: subHalDisukai.trim(),
        rating: subRating,
        pengisiRole: roleLabel,
        isDemo: isDemoUser || undefined,
      });
      setSubmitSuccessBanner('Terima kasih! Formulir evaluasi kegiatan MenDAKI Anda telah berhasil dikirim dan terhubung ke Event Tracker.');
    }

    handleResetSubmissionForm();
    setTimeout(() => {
      setSubmitSuccessBanner(null);
    }, 6000);
  };

  // =====================================================
  // ADMIN: QUICK MANAGE DROPDOWN EVENT / KEGIATAN MODAL
  // =====================================================
  const [isManageEventsOpen, setIsManageEventsOpen] = useState(false);
  const [newEventOptionInput, setNewEventOptionInput] = useState('');
  const [editingOptionIdx, setEditingOptionIdx] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');

  const saveUpdatedEventOptions = async (updatedList: string[]) => {
    const cleanList = Array.from(new Set(updatedList.map(s => s.trim()).filter(Boolean)));
    const finalOptions = cleanList.length > 0 ? cleanList : DEFAULT_EVENT_KEGIATAN_OPTIONS;
    await updateMendakiForm({
      ...currentFormDef,
      daftarKategoriEvent: finalOptions,
    });
  };

  const handleAddEventOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newEventOptionInput.trim();
    if (!val) return;
    const updated = [...eventDropdownOptions, val];
    await saveUpdatedEventOptions(updated);
    setNewEventOptionInput('');
    setSubEventKegiatan(val);
  };

  const handleSaveEditEventOption = async (idx: number) => {
    const val = editingOptionValue.trim();
    if (!val) return;
    const updated = [...eventDropdownOptions];
    const oldVal = updated[idx];
    updated[idx] = val;
    await saveUpdatedEventOptions(updated);
    if (subEventKegiatan === oldVal) {
      setSubEventKegiatan(val);
    }
    setEditingOptionIdx(null);
    setEditingOptionValue('');
  };

  const handleDeleteEventOption = async (idx: number) => {
    if (eventDropdownOptions.length <= 1) return;
    const updated = eventDropdownOptions.filter((_, i) => i !== idx);
    await saveUpdatedEventOptions(updated);
  };

  // =====================================================
  // STATE: ADMIN BUAT / EDIT FORM DEFINITION MODAL
  // =====================================================
  const [isFormBuilderOpen, setIsFormBuilderOpen] = useState(false);
  const [editingFormDef, setEditingFormDef] = useState<MendakiFormDefinition | null>(null);
  const [builderJudul, setBuilderJudul] = useState('');
  const [builderDeskripsi, setBuilderDeskripsi] = useState('');
  const [builderEventOptions, setBuilderEventOptions] = useState<string[]>(DEFAULT_EVENT_KEGIATAN_OPTIONS);
  const [builderNewOption, setBuilderNewOption] = useState('');
  const [builderEditOptIdx, setBuilderEditOptIdx] = useState<number | null>(null);
  const [builderEditOptVal, setBuilderEditOptVal] = useState('');
  const [builderLabelEmail, setBuilderLabelEmail] = useState('Email');
  const [builderLabelNama, setBuilderLabelNama] = useState('Nama');
  const [builderLabelSekolah, setBuilderLabelSekolah] = useState('Nama Sekolah');
  const [builderLabelEvent, setBuilderLabelEvent] = useState('Event / Kegiatan');
  const [builderLabelTema, setBuilderLabelTema] = useState('Tema / Topik');
  const [builderLabelDrop, setBuilderLabelDrop] = useState('Drop');
  const [builderLabelAdd, setBuilderLabelAdd] = useState('Add');
  const [builderLabelKeep, setBuilderLabelKeep] = useState('Keep');
  const [builderLabelImprove, setBuilderLabelImprove] = useState('Improve');
  const [builderLabelDisukai, setBuilderLabelDisukai] = useState('Hal yang anda sukai dari Kegiatan ini?');
  const [builderLabelRating, setBuilderLabelRating] = useState('Rating');
  const [builderStatus, setBuilderStatus] = useState<'Aktif' | 'Ditutup'>('Aktif');

  const handleOpenCreateFormDef = () => {
    setEditingFormDef(null);
    setBuilderJudul('Form Evaluasi & Refleksi Kegiatan MenDAKI');
    setBuilderDeskripsi('Formulir evaluasi dan refleksi kegiatan kemitraan Lazuardi.');
    setBuilderEventOptions([...eventDropdownOptions]);
    setBuilderNewOption('');
    setBuilderEditOptIdx(null);
    setBuilderLabelEmail('Email');
    setBuilderLabelNama('Nama');
    setBuilderLabelSekolah('Nama Sekolah');
    setBuilderLabelEvent('Event / Kegiatan');
    setBuilderLabelTema('Tema / Topik');
    setBuilderLabelDrop('Drop');
    setBuilderLabelAdd('Add');
    setBuilderLabelKeep('Keep');
    setBuilderLabelImprove('Improve');
    setBuilderLabelDisukai('Hal yang anda sukai dari Kegiatan ini?');
    setBuilderLabelRating('Rating');
    setBuilderStatus('Aktif');
    setIsFormBuilderOpen(true);
  };

  const handleOpenEditFormDef = (formDef: MendakiFormDefinition) => {
    setEditingFormDef(formDef);
    setBuilderJudul(formDef.judulForm);
    setBuilderDeskripsi(formDef.deskripsiForm);
    setBuilderEventOptions(
      formDef.daftarKategoriEvent && formDef.daftarKategoriEvent.length > 0
        ? [...formDef.daftarKategoriEvent]
        : [...DEFAULT_EVENT_KEGIATAN_OPTIONS]
    );
    setBuilderNewOption('');
    setBuilderEditOptIdx(null);
    setBuilderLabelEmail(formDef.labelEmail || 'Email');
    setBuilderLabelNama(formDef.labelNama || 'Nama');
    setBuilderLabelSekolah(formDef.labelNamaSekolah || 'Nama Sekolah');
    setBuilderLabelEvent(formDef.labelEventKegiatan || 'Event / Kegiatan');
    setBuilderLabelTema(formDef.labelTemaTopik || 'Tema / Topik');
    setBuilderLabelDrop(formDef.labelDrop || 'Drop');
    setBuilderLabelAdd(formDef.labelAdd || 'Add');
    setBuilderLabelKeep(formDef.labelKeep || 'Keep');
    setBuilderLabelImprove(formDef.labelImprove || 'Improve');
    setBuilderLabelDisukai(formDef.labelHalDisukai || 'Hal yang anda sukai dari Kegiatan ini?');
    setBuilderLabelRating(formDef.labelRating || 'Rating');
    setBuilderStatus(formDef.status || 'Aktif');
    setIsFormBuilderOpen(true);
  };

  const handleBuilderAddEventOpt = () => {
    const val = builderNewOption.trim();
    if (!val) return;
    if (!builderEventOptions.includes(val)) {
      setBuilderEventOptions(prev => [...prev, val]);
    }
    setBuilderNewOption('');
  };

  const handleBuilderSaveEditOpt = (idx: number) => {
    const val = builderEditOptVal.trim();
    if (!val) return;
    setBuilderEventOptions(prev => prev.map((item, i) => (i === idx ? val : item)));
    setBuilderEditOptIdx(null);
    setBuilderEditOptVal('');
  };

  const handleBuilderDeleteOpt = (idx: number) => {
    if (builderEventOptions.length <= 1) return;
    setBuilderEventOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveFormDef = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoriesToSave =
      builderEventOptions.length > 0 ? builderEventOptions : DEFAULT_EVENT_KEGIATAN_OPTIONS;

    const payload = {
      judulForm: builderJudul.trim() || 'Form Evaluasi Kegiatan MenDAKI',
      deskripsiForm: builderDeskripsi.trim(),
      kategoriEvent: 'Semua Kategori',
      eventKegiatanDefault: categoriesToSave[0] || '',
      temaTopikDefault: '',
      daftarKategoriEvent: categoriesToSave,
      labelEmail: builderLabelEmail.trim() || 'Email',
      labelNama: builderLabelNama.trim() || 'Nama',
      labelNamaSekolah: builderLabelSekolah.trim() || 'Nama Sekolah',
      labelEventKegiatan: builderLabelEvent.trim() || 'Event / Kegiatan',
      labelTemaTopik: builderLabelTema.trim() || 'Tema / Topik',
      labelDrop: builderLabelDrop.trim() || 'Drop',
      labelAdd: builderLabelAdd.trim() || 'Add',
      labelKeep: builderLabelKeep.trim() || 'Keep',
      labelImprove: builderLabelImprove.trim() || 'Improve',
      labelHalDisukai: builderLabelDisukai.trim() || 'Hal yang anda sukai dari Kegiatan ini?',
      labelRating: builderLabelRating.trim() || 'Rating',
      status: builderStatus,
    };

    if (editingFormDef) {
      await updateMendakiForm({
        ...editingFormDef,
        ...payload,
      });
    } else {
      await addMendakiForm(payload);
    }

    setIsFormBuilderOpen(false);
  };

  // =====================================================
  // STATE: ADMIN FILTER & SHEET RESPONSES
  // =====================================================
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subFilterKategori, setSubFilterKategori] = useState<string>('ALL');
  const [subFilterSekolah, setSubFilterSekolah] = useState<string>('ALL');
  const [detailSubmissionModal, setDetailSubmissionModal] = useState<MendakiFormSubmission | null>(null);
  const [deleteSubmissionTarget, setDeleteSubmissionTarget] = useState<{ id: string; nama: string } | null>(null);
  const [deleteFormTarget, setDeleteFormTarget] = useState<{ id: string; judul: string } | null>(null);

  const filteredAdminSubmissions = useMemo(() => {
    return baseSubmissions.filter(sub => {
      const matchKategori =
        subFilterKategori === 'ALL' ||
        sub.eventKegiatan === subFilterKategori ||
        sub.kategoriEvent === subFilterKategori;
      const matchSekolah = subFilterSekolah === 'ALL' || sub.mitraId === subFilterSekolah;
      const q = subSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        sub.nama.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.namaSekolah.toLowerCase().includes(q) ||
        sub.eventKegiatan.toLowerCase().includes(q) ||
        sub.temaTopik.toLowerCase().includes(q) ||
        sub.drop.toLowerCase().includes(q) ||
        sub.add.toLowerCase().includes(q) ||
        sub.keep.toLowerCase().includes(q) ||
        sub.improve.toLowerCase().includes(q) ||
        sub.halDisukai.toLowerCase().includes(q);
      return matchKategori && matchSekolah && matchSearch;
    });
  }, [baseSubmissions, subFilterKategori, subFilterSekolah, subSearchQuery]);

  const handleOpenEditSubmissionByAdmin = (sub: MendakiFormSubmission) => {
    setEditingSubmission(sub);
    setSelectedFormId(sub.formId || currentFormDef.id);
    setSubEmail(sub.email);
    setSubNama(sub.nama);
    setSubMitraId(sub.mitraId);
    setSubEventKegiatan(sub.eventKegiatan || sub.kategoriEvent || eventDropdownOptions[0]);
    setSubTemaTopik(sub.temaTopik);
    setSubDrop(sub.drop);
    setSubAdd(sub.add);
    setSubKeep(sub.keep);
    setSubImprove(sub.improve);
    setSubHalDisukai(sub.halDisukai);
    setSubRating(sub.rating || 5);
    setActiveSubTab('isi-form');
  };

  const ratingDescriptions: Record<number, string> = {
    1: '1 Bintang — Perlu Banyak Perbaikan',
    2: '2 Bintang — Cukup',
    3: '3 Bintang — Baik',
    4: '4 Bintang — Sangat Baik',
    5: '5 Bintang — Luar Biasa / Sangat Bermanfaat',
  };

  // =====================================================
  // KHUSUS ADMIN: LEADERBOARD PIALA SEKOLAH TERAKTIF & REPORT SETIAP EVENT
  // =====================================================
  const schoolTrophyLeaderboard = useMemo(() => {
    const map = new Map<
      string,
      {
        mitraId: string;
        namaSekolah: string;
        totalIsian: number;
        totalRatingSum: number;
        eventSet: Set<string>;
      }
    >();

    // Seed with all real schools so admin sees complete ranking
    realSchools.forEach(s => {
      map.set(s.id, {
        mitraId: s.id,
        namaSekolah: s.namaSekolah,
        totalIsian: 0,
        totalRatingSum: 0,
        eventSet: new Set<string>(),
      });
    });

    baseSubmissions.forEach(sub => {
      const key = sub.mitraId || sub.namaSekolah;
      const existing = map.get(key) || {
        mitraId: sub.mitraId || key,
        namaSekolah: sub.namaSekolah || 'Sekolah Mitra',
        totalIsian: 0,
        totalRatingSum: 0,
        eventSet: new Set<string>(),
      };
      existing.totalIsian += 1;
      existing.totalRatingSum += Number(sub.rating || 0);
      if (sub.eventKegiatan || sub.kategoriEvent) {
        existing.eventSet.add(sub.eventKegiatan || sub.kategoriEvent);
      }
      map.set(key, existing);
    });

    const totalGlobal = baseSubmissions.length;

    return Array.from(map.values())
      .map(item => {
        const avgRating =
          item.totalIsian > 0
            ? Number((item.totalRatingSum / item.totalIsian).toFixed(2))
            : 0;
        const pct =
          totalGlobal > 0 ? Math.round((item.totalIsian / totalGlobal) * 100) : 0;
        return {
          mitraId: item.mitraId,
          namaSekolah: item.namaSekolah,
          totalIsian: item.totalIsian,
          jumlahEventDiikuti: item.eventSet.size,
          daftarEvent: Array.from(item.eventSet),
          avgRating,
          pct,
        };
      })
      .sort((a, b) => {
        if (b.totalIsian !== a.totalIsian) return b.totalIsian - a.totalIsian;
        if (b.jumlahEventDiikuti !== a.jumlahEventDiikuti) return b.jumlahEventDiikuti - a.jumlahEventDiikuti;
        return b.avgRating - a.avgRating;
      });
  }, [realSchools, baseSubmissions]);

  const summarizeDakiPoints = (
    items: { text: string; nama: string; sekolah: string }[],
    typeLabel: 'Drop' | 'Add' | 'Keep' | 'Improve'
  ): string => {
    const valid = items
      .map(i => ({ ...i, clean: (i.text || '').trim() }))
      .filter(i => i.clean.length > 0);

    if (valid.length === 0) {
      return `Belum ada catatan ${typeLabel} pada event ini.`;
    }

    const meaningful = valid.filter(
      i => !/^(tidak ada|nihil|belum ada|-+)$/i.test(i.clean.replace(/[.,!]/g, '').trim())
    );

    if (meaningful.length === 0) {
      return `Seluruh responden (${valid.length} orang) menyatakan tidak ada kendala/catatan khusus pada aspek ${typeLabel}.`;
    }

    const combinedSummary = meaningful
      .map(m => m.clean.replace(/\.$/, ''))
      .slice(0, 4)
      .join('; ');

    if (typeLabel === 'Drop') {
      return `Hal utama yang perlu dikurangi/dihentikan (${meaningful.length} masukan): ${combinedSummary}.`;
    }
    if (typeLabel === 'Add') {
      return `Usulan penambahan utama (${meaningful.length} masukan): ${combinedSummary}.`;
    }
    if (typeLabel === 'Keep') {
      return `Praktik baik yang perlu dipertahankan (${meaningful.length} apresiasi): ${combinedSummary}.`;
    }
    return `Fokus peningkatan ke depan (${meaningful.length} rekomendasi): ${combinedSummary}.`;
  };

  const adminEventReports = useMemo(() => {
    const reports: Array<{
      key: string;
      eventId?: string;
      judulEvent: string;
      kategori: string;
      tanggal?: string;
      lokasi?: string;
      pic?: string;
      pembicara?: string;
      totalResponden: number;
      avgRating: number;
      predikatRating: string;
      ratingDistribution: Record<number, number>;
      topSchool: {
        namaSekolah: string;
        jumlah: number;
        pct: number;
        avgRating: number;
      } | null;
      schoolRankings: Array<{
        namaSekolah: string;
        jumlah: number;
        pct: number;
        avgRating: number;
      }>;
      kesimpulanDrop: string;
      kesimpulanAdd: string;
      kesimpulanKeep: string;
      kesimpulanImprove: string;
      kesimpulanDisukai: string;
      dropItems: Array<{ text: string; nama: string; sekolah: string }>;
      addItems: Array<{ text: string; nama: string; sekolah: string }>;
      keepItems: Array<{ text: string; nama: string; sekolah: string }>;
      improveItems: Array<{ text: string; nama: string; sekolah: string }>;
      disukaiItems: Array<{ text: string; nama: string; sekolah: string }>;
    }> = [];

    const buildReportObject = (
      key: string,
      judulEvent: string,
      kategori: string,
      subs: MendakiFormSubmission[],
      meta?: { eventId?: string; tanggal?: string; lokasi?: string; pic?: string; pembicara?: string }
    ) => {
      const totalResponden = subs.length;
      const ratingSum = subs.reduce((acc, s) => acc + Number(s.rating || 0), 0);
      const avgRating = totalResponden > 0 ? Number((ratingSum / totalResponden).toFixed(2)) : 0;

      const predikatRating =
        totalResponden === 0
          ? 'Belum Ada Rating'
          : avgRating >= 4.6
          ? 'Sangat Memuaskan / Luar Biasa (A+)'
          : avgRating >= 4.0
          ? 'Sangat Baik (A)'
          : avgRating >= 3.0
          ? 'Baik (B)'
          : 'Perlu Peningkatan (C)';

      const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      subs.forEach(s => {
        const r = Math.min(5, Math.max(1, Math.round(Number(s.rating || 5))));
        ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
      });

      // School ranking inside this event
      const schoolMap = new Map<string, { namaSekolah: string; jumlah: number; ratingSum: number }>();
      subs.forEach(s => {
        const sKey = s.mitraId || s.namaSekolah;
        const curr = schoolMap.get(sKey) || {
          namaSekolah: s.namaSekolah || 'Sekolah Mitra',
          jumlah: 0,
          ratingSum: 0,
        };
        curr.jumlah += 1;
        curr.ratingSum += Number(s.rating || 0);
        schoolMap.set(sKey, curr);
      });

      const schoolRankings = Array.from(schoolMap.values())
        .map(sc => ({
          namaSekolah: sc.namaSekolah,
          jumlah: sc.jumlah,
          pct: totalResponden > 0 ? Math.round((sc.jumlah / totalResponden) * 100) : 0,
          avgRating: sc.jumlah > 0 ? Number((sc.ratingSum / sc.jumlah).toFixed(1)) : 0,
        }))
        .sort((a, b) => {
          if (b.jumlah !== a.jumlah) return b.jumlah - a.jumlah;
          return b.avgRating - a.avgRating;
        });

      const topSchool = schoolRankings.length > 0 ? schoolRankings[0] : null;

      const dropItems = subs
        .filter(s => s.drop && s.drop.trim())
        .map(s => ({ text: s.drop.trim(), nama: s.nama, sekolah: s.namaSekolah }));
      const addItems = subs
        .filter(s => s.add && s.add.trim())
        .map(s => ({ text: s.add.trim(), nama: s.nama, sekolah: s.namaSekolah }));
      const keepItems = subs
        .filter(s => s.keep && s.keep.trim())
        .map(s => ({ text: s.keep.trim(), nama: s.nama, sekolah: s.namaSekolah }));
      const improveItems = subs
        .filter(s => s.improve && s.improve.trim())
        .map(s => ({ text: s.improve.trim(), nama: s.nama, sekolah: s.namaSekolah }));
      const disukaiItems = subs
        .filter(s => s.halDisukai && s.halDisukai.trim())
        .map(s => ({ text: s.halDisukai.trim(), nama: s.nama, sekolah: s.namaSekolah }));

      const kesimpulanDrop = summarizeDakiPoints(dropItems, 'Drop');
      const kesimpulanAdd = summarizeDakiPoints(addItems, 'Add');
      const kesimpulanKeep = summarizeDakiPoints(keepItems, 'Keep');
      const kesimpulanImprove = summarizeDakiPoints(improveItems, 'Improve');
      const kesimpulanDisukai =
        disukaiItems.length > 0
          ? disukaiItems.map(d => d.text.replace(/\.$/, '')).slice(0, 3).join('; ') + '.'
          : 'Belum ada catatan hal yang disukai pada event ini.';

      return {
        key,
        eventId: meta?.eventId,
        judulEvent,
        kategori,
        tanggal: meta?.tanggal,
        lokasi: meta?.lokasi,
        pic: meta?.pic,
        pembicara: meta?.pembicara,
        totalResponden,
        avgRating,
        predikatRating,
        ratingDistribution,
        topSchool,
        schoolRankings,
        kesimpulanDrop,
        kesimpulanAdd,
        kesimpulanKeep,
        kesimpulanImprove,
        kesimpulanDisukai,
        dropItems,
        addItems,
        keepItems,
        improveItems,
        disukaiItems,
      };
    };

    const coveredSubmissionIds = new Set<string>();

    // 1. Reports for each agenda event in Event Tracker
    connectedEvents.forEach(evt => {
      const titleLower = evt.judul.trim().toLowerCase();
      const catLower = evt.kategori.trim().toLowerCase();
      const directSubs = baseSubmissions.filter(
        s =>
          (s.eventId && s.eventId === evt.id) ||
          s.eventKegiatan?.trim().toLowerCase() === titleLower ||
          s.temaTopik?.trim().toLowerCase() === titleLower
      );
      const catSubs = baseSubmissions.filter(
        s =>
          s.eventKegiatan?.trim().toLowerCase() === catLower ||
          s.kategoriEvent?.trim().toLowerCase() === catLower
      );
      const matchedSubs = directSubs.length > 0 ? directSubs : catSubs;
      matchedSubs.forEach(s => coveredSubmissionIds.add(s.id));

      reports.push(
        buildReportObject(`EVT-${evt.id}`, evt.judul, evt.kategori, matchedSubs, {
          eventId: evt.id,
          tanggal: evt.tanggal,
          lokasi: evt.lokasi,
          pic: evt.pic,
          pembicara: evt.pembicara,
        })
      );
    });

    // 2. Any additional event/kategori in baseSubmissions not already covered by connectedEvents
    const extraCategories: string[] = Array.from(
      new Set(
        baseSubmissions
          .filter(s => !coveredSubmissionIds.has(s.id))
          .map(s => String(s.eventKegiatan || s.kategoriEvent || ''))
          .filter((val): val is string => Boolean(val))
      )
    );

    extraCategories.forEach(catName => {
      const catLower = catName.trim().toLowerCase();
      const matchedSubs = baseSubmissions.filter(
        s =>
          s.eventKegiatan?.trim().toLowerCase() === catLower ||
          s.kategoriEvent?.trim().toLowerCase() === catLower
      );
      reports.push(buildReportObject(`CAT-${catName}`, catName, catName, matchedSubs));
    });

    return reports;
  }, [connectedEvents, baseSubmissions]);

  const filteredEventReports = useMemo(() => {
    if (selectedReportEventFilter === 'ALL') return adminEventReports;
    return adminEventReports.filter(r => r.key === selectedReportEventFilter);
  }, [adminEventReports, selectedReportEventFilter]);

  const globalAverageRating = useMemo(() => {
    if (baseSubmissions.length === 0) return 0;
    const sum = baseSubmissions.reduce((acc, s) => acc + Number(s.rating || 0), 0);
    return Number((sum / baseSubmissions.length).toFixed(2));
  }, [baseSubmissions]);

  const handleExportAdminEventReportsCsv = () => {
    const headers = [
      'No',
      'Nama Event / Kegiatan',
      'Kategori',
      'Tanggal Event',
      'Total Pengisi MenDAKI',
      'Rata-Rata Rating',
      'Predikat Rating',
      'Sekolah Paling Aktif (Juara Piala)',
      'Jumlah Pengisi Sekolah Teraktif',
      'Kesimpulan DROP',
      'Kesimpulan ADD',
      'Kesimpulan KEEP',
      'Kesimpulan IMPROVE',
      'Hal yang Disukai Peserta',
    ];
    const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = adminEventReports.map((rep, idx) =>
      [
        idx + 1,
        rep.judulEvent,
        rep.kategori,
        rep.tanggal || '-',
        rep.totalResponden,
        `${rep.avgRating} / 5`,
        rep.predikatRating,
        rep.topSchool ? `🏆 ${rep.topSchool.namaSekolah}` : 'Belum Ada',
        rep.topSchool ? `${rep.topSchool.jumlah} Responden (${rep.topSchool.pct}%)` : '0',
        rep.kesimpulanDrop,
        rep.kesimpulanAdd,
        rep.kesimpulanKeep,
        rep.kesimpulanImprove,
        rep.kesimpulanDisukai,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_Evaluasi_MenDAKI_Per_Event_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // =====================================================
  // RENDER HELPER: FORM PENGISIAN EVALUASI MENDAKI
  // Hanya berisi:
  // 1. Email
  // 2. Nama
  // 3. Nama Sekolah
  // 4. Event / Kegiatan (Dropdown - Admin bisa tambah & edit)
  // 5. Tema / Topik
  // 6. Drop
  // 7. Add
  // 8. Keep
  // 9. Improve
  // 10. Hal Disukai
  // 11. Rating (Bintang)
  // =====================================================
  const renderEvaluationFormSection = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Form Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-amber-300">
              <Sparkles size={13} className="text-amber-400" />
              <span>Formulir Evaluasi & Refleksi Kegiatan MenDAKI</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
              {currentFormDef.judulForm}
            </h3>
            <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
              {currentFormDef.deskripsiForm}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Form Selector if multiple forms exist */}
            {activeForms.length > 1 && (
              <div className="bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/20">
                <label className="block text-[10px] uppercase font-bold text-blue-200 mb-1">
                  Pilih Form:
                </label>
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 focus:outline-none"
                >
                  {activeForms.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.judulForm}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenEditFormDef(currentFormDef)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                <Edit3 size={14} />
                <span>Edit Form & Opsi Event</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Event Context Banner when navigated from Event Tracker */}
      {initialEventContext && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-indigo-600 shrink-0" />
            <div>
              <span className="font-black block">
                Terhubung dari Event Tracker: {initialEventContext.judul}
              </span>
              <span className="text-[11px] text-indigo-700">
                Kategori: <strong>{initialEventContext.kategori}</strong> {initialEventContext.eventId ? `• ID: ${initialEventContext.eventId}` : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onNavigateToEventTracker && (
              <button
                type="button"
                onClick={onNavigateToEventTracker}
                className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 cursor-pointer"
              >
                Kembali ke Event Tracker
              </button>
            )}
            {onClearEventContext && (
              <button
                type="button"
                onClick={() => {
                  onClearEventContext();
                  setSubSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Tampilkan Semua
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Notification */}
      {submitSuccessBanner && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{submitSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccessBanner(null)}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Editing Banner for Admin */}
      {editingSubmission && isAdmin && (
        <div className="mx-6 mt-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
          <div className="font-bold">
            Mode Edit Respons: Anda sedang mengedit isian form dari <span className="underline">{editingSubmission.nama}</span> ({editingSubmission.namaSekolah})
          </div>
          <button
            type="button"
            onClick={handleResetSubmissionForm}
            className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-bold hover:bg-amber-100 cursor-pointer"
          >
            Batal Edit
          </button>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSubmitFormResponse} className="p-6 space-y-6">
        {/* Identitas & Kegiatan */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {currentFormDef.labelEmail || 'Email'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* 2. Nama */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {currentFormDef.labelNama || 'Nama'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={subNama}
                  onChange={(e) => setSubNama(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* 3. Nama Sekolah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {currentFormDef.labelNamaSekolah || 'Nama Sekolah'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  disabled={!isAdmin && Boolean(mySchoolId)}
                  value={subMitraId}
                  onChange={(e) => setSubMitraId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition disabled:opacity-80 font-medium"
                >
                  {selectableSchools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.namaSekolah}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 4. Event / Kegiatan (Terhubung langsung dengan Event Tracker & Opsi Kategori) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {currentFormDef.labelEventKegiatan || 'Event / Kegiatan'} (Terhubung Event Tracker) <span className="text-rose-500">*</span>
                </label>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsManageEventsOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Settings size={12} />
                    <span>+ Tambah / Edit Pilihan Event</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Calendar size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  value={subEventKegiatan}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubEventKegiatan(val);
                    // Check if user selected an Event Tracker agenda title
                    const matchedEvt = connectedEvents.find(evt => evt.judul === val);
                    if (matchedEvt) {
                      setSubEventId(matchedEvt.id);
                      setSubTemaTopik(matchedEvt.judul);
                    } else {
                      const matchedByCat = connectedEvents.find(evt => evt.kategori === val);
                      if (matchedByCat && !subTemaTopik) {
                        setSubEventId(matchedByCat.id);
                      }
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition font-medium"
                >
                  <optgroup label="Agenda Event Tracker (Pilih Event Spesifik)">
                    {connectedEvents.map(evt => (
                      <option key={`evt-${evt.id}`} value={evt.judul}>
                        [{evt.kategori}] {evt.judul} ({evt.tanggal})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Kategori Kegiatan MenDAKI">
                    {eventDropdownOptions
                      .filter(opt => !connectedEvents.some(e => e.judul === opt))
                      .map(evOpt => (
                        <option key={evOpt} value={evOpt}>
                          {evOpt}
                        </option>
                      ))}
                  </optgroup>
                  {subEventKegiatan &&
                    !eventDropdownOptions.includes(subEventKegiatan) &&
                    !connectedEvents.some(e => e.judul === subEventKegiatan) && (
                      <option value={subEventKegiatan}>{subEventKegiatan}</option>
                    )}
                </select>
              </div>
            </div>

            {/* 5. Tema / Topik */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {currentFormDef.labelTemaTopik || 'Tema / Topik'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subTemaTopik}
                onChange={(e) => setSubTemaTopik(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Refleksi DAKI (Drop, Add, Keep, Improve) */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Layers size={14} className="text-blue-600" />
            <span>Refleksi Kegiatan (Drop, Add, Keep, Improve)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 6. DROP */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1.5">
              <label className="block text-xs font-extrabold text-rose-900">
                {currentFormDef.labelDrop || 'Drop'} <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={subDrop}
                onChange={(e) => setSubDrop(e.target.value)}
                className="w-full p-3 bg-white border border-rose-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* 7. ADD */}
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-1.5">
              <label className="block text-xs font-extrabold text-sky-900">
                {currentFormDef.labelAdd || 'Add'} <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={subAdd}
                onChange={(e) => setSubAdd(e.target.value)}
                className="w-full p-3 bg-white border border-sky-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 8. KEEP */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-1.5">
              <label className="block text-xs font-extrabold text-emerald-900">
                {currentFormDef.labelKeep || 'Keep'} <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={subKeep}
                onChange={(e) => setSubKeep(e.target.value)}
                className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 9. IMPROVE */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
              <label className="block text-xs font-extrabold text-amber-900">
                {currentFormDef.labelImprove || 'Improve'} <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={subImprove}
                onChange={(e) => setSubImprove(e.target.value)}
                className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 10. Hal yang anda sukai dari Kegiatan ini? & 11. Rating Bintang */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Hal yang anda sukai dari Kegiatan ini? */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <MessageSquareHeart size={15} className="text-purple-600" />
              <span>{currentFormDef.labelHalDisukai || 'Hal yang anda sukai dari Kegiatan ini?'} <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              rows={3}
              required
              value={subHalDisukai}
              onChange={(e) => setSubHalDisukai(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Rating (pakai bintang) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
            <label className="block text-xs font-extrabold text-slate-800">
              {currentFormDef.labelRating || 'Rating'} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= (hoverRating || subRating);
                return (
                  <button
                    key={starValue}
                    type="button"
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setSubRating(starValue)}
                    className="p-1.5 rounded-xl hover:scale-110 active:scale-95 transition cursor-pointer focus:outline-none"
                    title={`${starValue} Bintang`}
                  >
                    <Star
                      size={28}
                      className={`transition ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'fill-slate-200 text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm font-black text-amber-600">
                {subRating} / 5
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600">
              {ratingDescriptions[hoverRating || subRating]}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleResetSubmissionForm}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
          >
            Reset Isian
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/25 transition flex items-center gap-2 cursor-pointer"
          >
            <Send size={15} />
            <span>{editingSubmission && isAdmin ? 'Simpan Perubahan Respons' : 'Kirim Form Evaluasi'}</span>
          </button>
        </div>
      </form>
    </div>
  );

  // =====================================================
  // RENDER HELPER: REKAP JUMLAH PENGISI PER KATEGORI EVENT
  // (Untuk Sekolah Mitra & Admin — Sekolah Mitra TIDAK melihat detail isian)
  // =====================================================
  const renderCategoryCountsSection = () => (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Rekapitulasi Jumlah Pengisi Form per Event / Kegiatan
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Jumlah partisipasi pengisian form evaluasi dari setiap kategori event/kegiatan
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isAdmin && mySchoolId && (
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setRekapScope('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  rekapScope === 'ALL' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Semua Mitra ({baseSubmissions.length})
              </button>
              <button
                type="button"
                onClick={() => setRekapScope('MY_SCHOOL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  rekapScope === 'MY_SCHOOL' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Sekolah Saya ({baseSubmissions.filter(s => s.mitraId === mySchoolId).length})
              </button>
            </div>
          )}

          <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 text-xs font-extrabold">
            Total Mengisi: {totalAllResponses} Orang
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryCounts.map((item) => {
          const pct = totalAllResponses > 0
            ? Math.round((item.jumlahPengisi / totalAllResponses) * 100)
            : 0;
          return (
            <div
              key={item.kategori}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-blue-300 transition flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                    Event / Kegiatan
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {item.kategori}
                  </h4>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-right shrink-0 shadow-xs">
                  <span className="text-base font-black block leading-none">{item.jumlahPengisi}</span>
                  <span className="text-[9px] font-bold uppercase opacity-90">Mengisi</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.jumlahPengisi > 0 ? 12 : 0, pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Proporsi: <strong className="text-slate-700">{pct}%</strong> dari total</span>
                  {isAdmin && item.avgRating > 0 && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {item.avgRating} / 5
                    </span>
                  )}
                  {!isAdmin && mySchoolId && (
                    <span className="font-semibold text-blue-700">
                      Sekolah Anda: {item.jumlahSekolahSaya} isian
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Agenda Events from Event Tracker */}
      {connectedEvents.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" />
                <span>Daftar Event (Event Tracker) yang Terhubung dengan Evaluasi MenDAKI</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Setiap agenda di tab Event Tracker otomatis tersambung dengan form dan rekapitulasi evaluasi MenDAKI
              </p>
            </div>
            {onNavigateToEventTracker && (
              <button
                type="button"
                onClick={onNavigateToEventTracker}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition cursor-pointer"
              >
                Buka Event Tracker
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {connectedEvents.map((evt) => {
              const titleLower = evt.judul.trim().toLowerCase();
              const catLower = evt.kategori.trim().toLowerCase();
              const directSubs = baseSubmissions.filter(
                s =>
                  (s.eventId && s.eventId === evt.id) ||
                  s.eventKegiatan?.trim().toLowerCase() === titleLower ||
                  s.temaTopik?.trim().toLowerCase() === titleLower
              );
              const catSubs = baseSubmissions.filter(
                s =>
                  s.eventKegiatan?.trim().toLowerCase() === catLower ||
                  s.kategoriEvent?.trim().toLowerCase() === catLower
              );
              const matchedSubs = directSubs.length > 0 ? directSubs : catSubs;
              const avgRating =
                matchedSubs.length > 0
                  ? Number(
                      (
                        matchedSubs.reduce((acc, item) => acc + (item.rating || 0), 0) /
                        matchedSubs.length
                      ).toFixed(1)
                    )
                  : 0;

              return (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-indigo-200/80 hover:border-indigo-400 transition flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {evt.kategori}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.tanggal}</span>
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {evt.judul}
                    </h5>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700">
                        {matchedSubs.length} Evaluasi
                      </span>
                      {avgRating > 0 && (
                        <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          {avgRating}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSubEventId(evt.id);
                        setSubEventKegiatan(evt.judul);
                        setSubTemaTopik(evt.judul);
                        setActiveSubTab('isi-form');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition cursor-pointer"
                    >
                      Isi Evaluasi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Privacy Notice for Sekolah Mitra */}
      {!isAdmin && (
        <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
          <Lock size={15} className="text-slate-500 shrink-0" />
          <span>
            Anda dapat melihat jumlah partisipasi pengisian form dari setiap kategori event/kegiatan di atas. Detail isian form per orang bersifat rahasia dan hanya dapat dilihat oleh Administrator Mitra Office.
          </span>
        </div>
      )}
    </div>
  );

  // =====================================================
  // RENDER HELPER (KHUSUS ADMIN):
  // 1. PIALA & PODIUM SEKOLAH PALING AKTIF MENGISI MENDAKI
  // 2. REPORT DARI SETIAP EVENT (SEKOLAH TERAKTIF + PIALA, KESIMPULAN DROP, ADD, KEEP, IMPROVE, & RATA-RATA RATING)
  // =====================================================
  const renderAdminEventReportAndTrophySection = () => {
    const activeSchools = schoolTrophyLeaderboard.filter(s => s.totalIsian > 0);
    const championSchool = activeSchools[0] || null;
    const secondSchool = activeSchools[1] || null;
    const thirdSchool = activeSchools[2] || null;

    return (
      <div className="space-y-6">
        {/* =====================================================
            BAGIAN 1: PENGHARGAAN PIALA SEKOLAH PALING AKTIF MENGISI MENDAKI
           ===================================================== */}
        <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 rounded-3xl border border-amber-400/30 p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Header Trophy Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                  <Trophy size={13} className="text-amber-400" />
                  <span>Apresiasi Keaktifan Evaluasi Kemitraan (Khusus Admin)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <Crown size={22} className="text-amber-400 shrink-0" />
                  <span>Piala & Peringkat Sekolah Mitra Paling Aktif Mengisi MenDAKI</span>
                </h3>
                <p className="text-xs text-blue-100/85 max-w-3xl leading-relaxed">
                  Penghargaan khusus bagi Sekolah Mitra dengan tingkat partisipasi tertinggi dalam pengisian form refleksi & evaluasi kegiatan MenDAKI di seluruh agenda Event Tracker.
                </p>
              </div>

              {/* Global KPI Summary */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                    Total Evaluasi Masuk
                  </span>
                  <span className="text-lg font-black text-white">{baseSubmissions.length} Responden</span>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-amber-400/15 border border-amber-300/30 backdrop-blur-xs text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">
                    Rata-Rata Rating Global
                  </span>
                  <div className="flex items-center justify-center gap-1 text-lg font-black text-amber-300">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span>{globalAverageRating} / 5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Podium Top 3 Schools */}
            {championSchool ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* JUARA 1 - PIALA EMAS UTAMA */}
                <div className="lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-yellow-600/10 border-2 border-amber-400/70 shadow-lg flex flex-col justify-between gap-4 relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                        <Trophy size={12} className="fill-slate-950" />
                        <span>Juara 1 • Piala Emas Teraktif</span>
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white pt-1">
                        🏆 {championSchool.namaSekolah}
                      </h4>
                      <p className="text-[11px] text-amber-100/90">
                        Sekolah Mitra Paling Aktif Mengisi Evaluasi MenDAKI
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
                      <Trophy size={30} className="stroke-[2.2]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-300/25 text-center">
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
                      <span className="text-base font-black text-amber-300 block">
                        {championSchool.totalIsian}
                      </span>
                      <span className="text-[10px] text-blue-100/80 font-semibold">Total Isian</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
                      <span className="text-base font-black text-white block">
                        {championSchool.jumlahEventDiikuti} Event
                      </span>
                      <span className="text-[10px] text-blue-100/80 font-semibold">Partisipasi</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/40 border border-white/10">
                      <span className="text-base font-black text-amber-300 flex items-center justify-center gap-0.5">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {championSchool.avgRating}
                      </span>
                      <span className="text-[10px] text-blue-100/80 font-semibold">Rata2 Rating</span>
                    </div>
                  </div>
                </div>

                {/* JUARA 2 - PIALA PERAK */}
                <div className="p-5 rounded-2xl bg-white/10 border border-slate-300/30 flex flex-col justify-between gap-4">
                  {secondSchool ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-wider">
                            <Award size={12} />
                            <span>Juara 2 • Piala Perak</span>
                          </span>
                          <h4 className="text-base font-extrabold text-white pt-1">
                            🥈 {secondSchool.namaSekolah}
                          </h4>
                          <p className="text-[11px] text-blue-100/80">
                            Kontribusi {secondSchool.pct}% dari total evaluasi
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-200/20 border border-slate-300/40 text-slate-200 flex items-center justify-center shrink-0">
                          <Trophy size={24} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                        <div className="p-2 rounded-xl bg-slate-950/35">
                          <span className="text-sm font-black text-white block">{secondSchool.totalIsian}</span>
                          <span className="text-[10px] text-blue-200">Total Isian</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/35">
                          <span className="text-sm font-black text-white block">{secondSchool.jumlahEventDiikuti} Event</span>
                          <span className="text-[10px] text-blue-200">Partisipasi</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/35">
                          <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-0.5">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            {secondSchool.avgRating}
                          </span>
                          <span className="text-[10px] text-blue-200">Rata2 Rating</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-blue-200/70">
                      Menunggu partisipasi sekolah mitra berikutnya
                    </div>
                  )}
                </div>

                {/* JUARA 3 - PIALA PERUNGGU */}
                <div className="p-5 rounded-2xl bg-white/10 border border-amber-700/40 flex flex-col justify-between gap-4">
                  {thirdSchool ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-700/80 text-amber-100 text-[10px] font-black uppercase tracking-wider">
                            <Medal size={12} />
                            <span>Juara 3 • Piala Perunggu</span>
                          </span>
                          <h4 className="text-base font-extrabold text-white pt-1">
                            🥉 {thirdSchool.namaSekolah}
                          </h4>
                          <p className="text-[11px] text-blue-100/80">
                            Kontribusi {thirdSchool.pct}% dari total evaluasi
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-700/25 border border-amber-600/40 text-amber-300 flex items-center justify-center shrink-0">
                          <Trophy size={24} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                        <div className="p-2 rounded-xl bg-slate-950/35">
                          <span className="text-sm font-black text-white block">{thirdSchool.totalIsian}</span>
                          <span className="text-[10px] text-blue-200">Total Isian</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/35">
                          <span className="text-sm font-black text-white block">{thirdSchool.jumlahEventDiikuti} Event</span>
                          <span className="text-[10px] text-blue-200">Partisipasi</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/35">
                          <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-0.5">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            {thirdSchool.avgRating}
                          </span>
                          <span className="text-[10px] text-blue-200">Rata2 Rating</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-blue-200/70">
                      Menunggu partisipasi sekolah mitra berikutnya
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Klasemen Lengkap Keaktifan Sekolah Mitra */}
            <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" />
                  <span>Tabel Klasemen Keaktifan Seluruh Sekolah Mitra Mengisi MenDAKI</span>
                </h4>
                <span className="text-[11px] text-blue-200">
                  Diurutkan berdasarkan jumlah pengisian form terbanyak & keaktifan event
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {schoolTrophyLeaderboard.map((sch, idx) => {
                  const isTop1 = idx === 0 && sch.totalIsian > 0;
                  const isTop2 = idx === 1 && sch.totalIsian > 0;
                  const isTop3 = idx === 2 && sch.totalIsian > 0;
                  return (
                    <div
                      key={sch.mitraId}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                        isTop1
                          ? 'bg-amber-400/20 border-amber-400/60 text-white'
                          : isTop2
                          ? 'bg-slate-200/15 border-slate-300/40 text-white'
                          : isTop3
                          ? 'bg-amber-700/20 border-amber-500/40 text-white'
                          : sch.totalIsian > 0
                          ? 'bg-white/5 border-white/15 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950'
                              : isTop2
                              ? 'bg-slate-200 text-slate-900'
                              : isTop3
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isTop1 ? '🏆' : isTop2 ? '🥈' : isTop3 ? '🥉' : idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold truncate flex items-center gap-1">
                            <span className="truncate">{sch.namaSekolah}</span>
                          </div>
                          <div className="text-[10px] text-blue-200/80">
                            {sch.totalIsian > 0
                              ? `${sch.jumlahEventDiikuti} Event • ★ ${sch.avgRating}`
                              : 'Belum mengisi'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            sch.totalIsian > 0
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {sch.totalIsian} Isian
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            BAGIAN 2: REPORT EVALUASI MENDAKI DARI SETIAP EVENT (KHUSUS ADMIN)
            - Sekolah Paling Aktif per Event (Piala 🏆)
            - Kesimpulan Drop, Add, Keep, dan Improve
            - Rata-Rata Rating per Event
           ===================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-600 mb-1">
                <FileText size={13} />
                <span>Executive Event Report MenDAKI (Khusus Admin)</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                <span>Report Evaluasi dari Setiap Event: Piala Sekolah Teraktif, Kesimpulan DAKI & Rata-Rata Rating</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rangkuman lengkap setiap agenda event meliputi sekolah paling aktif mengisi (penerima piala), kesimpulan Drop, Add, Keep, Improve, serta rata-rata rating kegiatan
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <select
                value={selectedReportEventFilter}
                onChange={(e) => setSelectedReportEventFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">Semua Event ({adminEventReports.length} Event)</option>
                {adminEventReports.map(rep => (
                  <option key={rep.key} value={rep.key}>
                    {rep.judulEvent} ({rep.totalResponden} Pengisi)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportAdminEventReportsCsv}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download size={14} />
                <span>Unduh Report Semua Event (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Event Report Cards List */}
          <div className="space-y-6">
            {filteredEventReports.map((rep, index) => (
              <div
                key={rep.key}
                className="rounded-3xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-2xs"
              >
                {/* Event Report Header Bar */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-4 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-black uppercase tracking-wider">
                        Event #{index + 1} • {rep.kategori}
                      </span>
                      {rep.tanggal && (
                        <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                          <Calendar size={12} className="text-amber-400" />
                          <span>{rep.tanggal}</span>
                        </span>
                      )}
                      {rep.pembicara && (
                        <span className="text-[11px] text-slate-300 font-medium">
                          • Narasumber: <strong className="text-white">{rep.pembicara}</strong>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {rep.judulEvent}
                    </h4>
                  </div>

                  {/* Rata-Rata Rating & Jumlah Pengisi Badge */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-200 block">
                        Responden Event
                      </span>
                      <span className="text-sm font-black text-white">
                        {rep.totalResponden} Pengisi
                      </span>
                    </div>

                    <div className="px-4 py-2 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-200 block">
                        Rata-Rata Rating Event
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(st => (
                            <Star
                              key={st}
                              size={13}
                              className={
                                st <= Math.round(rep.avgRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-slate-600 text-slate-500'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-sm font-black text-amber-300">
                          {rep.avgRating > 0 ? `${rep.avgRating} / 5.0` : 'Belum Ada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Report Event */}
                <div className="p-6 space-y-5">
                  {/* Baris Atas: Piala Sekolah Teraktif di Event Ini & Detail Rata-Rata Rating */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* PIALA SEKOLAH PALING AKTIF DI EVENT INI */}
                    <div className="lg:col-span-7 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50/70 to-orange-50/40 border border-amber-300/90 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                            <Trophy size={11} />
                            <span>Piala Sekolah Paling Aktif di Event Ini</span>
                          </span>
                          {rep.topSchool ? (
                            <>
                              <h5 className="text-base font-black text-slate-900 pt-0.5 flex items-center gap-2">
                                <span>🏆 {rep.topSchool.namaSekolah}</span>
                                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                                  {rep.topSchool.jumlah} Pengisi ({rep.topSchool.pct}%)
                                </span>
                              </h5>
                              <p className="text-xs text-slate-600">
                                Sekolah dengan partisipasi pengisian MenDAKI tertinggi pada event <strong>{rep.judulEvent}</strong> (Rata-rata rating sekolah: ★ {rep.topSchool.avgRating}/5).
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-slate-500 pt-1">
                              Belum ada sekolah yang mengisi form evaluasi pada event ini.
                            </p>
                          )}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                          <Trophy size={24} />
                        </div>
                      </div>

                      {/* Daftar seluruh sekolah yang berpartisipasi pada event ini */}
                      {rep.schoolRankings.length > 0 && (
                        <div className="pt-2.5 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-900">
                            Peringkat Sekolah di Event Ini:
                          </span>
                          {rep.schoolRankings.map((sc, sIdx) => (
                            <span
                              key={sc.namaSekolah}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                                sIdx === 0
                                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                                  : sIdx === 1
                                  ? 'bg-white text-slate-800 border-slate-300'
                                  : 'bg-white/80 text-slate-700 border-amber-200'
                              }`}
                            >
                              <span>{sIdx === 0 ? '🏆' : sIdx === 1 ? '🥈' : sIdx === 2 ? '🥉' : `#${sIdx + 1}`}</span>
                              <span>{sc.namaSekolah}</span>
                              <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
                                {sc.jumlah} orang
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RATA-RATA RATING & DISTRIBUSI BINTANG EVENT */}
                    <div className="lg:col-span-5 p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Indeks Kepuasan & Rating Event
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-black text-slate-900">
                              {rep.avgRating > 0 ? rep.avgRating : '0.0'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">/ 5.0 Bintang</span>
                          </div>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold">
                            {rep.predikatRating}
                          </span>
                        </div>

                        <div className="text-right space-y-1">
                          {[5, 4, 3, 2, 1].map(star => {
                            const count = rep.ratingDistribution[star] || 0;
                            return (
                              <div key={star} className="flex items-center justify-end gap-1.5 text-[10px]">
                                <span className="font-bold text-slate-600">{star}★</span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{
                                      width: `${
                                        rep.totalResponden > 0
                                          ? Math.round((count / rep.totalResponden) * 100)
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-500 w-4 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KESIMPULAN REFLEKSI DAKI (DROP, ADD, KEEP, IMPROVE) PER EVENT */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-600" />
                      <span>Kesimpulan Evaluasi Refleksi DAKI (Drop, Add, Keep, Improve) — {rep.judulEvent}</span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. KESIMPULAN DROP */}
                      <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider">
                            1. Kesimpulan DROP (Hentikan / Kurangi)
                          </span>
                          <span className="text-[11px] font-bold text-rose-800">
                            {rep.dropItems.length} Masukan
                          </span>
                        </div>
                        <p className="text-xs font-bold text-rose-950 bg-white/90 p-3 rounded-xl border border-rose-200/80 leading-relaxed">
                          {rep.kesimpulanDrop}
                        </p>
                        {rep.dropItems.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                              Rincian Masukan Responden:
                            </span>
                            {rep.dropItems.map((item, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-slate-700 bg-white/70 px-3 py-1.5 rounded-lg border border-rose-100 flex items-start justify-between gap-2"
                              >
                                <span>• &ldquo;{item.text}&rdquo;</span>
                                <span className="text-[10px] font-bold text-rose-800 shrink-0">
                                  {item.nama} ({item.sekolah})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. KESIMPULAN ADD */}
                      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-black uppercase tracking-wider">
                            2. Kesimpulan ADD (Tambahkan Baru)
                          </span>
                          <span className="text-[11px] font-bold text-sky-800">
                            {rep.addItems.length} Masukan
                          </span>
                        </div>
                        <p className="text-xs font-bold text-sky-950 bg-white/90 p-3 rounded-xl border border-sky-200/80 leading-relaxed">
                          {rep.kesimpulanAdd}
                        </p>
                        {rep.addItems.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                              Rincian Usulan Responden:
                            </span>
                            {rep.addItems.map((item, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-slate-700 bg-white/70 px-3 py-1.5 rounded-lg border border-sky-100 flex items-start justify-between gap-2"
                              >
                                <span>• &ldquo;{item.text}&rdquo;</span>
                                <span className="text-[10px] font-bold text-sky-800 shrink-0">
                                  {item.nama} ({item.sekolah})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. KESIMPULAN KEEP */}
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider">
                            3. Kesimpulan KEEP (Pertahankan)
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800">
                            {rep.keepItems.length} Masukan
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-950 bg-white/90 p-3 rounded-xl border border-emerald-200/80 leading-relaxed">
                          {rep.kesimpulanKeep}
                        </p>
                        {rep.keepItems.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                              Rincian Apresiasi Responden:
                            </span>
                            {rep.keepItems.map((item, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-slate-700 bg-white/70 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-start justify-between gap-2"
                              >
                                <span>• &ldquo;{item.text}&rdquo;</span>
                                <span className="text-[10px] font-bold text-emerald-800 shrink-0">
                                  {item.nama} ({item.sekolah})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 4. KESIMPULAN IMPROVE */}
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                            4. Kesimpulan IMPROVE (Tingkatkan)
                          </span>
                          <span className="text-[11px] font-bold text-amber-900">
                            {rep.improveItems.length} Masukan
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-950 bg-white/90 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
                          {rep.kesimpulanImprove}
                        </p>
                        {rep.improveItems.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                              Rincian Rekomendasi Responden:
                            </span>
                            {rep.improveItems.map((item, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-slate-700 bg-white/70 px-3 py-1.5 rounded-lg border border-amber-100 flex items-start justify-between gap-2"
                              >
                                <span>• &ldquo;{item.text}&rdquo;</span>
                                <span className="text-[10px] font-bold text-amber-900 shrink-0">
                                  {item.nama} ({item.sekolah})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hal yang Paling Disukai dari Event Ini */}
                    <div className="mt-4 p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                          <MessageSquareHeart size={14} className="text-purple-600" />
                          <span>Kesimpulan Hal yang Paling Disukai Peserta dari Kegiatan Ini:</span>
                        </span>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {rep.kesimpulanDisukai}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSubFilterKategori(rep.kategori);
                          setSubSearchQuery('');
                          setActiveSubTab('kelola-form');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 text-xs font-bold shrink-0 cursor-pointer transition"
                      >
                        Lihat di Sheet ({rep.totalResponden})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // VIEW KHUSUS GURU MITRA: HANYA BISA MENGISI FORM SAJA
  // =====================================================
  if (isGuruMitra) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList size={22} className="text-blue-600" />
              <span>Formulir Evaluasi & Refleksi Kegiatan (MenDAKI)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Silakan lengkapi form evaluasi kegiatan (Email, Nama, Nama Sekolah, Event/Kegiatan, Tema/Topik, Drop, Add, Keep, Improve, Hal Disukai, & Rating)
            </p>
          </div>
        </div>

        {renderEvaluationFormSection()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={22} className="text-blue-600" />
            <span>Performance & Evaluasi Kegiatan MenDAKI</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Laporan eksekutif setiap event, piala sekolah mitra teraktif mengisi MenDAKI, kesimpulan Drop/Add/Keep/Improve, rata-rata rating, serta sheet hasil evaluasi'
              : 'Isi form refleksi kegiatan kemitraan dan pantau jumlah partisipasi pengisian dari setiap kategori event'}
          </p>
        </div>

        {/* Action Buttons for Admin */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportAdminEventReportsCsv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Download size={15} />
              <span>Unduh Report Event (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsManageEventsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Calendar size={15} />
              <span>Kelola Opsi Event / Kegiatan</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateFormDef}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>Buat Form Baru</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditFormDef(currentFormDef)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Settings size={15} />
              <span>Edit Form Aktif</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs (Only for Admin; Sekolah Mitra directly sees Rekap + Form) */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('kelola-form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'kelola-form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Trophy size={15} />
            <span>Report Setiap Event, Piala Sekolah & Sheet Evaluasi ({baseSubmissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('report-event')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'report-event'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award size={15} />
            <span>Fokus Report Per Event & Kesimpulan DAKI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('isi-form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'isi-form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={15} />
            <span>Preview & Isi Form Evaluasi</span>
          </button>
        </div>
      )}

      {/* =====================================================
          TAB KHUSUS FOKUS REPORT EVENT & PIALA SEKOLAH (ADMIN)
         ===================================================== */}
      {isAdmin && activeSubTab === 'report-event' && (
        <div className="space-y-6">
          {renderAdminEventReportAndTrophySection()}
        </div>
      )}

      {/* =====================================================
          TAB 1 (ADMIN): REPORT SETIAP EVENT + PIALA SEKOLAH + SHEET HASIL KE SAMPING PER ORANG & KELOLA FORM
         ===================================================== */}
      {isAdmin && activeSubTab === 'kelola-form' && (
        <div className="space-y-6">
          {/* Tampilkan langsung Podium Piala Sekolah Paling Aktif & Report Setiap Event (Drop, Add, Keep, Improve, Rata-Rata Rating) */}
          {renderAdminEventReportAndTrophySection()}
          {/* Sheet Hasil Isian Form (Tampilan Spreadsheet Ke Samping Per Orang) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Table2 size={19} className="text-emerald-600" />
                  <span>Sheet Hasil Evaluasi MenDAKI (Tampilan Ke Samping Per Orang)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap baris menampilkan 1 responden secara mendatar ke samping: Email, Nama, Nama Sekolah, Event/Kegiatan, Tema/Topik, Drop, Add, Keep, Improve, Hal Disukai, & Rating
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                  {filteredAdminSubmissions.length} Baris Data
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  placeholder="Cari di dalam sheet (nama, email, sekolah, event, topik, drop, add, keep, improve, hal disukai)..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <select
                  value={subFilterKategori}
                  onChange={(e) => setSubFilterKategori(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Semua Event / Kegiatan</option>
                  {allEventCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={subFilterSekolah}
                  onChange={(e) => setSubFilterSekolah(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ALL">Semua Sekolah Mitra</option>
                  {realSchools.map(s => (
                    <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Spreadsheet Table (Horizontal Scrollable Sheet Per Person) */}
            {filteredAdminSubmissions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada data isian form yang sesuai dengan filter pencarian.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs min-w-[1650px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-12 sticky left-0 bg-slate-900 z-10">No</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[170px]">{currentFormDef.labelEmail || 'Email'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[160px]">{currentFormDef.labelNama || 'Nama'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[150px]">{currentFormDef.labelNamaSekolah || 'Nama Sekolah'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[175px]">{currentFormDef.labelEventKegiatan || 'Event / Kegiatan'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[190px]">{currentFormDef.labelTemaTopik || 'Tema / Topik'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[210px] bg-rose-950/80 text-rose-200">{currentFormDef.labelDrop || 'Drop'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[210px] bg-sky-950/80 text-sky-200">{currentFormDef.labelAdd || 'Add'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[210px] bg-emerald-950/80 text-emerald-200">{currentFormDef.labelKeep || 'Keep'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[210px] bg-amber-950/80 text-amber-200">{currentFormDef.labelImprove || 'Improve'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[220px] bg-purple-950/80 text-purple-200">{currentFormDef.labelHalDisukai || 'Hal yang anda sukai dari Kegiatan ini?'}</th>
                        <th className="py-3 px-3.5 border-r border-slate-700 min-w-[125px] text-center">{currentFormDef.labelRating || 'Rating'}</th>
                        <th className="py-3 px-3.5 text-center min-w-[115px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredAdminSubmissions.map((sub, idx) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-blue-50/40 transition align-top odd:bg-white even:bg-slate-50/50"
                        >
                          {/* No */}
                          <td className="py-3 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-500 sticky left-0 bg-inherit z-10">
                            {idx + 1}
                          </td>

                          {/* 1. Email */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700 font-medium break-all">
                            {sub.email}
                          </td>

                          {/* 2. Nama */}
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{sub.nama}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sub.tanggalIsi}</div>
                          </td>

                          {/* 3. Nama Sekolah */}
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              {sub.namaSekolah}
                            </span>
                          </td>

                          {/* 4. Event / Kegiatan */}
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {sub.eventKegiatan || sub.kategoriEvent}
                            </span>
                          </td>

                          {/* 5. Tema / Topik */}
                          <td className="py-3 px-3.5 border-r border-slate-200 font-semibold text-slate-800 leading-relaxed">
                            {sub.temaTopik}
                          </td>

                          {/* 6. Drop */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700 bg-rose-50/20 leading-relaxed">
                            {sub.drop}
                          </td>

                          {/* 7. Add */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700 bg-sky-50/20 leading-relaxed">
                            {sub.add}
                          </td>

                          {/* 8. Keep */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700 bg-emerald-50/20 leading-relaxed">
                            {sub.keep}
                          </td>

                          {/* 9. Improve */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-700 bg-amber-50/20 leading-relaxed">
                            {sub.improve}
                          </td>

                          {/* 10. Hal Disukai */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-slate-800 bg-purple-50/20 leading-relaxed font-medium">
                            {sub.halDisukai}
                          </td>

                          {/* 11. Rating */}
                          <td className="py-3 px-3.5 border-r border-slate-200 text-center">
                            <div className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                              {[1, 2, 3, 4, 5].map(st => (
                                <Star
                                  key={st}
                                  size={12}
                                  className={st <= sub.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-300'}
                                />
                              ))}
                              <span className="ml-1 text-[11px] font-black text-amber-700">{sub.rating}/5</span>
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailSubmissionModal(sub)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="Lihat Detail"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditSubmissionByAdmin(sub)}
                                className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                                title="Edit Baris Ini"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteSubmissionTarget({ id: sub.id, nama: `${sub.nama} (${sub.eventKegiatan})` })}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                                title="Hapus Baris Ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Rekap Jumlah Pengisi per Kategori Event */}
          {renderCategoryCountsSection()}

          {/* Daftar Form yang Tersedia (Admin can Create, Edit, Delete) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Settings size={18} className="text-blue-600" />
                  <span>Pengaturan Formulir & Pilihan Event/Kegiatan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administrator dapat membuat form baru, mengedit label kolom, serta menambah/mengedit daftar pilihan dropdown Event/Kegiatan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManageEventsOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar size={14} />
                  <span>Tambah/Edit Dropdown Event</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateFormDef}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Buat Form Baru</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mendakiFormList.map((formItem) => {
                const countForForm = baseSubmissions.filter(s => s.formId === formItem.id).length;
                return (
                  <div
                    key={formItem.id}
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                      selectedFormId === formItem.id
                        ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/15'
                        : 'bg-slate-50/60 border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          formItem.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          Status: {formItem.status}
                        </span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                          {countForForm} Pengisi
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {formItem.judulForm}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {formItem.deskripsiForm}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Email', 'Nama', 'Nama Sekolah', 'Event/Kegiatan (Dropdown)', 'Tema/Topik', 'Drop', 'Add', 'Keep', 'Improve', 'Hal yang anda sukai dari Kegiatan ini?', 'Rating ★'].map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/70">
                      <span className="text-[11px] text-slate-400">
                        Diperbarui: {formItem.updatedAt || formItem.createdAt}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFormId(formItem.id);
                            setActiveSubTab('isi-form');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Lihat Form</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditFormDef(formItem)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Edit Form</span>
                        </button>
                        {mendakiFormList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDeleteFormTarget({ id: formItem.id, judul: formItem.judulForm })}
                            className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Form"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TAB 2: ISI FORM & REKAP KATEGORI (UNTUK SEKOLAH MITRA & PREVIEW ADMIN)
         ===================================================== */}
      {(activeSubTab === 'isi-form' || !isAdmin) && (
        <div className="space-y-6">
          {/* Sekolah Mitra sees Rekap Jumlah Pengisi per Kategori Event WITHOUT detail */}
          {!isAdmin && renderCategoryCountsSection()}

          {/* Form Pengisian Evaluasi MenDAKI */}
          {renderEvaluationFormSection()}
        </div>
      )}

      {/* =====================================================
          MODAL ADMIN: KELOLA PILIHAN DROPDOWN EVENT / KEGIATAN
         ===================================================== */}
      {isManageEventsOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar size={17} className="text-indigo-600" />
                  <span>Kelola Pilihan Dropdown Event / Kegiatan</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tambah atau edit daftar pilihan Event/Kegiatan yang tampil pada dropdown form evaluasi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManageEventsOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Tambah Pilihan Event Baru */}
            <form onSubmit={handleAddEventOption} className="flex gap-2">
              <input
                type="text"
                value={newEventOptionInput}
                onChange={(e) => setNewEventOptionInput(e.target.value)}
                placeholder="Ketik nama event / kegiatan baru..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah</span>
              </button>
            </form>

            {/* Daftar Pilihan Saat Ini */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {eventDropdownOptions.map((opt, idx) => (
                <div
                  key={`${opt}-${idx}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  {editingOptionIdx === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingOptionValue}
                        onChange={(e) => setEditingOptionValue(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-semibold focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditEventOption(idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={13} />
                        <span>Simpan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOptionIdx(null)}
                        className="px-2 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-800">{opt}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOptionIdx(idx);
                            setEditingOptionValue(opt);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        {eventDropdownOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEventOption(idx)}
                            className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                            title="Hapus Opsi"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManageEventsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL ADMIN: BUAT / EDIT FORM EVALUASI MENDAKI
         ===================================================== */}
      {isFormBuilderOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingFormDef ? 'Edit Konfigurasi Form Evaluasi MenDAKI' : 'Buat Form Evaluasi MenDAKI Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Atur judul, pilihan dropdown Event/Kegiatan, dan label kolom form (Email, Nama, Nama Sekolah, Event/Kegiatan, Tema/Topik, Drop, Add, Keep, Improve, Hal Disukai, & Rating)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormBuilderOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFormDef} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Judul Formulir <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={builderJudul}
                    onChange={(e) => setBuilderJudul(e.target.value)}
                    placeholder="Contoh: Form Evaluasi & Refleksi Kegiatan MenDAKI"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Form</label>
                  <select
                    value={builderStatus}
                    onChange={(e) => setBuilderStatus(e.target.value as 'Aktif' | 'Ditutup')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Aktif">Aktif (Dapat Diisi)</option>
                    <option value="Ditutup">Ditutup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi / Instruksi Pengisian</label>
                <textarea
                  rows={2}
                  value={builderDeskripsi}
                  onChange={(e) => setBuilderDeskripsi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Kelola Opsi Dropdown Event / Kegiatan di dalam Modal Form Builder */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>Pilihan Dropdown Event / Kegiatan (Admin Bisa Tambah & Edit)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={builderNewOption}
                    onChange={(e) => setBuilderNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBuilderAddEventOpt();
                      }
                    }}
                    placeholder="Tambah pilihan event / kegiatan baru..."
                    className="flex-1 p-2 bg-white border border-indigo-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleBuilderAddEventOpt}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Tambah Opsi</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {builderEventOptions.map((opt, idx) => (
                    <div
                      key={`${opt}-${idx}`}
                      className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-white border border-slate-200"
                    >
                      {builderEditOptIdx === idx ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={builderEditOptVal}
                            onChange={(e) => setBuilderEditOptVal(e.target.value)}
                            className="flex-1 px-2 py-1 bg-slate-50 border border-indigo-300 rounded text-xs"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleBuilderSaveEditOpt(idx)}
                            className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-800 truncate">{opt}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setBuilderEditOptIdx(idx);
                                setBuilderEditOptVal(opt);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            {builderEventOptions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleBuilderDeleteOpt(idx)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="block font-extrabold text-slate-800 mb-2">
                  Label Kolom Formulir:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">1. Email</label>
                    <input
                      type="text"
                      value={builderLabelEmail}
                      onChange={(e) => setBuilderLabelEmail(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">2. Nama</label>
                    <input
                      type="text"
                      value={builderLabelNama}
                      onChange={(e) => setBuilderLabelNama(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">3. Nama Sekolah</label>
                    <input
                      type="text"
                      value={builderLabelSekolah}
                      onChange={(e) => setBuilderLabelSekolah(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">4. Event / Kegiatan (Dropdown)</label>
                    <input
                      type="text"
                      value={builderLabelEvent}
                      onChange={(e) => setBuilderLabelEvent(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">5. Tema / Topik</label>
                    <input
                      type="text"
                      value={builderLabelTema}
                      onChange={(e) => setBuilderLabelTema(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">6. Drop</label>
                    <input
                      type="text"
                      value={builderLabelDrop}
                      onChange={(e) => setBuilderLabelDrop(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">7. Add</label>
                    <input
                      type="text"
                      value={builderLabelAdd}
                      onChange={(e) => setBuilderLabelAdd(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">8. Keep</label>
                    <input
                      type="text"
                      value={builderLabelKeep}
                      onChange={(e) => setBuilderLabelKeep(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">9. Improve</label>
                    <input
                      type="text"
                      value={builderLabelImprove}
                      onChange={(e) => setBuilderLabelImprove(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">10. Hal yang anda sukai dari Kegiatan ini?</label>
                    <input
                      type="text"
                      value={builderLabelDisukai}
                      onChange={(e) => setBuilderLabelDisukai(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">11. Rating</label>
                    <input
                      type="text"
                      value={builderLabelRating}
                      onChange={(e) => setBuilderLabelRating(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  {editingFormDef ? 'Simpan Perubahan Form' : 'Buat & Aktifkan Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL ADMIN: DETAIL ISIAN FORM RESPONDEN
         ===================================================== */}
      {detailSubmissionModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Detail Respons Evaluasi MenDAKI
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {detailSubmissionModal.nama} — {detailSubmissionModal.namaSekolah}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailSubmissionModal(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="font-bold text-slate-800">{detailSubmissionModal.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Nama Sekolah:</span>
                <span className="font-bold text-slate-800">{detailSubmissionModal.namaSekolah}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Event / Kegiatan:</span>
                <span className="font-bold text-blue-700">{detailSubmissionModal.eventKegiatan || detailSubmissionModal.kategoriEvent}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tema / Topik:</span>
                <span className="font-bold text-slate-800">{detailSubmissionModal.temaTopik}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="font-black text-rose-800 block mb-1">DROP:</span>
                <p className="text-slate-800">{detailSubmissionModal.drop}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="font-black text-sky-800 block mb-1">ADD:</span>
                <p className="text-slate-800">{detailSubmissionModal.add}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="font-black text-emerald-800 block mb-1">KEEP:</span>
                <p className="text-slate-800">{detailSubmissionModal.keep}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="font-black text-amber-900 block mb-1">IMPROVE:</span>
                <p className="text-slate-800">{detailSubmissionModal.improve}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="font-black text-purple-900 block mb-1">Hal yang anda sukai dari Kegiatan ini?</span>
                <p className="text-slate-800">{detailSubmissionModal.halDisukai}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">Rating:</span>
                {[1, 2, 3, 4, 5].map(st => (
                  <Star
                    key={st}
                    size={16}
                    className={st <= detailSubmissionModal.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-300'}
                  />
                ))}
                <span className="text-xs font-black text-amber-600 ml-1">({detailSubmissionModal.rating}/5)</span>
              </div>

              <button
                type="button"
                onClick={() => setDetailSubmissionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modals */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteSubmissionTarget)}
        title="Hapus Isian Form Evaluasi"
        itemName={deleteSubmissionTarget?.nama || ''}
        description="Data isian evaluasi responden ini akan dihapus secara permanen dari sheet."
        onConfirm={async () => {
          if (deleteSubmissionTarget) {
            await deleteMendakiSubmission(deleteSubmissionTarget.id);
            setDeleteSubmissionTarget(null);
          }
        }}
        onCancel={() => setDeleteSubmissionTarget(null)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteFormTarget)}
        title="Hapus Formulir Evaluasi"
        itemName={deleteFormTarget?.judul || ''}
        description="Formulir evaluasi ini akan dihapus dari daftar form."
        onConfirm={async () => {
          if (deleteFormTarget) {
            await deleteMendakiForm(deleteFormTarget.id);
            setDeleteFormTarget(null);
          }
        }}
        onCancel={() => setDeleteFormTarget(null)}
      />
    </div>
  );
};
