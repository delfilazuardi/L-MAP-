import React, { useState } from 'react';
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
  GraduationCap,
  Copy,
  Check,
  BookOpen,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { EventItem, EventKategori, EventStatus } from '../../types';

export const LAZUARDI_CLASSROOM_URL = 'https://classroom.google.com/c/NjkxOTI2Nzk4ODY5?cjc=ljp5l3k';
export const LAZUARDI_CLASSROOM_CODE = 'ljp5l3k';

export const EventTrackerView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { eventList, addEvent } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState<EventKategori>('Workshop Kurikulum');
  const [formTanggal, setFormTanggal] = useState('2026-10-15');
  const [formWaktu, setFormWaktu] = useState('09:00 - 12:00 WIB');
  const [formLokasi, setFormLokasi] = useState('Auditorium Lazuardi Pusat / Hybrid Zoom');
  const [formPic, setFormPic] = useState('Anita Sulastri');
  const [formMitra, setFormMitra] = useState('Semua Sekolah Mitra');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formClassroomUrl, setFormClassroomUrl] = useState(LAZUARDI_CLASSROOM_URL);
  const [formClassCode, setFormClassCode] = useState(LAZUARDI_CLASSROOM_CODE);

  const filtered = eventList.filter(evt => {
    const matchSearch = evt.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.pic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = selectedKategori === 'ALL' || evt.kategori === selectedKategori;
    return matchSearch && matchKategori;
  });

  const handleCopyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEvent({
      judul: formJudul,
      kategori: formKategori,
      tanggal: formTanggal,
      waktu: formWaktu,
      lokasi: formLokasi,
      pic: formPic,
      mitraPeserta: formMitra,
      status: 'Direncanakan',
      deskripsi: formDeskripsi,
      classroomUrl: formClassroomUrl.trim() || LAZUARDI_CLASSROOM_URL,
      classCode: formClassCode.trim() || LAZUARDI_CLASSROOM_CODE,
    });
    setIsModalOpen(false);
    setFormJudul('');
    setFormDeskripsi('');
    setFormClassroomUrl(LAZUARDI_CLASSROOM_URL);
    setFormClassCode(LAZUARDI_CLASSROOM_CODE);
  };

  /**
   * Generates a direct Google Calendar add event URL
   */
  const generateGoogleCalendarUrl = (item: EventItem) => {
    const classroomLink = item.classroomUrl && item.classroomUrl !== 'https://classroom.google.com'
      ? item.classroomUrl
      : LAZUARDI_CLASSROOM_URL;
    const code = item.classCode || LAZUARDI_CLASSROOM_CODE;

    const title = encodeURIComponent(`[L-MAP] ${item.judul}`);
    const details = encodeURIComponent(
      `${item.deskripsi}\n\nPIC: ${item.pic}\nPeserta: ${item.mitraPeserta}\nLokasi: ${item.lokasi}\nGoogle Classroom: ${classroomLink} (Kode Kelas: ${code})\n\nDisinkronkan via L-MAP Lazuardi.`
    );
    const location = encodeURIComponent(item.lokasi);

    // Format date YYYYMMDD
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
            <span>Event Tracker & Agenda Mitra</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal kegiatan bersama, workshop kurikulum, pelatihan guru, dan kalender pendidikan terpadu
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Pintasan Google Classroom di Header */}
          <a
            id="btn-google-classroom-header"
            href={LAZUARDI_CLASSROOM_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
            title="Buka Langsung Kelas Google Classroom (Kode: ljp5l3k)"
          >
            <GraduationCap size={16} />
            <span>Google Classroom</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800/80 font-mono">
              {LAZUARDI_CLASSROOM_CODE}
            </span>
            <ExternalLink size={12} className="text-emerald-200" />
          </a>

          {isAdmin && (
            <button
              id="btn-tambah-event"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah Agenda Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Pintasan Google Classroom Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-5 text-white shadow-sm border border-emerald-600/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0 text-emerald-100 shadow-inner">
            <GraduationCap size={26} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Google Classroom Kemitraan Lazuardi</span>
              </h3>
              <span className="text-[10px] font-semibold bg-emerald-500/40 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                Google Workspace for Education
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
              Terhubung langsung ke ruang kelas pembelajaran kurikulum MenDAKI, modul pelatihan, supervisi guru, dan arsip materi kemitraan.
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] text-emerald-200 font-medium">Kode Gabung Kelas:</span>
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                <span className="font-mono font-bold text-xs text-amber-300 tracking-wider">
                  {LAZUARDI_CLASSROOM_CODE}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyClassCode(LAZUARDI_CLASSROOM_CODE)}
                  className="p-1 hover:bg-emerald-800/80 rounded text-emerald-200 hover:text-white transition cursor-pointer"
                  title="Salin kode kelas"
                >
                  {copiedCode === LAZUARDI_CLASSROOM_CODE ? (
                    <Check size={12} className="text-emerald-300" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto">
          <a
            id="btn-shortcut-classroom-main"
            href={LAZUARDI_CLASSROOM_URL}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
          >
            <GraduationCap size={16} className="text-emerald-700" />
            <span>Gabung & Buka Google Classroom</span>
            <ExternalLink size={13} className="text-emerald-700" />
          </a>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-event"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul event, lokasi, PIC..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          id="filter-kategori-event"
          value={selectedKategori}
          onChange={(e) => setSelectedKategori(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Kategori Event</option>
          <option value="Workshop Kurikulum">Workshop Kurikulum</option>
          <option value="Pelatihan Guru">Pelatihan Guru</option>
          <option value="Koordinasi Pimpinan">Koordinasi Pimpinan</option>
          <option value="Supervisi Mutu">Supervisi Mutu</option>
          <option value="Parenting">Parenting</option>
          <option value="Lomba Siswa">Lomba Siswa</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Belum ada agenda event yang sesuai.</p>
          </div>
        ) : (
          filtered.map(evt => (
            <div 
              key={evt.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {evt.kategori}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({evt.id})</span>
                  </div>
                  {getStatusPill(evt.status)}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">
                  {evt.judul}
                </h3>

                <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                  {evt.deskripsi}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock size={14} className="text-blue-600 shrink-0" />
                    <span>{evt.tanggal} • {evt.waktu}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate">{evt.lokasi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-indigo-600 shrink-0" />
                    <span className="truncate">Peserta: <strong className="text-slate-800">{evt.mitraPeserta}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span>Penanggung Jawab (PIC): <strong className="text-slate-800">{evt.pic}</strong></span>
                  </div>
                </div>

                {/* Info Kode Kelas Google Classroom jika ada */}
                {evt.classCode && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50/70 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl mb-3">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-emerald-700 shrink-0" />
                      <span className="text-[11px]">Kode Google Classroom:</span>
                      <strong className="font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-emerald-300 text-emerald-800">
                        {evt.classCode}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyClassCode(evt.classCode!)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 transition cursor-pointer"
                      title="Salin Kode Kelas"
                    >
                      {copiedCode === evt.classCode ? (
                        <>
                          <Check size={11} className="text-emerald-700" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons: Google Classroom & Google Calendar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Tersinkronisasi Google Workspace</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Pintasan Google Classroom */}
                  <a
                    href={evt.classroomUrl || LAZUARDI_CLASSROOM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Buka materi & tugas event di Google Classroom"
                  >
                    <GraduationCap size={14} className="text-emerald-700" />
                    <span>Google Classroom</span>
                    <ExternalLink size={11} className="text-emerald-600" />
                  </a>

                  {/* Tambah ke Google Calendar */}
                  <a
                    href={generateGoogleCalendarUrl(evt)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="Tambahkan jadwal ke Google Calendar"
                  >
                    <CalendarIcon size={14} />
                    <span>Google Calendar</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Tambah Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" />
                <span>Tambah Agenda Event Mitra</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan / Event</label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Misal: Workshop Kurikulum Inklusi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Event</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as EventKategori)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Workshop Kurikulum">Workshop Kurikulum</option>
                    <option value="Pelatihan Guru">Pelatihan Guru</option>
                    <option value="Koordinasi Pimpinan">Koordinasi Pimpinan</option>
                    <option value="Supervisi Mutu">Supervisi Mutu</option>
                    <option value="Parenting">Parenting</option>
                    <option value="Lomba Siswa">Lomba Siswa</option>
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="text"
                    required
                    value={formWaktu}
                    onChange={(e) => setFormWaktu(e.target.value)}
                    placeholder="08:30 - 15:00 WIB"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIC (Penanggung Jawab)</label>
                  <input
                    type="text"
                    required
                    value={formPic}
                    onChange={(e) => setFormPic(e.target.value)}
                    placeholder="Nama PIC"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi / Tautan Zoom</label>
                <input
                  type="text"
                  required
                  value={formLokasi}
                  onChange={(e) => setFormLokasi(e.target.value)}
                  placeholder="Ruang Serbaguna / Link Zoom"
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
                  placeholder="Semua Sekolah Mitra / Al-Falah Depok..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Integrasi Google Classroom */}
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <GraduationCap size={15} className="text-emerald-700" />
                  <span>Integrasi Google Classroom (Pintasan Materi)</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tautan Google Classroom (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formClassroomUrl}
                    onChange={(e) => setFormClassroomUrl(e.target.value)}
                    placeholder="https://classroom.google.com atau link kelas"
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kode Kelas Google Classroom (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formClassCode}
                    onChange={(e) => setFormClassCode(e.target.value)}
                    placeholder="Contoh: mndk-2026 atau abc-xyz"
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Agenda</label>
                <textarea
                  rows={2}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Detail rencana kegiatan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

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
                  Simpan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
