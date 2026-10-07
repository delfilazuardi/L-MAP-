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
  MendakiFormDefinition,
  MendakiFormSubmission,
  ProgramMitraItem,
  ProgramMitraTemplate,
  MasterKpiStandar,
  LaporanStatus,
  PembayaranStatus,
  PermintaanStatus,
  UserAccount,
  SheetPerhitunganData,
} from '../types';
import { DAFTAR_15_STANDAR_KPI } from '../data/masterKpiStandar';
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
  INITIAL_MENDAKI_FORMS,
  INITIAL_MENDAKI_SUBMISSIONS,
  INITIAL_PROGRAM_MITRA,
  INITIAL_PROGRAM_MITRA_TEMPLATES,
} from '../lib/initialData';
import { 
  DEMO_SEKOLAH, 
  DEMO_LAPORAN, 
  DEMO_INVOICES, 
  DEMO_PEMBAYARAN, 
  DEMO_EVENTS, 
  DEMO_PERMINTAAN, 
  DEMO_PERFORMANCE, 
  DEMO_MENDAKI_SUBMISSIONS,
  DEMO_PROGRAM_MITRA,
  isDemoEntity,
  DEMO_SEKOLAH_ID
} from '../lib/demoData';
import { generateNomorInvoiceBaru } from '../lib/invoiceUtils';
import { db, testConnection, sanitizeForFirestore, toFirestoreDocId } from '../lib/firebase';
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
  mendakiFormList: MendakiFormDefinition[];
  mendakiSubmissionList: MendakiFormSubmission[];
  programMitraList: ProgramMitraItem[];
  programMitraTemplates: ProgramMitraTemplate[];
  masterKpiList: MasterKpiStandar[];
  isFirebaseConnected: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  lastSyncTime: Date | null;
  syncStatusMessage: string;
  
  // Actions
  saveMasterKpiList: (newList: MasterKpiStandar[]) => Promise<void>;
  addLaporan: (laporan: Omit<LaporanBulanan, 'id' | 'tanggalDiajukan'> & { id?: string }) => Promise<void>;
  updateLaporan: (laporan: LaporanBulanan) => Promise<void>;
  deleteLaporan: (id: string) => Promise<void>;
  reviewLaporan: (id: string, status: LaporanStatus, catatanAdmin?: string) => Promise<void>;
  updateLaporanSheet: (id: string, sheetData: SheetPerhitunganData) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'> & { id?: string }) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  addPembayaran: (pembayaran: Omit<Pembayaran, 'id'> & { id?: string }) => Promise<void>;
  updatePembayaran: (pembayaran: Pembayaran) => Promise<void>;
  deletePembayaran: (id: string) => Promise<void>;
  verifyPembayaran: (id: string, status: PembayaranStatus, catatan?: string) => Promise<void>;
  addEvent: (event: Omit<EventItem, 'id'> & { id?: string }) => Promise<void>;
  updateEvent: (event: EventItem) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addPermintaan: (permintaan: Omit<PermintaanMitra, 'id' | 'tanggalPengajuan'> & { id?: string }) => Promise<void>;
  updatePermintaan: (permintaan: PermintaanMitra) => Promise<void>;
  deletePermintaan: (id: string) => Promise<void>;
  updatePermintaanStatus: (id: string, status: PermintaanStatus, noResi?: string, catatanAdmin?: string) => Promise<void>;
  addSekolah: (sekolah: SekolahMitra) => Promise<void>;
  updateSekolah: (sekolahOrId: SekolahMitra | string, updates?: Partial<SekolahMitra>) => Promise<void>;
  deleteSekolah: (id: string) => Promise<void>;
  addStaffActivity: (activity: Omit<StaffActivity, 'id'> & { id?: string }) => Promise<void>;
  updateStaffActivity: (activity: StaffActivity) => Promise<void>;
  deleteStaffActivity: (id: string) => Promise<void>;
  addAdminStaff: (staff: Omit<AdminMitraStaff, 'id'> & { id?: string }) => Promise<void>;
  updateAdminStaff: (staff: AdminMitraStaff) => Promise<void>;
  deleteAdminStaff: (id: string) => Promise<void>;
  addTemplate: (template: Omit<TemplateDokumen, 'id'> & { id?: string }) => Promise<void>;
  updateTemplate: (template: TemplateDokumen) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  savePerformance: (perf: PerformanceMenDAKI) => Promise<void>;
  updatePerformance: (perf: PerformanceMenDAKI) => Promise<void>;
  deletePerformance: (id: string) => Promise<void>;
  addMendakiForm: (form: Omit<MendakiFormDefinition, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  updateMendakiForm: (form: MendakiFormDefinition) => Promise<void>;
  deleteMendakiForm: (id: string) => Promise<void>;
  addMendakiSubmission: (sub: Omit<MendakiFormSubmission, 'id' | 'tanggalIsi'> & { id?: string }) => Promise<void>;
  updateMendakiSubmission: (sub: MendakiFormSubmission) => Promise<void>;
  deleteMendakiSubmission: (id: string) => Promise<void>;
  addProgramMitra: (item: Omit<ProgramMitraItem, 'id' | 'tanggalPengajuan'> & { id?: string }) => Promise<void>;
  updateProgramMitra: (item: ProgramMitraItem) => Promise<void>;
  deleteProgramMitra: (id: string) => Promise<void>;
  addProgramMitraTemplate: (template: Omit<ProgramMitraTemplate, 'id' | 'diperbarui'> & { id?: string }) => Promise<void>;
  updateProgramMitraTemplate: (template: ProgramMitraTemplate) => Promise<void>;
  deleteProgramMitraTemplate: (id: string) => Promise<void>;
  syncWithSheetData: (parsedUsers?: UserAccount[]) => Promise<void>;
  bulkImportInvoiceAndPayment: (
    newInvoices: Invoice[],
    newPayments: Pembayaran[],
    mode?: 'merge' | 'replace'
  ) => Promise<{ invoiceCount: number; paymentCount: number }>;
  loadHistoricalTransactionsSince2022: () => Promise<{ invoiceCount: number; paymentCount: number }>;
  resetToDefaultData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialCollectionState = <T,>(collectionName: string, defaultItems: T[]): T[] => {
    try {
      const raw = localStorage.getItem(`lmap_backup_${collectionName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return defaultItems;
  };

  // Single Source of Truth: In-memory React state synced via Firestore onSnapshot + localStorage backup
  // Catatan: Entitas Demo Sekolah Mitra diisolasi di memori dan tidak disimpan di Firestore produksi
  const [sekolahList, setSekolahList] = useState<SekolahMitra[]>(() =>
    getInitialCollectionState('mitra', [...INITIAL_SEKOLAH, DEMO_SEKOLAH])
  );
  const [laporanList, setLaporanList] = useState<LaporanBulanan[]>(() =>
    getInitialCollectionState('laporan_bulanan', [...INITIAL_LAPORAN, ...DEMO_LAPORAN])
  );
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(() =>
    getInitialCollectionState('invoices', [...INITIAL_INVOICES, ...DEMO_INVOICES])
  );
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>(() =>
    getInitialCollectionState('pembayaran', [...INITIAL_PEMBAYARAN, ...DEMO_PEMBAYARAN])
  );
  const [eventList, setEventList] = useState<EventItem[]>(() =>
    getInitialCollectionState('events', [...INITIAL_EVENTS, ...DEMO_EVENTS])
  );
  const [permintaanList, setPermintaanList] = useState<PermintaanMitra[]>(() =>
    getInitialCollectionState('permintaan_mitra', [...INITIAL_PERMINTAAN, ...DEMO_PERMINTAAN])
  );
  const [staffActivityList, setStaffActivityList] = useState<StaffActivity[]>(() =>
    getInitialCollectionState('staff_activities', INITIAL_STAFF_ACTIVITY)
  );
  const [adminStaffList, setAdminStaffList] = useState<AdminMitraStaff[]>(() =>
    getInitialCollectionState('admin_staff', INITIAL_ADMIN_STAFF)
  );
  const [templateList, setTemplateList] = useState<TemplateDokumen[]>(() =>
    getInitialCollectionState('templates', INITIAL_TEMPLATES)
  );
  const [performanceList, setPerformanceList] = useState<PerformanceMenDAKI[]>(() =>
    getInitialCollectionState('performance_mendaki', [...INITIAL_PERFORMANCE_MENDAKI, ...DEMO_PERFORMANCE])
  );
  const [mendakiFormList, setMendakiFormList] = useState<MendakiFormDefinition[]>(() =>
    getInitialCollectionState('mendaki_forms', INITIAL_MENDAKI_FORMS)
  );
  const [mendakiSubmissionList, setMendakiSubmissionList] = useState<MendakiFormSubmission[]>(() =>
    getInitialCollectionState('mendaki_submissions', [...INITIAL_MENDAKI_SUBMISSIONS, ...DEMO_MENDAKI_SUBMISSIONS])
  );
  const [programMitraList, setProgramMitraList] = useState<ProgramMitraItem[]>(() =>
    getInitialCollectionState('program_mitra', [...INITIAL_PROGRAM_MITRA, ...DEMO_PROGRAM_MITRA])
  );
  const [programMitraTemplates, setProgramMitraTemplates] = useState<ProgramMitraTemplate[]>(() =>
    getInitialCollectionState('program_mitra_templates', INITIAL_PROGRAM_MITRA_TEMPLATES)
  );
  const [masterKpiList, setMasterKpiList] = useState<MasterKpiStandar[]>(() =>
    getInitialCollectionState('master_kpi_standar', DAFTAR_15_STANDAR_KPI)
  );

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('Menyambungkan ke Firebase Firestore...');

  // Helper for resilient local storage backup so user changes are never lost
  const saveLocalBackup = (collectionName: string, items: any[]) => {
    try {
      localStorage.setItem(`lmap_backup_${collectionName}`, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  };

  const loadLocalBackup = <T,>(collectionName: string): T[] | null => {
    try {
      const raw = localStorage.getItem(`lmap_backup_${collectionName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const safeFirestoreSet = async (collectionName: string, docId: string, data: any) => {
    try {
      const safeId = toFirestoreDocId(docId);
      await setDoc(doc(db, collectionName, safeId), sanitizeForFirestore(data));
      setLastSyncTime(new Date());
      setIsFirebaseConnected(true);
    } catch (err) {
      console.warn(`Firestore write fallback to local [${collectionName}/${docId}]:`, err);
    }
  };

  const safeFirestoreDelete = async (collectionName: string, docId: string) => {
    try {
      const safeId = toFirestoreDocId(docId);
      await deleteDoc(doc(db, collectionName, safeId));
      if (safeId !== docId) {
        await deleteDoc(doc(db, collectionName, docId)).catch(() => {});
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn(`Firestore delete fallback to local [${collectionName}/${docId}]:`, err);
    }
  };

  // Track bootstrapped collections so we never recreate deleted items
  const bootstrappedRef = React.useRef<Set<string>>(new Set());

  // Firestore Realtime onSnapshot Listeners
  useEffect(() => {
    let isMounted = true;

    testConnection().then((connected) => {
      if (isMounted) {
        setIsFirebaseConnected(connected);
        if (connected) {
          setSyncStatusMessage('Terhubung ke Firebase Firestore (Realtime Sync)');
          setLastSyncTime(new Date());
        } else {
          setSyncStatusMessage('Menunggu koneksi Firebase...');
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
          if (snapshot.empty && fallbackData && fallbackData.length > 0 && !bootstrappedRef.current.has(collectionName)) {
            // First time bootstrap: collection is completely empty in Firestore
            bootstrappedRef.current.add(collectionName);
            setter(fallbackData);
            fallbackData.forEach((item) => {
              const safeId = toFirestoreDocId(item.id);
              setDoc(doc(db, collectionName, safeId), sanitizeForFirestore(item)).catch((err) => {
                console.warn(`Bootstrap item ${safeId} for ${collectionName}:`, err);
              });
            });
          } else {
            // Firestore is the Single Source of Truth: exact documents currently stored in Firestore
            bootstrappedRef.current.add(collectionName);
            const docs = snapshot.docs.map((d) => {
              const data = d.data() as T;
              return {
                ...data,
                id: (data as any).id || d.id,
              };
            });
            setter(prev => {
              const prevDemo = prev.filter(isDemoEntity);
              let demoFallback: T[] = [];
              if (collectionName === 'mitra') demoFallback = [DEMO_SEKOLAH as unknown as T];
              else if (collectionName === 'laporan_bulanan') demoFallback = DEMO_LAPORAN as unknown as T[];
              else if (collectionName === 'invoices') demoFallback = DEMO_INVOICES as unknown as T[];
              else if (collectionName === 'pembayaran') demoFallback = DEMO_PEMBAYARAN as unknown as T[];
              else if (collectionName === 'events') demoFallback = DEMO_EVENTS as unknown as T[];
              else if (collectionName === 'permintaan_mitra') demoFallback = DEMO_PERMINTAAN as unknown as T[];
              else if (collectionName === 'performance_mendaki') demoFallback = DEMO_PERFORMANCE as unknown as T[];
              else if (collectionName === 'mendaki_submissions') demoFallback = DEMO_MENDAKI_SUBMISSIONS as unknown as T[];
              else if (collectionName === 'program_mitra') demoFallback = DEMO_PROGRAM_MITRA as unknown as T[];

              const demoItemsToKeep = prevDemo.length > 0 ? prevDemo : demoFallback;
              const nextItems = [...docs.filter(d => !isDemoEntity(d)), ...demoItemsToKeep];
              saveLocalBackup(collectionName, nextItems);
              return nextItems;
            });
          }

          if (isMounted) {
            setIsFirebaseConnected(true);
            setIsLoading(false);
            setLastSyncTime(new Date());
          }
        },
        (error) => {
          console.warn(`Firestore realtime listener fallback [${collectionName}]:`, error);
          const localSaved = loadLocalBackup<T>(collectionName);
          if (localSaved && localSaved.length > 0) {
            setter(localSaved);
          }
          if (isMounted) {
            setIsLoading(false);
            setIsFirebaseConnected(false);
            setSyncStatusMessage(`Mode Penyimpanan Lokal Aktif (${error.message})`);
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
      subscribe<PerformanceMenDAKI>('performance_mendaki', setPerformanceList, INITIAL_PERFORMANCE_MENDAKI);
      subscribe<MendakiFormDefinition>('mendaki_forms', setMendakiFormList, INITIAL_MENDAKI_FORMS);
      subscribe<MendakiFormSubmission>('mendaki_submissions', setMendakiSubmissionList, INITIAL_MENDAKI_SUBMISSIONS);
      subscribe<ProgramMitraItem>('program_mitra', setProgramMitraList, INITIAL_PROGRAM_MITRA);
      subscribe<ProgramMitraTemplate>('program_mitra_templates', setProgramMitraTemplates, INITIAL_PROGRAM_MITRA_TEMPLATES);
      subscribe<MasterKpiStandar>('master_kpi_standar', setMasterKpiList, DAFTAR_15_STANDAR_KPI);
    } catch (error) {
      console.error('Firebase realtime listener initialization error:', error);
    }

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // ==========================================
  // LAPORAN BULANAN CRUD
  // ==========================================
  const addLaporan = useCallback(async (laporanData: Omit<LaporanBulanan, 'id' | 'tanggalDiajukan'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDemo = isDemoEntity(laporanData.mitraId || (laporanData as any).sekolahId) || isDemoEntity(laporanData.id);
    const id = laporanData.id || (isDemo ? `LAP-DEMO-${Date.now().toString().slice(-4)}` : `LAP-${Date.now().toString().slice(-6)}`);
    const newLaporan: LaporanBulanan = {
      ...laporanData,
      id,
      tanggalDiajukan: laporanData.tanggalKirim || today,
      tanggalKirim: laporanData.tanggalKirim || today,
      tahunAjaran: laporanData.tahunAjaran || '2026/2027',
      updatedAt: today,
      isDemo: isDemo || undefined,
    };

    // Optimistic state update
    setLaporanList(prev => {
      const next = [newLaporan, ...prev.filter(l => l.id !== id)];
      saveLocalBackup('laporan_bulanan', next);
      return next;
    });

    if (isDemo) return;

    await safeFirestoreSet('laporan_bulanan', id, newLaporan);
  }, []);

  const updateLaporan = useCallback(async (updated: LaporanBulanan) => {
    const today = new Date().toISOString().split('T')[0];
    const withUpdate: LaporanBulanan = {
      ...updated,
      updatedAt: today,
      tanggalKirim: updated.tanggalKirim || updated.tanggalDiajukan,
      tahunAjaran: updated.tahunAjaran || '2026/2027',
    };

    setLaporanList(prev => {
      const next = prev.map(item => item.id === updated.id ? withUpdate : item);
      saveLocalBackup('laporan_bulanan', next);
      return next;
    });

    if (isDemoEntity(updated)) return;

    await safeFirestoreSet('laporan_bulanan', updated.id, withUpdate);
  }, []);

  const deleteLaporan = useCallback(async (id: string) => {
    setLaporanList(prev => {
      const next = prev.filter(item => item.id !== id);
      saveLocalBackup('laporan_bulanan', next);
      return next;
    });
    if (isDemoEntity(id)) return;
    await safeFirestoreDelete('laporan_bulanan', id);
  }, []);

  const reviewLaporan = useCallback(async (id: string, status: LaporanStatus, catatanAdmin?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const target = laporanList.find(l => l.id === id);
    if (!target) throw new Error(`Laporan dengan ID ${id} tidak ditemukan.`);

    const updated: LaporanBulanan = {
      ...target,
      status,
      catatanAdmin: catatanAdmin !== undefined ? catatanAdmin : target.catatanAdmin,
      updatedAt: today,
    };

    setLaporanList(prev => {
      const next = prev.map(item => item.id === id ? updated : item);
      saveLocalBackup('laporan_bulanan', next);
      return next;
    });

    if (isDemoEntity(target)) return;

    await safeFirestoreSet('laporan_bulanan', id, updated);
  }, [laporanList]);

  const updateLaporanSheet = useCallback(async (id: string, sheetData: SheetPerhitunganData) => {
    const today = new Date().toISOString().split('T')[0];
    const target = laporanList.find(l => l.id === id);
    if (!target) throw new Error(`Laporan dengan ID ${id} tidak ditemukan.`);

    const updated: LaporanBulanan = {
      ...target,
      sheetPerhitungan: sheetData,
      updatedAt: today,
    };

    setLaporanList(prev => {
      const next = prev.map(item => item.id === id ? updated : item);
      saveLocalBackup('laporan_bulanan', next);
      return next;
    });

    if (isDemoEntity(target)) return;

    await safeFirestoreSet('laporan_bulanan', id, updated);
  }, [laporanList]);

  // ==========================================
  // INVOICE CRUD
  // ==========================================
  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id'> & { id?: string }) => {
    const isDemo = isDemoEntity(invoiceData.mitraId) || isDemoEntity(invoiceData.id);
    const id = invoiceData.id && invoiceData.id.trim().length > 0 
      ? invoiceData.id.trim()
      : (isDemo ? `INV-DEMO-${Date.now().toString().slice(-4)}` : generateNomorInvoiceBaru(invoiceList).nomorInvoice);

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
      createdAt: invoiceData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: isDemo || undefined,
    };

    // Track recently inputted invoice IDs in session
    try {
      const stored = sessionStorage.getItem('recent_invoice_ids');
      const recentList: string[] = stored ? JSON.parse(stored) : [];
      if (!recentList.includes(id)) {
        recentList.unshift(id);
        sessionStorage.setItem('recent_invoice_ids', JSON.stringify(recentList.slice(0, 30)));
      }
    } catch {
      // ignore in environments where sessionStorage is not available
    }

    setInvoiceList(prev => [newInvoice, ...prev.filter(i => i.id !== id)]);

    if (isDemo) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(newInvoice));
  }, [invoiceList]);

  const updateInvoice = useCallback(async (updated: Invoice) => {
    const withUpdate: Invoice = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setInvoiceList(prev => prev.map(inv => inv.id === updated.id ? withUpdate : inv));

    if (isDemoEntity(updated)) return;

    const safeId = toFirestoreDocId(updated.id);
    await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(withUpdate));
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    setInvoiceList(prev => prev.filter(inv => inv.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'invoices', safeId));
    if (safeId !== id) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const updateInvoiceStatus = useCallback(async (id: string, status: Invoice['status']) => {
    const target = invoiceList.find(i => i.id === id);
    if (!target) throw new Error(`Invoice dengan ID ${id} tidak ditemukan.`);

    const isLunas = status === 'Lunas';
    const updated: Invoice = {
      ...target,
      status,
      nominalPembayaran: isLunas ? (target.tagihanRealisasi || target.nominal) : target.nominalPembayaran,
    };

    setInvoiceList(prev => prev.map(inv => inv.id === id ? updated : inv));

    if (isDemoEntity(target)) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(updated));
  }, [invoiceList]);

  // ==========================================
  // PEMBAYARAN CRUD
  // ==========================================
  const addPembayaran = useCallback(async (pembayaranData: Omit<Pembayaran, 'id'> & { id?: string }) => {
    const isDemo = isDemoEntity(pembayaranData.mitraId) || isDemoEntity(pembayaranData.id);
    const id = pembayaranData.id || (isDemo ? `BYR-DEMO-${Date.now().toString().slice(-4)}` : `PAY-${Date.now().toString().slice(-6)}`);
    const newPay: Pembayaran = {
      ...pembayaranData,
      id,
      isDemo: isDemo || undefined,
    };

    setPembayaranList(prev => [newPay, ...prev.filter(p => p.id !== id)]);

    // If linked to an invoice, update invoice status
    if (newPay.invoiceId) {
      const updatedInvoice = invoiceList.find(inv => inv.id === newPay.invoiceId);
      if (updatedInvoice) {
        const invUpdate = { ...updatedInvoice, status: 'Menunggu Konfirmasi' as const };
        setInvoiceList(prev => prev.map(i => i.id === newPay.invoiceId ? invUpdate : i));
        if (!isDemo && !isDemoEntity(updatedInvoice)) {
          const safeInvId = toFirestoreDocId(updatedInvoice.id);
          await setDoc(doc(db, 'invoices', safeInvId), sanitizeForFirestore(invUpdate));
        }
      }
    }

    if (isDemo) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(newPay));
  }, [invoiceList]);

  const updatePembayaran = useCallback(async (pembayaran: Pembayaran) => {
    setPembayaranList(prev => prev.map(p => p.id === pembayaran.id ? pembayaran : p));
    if (isDemoEntity(pembayaran)) return;

    const safeId = toFirestoreDocId(pembayaran.id);
    await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(pembayaran));
  }, []);

  const deletePembayaran = useCallback(async (id: string) => {
    setPembayaranList(prev => prev.filter(p => p.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'pembayaran', safeId));
    if (safeId !== id) {
      try {
        await deleteDoc(doc(db, 'pembayaran', id));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const verifyPembayaran = useCallback(async (id: string, status: PembayaranStatus, catatan?: string) => {
    const target = pembayaranList.find(p => p.id === id);
    if (!target) throw new Error(`Data pembayaran dengan ID ${id} tidak ditemukan.`);

    const updatedPay: Pembayaran = {
      ...target,
      status,
      catatan: catatan !== undefined ? catatan : target.catatan,
    };

    setPembayaranList(prev => prev.map(p => p.id === id ? updatedPay : p));

    // If verified and has invoice, update the corresponding invoice
    if (status === 'Terverifikasi' && target.invoiceId) {
      const targetInvoice = invoiceList.find(inv => inv.id === target.invoiceId);
      if (targetInvoice) {
        const targetNominal = targetInvoice.tagihanRealisasi || targetInvoice.nominal || target.jumlah;
        const newPaidAmount = Math.min(targetNominal, (targetInvoice.nominalPembayaran || 0) + target.jumlah);
        const isFullyPaid = newPaidAmount >= targetNominal;
        const newInvoiceStatus: Invoice['status'] = isFullyPaid ? 'Lunas' : 'Sebagian';

        const invUpdate: Invoice = {
          ...targetInvoice,
          status: newInvoiceStatus,
          nominalPembayaran: newPaidAmount,
          tanggalDibayar: target.tanggalBayar || new Date().toISOString().split('T')[0],
        };

        setInvoiceList(prev => prev.map(i => i.id === targetInvoice.id ? invUpdate : i));
        if (!isDemoEntity(targetInvoice)) {
          const safeInvId = toFirestoreDocId(targetInvoice.id);
          await setDoc(doc(db, 'invoices', safeInvId), sanitizeForFirestore(invUpdate));
        }
      }
    }

    if (isDemoEntity(target)) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(updatedPay));
  }, [pembayaranList, invoiceList]);

  // Bulk Import Invoices & Payments directly into Firestore
  const bulkImportInvoiceAndPayment = useCallback(async (
    newInvoices: Invoice[],
    newPayments: Pembayaran[],
    mode: 'merge' | 'replace' = 'merge'
  ) => {
    setIsSyncing(true);
    setSyncStatusMessage('Sedang mengimpor data transaksi ke Firestore...');

    try {
      if (mode === 'replace') {
        for (const inv of invoiceList) {
          await deleteDoc(doc(db, 'invoices', toFirestoreDocId(inv.id)));
        }
        for (const pay of pembayaranList) {
          await deleteDoc(doc(db, 'pembayaran', toFirestoreDocId(pay.id)));
        }
      }

      for (const inv of newInvoices) {
        await setDoc(doc(db, 'invoices', toFirestoreDocId(inv.id)), sanitizeForFirestore(inv));
      }
      for (const pay of newPayments) {
        await setDoc(doc(db, 'pembayaran', toFirestoreDocId(pay.id)), sanitizeForFirestore(pay));
      }

      setLastSyncTime(new Date());
      setSyncStatusMessage('Impor data transaksi ke Firestore berhasil.');
      return {
        invoiceCount: newInvoices.length,
        paymentCount: newPayments.length,
      };
    } finally {
      setIsSyncing(false);
    }
  }, [invoiceList, pembayaranList]);

  const loadHistoricalTransactionsSince2022 = useCallback(async () => {
    return await bulkImportInvoiceAndPayment(INITIAL_INVOICES, INITIAL_PEMBAYARAN, 'replace');
  }, [bulkImportInvoiceAndPayment]);

  // ==========================================
  // EVENT TRACKER CRUD (Connected to Performance MenDAKI)
  // ==========================================
  const syncEventToMendakiForms = useCallback(async (eventItem: EventItem) => {
    if (isDemoEntity(eventItem)) return;
    const eventTitle = eventItem.judul?.trim();
    const eventCat = eventItem.kategori?.trim();
    if (!eventTitle && !eventCat) return;

    setMendakiFormList(prev => {
      const next = prev.map(form => {
        const currentOpts = form.daftarKategoriEvent || [];
        const additions: string[] = [];
        if (eventCat && !currentOpts.includes(eventCat)) additions.push(eventCat);
        if (eventTitle && !currentOpts.includes(eventTitle)) additions.push(eventTitle);
        if (additions.length === 0) return form;

        const updatedForm: MendakiFormDefinition = {
          ...form,
          daftarKategoriEvent: [...currentOpts, ...additions],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        safeFirestoreSet('mendaki_forms', updatedForm.id, updatedForm);
        return updatedForm;
      });
      saveLocalBackup('mendaki_forms', next);
      return next;
    });
  }, []);

  const addEvent = useCallback(async (eventData: Omit<EventItem, 'id'> & { id?: string }) => {
    const isDemo = isDemoEntity(eventData) || isDemoEntity(eventData.sekolahId);
    const id = eventData.id || (isDemo ? `EVT-DEMO-${Date.now().toString().slice(-4)}` : `EVT-${Date.now().toString().slice(-5)}`);
    const newEvent: EventItem = {
      ...eventData,
      id,
      mendakiFormId: eventData.mendakiFormId || 'FORM-MENDAKI-01',
      isDemo: isDemo || undefined,
    };

    setEventList(prev => {
      const next = [newEvent, ...prev.filter(e => e.id !== id)];
      saveLocalBackup('events', next);
      return next;
    });

    if (isDemo) return;

    await safeFirestoreSet('events', id, newEvent);
    await syncEventToMendakiForms(newEvent);
  }, [syncEventToMendakiForms]);

  const updateEvent = useCallback(async (event: EventItem) => {
    const updatedEvent: EventItem = {
      ...event,
      mendakiFormId: event.mendakiFormId || 'FORM-MENDAKI-01',
    };
    setEventList(prev => {
      const next = prev.map(e => e.id === updatedEvent.id ? updatedEvent : e);
      saveLocalBackup('events', next);
      return next;
    });
    if (isDemoEntity(updatedEvent)) return;

    await safeFirestoreSet('events', updatedEvent.id, updatedEvent);
    await syncEventToMendakiForms(updatedEvent);
  }, [syncEventToMendakiForms]);

  const deleteEvent = useCallback(async (id: string) => {
    setEventList(prev => {
      const next = prev.filter(e => e.id !== id);
      saveLocalBackup('events', next);
      return next;
    });
    if (isDemoEntity(id)) return;

    await safeFirestoreDelete('events', id);
  }, []);

  // ==========================================
  // PERMINTAAN MITRA CRUD
  // ==========================================
  const addPermintaan = useCallback(async (reqData: Omit<PermintaanMitra, 'id' | 'tanggalPengajuan'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDemo = isDemoEntity(reqData.mitraId) || isDemoEntity(reqData.id);
    const id = reqData.id || (isDemo ? `REQ-DEMO-${Date.now().toString().slice(-4)}` : `REQ-${Date.now().toString().slice(-6)}`);
    const newReq: PermintaanMitra = {
      ...reqData,
      id,
      tanggalPengajuan: today,
      isDemo: isDemo || undefined,
    };

    setPermintaanList(prev => [newReq, ...prev.filter(p => p.id !== id)]);

    if (isDemo) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'permintaan_mitra', safeId), sanitizeForFirestore(newReq));
  }, []);

  const updatePermintaan = useCallback(async (permintaan: PermintaanMitra) => {
    setPermintaanList(prev => prev.map(p => p.id === permintaan.id ? permintaan : p));
    if (isDemoEntity(permintaan)) return;

    const safeId = toFirestoreDocId(permintaan.id);
    await setDoc(doc(db, 'permintaan_mitra', safeId), sanitizeForFirestore(permintaan));
  }, []);

  const deletePermintaan = useCallback(async (id: string) => {
    setPermintaanList(prev => prev.filter(p => p.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'permintaan_mitra', safeId));
    if (safeId !== id) {
      try {
        await deleteDoc(doc(db, 'permintaan_mitra', id));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const updatePermintaanStatus = useCallback(async (id: string, status: PermintaanStatus, noResi?: string, catatanAdmin?: string) => {
    const target = permintaanList.find(p => p.id === id);
    if (!target) throw new Error(`Permintaan dengan ID ${id} tidak ditemukan.`);

    const updated: PermintaanMitra = {
      ...target,
      status,
      noResi: noResi !== undefined ? noResi : target.noResi,
      catatanAdmin: catatanAdmin !== undefined ? catatanAdmin : target.catatanAdmin,
    };

    setPermintaanList(prev => prev.map(p => p.id === id ? updated : p));

    if (isDemoEntity(target)) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'permintaan_mitra', safeId), sanitizeForFirestore(updated));
  }, [permintaanList]);

  // ==========================================
  // DATA MITRA (SEKOLAH) CRUD
  // ==========================================
  const addSekolah = useCallback(async (sekolah: SekolahMitra) => {
    const cleanSekolah = sanitizeForFirestore(sekolah);
    setSekolahList(prev => [...prev.filter(s => s.id !== sekolah.id), cleanSekolah]);

    if (isDemoEntity(sekolah)) return;

    const safeId = toFirestoreDocId(sekolah.id);
    await setDoc(doc(db, 'mitra', safeId), cleanSekolah);
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

    if (isDemoEntity(targetId) || isDemoEntity(cleanObj)) return;

    const safeId = toFirestoreDocId(targetId);
    await setDoc(doc(db, 'mitra', safeId), cleanObj);
  }, [sekolahList]);

  const deleteSekolah = useCallback(async (id: string) => {
    setSekolahList(prev => prev.filter(s => s.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'mitra', safeId));
    if (safeId !== id) {
      try {
        await deleteDoc(doc(db, 'mitra', id));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // ==========================================
  // STAFF ACTIVITY & GOOGLE SHEET CRUD
  // ==========================================
  const saveMasterKpiList = useCallback(async (newList: MasterKpiStandar[]) => {
    const sorted = [...newList].sort((a, b) => (a.nomor || 0) - (b.nomor || 0));
    const oldIds = new Set<string>(masterKpiList.map(k => k.id));
    const newIds = new Set<string>(sorted.map(k => k.id));

    setMasterKpiList(sorted);
    saveLocalBackup('master_kpi_standar', sorted);

    // Delete removed KPI standards from Firestore
    for (const oldId of oldIds) {
      if (!newIds.has(oldId)) {
        await safeFirestoreDelete('master_kpi_standar', oldId);
      }
    }

    // Upsert all current KPI standards to Firestore
    await Promise.all(
      sorted.map((item) => safeFirestoreSet('master_kpi_standar', item.id, item))
    );

    // Sync any updated KPI names/programs/descriptions to existing staff activities with matching noKpi
    const updatedActivities: StaffActivity[] = [];
    setStaffActivityList(prev => {
      const next = prev.map(act => {
        const matchedKpi = sorted.find(k => k.noKpi === act.noKpi);
        if (matchedKpi && (
          act.standarKpi !== matchedKpi.namaStandar ||
          act.programKpi !== matchedKpi.programKpi
        )) {
          const syncedAct: StaffActivity = {
            ...act,
            standarKpi: matchedKpi.namaStandar,
            programKpi: matchedKpi.programKpi,
            penjelasanKpi: matchedKpi.penjelasanKpi,
          };
          updatedActivities.push(syncedAct);
          return syncedAct;
        }
        return act;
      });
      saveLocalBackup('staff_activities', next);
      return next;
    });

    if (updatedActivities.length > 0) {
      await Promise.all(
        updatedActivities.map(act => safeFirestoreSet('staff_activities', act.id, act))
      );
    }
  }, [masterKpiList]);

  const addStaffActivity = useCallback(async (activityData: Omit<StaffActivity, 'id'> & { id?: string }) => {
    const id = activityData.id || `ACT-${Date.now().toString().slice(-4)}`;
    const newAct: StaffActivity = { ...activityData, id };

    setStaffActivityList(prev => {
      const next = [newAct, ...prev.filter(a => a.id !== id)];
      saveLocalBackup('staff_activities', next);
      return next;
    });

    await safeFirestoreSet('staff_activities', id, newAct);
  }, []);

  const updateStaffActivity = useCallback(async (activity: StaffActivity) => {
    setStaffActivityList(prev => {
      const next = prev.map(a => a.id === activity.id ? activity : a);
      saveLocalBackup('staff_activities', next);
      return next;
    });
    await safeFirestoreSet('staff_activities', activity.id, activity);
  }, []);

  const deleteStaffActivity = useCallback(async (id: string) => {
    setStaffActivityList(prev => {
      const next = prev.filter(a => a.id !== id);
      saveLocalBackup('staff_activities', next);
      return next;
    });
    await safeFirestoreDelete('staff_activities', id);
  }, []);

  // ==========================================
  // ADMIN MITRA OFFICE STAFF CRUD
  // ==========================================
  const addAdminStaff = useCallback(async (staffData: Omit<AdminMitraStaff, 'id'> & { id?: string }) => {
    const id = staffData.id || `MO0${(adminStaffList.length + 3).toString().padStart(2, '0')}`;
    const newStaff: AdminMitraStaff = { ...staffData, id };

    setAdminStaffList(prev => {
      const next = [...prev.filter(s => s.id !== id), newStaff];
      saveLocalBackup('admin_staff', next);
      return next;
    });

    await safeFirestoreSet('admin_staff', id, newStaff);
  }, [adminStaffList.length]);

  const updateAdminStaff = useCallback(async (staff: AdminMitraStaff) => {
    setAdminStaffList(prev => {
      const next = prev.map(s => s.id === staff.id ? staff : s);
      saveLocalBackup('admin_staff', next);
      return next;
    });
    await safeFirestoreSet('admin_staff', staff.id, staff);
  }, []);

  const deleteAdminStaff = useCallback(async (id: string) => {
    setAdminStaffList(prev => {
      const next = prev.filter(s => s.id !== id);
      saveLocalBackup('admin_staff', next);
      return next;
    });
    await safeFirestoreDelete('admin_staff', id);
  }, []);

  // ==========================================
  // TEMPLATE DOKUMEN CRUD
  // ==========================================
  const addTemplate = useCallback(async (tplData: Omit<TemplateDokumen, 'id'> & { id?: string }) => {
    const id = tplData.id || `TMP-${Date.now().toString().slice(-4)}`;
    const newTpl: TemplateDokumen = { ...tplData, id };

    setTemplateList(prev => {
      const next = [newTpl, ...prev.filter(t => t.id !== id)];
      saveLocalBackup('templates', next);
      return next;
    });

    await safeFirestoreSet('templates', id, newTpl);
  }, []);

  const updateTemplate = useCallback(async (template: TemplateDokumen) => {
    setTemplateList(prev => {
      const next = prev.map(t => t.id === template.id ? template : t);
      saveLocalBackup('templates', next);
      return next;
    });
    await safeFirestoreSet('templates', template.id, template);
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplateList(prev => {
      const next = prev.filter(t => t.id !== id);
      saveLocalBackup('templates', next);
      return next;
    });
    await safeFirestoreDelete('templates', id);
  }, []);

  // ==========================================
  // PERFORMANCE MENDAKI CRUD
  // ==========================================
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

    if (isDemoEntity(perf)) return;

    const safeId = toFirestoreDocId(perf.id);
    await setDoc(doc(db, 'performance_mendaki', safeId), sanitizeForFirestore(perf));
  }, []);

  const updatePerformance = savePerformance;

  const deletePerformance = useCallback(async (id: string) => {
    setPerformanceList(prev => prev.filter(p => p.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'performance_mendaki', safeId));
    if (safeId !== id) {
      try {
        await deleteDoc(doc(db, 'performance_mendaki', id));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // ==========================================
  // MENDAKI FORM & SUBMISSIONS CRUD
  // ==========================================
  const addMendakiForm = useCallback(async (formData: Omit<MendakiFormDefinition, 'id' | 'createdAt'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const id = formData.id || `FORM-MENDAKI-${Date.now().toString().slice(-4)}`;
    const newForm: MendakiFormDefinition = {
      ...formData,
      id,
      createdAt: today,
      updatedAt: today,
    };

    setMendakiFormList(prev => [newForm, ...prev.filter(f => f.id !== id)]);
    if (isDemoEntity(newForm)) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'mendaki_forms', safeId), sanitizeForFirestore(newForm));
  }, []);

  const updateMendakiForm = useCallback(async (form: MendakiFormDefinition) => {
    const today = new Date().toISOString().split('T')[0];
    const updated: MendakiFormDefinition = {
      ...form,
      updatedAt: today,
    };

    setMendakiFormList(prev => {
      const exists = prev.some(f => f.id === form.id);
      return exists ? prev.map(f => f.id === form.id ? updated : f) : [updated, ...prev];
    });
    if (isDemoEntity(updated)) return;

    const safeId = toFirestoreDocId(form.id);
    await setDoc(doc(db, 'mendaki_forms', safeId), sanitizeForFirestore(updated));
  }, []);

  const deleteMendakiForm = useCallback(async (id: string) => {
    setMendakiFormList(prev => prev.filter(f => f.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'mendaki_forms', safeId));
  }, []);

  const addMendakiSubmission = useCallback(async (subData: Omit<MendakiFormSubmission, 'id' | 'tanggalIsi'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDemo = Boolean(subData.isDemo || isDemoEntity(subData.mitraId) || isDemoEntity(subData.id));
    const id = subData.id || (isDemo ? `SUB-DEMO-${Date.now().toString().slice(-4)}` : `SUB-MENDAKI-${Date.now().toString().slice(-5)}`);
    const newSub: MendakiFormSubmission = {
      ...subData,
      id,
      tanggalIsi: today,
      isDemo: isDemo || undefined,
    };

    setMendakiSubmissionList(prev => [newSub, ...prev.filter(s => s.id !== id)]);
    if (isDemo) return;

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'mendaki_submissions', safeId), sanitizeForFirestore(newSub));
  }, []);

  const updateMendakiSubmission = useCallback(async (sub: MendakiFormSubmission) => {
    setMendakiSubmissionList(prev => prev.map(s => s.id === sub.id ? sub : s));
    if (isDemoEntity(sub)) return;

    const safeId = toFirestoreDocId(sub.id);
    await setDoc(doc(db, 'mendaki_submissions', safeId), sanitizeForFirestore(sub));
  }, []);

  const deleteMendakiSubmission = useCallback(async (id: string) => {
    setMendakiSubmissionList(prev => prev.filter(s => s.id !== id));
    if (isDemoEntity(id)) return;

    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'mendaki_submissions', safeId));
  }, []);

  // ==========================================
  // PROGRAM MITRA (VISITASI & MAGANG) CRUD
  // ==========================================
  const addProgramMitra = useCallback(async (itemData: Omit<ProgramMitraItem, 'id' | 'tanggalPengajuan'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const isDemo = isDemoEntity(itemData.mitraId) || isDemoEntity(itemData.id);
    const id = itemData.id || (isDemo ? `PRG-DEMO-${Date.now().toString().slice(-4)}` : `PRG-${Date.now().toString().slice(-6)}`);
    const newItem: ProgramMitraItem = {
      ...itemData,
      id,
      tanggalPengajuan: today,
      updatedAt: today,
      isDemo: isDemo || undefined,
    };

    setProgramMitraList(prev => {
      const next = [newItem, ...prev.filter(p => p.id !== id)];
      saveLocalBackup('program_mitra', next);
      return next;
    });

    if (isDemo) return;

    await safeFirestoreSet('program_mitra', id, newItem);
  }, []);

  const updateProgramMitra = useCallback(async (item: ProgramMitraItem) => {
    const today = new Date().toISOString().split('T')[0];
    const withUpdate: ProgramMitraItem = {
      ...item,
      updatedAt: today,
    };

    setProgramMitraList(prev => {
      const next = prev.map(p => p.id === item.id ? withUpdate : p);
      saveLocalBackup('program_mitra', next);
      return next;
    });

    if (isDemoEntity(item)) return;

    await safeFirestoreSet('program_mitra', item.id, withUpdate);
  }, []);

  const deleteProgramMitra = useCallback(async (id: string) => {
    setProgramMitraList(prev => {
      const next = prev.filter(p => p.id !== id);
      saveLocalBackup('program_mitra', next);
      return next;
    });
    if (isDemoEntity(id)) return;

    await safeFirestoreDelete('program_mitra', id);
  }, []);

  const addProgramMitraTemplate = useCallback(async (templateData: Omit<ProgramMitraTemplate, 'id' | 'diperbarui'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const prefix = templateData.jenis === 'Magang' ? 'TMPL-MG' : 'TMPL-VS';
    const id = templateData.id || `${prefix}-${Date.now().toString().slice(-4)}`;
    const newTemplate: ProgramMitraTemplate = {
      ...templateData,
      id,
      diperbarui: today,
    };

    setProgramMitraTemplates(prev => {
      const next = [...prev.filter(t => t.id !== id), newTemplate];
      saveLocalBackup('program_mitra_templates', next);
      return next;
    });

    await safeFirestoreSet('program_mitra_templates', id, newTemplate);
  }, []);

  const updateProgramMitraTemplate = useCallback(async (template: ProgramMitraTemplate) => {
    const today = new Date().toISOString().split('T')[0];
    const withDate: ProgramMitraTemplate = {
      ...template,
      diperbarui: today,
    };

    setProgramMitraTemplates(prev => {
      const exists = prev.some(t => t.id === template.id);
      const next = exists ? prev.map(t => t.id === template.id ? withDate : t) : [...prev, withDate];
      saveLocalBackup('program_mitra_templates', next);
      return next;
    });

    await safeFirestoreSet('program_mitra_templates', template.id, withDate);
  }, []);

  const deleteProgramMitraTemplate = useCallback(async (id: string) => {
    setProgramMitraTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      saveLocalBackup('program_mitra_templates', next);
      return next;
    });

    await safeFirestoreDelete('program_mitra_templates', id);
  }, []);

  // ==========================================
  // GOOGLE SHEET SYNC
  // ==========================================
  const syncWithSheetData = useCallback(async (parsedUsers?: UserAccount[]) => {
    setIsSyncing(true);
    setSyncStatusMessage('Sedang menyinkronkan data Google Sheet dengan Firebase...');

    try {
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
              setDoc(doc(db, 'mitra', toFirestoreDocId(school.id)), sanitizeForFirestore(school))
            )
          );
        }
      }

      setLastSyncTime(new Date());
      setSyncStatusMessage(`Sinkronisasi Google Sheet berhasil (${new Date().toLocaleTimeString('id-ID')}). Tersimpan di Firebase.`);
    } catch (err) {
      setSyncStatusMessage('Sinkronisasi selesai dengan catatan: ' + (err instanceof Error ? err.message : 'Error sync'));
    } finally {
      setIsSyncing(false);
    }
  }, [sekolahList]);

  // Reset to default data directly in Firestore
  const resetToDefaultData = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatusMessage('Mereset data ke standar awal dan menyinkronkan ke Firestore...');

    try {
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

      // Write default data to Firestore
      for (const item of INITIAL_SEKOLAH) {
        await setDoc(doc(db, 'mitra', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_LAPORAN) {
        await setDoc(doc(db, 'laporan_bulanan', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_INVOICES) {
        await setDoc(doc(db, 'invoices', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_PEMBAYARAN) {
        await setDoc(doc(db, 'pembayaran', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_EVENTS) {
        await setDoc(doc(db, 'events', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_PERMINTAAN) {
        await setDoc(doc(db, 'permintaan_mitra', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_STAFF_ACTIVITY) {
        await setDoc(doc(db, 'staff_activities', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_ADMIN_STAFF) {
        await setDoc(doc(db, 'admin_staff', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_TEMPLATES) {
        await setDoc(doc(db, 'templates', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }
      for (const item of INITIAL_PERFORMANCE_MENDAKI) {
        await setDoc(doc(db, 'performance_mendaki', toFirestoreDocId(item.id)), sanitizeForFirestore(item));
      }

      setLastSyncTime(new Date());
      setSyncStatusMessage('Data awal berhasil disinkronkan ke Firebase Firestore.');
    } catch (err) {
      setSyncStatusMessage('Reset ke Firestore mengalami kendala: ' + (err instanceof Error ? err.message : 'Error reset'));
    } finally {
      setIsSyncing(false);
    }
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
      mendakiFormList,
      mendakiSubmissionList,
      programMitraList,
      programMitraTemplates,
      masterKpiList: [...masterKpiList].sort((a, b) => (a.nomor || 0) - (b.nomor || 0)),
      isFirebaseConnected,
      isSyncing,
      isLoading,
      lastSyncTime,
      syncStatusMessage,
      saveMasterKpiList,
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
      addMendakiForm,
      updateMendakiForm,
      deleteMendakiForm,
      addMendakiSubmission,
      updateMendakiSubmission,
      deleteMendakiSubmission,
      addProgramMitra,
      updateProgramMitra,
      deleteProgramMitra,
      addProgramMitraTemplate,
      updateProgramMitraTemplate,
      deleteProgramMitraTemplate,
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
