import React, { useMemo } from 'react';
import { Manga } from '../../types';
import { X } from 'lucide-react';

export interface GenreDefinition {
  id: string;
  label: string;
  tagline: string;
  isSignature?: boolean;
}

export const SIGNATURE_AFRO_GENRES: GenreDefinition[] = [
  {
    id: 'Afro-Fantasy',
    label: 'Afro-Fantasy',
    tagline: 'Zulu myths + Shonen battles',
    isSignature: true,
  },
  {
    id: 'Kasi-Punk',
    label: 'Kasi-Punk',
    tagline: 'Township streets + cyber gods',
    isSignature: true,
  },
  {
    id: 'Ancestral Horror',
    label: 'Ancestral Horror',
    tagline: 'Folklore that was never fiction',
    isSignature: true,
  },
  {
    id: 'Afro-Romance',
    label: 'Afro-Romance',
    tagline: 'Love stories with lobola, not just cherry blossoms',
    isSignature: true,
  },
];

export const CORE_READER_GENRES: GenreDefinition[] = [
  {
    id: 'Action',
    label: 'Action',
    tagline: 'Kinetic panel flows, martial clashes & high stakes',
  },
  {
    id: 'Romance',
    label: 'Romance',
    tagline: 'Heartfelt connections, devotion & emotional drama',
  },
  {
    id: 'Fantasy',
    label: 'Fantasy',
    tagline: 'Mythic realms, sacred relics & supernatural power',
  },
  {
    id: 'Comedy',
    label: 'Comedy',
    tagline: 'Sharp wit, expressive slapstick & lighthearted chaos',
  },
  ...SIGNATURE_AFRO_GENRES,
  {
    id: 'Shonen',
    label: 'Shonen',
    tagline: 'High-energy rivalries, grit & relentless growth',
  },
  {
    id: 'Seinen',
    label: 'Seinen',
    tagline: 'Psychological depth, mature stakes & complex worlds',
  },
  {
    id: 'Slice of Life',
    label: 'Slice of Life',
    tagline: 'Everyday rhythms, youth culture & quiet moments',
  },
  {
    id: 'Sci-Fi',
    label: 'Sci-Fi',
    tagline: 'Futuristic tech, cybernetics & speculative horizons',
  },
];

export function getGenreDefinition(filterId: string): GenreDefinition | undefined {
  const normalized = filterId.trim().toLowerCase();
  return CORE_READER_GENRES.find((g) => g.id.toLowerCase() === normalized);
}

