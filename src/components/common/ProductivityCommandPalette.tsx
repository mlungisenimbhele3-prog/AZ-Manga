import React, { useState, useEffect, useRef } from 'react';
import { Manga } from '../../types';
import {
  Search,
  BookOpen,
  Sparkles,
  Trophy,
  Coins,
  Zap,
  Moon,
  Sun,
  Shield,
  UploadCloud,
  X,
  Keyboard,
  ArrowRight,
  Flame,
  Bot,
  Globe,
  Sliders,
  ShieldCheck,
  BellRing,
  Smartphone,
  Crown,
  Settings,
  Layers,
  MessageSquare,
  Wallet,
} from 'lucide-react';

interface ProductivityCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  mangaList: Manga[];
  onStartReading: (manga: Manga, chapterId: string) => void;
  onSelectManga: (manga: Manga) => void;
  onNavigateTab: (tab: any) => void;
  onToggleDataSaver: () => void;
  isDataSaver: boolean;
  onToggleOled: () => void;
  isOled: boolean;
  onOpenPerformanceModal: () => void;
  onOpenPublish: () => void;
  onOpenCreatorDashboard: () => void;
  onRunAiScan?: () => void;
  onOpenGlobalShare?: () => void;
  onOpenSecurityDefense?: () => void;
  onOpenFcmNotifications?: () => void;
  onOpenWebViewerModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenApplyMangaka?: () => void;
  onOpenMangakaDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenSubscription?: () => void;
  onOpenTasteProfile?: () => void;
  onOpenAppOpenAd?: () => void;
  isAdmin?: boolean;
}

