import React, { useState, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  X, 
  Shirt, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Paperclip, 
  FileText, 
  Download, 
  Settings, 
  Check, 
  Upload, 
  FolderPlus,
  Inbox,
  Calendar,
  Building,
  CheckCircle,
  AlertTriangle,
  Eye,
  Table as TableIcon,
  LayoutGrid,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSettings, DEFAULT_KATEGORI_PERMINTAAN } from '../../context/SettingsContext';
import { PermintaanMitra, PermintaanKategori, PermintaanStatus, PermintaanLampiran } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  CardboardBoxIllustration,
  DeliveryVanIllustration,
  WORKFLOW_STAGES_CONFIG,
  normalizeWorkflowStage,
  getWorkflowStepIndex,
  WorkflowIllustrationPipeline,
  StatusPengirimanModal,
  renderStageIllustration
} from './permintaan-mitra/PermintaanIllustration';

export const PermintaanMitraView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { permintaanList, sekolahList, addPermintaan, updatePermintaan, deletePermintaan } = useData();
  const { settings, updateSettings } = useSettings();

  const kategoriOptions: string[] =
    settings.daftarKategoriPermintaan && settings.daftarKategoriPermintaan.length > 0
      ? settings.daftarKategoriPermintaan
      : DEFAULT_KATEGORI_PERMINTAAN;

  // View Mode: 'sheet' (default) or 'cards'
  const [viewMode, setViewMode] = useState<'sheet' | 'cards'>('sheet');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterPoStatus, setFilterPoStatus] = useState<'ALL' | 'BELUM_DITERIMA' | 'SUDAH_DITERIMA'>('ALL');

  // Modals & Target States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermintaan, setEditingPermintaan] = useState<PermintaanMitra | null>(null);
  const [updateModalItem, setUpdateModalItem] = useState<PermintaanMitra | null>(null);
  const [viewingStatusItem, setViewingStatusItem] = useState<PermintaanMitra | null>(null);
  const [terimaPoTarget, setTerimaPoTarget] = useState<PermintaanMitra | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaItem: string; namaSekolah: string } | null>(null);

  // Admin Category Manager State
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newKategoriInput, setNewKategoriInput] = useState('');
  const [editingKategoriIdx, setEditingKategoriIdx] = useState<number | null>(null);
  const [editingKategoriValue, setEditingKategoriValue] = useState('');

  // Form State
  const [formMitraId, setFormMitraId] = useState(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
  const [formNoPo, setFormNoPo] = useState('');
  const [formTanggalPo, setFormTanggalPo] = useState(new Date().toISOString().split('T')[0]);
  const [formKategori, setFormKategori] = useState<PermintaanKategori>(kategoriOptions[0] || 'Seragam Siswa & Guru');
  const [formItem, setFormItem] = useState('');
  const [formJumlah, setFormJumlah] = useState<number>(50);
  const [formSatuan, setFormSatuan] = useState('Pcs');
  const [formSpesifikasi, setFormSpesifikasi] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formLampiran, setFormLampiran] = useState<PermintaanLampiran[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Update Progres State (Admin)
  const [newStatus, setNewStatus] = useState<PermintaanStatus>('Validasi Mitra Office');
  const [newVendorNama, setNewVendorNama] = useState('');
  const [newKurir, setNewKurir] = useState('');
  const [newResi, setNewResi] = useState('');
  const [newBiayaKirim, setNewBiayaKirim] = useState<number | ''>('');
  const [newNominalDp, setNewNominalDp] = useState<number | ''>('');
  const [newIsDpDilewati, setNewIsDpDilewati] = useState(false);
  const [newNominalPelunasan, setNewNominalPelunasan] = useState<number | ''>('');
  const [newCatatan, setNewCatatan] = useState('');

  // Helper Auto Generate No PO
  const generateNoPoSuggest = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(permintaanList.length + 1).padStart(3, '0');
    return `PO-LZ/${year}/${month}/${seq}`;
  };

  const baseList = isAdmin 
    ? permintaanList.filter(p => !p.isDemo && p.mitraId !== 'DEMO-MITRA') 
    : permintaanList.filter(p => p.mitraId === currentUser?.sekolahId);

  // Metrics for Overview
  const totalPoCount = baseList.length;
  const pendingTerimaPoCount = baseList.filter(p => !p.isPoDiterima).length;
  const produksiCount = baseList.filter(p => normalizeWorkflowStage(p.status) === 'Produksi').length;
  const pengirimanCount = baseList.filter(p => normalizeWorkflowStage(p.status) === 'Pengiriman').length;
  const selesaiCount = baseList.filter(p => normalizeWorkflowStage(p.status) === 'Selesai').length;

  const filtered = baseList.filter(p => {
    const itemName = p.namaItem || p.itemDetail || '';
    const poNumber = p.noPo || '';
    const matchSearch =
      p.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchKategori =
      selectedKategori === 'ALL' ||
      p.kategori === selectedKategori ||
      (selectedKategori === 'Seragam Siswa & Guru' && p.kategori === 'Seragam') ||
      (selectedKategori === 'Dokumen Cetak & Sertifikat' && p.kategori === 'Dokumen Cetak');

    const normalizedStep = normalizeWorkflowStage(p.status);
    const matchStatus = selectedStatus === 'ALL' || normalizedStep === selectedStatus || p.status === selectedStatus;

    const matchPoStatus =
      filterPoStatus === 'ALL' ||
      (filterPoStatus === 'BELUM_DITERIMA' && !p.isPoDiterima) ||
      (filterPoStatus === 'SUDAH_DITERIMA' && p.isPoDiterima);

    return matchSearch && matchKategori && matchStatus && matchPoStatus;
  });

  // Admin Category Handlers
  const handleAddKategori = () => {
    const trimmed = newKategoriInput.trim();
    if (!trimmed) return;
    if (!kategoriOptions.includes(trimmed)) {
      const updated = [...kategoriOptions, trimmed];
      updateSettings({ daftarKategoriPermintaan: updated });
      setFormKategori(trimmed);
    }
    setNewKategoriInput('');
  };

  const handleSaveEditKategori = (idx: number) => {
    const trimmed = editingKategoriValue.trim();
    if (!trimmed) return;
    const oldVal = kategoriOptions[idx];
    const updated = kategoriOptions.map((k, i) => (i === idx ? trimmed : k));
    updateSettings({ daftarKategoriPermintaan: updated });
    if (formKategori === oldVal) {
      setFormKategori(trimmed);
    }
    setEditingKategoriIdx(null);
    setEditingKategoriValue('');
  };

  const handleDeleteKategori = (idx: number) => {
    if (kategoriOptions.length <= 1) return;
    const removed = kategoriOptions[idx];
    const updated = kategoriOptions.filter((_, i) => i !== idx);
    updateSettings({ daftarKategoriPermintaan: updated });
    if (formKategori === removed) {
      setFormKategori(updated[0] || 'Seragam Siswa & Guru');
    }
  };

  // File Attachment Handler (PDF / DOC / DOCX)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['pdf', 'doc', 'docx'];
      if (!allowedExts.includes(ext)) {
        setUploadError('Format file harus berupa PDF (.pdf) atau Word (.doc / .docx)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('Ukuran maksimal per dokumen adalah 2 MB agar tersimpan optimal.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newDoc: PermintaanLampiran = {
            namaFile: file.name,
            ukuranFile: file.size,
            tipeFile: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/msword'),
            dataUrl: reader.result,
            uploadedAt: new Date().toISOString().split('T')[0],
          };
          setFormLampiran((prev) => [...prev, newDoc]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLampiran = (index: number) => {
    setFormLampiran((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPermintaan(null);
    setFormMitraId(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
    setFormNoPo(generateNoPoSuggest());
    setFormTanggalPo(new Date().toISOString().split('T')[0]);
    setFormKategori(kategoriOptions[0] || 'Seragam Siswa & Guru');
    setFormItem('');
    setFormJumlah(50);
    setFormSatuan('Pcs');
    setFormSpesifikasi('');
    setFormCatatan('');
    setFormLampiran([]);
    setUploadError(null);
    setIsManagingCategories(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: PermintaanMitra) => {
    setEditingPermintaan(p);
    setFormMitraId(p.mitraId);
    setFormNoPo(p.noPo || generateNoPoSuggest());
    setFormTanggalPo(p.tanggalPo || p.tanggalPengajuan || new Date().toISOString().split('T')[0]);
    setFormKategori(p.kategori);
    setFormItem(p.namaItem || p.itemDetail || '');
    setFormJumlah(p.jumlah);
    setFormSatuan(p.satuan || 'Pcs');
    setFormSpesifikasi(p.spesifikasi || '');
    setFormCatatan(p.catatan || '');
    setFormLampiran(p.lampiranDokumen || []);
    setUploadError(null);
    setIsManagingCategories(false);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, namaItem: string, namaSekolah: string) => {
    setDeleteTarget({ id, namaItem, namaSekolah });
  };

  // Submit Add / Edit Permintaan
  const handleSavePermintaan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSchool = sekolahList.find(s => s.id === formMitraId);
    const today = new Date().toISOString().split('T')[0];

    if (editingPermintaan) {
      await updatePermintaan({
        ...editingPermintaan,
        mitraId: formMitraId,
        namaSekolah: targetSchool ? targetSchool.namaSekolah : editingPermintaan.namaSekolah,
        noPo: formNoPo.trim() || editingPermintaan.noPo,
        tanggalPo: formTanggalPo || editingPermintaan.tanggalPo,
        kategori: formKategori,
        namaItem: formItem,
        jumlah: Number(formJumlah),
        satuan: formSatuan,
        spesifikasi: formSpesifikasi,
        catatan: formCatatan,
        lampiranDokumen: formLampiran,
      });
    } else {
      await addPermintaan({
        mitraId: formMitraId,
        namaSekolah: targetSchool ? targetSchool.namaSekolah : (currentUser?.nama || 'Sekolah Mitra'),
        noPo: formNoPo.trim() || generateNoPoSuggest(),
        tanggalPo: formTanggalPo || today,
        isPoDiterima: false,
        kategori: formKategori,
        namaItem: formItem,
        jumlah: Number(formJumlah),
        satuan: formSatuan,
        spesifikasi: formSpesifikasi,
        status: 'Validasi Mitra Office',
        catatan: formCatatan,
        lampiranDokumen: formLampiran,
      });
    }

    setIsModalOpen(false);
    setFormItem('');
    setFormSpesifikasi('');
    setFormCatatan('');
    setFormLampiran([]);
  };

  // Admin Click "Terima PO" Handler
  const handleConfirmTerimaPo = async (item: PermintaanMitra) => {
    if (!isAdmin) return;
    const today = new Date().toISOString().split('T')[0];
    const receiver = currentUser?.nama ? `${currentUser.nama} (Mitra Office)` : 'Admin Mitra Office';

    const updated = {
      ...item,
      isPoDiterima: true,
      tanggalTerimaPo: today,
      diterimaOleh: receiver,
      status: item.status === 'Pengajuan' || item.status === 'Diajukan' ? 'Validasi Mitra Office' : item.status,
      catatanAdmin: item.catatanAdmin
        ? `${item.catatanAdmin} | PO diterima resmi pada ${today} oleh ${receiver}`
        : `PO diterima resmi pada ${today} oleh ${receiver}`,
    };

    await updatePermintaan(updated);

    if (viewingStatusItem && viewingStatusItem.id === item.id) {
      setViewingStatusItem(updated);
    }
    setTerimaPoTarget(null);
  };

  // Quick Direct Step Click
  const handleQuickStepChange = async (item: PermintaanMitra, targetStep: PermintaanStatus) => {
    if (!isAdmin) return;
    const updated = {
      ...item,
      status: targetStep,
    };
    await updatePermintaan(updated);
    if (viewingStatusItem && viewingStatusItem.id === item.id) {
      setViewingStatusItem(updated);
    }
  };

  // Open Progres Modal
  const handleOpenUpdateModal = (item: PermintaanMitra) => {
    setUpdateModalItem(item);
    setNewStatus(normalizeWorkflowStage(item.status));
    setNewVendorNama(item.vendorNama || '');
    setNewKurir(item.kurir || '');
    setNewResi(item.noResi || '');
    setNewBiayaKirim(item.biayaKirim !== undefined ? item.biayaKirim : '');
    setNewNominalDp(item.nominalDP !== undefined ? item.nominalDP : '');
    setNewIsDpDilewati(Boolean(item.isDpDilewati));
    setNewNominalPelunasan(item.nominalPelunasan !== undefined ? item.nominalPelunasan : '');
    setNewCatatan(item.catatanAdmin || item.catatan || '');
  };

  // Save Progres Modal
  const handleSaveUpdateModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalItem) return;

    const updated = {
      ...updateModalItem,
      status: newStatus,
      vendorNama: newVendorNama || updateModalItem.vendorNama,
      kurir: newKurir || updateModalItem.kurir,
      noResi: newResi || updateModalItem.noResi,
      biayaKirim: newBiayaKirim !== '' ? Number(newBiayaKirim) : updateModalItem.biayaKirim,
      nominalDP: newNominalDp !== '' ? Number(newNominalDp) : updateModalItem.nominalDP,
      isDpDilewati: newIsDpDilewati,
      nominalPelunasan: newNominalPelunasan !== '' ? Number(newNominalPelunasan) : updateModalItem.nominalPelunasan,
      catatanAdmin: newCatatan || updateModalItem.catatanAdmin,
    };

    await updatePermintaan(updated);

    if (viewingStatusItem && viewingStatusItem.id === updateModalItem.id) {
      setViewingStatusItem(updated);
    }
    setUpdateModalItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package size={26} className="text-blue-600" />
            <span>Permintaan Logistik Mitra & PO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Format lembar sheet pengadaan kebutuhan sekolah, pencatatan Terima PO resmi, dan pelacakan gambar tahapan pengiriman
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* View Mode Toggle: Sheet vs Cards */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('sheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                viewMode === 'sheet'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Sheet Spreadsheet"
            >
              <TableIcon size={14} />
              <span>Tampilan Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={14} />
              <span>Tampilan Kartu</span>
            </button>
          </div>

          <button
            id="btn-tambah-permintaan"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Ajukan PO Baru</span>
          </button>
        </div>
      </div>

      {/* Sheet Summary Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total PO */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Inbox size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total PO di Sheet</span>
            <span className="text-base font-black text-slate-900">{totalPoCount} Baris</span>
          </div>
        </div>

        {/* Metric 2: Menunggu Terima PO */}
        <div className={`p-3.5 rounded-2xl border shadow-2xs flex items-center gap-3 transition ${
          pendingTerimaPoCount > 0 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-200'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            pendingTerimaPoCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'
          }`}>
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Belum Terima PO</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black">{pendingTerimaPoCount}</span>
              {pendingTerimaPoCount > 0 && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">Perlu Aksi</span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Tahap 5 Produksi Box */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="shrink-0">
            <CardboardBoxIllustration size={38} isPacking={produksiCount > 0} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahap 5 • Produksi</span>
            <span className="text-base font-black text-amber-900">{produksiCount} Box Kemasan</span>
          </div>
        </div>

        {/* Metric 4: Tahap 7 Pengiriman Mobil Box */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="shrink-0">
            <DeliveryVanIllustration size={38} isInTransit={pengirimanCount > 0} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahap 7 • Pengiriman</span>
            <span className="text-base font-black text-sky-900">{pengirimanCount} Kurir Jalan</span>
          </div>
        </div>

        {/* Metric 5: Selesai */}
        <div className="col-span-2 lg:col-span-1 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahap 8 • Selesai</span>
            <span className="text-base font-black text-emerald-900">{selesaiCount} Tuntas</span>
          </div>
        </div>
      </div>

      {/* Sheet Filter Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-permintaan"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. PO, nama item, spesifikasi, atau nama sekolah mitra..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          id="filter-kategori-permintaan"
          value={selectedKategori}
          onChange={(e) => setSelectedKategori(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Kategori Kebutuhan</option>
          {kategoriOptions.map((kat) => (
            <option key={kat} value={kat}>
              {kat}
            </option>
          ))}
        </select>

        <select
          id="filter-status-permintaan"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua 8 Tahapan</option>
          {WORKFLOW_STAGES_CONFIG.map((step) => (
            <option key={step.id} value={step.id}>
              Tahap {step.stepNum}: {step.label}
            </option>
          ))}
        </select>

        <select
          value={filterPoStatus}
          onChange={(e) => setFilterPoStatus(e.target.value as any)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Status PO: Semua</option>
          <option value="BELUM_DITERIMA">Belum Terima PO</option>
          <option value="SUDAH_DITERIMA">Sudah Terima PO</option>
        </select>
      </div>

      {/* ========================================================= */}
      {/* 1. TAMPILAN SHEET (SPREADSHEET TABLE) — PRIMARY VIEW      */}
      {/* ========================================================= */}
      {viewMode === 'sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Spreadsheet Header Bar */}
          <div className="px-5 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <TableIcon size={15} className="text-blue-600" />
              <span className="font-extrabold text-slate-800">Lembar Data Permintaan PO (Spreadsheet View)</span>
              <span>•</span>
              <span className="text-slate-500">{filtered.length} Data ditemukan</span>
            </div>
            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <Eye size={13} />
              <span>Klik pada kolom <strong>&quot;Status Pengiriman&quot;</strong> untuk membuka rincian gambar tahapan</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider select-none">
                  <th className="py-3 px-3 text-center w-12 border-r border-slate-200">#</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">No. PO</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Tgl PO</th>
                  <th className="py-3 px-4 border-r border-slate-200">Sekolah Pemohon</th>
                  <th className="py-3 px-3.5 border-r border-slate-200">Kategori</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-48">Item Permintaan & Spesifikasi</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 text-center">Jumlah</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 text-center">Lampiran</th>
                  <th className="py-3 px-3.5 border-r border-slate-200 text-center">Status PO</th>
                  <th className="py-3 px-4 border-r border-slate-200 min-w-56 text-center bg-blue-50/60 text-blue-900">
                    Status Pengiriman (Buka Gambar)
                  </th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <Package size={36} className="mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-600">Tidak ada baris data permintaan PO yang sesuai.</p>
                      <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau filter di atas.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => {
                    const currentStepIdx = getWorkflowStepIndex(item.status);
                    const currentConfig = WORKFLOW_STAGES_CONFIG[currentStepIdx] || WORKFLOW_STAGES_CONFIG[0];
                    const itemName = item.namaItem || item.itemDetail || 'Permintaan Logistik';
                    const lampiranList = item.lampiranDokumen || [];
                    const isProduksi = currentStepIdx === 4;
                    const isPengiriman = currentStepIdx === 6;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-blue-50/40 transition group ${
                          !item.isPoDiterima ? 'bg-amber-50/30' : index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                      >
                        {/* 1. Row Index */}
                        <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold border-r border-slate-100">
                          {index + 1}
                        </td>

                        {/* 2. No. PO */}
                        <td className="py-3 px-3.5 border-r border-slate-100 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {item.noPo ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
                              {item.noPo}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">#{item.id}</span>
                          )}
                        </td>

                        {/* 3. Tanggal PO */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                          {item.tanggalPo || item.tanggalPengajuan}
                        </td>

                        {/* 4. Sekolah Pemohon */}
                        <td className="py-3 px-4 border-r border-slate-100 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 block">{item.namaSekolah}</span>
                          <span className="text-[10px] text-slate-400">ID: {item.mitraId}</span>
                        </td>

                        {/* 5. Kategori */}
                        <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.kategori}
                          </span>
                        </td>

                        {/* 6. Item Permintaan & Spesifikasi */}
                        <td className="py-3 px-4 border-r border-slate-100">
                          <span className="font-bold text-slate-900 block">{itemName}</span>
                          {item.spesifikasi && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                              Spek: {item.spesifikasi}
                            </span>
                          )}
                        </td>

                        {/* 7. Jumlah */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-center whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {item.jumlah}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{item.satuan || 'Pcs'}</span>
                        </td>

                        {/* 8. Lampiran Dokumen */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-center whitespace-nowrap">
                          {lampiranList.length > 0 ? (
                            <div className="inline-flex items-center gap-1">
                              <a
                                href={lampiranList[0].dataUrl}
                                download={lampiranList[0].namaFile}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition"
                                title={`Unduh: ${lampiranList[0].namaFile}`}
                              >
                                <FileText size={12} />
                                <span>{lampiranList.length} Dokumen</span>
                                <Download size={11} className="opacity-70" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </td>

                        {/* 9. Status PO Penerimaan */}
                        <td className="py-3 px-3.5 border-r border-slate-100 text-center whitespace-nowrap">
                          {item.isPoDiterima ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Diterima ({item.tanggalTerimaPo || item.tanggalPengajuan})</span>
                            </span>
                          ) : isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setTerimaPoTarget(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-2xs transition cursor-pointer"
                            >
                              <Check size={12} />
                              <span>Terima PO</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                              <Clock size={12} className="text-amber-600" />
                              <span>Menunggu</span>
                            </span>
                          )}
                        </td>

                        {/* 10. Status Pengiriman (Buka Gambar) -> HERO INTERACTIVE CELL */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center whitespace-nowrap bg-blue-50/20">
                          <button
                            type="button"
                            onClick={() => setViewingStatusItem(item)}
                            className="w-full inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-600 hover:text-white text-slate-800 font-extrabold text-xs shadow-2xs transition cursor-pointer group/btn"
                            title="Klik untuk membuka pelacakan gambar lengkap tahapan"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-blue-50 group-hover/btn:bg-white/20 flex items-center justify-center shrink-0">
                                {isProduksi ? (
                                  <CardboardBoxIllustration size={20} isPacking={true} />
                                ) : isPengiriman ? (
                                  <DeliveryVanIllustration size={20} isInTransit={true} />
                                ) : (
                                  <span className="text-[10px] font-black text-blue-700 group-hover/btn:text-white">
                                    {currentStepIdx + 1}
                                  </span>
                                )}
                              </div>
                              <span className="truncate">
                                Tahap {currentStepIdx + 1}: {currentConfig.label}
                              </span>
                            </div>

                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 group-hover/btn:bg-white/30 text-blue-800 group-hover/btn:text-white shrink-0">
                              <Eye size={11} />
                              <span>Buka Gambar</span>
                            </span>
                          </button>
                        </td>

                        {/* 11. Aksi */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingStatusItem(item)}
                              className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Buka status pengiriman & gambar"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                              title="Edit PO"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, itemName, item.namaSekolah)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenUpdateModal(item)}
                                className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                                title="Kelola tahapan & nomor resi"
                              >
                                <Settings size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAMPILAN KARTU (FALLBACK / CARD GRID VIEW)             */}
      {/* ========================================================= */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-5">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <Package size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Belum ada data permintaan / PO yang sesuai.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const currentStepIdx = getWorkflowStepIndex(item.status);
              const itemName = item.namaItem || item.itemDetail || 'Permintaan Mitra';
              const lampiranList = item.lampiranDokumen || [];

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-blue-300 transition shadow-xs p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        {item.kategori.toLowerCase().includes('seragam') ? <Shirt size={22} /> : <FileSpreadsheet size={22} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900">{itemName}</h3>
                          {item.noPo && (
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {item.noPo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="font-bold text-blue-600">{item.namaSekolah}</span>
                          <span>•</span>
                          <span>Tgl PO: {item.tanggalPo || item.tanggalPengajuan}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingStatusItem(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer self-start"
                    >
                      <Eye size={14} />
                      <span>Buka Status Gambar</span>
                    </button>
                  </div>

                  {/* Visual Pipeline Bar */}
                  <WorkflowIllustrationPipeline
                    currentStatus={item.status}
                    noPo={item.noPo}
                    tanggalPo={item.tanggalPo}
                    tanggalTerimaPo={item.tanggalTerimaPo}
                    isPoDiterima={item.isPoDiterima}
                    diterimaOleh={item.diterimaOleh}
                    vendorNama={item.vendorNama}
                    noResi={item.noResi}
                    kurir={item.kurir}
                    canEdit={isAdmin}
                    onStepClick={(target) => handleQuickStepChange(item, target)}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL STATUS PENGIRIMAN & ILUSTRASI BERTAHAP (GAMBAR2) */}
      {/* ========================================================= */}
      {viewingStatusItem && (
        <StatusPengirimanModal
          item={viewingStatusItem}
          onClose={() => setViewingStatusItem(null)}
          isAdmin={isAdmin}
          onQuickStepChange={(target) => handleQuickStepChange(viewingStatusItem, target)}
          onOpenManageModal={() => handleOpenUpdateModal(viewingStatusItem)}
          onConfirmTerimaPo={() => handleConfirmTerimaPo(viewingStatusItem)}
        />
      )}

      {/* ========================================================= */}
      {/* 4. MODAL FORM PENGAJUAN PERMINTAAN & BUAT PO             */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {editingPermintaan ? 'Edit Permintaan & Purchase Order' : 'Form Pengajuan Permintaan Mitra (PO)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data pemohon, nomor & tanggal PO, item, jumlah, dan lampirkan dokumen (PDF/Word)
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermintaan} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sekolah Pemohon <span className="text-rose-500">*</span>
                </label>
                {isAdmin ? (
                  <select
                    value={formMitraId}
                    onChange={(e) => setFormMitraId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {sekolahList.filter(s => !s.isDemo && s.id !== 'DEMO-MITRA').map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={currentUser?.nama || 'Sekolah Mitra'}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      No. Purchase Order (PO) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormNoPo(generateNoPoSuggest())}
                      className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formNoPo}
                    onChange={(e) => setFormNoPo(e.target.value)}
                    placeholder="Contoh: PO-LZ/2026/10/001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal PO <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggalPo}
                    onChange={(e) => setFormTanggalPo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Kategori Kebutuhan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Kategori Kebutuhan <span className="text-rose-500">*</span>
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsManagingCategories(!isManagingCategories)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      <Settings size={12} />
                      <span>{isManagingCategories ? 'Tutup Kelola Kategori' : '+ Tambah / Edit Kategori'}</span>
                    </button>
                  )}
                </div>

                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as PermintaanKategori)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {kategoriOptions.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                  {!kategoriOptions.includes(formKategori) && (
                    <option value={formKategori}>{formKategori}</option>
                  )}
                </select>

                {isAdmin && isManagingCategories && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <span className="text-[11px] font-extrabold text-blue-950 flex items-center gap-1.5">
                      <FolderPlus size={14} className="text-blue-600" />
                      <span>Kelola Daftar Kategori Kebutuhan (Khusus Admin)</span>
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKategoriInput}
                        onChange={(e) => setNewKategoriInput(e.target.value)}
                        placeholder="Ketik kategori kebutuhan baru..."
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddKategori}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Tambah</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {kategoriOptions.map((kat, idx) => (
                        <div
                          key={`${kat}-${idx}`}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200"
                        >
                          {editingKategoriIdx === idx ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="text"
                                value={editingKategoriValue}
                                onChange={(e) => setEditingKategoriValue(e.target.value)}
                                className="flex-1 px-2.5 py-1 border border-blue-400 rounded-lg text-xs font-semibold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditKategori(idx)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Simpan"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKategoriIdx(null)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                title="Batal"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-800 truncate">{kat}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingKategoriIdx(idx);
                                    setEditingKategoriValue(kat);
                                  }}
                                  className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit3 size={13} />
                                </button>
                                {kategoriOptions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKategori(idx)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Item Permintaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  placeholder="Contoh: Seragam Batik Siswa Lazuardi Biru, Buku Raport..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jumlah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Buku">Buku / Eksemplar</option>
                    <option value="Set">Set / Stel</option>
                    <option value="Paket">Paket</option>
                    <option value="Box">Box / Kardus</option>
                    <option value="Lembar">Lembar</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rincian Ukuran / Spesifikasi Item</label>
                <input
                  type="text"
                  value={formSpesifikasi}
                  onChange={(e) => setFormSpesifikasi(e.target.value)}
                  placeholder="Contoh: Ukuran S: 20 pcs, M: 40 pcs, L: 20 pcs"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Lampiran Dokumen */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-black text-slate-800">
                      Lampiran Dokumen PO (PDF / Word .doc .docx)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Lampirkan berkas PO resmi, surat permohonan, atau lembar spesifikasi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Upload size={13} />
                    <span>Unggah File</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadError && (
                  <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                    {uploadError}
                  </p>
                )}

                {formLampiran.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {formLampiran.map((docItem, idx) => (
                      <div
                        key={`${docItem.namaFile}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={16} className="text-blue-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 block truncate text-[11px]">
                              {docItem.namaFile}
                            </span>
                            {docItem.ukuranFile && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatFileSize(docItem.ukuranFile)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLampiran(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition bg-white/70"
                  >
                    <Paperclip size={20} className="mx-auto text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-600 block">
                      Klik untuk memilih berkas dokumen (.pdf, .doc, .docx)
                    </span>
                    <span className="text-[10px] text-slate-400">Ukuran maksimal file: 2 MB</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Alamat pengiriman khusus, batas waktu tanggal tiba yang diharapkan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {editingPermintaan ? 'Simpan Perubahan PO' : 'Kirim PO Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL KONFIRMASI TERIMA PO OLEH ADMIN                  */}
      {/* ========================================================= */}
      {terimaPoTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle size={26} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Konfirmasi Terima PO</h3>
                <p className="text-[11px] text-slate-500">
                  Tandai bahwa Purchase Order ini telah resmi diterima oleh Mitra Office
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Sekolah Pemohon:</span>
                <span className="font-extrabold text-slate-900">{terimaPoTarget.namaSekolah}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">No. PO:</span>
                <span className="font-mono font-bold text-blue-700">{terimaPoTarget.noPo || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Item & Jumlah:</span>
                <span className="font-bold text-slate-900">
                  {terimaPoTarget.namaItem || terimaPoTarget.itemDetail} ({terimaPoTarget.jumlah} {terimaPoTarget.satuan || 'Pcs'})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold">Tanggal Terima:</span>
                <span className="font-bold text-emerald-700">
                  {new Date().toISOString().split('T')[0]} (Hari ini)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Diterima Oleh:</span>
                <span className="font-bold text-slate-900">
                  {currentUser?.nama || 'Admin Mitra Office'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTerimaPoTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmTerimaPo(terimaPoTarget)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>Konfirmasi Terima PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL UPDATE PROGRES & RESI (ADMIN)                    */}
      {/* ========================================================= */}
      {updateModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Kelola Tahapan Progres & Pengiriman PO
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update status 8 tahapan untuk {updateModalItem.namaSekolah} ({updateModalItem.noPo || updateModalItem.id})
                </p>
              </div>
              <button 
                onClick={() => setUpdateModalItem(null)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUpdateModal} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Pilih Tahapan Progres (8 Tahap)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKFLOW_STAGES_CONFIG.map((step) => {
                    const isSelected = newStatus === step.id;
                    return (
                      <button
                        type="button"
                        key={step.id}
                        onClick={() => setNewStatus(step.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isSelected ? 'bg-white text-blue-700' : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          {step.stepNum}
                        </span>
                        <div className="min-w-0">
                          <span className="font-extrabold block text-xs truncate">{step.label}</span>
                          <span className={`text-[10px] block line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {step.shortDesc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DP Form */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950">
                    Tahap 2: DP (Down Payment) — Opsional
                  </span>
                  <label className="flex items-center gap-1.5 font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsDpDilewati}
                      onChange={(e) => setNewIsDpDilewati(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Lewati DP (Tanpa DP)</span>
                  </label>
                </div>
                {!newIsDpDilewati && (
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Nominal DP (Rp)</label>
                    <input
                      type="number"
                      value={newNominalDp}
                      onChange={(e) => setNewNominalDp(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Contoh: 5000000"
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Vendor Info & Produksi (Tahap 4 & 5) */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <label className="block font-extrabold text-indigo-950">
                  Tahap 4 & 5: Info Vendor & Produksi (Box Kardus)
                </label>
                <input
                  type="text"
                  value={newVendorNama}
                  onChange={(e) => setNewVendorNama(e.target.value)}
                  placeholder="Nama Vendor Rekanan (Contoh: CV Berkah Konveksi Utama, Percetakan Grafika)"
                  className="w-full p-2 bg-white border border-indigo-300 rounded-xl font-semibold"
                />
              </div>

              {/* Pelunasan (Tahap 6) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pelunasan (Rp) - Opsional</label>
                <input
                  type="number"
                  value={newNominalPelunasan}
                  onChange={(e) => setNewNominalPelunasan(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 12500000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              {/* Pengiriman (Tahap 7 - Mobil Box & Ekspedisi) */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                <span className="font-extrabold text-sky-950 flex items-center gap-1.5">
                  <Truck size={14} className="text-sky-600" />
                  <span>Tahap 7: Ekspedisi & Resi Mobil Box Pengiriman</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-sky-900 mb-1">Nama Kurir / Ekspedisi</label>
                    <input
                      type="text"
                      value={newKurir}
                      onChange={(e) => setNewKurir(e.target.value)}
                      placeholder="JNE / TIKI / Kurir Lazuardi..."
                      className="w-full p-2 bg-white border border-sky-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-sky-900 mb-1">No. Resi Pengiriman</label>
                    <input
                      type="text"
                      value={newResi}
                      onChange={(e) => setNewResi(e.target.value)}
                      placeholder="Contoh: JNE-9902189..."
                      className="w-full p-2 bg-white border border-sky-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-sky-900 mb-1">Biaya Kirim / Ongkir (Rp)</label>
                  <input
                    type="number"
                    value={newBiayaKirim}
                    onChange={(e) => setNewBiayaKirim(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 150000"
                    className="w-full p-2 bg-white border border-sky-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan Admin</label>
                <textarea
                  rows={2}
                  value={newCatatan}
                  onChange={(e) => setNewCatatan(e.target.value)}
                  placeholder="Catatan pengerjaan vendor, info packing box, atau jadwal kurir..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdateModalItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer shadow-md shadow-blue-600/30"
                >
                  Simpan Tahapan & Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePermintaan(deleteTarget.id);
          }
        }}
        title="Hapus Permintaan Mitra"
        message="Apakah Anda yakin ingin menghapus permohonan logistik / PO ini dari Firestore? Data yang dihapus tidak dapat dipulihkan."
        itemName={deleteTarget ? `${deleteTarget.namaSekolah} - ${deleteTarget.namaItem}` : ''}
        confirmLabel="Hapus Permintaan"
      />
    </div>
  );
};
