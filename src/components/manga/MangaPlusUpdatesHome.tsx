import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Manga, isMangaComingSoon, getMangaType } from '../../types';
import { Eye, RefreshCw, Calendar, Clock, Crown } from 'lucide-react';
import { formatViews } from '../../services/catalogApi';

export interface MangaPlusUpdatesHomeProps {
  mangaList: Manga[];
  onSelectDetailManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onOpenSubscriptionModal: () => void;
  isVipUser?: boolean;
}

interface DaySchedule {
  date: Date;
  dayIndex: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dayName: string; // 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
  formattedDate: string; // 'Nov 9'
  isToday: boolean;
  hasUpdates: boolean;
}

const formatChapterNum = (num?: number): string => {
  if (!num || isNaN(num)) return '001';
  return String(num).padStart(3, '0');
};

/**
 * Returns a deterministic update weekday (0 = Sun .. 6 = Sat) for a manga.
 * Extracts from latest chapter releaseDate, publishedAt, or deterministic hash.
 */
const getMangaUpdateWeekday = (manga: Manga): number => {
  const latestCh = manga.chapters?.[manga.chapters.length - 1];
  if (latestCh?.releaseDate) {
    const d = new Date(latestCh.releaseDate);
    if (!isNaN(d.getTime())) return d.getDay();
  }
  if (manga.publishedAt) {
    const d = new Date(manga.publishedAt);
    if (!isNaN(d.getTime())) return d.getDay();
  }
  if (manga.createdAt) {
    const d = new Date(manga.createdAt);
    if (!isNaN(d.getTime())) return d.getDay();
  }
  // Deterministic schedule based on manga ID/title
  let hash = 0;
  const str = manga.id || manga.title || 'manga';
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % 7;
};

