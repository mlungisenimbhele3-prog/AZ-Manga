import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { Chapter, Manga, UserSubscription } from '../../types';
import { ReadingMode, preloadUpcomingPages, DEFAULT_READER_CONFIG } from './ReaderConfig';
import { AdMobBanner } from '../ads/AdMobBanner';
import { safeStorage } from '../../utils/safeStorage';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';

export interface ReaderViewProps {
  manga: Manga;
  chapter: Chapter;
  onBack: () => void;
  userSubscription?: UserSubscription;
  onChapterChange?: (chapterId: string) => void;
  onRequestRewardedAd?: (chapter: Chapter, onUnlocked?: () => void) => void;
  onUpgradeClick?: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  manga,
  chapter,
  onBack,
  userSubscription,
  onChapterChange,
  onRequestRewardedAd,
  onUpgradeClick,
}) => {
  const pages = chapter?.pages || [];
  const totalPages = pages.length;
  const hasPages = Boolean(chapter && totalPages > 0);

  // Reading mode: Mode A ('vertical') or Mode B ('horizontal_ltr')
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    try {
      const saved = localStorage.getItem('az_reader_mode');
      if (saved === 'vertical') return 'vertical';
      if (saved === 'horizontal_rtl') {
        localStorage.setItem('az_reader_mode', 'horizontal_ltr');
        return 'horizontal_ltr';
      }
      if (saved === 'horizontal_ltr') return 'horizontal_ltr';
    } catch {}
    return DEFAULT_READER_CONFIG.readingMode;
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Touch & scroll refs (RAF-throttled for 120Hz zero-jank scrolling)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const pageImageRefs = useRef<{ [key: number]: HTMLImageElement | null }>({});
  const scrollRafRef = useRef<number | null>(null);

  const handleToggleReadingMode = useCallback((mode: ReadingMode) => {
    setReadingMode(mode);
    try {
      localStorage.setItem('az_reader_mode', mode);
    } catch {}
  }, []);

  // Image preloading algorithm: Silently cache upcoming pages in background
  useEffect(() => {
    if (totalPages > 0) {
      preloadUpcomingPages(pages, currentPageIndex, DEFAULT_READER_CONFIG.preloadAheadCount);
    }
  }, [currentPageIndex, pages, totalPages]);

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
      touchStartTimeRef.current = Date.now();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartXRef.current;
      const deltaY = endY - touchStartYRef.current;
      const timeTaken = Date.now() - touchStartTimeRef.current;

      touchStartXRef.current = null;
      touchStartYRef.current = null;

      if (
        readingMode === 'horizontal_ltr' &&
        Math.abs(deltaX) > 40 &&
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

  // RAF-throttled vertical scroll listener (prevents synchronous layout thrashing at 120Hz)
  const handleVerticalScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = verticalContainerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const maxScroll = container.scrollHeight - clientHeight;

      if (maxScroll > 0) {
        const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
        setScrollProgress(pct);
      } else {
        setScrollProgress(0);
      }

      const viewportMiddle = scrollTop + clientHeight / 2;
      for (let i = 0; i < totalPages; i++) {
        const el = pageImageRefs.current[i];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (viewportMiddle >= top && viewportMiddle < top + height) {
            setCurrentPageIndex((prev) => (prev === i ? prev : i));
            break;
          }
        }
      }
    });
  }, [totalPages]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  // Keep scroll progress accurate as chapter images decode/resize
  useEffect(() => {
    if (!hasPages || readingMode !== 'vertical' || !verticalContainerRef.current) return;
    const container = verticalContainerRef.current;

    const updateScrollProgress = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        const pct = Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100));
        setScrollProgress(pct);
      }
    };

    updateScrollProgress();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollProgress);
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [hasPages, readingMode, chapter?.id, totalPages]);

  // Reset scroll and page index when switching chapter
  useEffect(() => {
    setCurrentPageIndex(0);
    setScrollProgress(0);
    if (verticalContainerRef.current) {
      verticalContainerRef.current.scrollTop = 0;
    }
  }, [chapter?.id]);

  // Debounced reading progress persistence (prevents synchronous localStorage writes during fast scroll)
  useEffect(() => {
    if (!manga || !chapter || !hasPages) return;
    const timer = window.setTimeout(() => {
      try {
        safeStorage.setJSON('ka_pulse_last_read', {
          mangaId: manga.id,
          mangaTitle: manga.title,
          coverImage: manga.coverImage || (manga as any).cover || '',
          chapterId: chapter.id,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title || `Chapter ${chapter.number}`,
          pageIndex: currentPageIndex,
          totalPages,
          timestamp: new Date().toISOString(),
        });
      } catch {}
    }, 350);

    return () => window.clearTimeout(timer);
  }, [manga, chapter, hasPages, currentPageIndex, totalPages]);

  // Safe empty-chapter guard AFTER all hooks (strictly preserves React Rules of Hooks)
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

  const currentProgress =
    readingMode === 'vertical'
      ? scrollProgress
      : totalPages > 0
      ? Math.min(100, Math.max(0, ((currentPageIndex + 1) / totalPages) * 100))
      : 0;

  const currentChapterIndex = manga?.chapters
    ? manga.chapters.findIndex((c) => c.id === chapter.id)
    : -1;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < manga.chapters.length - 1
      ? manga.chapters[currentChapterIndex + 1]
      : null;

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
      className="fixed inset-0 z-[100] m-0 p-0 w-screen h-screen-dynamic bg-black text-white select-none overflow-hidden"
      style={{
        backgroundColor: '#000000',
        touchAction: 'pan-x pan-y pinch-zoom',
      }}
    >
      {/* GPU-COMPOSITED TOP HORIZONTAL READING PROGRESS BAR (transform: scaleX instead of layout width) */}
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
            className="h-full w-full origin-left bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 will-change-transform transition-transform ease-out"
            style={{
              transform: `scaleX(${Math.max(0, Math.min(1, currentProgress / 100))})`,
              transitionDuration: readingMode === 'vertical' ? '50ms' : '180ms',
            }}
          />
        </div>
      </div>

      {/* TOP BAR */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/85 backdrop-blur-md border-b border-white/10 transition-[transform,opacity] duration-200 ease-out ${
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
            <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {chapter.title || `Chapter ${chapter.number}`}
            </h2>
            <span className="text-[11px] text-amber-400 font-semibold block truncate">
              {manga.title} · {readingMode === 'horizontal_ltr' ? 'LTR Manga Mode' : 'AZ Vertical'}
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
          {pages.map((p, idx) => (
            <React.Fragment key={`row-${p.id || idx}-${idx}`}>
              <div
                className="w-full flex justify-center items-center bg-black m-0 p-0 border-0 manga-page-container"
              >
                <img
                  ref={(el) => {
                    pageImageRefs.current[idx] = el;
                  }}
                  src={p.imageUrl}
                  alt={`Page ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  loading={idx <= 1 ? 'eager' : 'lazy'}
                  decoding="async"
                  {...{ fetchpriority: idx === 0 ? 'high' : 'auto' }}
                  className="max-h-screen w-auto max-w-full object-contain mx-auto select-none block m-0 p-0 manga-page-img"
                  style={{
                    touchAction: 'pan-y pinch-zoom',
                  }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + APP_LOGO_SRC) {
                      target.src = APP_LOGO_SRC;
                    }
                  }}
                />
              </div>

              {userSubscription?.tier !== 'vip' && idx === 1 && (
                <div className="w-full max-w-2xl px-4 py-2">
                  <AdMobBanner bannerId="ca-app-pub-3940256099942544/6300978111" />
                </div>
              )}
            </React.Fragment>
          ))}

          {/* End of Chapter Unlock & Next Chapter Section */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl mx-auto px-4 pt-12 pb-28 text-center bg-black space-y-4"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 space-y-4">
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
          className="w-full h-full flex items-center justify-center bg-black relative m-0 p-0 overflow-hidden"
          style={{
            touchAction: 'pan-x pan-y pinch-zoom',
          }}
        >
          <div
            className="w-full h-full flex flex-row will-change-transform transition-transform duration-200 ease-out"
            style={{
              transform: `translate3d(-${currentPageIndex * 100}%, 0, 0)`,
            }}
          >
            {pages.map((p, idx) => (
              <div
                key={`ltr-slide-${p.id || idx}-${idx}`}
                className="w-full h-full shrink-0 flex items-center justify-center p-0 m-0"
              >
                {Math.abs(idx - currentPageIndex) <= 2 ? (
                  <img
                    src={p.imageUrl}
                    alt={`Page ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    className="max-h-full h-full w-auto max-w-full object-contain mx-auto select-none block manga-page-img"
                    style={{
                      touchAction: 'pinch-zoom',
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== window.location.origin + APP_LOGO_SRC) {
                        target.src = APP_LOGO_SRC;
                      }
                    }}
                  />
                ) : null}
              </div>
            ))}
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

          {currentPageIndex === totalPages - 1 && !isTargetUnlocked && onRequestRewardedAd && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md flex justify-center"
            >
              <button
                type="button"
                onClick={handleWatchAdUnlockNext}
                className="min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-3 text-sm shadow-2xl transition active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-black shrink-0" />
                <span>Watch ad to unlock next chapter</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM BAR */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={`fixed bottom-[44px] left-0 right-0 z-50 px-4 py-3.5 bg-black/85 backdrop-blur-md border-t border-white/10 transition-[transform,opacity] duration-200 ease-out space-y-3 ${
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

        <div className="flex items-center justify-between max-w-lg mx-auto text-xs">
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

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <span>Tap right for next page · Center for menu</span>
          </div>
        </div>
      </div>
    </div>
  );
};
