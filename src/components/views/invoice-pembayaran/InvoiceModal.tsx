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
  const [isBayarChecked, setIsBayarChecked] = useState(false);
  const [tanggalDibayar, setTanggalDibayar] = useState(new Date().toISOString().split('T')[0]);
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
      const hasPaid = (editingInvoice.nominalPembayaran || 0) > 0 || editingInvoice.status === 'Lunas' || editingInvoice.status === 'Sebagian';
      setIsBayarChecked(hasPaid);
      setTanggalDibayar(editingInvoice.tanggalDibayar || new Date().toISOString().split('T')[0]);
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
      setIsBayarChecked(false);
      setTanggalDibayar(today.toISOString().split('T')[0]);
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

    const effectivePaid = isBayarChecked ? Number(nominalPembayaran) : 0;

    // Auto calculate status based on Ceklis Bayar & Nominal Bayar
    let finalStatus: InvoiceStatus = 'Belum Bayar';
    if (isBayarChecked && effectivePaid >= tagihanRealisasi && tagihanRealisasi > 0) {
      finalStatus = 'Lunas';
    } else if (isBayarChecked && effectivePaid > 0 && effectivePaid < tagihanRealisasi) {
      finalStatus = 'Sebagian';
    } else {
      finalStatus = 'Belum Bayar';
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
        tanggalDibayar: isBayarChecked ? tanggalDibayar : undefined,
        jatuhTempo: editingInvoice?.jatuhTempo || '',
        nominal: Number(tagihanRealisasi),
        tagihanFull: Number(tagihanFull),
        tagihanRealisasi: Number(tagihanRealisasi),
        nominalPembayaran: effectivePaid,
        statusInvoice,
        status: finalStatus,
        keterangan,
        createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
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

          {/* Perincian Nilai Tagihan & Opsi Ceklis Bayar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Perincian Nominal Tagihan & Pembayaran
                </span>
                <span className="text-[11px] text-slate-500">
                  Isi nominal tagihan & realisasi, lalu ceklis opsi bayar jika sudah ada pembayaran
                </span>
              </div>
            </div>

            {/* 2 Input Nominal Tagihan & Nominal Realisasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Nominal Tagihan */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <NominalInput
                  label="1. Nominal Tagihan"
                  required
                  value={tagihanFull}
                  onChange={(val) => setTagihanFull(val)}
                  inputClassName="border-slate-300 text-slate-800"
                />
              </div>

              {/* 2. Nominal Realisasi */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 shadow-2xs">
                <NominalInput
                  label="2. Nominal Realisasi"
                  required
                  value={tagihanRealisasi}
                  onChange={(val) => setTagihanRealisasi(val)}
                  inputClassName="border-blue-400 text-blue-800"
                  helperAction={
                    <button
                      type="button"
                      onClick={() => setTagihanRealisasi(tagihanFull)}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                      title="Salin nominal dari Nominal Tagihan"
                    >
                      ⚡ Samakan Tagihan
                    </button>
                  }
                />
              </div>
            </div>

            {/* Opsi / Ceklis Bayar */}
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              isBayarChecked
                ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}>
              <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isBayarChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsBayarChecked(checked);
                      if (checked && nominalPembayaran === 0) {
                        setNominalPembayaran(tagihanRealisasi);
                      } else if (!checked) {
                        setNominalPembayaran(0);
                      }
                    }}
                    className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <div>
                    <span className="text-sm font-black text-slate-900 block">
                      Ceklis Sudah Bayar / Input Pembayaran
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Centang untuk membuka form Tanggal Pembayaran & Nominal Bayar (tanpa perlu verifikasi)
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                  isBayarChecked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isBayarChecked ? '✓ Sudah Bayar' : 'Belum Dicentang'}
                </span>
              </label>

              {/* Form Pembayaran yang terbuka saat Ceklis Bayar aktif */}
              {isBayarChecked && (
                <div className="mt-4 pt-4 border-t border-emerald-200/80 space-y-3.5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Tanggal Pembayaran */}
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        3. Tanggal Pembayaran
                      </label>
                      <input
                        type="date"
                        required={isBayarChecked}
                        value={tanggalDibayar}
                        onChange={(e) => setTanggalDibayar(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Nominal Bayar */}
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                      <NominalInput
                        label="4. Nominal Bayar"
                        required={isBayarChecked}
                        value={nominalPembayaran}
                        onChange={(val) => setNominalPembayaran(val)}
                        inputClassName="border-emerald-400 text-emerald-800"
                        helperAction={
                          <button
                            type="button"
                            onClick={() => setNominalPembayaran(tagihanRealisasi)}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                            title="Sesuaikan penuh dengan Nominal Realisasi"
                          >
                            ⚡ Sesuai Realisasi
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sisa Tagihan (Otomatis: Tagihan Full − Pembayaran) */}
            <div className={`p-3.5 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              tagihanFull - (isBayarChecked ? nominalPembayaran : 0) > 0
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    Nominal Piutang (Sisa Piutang)
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tagihanFull - (isBayarChecked ? nominalPembayaran : 0) > 0
                      ? 'bg-rose-200 text-rose-800'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {tagihanFull - (isBayarChecked ? nominalPembayaran : 0) > 0 ? 'Ada Piutang' : '✓ Lunas'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Tagihan Full ({formatRupiah(tagihanFull)}) − Pembayaran ({formatRupiah(isBayarChecked ? nominalPembayaran : 0)})
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className={`font-mono text-lg sm:text-xl font-black tracking-tight ${
                  tagihanFull - (isBayarChecked ? nominalPembayaran : 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {formatRupiah(Math.max(0, tagihanFull - (isBayarChecked ? nominalPembayaran : 0)))}
                </div>
              </div>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Uraian Tagihan (Opsional)
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
