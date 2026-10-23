import React, { useRef } from 'react';
import { Manga } from '../../types';
import {
  Flame,
  Shield,
  Heart,
  Coffee,
  Swords,
  Sparkles,
  Bot,
  Globe,
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Check,
} from 'lucide-react';

export interface GenreItem {
  id: string;
  title: string;
  japanese: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
  activeRing: string;
  glowColor: string;
}

export const GENRE_CATEGORIES: GenreItem[] = [
  {
    id: 'all',
    title: 'All Genres',
    japanese: '全作品',
    tagline: 'Full original manga magazine catalog',
    icon: Compass,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    bgGradient: 'from-amber-950/20 via-slate-900/60 to-slate-950',
    activeRing: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10',
    glowColor: 'shadow-amber-500/10',
  },
  {
    id: 'Shonen',
    title: 'Shonen',
    japanese: '少年漫画',
    tagline: 'High energy, martial clashes & brotherhood',
    icon: Flame,
    accentColor: 'text-orange-400',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    bgGradient: 'from-orange-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/10',
    glowColor: 'shadow-orange-500/15',
  },
  {
    id: 'Seinen',
    title: 'Seinen',
    japanese: '青年漫画',
    tagline: 'Psychological depth, grit & complex drama',
    icon: Shield,
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30 hover:border-indigo-400',
    bgGradient: 'from-indigo-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/10',
    glowColor: 'shadow-indigo-500/15',
  },
  {
    id: 'Romance',
    title: 'Romance',
    japanese: '恋愛漫画',
    tagline: 'Heartfelt connections, passion & bittersweet bonds',
    icon: Heart,
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/30 hover:border-rose-400',
    bgGradient: 'from-rose-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10',
    glowColor: 'shadow-rose-500/15',
  },
  {
    id: 'Slice of Life',
    title: 'Slice of Life',
    japanese: '日常系',
    tagline: 'Heartwarming daily life, youth vibes & culture',
    icon: Coffee,
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    bgGradient: 'from-emerald-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10',
    glowColor: 'shadow-emerald-500/15',
  },
  {
    id: 'Action',
    title: 'Action',
    japanese: '格闘・活劇',
    tagline: 'Kinetic panel flows, superpowers & high stakes',
    icon: Swords,
    accentColor: 'text-red-400',
    borderColor: 'border-red-500/30 hover:border-red-400',
    bgGradient: 'from-red-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-red-500 ring-2 ring-red-500/30 bg-red-500/10',
    glowColor: 'shadow-red-500/15',
  },
  {
    id: 'Fantasy',
    title: 'Fantasy',
    japanese: '霊的幻想',
    tagline: 'Ancestral spirits, mysticism & sacred realms',
    icon: Sparkles,
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500/30 hover:border-purple-400',
    bgGradient: 'from-purple-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10',
    glowColor: 'shadow-purple-500/15',
  },
  {
    id: 'Sci-Fi',
    title: 'Sci-Fi',
    japanese: '空想科学',
    tagline: 'Afro-cyberpunk, neon townships & cybernetics',
    icon: Bot,
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    bgGradient: 'from-cyan-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-500/10',
    glowColor: 'shadow-cyan-500/15',
  },
  {
    id: 'Pan-African',
    title: 'Pan-African',
    japanese: 'アフリカ民族',
    tagline: 'Indigenous African folklore, heroism & mythology',
    icon: Globe,
    accentColor: 'text-amber-500',
    borderColor: 'border-amber-600/30 hover:border-amber-500',
    bgGradient: 'from-amber-950/30 via-slate-900/60 to-slate-950',
    activeRing: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10',
    glowColor: 'shadow-amber-500/15',
  },
];

export interface GenreExplorerProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  mangaList: Manga[];
  filteredCount?: number;
}

