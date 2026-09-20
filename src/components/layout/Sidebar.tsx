import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  CreditCard, 
  CalendarDays, 
  Package, 
  School, 
  UserCheck, 
  FolderDown, 
  TrendingUp, 
  Table, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Building2,
  X,
  Sparkles
} from 'lucide-react';
import { ActiveNavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose 
}) => {
  const { currentUser, isAdmin, logout } = useAuth();
  const { laporanList, invoiceList, permintaanList, pembayaranList } = useData();

  // Badges for pending items
  const pendingLaporan = laporanList.filter(l => l.status === 'Diajukan' || l.status === 'Direview').length;
  const unpaidInvoices = invoiceList.filter(i => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo').length;
  const pendingRequests = permintaanList.filter(p => p.status === 'Diajukan' || p.status === 'Diproses').length;
  const pendingPayments = pembayaranList.filter(p => p.status === 'Menunggu Verifikasi').length;

  const navItems = [
    {
      id: 'dashboard' as ActiveNavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Ringkasan Eksekutif',
    },
    {
      id: 'laporan-bulanan' as ActiveNavTab,
      label: 'Laporan Bulanan',
      icon: FileText,
      badge: pendingLaporan > 0 ? pendingLaporan : null,
      badgeColor: 'bg-amber-100 text-amber-800',
      desc: 'Akademik & Operasional',
    },
    {
      id: 'invoice' as ActiveNavTab,
      label: 'Invoice & Pembayaran',
      icon: Receipt,
      badge: unpaidInvoices > 0 ? unpaidInvoices : pendingPayments > 0 ? pendingPayments : null,
      badgeColor: unpaidInvoices > 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700',
      desc: 'Franchise, Piutang, Renewal, Jenjang',
    },
    {
      id: 'event-tracker' as ActiveNavTab,
      label: 'Event Tracker',
      icon: CalendarDays,
      badge: null,
      desc: 'Agenda & Workshop Mitra',
    },
    {
      id: 'permintaan-mitra' as ActiveNavTab,
      label: 'Permintaan Mitra',
      icon: Package,
      badge: pendingRequests > 0 ? pendingRequests : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      desc: 'Seragam & Dokumen Cetak',
    },
    {
      id: 'data-mitra' as ActiveNavTab,
      label: 'Data Mitra',
      icon: School,
      badge: null,
      desc: 'Profil Sekolah & Murid',
    },
    {
      id: 'staff-activity' as ActiveNavTab,
      label: 'Staff Activity',
      icon: UserCheck,
      badge: null,
      desc: 'Kegiatan & Google Calendar',
    },
    {
      id: 'template' as ActiveNavTab,
      label: 'Template & Berkas',
      icon: FolderDown,
      badge: null,
      desc: 'SOP, Panduan & Handbook',
    },
    {
      id: 'performance-mendaki' as ActiveNavTab,
      label: 'Performance (MenDAKI)',
      icon: TrendingUp,
      badge: null,
      desc: 'Evaluasi Mutu Lazuardi',
    },
    {
      id: 'sheet-sync' as ActiveNavTab,
      label: 'Sinkronisasi Google Sheet',
      icon: Table,
      badge: 'Live',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      desc: 'Impor & Ekspor Data Sheet',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="main-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-slate-200 flex flex-col shadow-2xl border-r border-blue-900/50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/lmap-logo.jpg"
              alt="L-MAP Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-lg border border-white/20 bg-white p-0.5 shrink-0"
            />

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-white tracking-wider flex items-center">
                  <span>L</span>
                  <span className="text-amber-400 font-black mx-0.5">-</span>
                  <span>MAP</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] text-blue-200/90 font-medium tracking-tight">Lazuardi Mitra Administration Platform</p>
            </div>
          </div>
          <button 
            id="close-sidebar-button"
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Role Card */}
        <div className="mx-3.5 my-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-900/40 via-slate-900/60 to-indigo-950/40 border border-blue-800/40 backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-md shrink-0 ${
              isAdmin 
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/20' 
                : 'bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-blue-500/20'
            }`}>
              {isAdmin ? <ShieldCheck size={18} /> : <Building2 size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate tracking-tight">
                {currentUser?.nama || 'Pengguna'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] text-blue-200/80 truncate font-medium">
                  {currentUser?.role || 'Guest'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-900/50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">Hak Akses:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide ${
              isAdmin 
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                : 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
            }`}>
              {currentUser?.akses || 'Akses Terbatas'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-blue-300/60 flex items-center justify-between">
            <span>Menu Platform</span>
            <span className="text-[9px] font-mono text-slate-500">v2.6</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 border border-blue-400/30 translate-x-0.5' 
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'text-blue-300 group-hover:text-white group-hover:bg-slate-700'
                }`}>
                  <Icon size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-tight truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-blue-500/30 text-blue-200'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </p>
                </div>

                {isActive && (
                  <ChevronRight size={14} className="text-white/80 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer & Logout */}
        <div className="p-3 border-t border-blue-900/60 bg-blue-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Lazuardi Mitra</span>
              <p className="text-[10px] text-blue-400">v2.4 • Sync Active</p>
            </div>
            <button
              id="sidebar-logout-button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition border border-rose-500/20"
              title="Keluar dari sesi"
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