export interface GenreFilterBarProps {
  mangaList: Manga[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  favoriteCount: number;
  filteredCount: number;
  compact?: boolean;
}

const GenreFilterBarComponent: React.FC<GenreFilterBarProps> = ({
  mangaList,
  selectedFilter,
  onSelectFilter,
  favoriteCount,
  filteredCount,
  compact = false,
}) => {
  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let visibleTotal = 0;

    for (let i = 0; i < mangaList.length; i++) {
      const m = mangaList[i];
      if (!m || m.id === 'placeholder' || m.approvalStatus === 'draft' || m.isBanned) {
        continue;
      }
      visibleTotal++;
      const seenOnCard = new Set<string>();
      for (let j = 0; j < m.genres.length; j++) {
        const key = m.genres[j].trim().toLowerCase();
        if (!key || seenOnCard.has(key)) continue;
        seenOnCard.add(key);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    counts.set('all', visibleTotal);
    return counts;
  }, [mangaList]);

  const activeGenreDef = useMemo(
    () => getGenreDefinition(selectedFilter),
    [selectedFilter]
  );

  const handleToggleFilter = (id: string) => {
    if (id !== 'all' && selectedFilter.toLowerCase() === id.toLowerCase()) {
      onSelectFilter('all');
    } else {
      onSelectFilter(id);
    }
  };

  return (
    <div
      id={compact ? 'reader-genre-filter-mobile' : 'reader-genre-filter-desktop'}
      className="space-y-3"
      role="region"
      aria-label="Filter manga by genre"
    >
      {/* Quick Genre & Category Filter Bar (Directly Below Search Bar) */}
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex items-center gap-1.5 ${
            compact
              ? 'overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5'
              : 'flex-wrap'
          }`}
        >
          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            aria-pressed={selectedFilter === 'all'}
            className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            All Series
          </button>

          {['Action', 'Romance', 'Fantasy', 'Comedy'].map((coreId) => {
            const isSelected = selectedFilter.toLowerCase() === coreId.toLowerCase();
            const count = genreCounts.get(coreId.toLowerCase()) ?? 0;
            return (
              <button
                key={`quick-genre-${coreId}`}
                type="button"
                onClick={() => handleToggleFilter(coreId)}
                aria-pressed={isSelected}
                className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{coreId}</span>
                {count > 0 && (
                  <span
                    className={`font-mono tabular-nums text-[10px] ${
                      isSelected ? 'text-black/75 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {['Shonen', 'Seinen', 'Slice of Life', 'Sci-Fi'].map((extraId) => {
            const isSelected = selectedFilter.toLowerCase() === extraId.toLowerCase();
            return (
              <button
                key={`extra-genre-${extraId}`}
                type="button"
                onClick={() => handleToggleFilter(extraId)}
                aria-pressed={isSelected}
                className={`min-h-[38px] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'bg-slate-950 border border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {extraId}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleToggleFilter('favorites')}
            aria-pressed={selectedFilter === 'favorites'}
            className={`min-h-[38px] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 tabular-nums ${
              selectedFilter === 'favorites'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'bg-slate-950 border border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            Favorites ({favoriteCount})
          </button>

          <button
            type="button"
            onClick={() => handleToggleFilter('moty_awards')}
            aria-pressed={selectedFilter === 'moty_awards'}
            className={`min-h-[38px] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${
              selectedFilter === 'moty_awards'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'bg-slate-950 border border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            MOTY Awards
          </button>
        </div>

        {!compact && (
          <div className="shrink-0 text-xs text-slate-400 tabular-nums">
            <strong className="text-white font-semibold">{filteredCount}</strong>{' '}
            {filteredCount === 1 ? 'title' : 'titles'}
          </div>
        )}
      </div>

      {/* Signature AZ Genres Strip: Afro-Fantasy, Kasi-Punk, Ancestral Horror, Afro-Romance */}
      <div
        className={
          compact
            ? 'grid grid-cols-2 gap-2'
            : 'grid grid-cols-2 lg:grid-cols-4 gap-2.5'
        }
      >
        {SIGNATURE_AFRO_GENRES.map((genre) => {
          const isSelected = selectedFilter.toLowerCase() === genre.id.toLowerCase();
          const count = genreCounts.get(genre.id.toLowerCase()) ?? 0;

          return (
            <button
              key={`sig-genre-${genre.id}`}
              type="button"
              onClick={() => handleToggleFilter(genre.id)}
              aria-pressed={isSelected}
              className={`group text-left rounded-xl p-3 border transition cursor-pointer flex flex-col justify-between gap-1 ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/15 shadow-sm'
                  : 'border-slate-800/90 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-bold tracking-wide transition-colors ${
                    isSelected
                      ? 'text-amber-300'
                      : 'text-white group-hover:text-amber-300'
                  }`}
                >
                  {genre.label}
                </span>
                <span
                  className={`font-mono tabular-nums text-[10px] ${
                    isSelected ? 'text-amber-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </div>
              <p
                className={`text-[11px] leading-snug line-clamp-2 ${
                  isSelected ? 'text-slate-200' : 'text-slate-400'
                }`}
              >
                {genre.tagline}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Genre Context Strip */}
      {selectedFilter !== 'all' && (
        <div className="flex items-center justify-between gap-3 pt-1 border-b border-slate-800/80 pb-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-slate-400">Filtered by</span>
            <span className="font-bold text-amber-400">
              {activeGenreDef ? activeGenreDef.label : selectedFilter}
            </span>
            {activeGenreDef?.tagline && (
              <>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-300 truncate">{activeGenreDef.tagline}</span>
              </>
            )}
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-400 tabular-nums">
              {filteredCount} {filteredCount === 1 ? 'result' : 'results'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-amber-400 transition shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const GenreFilterBar = React.memo(GenreFilterBarComponent);
export default GenreFilterBar;
