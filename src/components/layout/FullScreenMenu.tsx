import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  X,
  User,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Settings,
  Bookmark,
  Sparkles,
  BookOpen,
  Users,
  Coins,
  Globe,
  Smartphone,
  HelpCircle,
  FileText,
  LogOut,
  Search,
  ExternalLink,
  ChevronRight,
  Bell,
  Volume2,
  Lock,
} from 'lucide-react';
import { UserSubscription, SubscriptionTier } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  getCreatorAuthState,
  subscribeToCreatorAuth,
  signOutCreatorAccount,
} from '../../services/userProfile';

export interface FullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  userSubscription: UserSubscription;
  isAdmin?: boolean;
  isCreator?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onTabChange?: (tab: any) => void;
  onSelectFilter: (filter: string) => void;
  onUpgradeClick: () => void;
  onQuickToggleTier: (tier: SubscriptionTier, cycle?: 'monthly' | 'yearly') => void;
  onOpenProfileModal?: () => void;
  onOpenCreatorDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenStoreModal?: () => void;
  onOpenSecurityDefense?: () => void;
  onOpenGlobalShare?: () => void;
  currentLanguage: 'en' | 'zu' | 'af';
  setLanguage: (lang: 'en' | 'zu' | 'af') => void;
  onLogout?: () => void;
}

