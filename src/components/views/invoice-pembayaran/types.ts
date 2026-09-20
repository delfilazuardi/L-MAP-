import React from 'react';
import { Briefcase, History, RefreshCw, GraduationCap } from 'lucide-react';

export type RuangKategoriId = 'Franchise Fee' | 'Piutang Lampau' | 'Renewal Fee' | 'Jenjang Baru';

export interface RuangConfig {
  id: RuangKategoriId;
  anchorId: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colors: {
    badge: string;
    border: string;
    headerBg: string;
    accentText: string;
    progressBar: string;
    pillActive: string;
    cardBg: string;
    iconBg: string;
  };
}

export const RUANG_CONFIGS: RuangConfig[] = [
  {
    id: 'Franchise Fee',
    anchorId: 'ruang-franchise-fee',
    title: 'Franchise Fee Kemitraan',
    badge: 'Hak Cipta & Lisensi Awal',
    description: 'Biaya lisensi franchise fee awal kerjasama pembukaan cabang sekolah perguruan Lazuardi.',
    icon: Briefcase,
    colors: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      border: 'border-purple-200/90',
      headerBg: 'from-purple-900 via-indigo-950 to-slate-900',
      accentText: 'text-purple-600',
      progressBar: 'bg-purple-600',
      pillActive: 'bg-purple-600 text-white shadow-purple-600/30',
      cardBg: 'bg-purple-50/40',
      iconBg: 'bg-purple-600 text-white',
    },
  },
  {
    id: 'Piutang Lampau',
    anchorId: 'ruang-piutang-lampau',
    title: 'Piutang Lampau',
    badge: 'Saldo Piutang & Pengadaan Lalu',
    description: 'Saldo piutang berjalan, pengadaan seragam, modul kurikulum, buku, dan tagihan periode terdahulu.',
    icon: History,
    colors: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      border: 'border-amber-200/90',
      headerBg: 'from-amber-950 via-orange-950 to-slate-900',
      accentText: 'text-amber-600',
      progressBar: 'bg-amber-500',
      pillActive: 'bg-amber-600 text-white shadow-amber-600/30',
      cardBg: 'bg-amber-50/40',
      iconBg: 'bg-amber-500 text-slate-950',
    },
  },
  {
    id: 'Renewal Fee',
    anchorId: 'ruang-renewal-fee',
    title: 'Renewal Fee Tahunan',
    badge: 'Lisensi Tahunan MenDAKI',
    description: 'Biaya tahunan perpanjangan lisensi operasional kurikulum MenDAKI Lazuardi dan pendampingan mutu.',
    icon: RefreshCw,
    colors: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      border: 'border-blue-200/90',
      headerBg: 'from-blue-950 via-sky-950 to-slate-900',
      accentText: 'text-blue-600',
      progressBar: 'bg-blue-600',
      pillActive: 'bg-blue-600 text-white shadow-blue-600/30',
      cardBg: 'bg-blue-50/40',
      iconBg: 'bg-blue-600 text-white',
    },
  },
  {
    id: 'Jenjang Baru',
    anchorId: 'ruang-jenjang-baru',
    title: 'Jenjang Baru',
    badge: 'Ekspansi & Unit Baru Sekolah',
    description: 'Biaya pembukaan dan ekspansi unit jenjang pendidikan baru (Pra-TK, TK, SD, SMP, SMA) sekolah mitra.',
    icon: GraduationCap,
    colors: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      border: 'border-emerald-200/90',
      headerBg: 'from-emerald-950 via-teal-950 to-slate-900',
      accentText: 'text-emerald-600',
      progressBar: 'bg-emerald-600',
      pillActive: 'bg-emerald-600 text-white shadow-emerald-600/30',
      cardBg: 'bg-emerald-50/40',
      iconBg: 'bg-emerald-600 text-white',
    },
  },
];

export function normalizeRuang(kategori?: string): RuangKategoriId {
  if (!kategori) return 'Renewal Fee';
  const k = kategori.toLowerCase();
  if (k.includes('franchise')) return 'Franchise Fee';
  if (k.includes('lampau') || k.includes('piutang') || k.includes('seragam') || k.includes('buku')) {
    return 'Piutang Lampau';
  }
  if (k.includes('jenjang') || k.includes('baru')) return 'Jenjang Baru';
  return 'Renewal Fee';
}

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}
