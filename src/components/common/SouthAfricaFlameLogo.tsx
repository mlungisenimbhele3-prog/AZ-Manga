import React from 'react';

interface SouthAfricaFlameLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'sa_flag' | 'rainbow';
  className?: string;
  withContainer?: boolean;
}

export const SouthAfricaFlameLogo: React.FC<SouthAfricaFlameLogoProps> = ({
  size = 'md',
  className = '',
  withContainer = false,
}) => {
  const sizeMap = {
    xs: { px: 18, box: 'h-6 w-6' },
    sm: { px: 24, box: 'h-7 w-7' },
    md: { px: 32, box: 'h-9 w-9' },
    lg: { px: 44, box: 'h-12 w-12' },
    xl: { px: 56, box: 'h-16 w-16' },
  };

  const { px, box } = sizeMap[size] || sizeMap.md;

  const logoImg = (
    <img
      src="/master-logo.png"
      alt="AZ OVERVERSE Logo"
      width={px}
      height={px}
      className={`shrink-0 rounded-full object-contain shadow-sm drop-shadow-md select-none pointer-events-none ring-1 ring-amber-400/30 ${className}`}
      style={{ width: `${px}px`, height: `${px}px` }}
      loading="eager"
    />
  );

  if (!withContainer) {
    return logoImg;
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-slate-950/90 border border-amber-500/40 p-1 shadow-md shadow-amber-950/40 group-hover:scale-105 transition-all overflow-hidden ${box}`}
    >
      <div className="absolute inset-0 opacity-30 blur-sm bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500" />
      <div className="relative z-10">{logoImg}</div>
    </div>
  );
};

export default SouthAfricaFlameLogo;
