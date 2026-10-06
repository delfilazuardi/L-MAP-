import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, sanitizeForFirestore, toFirestoreDocId } from '../lib/firebase';
import { UserAccount } from '../types';
import { INITIAL_USERS, INITIAL_SEKOLAH, INITIAL_GURU_MITRA } from '../lib/initialData';
import { DEMO_USER, DEMO_SEKOLAH, DEMO_SEKOLAH_ID } from '../lib/demoData';
import { useData } from './DataContext';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAdmin: boolean;
  isSekolahMitra: boolean;
  isGuruMitra: boolean;
  isDemoMitra: boolean;
  guruList: UserAccount[];
  loginDemo: () => { success: boolean };
  login: (
    identifier: string, 
    pass: string, 
    expectedMode?: 'admin' | 'sekolah' | 'guru',
    extraGuruData?: { nama?: string; sekolahId?: string; mapel?: string }
  ) => { success: boolean; message?: string };
  loginGuruWithGoogle: (
    sekolahId: string,
    manualGoogleAccount?: { email: string; nama: string; photoUrl?: string; uid?: string }
  ) => Promise<{ success: boolean; message?: string; popupBlocked?: boolean; user?: UserAccount }>;
  deleteGuruAccount: (userId: string) => Promise<void>;
  registerGuru: (data: { 
    nama: string; 
    sekolahId: string; 
    email?: string; 
    password?: string; 
    mapel?: string; 
    nip?: string 
  }) => { success: boolean; message: string; user?: UserAccount };
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
const GURU_STORAGE_KEY = 'lmap_registered_guru';

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

  // State for registered Guru Mitra (synced with Firestore guru_mitra collection)
  const [guruList, setGuruList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(GURU_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map(g => g.userId));
          const missingDefaults = INITIAL_GURU_MITRA.filter(g => !ids.has(g.userId));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_GURU_MITRA;
  });

  // Subscribe to Firestore guru_mitra collection for real-time tracking of Google logins
  useEffect(() => {
    const colRef = collection(db, 'guru_mitra');
    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed initial guru accounts to Firestore if empty
          for (const g of INITIAL_GURU_MITRA) {
            const matchedSchool = INITIAL_SEKOLAH.find(s => s.id === g.sekolahId);
            const enriched: UserAccount = {
              ...g,
              namaSekolah: g.namaSekolah || matchedSchool?.namaSekolah || g.sekolahId,
            };
            try {
              await setDoc(doc(db, 'guru_mitra', toFirestoreDocId(g.userId)), sanitizeForFirestore(enriched));
            } catch {
              // ignore
            }
          }
          return;
        }
        const docs = snapshot.docs.map(d => d.data() as UserAccount);
        setGuruList(docs);
        try {
          localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(docs));
        } catch {
          // ignore
        }
      },
      (err) => {
        console.warn('Firestore guru_mitra listener warning:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveGuruList = (newList: UserAccount[]) => {
    setGuruList(newList);
    try {
      localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to persist registered guru list:', e);
    }
  };

  // Function to login Guru Mitra via Google + Nama Sekolah and record to Firestore
  const loginGuruWithGoogle = useCallback(async (
    sekolahId: string,
    manualGoogleAccount?: { email: string; nama: string; photoUrl?: string; uid?: string }
  ): Promise<{ success: boolean; message?: string; popupBlocked?: boolean; user?: UserAccount }> => {
    if (!sekolahId) {
      return { success: false, message: 'Silakan pilih Nama Sekolah Mitra terlebih dahulu.' };
    }

    const allAvailableSchools = [...(sekolahList && sekolahList.length > 0 ? sekolahList : INITIAL_SEKOLAH), DEMO_SEKOLAH];
    const targetSchool = allAvailableSchools.find(s => s.id === sekolahId);
    const schoolName = targetSchool ? targetSchool.namaSekolah : sekolahId;

    let googleEmail = manualGoogleAccount?.email?.trim() || '';
    let googleName = manualGoogleAccount?.nama?.trim() || '';
    let googlePhoto = manualGoogleAccount?.photoUrl || '';
    let googleUid = manualGoogleAccount?.uid || '';

    if (!manualGoogleAccount) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        googleEmail = fbUser.email || '';
        googleName = fbUser.displayName || (googleEmail ? googleEmail.split('@')[0] : 'Guru Mitra');
        googlePhoto = fbUser.photoURL || '';
        googleUid = fbUser.uid || '';
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          return {
            success: false,
            message: 'Jendela login Google ditutup sebelum selesai. Silakan coba lagi.',
          };
        }
        // Popup blocked by browser / iframe or unauthorized preview domain
        return {
          success: false,
          popupBlocked: true,
          message: 'Pop-up Google diblokir oleh browser/jendela pratinjau. Silakan masukkan akun Google Anda pada kolom konfirmasi di bawah untuk melanjutkan.',
        };
      }
    }

    if (!googleEmail) {
      return { success: false, message: 'Email Google tidak ditemukan.' };
    }

    const cleanEmail = googleEmail.toLowerCase();
    const emailSlug = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const existingGuru = guruList.find(
      g => g.email.toLowerCase() === cleanEmail
    );

    const userId = existingGuru?.userId || `GURU-GGL-${emailSlug.slice(0, 24).toUpperCase()}`;
    const nowFormatted = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const recordedGuru: UserAccount = {
      userId,
      nama: googleName || existingGuru?.nama || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'Guru Mitra',
      akses: 'Akses Terbatas',
      status: 'Aktif',
      sekolahId,
      namaSekolah: schoolName,
      mapel: existingGuru?.mapel || 'Guru Mitra (Google Login)',
      photoUrl: googlePhoto || existingGuru?.photoUrl || undefined,
      googleUid: googleUid || existingGuru?.googleUid || undefined,
      lastLoginAt: nowFormatted,
      loginCount: (existingGuru?.loginCount || 0) + 1,
      isDemo: sekolahId === DEMO_SEKOLAH_ID ? true : undefined,
    };

    const updatedList = [
      recordedGuru,
      ...guruList.filter(g => g.userId !== userId && g.email.toLowerCase() !== cleanEmail),
    ];
    saveGuruList(updatedList);
    setCurrentUser(recordedGuru);

    try {
      await setDoc(
        doc(db, 'guru_mitra', toFirestoreDocId(userId)),
        sanitizeForFirestore(recordedGuru)
      );
    } catch (e) {
      console.error('Failed to record Guru Google login to Firestore:', e);
    }

    return {
      success: true,
      message: `Selamat datang, ${recordedGuru.nama} (${schoolName})!`,
      user: recordedGuru,
    };
  }, [sekolahList, guruList]);

  const deleteGuruAccount = useCallback(async (userId: string) => {
    setGuruList(prev => {
      const next = prev.filter(g => g.userId !== userId);
      try {
        localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    try {
      await deleteDoc(doc(db, 'guru_mitra', toFirestoreDocId(userId)));
    } catch (e) {
      console.error('Failed to delete guru account from Firestore:', e);
    }
  }, []);

  // Function to register a new teacher from a partner school
  const registerGuru = (data: {
    nama: string;
    sekolahId: string;
    email?: string;
    password?: string;
    mapel?: string;
    nip?: string;
  }) => {
    const cleanNama = data.nama.trim();
    if (!cleanNama) {
      return { success: false, message: 'Nama guru wajib diisi.' };
    }
    if (!data.sekolahId) {
      return { success: false, message: 'Sekolah asal guru wajib dipilih.' };
    }

    const cleanPass = data.password?.trim() || 'guru123';
    const newId = `GURU-${data.sekolahId}-${Date.now().toString().slice(-4)}`;
    const cleanEmail = data.email?.trim() || `${cleanNama.toLowerCase().replace(/[^a-z0-9]/g, '')}@lazuardi.sch.id`;

    const newGuru: UserAccount = {
      userId: newId,
      nama: cleanNama,
      email: cleanEmail,
      password: cleanPass,
      role: 'Guru Mitra',
      akses: 'Akses Terbatas',
      status: 'Aktif',
      sekolahId: data.sekolahId,
      mapel: data.mapel || 'Guru Pengajar',
      nip: data.nip || undefined,
    };

    const updated = [newGuru, ...guruList];
    saveGuruList(updated);

    setDoc(doc(db, 'guru_mitra', toFirestoreDocId(newId)), sanitizeForFirestore(newGuru)).catch(() => {});

    if (data.password) {
      saveCustomPasswords({ ...customPasswords, [newId]: cleanPass });
    }

    return { 
      success: true, 
      message: `Akun Guru Mitra untuk ${cleanNama} berhasil didaftarkan!`,
      user: newGuru
    };
  };

  // Dynamically build allUsers from admin users + live sekolahList + registered guruList
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

    const gurusWithPass = guruList.map(g => ({
      ...g,
      password: customPasswords[g.userId] || g.password || 'guru123',
    }));

    return [...admins, ...schoolUsers, ...gurusWithPass, DEMO_USER];
  }, [sekolahList, customPasswords, guruList]);

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
    if (currentUser?.sekolahId && currentUser.role !== 'Guru Mitra' && sekolahList && sekolahList.length > 0) {
      const matchedSchool = sekolahList.find(s => s.id === currentUser.sekolahId);
      if (matchedSchool && matchedSchool.namaSekolah !== currentUser.nama) {
        setCurrentUser(prev => prev ? { ...prev, nama: matchedSchool.namaSekolah } : null);
      }
    }
  }, [sekolahList, currentUser?.sekolahId, currentUser?.nama, currentUser?.role]);

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

  const isGuruMitra = currentUser?.role === 'Guru Mitra';

  const isDemoMitra = Boolean(currentUser?.isDemo || currentUser?.userId === DEMO_SEKOLAH_ID || currentUser?.sekolahId === DEMO_SEKOLAH_ID);

  const isSekolahMitra = !isAdmin && !isGuruMitra && (currentUser?.role === 'Sekolah Mitra' || currentUser?.role === 'Sekolah Afiliasi');

  const loginDemo = () => {
    setCurrentUser(DEMO_USER);
    return { success: true };
  };

  const hasCustomPassword = (userIdOrSekolahId: string): boolean => {
    const key = userIdOrSekolahId.trim();
    return Boolean(customPasswords[key] || customPasswords[key.toUpperCase()]);
  };

  const updatePassword = (userIdOrSekolahId: string, newPass: string) => {
    const cleanKey = userIdOrSekolahId.trim();
    if (!cleanKey) {
      return { success: false, message: 'ID Pengguna tidak valid.' };
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
      message: `Kata sandi untuk ${cleanKey} berhasil disimpan!` 
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
      return { success: false, message: 'Pengguna tidak ditemukan dalam sistem.' };
    }

    return updatePassword(user.userId, newPass);
  };

  const login = (
    identifier: string, 
    pass: string, 
    expectedMode?: 'admin' | 'sekolah' | 'guru',
    extraGuruData?: { nama?: string; sekolahId?: string; mapel?: string }
  ) => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Mode Akses Sekolah Lazuardi Cinere
    if (cleanId === 'cinere' || cleanId === 'mo-cinere' || cleanId.includes('cinere') || cleanId === 'demo' || cleanId === 'demo-mitra' || cleanId === DEMO_SEKOLAH_ID.toLowerCase() || cleanId === 'mo-demo') {
      setCurrentUser(DEMO_USER);
      return { success: true };
    }

    // Mode Guru Khusus: login guru mitra cukup memilih sekolah dan kata sandi default/khusus
    if (expectedMode === 'guru') {
      const targetSekolahId = extraGuruData?.sekolahId || cleanId.toUpperCase();
      
      // 1. Cari apakah ada akun guru yang terasosiasi dengan sekolah ini
      let matchedGuru = guruList.find(g => 
        g.sekolahId === targetSekolahId || 
        g.sekolahId.toLowerCase() === cleanId ||
        g.userId.toLowerCase() === cleanId ||
        g.nama.toLowerCase().includes(cleanId)
      );

      // 2. Jika belum ada akun guru untuk sekolah ini, buatkan akun guru representatif sekolah mitra
      if (!matchedGuru && targetSekolahId) {
        const targetSchool = (sekolahList && sekolahList.find(s => s.id === targetSekolahId)) 
          || INITIAL_SEKOLAH.find(s => s.id === targetSekolahId);
        const schoolName = targetSchool ? targetSchool.namaSekolah : targetSekolahId;

        const regRes = registerGuru({
          nama: `Guru Mitra ${schoolName}`,
          sekolahId: targetSekolahId,
          password: cleanPass || 'guru123',
          mapel: 'Guru Pengajar Mitra',
        });
        if (regRes.success && regRes.user) {
          matchedGuru = regRes.user;
        }
      }

      if (!matchedGuru) {
        return {
          success: false,
          message: 'Sekolah Mitra tidak ditemukan. Silakan pilih sekolah dari daftar.',
        };
      }

      const customPass = customPasswords[matchedGuru.userId] || (matchedGuru.sekolahId ? customPasswords[matchedGuru.sekolahId] : undefined);
      const guruPass = customPass || matchedGuru.password || 'guru123';
      const isPassMatch = cleanPass === guruPass || cleanPass === 'guru123' || cleanPass === 'admin123';

      if (!isPassMatch) {
        return {
          success: false,
          message: 'Kata sandi guru salah. Gunakan sandi default "guru123" atau sandi yang telah diatur.',
        };
      }

      setCurrentUser(matchedGuru);
      return { success: true };
    }

    // Enhanced user finder for Admin & Sekolah
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
        user = allUsers.find(u => u.role !== 'Guru Mitra' && u.akses !== 'Full Akses' && (
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
          ? 'Kata sandi tidak cocok dengan sandi yang telah dibuat. (Atau gunakan sandi sementara admin123)' 
          : 'Kata sandi salah. Gunakan sandi default "admin123" atau buat kata sandi baru.' 
      };
    }

    if (expectedMode === 'admin' && user.akses !== 'Full Akses') {
      return { success: false, message: 'Akun ini bukan Administrator Mitra Office. Silakan beralih ke tab Sekolah Mitra atau Guru Mitra.' };
    }

    if (expectedMode === 'sekolah' && user.akses === 'Full Akses') {
      return { success: false, message: 'Akun ini adalah Administrator. Silakan gunakan tab Administrator.' };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    // Hanya administrator yang dapat mengganti ke akun lainnya
    if (!isAdmin) {
      console.warn('Pergantian akun hanya diizinkan untuk Administrator.');
      return;
    }
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
      isGuruMitra,
      isDemoMitra,
      loginDemo,
      guruList,
      login,
      loginGuruWithGoogle,
      deleteGuruAccount,
      registerGuru,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
