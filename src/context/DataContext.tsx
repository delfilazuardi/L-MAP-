import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  SekolahMitra, 
  LaporanBulanan, 
  Invoice, 
  Pembayaran, 
  EventItem, 
  PermintaanMitra, 
  StaffActivity, 
  AdminMitraStaff,
  TemplateDokumen, 
  PerformanceMenDAKI,
  LaporanStatus,
  PembayaranStatus,
  PermintaanStatus,
  UserAccount,
  SheetPerhitunganData,
  InvoiceKategori
} from '../types';
import { 
  INITIAL_SEKOLAH, 
  INITIAL_LAPORAN, 
  INITIAL_INVOICES, 
  INITIAL_PEMBAYARAN, 
  INITIAL_EVENTS, 
  INITIAL_PERMINTAAN, 
  INITIAL_STAFF_ACTIVITY, 
  INITIAL_ADMIN_STAFF,
  INITIAL_TEMPLATES, 
  INITIAL_PERFORMANCE_MENDAKI,
  INITIAL_USERS
} from '../lib/initialData';
import { generateNomorInvoiceBaru } from '../lib/invoiceUtils';
import { db, handleFirestoreError, OperationType, testConnection, sanitizeForFirestore } from '../lib/firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';

interface DataContextType {
  sekolahList: SekolahMitra[];
  laporanList: LaporanBulanan[];
  invoiceList: Invoice[];
  pembayaranList: Pembayaran[];
  eventList: EventItem[];
  permintaanList: PermintaanMitra[];
  staffActivityList: StaffActivity[];
  adminStaffList: AdminMitraStaff[];
  templateList: TemplateDokumen[];
  performanceList: PerformanceMenDAKI[];
  isFirebaseConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncStatusMessage: string;
  
