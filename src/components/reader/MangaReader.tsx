import React, { useState, useEffect, useRef } from 'react';
import { Chapter, Manga, ReadingSettings, UserSubscription, AdData } from '../../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  Sparkles,
  Bookmark,
  Heart,
  Share2,
  Menu,
  X,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle,
  DownloadCloud,
  Keyboard,
  Columns,
  BookOpen,
  Smartphone,
  Flame,
  Zap,
} from 'lucide-react';
import { LazyMangaPage } from './LazyMangaPage';
import { saveChapterOffline } from '../../services/offlineCache';
import { safeStorage } from '../../utils/safeStorage';
import { getProfileConfig } from '../../utils/devicePerformance';
import { getWebViewerConfig } from '../../utils/webViewerConfig';
import {
  getReadingStreak,
  recordChapterRead,
  ReadingStreakData,
} from '../../utils/readingStreak';
import {
  saveReadingProgress,
  isMangaBookmarked,
  toggleMangaBookmark,
  getCurrentUserProfile,
} from '../../services/userProfile';

interface MangaReaderProps {
  manga: Manga;
  initialChapterId: string;
  userSubscription: UserSubscription;
  ads: AdData[];
  onBack: () => void;
  onUpgradeClick: () => void;
  onRequestRewardedAd: (chapter: Chapter, onUnlocked?: () => void) => void;
  onShowInterstitial: (nextChapterTitle: string, proceedCallback: () => void) => void;
  onOpenWebViewerConfig?: () => void;
  onOpenProfileModal?: () => void;
}

