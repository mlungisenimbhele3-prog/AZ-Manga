import React from 'react';

export const APP_LOGO_SRC =
  '/assets/aistudio/IMG-20261030-WA4361_fe49230b.jpg';

interface KAAfricaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const KAAfricaLogo: React.FC<KAAfricaLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-2xl',
    '2xl': 'w-28 h-28 rounded-3xl',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden bg-[#0f0424] shadow-lg shadow-amber-500/20 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title="AZ OVERVERSE Logo"
      aria-label="AZ OVERVERSE"
      role="img"
    >
      <img
        src={APP_LOGO_SRC}
        alt="AZ OVERVERSE"
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );
};

export const AZLogo = KAAfricaLogo;
export default KAAfricaLogo;
