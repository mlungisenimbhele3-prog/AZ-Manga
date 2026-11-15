import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Manga, ReleaseDay, isMangaComingSoon, getMangaType } from '../../types';
import { Eye, RefreshCw, Calendar, Clock, Crown, Layers, AlertTriangle } from 'lucide-react';
import { formatViews } from '../../services/catalogApi';
import { MangaCoverImage } from '../common/MangaCoverImage';
import type { UpcomingScheduleItem } from '../../services/layeredApi';
import {
  buildWedToTueCalendarDays,
  getCurrentSastDateString,
  getSeedReleaseDay,
  normalizeReleaseDay,
  WEEK_STRIP_ORDER,
} from '../../utils/releaseSchedule';

export interface MangaPlusUpdatesHomeProps {
  mangaList: Manga[];
  onSelectDetailManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onOpenSubscriptionModal: () => void;
  isVipUser?: boolean;
  upcomingSchedules?: UpcomingScheduleItem[];
  loadError?: string | null;
  onRetryLoad?: () => void;
}

interface DaySchedule {
  isoDate: string; // 'YYYY-MM-DD'
  dayName: ReleaseDay; // 'WED'..'TUE'
  formattedDate: string; // 'Nov 15'
  isToday: boolean;
  hasUpdates: boolean;
}

const formatChapterNum = (num?: number): string => {
  if (!num || isNaN(num)) return '001';
  return String(num).padStart(3, '0');
};

const toLocalIsoDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getChapterIsoDate = (releaseDate?: string): string | null => {
  if (!releaseDate) return null;
  const trimmed = releaseDate.trim();
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  return toLocalIsoDate(parsed);
};

/**
 * True ONLY if the manga has at least one real published chapter (with pages) matching the exact calendar day.
 * Never infers updates from manga.type, featured status, or ID hash.
 */
const doesMangaHaveChapterOnDate = (
  manga: Manga,
  targetIsoDate: string,
  targetDayName: ReleaseDay
): boolean => {
  const seriesReleaseDay = normalizeReleaseDay(
    manga.releaseDay,
    manga.id || getSeedReleaseDay(manga.id)
  );
  if (seriesReleaseDay !== targetDayName) return false;
  if (!manga.chapters || manga.chapters.length === 0) return false;
  return manga.chapters.some((ch) => {
    const isPublished =
      ch.publishStatus !== 'scheduled' &&
      ch.publishStatus !== 'draft' &&
      ch.status !== 'scheduled' &&
      ch.status !== 'draft';
    return (
      isPublished &&
      Array.isArray(ch.pages) &&
      ch.pages.length > 0 &&
      getChapterIsoDate(ch.releaseDate) === targetIsoDate
    );
  });
};

