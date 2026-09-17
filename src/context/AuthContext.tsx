import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserAccount } from '../types';
import { INITIAL_USERS } from '../lib/initialData';

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
  // Load custom passwords created by schools or admin
  const [customPasswords, setCustomPasswords] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedId) {
      const found = INITIAL_USERS.find(u => u.userId === savedId);
      if (found) return found;
    }
    // Default to Anita Sulastri (Admin) for immediate rich view
    return INITIAL_USERS[0];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, currentUser.userId);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  const saveCustomPasswords = (updated: Record<string, string>) => {
    setCustomPasswords(updated);
    try {
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist custom passwords:', e);
    }
  };

  const allUsers = useMemo(() => {
    return INITIAL_USERS.map(u => ({
      ...u,
      password: customPasswords[u.userId] || customPasswords[u.sekolahId || ''] || u.password || 'admin123',
    }));
  }, [customPasswords]);

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
