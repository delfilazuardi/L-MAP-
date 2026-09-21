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
} from '../lib/initialData';
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
  isFirebaseConnected: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  lastSyncTime: Date | null;
  syncStatusMessage: string;
  
  // Actions
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
  // Single Source of Truth: In-memory React state synced via Firestore onSnapshot
  const [sekolahList, setSekolahList] = useState<SekolahMitra[]>(INITIAL_SEKOLAH);
  const [laporanList, setLaporanList] = useState<LaporanBulanan[]>(INITIAL_LAPORAN);
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(INITIAL_INVOICES);
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>(INITIAL_PEMBAYARAN);
  const [eventList, setEventList] = useState<EventItem[]>(INITIAL_EVENTS);
  const [permintaanList, setPermintaanList] = useState<PermintaanMitra[]>(INITIAL_PERMINTAAN);
  const [staffActivityList, setStaffActivityList] = useState<StaffActivity[]>(INITIAL_STAFF_ACTIVITY);
  const [adminStaffList, setAdminStaffList] = useState<AdminMitraStaff[]>(INITIAL_ADMIN_STAFF);
  const [templateList, setTemplateList] = useState<TemplateDokumen[]>(INITIAL_TEMPLATES);
  const [performanceList, setPerformanceList] = useState<PerformanceMenDAKI[]>(INITIAL_PERFORMANCE_MENDAKI);

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('Menyambungkan ke Firebase Firestore...');

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
            setter(docs);
          }

          if (isMounted) {
            setIsFirebaseConnected(true);
            setIsLoading(false);
            setLastSyncTime(new Date());
          }
        },
        (error) => {
          console.error(`Firestore realtime listener error [${collectionName}]:`, error);
          if (isMounted) {
            setIsFirebaseConnected(false);
            setSyncStatusMessage(`Koneksi Firestore terganggu: ${error.message}`);
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
    const id = laporanData.id || `LAP-${Date.now().toString().slice(-6)}`;
    const newLaporan: LaporanBulanan = {
      ...laporanData,
      id,
      tanggalDiajukan: laporanData.tanggalKirim || today,
      tanggalKirim: laporanData.tanggalKirim || today,
      tahunAjaran: laporanData.tahunAjaran || '2026/2027',
      updatedAt: today,
    };

    // Optimistic state update
    setLaporanList(prev => [newLaporan, ...prev.filter(l => l.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'laporan_bulanan', safeId), sanitizeForFirestore(newLaporan));
  }, []);

  const updateLaporan = useCallback(async (updated: LaporanBulanan) => {
    const today = new Date().toISOString().split('T')[0];
    const withUpdate: LaporanBulanan = {
      ...updated,
      updatedAt: today,
      tanggalKirim: updated.tanggalKirim || updated.tanggalDiajukan,
      tahunAjaran: updated.tahunAjaran || '2026/2027',
    };

    setLaporanList(prev => prev.map(item => item.id === updated.id ? withUpdate : item));

    const safeId = toFirestoreDocId(updated.id);
    await setDoc(doc(db, 'laporan_bulanan', safeId), sanitizeForFirestore(withUpdate));
  }, []);

  const deleteLaporan = useCallback(async (id: string) => {
    setLaporanList(prev => prev.filter(item => item.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'laporan_bulanan', safeId));
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

    setLaporanList(prev => prev.map(item => item.id === id ? updated : item));

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'laporan_bulanan', safeId), sanitizeForFirestore(updated));
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

    setLaporanList(prev => prev.map(item => item.id === id ? updated : item));

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'laporan_bulanan', safeId), sanitizeForFirestore(updated));
  }, [laporanList]);

  // ==========================================
  // INVOICE CRUD
  // ==========================================
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

    setInvoiceList(prev => [newInvoice, ...prev.filter(i => i.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(newInvoice));
  }, [invoiceList]);

  const updateInvoice = useCallback(async (updated: Invoice) => {
    setInvoiceList(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
    const safeId = toFirestoreDocId(updated.id);
    await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(updated));
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    setInvoiceList(prev => prev.filter(inv => inv.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'invoices', safeId));
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

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'invoices', safeId), sanitizeForFirestore(updated));
  }, [invoiceList]);

  // ==========================================
  // PEMBAYARAN CRUD
  // ==========================================
  const addPembayaran = useCallback(async (pembayaranData: Omit<Pembayaran, 'id'> & { id?: string }) => {
    const id = pembayaranData.id || `PAY-${Date.now().toString().slice(-6)}`;
    const newPay: Pembayaran = {
      ...pembayaranData,
      id,
    };

    setPembayaranList(prev => [newPay, ...prev.filter(p => p.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(newPay));

    // If linked to an invoice, update invoice status
    if (newPay.invoiceId) {
      const updatedInvoice = invoiceList.find(inv => inv.id === newPay.invoiceId);
      if (updatedInvoice) {
        const safeInvId = toFirestoreDocId(updatedInvoice.id);
        const invUpdate = { ...updatedInvoice, status: 'Menunggu Konfirmasi' as const };
        setInvoiceList(prev => prev.map(i => i.id === newPay.invoiceId ? invUpdate : i));
        await setDoc(doc(db, 'invoices', safeInvId), sanitizeForFirestore(invUpdate));
      }
    }
  }, [invoiceList]);

  const updatePembayaran = useCallback(async (pembayaran: Pembayaran) => {
    setPembayaranList(prev => prev.map(p => p.id === pembayaran.id ? pembayaran : p));
    const safeId = toFirestoreDocId(pembayaran.id);
    await setDoc(doc(db, 'pembayaran', safeId), sanitizeForFirestore(pembayaran));
  }, []);

  const deletePembayaran = useCallback(async (id: string) => {
    setPembayaranList(prev => prev.filter(p => p.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'pembayaran', safeId));
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
        const safeInvId = toFirestoreDocId(targetInvoice.id);
        await setDoc(doc(db, 'invoices', safeInvId), sanitizeForFirestore(invUpdate));
      }
    }

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
  // EVENT TRACKER CRUD
  // ==========================================
  const addEvent = useCallback(async (eventData: Omit<EventItem, 'id'> & { id?: string }) => {
    const id = eventData.id || `EVT-${Date.now().toString().slice(-5)}`;
    const newEvent: EventItem = { ...eventData, id };

    setEventList(prev => [newEvent, ...prev.filter(e => e.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'events', safeId), sanitizeForFirestore(newEvent));
  }, []);

  const updateEvent = useCallback(async (event: EventItem) => {
    setEventList(prev => prev.map(e => e.id === event.id ? event : e));
    const safeId = toFirestoreDocId(event.id);
    await setDoc(doc(db, 'events', safeId), sanitizeForFirestore(event));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    setEventList(prev => prev.filter(e => e.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'events', safeId));
  }, []);

  // ==========================================
  // PERMINTAAN MITRA CRUD
  // ==========================================
  const addPermintaan = useCallback(async (reqData: Omit<PermintaanMitra, 'id' | 'tanggalPengajuan'> & { id?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const id = reqData.id || `REQ-${Date.now().toString().slice(-6)}`;
    const newReq: PermintaanMitra = {
      ...reqData,
      id,
      tanggalPengajuan: today,
    };

    setPermintaanList(prev => [newReq, ...prev.filter(p => p.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'permintaan_mitra', safeId), sanitizeForFirestore(newReq));
  }, []);

  const updatePermintaan = useCallback(async (permintaan: PermintaanMitra) => {
    setPermintaanList(prev => prev.map(p => p.id === permintaan.id ? permintaan : p));
    const safeId = toFirestoreDocId(permintaan.id);
    await setDoc(doc(db, 'permintaan_mitra', safeId), sanitizeForFirestore(permintaan));
  }, []);

  const deletePermintaan = useCallback(async (id: string) => {
    setPermintaanList(prev => prev.filter(p => p.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'permintaan_mitra', safeId));
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

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'permintaan_mitra', safeId), sanitizeForFirestore(updated));
  }, [permintaanList]);

  // ==========================================
  // DATA MITRA (SEKOLAH) CRUD
  // ==========================================
  const addSekolah = useCallback(async (sekolah: SekolahMitra) => {
    const cleanSekolah = sanitizeForFirestore(sekolah);
    setSekolahList(prev => [...prev.filter(s => s.id !== sekolah.id), cleanSekolah]);

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

    const safeId = toFirestoreDocId(targetId);
    await setDoc(doc(db, 'mitra', safeId), cleanObj);
  }, [sekolahList]);

  const deleteSekolah = useCallback(async (id: string) => {
    setSekolahList(prev => prev.filter(s => s.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'mitra', safeId));
  }, []);

  // ==========================================
  // STAFF ACTIVITY & GOOGLE SHEET CRUD
  // ==========================================
  const addStaffActivity = useCallback(async (activityData: Omit<StaffActivity, 'id'> & { id?: string }) => {
    const id = activityData.id || `ACT-${Date.now().toString().slice(-4)}`;
    const newAct: StaffActivity = { ...activityData, id };

    setStaffActivityList(prev => [newAct, ...prev.filter(a => a.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'staff_activities', safeId), sanitizeForFirestore(newAct));
  }, []);

  const updateStaffActivity = useCallback(async (activity: StaffActivity) => {
    setStaffActivityList(prev => prev.map(a => a.id === activity.id ? activity : a));
    const safeId = toFirestoreDocId(activity.id);
    await setDoc(doc(db, 'staff_activities', safeId), sanitizeForFirestore(activity));
  }, []);

  const deleteStaffActivity = useCallback(async (id: string) => {
    setStaffActivityList(prev => prev.filter(a => a.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'staff_activities', safeId));
  }, []);

  // ==========================================
  // ADMIN MITRA OFFICE STAFF CRUD
  // ==========================================
  const addAdminStaff = useCallback(async (staffData: Omit<AdminMitraStaff, 'id'> & { id?: string }) => {
    const id = staffData.id || `MO0${(adminStaffList.length + 3).toString().padStart(2, '0')}`;
    const newStaff: AdminMitraStaff = { ...staffData, id };

    setAdminStaffList(prev => [...prev.filter(s => s.id !== id), newStaff]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'admin_staff', safeId), sanitizeForFirestore(newStaff));
  }, [adminStaffList.length]);

  const updateAdminStaff = useCallback(async (staff: AdminMitraStaff) => {
    setAdminStaffList(prev => prev.map(s => s.id === staff.id ? staff : s));
    const safeId = toFirestoreDocId(staff.id);
    await setDoc(doc(db, 'admin_staff', safeId), sanitizeForFirestore(staff));
  }, []);

  const deleteAdminStaff = useCallback(async (id: string) => {
    setAdminStaffList(prev => prev.filter(s => s.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'admin_staff', safeId));
  }, []);

  // ==========================================
  // TEMPLATE DOKUMEN CRUD
  // ==========================================
  const addTemplate = useCallback(async (tplData: Omit<TemplateDokumen, 'id'> & { id?: string }) => {
    const id = tplData.id || `TMP-${Date.now().toString().slice(-4)}`;
    const newTpl: TemplateDokumen = { ...tplData, id };

    setTemplateList(prev => [newTpl, ...prev.filter(t => t.id !== id)]);

    const safeId = toFirestoreDocId(id);
    await setDoc(doc(db, 'templates', safeId), sanitizeForFirestore(newTpl));
  }, []);

  const updateTemplate = useCallback(async (template: TemplateDokumen) => {
    setTemplateList(prev => prev.map(t => t.id === template.id ? template : t));
    const safeId = toFirestoreDocId(template.id);
    await setDoc(doc(db, 'templates', safeId), sanitizeForFirestore(template));
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplateList(prev => prev.filter(t => t.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'templates', safeId));
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

    const safeId = toFirestoreDocId(perf.id);
    await setDoc(doc(db, 'performance_mendaki', safeId), sanitizeForFirestore(perf));
  }, []);

  const updatePerformance = savePerformance;

  const deletePerformance = useCallback(async (id: string) => {
    setPerformanceList(prev => prev.filter(p => p.id !== id));
    const safeId = toFirestoreDocId(id);
    await deleteDoc(doc(db, 'performance_mendaki', safeId));
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
      isFirebaseConnected,
      isSyncing,
      isLoading,
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
