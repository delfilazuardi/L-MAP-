import React, { useState } from 'react';
import { 
  Menu, 
  Cloud, 
  RefreshCw, 
  User, 
  ChevronDown, 
  ShieldCheck, 
  Building,
  GraduationCap,
  CheckCircle2,
  KeyRound,
  X,
  AlertCircle,
  Sparkles,
  Settings as SettingsIcon,
  Lock,
  LogOut,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings?: () => void;
  activeTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  onOpenSettings, 
  activeTitle 
}) => {
  const { currentUser, isAdmin, switchUser, allUsers, logout, updatePassword, hasCustomPassword } = useAuth();
  const { isFirebaseConnected, isSyncing, lastSyncTime } = useData();
  const { settings } = useSettings();
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

        <div className="flex items-center gap-3">
          <img
            src={settings.logoUrl || '/lmap-logo.jpg'}
            alt={`${settings.appTitle || 'L-MAP'} Logo`}
            className="w-10 h-10 object-contain rounded-xl shadow-xs border border-slate-200/90 bg-white p-0.5 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-blue-900 tracking-wider flex items-center">
                {settings.appTitle?.includes('-') ? (
                  <>
                    <span>{settings.appTitle.split('-')[0]}</span>
                    <span className="text-amber-500 font-black mx-0.5">-</span>
                    <span>{settings.appTitle.split('-').slice(1).join('-')}</span>
                  </>
                ) : (
                  <span>{settings.appTitle || 'L-MAP'}</span>
                )}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-600 font-bold hidden sm:inline truncate max-w-[240px]">
                {settings.appSubtitle || 'Lazuardi Mitra Administration Platform'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {activeTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Right section: Settings button, Switcher, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Tombol Pengaturan Cepat (Hanya Administrator) */}
        {isAdmin && onOpenSettings && (
          <button
            id="header-settings-button"
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 text-slate-700 hover:text-blue-800 text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Buka Pengaturan Sistem, Bahasa & Logo"
          >
            <SettingsIcon size={14} className="text-slate-500" />
            <span className="font-bold">Pengaturan</span>
          </button>
        )}

        {/* Quick User Switcher Dropdown (for easy demo testing of MO002 - MO012) */}
        <div className="relative">
          <button
            id="user-switch-toggle"
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition bg-white shadow-xs cursor-pointer"
            title={isAdmin ? "Ganti Akun Pengguna (Khusus Administrator)" : `Profil Akun ${currentUser?.nama || ''}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-xs ${
              isAdmin 
                ? 'bg-gradient-to-tr from-amber-500 to-orange-600' 
                : currentUser?.role === 'Guru Mitra'
                ? 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                : 'bg-gradient-to-tr from-sky-500 to-blue-600'
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
              className={`absolute right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                isAdmin ? 'w-84' : 'w-80 sm:w-88'
              }`}
            >
              {/* Header: Sesi Akun Aktif */}
              <div className="px-4 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    {isAdmin ? (
                      <>
                        <ShieldCheck size={13} className="text-amber-500" />
                        <span>Sesi Administrator</span>
                      </>
                    ) : (
                      <>
                        <Building size={13} className="text-sky-600" />
                        <span>Akun Sekolah Aktif</span>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => {
                      setShowSwitchDropdown(false);
                      setIsChangePassOpen(true);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={11} />
                    <span>Ganti Sandi</span>
                  </button>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-md ${
                    isAdmin 
                      ? 'bg-gradient-to-tr from-amber-500 to-orange-600' 
                      : currentUser?.role === 'Guru Mitra'
                      ? 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-tr from-sky-500 to-blue-600'
                  }`}>
                    {isAdmin ? <ShieldCheck size={20} /> : currentUser?.role === 'Guru Mitra' ? <GraduationCap size={20} /> : <Building size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 leading-snug truncate">
                      {currentUser?.nama}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold">
                        {currentUser?.userId}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isAdmin
                          ? 'bg-amber-100 text-amber-800'
                          : currentUser?.role === 'Guru Mitra'
                          ? 'bg-purple-100 text-purple-800'
                          : currentUser?.role === 'Sekolah Afiliasi'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {currentUser?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser?.email || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Status Kredensial:</span>
                    <span className="font-semibold text-slate-700">
                      {hasCustomPassword(currentUser?.userId || '') ? '✨ Sandi Khusus Aktif' : '🔑 Sandi Bawaan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* JIKA BUKAN ADMINISTRATOR: Hanya melihat akun milik sekolah masing-masing */}
              {!isAdmin ? (
                <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Lock size={13} className="text-slate-500" />
                      <span>Hak Akses Khusus Sekolah</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Sesi ini terikat khusus untuk <strong>{currentUser?.nama}</strong>. Akses dibatasi pada data dan berkas sekolah mitra Anda.
                    </p>
                    <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[10px] text-blue-900 flex items-start gap-1.5 leading-tight">
                      <ShieldCheck size={13} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>Pergantian akun hanya dapat dilakukan oleh Administrator Mitra Office.</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* JIKA ADMINISTRATOR: Tampilkan daftar switcher akun */
                <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
                  <div className="px-3 py-1 text-[10px] font-bold text-blue-900 bg-blue-50/70 flex items-center justify-between">
                    <span>Ganti Akun Pengguna (Khusus Admin)</span>
                    <span className="text-[9px] font-mono text-blue-600 font-bold">Admin Only</span>
                  </div>
                  
                  <div className="px-3 pt-1 text-[9px] uppercase font-bold text-slate-400">
                    Administrator Mitra Office
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

                  <div className="px-3 pt-2 text-[9px] uppercase font-bold text-slate-400">
                    Sekolah Mitra & Afiliasi
                  </div>
                  {allUsers.filter(u => u.role === 'Sekolah Mitra' || u.role === 'Sekolah Afiliasi').map(user => (
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

                  <div className="px-3 pt-2 text-[9px] uppercase font-bold text-slate-400">
                    Guru Sekolah Mitra (Login Google)
                  </div>
                  {allUsers.filter(u => u.role === 'Guru Mitra').map(user => (
                    <button
                      key={user.userId}
                      onClick={() => {
                        switchUser(user.userId);
                        setShowSwitchDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-purple-50 text-xs transition cursor-pointer ${
                        currentUser?.userId === user.userId ? 'bg-purple-100/60 font-bold text-purple-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GraduationCap size={14} className="text-purple-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{user.nama}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {user.email} • {user.namaSekolah || user.sekolahId}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">
                        {user.loginCount ? `${user.loginCount}x` : 'Guru'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Footer Actions */}
              <div className="px-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowSwitchDropdown(false);
                    setIsChangePassOpen(true);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound size={13} />
                  <span>Ubah Sandi</span>
                </button>
                <button
                  onClick={logout}
                  className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Keluar / Logout</span>
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

