import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Zap } from 'lucide-react';
import { ChapterPage, Chapter } from '../../types';
import { isPagePreloaded, markPageLoadedExternally } from './ReaderConfig';
import { AdMobBanner } from '../ads/AdMobBanner';

interface LazyMangaPageProps {
  page: ChapterPage;
  index: number;
  total: number;
  chapter: Chapter;
  isVipUser: boolean;
  currentRandomAd?: any;
  onUpgradeClick?: () => void;
  isDataSaver?: boolean;
  onPageInView?: (chapterId: string, pageNumber: number) => void;
  rootContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const LazyMangaPageComponent: React.FC<LazyMangaPageProps> = ({
  page,
  index,
  total,
  chapter,
  isVipUser,
  currentRandomAd,
  onUpgradeClick,
  isDataSaver = false,
  onPageInView,
  rootContainerRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const alreadyCached = isPagePreloaded(page.imageUrl);
  // Pre-load first 4 pages or any page already warmed in the 3-page preloader cache
  const [isInView, setIsInView] = useState<boolean>(() => index < 4 || alreadyCached);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => alreadyCached);
  const [hasError, setHasError] = useState<boolean>(false);

  // IntersectionObserver for lazy-loading image bytes
  useEffect(() => {
    if (isInView) return;
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        root: rootContainerRef?.current || null,
        rootMargin: isDataSaver ? '150px 0px' : '400px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [isInView, isDataSaver, rootContainerRef]);

  // Secondary IntersectionObserver for tracking which page is actively in view
  useEffect(() => {
    const target = containerRef.current;
    if (!target || !onPageInView) return;

    const activeObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          onPageInView(chapter.id, page.pageNumber);
        }
      },
      {
        root: rootContainerRef?.current || null,
        threshold: 0.5,
      }
    );

    activeObserver.observe(target);
    return () => {
      activeObserver.disconnect();
    };
  }, [chapter.id, page.pageNumber, onPageInView, rootContainerRef]);

  return (
    <>
      <div
        ref={containerRef}
        data-page-index={index}
        data-page-number={page.pageNumber}
        data-chapter-id={chapter.id}
        className="manga-page-container relative w-full overflow-hidden bg-black shadow-2xl border-b border-slate-900 min-h-[480px] sm:min-h-[680px] flex items-center justify-center transition-all duration-300"
      >
        {!isInView ? (
          /* Lightweight Skeleton Placeholder (0 KB Image Payload Downloaded) */
          <div className="w-full h-full min-h-[480px] sm:min-h-[680px] flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 text-slate-500 animate-pulse select-none">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3 text-amber-400/80 shadow-inner">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-slate-300">
                Ch. {chapter.number} • Page {page.pageNumber} of {total}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300 mt-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Lazy-Loading Active • Data Saved</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-2 font-mono">
              Scrolls into view to load
            </span>
          </div>
        ) : (
          /* Actual High-Res Manga Page */
          <>
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-[10px] font-mono text-slate-400">Loading Page {page.pageNumber}...</span>
              </div>
            )}

            <img
              src={page.imageUrl}
              alt={`Page ${page.pageNumber}`}
              className={`w-full h-auto object-cover block transition-opacity duration-200 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              referrerPolicy="no-referrer"
              decoding="async"
              loading={index < 4 || isLoaded ? 'eager' : 'lazy'}
              onLoad={() => {
                markPageLoadedExternally(page.imageUrl);
                setIsLoaded(true);
              }}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
            />

            {/* Authentic Manga Dialogue Bubbles */}
            {page.dialogs && page.dialogs.length > 0 && isLoaded && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                {page.dialogs.map((d, dIdx) => (
                  <div
                    key={`dialog-${page.id || page.pageNumber}-${dIdx}`}
                    className={`pointer-events-auto max-w-[240px] sm:max-w-[280px] rounded-2xl bg-white/95 text-slate-900 p-2.5 sm:p-3 shadow-2xl border-2 border-black font-['Comic_Neue',sans-serif] ${
                      d.position === 'top-left'
                        ? 'self-start mt-2'
                        : d.position === 'top-right'
                        ? 'self-end mt-2 text-right'
                        : d.position === 'bottom-left'
                        ? 'self-start mb-2'
                        : d.position === 'bottom-right'
                        ? 'self-end mb-2 text-right'
                        : 'self-center my-auto text-center'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 font-sans">
                      {d.speaker}
                    </span>
                    <p className="text-xs sm:text-sm font-bold leading-tight">
                      "{d.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Page index badge */}
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              {page.pageNumber} / {total}
            </span>
          </>
        )}
      </div>

      {/* IN-STREAM AD BREAK: Rendered after page 2 ONLY for Free Users */}
      {!isVipUser && index === 1 && currentRandomAd && onUpgradeClick && (
        <div key={`ad-container-${page.id || page.pageNumber || index}-${index}`} className="w-full px-2">
          <AdMobBanner
            key={`ad-${page.id || page.pageNumber || index}-${index}`}
            ad={currentRandomAd}
            bannerId="ca-app-pub-3940256099942544/6300978111"
            onUpgradeClick={onUpgradeClick}
          />
        </div>
      )}
    </>
  );
};

export const LazyMangaPage = React.memo(LazyMangaPageComponent);
