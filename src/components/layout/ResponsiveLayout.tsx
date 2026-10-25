import React, { ReactNode, useEffect, useState } from 'react';

export interface ResponsiveLayoutProps {
  mobileView: ReactNode;
  desktopView: ReactNode;
  breakpoint?: number;
}

/**
 * ResponsiveLayout renders ONLY the active viewport branch (Desktop > 800px OR Mobile <= 800px)
 * via matchMedia, cutting home-screen DOM nodes, image decodes, and Framer Motion instances by 50%.
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  mobileView,
  desktopView,
  breakpoint = 800,
}) => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(`(min-width: ${breakpoint + 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    setIsDesktop(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, [breakpoint]);

  return <div className="w-full">{isDesktop ? desktopView : mobileView}</div>;
};
