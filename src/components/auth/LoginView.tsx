import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Eye, 
  EyeOff, 
  KeyRound, 
  X,
  School,
  ChevronDown,
  Sparkles,
  MessageCircle,
  Mail,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_SEKOLAH } from '../../lib/initialData';
import { LMapLogo } from '../common/LMapLogo';

export const LoginView: React.FC = () => {
  const { login, allUsers, updatePassword, resetPassword, hasCustomPassword } = useAuth();
  
  // Tab: 'admin' or 'sekolah'
  const [activeTab, setActiveTab] = useState<'admin' | 'sekolah'>('admin');
  
  // Admin form state
  const [adminIdentifier, setAdminIdentifier] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Sekolah form state
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('MO004'); // default Al-Falah Depok
  const [schoolPassword, setSchoolPassword] = useState('admin123');
  const [showSchoolPass, setShowSchoolPass] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);

  // Set/Create Custom School Password Modal State
  const [targetSchoolForPassword, setTargetSchoolForPassword] = useState<string>('MO004');
  const [newSchoolPassInput, setNewSchoolPassInput] = useState('');
  const [confirmSchoolPassInput, setConfirmSchoolPassInput] = useState('');
  const [setPasswordModalError, setSetPasswordModalError] = useState('');
  const [setPasswordModalSuccess, setSetPasswordModalSuccess] = useState('');

  // Forgot Password Modal State
  const [forgotPassIdentifier, setForgotPassIdentifier] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotModalTab, setForgotModalTab] = useState<'self' | 'hotline'>('self');
  const [forgotModalError, setForgotModalError] = useState('');
  const [forgotModalSuccess, setForgotModalSuccess] = useState('');

  // Currently selected school
  const currentSchool = useMemo(() => {
    return INITIAL_SEKOLAH.find(s => s.id === selectedSchoolId) || INITIAL_SEKOLAH[0];
  }, [selectedSchoolId]);

  // Filtered schools for list
  const filteredSchools = useMemo(() => {
    return INITIAL_SEKOLAH.filter(s => 
      s.namaSekolah.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      (s.kota && s.kota.toLowerCase().includes(schoolSearchQuery.toLowerCase())) ||
      (s.kodeMitra && s.kodeMitra.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
    );
  }, [schoolSearchQuery]);

  const handleTabChange = (tab: 'admin' | 'sekolah') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const idToUse = adminIdentifier.trim() || 'admin';
    const passToUse = adminPassword.trim() || 'admin123';

    const res = login(idToUse, passToUse, 'admin');
    if (!res.success) {
      setErrorMsg(res.message || 'Login Administrator gagal.');
    } else {
      setSuccessMsg('Login berhasil! Mengalihkan ke Dashboard...');
    }
  };

  const handleSchoolLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSchoolId) {
      setErrorMsg('Silakan pilih salah satu sekolah mitra.');
      return;
    }

    const passToUse = schoolPassword.trim() || 'admin123';
    const res = login(selectedSchoolId, passToUse, 'sekolah');
    if (!res.success) {
      setErrorMsg(res.message || 'Login Sekolah Mitra gagal.');
    } else {
      setSuccessMsg(`Login berhasil sebagai ${currentSchool.namaSekolah}!`);
    }
  };

  // Open "Buat / Atur Sandi Sekolah" modal
  const openSetPasswordModal = (schoolId: string) => {
    setTargetSchoolForPassword(schoolId);
    setNewSchoolPassInput('');
    setConfirmSchoolPassInput('');
    setSetPasswordModalError('');
    setSetPasswordModalSuccess('');
    setIsSetPasswordModalOpen(true);
  };

  // Save custom school password
  const handleSaveSchoolPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSetPasswordModalError('');
    setSetPasswordModalSuccess('');

    if (!newSchoolPassInput || newSchoolPassInput.length < 5) {
      setSetPasswordModalError('Kata sandi baru minimal 5 karakter.');
      return;
    }

    if (newSchoolPassInput !== confirmSchoolPassInput) {
      setSetPasswordModalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = updatePassword(targetSchoolForPassword, newSchoolPassInput);
    if (!res.success) {
      setSetPasswordModalError(res.message);
    } else {
      setSetPasswordModalSuccess(res.message);
      if (targetSchoolForPassword === selectedSchoolId) {
        setSchoolPassword(newSchoolPassInput);
      }
      setTimeout(() => {
        setIsSetPasswordModalOpen(false);
      }, 1400);
    }
  };

  // Handle self-service forgot password reset
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotModalError('');
    setForgotModalSuccess('');

    if (!forgotPassIdentifier.trim()) {
      setForgotModalError('Harap pilih atau masukkan ID Akun.');
      return;
    }

    if (!forgotNewPass || forgotNewPass.length < 5) {
      setForgotModalError('Kata sandi baru minimal 5 karakter.');
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotModalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = resetPassword(forgotPassIdentifier, forgotNewPass);
    if (!res.success) {
      setForgotModalError(res.message);
    } else {
      setForgotModalSuccess(`Kata sandi untuk ${forgotPassIdentifier} berhasil diperbarui!`);
      if (activeTab === 'sekolah') {
        setSelectedSchoolId(forgotPassIdentifier);
        setSchoolPassword(forgotNewPass);
      } else {
        setAdminPassword(forgotNewPass);
      }
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a18] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-900/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container - Compact & Simple */}
      <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center">
        
        {/* Logo L-MAP & Title matching the user's provided design */}
        <div className="mb-6">
          <LMapLogo size="xl" showSubtitle={true} layout="vertical" theme="dark" showTagline={true} />
        </div>

        {/* Dark Navy Card */}
        <div className="w-full bg-[#0b1329] border border-blue-900/40 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden relative">
          
          {/* Subtle top glowing accent border */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/70 to-indigo-500/70" />

          <div className="p-6 sm:p-7 space-y-6">

            {/* Segmented Switcher (Administrator vs Sekolah Mitra) */}
            <div className="p-1 bg-[#060c1c] rounded-2xl border border-slate-800/80 grid grid-cols-2 gap-1">
              <button
                id="login-tab-admin"
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#0f1b38] border border-amber-500/70 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <ShieldCheck size={16} className={activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'} />
                <span>Administrator</span>
              </button>

              <button
                id="login-tab-sekolah"
                type="button"
                onClick={() => handleTabChange('sekolah')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sekolah'
                    ? 'bg-[#0f1b38] border border-amber-500/70 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Building2 size={16} className={activeTab === 'sekolah' ? 'text-amber-400' : 'text-slate-400'} />
                <span>Sekolah Mitra</span>
              </button>
            </div>

            {/* Notification messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB: ADMINISTRATOR FORM */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Username Administrator
                  </label>
                  <div className="bg-[#060c1c] border border-slate-800/90 rounded-xl px-3.5 py-3 flex items-center gap-3 focus-within:border-amber-400/80 transition">
                    <User size={18} className="text-slate-500 shrink-0" />
                    <input
                      id="admin-username-input"
                      type="text"
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      placeholder="admin"
                      className="bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none w-full font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassIdentifier('admin');
                        setIsForgotPasswordOpen(true);
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      Ubah / Lupa Kata Sandi?
                    </button>
                  </div>
                  <div className="bg-[#060c1c] border border-slate-800/90 rounded-xl px-3.5 py-3 flex items-center gap-3 focus-within:border-amber-400/80 transition">
                    <KeyRound size={18} className="text-slate-500 shrink-0" />
                    <input
                      id="admin-password-input"
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none w-full font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit MASUK Button */}
                <button
                  id="admin-submit-btn"
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-black text-slate-950 text-sm uppercase tracking-widest bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:brightness-105 active:scale-[0.99] transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  MASUK
                </button>
              </form>
            )}

            {/* TAB: SEKOLAH MITRA FORM */}
            {activeTab === 'sekolah' && (
              <form onSubmit={handleSchoolLogin} className="space-y-4">
                {/* School Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pilih Sekolah Mitra
                    </label>
                    <button
                      type="button"
                      onClick={() => openSetPasswordModal(selectedSchoolId)}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      Atur Sandi Sekolah
                    </button>
                  </div>

                  {/* Precision Native Dropdown with Styled Appearance */}
                  <div className="relative bg-[#060c1c] border border-slate-800/90 rounded-xl focus-within:border-amber-400/80 transition">
                    <div className="flex items-center px-3 py-1">
                      <Building2 size={18} className="text-amber-400 shrink-0 mr-2.5" />
                      <select
                        id="school-select-precision"
                        value={selectedSchoolId}
                        onChange={(e) => {
                          setSelectedSchoolId(e.target.value);
                          setErrorMsg('');
                        }}
                        className="w-full bg-transparent py-2.5 text-xs sm:text-sm text-white font-semibold focus:outline-none cursor-pointer pr-6"
                      >
                        {INITIAL_SEKOLAH.map((school) => (
                          <option key={school.id} value={school.id} className="bg-[#0b1329] text-slate-100 py-2">
                            {school.namaSekolah}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassIdentifier(selectedSchoolId);
                        setIsForgotPasswordOpen(true);
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      Ubah / Lupa Kata Sandi?
                    </button>
                  </div>
                  <div className="bg-[#060c1c] border border-slate-800/90 rounded-xl px-3.5 py-3 flex items-center gap-3 focus-within:border-amber-400/80 transition">
                    <KeyRound size={18} className="text-slate-500 shrink-0" />
                    <input
                      id="school-password-input"
                      type={showSchoolPass ? 'text' : 'password'}
                      value={schoolPassword}
                      onChange={(e) => setSchoolPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none w-full font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSchoolPass(!showSchoolPass)}
                      className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    >
                      {showSchoolPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit MASUK Button */}
                <button
                  id="school-submit-btn"
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-black text-slate-950 text-sm uppercase tracking-widest bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:brightness-105 active:scale-[0.99] transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  MASUK
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

      {/* MODAL: LUPA KATA SANDI (SIMPLE & DARK THEMED) */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-blue-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Ubah / Lupa Kata Sandi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Reset kata sandi instan untuk sekolah atau admin
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {forgotModalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {forgotModalError}
              </div>
            )}

            {forgotModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                {forgotModalSuccess}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pilih Akun / Sekolah Mitra
                </label>
                <select
                  value={forgotPassIdentifier}
                  onChange={(e) => setForgotPassIdentifier(e.target.value)}
                  className="w-full bg-[#060c1c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Akun --</option>
                  <optgroup label="Administrator">
                    <option value="admin">admin (Administrator Utama)</option>
                    <option value="anita@lazuardi.sch.id">Anita Rahayu (Ka. Mitra Office)</option>
                  </optgroup>
                  <optgroup label="Sekolah Mitra">
                    {INITIAL_SEKOLAH.map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={forgotNewPass}
                  onChange={(e) => setForgotNewPass(e.target.value)}
                  placeholder="Minimal 5 karakter..."
                  className="w-full bg-[#060c1c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={forgotConfirmPass}
                  onChange={(e) => setForgotConfirmPass(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru..."
                  className="w-full bg-[#060c1c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl transition shadow-md shadow-amber-500/20 hover:brightness-105"
                >
                  Simpan Sandi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATUR KATA SANDI KHUSUS SEKOLAH */}
      {isSetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-blue-900/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Buat Kata Sandi Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Atur kata sandi khusus untuk akun sekolah ini
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSetPasswordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {setPasswordModalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {setPasswordModalError}
              </div>
            )}

            {setPasswordModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                {setPasswordModalSuccess}
              </div>
            )}

            <form onSubmit={handleSaveSchoolPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sekolah Mitra Terpilih
                </label>
                <select
                  value={targetSchoolForPassword}
                  onChange={(e) => setTargetSchoolForPassword(e.target.value)}
                  className="w-full bg-[#060c1c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {INITIAL_SEKOLAH.map(s => (
                    <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kata Sandi Baru Sekolah
                </label>
                <input
                  type="password"
                  value={newSchoolPassInput}
                  onChange={(e) => setNewSchoolPassInput(e.target.value)}
                  placeholder="Minimal 5 karakter..."
                  className="w-full bg-[#060c1c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmSchoolPassInput}
                  onChange={(e) => setConfirmSchoolPassInput(e.target.value)}
                  placeholder="Ketik ulang kata sandi..."
                  className="w-full bg-[#060c1c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSetPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl transition shadow-md shadow-amber-500/20 hover:brightness-105"
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
