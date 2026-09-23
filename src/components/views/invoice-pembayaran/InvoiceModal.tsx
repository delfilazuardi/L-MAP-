import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceOperationalStatus, SekolahMitra } from '../../../types';
import { RuangKategoriId, formatRupiah } from './types';
import { generateNomorInvoiceBaru, NAMA_BULAN_LIST } from '../../../lib/invoiceUtils';
import { NominalInput } from './NominalInput';

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
        jatuhTempo: editingInvoice?.jatuhTempo || '',
        nominal: Number(tagihanRealisasi),
        tagihanFull: Number(tagihanFull),
        tagihanRealisasi: Number(tagihanRealisasi),
        nominalPembayaran: Number(nominalPembayaran),
        statusInvoice,
        status: finalStatus,
        keterangan,
        createdAt: editingInvoice?.createdAt || new Date().toISOString(),
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

          {/* Tanggal Kirim Invoice */}
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

          {/* Perincian Nilai Tagihan & Pembayaran */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Perincian Nilai Tagihan
                </span>
                <span className="text-[11px] text-slate-500">
                  Format nominal otomatis (bisa ketik angka langsung atau akhiran 'jt' / 'rb')
                </span>
              </div>
            </div>

            {/* 3 Input Nominal Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Tagihan Full */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <NominalInput
                  label="1. Tagihan Full"
                  required
                  value={tagihanFull}
                  onChange={(val) => setTagihanFull(val)}
                  inputClassName="border-slate-300 text-slate-800"
                />
              </div>

              {/* 2. Tagihan Realisasi */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 shadow-2xs">
                <NominalInput
                  label="2. Tagihan Realisasi"
                  required
                  value={tagihanRealisasi}
                  onChange={(val) => setTagihanRealisasi(val)}
                  inputClassName="border-blue-400 text-blue-800"
                  helperAction={
                    <button
                      type="button"
                      onClick={() => setTagihanRealisasi(tagihanFull)}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                      title="Salin nominal dari Tagihan Full"
                    >
                      ⚡ Samakan Full
                    </button>
                  }
                />
              </div>

              {/* 3. Nominal Telah Bayar */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 shadow-2xs">
                <NominalInput
                  label="3. Nominal Telah Bayar"
                  value={nominalPembayaran}
                  onChange={(val) => setNominalPembayaran(val)}
                  inputClassName="border-emerald-400 text-emerald-800"
                  helperAction={
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setNominalPembayaran(tagihanRealisasi)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                        title="Set lunas 100%"
                      >
                        ⚡ Lunas
                      </button>
                      <button
                        type="button"
                        onClick={() => setNominalPembayaran(0)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                        title="Set Rp 0"
                      >
                        Rp 0
                      </button>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Sisa Hutang / Piutang (Posisi di Bawah) */}
            <div className={`p-3.5 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              tagihanRealisasi - nominalPembayaran > 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Sisa Hutang (Kewajiban Berjalan)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tagihanRealisasi - nominalPembayaran > 0
                      ? 'bg-rose-200 text-rose-800'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {tagihanRealisasi - nominalPembayaran > 0 ? 'Belum Lunas' : '✓ Lunas 100%'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Dihitung otomatis: Tagihan Realisasi ({formatRupiah(tagihanRealisasi)}) − Telah Bayar ({formatRupiah(nominalPembayaran)})
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className={`font-mono text-lg sm:text-xl font-black tracking-tight ${
                  tagihanRealisasi - nominalPembayaran > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {formatRupiah(Math.max(0, tagihanRealisasi - nominalPembayaran))}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {tagihanRealisasi - nominalPembayaran > 0 ? 'Wajib dilunasi sekolah mitra' : 'Tidak ada tunggakan'}
                </span>
              </div>
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
