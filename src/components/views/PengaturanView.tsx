import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Image as ImageIcon, 
  Globe, 
  Building2, 
  Bell, 
  Upload, 
  RotateCcw, 
  Save, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Palette
} from 'lucide-react';
import { useSettings, AppSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { LMapLogo } from '../common/LMapLogo';

type SettingsTab = 'identitas' | 'bahasa' | 'lembaga' | 'notifikasi' | 'sistem';

export const PengaturanView: React.FC = () => {
  const { settings, updateSettings, resetSettings, resetLogoToDefault } = useSettings();
  const { isAdmin, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('identitas');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoUrl);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync formData whenever context settings changes
  React.useEffect(() => {
    setFormData(settings);
    setLogoPreview(settings.logoUrl);
  }, [settings]);

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoPreview(dataUrl);
        handleInputChange('logoUrl', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    const defaultUrl = '/lmap-logo.jpg';
    setLogoPreview(defaultUrl);
    handleInputChange('logoUrl', defaultUrl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Save to SettingsContext
    updateSettings(formData);

    setIsSubmitting(false);
    setSaveSuccessMsg('Pengaturan aplikasi berhasil disimpan dan langsung diterapkan ke seluruh sistem!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  const handleResetAll = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan seluruh pengaturan ke konfigurasi default pabrik?')) {
      resetSettings();
      setSaveSuccessMsg('Pengaturan sistem berhasil dikembalikan ke standar awal.');
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-800/40">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Settings size={26} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Pengaturan Sistem & Branding
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold font-mono">
                  v2.6.4
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-1 max-w-2xl leading-relaxed">
                Kelola identitas logo, bahasa antarmuka, format tahun ajaran, informasi lembaga, dan konfigurasi operasional aplikasi L-MAP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                title="Kembalikan semua pengaturan ke standar awal"
              >
                <RotateCcw size={14} />
                <span>Reset Standar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('identitas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'identitas'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ImageIcon size={16} />
          <span>Logo & Identitas Brand</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bahasa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'bahasa'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe size={16} />
          <span>Bahasa & Lokalisasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lembaga')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'lembaga'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 size={16} />
          <span>Profil Lembaga & Kontak</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifikasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'notifikasi'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell size={16} />
          <span>Notifikasi & Sistem</span>
        </button>
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: IDENTITAS & LOGO */}
        {activeTab === 'identitas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Fields (8 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-blue-600" />
                  <span>Kustomisasi Logo & Identitas Aplikasi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Logo dan judul aplikasi yang Anda unggah di sini akan langsung tampil pada Sidebar, Header navigasi, dan Dokumen resmi.
                </p>
              </div>

              {/* Upload Logo File */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Foto / Berkas Logo Aplikasi
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs shrink-0">
                    <img 
                      src={logoPreview} 
                      alt="Pratinjau Logo" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="text-xs text-slate-600">
                      Format didukung: <strong>PNG, JPG, SVG, WebP</strong>. Disarankan logo dengan latar belakang transparan (resolusi minimal 200x200 px).
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Pilih File Logo Baru</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Reset Logo Lazuardi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Judul Aplikasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Singkat Aplikasi (Akronim)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.appTitle}
                    onChange={(e) => handleInputChange('appTitle', e.target.value)}
                    placeholder="Contoh: L-MAP"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Format akronim dengan strip, misal <strong>L-MAP</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slogan / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="Together for Greater Impact"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Ditampilkan pada kartu selamat datang dan header
                  </span>
                </div>
              </div>

              {/* Input Kepanjangan / Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kepanjangan / Subtitle Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.appSubtitle}
                  onChange={(e) => handleInputChange('appSubtitle', e.target.value)}
                  placeholder="Lazuardi Mitra Administration Platform"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>Simpan Identitas & Logo</span>
                </button>
              </div>
            </div>

            {/* Live Preview Panel (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Eye size={14} className="text-blue-600" />
                    <span>Pratinjau Langsung (Live Preview)</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Real-time
                  </span>
                </div>

                {/* Pratinjau Tampilan Header Navigasi */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 mb-2 block">
                    1. Tampilan Header Atas:
                  </span>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-10 h-10 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shrink-0 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-blue-900 tracking-wider">
                          {formData.appTitle}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 font-bold truncate max-w-[170px]">
                          {formData.appSubtitle}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        Dashboard Eksekutif
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pratinjau Tampilan Sidebar Dark */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 mb-2 block">
                    2. Tampilan Navigasi Sidebar (Dark):
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center gap-3 shadow-md">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-9 h-9 object-contain rounded-xl border border-white/20 bg-white p-0.5 shrink-0"
                    />
                    <div>
                      <div className="text-sm font-black tracking-wider text-white">
                        {formData.appTitle}
                      </div>
                      <div className="text-[10px] text-blue-200/80 font-medium truncate max-w-[180px]">
                        {formData.appSubtitle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pratinjau Banner Tagline */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-100 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Tagline Kemitraan:</span>
                  </div>
                  <p className="text-xs text-blue-700 italic mt-1 font-medium">
                    "{formData.tagline}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BAHASA & LOKALISASI */}
        {activeTab === 'bahasa' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe size={18} className="text-blue-600" />
                <span>Pengaturan Bahasa & Format Lokalisasi</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Atur bahasa pengantar, format penulisan mata uang, dan tahun ajaran aktif sistem.
              </p>
            </div>

            {/* Pilihan Bahasa Antarmuka */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Bahasa Utama Antarmuka (Interface Language)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label 
                  onClick={() => handleInputChange('bahasa', 'id')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 cursor-pointer transition ${
                    formData.bahasa === 'id' 
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center font-bold text-xs text-red-800 shrink-0">
                    ID
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Bahasa Indonesia</span>
                      {formData.bahasa === 'id' && (
                        <CheckCircle2 size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Standar bahasa resmi seluruh modul dan pelaporan Lazuardi.
                    </p>
                  </div>
                </label>

                <label 
                  onClick={() => handleInputChange('bahasa', 'en')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 cursor-pointer transition ${
                    formData.bahasa === 'en' 
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-800 shrink-0">
                    EN
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">English (Global)</span>
                      {formData.bahasa === 'en' && (
                        <CheckCircle2 size={16} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Interface elements with English localization.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Format Nilai & Tahun Ajaran */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar size={13} className="text-blue-600" />
                  <span>Default Tahun Ajaran Aktif</span>
                </label>
                <select
                  value={formData.tahunAjaranAktif}
                  onChange={(e) => handleInputChange('tahunAjaranAktif', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="2026/2027">TA 2026/2027 (Berjalan)</option>
                  <option value="2025/2026">TA 2025/2026</option>
                  <option value="2024/2025">TA 2024/2025</option>
                  <option value="2023/2024">TA 2023/2024</option>
                  <option value="2022/2023">TA 2022/2023</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Digunakan sebagai default pembuatan invoice & filter
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <DollarSign size={13} className="text-blue-600" />
                  <span>Mata Uang Acuan</span>
                </label>
                <select
                  value={formData.formatMataUang}
                  onChange={(e) => handleInputChange('formatMataUang', e.target.value as 'IDR' | 'USD')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="IDR">Rupiah Indonesia (Rp / IDR)</option>
                  <option value="USD">US Dollar ($ / USD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock size={13} className="text-blue-600" />
                  <span>Format Tampilan Tanggal</span>
                </label>
                <select
                  value={formData.formatTanggal}
                  onChange={(e) => handleInputChange('formatTanggal', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (contoh: 28/09/2026)</option>
                  <option value="D MMMM YYYY">D MMMM YYYY (contoh: 28 September 2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (Standar ISO)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>Simpan Pengaturan Bahasa</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PROFIL LEMBAGA & KONTAK HOTLINE */}
        {activeTab === 'lembaga' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                <span>Profil Lembaga Pengelola & Layanan Bantuan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Informasi ini ditampilkan di footer dokumen invoice resmi, lembar disposisi, dan menu kontak Sekolah Mitra.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Badan / Kantor Pengelola
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaLembaga}
                  onChange={(e) => handleInputChange('namaLembaga', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail size={13} className="text-blue-600" />
                  <span>Email Dukungan Resmi</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.emailHotline}
                  onChange={(e) => handleInputChange('emailHotline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-emerald-600" />
                  <span>Nomor WhatsApp Hotline Kemitraan</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.waHotline}
                  onChange={(e) => handleInputChange('waHotline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock size={13} className="text-blue-600" />
                  <span>Jam Operasional Layanan</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.jamLayanan}
                  onChange={(e) => handleInputChange('jamLayanan', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={13} className="text-rose-600" />
                <span>Alamat Kantor Pusat Yayasan Lazuardi</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.alamatKantor}
                onChange={(e) => handleInputChange('alamatKantor', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>Simpan Profil Lembaga</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFIKASI & SISTEM */}
        {activeTab === 'notifikasi' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bell size={18} className="text-blue-600" />
                <span>Preferensi Notifikasi & Otomasi Sistem</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kelola bagaimana sistem memberitahu admin dan mitra mengenai dokumen serta jatuh tempo tagihan.
              </p>
            </div>

            <div className="space-y-4">
              {/* Notif 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Notifikasi Email Laporan Bulanan Masuk
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kirim email otomatis ke tim kurikulum dan pengawas saat Sekolah Mitra mengajukan laporan baru.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifikasiLaporanMasuk}
                  onChange={(e) => handleInputChange('notifikasiLaporanMasuk', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Notif 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Pengingat Otomatis Invoice Jatuh Tempo (H-7 & H-1)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Berikan tanda badge visual peringatan dan pengingat saat tanggal jatuh tempo pembayaran mendekat.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.pengingatJatuhTempo}
                  onChange={(e) => handleInputChange('pengingatJatuhTempo', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Notif 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Notifikasi Pengajuan Program Mitra (Visitasi & Magang)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tampilkan badge indikator di tab Program Mitra saat ada berkas atau jadwal magang baru diajukan.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifikasiProgramMitra}
                  onChange={(e) => handleInputChange('notifikasiProgramMitra', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Notif 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Laporan Status Kemitraan MenDAKI Lazuardi
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kompilasi otomatis rekap nilai evaluasi mutu sekolah setiap semester ke dalam dashboard pimpinan.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifikasiEmail}
                  onChange={(e) => handleInputChange('notifikasiEmail', e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Save size={16} />
                <span>Simpan Pengaturan Notifikasi</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PengaturanView;