  // Actions
  addLaporan: (laporan: Omit<LaporanBulanan, 'id' | 'tanggalDiajukan'>) => Promise<void>;
  updateLaporan: (laporan: LaporanBulanan) => Promise<void>;
  deleteLaporan: (id: string) => Promise<void>;
  reviewLaporan: (id: string, status: LaporanStatus, catatanAdmin?: string) => Promise<void>;
  updateLaporanSheet: (id: string, sheetData: SheetPerhitunganData) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'> & { id?: string }) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  addPembayaran: (pembayaran: Omit<Pembayaran, 'id'>) => Promise<void>;
  updatePembayaran: (pembayaran: Pembayaran) => Promise<void>;
  deletePembayaran: (id: string) => Promise<void>;
  verifyPembayaran: (id: string, status: PembayaranStatus, catatan?: string) => Promise<void>;
  addEvent: (event: Omit<EventItem, 'id'>) => Promise<void>;
  updateEvent: (event: EventItem) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addPermintaan: (permintaan: Omit<PermintaanMitra, 'id' | 'tanggalPengajuan'>) => Promise<void>;
  updatePermintaan: (permintaan: PermintaanMitra) => Promise<void>;
  deletePermintaan: (id: string) => Promise<void>;
  updatePermintaanStatus: (id: string, status: PermintaanStatus, noResi?: string, catatanAdmin?: string) => Promise<void>;
  addSekolah: (sekolah: SekolahMitra) => Promise<void>;
  updateSekolah: (sekolahOrId: SekolahMitra | string, updates?: Partial<SekolahMitra>) => Promise<void>;
  deleteSekolah: (id: string) => Promise<void>;
  addStaffActivity: (activity: Omit<StaffActivity, 'id'>) => Promise<void>;
  updateStaffActivity: (activity: StaffActivity) => Promise<void>;
  deleteStaffActivity: (id: string) => Promise<void>;
  addAdminStaff: (staff: Omit<AdminMitraStaff, 'id'>) => Promise<void>;
  updateAdminStaff: (staff: AdminMitraStaff) => Promise<void>;
  deleteAdminStaff: (id: string) => Promise<void>;
  addTemplate: (template: Omit<TemplateDokumen, 'id'>) => Promise<void>;
  updateTemplate: (template: TemplateDokumen) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  savePerformance: (perf: PerformanceMenDAKI) => Promise<void>;
  updatePerformance: (perf: PerformanceMenDAKI) => Promise<void>;
  deletePerformance: (id: string) => Promise<void>;
  syncWithSheetData: (parsedUsers?: UserAccount[]) => Promise<void>;
  bulkImportInvoiceAndPayment: (
    newInvoices: Invoice[],
    newPayments: Pembayaran[],
    mode?: 'merge' | 'replace'
  ) => Promise<{ invoiceCount: number; paymentCount: number }>;
  loadHistoricalTransactionsSince2022: () => Promise<{ invoiceCount: number; paymentCount: number }>;
  resetToDefaultData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage Keys
const STORAGE_PREFIX = 'lmap_data_';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sekolahList, setSekolahList] = useState<SekolahMitra[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'sekolah');
    return saved ? JSON.parse(saved) : INITIAL_SEKOLAH;
  });

  const [laporanList, setLaporanList] = useState<LaporanBulanan[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'laporan');
    if (!saved) return INITIAL_LAPORAN;
    try {
      const parsed: LaporanBulanan[] = JSON.parse(saved);
      if (parsed.length < INITIAL_LAPORAN.length) {
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = INITIAL_LAPORAN.filter(item => !existingIds.has(item.id));
        const merged = [...parsed, ...missing];
        return merged.map(item => ({
          ...item,
          tahunAjaran: item.tahunAjaran || '2026/2027',
          tanggalKirim: item.tanggalKirim || item.tanggalDiajukan || '2026-09-01',
        }));
      }
      return parsed.map(item => ({
        ...item,
        tahunAjaran: item.tahunAjaran || '2026/2027',
        tanggalKirim: item.tanggalKirim || item.tanggalDiajukan || '2026-09-01',
      }));
    } catch {
      return INITIAL_LAPORAN;
    }
  });

  const [invoiceList, setInvoiceList] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'invoices');
    if (!saved) return INITIAL_INVOICES;
    try {
      const parsed: Invoice[] = JSON.parse(saved);
      const mapped = parsed.map(inv => {
        const full = typeof inv.tagihanFull === 'number' ? inv.tagihanFull : (inv.nominal || 0);
        const real = typeof inv.tagihanRealisasi === 'number' ? inv.tagihanRealisasi : (inv.nominal || 0);
        const paid = typeof inv.nominalPembayaran === 'number' ? inv.nominalPembayaran : (inv.status === 'Lunas' ? real : 0);
        const rawKat = (inv.kategori || '') as string;
        const normKat: InvoiceKategori = (rawKat === 'Piutang Mitra' || rawKat.toLowerCase().includes('piutang') || rawKat.toLowerCase().includes('lampau'))
          ? 'Piutang Lampau'
          : (rawKat === 'Franchise Fee' || rawKat.toLowerCase().includes('franchise'))
          ? 'Franchise Fee'
          : (rawKat === 'Jenjang Baru' || rawKat.toLowerCase().includes('jenjang'))
          ? 'Jenjang Baru'
          : 'Renewal Fee';

        return {
          ...inv,
          kategori: normKat,
          bulan: inv.bulan || 'September',
          tahunAjaran: inv.tahunAjaran || '2026/2027',
          tanggalKirim: inv.tanggalKirim || inv.tanggalTerbit || '2026-09-01',
          tagihanFull: full,
          tagihanRealisasi: real,
          nominalPembayaran: paid,
          nominal: real,
          statusInvoice: inv.statusInvoice || 'Terkirim',
          status: inv.status || 'Belum Bayar',
        };
      });

      // Pastikan data historis sejak 2022 tetap ada jika localStorage belum memuat lengkap
      if (mapped.length < INITIAL_INVOICES.length) {
        const existingIds = new Set(mapped.map(m => m.id));
        const missing = INITIAL_INVOICES.filter(i => !existingIds.has(i.id));
        return [...mapped, ...missing];
      }
      return mapped;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'pembayaran');
    if (!saved) return INITIAL_PEMBAYARAN;
    try {
      const parsed: Pembayaran[] = JSON.parse(saved);
      if (parsed.length < INITIAL_PEMBAYARAN.length) {
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = INITIAL_PEMBAYARAN.filter(p => !existingIds.has(p.id));
        return [...parsed, ...missing];
      }
      return parsed;
    } catch {
      return INITIAL_PEMBAYARAN;
    }
  });

  const [eventList, setEventList] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [permintaanList, setPermintaanList] = useState<PermintaanMitra[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'permintaan');
    return saved ? JSON.parse(saved) : INITIAL_PERMINTAAN;
  });

  const [staffActivityList, setStaffActivityList] = useState<StaffActivity[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'staff_activity');
    if (!saved) return INITIAL_STAFF_ACTIVITY;
    try {
      const parsed: StaffActivity[] = JSON.parse(saved);
      return parsed.map((item, idx) => {
        const matchedInitial = INITIAL_STAFF_ACTIVITY.find((init) => init.id === item.id);
        return {
          ...item,
          noKpi: item.noKpi || matchedInitial?.noKpi || `KPI-0${(idx % 8) + 1}`,
          penjelasanKpi: item.penjelasanKpi || matchedInitial?.penjelasanKpi || 'Indikator dan target capaian program Mitra Office',
          programKpi: item.programKpi || matchedInitial?.programKpi || 'Supervisi & Pendampingan Kurikulum/MenDAKI',
          tahunAjaran: item.tahunAjaran || '2026/2027',
        };
      });
    } catch {
      return INITIAL_STAFF_ACTIVITY;
    }
  });

  const [adminStaffList, setAdminStaffList] = useState<AdminMitraStaff[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'admin_staff');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_STAFF;
  });

  const [templateList, setTemplateList] = useState<TemplateDokumen[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [performanceList, setPerformanceList] = useState<PerformanceMenDAKI[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'performance');
    return saved ? JSON.parse(saved) : INITIAL_PERFORMANCE_MENDAKI;
  });

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('Database lokal siap & sinkron dengan cloud.');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sekolah', JSON.stringify(sekolahList));
  }, [sekolahList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'laporan', JSON.stringify(laporanList));
  }, [laporanList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'invoices', JSON.stringify(invoiceList));
  }, [invoiceList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pembayaran', JSON.stringify(pembayaranList));
  }, [pembayaranList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'events', JSON.stringify(eventList));
  }, [eventList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'permintaan', JSON.stringify(permintaanList));
  }, [permintaanList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'staff_activity', JSON.stringify(staffActivityList));
  }, [staffActivityList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'admin_staff', JSON.stringify(adminStaffList));
  }, [adminStaffList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'templates', JSON.stringify(templateList));
  }, [templateList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'performance', JSON.stringify(performanceList));
  }, [performanceList]);

  // Check Firebase connection on mount + realtime listeners
  useEffect(() => {
    let isMounted = true;

    testConnection().then((connected) => {
      if (isMounted) {
        setIsFirebaseConnected(connected);
        if (connected) {
          setSyncStatusMessage('Terhubung ke Firebase Firestore (Real-time).');
          setLastSyncTime(new Date());
        }
      }
    });

    const unsubscribers: (() => void)[] = [];

    const subscribe = <T extends { id: string }>(
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      fallbackData?: T[]
    ) => {
      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          if (snapshot.empty && fallbackData && fallbackData.length > 0) {
            setter(fallbackData);
            // Seed initial data to Firestore in background so collection exists
            fallbackData.forEach((item) => {
              const safeId = item.id.replace(/\//g, '_');
              setDoc(doc(db, collectionName, safeId), sanitizeForFirestore(item)).catch(() => {});
            });
          } else {
            const docs = snapshot.docs.map((d) => d.data() as T);
            // Merge fallback items if any initial item is missing in Firestore
            if (fallbackData && fallbackData.length > 0) {
              const docIds = new Set(docs.map((d) => d.id));
              const missing = fallbackData.filter((item) => !docIds.has(item.id));
              if (missing.length > 0) {
                setter([...docs, ...missing]);
                missing.forEach((item) => {
                  const safeId = item.id.replace(/\//g, '_');
                  setDoc(doc(db, collectionName, safeId), sanitizeForFirestore(item)).catch(() => {});
                });
              } else {
                setter(docs);
              }
            } else {
              setter(docs);
            }
          }

          if (isMounted) {
            setIsFirebaseConnected(true);
            setLastSyncTime(new Date());
          }
        },
        (error) => {
          console.warn(
            `Firestore realtime error [${collectionName}]:`,
            error.message
          );
          if (isMounted) {
            setIsFirebaseConnected(false);
          }
        }
      );

      unsubscribers.push(unsubscribe);
    };

    try {
      subscribe<SekolahMitra>('mitra', setSekolahList, INITIAL_SEKOLAH);
      subscribe<LaporanBulanan>('laporan_bulanan', setLaporanList, INITIAL_LAPORAN);
      subscribe<Invoice>('invoices', setInvoiceList, INITIAL_INVOICES);
      subscribe<Pembayaran>('pembayaran', setPembayaranList, INITIAL_PEMBAYARAN);
      subscribe<EventItem>('events', setEventList, INITIAL_EVENTS);
      subscribe<PermintaanMitra>('permintaan_mitra', setPermintaanList, INITIAL_PERMINTAAN);
      subscribe<StaffActivity>('staff_activities', setStaffActivityList, INITIAL_STAFF_ACTIVITY);
      subscribe<AdminMitraStaff>('admin_staff', setAdminStaffList, INITIAL_ADMIN_STAFF);
      subscribe<TemplateDokumen>('templates', setTemplateList, INITIAL_TEMPLATES);
      subscribe<PerformanceMenDAKI>(
        'performance_mendaki',
        setPerformanceList,
        INITIAL_PERFORMANCE_MENDAKI
      );
    } catch (error) {
      console.warn('Firebase realtime listener initialization warning:', error);
    }

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Action: Add Laporan
  const addLaporan = useCallback(async (laporanData: Omit<LaporanBulanan, 'id' | 'tanggalDiajukan'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newLaporan: LaporanBulanan = {
      ...laporanData,
      id: `LAP-${Date.now().toString().slice(-6)}`,
      tanggalDiajukan: laporanData.tanggalKirim || today,
      tanggalKirim: laporanData.tanggalKirim || today,
      tahunAjaran: laporanData.tahunAjaran || '2026/2027',
      updatedAt: today,
    };

    setLaporanList(prev => [newLaporan, ...prev]);

    try {
      await setDoc(doc(db, 'laporan_bulanan', newLaporan.id), sanitizeForFirestore(newLaporan));
    } catch (e) {
      console.warn('Firestore write warning for laporan:', e);
    }
  }, []);

  // Action: Update Laporan
  const updateLaporan = useCallback(async (updated: LaporanBulanan) => {
    const today = new Date().toISOString().split('T')[0];
    const withUpdate: LaporanBulanan = {
      ...updated,
      updatedAt: today,
      tanggalKirim: updated.tanggalKirim || updated.tanggalDiajukan,
      tahunAjaran: updated.tahunAjaran || '2026/2027',
    };
    setLaporanList(prev => prev.map(item => item.id === updated.id ? withUpdate : item));
    try {
      await setDoc(doc(db, 'laporan_bulanan', updated.id), sanitizeForFirestore(withUpdate));
    } catch (e) {
      console.warn('Firestore update error for laporan:', e);
    }
  }, []);

  // Action: Delete Laporan
  const deleteLaporan = useCallback(async (id: string) => {
    setLaporanList(prev => prev.filter(item => item.id !== id));
    try {
      await deleteDoc(doc(db, 'laporan_bulanan', id));
    } catch (e) {
      console.warn('Firestore delete error for laporan:', e);
    }
  }, []);

  // Action: Review Laporan
  const reviewLaporan = useCallback(async (id: string, status: LaporanStatus, catatanAdmin?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setLaporanList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          catatanAdmin: catatanAdmin !== undefined ? catatanAdmin : item.catatanAdmin,
          updatedAt: today,
        };
      }
      return item;
    }));

    try {
      const target = laporanList.find(l => l.id === id);
      if (target) {
        await setDoc(doc(db, 'laporan_bulanan', id), sanitizeForFirestore({
          ...target,
          status,
          catatanAdmin: catatanAdmin || target.catatanAdmin,
          updatedAt: today,
        }));
      }
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  }, [laporanList]);

  // Action: Update Sheet Perhitungan Laporan
  const updateLaporanSheet = useCallback(async (id: string, sheetData: SheetPerhitunganData) => {
    const today = new Date().toISOString().split('T')[0];
    setLaporanList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          sheetPerhitungan: sheetData,
          updatedAt: today,
        };
      }
      return item;
    }));

    try {
      const target = laporanList.find(l => l.id === id);
      if (target) {
        await setDoc(doc(db, 'laporan_bulanan', id), sanitizeForFirestore({
          ...target,
          sheetPerhitungan: sheetData,
          updatedAt: today,
        }));
      }
    } catch (e) {
      console.warn('Firestore update sheet error:', e);
    }
  }, [laporanList]);

  // Action: Add Invoice
  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'> & { id?: string }) => {
    const id = invoiceData.id && invoiceData.id.trim().length > 0 
      ? invoiceData.id.trim()
      : generateNomorInvoiceBaru(invoiceList).nomorInvoice;

    const fullNominal = typeof invoiceData.tagihanFull === 'number' ? invoiceData.tagihanFull : (invoiceData.nominal || 0);
    const realNominal = typeof invoiceData.tagihanRealisasi === 'number' ? invoiceData.tagihanRealisasi : (invoiceData.nominal || fullNominal);
    const paidNominal = typeof invoiceData.nominalPembayaran === 'number' ? invoiceData.nominalPembayaran : 0;

    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      nomorInvoice: id,
      tagihanFull: fullNominal,
      tagihanRealisasi: realNominal,
      nominalPembayaran: paidNominal,
      nominal: realNominal,
      bulan: invoiceData.bulan || 'September',
      tahunAjaran: invoiceData.tahunAjaran || '2026/2027',
      tanggalKirim: invoiceData.tanggalKirim || new Date().toISOString().split('T')[0],
      tanggalTerbit: invoiceData.tanggalTerbit || invoiceData.tanggalKirim || new Date().toISOString().split('T')[0],
      jatuhTempo: invoiceData.jatuhTempo || '2026-10-31',
      statusInvoice: invoiceData.statusInvoice || 'Terkirim',
      status: invoiceData.status || 'Belum Bayar',
      keterangan: invoiceData.keterangan || `Tagihan Invoice ${invoiceData.namaSekolah}`,
    };

    setInvoiceList(prev => [newInvoice, ...prev]);

    try {
      const safeId = id.replace(/\//g, '_');
      await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(newInvoice));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, [invoiceList]);

  // Action: Update Invoice
  const updateInvoice = useCallback(async (updated: Invoice) => {
    setInvoiceList(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
    try {
      const safeId = updated.id.replace(/\//g, '_');
      await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(updated));
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  }, []);

  // Action: Delete Invoice
  const deleteInvoice = useCallback(async (id: string) => {
    setInvoiceList(prev => prev.filter(inv => inv.id !== id));
    try {
      const safeId = id.replace(/\//g, '_');
      await deleteDoc(doc(db, 'invoices', safeId));
    } catch (e) {
      console.warn('Firestore delete warning:', e);
    }
  }, []);

  // Action: Update Invoice Status
  const updateInvoiceStatus = useCallback(async (id: string, status: Invoice['status']) => {
    setInvoiceList(prev => prev.map(inv => {
      if (inv.id === id) {
        const isLunas = status === 'Lunas';
        return { 
          ...inv, 
          status,
          nominalPembayaran: isLunas ? (inv.tagihanRealisasi || inv.nominal) : inv.nominalPembayaran
        };
      }
      return inv;
    }));
    try {
      const target = invoiceList.find(i => i.id === id);
      if (target) {
        const isLunas = status === 'Lunas';
        const safeId = id.replace(/\//g, '_');
        await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore({ 
          ...target, 
          status,
          nominalPembayaran: isLunas ? (target.tagihanRealisasi || target.nominal) : target.nominalPembayaran
        }));
      }
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  }, [invoiceList]);

  // Action: Add Pembayaran
  const addPembayaran = useCallback(async (pembayaranData: Omit<Pembayaran, 'id'>) => {
    const id = `PAY-${Date.now().toString().slice(-6)}`;
    const newPay: Pembayaran = {
      ...pembayaranData,
      id,
    };
    setPembayaranList(prev => [newPay, ...prev]);

    // If there's an invoiceId, mark it as 'Menunggu Konfirmasi'
    if (newPay.invoiceId) {
      const updatedInvoice = invoiceList.find(
        inv => inv.id === newPay.invoiceId
      );

      setInvoiceList(prev => prev.map(inv =>
        inv.id === newPay.invoiceId
          ? { ...inv, status: 'Menunggu Konfirmasi' }
          : inv
      ));

      if (updatedInvoice) {
        const safeInvId = updatedInvoice.id.replace(/\//g, '_');
        await setDoc(
          doc(db, 'invoices', safeInvId),
          sanitizeForFirestore({ ...updatedInvoice, status: 'Menunggu Konfirmasi' })
        );
      }
    }

    try {
      const safeId = id.replace(/\//g, '_');
      await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(newPay));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, [invoiceList]);

  // Action: Update Pembayaran
  const updatePembayaran = useCallback(async (pembayaran: Pembayaran) => {
    setPembayaranList(prev => prev.map(p => p.id === pembayaran.id ? pembayaran : p));
    try {
      const safeId = pembayaran.id.replace(/\//g, '_');
      await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(pembayaran));
    } catch (e) {
      console.warn('Firestore pembayaran update warning:', e);
    }
  }, []);

  // Action: Delete Pembayaran
  const deletePembayaran = useCallback(async (id: string) => {
    setPembayaranList(prev => prev.filter(p => p.id !== id));
    try {
      const safeId = id.replace(/\//g, '_');
      await deleteDoc(doc(db, 'pembayaran', safeId));
    } catch (e) {
      console.warn('Firestore pembayaran delete warning:', e);
    }
  }, []);

  // Action: Verify Pembayaran
  const verifyPembayaran = useCallback(async (id: string, status: PembayaranStatus, catatan?: string) => {
    const target = pembayaranList.find(p => p.id === id);
    setPembayaranList(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status, catatan: catatan !== undefined ? catatan : p.catatan };
      }
      return p;
    }));

    // If verified and has invoice, update invoice
    if (status === 'Terverifikasi' && target?.invoiceId) {
      const targetInvoice = invoiceList.find(
        inv => inv.id === target.invoiceId
      );

      const targetNominal = targetInvoice?.tagihanRealisasi || targetInvoice?.nominal || target.jumlah;
      const newPaidAmount = Math.min(targetNominal, (targetInvoice?.nominalPembayaran || 0) + target.jumlah);
      const isFullyPaid = newPaidAmount >= targetNominal;
      const newInvoiceStatus: Invoice['status'] = isFullyPaid ? 'Lunas' : 'Sebagian';

      setInvoiceList(prev => prev.map(inv =>
        inv.id === target.invoiceId
          ? { 
              ...inv, 
              status: newInvoiceStatus,
              nominalPembayaran: newPaidAmount,
              tanggalDibayar: target.tanggalBayar || new Date().toISOString().split('T')[0]
            }
          : inv
      ));

      if (targetInvoice) {
        await setDoc(
          doc(db, 'invoices', targetInvoice.id),
          sanitizeForFirestore({ 
            ...targetInvoice, 
            status: newInvoiceStatus,
            nominalPembayaran: newPaidAmount,
            tanggalDibayar: target.tanggalBayar || new Date().toISOString().split('T')[0]
          })
        );
      }
    }

    try {
      if (target) {
        await setDoc(doc(db, 'pembayaran', id), sanitizeForFirestore({ ...target, status, catatan: catatan || target.catatan }));
      }
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  }, [pembayaranList, invoiceList]);

  // Action: Bulk Import Invoice & Pembayaran dari Sheet
  const bulkImportInvoiceAndPayment = useCallback(async (
    newInvoices: Invoice[],
    newPayments: Pembayaran[],
    mode: 'merge' | 'replace' = 'merge'
  ) => {
    let finalInvoices: Invoice[];
    let finalPayments: Pembayaran[];

    if (mode === 'replace') {
      finalInvoices = newInvoices;
      finalPayments = newPayments;
    } else {
      // Merge by ID
      const invMap = new Map<string, Invoice>();
      invoiceList.forEach(i => invMap.set(i.id, i));
      newInvoices.forEach(i => invMap.set(i.id, i));
      finalInvoices = Array.from(invMap.values());

      const payMap = new Map<string, Pembayaran>();
      pembayaranList.forEach(p => payMap.set(p.id, p));
      newPayments.forEach(p => payMap.set(p.id, p));
      finalPayments = Array.from(payMap.values());
    }

    setInvoiceList(finalInvoices);
    setPembayaranList(finalPayments);

    try {
      localStorage.setItem(STORAGE_PREFIX + 'invoices', JSON.stringify(finalInvoices));
      localStorage.setItem(STORAGE_PREFIX + 'pembayaran', JSON.stringify(finalPayments));

      // Batch write to firestore
      for (const inv of newInvoices) {
        await setDoc(doc(db, 'invoices', inv.id), sanitizeForFirestore(inv)).catch(console.warn);
      }
      for (const pay of newPayments) {
        await setDoc(doc(db, 'pembayaran', pay.id), sanitizeForFirestore(pay)).catch(console.warn);
      }
    } catch (e) {
      console.warn('Bulk import sync warning:', e);
    }

    return {
      invoiceCount: finalInvoices.length,
      paymentCount: finalPayments.length,
    };
  }, [invoiceList, pembayaranList]);

  // Action: Load Historical Transactions Since 2022
  const loadHistoricalTransactionsSince2022 = useCallback(async () => {
    return await bulkImportInvoiceAndPayment(INITIAL_INVOICES, INITIAL_PEMBAYARAN, 'replace');
  }, [bulkImportInvoiceAndPayment]);

  // Action: Add Event
  const addEvent = useCallback(async (eventData: Omit<EventItem, 'id'>) => {
    const id = `EVT-${Date.now().toString().slice(-5)}`;
    const newEvent: EventItem = { ...eventData, id };
    setEventList(prev => [newEvent, ...prev]);

    try {
      await setDoc(doc(db, 'events', id), sanitizeForFirestore(newEvent));
    } catch (e) {
      console.warn('Firestore event write warning:', e);
    }
  }, []);

  const updateEvent = useCallback(async (event: EventItem) => {
    setEventList(prev => prev.map(e => e.id === event.id ? event : e));
    try {
      await setDoc(doc(db, 'events', event.id), sanitizeForFirestore(event));
    } catch (e) {
      console.warn('Firestore event update warning:', e);
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    setEventList(prev => prev.filter(e => e.id !== id));
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.warn('Firestore event delete warning:', e);
    }
  }, []);

  // Action: Add Permintaan Mitra
  const addPermintaan = useCallback(async (reqData: Omit<PermintaanMitra, 'id' | 'tanggalPengajuan'>) => {
    const today = new Date().toISOString().split('T')[0];
    const id = `REQ-${Date.now().toString().slice(-6)}`;
    const newReq: PermintaanMitra = {
      ...reqData,
      id,
      tanggalPengajuan: today,
    };
    setPermintaanList(prev => [newReq, ...prev]);

    try {
      await setDoc(doc(db, 'permintaan_mitra', id), sanitizeForFirestore(newReq));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const updatePermintaan = useCallback(async (permintaan: PermintaanMitra) => {
    setPermintaanList(prev => prev.map(p => p.id === permintaan.id ? permintaan : p));
    try {
      await setDoc(doc(db, 'permintaan_mitra', permintaan.id), sanitizeForFirestore(permintaan));
    } catch (e) {
      console.warn('Firestore permintaan update warning:', e);
    }
  }, []);

  const deletePermintaan = useCallback(async (id: string) => {
    setPermintaanList(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, 'permintaan_mitra', id));
    } catch (e) {
      console.warn('Firestore permintaan delete warning:', e);
    }
  }, []);

  // Action: Update Permintaan Status
  const updatePermintaanStatus = useCallback(async (id: string, status: PermintaanStatus, noResi?: string, catatanAdmin?: string) => {
    setPermintaanList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          noResi: noResi !== undefined ? noResi : item.noResi,
          catatanAdmin: catatanAdmin !== undefined ? catatanAdmin : item.catatanAdmin,
        };
      }
      return item;
    }));

    try {
      const target = permintaanList.find(p => p.id === id);
      if (target) {
        await setDoc(doc(db, 'permintaan_mitra', id), sanitizeForFirestore({
          ...target,
          status,
          noResi: noResi || target.noResi,
          catatanAdmin: catatanAdmin || target.catatanAdmin,
        }));
      }
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  }, [permintaanList]);

  // Action: Add/Update/Delete Sekolah Mitra
  const addSekolah = useCallback(async (sekolah: SekolahMitra) => {
    const cleanSekolah = sanitizeForFirestore(sekolah);
    setSekolahList(prev => [...prev, cleanSekolah]);
    try {
      const safeId = sekolah.id.replace(/\//g, '_');
      await setDoc(doc(db, 'mitra', safeId), cleanSekolah);
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const updateSekolah = useCallback(async (sekolahOrId: SekolahMitra | string, updates?: Partial<SekolahMitra>) => {
    let targetId: string;
    let newObj: SekolahMitra;

    if (typeof sekolahOrId === 'string') {
      targetId = sekolahOrId;
      const existing = sekolahList.find(s => s.id === targetId || s.kodeMitra === targetId);
      newObj = {
        ...(existing || { 
          id: targetId, 
          kodeMitra: targetId, 
          namaSekolah: '', 
          alamat: '', 
          pimpinan: '', 
          jenjang: 'SD', 
          jumlahSiswa: 0, 
          statusKerjasama: 'Aktif', 
          tahunBergabung: 2026 
        }),
        ...(updates || {}),
        id: targetId,
      } as SekolahMitra;
    } else {
      targetId = sekolahOrId.id;
      newObj = { ...sekolahOrId, ...(updates || {}) };
    }

    const cleanObj = sanitizeForFirestore(newObj);

    setSekolahList(prev => prev.map(s => (s.id === targetId || s.kodeMitra === targetId) ? cleanObj : s));

    // Sinkronkan nama sekolah bila berubah
    if (cleanObj.namaSekolah) {
      setInvoiceList(prev => prev.map(inv => inv.mitraId === targetId ? { ...inv, namaSekolah: cleanObj.namaSekolah } : inv));
      setPembayaranList(prev => prev.map(pay => pay.mitraId === targetId ? { ...pay, namaSekolah: cleanObj.namaSekolah } : pay));
      setLaporanList(prev => prev.map(lap => lap.mitraId === targetId ? { ...lap, namaSekolah: cleanObj.namaSekolah } : lap));
    }

    try {
      const safeId = targetId.replace(/\//g, '_');
      await setDoc(doc(db, 'mitra', safeId), cleanObj);
    } catch (e) {
      console.warn('Firestore update warning:', e);
    }
  }, [sekolahList]);

  const deleteSekolah = useCallback(async (id: string) => {
    setSekolahList(prev => prev.filter(s => s.id !== id));
    try {
      const safeId = id.replace(/\//g, '_');
      await deleteDoc(doc(db, 'mitra', safeId));
    } catch (e) {
      console.warn('Firestore delete warning:', e);
    }
  }, []);

  // Action: Staff Activity & Google Sheet
  const addStaffActivity = useCallback(async (activityData: Omit<StaffActivity, 'id'>) => {
    const id = `ACT-${Date.now().toString().slice(-4)}`;
    const newAct: StaffActivity = { ...activityData, id };
    setStaffActivityList(prev => [newAct, ...prev]);

    try {
      await setDoc(doc(db, 'staff_activities', id), sanitizeForFirestore(newAct));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const updateStaffActivity = useCallback(async (activity: StaffActivity) => {
    setStaffActivityList(prev => prev.map(a => a.id === activity.id ? activity : a));
    try {
      await setDoc(doc(db, 'staff_activities', activity.id), sanitizeForFirestore(activity));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const deleteStaffActivity = useCallback(async (id: string) => {
    setStaffActivityList(prev => prev.filter(a => a.id !== id));

    try {
      await deleteDoc(doc(db, 'staff_activities', id));
    } catch (e) {
      console.warn('Firestore delete warning:', e);
    }
  }, []);

  // Action: Admin Mitra Office Staff
  const addAdminStaff = useCallback(async (staffData: Omit<AdminMitraStaff, 'id'>) => {
    const id = `MO0${(adminStaffList.length + 3).toString().padStart(2, '0')}`;
    const newStaff: AdminMitraStaff = { ...staffData, id };
    setAdminStaffList(prev => [...prev, newStaff]);
    try {
      await setDoc(doc(db, 'admin_staff', id), sanitizeForFirestore(newStaff));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, [adminStaffList.length]);

  const updateAdminStaff = useCallback(async (staff: AdminMitraStaff) => {
    setAdminStaffList(prev => prev.map(s => s.id === staff.id ? staff : s));
    try {
      await setDoc(doc(db, 'admin_staff', staff.id), sanitizeForFirestore(staff));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const deleteAdminStaff = useCallback(async (id: string) => {
    setAdminStaffList(prev => prev.filter(s => s.id !== id));

    try {
      await deleteDoc(doc(db, 'admin_staff', id));
    } catch (e) {
      console.warn('Firestore delete warning:', e);
    }
  }, []);

  // Action: Template
  const addTemplate = useCallback(async (tplData: Omit<TemplateDokumen, 'id'>) => {
    const id = `TMP-${Date.now().toString().slice(-4)}`;
    const newTpl: TemplateDokumen = { ...tplData, id };
    setTemplateList(prev => [newTpl, ...prev]);

    try {
      await setDoc(doc(db, 'templates', id), sanitizeForFirestore(newTpl));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const updateTemplate = useCallback(async (template: TemplateDokumen) => {
    setTemplateList(prev => prev.map(t => t.id === template.id ? template : t));
    try {
      await setDoc(doc(db, 'templates', template.id), sanitizeForFirestore(template));
    } catch (e) {
      console.warn('Firestore template update warning:', e);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplateList(prev => prev.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (e) {
      console.warn('Firestore template delete warning:', e);
    }
  }, []);

  // Action: Performance MenDAKI
  const savePerformance = useCallback(async (perf: PerformanceMenDAKI) => {
    setPerformanceList(prev => {
      const idx = prev.findIndex(p => p.id === perf.id || (p.mitraId === perf.mitraId && p.periode === perf.periode));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = perf;
        return copy;
      }
      return [perf, ...prev];
    });

    try {
      await setDoc(doc(db, 'performance_mendaki', perf.id), sanitizeForFirestore(perf));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }
  }, []);

  const updatePerformance = savePerformance;

  const deletePerformance = useCallback(async (id: string) => {
    setPerformanceList(prev => prev.filter(p => p.id !== id));
    try {
      await deleteDoc(doc(db, 'performance_mendaki', id));
    } catch (e) {
      console.warn('Firestore performance delete warning:', e);
    }
  }, []);

  // Action: Sync with Sheet Data
  const syncWithSheetData = useCallback(async (parsedUsers?: UserAccount[]) => {
    setIsSyncing(true);
    setSyncStatusMessage('Sedang menyinkronkan data Google Sheet dengan Firebase...');

    try {
      // If parsed users from Sheet provided, synchronize with sekolah list
      if (parsedUsers && parsedUsers.length > 0) {
        const newSchools: SekolahMitra[] = [];
        parsedUsers.forEach(u => {
          if (u.role === 'Sekolah Mitra' || u.role === 'Sekolah Afiliasi') {
            const exists = sekolahList.find(s => s.id === u.userId || s.kodeMitra === u.userId);
            if (!exists) {
              newSchools.push({
                id: u.userId,
                kodeMitra: u.userId,
                namaSekolah: u.nama,
                alamat: 'Jl. Raya Mitra Lazuardi',
                kota: 'Jabodetabek',
                pimpinan: 'Kepala Sekolah ' + u.nama,
                kontak: '021-000000',
                email: u.email,
                jenjang: u.role === 'Sekolah Afiliasi' ? 'SMA' : 'SD, SMP',
                jumlahSiswa: 200,
                statusKerjasama: 'Aktif',
                tahunBergabung: 2024,
              });
            }
          }
        });

        if (newSchools.length > 0) {
          setSekolahList(prev => [...prev, ...newSchools]);

          await Promise.all(
            newSchools.map((school) =>
              setDoc(doc(db, 'mitra', school.id), sanitizeForFirestore(school))
            )
          );
        }
      }

      setLastSyncTime(new Date());
      setSyncStatusMessage(`Sinkronisasi Google Sheet berhasil (${new Date().toLocaleTimeString('id-ID')}). Tersimpan di Firebase.`);
    } catch (err) {
      setSyncStatusMessage('Sinkronisasi selesai dengan peringatan: ' + (err instanceof Error ? err.message : 'Error sync'));
    } finally {
      setIsSyncing(false);
    }
  }, [sekolahList]);

  // Reset to default
  const resetToDefaultData = useCallback(() => {
    setSekolahList(INITIAL_SEKOLAH);
    setLaporanList(INITIAL_LAPORAN);
    setInvoiceList(INITIAL_INVOICES);
    setPembayaranList(INITIAL_PEMBAYARAN);
    setEventList(INITIAL_EVENTS);
    setPermintaanList(INITIAL_PERMINTAAN);
    setStaffActivityList(INITIAL_STAFF_ACTIVITY);
    setAdminStaffList(INITIAL_ADMIN_STAFF);
    setTemplateList(INITIAL_TEMPLATES);
    setPerformanceList(INITIAL_PERFORMANCE_MENDAKI);
    setSyncStatusMessage('Data lokal berhasil dikembalikan ke standar awal L-MAP.');
  }, []);

  return (
    <DataContext.Provider value={{
      sekolahList,
      laporanList,
      invoiceList,
      pembayaranList,
      eventList,
      permintaanList,
      staffActivityList,
      adminStaffList,
      templateList,
      performanceList,
      isFirebaseConnected,
      isSyncing,
      lastSyncTime,
      syncStatusMessage,
      addLaporan,
      updateLaporan,
      deleteLaporan,
      reviewLaporan,
      updateLaporanSheet,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      updateInvoiceStatus,
      addPembayaran,
      updatePembayaran,
      deletePembayaran,
      verifyPembayaran,
      addEvent,
      updateEvent,
      deleteEvent,
      addPermintaan,
      updatePermintaan,
      deletePermintaan,
      updatePermintaanStatus,
      addSekolah,
      updateSekolah,
      deleteSekolah,
      addStaffActivity,
      updateStaffActivity,
      deleteStaffActivity,
      addAdminStaff,
      updateAdminStaff,
      deleteAdminStaff,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      savePerformance,
      updatePerformance,
      deletePerformance,
      syncWithSheetData,
      bulkImportInvoiceAndPayment,
      loadHistoricalTransactionsSince2022,
      resetToDefaultData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