export const MangaPlusUpdatesHome: React.FC<MangaPlusUpdatesHomeProps> = React.memo(({
  mangaList,
  onSelectDetailManga,
  onStartReading,
}) => {
  const todayDate = useMemo(() => new Date(), []);
  const todayDayIndex = todayDate.getDay();

  // Original vs Backdrop filter (defaults to 'original' on Home)
  const [seriesTypeFilter, setSeriesTypeFilter] = useState<'original' | 'backdrop' | 'all'>('original');

  // Selected day index (0 = Sun .. 6 = Sat). Default to today.
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayDayIndex);

  // Pull-to-refresh state
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const weekStripScrollRef = useRef<HTMLDivElement>(null);

  const visibleCatalog = useMemo(() => {
    return mangaList.filter((m) => {
      if (!m || m.id === 'placeholder' || m.isBanned) return false;
      if (m.approvalStatus && m.approvalStatus !== 'approved') return false;
      const t = getMangaType(m);
      if (seriesTypeFilter === 'original') return t === 'original';
      if (seriesTypeFilter === 'backdrop') return t === 'backdrop';
      return true;
    });
  }, [mangaList, seriesTypeFilter]);

  // Group manga by release weekday
  const mangaByDay = useMemo(() => {
    const map = new Map<number, Manga[]>();
    for (let i = 0; i < 7; i++) {
      map.set(i, []);
    }

    const validManga = visibleCatalog;

    validManga.forEach((m) => {
      const day = getMangaUpdateWeekday(m);
      const list = map.get(day) || [];
      list.push(m);
      map.set(day, list);
    });

    // Fallback: If any day has 0 manga, share high-ranked series so every single day has content
    for (let i = 0; i < 7; i++) {
      const list = map.get(i) || [];
      if (list.length === 0 && validManga.length > 0) {
        const sliceStart = (i * 3) % validManga.length;
        const fallbackItems = validManga.slice(sliceStart, sliceStart + 4);
        map.set(i, fallbackItems.length > 0 ? fallbackItems : validManga.slice(0, 3));
      }
    }

    return map;
  }, [visibleCatalog]);

  // Build the 7 days of the current week (Monday through Sunday)
  const weekDays: DaySchedule[] = useMemo(() => {
    const current = new Date(todayDate);
    const dayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon...
    // Distance to Monday (if Sun=0 -> -6, if Mon=1 -> 0, etc.)
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const days: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayIdx = d.getDay();
      const isToday = d.toDateString() === current.toDateString();
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const count = mangaByDay.get(dayIdx)?.length || 0;

      days.push({
        date: d,
        dayIndex: dayIdx,
        dayName: dayNames[dayIdx],
        formattedDate: `${monthStr} ${dayNum}`,
        isToday,
        hasUpdates: count > 0,
      });
    }

    return days;
  }, [todayDate, mangaByDay]);

  // Current day's manga list sorted by views & chapter count
  const dayMangaList = useMemo(() => {
    const list = [...(mangaByDay.get(selectedDayIndex) || [])];
    return list.sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [mangaByDay, selectedDayIndex]);

  // Top updated featured manga for the selected day (strictly respecting active type filter)
  const featuredManga = useMemo(() => {
    if (dayMangaList.length > 0) {
      return dayMangaList[0];
    }
    if (visibleCatalog.length > 0) {
      return [...visibleCatalog].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
    }
    return null;
  }, [dayMangaList, visibleCatalog]);

  // Remaining manga in the 3-column grid (excluding the top featured one, or showing all)
  const gridMangaList = useMemo(() => {
    if (dayMangaList.length <= 1) return dayMangaList;
    return dayMangaList.slice(1);
  }, [dayMangaList]);

  // Auto-scroll the week strip to center today / selected day on mount
  useEffect(() => {
    const container = weekStripScrollRef.current;
    if (!container) return;
    const selectedEl = container.querySelector('[data-selected="true"]') as HTMLElement | null;
    if (selectedEl) {
      const scrollLeft = selectedEl.offsetLeft - container.offsetWidth / 2 + selectedEl.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [selectedDayIndex]);

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
    setTimeout(() => {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }, 650);
  }, []);

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
            <Crown className="w-4 h-4 text-amber-400" />
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

        {/* 1. DATE / WEEK STRIP (7 Days: Mon-Sun) */}
        <div className="space-y-1.5">
          <div
            ref={weekStripScrollRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {weekDays.map((day) => {
              const isSelected = selectedDayIndex === day.dayIndex;
              return (
                <button
                  key={`day-tab-${day.dayName}-${day.dayIndex}`}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => setSelectedDayIndex(day.dayIndex)}
                  className={`relative shrink-0 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[84px] py-2.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-white text-black font-black shadow-lg shadow-white/10 scale-[1.03]'
                      : 'bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white border border-zinc-800/80 font-semibold'
                  }`}
                >
                  {/* Small red "UP" badge for days with new chapters */}
                  {day.hasUpdates && (
                    <span
                      className={`absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isSelected
                          ? 'bg-[#E50914] text-white shadow-sm'
                          : 'bg-[#E50914] text-white'
                      }`}
                    >
                      UP
                    </span>
                  )}

                  {/* Day Abbreviation: MON, TUE, etc. */}
                  <span
                    className={`text-[12px] sm:text-xs tracking-wider uppercase ${
                      isSelected ? 'font-black text-black' : 'font-bold text-zinc-300'
                    }`}
                  >
                    {day.dayName}
                  </span>

                  {/* Date: Nov 9 */}
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

        {/* 2. FEATURED BANNER */}
        {featuredManga && (
          <div
            id="manga-plus-featured-banner"
            onClick={() => onSelectDetailManga(featuredManga)}
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] rounded-2xl overflow-hidden cursor-pointer border-2 border-pink-500 shadow-[0_0_22px_rgba(236,72,153,0.35)] hover:shadow-[0_0_32px_rgba(236,72,153,0.55)] transition-all duration-300 group"
          >
            <img
              src={
                featuredManga.bannerImage ||
                featuredManga.coverImage ||
                featuredManga.cover ||
                featuredManga.coverUrl ||
                ''
              }
              alt={featuredManga.title}
              referrerPolicy="no-referrer"
              decoding="async"
              {...{ fetchpriority: 'high' }}
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

        {/* 3. GRID BELOW (3-column grid of manga covers) */}
        <div className="space-y-3 pt-2">
          {gridMangaList.length === 0 && !featuredManga ? (
            /* Empty State */
            <div className="py-16 text-center space-y-3 bg-[#111111] rounded-2xl border border-zinc-800/80 p-6">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No updates on this day</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Check other days of the week in the calendar above for newly released chapters!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {(gridMangaList.length > 0 ? gridMangaList : [featuredManga!]).map((manga) => {
                const isCardComingSoon = isMangaComingSoon(manga);
                const latestChapterNum =
                  manga.chapters?.[manga.chapters.length - 1]?.number || manga.chapters?.length || 0;
                return (
                  <div
                    key={`manga-plus-card-${manga.id}`}
                    onClick={() => onSelectDetailManga(manga)}
                    className="group flex flex-col cursor-pointer transition active:scale-[0.98]"
                  >
                    {/* Cover image 2:3 ratio, rounded 12px */}
                    <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-md">
                      <img
                        src={manga.coverImage || manga.cover || manga.coverUrl || ''}
                        alt={manga.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 left-1.5">
                        {getMangaType(manga) === 'original' ? (
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
                        <Clock className="w-2.5 h-2.5 text-black" />
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
