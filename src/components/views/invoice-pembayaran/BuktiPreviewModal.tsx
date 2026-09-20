import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface BuktiPreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export const BuktiPreviewModal: React.FC<BuktiPreviewModalProps> = ({
  url,
  onClose,
}) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <span className="text-xs font-bold tracking-wide">Pratinjau Bukti Transfer / Resi Pembayaran</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Buka Tab Baru"
            >
              <ExternalLink size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[70vh] overflow-auto">
          <img
            src={url}
            alt="Bukti Transfer"
            className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
