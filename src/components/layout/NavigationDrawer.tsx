import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  FileText,
  BookOpen,
  Trophy,
  MessageSquare,
  Wallet,
  UploadCloud,
  Sparkles,
  Zap,
  Moon,
  Sun,
  ChevronRight,
  ExternalLink,
  Info,
  Sliders,
  Keyboard,
  Gauge,
  BellRing,
  Smartphone,
  Flame,
  User,
  Calendar,
  CreditCard,
  Settings,
  Layers,
} from 'lucide-react';
import { KAAfricaLogo } from '../common/KAAfricaLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { SubscriptionTier, UserSubscription } from '../../types';
import { getReadingStreak, ReadingStreakData, getWeeklyStreakDays } from '../../utils/readingStreak';
import { isUserApprovedMangaka, getMangakaApplicationByEmail } from '../../utils/mangakaManager';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (tab: any) => void;
  userSubscription?: UserSubscription;
  currentUserEmail?: string;
  onOpenProfileModal?: () => void;
  onOpenPublish?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenCreatorDashboard?: () => void;
  onOpenApplyMangaka?: () => void;
  onOpenMangakaDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  appMode?: 'reader' | 'mangaka';
  onToggleAppMode?: () => void;
  onOpenPerformanceModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSecurityDefense?: () => void;
  onOpenFcmNotifications?: () => void;
  onOpenWebViewerModal?: () => void;
  performanceTier?: string;
  isOledMode?: boolean;
  toggleOledMode?: () => void;
  dataSaverMode?: boolean;
  onToggleDataSaver?: () => void;
  currentLanguage?: 'en' | 'zu' | 'af';
  setLanguage?: (lang: 'en' | 'zu' | 'af') => void;
  isAdmin?: boolean;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onNavigate,
  userSubscription,
  currentUserEmail = 'mlungisenimbhele3@gmail.com',
  isAdmin: isAdminProp,
  onOpenProfileModal,
  onOpenPublish,
  onOpenSubscriptionModal,
  onOpenCreatorDashboard,
  onOpenApplyMangaka,
  onOpenMangakaDashboard,
  onOpenAdminDashboard,
  appMode = 'reader',
  onToggleAppMode,
  onOpenPerformanceModal,
  onOpenCommandPalette,
  onOpenSecurityDefense,
  onOpenFcmNotifications,
  onOpenWebViewerModal,
  performanceTier = 'balanced',
  isOledMode,
  toggleOledMode,
  dataSaverMode,
  onToggleDataSaver,
  currentLanguage = 'en',
  setLanguage,
}) => {
  const [streakData, setStreakData] = useState<ReadingStreakData>(() => getReadingStreak());

  useEffect(() => {
    if (isOpen) {
      setStreakData(getReadingStreak());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStreakSync = (e: any) => {
      if (e.detail?.streak) {
        setStreakData(e.detail.streak);
      } else {
        setStreakData(getReadingStreak());
      }
    };
    window.addEventListener('ka_pulse_streak_updated', handleStreakSync);
    return () => window.removeEventListener('ka_pulse_streak_updated', handleStreakSync);
  }, []);

  const weeklyDays = getWeeklyStreakDays(streakData);
  const isApprovedMangaka = isUserApprovedMangaka(currentUserEmail);
  const mangakaApp = getMangakaApplicationByEmail(currentUserEmail);
  const ADMIN_EMAILS = ['mlungisenimbhele3@gmail.com', 'azoververse@gmail.com'];
  const isAdmin = typeof isAdminProp === 'boolean' ? isAdminProp : ADMIN_EMAILS.includes(currentUserEmail.toLowerCase());

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLinkClick = (
    e: React.MouseEvent,
    tab: 'readers' | 'creators' | 'chats' | 'wallet' | 'privacy' | 'terms' | 'awards' | 'settings' | 'backdrop'
  ) => {
    e.preventDefault();
    onNavigate(tab);
    onClose();
  };

  const drawerElement = (
    <div
      id="hamburger-navigation-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
      className="fixed inset-0 z-50 flex pointer-events-auto"
    >
      {/* Dimmed Overlay Backdrop - Click to Close */}
      <div
        id="drawer-backdrop-overlay"
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fadeIn cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 border-r border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-50 overflow-y-auto overscroll-y-contain animate-slideRight">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="p-0.5">
              <img
                src="/master-logo.png"
                alt="AZ Master Logo"
                className="w-8 h-8 rounded-full shadow-lg shadow-amber-500/25 object-contain ring-1 ring-amber-400/50"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wider text-white">
                  OVER<span className="text-amber-400">VERSE</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Produced by Mlungiseni Mbhele</p>
            </div>
          </div>

          <button
            id="close-hamburger-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 sm:p-5 flex-1 space-y-6">
          {/* User Profile & Daily Reading Streak Card */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/60 via-slate-900 to-orange-950/40 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-sm">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-amber-400 text-xs">
                    {currentUserEmail.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      Mlungiseni Mbhele
                    </span>
                    <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-black px-1 py-0.2">
                      PRODUCER
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate block max-w-[150px]">
                    {currentUserEmail}
                  </span>
                </div>
              </div>

              {onOpenProfileModal && (
                <button
                  id="drawer-open-profile-btn"
                  onClick={() => {
                    onClose();
                    onOpenProfileModal();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-200 transition"
                >
                  View Profile
                </button>
              )}
            </div>

            {/* Streak Counter Hero */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-amber-500/50 flex items-center justify-center shadow-inner">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-lg font-black text-white">
                      {streakData.currentStreak}
                    </span>
                    <span className="text-xs font-bold text-amber-400 uppercase">
                      {streakData.currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {streakData.tierTitle}
                  </span>
                </div>
              </div>

              <div className="text-right">
                {streakData.todayRead ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Today Done
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-300 animate-pulse">
                    Today Pending
                  </span>
                )}
                <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                  Record: {streakData.longestStreak}d
                </div>
              </div>
            </div>

            {/* 7-day mini week dots */}
            <div className="grid grid-cols-7 gap-1 mt-3 pt-2.5 border-t border-white/5">
              {weeklyDays.map((day, idx) => (
                <div
                  key={`nav-drawer-day-${day.dayShort}-${idx}`}
                  className={`flex flex-col items-center justify-center py-1 rounded-md text-[8px] font-bold ${
                    day.completed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : day.isToday
                      ? 'bg-slate-800 text-white border border-amber-400/60'
                      : 'bg-slate-900/60 text-slate-500'
                  }`}
                  title={`${day.date}: ${day.completed ? 'Completed' : day.isToday ? 'Today' : 'Missed'}`}
                >
                  <span>{day.dayShort[0]}</span>
                  <div className="mt-0.5">
                    {day.completed ? (
                      <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {onOpenProfileModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenProfileModal();
                }}
                className="w-full mt-3 py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>Daily Streak & Habit Details</span>
                <ChevronRight className="w-3 h-3 text-amber-400" />
              </button>
            )}
          </div>

          {/* Quick VIP Pass CTA */}
          {userSubscription && onOpenSubscriptionModal && (
            userSubscription.tier === 'free' ? (
              <div className="rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/60 border border-purple-500/30 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    AZ VIP Pass
                  </span>
                  <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 font-bold">
                    R89/mo
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Read all chapters ad-free, unlock fast simulpubs, and support African creators.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSubscriptionModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black hover:opacity-95 transition shadow"
                >
                  Upgrade to VIP Pass
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">
                    {userSubscription.planName}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Expires {userSubscription.expiresAt} • 70% direct creator share
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSubscriptionModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manage Subscription & Purchases</span>
                </button>
              </div>
            )
          )}

          {/* Legal & Compliance Section - Highlighted for User Request */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal & Policies</span>
              <span className="rounded bg-amber-400/20 text-[9px] text-amber-300 font-bold px-1.5 py-0.2">
                Official
              </span>
            </div>

            <div className="space-y-1.5">
              {/* Link to /privacy */}
              <a
                id="drawer-link-privacy"
                href="/privacy"
                onClick={(e) => handleLinkClick(e, 'privacy')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'privacy'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span>Privacy Policy</span>
                      <span className="text-[10px] font-mono text-slate-400">/privacy</span>
                    </div>
                    <p className="text-[11px] text-slate-400">POPIA compliance, Firebase & data safety</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Link to /terms */}
              <a
                id="drawer-link-terms"
                href="/terms"
                onClick={(e) => handleLinkClick(e, 'terms')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'terms'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span>Terms of Service</span>
                      <span className="text-[10px] font-mono text-slate-400">/terms</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Content rights, copyright & reader rules</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Link to /settings */}
              <a
                id="drawer-link-settings"
                href="/settings"
                onClick={(e) => handleLinkClick(e, 'settings')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'settings'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span>Settings & Controls</span>
                      <span className="text-[10px] font-mono text-slate-400">/settings</span>
                    </div>
                    <p className="text-[11px] text-slate-400">120Hz smoothness, email & terms</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          </div>

          {/* Navigation Hub */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore Pages</span>
            </div>

            <div className="space-y-1.5">
              {/* Readers Page */}
              <a
                id="drawer-link-readers"
                href="/"
                onClick={(e) => handleLinkClick(e, 'readers')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'readers'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800/90 text-slate-300 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold">Reader Hub</span>
                    <p className="text-[11px] text-slate-400">Catalog, Chapters & Trending Manga</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* AZ Backdrop Page */}
              <a
                id="drawer-link-backdrop"
                href="/#backdrop"
                onClick={(e) => handleLinkClick(e, 'backdrop')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'backdrop'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800/90 text-slate-300 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold">AZ Backdrop</span>
                    <p className="text-[11px] text-slate-400">Indie & Rising Creator Serializations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Creator Studio Page */}
              <a
                id="drawer-link-creators"
                href="/#creators"
                onClick={(e) => handleLinkClick(e, 'creators')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'creators'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800/90 text-slate-300 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold">Creator Studio</span>
                    <p className="text-[11px] text-slate-400">My Earnings, Reads & 70% Ad Splits</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Awards Page */}
              <a
                id="drawer-link-awards"
                href="/#awards"
                onClick={(e) => handleLinkClick(e, 'awards')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'awards'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800/90 text-slate-300 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold">Manga of the Year 2026</span>
                    <p className="text-[11px] text-slate-400">Annual African Manga Gala & Winners</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Chats Page */}
              <a
                id="drawer-link-chats"
                href="/#chats"
                onClick={(e) => handleLinkClick(e, 'chats')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                  activeTab === 'chats'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800/90 text-slate-300 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold">Community Chat</span>
                    <p className="text-[11px] text-slate-400">Discussions with authors and fans</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
              </a>

              {/* Wallet Page - ONLY available and visible to Admin */}
              {isAdmin && (
                <a
                  id="drawer-link-wallet"
                  href="/#wallet"
                  onClick={(e) => handleLinkClick(e, 'wallet')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${
                    activeTab === 'wallet'
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                      : 'bg-slate-900/60 hover:bg-slate-800/90 text-slate-300 border border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold">Creator Wallet</span>
                      <p className="text-[11px] text-slate-400">Live ZAR Payouts & 70% Ad Splits</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                </a>
              )}
            </div>
          </div>

          {/* Mangaka Mode & Creator Hub */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Mangaka & Creator Mode</span>
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                isApprovedMangaka
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isApprovedMangaka ? 'Verified Creator' : 'Reader Account'}
              </span>
            </div>

            {/* Mode Switcher */}
            {onToggleAppMode && (
              <div className="mb-2 p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1">
                <button
                  onClick={() => {
                    if (appMode !== 'reader') onToggleAppMode();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    appMode === 'reader'
                      ? 'bg-amber-500 text-black font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Reader Mode</span>
                </button>
                <button
                  onClick={() => {
                    if (appMode !== 'mangaka') onToggleAppMode();
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    appMode === 'mangaka'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Mangaka Mode</span>
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              {/* Mangaka Dashboard or Apply */}
              {isApprovedMangaka ? (
                <button
                  id="drawer-mangaka-dashboard-btn"
                  onClick={() => {
                    onClose();
                    onOpenMangakaDashboard?.();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-950/60 to-slate-900 hover:from-amber-900/70 border border-amber-500/40 text-amber-300 transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Mangaka Dashboard</div>
                      <p className="text-[11px] text-slate-300">My Mangas, Views & 70% ZAR Splits</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
                </button>
              ) : (
                <button
                  id="drawer-apply-mangaka-btn"
                  onClick={() => {
                    onClose();
                    onOpenApplyMangaka?.();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Become a Mangaka</div>
                      <p className="text-[11px] text-slate-300">Apply with Name, Bio & ID Photo</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}

              {/* Upload Manga Button (For approved mangakas) */}
              {isApprovedMangaka && onOpenPublish && (
                <button
                  id="drawer-upload-manga-btn"
                  onClick={() => {
                    onClose();
                    onOpenPublish();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-black text-xs transition shadow"
                >
                  <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                  <span>+ UPLOAD MANGA (Chapter 1)</span>
                </button>
              )}

              {/* Admin Dashboard (For Executive Producer Mlungiseni Mbhele) */}
              {isAdmin && onOpenAdminDashboard && (
                <button
                  id="drawer-admin-dashboard-btn"
                  onClick={() => {
                    onClose();
                    onOpenAdminDashboard();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 transition group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Your Admin Dashboard</div>
                      <p className="text-[11px] text-slate-400">Approve / Reject / Feature Manga</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}

              {/* Creator Studio & Payouts */}
              {onOpenCreatorDashboard && (
                <button
                  id="drawer-studio-btn"
                  onClick={() => {
                    onClose();
                    onOpenCreatorDashboard();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Studio Payouts (Google Play & AdMob)</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          {/* Device & Experience Preferences */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3 px-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span>Preferences</span>
              {setLanguage && (
                <LanguageSwitcher currentLanguage={currentLanguage} setLanguage={setLanguage} />
              )}
            </div>

            <div className="space-y-2">
              {/* OLED Theme Toggle */}
              {toggleOledMode && (
                <button
                  onClick={toggleOledMode}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    {isOledMode ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                    <span>{isOledMode ? 'OLED Black Active' : 'Slate Dark Theme'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isOledMode ? 'Pure Black' : 'Dark'}
                  </span>
                </button>
              )}

              {/* Data Saver Toggle */}
              {onToggleDataSaver && (
                <button
                  onClick={onToggleDataSaver}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                    dataSaverMode
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${dataSaverMode ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                    <span>Data Saver Mode</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${dataSaverMode ? 'bg-amber-400 text-black font-black' : 'bg-slate-800 text-slate-400'}`}>
                    {dataSaverMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* Device Performance & FPS Profile */}
              {onOpenPerformanceModal && (
                <button
                  id="drawer-performance-btn"
                  onClick={() => {
                    onClose();
                    onOpenPerformanceModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span>Device Performance Engine</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {performanceTier}
                  </span>
                </button>
              )}

              {/* Productivity Command Palette (Ctrl+K) */}
              {onOpenCommandPalette && (
                <button
                  id="drawer-command-palette-btn"
                  onClick={() => {
                    onClose();
                    onOpenCommandPalette();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-amber-400" />
                    <span>Command Palette</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Ctrl + K
                  </span>
                </button>
              )}

              {/* Defense ×5 Security Suite */}
              {onOpenSecurityDefense && (
                <button
                  id="drawer-security-defense-btn"
                  onClick={() => {
                    onClose();
                    onOpenSecurityDefense();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-emerald-300 hover:text-white hover:border-emerald-400 hover:bg-emerald-950/30 transition"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Defense ×5 Security Suite</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ACTIVE
                  </span>
                </button>
              )}

              {/* FCM Chapter Drop Push Notifications */}
              {onOpenFcmNotifications && (
                <button
                  id="drawer-fcm-notifications-btn"
                  onClick={() => {
                    onClose();
                    onOpenFcmNotifications();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-amber-500/50 hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-400" />
                    <span>FCM Chapter Drop Alerts</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    PUSH
                  </span>
                </button>
              )}

              {/* WebViewer Component Configuration */}
              {onOpenWebViewerModal && (
                <button
                  id="drawer-webviewer-btn"
                  onClick={() => {
                    onClose();
                    onOpenWebViewerModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-xs text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-950/20 transition"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>WebViewer Component</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    ANDROID 13
                  </span>
                </button>
              )}

              {/* GitHub Repository & Signed Google Play Release AAB */}
              <a
                id="drawer-github-repo-link"
                href="https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/latest/download/AZ-Oververse-PlayStore.aab"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/20 transition"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>AZ-Oververse-PlayStore.aab</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PLAY AAB
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-1">
            <span>🇿🇦 South Africa</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono font-semibold">100% ZAR Supported</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            All AZ Originals are © AZ OVERVERSE / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ OVERVERSE has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
          </p>
          <p className="text-[11px] text-slate-500">
            AZ OVERVERSE © 2026. Produced by Mlungiseni Mbhele.
          </p>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerElement, document.body);
  }
  return drawerElement;
};
