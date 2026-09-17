import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Clock, 
  ExternalLink,
  Download,
  Copy,
  ArrowUpDown,
  Target,
  Hash,
  Edit3,
  Trash2
} from 'lucide-react';
import { StaffActivity, AdminMitraStaff, DEFAULT_KPI_PROGRAMS } from '../../../types';

interface GoogleSheetTableProps {
  tasks: StaffActivity[];
  adminStaffList: AdminMitraStaff[];
  selectedStaffFilter: string;
  onSelectStaffFilter: (name: string) => void;
  onAddTask: () => void;
  onEditTask: (task: StaffActivity) => void;
  onDeleteTask: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: StaffActivity['status']) => void;
  getGoogleCalendarUrl: (task: StaffActivity) => string;
}

export const GoogleSheetTable: React.FC<GoogleSheetTableProps> = ({
  tasks,
  adminStaffList,
  selectedStaffFilter,
  onSelectStaffFilter,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
  getGoogleCalendarUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [activeRowId, setActiveRowId] = useState<string | null>(tasks[0]?.id || null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Available unique programs from data + defaults
  const allAvailablePrograms = Array.from(
    new Set([
      ...DEFAULT_KPI_PROGRAMS,
      ...tasks.map(t => t.programKpi).filter(Boolean) as string[]
    ])
  );

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const taskName = t.tugas || t.judulAktivitas || '';
    const pic = t.namaStaff || '';
    const program = t.programKpi || '';
    const noKpi = t.noKpi || '';
    const penjelasan = t.penjelasanKpi || '';
    const matchSearch =
      taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.toLowerCase().includes(searchQuery.toLowerCase()) ||
      noKpi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      penjelasan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStaff = selectedStaffFilter === 'ALL' || t.namaStaff === selectedStaffFilter;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchProgram = programFilter === 'ALL' || t.programKpi === programFilter;
    return matchSearch && matchStaff && matchStatus && matchProgram;
  });

  const activeTask = tasks.find((t) => t.id === activeRowId) || filteredTasks[0] || tasks[0];

  const getUrgencyClass = (deadlineStr?: string, status?: string) => {
    if (status === 'Selesai') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (!deadlineStr) return 'bg-slate-50 text-slate-600 border-slate-200';
    
    const today = new Date().toISOString().split('T')[0];
    if (deadlineStr < today) {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
    }
    if (deadlineStr === today) {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-500 text-white font-bold';
      case 'Sedang Berjalan':
        return 'bg-blue-600 text-white font-medium';
      case 'Belum Dimulai':
        return 'bg-amber-500 text-white font-medium';
      case 'Tertunda':
      case 'Dibatalkan':
        return 'bg-rose-500 text-white font-medium';
      default:
        return 'bg-slate-600 text-white font-medium';
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'No. KPI',
      'Sasaran Program KPI',
      'Penjelasan KPI',
      'Tugas / Pekerjaan',
      'PIC Admin Mitra Office',
      'Tahun Ajaran',
      'Date Mulai',
      'Deadline',
      'Status',
      'Bobot KPI (Poin)',
      'Catatan Hasil',
      'Rencana Tindak Lanjut'
    ];
    const rows = filteredTasks.map((t, idx) => [
      idx + 1,
      `"${(t.noKpi || '-').replace(/"/g, '""')}"`,
      `"${(t.programKpi || '-').replace(/"/g, '""')}"`,
      `"${(t.penjelasanKpi || '-').replace(/"/g, '""')}"`,
      `"${(t.tugas || t.judulAktivitas || '').replace(/"/g, '""')}"`,
      `"${t.namaStaff}"`,
      `"${t.tahunAjaran || '2026/2027'}"`,
      t.tanggal,
      t.deadline || '-',
      t.status,
      t.bobotKpi || 20,
      `"${(t.hasilCatatan || t.hasilKegiatan || '-').replace(/"/g, '""')}"`,
      `"${(t.catatanTindakLanjut || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `L-MAP_Pekerjaan_Admin_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTable = () => {
    const textData = filteredTasks.map((t, idx) => 
      `${idx + 1}\t${t.noKpi || '-'}\t${t.programKpi || '-'}\t${t.penjelasanKpi || '-'}\t${t.tugas || t.judulAktivitas}\t${t.namaStaff}\t${t.tanggal}\t${t.deadline || '-'}\t${t.status}\t${t.bobotKpi || 20}`
    ).join('\n');
    navigator.clipboard.writeText(`No\tNo. KPI\tSasaran Program KPI\tPenjelasan KPI\tTugas\tPIC Admin\tDate\tDeadline\tStatus\tBobot KPI\n${textData}`);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* 1. Google Sheets App Header Bar */}
      <div className="bg-[#f8fafd] border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F9D58] text-white flex items-center justify-center font-bold shadow-xs">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                Log_Pekerjaan_Admin_Mitra_Office
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                .gsheet / table
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tersinkronisasi otomatis dengan Dashboard KPI Program & Google Calendar
            </p>
          </div>
        </div>

        {/* Action Controls in Sheets Header */}
        <div className="flex items-center gap-2">
          {copiedNotification && (
            <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in">
              ✓ Data disalin ke Clipboard
            </span>
          )}
          <button
            onClick={handleCopyTable}
            title="Salin data tabel ke clipboard (bisa langsung paste ke Google Sheets)"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <Copy size={13} />
            <span className="hidden sm:inline">Salin Format Sheet</span>
          </button>
          <button
            onClick={handleExportCSV}
            title="Unduh file CSV kompatibel Google Sheets & Microsoft Excel"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer flex items-center gap-1 text-xs"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            id="btn-add-sheet-row"
            onClick={onAddTask}
            className="px-3.5 py-1.5 rounded-lg bg-[#0F9D58] hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} />
            <span>Tambah Baris Tugas</span>
          </button>
        </div>
      </div>

      {/* 2. Formula / Filter Bar (fx) */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-slate-500 font-bold px-2 py-1 bg-white border border-slate-200 rounded-md shrink-0">
          <span className="text-emerald-700 font-black">fx</span>
          <span className="text-[11px] text-slate-400">|</span>
          <span className="text-slate-800 text-[11px] truncate max-w-[200px] sm:max-w-xs">
            {activeTask ? (activeTask.tugas || activeTask.judulAktivitas) : 'Pilih sel/baris...'}
          </span>
        </div>

        {/* Quick Filter Controls */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari di sheet..."
              className="pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 w-32 sm:w-40"
            />
          </div>

          <select
            value={selectedStaffFilter}
            onChange={(e) => onSelectStaffFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Semua Admin PIC</option>
            {adminStaffList.map((st) => (
              <option key={st.id} value={st.nama}>
                {st.nama}
              </option>
            ))}
          </select>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 max-w-[170px] truncate"
          >
            <option value="ALL">Semua Program KPI</option>
            {allAvailablePrograms.map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Sedang Berjalan">Sedang Berjalan</option>
            <option value="Belum Dimulai">Belum Dimulai</option>
            <option value="Tertunda">Tertunda</option>
          </select>
        </div>
      </div>

      {/* 3. The Spreadsheet Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-[#f1f3f4] text-slate-700 font-semibold border-b border-slate-300 select-none">
              <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center text-slate-500 font-mono">
                No
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 w-24 text-center">
                <div className="flex items-center justify-center gap-1 font-mono text-emerald-800">
                  <Hash size={11} />
                  <span>No. KPI</span>
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[190px]">
                <div className="flex items-center gap-1 text-emerald-950">
                  <Target size={12} className="text-emerald-600" />
                  <span>Sasaran Program KPI</span>
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[210px]">
                <div className="flex items-center gap-1">
                  <span>Penjelasan KPI</span>
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[230px]">
                <div className="flex items-center gap-1">
                  <span>Tugas / Pekerjaan</span>
                  <ArrowUpDown size={11} className="text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">
                PIC Admin Mitra Office
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 w-28 text-center">
                Date (Mulai)
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 w-32 text-center">
                Deadline
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 w-32 text-center">
                Status
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 w-24 text-center">
                Bobot KPI
              </th>
              <th className="py-2.5 px-3 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet size={32} className="text-slate-300" />
                    <p className="font-medium">Tidak ada baris tugas yang cocok dengan filter sheet.</p>
                    <button
                      onClick={onAddTask}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      + Tambah Baris Baru
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((item, index) => {
                const isActive = activeRowId === item.id;
                const urgencyStyle = getUrgencyClass(item.deadline, item.status);
                return (
                  <tr
                    key={item.id}
                    onClick={() => setActiveRowId(item.id)}
                    onDoubleClick={() => onEditTask(item)}
                    className={`transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50/70 ring-1 ring-inset ring-emerald-500'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Row Index */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-400 text-[11px] bg-slate-50/40">
                      {index + 1}
                    </td>

                    {/* No. KPI */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                      {item.noKpi && item.noKpi !== '-' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono font-bold text-[11px] border border-emerald-300">
                          {item.noKpi}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(item);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-dashed border-amber-300 font-bold text-[10px] cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="Tautkan KPI ke tugas ini"
                        >
                          <Plus size={10} />
                          <span>+ KPI</span>
                        </button>
                      )}
                    </td>

                    {/* Sasaran Program KPI (Khusus Program Saja) */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                      {item.standarKpi || (item.noKpi && item.noKpi !== '-') ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 leading-snug">
                              {item.programKpi || 'Supervisi & Pendampingan Kurikulum/MenDAKI'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(item);
                              }}
                              className="text-[9px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer shrink-0"
                              title="Edit atau ganti KPI"
                            >
                              Edit KPI
                            </button>
                          </div>
                          {item.standarKpi && (
                            <span className="text-[10px] text-indigo-700 font-semibold truncate max-w-[200px]" title={item.standarKpi}>
                              {item.standarKpi}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 italic">Belum ada KPI</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(item);
                            }}
                            className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                          >
                            <Plus size={10} />
                            <span>Tautkan KPI</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Penjelasan KPI */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600">
                      <span
                        className="text-[11px] leading-relaxed line-clamp-2"
                        title={item.penjelasanKpi || 'Belum ada penjelasan KPI'}
                      >
                        {item.penjelasanKpi || '-'}
                      </span>
                    </td>

                    {/* Task Title & Details */}
                    <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs leading-snug text-slate-900">
                          {item.tugas || item.judulAktivitas || 'Tugas Tanpa Judul'}
                        </span>
                        {(item.hasilCatatan || item.hasilKegiatan) && (
                          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.hasilCatatan || item.hasilKegiatan}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PIC Admin */}
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {item.namaStaff ? item.namaStaff.charAt(0) : 'A'}
                        </div>
                        <span className="font-medium text-slate-800 text-xs">
                          {item.namaStaff}
                        </span>
                      </div>
                    </td>

                    {/* Date (Tanggal Mulai/Input) */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-600 text-[11px]">
                      {item.tanggal}
                    </td>

                    {/* Deadline */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border ${urgencyStyle}`}
                      >
                        <Clock size={11} />
                        <span>{item.deadline || '-'}</span>
                      </span>
                    </td>

                    {/* Status with Quick Toggle Dropdown */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateStatus(item.id, e.target.value as StaffActivity['status'])}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold border-0 cursor-pointer shadow-xs focus:ring-1 focus:ring-emerald-500 ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        <option value="Sedang Berjalan" className="bg-white text-slate-800">
                          Sedang Berjalan
                        </option>
                        <option value="Selesai" className="bg-white text-slate-800">
                          Selesai
                        </option>
                        <option value="Belum Dimulai" className="bg-white text-slate-800">
                          Belum Dimulai
                        </option>
                        <option value="Tertunda" className="bg-white text-slate-800">
                          Tertunda
                        </option>
                      </select>
                    </td>

                    {/* Bobot KPI */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-700 text-xs">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-mono text-[11px] font-bold">
                          {item.bobotKpi || 20} pts
                        </span>
                        {item.tahapanDipilih && item.tahapanDipilih.length > 0 && (
                          <span className="text-[9px] text-emerald-700 font-sans font-semibold">
                            {item.tahapanDipilih.length} tahapan
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(item);
                          }}
                          title="Edit baris tugas (No KPI, PIC, Program, Deadline, dll.)"
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <a
                          href={getGoogleCalendarUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Sinkronkan ke Google Calendar"
                          className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(item.id);
                          }}
                          title="Hapus baris tugas"
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Active Row Details Quick-Inspector Bar */}
      {activeTask && (
        <div className="bg-[#f8fafd] border-t border-slate-200 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {activeTask.noKpi && activeTask.noKpi !== '-' ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-700 text-white font-mono font-bold">
                  {activeTask.noKpi}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-white font-mono font-bold">
                  Belum Ada KPI
                </span>
              )}

              <span className="font-bold text-slate-900 text-xs">
                {activeTask.tugas || activeTask.judulAktivitas}
              </span>

              {activeTask.standarKpi ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Program: {activeTask.programKpi || 'Supervisi & Pendampingan Kurikulum/MenDAKI'}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                  Program: {activeTask.programKpi || 'Operasional'}
                </span>
              )}

              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                PIC: {activeTask.namaStaff}
              </span>

              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                Bobot: {activeTask.bobotKpi || 20} Poin
              </span>
            </div>

            {activeTask.standarKpi ? (
              <p className="text-[11px] text-emerald-900 bg-emerald-50/60 p-1.5 rounded-md border border-emerald-100">
                <strong>Standar & KPI:</strong> {activeTask.standarKpi}
                {activeTask.penjelasanKpi && (
                  <span className="block text-slate-600 text-[10px] mt-0.5">
                    {activeTask.penjelasanKpi}
                  </span>
                )}
              </p>
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-md bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
                <span>Tugas ini belum ditautkan ke 15 Standar KPI.</span>
                <button
                  onClick={() => onEditTask(activeTask)}
                  className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                >
                  Tautkan KPI Sekarang &rarr;
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-600">
              <strong className="text-slate-700">Hasil / Progres:</strong>{' '}
              {activeTask.hasilCatatan || activeTask.hasilKegiatan || 'Belum ada catatan progres.'}
              {activeTask.catatanTindakLanjut && (
                <span className="ml-2 text-indigo-700 font-medium">
                  • Follow-up: {activeTask.catatanTindakLanjut}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEditTask(activeTask)}
              className="px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
              title="Edit tugas dan tautkan/ubah KPI"
            >
              <Target size={12} className="text-blue-600" />
              <span>{activeTask.standarKpi ? 'Ubah / Edit KPI' : '+ Tautkan KPI'}</span>
            </button>
            <a
              href={getGoogleCalendarUrl(activeTask)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
            >
              <span>Buka di Google Calendar</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
