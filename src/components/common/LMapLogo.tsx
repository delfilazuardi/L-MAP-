import React from 'react';

interface LMapLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  layout?: 'horizontal' | 'vertical' | 'iconOnly';
  theme?: 'dark' | 'light';
  className?: string;
  showTagline?: boolean;
}

export const LMapLogo: React.FC<LMapLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  layout = 'horizontal',
  theme = 'light',
  className = '',
  showTagline = false,
}) => {
  const isDark = theme === 'dark';

  const imageSizes = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const titleSizes = {
    xs: 'text-sm font-black',
    sm: 'text-base font-black',
    md: 'text-lg font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  const subtitleSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  if (layout === 'iconOnly') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src="/lmap-logo.jpg"
          alt="L-MAP Logo"
          className={`${imageSizes[size]} object-contain rounded-xl shadow-xs border ${
            isDark ? 'border-white/20 bg-white' : 'border-slate-200/90 bg-white'
          } p-0.5`}
        />
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {/* Logo Image */}
        <div className="relative mb-3 inline-block">
          <div className="absolute -inset-2 rounded-2xl bg-blue-500/20 blur-md pointer-events-none" />
          <img
            src="/lmap-logo.jpg"
            alt="L-MAP Logo"
            className={`${imageSizes[size]} object-contain rounded-2xl shadow-lg border ${
              isDark ? 'border-white/25 bg-white' : 'border-slate-200 bg-white'
            } p-1`}
          />
        </div>

        {/* Title: L-MAP with gold dash */}
        <div className="flex items-center justify-center tracking-tight">
          <span className={`${titleSizes[size]} ${isDark ? 'text-white' : 'text-blue-900'} tracking-widest flex items-center`}>
            <span>L</span>
            <span className="text-amber-500 font-black mx-0.5">-</span>
            <span>MAP</span>
          </span>
        </div>

        {/* Subtitle */}
        {showSubtitle && (
          <p className={`${subtitleSizes[size]} ${isDark ? 'text-blue-200/90' : 'text-slate-600 font-semibold'} tracking-wider uppercase mt-0.5`}>
            Lazuardi Mitra Administration Platform
          </p>
        )}

        {/* Tagline */}
        {showTagline && (
          <div className="flex items-center gap-2 mt-1 text-[10px] text-amber-500 font-medium tracking-wide">
            <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
            <span className="italic">Together for Greater Impact</span>
            <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
          </div>
        )}
      </div>
    );
  }

  // Default: Horizontal Layout
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/lmap-logo.jpg"
        alt="L-MAP Logo"
        className={`${imageSizes[size]} object-contain rounded-xl shadow-xs border ${
          isDark ? 'border-white/20 bg-white' : 'border-slate-200/90 bg-white'
        } p-0.5 shrink-0`}
      />

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSizes[size]} ${isDark ? 'text-white' : 'text-blue-900'} tracking-wider flex items-center leading-tight`}>
            <span>L</span>
            <span className="text-amber-500 font-black mx-0.5">-</span>
            <span>MAP</span>
          </span>
        </div>

        {showSubtitle && (
          <p className={`${subtitleSizes[size]} ${isDark ? 'text-blue-200/90' : 'text-slate-600 font-semibold'} tracking-tight leading-tight mt-0.5`}>
            Lazuardi Mitra Administration Platform
          </p>
        )}
      </div>
    </div>
  );
};
