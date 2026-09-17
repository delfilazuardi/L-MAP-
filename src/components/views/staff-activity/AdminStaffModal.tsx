import React, { useState, useEffect } from 'react';
import { X, UserCheck, Mail, Shield, Phone, CheckCircle2 } from 'lucide-react';
import { AdminMitraStaff } from '../../../types';

interface AdminStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<AdminMitraStaff, 'id'>, id?: string) => Promise<void>;
  initialData?: AdminMitraStaff | null;
}

export const AdminStaffModal: React.FC<AdminStaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Officer');
  const [telepon, setTelepon] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Cuti' | 'Nonaktif'>('Aktif');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama);
      setEmail(initialData.email);
      setRole(initialData.role);
      setTelepon(initialData.telepon || '');
      setStatus(initialData.status);
    } else {
      setNama('');
      setEmail('');
      setRole('Officer');
      setTelepon('');
      setStatus('Aktif');
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg('Nama Admin Mitra Office wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Format email resmi @lazuardi.sch.id wajib valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(
        {
          nama: nama.trim(),
          email: email.trim(),
          role: role.trim(),
          telepon: telepon.trim() || undefined,
          status,
        },
        initialData?.id
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data staf admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-200">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {initialData ? 'Edit Admin Mitra Office' : 'Tambah Admin Mitra Office'}
              </h3>
              <p className="text-[11px] text-blue-200/80">
                Pengelola administrasi, supervisi, dan penugasan L-MAP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Admin <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Delfi Dwi Hermawati"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Resmi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@lazuardi.sch.id"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Role / Jabatan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium appearance-none"
                >
                  <option value="Kepala Bagian Mitra Office">Kepala Bagian Mitra Office</option>
                  <option value="Officer">Officer</option>
                  <option value="Staf Administrasi & Keuangan">Staf Administrasi & Keuangan</option>
                  <option value="Koordinator Kurikulum & Inklusi">Koordinator Kurikulum & Inklusi</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Cuti' | 'Nonaktif')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="Aktif">Aktif</option>
                <option value="Cuti">Cuti</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nomor WhatsApp / Telepon <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                placeholder="+62 812-xxxx-xxxx"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>{initialData ? 'Perbarui Data' : 'Simpan Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
