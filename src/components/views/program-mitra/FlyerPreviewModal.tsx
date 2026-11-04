import React from 'react';
import { X, ExternalLink, Download, ImageIcon, School } from 'lucide-react';

interface FlyerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  flyer: {
    url: string;
    title: string;
    caption?: string;
    school?: string;
  } | null;
}

export const FlyerPreviewModal: React.FC<FlyerPreviewModalProps> = ({
  isOpen,
  onClose,
  flyer,
}) => {
  if (!isOpen || !flyer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Flyer Resmi Program Mitra
              </span>
              {flyer.school && (
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <School size={12} className="text-slate-400" />
                  <span>{flyer.school}</span>
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              {flyer.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Box */}
        <div className="flex-1 overflow-y-auto bg-slate-950 flex items-center justify-center p-3 sm:p-4 min-h-[300px]">
          {flyer.url ? (
            <img
              src={flyer.url}
              alt={flyer.title}
              className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          ) : (
            <div className="text-slate-500 flex flex-col items-center gap-2">
              <ImageIcon size={48} />
              <span className="text-xs">Gambar flyer tidak tersedia</span>
            </div>
          )}
        </div>

        {/* Footer info & actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            {flyer.caption && (
              <p className="text-slate-600 line-clamp-2 max-w-md">
                {flyer.caption}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {flyer.url && (
              <a
                href={flyer.url}
                target="_blank"
                rel="noreferrer"
                download="flyer-program-lazuardi.png"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Buka / Unduh Gambar Penuh</span>
                <ExternalLink size={13} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
