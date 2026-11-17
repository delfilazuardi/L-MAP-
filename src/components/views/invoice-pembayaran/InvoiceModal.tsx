import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, AlertCircle, School, CheckCircle2 } from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceOperationalStatus, SekolahMitra } from '../../../types';
import { RuangKategoriId, formatRupiah } from './types';
import { 
  generateNomorInvoiceBaru, 
  NAMA_BULAN_LIST, 
  isAfiliasiTanpaInvoice,
  STANDARD_TAHUN_AJARAN_LIST,
  normalizeTahunAjaran,
  getTahunAjaranFromDate,
  buildOverpaymentDistributionPlan
} from '../../../lib/invoiceUtils';
import { NominalInput } from './NominalInput';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice: Invoice | null;
  defaultKategori: RuangKategoriId;
  sekolahList: SekolahMitra[];
  existingInvoices: Invoice[];
  onSave: (invoiceData: Partial<Invoice>, extraInvoiceUpdates?: Invoice[]) => Promise<void>;
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
  const [autoAccumulateExcess, setAutoAccumulateExcess] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List opsi Tahun Ajaran resmi yang bersih dan terstandarisasi untuk dropdown
  const availableTahunAjaranOptions = useMemo(() => {
    const set = new Set<string>(STANDARD_TAHUN_AJARAN_LIST);
    if (tahunAjaran) {
      const norm = normalizeTahunAjaran(tahunAjaran);
      if (norm) set.add(norm);
    }
    existingInvoices.forEach(inv => {
      const norm = normalizeTahunAjaran(inv.tahunAjaran);
      if (norm) set.add(norm);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [existingInvoices, tahunAjaran]);

  // Periksa apakah sekolah dan tahun yang dipilih termasuk Sekolah Afiliasi (tanpa nomor invoice)
  const isTanpaInvoice = isAfiliasiTanpaInvoice(mitraId, {
    date: tanggalKirim,
    tahunAjaran,
    tahun: parseInt(tanggalKirim?.slice(0, 4) || '2026', 10),
    sekolahList,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (editingInvoice) {
      setNomorInvoice(editingInvoice.nomorInvoice || '');
      setMitraId(editingInvoice.mitraId);
      setKategori((editingInvoice.kategori as RuangKategoriId) || defaultKategori);
      setBulan(editingInvoice.bulan || 'September');
      setTahunAjaran(normalizeTahunAjaran(editingInvoice.tahunAjaran, editingInvoice.tanggalKirim) || '2026/2027');
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
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setTanggalKirim(todayStr);
      setTahunAjaran(getTahunAjaranFromDate(today));

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

  // Hitung rencana akumulasi otomatis jika Nominal Full < Nominal Pembayaran
  const overpaymentPlan = useMemo(() => {
    const effectivePaid = isBayarChecked ? (Number(nominalPembayaran) || 0) : 0;
    return buildOverpaymentDistributionPlan(
      {
        id: editingInvoice?.id,
        nomorInvoice: editingInvoice?.nomorInvoice || nomorInvoice,
        mitraId,
        tagihanFull: Number(tagihanFull) || 0,
        nominalPembayaran: effectivePaid,
        tanggalDibayar,
      },
      existingInvoices,
      sekolahList
    );
  }, [
    isBayarChecked,
    nominalPembayaran,
    tagihanFull,
    editingInvoice,
    nomorInvoice,
    mitraId,
    tanggalDibayar,
    existingInvoices,
    sekolahList,
  ]);

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

    const effectivePaid = isBayarChecked ? (Number(nominalPembayaran) || 0) : 0;
    const numFull = Number(tagihanFull) || 0;
    const numRealisasi = Number(tagihanRealisasi) || 0;
    const fullTarget = Math.max(numFull, numRealisasi);

    let savedPaid = effectivePaid;
    let finalStatus: InvoiceStatus = 'Belum Bayar';
    let extraInvoiceUpdates: Invoice[] = [];
    let finalKeterangan = keterangan || (isTanpaInvoice ? `Pendataan Kemitraan Afiliasi ${namaSekolah}` : `Tagihan ${kategori} ${namaSekolah}`);

    if (!isBayarChecked || effectivePaid <= 0) {
      savedPaid = 0;
      finalStatus = 'Belum Bayar';
    } else if (effectivePaid > numFull && !isTanpaInvoice) {
      // Nominal Full lebih kecil dari pembayaran: jangan langsung dikatakan Lunas tanpa akumulasi
      if (autoAccumulateExcess && overpaymentPlan.allocation.updatedInvoices.length > 0) {
        savedPaid = overpaymentPlan.adjustedTargetPaid;
        finalStatus = overpaymentPlan.adjustedTargetStatus; // 'Lunas' jika surplus habis dialokasikan, 'Akumulasi' jika masih sisa lebih
        const targetNames = overpaymentPlan.allocation.updatedInvoices
          .map(u => `${u.invoice.nomorInvoice || u.invoice.id} (+${formatRupiah(u.allocatedAmount)})`)
          .join(', ');
        extraInvoiceUpdates = overpaymentPlan.allocation.updatedInvoices.map(u => {
          const prevKet = String(u.invoice.keterangan || '').trim();
          const note = `Terima akumulasi ${formatRupiah(u.allocatedAmount)} dari ${nomorInvoice || 'pembayaran lebih'}`;
          return {
            ...u.invoice,
            keterangan: prevKet.includes(note) ? prevKet : (prevKet ? `${prevKet} | ${note}` : note),
          };
        });
        const donorNote = `Kelebihan ${formatRupiah(overpaymentPlan.allocation.totalAllocated)} diakumulasikan ke: ${targetNames}`;
        if (!finalKeterangan.includes(donorNote)) {
          finalKeterangan = finalKeterangan ? `${finalKeterangan} | ${donorNote}` : donorNote;
        }
      } else {
        savedPaid = effectivePaid;
        finalStatus = 'Akumulasi';
      }
    } else if (effectivePaid >= fullTarget && fullTarget > 0) {
      finalStatus = 'Lunas';
    } else {
      finalStatus = 'Sebagian';
    }

    const effectiveId = editingInvoice 
      ? editingInvoice.id 
      : isTanpaInvoice 
      ? `DATA-AFILIASI-${mitraId}-${Date.now().toString().slice(-6)}` 
      : nomorInvoice;

    try {
      await onSave(
        {
          id: effectiveId,
          nomorInvoice: isTanpaInvoice ? undefined : nomorInvoice,
          mitraId,
          namaSekolah,
          kategori,
          bulan,
          tahunAjaran: normalizeTahunAjaran(tahunAjaran, tanggalKirim) || '2026/2027',
          tanggalKirim,
          tanggalDibayar: isBayarChecked ? tanggalDibayar : undefined,
          jatuhTempo: editingInvoice?.jatuhTempo || '',
          nominal: numRealisasi,
          tagihanFull: numFull,
          tagihanRealisasi: numRealisasi,
          nominalPembayaran: savedPaid,
          statusInvoice,
          status: finalStatus,
          isPelaporanSaja: isTanpaInvoice || editingInvoice?.isPelaporanSaja,
          isPendataanAfiliasi: isTanpaInvoice,
          keterangan: finalKeterangan,
          createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
        },
        extraInvoiceUpdates.length > 0 ? extraInvoiceUpdates : undefined
      );
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">
                {editingInvoice 
                  ? (isTanpaInvoice ? 'Edit Pendataan Afiliasi' : 'Edit Data Invoice') 
                  : (isTanpaInvoice ? `Pendataan Kemitraan Afiliasi: ${kategori}` : `Buat Invoice Baru: ${kategori}`)}
              </h3>
              {isTanpaInvoice && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Mode Pendataan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTanpaInvoice 
                ? 'Pencatatan data kemitraan sekolah afiliasi tanpa penerbitan nomor invoice' 
                : 'Penerbitan tagihan resmi untuk sekolah mitra Lazuardi'}
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
          {/* Banner Informasi Khusus Sekolah Afiliasi (Hanya Pendataan, Tanpa Invoice) */}
          {isTanpaInvoice && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-purple-200 text-purple-800 shrink-0 mt-0.5">
                <School size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-purple-950 block">
                    Sekolah Afiliasi: Khusus Pendataan Kemitraan (Bebas Nomor Invoice)
                  </span>
                </div>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  Sesuai ketentuan, sekolah afiliasi tidak memerlukan nomor invoice resmi. Data ini dicatat sebagai pendataan/laporan kemitraan Lazuardi tanpa ada nomor invoice yang harus diisi.
                </p>
              </div>
            </div>
          )}

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

          {/* Sekolah Mitra & Nomor Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sekolah Tujuan
              </label>
              <select
                value={mitraId}
                onChange={(e) => {
                  const newMitraId = e.target.value;
                  setMitraId(newMitraId);
                  // Jika ganti ke sekolah reguler dan nomorInvoice kosong, auto-generate nomor invoice
                  const willBeTanpaInvoice = isAfiliasiTanpaInvoice(newMitraId, {
                    date: tanggalKirim,
                    tahunAjaran,
                    tahun: parseInt(tanggalKirim?.slice(0, 4) || '2026', 10),
                    sekolahList,
                  });
                  if (!willBeTanpaInvoice && !nomorInvoice) {
                    const gen = generateNomorInvoiceBaru(existingInvoices);
                    setNomorInvoice(gen.nomorInvoice);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sekolahList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaSekolah} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nomor Invoice Resmi
                </label>
                {isTanpaInvoice ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    Tidak Perlu Diisi
                  </span>
                ) : null}
              </div>

              {isTanpaInvoice ? (
                <div>
                  <input
                    type="text"
                    disabled
                    value="[Tanpa Invoice — Pendataan Afiliasi]"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50/60 text-sm font-mono font-bold text-purple-800 cursor-not-allowed select-none"
                  />
                  <p className="text-[10px] text-purple-700 font-semibold mt-1">
                    ✓ Otomatis tanpa nomor invoice (hanya pendataan saja).
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={nomorInvoice}
                    onChange={(e) => setNomorInvoice(e.target.value)}
                    placeholder="INV/romawi/tahun/nomor/MO"
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
              )}
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
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {availableTahunAjaranOptions.map((ta) => (
                  <option key={ta} value={ta}>
                    TA {ta}
                  </option>
                ))}
              </select>
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
              onChange={(e) => {
                const val = e.target.value;
                setTanggalKirim(val);
                if (!editingInvoice && val) {
                  const derived = getTahunAjaranFromDate(val);
                  if (derived) setTahunAjaran(derived);
                }
              }}
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

            {/* Sisa Tagihan / Akumulasi Kelebihan Pembayaran */}
            {(() => {
              const paidNow = isBayarChecked ? (Number(nominalPembayaran) || 0) : 0;
              const diff = (Number(tagihanFull) || 0) - paidNow;
              const isOverpaid = !isTanpaInvoice && paidNow > (Number(tagihanFull) || 0);

              if (isOverpaid) {
                const targets = overpaymentPlan.allocation.updatedInvoices;
                return (
                  <div className="p-4 rounded-xl border-2 border-indigo-300 bg-indigo-50/80 text-indigo-950 space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                            Kelebihan Bayar (Akumulasi ke Tagihan Lain)
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900">
                            Status: Akumulasi (Bukan Lunas Biasa)
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-800">
                          Nominal Pembayaran ({formatRupiah(paidNow)}) melebihi Tagihan Full ({formatRupiah(tagihanFull)}) sebesar{' '}
                          <strong>+{formatRupiah(overpaymentPlan.excess)}</strong>.
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="font-mono text-lg sm:text-xl font-black text-indigo-700">
                          +{formatRupiah(overpaymentPlan.excess)}
                        </div>
                      </div>
                    </div>

                    {targets.length > 0 ? (
                      <div className="p-3 rounded-xl bg-white border border-indigo-200 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoAccumulateExcess}
                            onChange={(e) => setAutoAccumulateExcess(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-extrabold text-slate-900 block">
                              Akumulasikan kelebihan {formatRupiah(overpaymentPlan.allocation.totalAllocated)} ke {targets.length} tagihan kurang bayar / sebagian:
                            </span>
                          </div>
                        </label>
                        <div className="space-y-1 pl-6 text-[11px]">
                          {targets.map(item => (
                            <div key={item.invoice.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-b-0">
                              <span className="font-mono font-bold text-slate-700">
                                {item.invoice.nomorInvoice || item.invoice.id} ({item.invoice.kategori})
                              </span>
                              <span className="text-indigo-700 font-bold">
                                +{formatRupiah(item.allocatedAmount)} → Sisa {formatRupiah(item.newRemaining)} ({item.newStatus})
                              </span>
                            </div>
                          ))}
                        </div>
                        {overpaymentPlan.allocation.remainingInstallment > 0 && (
                          <p className="text-[10px] font-bold text-amber-700 pl-6">
                            Sisa deposit akumulasi yang belum terpakai: +{formatRupiah(overpaymentPlan.allocation.remainingInstallment)} (tersimpan untuk tagihan berikutnya).
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-indigo-800 bg-white/80 px-3 py-2 rounded-lg border border-indigo-200">
                        Belum ada tagihan kurang bayar lain untuk sekolah ini saat ini. Nominal kelebihan <strong>+{formatRupiah(overpaymentPlan.excess)}</strong> akan disimpan sebagai status <strong>Akumulasi</strong> dan otomatis terhitung untuk tagihan berikutnya.
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div className={`p-3.5 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  diff > 0
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider">
                        Nominal Piutang (Sisa Piutang)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        diff > 0
                          ? 'bg-rose-200 text-rose-800'
                          : 'bg-emerald-200 text-emerald-800'
                      }`}>
                        {diff > 0 ? 'Ada Piutang' : '✓ Lunas'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tagihan Full ({formatRupiah(tagihanFull)}) − Pembayaran ({formatRupiah(paidNow)})
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className={`font-mono text-lg sm:text-xl font-black tracking-tight ${
                      diff > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {formatRupiah(Math.max(0, diff))}
                    </div>
                  </div>
                </div>
              );
            })()}
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
