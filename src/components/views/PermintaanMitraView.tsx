import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  X, 
  Building,
  Shirt,
  FileSpreadsheet,
  Send,
  Edit3,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PermintaanMitra, PermintaanKategori, PermintaanStatus } from '../../types';

export const PermintaanMitraView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { permintaanList, sekolahList, addPermintaan, updatePermintaan, deletePermintaan, updatePermintaanStatus } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermintaan, setEditingPermintaan] = useState<PermintaanMitra | null>(null);
  const [updateModalItem, setUpdateModalItem] = useState<PermintaanMitra | null>(null);

  // Form State
  const [formMitraId, setFormMitraId] = useState(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
  const [formKategori, setFormKategori] = useState<PermintaanKategori>('Seragam');
  const [formItem, setFormItem] = useState('');
  const [formJumlah, setFormJumlah] = useState<number>(50);
  const [formSpesifikasi, setFormSpesifikasi] = useState('');
  const [formCatatan, setFormCatatan] = useState('');

  // Status update modal state
  const [newStatus, setNewStatus] = useState<PermintaanStatus>('Diproses');
  const [newResi, setNewResi] = useState('');
  const [newCatatan, setNewCatatan] = useState('');

  const baseList = isAdmin 
    ? permintaanList 
    : permintaanList.filter(p => p.mitraId === currentUser?.sekolahId);

  const filtered = baseList.filter(p => {
    const matchSearch = p.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namaItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = selectedKategori === 'ALL' || p.kategori === selectedKategori;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchSearch && matchKategori && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingPermintaan(null);
    setFormMitraId(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
    setFormKategori('Seragam');
    setFormItem('');
    setFormJumlah(50);
    setFormSpesifikasi('');
    setFormCatatan('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PermintaanMitra) => {
    setEditingPermintaan(p);
    setFormMitraId(p.mitraId);
    setFormKategori(p.kategori);
    setFormItem(p.namaItem);
    setFormJumlah(p.jumlah);
    setFormSpesifikasi(p.spesifikasi);
    setFormCatatan(p.catatan || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, namaItem: string) => {
    if (window.confirm(`Hapus permintaan "${namaItem}"?`)) {
      await deletePermintaan(id);
    }
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
      });
    } else {
      await addPermintaan({
        mitraId: formMitraId,
        namaSekolah: targetSchool ? targetSchool.namaSekolah : (currentUser?.nama || 'Sekolah Mitra'),
        kategori: formKategori,
        namaItem: formItem,
        jumlah: Number(formJumlah),
        spesifikasi: formSpesifikasi,
        tanggalPengajuan: today,
        status: 'Diajukan',
        catatan: formCatatan,
      });
    }

    setIsModalOpen(false);
    setFormItem('');
    setFormSpesifikasi('');
    setFormCatatan('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalItem) return;

    await updatePermintaanStatus(
      updateModalItem.id,
      newStatus,
      newResi || updateModalItem.noResi,
      newCatatan || updateModalItem.catatan
    );

    setUpdateModalItem(null);
  };

  const getStatusBadge = (status: PermintaanStatus) => {
    switch (status) {
      case 'Selesai':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800"><CheckCircle2 size={12} /> Selesai</span>;
      case 'Dikirim':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800"><Truck size={12} /> Sedang Dikirim</span>;
      case 'Diproses':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800"><Clock size={12} /> Diproses Kantor</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"><Clock size={12} /> Diajukan</span>;
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
            Pengadaan seragam resmi Lazuardi dan pencetakan dokumen administratif terstandar
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
          <option value="ALL">Semua Kategori (Seragam & Cetak)</option>
          <option value="Seragam">Seragam Siswa & Guru</option>
          <option value="Dokumen Cetak">Dokumen Cetak & Sertifikat</option>
        </select>

        <select
          id="filter-status-permintaan"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Status Pengiriman</option>
          <option value="Diajukan">Diajukan</option>
          <option value="Diproses">Diproses</option>
          <option value="Dikirim">Dikirim</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Belum ada permohonan logistik.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div 
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      item.kategori === 'Seragam' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.kategori === 'Seragam' ? <Shirt size={18} /> : <FileSpreadsheet size={18} />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.namaItem}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-600">{item.namaSekolah}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">#{item.id}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Jumlah Dipesan:</span>
                    <span className="font-bold text-slate-900">{item.jumlah} Unit / Paket</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Spesifikasi / Ukuran:</span>
                    <span className="font-semibold text-slate-800">{item.spesifikasi}</span>
                  </div>
                  {item.catatan && (
                    <div className="pt-1 border-t border-slate-200/60 text-slate-600">
                      <span className="font-semibold">Catatan: </span>
                      {item.catatan}
                    </div>
                  )}
                </div>

                {item.noResi && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs flex items-center gap-2 text-blue-900 mb-3">
                    <Truck size={16} className="text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold">No. Resi Pengiriman: </span>
                      <span className="font-mono font-bold tracking-wider">{item.noResi}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-400 text-[11px]">Diajukan: {item.tanggalPengajuan}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                    title="Edit permintaan"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.namaItem)}
                    className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                    title="Hapus permintaan"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setUpdateModalItem(item);
                        setNewStatus(item.status);
                        setNewResi(item.noResi || '');
                        setNewCatatan(item.catatan || '');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
                    >
                      Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Ajukan / Edit Permintaan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPermintaan ? 'Edit Permintaan Logistik' : 'Form Pengajuan Permintaan Mitra'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePermintaan} className="space-y-3 mt-4 text-xs">
              {isAdmin && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sekolah Pemohon</label>
                  <select
                    value={formMitraId}
                    onChange={(e) => setFormMitraId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {sekolahList.map(s => (
                      <option key={s.id} value={s.id}>{s.namaSekolah}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Kebutuhan</label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as PermintaanKategori)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Seragam">Seragam Siswa & Guru</option>
                  <option value="Dokumen Cetak">Dokumen Cetak & Sertifikat</option>
                </select>
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
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  {editingPermintaan ? 'Simpan Pembaruan' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Status Resi (Admin) */}
      {updateModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Perbarui Status Pengiriman</h3>
              <button onClick={() => setUpdateModalItem(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Progres</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PermintaanStatus)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Diajukan">Diajukan</option>
                  <option value="Diproses">Diproses (Gudang)</option>
                  <option value="Dikirim">Dikirim (Ekspedisi)</option>
                  <option value="Selesai">Selesai Diterima</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Resi Pengiriman</label>
                <input
                  type="text"
                  value={newResi}
                  onChange={(e) => setNewResi(e.target.value)}
                  placeholder="JNE / J&T / Lazuardi Courier..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Admin</label>
                <textarea
                  rows={2}
                  value={newCatatan}
                  onChange={(e) => setNewCatatan(e.target.value)}
                  placeholder="Koli dikirim dalam 2 dus..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdateModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
