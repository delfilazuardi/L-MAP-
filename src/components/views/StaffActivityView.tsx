import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  CalendarDays, 
  FileSpreadsheet, 
  TrendingUp, 
  ExternalLink, 
  Sparkles,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Shield,
  Layers,
  Calendar as CalendarIcon,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StaffActivity, AdminMitraStaff, MasterKpiStandar } from '../../types';
import { DAFTAR_15_STANDAR_KPI } from '../../data/masterKpiStandar';
import { AdminStaffModal } from './staff-activity/AdminStaffModal';
import { TaskModal } from './staff-activity/TaskModal';
import { MasterKpiModal } from './staff-activity/MasterKpiModal';
import { GoogleSheetTable } from './staff-activity/GoogleSheetTable';
import { KpiSyncSection } from './staff-activity/KpiSyncSection';
import { GoogleCalendarView } from './staff-activity/GoogleCalendarView';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const StaffActivityView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { 
    staffActivityList, 
    adminStaffList, 
    sekolahList, 
    addStaffActivity, 
    updateStaffActivity, 
    deleteStaffActivity,
    addAdminStaff,
    updateAdminStaff,
    deleteAdminStaff
  } = useData();

  // Master 15 Standar & 15 KPI State with local storage persistence
  const [masterKpiList, setMasterKpiList] = useState<MasterKpiStandar[]>(() => {
    try {
      const saved = localStorage.getItem('L_MAP_MASTER_15_KPI_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DAFTAR_15_STANDAR_KPI;
  });

  const handleSaveMasterList = (newList: MasterKpiStandar[]) => {
    setMasterKpiList(newList);
    try {
      localStorage.setItem('L_MAP_MASTER_15_KPI_V1', JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  // View switch: 'sheet' | 'calendar' | 'both'
  const [activeTab, setActiveTab] = useState<'sheet' | 'calendar' | 'both'>('sheet');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StaffActivity | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<{ id: string; nama: string } | null>(null);
  const [deleteAdminTarget, setDeleteAdminTarget] = useState<{ id: string; nama: string } | null>(null);

  const [isMasterKpiModalOpen, setIsMasterKpiModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminMitraStaff | null>(null);

  // Handlers for Tasks
  const handleOpenAddTask = (prefilledDate?: string) => {
    setEditingTask(prefilledDate ? ({
      id: '',
      namaStaff: adminStaffList[0]?.nama || 'Anita Sulastri',
      tugas: '',
      tanggal: prefilledDate,
      deadline: prefilledDate,
      status: 'Sedang Berjalan',
    } as StaffActivity) : null);
    setIsTaskModalOpen(true);
  };

  const handleSelectKpiForTask = (kpi: MasterKpiStandar) => {
    setEditingTask({
      id: '',
      noKpi: kpi.noKpi,
      standarKpi: kpi.namaStandar,
      programKpi: kpi.programKpi,
      penjelasanKpi: kpi.penjelasanKpi,
      namaStaff: adminStaffList[0]?.nama || 'Anita Sulastri',
      tugas: '',
      tanggal: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Sedang Berjalan',
      bobotKpi: 50,
    } as StaffActivity);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: StaffActivity) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<StaffActivity, 'id'>, id?: string) => {
    if (id) {
      await updateStaffActivity({ ...taskData, id });
    } else {
      await addStaffActivity(taskData);
    }
  };

  const handleDeleteTask = (id: string) => {
    const task = staffActivityList.find(t => t.id === id);
    setDeleteTaskTarget({ id, nama: task?.tugas || task?.judulAktivitas || `Tugas #${id}` });
  };

  const handleQuickUpdateStatus = async (id: string, newStatus: StaffActivity['status']) => {
    const target = staffActivityList.find(t => t.id === id);
    if (target) {
      await updateStaffActivity({
        ...target,
        status: newStatus,
        kpiScore: newStatus === 'Selesai' ? (target.bobotKpi || 20) : target.kpiScore,
      });
    }
  };

  // Handlers for Admin Mitra Office Staff
  const handleOpenAddAdmin = () => {
    setEditingAdmin(null);
    setIsAdminModalOpen(true);
  };

  const handleOpenEditAdmin = (admin: AdminMitraStaff) => {
    setEditingAdmin(admin);
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async (adminData: Omit<AdminMitraStaff, 'id'>, id?: string) => {
    if (id) {
      await updateAdminStaff({ ...adminData, id });
    } else {
      await addAdminStaff(adminData);
    }
  };

  const handleDeleteAdmin = (id: string, nama: string) => {
    if (adminStaffList.length <= 1) {
      return;
    }
    setDeleteAdminTarget({ id, nama });
  };

  /**
   * Google Calendar Direct Template URL with Multi-Admin Auto-Invite
   */
  const getGoogleCalendarUrl = (item: StaffActivity) => {
    const taskName = item.tugas || item.judulAktivitas || 'Pekerjaan Staff';
    const noKpi = item.noKpi || 'KPI';
    const program = item.programKpi || 'Program KPI Mitra Office';
    const penjelasan = item.penjelasanKpi || '-';
    const notulensi = item.hasilCatatan || item.hasilKegiatan || '-';
    const tindakLanjut = item.catatanTindakLanjut || '-';
    
    const title = encodeURIComponent(`[Mitra Office] [${noKpi}] ${taskName}`);
    const details = encodeURIComponent(
      `Tugas Lazuardi Mitra Office\n\nNo. KPI: ${noKpi}\nSasaran Program: ${program}\nPenjelasan KPI: ${penjelasan}\nPIC Admin: ${item.namaStaff}\nTanggal Mulai: ${item.tanggal}\nDeadline: ${item.deadline || '-'}\nStatus: ${item.status}\n\nCatatan Hasil: ${notulensi}\n\nTindak Lanjut: ${tindakLanjut}`
    );
    const location = encodeURIComponent(`${program}`);
    const startDate = (item.tanggal || '2026-09-15').replace(/-/g, '');
    const endDate = (item.deadline || item.tanggal || '2026-09-15').replace(/-/g, '');
    const startTime = `${startDate}T090000Z`;
    const endTime = `${endDate}T170000Z`;

    // Otomatis undang seluruh email admin Mitra Office ke Google Calendar
    const adminEmails = adminStaffList.map(a => a.email).filter(Boolean);
    const addParam = adminEmails.length > 0 ? `&add=${encodeURIComponent(adminEmails.join(','))}` : '';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}${addParam}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header with Title, Mode Switcher & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-700 text-white flex items-center justify-center font-bold shadow-md shadow-blue-700/20">
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Staff Activity & Lembar Kerja Mitra Office
              </h2>
              <p className="text-xs text-slate-500">
                Manajemen Admin Mitra Office, format Google Sheet, sinkronisasi KPI otomatis, dan jadwal Google Calendar
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center rounded-xl border border-slate-200 p-1 bg-slate-100/90 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('sheet')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sheet'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={14} className="text-[#0F9D58]" />
              <span>Google Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays size={14} className="text-blue-600" />
              <span>Google Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'both'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} className="text-indigo-600" />
              <span>Keduanya</span>
            </button>
          </div>

          <button
            id="btn-master-15-standar-kpi"
            onClick={() => setIsMasterKpiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            title="Kelola & lihat seluruh 15 Standar & 15 KPI beserta uraian program"
          >
            <Target size={15} className="text-blue-700" />
            <span>15 Standar & 15 KPI</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
              {masterKpiList.length}
            </span>
          </button>

          <button
            id="btn-tambah-tugas-sheet"
            onClick={() => handleOpenAddTask()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Baris Tugas Sheet</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Mitra Office Staff Section (Bisa Diedit & Ditambahkan) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Personel Admin Mitra Office
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {adminStaffList.length} Personel
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Klik nama admin untuk memfilter lembar kerja dan kalender penugasan
            </p>
          </div>

          <button
            id="btn-tambah-admin-mo"
            onClick={handleOpenAddAdmin}
            className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Tambah Admin Mitra Office</span>
          </button>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Option: Filter ALL */}
          <div
            onClick={() => setSelectedStaffFilter('ALL')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              selectedStaffFilter === 'ALL'
                ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                ALL
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 block">Semua Admin Mitra Office</span>
                <span className="text-[11px] text-slate-500">Tampilkan seluruh penugasan tim</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
              {staffActivityList.length} Tugas
            </span>
          </div>

          {/* Individual Admin Cards */}
          {adminStaffList.map((admin) => {
            const adminTasks = staffActivityList.filter(t => t.namaStaff === admin.nama);
            const isSelected = selectedStaffFilter === admin.nama;
            const completedCount = adminTasks.filter(t => t.status === 'Selesai').length;

            return (
              <div
                key={admin.id}
                onClick={() => setSelectedStaffFilter(admin.nama)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {admin.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{admin.nama}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {admin.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-600 font-semibold">{admin.role}</p>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition"
                  >
                    <button
                      onClick={() => handleOpenEditAdmin(admin)}
                      title="Edit admin"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    {adminStaffList.length > 1 && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.nama)}
                        title="Hapus admin"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1 truncate max-w-[150px]">
                    <Mail size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  <div className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {completedCount}/{adminTasks.length} Selesai
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Primary Views (Google Sheet Table & Calendar) */}
      {(activeTab === 'sheet' || activeTab === 'both') && (
        <div className="space-y-6">
          {/* The Google Sheet Table */}
          <GoogleSheetTable
            tasks={staffActivityList}
            adminStaffList={adminStaffList}
            selectedStaffFilter={selectedStaffFilter}
            onSelectStaffFilter={setSelectedStaffFilter}
            onAddTask={() => handleOpenAddTask()}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleQuickUpdateStatus}
            getGoogleCalendarUrl={getGoogleCalendarUrl}
          />

          {/* Synchronized KPI Dashboard right below the sheet */}
          <KpiSyncSection
            tasks={staffActivityList}
            adminStaffList={adminStaffList}
          />
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Google Calendar View */}
          <GoogleCalendarView
            tasks={selectedStaffFilter === 'ALL' ? staffActivityList : staffActivityList.filter(t => t.namaStaff === selectedStaffFilter)}
            adminStaffList={adminStaffList}
            onSelectTask={handleOpenEditTask}
            onAddTaskOnDate={(dateStr) => handleOpenAddTask(dateStr)}
            getGoogleCalendarUrl={getGoogleCalendarUrl}
          />

          {/* Synchronized KPI Dashboard */}
          <KpiSyncSection
            tasks={staffActivityList}
            adminStaffList={adminStaffList}
          />
        </div>
      )}

      {activeTab === 'both' && (
        <div className="pt-4 space-y-4">
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-600" />
              <span>Jadwal & Timeline Google Calendar</span>
            </h3>
            <GoogleCalendarView
              tasks={selectedStaffFilter === 'ALL' ? staffActivityList : staffActivityList.filter(t => t.namaStaff === selectedStaffFilter)}
              adminStaffList={adminStaffList}
              onSelectTask={handleOpenEditTask}
              onAddTaskOnDate={(dateStr) => handleOpenAddTask(dateStr)}
              getGoogleCalendarUrl={getGoogleCalendarUrl}
            />
          </div>
        </div>
      )}

      {/* 4. Modals */}
      <AdminStaffModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSave={handleSaveAdmin}
        initialData={editingAdmin}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialData={editingTask}
        adminStaffList={adminStaffList}
        masterKpiList={masterKpiList}
        onOpenMasterKpiModal={() => setIsMasterKpiModalOpen(true)}
        sekolahList={sekolahList}
      />

      <MasterKpiModal
        isOpen={isMasterKpiModalOpen}
        onClose={() => setIsMasterKpiModalOpen(false)}
        masterList={masterKpiList}
        onSaveMasterList={handleSaveMasterList}
        onSelectKpiForTask={handleSelectKpiForTask}
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={async () => {
          if (deleteTaskTarget) {
            await deleteStaffActivity(deleteTaskTarget.id);
          }
        }}
        title="Hapus Baris Tugas"
        message="Apakah Anda yakin ingin menghapus baris tugas staff ini dari Firestore? Data tugas dan skor KPI terkait akan dihapus."
        itemName={deleteTaskTarget ? deleteTaskTarget.nama : ''}
        confirmLabel="Hapus Tugas"
      />

      {/* Delete Admin Staff Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteAdminTarget}
        onClose={() => setDeleteAdminTarget(null)}
        onConfirm={async () => {
          if (deleteAdminTarget) {
            await deleteAdminStaff(deleteAdminTarget.id);
          }
        }}
        title="Hapus Admin Mitra Office"
        message="Apakah Anda yakin ingin menghapus admin ini dari daftar staf Admin Mitra Office?"
        itemName={deleteAdminTarget ? deleteAdminTarget.nama : ''}
        confirmLabel="Hapus Admin"
      />
    </div>
  );
};
