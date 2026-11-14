import React, { useState } from 'react';
import { Manga, isMangaComingSoon, getMangaType } from '../types';
import { MangaCoverImage } from '../components/common/MangaCoverImage';
import { RatingAverageDisplay } from '../components/common/StarRating';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
  BookOpen,
  Plus,
  AlertCircle,
  Search,
} from 'lucide-react';

export interface BackdropPageProps {
  mangaList: Manga[];
  onSelectManga: (manga: Manga) => void;
  onStartReading?: (manga: Manga, chapterId?: string) => void;
  onOpenPublishModal: () => void;
  onNavigateToHome: () => void;
  currentUserEmail?: string;
}

export const BackdropPage: React.FC<BackdropPageProps> = ({
  mangaList,
  onSelectManga,
  onOpenPublishModal,
  onNavigateToHome,
}) => {
  const [filterType, setFilterType] = useState<'trending' | 'new' | 'top_earners'>('trending');
  const [searchQuery, setSearchQuery] = useState('');

  // All Backdrop series (type === 'backdrop')
  const backdropSeries = mangaList.filter((m) => getMangaType(m) === 'backdrop');

  // Filter & Sort
  const processedSeries = backdropSeries
    .filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (filterType === 'trending') {
        return (b.views || 0) * ((b.rating || 0) + 1) - (a.views || 0) * ((a.rating || 0) + 1);
      }
      if (filterType === 'new') {
        const aDate = a.chapters?.[0]?.releaseDate || '2026-09-01';
        const bDate = b.chapters?.[0]?.releaseDate || '2026-09-01';
        return bDate.localeCompare(aDate);
      }
      if (filterType === 'top_earners') {
        return (b.views || 0) - (a.views || 0);
      }
      return 0;
    });

  return (
    <div id="backdrop-page-container" className="mx-auto w-full max-w-5xl pb-24 space-y-5">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3.5">
          <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-5xl tracking-wide text-white leading-none">
            AZ <span className="text-slate-400">BACKDROP</span> <span className="text-amber-400">OVERVERSE</span>
          </h1>

          <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300 leading-relaxed">
            <p className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Backdrop — Side stories, lore &amp; world-building. Not main canon. Not eligible for Awards / VIP payouts unless marked otherwise.
              </span>
            </p>
            <p className="flex items-start gap-2 text-slate-400">
              <Sparkles className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Ads may show on Backdrop stories. Backdrop stories earn exposure, not rev-share payouts.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onOpenPublishModal}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Publish on BACKDROP</span>
            </button>
            <button
              onClick={onNavigateToHome}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 text-xs font-bold transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Explore AZ Originals</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('trending')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'trending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending</span>
          </button>

          <button
            onClick={() => setFilterType('new')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'new'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          <button
            onClick={() => setFilterType('top_earners')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'top_earners'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Most Viewed</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Backdrop titles or creators..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Backdrop Series Grid — 3 columns across mobile & desktop, matching Originals grid */}
      {processedSeries.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Backdrop series found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Be the first creator to publish an indie serialization on AZ BACKDROP!
          </p>
          <button
            onClick={onOpenPublishModal}
            className="rounded-xl bg-amber-500 text-black px-4 py-2 text-xs font-bold"
          >
            Publish New Backdrop Manga
          </button>
        </div>
      ) : (
        <div
          id="backdrop-series-grid"
          className="grid grid-cols-3 gap-3 sm:gap-4"
        >
          {processedSeries.map((manga, idx) => {
            const isComingSoon = isMangaComingSoon(manga);

            return (
              <div
                key={`backdrop-series-${manga.id}-${idx}`}
                onClick={() => onSelectManga(manga)}
                className="group flex flex-col h-full cursor-pointer transition active:scale-[0.98]"
              >
                {/* 2:3 Portrait Cover matching Original cards */}
                <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-md shrink-0">
                  <MangaCoverImage
                    src={manga.cover || manga.coverImage || manga.coverUrl || ''}
                    alt={manga.title}
                    title={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Top-left badge: BACKDROP */}
                  <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10">
                    <span className="inline-flex items-center rounded-full bg-black/80 border border-slate-600 text-slate-200 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold uppercase tracking-wider shadow">
                      BACKDROP
                    </span>
                  </div>

                  {/* Top-right badge: COMING SOON if not published yet */}
                  {isComingSoon && (
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-black px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] font-black uppercase tracking-wider shadow">
                        <Clock className="w-2 h-2 text-black hidden sm:inline shrink-0" />
                        <span>COMING SOON</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Compact Info Below Cover — aligned equal card height */}
                <div className="flex-1 flex flex-col justify-between pt-1.5 min-w-0">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-white line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">
                      {manga.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      By {manga.author}
                    </p>
                  </div>

                  {/* Star rating ☆ 0.0 */}
                  <div className="mt-1 pt-0.5 flex items-center">
                    <RatingAverageDisplay
                      rating={manga.rating ?? 0}
                      ratingCount={manga.ratingCount ?? 0}
                      size="xs"
                      showCount={false}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official IP & Backdrop License Mandate */}
      <div className="pt-4 border-t border-slate-800 text-slate-400 text-xs text-center leading-relaxed">
        All AZ Originals are © AZ Oververse / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ Oververse has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
      </div>
    </div>
  );
};