export const FullScreenMenu: React.FC<FullScreenMenuProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  userSubscription,
  isAdmin: rawIsAdmin = false,
  isCreator: rawIsCreator = false,
  searchQuery,
  onSearchChange,
  onTabChange,
  onSelectFilter,
  onUpgradeClick,
  onQuickToggleTier,
  onOpenProfileModal,
  onOpenCreatorDashboard,
  onOpenAdminDashboard,
  onOpenStoreModal,
  onOpenSecurityDefense,
  onOpenGlobalShare,
  currentLanguage,
  setLanguage,
  onLogout,
}) => {
  const [creatorAuth, setCreatorAuth] = useState(() => getCreatorAuthState());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCreatorAuth((st) => setCreatorAuth(st));
    return unsub;
  }, []);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  const user = creatorAuth.authUser;
  const profile = creatorAuth.profile;

  const email = user?.email || currentUserEmail || 'reader@azoververse.com';
  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'AZ Oververse Reader';
  const penName = profile?.penName || user?.pen_name || (profile?.isCreator ? 'Verified Creator' : null);
  const avatarUrl = profile?.avatarUrl || user?.avatar_url;

  const adminEmails = ['mlungisenimbhele3@gmail.com', 'mlungisenimbhele@gmail.com'];
  const isEmailAdmin = adminEmails.includes(email.toLowerCase().trim());
  const isAdmin = rawIsAdmin || isEmailAdmin || user?.role === 'admin';
  const isCreator = rawIsCreator || creatorAuth.hasCreatorAccount || profile?.isCreator;
  const isVipUser = userSubscription.tier === 'vip';

  const handleLogoutClick = async () => {
    try {
      await signOutCreatorAccount();
    } catch {
      // fallback
    }
    if (onLogout) {
      onLogout();
    }
    setShowLogoutConfirm(false);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          id="az-fullscreen-menu-portal"
          className="fixed inset-0 z-[100] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="AZ OVERVERSE Full Menu"
        >
          {/* Backdrop on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Full-screen sliding drawer (100% on mobile, 400px side-panel on desktop) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full md:w-[400px] h-full bg-[#0a0d14] text-slate-100 flex flex-col shadow-2xl border-l border-slate-800/80 overflow-hidden"
          >
            {/* Top Bar: Back arrow on Left, Title "Menu" in Middle, X button on Right */}
            <div
              className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shrink-0 select-none"
              style={{ paddingTop: 'max(0.85rem, env(safe-area-inset-top, 0px))' }}
            >
              <button
                type="button"
                id="fullscreen-menu-back-btn"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition"
                aria-label="Back"
                title="Back to previous page"
              >
                <ArrowLeft className="w-5 h-5 text-amber-400" />
              </button>

              <h2 className="text-base font-bold text-white tracking-wide font-sans">
                Menu
              </h2>

              <button
                type="button"
                id="fullscreen-menu-close-btn"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 active:scale-95 transition"
                aria-label="Close Menu"
                title="Close Menu"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Scrollable Menu Body */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 smooth-scroll-container"
              style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search original manga, creators, genres..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none transition shadow-inner"
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

              {/* 1. My Profile Card */}
              <div
                onClick={() => {
                  if (onOpenProfileModal) {
                    onOpenProfileModal();
                    onClose();
                  } else {
                    onTabChange?.('settings');
                    onClose();
                  }
                }}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition group"
                role="button"
                tabIndex={0}
                aria-label="View My Profile"
              >
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/40 group-hover:border-amber-400 transition"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  {isVipUser && (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-purple-600 text-[9px] font-black text-white rounded-md uppercase tracking-wider shadow">
                      VIP
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
                      {displayName}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition shrink-0" />
                  </div>
                  {penName && (
                    <p className="text-xs font-semibold text-amber-400/90 truncate">
                      Pen Name: {penName}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    {email}
                  </p>
                </div>
              </div>

              {/* 2. Primary Navigation List Items */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  Main Sections
                </span>

                {/* Dashboard (Creator Dashboard) */}
                <button
                  type="button"
                  id="menu-item-dashboard"
                  onClick={() => {
                    if (onOpenCreatorDashboard) {
                      onOpenCreatorDashboard();
                    } else {
                      onTabChange?.('dashboard');
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-left transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                        Dashboard
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Creator Studio, chapter uploads & analytics
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                </button>

                {/* Admin Panel (STRICTLY HIDDEN if user is NOT admin) */}
                {isAdmin && (
                  <button
                    type="button"
                    id="menu-item-admin"
                    onClick={() => {
                      if (onOpenAdminDashboard) {
                        onOpenAdminDashboard();
                      } else {
                        onTabChange?.('admin');
                      }
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/50 text-left transition group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/25 text-purple-300 border border-purple-500/50">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
                          <span>Admin Panel</span>
                          <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            Mlungiseni
                          </span>
                        </div>
                        <div className="text-[10px] text-purple-300/70">
                          Review pending uploads, approve mangas & system controls
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition" />
                  </button>
                )}

                {/* Settings (Notifications, Push Alerts, Blocked Users, Language) */}
                <button
                  type="button"
                  id="menu-item-settings"
                  onClick={() => {
                    onTabChange?.('settings');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-left transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        Settings
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Notifications, push alerts, blocked users, language
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                </button>

                {/* My Library / Bookmarks */}
                <button
                  type="button"
                  id="menu-item-library"
                  onClick={() => {
                    onSelectFilter('favorites');
                    onTabChange?.('readers');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-left transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        My Library / Bookmarks
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Saved manga series & reading history
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                </button>

                {/* Wallet / VIP: Go VIP R89/mo */}
                <button
                  type="button"
                  id="menu-item-wallet-vip"
                  onClick={() => {
                    onUpgradeClick();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-left transition group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-black shadow-md font-bold">
                      <Sparkles className="w-4 h-4 fill-black" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">
                          Wallet / VIP
                        </span>
                        <span className="text-[10px] font-mono font-bold text-black bg-amber-400 px-1.5 py-0.2 rounded">
                          R89/mo
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Zero ads, offline reads & support creators
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition">
                    Go VIP →
                  </span>
                </button>
              </div>

              {/* 3. Catalog & Followed Creators (Preserved Existing Navigation) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  Manga & Creators
                </span>

                {/* Read Library */}
                <button
                  type="button"
                  onClick={() => {
                    onTabChange?.('readers');
                    onSelectFilter('all');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      All Manga Catalog
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Browse →</span>
                </button>

                {/* Followed Creators */}
                <button
                  type="button"
                  onClick={() => {
                    onTabChange?.('following');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Followed Creators
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">View Alerts →</span>
                </button>
              </div>

              {/* 4. Monetization & App Hub (Preserved Existing Menu Items) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  <span>Monetization & App Hub</span>
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                </div>

                {/* 70% Creator Rev-Share */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCreatorDashboard) {
                      onOpenCreatorDashboard();
                    } else {
                      onTabChange?.('dashboard');
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-500/30 text-left transition"
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

                {/* Live ZAR Payouts */}
                <div className="flex items-center justify-between rounded-xl p-2.5 bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🇿🇦</span>
                    <span className="font-semibold text-slate-200">Live ZAR Payouts</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">
                    Instant Gross Settlement
                  </span>
                </div>

                {/* Reading Tier Toggle */}
                <div className="flex items-center justify-between rounded-xl p-2 bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-[11px] font-semibold text-slate-300">Reading Tier:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 border border-slate-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => onQuickToggleTier('free')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        userSubscription.tier === 'free'
                          ? 'bg-amber-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Free (Ads)
                    </button>
                    <button
                      type="button"
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

                {/* PWA Install */}
                <PWAInstallButton
                  fullWidth
                  alwaysShowInMenu
                  onOpenStoreModal={() => {
                    onClose();
                    onOpenStoreModal?.();
                  }}
                />

                {/* Play Store Hub */}
                {onOpenStoreModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStoreModal();
                    }}
                    className="min-h-[44px] w-full flex items-center justify-between rounded-xl p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-200">
                        AZ OVERVERSE Play Store Hub
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">com.azoververse.oververse</span>
                  </button>
                )}

                {/* Download Signed AAB */}
                <a
                  href="/AZ-OVERVERSE-signed.aab"
                  download="AZ-OVERVERSE-signed.aab"
                  onClick={onClose}
                  className="min-h-[44px] w-full flex items-center justify-between rounded-xl p-2.5 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/40 text-left transition"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-cyan-200">
                      Download AZ-OVERVERSE-signed.aab
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">v1.0.2 Signed</span>
                </a>

                {/* Defense x5 Security */}
                {onOpenSecurityDefense && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSecurityDefense();
                      onClose();
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

                {/* Global Live Status */}
                {onOpenGlobalShare && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGlobalShare();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between rounded-xl p-2 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-500/30 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span className="text-xs font-semibold text-blue-200">Global Live Status</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">Online 🟢</span>
                  </button>
                )}
              </div>

              {/* 5. Help & Support + Legal */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                  Support & Policies
                </span>

                {/* Help & Support */}
                <button
                  type="button"
                  id="menu-item-help"
                  onClick={() => setShowHelpModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Help & Support
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Contact →</span>
                </button>

                {/* Privacy Policy */}
                <button
                  type="button"
                  id="menu-item-privacy"
                  onClick={() => {
                    onTabChange?.('privacy');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Privacy Policy
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Terms of Service */}
                <button
                  type="button"
                  id="menu-item-terms"
                  onClick={() => {
                    onTabChange?.('terms');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Terms of Service
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Content Rules */}
                <button
                  type="button"
                  id="menu-item-content-rules"
                  onClick={() => {
                    onTabChange?.('content-rules');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Content & Age Rating Rules
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Rules →
                  </span>
                </button>

                {/* Producer Credit */}
                <div className="flex items-center gap-2.5 rounded-xl p-2.5 bg-slate-900/40 border border-slate-800/60 text-xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                    🎬
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                      Executive Producer
                    </div>
                    <div className="text-xs font-bold text-amber-300">
                      Produced by Mlungiseni Mbhele
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Log Out - In Red at the Bottom */}
              <div className="pt-3 border-t border-slate-800/80">
                {showLogoutConfirm ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 space-y-2.5">
                    <p className="text-xs font-semibold text-red-200">
                      Are you sure you want to log out?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition active:scale-95 shadow-sm"
                      >
                        Yes, Log Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="fullscreen-menu-logout-btn"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-bold text-xs py-3 px-4 transition active:scale-98"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Help & Support Modal */}
          {showHelpModal && (
            <div
              className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowHelpModal(false)}
            >
              <div
                className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Help & Support</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <p>
                    Need assistance with chapter uploads, creator monetization, or reading subscriptions?
                  </p>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="text-slate-400">Direct Support Email:</div>
                    <a
                      href="mailto:mlungisenimbhele3@gmail.com"
                      className="text-amber-400 hover:underline block break-all font-bold"
                    >
                      mlungisenimbhele3@gmail.com
                    </a>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5 text-[11px]">
                    <span className="font-semibold text-slate-200">Creator Earnings Notice:</span>
                    <p className="text-slate-400 leading-relaxed">
                      AZ OVERVERSE creators receive 70% revenue share paid out monthly via Gross Settlement.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
