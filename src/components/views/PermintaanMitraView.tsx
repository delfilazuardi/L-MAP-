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
  ChevronRight,
  ChevronLeft,
  Upload,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSettings, DEFAULT_KATEGORI_PERMINTAAN } from '../../context/SettingsContext';
import { PermintaanMitra, PermintaanKategori, PermintaanStatus, PermintaanLampiran } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const PERMINTAAN_PROGRESS_STEPS: {
  id: PermintaanStatus;
  label: string;
  shortDesc: string;
}[] = [
  { id: 'Pengajuan', label: 'Pengajuan', shortDesc: 'Permohonan diajukan mitra' },
  { id: 'DP', label: 'DP', shortDesc: 'Pembayaran Down Payment (DP)' },
  { id: 'Proses', label: 'Proses', shortDesc: 'Produksi / penyiapan barang' },
  { id: 'Pelunasan', label: 'Pelunasan', shortDesc: 'Pelunasan tagihan pesanan' },
  { id: 'Biaya Kirim', label: 'Biaya Kirim', shortDesc: 'Konfirmasi ongkos ekspedisi' },
  { id: 'Pengiriman', label: 'Pengiriman', shortDesc: 'Barang dalam pengiriman kurir' },
  { id: 'Selesai', label: 'Selesai', shortDesc: 'Pesanan diterima & selesai' },
];

export function normalizePermintaanStep(status: PermintaanStatus): PermintaanStatus {
  if (status === 'Diajukan') return 'Pengajuan';
  if (status === 'Diproses') return 'Proses';
  if (status === 'Dikirim') return 'Pengiriman';
  const found = PERMINTAAN_PROGRESS_STEPS.find(s => s.id === status);
  return found ? found.id : 'Pengajuan';
}

export function getStepIndex(status: PermintaanStatus): number {
  const normalized = normalizePermintaanStep(status);
  const idx = PERMINTAAN_PROGRESS_STEPS.findIndex(s => s.id === normalized);
  return idx >= 0 ? idx : 0;
}

