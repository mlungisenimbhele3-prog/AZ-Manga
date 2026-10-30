import React, { useCallback } from 'react';
import { Manga, isMangaComingSoon } from '../../types';
import { MangaCoverImage } from '../common/MangaCoverImage';
import {
  prewarmReaderChunk,
  getNetworkDiagnostics,
  preloadMangaImages,
} from '../../utils/devicePerformance';
import {
  Eye,
  BookOpen,
  Sparkles,
  Trophy,
  Heart,
  Bot,
  ShieldAlert,
  Lock,
  Cpu,
  Zap,
  Crown,
  Clock,
} from 'lucide-react';
import { RatingAverageDisplay } from '../common/StarRating';

interface MangaCardProps {
  manga: Manga;
  onSelect: (manga: Manga) => void;
  isFavorite?: boolean;
  isActive?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, mangaId: string) => void;
  onOpenAiReport?: (e: React.MouseEvent, manga: Manga) => void;
}

/**
 * Determines whether a manga was published within the last 7 days.
 */
export const isMangaRecentlyPublished = (manga: Manga): boolean => {
  if (manga.isNew === true) return true;

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const candidateDates = [
    manga.publishedAt,
    manga.submittedAt,
    manga.createdAt,
    (manga as any).publishedDate,
    (manga as any).date,
    manga.chapters?.[0]?.releaseDate,
    manga.chapters?.[manga.chapters.length - 1]?.releaseDate,
  ];

  for (const dateVal of candidateDates) {
    if (!dateVal) continue;
    const timestamp = typeof dateVal === 'number' ? dateVal : Date.parse(String(dateVal));
    if (!Number.isNaN(timestamp)) {
      const diff = now - timestamp;
      if (diff >= -86400000 && diff <= SEVEN_DAYS_MS) {
        return true;
      }
    }
  }

  return false;
};

const GENRE_BADGE_CLASSES: Record<string, string> = {
  Action: 'bg-red-500',
  Fantasy: 'bg-violet-500',
  'Afro-Fantasy': 'bg-amber-600',
  'Kasi-Punk': 'bg-cyan-600',
  'Ancestral Horror': 'bg-rose-800',
  'Afro-Romance': 'bg-pink-600',
  'Sci-Fi': 'bg-cyan-500',
  'Slice of Life': 'bg-emerald-500',
  Romance: 'bg-pink-500',
  Comedy: 'bg-amber-500 text-black',
  Horror: 'bg-gray-700',
  Adventure: 'bg-amber-500',
};

const getGenreBadgeClass = (genre: string): string =>
  GENRE_BADGE_CLASSES[genre] || 'bg-slate-600';