export const MangaReader: React.FC<MangaReaderProps> = ({
  manga,
  initialChapterId,
  userSubscription,
  ads,
  onBack,
  onUpgradeClick,
  onRequestRewardedAd,
  onShowInterstitial,
  onOpenWebViewerConfig,
  onOpenProfileModal,
}) => {
  const [currentChapterId, setCurrentChapterId] = useState<string>(initialChapterId);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showChapterDrawer, setShowChapterDrawer] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => isMangaBookmarked(manga.id));
  const [autoScrollActive, setAutoScrollActive] = useState<boolean>(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState<boolean>(false);
  const [streakData, setStreakData] = useState<ReadingStreakData>(() => getReadingStreak());
  const [showStreakCelebration, setShowStreakCelebration] = useState<boolean>(false);
  const [streakCelebrationMessage, setStreakCelebrationMessage] = useState<string>('');
  const [showStreakPopover, setShowStreakPopover] = useState<boolean>(false);
  // Left-to-Right (LTR) Manga Reading Direction
  const readingDirection = 'ltr' as const;
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [lastTapZoneFeedback, setLastTapZoneFeedback] = useState<'left' | 'right' | null>(null);

  // Sync streak state if updated externally
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

  const handleSaveOffline = async () => {
    await saveChapterOffline({
      id: currentChapter.id,
      mangaId: manga.id,
      title: currentChapter.title,
      number: currentChapter.number,
      pages: currentChapter.pages,
    });
    setIsOfflineSaved(true);
    setTimeout(() => setIsOfflineSaved(false), 3000);
  };

  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const prefs = getCurrentUserProfile().preferences || ({} as any);
    return {
      mode: prefs.readingDirection === 'vertical' ? 'webtoon' : 'single-page',
      direction: prefs.readingDirection === 'vertical' ? 'vertical' : 'ltr',
      theme: prefs.theme === 'sepia' ? 'sepia' : prefs.theme === 'light' ? 'light' : prefs.theme === 'dark' ? 'dark' : 'black',
      zoom: 100,
      autoScroll: prefs.autoScroll || false,
      scrollSpeed: prefs.autoScrollSpeed || 2,
    };
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollFrameRef = useRef<number | null>(null);

  const currentChapter = manga.chapters.find((c) => c.id === currentChapterId) || manga.chapters[0];
  const currentChapterIndex = manga.chapters.findIndex((c) => c.id === currentChapterId);

  if (!currentChapter || !currentChapter.pages || currentChapter.pages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0d14] text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <span className="inline-block rounded-full bg-amber-500 text-black px-3 py-1 text-xs font-black uppercase tracking-wider">
            COMING SOON
          </span>
          <h2 className="text-2xl font-black text-white">{manga.title}</h2>
          <p className="text-sm text-slate-300">
            No story panels have been uploaded yet. The artist and publisher are currently producing Episode 1. Check back soon!
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-xs font-bold transition border border-slate-700 shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </button>
      </div>
    );
  }

  const isVipUser =
    userSubscription.tier === 'vip' ||
    userSubscription.tier === 'early_access' ||
    userSubscription.tier === 'patron';
  const hasEarlyAccess =
    userSubscription.tier === 'early_access' || userSubscription.tier === 'patron';
  const isChapterUnlocked = currentChapter.isEarlyAccess
    ? hasEarlyAccess
    : currentChapter.accessType === 'free' ||
      isVipUser ||
      userSubscription.unlockedChapters.includes(currentChapter.id);

  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < manga.chapters.length - 1
      ? manga.chapters[currentChapterIndex + 1]
      : null;
  const isNextChapterLocked = Boolean(
    nextChapter &&
      !isVipUser &&
      nextChapter.accessType === 'premium' &&
      !userSubscription.unlockedChapters.includes(nextChapter.id)
  );

  // Auto-save reading progress to user profile and Firestore
  useEffect(() => {
    if (manga && currentChapter) {
      saveReadingProgress({
        mangaId: manga.id,
        mangaTitle: manga.title,
        mangaCover: manga.coverImage,
        chapterId: currentChapter.id,
        chapterNumber: currentChapter.number,
        chapterTitle: currentChapter.title,
        pageNumber: currentPageIndex + 1,
        totalPages: currentChapter.pages?.length || 1,
        progressPercent: Math.round(((currentPageIndex + 1) / Math.max(1, currentChapter.pages?.length || 1)) * 100),
        completed: currentPageIndex >= (currentChapter.pages?.length || 1) - 1,
      });
    }
  }, [manga.id, currentChapter?.id, currentPageIndex]);

  // Auto-record Last Read Progress for instant 1-tap productivity resume
  useEffect(() => {
    if (manga && currentChapter) {
      safeStorage.setJSON('ka_pulse_last_read', {
        mangaId: manga.id,
        mangaTitle: manga.title,
        coverImage: manga.coverImage,
        chapterId: currentChapter.id,
        chapterNumber: currentChapter.number,
        chapterTitle: currentChapter.title,
        pageIndex: currentPageIndex,
        totalPages: currentChapter.pages.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, [manga, currentChapter, currentPageIndex]);

  // Track and Record Daily Reading Streak whenever chapter is opened or read
  useEffect(() => {
    if (manga && currentChapter) {
      const res = recordChapterRead(
        manga.id,
        currentChapter.id,
        `Ch. ${currentChapter.number}: ${currentChapter.title}`
      );
      setStreakData(res.streak);
      if (res.streakIncremented) {
        setStreakCelebrationMessage(`🔥 Day ${res.newStreakCount} Streak Logged! Keep the reading fire burning!`);
        setShowStreakCelebration(true);
        setTimeout(() => setShowStreakCelebration(false), 5000);

        if (res.newStreakCount === 7 || res.newStreakCount === 30 || res.newStreakCount === 100) {
          window.dispatchEvent(
            new CustomEvent('ka_pulse_celebrate_milestone', {
              detail: { days: res.newStreakCount },
            })
          );
        }
      }
    }
  }, [manga?.id, currentChapter?.id]);

  // Adaptive Preloading based on Device Performance Profile (Instant page flips)
  useEffect(() => {
    if (!currentChapter || !currentChapter.pages) return;
    try {
      const config = getProfileConfig();
      const preloadCount = config.imagePreloadCount || 2;
      for (let i = 1; i <= preloadCount; i++) {
        const targetIdx = currentPageIndex + i;
        if (currentChapter.pages[targetIdx]?.imageUrl) {
          const img = new Image();
          img.decoding = 'async';
          img.src = currentChapter.pages[targetIdx].imageUrl;
        }
      }
    } catch (e) {
      // Safe fallback if preloading unavailable
    }
  }, [currentChapter, currentPageIndex]);

  // 120Hz/60Hz Hardware RAF Auto-Scroll loop for buttery-smooth AZ Vertical reading
  useEffect(() => {
    if (autoScrollActive && settings.mode === 'webtoon') {
      let lastTimestamp = performance.now();
      const scrollStep = (now: number) => {
        const delta = Math.min(32, now - lastTimestamp);
        lastTimestamp = now;
        if (scrollContainerRef.current) {
          const scrollDistance = (settings.scrollSpeed * delta) / 16.6;
          scrollContainerRef.current.scrollTop += scrollDistance;
        }
        autoScrollFrameRef.current = requestAnimationFrame(scrollStep);
      };
      autoScrollFrameRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    }
    return () => {
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    };
  }, [autoScrollActive, settings.mode, settings.scrollSpeed]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Switch Chapters with Monetization Logic
  const handleChapterSelect = (chapter: Chapter) => {
    if (chapter.isEarlyAccess && !hasEarlyAccess) {
      onUpgradeClick();
      return;
    }

    const isLocked =
      !chapter.isEarlyAccess &&
      chapter.accessType === 'premium' &&
      !isVipUser &&
      !userSubscription.unlockedChapters.includes(chapter.id);

    if (isLocked) {
      // Prompt rewarded ad unlock or VIP pass
      onRequestRewardedAd(chapter);
      return;
    }

    const proceed = () => {
      setCurrentChapterId(chapter.id);
      setCurrentPageIndex(0);
      setShowChapterDrawer(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // If Free user switching chapters, show interstitial ad
    if (!isVipUser) {
      onShowInterstitial(chapter.title, proceed);
    } else {
      proceed();
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < manga.chapters.length - 1) {
      handleChapterSelect(manga.chapters[currentChapterIndex + 1]);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      handleChapterSelect(manga.chapters[currentChapterIndex - 1]);
    }
  };

  // PageView Navigation Handlers (Shonen Jump Tap Zones & Swipes)
  const handlePageNext = () => {
    if (currentPageIndex < currentChapter.pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setLastTapZoneFeedback('right');
      setTimeout(() => setLastTapZoneFeedback(null), 300);
    } else if (currentChapterIndex < manga.chapters.length - 1) {
      handleNextChapter();
    }
  };

  const handlePagePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      setLastTapZoneFeedback('left');
      setTimeout(() => setLastTapZoneFeedback(null), 300);
    } else if (currentChapterIndex > 0) {
      handlePrevChapter();
    }
  };

  // Touch Swipe Gesture for PageView.builder (scrollDirection: Axis.horizontal)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Detect horizontal swipe (threshold > 45px) in Left-to-Right (LTR) order
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swiped Left -> Next Page in LTR
        handlePageNext();
      } else {
        // Swiped Right -> Previous Page in LTR
        handlePagePrev();
      }
    }
  };

  // Keyboard controls for LTR reading & productivity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const isAdvanceKey =
        e.key === 'ArrowRight' || e.key === 'Space' || e.key === ' ' || e.key.toLowerCase() === 'd';

      const isRetreatKey =
        e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a';

      if (isAdvanceKey) {
        if (settings.mode === 'single-page') {
          if (currentPageIndex < currentChapter.pages.length - 1) {
            setCurrentPageIndex((prev) => prev + 1);
          } else {
            handleNextChapter();
          }
        } else if (settings.mode === 'double-page') {
          if (currentPageIndex < currentChapter.pages.length - 2) {
            setCurrentPageIndex((prev) => prev + 2);
          } else {
            handleNextChapter();
          }
        }
      } else if (isRetreatKey) {
        if (settings.mode === 'single-page') {
          if (currentPageIndex > 0) {
            setCurrentPageIndex((prev) => prev - 1);
          } else {
            handlePrevChapter();
          }
        } else if (settings.mode === 'double-page') {
          if (currentPageIndex >= 2) {
            setCurrentPageIndex((prev) => prev - 2);
          } else {
            handlePrevChapter();
          }
        }
      } else if (e.key.toLowerCase() === 'w') {
        // Quick toggle reading mode
        setSettings((prev) => ({
          ...prev,
          mode: prev.mode === 'webtoon' ? 'single-page' : prev.mode === 'single-page' ? 'double-page' : 'webtoon',
        }));
      } else if (e.key.toLowerCase() === 'b') {
        setIsBookmarked((prev) => !prev);
      } else if (e.key === '?') {
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
        } else if (showSettingsDrawer) {
          setShowSettingsDrawer(false);
        } else if (showChapterDrawer) {
          setShowChapterDrawer(false);
        } else {
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.mode, readingDirection, currentPageIndex, currentChapter, currentChapterIndex, showShortcutsModal, showSettingsDrawer, showChapterDrawer]);

  // Theme styles
  const getThemeClass = () => {
    switch (settings.theme) {
      case 'black':
        return 'bg-black text-slate-100';
      case 'dark':
        return 'bg-[#0f172a] text-slate-100';
      case 'sepia':
        return 'bg-[#2b241e] text-[#f7e6d0]';
      case 'light':
        return 'bg-[#f4f4f5] text-slate-900';
      default:
        return 'bg-black text-slate-100';
    }
  };

  const currentRandomAd = ads[Math.floor(Math.random() * ads.length)] || ads[0];

  return (
    <div
      id="manga-reader-container"
      className={`relative h-screen w-full select-none overflow-hidden ${getThemeClass()}`}
    >
      {/* Smooth Reading Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-slate-900/60 z-50 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-400 transition-all duration-200"
          style={{
            width: `${
              settings.mode === 'single-page'
                ? ((currentPageIndex + 1) / Math.max(1, currentChapter.pages.length)) * 100
                : ((currentChapterIndex + 1) / Math.max(1, manga.chapters.length)) * 100
            }%`,
          }}
        />
      </div>

      {/* Top Floating Navigation Bar */}
      <div
        id="reader-top-navbar"
        className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-2.5 backdrop-blur-md transition-transform duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="reader-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Series</span>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {manga.title}
              </h2>
              <span className="hidden md:inline rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 px-1.5 py-0.2">
                Producer: Mlungiseni Mbhele
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">
                Ch. {currentChapter.number}: {currentChapter.title}
              </span>
              <span>•</span>
              <span>
                {settings.mode === 'webtoon'
                  ? `${currentChapter.pages.length} Pages Vertical`
                  : `Page ${currentPageIndex + 1} / ${currentChapter.pages.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Left-to-Right (LTR) Reading Mode Button */}
          <button
            id="reader-direction-ltr-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (settings.mode === 'webtoon') {
                setSettings((prev) => ({ ...prev, mode: 'single-page', direction: 'ltr' }));
              }
            }}
            className="min-h-[38px] flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-300 transition whitespace-nowrap shrink-0"
            title="Left-to-Right (LTR) Manga Mode: Tap right or swipe left for next page"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Left-to-Right (LTR)</span>
          </button>

          {/* Quick Mode Toggle (AZ Vertical Strip vs Horizontal PageView) */}
          <button
            id="reader-mode-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSettings((prev) => ({
                ...prev,
                mode: prev.mode === 'webtoon' ? 'single-page' : 'webtoon',
              }));
            }}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-200 transition"
            title={settings.mode === 'webtoon' ? 'Switch to Shonen Jump PageView Mode' : 'Switch to AZ Vertical Scroll'}
          >
            {settings.mode === 'webtoon' ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Jump Mode</span>
              </>
            ) : (
              <>
                <Columns className="w-3.5 h-3.5 text-cyan-400" />
                <span>AZ Vertical Mode</span>
              </>
            )}
          </button>

          {/* Daily Reading Streak Counter in Reader Header */}
          <div className="relative">
            <button
              id="reader-streak-counter-btn"
              onClick={() => {
                if (onOpenProfileModal) {
                  onOpenProfileModal();
                } else {
                  setShowStreakPopover((prev) => !prev);
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 px-2.5 py-1.5 text-xs font-black text-amber-300 hover:border-amber-400 hover:bg-amber-950 transition shadow-sm"
              title={`Daily Reading Streak: ${streakData.currentStreak} Days! (Click for Streak Details & Profile)`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse flex-shrink-0" />
              <span className="font-mono text-white text-xs">{streakData.currentStreak}d</span>
              <span className="hidden md:inline text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                Streak
              </span>
              {streakData.todayRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" title="Today's goal completed!" />
              )}
            </button>

            {/* Quick Streak Popover */}
            {showStreakPopover && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-950 border border-amber-500/50 p-3.5 shadow-2xl z-50 animate-fadeIn text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    <span>Daily Reading Streak</span>
                  </div>
                  <button
                    onClick={() => setShowStreakPopover(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 text-center">
                  <div className="text-2xl font-black font-mono text-white">
                    {streakData.currentStreak} <span className="text-amber-400 text-sm">DAYS</span>
                  </div>
                  <span className="inline-block mt-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 text-[9px] font-bold">
                    {streakData.tierTitle}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1.5">
                    {streakData.todayRead
                      ? '🔥 Today’s chapter logged! Streak secured.'
                      : '⚡ Read today’s chapter to keep your streak!'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Record: <strong className="text-amber-400">{streakData.longestStreak}d</strong></span>
                  <span>Total Read: <strong className="text-white">{streakData.totalChaptersRead} chs</strong></span>
                </div>

                {onOpenProfileModal && (
                  <button
                    onClick={() => {
                      setShowStreakPopover(false);
                      onOpenProfileModal();
                    }}
                    className="w-full mt-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black hover:opacity-95 transition shadow"
                  >
                    View Full Profile & Badges
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Monetization Status Indicator */}
          {isVipUser ? (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-purple-950/80 border border-purple-500/50 px-2.5 py-1 text-[11px] font-bold text-purple-200">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>VIP Ad-Free Active</span>
            </div>
          ) : (
            <button
              id="reader-remove-ads-pill"
              onClick={onUpgradeClick}
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-1 text-xs font-bold text-black hover:opacity-90 shadow transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>Remove Ads</span>
            </button>
          )}

          {/* Save Offline for Data Saver Mode */}
          <button
            id="reader-save-offline-btn"
            onClick={handleSaveOffline}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
              isOfflineSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
            }`}
            title="Save Chapter for Offline Reading in Data Saver Mode"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isOfflineSaved ? 'Cached!' : 'Save Offline'}</span>
          </button>

          {/* Chapters Drawer Toggle */}
          <button
            id="reader-chapters-menu-btn"
            onClick={() => setShowChapterDrawer(!showChapterDrawer)}
            className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition"
            title="Chapter Index"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Keyboard Shortcuts Guide */}
          <button
            id="reader-shortcuts-btn"
            onClick={() => setShowShortcutsModal(true)}
            className="hidden sm:flex rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Reader Settings Drawer Toggle */}
          <button
            id="reader-settings-btn"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition"
            title="Reading Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            id="reader-fullscreen-btn"
            onClick={toggleFullscreen}
            className="hidden sm:block rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Daily Streak Celebration Toast Floating Banner */}
      {showStreakCelebration && (
        <div
          id="reader-streak-celebration-toast"
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-2xl border border-amber-400/80 bg-gradient-to-r from-amber-950/95 via-black/95 to-amber-950/95 px-4 py-2.5 text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-md animate-fadeIn"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Flame className="w-4 h-4 fill-amber-400 animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold tracking-tight">
              {streakCelebrationMessage}
            </span>
            <span className="text-[10px] text-amber-400 font-medium">
              Daily Reading Streak Active • Motivates African Authors
            </span>
          </div>
          <button
            onClick={() => setShowStreakCelebration(false)}
            className="ml-2 p-1 rounded-lg text-amber-400/80 hover:bg-amber-500/20 hover:text-white transition"
            aria-label="Dismiss streak toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <div
        ref={scrollContainerRef}
        onClick={() => setShowControls((prev) => !prev)}
        className="h-full w-full overflow-y-auto overflow-x-hidden pt-14 pb-28 scrollbar-thin scrollbar-thumb-slate-700 smooth-scroll-container overscroll-y-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* If Chapter is Locked for this session */}
        {!isChapterUnlocked ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            {currentChapter.isEarlyAccess ? (
              <>
                <div className="h-20 w-20 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-4 text-cyan-300 shadow-xl">
                  <Zap className="w-10 h-10 text-cyan-400 fill-cyan-400 animate-pulse" />
                </div>
                <span className="text-xs uppercase font-black tracking-wider text-cyan-400 mb-1">
                  ⚡ PRO EARLY ACCESS SIMULPUB
                </span>
                <h3 className="text-2xl font-black text-white mb-2">
                  {currentChapter.title}
                </h3>
                <p className="text-sm text-slate-300 max-w-md mb-6">
                  This chapter was dropped early exclusively for Pro Early Access & Patron supporters ({currentChapter.earlyAccessDaysLeft || 7} days ahead of public release). Subscribe to read now with high-speed bandwidth and zero ads!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <button
                    id="unlock-early-access-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpgradeClick();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-black font-black py-3 text-sm transition shadow-lg"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>Get Pro Early Access</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChapterDrawer(true);
                    }}
                    className="rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 text-sm transition"
                  >
                    Chapters
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4 text-purple-300 shadow-xl">
                  <Sparkles className="w-10 h-10 text-amber-400" />
                </div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1">
                  Simulpub VIP Fast Pass
                </span>
                <h3 className="text-2xl font-black text-white mb-2">
                  {currentChapter.title}
                </h3>
                <p className="text-sm text-slate-300 max-w-md mb-6">
                  Unlock this chapter free by watching a short Google AdMob rewarded ad, or subscribe via Google Play Billing for ad-free VIP reading.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg justify-center">
                  <button
                    id="unlock-chapter-rewarded-ad-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestRewardedAd(currentChapter);
                    }}
                    className="min-h-[44px] flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-5 text-xs sm:text-sm transition shadow-lg whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-black shrink-0" />
                    <span>Watch ad to unlock next chapter</span>
                  </button>

                  <button
                    id="unlock-chapter-vip-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpgradeClick();
                    }}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 px-4 text-xs sm:text-sm transition shadow-lg whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Google Play VIP</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : settings.mode === 'webtoon' ? (
          /* AZ Vertical Strip Mode */
          <div
            className="mx-auto flex flex-col items-center transition-all"
            style={{ width: `${Math.min(100, Math.max(50, settings.zoom))}%`, maxWidth: '820px' }}
          >
            {/* Top Chapter Splash Info */}
            <div className="w-full text-center py-6 border-b border-white/10 mb-4">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                {manga.title}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Chapter {currentChapter.number}: {currentChapter.title}
              </h1>
            </div>

            {/* Manga Pages Continuous Scroll with IntersectionObserver Lazy-Loading */}
            {currentChapter.pages.map((page, index) => (
              <React.Fragment key={`row-${page.id || page.pageNumber || index}-${index}`}>
                <LazyMangaPage
                  key={`page-${page.id || page.pageNumber || index}-${index}`}
                  page={page}
                  index={index}
                  total={currentChapter.pages.length}
                  chapter={currentChapter}
                  isVipUser={isVipUser}
                  currentRandomAd={currentRandomAd}
                  onUpgradeClick={onUpgradeClick}
                  rootContainerRef={scrollContainerRef}
                  onPageInView={(_chId, pNum) => {
                    setCurrentPageIndex(pNum - 1);
                  }}
                />
              </React.Fragment>
            ))}

            {/* Chapter Finished Action Area */}
            <div className="w-full p-6 my-8 rounded-2xl border border-white/10 bg-slate-900/90 text-center max-w-xl">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-lg font-bold text-white">
                You've completed Chapter {currentChapter.number}!
              </h4>
              <p className="text-xs text-slate-300 mt-1 mb-5">
                Leave a like or support the artist by moving on to the next chapter.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`min-h-[44px] flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                    isLiked
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                  <span>{isLiked ? 'Liked!' : 'Like Chapter'}</span>
                </button>

                {nextChapter ? (
                  <>
                    {(isNextChapterLocked || !isVipUser) && (
                      <button
                        id="reader-watch-ad-next-chapter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestRewardedAd(nextChapter, () => {
                            setCurrentChapterId(nextChapter.id);
                            setCurrentPageIndex(0);
                            if (scrollContainerRef.current) {
                              scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          });
                        }}
                        className="min-h-[44px] flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 text-xs sm:text-sm transition shadow-lg whitespace-nowrap shrink-0"
                      >
                        <Play className="w-4 h-4 fill-black shrink-0" />
                        <span>Watch ad to unlock next chapter</span>
                      </button>
                    )}

                    {!isNextChapterLocked && (
                      <button
                        id="reader-next-chapter-bottom-btn"
                        onClick={handleNextChapter}
                        className="min-h-[44px] flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-5 py-2.5 text-xs sm:text-sm transition shadow-lg whitespace-nowrap shrink-0"
                      >
                        <span>Read Next Chapter</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-slate-400 py-2">
                    You're all caught up with the latest chapter!
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : settings.mode === 'double-page' ? (
          /* Dual-Page Spread Mode (Left-to-Right LTR Book Spread) */
          <div className="flex h-full flex-col items-center justify-center p-2 sm:p-4">
            <div
              dir="ltr"
              className="dual-page-spread gap-2 max-h-[85vh] max-w-[95vw]"
              style={{ width: `${Math.min(100, settings.zoom)}%` }}
            >
              {/* Left page (current page in Left-to-Right LTR spread) */}
              {currentChapter.pages[currentPageIndex] && (
                <div className="relative max-h-[80vh] overflow-hidden rounded-xl bg-black shadow-2xl border border-slate-800 flex-1">
                  <img
                    src={currentChapter.pages[currentPageIndex]?.imageUrl}
                    alt={`Page ${currentPageIndex + 1}`}
                    className="max-h-[78vh] w-full mx-auto object-contain"
                    referrerPolicy="no-referrer"
                    decoding="async"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                    Pg. {currentPageIndex + 1}
                  </span>
                </div>
              )}

              {/* Right page (next page in Left-to-Right LTR spread) */}
              {currentChapter.pages[currentPageIndex + 1] ? (
                <div className="relative max-h-[80vh] overflow-hidden rounded-xl bg-black shadow-2xl border border-slate-800 flex-1">
                  <img
                    src={currentChapter.pages[currentPageIndex + 1]?.imageUrl}
                    alt={`Page ${currentPageIndex + 2}`}
                    className="max-h-[78vh] w-full mx-auto object-contain"
                    referrerPolicy="no-referrer"
                    decoding="async"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    Pg. {currentPageIndex + 2}
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex max-h-[80vh] flex-1 items-center justify-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-500 text-xs">
                  Chapter End
                </div>
              )}
            </div>

            {/* Dual Page Navigation Controls */}
            <div className="flex items-center gap-4 mt-3">
              <button
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 2))}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 disabled:opacity-30 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev 2 Pages</span>
              </button>
              <span className="font-mono text-xs font-bold text-amber-400">
                Spread {currentPageIndex + 1}-{Math.min(currentChapter.pages.length, currentPageIndex + 2)} / {currentChapter.pages.length}
              </span>
              <button
                disabled={currentPageIndex >= currentChapter.pages.length - 2}
                onClick={() => setCurrentPageIndex((p) => Math.min(currentChapter.pages.length - 1, p + 2))}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 disabled:opacity-30 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <span>Next 2 Pages</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Horizontal Left-to-Right (LTR) PageView */
          <div
            id="shonen-jump-pageview"
            dir="ltr"
            className="relative h-full w-full flex flex-col items-center justify-center select-none overflow-hidden"
            style={{ backgroundColor: '#000000' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Immersive Fullscreen Page Container */}
            <div
              className="relative h-full w-full flex items-center justify-center max-w-[100vw] max-h-[100vh]"
              style={{ backgroundColor: '#000000' }}
            >
              {/* The Manga Page Image */}
              <img
                key={currentChapter.pages[currentPageIndex]?.id || currentPageIndex}
                src={currentChapter.pages[currentPageIndex]?.imageUrl}
                alt={`Page ${currentPageIndex + 1}`}
                className="max-h-[90vh] max-w-[98vw] sm:max-w-[90vw] md:max-w-[85vw] w-auto h-auto mx-auto object-contain pointer-events-none drop-shadow-2xl transition-opacity duration-150"
                style={{
                  filter: settings.theme === 'sepia' ? 'sepia(0.3)' : undefined,
                }}
                referrerPolicy="no-referrer"
                decoding="async"
              />

              {/* Dialogue Overlays */}
              {currentChapter.pages[currentPageIndex]?.dialogs?.map((d, dIdx) => (
                <div
                  key={`dialog-${currentChapter.id}-${currentPageIndex}-${dIdx}`}
                  className="absolute bottom-10 left-8 max-w-xs rounded-xl bg-white/95 text-black p-3 shadow-2xl border-2 border-black font-['Comic_Neue',sans-serif] pointer-events-auto"
                >
                  <span className="block text-[10px] font-bold text-slate-700">{d.speaker}</span>
                  <p className="text-xs font-bold leading-tight">"{d.text}"</p>
                </div>
              ))}

              {/* 3 LTR TAP ZONES (Interactive Overlays) */}
              {/* ZONE 1: LEFT SIDE (Tap left = Previous page in LTR) */}
              <div
                id="tap-zone-left"
                role="button"
                aria-label="Previous page"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePagePrev();
                }}
                className="absolute inset-y-0 left-0 w-[32%] z-20 cursor-pointer flex items-center justify-start pl-3 sm:pl-6 group transition-colors hover:bg-white/[0.02]"
                title="Tap left for Previous Page"
              >
                <div
                  className={`p-2.5 rounded-2xl bg-black/75 border border-white/20 text-white shadow-xl transition-all duration-200 ${
                    lastTapZoneFeedback === 'left'
                      ? 'scale-110 bg-amber-500/80 text-black border-amber-300 ring-2 ring-amber-400'
                      : 'opacity-0 group-hover:opacity-80'
                  }`}
                >
                  <ChevronLeft className="w-6 h-6 stroke-[3]" />
                </div>
              </div>

              {/* ZONE 2: CENTER (Tap center = Toggle menu controls) */}
              <div
                id="tap-zone-center"
                role="button"
                aria-label="Toggle reader controls menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowControls((prev) => !prev);
                }}
                className="absolute inset-y-0 left-[32%] w-[36%] z-15 cursor-pointer flex items-center justify-center"
                title="Tap center to toggle menus"
              />

              {/* ZONE 3: RIGHT SIDE (Tap right = Next page in LTR) */}
              <div
                id="tap-zone-right"
                role="button"
                aria-label="Next page"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePageNext();
                }}
                className="absolute inset-y-0 right-0 w-[32%] z-20 cursor-pointer flex items-center justify-end pr-3 sm:pr-6 group transition-colors hover:bg-white/[0.02]"
                title="Tap right for Next Page"
              >
                <div
                  className={`p-2.5 rounded-2xl bg-black/75 border border-white/20 text-white shadow-xl transition-all duration-200 ${
                    lastTapZoneFeedback === 'right'
                      ? 'scale-110 bg-amber-500/80 text-black border-amber-300 ring-2 ring-amber-400'
                      : 'opacity-0 group-hover:opacity-80'
                  }`}
                >
                  <ChevronRight className="w-6 h-6 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Floating Direction HUD Indicator */}
            <div className="absolute top-16 left-4 z-20 pointer-events-none flex items-center gap-2">
              <span className="rounded-lg bg-black/80 border border-white/10 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300 backdrop-blur-md shadow">
                LTR Manga Mode
              </span>
              <span className="rounded-lg bg-black/80 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-amber-400 backdrop-blur-md shadow">
                Pg. {currentPageIndex + 1}/{currentChapter.pages.length}
              </span>
            </div>

            {/* Quick Tap Zone Legend for Reader Help (Fades when controls hide) */}
            {showControls && (
              <div className="absolute bottom-32 inset-x-0 z-20 pointer-events-none flex justify-center">
                <div className="flex items-center gap-4 px-4 py-1.5 rounded-xl bg-black/85 border border-white/10 text-[10px] text-slate-300 backdrop-blur-md shadow-2xl">
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Tap Left: Prev
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">Tap Center: Menu</span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    Tap Right: Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar with Fast Page Scrubber Slider (Offset above 44px persistent AdMob banner) */}
      <div
        id="reader-bottom-toolbar"
        className={`absolute bottom-[44px] inset-x-0 z-30 flex flex-col border-t border-white/10 bg-black/90 backdrop-blur-md transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-[calc(100%+44px)]'
        }`}
      >
        {/* Fast Page Scrubber Mini-Map Slider */}
        <div className="w-full flex items-center justify-between gap-3 px-4 py-1.5 border-b border-white/5 bg-slate-950/80">
          <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
            Page {currentPageIndex + 1}
          </span>
          <input
            type="range"
            min="0"
            max={Math.max(0, currentChapter.pages.length - 1)}
            value={currentPageIndex}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              setCurrentPageIndex(idx);
              if (settings.mode === 'webtoon' && scrollContainerRef.current) {
                const pageEls = scrollContainerRef.current.querySelectorAll('[data-page-index]');
                if (pageEls[idx]) {
                  pageEls[idx].scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
            className="flex-1 accent-amber-500 h-1.5 cursor-pointer"
            title="Fast Scrubber: Glide across chapter pages"
          />
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {currentChapter.pages.length} Pages
          </span>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              id="reader-prev-chapter-btn"
              disabled={currentChapterIndex === 0}
              onClick={handlePrevChapter}
              className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev Chapter</span>
            </button>

            {/* Auto-scroll toggle in AZ Vertical mode */}
            {settings.mode === 'webtoon' && (
              <button
                id="reader-autoscroll-toggle"
                onClick={() => setAutoScrollActive(!autoScrollActive)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  autoScrollActive
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {autoScrollActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">
                  {autoScrollActive ? 'Pause Auto' : 'Auto Scroll'}
                </span>
              </button>
            )}
          </div>

          {/* Center: Bookmark & Like */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                toggleMangaBookmark(manga.id, manga.title, manga.coverImage);
                setIsBookmarked(!isBookmarked);
              }}
              className={`flex items-center gap-1 text-xs font-medium transition ${
                isBookmarked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {nextChapter && isNextChapterLocked ? (
              <button
                id="reader-toolbar-watch-ad-next-btn"
                onClick={() =>
                  onRequestRewardedAd(nextChapter, () => {
                    setCurrentChapterId(nextChapter.id);
                    setCurrentPageIndex(0);
                  })
                }
                className="min-h-[38px] flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-bold transition shadow whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                <span>Watch ad to unlock next chapter</span>
              </button>
            ) : (
              <button
                id="reader-next-chapter-btn"
                disabled={currentChapterIndex >= manga.chapters.length - 1}
                onClick={handleNextChapter}
                className="min-h-[38px] flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 text-xs font-bold disabled:opacity-30 transition shadow whitespace-nowrap shrink-0"
              >
                <span className="hidden sm:inline">Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Drawer (Slide-in) */}
      {showChapterDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChapterDrawer(false)}
          ></div>
          <div className="relative ml-auto h-full w-80 max-w-full bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto flex flex-col z-50 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base">Chapters ({manga.chapters.length})</h3>
              <button
                onClick={() => setShowChapterDrawer(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {manga.chapters.map((ch, idx) => {
                const isSelected = ch.id === currentChapterId;
                const isEarlyAccessLocked = ch.isEarlyAccess && !hasEarlyAccess;
                const isVipLocked =
                  !ch.isEarlyAccess &&
                  ch.accessType === 'premium' &&
                  !isVipUser &&
                  !userSubscription.unlockedChapters.includes(ch.id);

                return (
                  <button
                    key={`reader-ch-${ch.id}-${idx}`}
                    onClick={() => handleChapterSelect(ch)}
                    className={`flex items-center justify-between p-3 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-xs opacity-75">Ch. {ch.number}</span>
                      <h4 className="text-sm font-semibold truncate max-w-[180px]">{ch.title}</h4>
                    </div>
                    <div>
                      {ch.isEarlyAccess ? (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-black text-cyan-300'
                              : isEarlyAccessLocked
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                              : 'bg-cyan-600 text-black'
                          }`}
                        >
                          {isEarlyAccessLocked ? 'PRO PASS' : 'EARLY'}
                        </span>
                      ) : ch.accessType === 'premium' ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-black text-amber-300'
                              : isVipLocked
                              ? 'bg-purple-900 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-900/60 text-emerald-300'
                          }`}
                        >
                          {isVipLocked ? 'VIP PASS' : 'UNLOCKED'}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-black text-amber-400' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          FREE
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reader Settings Drawer */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettingsDrawer(false)}
          ></div>
          <div className="relative ml-auto h-full w-80 max-w-full bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto flex flex-col z-50 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Reading Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reading Mode */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Reading Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setSettings((s) => ({ ...s, mode: 'webtoon' }))}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition text-center ${
                    settings.mode === 'webtoon'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  AZ Vertical
                </button>
                <button
                  onClick={() => setSettings((s) => ({ ...s, mode: 'single-page' }))}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition text-center ${
                    settings.mode === 'single-page'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Single Page
                </button>
                <button
                  onClick={() => setSettings((s) => ({ ...s, mode: 'double-page' }))}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition text-center ${
                    settings.mode === 'double-page'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Book Spread
                </button>
              </div>
            </div>

            {/* Backdrop Theme */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Background Backdrop
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['black', 'dark', 'sepia', 'light'] as const).map((t, idx) => (
                  <button
                    key={`reader-theme-${t}-${idx}`}
                    onClick={() => setSettings((s) => ({ ...s, theme: t }))}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition ${
                      settings.theme === t
                        ? 'border-amber-400 bg-slate-800 text-amber-400 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* WebViewer Mode & Zoom / Width Controls */}
            {(() => {
              const wv = getWebViewerConfig();
              // If SupportZoom is unchecked, enlarge/shrink is disabled (locked at 100%)
              const isZoomLocked = !wv.supportZoom;
              // If ZoomDisplay is unchecked, hide on-screen zoom slider
              const hideZoomControls = !wv.zoomDisplay;

              if (hideZoomControls && isZoomLocked) {
                return (
                  <div className="mb-6 rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>WebViewer Component Active</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        WideViewPort = TRUE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      SupportZoom is unchecked (enlarge/shrink gestures stopped). ZoomDisplay is unchecked (zoom overlay hidden). Scale locked at 100% responsive width.
                    </p>
                    {onOpenWebViewerConfig && (
                      <button
                        onClick={onOpenWebViewerConfig}
                        className="w-full mt-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Inspect WebViewer Spec</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Page Width / Zoom</span>
                    <span className="font-mono text-amber-400">{settings.zoom}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={settings.zoom}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, zoom: parseInt(e.target.value, 10) }))
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
              );
            })()}

            {/* Ad & Subscription Status */}
            <div className="mt-auto pt-4 border-t border-slate-800">
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">AZ OVERVERSE Premium</span>
                </div>
                <p className="text-[11px] text-purple-200 mb-3">
                  {isVipUser
                    ? 'Your VIP Pass is active. Zero ads and instant chapter releases enabled.'
                    : 'Remove all reader ads and unlock full high-def reading with a VIP pass.'}
                </p>
                {!isVipUser && (
                  <button
                    onClick={() => {
                      setShowSettingsDrawer(false);
                      onUpgradeClick();
                    }}
                    className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-black transition"
                  >
                    Upgrade to VIP (R89)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-amber-400" />
                <h3 className="font-['Bebas_Neue',sans-serif] text-xl text-white tracking-wider">
                  READER PRODUCTIVITY SHORTCUTS
                </h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-300">Next Page / Spread</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">
                  → / Space / D
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-300">Prev Page / Spread</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">
                  ← / A
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-300">Toggle Fullscreen</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">
                  F
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-300">Switch Reading Mode (AZ Vertical/Single/Spread)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">
                  W
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-300">Toggle Bookmark</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">
                  B
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-300">Exit Reader / Close Drawer</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold border border-slate-700">
                  Esc
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-black text-black transition shadow"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
