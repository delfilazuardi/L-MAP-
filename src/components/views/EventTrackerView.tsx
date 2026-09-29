import React, { useState, useRef, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { EventItem, EventKategori, EventStatus } from '../../types';
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

export const EventTrackerView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { eventList, addEvent, updateEvent, deleteEvent } = useData();

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
  const [flyerInputMode, setFlyerInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = eventList.filter(evt => {
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

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file flyer maksimal 3 MB. Silakan kompres gambar atau gunakan URL eksternal.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormFlyerUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      await updateEvent({
        ...editingEvent,
        judul: formJudul,
        kategori: formKategori,
        tanggal: formTanggal,
        waktu: formWaktu,
        lokasi: formLokasi,
        pic: formPic,
        mitraPeserta: formMitra,
        status: formStatus,
        deskripsi: formDeskripsi,
        pembicara: formPembicara.trim() || undefined,
        flyerUrl: formFlyerUrl.trim() || undefined,
        linkRegistrasi: formLinkRegistrasi.trim() || undefined,
      });
    } else {
      await addEvent({
        judul: formJudul,
        kategori: formKategori,
        tanggal: formTanggal,
        waktu: formWaktu,
        lokasi: formLokasi,
        pic: formPic,
        mitraPeserta: formMitra,
        status: formStatus,
        deskripsi: formDeskripsi,
        pembicara: formPembicara.trim() || undefined,
        flyerUrl: formFlyerUrl.trim() || undefined,
        linkRegistrasi: formLinkRegistrasi.trim() || undefined,
      });
    }
    setIsModalOpen(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Belum ada agenda event yang sesuai pencarian.</p>
          </div>
        ) : (
          filtered.map(evt => (
            <div 
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Event Flyer Banner (jika ada flyerUrl) */}
              {evt.flyerUrl ? (
                <div 
                  onClick={() => setPreviewFlyer({
                    url: evt.flyerUrl!,
                    judul: evt.judul,
                    pembicara: evt.pembicara,
                    linkRegistrasi: evt.linkRegistrasi
                  })}
                  className="relative h-44 w-full bg-slate-900 group cursor-pointer overflow-hidden"
                  title="Klik untuk melihat foto flyer penuh"
                >
                  <img 
                    src={evt.flyerUrl} 
                    alt={`Flyer ${evt.judul}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-blue-600/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                      {evt.kategori}
                    </span>
                    <span className="text-[10px] font-mono text-white/80 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      {evt.id}
                    </span>
                  </div>
                  
                  <div className="absolute top-3 right-3">
                    {getStatusPill(evt.status)}
                  </div>

                  {/* Zoom indicator on hover */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
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
                    <span>Foto Flyer / Banner Event</span>
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
                        Klik untuk upload foto flyer (PNG, JPG, WebP - maks 3 MB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formFlyerUrl}
                      onChange={(e) => setFormFlyerUrl(e.target.value)}
                      placeholder="https://... (URL gambar flyer)"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                    />
                  </div>
                )}

                {/* Pratinjau Foto Flyer jika ada */}
                {formFlyerUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-black/5 max-h-36 flex items-center justify-center">
                    <img 
                      src={formFlyerUrl} 
                      alt="Pratinjau Flyer" 
                      className="max-h-36 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormFlyerUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-sm cursor-pointer"
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
                  type="url"
                  value={formLinkRegistrasi}
                  onChange={(e) => setFormLinkRegistrasi(e.target.value)}
                  placeholder="https://forms.gle/... atau tautan formulir pendaftaran"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Sekolah mitra akan langsung diarahkan ke tautan formulir ini saat mengklik tombol registrasi.
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

      {/* MODAL: Full Preview Foto Flyer (Lightbox) */}
      {previewFlyer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{previewFlyer.judul}</h3>
                {previewFlyer.pembicara && (
                  <p className="text-xs text-purple-700 font-medium">Narasumber: {previewFlyer.pembicara}</p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setPreviewFlyer(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-center overflow-auto flex-1 max-h-[65vh]">
              <img 
                src={previewFlyer.url} 
                alt={`Flyer ${previewFlyer.judul}`}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Pratinjau Foto Flyer Resmi</span>
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
