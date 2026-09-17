import React, { useState } from 'react';
import { 
  Menu, 
  Cloud, 
  RefreshCw, 
  User, 
  ChevronDown, 
  ShieldCheck, 
  Building,
  CheckCircle2,
  KeyRound,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSyncModal: () => void;
  activeTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onOpenSyncModal, 
  activeTitle 
}) => {
  const { currentUser, isAdmin, switchUser, allUsers, logout, updatePassword, hasCustomPassword } = useAuth();
  const { isFirebaseConnected, isSyncing, lastSyncTime } = useData();
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  // Quick Password Change Modal
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleChangePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentUser) return;

    if (!newPassInput || newPassInput.length < 5) {
      setPassError('Kata sandi baru minimal 5 karakter.');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setPassError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = updatePassword(currentUser.userId, newPassInput);
    if (!res.success) {
      setPassError(res.message);
    } else {
      setPassSuccess(res.message);
      setTimeout(() => {
        setIsChangePassOpen(false);
        setNewPassInput('');
        setConfirmPassInput('');
        setPassSuccess('');
      }, 1500);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
              Lazuardi Mitra Office
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              T.A. 2026/2027
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {activeTitle}
          </h1>
        </div>
      </div>

      {/* Right section: Sync status, Switcher, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Firebase & Google Sheet Status */}
        <button
          id="header-sync-button"
          onClick={onOpenSyncModal}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition cursor-pointer shadow-xs"
          title="Klik untuk membuka sinkronisasi Google Sheet & Firebase"
        >
          <Cloud size={15} className={isFirebaseConnected ? "text-blue-600 animate-pulse" : "text-slate-400"} />
          <span className="font-bold">Sheet & Cloud</span>
          {isSyncing ? (
            <RefreshCw size={12} className="animate-spin text-blue-600" />
          ) : (
            <CheckCircle2 size={13} className="text-emerald-600" />
          )}
        </button>

        {/* Quick User Switcher Dropdown (for easy demo testing of MO002 - MO012) */}
        <div className="relative">
          <button
            id="user-switch-toggle"
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition bg-white shadow-xs cursor-pointer"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-xs ${
              isAdmin ? 'bg-gradient-to-tr from-amber-500 to-orange-600' : 'bg-gradient-to-tr from-sky-500 to-blue-600'
            }`}>
              {currentUser?.nama.charAt(0) || 'U'}
            </div>

            <div className="hidden md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-800 truncate max-w-[130px]">
                  {currentUser?.nama}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                  {currentUser?.userId}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {currentUser?.role}
              </p>
            </div>

            <ChevronDown size={14} className="text-slate-400 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {showSwitchDropdown && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Sesi Akun Aktif
                  </p>
                  <button
                    onClick={() => {
                      setShowSwitchDropdown(false);
                      setIsChangePassOpen(true);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={11} />
                    <span>Ganti Sandi</span>
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {currentUser?.nama}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentUser?.email} • {hasCustomPassword(currentUser?.userId || '') ? '✨ Sandi Khusus Aktif' : '🔑 Sandi Default'}
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
                <div className="px-3 py-1 text-[10px] font-bold text-blue-900 bg-blue-50/70">
                  Administrator Mitra Office (Full Akses)
                </div>
                {allUsers.filter(u => u.akses === 'Full Akses').map(user => (
                  <button
                    key={user.userId}
                    onClick={() => {
                      switchUser(user.userId);
                      setShowSwitchDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 text-xs transition cursor-pointer ${
                      currentUser?.userId === user.userId ? 'bg-blue-100/60 font-bold text-blue-900' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-600" />
                      <div>
                        <span className="font-semibold">{user.nama}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({user.userId})</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                      {user.role === 'Officer' ? 'Officer' : 'Ka. Mitra'}
                    </span>
                  </button>
                ))}

                <div className="px-3 py-1 text-[10px] font-bold text-sky-900 bg-sky-50/70 mt-1">
                  Sekolah Mitra & Afiliasi (Akses Terbatas)
                </div>
                {allUsers.filter(u => u.akses !== 'Full Akses').map(user => (
                  <button
                    key={user.userId}
                    onClick={() => {
                      switchUser(user.userId);
                      setShowSwitchDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sky-50 text-xs transition cursor-pointer ${
                      currentUser?.userId === user.userId ? 'bg-sky-100/60 font-bold text-sky-900' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-sky-600" />
                      <div>
                        <span className="font-medium">{user.nama}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({user.userId})</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {user.role === 'Sekolah Afiliasi' ? 'Afiliasi' : 'Mitra'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="px-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowSwitchDropdown(false);
                    setIsChangePassOpen(true);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound size={13} />
                  <span>Ubah Sandi Akun</span>
                </button>
                <button
                  onClick={logout}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Keluar / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Ubah Kata Sandi Akun
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentUser?.nama} ({currentUser?.userId})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsChangePassOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {passError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Minimal 5 karakter..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

