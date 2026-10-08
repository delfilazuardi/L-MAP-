import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Pembayaran, Invoice, SekolahMitra, InvoiceStatus } from '../../../types';
import { RuangKategoriId, formatRupiah } from './types';
import { NominalInput } from './NominalInput';
import { getTahunAjaranFromDate, compareInvoiceBySequenceAsc } from '../../../lib/invoiceUtils';

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
  onSave: (paymentData: Partial<Pembayaran>, invoiceUpdates?: { invoiceId: string; tagihanFull: number; tagihanRealisasi: number; nominalPembayaran: number; tanggalDibayar: string }) => Promise<void>;
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
  const [isBayarChecked, setIsBayarChecked] = useState(true);
  const [nominalTagihan, setNominalTagihan] = useState(45000000);
  const [nominalRealisasi, setNominalRealisasi] = useState(45000000);
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split('T')[0]);
  const [jumlah, setJumlah] = useState(45000000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingPembayaran) {
      setMitraId(editingPembayaran.mitraId);
      setInvoiceId(editingPembayaran.invoiceId || '');
      setKategori((editingPembayaran.kategori as RuangKategoriId) || defaultKategori);
      setIsBayarChecked(true);
      setTanggalBayar(editingPembayaran.tanggalBayar || new Date().toISOString().split('T')[0]);
      setJumlah(editingPembayaran.jumlah);

      const linkedInv = editingPembayaran.invoiceId
        ? invoiceList.find(i => i.id === editingPembayaran.invoiceId || i.nomorInvoice === editingPembayaran.invoiceId)
        : null;
      if (linkedInv) {
        setNominalTagihan(linkedInv.tagihanFull || linkedInv.nominal || editingPembayaran.jumlah);
        setNominalRealisasi(linkedInv.tagihanRealisasi || linkedInv.nominal || editingPembayaran.jumlah);
      } else {
        setNominalTagihan(editingPembayaran.jumlah);
        setNominalRealisasi(editingPembayaran.jumlah);
      }
    } else {
      setMitraId(currentSekolahId || sekolahList[0]?.id || 'MO004');
      setInvoiceId(defaultInvoiceId || '');
      setKategori(defaultKategori);
      setIsBayarChecked(true);
      setTanggalBayar(new Date().toISOString().split('T')[0]);

      if (defaultInvoiceId) {
        const foundInv = invoiceList.find(i => i.id === defaultInvoiceId || i.nomorInvoice === defaultInvoiceId);
        if (foundInv) {
          const full = foundInv.tagihanFull || foundInv.nominal || 45000000;
          const real = foundInv.tagihanRealisasi || foundInv.nominal || full;
          const paid = foundInv.nominalPembayaran || 0;
          setNominalTagihan(full);
          setNominalRealisasi(real);
          setJumlah(paid > 0 ? paid : real);
          setTanggalBayar(foundInv.tanggalDibayar || new Date().toISOString().split('T')[0]);
          setMitraId(foundInv.mitraId);
        }
      } else {
        const defaultNom = defaultKategori === 'Franchise Fee' ? 75000000 :
                           defaultKategori === 'Renewal Fee' ? 45000000 :
                           defaultKategori === 'Jenjang Baru' ? 35000000 : 15000000;
        setNominalTagihan(defaultNom);
        setNominalRealisasi(defaultNom);
        setJumlah(defaultNom);
      }
    }
  }, [isOpen, editingPembayaran, defaultKategori, defaultInvoiceId, currentSekolahId, invoiceList, sekolahList]);

  if (!isOpen) return null;

  // Filter invoices for selected school and sort from smallest to largest invoice sequence
  const relevantInvoices = [...invoiceList]
    .filter(i => i.mitraId === mitraId)
    .sort(compareInvoiceBySequenceAsc);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const school = sekolahList.find(s => s.id === mitraId);
    const namaSekolah = school ? school.namaSekolah : 'Sekolah Mitra';
    const selectedInv = invoiceList.find(i => i.id === invoiceId || i.nomorInvoice === invoiceId);
    const derivedTA = selectedInv?.tahunAjaran || getTahunAjaranFromDate(tanggalBayar);
    const finalPaid = isBayarChecked ? Number(jumlah) : 0;

    try {
      await onSave(
        {
          id: editingPembayaran ? editingPembayaran.id : `PAY-${Date.now()}`,
          invoiceId: invoiceId || undefined,
          mitraId,
          namaSekolah,
          kategori,
          tahunAjaran: derivedTA,
          jumlah: finalPaid,
          tanggalBayar,
          metodeBayar: editingPembayaran?.metodeBayar || 'Transfer Bank',
          noReferensi: editingPembayaran?.noReferensi || `BYR-${Date.now().toString().slice(-6)}`,
          buktiUrl: editingPembayaran?.buktiUrl || '',
          status: 'Terverifikasi',
          catatan: `Tagihan: ${formatRupiah(nominalTagihan)} | Realisasi: ${formatRupiah(nominalRealisasi)}`,
        },
        invoiceId
          ? {
              invoiceId,
              tagihanFull: Number(nominalTagihan),
              tagihanRealisasi: Number(nominalRealisasi),
              nominalPembayaran: finalPaid,
              tanggalDibayar: tanggalBayar,
            }
          : undefined
      );
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
              {editingPembayaran ? 'Edit Pembayaran' : `Form Pembayaran: ${kategori}`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cukup ceklis bayar dan isi nominal tagihan, nominal realisasi, tanggal pembayaran & nominal bayar
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
          {/* Sekolah Mitra & Tautan Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sekolah Mitra
              </label>
              <select
                disabled={!isAdmin && !!currentSekolahId}
                value={mitraId}
                onChange={(e) => {
                  setMitraId(e.target.value);
                  setInvoiceId('');
                }}
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
                Nomor Invoice
              </label>
              <select
                value={invoiceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setInvoiceId(val);
                  const selected = invoiceList.find(i => i.id === val || i.nomorInvoice === val);
                  if (selected) {
                    const full = selected.tagihanFull || selected.nominal || 0;
                    const real = selected.tagihanRealisasi || selected.nominal || full;
                    const paid = selected.nominalPembayaran || 0;
                    setNominalTagihan(full);
                    setNominalRealisasi(real);
                    setJumlah(paid > 0 ? paid : real);
                    if (selected.tanggalDibayar) setTanggalBayar(selected.tanggalDibayar);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Nomor Invoice --</option>
                {relevantInvoices.map((inv) => (
                  <option key={inv.id} value={inv.nomorInvoice || inv.id}>
                    {inv.nomorInvoice || inv.id} ({inv.bulan || '-'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ceklis Bayar */}
          <label className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 cursor-pointer transition select-none ${
            isBayarChecked
              ? 'bg-emerald-50/80 border-emerald-400'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isBayarChecked}
                onChange={(e) => setIsBayarChecked(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
              />
              <div>
                <span className="text-sm font-black text-slate-900 block">
                  Ceklis Bayar (Sudah Dibayar)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Otomatis langsung tercatat tanpa perlu proses verifikasi
                </span>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full ${
              isBayarChecked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              <CheckCircle2 size={13} />
              {isBayarChecked ? 'Bayar Aktif' : 'Belum Bayar'}
            </span>
          </label>

          {/* 4 Input Inti Sesuai Permintaan: Nominal Tagihan, Nominal Realisasi, Tanggal Pembayaran, Nominal Bayar */}
          {isBayarChecked && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Nominal Tagihan */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <NominalInput
                    label="1. Nominal Tagihan"
                    required
                    value={nominalTagihan}
                    onChange={(val) => setNominalTagihan(val)}
                    inputClassName="border-slate-300 text-slate-800"
                  />
                </div>

                {/* 2. Nominal Realisasi */}
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <NominalInput
                    label="2. Nominal Realisasi"
                    required
                    value={nominalRealisasi}
                    onChange={(val) => setNominalRealisasi(val)}
                    inputClassName="border-blue-400 text-blue-800"
                    helperAction={
                      <button
                        type="button"
                        onClick={() => setNominalRealisasi(nominalTagihan)}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                      >
                        ⚡ Samakan
                      </button>
                    }
                  />
                </div>

                {/* 3. Tanggal Pembayaran */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalBayar}
                    onChange={(e) => setTanggalBayar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Nominal Bayar */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-300">
                  <NominalInput
                    label="4. Nominal Bayar"
                    required
                    value={jumlah}
                    onChange={(val) => setJumlah(val)}
                    inputClassName="border-emerald-400 text-emerald-800"
                    helperAction={
                      <button
                        type="button"
                        onClick={() => setJumlah(nominalRealisasi)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                      >
                        ⚡ Lunas Realisasi
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Ringkasan Sisa */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                <span className="font-bold text-slate-600">Sisa Tagihan (Realisasi − Nominal Bayar):</span>
                <span className={`font-mono font-black text-sm ${
                  nominalRealisasi - jumlah > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {formatRupiah(Math.max(0, nominalRealisasi - jumlah))}
                </span>
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

