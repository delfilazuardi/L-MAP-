import React, { useState } from 'react';
import { 
  FolderDown, 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Video, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  GraduationCap,
  X,
  Edit3,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TemplateDokumen, TemplateKategori } from '../../types';

export const TemplateDokumenView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { templateList, addTemplate, updateTemplate, deleteTemplate } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDokumen | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState<TemplateKategori>('SOP');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formTipe, setFormTipe] = useState<'Google Docs' | 'Google Sheets' | 'PDF Drive' | 'Video YouTube' | 'Drive Folder'>('Google Docs');

  const filtered = templateList.filter(t => {
    const matchSearch = t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori = selectedKategori === 'ALL' || t.kategori === selectedKategori;
    return matchSearch && matchKategori;
  });

  const handleCopy = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormJudul('');
    setFormKategori('SOP');
    setFormDeskripsi('');
    setFormLink('');
    setFormTipe('Google Docs');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TemplateDokumen) => {
    setEditingTemplate(t);
    setFormJudul(t.judul);
    setFormKategori(t.kategori);
    setFormDeskripsi(t.deskripsi);
    setFormLink(t.linkUrl);
    setFormTipe(t.tipeFile);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, judul: string) => {
    if (window.confirm(`Hapus berkas template "${judul}"?`)) {
      await deleteTemplate(id);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      await updateTemplate({
        ...editingTemplate,
        judul: formJudul,
        kategori: formKategori,
        deskripsi: formDeskripsi,
        linkUrl: formLink,
        tipeFile: formTipe,
        terakhirUpdate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      });
    } else {
      await addTemplate({
        judul: formJudul,
        kategori: formKategori,
        deskripsi: formDeskripsi,
        linkUrl: formLink,
        tipeFile: formTipe,
        terakhirUpdate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      });
    }
    setIsModalOpen(false);
    setFormJudul('');
    setFormDeskripsi('');
    setFormLink('');
  };

  const getCategoryIcon = (kat: TemplateKategori) => {
    switch (kat) {
      case 'Video Panduan':
        return <Video size={18} className="text-rose-500" />;
      case 'Parent Handbook':
        return <BookOpen size={18} className="text-amber-500" />;
      case 'SOP':
        return <ShieldCheck size={18} className="text-blue-600" />;
      case 'Kurikulum & Silabus':
        return <GraduationCap size={18} className="text-indigo-600" />;
      default:
        return <FileText size={18} className="text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderDown size={22} className="text-blue-600" />
            <span>Pusat Template Dokumen & Panduan Resmi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kumpulan berkas SOP, format laporan bulanan, video tutorial, parent handbook, dan silabus kurikulum Lazuardi
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-tambah-template"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Tambah Tautan Dokumen</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-template"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SOP, video tutorial, parent handbook..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'SOP', 'Laporan Bulanan', 'Video Panduan', 'Parent Handbook', 'Kurikulum & Silabus'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedKategori(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedKategori === cat 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Semua Berkas' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div 
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    {getCategoryIcon(item.kategori)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {item.kategori}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {item.tipeFile}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">
                {item.judul}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                {item.deskripsi}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Update: {item.terakhirUpdate}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(item.linkUrl, item.id)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Salin tautan"
                >
                  {copiedId === item.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>

                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Buka Link</span>
                  <ExternalLink size={12} />
                </a>

                {isAdmin && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                      title="Edit template dokumen"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.judul)}
                      className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="Hapus template dokumen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Tambah/Edit Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTemplate ? 'Edit Template Dokumen' : 'Tambah Template & Berkas Resmi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Dokumen / Video</label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Misal: Format Laporan Bulanan 2026/2027..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as TemplateKategori)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="SOP">SOP</option>
                    <option value="Laporan Bulanan">Laporan Bulanan</option>
                    <option value="Video Panduan">Video Panduan</option>
                    <option value="Parent Handbook">Parent Handbook</option>
                    <option value="Kurikulum & Silabus">Kurikulum & Silabus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format / Tipe File</label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Google Docs">Google Docs</option>
                    <option value="Google Sheets">Google Sheets</option>
                    <option value="PDF Drive">PDF Drive</option>
                    <option value="Video YouTube">Video YouTube</option>
                    <option value="Drive Folder">Drive Folder</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tautan URL Berkas</label>
                <input
                  type="url"
                  required
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat Dokumen</label>
                <textarea
                  rows={3}
                  required
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Jelaskan kegunaan dokumen dan pihak yang berhak mengakses..."
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
                  {editingTemplate ? 'Simpan Pembaruan Dokumen' : 'Simpan Tautan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
