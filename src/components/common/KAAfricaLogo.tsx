import React from 'react';

export const APP_LOGO_SRC =
  '/assets/aistudio/az_oververse_black_silver_transparent_29ae4c4c.png';

interface KAAfricaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const KAAfricaLogo: React.FC<KAAfricaLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-black shadow-lg shadow-amber-500/20 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title="AZ OVERVERSE Logo"
      aria-label="AZ OVERVERSE"
      role="img"
    >
      <img
        src={APP_LOGO_SRC}
        alt="AZ OVERVERSE"
        className="w-full h-full object-contain rounded-full select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );
};

export const AZLogo = KAAfricaLogo;
export default KAAfricaLogo;
