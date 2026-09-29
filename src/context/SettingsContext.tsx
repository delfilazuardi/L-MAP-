import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppSettings {
  logoUrl: string;
  appTitle: string;
  appSubtitle: string;
  tagline: string;
  bahasa: 'id' | 'en';
  tahunAjaranAktif: string;
  formatMataUang: 'IDR' | 'USD';
  formatTanggal: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'D MMMM YYYY';
  namaLembaga: string;
  alamatKantor: string;
  emailHotline: string;
  waHotline: string;
  jamLayanan: string;
  notifikasiEmail: boolean;
  pengingatJatuhTempo: boolean;
  notifikasiLaporanMasuk: boolean;
  notifikasiProgramMitra: boolean;
  temaWarna: 'blue' | 'emerald' | 'indigo' | 'purple';
}

export const DEFAULT_SETTINGS: AppSettings = {
  logoUrl: '/lmap-logo.jpg',
  appTitle: 'L-MAP',
  appSubtitle: 'Lazuardi Mitra Administration Platform',
  tagline: 'Together for Greater Impact',
  bahasa: 'id',
  tahunAjaranAktif: '2026/2027',
  formatMataUang: 'IDR',
  formatTanggal: 'DD/MM/YYYY',
  namaLembaga: 'Mitra Office Yayasan Lazuardi Hayati',
  alamatKantor: 'Jl. Cinere Raya No. 19, Cinere, Depok, Jawa Barat 16514',
  emailHotline: 'mitra.office@lazuardi.sch.id',
  waHotline: '+62 813-8899-1122',
  jamLayanan: 'Senin - Jumat, 08:00 - 16:30 WIB',
  notifikasiEmail: true,
  pengingatJatuhTempo: true,
  notifikasiLaporanMasuk: true,
  notifikasiProgramMitra: true,
  temaWarna: 'blue',
};

const SETTINGS_STORAGE_KEY = 'lmap_app_settings';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  resetLogoToDefault: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save app settings:', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Failed to reset app settings:', e);
    }
  };

  const resetLogoToDefault = () => {
    updateSettings({ logoUrl: DEFAULT_SETTINGS.logoUrl });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        resetLogoToDefault,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
