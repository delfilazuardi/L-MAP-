import React from 'react';
import { Sparkles } from 'lucide-react';

interface LMapLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  align?: 'center' | 'left';
  className?: string;
}

export const LMapLogo: React.FC<LMapLogoProps> = ({
  size = 'lg',
  showSubtitle = true,
  align = 'center',
  className = '',
}) => {
  const isCenter = align === 'center';

  const squircleSizes = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-14 h-14 rounded-2xl text-xl',
    xl: 'w-16 h-16 rounded-2xl text-2xl',
  };

  const titleSizes = {
    sm: 'text-sm font-black',
    md: 'text-base font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  return (
    <div className={`flex flex-col ${isCenter ? 'items-center text-center' : 'items-start text-left'} ${className}`}>
      {/* Royal Blue Squircle Badge with Gold Sparkle */}
      <div className="relative inline-block mb-3">
        {/* Soft Ambient Glow */}
        <div className="absolute -inset-1.5 rounded-3xl bg-blue-500/25 blur-lg pointer-events-none" />
        
        {/* Squircle Icon */}
        <div 
          className={`relative ${squircleSizes[size]} bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white font-black tracking-wider flex items-center justify-center shadow-xl shadow-blue-900/50 border border-blue-400/40`}
        >
          <span>LM</span>

          {/* Golden Star/Sparkle Pill at top-right corner matching user's image */}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30 border border-amber-200">
            <Sparkles size={11} className="text-slate-950 fill-slate-950" />
          </div>
        </div>
      </div>

      {/* Brand Title: L-MAP */}
      <div className="flex items-center gap-2 tracking-tight">
        <h1 className={`${titleSizes[size]} text-white font-black tracking-widest`}>
          L-MAP
        </h1>
      </div>

      {/* Subtitle: Lazuardi Mitra Administration Platform */}
      {showSubtitle && (
        <p className="text-xs sm:text-sm text-blue-200/90 font-medium mt-1 tracking-wide">
          Lazuardi Mitra Administration Platform
        </p>
      )}
    </div>
  );
};
