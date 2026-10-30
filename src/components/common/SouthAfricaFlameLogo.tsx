import React from 'react';
import { APP_LOGO_SRC } from './KAAfricaLogo';

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
    xs: { px: 20, imgClass: 'h-5 w-5', box: 'h-6 w-6' },
    sm: { px: 26, imgClass: 'h-6.5 w-6.5', box: 'h-7 w-7' },
    md: { px: 34, imgClass: 'h-8.5 w-8.5', box: 'h-9 w-9' },
    lg: { px: 44, imgClass: 'h-11 w-11', box: 'h-12 w-12' },
    xl: { px: 56, imgClass: 'h-14 w-14', box: 'h-16 w-16' },
  };

  const { px, imgClass, box } = sizeMap[size] || sizeMap.md;

  const logoImg = (
    <img
      src={APP_LOGO_SRC}
      alt="AZ OVERVERSE Logo"
      width={px}
      height={px}
      className={`shrink-0 rounded-lg bg-[#0f0424] object-cover shadow-sm select-none pointer-events-none ${imgClass} ${className}`}
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
      <div className="relative z-10">{logoImg}</div>
    </div>
  );
};

export default SouthAfricaFlameLogo;