export const GenreExplorer: React.FC<GenreExplorerProps> = ({
  selectedFilter,
  onSelectFilter,
  mangaList,
  filteredCount,
}) => {
  const compId = React.useId();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getGenreCount = (genreId: string): number => {
    if (genreId === 'all') {
      return mangaList.filter((m) => m.approvalStatus !== 'draft' && !m.isBanned).length;
    }
    return mangaList.filter((m) => {
      if (m.approvalStatus === 'draft' || m.isBanned) return false;
      return m.genres.some((g) => g.trim().toLowerCase() === genreId.trim().toLowerCase());
    }).length;
  };

  const activeGenre = GENRE_CATEGORIES.find(
    (g) => g.id.toLowerCase() === selectedFilter.toLowerCase()
  );

  return (
    <section
      id="genre-explorer-section"
      className="relative rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-md p-4 sm:p-5 shadow-xl transition-all"
    >
      {/* Header Row: Title, Subtitle, and Scroll Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-['Bebas_Neue',sans-serif] text-xl sm:text-2xl tracking-wider text-white flex items-center gap-2">
              GENRE EXPLORER
              <span className="font-sans text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Demographics & Tropes
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Filter the home catalog by authentic manga demographics, themes, and storytelling styles.
          </p>
        </div>

        {/* Right side controls: Active indicator & Carousel Arrows */}
        <div className="flex items-center gap-2">
          {selectedFilter !== 'all' && (
            <button
              onClick={() => onSelectFilter('all')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-xs font-semibold transition"
              title="Reset to all series"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Filter</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleScroll('left')}
              className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-400 flex items-center justify-center transition active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-400 flex items-center justify-center transition active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Notification Banner */}
      {selectedFilter !== 'all' && activeGenre && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-900/90 border border-amber-500/30 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Current Category:</span>
            <span className={`font-black flex items-center gap-1.5 ${activeGenre.accentColor}`}>
              <activeGenre.icon className="w-3.5 h-3.5" />
              {activeGenre.title} ({activeGenre.japanese})
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-medium">
              Showing <strong className="text-white">{filteredCount ?? getGenreCount(activeGenre.id)}</strong> matching manga
            </span>
          </div>
          <button
            onClick={() => onSelectFilter('all')}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 transition"
          >
            Show All
          </button>
        </div>
      )}

      {/* Genre Cards Scrollable Track */}
      <div
        ref={scrollContainerRef}
        className="mt-3.5 flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x"
        style={{ scrollbarWidth: 'thin' }}
      >
        {GENRE_CATEGORIES.map((genre, idx) => {
          const isSelected = selectedFilter.toLowerCase() === genre.id.toLowerCase();
          const count = getGenreCount(genre.id);
          const Icon = genre.icon;

          return (
            <button
              key={`${compId}-genre-${genre.id}-${idx}`}
              onClick={() => {
                if (isSelected && genre.id !== 'all') {
                  onSelectFilter('all');
                } else {
                  onSelectFilter(genre.id);
                }
              }}
              className={`group relative flex flex-col justify-between text-left shrink-0 w-44 sm:w-48 rounded-xl p-3.5 border transition-all duration-200 snap-start shadow-md cursor-pointer select-none overflow-visible bg-gradient-to-br ${
                genre.bgGradient
              } ${
                isSelected
                  ? `${genre.activeRing} shadow-lg ${genre.glowColor} -translate-y-0.5`
                  : `${genre.borderColor} bg-slate-900/40 hover:-translate-y-1 hover:shadow-lg hover:border-slate-700`
              }`}
            >
              {/* Active Selection Badge Indicator: fully visible inside card top-2 right-2 */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-amber-500 text-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>ACTIVE</span>
                </div>
              )}

              {/* Top Row: Icon + Japanese Sub-label */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 group-hover:scale-105 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isSelected && (
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                      {genre.japanese}
                    </span>
                  )}
                </div>

                {/* Genre Name */}
                <h3 className="font-['Bebas_Neue',sans-serif] text-lg tracking-wide text-white group-hover:text-amber-300 transition-colors leading-tight">
                  {genre.title}
                </h3>

                {/* Genre Description / Tagline */}
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-snug font-normal">
                  {genre.tagline}
                </p>
              </div>

              {/* Bottom Row: Manga Count Indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  <strong className={isSelected ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                    {count}
                  </strong>{' '}
                  {count === 1 ? 'Title' : 'Titles'}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase transition ${
                    isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {isSelected ? 'Filtered' : 'Explore →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
