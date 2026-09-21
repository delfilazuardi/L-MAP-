import React, { useState } from 'react';
import { 
  X, 
  Target, 
  Search, 
  Award, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Info,
  Trash2
} from 'lucide-react';
import { MasterKpiStandar } from '../../../types';
import { DAFTAR_15_STANDAR_KPI } from '../../../data/masterKpiStandar';
import { ConfirmDeleteModal } from '../../common/ConfirmDeleteModal';

interface MasterKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterList: MasterKpiStandar[];
  onSaveMasterList: (updatedList: MasterKpiStandar[]) => void;
  onSelectKpiForTask?: (kpi: MasterKpiStandar) => void;
}

export const MasterKpiModal: React.FC<MasterKpiModalProps> = ({
  isOpen,
  onClose,
  masterList,
  onSaveMasterList,
  onSelectKpiForTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKpi, setEditingKpi] = useState<MasterKpiStandar | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for editing or adding a standard
  const [formNomor, setFormNomor] = useState(1);
  const [formNoKpi, setFormNoKpi] = useState('KPI-01');
  const [formNamaStandar, setFormNamaStandar] = useState('');
  const [formProgramKpi, setFormProgramKpi] = useState('');
  const [formPenjelasanKpi, setFormPenjelasanKpi] = useState('');
  const [formTargetOutput, setFormTargetOutput] = useState('');

  if (!isOpen) return null;

  const filteredList = masterList.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.noKpi.toLowerCase().includes(query) ||
      item.namaStandar.toLowerCase().includes(query) ||
      item.programKpi.toLowerCase().includes(query) ||
      item.penjelasanKpi.toLowerCase().includes(query) ||
      (item.targetOutput && item.targetOutput.toLowerCase().includes(query))
    );
  });

  const handleStartEdit = (item: MasterKpiStandar) => {
    setEditingKpi(item);
    setIsAddingNew(false);
    setFormNomor(item.nomor);
    setFormNoKpi(item.noKpi);
    setFormNamaStandar(item.namaStandar);
    setFormProgramKpi(item.programKpi);
    setFormPenjelasanKpi(item.penjelasanKpi);
    setFormTargetOutput(item.targetOutput || '');
  };

  const handleStartAdd = () => {
    const nextNomor = masterList.length + 1;
    const nextCode = `KPI-${String(nextNomor).padStart(2, '0')}`;
    setEditingKpi(null);
    setIsAddingNew(true);
    setFormNomor(nextNomor);
    setFormNoKpi(nextCode);
    setFormNamaStandar(`Standar ${nextNomor}: `);
    setFormProgramKpi('');
    setFormPenjelasanKpi('');
    setFormTargetOutput('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaStandar.trim() || !formProgramKpi.trim() || !formPenjelasanKpi.trim()) {
      setFormError('Mohon lengkapi Nama Standar, Sasaran Program, dan Penjelasan KPI.');
      return;
    }
    setFormError(null);

    if (isAddingNew) {
      const newItem: MasterKpiStandar = {
        id: `STD-${Date.now()}`,
        nomor: formNomor,
        noKpi: formNoKpi.trim(),
        namaStandar: formNamaStandar.trim(),
        programKpi: formProgramKpi.trim(),
        penjelasanKpi: formPenjelasanKpi.trim(),
        targetOutput: formTargetOutput.trim() || undefined,
        defaultBobot: 100,
      };
      onSaveMasterList([...masterList, newItem]);
    } else if (editingKpi) {
      const updated = masterList.map((item) =>
        item.id === editingKpi.id
          ? {
              ...item,
              nomor: formNomor,
              noKpi: formNoKpi.trim(),
              namaStandar: formNamaStandar.trim(),
              programKpi: formProgramKpi.trim(),
              penjelasanKpi: formPenjelasanKpi.trim(),
              targetOutput: formTargetOutput.trim() || undefined,
            }
          : item
      );
      onSaveMasterList(updated);
    }

    setEditingKpi(null);
    setIsAddingNew(false);
  };

  const handleDeleteKpi = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleResetToDefault = () => {
    setIsResetConfirmOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden text-slate-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-xs font-bold">
              <Target size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Master 15 Standar & 15 KPI Mitra Office
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/40 text-blue-100 border border-blue-300/30">
                  Total: {masterList.length} Standar
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Katalog lengkap standar mutu, kode KPI, target indikator keberhasilan, dan program Lazuardi MenDAKI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Filter & Add Button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. KPI, nama standar, penjelasan..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset ke Standar Awal"
            >
              <RotateCcw size={13} className="text-slate-500" />
              <span>Reset Standar</span>
            </button>
            <button
              type="button"
              onClick={handleStartAdd}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah Standar/KPI Baru</span>
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Edit / Add Form Panel if active */}
          {(editingKpi || isAddingNew) && (
            <form onSubmit={handleSaveForm} className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-300 space-y-4 animate-in fade-in">
              {formError && (
                <div className="p-3 bg-rose-100/90 border border-rose-300 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <X size={14} className="shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {formNoKpi}
                  </span>
                  <h4 className="font-bold text-sm text-blue-950">
                    {isAddingNew ? 'Tambah Standar & KPI Baru' : `Edit ${editingKpi?.noKpi}: ${editingKpi?.namaStandar}`}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingKpi(null);
                    setIsAddingNew(false);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Tutup Form
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Urut</label>
                  <input
                    type="number"
                    min="1"
                    value={formNomor}
                    onChange={(e) => setFormNomor(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode / No. KPI</label>
                  <input
                    type="text"
                    value={formNoKpi}
                    onChange={(e) => setFormNoKpi(e.target.value)}
                    placeholder="Contoh: KPI-01"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Standar Mutu</label>
                  <input
                    type="text"
                    value={formNamaStandar}
                    onChange={(e) => setFormNamaStandar(e.target.value)}
                    placeholder="Contoh: Standar 1: Kurikulum & Pendampingan MenDAKI"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sasaran Program KPI (Khusus Program)</label>
                  <input
                    type="text"
                    value={formProgramKpi}
                    onChange={(e) => setFormProgramKpi(e.target.value)}
                    placeholder="Contoh: Supervisi & Pendampingan Kurikulum/MenDAKI"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penjelasan KPI & Indikator Keberhasilan</label>
                  <textarea
                    rows={3}
                    value={formPenjelasanKpi}
                    onChange={(e) => setFormPenjelasanKpi(e.target.value)}
                    placeholder="Uraikan target ketercapaian, batasan waktu, dan indikator keberhasilan KPI..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Berkas / Output Hasil</label>
                  <input
                    type="text"
                    value={formTargetOutput}
                    onChange={(e) => setFormTargetOutput(e.target.value)}
                    placeholder="Contoh: Rekap nilai supervisi modul ajar & laporan visitasi berkala"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingKpi(null);
                    setIsAddingNew(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Standar & KPI
                </button>
              </div>
            </form>
          )}

          {/* List of 15 Standards & KPIs */}
          <div className="space-y-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-700 text-white flex flex-col items-center justify-center shrink-0 shadow-xs font-mono">
                    <span className="text-[11px] font-black">{item.noKpi}</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.namaStandar}
                      </h4>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Program: {item.programKpi}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <strong className="text-slate-900 font-semibold">Penjelasan & Target: </strong>
                      {item.penjelasanKpi}
                    </p>

                    {item.targetOutput && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <FileText size={13} className="text-blue-600" />
                        <span>Output / Hasil: <strong className="text-slate-700">{item.targetOutput}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition cursor-pointer"
                    title="Edit Standar/KPI"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteKpi(item.id, item.namaStandar)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    title="Hapus Standar/KPI"
                  >
                    <Trash2 size={15} />
                  </button>

                  {onSelectKpiForTask && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectKpiForTask(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer ml-1"
                      title="Gunakan KPI ini untuk tambah tugas"
                    >
                      <span>Pilih KPI Ini</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredList.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Target size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Tidak ada standar atau KPI yang cocok dengan pencarian.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Coba kata kunci lain atau reset filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600" />
            <span>Seluruh 15 standar & 15 KPI ini langsung tersedia pada dropdown tambah/edit tugas.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const updated = masterList.filter(item => item.id !== deleteTarget.id);
            onSaveMasterList(updated);
          }
        }}
        title="Hapus Standar KPI"
        message="Apakah Anda yakin ingin menghapus standar KPI ini dari daftar master?"
        itemName={deleteTarget ? deleteTarget.name : ''}
        confirmLabel="Hapus Standar"
      />

      {/* Reset Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          onSaveMasterList(DAFTAR_15_STANDAR_KPI);
        }}
        title="Reset ke Standar Resmi"
        message="Kembalikan seluruh 15 Standar & 15 KPI ke format standar resmi Lazuardi Mitra Office?"
        confirmLabel="Reset Sekarang"
        variant="warning"
      />
    </div>
  );
};