export const ProductivityCommandPalette: React.FC<ProductivityCommandPaletteProps> = ({
  isOpen,
  onClose,
  mangaList,
  onStartReading,
  onSelectManga,
  onNavigateTab,
  onToggleDataSaver,
  isDataSaver,
  onToggleOled,
  isOled,
  onOpenPerformanceModal,
  onOpenPublish,
  onOpenCreatorDashboard,
  onRunAiScan,
  onOpenGlobalShare,
  onOpenSecurityDefense,
  onOpenFcmNotifications,
  onOpenWebViewerModal,
  onOpenProfileModal,
  onOpenApplyMangaka,
  onOpenMangakaDashboard,
  onOpenAdminDashboard,
  onOpenSubscription,
  onOpenTasteProfile,
  onOpenAppOpenAd,
  isAdmin = false,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter commands and manga
  const systemActions = [
    {
      id: 'manga-recommendations-taste',
      title: 'Manga Taste Profile & Recommendations (Content & Collaborative Filtering)',
      category: 'Recommendation Engine',
      icon: <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />,
      action: () => {
        onClose();
        onOpenTasteProfile?.();
      },
    },
    {
      id: 'daily-reading-streak',
      title: 'Daily Reading Streak & Profile (Habits, Milestones & Flame Badges)',
      category: 'Profile & Streak',
      icon: <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />,
      action: () => {
        onClose();
        onOpenProfileModal?.();
      },
    },
    {
      id: 'apply-mangaka-cmd',
      title: 'Become a Mangaka (Apply to Publish Original Manga: Name, Bio, ID Photo)',
      category: 'Creators & Publishing',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenApplyMangaka?.();
      },
    },
    {
      id: 'mangaka-dashboard-cmd',
      title: 'Mangaka Dashboard (My Mangas, Views & 70% ZAR Payouts)',
      category: 'Creators & Publishing',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenMangakaDashboard?.();
      },
    },
    {
      id: 'admin-dashboard-cmd',
      title: 'Your Admin Dashboard (Approve / Reject Applications, Verify Manga & Feature)',
      category: 'Executive Producer Admin',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenAdminDashboard?.();
      },
    },
    {
      id: 'perf-profile',
      title: 'Calibrate Device Performance (Ultra 120Hz / Lite Saver)',
      category: 'System & Speed',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenPerformanceModal();
      },
    },
    {
      id: 'toggle-data-saver',
      title: `Toggle Data Saver Mode (${isDataSaver ? 'Currently ON' : 'Currently OFF'})`,
      category: 'Preferences',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onToggleDataSaver();
        onClose();
      },
    },
    {
      id: 'toggle-oled',
      title: `Toggle OLED Deep Black Theme (${isOled ? 'Currently ON' : 'Currently OFF'})`,
      category: 'Display',
      icon: isOled ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-300" />,
      action: () => {
        onToggleOled();
        onClose();
      },
    },
    {
      id: 'nav-reader',
      title: 'Go to Reader Hub',
      category: 'Navigation',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTab('readers');
        onClose();
      },
    },
    {
      id: 'nav-backdrop',
      title: 'Go to AZ Backdrop (Indie Creators & Canvas)',
      category: 'Navigation',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateTab('backdrop');
        onClose();
      },
    },
    {
      id: 'nav-studio-tab',
      title: 'Go to Creator Studio (My Earnings & Reads)',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTab('creators');
        onClose();
      },
    },
    {
      id: 'nav-chats-tab',
      title: 'Go to Community Chats',
      category: 'Navigation',
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
      action: () => {
        onNavigateTab('chats');
        onClose();
      },
    },
    ...(isAdmin
      ? [
          {
            id: 'nav-wallet-tab',
            title: 'Go to Admin Treasury Wallet & Payouts',
            category: 'Navigation',
            icon: <Wallet className="w-4 h-4 text-purple-400" />,
            action: () => {
              onNavigateTab('wallet');
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'nav-awards',
      title: 'Manga of the Year Awards 2026 Page',
      category: 'Navigation',
      icon: <Trophy className="w-4 h-4 text-amber-300" />,
      action: () => {
        onNavigateTab('awards');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'App Settings & Performance Controls (120Hz Engine, mlungisenimbhele3@gmail.com, Licensing & Terms)',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTab('settings');
        onClose();
      },
    },
    {
      id: 'nav-creator',
      title: 'Open Creator Studio (70% Google AdMob & Google Play Billing Revenue)',
      category: 'Publishing',
      icon: <Coins className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenCreatorDashboard();
      },
    },
    {
      id: 'upload-chapter',
      title: 'Upload New Manga Chapter or Series',
      category: 'Publishing',
      icon: <UploadCloud className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenPublish();
      },
    },
    {
      id: 'ai-scan',
      title: 'Run Deep Neural AI Scan on Catalog',
      category: 'Security & Moderation',
      icon: <Bot className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onClose();
        onRunAiScan?.();
      },
    },
    {
      id: 'defense-security',
      title: 'Open Defense ×5 Security Suite (CSP, Anti-XSS, Rate Limit, Supabase RLS, Vault)',
      category: 'Security & Moderation',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenSecurityDefense?.();
      },
    },
    {
      id: 'fcm-push-alerts',
      title: 'FCM Chapter Drop Alerts (Push Notifications Settings & History)',
      category: 'Notifications',
      icon: <BellRing className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenFcmNotifications?.();
      },
    },
    {
      id: 'manage-subscriptions',
      title: 'Manage Subscription & In-App Purchases (VIP Ad-Free, Pro Early Access, Creator Patron)',
      category: 'Subscription & VIP',
      icon: <Crown className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenSubscription?.();
      },
    },
    {
      id: 'webviewer-settings',
      title: 'WebViewer Component: Uncheck ZoomDisplay, Uncheck SupportZoom, Check WideViewPort, Android 13 UA',
      category: 'System & Speed',
      icon: <Smartphone className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenWebViewerModal?.();
      },
    },
    {
      id: 'global-share',
      title: 'Share AZ OVERVERSE Worldwide (QR & Links)',
      category: 'Distribution',
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      action: () => {
        onClose();
        onOpenGlobalShare?.();
      },
    },
    {
      id: 'github-repo-link',
      title: 'Copy GitHub Repository Link: mlungisenimbhele3-prog/AZ-Manga',
      category: 'Developer & CI/CD',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      action: () => {
        navigator.clipboard?.writeText('https://github.com/mlungisenimbhele3-prog/AZ-Manga').catch(() => {});
        onClose();
        onOpenGlobalShare?.();
      },
    },
    {
      id: 'download-release-aab',
      title: 'Copy Google Play Release Bundle Link (AZ-Oververse-PlayStore.aab)',
      category: 'Developer & CI/CD',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      action: () => {
        navigator.clipboard?.writeText('https://github.com/mlungisenimbhele3-prog/AZ-Manga/releases/latest/download/AZ-Oververse-PlayStore.aab').catch(() => {});
        onClose();
        onOpenGlobalShare?.();
      },
    },
    {
      id: 'admob-app-open-demo',
      title: 'AdMob App Open Test Ad (ca-app-pub-3940256099942544/9257395921)',
      category: 'Monetization (AdMob)',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenAppOpenAd?.();
      },
    },
    {
      id: 'admob-rewarded-interstitial-info',
      title: 'AdMob Rewarded Interstitial Test ID (ca-app-pub-3940256099942544/5354046379)',
      category: 'Monetization (AdMob)',
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onClose();
        alert('AdMob Rewarded Interstitial Test Unit ID: ca-app-pub-3940256099942544/5354046379\n\nActive for chapter intermissions and transition ad breaks.');
      },
    },
    {
      id: 'admob-rewarded-ads-info',
      title: 'AdMob Rewarded Ads Test ID (ca-app-pub-3940256099942544/5224354917)',
      category: 'Monetization (AdMob)',
      icon: <Coins className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        alert('AdMob Rewarded Ads Test Unit ID: ca-app-pub-3940256099942544/5224354917\n\nActive for daily coin claims and VIP chapter unlocks.');
      },
    },
  ];

  const filteredManga = mangaList.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    m.genres.some((g) => g.toLowerCase().includes(query.toLowerCase())) ||
    m.author.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = systemActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5 bg-slate-950">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, manga title, or shortcut (e.g. 'perf', 'hunter', 'awards')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-1.5">
                Productivity Actions ({filteredActions.length})
              </span>
              <div className="space-y-1">
                {filteredActions.map((item, idx) => (
                  <button
                    key={`cmd-action-${item.id}-${idx}`}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-800 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 border border-slate-800">
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition">
                          {item.title}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manga Search Results */}
          {filteredManga.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-1.5">
                Manga Series ({filteredManga.length})
              </span>
              <div className="space-y-1">
                {filteredManga.map((manga, idx) => (
                  <div
                    key={`cmd-manga-${manga.id}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition group"
                  >
                    <div
                      onClick={() => {
                        onClose();
                        onSelectManga(manga);
                      }}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <img
                        src={manga.coverImage}
                        alt={manga.title}
                        className="h-10 w-8 rounded object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-amber-300 transition block">
                          {manga.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {manga.chapters.length} Chapters • {manga.genres.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onStartReading(manga, manga.chapters[0].id);
                      }}
                      className="rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <span>Read Ch. 1</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && filteredManga.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching commands or manga titles found for "{query}".
            </div>
          )}
        </div>

        {/* Footer with Productivity Shortcut Hints */}
        <div className="border-t border-slate-800 px-4 py-2.5 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Shortcuts: Press <strong>Ctrl+K</strong> or <strong>⌘K</strong> anytime</span>
          </div>
          <span className="text-slate-500">AZ OVERVERSE Fast Engine</span>
        </div>
      </div>
    </div>
  );
};