export const MangaPlusUpdatesHome: React.FC<MangaPlusUpdatesHomeProps> = React.memo(({
  mangaList,
  onSelectDetailManga,
  upcomingSchedules = [],
  loadError = null,
  onRetryLoad,
}) => {
  const todayIso = useMemo(() => getCurrentSastDateString(), []);

  // Original vs Backdrop filter (defaults to 'original' on Home)
  const [seriesTypeFilter, setSeriesTypeFilter] = useState<'original' | 'backdrop' | 'all'>('original');

  // Selected calendar ISO date (default to today in SAST)
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(todayIso);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const weekStripScrollRef = useRef<HTMLDivElement>(null);

  // Base approved catalog
  const approvedCatalog = useMemo(() => {
    return mangaList.filter((m) => {
      if (!m || m.id === 'placeholder' || m.isBanned) return false;
      if (m.approvalStatus && m.approvalStatus !== 'approved') return false;
      return true;
    });
  }, [mangaList]);

  // Strict permanent partitions by manga.type ONLY — NEVER changed by date or update status
  const originalCatalog = useMemo(
    () => approvedCatalog.filter((m) => getMangaType(m) === 'original'),
    [approvedCatalog]
  );

  const backdropCatalog = useMemo(
    () => approvedCatalog.filter((m) => getMangaType(m) === 'backdrop'),
    [approvedCatalog]
  );

  const activeTypeCatalog = useMemo(() => {
    if (seriesTypeFilter === 'original') return originalCatalog;
    if (seriesTypeFilter === 'backdrop') return backdropCatalog;
    return approvedCatalog;
  }, [seriesTypeFilter, originalCatalog, backdropCatalog, approvedCatalog]);

  // Build the 7 days starting on Wednesday: WED THU FRI SAT SUN MON TUE
  const weekDays: DaySchedule[] = useMemo(() => {
    return buildWedToTueCalendarDays(todayIso).map((item) => {
      const hasUpdates = activeTypeCatalog.some((m) =>
        doesMangaHaveChapterOnDate(m, item.isoDate, item.dayName)
      );
      return {
        isoDate: item.isoDate,
        dayName: item.dayName,
        formattedDate: `${item.monthLabel} ${item.dateNumber}`,
        isToday: item.isToday,
        hasUpdates,
      };
    });
  }, [todayIso, activeTypeCatalog]);

  const selectedDay = useMemo(
    () => weekDays.find((d) => d.isoDate === selectedIsoDate) || weekDays[0],
    [weekDays, selectedIsoDate]
  );

  // Filter chapters/updates within the active type filter for the selected calendar day
  const dayUpdatedOriginal = useMemo(
    () =>
      selectedDay
        ? originalCatalog.filter((m) =>
            doesMangaHaveChapterOnDate(m, selectedDay.isoDate, selectedDay.dayName)
          )
        : [],
    [originalCatalog, selectedDay]
  );

  const dayUpdatedBackdrop = useMemo(
    () =>
      selectedDay
        ? backdropCatalog.filter((m) =>
            doesMangaHaveChapterOnDate(m, selectedDay.isoDate, selectedDay.dayName)
          )
        : [],
    [backdropCatalog, selectedDay]
  );

  const dayHasRealUpdates =
    seriesTypeFilter === 'original'
      ? dayUpdatedOriginal.length > 0
      : seriesTypeFilter === 'backdrop'
      ? dayUpdatedBackdrop.length > 0
      : dayUpdatedOriginal.length > 0 || dayUpdatedBackdrop.length > 0;

  // Next 3 upcoming release series for "Coming this week"
  const comingThisWeekItems = useMemo(() => {
    const selectedOrderIdx = selectedDay
      ? WEEK_STRIP_ORDER.indexOf(selectedDay.dayName)
      : 0;

    if (upcomingSchedules.length > 0) {
      return upcomingSchedules
        .slice()
        .sort((a, b) => {
          const da = (WEEK_STRIP_ORDER.indexOf(a.releaseDay) - selectedOrderIdx + 7) % 7;
          const db = (WEEK_STRIP_ORDER.indexOf(b.releaseDay) - selectedOrderIdx + 7) % 7;
          return (da === 0 ? 7 : da) - (db === 0 ? 7 : db);
        })
        .slice(0, 3);
    }

    return approvedCatalog
      .map((m) => ({
        mangaId: m.id,
        title: m.title,
        releaseDay: normalizeReleaseDay(m.releaseDay, m.id || getSeedReleaseDay(m.id)),
        scheduledFor: null as string | null,
        chapterNumber: null as number | null,
        type: getMangaType(m),
      }))
      .sort((a, b) => {
        const da = (WEEK_STRIP_ORDER.indexOf(a.releaseDay) - selectedOrderIdx + 7) % 7;
        const db = (WEEK_STRIP_ORDER.indexOf(b.releaseDay) - selectedOrderIdx + 7) % 7;
        return (da === 0 ? 7 : da) - (db === 0 ? 7 : db);
      })
      .slice(0, 3);
  }, [upcomingSchedules, approvedCatalog, selectedDay]);

  // Featured banner strictly respects active type tab and NEVER pulls Backdrop into Originals
  const featuredManga = useMemo(() => {
    if (seriesTypeFilter === 'original') {
      return dayUpdatedOriginal[0] || originalCatalog[0] || null;
    }
    if (seriesTypeFilter === 'backdrop') {
      return dayUpdatedBackdrop[0] || backdropCatalog[0] || null;
    }
    return dayUpdatedOriginal[0] || originalCatalog[0] || dayUpdatedBackdrop[0] || backdropCatalog[0] || null;
  }, [
    seriesTypeFilter,
    dayUpdatedOriginal,
    dayUpdatedBackdrop,
    originalCatalog,
    backdropCatalog,
  ]);

  // Auto-scroll the week strip to center today / selected day on mount
  useEffect(() => {
    const container = weekStripScrollRef.current;
    if (!container) return;
    const selectedEl = container.querySelector('[data-selected="true"]') as HTMLElement | null;
    if (selectedEl) {
      const scrollLeft = selectedEl.offsetLeft - container.offsetWidth / 2 + selectedEl.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [selectedIsoDate]);

  // Touch pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 5) {
      touchStartYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartYRef.current;
    if (distance > 0 && window.scrollY <= 5) {
      setPullDistance(Math.min(distance * 0.45, 80));
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 45 && !isRefreshing) {
      triggerRefresh();
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPullDistance(52);
    onRetryLoad?.();
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }, 650);
  }, [onRetryLoad]);

  const renderMangaGridCard = (manga: Manga, keyPrefix: string) => {
    const isCardComingSoon = isMangaComingSoon(manga);
    const mangaType = getMangaType(manga);
    const latestChapterNum =
      manga.chapters?.[manga.chapters.length - 1]?.number || manga.chapters?.length || 0;

    return (
      <div
        key={`${keyPrefix}-${manga.id}`}
        onClick={() => onSelectDetailManga(manga)}
        className="group flex flex-col cursor-pointer transition active:scale-[0.98]"
      >
        {/* Cover image 2:3 ratio, rounded 12px */}
        <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-md">
          <MangaCoverImage
            src={manga.coverImage || manga.cover || manga.coverUrl || ''}
            alt={manga.title}
            title={manga.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-1.5 left-1.5 z-10">
            {mangaType === 'original' ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 text-black px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider shadow">
                <Crown className="w-2 h-2 fill-black" />
                <span>ORIGINAL</span>
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-black/80 border border-slate-600 text-slate-200 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                BACKDROP
              </span>
            )}
          </div>
        </div>

        {/* Title below in white 13px bold, 1 line with ellipsis */}
        <h3 className="mt-1.5 text-[13px] font-bold text-white truncate leading-tight group-hover:text-amber-400 transition-colors">
          {manga.title}
        </h3>

        {/* Below title: Coming Soon badge only OR real chapter + live views */}
        {isCardComingSoon ? (
          <div className="mt-1 inline-flex items-center gap-1 self-start bg-amber-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
            <Clock className="w-2.5 h-2.5 text-black shrink-0" />
            <span>COMING SOON</span>
          </div>
        ) : (
          <div className="mt-1 inline-flex items-center gap-1.5 self-start bg-[#141414] border border-zinc-800/90 px-2 py-0.5 rounded-full text-[11px] font-mono">
            <span className="font-bold text-white">#{formatChapterNum(latestChapterNum)}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400 font-sans flex items-center gap-0.5 text-[10px]">
              <Eye className="w-2.5 h-2.5 text-zinc-500 inline" />
              {formatViews(manga.views || 0)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const isFeaturedComingSoon = isMangaComingSoon(featuredManga);
  const featuredLatestChapter =
    featuredManga?.chapters?.[featuredManga.chapters.length - 1]?.number ||
    featuredManga?.chapters?.length ||
    0;

  return (
    <div
      id="manga-plus-updates-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full min-h-screen bg-[#0A0A0A] text-white pb-28 pt-2 select-none"
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-6 space-y-4">
        {/* PULL-TO-REFRESH INDICATOR */}
        <div
          style={{ height: `${pullDistance}px` }}
          className="overflow-hidden flex items-center justify-center transition-all duration-150 ease-out"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 bg-zinc-900/90 px-4 py-1.5 rounded-full border border-zinc-800 shadow-md">
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing updates...' : 'Pull to refresh'}</span>
          </div>
        </div>

        {/* 0. ORIGINALS / BACKDROP / ALL FILTER HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {seriesTypeFilter === 'backdrop' ? (
              <Layers className="w-4 h-4 text-slate-300" />
            ) : (
              <Crown className="w-4 h-4 text-amber-400" />
            )}
            <h1 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
              {seriesTypeFilter === 'original'
                ? 'Originals'
                : seriesTypeFilter === 'backdrop'
                ? 'Backdrop'
                : 'All Series'}
            </h1>
          </div>

          <div
            id="home-series-type-toggle"
            className="inline-flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1"
            role="tablist"
            aria-label="Filter series by type"
          >
            {(
              [
                { id: 'original', label: 'Original' },
                { id: 'backdrop', label: 'Backdrop' },
                { id: 'all', label: 'All' },
              ] as const
            ).map((opt) => {
              const active = seriesTypeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`home-filter-${opt.id}-btn`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSeriesTypeFilter(opt.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    active
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 0.5 NON-DESTRUCTIVE ERROR RETRY BANNER */}
        {loadError && (
          <button
            id="home-retry-load-banner"
            type="button"
            onClick={() => onRetryLoad?.()}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-950/35 px-4 py-2.5 text-left text-xs font-semibold text-amber-200 hover:bg-amber-950/55 transition"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Couldn't load. Tap to retry.</span>
            </span>
            <RefreshCw className={`w-3.5 h-3.5 text-amber-300 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* 1. DATE / WEEK STRIP (7 Days: WED..TUE) */}
        <div className="space-y-1.5">
          <div
            ref={weekStripScrollRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {weekDays.map((day) => {
              const isSelected = selectedDay?.isoDate === day.isoDate;
              return (
                <button
                  key={`day-tab-${day.dayName}-${day.isoDate}`}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => setSelectedIsoDate(day.isoDate)}
                  className={`relative shrink-0 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[84px] py-2.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-white text-black font-black shadow-lg shadow-white/10 scale-[1.03]'
                      : 'bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white border border-zinc-800/80 font-semibold'
                  }`}
                >
                  {/* Small red "UP" badge ONLY on days where a real chapter released */}
                  {day.hasUpdates && (
                    <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#E50914] text-white shadow-sm">
                      UP
                    </span>
                  )}

                  {/* Day Abbreviation: WED, THU, FRI, ... */}
                  <span
                    className={`text-[12px] sm:text-xs tracking-wider uppercase ${
                      isSelected ? 'font-black text-black' : 'font-bold text-zinc-300'
                    }`}
                  >
                    {day.dayName}
                  </span>

                  {/* Date: Nov 15 */}
                  <span
                    className={`text-[11px] sm:text-[11px] whitespace-nowrap mt-0.5 ${
                      isSelected ? 'font-bold text-zinc-800' : 'text-zinc-500 font-medium'
                    }`}
                  >
                    {day.formattedDate}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtitle note below week strip */}
          <div className="flex items-center justify-between px-1 text-xs text-zinc-500 font-medium">
            <span className="text-[11px] sm:text-xs">
              Updates are generally released at 17:00 PM.
            </span>
            <button
              type="button"
              onClick={triggerRefresh}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition"
              title="Refresh updates"
            >
              <RefreshCw className={`w-3 h-3 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. FEATURED BANNER (Respects permanent type filter) */}
        {featuredManga && (
          <div
            id="manga-plus-featured-banner"
            onClick={() => onSelectDetailManga(featuredManga)}
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] rounded-2xl overflow-hidden cursor-pointer border-2 border-pink-500 shadow-[0_0_22px_rgba(236,72,153,0.35)] hover:shadow-[0_0_32px_rgba(236,72,153,0.55)] transition-all duration-300 group bg-zinc-900"
          >
            <MangaCoverImage
              src={
                featuredManga.bannerImage ||
                featuredManga.coverImage ||
                featuredManga.cover ||
                featuredManga.coverUrl ||
                ''
              }
              alt={featuredManga.title}
              title={featuredManga.title}
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradient scrim overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex flex-col justify-end p-4 sm:p-6">
              <div className="flex items-end justify-between gap-3">
                {/* Title bottom-left in white bold */}
                <div className="min-w-0 max-w-[70%]">
                  <div className="flex items-center gap-1.5 mb-1">
                    {getMangaType(featuredManga) === 'original' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                        <Crown className="w-2.5 h-2.5 fill-black" />
                        <span>ORIGINAL</span>
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800/95 text-slate-200 border border-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        BACKDROP
                      </span>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/40 text-[10px] font-bold uppercase tracking-wider">
                      Featured
                    </span>
                  </div>
                  <h2 className="text-base sm:text-2xl md:text-3xl font-black text-white truncate drop-shadow-md">
                    {featuredManga.title}
                  </h2>
                </div>

                {/* Coming Soon pill only OR Live Chapter + Real Views */}
                {isFeaturedComingSoon ? (
                  <div className="shrink-0 inline-flex items-center gap-1.5 bg-amber-500 text-black px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xl">
                    <Clock className="w-3.5 h-3.5 text-black" />
                    <span>COMING SOON</span>
                  </div>
                ) : (
                  <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 bg-black/85 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-xs font-mono shadow-xl">
                    <span className="font-bold text-white">#{formatChapterNum(featuredLatestChapter)}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300 font-sans flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-zinc-400 inline" />
                      {formatViews(featuredManga.views || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. SELECTED DAY CHAPTER UPDATES NOTICE + CATALOG SECTIONS */}
        <div className="space-y-5 pt-1">
          {!dayHasRealUpdates && (
            <div
              id="day-no-updates-card"
              className="rounded-2xl border border-zinc-800/80 bg-[#111111] px-4 py-3.5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    No updates on this day
                  </h3>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {selectedDay?.dayName} {selectedDay?.formattedDate} has no new chapter drops yet.
                  </p>
                </div>
              </div>

              {comingThisWeekItems.length > 0 && (
                <div id="coming-this-week-box" className="pt-2.5 border-t border-zinc-800/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Coming this week
                    </span>
                    <span className="text-[10px] text-zinc-500">12:00 AM SAST</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {comingThisWeekItems.map((item) => {
                      const matched = approvedCatalog.find((m) => m.id === item.mangaId);
                      return (
                        <button
                          key={`upcoming-${item.mangaId}`}
                          type="button"
                          onClick={() => matched && onSelectDetailManga(matched)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-amber-500/40 px-3 py-2 text-left transition"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-zinc-400">
                              {item.chapterNumber ? `Ch. ${item.chapterNumber} scheduled` : 'Weekly release'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black text-amber-300">
                            {item.releaseDay}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Original Section (Shown on 'original' and FIRST on 'all') */}
          {(seriesTypeFilter === 'original' || seriesTypeFilter === 'all') && (
            <section id="home-originals-catalog-section" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Originals
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {originalCatalog.length} {originalCatalog.length === 1 ? 'Series' : 'Series'}
                </span>
              </div>

              {originalCatalog.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-[#111111] p-6 text-center text-xs text-zinc-400">
                  No Original series available yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {(dayUpdatedOriginal.length > 0 ? dayUpdatedOriginal : originalCatalog).map((manga) =>
                    renderMangaGridCard(manga, 'orig-card')
                  )}
                </div>
              )}
            </section>
          )}

          {/* Backdrop Section (Shown on 'backdrop' and SECOND on 'all') */}
          {(seriesTypeFilter === 'backdrop' || seriesTypeFilter === 'all') && (
            <section id="home-backdrop-catalog-section" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-300" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                    Backdrop
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {backdropCatalog.length} Series
                </span>
              </div>

              {backdropCatalog.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-[#111111] p-6 text-center text-xs text-zinc-400">
                  No Backdrop series available yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {(dayUpdatedBackdrop.length > 0 ? dayUpdatedBackdrop : backdropCatalog).map((manga) =>
                    renderMangaGridCard(manga, 'backdrop-card')
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
});

