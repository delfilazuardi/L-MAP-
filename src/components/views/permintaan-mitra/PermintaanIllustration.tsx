import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Download, 
  FileText, 
  Building, 
  Calendar, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { PermintaanMitra, PermintaanStatus, PermintaanLampiran } from '../../../types';

// ==========================================
// 1. ILUSTRASI KEMASAN BOX KARDUS (PRODUKSI)
// ==========================================
interface BoxIllustrationProps {
  size?: number;
  className?: string;
  isPacking?: boolean;
}

export const CardboardBoxIllustration: React.FC<BoxIllustrationProps> = ({
  size = 72,
  className = '',
  isPacking = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${isPacking ? 'animate-pulse' : ''} ${className}`}
      style={{ width: size, height: size }}
      title="Kemasan Box Kardus Produksi Lazuardi"
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        <ellipse cx="60" cy="108" rx="46" ry="8" fill="#0f172a" fillOpacity="0.12" />
        {/* Box Left Side */}
        <path d="M20 45L60 66V104L20 83V45Z" fill="#D97706" />
        {/* Box Right Side */}
        <path d="M60 66L100 45V83L60 104V66Z" fill="#B45309" />
        {/* Box Top Side */}
        <path d="M60 22L100 45L60 66L20 45L60 22Z" fill="#F59E0B" />
        {/* Tape */}
        <path d="M54 25.5L66 18.5L66 62.5L54 69.5Z" fill="#FEF3C7" fillOpacity="0.9" />
        <path d="M54 69.5L66 62.5V104L54 104V69.5Z" fill="#FDE68A" />
        {/* Label */}
        <polygon points="28,55 48,65 48,80 28,70" fill="#FFFFFF" fillOpacity="0.95" />
        <line x1="31" y1="59" x2="31" y2="67" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="34" y1="60.5" x2="34" y2="68.5" stroke="#1E293B" strokeWidth="1" />
        <line x1="37" y1="62" x2="37" y2="70" stroke="#1E293B" strokeWidth="2" />
        <line x1="41" y1="64" x2="41" y2="72" stroke="#1E293B" strokeWidth="1.2" />
        {/* Fragile Glass */}
        <g transform="translate(68, 62) scale(0.65)">
          <path d="M8 2H18L18 8C18 10.76 15.76 13 13 13C10.24 13 8 10.76 8 8V2Z" stroke="#78350F" strokeWidth="1.8" fill="none" />
          <path d="M13 13V20M9 20H17" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        {/* Logo Seal */}
        <circle cx="82" cy="74" r="8" fill="#2563EB" />
        <path d="M82 69L83.5 72.5L87 73L84.2 75.2L85 78.8L82 77L79 78.8L79.8 75.2L77 73L80.5 72.5L82 69Z" fill="#FFFFFF" />
      </svg>
      {isPacking && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-white"></span>
        </span>
      )}
    </div>
  );
};

// ==========================================
// 2. ILUSTRASI MOBIL BOX (PENGIRIMAN)
// ==========================================
interface DeliveryVanIllustrationProps {
  size?: number;
  className?: string;
  isInTransit?: boolean;
}

export const DeliveryVanIllustration: React.FC<DeliveryVanIllustrationProps> = ({
  size = 72,
  className = '',
  isInTransit = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="Mobil Box Pengiriman Logistik Ekspedisi Lazuardi"
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        <ellipse cx="60" cy="104" rx="50" ry="7" fill="#0f172a" fillOpacity="0.12" />
        <path d="M12 104H108" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="6 4" />
        {isInTransit && (
          <g className="animate-pulse">
            <line x1="6" y1="92" x2="18" y2="92" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="96" x2="14" y2="96" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="100" x2="22" y2="100" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {/* Cargo Container */}
        <rect x="22" y="44" width="54" height="46" rx="4" fill="#2563EB" />
        <line x1="36" y1="46" x2="36" y2="88" stroke="#1D4ED8" strokeWidth="1.5" />
        <line x1="50" y1="46" x2="50" y2="88" stroke="#1D4ED8" strokeWidth="1.5" />
        <line x1="64" y1="46" x2="64" y2="88" stroke="#1D4ED8" strokeWidth="1.5" />
        {/* Box graphic on body */}
        <rect x="42" y="58" width="16" height="15" rx="2" fill="#F59E0B" />
        <line x1="42" y1="65" x2="58" y2="65" stroke="#FEF3C7" strokeWidth="1.5" />
        <line x1="50" y1="58" x2="50" y2="73" stroke="#FEF3C7" strokeWidth="1.5" />
        {/* Cabin */}
        <path d="M76 56L88 56C93.5 56 98 60.5 99 66L102 78C102.5 80 102.5 82 102 84L101 90H76V56Z" fill="#1D4ED8" />
        {/* Window */}
        <path d="M78 60H87C90 60 92.5 62.5 93.5 65.5L95.5 73H78V60Z" fill="#BAE6FD" />
        {/* Lights */}
        <path d="M100 78L102 78L101 83L99 83Z" fill="#FACC15" />
        {isInTransit && <polygon points="102,78 116,74 116,87 101,83" fill="#FDE047" fillOpacity="0.25" />}
        {/* Wheels */}
        <circle cx="36" cy="94" r="11" fill="#0F172A" />
        <circle cx="36" cy="94" r="5" fill="#94A3B8" />
        <circle cx="86" cy="94" r="11" fill="#0F172A" />
        <circle cx="86" cy="94" r="5" fill="#94A3B8" />
      </svg>
      {isInTransit && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border border-white"></span>
        </span>
      )}
    </div>
  );
};

// ==========================================
// 3. ILUSTRASI VALIDASI DOKUMEN PO (STEP 1)
// ==========================================
export const ValidationDocIllustration: React.FC<{ size?: number; className?: string }> = ({ size = 72, className = '' }) => (
  <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md select-none">
      <ellipse cx="60" cy="106" rx="42" ry="7" fill="#0f172a" fillOpacity="0.1" />
      {/* Clipboard */}
      <rect x="28" y="24" width="64" height="82" rx="8" fill="#475569" />
      <rect x="32" y="32" width="56" height="70" rx="5" fill="#FFFFFF" />
      {/* Top Clip */}
      <rect x="46" y="18" width="28" height="12" rx="3" fill="#94A3B8" />
      <circle cx="60" cy="24" r="3" fill="#475569" />
      {/* Text lines */}
      <line x1="40" y1="46" x2="80" y2="46" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="56" x2="74" y2="56" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="65" x2="68" y2="65" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      {/* Checklist items */}
      <circle cx="43" cy="77" r="4" fill="#10B981" />
      <path d="M41.5 77L42.5 78L45 75.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="51" y1="77" x2="78" y2="77" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Verified Stamp */}
      <rect x="52" y="80" width="38" height="16" rx="3" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
      <text x="71" y="91" textAnchor="middle" fill="#059669" fontSize="8" fontWeight="bold">VALID PO</text>
    </svg>
  </div>
);

// ==========================================
// 4. ILUSTRASI DP (OPSIONAL) (STEP 2)
// ==========================================
export const DpPaymentIllustration: React.FC<{ size?: number; className?: string }> = ({ size = 72, className = '' }) => (
  <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md select-none">
      <ellipse cx="60" cy="106" rx="44" ry="7" fill="#0f172a" fillOpacity="0.1" />
      {/* Wallet */}
      <rect x="24" y="38" width="72" height="52" rx="8" fill="#D97706" />
      <path d="M24 46C24 41.5 27.5 38 32 38H88C92.5 38 96 41.5 96 46V54H24V46Z" fill="#F59E0B" />
      {/* Wallet Flap */}
      <path d="M68 50H96V74H68C63.5 74 60 70.5 60 66V58C60 53.5 63.5 50 68 50Z" fill="#B45309" />
      <circle cx="84" cy="62" r="5" fill="#FDE68A" stroke="#78350F" strokeWidth="1.5" />
      {/* Banknote sticking out */}
      <rect x="36" y="24" width="46" height="24" rx="4" fill="#10B981" />
      <circle cx="59" cy="36" r="6" fill="#059669" />
      <text x="59" y="39" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">DP</text>
      {/* Coins stack */}
      <ellipse cx="34" cy="94" rx="10" ry="4" fill="#EAB308" />
      <ellipse cx="34" cy="90" rx="10" ry="4" fill="#FACC15" />
      <ellipse cx="34" cy="86" rx="10" ry="4" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
    </svg>
  </div>
);

// ==========================================
// 5. ILUSTRASI KONFIRMASI (STEP 3)
// ==========================================
export const ConfirmationIllustration: React.FC<{ size?: number; className?: string }> = ({ size = 72, className = '' }) => (
  <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md select-none">
      <ellipse cx="60" cy="106" rx="42" ry="7" fill="#0f172a" fillOpacity="0.1" />
      {/* Shield */}
      <path d="M60 20L92 34V64C92 82 78 96 60 102C42 96 28 82 28 64V34L60 20Z" fill="#2563EB" />
      <path d="M60 26L86 38V64C86 78 75 90 60 95C45 90 34 78 34 64V38L60 26Z" fill="#3B82F6" />
      {/* Inner seal checkmark */}
      <circle cx="60" cy="60" r="22" fill="#FFFFFF" />
      <path d="M49 59L57 67L73 49" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// ==========================================
// 6. ILUSTRASI INFO VENDOR (STEP 4)
// ==========================================
export const VendorWorkshopIllustration: React.FC<{ size?: number; className?: string }> = ({ size = 72, className = '' }) => (
  <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md select-none">
      <ellipse cx="60" cy="106" rx="46" ry="7" fill="#0f172a" fillOpacity="0.1" />
      {/* Factory / Workshop building */}
      <path d="M24 98V50L44 64V50L64 64V38H96V98H24Z" fill="#4F46E5" />
      <rect x="74" y="24" width="8" height="14" fill="#3730A3" />
      {/* Windows */}
      <rect x="72" y="48" width="16" height="12" rx="2" fill="#C7D2FE" />
      <rect x="72" y="66" width="16" height="12" rx="2" fill="#C7D2FE" />
      <line x1="80" y1="48" x2="80" y2="60" stroke="#4F46E5" strokeWidth="1" />
      <line x1="72" y1="54" x2="88" y2="54" stroke="#4F46E5" strokeWidth="1" />
      {/* Gear / Machinery icon */}
      <circle cx="44" cy="80" r="12" fill="#818CF8" />
      <circle cx="44" cy="80" r="5" fill="#312E81" />
      {/* Door */}
      <rect x="40" y="86" width="18" height="12" fill="#1E1B4B" />
    </svg>
  </div>
);

// ==========================================
// 7. ILUSTRASI PELUNASAN (STEP 6)
// ==========================================
export const PelunasanInvoiceIllustration: React.FC<{ size?: number; className?: string }> = ({ size = 72, className = '' }) => (
  <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md select-none">
      <ellipse cx="60" cy="106" rx="44" ry="7" fill="#0f172a" fillOpacity="0.1" />
      {/* Invoice receipt */}
      <path d="M30 22H90V98L82 92L74 98L66 92L58 98L50 92L42 98L30 92V22Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      {/* Header bar */}
      <rect x="36" y="28" width="48" height="6" rx="2" fill="#9333EA" />
      <line x1="38" y1="42" x2="82" y2="42" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="50" x2="72" y2="50" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="58" x2="65" y2="58" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
      {/* Stamp LUNAS */}
      <g transform="translate(46, 62) rotate(-12)">
        <rect x="0" y="0" width="48" height="22" rx="4" fill="#ECFDF5" stroke="#059669" strokeWidth="2" strokeDasharray="3 2" />
        <text x="24" y="15" textAnchor="middle" fill="#059669" fontSize="10" fontWeight="900" letterSpacing="1">LUNAS</text>
      </g>
    </svg>
  </div>
);

// ==========================================
// 8. ILUSTRASI SELESAI / TIBA DI SEKOLAH (STEP 8)
// ==========================================
export const SchoolReceivedIllustration: React.FC<{ size?: number; className?: string }> = ({ size = 72, className = '' }) => (
  <div style={{ width: size, height: size }} className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md select-none">
      <ellipse cx="60" cy="106" rx="48" ry="7" fill="#0f172a" fillOpacity="0.1" />
      {/* School building */}
      <rect x="34" y="44" width="52" height="58" rx="4" fill="#059669" />
      {/* Roof & Bell Tower */}
      <polygon points="60,20 28,44 92,44" fill="#047857" />
      <rect x="54" y="16" width="12" height="12" fill="#F59E0B" />
      <circle cx="60" cy="22" r="2.5" fill="#FFFFFF" />
      {/* Windows & Doors */}
      <rect x="42" y="52" width="10" height="12" rx="2" fill="#D1FAE5" />
      <rect x="68" y="52" width="10" height="12" rx="2" fill="#D1FAE5" />
      <rect x="52" y="76" width="16" height="26" rx="2" fill="#065F46" />
      {/* Delivered Box at entrance */}
      <g transform="translate(64, 82) scale(0.35)">
        <path d="M20 45L60 66V104L20 83V45Z" fill="#D97706" />
        <path d="M60 66L100 45V83L60 104V66Z" fill="#B45309" />
        <path d="M60 22L100 45L60 66L20 45L60 22Z" fill="#F59E0B" />
      </g>
      {/* Checkmark badge */}
      <circle cx="94" cy="38" r="12" fill="#10B981" />
      <path d="M89 38L93 42L100 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Helper function to render any step illustration
export const renderStageIllustration = (
  stepId: PermintaanStatus,
  size: number = 72,
  isActive: boolean = false
) => {
  const norm = normalizeWorkflowStage(stepId);
  switch (norm) {
    case 'Validasi Mitra Office':
      return <ValidationDocIllustration size={size} />;
    case 'DP (Opsional)':
      return <DpPaymentIllustration size={size} />;
    case 'Konfirmasi':
      return <ConfirmationIllustration size={size} />;
    case 'Info Vendor':
      return <VendorWorkshopIllustration size={size} />;
    case 'Produksi':
      return <CardboardBoxIllustration size={size} isPacking={isActive} />;
    case 'Pelunasan':
      return <PelunasanInvoiceIllustration size={size} />;
    case 'Pengiriman':
      return <DeliveryVanIllustration size={size} isInTransit={isActive} />;
    case 'Selesai':
      return <SchoolReceivedIllustration size={size} />;
    default:
      return <CardboardBoxIllustration size={size} />;
  }
};

export const WORKFLOW_STAGES_CONFIG: {
  id: PermintaanStatus;
  label: string;
  stepNum: number;
  shortDesc: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    id: 'Validasi Mitra Office',
    label: 'Validasi Mitra Office',
    stepNum: 1,
    shortDesc: 'Pemeriksaan kelengkapan dokumen PO & item',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-800',
  },
  {
    id: 'DP (Opsional)',
    label: 'DP (Opsional)',
    stepNum: 2,
    shortDesc: 'Pembayaran Down Payment atau lewati tanpa DP',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-800',
  },
  {
    id: 'Konfirmasi',
    label: 'Konfirmasi',
    stepNum: 3,
    shortDesc: 'Approval spesifikasi, jadwal & PO final',
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-800',
  },
  {
    id: 'Info Vendor',
    label: 'Info Vendor',
    stepNum: 4,
    shortDesc: 'PO & spesifikasi diteruskan ke vendor rekanan',
    badgeBg: 'bg-indigo-100 border-indigo-300',
    badgeText: 'text-indigo-800',
  },
  {
    id: 'Produksi',
    label: 'Produksi (Box Kardus)',
    stepNum: 5,
    shortDesc: 'Pengerjaan barang & pengemasan ke box kardus berlogo',
    badgeBg: 'bg-orange-100 border-orange-300',
    badgeText: 'text-orange-900',
  },
  {
    id: 'Pelunasan',
    label: 'Pelunasan',
    stepNum: 6,
    shortDesc: 'Pelunasan invoice sebelum/saat pengiriman',
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-800',
  },
  {
    id: 'Pengiriman',
    label: 'Pengiriman (Mobil Box)',
    stepNum: 7,
    shortDesc: 'Mobil box kurir membawa paket ke alamat sekolah',
    badgeBg: 'bg-sky-100 border-sky-300',
    badgeText: 'text-sky-900',
  },
  {
    id: 'Selesai',
    label: 'Selesai',
    stepNum: 8,
    shortDesc: 'Barang diterima pihak sekolah dalam kondisi baik',
    badgeBg: 'bg-emerald-100 border-emerald-300',
    badgeText: 'text-emerald-900',
  },
];

export function normalizeWorkflowStage(status: PermintaanStatus): PermintaanStatus {
  if (status === 'Diajukan' || status === 'Pengajuan') return 'Validasi Mitra Office';
  if (status === 'DP') return 'DP (Opsional)';
  if (status === 'Diproses' || status === 'Proses') return 'Produksi';
  if (status === 'Biaya Kirim') return 'Pelunasan';
  if (status === 'Dikirim') return 'Pengiriman';
  const found = WORKFLOW_STAGES_CONFIG.find((s) => s.id === status);
  return found ? found.id : 'Validasi Mitra Office';
}

export function getWorkflowStepIndex(status: PermintaanStatus): number {
  const norm = normalizeWorkflowStage(status);
  const idx = WORKFLOW_STAGES_CONFIG.findIndex((s) => s.id === norm);
  return idx >= 0 ? idx : 0;
}

// =========================================================================
// 9. MODAL STATUS PENGIRIMAN & ILUSTRASI BERTAHAP (DIBUKA DARI SHEET/TABEL)
// =========================================================================
interface StatusPengirimanModalProps {
  item: PermintaanMitra;
  onClose: () => void;
  isAdmin?: boolean;
  onQuickStepChange?: (targetStatus: PermintaanStatus) => void;
  onOpenManageModal?: () => void;
  onConfirmTerimaPo?: () => void;
}

export const StatusPengirimanModal: React.FC<StatusPengirimanModalProps> = ({
  item,
  onClose,
  isAdmin = false,
  onQuickStepChange,
  onOpenManageModal,
  onConfirmTerimaPo,
}) => {
  const currentStepIdx = getWorkflowStepIndex(item.status);
  const currentConfig = WORKFLOW_STAGES_CONFIG[currentStepIdx] || WORKFLOW_STAGES_CONFIG[0];
  const [copiedResi, setCopiedResi] = React.useState(false);

  const handleCopyResi = () => {
    if (item.noResi) {
      navigator.clipboard.writeText(item.noResi);
      setCopiedResi(true);
      setTimeout(() => setCopiedResi(false), 2000);
    }
  };

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-t-3xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  Status & Pelacakan Pengiriman PO
                </span>
                {item.noPo && (
                  <span className="text-xs font-mono font-extrabold text-amber-300 bg-amber-950/70 border border-amber-600/40 px-2.5 py-0.5 rounded-md">
                    No. PO: {item.noPo}
                  </span>
                )}
                {item.isPoDiterima ? (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>PO Diterima Resmi ({item.tanggalTerimaPo || item.tanggalPengajuan})</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Clock size={12} />
                    <span>Menunggu Klik Terima PO oleh Admin</span>
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white">
                {item.namaItem || item.itemDetail || 'Permintaan Logistik'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
                <span className="font-extrabold text-blue-400 flex items-center gap-1">
                  <Building size={13} />
                  <span>{item.namaSekolah}</span>
                </span>
                <span>•</span>
                <span>Jumlah: <strong className="text-white">{item.jumlah} {item.satuan || 'Pcs'}</strong></span>
                <span>•</span>
                <span>Kategori: <strong className="text-white">{item.kategori}</strong></span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Current Active Spotlight Card */}
          <div className="mt-4 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                {renderStageIllustration(item.status, 54, true)}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                  Tahap {currentStepIdx + 1} dari 8 — Status Berjalan
                </span>
                <h4 className="text-base font-extrabold text-white">{currentConfig.label}</h4>
                <p className="text-xs text-slate-300 mt-0.5">{currentConfig.shortDesc}</p>
              </div>
            </div>

            {isAdmin && !item.isPoDiterima && onConfirmTerimaPo && (
              <button
                type="button"
                onClick={onConfirmTerimaPo}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Check size={14} />
                <span>Terima PO Sekarang</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: 8 Visual Stage Cards (Gambar-Gambar) */}
        <div className="p-5 sm:p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Alur Tahapan Pengiriman (Bagan Gambar 1 s/d 8)
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisasi perjalanan pesanan dari validasi dokumen PO, produksi box, hingga tiba di sekolah
                </p>
              </div>
              {isAdmin && (
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Tip Admin: Anda dapat mengklik gambar tahapan untuk berpindah progres langsung
                </span>
              )}
            </div>

            {/* Grid 8 Visual Cards with Illustrations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {WORKFLOW_STAGES_CONFIG.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div
                    key={step.id}
                    onClick={() => isAdmin && onQuickStepChange && onQuickStepChange(step.id)}
                    className={`relative p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between transition ${
                      isCurrent
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                        : isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 hover:bg-emerald-100/40'
                        : 'bg-slate-50/60 border-slate-200 text-slate-400'
                    } ${isAdmin ? 'cursor-pointer hover:border-blue-400' : 'cursor-default'}`}
                  >
                    {/* Status Top Badge */}
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </span>
                      {isCurrent ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                          Aktif
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                          Selesai
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-slate-400">
                          Menunggu
                        </span>
                      )}
                    </div>

                    {/* Vector Picture Illustration */}
                    <div className="my-1.5 transform hover:scale-105 transition">
                      {renderStageIllustration(step.id, 64, isCurrent)}
                    </div>

                    {/* Title & Desc */}
                    <div className="w-full mt-1">
                      <h4 className={`text-xs font-black leading-tight ${
                        isCurrent ? 'text-blue-900' : isCompleted ? 'text-emerald-900' : 'text-slate-700'
                      }`}>
                        {step.label}
                      </h4>
                      <p className={`text-[10px] mt-1 line-clamp-2 ${
                        isCurrent ? 'text-blue-700' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {step.shortDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics & Tracking Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Expedisi & Resi Information */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <span className="font-black text-slate-800 block text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={15} className="text-blue-600" />
                <span>Rincian Pengiriman & Ekspedisi</span>
              </span>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Kurir / Ekspedisi:</span>
                  <span className="font-bold text-slate-900">{item.kurir || 'Kurir Ekspedisi'}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">No. Resi Pengiriman:</span>
                  {item.noResi ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.noResi}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyResi}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer"
                        title="Salin No Resi"
                      >
                        {copiedResi ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Belum ada no. resi</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ongkos Kirim:</span>
                  <span className="font-bold text-slate-900">
                    {item.biayaKirim ? formatRupiah(item.biayaKirim) : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Vendor Rekanan:</span>
                  <span className="font-bold text-indigo-700">{item.vendorNama || '-'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estimasi Tiba:</span>
                  <span className="font-bold text-slate-900">{item.estimasiSelesai || '-'}</span>
                </div>
              </div>

              {item.catatanAdmin && (
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 mt-2">
                  <span className="font-bold block text-[11px]">Catatan Ekspedisi Mitra Office:</span>
                  <p className="text-[11px] mt-0.5">{item.catatanAdmin}</p>
                </div>
              )}
            </div>

            {/* Right: Purchase Order Details & Documents */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between">
              <div>
                <span className="font-black text-slate-800 block text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <FileText size={15} className="text-blue-600" />
                  <span>Dokumen Lampiran PO ({item.lampiranDokumen?.length || 0})</span>
                </span>

                {!item.lampiranDokumen || item.lampiranDokumen.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 bg-white">
                    <p className="text-[11px]">Tidak ada dokumen PDF / Word terlampir.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {item.lampiranDokumen.map((docItem, idx) => (
                      <div
                        key={`${docItem.namaFile}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={16} className="text-blue-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-extrabold text-slate-800 block truncate text-[11px]">
                              {docItem.namaFile}
                            </span>
                            {docItem.ukuranFile && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatFileSize(docItem.ukuranFile)}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={docItem.dataUrl}
                          download={docItem.namaFile}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
                        >
                          <Download size={12} />
                          <span>Unduh</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-slate-500 text-[11px]">
                <span>Tgl PO: <strong>{item.tanggalPo || item.tanggalPengajuan}</strong></span>
                <span>Tgl Pengajuan: <strong>{item.tanggalPengajuan}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isAdmin && onOpenManageModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManageModal();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition cursor-pointer"
              >
                Ubah Tahapan & Input Resi
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition"
          >
            Tutup Pelacakan
          </button>
        </div>
      </div>
    </div>
  );
};

export interface WorkflowIllustrationPipelineProps {
  currentStatus: PermintaanStatus;
  noPo?: string;
  tanggalPo?: string;
  tanggalTerimaPo?: string;
  isPoDiterima?: boolean;
  diterimaOleh?: string;
  vendorNama?: string;
  noResi?: string;
  kurir?: string;
  onStepClick?: (targetStatus: PermintaanStatus) => void;
  canEdit?: boolean;
}

export const WorkflowIllustrationPipeline: React.FC<WorkflowIllustrationPipelineProps> = ({
  currentStatus,
  noPo,
  tanggalPo,
  tanggalTerimaPo,
  isPoDiterima,
  diterimaOleh,
  vendorNama,
  noResi,
  kurir,
  onStepClick,
  canEdit = false,
}) => {
  const currentStepIdx = getWorkflowStepIndex(currentStatus);
  const isProduksiActive = currentStepIdx === 4;
  const isPengirimanActive = currentStepIdx === 6;

  return (
    <div className="bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden border border-slate-700/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/70 pb-3 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Alur Pengadaan & Logistik
            </span>
            {noPo && (
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded-md">
                No. PO: {noPo}
              </span>
            )}
            {tanggalPo && (
              <span className="text-[11px] text-slate-300">
                Tgl PO: <strong className="text-white">{tanggalPo}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              Tahap {currentStepIdx + 1} dari 8: {WORKFLOW_STAGES_CONFIG[currentStepIdx]?.label}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPoDiterima ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>PO Diterima {tanggalTerimaPo ? `(${tanggalTerimaPo})` : ''}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
              <Clock size={13} className="text-amber-400 animate-pulse" />
              <span>PO Belum Diterima</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 relative z-10">
        {WORKFLOW_STAGES_CONFIG.map((step, idx) => {
          const isCompleted = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!canEdit}
              onClick={() => canEdit && onStepClick && onStepClick(step.id)}
              className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                isCurrent
                  ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/40 shadow-md'
                  : isCompleted
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                    isCurrent ? 'bg-white text-blue-700' : isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-white/20 text-white">
                      Aktif
                    </span>
                  )}
                </div>
                <span className={`block text-[11px] font-extrabold truncate ${
                  isCurrent ? 'text-white' : isCompleted ? 'text-emerald-300' : 'text-slate-200'
                }`}>
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
