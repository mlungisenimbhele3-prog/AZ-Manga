import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Smartphone,
  Maximize2,
  Minimize2,
  Play,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Timer,
  MoreHorizontal,
  Sliders,
  Layers,
  ArrowUpDown,
  X,
  Bookmark,
} from 'lucide-react';
import { FullScreenMenu } from '../layout/FullScreenMenu';
import { Chapter, Manga, UserSubscription } from '../../types';
import {
  ReadingMode,
  preloadUpcomingPages,
  isPagePreloaded,
  getPageLoadStatus,
  markPageLoadedExternally,
  subscribeToPageLoadState,
  retryPreloadMangaImage,
  trimInactiveReaderBitmaps,
  DEFAULT_READER_CONFIG,
} from './ReaderConfig';
import {
  ReadingSessionTimerPill,
  ReadingSessionSummaryCard,
  ReadingSessionSummaryModal,
  ChapterReadingSessionSummary,
  calculatePaceCategory,
  calculateSessionRewards,
  saveReadingSessionToHistory,
  formatDigitalTimer,
  formatHumanDuration,
} from './ReadingSessionTimer';
import { AdMobBanner } from '../ads/AdMobBanner';
import { safeStorage } from '../../utils/safeStorage';
import { getProfileConfig, scheduleIdleTask } from '../../utils/devicePerformance';
import { recordChapterRead } from '../../utils/readingStreak';
import {
  saveReadingProgress,
  saveChapterPageBookmark,
  getChapterPageBookmark,
  getSavedChapterResumePageIndex,
} from '../../services/userProfile';
import { logChapterReadingTime } from '../../services/creatorChapterStatsService';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';
import { RatingAverageDisplay, StarRatingInput } from '../common/StarRating';
import {
  buildVolumeTargetId,
  getChapterRatingStats,
  getMangaOverallRatingStats,
  getVolumeRatingStats,
  submitUserRating,
  useRatingRevision,
} from '../../services/ratingService';
import { useChapterComments } from '../../services/chapterCommentService';
import { ChapterCommentsPanel } from './ChapterCommentsPanel';

export interface ReaderViewProps {
  manga: Manga;
  chapter: Chapter;
  onBack: () => void;
  userSubscription?: UserSubscription;
  onChapterChange?: (chapterId: string) => void;
  onRequestRewardedAd?: (chapter: Chapter, onUnlocked?: () => void) => void;
  onUpgradeClick?: () => void;
  dataSaverMode?: boolean;
  isBottomBarsVisible?: boolean;
}

interface ReaderPageSurfaceProps {
  imageUrl: string;
  pageIndex: number;
  isWithinActiveWindow: boolean;
  isCurrentPage: boolean;
  mode: ReadingMode;
  onImageNode?: (index: number, node: HTMLImageElement | null) => void;
  onPageDecoded?: () => void;
}

/**
 * Memoized, slow-network-resilient manga page renderer.
 * - Renders immediately with zero fade/skeleton flash when already cached by the 3-page preloader.
 * - Displays a clean dark shimmer skeleton while streaming over slow 2G/3G connections.
 * - Provides 1-tap retry recovery if a flaky connection drops mid-chapter.
 */
