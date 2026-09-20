import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building } from 'lucide-react';
import { Pembayaran, PembayaranKategori, PembayaranStatus, Invoice, SekolahMitra } from '../../../types';
import { RuangKategoriId } from './types';

interface PembayaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPembayaran: Pembayaran | null;
  defaultKategori: RuangKategoriId;
  defaultInvoiceId?: string;
  sekolahList: SekolahMitra[];
  invoiceList: Invoice[];
  currentSekolahId?: string;
  isAdmin: boolean;
  onSave: (paymentData: Partial<Pembayaran>) => Promise<void>;
}

export const PembayaranModal: React.FC<PembayaranModalProps> = ({
  isOpen,
  onClose,
  editingPembayaran,
  defaultKategori,
  defaultInvoiceId,
  sekolahList,
  invoiceList,
  currentSekolahId,
  isAdmin,
  onSave,
}) => {
  const [mitraId, setMitraId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [kategori, setKategori] = useState<RuangKategoriId>(defaultKategori);
  const [jumlah, setJumlah] = useState(45000000);
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split('T')[0]);
  const [metodeBayar, setMetodeBayar] = useState('Bank Mandiri Transfer');
  const [noReferensi, setNoReferensi] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingPembayaran) {
      setMitraId(editingPembayaran.mitraId);
      setInvoiceId(editingPembayaran.invoiceId || '');
      setKategori((editingPembayaran.kategori as RuangKategoriId) || defaultKategori);
      setJumlah(editingPembayaran.jumlah);
      setTanggalBayar(editingPembayaran.tanggalBayar);
      setMetodeBayar(editingPembayaran.metodeBayar);
      setNoReferensi(editingPembayaran.noReferensi);
      setBuktiUrl(editingPembayaran.buktiUrl || '');
      setCatatan(editingPembayaran.catatan || '');
    } else {
      setMitraId(currentSekolahId || sekolahList[0]?.id || 'MO004');
      setInvoiceId(defaultInvoiceId || '');
      setKategori(defaultKategori);
      setTanggalBayar(new Date().toISOString().split('T')[0]);
      setMetodeBayar('Bank Mandiri Transfer');
      setNoReferensi(`TRF-${Date.now().toString().slice(-6)}`);
      setBuktiUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60');
      setCatatan(`Setoran ${defaultKategori}`);

      // If default invoice provided, sync amount
      if (defaultInvoiceId) {
        const foundInv = invoiceList.find(i => i.id === defaultInvoiceId || i.nomorInvoice === defaultInvoiceId);
        if (foundInv) {
          const sisa = Math.max(0, (foundInv.tagihanRealisasi || foundInv.nominal || 0) - (foundInv.nominalPembayaran || 0));
          setJumlah(sisa > 0 ? sisa : (foundInv.tagihanRealisasi || foundInv.nominal || 45000000));
          setMitraId(foundInv.mitraId);
        }
      } else {
        const defaultNom = defaultKategori === 'Franchise Fee' ? 75000000 :
                           defaultKategori === 'Renewal Fee' ? 45000000 :
                           defaultKategori === 'Jenjang Baru' ? 35000000 : 15000000;
        setJumlah(defaultNom);
      }
    }
  }, [isOpen, editingPembayaran, defaultKategori, defaultInvoiceId, currentSekolahId]);

  if (!isOpen) return null;

  // Filter invoices for selected school
  const relevantInvoices = invoiceList.filter(i => i.mitraId === mitraId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const school = sekolahList.find(s => s.id === mitraId);
    const namaSekolah = school ? school.namaSekolah : 'Sekolah Mitra';

    try {
      await onSave({
        id: editingPembayaran ? editingPembayaran.id : `PAY-${Date.now()}`,
        invoiceId: invoiceId || undefined,
        mitraId,
        namaSekolah,
        kategori,
        jumlah: Number(jumlah),
        tanggalBayar,
        metodeBayar,
        noReferensi,
        buktiUrl,
        status: editingPembayaran ? editingPembayaran.status : 'Menunggu Verifikasi',
        catatan,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {editingPembayaran ? 'Edit Catatan Pembayaran' : `Catat Setoran: ${kategori}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input bukti setoran pembayaran sekolah mitra
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kategori Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Ruang / Kategori Pembayaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Franchise Fee', 'Piutang Lampau', 'Renewal Fee', 'Jenjang Baru'] as RuangKategoriId[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setKategori(cat)}
                  className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    kategori === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sekolah Mitra & Tautan Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sekolah Mitra Penyetor
              </label>
              <select
                disabled={!isAdmin && !!currentSekolahId}
                value={mitraId}
                onChange={(e) => setMitraId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                {sekolahList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tautkan ke Invoice (Opsional)
              </label>
              <select
                value={invoiceId}
                onChange={(e) => {
                  setInvoiceId(e.target.value);
                  const selected = invoiceList.find(i => i.id === e.target.value || i.nomorInvoice === e.target.value);
                  if (selected) {
                    const sisa = Math.max(0, (selected.tagihanRealisasi || selected.nominal || 0) - (selected.nominalPembayaran || 0));
                    if (sisa > 0) setJumlah(sisa);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Tanpa Tautan Invoice --</option>
                {relevantInvoices.map((inv) => (
                  <option key={inv.id} value={inv.nomorInvoice || inv.id}>
                    {inv.nomorInvoice || inv.id} ({inv.bulan || '-'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nominal Setoran & Tanggal Bayar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Setoran (Rp)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={jumlah}
                onChange={(e) => setJumlah(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                required
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Metode & No Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={metodeBayar}
                onChange={(e) => setMetodeBayar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="Bank Mandiri Transfer">Bank Mandiri Transfer</option>
                <option value="Bank BCA Transfer">Bank BCA Transfer</option>
                <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                <option value="Bank BNI Transfer">Bank BNI Transfer</option>
                <option value="Setoran Tunai Mitra Office">Setoran Tunai Mitra Office</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Referensi / No. Resi
              </label>
              <input
                type="text"
                required
                value={noReferensi}
                onChange={(e) => setNoReferensi(e.target.value)}
                placeholder="TRF-123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bukti Transfer URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Foto / Dokumen Bukti Transfer
            </label>
            <input
              type="url"
              value={buktiUrl}
              onChange={(e) => setBuktiUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Berita Transfer
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Misal: Pelunasan termin 1 Renewal Fee 2026/2027..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : editingPembayaran ? 'Simpan Perubahan' : 'Konfirmasi Setoran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
