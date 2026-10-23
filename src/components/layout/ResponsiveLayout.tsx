import React, { ReactNode } from 'react';

export interface ResponsiveLayoutProps {
  mobileView: ReactNode;
  desktopView: ReactNode;
  breakpoint?: number;
}

/**
 * ResponsiveLayout switches between mobileView and desktopView
 * based on the 800px breakpoint.
 * - Width > 800px: Desktop Shonen Jump magazine layout (Sidebar + 4-col Manga Grid + Right Featured Banner)
 * - Width <= 800px: Mobile phone layout with 2-col Manga Grid and Bottom Navigation Tabs
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  mobileView,
  desktopView,
}) => {
  return (
    <div className="w-full">
      {/* Desktop view (> 800px) */}
      <div className="hidden min-[801px]:block w-full">
        {desktopView}
      </div>
      {/* Mobile phone view (<= 800px) */}
      <div className="block min-[801px]:hidden w-full">
        {mobileView}
      </div>
    </div>
  );
};
