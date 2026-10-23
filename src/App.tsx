import React, { useState } from 'react';
import {
  Manga,
  Chapter,
  UserSubscription,
  SubscriptionTier,
  SubscriptionInvoice,
  CreatorStats,
  AdData,
  PayoutTransaction,
  CreatorPayoutSettings,
  Comment,
} from './types';
import {
  INITIAL_MANGA_LIST,
  INITIAL_CREATOR_STATS,
  ADS_DATABASE,
  MOTY_CATEGORIES,
  INITIAL_COMMENTS,
} from './data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { ReaderView } from './components/reader/ReaderView';
import { Navbar } from './components/layout/Navbar';
import { MangaCard } from './components/manga/MangaCard';
import { MangaGrid } from './components/manga/MangaGrid';
import { MangaDetailModal } from './components/manga/MangaDetailModal';
import { MangaReader } from './components/reader/MangaReader';
import { SubscriptionModal } from './components/subscription/SubscriptionModal';
import { PublishModal } from './components/publisher/PublishModal';
import { CreatorDashboardModal } from './components/publisher/CreatorDashboardModal';
import { InterstitialAdModal } from './components/ads/InterstitialAdModal';
import { RewardedAdModal } from './components/ads/RewardedAdModal';
import { AppOpenAdModal } from './components/ads/AppOpenAdModal';
import { AdBanner } from './components/ads/AdBanner';
import { AdMobBanner } from './components/ads/AdMobBanner';
import { MangaOfTheYearAwardsModal } from './components/awards/MangaOfTheYearAwardsModal';
import { MangaOfTheYearShowcase } from './components/awards/MangaOfTheYearShowcase';
import { MangaOfTheYearAwardsPage } from './components/awards/MangaOfTheYearAwardsPage';
import { ReaderPage } from './components/reader/ReaderPage';
import { SouthAfricaFlameLogo } from './components/common/SouthAfricaFlameLogo';
import { GlobalPublishShareModal } from './components/common/GlobalPublishShareModal';
import { AiReportModal } from './components/modals/AiReportModal';
import { detectAiContent, scanMangaList } from './utils/aiDetector';
import { BottomNav } from './components/layout/BottomNav';
import { ChatsPage } from './components/chat/ChatsPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { SettingsPage } from './pages/SettingsPage';
import { WalletPage } from './components/wallet/WalletPage';
import { BackdropPage } from './pages/BackdropPage';
import { MilestoneCelebrationModal, MILESTONE_CONFIGS, MilestoneCelebrationData } from './components/common/MilestoneCelebrationModal';
import { CreatorEarningsView } from './components/publisher/CreatorEarningsView';
import { syncOfflineProgressWithServer } from './services/offlineCache';
import { DevicePerformanceModal } from './components/common/DevicePerformanceModal';
import { ProductivityCommandPalette } from './components/common/ProductivityCommandPalette';
import { ResumeReadingBanner, LastReadProgress } from './components/common/ResumeReadingBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SplashScreen } from './components/splash/SplashScreen';
import {
  getActivePerformanceTier,
  setActivePerformanceTier,
  applyPerformanceClasses,
  DeviceTier,
} from './utils/devicePerformance';
import { safeStorage } from './utils/safeStorage';
import {
  fetchMangasFromSupabase,
  publishMangaToSupabase,
  publishChapterToSupabase,
  fetchUserLibraryFromSupabase,
  saveUserLibraryItemInSupabase,
} from './services/supabase';
import {
  initFcmMessaging,
  dispatchChapterDropPush,
  getNotificationsHistory,
  subscribeToMangaChapterDrops,
} from './services/fcm';
import {
  sanitizeInput,
  validateDatabaseQueryParam,
  recordChapterPageRead,
  vaultStore,
  vaultRetrieve,
} from './utils/securitySanitizer';
import { SecurityDefenseModal } from './components/common/SecurityDefenseModal';
import { FcmNotificationBanner, FcmNotificationsModal } from './components/common/FcmNotificationBanner';
import { WebViewerModal } from './components/common/WebViewerModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { DailyRewardNotification } from './components/common/DailyRewardNotification';
import { ApplyAsMangakaModal } from './components/modals/ApplyAsMangakaModal';
import { MangakaDashboardModal } from './components/publisher/MangakaDashboardModal';
import { AdminDashboardModal } from './components/publisher/AdminDashboardModal';
import { isUserApprovedMangaka } from './utils/mangakaManager';
import { RecommendationModal } from './components/recommendations/RecommendationModal';
import {
  getUserTasteProfile,
  recordReadingHistoryEvent,
  UserTasteProfile,
} from './services/recommendationEngine';
import { initWebViewer } from './utils/webViewerConfig';
import {  Sparkles,
  Flame,
  Zap,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  Play,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Trophy,
  Award,
  Globe,
  Heart,
  Bot,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';

// Clear legacy manga cache keys as strictly instructed by User
try {
  localStorage.removeItem('mangaList');
  localStorage.removeItem('ka_plus_manga');
  localStorage.removeItem('ka_africa_manga_list');
  localStorage.removeItem('ka_pulse_supabase_mangas_cache');
  const cachedStr = localStorage.getItem('az_oververse_mangas_cache');
  if (
    cachedStr &&
    (!cachedStr.includes('nkosi-the-tale-of-myths') ||
      !cachedStr.includes('857872877_1452459446839395') ||
      !cachedStr.includes('862516203_2025904894785875') ||
      !cachedStr.includes('858773050_1090471570458562'))
  ) {
    localStorage.removeItem('az_oververse_mangas_cache');
  }
} catch (e) {}

const DEFAULT_ADMOB_REWARDED_AD: AdData = {
  id: 'admob-rewarded-default',
  title: 'Google Mobile Ads · Creator Support',
  advertiser: 'Google AdMob',
  description: 'Watch a short Google AdMob rewarded video to unlock the next chapter while supporting creators.',
  ctaText: 'Continue',
  tagline: 'Google AdMob Rewarded',
  badge: 'AdMob',
  imageUrl: '/pwa-512x512.png',
  accentColor: 'amber',
};

export default function App() {
  const [mangaList, setMangaList] = useState<Manga[]>(INITIAL_MANGA_LIST);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>(INITIAL_CREATOR_STATS);
  const [ads] = useState<AdData[]>(ADS_DATABASE);

  // Admin Security & RBAC Guarantee (Admin: mlungisenimbhele3@gmail.com)
  const ADMIN_EMAILS = ["mlungisenimbhele3@gmail.com"];
  const ADMIN_EMAIL = ADMIN_EMAILS[0];
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    const cached = localStorage.getItem('ka_africa_user_email');
    if (!cached || cached === 'azoververse@gmail.com') {
      localStorage.setItem('ka_africa_user_email', ADMIN_EMAIL);
      return ADMIN_EMAIL;
    }
    return cached;
  });
  const currentUser = { email: currentUserEmail };
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email);

  const handleSwitchUserEmail = (email: string) => {
    setCurrentUserEmail(email);
    localStorage.setItem('ka_africa_user_email', email);
  };

  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // AZ OVERVERSE Splash Screen (shows on initial launch, dismissible)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('az_splash_dismissed');
    } catch {
      return true;
    }
  });

  const handleFinishSplash = () => {
    try {
      sessionStorage.setItem('az_splash_dismissed', 'true');
    } catch {}
    setShowSplash(false);
  };

  React.useEffect(() => {
    const handleOnline = async () => {
      const count = await syncOfflineProgressWithServer();
      if (count > 0) {
        setSyncToastMessage(`Connection restored! Automatically synced ${count} offline chapter reads & progress with server.`);
        setTimeout(() => setSyncToastMessage(null), 6000);
      }
    };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      syncOfflineProgressWithServer().then((count) => {
        if (count > 0) {
          setSyncToastMessage(`Automatically synced ${count} offline chapter reads & progress with server.`);
          setTimeout(() => setSyncToastMessage(null), 6000);
        }
      });
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // User subscription state (Starts as Free so user can test ads, with 1-click switcher to VIP)
  const [userSubscription, setUserSubscription] = useState<UserSubscription>(() => {
    try {
      const saved = localStorage.getItem('ka_africa_user_subscription');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      tier: 'free',
      planName: 'Free Reader (Ad-Supported)',
      price: 'R0.00',
      activeSince: '2026-09-01',
      expiresAt: '2026-10-01',
      autoRenew: false,
      perks: ['Standard reading', 'Ad-supported', 'Rewarded ad chapter unlocks'],
      unlockedChapters: [],
    };
  });

  // User personal favorites collection with localStorage persistence
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ka_africa_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse favorites from localStorage', e);
    }
    // Default initial favorites so user immediately sees populated collection
    return ['manga-1', 'manga-3'];
  });

  // Supabase Core Relational Data Initialization (Mangas, Chapters, User Libraries)
  React.useEffect(() => {
    // 1. Fetch core mangas & chapters from Supabase (relational engine)
    fetchMangasFromSupabase().then((supaMangas) => {
      if (supaMangas && supaMangas.length > 0) {
        setMangaList(supaMangas);
      }
    });

    // 2. Fetch User Library from Supabase
    fetchUserLibraryFromSupabase(currentUserEmail).then((libraryRecords) => {
      if (libraryRecords && libraryRecords.length > 0) {
        const favIds = libraryRecords.filter((r) => r.isFavorite).map((r) => r.mangaId);
        if (favIds.length > 0) {
          setFavoriteIds(favIds);
        }
      }
    });

    // 3. Initialize Firebase Cloud Messaging (FCM)
    initFcmMessaging().catch((err) => {
      console.warn('[FCM] Push Notification Service Worker notice:', err);
    });
  }, [currentUserEmail]);

  const handleToggleFavorite = (mangaId: string) => {
    setFavoriteIds((prev) => {
      const isFav = !prev.includes(mangaId);
      const next = isFav
        ? [...prev, mangaId]
        : prev.filter((id) => id !== mangaId);
      try {
        localStorage.setItem('ka_africa_favorites', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save favorites to localStorage', e);
      }

      // Sync with Supabase User Library (Relational core)
      saveUserLibraryItemInSupabase({
        userEmail: currentUserEmail,
        mangaId,
        isFavorite: isFav,
        readingStatus: isFav ? 'reading' : 'on_hold',
        notifyChapterDrops: isFav,
      });

      // Auto-subscribe to FCM chapter drops when favoriting
      if (isFav) {
        const target = mangaList.find((m) => m.id === mangaId);
        subscribeToMangaChapterDrops(mangaId, target?.title || 'Followed Manga');
      }

      return next;
    });
  };

  // Navigation & Modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [language, setLanguage] = useState<'en' | 'zu' | 'af'>('en');
  const [isOledMode, setIsOledMode] = useState(false);
  const [allComments, setAllComments] = useState<Comment[]>(() => {
    try {
      const stored = localStorage.getItem('ka_all_comments');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COMMENTS;
  });
  const [selectedDetailManga, setSelectedDetailManga] = useState<Manga | null>(null);
  const [dataSaverMode, setDataSaverMode] = useState(false);

  // Active Reader state
  const [activeReaderManga, setActiveReaderManga] = useState<Manga | null>(null);
  const [activeReaderChapterId, setActiveReaderChapterId] = useState<string>('');

  // Tab & Route Navigation state ([ Readers | Creators | Chats | Wallet | Privacy | Terms | Awards | Backdrop | Settings ])
  const [activeTab, setActiveTab] = useState<'readers' | 'creators' | 'chats' | 'wallet' | 'privacy' | 'terms' | 'awards' | 'backdrop' | 'canvas' | 'settings'>(() => {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    const candidate = hash || path;
    if (candidate === 'privacy' || candidate === 'terms' || candidate === 'creators' || candidate === 'chats' || candidate === 'wallet' || candidate === 'awards' || candidate === 'backdrop' || candidate === 'canvas' || candidate === 'settings') {
      return (candidate === 'canvas' ? 'backdrop' : candidate) as any;
    }
    return 'readers';
  });
  const [isCreator] = useState<boolean>(true); // user.isCreator = true

  const handleTabChange = (tab: 'readers' | 'creators' | 'chats' | 'wallet' | 'privacy' | 'terms' | 'awards' | 'backdrop' | 'canvas' | 'settings') => {
    let targetTab: any = tab === 'canvas' ? 'backdrop' : tab;
    // Security RBAC: Wallet page is only available and visible to the admin
    if (targetTab === 'wallet' && !isAdmin) {
      targetTab = 'readers';
    }
    setActiveTab(targetTab);

    try {
      const newPath = targetTab === 'readers' ? '/' : `/${targetTab}`;
      window.history.pushState(null, '', newPath);
    } catch (e) {
      window.location.hash = targetTab === 'readers' ? '' : targetTab;
    }

    if (activeReaderManga) {
      setActiveReaderManga(null);
    }
    if (selectedDetailManga) {
      setSelectedDetailManga(null);
    }
  };

  // Synchronize route changes on popstate and hashchange events
  React.useEffect(() => {
    const handleUrlSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const candidate = hash || path;
      let matched = (candidate === 'privacy' || candidate === 'terms' || candidate === 'creators' || candidate === 'chats' || candidate === 'wallet' || candidate === 'awards' || candidate === 'backdrop' || candidate === 'canvas' || candidate === 'settings')
        ? (candidate === 'canvas' ? 'backdrop' : candidate)
        : 'readers';
      // Gated: Wallet is only accessible to Admin
      if (matched === 'wallet' && !isAdmin) {
        matched = 'readers';
      }
      setActiveTab(matched as any);
    };

    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener('hashchange', handleUrlSync);
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('hashchange', handleUrlSync);
    };
  }, [isAdmin]);

  // Ensure non-admin users are never left on the wallet page
  React.useEffect(() => {
    if (activeTab === 'wallet' && !isAdmin) {
      setActiveTab('readers');
    }
  }, [activeTab, isAdmin]);

  // Milestone Celebration Overlay State (Day 7, Day 30, Day 100)
  const [celebrationMilestone, setCelebrationMilestone] = useState<MilestoneCelebrationData | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  React.useEffect(() => {
    const handleMilestoneEvent = (e: any) => {
      const days = e.detail?.days || 7;
      const config = MILESTONE_CONFIGS[days] || MILESTONE_CONFIGS[7];
      setCelebrationMilestone(config);
      setIsCelebrationOpen(true);
    };
    window.addEventListener('ka_pulse_celebrate_milestone', handleMilestoneEvent);
    return () => window.removeEventListener('ka_pulse_celebrate_milestone', handleMilestoneEvent);
  }, []);

  const handleToggleOriginal = (mangaId: string) => {
    setMangaList((prev) => {
      const next = prev.map((m) => {
        if (m.id === mangaId) {
          const newOriginal = !m.isOriginal;
          return {
            ...m,
            isOriginal: newOriginal,
            isBackdrop: !newOriginal,
            isCanvas: !newOriginal,
          };
        }
        return m;
      });
      safeStorage.setJSON('ka_africa_manga_list', next);
      return next;
    });
  };

  const handleReorderManga = (newList: Manga[]) => {
    setMangaList(newList);
    safeStorage.setJSON('ka_africa_manga_list', newList);
  };

  // Modals
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [uploadTargetMangaId, setUploadTargetMangaId] = useState<string | undefined>(undefined);
  const [isCreatorDashboardOpen, setIsCreatorDashboardOpen] = useState(false);
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false);
  const [isGlobalShareOpen, setIsGlobalShareOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isFcmModalOpen, setIsFcmModalOpen] = useState(false);
  const [isWebViewerModalOpen, setIsWebViewerModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isApplyMangakaOpen, setIsApplyMangakaOpen] = useState(false);
  const [isMangakaDashboardOpen, setIsMangakaDashboardOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState(false);
  const [userTasteProfile, setUserTasteProfile] = useState<UserTasteProfile>(() => getUserTasteProfile());
  const [appMode, setAppMode] = useState<'reader' | 'mangaka'>('reader');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => getNotificationsHistory().length);

  // Initialize WebViewer Spec (Uncheck ZoomDisplay, Uncheck SupportZoom, Check WideViewPort = TRUE, Set UserAgent)
  React.useEffect(() => {
    initWebViewer();
  }, []);

  // Device Performance & Productivity state
  const [performanceTier, setPerformanceTier] = useState<DeviceTier>(() => getActivePerformanceTier());
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [lastReadProgress, setLastReadProgress] = useState<LastReadProgress | null>(() => {
    return safeStorage.getJSON<LastReadProgress | null>('ka_pulse_last_read', null);
  });

  // Apply device performance classes immediately on mount or tier change
  React.useEffect(() => {
    applyPerformanceClasses(performanceTier);
  }, [performanceTier]);

  // Global Ctrl+K / Cmd+K productivity keyboard listener
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleResumeReading = (mangaId: string, chapterId: string) => {
    const target = mangaList.find((m) => m.id === mangaId);
    if (target) {
      handleStartReading(target, chapterId);
    }
  };

  const handleDismissResumeBanner = () => {
    setLastReadProgress(null);
    safeStorage.removeItem('ka_pulse_last_read');
  };

  // AI Content Detection & Moderation State
  const [selectedAiReportManga, setSelectedAiReportManga] = useState<Manga | null>(null);
  const [isAiReportOpen, setIsAiReportOpen] = useState(false);
  const [isScanningCatalogAi, setIsScanningCatalogAi] = useState(false);
  const [aiScanToastMessage, setAiScanToastMessage] = useState<string | null>(null);

  // Interstitial Ad state
  const [interstitialState, setInterstitialState] = useState<{
    isOpen: boolean;
    ad: AdData | null;
    nextChapterTitle?: string;
    onProceed?: () => void;
  }>({
    isOpen: false,
    ad: null,
  });

  // Rewarded Ad state
  const [rewardedState, setRewardedState] = useState<{
    isOpen: boolean;
    ad: AdData | null;
    chapter: Chapter | null;
    onUnlocked?: () => void;
  }>({
    isOpen: false,
    ad: null,
    chapter: null,
    onUnlocked: undefined,
  });

  // App Open Demo Ad state
  const [isAppOpenAdOpen, setIsAppOpenAdOpen] = useState(false);

  // Toggle user subscription tier
  const handleUpdateSubscription = (
    tier: SubscriptionTier,
    cycle: 'monthly' | 'yearly' = 'monthly',
    newInvoice?: SubscriptionInvoice
  ) => {
    setUserSubscription((prev) => {
      const isYearly = cycle === 'yearly';
      const expires = new Date();
      if (isYearly) {
        expires.setFullYear(expires.getFullYear() + 1);
      } else {
        expires.setMonth(expires.getMonth() + 1);
      }

      const planName =
        tier === 'free'
          ? 'Free Reader (Ad-Supported)'
          : tier === 'vip'
          ? isYearly
            ? 'AZ Oververse VIP Pass (Annual Pass)'
            : 'AZ Oververse VIP Pass (Monthly)'
          : tier === 'early_access'
          ? isYearly
            ? 'Pro Early Access (Annual Pass)'
            : 'Pro Early Access (Monthly)'
          : isYearly
          ? 'Creator Patron (Annual Pass)'
          : 'Creator Patron (Monthly)';

      const price =
        tier === 'free'
          ? 'R0.00'
          : tier === 'vip'
          ? isYearly
            ? 'R890.00/yr'
            : 'R89.00/mo'
          : tier === 'early_access'
          ? isYearly
            ? 'R1,399.00/yr'
            : 'R149.00/mo'
          : isYearly
          ? 'R1,999.00/yr'
          : 'R219.00/mo';

      const perks =
        tier === 'free'
          ? ['Standard reading', 'Ad-supported', 'Rewarded ad chapter unlocks']
          : tier === 'vip'
          ? ['100% Ad-Free reading', 'Ultra-HD uncompressed images', 'Offline reading cache', '70% to African creators']
          : tier === 'early_access'
          ? ['Everything in VIP (100% Ad-Free)', '7-14 Days Early Chapter Access', 'High-Speed Priority CDN', 'Pro Early Access badge']
          : ['Everything in Pro & VIP', 'Exclusive Bonus Content: Sketches & Omakes', 'Character design dossiers & 4K wallpapers', '70% direct royalty allocation'];

      const updatedInvoices = newInvoice
        ? [newInvoice, ...(prev.invoices || [])]
        : prev.invoices || [];

      const nextSub: UserSubscription = {
        ...prev,
        tier,
        billingCycle: cycle,
        planName,
        price,
        perks,
        expiresAt: tier === 'free' ? 'Never' : expires.toISOString().split('T')[0],
        nextBillingDate: tier === 'free' ? undefined : expires.toISOString().split('T')[0],
        status: 'active',
        autoRenew: tier !== 'free',
        invoices: updatedInvoices,
      };

      try {
        localStorage.setItem('ka_africa_user_subscription', JSON.stringify(nextSub));
      } catch (e) {
        console.error(e);
      }
      return nextSub;
    });
  };

  // Quick toggle helper for testing
  const handleQuickToggleTier = (tier: SubscriptionTier, cycle: 'monthly' | 'yearly' = 'monthly') => {
    handleUpdateSubscription(tier, cycle);
  };

  // Start reading a chapter
  const handleStartReading = (manga: Manga, chapterId?: string) => {
    // If manga has no panels / is coming soon, inform user and open detail modal safely
    const hasPanels = manga.chapters && manga.chapters.length > 0 && manga.chapters.some((c) => c.pages && c.pages.length > 0);
    if (!hasPanels) {
      setSelectedDetailManga(manga);
      setSyncToastMessage(`"${manga.title}" panels are in production! Coming soon.`);
      setTimeout(() => setSyncToastMessage(null), 4000);
      return;
    }

    const targetChapterId = chapterId || manga.chapters[0]?.id || '';
    setSelectedDetailManga(null);
    setActiveReaderManga(manga);
    setActiveReaderChapterId(targetChapterId);

    // Track read event in personalized recommendation engine
    const chObj = manga.chapters.find((c) => c.id === targetChapterId);
    const updatedTaste = recordReadingHistoryEvent(manga.id, manga.title, chObj?.number);
    setUserTasteProfile({ ...updatedTaste });

    // Track read stats
    setCreatorStats((prev) => ({
      ...prev,
      totalReads: prev.totalReads + 1,
      subscriberViews:
        userSubscription.tier !== 'free' ? prev.subscriberViews + 1 : prev.subscriberViews,
      adImpressions:
        userSubscription.tier === 'free' ? prev.adImpressions + 1 : prev.adImpressions,
    }));
  };

  // Interstitial trigger during chapter navigation (bypasses when fake test ads are removed)
  const handleShowInterstitial = (nextChapterTitle: string, proceedCallback: () => void) => {
    if (!ads || ads.length === 0 || !ads[0]) {
      proceedCallback();
      return;
    }
    const randomAd = ads[Math.floor(Math.random() * ads.length)] || ads[0];
    setInterstitialState({
      isOpen: true,
      ad: randomAd,
      nextChapterTitle,
      onProceed: proceedCallback,
    });

    // Count ad impression & increase ad revenue
    setCreatorStats((prev) => ({
      ...prev,
      adImpressions: prev.adImpressions + 1,
      monthlyAdRevenue: prev.monthlyAdRevenue + 0.004,
    }));
  };

  // Close interstitial and execute chapter proceed
  const handleCloseInterstitial = () => {
    const proceed = interstitialState.onProceed;
    setInterstitialState((prev) => ({ ...prev, isOpen: false }));
    if (proceed) proceed();
  };

  // Rewarded ad trigger for "Watch ad to unlock next chapter"
  const handleRequestRewardedAd = (chapter: Chapter, onUnlocked?: () => void) => {
    const selectedAd =
      ads && ads.length > 0
        ? ads[Math.floor(Math.random() * ads.length)] || DEFAULT_ADMOB_REWARDED_AD
        : DEFAULT_ADMOB_REWARDED_AD;
    setRewardedState({
      isOpen: true,
      ad: selectedAd,
      chapter,
      onUnlocked,
    });
  };

  // Reward granted: unlock chapter and persist
  const handleRewardGranted = (chapterId: string) => {
    setUserSubscription((prev) => {
      const updatedUnlocked = prev.unlockedChapters.includes(chapterId)
        ? prev.unlockedChapters
        : [...prev.unlockedChapters, chapterId];
      const nextSub: UserSubscription = {
        ...prev,
        unlockedChapters: updatedUnlocked,
      };
      try {
        localStorage.setItem('ka_africa_user_subscription', JSON.stringify(nextSub));
      } catch (e) {
        console.error(e);
      }
      return nextSub;
    });

    setCreatorStats((prev) => ({
      ...prev,
      adImpressions: prev.adImpressions + 2,
      monthlyAdRevenue: prev.monthlyAdRevenue + 0.02,
    }));
  };

  // Publish new chapter with Supabase sync & FCM Push Notification
  const handlePublishChapter = (mangaId: string, newChapter: Chapter) => {
    // Defense 2: Anti-XSS Sanitizer
    const sanitizedChapter: Chapter = {
      ...newChapter,
      title: sanitizeInput(newChapter.title, 'Chapter Title'),
    };

    setMangaList((prev) =>
      prev.map((m) => {
        if (m.id === mangaId) {
          return {
            ...m,
            chapters: [...m.chapters, sanitizedChapter],
          };
        }
        return m;
      })
    );

    // 1. Sync to Supabase Core Relational DB (chapters table)
    publishChapterToSupabase(sanitizedChapter);

    // 2. Dispatch Firebase Cloud Messaging (FCM) Push Notification
    const targetManga = mangaList.find((m) => m.id === mangaId);
    if (targetManga) {
      dispatchChapterDropPush(targetManga, sanitizedChapter).then(() => {
        setUnreadNotificationsCount((c) => c + 1);
      });
    }
  };

  // Publish new manga series with Supabase sync
  const handlePublishManga = (newManga: Manga) => {
    // Defense 2: Anti-XSS Sanitizer
    const sanitizedManga: Manga = {
      ...newManga,
      title: sanitizeInput(newManga.title, 'Manga Title'),
      synopsis: sanitizeInput(newManga.synopsis, 'Manga Synopsis'),
      author: sanitizeInput(newManga.author, 'Author Name'),
    };

    setMangaList((prev) => [sanitizedManga, ...prev]);

    // 1. Sync to Supabase Core Relational DB (mangas table)
    publishMangaToSupabase(sanitizedManga);

    // 2. If new series includes a launch chapter, dispatch FCM chapter drop
    if (sanitizedManga.chapters && sanitizedManga.chapters.length > 0) {
      dispatchChapterDropPush(sanitizedManga, sanitizedManga.chapters[0]).then(() => {
        setUnreadNotificationsCount((c) => c + 1);
      });
    }
  };

  // Mangaka & Admin Handlers
  const handleToggleAppMode = () => {
    if (appMode === 'reader') {
      if (isUserApprovedMangaka(currentUserEmail)) {
        setAppMode('mangaka');
        setIsMangakaDashboardOpen(true);
      } else {
        setIsApplyMangakaOpen(true);
      }
    } else {
      setAppMode('reader');
    }
  };

  const handleApproveManga = (mangaId: string) => {
    setMangaList((prev) =>
      prev.map((m) =>
        m.id === mangaId
          ? { ...m, approvalStatus: 'approved', rejectionReason: undefined }
          : m
      )
    );
  };

  const handleRejectManga = (mangaId: string, reason?: string) => {
    setMangaList((prev) =>
      prev.map((m) =>
        m.id === mangaId
          ? {
              ...m,
              approvalStatus: 'rejected',
              rejectionReason: reason || 'Application needs more sample manga pages or higher resolution cover.',
            }
          : m
      )
    );
  };

  const handleToggleFeatured = (mangaId: string) => {
    setMangaList((prev) =>
      prev.map((m) => (m.id === mangaId ? { ...m, featured: !m.featured } : m))
    );
  };

  const handleSubmitNewMangaFromMangaka = (newManga: Manga) => {
    // Defense 2: Anti-XSS Sanitizer
    const sanitizedManga: Manga = {
      ...newManga,
      title: sanitizeInput(newManga.title, 'Manga Title'),
      synopsis: sanitizeInput(newManga.synopsis, 'Manga Synopsis'),
      author: sanitizeInput(newManga.author, 'Author Name'),
    };

    setMangaList((prev) => {
      const exists = prev.some((m) => m.id === sanitizedManga.id);
      let updated: Manga[];
      if (exists) {
        updated = prev.map((m) => (m.id === sanitizedManga.id ? sanitizedManga : m));
      } else {
        updated = [sanitizedManga, ...prev];
      }
      try {
        localStorage.setItem('ka_africa_manga_list', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (sanitizedManga.approvalStatus === 'pending_review') {
      publishMangaToSupabase(sanitizedManga);
      if (sanitizedManga.chapters && sanitizedManga.chapters.length > 0) {
        dispatchChapterDropPush(sanitizedManga, sanitizedManga.chapters[0]).then(() => {
          setUnreadNotificationsCount((c) => c + 1);
        });
      }
    }
  };

  const handleDeleteManga = (mangaId: string) => {
    setMangaList((prev) => {
      const updated = prev.filter((m) => m.id !== mangaId);
      try {
        localStorage.setItem('ka_africa_manga_list', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleAddComment = (text: string, chapterNumber?: number) => {
    if (!selectedDetailManga) return;
    // Defense 2: Neutralize malicious tags or XSS payloads
    const cleanText = sanitizeInput(text, 'User Comment');
    if (!cleanText.trim()) return;

    const authorName = localStorage.getItem('ka_reader_username') || (isAdmin ? 'Mlungiseni Mbhele (Producer)' : 'Reader');
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      mangaId: selectedDetailManga.id,
      userId: `user-${Date.now()}`,
      userName: sanitizeInput(authorName, 'User Name'),
      text: cleanText,
      timestamp: new Date().toISOString(),
      chapterNumber,
      userBadge: isVipUser ? 'VIP Reader' : 'Reader',
      likes: 0,
    };
    setAllComments((prev) => {
      const next = [newComment, ...prev];
      try {
        localStorage.setItem('ka_all_comments', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleLikeComment = (commentId: string) => {
    setAllComments((prev) => {
      const next = prev.map((c) => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c));
      try {
        localStorage.setItem('ka_all_comments', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Creator Payout Handlers (VISA and South African Banks)
  const handleExecutePayout = (newTx: PayoutTransaction) => {
    setCreatorStats((prev) => ({
      ...prev,
      totalRevenueUSD: Math.max(0, prev.totalRevenueUSD - newTx.amountUSD),
      payoutHistory: [newTx, ...(prev.payoutHistory || [])],
    }));
  };

  const handleUpdatePayoutSettings = (newSettings: CreatorPayoutSettings) => {
    setCreatorStats((prev) => ({
      ...prev,
      payoutSettings: newSettings,
    }));
  };

  // AI Content Detection & Auto-Ban Moderation Handlers
  const handleOpenAiReport = (manga: Manga) => {
    setSelectedAiReportManga(manga);
    setIsAiReportOpen(true);
  };

  const handleToggleBan = (mangaId: string, shouldBan: boolean) => {
    setMangaList((prev) =>
      prev.map((m) => {
        if (m.id === mangaId) {
          const updated: Manga = {
            ...m,
            isBanned: shouldBan,
            banReason: shouldBan
              ? 'Auto-Banned: Synthetic AI diffusion markers detected. Violates AZ Oververse Artisan Creator Code Section 4.1.'
              : undefined,
            aiDetection: m.aiDetection
              ? {
                  ...m.aiDetection,
                  bannedStatus: shouldBan
                    ? ('auto_banned' as const)
                    : m.isAiGenerated
                    ? ('ai_labeled' as const)
                    : ('clean' as const),
                  banReason: shouldBan
                    ? 'Manually quarantined / AI strike confirmed by Executive Producer.'
                    : undefined,
                }
              : undefined,
          };
          if (selectedAiReportManga?.id === mangaId) {
            setSelectedAiReportManga(updated);
          }
          if (selectedDetailManga?.id === mangaId) {
            setSelectedDetailManga(updated);
          }
          return updated;
        }
        return m;
      })
    );
  };

  const handleReScanManga = (mangaId: string) => {
    const target = mangaList.find((m) => m.id === mangaId);
    if (!target) return;
    const scan = detectAiContent({
      title: target.title,
      synopsis: target.synopsis,
      author: target.author,
      artist: target.artist,
      coverImage: target.coverImage,
      genres: target.genres,
      declaredAi: target.isAiGenerated,
    });
    setMangaList((prev) =>
      prev.map((m) => {
        if (m.id === mangaId) {
          const isBanned = scan.bannedStatus === 'auto_banned';
          const updated: Manga = {
            ...m,
            isAiGenerated: scan.isAiGenerated,
            aiConfidenceScore: scan.confidenceScore,
            isBanned,
            banReason: isBanned ? scan.banReason : undefined,
            aiDetection: scan,
          };
          if (selectedAiReportManga?.id === mangaId) {
            setSelectedAiReportManga(updated);
          }
          if (selectedDetailManga?.id === mangaId) {
            setSelectedDetailManga(updated);
          }
          return updated;
        }
        return m;
      })
    );
  };

  const handleRunCatalogAiScan = () => {
    setIsScanningCatalogAi(true);
    setTimeout(() => {
      const { updatedList, newlyBannedCount, aiLabeledCount } = scanMangaList(mangaList, true);
      setMangaList(updatedList);
      setIsScanningCatalogAi(false);
      setAiScanToastMessage(
        `🤖 Deep Neural AI Scan Completed: Analyzed catalog. ${aiLabeledCount} titles labeled with AI stickers, ${newlyBannedCount} quarantined under auto-ban policy.`
      );
      setTimeout(() => setAiScanToastMessage(null), 5500);
    }, 900);
  };

  // Filter manga list
  const filteredManga = mangaList.filter((m) => {
    // Drafts are private work-in-progress and must not appear in reader mode
    if (m.approvalStatus === 'draft') {
      return false;
    }

    // Reader Mode privacy: pending/rejected submissions only visible to author or admin
    if (
      m.approvalStatus === 'pending_review' &&
      m.submittedByEmail?.toLowerCase() !== currentUserEmail.toLowerCase() &&
      !isAdmin
    ) {
      return false;
    }
    if (m.approvalStatus === 'rejected' && !isAdmin) {
      return false;
    }

    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'favorites') {
      return favoriteIds.includes(m.id);
    }
    if (selectedFilter === 'moty_awards') {
      return Boolean(m.award);
    }
    if (selectedFilter === 'human_only') {
      return !m.isAiGenerated && !m.isBanned;
    }
    if (selectedFilter === 'ai_labeled') {
      return Boolean(m.isAiGenerated) && !m.isBanned;
    }
    if (selectedFilter === 'banned') {
      return Boolean(m.isBanned);
    }
    if (selectedFilter === 'vip_only') {
      return m.chapters.some((c) => c.accessType === 'premium');
    }
    if (selectedFilter === 'free_only') {
      return m.chapters.every((c) => c.accessType === 'free');
    }
    return m.genres.some((g) => g.trim().toLowerCase() === selectedFilter.trim().toLowerCase());
  });

  const featuredManga =
    mangaList.find((m) => m.featured && m.approvalStatus !== 'pending_review' && m.approvalStatus !== 'rejected' && m.approvalStatus !== 'draft') ||
    mangaList.find((m) => m.approvalStatus !== 'pending_review' && m.approvalStatus !== 'rejected' && m.approvalStatus !== 'draft') ||
    mangaList[0];
  const isVipUser =
    userSubscription.tier === 'vip' ||
    userSubscription.tier === 'early_access' ||
    userSubscription.tier === 'patron';

  return (
    <ErrorBoundary>
      <div
        id="manga-app-root"
        className={`min-h-screen ${isOledMode ? 'bg-black' : 'bg-[#0a0d14]'} text-slate-100 flex flex-col font-sans pb-32`}
      >
        {/* Offline Sync Toast Banner */}
      {syncToastMessage && (
        <div className="bg-emerald-950 border-b border-emerald-500/50 px-4 py-2 text-center text-xs text-emerald-200 flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{syncToastMessage}</span>
        </div>
      )}

      {/* AI Catalog Scan & Auto-Ban Result Banner */}
      {aiScanToastMessage && (
        <div className="bg-cyan-950/95 border-b border-cyan-500/50 px-4 py-2.5 text-center text-xs text-cyan-200 flex items-center justify-center gap-2 shadow-lg animate-fadeIn z-30">
          <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold">{aiScanToastMessage}</span>
          <button
            onClick={() => setAiScanToastMessage(null)}
            className="text-cyan-400 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Main Navbar */}
      <Navbar
        currentLanguage={language}
        setLanguage={setLanguage}
        isOledMode={isOledMode}
        toggleOledMode={() => setIsOledMode(!isOledMode)}
        userSubscription={userSubscription}
        currentUserEmail={currentUserEmail}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
        onQuickToggleTier={handleQuickToggleTier}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenCreatorDashboard={() => setIsCreatorDashboardOpen(true)}
        onOpenApplyMangaka={() => setIsApplyMangakaOpen(true)}
        onOpenMangakaDashboard={() => setIsMangakaDashboardOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        appMode={appMode}
        onToggleAppMode={handleToggleAppMode}
        onOpenAwardsModal={() => setIsAwardsModalOpen(true)}
        onOpenGlobalShare={() => setIsGlobalShareOpen(true)}
        onOpenPerformanceModal={() => setIsPerformanceModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSecurityDefense={() => setIsSecurityModalOpen(true)}
        onOpenFcmNotifications={() => setIsFcmModalOpen(true)}
        onOpenWebViewerModal={() => setIsWebViewerModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        performanceTier={performanceTier}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
        favoritesCount={favoriteIds.length}
        dataSaverMode={dataSaverMode}
        onToggleDataSaver={() => setDataSaverMode((prev) => !prev)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
        onSwitchUserEmail={handleSwitchUserEmail}
      />

      {/* Dynamic Magazine Header Banner */}
      <div className="border-b border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-2">
        <div className="mx-auto max-w-7xl flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            {/* Left side orange badge text = "WEEKLY AZ STORIES" (2 lines) */}
            <div className="rounded bg-amber-500 text-black font-black text-[9px] sm:text-[10px] leading-tight px-2.5 py-1 tracking-wider uppercase text-center flex flex-col justify-center shrink-0 shadow-sm">
              <span>WEEKLY</span>
              <span>AZ STORIES</span>
            </div>
            {/* Right side text = "ISSUE #41 • OCTOBER 2026 EDITION" */}
            <span className="font-extrabold text-white tracking-wide text-xs sm:text-sm font-mono">
              ISSUE #41 • OCTOBER 2026 EDITION
            </span>
          </div>
          {/* Flame icon text below: "Weekly Simulpubs & Original Uploads Ready" */}
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
            <span>Weekly Simulpubs & Original Uploads Ready</span>
          </div>
        </div>
      </div>

      {/* CHATS & INBOX Strip Below Weekly Issue Banner */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-2">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => handleTabChange('chats')}
            className="flex items-center gap-2.5 group text-left hover:text-amber-400 transition"
          >
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:bg-amber-500/20 group-hover:text-amber-400 group-hover:border-amber-500/40 transition">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-['Bebas_Neue',sans-serif] text-base sm:text-lg tracking-wider text-white group-hover:text-amber-400 transition">
                CHATS & <span className="text-amber-400">INBOX</span>
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                • Direct reader, creator & community messages
              </span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('chats')}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <span>Open Chats</span>
            <span className="text-amber-400 font-mono">→</span>
          </button>
        </div>
      </div>

      {/* FULL-SCREEN MANGA PLUS MODELED READER (100vh, 100vw, Zero Light Leakage, Object-Contain, Center Tap Overlay) */}
      {activeReaderManga && (
        <ReaderView
          manga={activeReaderManga}
          chapter={
            activeReaderManga.chapters.find((c) => c.id === activeReaderChapterId) ||
            activeReaderManga.chapters[0] || {
              id: 'ch-placeholder-1',
              mangaId: activeReaderManga.id,
              number: 1,
              title: 'Chapter 1',
              releaseDate: '2026-10-01',
              pageCount: 3,
              accessType: 'free',
              likesCount: 0,
              commentsCount: 0,
              pages: [
                { id: 'p-1', pageNumber: 1, imageUrl: activeReaderManga.coverImage || activeReaderManga.cover || '/pwa-512x512.png', caption: 'Page 1' },
                { id: 'p-2', pageNumber: 2, imageUrl: activeReaderManga.bannerImage || '/pwa-512x512.png', caption: 'Page 2' },
                { id: 'p-3', pageNumber: 3, imageUrl: activeReaderManga.coverImage || '/pwa-512x512.png', caption: 'Page 3' },
              ],
            }
          }
          userSubscription={userSubscription}
          onChapterChange={(chId) => setActiveReaderChapterId(chId)}
          onRequestRewardedAd={handleRequestRewardedAd}
          onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
          onBack={() => {
            setActiveReaderManga(null);
            const updated = safeStorage.getJSON<LastReadProgress | null>('ka_pulse_last_read', null);
            if (updated) setLastReadProgress(updated);
          }}
        />
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 space-y-8">
        {/* Optimized Tab Switch: Butter-smooth GPU transition with zero latency */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
            style={{ transform: 'translateZ(0)' }}
          >
            {/* Route: /privacy */}
            {activeTab === 'privacy' && <PrivacyPolicy onClose={() => handleTabChange('readers')} />}
            {/* Route: /terms */}
            {activeTab === 'terms' && <TermsOfService onClose={() => handleTabChange('readers')} />}
            {/* Route: /settings */}
            {activeTab === 'settings' && (
              <SettingsPage
                currentUserEmail={currentUserEmail}
                onUpdateEmail={handleSwitchUserEmail}
                onNavigateToHome={() => handleTabChange('readers')}
                onNavigateToTerms={() => handleTabChange('terms')}
                onNavigateToPrivacy={() => handleTabChange('privacy')}
                onNavigateToAwards={() => handleTabChange('awards')}
              />
            )}
            {/* Route: /awards (Manga of the Year Awards Page) */}
            {activeTab === 'awards' && (
              <MangaOfTheYearAwardsPage
                categories={MOTY_CATEGORIES}
                mangaList={mangaList}
                onStartReading={(m, chId) => handleStartReading(m, chId)}
                onSelectManga={(m) => setSelectedDetailManga(m)}
                onNavigateToReader={() => handleTabChange('readers')}
              />
            )}

            {/* Route: /readers (Reader Page) */}
            {activeTab === 'readers' && (
              <div className="space-y-6">
                {/* Quick Resume Reading Banner (Maximizes Reader Productivity) */}
                {!activeReaderManga && lastReadProgress && (
                  <ResumeReadingBanner
                    progress={lastReadProgress}
                    onDismiss={handleDismissResumeBanner}
                    onResume={handleResumeReading}
                  />
                )}

                <ReaderPage
                  mangaList={mangaList}
                  filteredManga={filteredManga}
                  featuredManga={featuredManga}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onStartReading={handleStartReading}
                  onSelectDetailManga={(m) => setSelectedDetailManga(m)}
                  selectedFilter={selectedFilter}
                  onSelectFilter={setSelectedFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onClearSearch={() => {
                    setSelectedFilter('all');
                    setSearchQuery('');
                  }}
                  isVipUser={isVipUser}
                  ads={ads}
                  onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                  onOpenCreatorDashboard={() => setIsCreatorDashboardOpen(true)}
                  onOpenPublishModal={() => setIsPublishModalOpen(true)}
                  onNavigateToAwards={() => handleTabChange('awards')}
                  onNavigateToWallet={() => handleTabChange('wallet')}
                  onNavigateToStudio={() => handleTabChange('creators')}
                  onNavigateToChats={() => handleTabChange('chats')}
                  onNavigateToCanvas={() => handleTabChange('backdrop')}
                  onOpenAiReport={handleOpenAiReport}
                  onRunAiScanCatalog={handleRunCatalogAiScan}
                  isScanningAi={isScanningCatalogAi}
                  activeTab={activeTab}
                  onOpenTasteProfileModal={() => setIsRecommendationModalOpen(true)}
                  userTasteProfile={userTasteProfile}
                  isAdmin={isAdmin}
                />
              </div>
            )}

            {/* Route: /backdrop or /canvas (Backdrop Series & Creators) */}
            {(activeTab === 'backdrop' || (activeTab as string) === 'canvas') && (
              <BackdropPage
                key="route-backdrop-view"
                mangaList={mangaList}
                onSelectManga={(m) => setSelectedDetailManga(m)}
                onStartReading={(m, chId) => handleStartReading(m, chId || m.chapters[0]?.id || 'ch-1')}
                onOpenPublishModal={() => setIsPublishModalOpen(true)}
                onNavigateToHome={() => handleTabChange('readers')}
                currentUserEmail={currentUserEmail}
              />
            )}

            {/* Route: /creators (Studio / My Earnings Unlocked For All Authors) */}
            {activeTab === 'creators' && (
              <div key="route-creators-view" className="space-y-6">
                <CreatorEarningsView
                  currentUserEmail={currentUserEmail}
                  mangaList={mangaList}
                  onOpenUploadModal={() => setIsPublishModalOpen(true)}
                />
              </div>
            )}

            {/* Route: /chats (Chats / DMs) */}
            {activeTab === 'chats' && (
              <ChatsPage
                key="route-chats-view"
                onOpenUserProfile={() => setIsProfileModalOpen(true)}
              />
            )}

            {/* Route: /wallet (Wallet / Payouts) - ONLY available and visible to Admin */}
            {activeTab === 'wallet' && isAdmin && (
              <WalletPage
                key="route-wallet-view"
                creatorStats={creatorStats}
                userSubscription={userSubscription}
                onOpenCreatorDashboard={() => setIsCreatorDashboardOpen(true)}
                onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                isAdmin={isAdmin}
                currentUserEmail={currentUserEmail}
                onSwitchToAdmin={() => handleSwitchUserEmail(ADMIN_EMAIL)}
                onNavigateToStudioEarnings={() => handleTabChange('creators')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCreator={isCreator}
        isAdmin={isAdmin}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl">
          {/* Mobile Footer: 3-column grid with 3 words max per line, wrapping nicely */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-[9px] px-1.5 py-0.5 tracking-wider">
                AZ
              </span>
              <SouthAfricaFlameLogo size="xs" variant="sa_flag" />
              <span className="font-bold text-white text-xs">AZ Oververse</span>
              <span className="text-emerald-400 font-mono text-[11px]">🇿🇦</span>
            </div>

            {/* 3-Column Mobile Links Grid (3 words max per line, wrapping left to right) */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center text-[11px] text-slate-300">
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition flex items-center justify-center text-center font-medium leading-tight"
              >
                VIP Subscription
              </button>
              <button
                onClick={() => setIsCreatorDashboardOpen(true)}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition flex items-center justify-center text-center font-medium leading-tight"
              >
                Creator Monetization
              </button>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition flex items-center justify-center text-center font-medium leading-tight"
              >
                Publishing Studio
              </button>
              <button
                onClick={() => handleTabChange('privacy')}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition flex items-center justify-center text-center font-medium leading-tight"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => handleTabChange('terms')}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition flex items-center justify-center text-center font-medium leading-tight"
              >
                Terms of Service
              </button>
              <button
                onClick={() => handleTabChange('settings')}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/50 hover:text-amber-400 active:scale-95 transition flex items-center justify-center text-center font-medium leading-tight"
              >
                App Settings
              </button>
              <button
                onClick={() => setIsRecommendationModalOpen(true)}
                className="min-h-[40px] px-1.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:border-amber-400 hover:text-amber-200 active:scale-95 transition flex items-center justify-center text-center font-bold leading-tight"
              >
                Taste Profile
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-slate-500">
              <button
                onClick={() => handleTabChange('awards')}
                className="text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>MOTY Gala</span>
              </button>
              <span>•</span>
              <button
                id="footer-global-share-btn-mobile"
                onClick={() => setIsGlobalShareOpen(true)}
                className="hover:text-emerald-400 text-emerald-400/90 font-semibold transition flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Status & Share</span>
              </button>
            </div>
          </div>

          {/* Desktop Footer: Full horizontal row with all links */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-[9px] px-1.5 py-0.5 tracking-wider">
                AZ
              </span>
              <SouthAfricaFlameLogo size="xs" variant="sa_flag" />
              <span className="font-bold text-white">AZ Oververse</span>
              <span className="text-emerald-400 font-mono text-[11px]">🇿🇦</span>
              <span>• Next-Gen Manga Publishing & Reading Platform</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-xs flex-wrap justify-end">
              <button
                onClick={() => handleTabChange('awards')}
                className="text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>MOTY 2026 Gala Page</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="hover:text-amber-400 transition"
              >
                VIP Subscription
              </button>
              <span>•</span>
              <button
                onClick={() => setIsCreatorDashboardOpen(true)}
                className="hover:text-amber-400 transition"
              >
                Creator Monetization
              </button>
              <span>•</span>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="hover:text-amber-400 transition"
              >
                Publishing Studio
              </button>
              <span>•</span>
              <button
                onClick={() => handleTabChange('privacy')}
                className="hover:text-amber-400 transition"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => handleTabChange('terms')}
                className="hover:text-amber-400 transition"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                onClick={() => handleTabChange('settings')}
                className="hover:text-amber-400 transition"
              >
                Settings & Controls
              </button>
              <span>•</span>
              <button
                onClick={() => setIsRecommendationModalOpen(true)}
                className="text-amber-300 hover:text-amber-200 font-bold transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Taste Profile</span>
              </button>
              <span>•</span>
              <button
                id="footer-global-share-btn"
                onClick={() => setIsGlobalShareOpen(true)}
                className="hover:text-emerald-400 text-emerald-400/90 font-semibold transition flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Global Live Status & Share</span>
              </button>
            </div>
          </div>

          {/* Official AZ Oververse Copyright & Backdrop License Mandate */}
          <div className="mt-5 pt-4 border-t border-slate-900 text-slate-400 text-[11px] leading-relaxed max-w-4xl mx-auto text-center">
            All AZ Originals are © AZ Oververse / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ Oververse has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
          </div>
        </div>
      </footer>

      {/* Manga Detail Modal */}
      <MangaDetailModal
        manga={selectedDetailManga}
        isOpen={Boolean(selectedDetailManga)}
        onClose={() => setSelectedDetailManga(null)}
        userSubscription={userSubscription}
        onStartReading={(chId) => {
          if (selectedDetailManga) {
            handleStartReading(selectedDetailManga, chId);
          }
        }}
        onRequestRewardedAd={handleRequestRewardedAd}
        onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
        onUploadChapterClick={(mangaId) => {
          setUploadTargetMangaId(mangaId);
          setIsPublishModalOpen(true);
        }}
        isFavorite={selectedDetailManga ? favoriteIds.includes(selectedDetailManga.id) : false}
        onToggleFavorite={(mangaId) => handleToggleFavorite(mangaId)}
        comments={selectedDetailManga ? allComments.filter(c => c.mangaId === selectedDetailManga.id) : []}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        onOpenAiReport={handleOpenAiReport}
        allManga={mangaList}
        onSelectManga={(m) => setSelectedDetailManga(m)}
      />

      {/* Subscription Upgrade Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentSubscription={userSubscription}
        onUpdateSubscription={handleUpdateSubscription}
      />

      {/* Manga of the Year Awards Gala Modal */}
      <MangaOfTheYearAwardsModal
        isOpen={isAwardsModalOpen}
        onClose={() => setIsAwardsModalOpen(false)}
        categories={MOTY_CATEGORIES}
        mangaList={mangaList}
        onStartReading={(manga, chId) => {
          setIsAwardsModalOpen(false);
          handleStartReading(manga, chId);
        }}
        onSelectManga={(manga) => {
          setIsAwardsModalOpen(false);
          setSelectedDetailManga(manga);
        }}
      />

      {/* Publish Modal (Chapters & Series Studio) */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => {
          setIsPublishModalOpen(false);
          setUploadTargetMangaId(undefined);
        }}
        mangaList={mangaList}
        selectedMangaId={uploadTargetMangaId}
        onPublishChapter={(mangaId, chapter) => {
          handlePublishChapter(mangaId, chapter);
          if (selectedDetailManga && selectedDetailManga.id === mangaId) {
            setSelectedDetailManga((prev) =>
              prev ? { ...prev, chapters: [...prev.chapters, chapter] } : null
            );
          }
        }}
        onPublishManga={handlePublishManga}
      />

      {/* Creator Dashboard Modal */}
      <CreatorDashboardModal
        isOpen={isCreatorDashboardOpen}
        onClose={() => setIsCreatorDashboardOpen(false)}
        stats={creatorStats}
        mangaList={mangaList}
        onExecutePayout={handleExecutePayout}
        onUpdatePayoutSettings={handleUpdatePayoutSettings}
        onPublishChapter={(mangaId, chapter) => {
          handlePublishChapter(mangaId, chapter);
          if (selectedDetailManga && selectedDetailManga.id === mangaId) {
            setSelectedDetailManga((prev) =>
              prev ? { ...prev, chapters: [...prev.chapters, chapter] } : null
            );
          }
        }}
      />

      {/* Rewarded Interstitial Ad Modal */}
      {interstitialState.isOpen && interstitialState.ad && (
        <InterstitialAdModal
          ad={interstitialState.ad}
          isOpen={interstitialState.isOpen}
          onClose={handleCloseInterstitial}
          onUpgradeClick={() => {
            handleCloseInterstitial();
            setIsSubscriptionModalOpen(true);
          }}
          nextChapterTitle={interstitialState.nextChapterTitle}
        />
      )}

      {/* AdMob App Open Demo Ad Modal */}
      <AppOpenAdModal
        isOpen={isAppOpenAdOpen}
        onClose={() => setIsAppOpenAdOpen(false)}
        onUpgradeClick={() => {
          setIsAppOpenAdOpen(false);
          setIsSubscriptionModalOpen(true);
        }}
      />

      {/* Rewarded Ad Modal */}
      {rewardedState.chapter && rewardedState.ad && (
        <RewardedAdModal
          ad={rewardedState.ad}
          chapter={rewardedState.chapter}
          isOpen={rewardedState.isOpen}
          onClose={() =>
            setRewardedState((prev) => ({
              ...prev,
              isOpen: false,
              chapter: null,
              onUnlocked: undefined,
            }))
          }
          onRewardGranted={handleRewardGranted}
          onUnlockComplete={rewardedState.onUnlocked}
          onUpgradeClick={() => {
            setRewardedState((prev) => ({
              ...prev,
              isOpen: false,
              chapter: null,
              onUnlocked: undefined,
            }));
            setIsSubscriptionModalOpen(true);
          }}
        />
      )}

      {/* Global Live Deployment & Share Modal */}
      <GlobalPublishShareModal
        isOpen={isGlobalShareOpen}
        onClose={() => setIsGlobalShareOpen(false)}
      />

      {/* AI Content Detection & Auto-Ban Report Modal */}
      <AiReportModal
        manga={selectedAiReportManga}
        isOpen={isAiReportOpen}
        onClose={() => {
          setIsAiReportOpen(false);
          setSelectedAiReportManga(null);
        }}
        onToggleBan={handleToggleBan}
        onReScan={handleReScanManga}
        isAdmin={isAdmin}
      />

      {/* Device Performance Calibration Engine Modal */}
      <DevicePerformanceModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
        onTierChanged={(tier) => {
          setPerformanceTier(tier);
          setActivePerformanceTier(tier);
        }}
      />

      {/* Global Productivity Command Palette (Ctrl+K) */}
      <ProductivityCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        mangaList={mangaList}
        onStartReading={handleStartReading}
        onSelectManga={(m) => setSelectedDetailManga(m)}
        onNavigateTab={handleTabChange}
        onToggleDataSaver={() => setDataSaverMode((prev) => !prev)}
        isDataSaver={dataSaverMode}
        onToggleOled={() => setIsOledMode((prev) => !prev)}
        isOled={isOledMode}
        onOpenPerformanceModal={() => setIsPerformanceModalOpen(true)}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenCreatorDashboard={() => setIsCreatorDashboardOpen(true)}
        onRunAiScan={handleRunCatalogAiScan}
        onOpenGlobalShare={() => setIsGlobalShareOpen(true)}
        onOpenSecurityDefense={() => setIsSecurityModalOpen(true)}
        onOpenFcmNotifications={() => setIsFcmModalOpen(true)}
        onOpenWebViewerModal={() => setIsWebViewerModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenApplyMangaka={() => setIsApplyMangakaOpen(true)}
        onOpenMangakaDashboard={() => setIsMangakaDashboardOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        onOpenTasteProfile={() => setIsRecommendationModalOpen(true)}
        onOpenAppOpenAd={() => setIsAppOpenAdOpen(true)}
        isAdmin={isAdmin}
      />

      {/* USER PROFILE & DAILY READING STREAK MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUserEmail={currentUserEmail}
        userSubscription={userSubscription}
        mangas={mangaList}
        onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
        onOpenApplyMangaka={() => setIsApplyMangakaOpen(true)}
        onOpenMangakaDashboard={() => setIsMangakaDashboardOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onSwitchUserEmail={handleSwitchUserEmail}
        onStartReading={(m, chapId) => {
          const targetManga = m || mangaList[0];
          if (targetManga) {
            handleStartReading(targetManga, chapId || targetManga.chapters[0]?.id);
          }
        }}
      />

      {/* "APPLY AS MANGAKA" MODAL SCREEN */}
      <ApplyAsMangakaModal
        isOpen={isApplyMangakaOpen}
        onClose={() => setIsApplyMangakaOpen(false)}
        currentUserEmail={currentUserEmail}
        onOpenMangakaDashboard={() => setIsMangakaDashboardOpen(true)}
      />

      {/* MANGAKA DASHBOARD (MY MANGAS, VIEWS, EARNINGS & + UPLOAD MANGA) */}
      <MangakaDashboardModal
        isOpen={isMangakaDashboardOpen}
        onClose={() => setIsMangakaDashboardOpen(false)}
        currentUserEmail={currentUserEmail}
        mangaList={mangaList}
        creatorStats={creatorStats}
        onSubmitNewManga={handleSubmitNewMangaFromMangaka}
        onOpenApplyModal={() => setIsApplyMangakaOpen(true)}
        onDeleteManga={handleDeleteManga}
        onPublishChapter={handlePublishChapter}
        comments={allComments}
      />

      {/* YOUR ADMIN DASHBOARD (APPROVE / REJECT / FEATURE & REORDER) */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        mangaList={mangaList}
        onApproveManga={handleApproveManga}
        onRejectManga={handleRejectManga}
        onToggleFeatured={handleToggleFeatured}
        onToggleOriginal={handleToggleOriginal}
        onReorderManga={handleReorderManga}
        onBulkModerateManga={handleReorderManga}
      />

      {/* 7, 30, 100 DAY CONSECUTIVE READING MILESTONE CELEBRATION OVERLAY */}
      <MilestoneCelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        milestone={celebrationMilestone}
        onShare={() => setIsGlobalShareOpen(true)}
      />

      {/* WEBVIEWER COMPONENT MODAL (Android 13 / Wide Viewport / No Zoom) */}
      <WebViewerModal
        isOpen={isWebViewerModalOpen}
        onClose={() => setIsWebViewerModalOpen(false)}
      />

      {/* DEFENSE ×5 CYBER SUITE MODAL */}
      <SecurityDefenseModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* FCM CHAPTER DROP NOTIFICATIONS MODAL */}
      <FcmNotificationsModal
        isOpen={isFcmModalOpen}
        onClose={() => setIsFcmModalOpen(false)}
        onReadChapter={handleResumeReading}
      />

      {/* FCM FOREGROUND CHAPTER DROP PUSH BANNER */}
      <FcmNotificationBanner onReadChapter={handleResumeReading} />

      {/* DAILY READING GOAL REWARD NOTIFICATION */}
      <DailyRewardNotification onOpenProfileModal={() => setIsProfileModalOpen(true)} />

      {/* MANGA TASTE PROFILE & RECOMMENDATION ENGINE MODAL */}
      <RecommendationModal
        isOpen={isRecommendationModalOpen}
        onClose={() => setIsRecommendationModalOpen(false)}
        mangaList={mangaList}
        onSelectDetailManga={(m) => setSelectedDetailManga(m)}
        onStartReading={(m, chId) => {
          setIsRecommendationModalOpen(false);
          handleStartReading(m, chId);
        }}
        onProfileUpdated={(updated) => setUserTasteProfile({ ...updated })}
      />

      {/* Persistent Bottom Google AdMob Banner (Always Visible Across Entire App) */}
      <AdMobBanner
        variant="persistent-bottom"
        onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
      />

      {/* AZ OVERVERSE SPLASH SCREEN (Header AZ Logo + Dark Theme) */}
      {showSplash && (
        <SplashScreen
          duration={1500}
          onFinish={handleFinishSplash}
        />
      )}
    </div>
  </ErrorBoundary>
);
}
