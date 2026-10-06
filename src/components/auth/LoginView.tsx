import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Building2,
  GraduationCap, 
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
import { useData } from '../../context/DataContext';
import { INITIAL_SEKOLAH } from '../../lib/initialData';
import { DEMO_SEKOLAH, DEMO_SEKOLAH_ID } from '../../lib/demoData';
import { LMapLogo } from '../common/LMapLogo';

export const LoginView: React.FC = () => {
  const { login, loginGuruWithGoogle, updatePassword, resetPassword, guruList } = useAuth();
  const { sekolahList } = useData();
  
  // Tab: 'admin' | 'sekolah' | 'guru'
  const [activeTab, setActiveTab] = useState<'admin' | 'sekolah' | 'guru'>('admin');
  
  // Available schools from live state (including Lazuardi Cinere)
  const availableSchools = useMemo(() => {
    const list = (sekolahList && sekolahList.length > 0) ? sekolahList : INITIAL_SEKOLAH;
    if (!list.some(s => s.id === DEMO_SEKOLAH_ID)) {
      return [...list, DEMO_SEKOLAH];
    }
    return list;
  }, [sekolahList]);
  
  // Admin form state (Password TIDAK otomatis terisi)
  const [adminIdentifier, setAdminIdentifier] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Sekolah form state (Password TIDAK otomatis terisi)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('MO004'); // default Al-Falah Depok
  const [schoolPassword, setSchoolPassword] = useState('');
  const [showSchoolPass, setShowSchoolPass] = useState(false);

  // Guru form state (Hanya Nama Sekolah & Login Google)
  const [selectedGuruSchoolId, setSelectedGuruSchoolId] = useState<string>('MO004');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [showManualGoogleInput, setShowManualGoogleInput] = useState<boolean>(false);
  const [manualGoogleEmail, setManualGoogleEmail] = useState<string>('');
  const [manualGoogleNama, setManualGoogleNama] = useState<string>('');

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
    return availableSchools.find(s => s.id === selectedSchoolId) || availableSchools[0];
  }, [availableSchools, selectedSchoolId]);

  // Selected school object for Guru tab
  const currentGuruSchool = useMemo(() => {
    return availableSchools.find(s => s.id === selectedGuruSchoolId) || availableSchools[0];
  }, [availableSchools, selectedGuruSchoolId]);

  const handleTabChange = (tab: 'admin' | 'sekolah' | 'guru') => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const idToUse = adminIdentifier.trim() || 'admin';
    const passToUse = adminPassword.trim();

    if (!passToUse) {
      setErrorMsg('Silakan masukkan kata sandi Administrator terlebih dahulu.');
      return;
    }

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

    const passToUse = schoolPassword.trim();
    if (!passToUse) {
      setErrorMsg('Silakan masukkan kata sandi Sekolah Mitra terlebih dahulu.');
      return;
    }

    const res = login(selectedSchoolId, passToUse, 'sekolah');
    if (!res.success) {
      setErrorMsg(res.message || 'Login Sekolah Mitra gagal.');
    } else {
      setSuccessMsg(`Login berhasil sebagai ${currentSchool.namaSekolah}!`);
    }
  };

  const handleGuruGooglePopupLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedGuruSchoolId) {
      setErrorMsg('Silakan pilih Nama Sekolah Mitra terlebih dahulu.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const res = await loginGuruWithGoogle(selectedGuruSchoolId);
      if (!res.success) {
        if (res.popupBlocked) {
          setShowManualGoogleInput(true);
        }
        setErrorMsg(res.message || 'Login Google gagal.');
      } else {
        setSuccessMsg(res.message || `Login Google berhasil sebagai Guru ${currentGuruSchool.namaSekolah}!`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuruManualGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedGuruSchoolId) {
      setErrorMsg('Silakan pilih Nama Sekolah Mitra terlebih dahulu.');
      return;
    }
    const cleanEmail = manualGoogleEmail.trim();
    const cleanNama = manualGoogleNama.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Silakan masukkan alamat Email Google yang valid.');
      return;
    }
    if (!cleanNama) {
      setErrorMsg('Silakan masukkan Nama Lengkap pemilik akun Google.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const res = await loginGuruWithGoogle(selectedGuruSchoolId, {
        email: cleanEmail,
        nama: cleanNama,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Login Google gagal.');
      } else {
        setSuccessMsg(res.message || `Login Google berhasil sebagai Guru ${currentGuruSchool.namaSekolah}!`);
      }
    } finally {
      setIsGoogleLoading(false);
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

            {/* Segmented Switcher (Administrator vs Sekolah Mitra vs Guru Mitra) */}
            <div className="p-1 bg-[#060c1c] rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-1">
              <button
                id="login-tab-admin"
                type="button"
                onClick={() => handleTabChange('admin')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#0f1b38] border border-amber-500/70 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <ShieldCheck size={15} className={activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'} />
                <span className="truncate">Admin</span>
              </button>

              <button
                id="login-tab-sekolah"
                type="button"
                onClick={() => handleTabChange('sekolah')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sekolah'
                    ? 'bg-[#0f1b38] border border-amber-500/70 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Building2 size={15} className={activeTab === 'sekolah' ? 'text-amber-400' : 'text-slate-400'} />
                <span className="truncate">Sekolah</span>
              </button>

              <button
                id="login-tab-guru"
                type="button"
                onClick={() => handleTabChange('guru')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'guru'
                    ? 'bg-[#0f1b38] border border-purple-500/70 text-purple-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <GraduationCap size={15} className={activeTab === 'guru' ? 'text-purple-300' : 'text-slate-400'} />
                <span className="truncate">Guru Mitra</span>
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
                      autoComplete="new-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
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
                        {availableSchools.map((school) => (
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
                      autoComplete="new-password"
                      value={schoolPassword}
                      onChange={(e) => setSchoolPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
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

            {/* TAB: GURU MITRA FORM (HANYA NAMA SEKOLAH & LOGIN GOOGLE) */}
            {activeTab === 'guru' && (
              <div className="space-y-4">
                {/* Access scope banner */}
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200/90 leading-relaxed flex items-start gap-2.5">
                  <GraduationCap size={16} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-purple-300">Login Guru Mitra via Google</p>
                    <p className="text-[11px] text-purple-200/75 mt-0.5">
                      Pilih nama sekolah mitra Anda lalu masuk menggunakan akun Google. Identitas Google yang login akan otomatis tercatat di sistem.
                    </p>
                  </div>
                </div>

                {/* 1. Pilih Nama Sekolah Asal Guru */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Nama Sekolah Mitra
                  </label>
                  <div className="relative bg-[#060c1c] border border-slate-800/90 rounded-xl focus-within:border-purple-400 transition">
                    <div className="flex items-center px-3 py-1">
                      <Building2 size={18} className="text-purple-400 shrink-0 mr-2.5" />
                      <select
                        id="guru-school-select"
                        value={selectedGuruSchoolId}
                        onChange={(e) => {
                          setSelectedGuruSchoolId(e.target.value);
                          setErrorMsg('');
                        }}
                        className="w-full bg-transparent py-2.5 text-xs sm:text-sm text-white font-semibold focus:outline-none cursor-pointer pr-6"
                      >
                        {availableSchools.map((s) => (
                          <option key={s.id} value={s.id} className="bg-[#0b1329] text-white py-2">
                            {s.namaSekolah}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Tombol Login Menggunakan Google */}
                <div className="pt-1 space-y-2.5">
                  <button
                    id="guru-google-login-btn"
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleGuruGooglePopupLogin}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-slate-900 text-xs sm:text-sm bg-white hover:bg-slate-100 active:scale-[0.99] transition shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                  >
                    {/* Official Google "G" SVG */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>
                      {isGoogleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}
                    </span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowManualGoogleInput(prev => !prev)}
                      className="text-[11px] font-semibold text-purple-300/80 hover:text-purple-200 underline cursor-pointer"
                    >
                      {showManualGoogleInput
                        ? 'Sembunyikan input akun Google manual'
                        : 'Pop-up Google terblokir browser? Masuk dengan ketik Email Google'}
                    </button>
                  </div>
                </div>

                {/* Form Konfirmasi Akun Google jika pop-up browser terblokir di iframe */}
                {showManualGoogleInput && (
                  <form
                    onSubmit={handleGuruManualGoogleSubmit}
                    className="p-3.5 rounded-2xl bg-[#060c1c] border border-purple-500/40 space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <Mail size={14} className="text-purple-400" />
                      <span>Identitas Akun Google Guru</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Nama Lengkap (Akun Google)
                      </label>
                      <input
                        type="text"
                        required
                        value={manualGoogleNama}
                        onChange={(e) => setManualGoogleNama(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        className="w-full px-3 py-2 bg-[#0b1329] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Alamat Email Google
                      </label>
                      <input
                        type="email"
                        required
                        value={manualGoogleEmail}
                        onChange={(e) => setManualGoogleEmail(e.target.value)}
                        placeholder="nama@gmail.com / @lazuardi.sch.id"
                        className="w-full px-3 py-2 bg-[#0b1329] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isGoogleLoading}
                      className="w-full py-2.5 rounded-xl font-bold text-white text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-105 transition shadow-md cursor-pointer"
                    >
                      Lanjutkan Masuk sebagai Guru {currentGuruSchool?.namaSekolah}
                    </button>
                  </form>
                )}
              </div>
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
                    {availableSchools.map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Guru Sekolah Mitra">
                    {(guruList || []).map(g => (
                      <option key={g.userId} value={g.userId}>{g.nama} ({g.sekolahId})</option>
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
