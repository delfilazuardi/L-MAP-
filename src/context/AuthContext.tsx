import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserAccount } from '../types';
import { INITIAL_USERS, INITIAL_SEKOLAH } from '../lib/initialData';
import { useData } from './DataContext';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAdmin: boolean;
  isSekolahMitra: boolean;
  login: (identifier: string, pass: string, expectedMode?: 'admin' | 'sekolah') => { success: boolean; message?: string };
  switchUser: (userId: string) => void;
  logout: () => void;
  allUsers: UserAccount[];
  updatePassword: (userIdOrSekolahId: string, newPass: string) => { success: boolean; message: string };
  resetPassword: (identifier: string, newPass: string) => { success: boolean; message: string };
  hasCustomPassword: (userIdOrSekolahId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'lmap_current_user_id';
const PASSWORDS_STORAGE_KEY = 'lmap_custom_passwords';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sekolahList } = useData();

  // Load custom passwords created by schools or admin
  const [customPasswords, setCustomPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveCustomPasswords = (updated: Record<string, string>) => {
    setCustomPasswords(updated);
    try {
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist custom passwords:', e);
    }
  };

  // Dynamically build allUsers from admin users + live sekolahList (or fallback to INITIAL_SEKOLAH)
  const allUsers = useMemo(() => {
    const admins = INITIAL_USERS.filter(u => u.akses === 'Full Akses').map(u => ({
      ...u,
      password: customPasswords[u.userId] || u.password || 'admin123',
    }));

    const activeSchools = (sekolahList && sekolahList.length > 0) ? sekolahList : INITIAL_SEKOLAH;
    const schoolUsers: UserAccount[] = activeSchools.map(s => {
      const existingUser = INITIAL_USERS.find(u => u.sekolahId === s.id || u.userId === s.id);
      return {
        userId: s.id,
        nama: s.namaSekolah,
        email: s.kontakEmail || s.email || existingUser?.email || `${s.id.toLowerCase()}@lazuardi.sch.id`,
        password: customPasswords[s.id] || existingUser?.password || 'admin123',
        role: (s.statusKerjasama === 'Afiliasi' || s.kategoriSekolah === 'Sekolah Afiliasi' || s.kategoriSekolah === 'Khusus Pelaporan')
          ? 'Sekolah Afiliasi'
          : 'Sekolah Mitra',
        akses: 'Akses Terbatas',
        status: s.statusKerjasama === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
        sekolahId: s.id,
      };
    });

    return [...admins, ...schoolUsers];
  }, [sekolahList, customPasswords]);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    // Selalu tampilkan halaman login saat pertama kali membuka link aplikasi
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  });

  // Sync currentUser with up-to-date data from allUsers/sekolahList
  useEffect(() => {
    if (currentUser?.sekolahId && sekolahList && sekolahList.length > 0) {
      const matchedSchool = sekolahList.find(s => s.id === currentUser.sekolahId);
      if (matchedSchool && matchedSchool.namaSekolah !== currentUser.nama) {
        setCurrentUser(prev => prev ? { ...prev, nama: matchedSchool.namaSekolah } : null);
      }
    }
  }, [sekolahList, currentUser?.sekolahId, currentUser?.nama]);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, currentUser.userId);
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  const isAdmin = currentUser?.akses === 'Full Akses' || 
    currentUser?.role === 'Kepala Bagian Mitra Office' || 
    currentUser?.role === 'Officer';

  const isSekolahMitra = !isAdmin && (currentUser?.role === 'Sekolah Mitra' || currentUser?.role === 'Sekolah Afiliasi');

  const hasCustomPassword = (userIdOrSekolahId: string): boolean => {
    const key = userIdOrSekolahId.trim();
    return Boolean(customPasswords[key] || customPasswords[key.toUpperCase()]);
  };

  const updatePassword = (userIdOrSekolahId: string, newPass: string) => {
    const cleanKey = userIdOrSekolahId.trim();
    if (!cleanKey) {
      return { success: false, message: 'ID Sekolah atau Pengguna tidak valid.' };
    }
    if (!newPass || newPass.trim().length < 5) {
      return { success: false, message: 'Kata sandi baru minimal 5 karakter.' };
    }

    const updated = {
      ...customPasswords,
      [cleanKey]: newPass.trim(),
    };
    saveCustomPasswords(updated);

    // If current user is this user, update state as well
    if (currentUser && (currentUser.userId === cleanKey || currentUser.sekolahId === cleanKey)) {
      setCurrentUser({
        ...currentUser,
        password: newPass.trim(),
      });
    }

    return { 
      success: true, 
      message: `Kata sandi untuk ${cleanKey} berhasil disimpan! Anda sekarang dapat masuk dengan kata sandi baru.` 
    };
  };

  const resetPassword = (identifier: string, newPass: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const user = allUsers.find(u => 
      u.userId.toLowerCase() === cleanId || 
      u.email.toLowerCase() === cleanId || 
      u.nama.toLowerCase() === cleanId ||
      (u.sekolahId && u.sekolahId.toLowerCase() === cleanId)
    );

    if (!user) {
      return { success: false, message: 'Pengguna atau Sekolah Mitra tidak ditemukan dalam sistem.' };
    }

    return updatePassword(user.userId, newPass);
  };

  const login = (identifier: string, pass: string, expectedMode?: 'admin' | 'sekolah') => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Enhanced user finder
    let user = allUsers.find(u => 
      u.userId.toLowerCase() === cleanId || 
      u.email.toLowerCase() === cleanId || 
      u.nama.toLowerCase() === cleanId ||
      (u.sekolahId && u.sekolahId.toLowerCase() === cleanId)
    );

    // If not found directly, perform contextual matching
    if (!user) {
      if (expectedMode === 'admin') {
        // Alias for admin
        if (cleanId === 'admin' || cleanId === 'administrator' || cleanId === 'mitra office' || cleanId === '') {
          user = allUsers.find(u => u.userId === 'admin' || u.userId === 'MO002' || u.userId === 'MO003');
        } else {
          user = allUsers.find(u => u.akses === 'Full Akses' && (
            u.nama.toLowerCase().includes(cleanId) || 
            u.email.toLowerCase().includes(cleanId)
          ));
        }
      } else if (expectedMode === 'sekolah') {
        // Find by partial school name or city or code
        user = allUsers.find(u => u.akses !== 'Full Akses' && (
          u.nama.toLowerCase().includes(cleanId) ||
          cleanId.includes(u.nama.toLowerCase()) ||
          u.email.toLowerCase().includes(cleanId) ||
          (u.sekolahId && cleanId.includes(u.sekolahId.toLowerCase()))
        ));
      }
    }

    if (!user) {
      return { 
        success: false, 
        message: expectedMode === 'sekolah' 
          ? 'Sekolah Mitra tidak ditemukan. Silakan pilih sekolah dari daftar yang tersedia.' 
          : 'ID Pengguna atau Email Administrator tidak terdaftar.' 
      };
    }

    // Determine effective password
    const customPass = customPasswords[user.userId] || (user.sekolahId ? customPasswords[user.sekolahId] : undefined);
    const validPassword = customPass || user.password || 'admin123';

    // Allow custom password OR admin123 as fallback for testing convenience
    const isPassMatch = cleanPass === validPassword || cleanPass === 'admin123';

    if (!isPassMatch) {
      return { 
        success: false, 
        message: customPass 
          ? 'Kata sandi tidak cocok dengan sandi sekolah yang telah dibuat. (Atau gunakan sandi sementara admin123)' 
          : 'Kata sandi salah. Gunakan sandi default "admin123" atau buat kata sandi baru.' 
      };
    }

    if (expectedMode === 'admin' && user.akses !== 'Full Akses') {
      return { success: false, message: 'Akun ini bukan Administrator Mitra Office. Silakan beralih ke tab Sekolah Mitra.' };
    }

    if (expectedMode === 'sekolah' && user.akses === 'Full Akses') {
      return { success: false, message: 'Akun ini adalah Administrator. Silakan gunakan tab Administrator.' };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const found = allUsers.find(u => u.userId === userId || u.sekolahId === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      isSekolahMitra,
      login,
      switchUser,
      logout,
      allUsers,
      updatePassword,
      resetPassword,
      hasCustomPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