const ReaderPageSurface = React.memo<ReaderPageSurfaceProps>(
  ({
    imageUrl,
    pageIndex,
    isWithinActiveWindow,
    isCurrentPage,
    mode,
    onImageNode,
    onPageDecoded,
  }) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(() =>
      isPagePreloaded(imageUrl) ? 'loaded' : getPageLoadStatus(imageUrl) === 'error' ? 'error' : 'loading'
    );
    const [retryNonce, setRetryNonce] = useState(0);

    useEffect(() => {
      if (isPagePreloaded(imageUrl)) {
        setStatus('loaded');
        return;
      }
      const current = getPageLoadStatus(imageUrl);
      if (current === 'loaded') {
        setStatus('loaded');
      } else if (current === 'error') {
        setStatus('error');
      } else {
        setStatus('loading');
      }

      return subscribeToPageLoadState(imageUrl, (nextStatus) => {
        if (nextStatus === 'loaded') {
          setStatus('loaded');
        } else if (nextStatus === 'error') {
          setStatus('error');
        } else if (nextStatus === 'loading') {
          setStatus('loading');
        }
      });
    }, [imageUrl]);

    const handleRetry = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setStatus('loading');
        setRetryNonce((n) => n + 1);
        void retryPreloadMangaImage(imageUrl);
      },
      [imageUrl]
    );

    const setImgRef = useCallback(
      (el: HTMLImageElement | null) => {
        onImageNode?.(pageIndex, el);
        if (el && el.complete && el.naturalWidth > 0) {
          markPageLoadedExternally(imageUrl);
          setStatus('loaded');
        }
      },
      [onImageNode, pageIndex, imageUrl]
    );

    const effectiveSrc =
      retryNonce === 0
        ? imageUrl
        : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}retry=${retryNonce}`;

    return (
      <div
        className={
          mode === 'vertical'
            ? 'relative w-full max-w-full md:max-w-4xl mx-auto flex justify-center items-center bg-[#000000] m-0 p-0 border-0 leading-none min-h-[320px]'
            : 'relative w-full max-w-full md:max-w-4xl mx-auto h-full flex items-center justify-center bg-[#000000] m-0 p-0'
        }
      >
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-[#000000] pointer-events-none">
            <div className="h-7 w-7 rounded-full border-2 border-amber-500/25 border-t-amber-400 animate-spin" />
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              Page {pageIndex + 1}
            </span>
          </div>
        )}

        {status === 'error' ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center bg-[#080808] rounded-2xl border border-slate-800 max-w-xs mx-auto my-6"
          >
            <img
              src={APP_LOGO_SRC}
              alt="AZ OVERVERSE"
              className="w-10 h-10 rounded-xl object-cover opacity-90"
            />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Page {pageIndex + 1} paused on slow network</p>
              <p className="text-[11px] text-slate-400">
                Check your connection and tap below to reload this panel.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4 py-2 transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Retry Page {pageIndex + 1}</span>
            </button>
          </div>
        ) : (
          <img
            ref={setImgRef}
            src={effectiveSrc}
            alt={`Page ${pageIndex + 1}`}
            referrerPolicy="no-referrer"
            loading={isWithinActiveWindow ? 'eager' : 'lazy'}
            decoding="async"
            {...{ fetchpriority: isCurrentPage ? 'high' : isWithinActiveWindow ? 'auto' : 'low' }}
            onLoad={() => {
              markPageLoadedExternally(imageUrl);
              setStatus('loaded');
              onPageDecoded?.();
            }}
            onError={() => {
              setStatus('error');
            }}
            className={
              mode === 'vertical'
                ? `w-full max-w-full md:max-w-4xl mx-auto h-auto object-contain block m-0 p-0 border-0 outline-none leading-none select-none transition-opacity duration-150 ${
                    status === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`
                : `w-full max-w-full md:max-w-4xl mx-auto h-auto max-h-[100dvh] object-contain block m-0 p-0 select-none transition-opacity duration-150 ${
                    status === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`
            }
          />
        )}
      </div>
    );
  }
);

ReaderPageSurface.displayName = 'ReaderPageSurface';

export const ReaderView: React.FC<ReaderViewProps> = ({
  manga,
  chapter,
  onBack,
  userSubscription,
  onChapterChange,
  onRequestRewardedAd,
  onUpgradeClick,
  dataSaverMode = false,
  isBottomBarsVisible = true,
}) => {
  const pages = useMemo(() => chapter?.pages || [], [chapter?.pages]);
  const totalPages = pages.length;
  const hasPages = Boolean(chapter && totalPages > 0);

  // Reading mode: 'single' (Default), 'vertical', or 'page_flip'
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    const saved = safeStorage.getItem('az_reader_mode');
    if (saved === 'vertical') return 'vertical';
    if (saved === 'page_flip') return 'page_flip';
    if (saved === 'single') return 'single';
    if (saved === 'horizontal_ltr' || saved === 'horizontal_rtl') return 'single';
    return DEFAULT_READER_CONFIG.readingMode; // 'single'
  });

  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(() =>
    getSavedChapterResumePageIndex(manga?.id || '', chapter?.id || '', pages.length)
  );
  const [bookmarkedPageIndex, setBookmarkedPageIndex] = useState<number | null>(() => {
    const saved = getChapterPageBookmark(manga?.id || '', chapter?.id || '');
    return saved ? saved.pageIndex : null;
  });
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);
  const bookmarkToastTimerRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

  // Auto-hide immersive mode timer (hide top/bottom bars after 2s of inactivity)
  const autoHideTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  const resetAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current as any);
      autoHideTimerRef.current = null;
    }
    autoHideTimerRef.current = setTimeout(() => {
      setShowOverlay(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (showOverlay) {
      resetAutoHideTimer();
    } else if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current as any);
      autoHideTimerRef.current = null;
    }
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current as any);
      }
    };
  }, [showOverlay, resetAutoHideTimer]);

  // Reading session timer state & completion tracking
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const hasAutoShownSummaryRef = useRef<boolean>(false);
  const hasSavedSessionRef = useRef<boolean>(false);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const lastLoggedSecondsRef = useRef<number>(0);
  const sessionStartedRef = useRef<boolean>(false);

  // Compositor & scroll measurement refs (zero synchronous layout reads or hidden-overlay React re-renders during scroll)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const progressBarFillRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const pageImageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const pageMidpointsRef = useRef<number[]>([]);
  const maxScrollCachedRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const showOverlayRef = useRef<boolean>(false);
  showOverlayRef.current = showOverlay;
  const scrollRafRef = useRef<number | null>(null);
  const measureRafRef = useRef<number | null>(null);
  const activeAheadWindow = useMemo(
    () => Math.max(5, Math.min(8, getProfileConfig().imagePreloadCount)),
    []
  );

  const currentChapterIndex = useMemo(
    () => (manga?.chapters ? manga.chapters.findIndex((c) => c.id === chapter?.id) : -1),
    [manga?.chapters, chapter?.id]
  );

  const nextChapter = useMemo(
    () =>
      currentChapterIndex >= 0 && manga?.chapters && currentChapterIndex < manga.chapters.length - 1
        ? manga.chapters[currentChapterIndex + 1]
        : null,
    [currentChapterIndex, manga?.chapters]
  );

  const nextChapterFirstPageUrl = nextChapter?.pages?.[0]?.imageUrl || null;
  const ratingRevision = useRatingRevision();

  const currentVolumeNumber = useMemo(
    () => chapter?.volumeNumber || Math.max(1, Math.ceil((chapter?.number || 1) / 5)),
    [chapter?.volumeNumber, chapter?.number]
  );

  const chapterRatingStats = useMemo(
    () => getChapterRatingStats(chapter?.id || `${manga?.id}-ch-1`),
    [chapter?.id, manga?.id, ratingRevision]
  );

  const readerUserBadge = useMemo(() => {
    if (userSubscription?.tier === 'patron') return 'Patron';
    if (userSubscription?.tier === 'vip' || userSubscription?.tier === 'early_access') {
      return 'VIP Reader';
    }
    return undefined;
  }, [userSubscription?.tier]);

  const { totalCount: chapterCommentCount } = useChapterComments({
    mangaId: manga?.id || 'manga',
    chapterId: chapter?.id || `${manga?.id || 'manga'}-ch-1`,
    chapterNumber: chapter?.number || 1,
    userBadge: readerUserBadge,
  });

  const volumeRatingStats = useMemo(() => {
    const volChIds = (manga?.chapters || [])
      .filter(
        (c) =>
          (c.volumeNumber || Math.max(1, Math.ceil((c.number || 1) / 5))) === currentVolumeNumber
      )
      .map((c) => c.id);
    if (chapter?.id && !volChIds.includes(chapter.id)) {
      volChIds.push(chapter.id);
    }
    return getVolumeRatingStats(manga?.id || 'manga', currentVolumeNumber, volChIds);
  }, [manga?.id, manga?.chapters, currentVolumeNumber, chapter?.id, ratingRevision]);

  const mangaOverallStats = useMemo(
    () => (manga ? getMangaOverallRatingStats(manga) : null),
    [manga, ratingRevision]
  );

  const handleRateCurrentChapter = useCallback(
    (score: 1 | 2 | 3 | 4 | 5) => {
      if (!manga || !chapter) return;
      void submitUserRating({
        targetType: 'chapter',
        targetId: chapter.id,
        mangaId: manga.id,
        chapterId: chapter.id,
        score,
        mangaTitle: manga.title,
      });
    },
    [manga, chapter]
  );

  const handleRateCurrentVolume = useCallback(
    (score: 1 | 2 | 3 | 4 | 5) => {
      if (!manga) return;
      const volId = buildVolumeTargetId(manga.id, currentVolumeNumber);
      void submitUserRating({
        targetType: 'volume',
        targetId: volId,
        mangaId: manga.id,
        volumeNumber: currentVolumeNumber,
        score,
        mangaTitle: manga.title,
      });
    },
    [manga, currentVolumeNumber]
  );

  const handleToggleReadingMode = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    safeStorage.setItem('az_reader_mode', mode);
  }, []);

  const registerImageNode = useCallback((idx: number, node: HTMLImageElement | null) => {
    pageImageRefs.current[idx] = node;
  }, []);

  /**
   * Proactive 5-Page Chapter Preloading Strategy:
   * Fetches and decodes the next 5 pages (Page X+1 .. X+5) in the background ahead of `currentPageIndex`
   * using network-aware scheduling + bounded LRU bitmap pool + Cache Storage persistence.
   */
  useEffect(() => {
    if (totalPages === 0) return;
    const profileAhead = getProfileConfig().imagePreloadCount;
    const aheadCount = Math.max(DEFAULT_READER_CONFIG.preloadAheadCount, profileAhead, 5);
    preloadUpcomingPages(pages, currentPageIndex, aheadCount, {
      dataSaverMode,
      nextChapterFirstPageUrl,
    });
  }, [chapter?.id, currentPageIndex, pages, totalPages, dataSaverMode, nextChapterFirstPageUrl]);

  /**
   * Recalculates vertical page offsets off the scroll hot-path (on resize / image decode)
   * so `handleVerticalScroll` uses O(log N) binary search with zero synchronous DOM reflows.
   */
  const recomputeVerticalLayoutMetrics = useCallback(() => {
    if (measureRafRef.current !== null) return;
    measureRafRef.current = window.requestAnimationFrame(() => {
      measureRafRef.current = null;
      const container = verticalContainerRef.current;
      if (!container) return;

      maxScrollCachedRef.current = Math.max(0, container.scrollHeight - container.clientHeight);
      const bottoms: number[] = new Array(totalPages);
      let lastBottom = 0;

      for (let i = 0; i < totalPages; i++) {
        const el = pageImageRefs.current[i];
        if (el) {
          lastBottom = el.offsetTop + el.offsetHeight;
        }
        bottoms[i] = lastBottom;
      }
      pageMidpointsRef.current = bottoms;

      if (maxScrollCachedRef.current > 0) {
        const pct = Math.min(
          100,
          Math.max(0, Math.round((container.scrollTop / maxScrollCachedRef.current) * 100))
        );
        scrollProgressRef.current = pct;
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = `scaleX(${pct / 100})`;
        }
        if (showOverlayRef.current) {
          setScrollProgress((prev) => (prev === pct ? prev : pct));
        }
      }
    });
  }, [totalPages]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  const goToNextPage = useCallback(() => {
    setSlideDirection('forward');
    setCurrentPageIndex((prev) => Math.min(prev + 1, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setSlideDirection('backward');
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleBookmarkCurrentPage = useCallback(() => {
    if (!manga || !chapter || !hasPages) return;
    const cover = manga.coverImage || (manga as any).cover || '';
    const saved = saveChapterPageBookmark({
      mangaId: manga.id,
      mangaTitle: manga.title,
      mangaCover: cover,
      chapterId: chapter.id,
      chapterNumber: chapter.number || 1,
      chapterTitle: chapter.title || `Chapter ${chapter.number || 1}`,
      pageIndex: currentPageIndex,
      pageNumber: currentPageIndex + 1,
      totalPages: Math.max(1, totalPages),
    });
    setBookmarkedPageIndex(saved.pageIndex);
    setBookmarkToast(`Bookmarked Page ${saved.pageNumber} in reading history`);
    resetAutoHideTimer();
    if (bookmarkToastTimerRef.current !== null) {
      window.clearTimeout(bookmarkToastTimerRef.current);
    }
    bookmarkToastTimerRef.current = window.setTimeout(() => {
      setBookmarkToast(null);
      bookmarkToastTimerRef.current = null;
    }, 2200);
  }, [manga, chapter, hasPages, currentPageIndex, totalPages, resetAutoHideTimer]);

  const handleJumpToPage = useCallback(
    (targetPageIdx: number) => {
      const clamped = Math.max(0, Math.min(Math.max(0, totalPages - 1), targetPageIdx));
      setSlideDirection(clamped >= currentPageIndex ? 'forward' : 'backward');
      setCurrentPageIndex(clamped);
      setIsCommentsOpen(false);
      if (readingMode === 'vertical' && pageImageRefs.current[clamped]) {
        pageImageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [totalPages, readingMode, currentPageIndex]
  );

  // Keyboard navigation for power readers / desktop — ignores keystrokes inside comment/reply inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableTarget = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
      );

      if (e.key === 'Escape') {
        if (isSettingsOpen) {
          e.preventDefault();
          setIsSettingsOpen(false);
          return;
        }
        if (isCommentsOpen) {
          e.preventDefault();
          setIsCommentsOpen(false);
          return;
        }
        if (isEditableTarget) {
          target?.blur();
          return;
        }
        onBack();
        return;
      }

      if (isEditableTarget || isCommentsOpen || isSettingsOpen) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (readingMode !== 'vertical') goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (readingMode !== 'vertical') goToPrevPage();
      } else if (e.key.toLowerCase() === 'c') {
        setIsCommentsOpen(true);
      } else if (e.key === ' ' || e.key === 'Enter') {
        setShowOverlay((prev) => {
          const next = !prev;
          if (next) resetAutoHideTimer();
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, readingMode, onBack, isCommentsOpen, isSettingsOpen, resetAutoHideTimer]);

  const handleScreenClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isCommentsOpen || isSettingsOpen || isMoreMenuOpen || isSummaryModalOpen) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const yRatio = (e.clientY - rect.top) / rect.height;

      // Center tap (30% to 70% horizontally, 20% to 80% vertically): toggle HUD overlay
      const isCenterTap = xRatio >= 0.30 && xRatio <= 0.70 && yRatio >= 0.20 && yRatio <= 0.80;
      if (isCenterTap) {
        setShowOverlay((prev) => {
          const next = !prev;
          if (next) resetAutoHideTimer();
          return next;
        });
        return;
      }

      // Left tap (< 30%): previous page
      if (xRatio < 0.30) {
        if (readingMode === 'vertical') {
          if (verticalContainerRef.current) {
            verticalContainerRef.current.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
          }
        } else {
          goToPrevPage();
        }
        return;
      }

      // Right tap (> 70%): next page
      if (xRatio > 0.70) {
        if (readingMode === 'vertical') {
          if (verticalContainerRef.current) {
            verticalContainerRef.current.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
          }
        } else {
          goToNextPage();
        }
        return;
      }
    },
    [
      readingMode,
      goToPrevPage,
      goToNextPage,
      isCommentsOpen,
      isSettingsOpen,
      isMoreMenuOpen,
      isSummaryModalOpen,
      resetAutoHideTimer,
    ]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = performance.now();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartXRef.current;
      const deltaY = endY - touchStartYRef.current;
      const timeTaken = performance.now() - touchStartTimeRef.current;

      touchStartXRef.current = null;
      touchStartYRef.current = null;

      if (
        readingMode !== 'vertical' &&
        Math.abs(deltaX) > 36 &&
        Math.abs(deltaX) > Math.abs(deltaY) &&
        timeTaken < 600
      ) {
        if (deltaX < 0) {
          goToNextPage();
        } else {
          goToPrevPage();
        }
      }
    },
    [readingMode, goToNextPage, goToPrevPage]
  );

  /**
   * 120Hz Compositor-Bound Vertical Scroll Handler:
   * - Updates top progress bar directly via GPU `scaleX()` without React re-renders per pixel.
   * - Uses O(log N) binary search over cached page bottoms instead of per-frame offsetTop reflows.
   */
  const handleVerticalScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = verticalContainerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const maxScroll =
        maxScrollCachedRef.current > 0
          ? maxScrollCachedRef.current
          : Math.max(0, container.scrollHeight - clientHeight);

      if (maxScroll > 0) {
        const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = `scaleX(${ratio})`;
        }
        const pct = Math.round(ratio * 100);
        scrollProgressRef.current = pct;
        if (showOverlayRef.current) {
          setScrollProgress((prev) => (prev === pct ? prev : pct));
        }
      } else {
        scrollProgressRef.current = 0;
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = 'scaleX(0)';
        }
        if (showOverlayRef.current) {
          setScrollProgress((prev) => (prev === 0 ? prev : 0));
        }
      }

      const bottoms = pageMidpointsRef.current;
      if (bottoms.length > 0) {
        const viewportMiddle = scrollTop + clientHeight * 0.5;
        let low = 0;
        let high = bottoms.length - 1;
        let matchedIdx = high;

        while (low <= high) {
          const mid = (low + high) >>> 1;
          if (bottoms[mid] > viewportMiddle) {
            matchedIdx = mid;
            high = mid - 1;
          } else {
            low = mid + 1;
          }
        }
        setCurrentPageIndex((prev) => (prev === matchedIdx ? prev : matchedIdx));
      }
    });
  }, []);

  // Sync latest scroll percentage immediately whenever user opens the HUD overlay
  useEffect(() => {
    if (showOverlay && readingMode === 'vertical') {
      setScrollProgress(scrollProgressRef.current);
    }
  }, [showOverlay, readingMode]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
      if (measureRafRef.current !== null) {
        window.cancelAnimationFrame(measureRafRef.current);
      }
      if (bookmarkToastTimerRef.current !== null) {
        window.clearTimeout(bookmarkToastTimerRef.current);
      }
      trimInactiveReaderBitmaps(false);
    };
  }, []);

  // Observe layout changes once via ResizeObserver so cached scroll offsets stay accurate
  useEffect(() => {
    if (!hasPages || readingMode !== 'vertical' || !verticalContainerRef.current) return;
    const container = verticalContainerRef.current;

    recomputeVerticalLayoutMetrics();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        recomputeVerticalLayoutMetrics();
      });
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [hasPages, readingMode, chapter?.id, totalPages, recomputeVerticalLayoutMetrics]);

  // Reset scroll, page index, and session timer when switching chapter
  useEffect(() => {
    // Flush remaining unlogged seconds for previous chapter
    if (sessionStartedRef.current && manga?.id && chapter?.id) {
      const remainingDelta = elapsedSeconds - lastLoggedSecondsRef.current;
      if (remainingDelta > 0) {
        logChapterReadingTime({
          chapterId: chapter.id,
          chapterNumber: chapter.number || 1,
          chapterTitle: chapter.title || `Chapter ${chapter.number || 1}`,
          mangaId: manga.id,
          mangaTitle: manga.title,
          mangaCover: manga.coverImage || (manga as any)?.cover || '',
          deltaSeconds: remainingDelta,
        });
      }
    }

    pageImageRefs.current = {};
    pageMidpointsRef.current = [];
    maxScrollCachedRef.current = 0;

    const savedBookmark =
      manga?.id && chapter?.id ? getChapterPageBookmark(manga.id, chapter.id) : null;
    setBookmarkedPageIndex(savedBookmark ? savedBookmark.pageIndex : null);

    const resumeIdx =
      manga?.id && chapter?.id
        ? getSavedChapterResumePageIndex(manga.id, chapter.id, totalPages)
        : 0;
    setCurrentPageIndex(resumeIdx);
    setScrollProgress(
      totalPages > 0 && resumeIdx > 0 ? Math.round(((resumeIdx + 1) / totalPages) * 100) : 0
    );
    setIsCommentsOpen(false);
    setElapsedSeconds(0);
    lastLoggedSecondsRef.current = 0;
    sessionStartedRef.current = true;
    setIsTimerRunning(true);
    setIsSummaryModalOpen(false);
    hasAutoShownSummaryRef.current = false;
    hasSavedSessionRef.current = false;
    sessionStartTimeRef.current = Date.now();
    if (verticalContainerRef.current) {
      if (resumeIdx > 0) {
        window.setTimeout(() => {
          pageImageRefs.current[resumeIdx]?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }, 120);
      } else {
        verticalContainerRef.current.scrollTop = 0;
      }
    }

    // Register active reading session in CreatorDashboard statistics
    if (manga?.id && chapter?.id) {
      logChapterReadingTime({
        chapterId: chapter.id,
        chapterNumber: chapter.number || 1,
        chapterTitle: chapter.title || `Chapter ${chapter.number || 1}`,
        mangaId: manga.id,
        mangaTitle: manga.title,
        mangaCover: manga.coverImage || (manga as any)?.cover || '',
        deltaSeconds: 0,
        isNewSession: true,
      });
    }
  }, [chapter?.id]);

  // Active reading timer (pauses when tab is backgrounded or reader manually pauses)
  // Streams real-time cumulative duration to CreatorDashboard statistics
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      setElapsedSeconds((prev) => {
        const nextSec = prev + 1;
        // Batch real-time duration updates every 5 seconds to CreatorDashboard
        if (nextSec - lastLoggedSecondsRef.current >= 5 && manga?.id && chapter?.id) {
          const delta = nextSec - lastLoggedSecondsRef.current;
          lastLoggedSecondsRef.current = nextSec;
          logChapterReadingTime({
            chapterId: chapter.id,
            chapterNumber: chapter.number || 1,
            chapterTitle: chapter.title || `Chapter ${chapter.number || 1}`,
            mangaId: manga.id,
            mangaTitle: manga.title,
            mangaCover: manga.coverImage || (manga as any)?.cover || '',
            deltaSeconds: delta,
          });
        }
        return nextSec;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isTimerRunning, manga?.id, chapter?.id]);

  // Real-time computed reading session summary
  const currentSessionSummary: ChapterReadingSessionSummary = useMemo(() => {
    const pagesRead = Math.min(totalPages, Math.max(1, currentPageIndex + 1));
    const paceInfo = calculatePaceCategory(elapsedSeconds, pagesRead);
    const rewards = calculateSessionRewards(elapsedSeconds, pagesRead);

    return {
      chapterId: chapter?.id || '',
      chapterNumber: chapter?.number || 1,
      chapterTitle: chapter?.title || `Chapter ${chapter?.number || 1}`,
      mangaId: manga?.id || '',
      mangaTitle: manga?.title || '',
      mangaCover: manga?.coverImage || (manga as any)?.cover || '',
      durationSeconds: Math.max(1, elapsedSeconds),
      totalPages: Math.max(1, totalPages),
      pagesRead,
      secondsPerPage: paceInfo.secondsPerPage,
      pagesPerMinute: paceInfo.pagesPerMinute,
      paceLabel: paceInfo.paceLabel,
      paceDescription: paceInfo.paceDescription,
      badgeColor: paceInfo.badgeColor,
      coinsEarned: rewards.coins,
      xpEarned: rewards.xp,
      completed: currentPageIndex >= totalPages - 1 || scrollProgress >= 95,
      finishedAt: new Date().toISOString(),
    };
  }, [
    chapter?.id,
    chapter?.number,
    chapter?.title,
    manga?.id,
    manga?.title,
    manga?.coverImage,
    elapsedSeconds,
    currentPageIndex,
    totalPages,
    scrollProgress,
  ]);

  // Auto-detect chapter completion: trigger reward calculation, save history & launch summary modal
  useEffect(() => {
    if (!hasPages || totalPages === 0) return;

    const isFinished =
      readingMode === 'vertical'
        ? scrollProgress >= 96 || (currentPageIndex >= totalPages - 1 && scrollProgress >= 70)
        : currentPageIndex >= totalPages - 1;

    if (isFinished && !hasSavedSessionRef.current && elapsedSeconds >= 3) {
      hasSavedSessionRef.current = true;
      saveReadingSessionToHistory(currentSessionSummary);

      // Log chapter completion to CreatorDashboard statistics
      if (manga?.id && chapter?.id) {
        const remainingDelta = Math.max(0, elapsedSeconds - lastLoggedSecondsRef.current);
        lastLoggedSecondsRef.current = elapsedSeconds;
        logChapterReadingTime({
          chapterId: chapter.id,
          chapterNumber: chapter.number || 1,
          chapterTitle: chapter.title || `Chapter ${chapter.number || 1}`,
          mangaId: manga.id,
          mangaTitle: manga.title,
          mangaCover: manga.coverImage || (manga as any)?.cover || '',
          deltaSeconds: remainingDelta,
          isCompleted: true,
        });
      }

      if (!hasAutoShownSummaryRef.current) {
        hasAutoShownSummaryRef.current = true;
        const timer = window.setTimeout(() => {
          setIsSummaryModalOpen(true);
        }, 400);
        return () => window.clearTimeout(timer);
      }
    }
  }, [
    hasPages,
    totalPages,
    scrollProgress,
    currentPageIndex,
    readingMode,
    elapsedSeconds,
    currentSessionSummary,
    manga?.id,
    chapter?.id,
  ]);

  // Record daily reading streak cleanly in idle time when a chapter opens
  useEffect(() => {
    if (!manga?.id || !chapter?.id || !hasPages) return;
    return scheduleIdleTask(() => {
      try {
        recordChapterRead(
          manga.id,
          chapter.id,
          `Ch. ${chapter.number}: ${chapter.title || `Chapter ${chapter.number}`}`
        );
      } catch {}
    }, 1500);
  }, [manga?.id, chapter?.id, chapter?.number, chapter?.title, hasPages]);

  const currentProgress =
    readingMode === 'vertical'
      ? scrollProgress
      : totalPages > 0
      ? Math.min(100, Math.max(0, ((currentPageIndex + 1) / totalPages) * 100))
      : 0;

  // Keep GPU compositor transforms synced without inline style objects
  useLayoutEffect(() => {
    if (progressBarFillRef.current) {
      progressBarFillRef.current.style.transform = `scaleX(${Math.max(
        0,
        Math.min(1, currentProgress / 100)
      )})`;
    }
    if (horizontalTrackRef.current && readingMode === 'horizontal_ltr') {
      horizontalTrackRef.current.style.transform = `translate3d(-${currentPageIndex * 100}%, 0, 0)`;
    }
  }, [currentProgress, currentPageIndex, readingMode]);

  // Debounced reading progress persistence (prevents synchronous storage writes during fast scroll)
  useEffect(() => {
    if (!manga || !chapter || !hasPages) return;
    const timer = window.setTimeout(() => {
      const cover = manga.coverImage || (manga as any).cover || '';
      safeStorage.setJSONDeferred('ka_pulse_last_read', {
        mangaId: manga.id,
        mangaTitle: manga.title,
        coverImage: cover,
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title || `Chapter ${chapter.number}`,
        pageIndex: currentPageIndex,
        totalPages,
        timestamp: new Date().toISOString(),
      });

      scheduleIdleTask(() => {
        try {
          saveReadingProgress({
            mangaId: manga.id,
            mangaTitle: manga.title,
            mangaCover: cover,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            chapterTitle: chapter.title || `Chapter ${chapter.number}`,
            pageNumber: currentPageIndex + 1,
            totalPages: Math.max(1, totalPages),
            progressPercent: Math.round(((currentPageIndex + 1) / Math.max(1, totalPages)) * 100),
            completed: currentPageIndex >= totalPages - 1,
            durationSeconds: Math.max(1, elapsedSeconds),
          });
        } catch {}
      }, 2000);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [manga, chapter, hasPages, currentPageIndex, totalPages, elapsedSeconds]);

  // Safe empty-chapter guard AFTER all hooks
  if (!hasPages) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0d14] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <BookOpen className="w-10 h-10 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Coming Soon
        </span>
        <h2 className="text-xl font-black text-white">{manga?.title || 'Coming Soon'}</h2>
        <p className="text-xs text-slate-300 max-w-sm">
          No panels inside yet. Episode 1 is currently in production.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-xs font-bold transition"
        >
          Back
        </button>
      </div>
    );
  }

  const targetNextChapter: Chapter = nextChapter || {
    ...chapter,
    id: `${chapter.id}-next`,
    number: (chapter.number || 1) + 1,
    title: `Chapter ${(chapter.number || 1) + 1}`,
    accessType: 'premium',
  };

  const isVipOrPatron = userSubscription?.tier === 'vip' || userSubscription?.tier === 'patron';
  const isTargetUnlocked = Boolean(
    isVipOrPatron || userSubscription?.unlockedChapters?.includes(targetNextChapter.id)
  );

  const handleWatchAdUnlockNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRequestRewardedAd) {
      onRequestRewardedAd(targetNextChapter, () => {
        if (nextChapter && onChapterChange) {
          onChapterChange(nextChapter.id);
        }
      });
    }
  };

  return (
    <div
      id="az-manga-reader-viewport"
      onClick={handleScreenClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[100] m-0 p-0 w-screen h-screen-dynamic bg-[#000000] text-white select-none overflow-hidden reader-viewport-touch"
    >
      {/* GPU-COMPOSITED TOP HORIZONTAL READING PROGRESS BAR */}
      <div
        id="reader-top-progress-container"
        className={`fixed top-0 left-0 right-0 z-[120] pointer-events-none transition-opacity duration-300 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
        role="progressbar"
        aria-valuenow={Math.round(currentProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Chapter reading progress"
      >
        <div className="w-full h-1 sm:h-[4px] bg-slate-900/60 overflow-hidden">
          <div
            id="reader-top-progress-bar-fill"
            ref={progressBarFillRef}
            className={`h-full w-full origin-left bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 will-change-transform transition-transform ease-out scale-x-0 ${
              readingMode === 'vertical' ? 'duration-75' : 'duration-200'
            }`}
          />
        </div>
      </div>

      {/* TOP BAR */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          resetAutoHideTimer();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          resetAutoHideTimer();
        }}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#000000]/90 backdrop-blur-md border-b border-white/10 transition-[transform,opacity] duration-300 ease-out safe-top-inset ${
          showOverlay
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-white shrink-0"
            aria-label="Exit Reader"
            title="Back to Manga Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-[170px] sm:max-w-md">
                {chapter.title || `Chapter ${chapter.number}`}
              </h2>
              <RatingAverageDisplay
                rating={chapterRatingStats.averageRating}
                ratingCount={chapterRatingStats.ratingCount}
                size="xs"
                showCount
              />
            </div>
            <span className="text-[11px] text-amber-400 font-semibold block truncate">
              {manga.title} · Vol. {currentVolumeNumber} ·{' '}
              {readingMode === 'vertical'
                ? 'Continuous Scroll'
                : readingMode === 'page_flip'
                ? 'Page Flip'
                : 'Single Page'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ReadingSessionTimerPill
            elapsedSeconds={elapsedSeconds}
            isRunning={isTimerRunning}
            onTogglePause={() => {
              setIsTimerRunning((prev) => !prev);
              resetAutoHideTimer();
            }}
            onOpenSummary={() => {
              setIsSummaryModalOpen(true);
              resetAutoHideTimer();
            }}
            currentPage={currentPageIndex + 1}
            totalPages={totalPages}
          />

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono tabular-nums font-bold text-amber-300">
            <span>{Math.round(currentProgress)}%</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 text-[11px] font-normal">
              Pg {currentPageIndex + 1}/{totalPages || 1}
            </span>
          </div>

          {/* Bookmark Current Page Button */}
          <button
            id="reader-bookmark-page-btn"
            type="button"
            onClick={handleBookmarkCurrentPage}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl border transition active:scale-95 shrink-0 ${
              bookmarkedPageIndex === currentPageIndex
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                : 'bg-white/10 border-transparent hover:bg-white/20 text-slate-200'
            }`}
            title={
              bookmarkedPageIndex === currentPageIndex
                ? `Bookmarked Page ${currentPageIndex + 1} in reading history`
                : `Bookmark Page ${currentPageIndex + 1} to reading history`
            }
            aria-label={
              bookmarkedPageIndex === currentPageIndex
                ? `Bookmarked Page ${currentPageIndex + 1} in reading history`
                : `Bookmark Page ${currentPageIndex + 1} to reading history`
            }
          >
            <Bookmark
              className={`w-4 h-4 shrink-0 ${
                bookmarkedPageIndex === currentPageIndex
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-amber-400'
              }`}
            />
          </button>

          <button
            id="reader-open-comments-btn"
            type="button"
            onClick={() => {
              setIsCommentsOpen(true);
              resetAutoHideTimer();
            }}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-slate-100 whitespace-nowrap shrink-0"
            title="Open Chapter Comments & Replies"
            aria-label={`Open chapter comments (${chapterCommentCount})`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden md:inline">Comments</span>
            <span className="font-mono tabular-nums text-amber-300">{chapterCommentCount}</span>
          </button>

          {/* Reader Settings Toggle Button */}
          <button
            id="reader-settings-btn"
            type="button"
            onClick={() => {
              setIsSettingsOpen((prev) => !prev);
              resetAutoHideTimer();
            }}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-slate-200 whitespace-nowrap shrink-0"
            title="Reader Settings (Single Page, Continuous, Page Flip)"
            aria-label="Reader Settings"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">
              {readingMode === 'vertical'
                ? 'Continuous'
                : readingMode === 'page_flip'
                ? 'Page Flip'
                : 'Single Page'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              toggleFullscreen();
              resetAutoHideTimer();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-slate-200"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* 3-dots Menu Button */}
          <button
            id="reader-more-menu-btn"
            type="button"
            onClick={() => {
              setIsMoreMenuOpen(true);
              resetAutoHideTimer();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-slate-200"
            aria-label="More options"
            title="Menu & Controls"
          >
            <MoreHorizontal className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* BOOKMARK SAVED CONFIRMATION PILL */}
      {bookmarkToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[135] pointer-events-none px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-fadeIn"
        >
          <Bookmark className="w-3.5 h-3.5 fill-black text-black shrink-0" />
          <span>{bookmarkToast}</span>
        </div>
      )}

      {/* MAIN READER CONTENT */}
      {readingMode === 'vertical' ? (
        <div
          ref={verticalContainerRef}
          onScroll={handleVerticalScroll}
          className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center bg-[#000000] m-0 p-0 overscroll-y-contain smooth-scroll-container"
        >
          {/* Continuous vertical scroll with strictly 0px gap between pages */}
          {pages.map((p, idx) => {
            const isWithinActiveWindow =
              idx <= activeAheadWindow ||
              (idx >= currentPageIndex - 1 && idx <= currentPageIndex + activeAheadWindow);
            return (
              <div
                key={`row-${p.id || idx}-${idx}`}
                className="w-full m-0 p-0 border-0 leading-none bg-[#000000]"
              >
                <ReaderPageSurface
                  imageUrl={p.imageUrl}
                  pageIndex={idx}
                  isWithinActiveWindow={isWithinActiveWindow}
                  isCurrentPage={idx === currentPageIndex}
                  mode="vertical"
                  onImageNode={registerImageNode}
                  onPageDecoded={recomputeVerticalLayoutMetrics}
                />
              </div>
            );
          })}

          {/* End of Chapter Unlock, Next Chapter & Threaded Reader Discussion Section */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-auto px-4 pt-12 pb-32 text-center bg-[#000000] space-y-6"
          >
            {/* Reading Session Live Summary Card */}
            <ReadingSessionSummaryCard
              summary={currentSessionSummary}
              onViewModal={() => setIsSummaryModalOpen(true)}
              onReadNextChapter={
                nextChapter && onChapterChange ? () => onChapterChange(nextChapter.id) : undefined
              }
              hasNextChapter={Boolean(nextChapter)}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 space-y-5">
              {/* Chapter & Volume 1–5 Star Rating Card */}
              <div
                id="reader-end-chapter-rating-panel"
                className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-4 space-y-3 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Rate Chapter {chapter.number}
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {chapter.title || `Chapter ${chapter.number}`}
                    </p>
                  </div>
                  <StarRatingInput
                    idPrefix={`reader-end-ch-${chapter.id}`}
                    value={chapterRatingStats.userScore}
                    averageRating={chapterRatingStats.averageRating}
                    ratingCount={chapterRatingStats.ratingCount}
                    onRate={handleRateCurrentChapter}
                    size="md"
                    showAverageSummary
                    showStatusLabel
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300">
                      Volume {currentVolumeNumber} Rating
                    </span>
                    {mangaOverallStats && (
                      <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                        Series Avg: ★ {mangaOverallStats.averageRating.toFixed(1)} (
                        {mangaOverallStats.ratingCount})
                      </p>
                    )}
                  </div>
                  <StarRatingInput
                    idPrefix={`reader-end-vol-${manga.id}-v${currentVolumeNumber}`}
                    value={volumeRatingStats.userScore}
                    averageRating={volumeRatingStats.averageRating}
                    ratingCount={volumeRatingStats.ratingCount}
                    onRate={handleRateCurrentVolume}
                    size="sm"
                    showAverageSummary
                  />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  Finished {chapter.title || `Chapter ${chapter.number}`}
                </p>
                <h3 className="text-lg font-bold text-white">
                  Up Next: {targetNextChapter.title || `Chapter ${targetNextChapter.number}`}
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {!isTargetUnlocked && onRequestRewardedAd && (
                  <button
                    id="reader-watch-ad-unlock-next-btn"
                    type="button"
                    onClick={handleWatchAdUnlockNext}
                    className="min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 text-sm transition active:scale-[0.98] shadow-lg whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-black shrink-0" />
                    <span>Watch ad to unlock next chapter</span>
                  </button>
                )}

                {isTargetUnlocked && nextChapter && onChapterChange && (
                  <button
                    id="reader-go-next-chapter-btn"
                    type="button"
                    onClick={() => onChapterChange(nextChapter.id)}
                    className="min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-3 text-sm transition active:scale-[0.98] shadow-lg whitespace-nowrap shrink-0"
                  >
                    <span>Read Next Chapter</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                )}

                {isTargetUnlocked && !nextChapter && (
                  <span className="text-xs font-semibold text-emerald-400 py-2">
                    Next chapter pass unlocked via Google AdMob
                  </span>
                )}

                {!isVipOrPatron && onUpgradeClick && (
                  <button
                    type="button"
                    onClick={onUpgradeClick}
                    className="min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 font-semibold px-4 py-3 text-sm transition whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Google Play VIP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Threaded Chapter Comments & Direct Reader Replies */}
            <ChapterCommentsPanel
              mangaId={manga.id}
              mangaTitle={manga.title}
              chapterId={chapter.id}
              chapterNumber={chapter.number || 1}
              chapterTitle={chapter.title}
              currentPageNumber={currentPageIndex + 1}
              totalPages={totalPages}
              userBadge={readerUserBadge}
              variant="inline"
              onJumpToPage={handleJumpToPage}
            />
          </div>
        </div>
      ) : (
        <div
          dir="ltr"
          className="w-full h-full flex items-center justify-center bg-[#000000] relative m-0 p-0 overflow-hidden reader-viewport-touch"
        >
          {/* Page Display with Smooth 250ms Slide + Fade (Single Page) or 3D Page Flip */}
          <AnimatePresence mode="popLayout" custom={slideDirection}>
            {readingMode === 'page_flip' ? (
              <motion.div
                key={`flip-${chapter?.id}-${currentPageIndex}`}
                custom={slideDirection}
                initial={{
                  opacity: 0.8,
                  rotateY: slideDirection === 'forward' ? 45 : -45,
                  transformPerspective: 1200,
                  transformOrigin: slideDirection === 'forward' ? 'left center' : 'right center',
                }}
                animate={{
                  opacity: 1,
                  rotateY: 0,
                  transformPerspective: 1200,
                }}
                exit={{
                  opacity: 0.8,
                  rotateY: slideDirection === 'forward' ? -45 : 45,
                  transformPerspective: 1200,
                  transformOrigin: slideDirection === 'forward' ? 'left center' : 'right center',
                }}
                transition={{
                  duration: 0.28,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="w-full h-full flex items-center justify-center bg-[#000000] m-0 p-0 overflow-y-auto no-scrollbar"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <ReaderPageSurface
                  imageUrl={pages[currentPageIndex]?.imageUrl}
                  pageIndex={currentPageIndex}
                  isWithinActiveWindow={true}
                  isCurrentPage={true}
                  mode="single"
                />
              </motion.div>
            ) : (
              <motion.div
                key={`single-${chapter?.id}-${currentPageIndex}`}
                custom={slideDirection}
                initial={{
                  opacity: 0.7,
                  x: slideDirection === 'forward' ? 50 : -50,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0.7,
                  x: slideDirection === 'forward' ? -50 : 50,
                }}
                transition={{
                  duration: 0.25, // 250ms smooth transition like turning a page
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="w-full h-full flex items-center justify-center bg-[#000000] m-0 p-0 overflow-y-auto no-scrollbar"
              >
                <ReaderPageSurface
                  imageUrl={pages[currentPageIndex]?.imageUrl}
                  pageIndex={currentPageIndex}
                  isWithinActiveWindow={true}
                  isCurrentPage={true}
                  mode="single"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* On-Screen Prev/Next Click Zones & Navigation Overlay */}
          {showOverlay && (
            <>
              <button
                type="button"
                disabled={currentPageIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevPage();
                  resetAutoHideTimer();
                }}
                className="min-h-[44px] absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-black/75 border border-white/15 text-white/90 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition hover:bg-black/90 whitespace-nowrap z-30"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                type="button"
                disabled={currentPageIndex >= totalPages - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPage();
                  resetAutoHideTimer();
                }}
                className="min-h-[44px] absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-black/75 border border-white/15 text-amber-400 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition hover:bg-black/90 whitespace-nowrap z-30"
                aria-label="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </>
          )}

          {currentPageIndex === totalPages - 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md flex flex-col items-center gap-2.5"
            >
              <div className="w-full rounded-2xl border border-white/15 bg-black/90 backdrop-blur-md px-4 py-3 flex flex-col items-center gap-1.5 shadow-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Rate Chapter {chapter.number}
                </span>
                <StarRatingInput
                  idPrefix={`reader-ltr-end-ch-${chapter.id}`}
                  value={chapterRatingStats.userScore}
                  averageRating={chapterRatingStats.averageRating}
                  ratingCount={chapterRatingStats.ratingCount}
                  onRate={handleRateCurrentChapter}
                  size="sm"
                  showAverageSummary
                  showStatusLabel
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setIsSummaryModalOpen(true);
                    resetAutoHideTimer();
                  }}
                  className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 backdrop-blur-md text-amber-300 font-semibold px-4 py-3 text-xs shadow-2xl transition active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  <Timer className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Session Summary</span>
                  <span className="font-mono tabular-nums text-amber-300">
                    ({formatDigitalTimer(elapsedSeconds)})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCommentsOpen(true);
                    resetAutoHideTimer();
                  }}
                  className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/85 hover:bg-slate-900 backdrop-blur-md text-white font-semibold px-4 py-3 text-xs shadow-2xl transition active:scale-[0.98] whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Chapter Discussion</span>
                  <span className="font-mono tabular-nums text-amber-300">
                    ({chapterCommentCount})
                  </span>
                </button>

                {!isTargetUnlocked && onRequestRewardedAd && (
                  <button
                    type="button"
                    onClick={handleWatchAdUnlockNext}
                    className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 text-sm shadow-2xl transition active:scale-[0.98] whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-black shrink-0" />
                    <span>Watch ad to unlock next chapter</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM BAR */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          resetAutoHideTimer();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          resetAutoHideTimer();
        }}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`fixed left-0 right-0 z-50 px-4 py-3 bg-[#000000]/90 backdrop-blur-md border-t border-white/10 transition-[bottom,transform,opacity] duration-300 ease-in-out space-y-2.5 safe-bottom-inset ${
          isBottomBarsVisible ? 'bottom-[50px]' : 'bottom-0'
        } ${
          showOverlay
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {!isTargetUnlocked && onRequestRewardedAd && (
          <div className="flex justify-center max-w-lg mx-auto">
            <button
              type="button"
              onClick={handleWatchAdUnlockNext}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 text-xs transition whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
              <span>Watch ad to unlock next chapter</span>
            </button>
          </div>
        )}

        {/* Page Slider */}
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <span className="text-xs font-mono tabular-nums font-bold text-amber-400 min-w-[85px] text-right whitespace-nowrap">
            {currentPageIndex + 1}/{totalPages || 1}
            <span className="text-[10px] text-slate-300 font-semibold ml-1.5">
              {Math.round(currentProgress)}%
            </span>
          </span>

          <input
            type="range"
            min={0}
            max={Math.max(0, totalPages - 1)}
            value={currentPageIndex}
            onChange={(e) => {
              resetAutoHideTimer();
              const newIdx = parseInt(e.target.value, 10);
              setSlideDirection(newIdx >= currentPageIndex ? 'forward' : 'backward');
              setCurrentPageIndex(newIdx);
              if (readingMode === 'vertical' && pageImageRefs.current[newIdx]) {
                pageImageRefs.current[newIdx]?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex-1 accent-amber-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
          />

          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold w-16">
            Pages
          </span>
        </div>

        {/* 3 Reading Modes Selector & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-lg mx-auto text-xs">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            {/* Mode 1: Single Page (Default) */}
            <button
              type="button"
              onClick={() => {
                handleToggleReadingMode('single');
                resetAutoHideTimer();
              }}
              className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                readingMode === 'single' || readingMode === 'horizontal_ltr'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Single Page mode (250ms smooth slide)"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Single</span>
            </button>

            {/* Mode 2: Continuous Vertical Scroll */}
            <button
              type="button"
              onClick={() => {
                handleToggleReadingMode('vertical');
                resetAutoHideTimer();
              }}
              className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                readingMode === 'vertical'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Continuous Vertical Scroll (0px gap)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              <span>Continuous</span>
            </button>

            {/* Mode 3: Page Flip */}
            <button
              type="button"
              onClick={() => {
                handleToggleReadingMode('page_flip');
                resetAutoHideTimer();
              }}
              className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs ${
                readingMode === 'page_flip'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="3D Page Flip mode"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Flip</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(true);
                resetAutoHideTimer();
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold transition flex items-center gap-1 whitespace-nowrap shrink-0"
              title="Reading Settings"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              id="reader-bottom-comments-btn"
              type="button"
              onClick={() => {
                setIsCommentsOpen(true);
                resetAutoHideTimer();
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Discussion</span>
              <span className="font-mono tabular-nums text-amber-300">
                ({chapterCommentCount})
              </span>
            </button>

            <StarRatingInput
              idPrefix={`reader-bottom-ch-${chapter.id}`}
              label={`Ch. ${chapter.number}:`}
              value={chapterRatingStats.userScore}
              averageRating={chapterRatingStats.averageRating}
              ratingCount={chapterRatingStats.ratingCount}
              onRate={handleRateCurrentChapter}
              size="xs"
              showAverageSummary
            />
          </div>
        </div>
      </div>

      {/* READER SETTINGS DRAWER / MODAL */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reader Settings"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(false);
          }}
          className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#0a0a0a] rounded-t-3xl sm:rounded-2xl border border-white/15 p-5 space-y-5 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Reader Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Reading Modes at Top of Settings */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Reading Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Single Page (Default) */}
                <button
                  type="button"
                  onClick={() => handleToggleReadingMode('single')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    readingMode === 'single' || readingMode === 'horizontal_ltr'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-1.5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">Single Page</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">250ms slide</span>
                </button>

                {/* 2. Continuous Vertical Scroll */}
                <button
                  type="button"
                  onClick={() => handleToggleReadingMode('vertical')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    readingMode === 'vertical'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <ArrowUpDown className="w-5 h-5 mb-1.5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">Continuous</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">0px gap scroll</span>
                </button>

                {/* 3. Page Flip */}
                <button
                  type="button"
                  onClick={() => handleToggleReadingMode('page_flip')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                    readingMode === 'page_flip'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-5 h-5 mb-1.5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">Page Flip</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">3D realistic</span>
                </button>
              </div>
            </div>

            {/* Page Fit Mode */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Page Fit
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/60 text-amber-400 text-xs font-bold text-center">
                Fit Width (Default) · Screen Width, Auto Height
              </div>
              <p className="text-[10px] text-slate-400">
                Preserves original manga aspect ratio with zero cropping or zoom cut-off. Centered vertically.
              </p>
            </div>

            {/* Pure Black Background & Immersive Mode */}
            <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Reader Background</span>
                <span className="font-mono text-amber-400">Pure Black (#000000)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Immersive Mode</span>
                <span className="text-emerald-400">Auto-hide bars (2s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Touch Controls</span>
                <span className="text-slate-300">Tap center: menu · Left/Right: turn</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER / MOBILE BOTTOM-SHEET CHAPTER COMMENTS & THREADED REPLIES DRAWER */}
      {isCommentsOpen && (
        <div
          id="reader-comments-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Chapter ${chapter.number} comments and replies`}
          onClick={(e) => {
            e.stopPropagation();
            setIsCommentsOpen(false);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-sm flex items-end sm:items-stretch sm:justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full h-[86vh] sm:h-full sm:max-w-md bg-[#0b0e16] rounded-t-3xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Mobile Bottom-Sheet Drag Handle Affordance */}
            <div className="sm:hidden pt-2.5 pb-1 shrink-0 bg-[#0b0e16]">
              <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto" />
            </div>

            <ChapterCommentsPanel
              mangaId={manga.id}
              mangaTitle={manga.title}
              chapterId={chapter.id}
              chapterNumber={chapter.number || 1}
              chapterTitle={chapter.title}
              currentPageNumber={currentPageIndex + 1}
              totalPages={totalPages}
              userBadge={readerUserBadge}
              variant="drawer"
              onClose={() => setIsCommentsOpen(false)}
              onJumpToPage={handleJumpToPage}
            />
          </div>
        </div>
      )}

      {/* Chapter Completed Reading Session Summary Celebration Modal */}
      <ReadingSessionSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={currentSessionSummary}
        manga={manga}
        chapter={chapter}
        onReadNextChapter={
          nextChapter && onChapterChange ? () => onChapterChange(nextChapter.id) : undefined
        }
        hasNextChapter={Boolean(nextChapter)}
        onRestartChapter={() => {
          setElapsedSeconds(0);
          setIsTimerRunning(true);
          handleJumpToPage(0);
          sessionStartTimeRef.current = Date.now();
          hasAutoShownSummaryRef.current = false;
          hasSavedSessionRef.current = false;
        }}
        onRateChapter={handleRateCurrentChapter}
        userChapterRating={chapterRatingStats.userScore}
        averageChapterRating={chapterRatingStats.averageRating}
      />

      {/* Reader Full-Screen Menu */}
      <FullScreenMenu
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        userSubscription={
          userSubscription || {
            tier: 'free',
            planName: 'Free Reader',
            price: 'R0.00',
            activeSince: '2026-09-01',
            expiresAt: '2026-10-01',
            autoRenew: false,
            perks: [],
            unlockedChapters: [],
          }
        }
        searchQuery=""
        onSearchChange={() => {}}
        onTabChange={(tab) => {
          setIsMoreMenuOpen(false);
          onBack();
        }}
        onSelectFilter={() => {}}
        onUpgradeClick={() => {
          setIsMoreMenuOpen(false);
          onUpgradeClick?.();
        }}
        onQuickToggleTier={() => {}}
        currentLanguage="en"
        setLanguage={() => {}}
      />
    </div>
  );
};