export const PermintaanMitraView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { permintaanList, sekolahList, addPermintaan, updatePermintaan, deletePermintaan, updatePermintaanStatus } = useData();
  const { settings, updateSettings } = useSettings();

  const kategoriOptions: string[] =
    settings.daftarKategoriPermintaan && settings.daftarKategoriPermintaan.length > 0
      ? settings.daftarKategoriPermintaan
      : DEFAULT_KATEGORI_PERMINTAAN;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermintaan, setEditingPermintaan] = useState<PermintaanMitra | null>(null);
  const [updateModalItem, setUpdateModalItem] = useState<PermintaanMitra | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; namaItem: string; namaSekolah: string } | null>(null);

  // Admin Category Manager State
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newKategoriInput, setNewKategoriInput] = useState('');
  const [editingKategoriIdx, setEditingKategoriIdx] = useState<number | null>(null);
  const [editingKategoriValue, setEditingKategoriValue] = useState('');

  // Form State
  const [formMitraId, setFormMitraId] = useState(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
  const [formKategori, setFormKategori] = useState<PermintaanKategori>(kategoriOptions[0] || 'Seragam Siswa & Guru');
  const [formItem, setFormItem] = useState('');
  const [formJumlah, setFormJumlah] = useState<number>(50);
  const [formSpesifikasi, setFormSpesifikasi] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formLampiran, setFormLampiran] = useState<PermintaanLampiran[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState<PermintaanStatus>('Pengajuan');
  const [newResi, setNewResi] = useState('');
  const [newCatatan, setNewCatatan] = useState('');

  const baseList = isAdmin 
    ? permintaanList.filter(p => !p.isDemo && p.mitraId !== 'DEMO-MITRA') 
    : permintaanList.filter(p => p.mitraId === currentUser?.sekolahId);

  const filtered = baseList.filter(p => {
    const itemName = p.namaItem || p.itemDetail || '';
    const matchSearch =
      p.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori =
      selectedKategori === 'ALL' ||
      p.kategori === selectedKategori ||
      (selectedKategori === 'Seragam Siswa & Guru' && p.kategori === 'Seragam') ||
      (selectedKategori === 'Dokumen Cetak & Sertifikat' && p.kategori === 'Dokumen Cetak');
    const normalizedStep = normalizePermintaanStep(p.status);
    const matchStatus = selectedStatus === 'ALL' || normalizedStep === selectedStatus || p.status === selectedStatus;
    return matchSearch && matchKategori && matchStatus;
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

  const handleOpenAdd = () => {
    setEditingPermintaan(null);
    setFormMitraId(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
    setFormKategori(kategoriOptions[0] || 'Seragam Siswa & Guru');
    setFormItem('');
    setFormJumlah(50);
    setFormSpesifikasi('');
    setFormCatatan('');
    setFormLampiran([]);
    setUploadError(null);
    setIsManagingCategories(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PermintaanMitra) => {
    setEditingPermintaan(p);
    setFormMitraId(p.mitraId);
    setFormKategori(p.kategori);
    setFormItem(p.namaItem || p.itemDetail || '');
    setFormJumlah(p.jumlah);
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

  const handleSavePermintaan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSchool = sekolahList.find(s => s.id === formMitraId);
    const today = new Date().toISOString().split('T')[0];

    if (editingPermintaan) {
      await updatePermintaan({
        ...editingPermintaan,
        mitraId: formMitraId,
        namaSekolah: targetSchool ? targetSchool.namaSekolah : editingPermintaan.namaSekolah,
        kategori: formKategori,
        namaItem: formItem,
        jumlah: Number(formJumlah),
        spesifikasi: formSpesifikasi,
        catatan: formCatatan,
        lampiranDokumen: formLampiran,
      });
    } else {
      await addPermintaan({
        mitraId: formMitraId,
        namaSekolah: targetSchool ? targetSchool.namaSekolah : (currentUser?.nama || 'Sekolah Mitra'),
        kategori: formKategori,
        namaItem: formItem,
        jumlah: Number(formJumlah),
        spesifikasi: formSpesifikasi,
        status: 'Pengajuan',
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

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalItem) return;

    await updatePermintaanStatus(
      updateModalItem.id,
      newStatus,
      newResi || updateModalItem.noResi,
      newCatatan || updateModalItem.catatanAdmin
    );

    setUpdateModalItem(null);
  };

  const handleQuickStepChange = async (item: PermintaanMitra, targetStep: PermintaanStatus) => {
    if (!isAdmin) return;
    await updatePermintaanStatus(item.id, targetStep, item.noResi, item.catatanAdmin);
  };

  const getStatusBadge = (status: PermintaanStatus) => {
    const normalized = normalizePermintaanStep(status);
    switch (normalized) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} /> 7/7 • Selesai
          </span>
        );
      case 'Pengiriman':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
            <Truck size={12} /> 6/7 • Pengiriman
          </span>
        );
      case 'Biaya Kirim':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <Truck size={12} /> 5/7 • Biaya Kirim
          </span>
        );
      case 'Pelunasan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Clock size={12} /> 4/7 • Pelunasan
          </span>
        );
      case 'Proses':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> 3/7 • Proses
          </span>
        );
      case 'DP':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={12} /> 2/7 • DP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Clock size={12} /> 1/7 • Pengajuan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package size={22} className="text-blue-600" />
            <span>Permintaan Logistik Mitra</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengadaan kebutuhan sekolah mitra dengan lampiran dokumen (PDF/Word) dan pelacakan tahapan progres step-by-step
          </p>
        </div>

        <button
          id="btn-tambah-permintaan"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Ajukan Permintaan Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-permintaan"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari item, sekolah, no permintaan..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          id="filter-kategori-permintaan"
          value={selectedKategori}
          onChange={(e) => setSelectedKategori(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Tahapan Progres</option>
          {PERMINTAAN_PROGRESS_STEPS.map((step, i) => (
            <option key={step.id} value={step.id}>
              Tahap {i + 1}: {step.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Belum ada permohonan logistik.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const currentStepIdx = getStepIndex(item.status);
            const itemName = item.namaItem || item.itemDetail || 'Permintaan Mitra';
            const lampiranList = item.lampiranDokumen || [];

            return (
              <div 
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition flex flex-col justify-between space-y-4"
              >
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.kategori.toLowerCase().includes('seragam')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.kategori.toLowerCase().includes('seragam') ? <Shirt size={20} /> : <FileSpreadsheet size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{itemName}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {item.kategori}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-bold text-blue-600">{item.namaSekolah}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">#{item.id}</span>
                        <span>•</span>
                        <span>Diajukan: {item.tanggalPengajuan}</span>
                      </div>
                    </div>
                  </div>
                  <div className="self-start">{getStatusBadge(item.status)}</div>
                </div>

                {/* STEP-BY-STEP PROGRESS TRACKER (7 TAHAPAN) */}
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Tahapan Progres Permintaan (Step {currentStepIdx + 1} dari {PERMINTAAN_PROGRESS_STEPS.length})
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-semibold text-blue-600">
                        Klik tahapan di bawah untuk mengubah progres secara langsung
                      </span>
                    )}
                  </div>

                  {/* Stepper Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                    {PERMINTAAN_PROGRESS_STEPS.map((step, idx) => {
                      const isCompleted = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      const isLastCompleted = idx === PERMINTAAN_PROGRESS_STEPS.length - 1 && isCurrent;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleQuickStepChange(item, step.id)}
                          title={isAdmin ? `Ubah ke tahap: ${step.label} (${step.shortDesc})` : step.shortDesc}
                          className={`group relative flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                            isCurrent
                              ? isLastCompleted
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : isCompleted
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                              isCurrent
                                ? 'bg-white text-blue-700'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isCompleted || isLastCompleted ? <Check size={11} /> : idx + 1}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/20 text-white">
                                Aktif
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-extrabold leading-tight ${
                            isCurrent ? 'text-white' : isCompleted ? 'text-emerald-900' : 'text-slate-700'
                          }`}>
                            {step.label}
                          </span>
                          <span className={`text-[10px] mt-0.5 line-clamp-1 ${
                            isCurrent ? 'text-blue-100' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                          }`}>
                            {step.shortDesc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details & Attachments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Jumlah Dipesan:</span>
                      <span className="font-bold text-slate-900">{item.jumlah} Unit / Paket</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Spesifikasi / Ukuran:</span>
                      <span className="font-semibold text-slate-800">{item.spesifikasi || '-'}</span>
                    </div>
                    {item.catatan && (
                      <div className="pt-1.5 border-t border-slate-200/60 text-slate-600">
                        <span className="font-semibold text-slate-700">Catatan Pengajuan: </span>
                        {item.catatan}
                      </div>
                    )}
                    {item.catatanAdmin && (
                      <div className="pt-1.5 border-t border-slate-200/60 text-blue-800">
                        <span className="font-semibold">Catatan Admin: </span>
                        {item.catatanAdmin}
                      </div>
                    )}
                    {item.noResi && (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-blue-900">
                        <Truck size={14} className="text-blue-600 shrink-0" />
                        <span className="font-bold">No. Resi:</span>
                        <span className="font-mono font-bold">{item.noResi}</span>
                      </div>
                    )}
                  </div>

                  {/* Lampiran Dokumen (PDF / DOCS) */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Paperclip size={13} className="text-blue-600" />
                          <span>Lampiran Dokumen (PDF / Word)</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {lampiranList.length} File
                        </span>
                      </div>

                      {lampiranList.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-2">
                          Tidak ada dokumen PDF / Word yang dilampirkan.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {lampiranList.map((docItem, idx) => (
                            <div
                              key={`${docItem.namaFile}-${idx}`}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={15} className="text-blue-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-slate-800 block truncate text-[11px]" title={docItem.namaFile}>
                                    {docItem.namaFile}
                                  </span>
                                  {docItem.ukuranFile && (
                                    <span className="text-[10px] text-slate-400">
                                      {formatFileSize(docItem.ukuranFile)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <a
                                href={docItem.dataUrl}
                                download={docItem.namaFile}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] shrink-0 transition"
                                title="Unduh Dokumen"
                              >
                                <Download size={12} />
                                <span>Unduh</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {isAdmin && currentStepIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickStepChange(item, PERMINTAAN_PROGRESS_STEPS[currentStepIdx - 1].id)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={13} />
                        <span>Tahap Sebelumnya</span>
                      </button>
                    )}
                    {isAdmin && currentStepIdx < PERMINTAAN_PROGRESS_STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleQuickStepChange(item, PERMINTAAN_PROGRESS_STEPS[currentStepIdx + 1].id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Lanjut ke: {PERMINTAAN_PROGRESS_STEPS[currentStepIdx + 1].label}</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                      title="Edit permintaan & lampiran"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, itemName, item.namaSekolah)}
                      className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="Hapus permintaan"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUpdateModalItem(item);
                          setNewStatus(normalizePermintaanStep(item.status));
                          setNewResi(item.noResi || '');
                          setNewCatatan(item.catatanAdmin || item.catatan || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                      >
                        Kelola Progres & Resi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Ajukan / Edit Permintaan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {editingPermintaan ? 'Edit Permintaan Logistik' : 'Form Pengajuan Permintaan Mitra'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lengkapi rincian kebutuhan dan lampirkan dokumen pendukung (PDF / Word)
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermintaan} className="space-y-4 mt-4 text-xs">
              {isAdmin && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sekolah Pemohon</label>
                  <select
                    value={formMitraId}
                    onChange={(e) => setFormMitraId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {sekolahList.filter(s => !s.isDemo && s.id !== 'DEMO-MITRA').map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Kategori Kebutuhan + Admin Tambah/Edit Kategori */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Kategori Kebutuhan</label>
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

                {/* Panel Admin: Tambah & Edit Daftar Kategori Kebutuhan */}
                {isAdmin && isManagingCategories && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-blue-950 flex items-center gap-1.5">
                        <FolderPlus size={14} className="text-blue-600" />
                        <span>Kelola Opsi Kategori Kebutuhan (Khusus Admin)</span>
                      </span>
                    </div>

                    {/* Input tambah kategori baru */}
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

                    {/* Daftar kategori yang ada (bisa diedit / dihapus) */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
                                title="Simpan nama kategori"
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
                                  title="Edit nama kategori"
                                >
                                  <Edit3 size={13} />
                                </button>
                                {kategoriOptions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKategori(idx)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                    title="Hapus kategori"
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
                <label className="block font-bold text-slate-700 mb-1">Nama Item Yang Diminta</label>
                <input
                  type="text"
                  required
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  placeholder="Misal: Batik Siswa Lazuardi Biru, Buku Raport..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah (Pcs / Buku)</label>
                  <input
                    type="number"
                    required
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rincian Ukuran / Varian</label>
                  <input
                    type="text"
                    required
                    value={formSpesifikasi}
                    onChange={(e) => setFormSpesifikasi(e.target.value)}
                    placeholder="S: 15, M: 20, L: 15"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Lampiran Dokumen (PDF atau DOC/DOCX) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800">
                      Lampiran Dokumen (PDF / Word .doc .docx)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Unggah surat pengajuan, daftar ukuran, atau dokumen pendukung lainnya
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Upload size={13} />
                    <span>Pilih File PDF/Doc</span>
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
                  <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
                    {uploadError}
                  </p>
                )}

                {formLampiran.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {formLampiran.map((docItem, idx) => (
                      <div
                        key={`${docItem.namaFile}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={15} className="text-blue-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 block truncate text-[11px]">
                              {docItem.namaFile}
                            </span>
                            {docItem.ukuranFile && (
                              <span className="text-[10px] text-slate-400">
                                {formatFileSize(docItem.ukuranFile)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLampiran(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0"
                          title="Hapus lampiran"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition bg-white/60"
                  >
                    <Paperclip size={18} className="mx-auto text-slate-400 mb-1" />
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Klik untuk melampirkan file dokumen (.pdf, .doc, .docx)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Alamat kirim spesifik atau tanggal dibutuhkan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {editingPermintaan ? 'Simpan Pembaruan' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Tahapan Progres Step-by-Step & Resi (Admin) */}
      {updateModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Perbarui Tahapan Progres Permintaan
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih tahapan step-by-step untuk {updateModalItem.namaSekolah}
                </p>
              </div>
              <button onClick={() => setUpdateModalItem(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Pilih Tahapan Progres (7 Step)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERMINTAAN_PROGRESS_STEPS.map((step, idx) => {
                    const isSelected = normalizePermintaanStep(newStatus) === step.id;
                    return (
                      <button
                        type="button"
                        key={step.id}
                        onClick={() => setNewStatus(step.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                          isSelected ? 'bg-white text-blue-700' : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold block text-xs">{step.label}</span>
                          <span className={`text-[10px] block truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {step.shortDesc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Resi / Info Pengiriman (Opsional)</label>
                <input
                  type="text"
                  value={newResi}
                  onChange={(e) => setNewResi(e.target.value)}
                  placeholder="JNE / J&T / Lazuardi Courier / Info Ongkir..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Progres Admin</label>
                <textarea
                  rows={2}
                  value={newCatatan}
                  onChange={(e) => setNewCatatan(e.target.value)}
                  placeholder="Catatan DP, pelunasan, biaya kirim, atau pengiriman..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdateModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Simpan Tahapan
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
        message="Apakah Anda yakin ingin menghapus permintaan logistik ini dari Firestore? Data yang dihapus tidak dapat dipulihkan."
        itemName={deleteTarget ? `${deleteTarget.namaSekolah} - ${deleteTarget.namaItem}` : ''}
        confirmLabel="Hapus Permintaan"
      />
    </div>
  );
};
