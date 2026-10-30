import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { Chapter, Manga, UserSubscription } from '../../types';
import {
  ReadingMode,
  preloadUpcomingPages,
  isPagePreloaded,
  getPageLoadStatus,
  markPageLoadedExternally,
  subscribeToPageLoadState,
  retryPreloadMangaImage,
  DEFAULT_READER_CONFIG,
} from './ReaderConfig';
import { AdMobBanner } from '../ads/AdMobBanner';
import { safeStorage } from '../../utils/safeStorage';
import { getProfileConfig, scheduleIdleTask } from '../../utils/devicePerformance';
import { recordChapterRead } from '../../utils/readingStreak';
import { saveReadingProgress } from '../../services/userProfile';
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

export interface ReaderViewProps {
  manga: Manga;
  chapter: Chapter;
  onBack: () => void;
  userSubscription?: UserSubscription;
  onChapterChange?: (chapterId: string) => void;
  onRequestRewardedAd?: (chapter: Chapter, onUnlocked?: () => void) => void;
  onUpgradeClick?: () => void;
  dataSaverMode?: boolean;
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
            ? 'relative w-full flex justify-center items-center bg-black m-0 p-0 border-0 manga-page-container min-h-[320px]'
            : 'relative w-full h-full flex items-center justify-center bg-black m-0 p-0'
        }
      >
        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-black/90 pointer-events-none">
            <div className="h-7 w-7 rounded-full border-2 border-amber-500/25 border-t-amber-400 animate-spin" />
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              Page {pageIndex + 1}
            </span>
          </div>
        )}

        {status === 'error' ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center bg-slate-950/90 rounded-2xl border border-slate-800 max-w-xs mx-auto my-6"
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
                ? `max-h-screen w-auto max-w-full object-contain mx-auto select-none block m-0 p-0 manga-page-img reader-page-touch-vertical transition-opacity duration-150 ${
                    status === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`
                : `max-h-full h-full w-auto max-w-full object-contain mx-auto select-none block manga-page-img reader-page-touch-pinch transition-opacity duration-150 ${
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
}) => {
  const pages = useMemo(() => chapter?.pages || [], [chapter?.pages]);
  const totalPages = pages.length;
  const hasPages = Boolean(chapter && totalPages > 0);

  // Reading mode: Mode A ('vertical') or Mode B ('horizontal_ltr')
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    const saved = safeStorage.getItem('az_reader_mode');
    if (saved === 'vertical') return 'vertical';
    if (saved === 'horizontal_rtl') {
      safeStorage.setItem('az_reader_mode', 'horizontal_ltr');
      return 'horizontal_ltr';
    }
    if (saved === 'horizontal_ltr') return 'horizontal_ltr';
    return DEFAULT_READER_CONFIG.readingMode;
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Compositor & scroll measurement refs (zero synchronous layout reads during scroll frames)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const progressBarFillRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const pageImageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const pageMidpointsRef = useRef<number[]>([]);
  const maxScrollCachedRef = useRef<number>(0);
  const scrollRafRef = useRef<number | null>(null);
  const measureRafRef = useRef<number | null>(null);

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
   * 3-Page Chapter Preloading Strategy:
   * Always caches at least the next 3 pages (Page X+1, X+2, X+3) ahead of `currentPageIndex`
   * using network-aware sequential/parallel scheduling + Cache Storage persistence.
   */
  useEffect(() => {
    if (totalPages === 0) return;
    const profileAhead = getProfileConfig().imagePreloadCount;
    const aheadCount = Math.max(DEFAULT_READER_CONFIG.preloadAheadCount, profileAhead, 3);
    preloadUpcomingPages(pages, currentPageIndex, aheadCount, {
      dataSaverMode,
      nextChapterFirstPageUrl,
    });
  }, [currentPageIndex, pages, totalPages, dataSaverMode, nextChapterFirstPageUrl]);

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
          Math.max(0, (container.scrollTop / maxScrollCachedRef.current) * 100)
        );
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = `scaleX(${pct / 100})`;
        }
        setScrollProgress((prev) => (Math.abs(prev - pct) >= 1 ? pct : prev));
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
    setCurrentPageIndex((prev) => Math.min(prev + 1, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation for power readers / desktop (LTR)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (readingMode === 'horizontal_ltr') goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (readingMode === 'horizontal_ltr') goToPrevPage();
      } else if (e.key === ' ' || e.key === 'Enter') {
        setShowOverlay((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, readingMode, onBack]);

  const handleScreenClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width;
      const yRatio = (e.clientY - rect.top) / rect.height;

      const isCenterTap = xRatio >= 0.35 && xRatio <= 0.65 && yRatio >= 0.25 && yRatio <= 0.75;
      if (isCenterTap) {
        setShowOverlay((prev) => !prev);
        return;
      }

      if (readingMode === 'horizontal_ltr') {
        if (xRatio < 0.35) {
          goToPrevPage();
        } else if (xRatio > 0.65) {
          goToNextPage();
        }
      }
    },
    [readingMode, goToPrevPage, goToNextPage]
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
        readingMode === 'horizontal_ltr' &&
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
        setScrollProgress((prev) => (prev === pct ? prev : pct));
      } else {
        if (progressBarFillRef.current) {
          progressBarFillRef.current.style.transform = 'scaleX(0)';
        }
        setScrollProgress((prev) => (prev === 0 ? prev : 0));
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

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
      if (measureRafRef.current !== null) {
        window.cancelAnimationFrame(measureRafRef.current);
      }
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

  // Reset scroll and page index when switching chapter
  useEffect(() => {
    pageImageRefs.current = {};
    pageMidpointsRef.current = [];
    maxScrollCachedRef.current = 0;
    setCurrentPageIndex(0);
    setScrollProgress(0);
    if (verticalContainerRef.current) {
      verticalContainerRef.current.scrollTop = 0;
    }
  }, [chapter?.id]);

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
      safeStorage.setJSON('ka_pulse_last_read', {
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
          });
        } catch {}
      }, 2000);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [manga, chapter, hasPages, currentPageIndex, totalPages]);

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
      className="fixed inset-0 z-[100] m-0 p-0 w-screen h-screen-dynamic bg-black text-white select-none overflow-hidden reader-viewport-touch"
    >
      {/* GPU-COMPOSITED TOP HORIZONTAL READING PROGRESS BAR */}
      <div
        id="reader-top-progress-container"
        className="fixed top-0 left-0 right-0 z-[120] pointer-events-none"
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
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/85 backdrop-blur-md border-b border-white/10 transition-[transform,opacity] duration-200 ease-out safe-top-inset ${
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
              {readingMode === 'horizontal_ltr' ? 'LTR Manga Mode' : 'AZ Vertical'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono tabular-nums font-bold text-amber-300">
            <span>{Math.round(currentProgress)}%</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 text-[11px] font-normal">
              Pg {currentPageIndex + 1}/{totalPages || 1}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              handleToggleReadingMode(readingMode === 'vertical' ? 'horizontal_ltr' : 'vertical')
            }
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-slate-200 whitespace-nowrap shrink-0"
            title="Toggle Reading Mode"
          >
            {readingMode === 'vertical' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline">AZ Vertical</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">LTR Manga</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-slate-200"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MAIN READER CONTENT */}
      {readingMode === 'vertical' ? (
        <div
          ref={verticalContainerRef}
          onScroll={handleVerticalScroll}
          className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col items-center bg-black m-0 p-0 overscroll-y-contain smooth-scroll-container"
        >
          {pages.map((p, idx) => {
            // Eagerly keep current page, previous page, and the next 3 preloaded pages active
            const isWithinActiveWindow =
              idx <= 3 || (idx >= currentPageIndex - 1 && idx <= currentPageIndex + 3);
            return (
              <React.Fragment key={`row-${p.id || idx}-${idx}`}>
                <ReaderPageSurface
                  imageUrl={p.imageUrl}
                  pageIndex={idx}
                  isWithinActiveWindow={isWithinActiveWindow}
                  isCurrentPage={idx === currentPageIndex}
                  mode="vertical"
                  onImageNode={registerImageNode}
                  onPageDecoded={recomputeVerticalLayoutMetrics}
                />

                {userSubscription?.tier !== 'vip' && idx === 1 && (
                  <div className="w-full max-w-2xl px-4 py-2">
                    <AdMobBanner bannerId="ca-app-pub-7570164094154420/3068852398" />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* End of Chapter Unlock & Next Chapter Section */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl mx-auto px-4 pt-12 pb-28 text-center bg-black space-y-4"
          >
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
          </div>
        </div>
      ) : (
        <div
          dir="ltr"
          className="w-full h-full flex items-center justify-center bg-black relative m-0 p-0 overflow-hidden reader-viewport-touch"
        >
          <div
            ref={horizontalTrackRef}
            className="w-full h-full flex flex-row will-change-transform transition-transform duration-200 ease-out"
          >
            {pages.map((p, idx) => {
              // Mount previous page, current page, and the next 3 preloaded pages in GPU layer
              // so swiping forward up to 3 pages on slow networks has 0ms decode delay
              const isMountedSlide = idx >= currentPageIndex - 1 && idx <= currentPageIndex + 3;
              return (
                <div
                  key={`ltr-slide-${p.id || idx}-${idx}`}
                  className="w-full h-full shrink-0 flex items-center justify-center p-0 m-0"
                >
                  {isMountedSlide ? (
                    <ReaderPageSurface
                      imageUrl={p.imageUrl}
                      pageIndex={idx}
                      isWithinActiveWindow
                      isCurrentPage={idx === currentPageIndex}
                      mode="horizontal_ltr"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          {showOverlay && (
            <>
              <button
                type="button"
                disabled={currentPageIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevPage();
                }}
                className="min-h-[44px] absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-black/75 border border-white/15 text-white/90 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition hover:bg-black/90 whitespace-nowrap"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={currentPageIndex >= totalPages - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPage();
                }}
                className="min-h-[44px] absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-black/75 border border-white/15 text-amber-400 disabled:opacity-30 text-xs font-bold flex items-center gap-1 transition hover:bg-black/90 whitespace-nowrap"
                aria-label="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </>
          )}

          {currentPageIndex === totalPages - 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md flex flex-col items-center gap-2.5"
            >
              <div className="w-full rounded-2xl border border-white/15 bg-black/85 backdrop-blur-md px-4 py-3 flex flex-col items-center gap-1.5 shadow-2xl">
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
          )}
        </div>
      )}

      {/* BOTTOM BAR */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`fixed bottom-[44px] left-0 right-0 z-50 px-4 py-3.5 bg-black/85 backdrop-blur-md border-t border-white/10 transition-[transform,opacity] duration-200 ease-out space-y-3 safe-bottom-inset ${
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
              const newIdx = parseInt(e.target.value, 10);
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

        <div className="flex flex-wrap items-center justify-between gap-2 max-w-lg mx-auto text-xs">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleToggleReadingMode('horizontal_ltr')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                readingMode === 'horizontal_ltr'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>LTR Manga</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleReadingMode('vertical')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                readingMode === 'vertical'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>AZ Vertical</span>
            </button>
          </div>

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
  );
};
