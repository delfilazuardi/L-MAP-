import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceOperationalStatus, SekolahMitra } from '../../../types';
import { RuangKategoriId } from './types';
import { generateNomorInvoiceBaru, NAMA_BULAN_LIST } from '../../../lib/invoiceUtils';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice: Invoice | null;
  defaultKategori: RuangKategoriId;
  sekolahList: SekolahMitra[];
  existingInvoices: Invoice[];
  onSave: (invoiceData: Partial<Invoice>) => Promise<void>;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  editingInvoice,
  defaultKategori,
  sekolahList,
  existingInvoices,
  onSave,
}) => {
  const [nomorInvoice, setNomorInvoice] = useState('');
  const [mitraId, setMitraId] = useState('');
  const [kategori, setKategori] = useState<RuangKategoriId>(defaultKategori);
  const [bulan, setBulan] = useState('September');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split('T')[0]);
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [tagihanFull, setTagihanFull] = useState(45000000);
  const [tagihanRealisasi, setTagihanRealisasi] = useState(45000000);
  const [nominalPembayaran, setNominalPembayaran] = useState(0);
  const [statusInvoice, setStatusInvoice] = useState<InvoiceOperationalStatus>('Terkirim');
  const [status, setStatus] = useState<InvoiceStatus>('Belum Bayar');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingInvoice) {
      setNomorInvoice(editingInvoice.nomorInvoice || editingInvoice.id);
      setMitraId(editingInvoice.mitraId);
      setKategori((editingInvoice.kategori as RuangKategoriId) || defaultKategori);
      setBulan(editingInvoice.bulan || 'September');
      setTahunAjaran(editingInvoice.tahunAjaran || '2026/2027');
      setTanggalKirim(editingInvoice.tanggalKirim || new Date().toISOString().split('T')[0]);
      setJatuhTempo(editingInvoice.jatuhTempo || '');
      setTagihanFull(editingInvoice.tagihanFull || editingInvoice.nominal || 0);
      setTagihanRealisasi(editingInvoice.tagihanRealisasi || editingInvoice.nominal || 0);
      setNominalPembayaran(editingInvoice.nominalPembayaran || 0);
      setStatusInvoice(editingInvoice.statusInvoice || 'Terkirim');
      setStatus(editingInvoice.status || 'Belum Bayar');
      setKeterangan(editingInvoice.keterangan || '');
    } else {
      const generated = generateNomorInvoiceBaru(existingInvoices);
      setNomorInvoice(generated.nomorInvoice);
      setMitraId(sekolahList[0]?.id || 'MO004');
      setKategori(defaultKategori);
      setBulan('September');
      setTahunAjaran('2026/2027');
      const today = new Date();
      setTanggalKirim(today.toISOString().split('T')[0]);
      const tempo = new Date();
      tempo.setDate(tempo.getDate() + 30);
      setJatuhTempo(tempo.toISOString().split('T')[0]);

      // Set default nominal based on category
      const defaultNom = defaultKategori === 'Franchise Fee' ? 75000000 :
                         defaultKategori === 'Renewal Fee' ? 45000000 :
                         defaultKategori === 'Jenjang Baru' ? 35000000 : 15000000;
      setTagihanFull(defaultNom);
      setTagihanRealisasi(defaultNom);
      setNominalPembayaran(0);
      setStatusInvoice('Terkirim');
      setStatus('Belum Bayar');
      setKeterangan(`Biaya ${defaultKategori} Kemitraan Lazuardi`);
    }
  }, [isOpen, editingInvoice, defaultKategori]);

  if (!isOpen) return null;

  const handleGenerateNumber = () => {
    const gen = generateNomorInvoiceBaru(existingInvoices);
    setNomorInvoice(gen.nomorInvoice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const school = sekolahList.find(s => s.id === mitraId);
    const namaSekolah = school ? school.namaSekolah : 'Sekolah Mitra';

    // Auto calculate status if pembayaran covers realisasi
    let finalStatus: InvoiceStatus = status;
    if (nominalPembayaran >= tagihanRealisasi && tagihanRealisasi > 0) {
      finalStatus = 'Lunas';
    } else if (nominalPembayaran > 0 && nominalPembayaran < tagihanRealisasi) {
      finalStatus = 'Sebagian';
    }

    try {
      await onSave({
        id: editingInvoice ? editingInvoice.id : nomorInvoice,
        nomorInvoice,
        mitraId,
        namaSekolah,
        kategori,
        bulan,
        tahunAjaran,
        tanggalKirim,
        jatuhTempo,
        nominal: Number(tagihanRealisasi),
        tagihanFull: Number(tagihanFull),
        tagihanRealisasi: Number(tagihanRealisasi),
        nominalPembayaran: Number(nominalPembayaran),
        statusInvoice,
        status: finalStatus,
        keterangan,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {editingInvoice ? 'Edit Data Invoice' : `Buat Invoice Baru: ${kategori}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Penerbitan tagihan resmi untuk sekolah mitra Lazuardi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ruang / Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Item Ruang / Kategori Tagihan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Franchise Fee', 'Piutang Lampau', 'Renewal Fee', 'Jenjang Baru'] as RuangKategoriId[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setKategori(cat)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
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

          {/* Nomor Invoice & Sekolah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Invoice Resmi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={nomorInvoice}
                  onChange={(e) => setNomorInvoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!editingInvoice && (
                  <button
                    type="button"
                    onClick={handleGenerateNumber}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 cursor-pointer"
                    title="Generate Nomor Baru"
                  >
                    <Sparkles size={18} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sekolah Mitra Tujuan
              </label>
              <select
                value={mitraId}
                onChange={(e) => setMitraId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sekolahList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Periode Bulan & TA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bulan Penagihan
              </label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NAMA_BULAN_LIST.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Ajaran (TA)
              </label>
              <input
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2026/2027"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tanggal Kirim & Jatuh Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Kirim Invoice
              </label>
              <input
                type="date"
                required
                value={tanggalKirim}
                onChange={(e) => setTanggalKirim(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Jatuh Tempo
              </label>
              <input
                type="date"
                required
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 3 Nilai Finansial */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Perincian Nilai Tagihan & Pembayaran (Rp)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  1. Tagihan Full (Kotor)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={tagihanFull}
                  onChange={(e) => setTagihanFull(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-700 mb-1">
                  2. Tagihan Realisasi (Netto)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={tagihanRealisasi}
                  onChange={(e) => setTagihanRealisasi(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-blue-400 text-sm font-mono font-bold text-blue-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                  3. Nominal Telah Dibayar
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={nominalPembayaran}
                  onChange={(e) => setNominalPembayaran(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-400 text-sm font-mono font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-bold text-slate-700">
              <span>Sisa Piutang Berjalan:</span>
              <span className={`font-mono text-sm font-black ${
                tagihanRealisasi - nominalPembayaran > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
                  .format(Math.max(0, tagihanRealisasi - nominalPembayaran))}
              </span>
            </div>
          </div>

          {/* Status & Keterangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Pengiriman Dokumen
              </label>
              <select
                value={statusInvoice}
                onChange={(e) => setStatusInvoice(e.target.value as InvoiceOperationalStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
              >
                <option value="Terkirim">Terkirim</option>
                <option value="Draft">Draft</option>
                <option value="Revisi">Revisi</option>
                <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Pembayaran Invoice
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
              >
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Sebagian">Sebagian</option>
                <option value="Lunas">Lunas</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Uraian Tagihan
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Renewal Fee Lisensi Kurikulum MenDAKI Cabang..."
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : editingInvoice ? 'Simpan Perubahan' : 'Terbitkan Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
