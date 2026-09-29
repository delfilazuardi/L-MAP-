import React, { useState, useEffect } from 'react';
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
  Trash2,
  Settings,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TemplateDokumen, TemplateKategori } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const DEFAULT_TEMPLATE_CATEGORIES: string[] = [
  'SOP',
  'Laporan Bulanan',
  'Video Panduan',
  'Parent Handbook',
  'Kurikulum & Silabus',
  'Legal & Kontrak'
];

const TEMPLATE_CATEGORIES_STORAGE_KEY = 'lmap_template_categories';

export const TemplateDokumenView: React.FC = () => {
  const { isAdmin } = useAuth();
  const { templateList, addTemplate, updateTemplate, deleteTemplate } = useData();

  // Dynamic Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_TEMPLATE_CATEGORIES;
  });

  // Ensure any categories currently used in templateList are in the categories list
  useEffect(() => {
    if (templateList && templateList.length > 0) {
      const existingInTemplates = templateList.map(t => t.kategori).filter(Boolean);
      const missing = existingInTemplates.filter(c => !categories.includes(c));
      if (missing.length > 0) {
        const merged = Array.from(new Set([...categories, ...missing]));
        setCategories(merged);
        try {
          localStorage.setItem(TEMPLATE_CATEGORIES_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
    }
  }, [templateList]);

  const saveCategories = (newCats: string[]) => {
    setCategories(newCats);
    try {
      localStorage.setItem(TEMPLATE_CATEGORIES_STORAGE_KEY, JSON.stringify(newCats));
    } catch (e) {
      console.error('Failed to persist template categories:', e);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDokumen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; judul: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Category Management Modal & Inline States
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [isInlineAddingCat, setIsInlineAddingCat] = useState(false);
  const [isInlineCatListOpen, setIsInlineCatListOpen] = useState(false);
  const [inlineCatInput, setInlineCatInput] = useState('');
  const [manageNewCatInput, setManageNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState<TemplateKategori>(categories[0] || 'SOP');
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

  const handleAddCategory = (catName: string, source: 'inline' | 'modal') => {
    const clean = catName.trim();
    if (!clean) return;
    if (categories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      alert('Kategori tersebut sudah terdaftar.');
      return;
    }
    const updated = [...categories, clean];
    saveCategories(updated);
    setFormKategori(clean);
    if (source === 'inline') {
      setInlineCatInput('');
      setIsInlineAddingCat(false);
    } else {
      setManageNewCatInput('');
    }
  };

  const handleStartEditCat = (index: number, name: string) => {
    setEditingCatIndex(index);
    setEditingCatName(name);
  };

  const handleSaveEditCat = async (oldName: string) => {
    const cleanNew = editingCatName.trim();
    if (!cleanNew) {
      alert('Nama kategori tidak boleh kosong.');
      return;
    }
    if (cleanNew.toLowerCase() !== oldName.toLowerCase() && categories.some(c => c.toLowerCase() === cleanNew.toLowerCase())) {
      alert('Kategori dengan nama tersebut sudah ada.');
      return;
    }

    const updated = categories.map(c => c === oldName ? cleanNew : c);
    saveCategories(updated);

    if (formKategori === oldName) {
      setFormKategori(cleanNew);
    }
    if (selectedKategori === oldName) {
      setSelectedKategori(cleanNew);
    }

    // Update existing templates in data
    const affected = templateList.filter(t => t.kategori === oldName);
    for (const item of affected) {
      await updateTemplate({ ...item, kategori: cleanNew });
    }

    setEditingCatIndex(null);
    setEditingCatName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('Minimal harus ada 1 kategori.');
      return;
    }
    const count = templateList.filter(t => t.kategori === catToDelete).length;
    const msg = count > 0
      ? `Kategori "${catToDelete}" sedang digunakan pada ${count} dokumen. Tetap hapus kategori ini dari daftar pilihan?`
      : `Hapus kategori "${catToDelete}"?`;

    if (!window.confirm(msg)) return;

    const updated = categories.filter(c => c !== catToDelete);
    saveCategories(updated);

    if (formKategori === catToDelete) {
      setFormKategori(updated[0] || 'SOP');
    }
    if (selectedKategori === catToDelete) {
      setSelectedKategori('ALL');
    }
  };

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormJudul('');
    setFormKategori(categories[0] || 'SOP');
    setFormDeskripsi('');
    setFormLink('');
    setFormTipe('Google Docs');
    setIsInlineAddingCat(false);
    setIsInlineCatListOpen(false);
    setInlineCatInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TemplateDokumen) => {
    setEditingTemplate(t);
    setFormJudul(t.judul);
    setFormKategori(t.kategori);
    setFormDeskripsi(t.deskripsi);
    setFormLink(t.linkUrl);
    setFormTipe(t.tipeFile as any || 'Google Docs');
    setIsInlineAddingCat(false);
    setIsInlineCatListOpen(false);
    setInlineCatInput('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, judul: string) => {
    setDeleteTarget({ id, judul });
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

  const getCategoryIcon = (kat: string) => {
    const k = (kat || '').toLowerCase();
    if (k.includes('video')) return <Video size={18} className="text-rose-500" />;
    if (k.includes('parent') || k.includes('handbook')) return <BookOpen size={18} className="text-amber-500" />;
    if (k.includes('sop') || k.includes('kebijakan')) return <ShieldCheck size={18} className="text-blue-600" />;
    if (k.includes('kurikulum') || k.includes('silabus') || k.includes('modul')) return <GraduationCap size={18} className="text-indigo-600" />;
    return <FileText size={18} className="text-emerald-600" />;
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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsManageCatOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              title="Kelola & Edit Daftar Kategori"
            >
              <Tag size={15} className="text-slate-600" />
              <span>Kelola Kategori</span>
            </button>

            <button
              id="btn-tambah-template"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Tambah Tautan Dokumen</span>
            </button>
          </div>
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
            placeholder="Cari SOP, formulir, video tutorial, handbook..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedKategori('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedKategori === 'ALL' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            Semua Berkas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedKategori(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedKategori === cat 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsManageCatOpen(true)}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer ml-auto"
              title="Kelola & Edit Kategori Dokumen"
            >
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <FolderDown size={36} className="mx-auto text-slate-300 mb-2.5" />
            <p className="text-sm font-semibold text-slate-700">Belum ada template dokumen yang sesuai pencarian.</p>
          </div>
        ) : (
          filtered.map((item) => (
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
          ))
        )}
      </div>

      {/* MODAL: Tambah/Edit Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTemplate ? 'Edit Template Dokumen' : 'Tambah Template & Berkas Resmi'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
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
                  placeholder="Judul dokumen resmi atau materi panduan"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Kategori with Inline Add & Manage Actions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag size={13} className="text-blue-600" />
                    <span>Kategori Dokumen</span>
                  </label>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsInlineAddingCat(prev => !prev)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition"
                      >
                        <Plus size={11} />
                        <span>Tambah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInlineCatListOpen(prev => !prev)}
                        className={`text-[11px] font-bold flex items-center gap-0.5 cursor-pointer px-2 py-0.5 rounded-md transition ${
                          isInlineCatListOpen 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Kelola & Edit Kategori di dalam form"
                      >
                        <Edit3 size={11} />
                        <span>{isInlineCatListOpen ? 'Tutup Kelola' : 'Kelola / Edit Kategori'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsManageCatOpen(true)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-0.5 cursor-pointer p-1 rounded hover:bg-slate-100"
                        title="Buka Jendela Kelola Kategori Penuh"
                      >
                        <Settings size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Quick Add Input */}
                {isInlineAddingCat && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5">
                    <input
                      type="text"
                      value={inlineCatInput}
                      onChange={(e) => setInlineCatInput(e.target.value)}
                      placeholder="Nama kategori baru..."
                      className="flex-1 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory(inlineCatInput, 'inline');
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCategory(inlineCatInput, 'inline')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                    >
                      Simpan Kategori
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInlineAddingCat(false);
                        setInlineCatInput('');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {/* Inline Category Manager Panel (inside the form) */}
                {isInlineCatListOpen && (
                  <div className="mb-3 p-3 bg-slate-50 border border-blue-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="font-bold text-[11px] text-slate-700 flex items-center gap-1">
                        <Tag size={12} className="text-blue-600" />
                        <span>Kelola & Edit Kategori ({categories.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Klik ikon pensil untuk mengubah nama</span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {categories.map((cat, idx) => {
                        const count = templateList.filter(t => t.kategori === cat).length;
                        const isEditing = editingCatIndex === idx;

                        return (
                          <div 
                            key={cat}
                            className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  type="text"
                                  value={editingCatName}
                                  onChange={(e) => setEditingCatName(e.target.value)}
                                  className="flex-1 p-1 bg-white border border-blue-500 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditCat(cat);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCat(cat)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                                  title="Simpan"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatIndex(null);
                                    setEditingCatName('');
                                  }}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md cursor-pointer"
                                  title="Batal"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-[10px] font-mono text-slate-400">{idx + 1}.</span>
                                  <span className="font-semibold text-slate-800 truncate">{cat}</span>
                                  {count > 0 && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 shrink-0">
                                      {count} berkas
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCat(idx, cat)}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                    title={`Edit nama kategori "${cat}"`}
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title={`Hapus kategori "${cat}"`}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={formTipe}
                      onChange={(e) => setFormTipe(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    >
                      <option value="Google Docs">Google Docs</option>
                      <option value="Google Sheets">Google Sheets</option>
                      <option value="PDF Drive">PDF Drive</option>
                      <option value="Video YouTube">Video YouTube</option>
                      <option value="Drive Folder">Drive Folder</option>
                    </select>
                  </div>
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
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {editingTemplate ? 'Simpan Pembaruan Dokumen' : 'Simpan Tautan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KELOLA & EDIT KATEGORI */}
      {isManageCatOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag size={17} className="text-blue-600" />
                <span>Kelola & Edit Kategori Dokumen Template</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsManageCatOpen(false);
                  setEditingCatIndex(null);
                }} 
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Form Tambah Kategori Baru */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                <label className="font-bold text-blue-950 block">Tambah Kategori Baru</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manageNewCatInput}
                    onChange={(e) => setManageNewCatInput(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory(manageNewCatInput, 'modal');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCategory(manageNewCatInput, 'modal')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Daftar Kategori Aktif dengan Fitur Edit & Hapus */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">Daftar Kategori ({categories.length})</span>
                  <span className="text-[11px] text-slate-400">Klik ikon pensil untuk mengedit nama</span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {categories.map((cat, idx) => {
                    const count = templateList.filter(t => t.kategori === cat).length;
                    const isEditing = editingCatIndex === idx;

                    return (
                      <div 
                        key={cat}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition flex items-center justify-between gap-2"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 p-1.5 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditCat(cat);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditCat(cat)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                              title="Simpan Perubahan Nama"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatIndex(null);
                                setEditingCatName('');
                              }}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg cursor-pointer"
                              title="Batal"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[11px] font-mono text-slate-400 w-4 text-center">{idx + 1}.</span>
                              <span className="font-semibold text-slate-800 truncate">{cat}</span>
                              {count > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                                  {count} dokumen
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditCat(idx, cat)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title={`Edit nama kategori "${cat}"`}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={`Hapus kategori "${cat}"`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsManageCatOpen(false);
                    setEditingCatIndex(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTemplate(deleteTarget.id);
          }
        }}
        title="Hapus Template Dokumen"
        message="Apakah Anda yakin ingin menghapus berkas/tautan template dokumen ini dari Firestore? Tindakan ini tidak dapat dibatalkan."
        itemName={deleteTarget ? deleteTarget.judul : ''}
        confirmLabel="Hapus Dokumen"
      />
    </div>
  );
};
