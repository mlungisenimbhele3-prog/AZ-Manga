import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { SubscriptionTier, UserSubscription } from '../../types';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';
import {
  Menu,
  MoreHorizontal,
  Search,
  BookOpen,
  Coins,
  Globe,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { FullScreenMenu } from './FullScreenMenu';

const loadNavigationDrawer = () => import('./NavigationDrawer');
const NavigationDrawer = lazy(() =>
  loadNavigationDrawer().then((m) => ({ default: m.NavigationDrawer }))
);

interface NavbarProps {
  currentLanguage: 'en' | 'zu' | 'af';
  setLanguage: (lang: 'en' | 'zu' | 'af') => void;
  isOledMode: boolean;
  toggleOledMode: () => void;
  userSubscription: UserSubscription;
  currentUserEmail?: string;
  onOpenProfileModal?: () => void;
  onUpgradeClick: () => void;
  onQuickToggleTier: (tier: SubscriptionTier, cycle?: 'monthly' | 'yearly') => void;
  onOpenPublish: () => void;
  onOpenCreatorDashboard: () => void;
  onOpenAwardsModal?: () => void;
  onOpenGlobalShare?: () => void;
  onOpenStoreModal?: () => void;
  onOpenPerformanceModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSecurityDefense?: () => void;
  onOpenFcmNotifications?: () => void;
  onOpenWebViewerModal?: () => void;
  onOpenApplyMangaka?: () => void;
  onOpenMangakaDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  appMode?: 'reader' | 'mangaka';
  onToggleAppMode?: () => void;
  unreadNotificationsCount?: number;
  performanceTier?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  favoritesCount?: number;
  dataSaverMode: boolean;
  onToggleDataSaver: () => void;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  isAdmin?: boolean;
  isCreator?: boolean;
  onSwitchUserEmail?: (email: string) => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  currentLanguage,
  setLanguage,
  isOledMode,
  toggleOledMode,
  userSubscription,
  currentUserEmail,
  isAdmin = false,
  isCreator = false,
  onOpenProfileModal,
  onUpgradeClick,
  onQuickToggleTier,
  onOpenPublish,
  onOpenCreatorDashboard,
  onOpenAwardsModal,
  onOpenGlobalShare,
  onOpenStoreModal,
  onOpenPerformanceModal,
  onOpenCommandPalette,
  onOpenSecurityDefense,
  onOpenFcmNotifications,
  onOpenWebViewerModal,
  onOpenApplyMangaka,
  onOpenMangakaDashboard,
  onOpenAdminDashboard,
  appMode = 'reader',
  onToggleAppMode,
  unreadNotificationsCount = 0,
  performanceTier = 'balanced',
  searchQuery,
  onSearchChange,
  selectedFilter,
  onSelectFilter,
  favoritesCount,
  dataSaverMode,
  onToggleDataSaver,
  activeTab = 'readers',
  onTabChange,
  onSwitchUserEmail,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreMenuOpen]);

  const isVipUser = userSubscription.tier !== 'free';

  return (
    <>
      <header
        id="main-navbar"
        className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md safe-top-inset"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Super Minimal Header: Exactly 3 visible items:
            (1) Left: Hamburger menu icon
            (2) Center: AZ OVERVERSE logo with AZ badge
            (3) Right: ••• 3 dots menu button */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 relative">
          {/* (1) Left: Hamburger menu icon */}
          <div className="flex items-center">
            <button
              id="hamburger-menu-btn"
              type="button"
              onPointerEnter={() => {
                void loadNavigationDrawer();
              }}
              onFocus={() => {
                void loadNavigationDrawer();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDrawerOpen(true);
              }}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
              aria-label="Open navigation menu drawer"
              title="Open navigation menu drawer"
            >
              <Menu className="w-5 h-5 text-amber-400" />
            </button>
          </div>

        {/* (2) Center: AZ OVERVERSE logo with AZ badge */}
        <div className="flex items-center justify-center">
          <button
            id="brand-logo-btn"
            onClick={() => {
              onTabChange?.('readers');
              onSelectFilter('all');
              onSearchChange('');
            }}
            className="flex items-center gap-2 group text-center transition active:scale-98"
            title="AZ OVERVERSE"
            aria-label="AZ OVERVERSE"
          >
            <div className="flex items-center justify-center p-0.5">
              <img
                src={APP_LOGO_SRC}
                alt="AZ OVERVERSE Logo"
                decoding="async"
                width={38}
                height={38}
                {...{ fetchpriority: 'high' }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0f0424] shadow-lg shadow-amber-500/25 object-cover"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wider text-white">
                OVER<span className="text-amber-400">VERSE</span>
              </span>
            </div>
          </button>
        </div>

        {/* (3) Right: Compact PWA Install action (auto-hidden when standalone) + ••• 3 dots menu button */}
        <div className="relative flex items-center gap-2" ref={moreMenuRef}>
          <PWAInstallButton compact onOpenStoreModal={onOpenStoreModal} />

          <button
            id="header-more-menu-btn"
            onClick={() => setIsMoreMenuOpen((prev) => !prev)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl border transition active:scale-95 shadow-sm ${
              isMoreMenuOpen
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 ring-2 ring-amber-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800'
            }`}
            aria-label="More options"
            title="Menu & Controls"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {/* Full-Screen Menu (slides in from right, covers 100% on mobile, 400px side panel on desktop) */}
          <FullScreenMenu
            isOpen={isMoreMenuOpen}
            onClose={() => setIsMoreMenuOpen(false)}
            currentUserEmail={currentUserEmail}
            userSubscription={userSubscription}
            isAdmin={isAdmin}
            isCreator={isCreator}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onTabChange={onTabChange}
            onSelectFilter={onSelectFilter}
            onUpgradeClick={onUpgradeClick}
            onQuickToggleTier={onQuickToggleTier}
            onOpenProfileModal={onOpenProfileModal}
            onOpenCreatorDashboard={onOpenCreatorDashboard}
            onOpenAdminDashboard={onOpenAdminDashboard}
            onOpenStoreModal={onOpenStoreModal}
            onOpenSecurityDefense={onOpenSecurityDefense}
            onOpenGlobalShare={onOpenGlobalShare}
            currentLanguage={currentLanguage}
            setLanguage={setLanguage}
            onLogout={() => {
              if (onSwitchUserEmail) {
                onSwitchUserEmail('reader@azoververse.com');
              }
              onTabChange?.('readers');
            }}
          />
        </div>
      </div>
    </header>

    {/* Hamburger Navigation Drawer - Lazy-mounted outside header only when opened */}
    {isDrawerOpen && (
      <Suspense fallback={null}>
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeTab={activeTab}
          onNavigate={(tab) => {
            onTabChange?.(tab);
            setIsDrawerOpen(false);
          }}
          userSubscription={userSubscription}
          currentUserEmail={currentUserEmail}
          isAdmin={isAdmin}
          isCreator={isCreator}
          onOpenProfileModal={onOpenProfileModal}
          onOpenPublish={onOpenPublish}
          onOpenSubscriptionModal={onUpgradeClick}
          onOpenCreatorDashboard={onOpenCreatorDashboard}
          onOpenApplyMangaka={onOpenApplyMangaka}
          onOpenMangakaDashboard={onOpenMangakaDashboard}
          onOpenAdminDashboard={onOpenAdminDashboard}
          appMode={appMode}
          onToggleAppMode={onToggleAppMode}
          onOpenPerformanceModal={onOpenPerformanceModal}
          onOpenCommandPalette={onOpenCommandPalette}
          onOpenSecurityDefense={onOpenSecurityDefense}
          onOpenFcmNotifications={onOpenFcmNotifications}
          onOpenWebViewerModal={onOpenWebViewerModal}
          onOpenStoreModal={onOpenStoreModal}
          performanceTier={performanceTier}
          isOledMode={isOledMode}
          toggleOledMode={toggleOledMode}
          dataSaverMode={dataSaverMode}
          onToggleDataSaver={onToggleDataSaver}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
      </Suspense>
    )}
  </>
);
};

export const Navbar = React.memo(NavbarComponent);
