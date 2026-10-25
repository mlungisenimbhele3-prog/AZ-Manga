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
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
        className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md"
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
                width={36}
                height={36}
                {...{ fetchpriority: 'high' }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black shadow-lg shadow-amber-500/25 object-cover ring-1 ring-amber-400/50"
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

          {/* ••• 3 Dots Dropdown Menu */}
          {isMoreMenuOpen && (
            <div
              id="header-3dots-dropdown"
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl shadow-2xl p-4 z-50 space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* [Search] */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="dropdown-search-input"
                  type="text"
                  placeholder="Search original manga, creators, or genres..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/95 pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none transition shadow-inner"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* --- Section 1: Reader --- */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  <span>Section 1: Reader</span>
                  <BookOpen className="w-3 h-3 text-amber-400" />
                </div>

                {/* [Read Library] */}
                <button
                  onClick={() => {
                    onTabChange?.('readers');
                    onSelectFilter('all');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        Read Library
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Explore full original manga catalog
                      </div>
                    </div>
                  </div>
                  <span className="text-amber-400 text-xs font-bold">Open →</span>
                </button>

                {/* PWA Install Button & App Hub */}
                <PWAInstallButton
                  fullWidth
                  alwaysShowInMenu
                  onOpenStoreModal={() => {
                    setIsMoreMenuOpen(false);
                    onOpenStoreModal?.();
                  }}
                />

                {onOpenStoreModal && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenStoreModal();
                    }}
                    className="min-h-[44px] w-full flex items-center justify-between rounded-xl p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-200">
                        OVERVERSE App &amp; TWA Hub
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">com.oververse.app</span>
                  </button>
                )}

                {/* Shield/Security icon */}
                {onOpenSecurityDefense && (
                  <button
                    onClick={() => {
                      onOpenSecurityDefense();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl p-2 bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/80 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-200">Defense ×5 Security Suite</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Active
                    </span>
                  </button>
                )}
              </div>

              {/* --- Section 2: Monetization --- */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  <span>Section 2: Monetization</span>
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                </div>

                {/* [70% Creator Rev-Share info] */}
                <button
                  onClick={() => {
                    onOpenCreatorDashboard();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-left transition"
                  title="View Creator Monetization"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-300">
                        70% Creator Rev-Share
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Google AdMob · Google Play Billing
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    70%
                  </span>
                </button>

                {/* [Live ZAR Payouts] */}
                <div className="flex items-center justify-between rounded-xl p-2 bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🇿🇦</span>
                    <span className="font-semibold text-slate-200">Live ZAR Payouts</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">
                    Instant Gross Settlement
                  </span>
                </div>

                {/* [Global Live Status] */}
                {onOpenGlobalShare && (
                  <button
                    onClick={() => {
                      onOpenGlobalShare();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl p-2 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-500/30 text-left transition"
                    title="View Global Live deployment status"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span className="text-xs font-semibold text-blue-200">Global Live Status</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      Online 🟢
                    </span>
                  </button>
                )}

                {/* [Free / VIP Toggle] */}
                <div className="flex items-center justify-between rounded-xl p-2 bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[11px] font-semibold text-slate-300">Reading Tier:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5">
                    <button
                      onClick={() => onQuickToggleTier('free')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        userSubscription.tier === 'free'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Free (With Ads)
                    </button>
                    <button
                      onClick={() => onQuickToggleTier('vip')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        isVipUser
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      VIP (Zero Ads)
                    </button>
                  </div>
                </div>

                {/* [Go VIP R89/mo - orange button] */}
                <button
                  onClick={() => {
                    onUpgradeClick();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-2.5 px-3 text-xs shadow-lg shadow-amber-500/20 transition active:scale-98"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Go VIP R89/mo</span>
                </button>
              </div>

              {/* --- Section 3: Creator --- */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  <span>Section 3: Creator</span>
                  <Crown className="w-3 h-3 text-amber-400" />
                </div>

                {/* [Produced by Mlungiseni Mbhele] */}
                <div className="flex items-center gap-2.5 rounded-xl p-2.5 bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-base">
                    🎬
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Executive Producer
                    </div>
                    <div className="text-xs font-bold text-amber-300">
                      Produced by Mlungiseni Mbhele
                    </div>
                  </div>
                </div>

                {/* [Admin Panel] */}
                <div className="flex items-center gap-2">
                  {onOpenAdminDashboard && (
                    <button
                      onClick={() => {
                        onOpenAdminDashboard();
                        setIsMoreMenuOpen(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 text-purple-200 py-2 px-3 text-xs font-bold transition shadow-sm"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  {onSwitchUserEmail && (
                    <button
                      onClick={() => {
                        onSwitchUserEmail(isAdmin ? 'reader@example.com' : 'mlungisenimbhele3@gmail.com');
                        setIsMoreMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition border shadow-sm ${
                        isAdmin
                          ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Toggle Admin role"
                    >
                      <span>{isAdmin ? '👑 Admin (Mlungiseni)' : '👤 Role: Reader'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
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
