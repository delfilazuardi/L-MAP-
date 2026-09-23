import React, { useState } from 'react';
import { 
  School, 
  Plus, 
  Search, 
  MapPin, 
  UserCheck, 
  Users, 
  Phone, 
  Mail, 
  Edit3, 
  X, 
  ExternalLink,
  GraduationCap,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SekolahMitra } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const DataMitraView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { sekolahList, addSekolah, updateSekolah, deleteSekolah } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSekolah, setEditingSekolah] = useState<SekolahMitra | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formKota, setFormKota] = useState('');
  const [formPimpinan, setFormPimpinan] = useState('');
  const [formSiswa, setFormSiswa] = useState<number>(100);
  const [formEmail, setFormEmail] = useState('');
  const [formTelepon, setFormTelepon] = useState('');
  const [formJenjang, setFormJenjang] = useState('TK & SD');
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Nonaktif' | 'Masa Perpanjangan'>('Aktif');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const baseList = isAdmin
    ? sekolahList
    : sekolahList.filter(s => s.id === currentUser?.sekolahId);

  const filtered = baseList.filter(s => {
    return s.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.alamat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pimpinan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenAdd = () => {
    setEditingSekolah(null);
    setFormId(`MO0${sekolahList.length + 4}`);
    setFormNama('');
    setFormAlamat('');
    setFormKota('');
    setFormPimpinan('');
    setFormSiswa(120);
    setFormEmail('');
    setFormTelepon('');
    setFormJenjang('SD & SMP');
    setFormStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SekolahMitra) => {
    setEditingSekolah(s);
    setFormId(s.id);
    setFormNama(s.namaSekolah);
    setFormAlamat(s.alamat);
    setFormKota(s.kota || '');
    setFormPimpinan(s.pimpinan);
    setFormSiswa(s.jumlahSiswa);
    setFormEmail(s.kontakEmail || s.email || '');
    setFormTelepon(s.kontakTelepon || s.kontak || '');
    setFormJenjang(s.jenjang);
    setFormStatus(s.statusKerjasama as any);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSekolah) {
        const updatedMitra: SekolahMitra = {
          ...editingSekolah,
          id: editingSekolah.id,
          kodeMitra: editingSekolah.kodeMitra || editingSekolah.id,
          namaSekolah: formNama.trim(),
          alamat: formAlamat.trim(),
          kota: formKota.trim() || editingSekolah.kota || '',
          pimpinan: formPimpinan.trim(),
          jumlahSiswa: Number(formSiswa) || 0,
          kontakEmail: formEmail.trim(),
          email: formEmail.trim(),
          kontakTelepon: formTelepon.trim(),
          kontak: formTelepon.trim(),
          jenjang: formJenjang.trim(),
          statusKerjasama: formStatus,
          tahunBergabung: editingSekolah.tahunBergabung || 2026,
        };
        await updateSekolah(updatedMitra);
        showToast(`Data sekolah "${formNama}" berhasil diperbarui.`);
      } else {
        const newMitra: SekolahMitra = {
          id: formId.trim() || `MO0${sekolahList.length + 5}`,
          kodeMitra: formId.trim() || `MO0${sekolahList.length + 5}`,
          namaSekolah: formNama.trim(),
          alamat: formAlamat.trim(),
          kota: formKota.trim() || '',
          pimpinan: formPimpinan.trim(),
          jumlahSiswa: Number(formSiswa) || 0,
          kontakEmail: formEmail.trim(),
          email: formEmail.trim(),
          kontakTelepon: formTelepon.trim(),
          kontak: formTelepon.trim(),
          jenjang: formJenjang.trim(),
          statusKerjasama: formStatus,
          tahunBergabung: new Date().getFullYear(),
        };
        await addSekolah(newMitra);
        showToast(`Sekolah mitra baru "${formNama}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast('Gagal menyimpan data mitra: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
    }
  };

  const handleDelete = (id: string, nama: string) => {
    setDeleteTarget({ id, nama });
  };

  const totalSiswa = sekolahList.reduce((acc, s) => acc + s.jumlahSiswa, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs transition animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <School size={22} className="text-blue-600" />
            <span>Direktori Data Mitra Sekolah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database profil resmi sekolah mitra, alamat domisili, pimpinan, dan populasi siswa aktif
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-tambah-mitra"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Tambah Sekolah Mitra</span>
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <School size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Sekolah Terdaftar</span>
            <div className="text-xl font-black text-slate-900">{sekolahList.length} Sekolah</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa Binaan</span>
            <div className="text-xl font-black text-slate-900">{totalSiswa.toLocaleString()} Murid</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Kemitraan Aktif</span>
            <div className="text-xl font-black text-emerald-700">100% Berlisensi</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search size={16} className="text-slate-400" />
        <input
          id="search-mitra-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama sekolah, kota/alamat, nama pimpinan, atau kode ID..."
          className="w-full text-xs text-slate-900 focus:outline-none bg-transparent"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div 
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {s.id}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Bergabung: {s.tahunBergabung}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                    {s.namaSekolah}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <p className="text-xs font-semibold text-blue-700">{s.jenjang}</p>
                    {s.kategoriSekolah && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        s.kategoriSekolah === 'Sekolah Afiliasi'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : s.kategoriSekolah === 'Khusus Pelaporan'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {s.kategoriSekolah}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {s.statusKerjasama}
                </span>
              </div>

              {s.keteranganKhusus && (
                <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <span className="font-bold">Catatan Kemitraan:</span> {s.keteranganKhusus}
                </div>
              )}

              {/* Data Rows */}
              <div className="space-y-2 text-xs text-slate-600 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{s.alamat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-slate-400 shrink-0" />
                  <span>Pimpinan: <strong className="text-slate-800">{s.pimpinan}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400 shrink-0" />
                  <span>Jumlah Siswa: <strong className="text-slate-900">{s.jumlahSiswa} Murid</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{s.kontakEmail || s.email || 'Email belum diatur'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>{s.kontakTelepon || s.kontak || 'Telepon belum diatur'}</span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 size={13} className="text-blue-600" />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.namaSekolah)}
                  className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Hapus data sekolah mitra"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL: Tambah/Edit Sekolah Mitra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSekolah ? 'Edit Profil Sekolah Mitra' : 'Tambah Sekolah Mitra Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Mitra</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSekolah}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="MO013"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Sekolah Mitra</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="SD Lazuardi..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  required
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Jl. ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kota / Wilayah</label>
                <input
                  type="text"
                  value={formKota}
                  onChange={(e) => setFormKota(e.target.value)}
                  placeholder="Contoh: Depok, Jakarta Selatan, dsb."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pimpinan</label>
                  <input
                    type="text"
                    required
                    value={formPimpinan}
                    onChange={(e) => setFormPimpinan(e.target.value)}
                    placeholder="Drs. ..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Siswa</label>
                  <input
                    type="number"
                    required
                    value={formSiswa}
                    onChange={(e) => setFormSiswa(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="info@..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    placeholder="0812-..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenjang Pendidikan</label>
                  <input
                    type="text"
                    required
                    value={formJenjang}
                    onChange={(e) => setFormJenjang(e.target.value)}
                    placeholder="KB, TK, SD, SMP, SMA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kerjasama</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Masa Perpanjangan">Masa Perpanjangan</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
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
                  {editingSekolah ? 'Simpan Pembaruan' : 'Tambahkan Mitra'}
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
            await deleteSekolah(deleteTarget.id);
            showToast(`Data sekolah "${deleteTarget.nama}" telah dihapus.`);
          }
        }}
        title="Hapus Sekolah Mitra"
        message="Apakah Anda yakin ingin menghapus profil sekolah mitra ini dari Firestore? Data yang dihapus tidak dapat dipulihkan."
        itemName={deleteTarget ? deleteTarget.nama : ''}
        confirmLabel="Hapus Sekolah"
      />
    </div>
  );
};