const MangaCardComponent: React.FC<MangaCardProps> = ({
  manga,
  onSelect,
  isFavorite = false,
  isActive = false,
  onToggleFavorite,
  onOpenAiReport,
}) => {
  const hasPremiumChapters = manga.chapters.some((c) => c.accessType === 'premium');
  const hasEarlyAccess = manga.chapters.some((c) => c.isEarlyAccess);
  const hasBonusContent = Boolean(manga.bonusContent && manga.bonusContent.length > 0);
  const isBanned = Boolean(manga.isBanned);
  const isComingSoon = isMangaComingSoon(manga);
  const instanceId = React.useId();
  const isAi = Boolean(manga.isAiGenerated);
  const aiScore = manga.aiConfidenceScore || (isBanned ? 94 : isAi ? 88 : 0);
  const isNew = React.useMemo(() => isMangaRecentlyPublished(manga), [manga]);

  const handleCardIntent = useCallback(() => {
    prewarmReaderChunk();
    const firstPage = manga.chapters?.[0]?.pages?.[0]?.imageUrl;
    if (firstPage && !getNetworkDiagnostics().isSlowConnection) {
      preloadMangaImages([firstPage], 1);
    }
  }, [manga.chapters]);

  const handleCardClick = () => {
    if (isBanned && onOpenAiReport) {
      onOpenAiReport({} as any, manga);
      return;
    }
    onSelect(manga);
  };

  return (
    <div
      id={`manga-card-${manga.id}`}
      onClick={handleCardClick}
      onPointerEnter={handleCardIntent}
      onFocus={handleCardIntent}
      className={`group relative flex h-full flex-col overflow-visible rounded-2xl border transition-[transform,border-color] duration-150 ease-out hover:scale-[1.015] active:scale-[0.985] cursor-pointer manga-grid-item ${
        isBanned
          ? 'border-rose-900/80 bg-slate-950/95 hover:border-rose-500'
          : isAi
          ? 'border-cyan-800/80 bg-slate-900/90 hover:border-cyan-400'
          : 'border-slate-800 bg-slate-900/80 hover:border-slate-500'
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-slate-950">
        <MangaCoverImage
          coverUrl={(manga as any).coverUrl || (manga as any).cover || manga.coverImage}
          src={(manga as any).coverUrl || (manga as any).cover || manga.coverImage}
          alt={manga.title}
          title={manga.title}
          className={`h-48 w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105 ${
            isBanned ? 'filter grayscale contrast-125 brightness-50' : ''
          }`}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Banned Overlay if title is quarantined */}
        {isBanned && (
          <div className="absolute inset-0 bg-rose-950/75 flex flex-col items-center justify-center p-3 text-center z-20">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg mb-2 ring-2 ring-rose-400/60">
              <Lock className="w-5 h-5" />
            </div>
            <span className="rounded-full bg-rose-500 text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              AUTO-BANNED
            </span>
            <p className="text-[11px] font-bold text-rose-200 mt-1 line-clamp-2 tabular-nums">
              AI Content Detected ({aiScore}%)
            </p>
            <p className="text-[9px] text-rose-300/80 mt-0.5">
              Click to view AZ OVERVERSE moderation report
            </p>
          </div>
        )}

        {/* Top Badges & Favorite Heart Button */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10 overflow-visible">
          <div className="flex items-center gap-1.5 pointer-events-none flex-wrap">
            {manga.isOriginal ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-sm">
                <Crown className="w-2.5 h-2.5 fill-black stroke-black" />
                <span>ORIGINAL</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 border border-slate-600 text-slate-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                <span>BACKDROP</span>
              </span>
            )}

            {isComingSoon && (
              <span
                id={`manga-coming-soon-badge-${manga.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-black font-black text-[9px] px-2 py-0.5 uppercase tracking-wider"
                title="Coming Soon · No panels inside yet"
              >
                <Clock className="w-2.5 h-2.5 text-black" />
                <span>COMING SOON</span>
              </span>
            )}

            {isNew && !isComingSoon && (
              <span
                id={`manga-new-badge-${manga.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] px-2 py-0.5 uppercase tracking-wider"
                title="New Release · Published within the last 7 days"
              >
                <Sparkles className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                <span>NEW</span>
              </span>
            )}

            {manga.weeklyRank && (
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-[10px] font-black text-black tabular-nums">
                #{manga.weeklyRank}
              </span>
            )}

            {isComingSoon ? (
              <span className="rounded-md bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 text-[9px] font-black text-amber-300 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>Panels Soon</span>
              </span>
            ) : manga.award ? (
              <span className="flex items-center gap-1 rounded-md bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                <Trophy className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span>MOTY &apos;26</span>
              </span>
            ) : hasEarlyAccess ? (
              <span className="flex items-center gap-1 rounded-md bg-cyan-950/90 border border-cyan-400/60 px-1.5 py-0.5 text-[9px] font-black text-cyan-300">
                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                <span>Early Access</span>
              </span>
            ) : hasPremiumChapters ? (
              <span className="flex items-center gap-1 rounded-md bg-purple-950/90 border border-purple-500/40 px-1.5 py-0.5 text-[9px] font-bold text-purple-200">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>VIP Pass</span>
              </span>
            ) : (
              <span className="rounded-md bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                Free
              </span>
            )}
            {hasBonusContent && (
              <span className="hidden sm:flex items-center gap-1 rounded-md bg-rose-950/85 border border-rose-500/50 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">
                <Crown className="w-2.5 h-2.5 text-amber-400" />
                <span>Bonus Art</span>
              </span>
            )}
          </div>

          {/* Heart Icon Toggle Button */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {isActive && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500 text-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap z-10">
                ACTIVE
              </span>
            )}
            <button
              id={`manga-favorite-btn-${manga.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(e, manga.id);
              }}
              aria-label={
                isFavorite
                  ? `Remove ${manga.title} from favorites`
                  : `Add ${manga.title} to favorites`
              }
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150 active:scale-90 ${
                isFavorite
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                  : 'bg-black/70 text-white/80 hover:text-rose-400 hover:bg-black/90'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorite ? 'fill-white stroke-white' : 'stroke-current'
                }`}
              />
            </button>
          </div>
        </div>

        {/* AI Transparency Label */}
        {isBanned ? (
          <div
            id={`ai-sticker-banned-${manga.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiReport?.(e, manga);
            }}
            className="absolute top-10 right-2 z-30 pointer-events-auto cursor-pointer transform rotate-3 hover:rotate-0 transition-transform"
            title="Auto-detected AI content. Click for moderation report."
          >
            <div className="flex items-center gap-1.5 rounded-lg border-2 border-red-500 bg-red-600/95 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 fill-white text-red-600" />
              <span>BANNED: AI</span>
            </div>
          </div>
        ) : isAi ? (
          <div
            id={`ai-sticker-${manga.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiReport?.(e, manga);
            }}
            className="absolute top-10 right-2 z-30 pointer-events-auto cursor-pointer transform -rotate-2 hover:rotate-0 transition-transform"
            title="Auto-detected AI generative manga. Click for transparency report."
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400 bg-slate-950/95 px-2.5 py-1 text-[10px] font-black text-cyan-300 uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI GENERATED</span>
              <span className="rounded bg-cyan-400/20 px-1 text-[9px] font-mono tabular-nums text-cyan-200">
                {aiScore}%
              </span>
            </div>
          </div>
        ) : null}

        {/* Bottom Cover Metrics */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-[11px] text-slate-300 z-10 tabular-nums">
          <RatingAverageDisplay
            rating={manga.rating || 0}
            ratingCount={manga.ratingCount || 0}
            size="sm"
            showCount
          />

          <div className="flex items-center gap-1 text-slate-200 bg-black/70 px-2 py-0.5 rounded-full font-mono text-[10px]">
            <Eye className="w-3 h-3" />
            <span>
              {manga.views >= 1000
                ? `${(manga.views / 1000).toFixed(1)}k`
                : (manga.views || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {manga.title}
          </h4>
        </div>

        {manga.japaneseTitle && (
          <span className="text-[11px] text-slate-400 font-medium truncate mb-1">
            {manga.japaneseTitle}
          </span>
        )}

        {isBanned ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiReport?.(e, manga);
            }}
            className="mb-2 mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-rose-300 bg-rose-950/60 border border-rose-500/50 rounded-md px-2 py-0.5 w-fit max-w-full truncate hover:bg-rose-900/50 transition cursor-pointer"
          >
            <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate tabular-nums">Auto-Banned: AI Art Violation ({aiScore}%)</span>
          </div>
        ) : isAi ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenAiReport?.(e, manga);
            }}
            className="mb-2 mt-0.5 flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 rounded-md px-2 py-0.5 w-fit max-w-full truncate hover:bg-cyan-900/40 transition cursor-pointer"
          >
            <Bot className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate tabular-nums">AI Generative Content ({aiScore}%)</span>
          </div>
        ) : manga.award ? (
          <div className="mb-2 mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-300 truncate">
            <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{manga.award.badge}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {manga.genres.map((genre, idx) => (
            <span
              key={`${instanceId}-genre-${genre}-${idx}`}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${getGenreBadgeClass(
                genre
              )}`}
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-1.5 mt-auto pt-3 text-[11px] text-slate-400 border-t border-slate-800/80 tabular-nums">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>{isComingSoon ? 'No Panels · Soon' : `${manga.chapters.length} Chapters`}</span>
          </div>

          {isComingSoon ? (
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Coming Soon</span>
            </span>
          ) : isBanned ? (
            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Quarantined</span>
            </span>
          ) : isAi ? (
            <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>AI Labeled</span>
            </span>
          ) : isNew ? (
            <span className="text-[10px] font-bold text-emerald-400">New Release</span>
          ) : (
            <span className="text-[10px] font-semibold text-emerald-400">Artisan</span>
          )}
        </div>
      </div>
    </div>
  );
};

function areMangaCardPropsEqual(prev: MangaCardProps, next: MangaCardProps): boolean {
  return (
    prev.manga === next.manga &&
    prev.manga.rating === next.manga.rating &&
    prev.manga.ratingCount === next.manga.ratingCount &&
    prev.isFavorite === next.isFavorite &&
    prev.isActive === next.isActive &&
    prev.onSelect === next.onSelect &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.onOpenAiReport === next.onOpenAiReport
  );
}

export const MangaCard = React.memo(MangaCardComponent, areMangaCardPropsEqual);
