import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  User, 
  ExternalLink, 
  X, 
  Calendar as CalendarIcon,
  Users,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  Mic,
  Link2,
  Eye,
  Sparkles,
  Tag,
  Settings,
  TrendingUp,
  Star,
  ClipboardCheck,
  Table2,
  Download,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { EventItem, EventKategori, EventStatus, MendakiFormSubmission } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const DEFAULT_EVENT_CATEGORIES: string[] = [
  'Workshop Kurikulum',
  'Pelatihan Guru',
  'Koordinasi Pimpinan',
  'Supervisi Mutu',
  'Parenting',
  'Lomba Siswa'
];

const CATEGORIES_STORAGE_KEY = 'lmap_event_categories';

interface EventTrackerViewProps {
  onNavigateToMendaki?: (payload: {
    eventId?: string;
    judul: string;
    kategori: string;
    mode?: 'isi-form' | 'kelola-form';
  }) => void;
}

export const EventTrackerView: React.FC<EventTrackerViewProps> = ({ onNavigateToMendaki }) => {
  const { isAdmin, currentUser } = useAuth();
  const { eventList, mendakiSubmissionList, addEvent, updateEvent, deleteEvent } = useData();

  const isDemoUser = Boolean(currentUser?.isDemo || currentUser?.sekolahId === 'DEMO-MITRA');

  const baseEventList = useMemo(() => {
    if (isDemoUser) {
      return eventList.filter(evt => evt.isDemo || evt.sekolahId === 'DEMO-MITRA' || evt.mitra === 'Semua Sekolah Mitra');
    }
    return eventList.filter(evt => !evt.isDemo && evt.sekolahId !== 'DEMO-MITRA');
  }, [eventList, isDemoUser]);

  const baseMendakiSubmissions = useMemo(() => {
    if (isDemoUser) {
      return mendakiSubmissionList.filter(s => s.isDemo || s.mitraId === 'DEMO-MITRA');
    }
    return mendakiSubmissionList.filter(s => !s.isDemo && s.mitraId !== 'DEMO-MITRA');
  }, [mendakiSubmissionList, isDemoUser]);

  // Helper to get connected MenDAKI evaluation submissions for a specific event
  const getEventMendakiStats = (evt: EventItem) => {
    const titleLower = evt.judul.trim().toLowerCase();
    const catLower = evt.kategori.trim().toLowerCase();

    // Direct match by eventId or exact event title/temaTopik, or fallback to matching category
    const directMatches = baseMendakiSubmissions.filter(
      s =>
        (s.eventId && s.eventId === evt.id) ||
        s.eventKegiatan?.trim().toLowerCase() === titleLower ||
        s.temaTopik?.trim().toLowerCase() === titleLower ||
        (s.eventKegiatan?.trim().toLowerCase().includes(titleLower) && titleLower.length > 5)
    );

    const categoryMatches = baseMendakiSubmissions.filter(
      s =>
        s.eventKegiatan?.trim().toLowerCase() === catLower ||
        s.kategoriEvent?.trim().toLowerCase() === catLower
    );

    const matchedList = directMatches.length > 0 ? directMatches : categoryMatches;
    const count = matchedList.length;
    const avgRating =
      count > 0
        ? Number((matchedList.reduce((acc, item) => acc + (item.rating || 0), 0) / count).toFixed(1))
        : 0;

    return {
      count,
      directCount: directMatches.length,
      avgRating,
      isDirectMatch: directMatches.length > 0,
      submissions: matchedList,
    };
  };

  // Real-Time Google Sheet MenDAKI State per Event
  const [selectedSheetEventId, setSelectedSheetEventId] = useState<string>('ALL');
  const [modalSheetEvent, setModalSheetEvent] = useState<EventItem | null>(null);
  const [sheetSearchQuery, setSheetSearchQuery] = useState<string>('');
  const [copiedSheetToast, setCopiedSheetToast] = useState<string | null>(null);
  const [editingSheetLinkEventId, setEditingSheetLinkEventId] = useState<string | null>(null);
  const [tempSheetLinkInput, setTempSheetLinkInput] = useState<string>('');
  const sheetSectionRef = useRef<HTMLDivElement | null>(null);

  const buildTsvFromSubmissions = (rows: MendakiFormSubmission[]) => {
    const headers = [
      'No',
      'Waktu Isi',
      'Email',
      'Nama',
      'Nama Sekolah',
      'Event / Kegiatan',
      'Tema / Topik',
      'Drop',
      'Add',
      'Keep',
      'Improve',
      'Hal yang anda sukai dari Kegiatan ini?',
      'Rating',
    ];
    const cleanCell = (val: string | number | undefined) =>
      String(val ?? '')
        .replace(/[\t\r\n]+/g, ' ')
        .trim();
    const lines = [
      headers.join('\t'),
      ...rows.map((r, i) =>
        [
          i + 1,
          cleanCell(r.tanggalIsi || '-'),
          cleanCell(r.email),
          cleanCell(r.nama),
          cleanCell(r.namaSekolah),
          cleanCell(r.eventKegiatan || r.kategoriEvent),
          cleanCell(r.temaTopik),
          cleanCell(r.drop),
          cleanCell(r.add),
          cleanCell(r.keep),
          cleanCell(r.improve),
          cleanCell(r.halDisukai),
          `${r.rating || 5}/5`,
        ].join('\t')
      ),
    ];
    return lines.join('\n');
  };

  const getDirectGoogleSheetUrl = (evt?: EventItem | null) => {
    const customLink = evt?.linkGoogleSheet?.trim();
    if (customLink) {
      if (customLink.startsWith('http://') || customLink.startsWith('https://')) {
        return customLink;
      }
      return `https://${customLink}`;
    }
    return 'https://docs.google.com/spreadsheets/create';
  };

  const handleCopyDataForGoogleSheets = async (rows: MendakiFormSubmission[], label: string) => {
    try {
      const tsv = buildTsvFromSubmissions(rows);
      await navigator.clipboard.writeText(tsv);
      setCopiedSheetToast(
        `Data evaluasi "${label}" (${rows.length} baris) telah disalin! Saat halaman Google Sheets terbuka, cukup tekan Ctrl+V (atau Cmd+V) di sel A1.`
      );
      setTimeout(() => setCopiedSheetToast(null), 7000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleSaveQuickSheetLink = async (evt: EventItem) => {
    const raw = tempSheetLinkInput.trim();
    const normalized = !raw
      ? undefined
      : raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;
    await updateEvent({
      ...evt,
      linkGoogleSheet: normalized,
    });
    if (modalSheetEvent && modalSheetEvent.id === evt.id) {
      setModalSheetEvent({
        ...modalSheetEvent,
        linkGoogleSheet: normalized,
      });
    }
    setEditingSheetLinkEventId(null);
  };

  const exportEventSheetToCsv = (rows: MendakiFormSubmission[], eventLabel: string) => {
    const headers = [
      'No',
      'Waktu Isi',
      'Email',
      'Nama',
      'Nama Sekolah',
      'Event / Kegiatan',
      'Tema / Topik',
      'Drop',
      'Add',
      'Keep',
      'Improve',
      'Hal yang Disukai',
      'Rating',
    ];
    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r, i) =>
        [
          i + 1,
          r.tanggalIsi || '',
          r.email || '',
          r.nama || '',
          r.namaSekolah || '',
          r.eventKegiatan || r.kategoriEvent || '',
          r.temaTopik || '',
          r.drop || '',
          r.add || '',
          r.keep || '',
          r.improve || '',
          r.halDisukai || '',
          r.rating || 5,
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = eventLabel.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    link.download = `GoogleSheet_MenDAKI_${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_EVENT_CATEGORIES;
  });

  // Ensure any categories present in current eventList are included
  useEffect(() => {
    if (eventList && eventList.length > 0) {
      const existingInEvents = eventList.map(e => e.kategori).filter(Boolean);
      const missing = existingInEvents.filter(cat => !categories.includes(cat));
      if (missing.length > 0) {
        const merged = Array.from(new Set([...categories, ...missing]));
        setCategories(merged);
        try {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
    }
  }, [eventList]);

  const saveCategories = (newCats: string[]) => {
    setCategories(newCats);
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(newCats));
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; judul: string; tanggal: string } | null>(null);
  const [previewFlyer, setPreviewFlyer] = useState<{ url: string; judul: string; pembicara?: string; linkRegistrasi?: string } | null>(null);

  // Category Management State
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [isInlineAddingCat, setIsInlineAddingCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [manageNewCatInput, setManageNewCatInput] = useState('');

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState<EventKategori>(categories[0] || 'Workshop Kurikulum');
  const [formTanggal, setFormTanggal] = useState('2026-10-15');
  const [formWaktu, setFormWaktu] = useState('09:00 - 12:00 WIB');
  const [formLokasi, setFormLokasi] = useState('Auditorium Lazuardi Pusat / Hybrid Zoom');
  const [formPic, setFormPic] = useState('Anita Sulastri');
  const [formMitra, setFormMitra] = useState('Semua Sekolah Mitra');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formStatus, setFormStatus] = useState<EventStatus>('Direncanakan');
  const [formPembicara, setFormPembicara] = useState('');
  const [formFlyerUrl, setFormFlyerUrl] = useState('');
  const [formLinkRegistrasi, setFormLinkRegistrasi] = useState('');
  const [formLinkGoogleSheet, setFormLinkGoogleSheet] = useState('');
  const [flyerInputMode, setFlyerInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = baseEventList.filter(evt => {
    const matchSearch = evt.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.pembicara && evt.pembicara.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchKategori = selectedKategori === 'ALL' || evt.kategori === selectedKategori;
    return matchSearch && matchKategori;
  });

  const handleAddCategory = (name: string, source: 'inline' | 'modal') => {
    const clean = name.trim();
    if (!clean) return;
    if (categories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      alert('Kategori ini sudah terdaftar.');
      return;
    }
    const updated = [...categories, clean];
    saveCategories(updated);
    setFormKategori(clean);
    if (source === 'inline') {
      setNewCatInput('');
      setIsInlineAddingCat(false);
    } else {
      setManageNewCatInput('');
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('Minimal harus ada 1 kategori agenda event.');
      return;
    }

    const eventsUsingCat = eventList.filter(e => e.kategori === catToDelete).length;
    const confirmMsg = eventsUsingCat > 0 
      ? `Kategori "${catToDelete}" sedang digunakan pada ${eventsUsingCat} agenda event. Tetap hapus kategori ini dari daftar pilihan?`
      : `Hapus kategori "${catToDelete}"?`;

    if (!window.confirm(confirmMsg)) return;

    const updated = categories.filter(c => c !== catToDelete);
    saveCategories(updated);

    if (formKategori === catToDelete) {
      setFormKategori(updated[0] || '');
    }
    if (selectedKategori === catToDelete) {
      setSelectedKategori('ALL');
    }
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormJudul('');
    setFormKategori(categories[0] || 'Workshop Kurikulum');
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormWaktu('09:00 - 12:00 WIB');
    setFormLokasi('Auditorium Lazuardi Pusat / Hybrid Zoom');
    setFormPic('Anita Sulastri');
    setFormMitra('Semua Sekolah Mitra');
    setFormDeskripsi('');
    setFormStatus('Direncanakan');
    setFormPembicara('');
    setFormFlyerUrl('');
    setFormLinkRegistrasi('');
    setFormLinkGoogleSheet('https://docs.google.com/spreadsheets/create');
    setFlyerInputMode('upload');
    setIsInlineAddingCat(false);
    setNewCatInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setFormJudul(evt.judul);
    setFormKategori(evt.kategori);
    setFormTanggal(evt.tanggal);
    setFormWaktu(evt.waktu);
    setFormLokasi(evt.lokasi);
    setFormPic(evt.pic);
    setFormMitra(evt.mitraPeserta);
    setFormDeskripsi(evt.deskripsi);
    setFormStatus(evt.status);
    setFormPembicara(evt.pembicara || '');
    setFormFlyerUrl(evt.flyerUrl || '');
    setFormLinkRegistrasi(evt.linkRegistrasi || '');
    setFormLinkGoogleSheet(evt.linkGoogleSheet || 'https://docs.google.com/spreadsheets/create');
    setFlyerInputMode(evt.flyerUrl && !evt.flyerUrl.startsWith('data:') ? 'url' : 'upload');
    setIsInlineAddingCat(false);
    setNewCatInput('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, judul: string, tanggal: string) => {
    setDeleteTarget({ id, judul, tanggal });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file gambar terlalu besar (maksimal 10 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        // Compress image via canvas so it fits comfortably inside Firestore's 1MB document limit
        const img = new Image();
        img.onload = () => {
          try {
            const maxWidth = 900;
            const maxHeight = 1200;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              setFormFlyerUrl(compressedDataUrl);
            } else {
              setFormFlyerUrl(rawDataUrl);
            }
          } catch {
            setFormFlyerUrl(rawDataUrl);
          }
        };
        img.onerror = () => {
          setFormFlyerUrl(rawDataUrl);
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) return;

    const normalizeLink = (val: string) => {
      const clean = val.trim();
      if (!clean) return undefined;
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
        return clean;
      }
      return `https://${clean}`;
    };

    try {
      setIsSavingEvent(true);
      if (editingEvent) {
        await updateEvent({
          ...editingEvent,
          judul: formJudul.trim(),
          kategori: formKategori,
          tanggal: formTanggal,
          waktu: formWaktu.trim(),
          lokasi: formLokasi.trim(),
          pic: formPic.trim(),
          mitraPeserta: formMitra.trim(),
          status: formStatus,
          deskripsi: formDeskripsi.trim(),
          pembicara: formPembicara.trim() || undefined,
          flyerUrl: normalizeLink(formFlyerUrl),
          linkRegistrasi: normalizeLink(formLinkRegistrasi),
          linkGoogleSheet: normalizeLink(formLinkGoogleSheet) || 'https://docs.google.com/spreadsheets/create',
        });
      } else {
        await addEvent({
          judul: formJudul.trim(),
          kategori: formKategori,
          tanggal: formTanggal,
          waktu: formWaktu.trim(),
          lokasi: formLokasi.trim(),
          pic: formPic.trim(),
          mitraPeserta: formMitra.trim(),
          status: formStatus,
          deskripsi: formDeskripsi.trim(),
          pembicara: formPembicara.trim() || undefined,
          flyerUrl: normalizeLink(formFlyerUrl),
          linkRegistrasi: normalizeLink(formLinkRegistrasi),
          linkGoogleSheet: normalizeLink(formLinkGoogleSheet) || 'https://docs.google.com/spreadsheets/create',
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan event:', err);
      setIsModalOpen(false);
    } finally {
      setIsSavingEvent(false);
    }
  };

  /**
   * Generates a direct Google Calendar add event URL for admin
   */
  const generateGoogleCalendarUrl = (item: EventItem) => {
    const title = encodeURIComponent(`[L-MAP] ${item.judul}`);
    const details = encodeURIComponent(
      `${item.deskripsi}\n\n` +
      (item.pembicara ? `Pembicara/Narasumber: ${item.pembicara}\n` : '') +
      `PIC: ${item.pic}\nPeserta: ${item.mitraPeserta}\nLokasi: ${item.lokasi}\n` +
      (item.linkRegistrasi ? `Link Registrasi: ${item.linkRegistrasi}\n` : '') +
      `\nDisinkronkan via L-MAP Lazuardi.`
    );
    const location = encodeURIComponent(item.lokasi);

    const dateStr = item.tanggal.replace(/-/g, '');
    const startTime = `${dateStr}T090000Z`;
    const endTime = `${dateStr}T120000Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  const getStatusPill = (status: EventStatus) => {
    switch (status) {
      case 'Berjalan':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse">Sedang Berjalan</span>;
      case 'Selesai':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Selesai</span>;
      case 'Ditunda':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Ditunda</span>;
      default:
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Direncanakan</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays size={22} className="text-blue-600" />
            <span>Event Tracker & Agenda Kegiatan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal kegiatan, workshop, pelatihan narasumber, flyer kegiatan, dan formulir registrasi kemitraan
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              sheetSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Google Sheet MenDAKI (Real-Time)</span>
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManageCatOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-2 cursor-pointer"
                title="Kelola Daftar Kategori Event"
              >
                <Tag size={15} className="text-slate-600" />
                <span>Kelola Kategori</span>
              </button>
              <button
                id="btn-tambah-event"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Tambah Agenda Event</span>
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-600" />
              <span>Portal Registrasi Kegiatan Sekolah Mitra</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-event"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul event, narasumber, lokasi, PIC..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="filter-kategori-event"
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Kategori Event</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsManageCatOpen(true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Kelola & Hapus Kategori Event"
            >
              <Settings size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Belum ada agenda event yang sesuai pencarian.</p>
          </div>
        ) : (
          filtered.map(evt => (
            <div 
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Event Flyer Portrait (jika ada flyerUrl) */}
              {evt.flyerUrl ? (
                <div 
                  onClick={() => setPreviewFlyer({
                    url: evt.flyerUrl!,
                    judul: evt.judul,
                    pembicara: evt.pembicara,
                    linkRegistrasi: evt.linkRegistrasi
                  })}
                  className="relative aspect-[3/4] w-full bg-slate-900 group cursor-pointer overflow-hidden border-b border-slate-100"
                  title="Klik untuk melihat foto flyer penuh"
                >
                  {/* Blurred backdrop for uploaded portrait flyers of varying ratios */}
                  <img 
                    src={evt.flyerUrl} 
                    alt="" 
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110" 
                  />
                  <img 
                    src={evt.flyerUrl} 
                    alt={`Flyer ${evt.judul}`} 
                    className={`relative z-10 w-full h-full ${
                      evt.flyerUrl.includes('images.unsplash.com') ? 'object-cover' : 'object-contain'
                    } group-hover:scale-[1.03] transition-transform duration-300`} 
                  />
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/75 via-transparent to-black/35 pointer-events-none" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-white bg-blue-600/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                      {evt.kategori}
                    </span>
                    <span className="text-[10px] font-mono text-white/90 bg-black/45 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      {evt.id}
                    </span>
                  </div>
                  
                  <div className="absolute top-3 right-3 z-30">
                    {getStatusPill(evt.status)}
                  </div>

                  {/* Zoom indicator on hover */}
                  <div className="absolute bottom-3 right-3 z-30 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                    <Eye size={13} />
                    <span>Lihat Flyer Penuh</span>
                  </div>
                </div>
              ) : (
                /* Header tanpa flyer */
                <div className="p-5 pb-0 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {evt.kategori}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({evt.id})</span>
                  </div>
                  {getStatusPill(evt.status)}
                </div>
              )}

              {/* Event Content Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Speaker (Pembicara) Badge jika ada */}
                  {evt.pembicara && (
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-900 bg-purple-50/90 border border-purple-200/80 px-3 py-1.5 rounded-xl mb-2.5 shadow-2xs">
                      <Mic size={14} className="text-purple-600 shrink-0" />
                      <span className="truncate">
                        Narasumber: <strong className="text-purple-950 font-bold">{evt.pembicara}</strong>
                      </span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5">
                    {evt.judul}
                  </h3>

                  <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                    {evt.deskripsi}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <Clock size={14} className="text-blue-600 shrink-0" />
                      <span>{evt.tanggal} • {evt.waktu}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-rose-500 shrink-0" />
                      <span className="truncate">{evt.lokasi}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-indigo-600 shrink-0" />
                      <span className="truncate">Sasaran: <strong className="text-slate-800">{evt.mitraPeserta}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <span>PIC Event: <strong className="text-slate-800">{evt.pic}</strong></span>
                    </div>
                  </div>

                  {/* KONEKSI LANGSUNG KE PERFORMANCE MENDAKI */}
                  {(() => {
                    const mendakiStats = getEventMendakiStats(evt);
                    return (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-emerald-50/60 border border-indigo-200/80 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-indigo-600 shrink-0" />
                            <span className="text-[11px] font-extrabold text-indigo-950">
                              Terhubung ke MenDAKI
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                              {mendakiStats.count} Evaluasi
                            </span>
                            {mendakiStats.avgRating > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <Star size={10} className="fill-amber-400 text-amber-500" />
                                {mendakiStats.avgRating}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-0.5">
                          {/* Direct Clickable Link to Google Sheets */}
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getDirectGoogleSheetUrl(evt)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                handleCopyDataForGoogleSheets(mendakiStats.submissions, evt.judul);
                              }}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Klik untuk langsung membuka di Google Sheets (Data otomatis disalin agar siap ditempel)"
                            >
                              <FileSpreadsheet size={13} />
                              <span>Buka di Google Sheets</span>
                              <ExternalLink size={11} />
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSheetEventId(evt.id);
                                setModalSheetEvent(evt);
                              }}
                              className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Lihat Tabel Sheet Real-Time di Aplikasi"
                            >
                              <Table2 size={13} />
                              <span>Tabel Live</span>
                            </button>

                            {onNavigateToMendaki && (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateToMendaki({
                                    eventId: evt.id,
                                    judul: evt.judul,
                                    kategori: evt.kategori,
                                    mode: 'isi-form',
                                  })
                                }
                                className="py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                                title="Isi Formulir Evaluasi MenDAKI untuk Event ini"
                              >
                                <ClipboardCheck size={13} />
                                <span>Isi Form</span>
                              </button>
                            )}
                          </div>

                          {/* Clickable URL display */}
                          <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/85 border border-emerald-200/80 text-[10px]">
                            <a
                              href={getDirectGoogleSheetUrl(evt)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                handleCopyDataForGoogleSheets(mendakiStats.submissions, evt.judul);
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-mono underline truncate flex items-center gap-1"
                              title="Klik link ini untuk langsung membuka Google Sheets"
                            >
                              <Link2 size={11} className="shrink-0 text-emerald-600" />
                              <span className="truncate">{getDirectGoogleSheetUrl(evt)}</span>
                            </a>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSheetLinkEventId(
                                    editingSheetLinkEventId === evt.id ? null : evt.id
                                  );
                                  setTempSheetLinkInput(
                                    evt.linkGoogleSheet || 'https://docs.google.com/spreadsheets/create'
                                  );
                                }}
                                className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 shrink-0 cursor-pointer"
                                title="Atur / ganti link Google Sheet event ini"
                              >
                                Atur Link
                              </button>
                            )}
                          </div>

                          {/* Inline Quick Edit Link Google Sheet for Admin */}
                          {isAdmin && editingSheetLinkEventId === evt.id && (
                            <div className="p-2 rounded-lg bg-white border border-emerald-300 space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-900">
                                Tautan Google Sheet Event (docs.google.com/spreadsheets/...):
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={tempSheetLinkInput}
                                  onChange={(e) => setTempSheetLinkInput(e.target.value)}
                                  placeholder="https://docs.google.com/spreadsheets/d/..."
                                  className="flex-1 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveQuickSheetLink(evt)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Action Area */}
                <div className="pt-3 border-t border-slate-100 mt-3">
                  {!isAdmin ? (
                    /* KHUSUS SEKOLAH MITRA: HANYA BISA KLIK REGISTRASI DENGAN LINK FORM SAJA */
                    <div>
                      {evt.linkRegistrasi ? (
                        <a
                          id={`btn-reg-mitra-${evt.id}`}
                          href={evt.linkRegistrasi}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <Link2 size={15} />
                          <span>Klik Registrasi (Buka Link Formulir)</span>
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs text-center border border-slate-200">
                          Formulir registrasi belum dibuka / hubungi PIC ({evt.pic})
                        </div>
                      )}
                    </div>
                  ) : (
                    /* KHUSUS ADMINISTRATOR */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {evt.linkRegistrasi ? (
                          <a
                            href={evt.linkRegistrasi}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                            title="Buka link registrasi formulir pendaftaran"
                          >
                            <Link2 size={13} />
                            <span>Link Registrasi</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ada link form
                          </span>
                        )}

                        <a
                          href={generateGoogleCalendarUrl(evt)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                          title="Tambahkan ke Google Calendar"
                        >
                          <CalendarIcon size={13} />
                          <span>Kalender</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                          title="Edit agenda event"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(evt.id, evt.judul, evt.tanggal)}
                          className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                          title="Hapus event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =====================================================================
          GOOGLE SHEET REAL-TIME MENDAKI PADA SETIAP EVENT
         ===================================================================== */}
      {(() => {
        const activeSheetEvt =
          selectedSheetEventId === 'ALL'
            ? null
            : baseEventList.find(e => e.id === selectedSheetEventId) || null;

        const rawRows = activeSheetEvt
          ? getEventMendakiStats(activeSheetEvt).submissions
          : baseMendakiSubmissions;

        const filteredSheetRows = rawRows.filter(row => {
          const q = sheetSearchQuery.trim().toLowerCase();
          if (!q) return true;
          return (
            row.nama?.toLowerCase().includes(q) ||
            row.email?.toLowerCase().includes(q) ||
            row.namaSekolah?.toLowerCase().includes(q) ||
            row.eventKegiatan?.toLowerCase().includes(q) ||
            row.temaTopik?.toLowerCase().includes(q) ||
            row.drop?.toLowerCase().includes(q) ||
            row.add?.toLowerCase().includes(q) ||
            row.keep?.toLowerCase().includes(q) ||
            row.improve?.toLowerCase().includes(q) ||
            row.halDisukai?.toLowerCase().includes(q)
          );
        });

        const avgSheetRating =
          filteredSheetRows.length > 0
            ? Number(
                (
                  filteredSheetRows.reduce((acc, r) => acc + (r.rating || 0), 0) /
                  filteredSheetRows.length
                ).toFixed(1)
              )
            : 0;

        return (
          <div
            ref={sheetSectionRef}
            className="bg-white rounded-3xl border border-emerald-200 shadow-sm overflow-hidden"
          >
            {/* Google Sheets Style Top Bar */}
            <div className="bg-gradient-to-r from-[#0f9d58] via-emerald-700 to-teal-800 px-5 py-4 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                      Google Sheet Real-Time: Evaluasi MenDAKI per Event
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-[10px] font-black uppercase tracking-wider text-emerald-50">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                      <span>LIVE REAL-TIME</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-50/90 mt-0.5">
                    Pilih tab event di bawah untuk melihat sheet hasil evaluasi MenDAKI (Drop, Add, Keep, Improve, Hal Disukai, & Rating) secara langsung
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100" />
                  <input
                    type="text"
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    placeholder="Cari di dalam sheet..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-xs text-white placeholder-emerald-100/80 focus:outline-none focus:bg-white/25"
                  />
                </div>

                <a
                  href={getDirectGoogleSheetUrl(activeSheetEvt)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    handleCopyDataForGoogleSheets(
                      filteredSheetRows,
                      activeSheetEvt ? activeSheetEvt.judul : 'Semua Event MenDAKI'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Klik untuk langsung membuka di Google Sheets (data otomatis disalin ke clipboard)"
                >
                  <FileSpreadsheet size={14} />
                  <span>Buka Langsung di Google Sheets</span>
                  <ExternalLink size={13} />
                </a>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyDataForGoogleSheets(
                      filteredSheetRows,
                      activeSheetEvt ? activeSheetEvt.judul : 'Semua Event MenDAKI'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Salin seluruh baris tabel untuk ditempel (Ctrl+V) di Google Sheets"
                >
                  <Copy size={13} />
                  <span>Salin Data Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    exportEventSheetToCsv(
                      filteredSheetRows,
                      activeSheetEvt ? activeSheetEvt.judul : 'Semua_Event'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>Unduh Sheet (.CSV)</span>
                </button>
              </div>
            </div>

            {/* Toast Notification when data is copied for Google Sheets */}
            {copiedSheetToast && (
              <div className="bg-emerald-900 text-emerald-50 px-5 py-2.5 text-xs font-bold flex items-center justify-between gap-3 border-b border-emerald-700">
                <div className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-300 shrink-0" />
                  <span>{copiedSheetToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCopiedSheetToast(null)}
                  className="text-emerald-200 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Event Worksheet Tabs Bar (Seperti Tab Sheet di Google Sheets) */}
            <div className="bg-slate-100 border-b border-slate-200 px-3 pt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedSheetEventId('ALL')}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold border-t border-x transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  selectedSheetEventId === 'ALL'
                    ? 'bg-white text-emerald-800 border-slate-300 shadow-2xs'
                    : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
                }`}
              >
                <Table2 size={13} className={selectedSheetEventId === 'ALL' ? 'text-emerald-600' : 'text-slate-500'} />
                <span>Semua Event</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-black">
                  {baseMendakiSubmissions.length}
                </span>
              </button>

              {baseEventList.map((evt) => {
                const stats = getEventMendakiStats(evt);
                const isSelected = selectedSheetEventId === evt.id;
                return (
                  <button
                    key={`sheet-tab-${evt.id}`}
                    type="button"
                    onClick={() => setSelectedSheetEventId(evt.id)}
                    className={`px-3.5 py-2 rounded-t-xl text-xs font-bold border-t border-x transition flex items-center gap-2 shrink-0 cursor-pointer max-w-[260px] ${
                      isSelected
                        ? 'bg-white text-emerald-800 border-slate-300 shadow-2xs'
                        : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
                    }`}
                  >
                    <FileSpreadsheet
                      size={13}
                      className={`shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`}
                    />
                    <span className="truncate">{evt.judul}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {stats.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Event Summary Bar inside Sheet */}
            <div className="px-5 py-3 bg-emerald-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  fx
                </span>
                {activeSheetEvt ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900">{activeSheetEvt.judul}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {activeSheetEvt.kategori}
                    </span>
                    <span className="text-slate-500">• {activeSheetEvt.tanggal}</span>
                    {activeSheetEvt.pembicara && (
                      <span className="text-purple-700 font-semibold">
                        • Narasumber: {activeSheetEvt.pembicara}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="font-bold text-slate-700">
                    Menampilkan Rekapitulasi Real-Time Seluruh Event ({filteredSheetRows.length} Baris Evaluasi)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
                <a
                  href={getDirectGoogleSheetUrl(activeSheetEvt)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    handleCopyDataForGoogleSheets(
                      filteredSheetRows,
                      activeSheetEvt ? activeSheetEvt.judul : 'Semua Event MenDAKI'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Klik untuk membuka link Google Sheet di tab baru"
                >
                  <Link2 size={12} />
                  <span className="underline">
                    Link Google Sheet: {getDirectGoogleSheetUrl(activeSheetEvt)}
                  </span>
                  <ExternalLink size={11} />
                </a>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold">
                  Total Responden: <strong className="text-emerald-700">{filteredSheetRows.length}</strong>
                </span>
                {avgSheetRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-black">
                    <Star size={12} className="fill-amber-400 text-amber-500" />
                    <span>{avgSheetRating} / 5</span>
                  </span>
                )}
                {activeSheetEvt && onNavigateToMendaki && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToMendaki({
                        eventId: activeSheetEvt.id,
                        judul: activeSheetEvt.judul,
                        kategori: activeSheetEvt.kategori,
                        mode: 'isi-form',
                      })
                    }
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Isi Evaluasi Event Ini</span>
                  </button>
                )}
              </div>
            </div>

            {/* Real-Time Google Sheet Grid (Ke Samping) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[1600px]">
                <thead>
                  {/* Spreadsheet Column Letters (A - M) */}
                  <tr className="bg-slate-100 text-slate-400 font-mono text-[10px] text-center border-b border-slate-300 select-none">
                    <th className="py-1 px-2 border-r border-slate-300 w-10 sticky left-0 bg-slate-100 z-10">#</th>
                    <th className="py-1 px-2 border-r border-slate-300">A</th>
                    <th className="py-1 px-2 border-r border-slate-300">B</th>
                    <th className="py-1 px-2 border-r border-slate-300">C</th>
                    <th className="py-1 px-2 border-r border-slate-300">D</th>
                    <th className="py-1 px-2 border-r border-slate-300">E</th>
                    <th className="py-1 px-2 border-r border-slate-300">F</th>
                    <th className="py-1 px-2 border-r border-slate-300">G</th>
                    <th className="py-1 px-2 border-r border-slate-300">H</th>
                    <th className="py-1 px-2 border-r border-slate-300">I</th>
                    <th className="py-1 px-2 border-r border-slate-300">J</th>
                    <th className="py-1 px-2 border-r border-slate-300">K</th>
                    <th className="py-1 px-2">L</th>
                  </tr>
                  {/* Column Titles */}
                  <tr className="bg-[#f8fafc] text-slate-800 font-extrabold text-[11px] border-b-2 border-emerald-600">
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center w-10 sticky left-0 bg-[#f8fafc] z-10">No</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[110px]">Waktu Isi</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[165px]">Email</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[145px]">Nama</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[155px]">Nama Sekolah</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[175px]">Event / Kegiatan</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[185px]">Tema / Topik</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-rose-50 text-rose-900">Drop</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-sky-50 text-sky-900">Add</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-emerald-50 text-emerald-900">Keep</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-amber-50 text-amber-900">Improve</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 min-w-[210px] bg-purple-50 text-purple-900">Hal yang anda sukai dari Kegiatan ini?</th>
                    <th className="py-2.5 px-3 text-center min-w-[110px]">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredSheetRows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-slate-400 italic">
                        Belum ada data evaluasi MenDAKI yang masuk untuk event ini.
                      </td>
                    </tr>
                  ) : (
                    filteredSheetRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="hover:bg-emerald-50/40 transition align-top odd:bg-white even:bg-slate-50/40"
                      >
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-400 bg-slate-50 sticky left-0 z-10">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                          {row.tanggalIsi || '-'}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 break-all">
                          {row.email}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                          {row.nama}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                            {row.namaSekolah}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-indigo-800">
                          {row.eventKegiatan || row.kategoriEvent}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                          {row.temaTopik}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-rose-50/15 leading-relaxed">
                          {row.drop}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-sky-50/15 leading-relaxed">
                          {row.add}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-emerald-50/15 leading-relaxed">
                          {row.keep}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-amber-50/15 leading-relaxed">
                          {row.improve}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 bg-purple-50/15 leading-relaxed font-medium">
                          {row.halDisukai}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-black">
                            <Star size={11} className="fill-amber-400 text-amber-500" />
                            <span>{row.rating}/5</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* MODAL POPUP: GOOGLE SHEET REAL-TIME KHUSUS EVENT TERPILIH */}
      {modalSheetEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full overflow-hidden border border-emerald-200 flex flex-col max-h-[92vh]">
            {(() => {
              const evtStats = getEventMendakiStats(modalSheetEvent);
              const modalRows = evtStats.submissions;
              return (
                <>
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-[#0f9d58] via-emerald-700 to-teal-800 px-5 py-4 text-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-white truncate">
                            Google Sheet Real-Time MenDAKI — {modalSheetEvent.judul}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                            <span>LIVE</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-100 truncate">
                          Kategori: {modalSheetEvent.kategori} • Tanggal: {modalSheetEvent.tanggal} • Total Evaluasi: {modalRows.length} Responden
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getDirectGoogleSheetUrl(modalSheetEvent)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          handleCopyDataForGoogleSheets(modalRows, modalSheetEvent.judul)
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Klik untuk membuka langsung di Google Sheets"
                      >
                        <FileSpreadsheet size={13} />
                        <span>Buka di Google Sheets</span>
                        <ExternalLink size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => exportEventSheetToCsv(modalRows, modalSheetEvent.judul)}
                        className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Unduh CSV</span>
                      </button>
                      {onNavigateToMendaki && (
                        <button
                          type="button"
                          onClick={() => {
                            const target = modalSheetEvent;
                            setModalSheetEvent(null);
                            onNavigateToMendaki({
                              eventId: target.id,
                              judul: target.judul,
                              kategori: target.kategori,
                              mode: 'isi-form',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ClipboardCheck size={13} />
                          <span className="hidden sm:inline">Isi Evaluasi</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setModalSheetEvent(null)}
                        className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Spreadsheet Body */}
                  <div className="overflow-auto flex-1">
                    <table className="w-full border-collapse text-left text-xs min-w-[1550px]">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-100 text-slate-400 font-mono text-[10px] text-center border-b border-slate-300">
                          <th className="py-1 px-2 border-r border-slate-300 w-10">#</th>
                          <th className="py-1 px-2 border-r border-slate-300">A</th>
                          <th className="py-1 px-2 border-r border-slate-300">B</th>
                          <th className="py-1 px-2 border-r border-slate-300">C</th>
                          <th className="py-1 px-2 border-r border-slate-300">D</th>
                          <th className="py-1 px-2 border-r border-slate-300">E</th>
                          <th className="py-1 px-2 border-r border-slate-300">F</th>
                          <th className="py-1 px-2 border-r border-slate-300">G</th>
                          <th className="py-1 px-2 border-r border-slate-300">H</th>
                          <th className="py-1 px-2 border-r border-slate-300">I</th>
                          <th className="py-1 px-2 border-r border-slate-300">J</th>
                          <th className="py-1 px-2 border-r border-slate-300">K</th>
                          <th className="py-1 px-2">L</th>
                        </tr>
                        <tr className="bg-[#f8fafc] text-slate-800 font-extrabold text-[11px] border-b-2 border-emerald-600">
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-10">No</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[110px]">Waktu Isi</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[165px]">Email</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[145px]">Nama</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[155px]">Nama Sekolah</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[175px]">Event / Kegiatan</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[185px]">Tema / Topik</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-rose-50 text-rose-900">Drop</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-sky-50 text-sky-900">Add</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-emerald-50 text-emerald-900">Keep</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[195px] bg-amber-50 text-amber-900">Improve</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 min-w-[210px] bg-purple-50 text-purple-900">Hal yang anda sukai dari Kegiatan ini?</th>
                          <th className="py-2.5 px-3 text-center min-w-[100px]">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {modalRows.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="py-12 text-center text-slate-400 italic">
                              Belum ada data evaluasi MenDAKI yang masuk untuk event "{modalSheetEvent.judul}".
                            </td>
                          </tr>
                        ) : (
                          modalRows.map((row, idx) => (
                            <tr
                              key={row.id}
                              className="hover:bg-emerald-50/40 transition align-top odd:bg-white even:bg-slate-50/40"
                            >
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-400 bg-slate-50">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                                {row.tanggalIsi || '-'}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 break-all">
                                {row.email}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                                {row.nama}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200">
                                <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                                  {row.namaSekolah}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-indigo-800">
                                {row.eventKegiatan || row.kategoriEvent}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                                {row.temaTopik}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-rose-50/15 leading-relaxed">
                                {row.drop}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-sky-50/15 leading-relaxed">
                                {row.add}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-emerald-50/15 leading-relaxed">
                                {row.keep}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 bg-amber-50/15 leading-relaxed">
                                {row.improve}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 bg-purple-50/15 leading-relaxed font-medium">
                                {row.halDisukai}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-black">
                                  <Star size={11} className="fill-amber-400 text-amber-500" />
                                  <span>{row.rating}/5</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" />
                <span>{editingEvent ? 'Edit Agenda Event & Flyer' : 'Tambah Agenda Event Baru'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 mt-4 text-xs">
              {/* Judul Kegiatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Kegiatan / Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Judul kegiatan atau agenda event"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Upload Foto Flyer */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-blue-600" />
                    <span>Foto Flyer Event (Potrait)</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFlyerInputMode('upload')}
                      className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                        flyerInputMode === 'upload' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlyerInputMode('url')}
                      className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                        flyerInputMode === 'url' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Link URL
                    </button>
                  </div>
                </div>

                {flyerInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1"
                    >
                      <Upload size={18} className="text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-700">
                        Klik untuk upload foto flyer potrait (PNG, JPG, WebP - maks 3 MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={formFlyerUrl}
                      onChange={(e) => setFormFlyerUrl(e.target.value)}
                      placeholder="https://... (URL gambar flyer potrait)"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                    />
                  </div>
                )}

                {/* Pratinjau Foto Flyer Potrait jika ada */}
                {formFlyerUrl && (
                  <div className="relative mt-2 mx-auto w-44 aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs flex items-center justify-center">
                    <img 
                      src={formFlyerUrl} 
                      alt="" 
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110"
                    />
                    <img 
                      src={formFlyerUrl} 
                      alt="Pratinjau Flyer Potrait" 
                      className="relative z-10 w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormFlyerUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 z-20 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-sm cursor-pointer"
                      title="Hapus foto flyer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Nama Pembicara */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mic size={14} className="text-purple-600" />
                  <span>Nama Pembicara / Narasumber</span>
                </label>
                <input
                  type="text"
                  value={formPembicara}
                  onChange={(e) => setFormPembicara(e.target.value)}
                  placeholder="Nama pembicara atau narasumber"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Link Registrasi Form */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Link2 size={14} className="text-blue-600" />
                  <span>Link Registrasi / Formulir Pendaftaran (Google Form / Link Mitra)</span>
                </label>
                <input
                  type="text"
                  value={formLinkRegistrasi}
                  onChange={(e) => setFormLinkRegistrasi(e.target.value)}
                  placeholder="https://forms.gle/... atau tautan formulir pendaftaran"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Sekolah mitra akan langsung diarahkan ke tautan formulir ini saat mengklik tombol registrasi.
                </p>
              </div>

              {/* Link Google Sheet MenDAKI */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  <span>Link Google Sheet Evaluasi MenDAKI (Bisa Diklik Langsung ke Google Sheets)</span>
                </label>
                <input
                  type="text"
                  value={formLinkGoogleSheet}
                  onChange={(e) => setFormLinkGoogleSheet(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/... atau https://docs.google.com/spreadsheets/create"
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Saat link ini diklik pada kartu event atau tabel, halaman Google Sheets akan langsung terbuka di tab baru dan data evaluasi otomatis disalin.
                </p>
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-2 gap-3">
                {/* Kategori Event with Add & Manage Actions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Tag size={13} className="text-blue-600" />
                      <span>Kategori Event</span>
                    </label>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsInlineAddingCat(prev => !prev)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>Tambah</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setIsManageCatOpen(true)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                          title="Kelola & Hapus Kategori"
                        >
                          Kelola
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Quick Add Input */}
                  {isInlineAddingCat && (
                    <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="Nama kategori baru..."
                        className="flex-1 px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory(newCatInput, 'inline');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategory(newCatInput, 'inline')}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInlineAddingCat(false);
                          setNewCatInput('');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Status Kegiatan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kegiatan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EventStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Direncanakan">Direncanakan</option>
                    <option value="Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    required
                    value={formWaktu}
                    onChange={(e) => setFormWaktu(e.target.value)}
                    placeholder="Waktu pelaksanaan"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi / Tautan Zoom</label>
                <input
                  type="text"
                  required
                  value={formLokasi}
                  onChange={(e) => setFormLokasi(e.target.value)}
                  placeholder="Lokasi kegiatan atau link Zoom"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* PIC & Mitra Sasaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIC (Penanggung Jawab)</label>
                  <input
                    type="text"
                    required
                    value={formPic}
                    onChange={(e) => setFormPic(e.target.value)}
                    placeholder="Nama penanggung jawab (PIC)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mitra Sasaran</label>
                  <input
                    type="text"
                    required
                    value={formMitra}
                    onChange={(e) => setFormMitra(e.target.value)}
                    placeholder="Sasaran peserta sekolah mitra"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Rincian Agenda</label>
                <textarea
                  rows={2}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Deskripsi dan rincian agenda kegiatan"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Tombol Simpan / Batal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {editingEvent ? 'Simpan Pembaruan Event' : 'Simpan Event Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kelola Kategori Event (Tambah & Hapus Kategori) */}
      {isManageCatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag size={17} className="text-blue-600" />
                <span>Kelola Kategori Agenda Event</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsManageCatOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Form Tambah Kategori Baru */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                <label className="font-bold text-blue-950 block">Tambah Kategori Baru</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manageNewCatInput}
                    onChange={(e) => setManageNewCatInput(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory(manageNewCatInput, 'modal');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory(manageNewCatInput, 'modal')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Daftar Kategori Aktif */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">Daftar Kategori ({categories.length})</span>
                  <span className="text-[11px] text-slate-400">Klik ikon tempat sampah untuk menghapus</span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {categories.map((cat, idx) => {
                    const count = eventList.filter(e => e.kategori === cat).length;
                    return (
                      <div 
                        key={cat}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400 w-4 text-center">{idx + 1}.</span>
                          <span className="font-semibold text-slate-800">{cat}</span>
                          {count > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {count} event
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title={`Hapus kategori "${cat}"`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsManageCatOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Preview Foto Flyer Potrait (Lightbox) */}
      {previewFlyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="pr-2">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{previewFlyer.judul}</h3>
                {previewFlyer.pembicara && (
                  <p className="text-xs text-purple-700 font-medium line-clamp-1">Narasumber: {previewFlyer.pembicara}</p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setPreviewFlyer(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-xl cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative p-3 bg-slate-950 flex items-center justify-center overflow-auto flex-1">
              <div className="relative w-full aspect-[3/4] max-h-[70vh] flex items-center justify-center overflow-hidden rounded-xl">
                <img 
                  src={previewFlyer.url} 
                  alt="" 
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
                />
                <img 
                  src={previewFlyer.url} 
                  alt={`Flyer ${previewFlyer.judul}`}
                  className="relative z-10 w-full h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Flyer Kegiatan (Potrait)</span>
              <div className="flex items-center gap-2">
                {previewFlyer.linkRegistrasi && (
                  <a
                    href={previewFlyer.linkRegistrasi}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Link2 size={14} />
                    <span>Buka Link Registrasi</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFlyer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteEvent(deleteTarget.id);
          }
        }}
        title="Hapus Agenda Event"
        message="Apakah Anda yakin ingin menghapus agenda event ini dari Firestore? Tindakan ini tidak dapat dibatalkan."
        itemName={deleteTarget ? `${deleteTarget.judul} (${deleteTarget.tanggal})` : ''}
        confirmLabel="Hapus Event"
      />
    </div>
  );
};
