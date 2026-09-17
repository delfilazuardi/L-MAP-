import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  X, 
  Check, 
  Building,
  Image as ImageIcon,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Pembayaran, PembayaranKategori, PembayaranStatus } from '../../types';
import { InputSheetInvoicePembayaranModal } from '../modals/InputSheetInvoicePembayaranModal';

interface PembayaranViewProps {
  preselectedInvoiceId?: string;
}

export const PembayaranView: React.FC<PembayaranViewProps> = ({ preselectedInvoiceId }) => {
  const { currentUser, isAdmin } = useAuth();
  const { pembayaranList, sekolahList, invoiceList, addPembayaran, verifyPembayaran } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [previewBukti, setPreviewBukti] = useState<string | null>(null);

  // Form State
  const [formMitraId, setFormMitraId] = useState(currentUser?.sekolahId || sekolahList[0]?.id || 'MO004');
  const [formInvoiceId, setFormInvoiceId] = useState(preselectedInvoiceId || '');
  const [formKategori, setFormKategori] = useState<PembayaranKategori>('Renewal Fee');
  const [formJumlah, setFormJumlah] = useState<number>(45000000);
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formMetode, setFormMetode] = useState('Bank Mandiri Transfer');
  const [formNoRef, setFormNoRef] = useState('TRF-' + Date.now().toString().slice(-6));
  const [formBuktiUrl, setFormBuktiUrl] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60');
  const [formCatatan, setFormCatatan] = useState('');

  const baseList = isAdmin 
    ? pembayaranList 
    : pembayaranList.filter(p => p.mitraId === currentUser?.sekolahId);

  const filtered = baseList.filter(p => {
    const matchSearch = p.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.noReferensi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = selectedKategori === 'ALL' || p.kategori === selectedKategori;
    const matchTahun = selectedTahun === 'ALL' || 
      p.tanggalBayar.startsWith(selectedTahun) || 
      (p.invoiceId && p.invoiceId.includes(selectedTahun)) || 
      (p.catatan && p.catatan.includes(selectedTahun));
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchSearch && matchKategori && matchTahun && matchStatus;
  });

  const handleSubmitPembayaran = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSchool = sekolahList.find(s => s.id === formMitraId);

    await addPembayaran({
      invoiceId: formInvoiceId || undefined,
      mitraId: formMitraId,
      namaSekolah: targetSchool ? targetSchool.namaSekolah : (currentUser?.nama || 'Sekolah Mitra'),
      kategori: formKategori,
      jumlah: Number(formJumlah),
      tanggalBayar: formTanggal,
      metodeBayar: formMetode,
      noReferensi: formNoRef,
      buktiUrl: formBuktiUrl,
      status: 'Menunggu Verifikasi',
      catatan: formCatatan,
    });

    setIsModalOpen(false);
    setFormCatatan('');
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadge = (status: PembayaranStatus) => {
    switch (status) {
      case 'Terverifikasi':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800"><CheckCircle2 size={12} /> Terverifikasi</span>;
      case 'Ditolak':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700"><XCircle size={12} /> Ditolak</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800"><Clock size={12} /> Menunggu Verifikasi</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard size={22} className="text-blue-600" />
            <span>Riwayat & Konfirmasi Pembayaran</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setoran Franchise Fee, Renewal Fee, Piutang, dan Pengembangan Jenjang Baru
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button
              id="btn-input-sheet-pembayaran"
              onClick={() => setIsSheetModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet size={16} className="text-blue-600" />
              <span className="hidden sm:inline">Input Sheet Transaksi (Sejak 2022)</span>
              <span className="sm:hidden">Input Sheet</span>
            </button>
          )}

          <button
            id="btn-lapor-pembayaran"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Konfirmasi Setoran Pembayaran</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-pembayaran"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari sekolah, no ref transfer..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          id="filter-tahun-pembayaran"
          value={selectedTahun}
          onChange={(e) => setSelectedTahun(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Tahun (2022-2026)</option>
          <option value="2026">Tahun 2026</option>
          <option value="2025">Tahun 2025</option>
          <option value="2024">Tahun 2024</option>
          <option value="2023">Tahun 2023</option>
          <option value="2022">Tahun 2022</option>
        </select>

        <select
          id="filter-kategori-pembayaran"
          value={selectedKategori}
          onChange={(e) => setSelectedKategori(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Kategori Pembayaran</option>
          <option value="Franchise Fee">Franchise Fee</option>
          <option value="Renewal Fee">Renewal Fee</option>
          <option value="Piutang">Piutang</option>
          <option value="Jenjang Baru">Jenjang Baru</option>
        </select>

        <select
          id="filter-status-pembayaran"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="ALL">Semua Status</option>
          <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
          <option value="Terverifikasi">Terverifikasi</option>
          <option value="Ditolak">Ditolak</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Transaksi & Sekolah</th>
                <th className="py-3 px-4">Kategori & Invoice</th>
                <th className="py-3 px-4">Jumlah Nominal</th>
                <th className="py-3 px-4">Metode & No. Ref</th>
                <th className="py-3 px-4">Tanggal Bayar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan pembayaran yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pay.namaSekolah}</div>
                      <span className="text-[10px] text-slate-400 font-mono">#{pay.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{pay.kategori}</span>
                      {pay.invoiceId && (
                        <span className="block text-[10px] text-blue-600 font-mono">{pay.invoiceId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{formatRupiah(pay.jumlah)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{pay.metodeBayar}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{pay.noReferensi}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pay.tanggalBayar}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(pay.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewBukti(pay.buktiUrl)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Lihat Bukti Transfer"
                        >
                          <ImageIcon size={14} />
                        </button>

                        {isAdmin && pay.status === 'Menunggu Verifikasi' && (
                          <>
                            <button
                              onClick={() => verifyPembayaran(pay.id, 'Terverifikasi', 'Telah dicek dan dana masuk ke rekening Mitra Office.')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <Check size={12} />
                              <span>Validasi</span>
                            </button>
                            <button
                              onClick={() => verifyPembayaran(pay.id, 'Ditolak', 'Nominal tidak sesuai rekening koran.')}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Lapor Pembayaran Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Konfirmasi Setoran Pembayaran</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPembayaran} className="space-y-3 mt-4 text-xs">
              {isAdmin && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sekolah Mitra Pembayar</label>
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
                <label className="block font-bold text-slate-700 mb-1">Terkait Invoice (Opsional)</label>
                <select
                  value={formInvoiceId}
                  onChange={(e) => {
                    setFormInvoiceId(e.target.value);
                    const inv = invoiceList.find(i => i.id === e.target.value);
                    if (inv) {
                      setFormJumlah(inv.nominal);
                      setFormKategori(
                        inv.kategori === 'Renewal Fee' ? 'Renewal Fee' :
                        inv.kategori === 'Jenjang Baru' ? 'Jenjang Baru' : 'Piutang'
                      );
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Tanpa Tautan Invoice Spesifik --</option>
                  {invoiceList.filter(i => i.status !== 'Lunas').map(i => (
                    <option key={i.id} value={i.id}>
                      {i.id} - {i.namaSekolah} ({formatRupiah(i.nominal)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Pembayaran</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as PembayaranKategori)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Renewal Fee">Renewal Fee</option>
                    <option value="Franchise Fee">Franchise Fee</option>
                    <option value="Piutang">Piutang</option>
                    <option value="Jenjang Baru">Jenjang Baru</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal (IDR)</label>
                  <input
                    type="number"
                    required
                    value={formJumlah}
                    onChange={(e) => setFormJumlah(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Transfer</label>
                  <input
                    type="text"
                    required
                    value={formMetode}
                    onChange={(e) => setFormMetode(e.target.value)}
                    placeholder="BCA, Mandiri, BSI..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Referensi Transfer</label>
                  <input
                    type="text"
                    required
                    value={formNoRef}
                    onChange={(e) => setFormNoRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan Bukti Transfer (Image / Drive URL)</label>
                <input
                  type="url"
                  value={formBuktiUrl}
                  onChange={(e) => setFormBuktiUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Misal: Pembayaran ditransfer atas nama bendahara yayasan..."
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
                  Kirim Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewBukti && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-4 text-center">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-900">Bukti Transfer Pembayaran</span>
              <button onClick={() => setPreviewBukti(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <img 
              src={previewBukti} 
              alt="Bukti Transfer" 
              className="w-full h-64 object-cover rounded-2xl border border-slate-200" 
            />
            <p className="text-[11px] text-slate-500 mt-2">Dokumen tanda terima setoran tervalidasi</p>
          </div>
        </div>
      )}

      {/* MODAL INPUT SHEET INVOICE & PEMBAYARAN */}
      <InputSheetInvoicePembayaranModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
      />
    </div>
  );
};
