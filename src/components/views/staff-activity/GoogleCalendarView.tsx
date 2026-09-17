import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Building2, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  X,
  AlertCircle,
  CalendarDays,
  Users,
  Share2,
  Copy,
  Check,
  HelpCircle,
  Info
} from 'lucide-react';
import { StaffActivity, AdminMitraStaff } from '../../../types';

interface GoogleCalendarViewProps {
  tasks: StaffActivity[];
  adminStaffList?: AdminMitraStaff[];
  onSelectTask: (task: StaffActivity) => void;
  onAddTaskOnDate?: (dateStr: string) => void;
  getGoogleCalendarUrl: (task: StaffActivity) => string;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({
  tasks,
  adminStaffList = [],
  onSelectTask,
  onAddTaskOnDate,
  getGoogleCalendarUrl,
}) => {
  // Current view date state (Default to September 2026)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 15)); // Month is 0-indexed (8 = September)
  const [calendarMode, setCalendarMode] = useState<'month' | 'agenda'>('month');
  const [selectedTaskPreview, setSelectedTaskPreview] = useState<StaffActivity | null>(null);
  const [isSyncGuideModalOpen, setIsSyncGuideModalOpen] = useState(false);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [sharedCalendarId, setSharedCalendarId] = useState(() => localStorage.getItem('lmap_shared_calendar_id') || '');
  const [isSavedCalId, setIsSavedCalId] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 15));
  };

  // Compute days for the month grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week index (Monday = 0, Sunday = 6)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const daysInMonth = lastDayOfMonth.getDate();

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${m.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum, isCurrentMonth: false });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Days of next month to fill grid to 35 or 42 cells
  const remainingCells = 35 - calendarCells.length > 0 ? 35 - calendarCells.length : (42 - calendarCells.length);
  for (let d = 1; d <= remainingCells; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  const todayStr = '2026-09-15';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Google Calendar App Top Bar */}
      <div className="bg-[#f8fafd] border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <CalendarDays size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Google Calendar - Timeline & Deadline Pekerjaan
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
                Mitra Office
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Visualisasi timeline tugas, tanggal mulai, dan tenggat deadline PIC
            </p>
          </div>
        </div>

        {/* Calendar Nav Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer text-xs"
          >
            Hari Ini
          </button>

          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white">
            <button
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800 text-xs min-w-[130px] text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setCalendarMode('month')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                calendarMode === 'month'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan
            </button>
            <button
              onClick={() => setCalendarMode('agenda')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                calendarMode === 'agenda'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda Timeline
            </button>
          </div>
        </div>
      </div>

      {/* 2. Multi-Admin Calendar Sync Bar */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-emerald-50/40 border-b border-blue-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
            <Users size={13} />
          </div>
          <span className="font-bold text-slate-800 text-[11px]">
            Sinkronisasi Multi-Admin Google Calendar:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {adminStaffList.map((st) => (
              <span
                key={st.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-blue-200 text-[10px] font-semibold text-blue-900 shadow-2xs"
                title={`${st.nama} (${st.email}) - Otomatis diundang ke Google Calendar`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{st.nama}</span>
                <span className="text-slate-400 font-normal">({st.email})</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSyncGuideModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
          >
            <Share2 size={12} />
            <span>Panduan Kalender Bersama</span>
          </button>
        </div>
      </div>

      {/* 3. Mode: Monthly Google Calendar Grid */}
      {calendarMode === 'month' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className={idx >= 5 ? 'text-rose-500' : ''}>
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 border-b border-slate-200">
              {calendarCells.map((cell, idx) => {
                const isToday = cell.dateStr === todayStr;
                // Find tasks with deadline on this date
                const deadlineTasks = tasks.filter((t) => t.deadline === cell.dateStr);
                // Find tasks with start date on this date
                const startTasks = tasks.filter((t) => t.tanggal === cell.dateStr && t.deadline !== cell.dateStr);

                return (
                  <div
                    key={idx}
                    className={`min-h-[115px] p-1.5 border-r border-b border-slate-200 transition flex flex-col justify-between ${
                      cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                    } ${isToday ? 'bg-blue-50/30' : ''}`}
                  >
                    {/* Top: Date Number & Add Button */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block ${
                          isToday
                            ? 'bg-blue-600 text-white font-bold'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {onAddTaskOnDate && (
                        <button
                          onClick={() => onAddTaskOnDate(cell.dateStr)}
                          title={`Tambah tugas pada tanggal ${cell.dateStr}`}
                          className="opacity-0 hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                        >
                          <Plus size={11} />
                        </button>
                      )}
                    </div>

                    {/* Middle: Event & Deadline Chips */}
                    <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] text-[10px]">
                      {/* Deadline Tasks */}
                      {deadlineTasks.map((t) => {
                        const isDone = t.status === 'Selesai';
                        const isOverdue = !isDone && t.deadline && t.deadline < todayStr;
                        return (
                          <div
                            key={`dl-${t.id}`}
                            onClick={() => setSelectedTaskPreview(t)}
                            title={`Tenggat Deadline: ${t.tugas || t.judulAktivitas} (${t.namaStaff})`}
                            className={`px-1.5 py-0.5 rounded text-left truncate cursor-pointer font-medium flex items-center gap-1 transition ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold hover:bg-rose-200 animate-pulse'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <Clock size={9} className="shrink-0 text-rose-600" />
                            <span className="truncate">
                              DL: {t.tugas || t.judulAktivitas}
                            </span>
                          </div>
                        );
                      })}

                      {/* Start Date Tasks */}
                      {startTasks.map((t) => {
                        const isDone = t.status === 'Selesai';
                        return (
                          <div
                            key={`st-${t.id}`}
                            onClick={() => setSelectedTaskPreview(t)}
                            title={`Mulai: ${t.tugas || t.judulAktivitas} (${t.namaStaff})`}
                            className={`px-1.5 py-0.5 rounded text-left truncate cursor-pointer font-medium flex items-center gap-1 transition ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              {t.tugas || t.judulAktivitas}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 3. Mode: Agenda Timeline List */
        <div className="p-4 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Belum ada tugas terjadwal.</p>
          ) : (
            [...tasks]
              .sort((a, b) => (a.deadline || a.tanggal).localeCompare(b.deadline || b.tanggal))
              .map((t) => {
                const isOverdue = t.status !== 'Selesai' && t.deadline && t.deadline < todayStr;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskPreview(t)}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          t.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <CalendarIcon size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {t.tugas || t.judulAktivitas}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-semibold text-slate-700">PIC: {t.namaStaff}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-800 font-bold px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-[10px]">
                            {t.noKpi || 'KPI-01'}
                          </span>
                          <span>•</span>
                          <span className="text-slate-700">Program: {t.programKpi}</span>
                          <span>•</span>
                          <span>Mulai: {t.tanggal}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-mono">Tenggat Deadline</span>
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full inline-block ${
                            t.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {t.deadline || '-'}
                        </span>
                      </div>

                      <a
                        href={getGoogleCalendarUrl(t)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>Sinkronkan</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* 4. Legend Footer */}
      <div className="bg-[#f8fafd] border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-4 text-[11px] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Tenggat Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Tanggal Mulai / Timeline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Tugas Selesai</span>
          </div>
        </div>

        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>Buka Aplikasi Google Calendar</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Task Preview Modal */}
      {selectedTaskPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-slate-900">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-300" />
                <h3 className="text-sm font-bold">Detail Timeline Tugas</h3>
              </div>
              <button
                onClick={() => setSelectedTaskPreview(null)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedTaskPreview.tugas || selectedTaskPreview.judulAktivitas}
                </h4>
                <p className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span>Sasaran Program KPI:</span>
                  <span className="font-bold">{selectedTaskPreview.programKpi || 'Supervisi & Pendampingan Kurikulum/MenDAKI'}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">PIC Admin</span>
                  <span className="font-bold text-slate-800">{selectedTaskPreview.namaStaff}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">No. KPI</span>
                  <span className="font-bold text-emerald-800 font-mono text-xs">
                    {selectedTaskPreview.noKpi || 'KPI-01'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tanggal Mulai</span>
                  <span className="font-mono font-medium text-slate-700">{selectedTaskPreview.tanggal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deadline</span>
                  <span className="font-mono font-bold text-rose-600">{selectedTaskPreview.deadline || '-'}</span>
                </div>
              </div>

              {selectedTaskPreview.penjelasanKpi && (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-900 block mb-0.5">Penjelasan KPI:</span>
                  <p className="text-emerald-800 text-xs leading-relaxed">
                    {selectedTaskPreview.penjelasanKpi}
                  </p>
                </div>
              )}

              {(selectedTaskPreview.hasilCatatan || selectedTaskPreview.hasilKegiatan) && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-0.5">Catatan / Progres:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedTaskPreview.hasilCatatan || selectedTaskPreview.hasilKegiatan}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedTaskPreview.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedTaskPreview.status}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={getGoogleCalendarUrl(selectedTaskPreview)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Buka Google Calendar</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {adminStaffList.length > 0 && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900">
                  <Users size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Otomatis Mengundang Seluruh Admin:</span>
                    <p className="text-blue-800 text-[10px] mt-0.5">
                      Tautan di atas otomatis menambahkan {adminStaffList.length} akun email admin ({adminStaffList.map(a => a.email).join(', ')}) sebagai tamu undangan ke Google Calendar.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sync Guide & Shared Calendar Setup Modal */}
      {isSyncGuideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Sinkronisasi Google Calendar Seluruh Admin
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solusi integrasi jadwal real-time untuk seluruh akun email admin Mitra Office
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncGuideModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4 text-xs text-slate-600">
              {/* Method 1: Auto-Invite Guests */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <h4 className="font-bold text-emerald-950 text-xs">
                    Metode 1: Auto-Invite Tamu Undangan (Sudah Aktif di L-MAP)
                  </h4>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                    Aktif
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Setiap kali Anda menekan tombol <strong>&quot;Buka Google Calendar&quot;</strong> pada baris tugas mana pun di tabel ataupun timeline kalender, sistem secara otomatis memasukkan <strong>seluruh email admin</strong> ke parameter tamu undangan (<em>guests</em>).
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-700 block">
                    Daftar Email Admin yang Otomatis Diundang:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {adminStaffList.map((st) => (
                      <span
                        key={st.id}
                        className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono text-[10px] font-semibold border border-emerald-300"
                      >
                        {st.nama}: {st.email}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-emerald-800">
                  Saat Anda klik <strong>Simpan</strong> di Google Calendar dan memilih <strong>&quot;Kirim undangan&quot;</strong>, jadwal tersebut langsung masuk dan tersinkronisasi di Google Calendar seluruh admin secara otomatis!
                </p>
              </div>

              {/* Method 2: Google Workspace Shared Calendar */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <h4 className="font-bold text-blue-950 text-xs">
                    Metode 2: Kalender Bersama Google Workspace (Paling Direkomendasikan)
                  </h4>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold">
                    Direkomendasikan
                  </span>
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Untuk hasil sinkronisasi penuh di mana seluruh admin bisa melihat dan mengupdate jadwal yang sama secara otomatis di Google Calendar (Web, Android, iPhone):
                </p>

                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700">
                  <li>
                    Buka <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-0.5">Google Calendar <ExternalLink size={10} /></a>.
                  </li>
                  <li>
                    Di panel kiri, klik tombol <strong>+</strong> di samping <em>&quot;Kalender lainnya&quot;</em> &rarr; pilih <strong>&quot;Buat kalender baru&quot;</strong> (misal: <em>Agenda Mitra Office Lazuardi</em>).
                  </li>
                  <li>
                    Buka <strong>Setelan dan berbagi</strong> kalender tersebut, gulir ke bagian <strong>&quot;Bagikan dengan orang atau grup tertentu&quot;</strong>.
                  </li>
                  <li>
                    Tambahkan seluruh email admin di bawah ini dengan izin <strong>&quot;Lakukan perubahan pada acara&quot;</strong>.
                  </li>
                </ol>

                {/* Quick Copy All Admin Emails */}
                <div className="pt-1 flex items-center justify-between gap-2 flex-wrap bg-white/80 p-2.5 rounded-xl border border-blue-200">
                  <div className="text-[11px] text-slate-700 font-medium truncate">
                    {adminStaffList.map(a => a.email).join(', ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const emails = adminStaffList.map(a => a.email).join(', ');
                      navigator.clipboard.writeText(emails);
                      setCopiedEmails(true);
                      setTimeout(() => setCopiedEmails(false), 2500);
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    {copiedEmails ? (
                      <>
                        <Check size={12} className="text-emerald-300" />
                        <span>Email Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Salin Seluruh Email Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Shared Calendar ID Linkage (Optional) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Info size={13} className="text-indigo-600" />
                  <span>Simpan ID Kalender Bersama (Opsional)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Jika Anda telah membuat kalender bersama, salin <em>Calendar ID</em> (di Setelan Kalender &rarr; Integrasikan kalender) ke sini untuk akses cepat.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sharedCalendarId}
                    onChange={(e) => {
                      setSharedCalendarId(e.target.value);
                      setIsSavedCalId(false);
                    }}
                    placeholder="contoh: c_xxxx@group.calendar.google.com atau mitra.office@lazuardi.sch.id"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('lmap_shared_calendar_id', sharedCalendarId);
                      setIsSavedCalId(true);
                      setTimeout(() => setIsSavedCalId(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    {isSavedCalId ? 'Tersimpan!' : 'Simpan ID'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1.5 text-xs"
              >
                <span>Buka Google Calendar Web</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={() => setIsSyncGuideModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Mengerti & Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
