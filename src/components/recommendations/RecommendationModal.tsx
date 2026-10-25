import React, { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Manga } from '../../types';
import { MangaCoverImage } from '../common/MangaCoverImage';
import {
  UserTasteProfile,
  RecommendationAlgorithmMode,
  TASTE_PRESETS,
  getHydratedUserTasteProfile,
  toggleUserLikedGenre,
  setFavoriteGenres,
  extractUniqueGenres,
  recordReadingHistoryEvent,
  removeReadingHistoryEntry,
  clearReadingHistory,
  applyTastePreset,
  syncFavoritesWithTasteProfile,
  getRecommendedForYou,
  getTasteProfileInsights,
} from '../../services/userTasteProfile';
import {
  X,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Clock,
  Trash2,
  Check,
  Plus,
  BookOpen,
  Zap,
  Users,
  Compass,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  EyeOff,
  Eye,
} from 'lucide-react';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaList: Manga[];
  onSelectDetailManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onProfileUpdated?: (updated: UserTasteProfile) => void;
  userTasteProfile?: UserTasteProfile;
  favoriteIds?: string[];
  onToggleFavorite?: (mangaId: string) => void;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  mangaList,
  onSelectDetailManga,
  onStartReading,
  onProfileUpdated,
  userTasteProfile,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [profile, setProfile] = useState<UserTasteProfile>(() =>
    getHydratedUserTasteProfile(mangaList, favoriteIds)
  );
  const [recommendationMode, setRecommendationMode] =
    useState<RecommendationAlgorithmMode>('hybrid');
  const [excludeRead, setExcludeRead] = useState<boolean>(false);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'genres' | 'history' | 'presets' | 'engine'>(
    'genres'
  );
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Keep modal state synchronized whenever opened or when external taste profile / favorites change
  useEffect(() => {
    if (isOpen) {
      const hydrated = getHydratedUserTasteProfile(mangaList, favoriteIds);
      setProfile(hydrated);
    }
  }, [isOpen, userTasteProfile, favoriteIds, mangaList]);

  // Allow Escape key to close modal cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const catalogManga = useMemo(
    () =>
      mangaList.filter(
        (m) =>
          m &&
          m.id !== 'placeholder' &&
          !m.isBanned &&
          m.approvalStatus !== 'draft' &&
          m.approvalStatus !== 'rejected'
      ),
    [mangaList]
  );

  const allGenres = useMemo(() => {
    return extractUniqueGenres(catalogManga);
  }, [catalogManga]);

  const insights = useMemo(() => {
    return getTasteProfileInsights(profile, catalogManga);
  }, [profile, catalogManga]);

  const recommendedForYou = useMemo(() => {
    return getRecommendedForYou(catalogManga, profile, {
      mode: recommendationMode,
      excludeRead,
      limit: 6,
    });
  }, [catalogManga, profile, recommendationMode, excludeRead]);

  const unreadCandidatesExist = useMemo(() => {
    const readIds = new Set(profile.readingHistory.map((h) => h.mangaId));
    return catalogManga.some((m) => !readIds.has(m.id));
  }, [catalogManga, profile.readingHistory]);

  const unloggedCatalogManga = useMemo(() => {
    const readIds = new Set(profile.readingHistory.map((h) => h.mangaId));
    return catalogManga.filter((m) => !readIds.has(m.id));
  }, [catalogManga, profile.readingHistory]);

  const inferredGenresNotYetLiked = useMemo(() => {
    const likedSet = new Set(profile.likedGenres);
    return insights.inferredHistoryGenres.filter((g) => !likedSet.has(g));
  }, [insights.inferredHistoryGenres, profile.likedGenres]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3200);
  };

  const handleToggleGenre = (genre: string) => {
    const updated = toggleUserLikedGenre(genre);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast(
      updated.likedGenres.includes(genre)
        ? `Added ${genre} to favorite genres`
        : `Removed ${genre} from favorite genres`
    );
  };

  const handleResetGenres = () => {
    const updated = setFavoriteGenres(['Shonen', 'Action', 'Pan-African']);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast('Reset favorite genres to starter defaults');
  };

  const handleApplyPreset = (presetId: string) => {
    const updated = applyTastePreset(presetId, catalogManga);
    setExcludeRead(false);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    const presetName = TASTE_PRESETS.find((p) => p.id === presetId)?.name || 'Selected';
    showToast(`Applied "${presetName}" taste profile`);
  };

  const handleLogReadSeries = (manga: Manga) => {
    const firstChNumber = manga.chapters?.[0]?.number || 1;
    const updated = recordReadingHistoryEvent(manga.id, manga.title, firstChNumber);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast(`Added "${manga.title}" to reading history`);
  };

  const handleClearHistory = () => {
    const updated = clearReadingHistory();
    setExcludeRead(false);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast('Cleared reading history');
  };

  const handleRemoveHistoryItem = (mangaId: string) => {
    const updated = removeReadingHistoryEntry(mangaId);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast('Removed series from reading history');
  };

  const handleToggleCardFavorite = (manga: Manga) => {
    const isCurrentlyFav =
      favoriteIds.includes(manga.id) || profile.favoriteMangaIds.includes(manga.id);
    const nextFavIds = isCurrentlyFav
      ? Array.from(new Set([...favoriteIds, ...profile.favoriteMangaIds])).filter(
          (id) => id !== manga.id
        )
      : Array.from(new Set([...favoriteIds, ...profile.favoriteMangaIds, manga.id]));

    onToggleFavorite?.(manga.id);
    const updated = syncFavoritesWithTasteProfile(nextFavIds, catalogManga);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast(
      isCurrentlyFav
        ? `Removed "${manga.title}" from saved list`
        : `Saved "${manga.title}" to favorites`
    );
  };

  const modeOptions: {
    id: RecommendationAlgorithmMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'hybrid', label: 'For You', icon: Sparkles },
    { id: 'liked_genres', label: 'Favorite Genres', icon: Compass },
    { id: 'content_based', label: 'Reading History', icon: Flame },
    { id: 'collaborative', label: 'Similar Readers', icon: Users },
  ];

  const recTriggerKey = `${recommendationMode}-${excludeRead}-${recommendedForYou
    .map((r) => `${r.manga.id}:${r.matchPercentage}`)
    .join('|')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="taste-profile-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="min-w-0 pr-3">
            <h2
              id="taste-profile-modal-title"
              className="text-base sm:text-lg font-bold text-white truncate"
            >
              Personalized Recommendations & Taste Profile
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated series tailored to your favorite genres and reading history.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recommendations modal"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Feedback */}
        {toastNotice && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs px-5 py-2 font-medium flex items-center justify-between">
            <span>{toastNotice}</span>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="text-amber-400 hover:text-white px-1"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8">
          {/* =================================================================
              SECTION 1: RECOMMENDED FOR YOU (Powered by userTasteProfile)
              ================================================================= */}
          <section
            id="modal-recommended-for-you"
            aria-labelledby="recommended-for-you-heading"
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <h3
                  id="recommended-for-you-heading"
                  className="text-lg sm:text-xl font-bold text-white tracking-wide"
                >
                  Recommended for You
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                  <span>
                    <strong className="font-semibold text-slate-200 font-mono tabular-nums">
                      {profile.likedGenres.length}
                    </strong>{' '}
                    favorite {profile.likedGenres.length === 1 ? 'genre' : 'genres'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-semibold text-slate-200 font-mono tabular-nums">
                      {profile.readingHistory.length}
                    </strong>{' '}
                    in reading history
                  </span>
                  {insights.recentReadTitles.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 truncate max-w-[240px]">
                        Recent: {insights.recentReadTitles[0]}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Filter: Unread Only Toggle */}
              {profile.readingHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExcludeRead((prev) => !prev)}
                  className={`min-h-[40px] self-start sm:self-auto inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    excludeRead
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {excludeRead ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>Unread only</span>
                </button>
              )}
            </div>

            {/* Interactive Segmented Recommendation Mode Controls */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800/90 overflow-x-auto scrollbar-none">
              {modeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = recommendationMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRecommendationMode(option.id)}
                    className={`min-h-[38px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Recommended Manga Cards */}
            {recommendedForYou.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-3">
                <BookOpen className="w-7 h-7 text-slate-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {excludeRead && !unreadCandidatesExist
                      ? 'You have explored every series currently in the catalog'
                      : 'No matching recommendations found'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {excludeRead
                      ? 'Disable the unread filter to view top-ranked series across your favorite genres and reading history.'
                      : 'Select one or more favorite genres below to generate personalized recommendations.'}
                  </p>
                </div>
                {excludeRead && (
                  <button
                    type="button"
                    onClick={() => setExcludeRead(false)}
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold transition"
                  >
                    <span>Show All Recommendations</span>
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                key={recTriggerKey}
                initial={prefersReducedMotion ? false : 'hidden'}
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: prefersReducedMotion ? 0 : 0.045,
                    },
                  },
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {recommendedForYou.map((rec) => {
                  const { manga, matchPercentage, primaryReason } = rec;
                  const historyItem = profile.readingHistory.find(
                    (h) => h.mangaId === manga.id
                  );
                  const hasReadableChapters =
                    Array.isArray(manga.chapters) &&
                    manga.chapters.length > 0 &&
                    manga.chapters.some((c) => c.pages && c.pages.length > 0);
                  const targetChapter =
                    (historyItem?.lastChapterNumber
                      ? manga.chapters?.find((c) => c.number === historyItem.lastChapterNumber)
                      : undefined) || manga.chapters?.[0];
                  const isSaved =
                    favoriteIds.includes(manga.id) ||
                    profile.favoriteMangaIds.includes(manga.id);
                  const isBreakdownOpen = expandedBreakdownId === manga.id;

                  return (
                    <motion.article
                      key={manga.id}
                      variants={
                        prefersReducedMotion
                          ? undefined
                          : {
                              hidden: { opacity: 0, y: 12 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                              },
                            }
                      }
                      className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition p-4 gap-3"
                    >
                      <div className="flex gap-3.5">
                        {/* Cover Thumbnail */}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectDetailManga(manga);
                          }}
                          className="relative w-24 sm:w-28 aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 text-left"
                        >
                          <MangaCoverImage
                            src={manga.coverImage || manga.cover}
                            coverUrl={manga.coverUrl}
                            alt={manga.title}
                            title={manga.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </button>

                        {/* Series Info & Personalization Signal */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                          <div className="space-y-1">
                            {/* Unboxed Score + Rating Kicker */}
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs">
                              <span className="font-mono tabular-nums font-bold text-emerald-400">
                                {matchPercentage}% match
                              </span>
                              <span className="text-slate-600" aria-hidden="true">
                                ·
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-300">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {manga.rating.toFixed(1)}
                              </span>
                              {historyItem && (
                                <>
                                  <span className="text-slate-600" aria-hidden="true">
                                    ·
                                  </span>
                                  <span className="text-slate-400">
                                    Read
                                    {historyItem.lastChapterNumber
                                      ? ` Ch. ${historyItem.lastChapterNumber}`
                                      : ''}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Series Title */}
                            <h4 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectDetailManga(manga);
                                }}
                                className="hover:text-amber-400 transition text-left focus-visible:outline-none focus-visible:underline"
                              >
                                {manga.title}
                              </button>
                            </h4>

                            {/* Author & Unboxed Genres */}
                            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-400">
                              <span className="text-slate-300">{manga.author}</span>
                              {(manga.genres || []).slice(0, 3).map((genre) => (
                                <React.Fragment key={`${manga.id}-${genre}`}>
                                  <span className="text-slate-600" aria-hidden="true">
                                    ·
                                  </span>
                                  <span
                                    className={
                                      rec.matchedGenres.includes(genre)
                                        ? 'text-amber-300 font-medium'
                                        : 'text-slate-400'
                                    }
                                  >
                                    {genre}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>

                            {/* Taste Match Reason */}
                            <p className="text-xs text-amber-300/95 leading-relaxed line-clamp-2 pt-0.5">
                              {primaryReason}
                            </p>
                          </div>

                          {/* Card Actions */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {hasReadableChapters ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onStartReading(manga, targetChapter?.id || 'ch-1');
                                }}
                                className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              >
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {historyItem?.lastChapterNumber
                                    ? `Continue Ch. ${historyItem.lastChapterNumber}`
                                    : `Read Ch. ${targetChapter?.number || 1}`}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectDetailManga(manga);
                                }}
                                className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              >
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span>Explore Series</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleCardFavorite(manga)}
                              aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
                              title={isSaved ? 'Saved in Favorites' : 'Save to Favorites'}
                              className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                isSaved
                                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${isSaved ? 'fill-rose-400 text-rose-400' : ''}`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBreakdownId(isBreakdownOpen ? null : manga.id)
                              }
                              aria-expanded={isBreakdownOpen}
                              aria-label="Toggle match breakdown"
                              title="Why this was recommended"
                              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 px-2.5 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              {isBreakdownOpen ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Personalization Signal Breakdown */}
                      {isBreakdownOpen && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                          <p className="text-slate-300 leading-relaxed">{rec.explanation}</p>
                          <div className="grid grid-cols-3 gap-2 pt-0.5">
                            <div>
                              <span className="block text-slate-500">Matched genres</span>
                              <span className="font-medium text-slate-200">
                                {rec.matchedGenres.length > 0
                                  ? rec.matchedGenres.join(', ')
                                  : 'Catalog baseline'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-slate-500">History theme match</span>
                              <span className="font-mono tabular-nums font-semibold text-amber-300">
                                {Math.round(rec.thematicSimilarity * 100)}%
                              </span>
                            </div>
                            <div>
                              <span className="block text-slate-500">Reader affinity</span>
                              <span className="font-mono tabular-nums font-semibold text-emerald-300">
                                {Math.round(rec.collaborativeScore * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </section>

          {/* Hairline Divider */}
          <div className="border-t border-slate-800" />

          {/* =================================================================
              SECTION 2: TASTE PROFILE CONTROLS (Genres, History, Presets, Info)
              ================================================================= */}
          <section className="space-y-5" aria-label="Customize taste profile">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white">Tune Your Taste Signals</h3>
                <p className="text-xs text-slate-400">
                  Adjusting your favorite genres or reading history immediately updates Recommended for You above.
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center border-b border-slate-800 gap-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('genres')}
                className={`min-h-[40px] flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'genres'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Favorite Genres ({profile.likedGenres.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`min-h-[40px] flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reading History ({profile.readingHistory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`min-h-[40px] flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'presets'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Taste Presets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('engine')}
                className={`min-h-[40px] flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'engine'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>How It Works</span>
              </button>
            </div>

            {/* TAB 1: FAVORITE GENRES */}
            {activeTab === 'genres' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-slate-400">
                    Select genres you enjoy most to weight content-based scoring.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetGenres}
                    className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 text-xs font-medium transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* Genre Toggle Buttons */}
                <div className="flex flex-wrap gap-2">
                  {allGenres.map((genre) => {
                    const isSelected = profile.likedGenres.includes(genre);
                    return (
                      <button
                        key={`rec-genre-${genre}`}
                        type="button"
                        onClick={() => handleToggleGenre(genre)}
                        className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{genre}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Suggested Genres Inferred from Reading History */}
                {inferredGenresNotYetLiked.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 pt-2 text-xs text-slate-400">
                    <span>Suggested from your reading history:</span>
                    {inferredGenresNotYetLiked.map((genre) => (
                      <button
                        key={`inferred-${genre}`}
                        type="button"
                        onClick={() => handleToggleGenre(genre)}
                        className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 font-semibold transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add {genre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: READING HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Series you read act as seed signals for narrative similarity and community co-reading affinity.
                  </p>
                  {profile.readingHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-red-300 px-3 py-1.5 text-xs font-semibold transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear History</span>
                    </button>
                  )}
                </div>

                {profile.readingHistory.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center space-y-2">
                    <BookOpen className="w-7 h-7 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Reading History Recorded Yet</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Open any manga chapter or mark a series you have read below to add history signals to your recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {profile.readingHistory.map((item) => {
                      const manga = catalogManga.find((m) => m.id === item.mangaId);
                      return (
                        <div
                          key={`rec-history-${item.mangaId}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {manga && (
                              <div className="h-14 w-10 rounded overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                                <MangaCoverImage
                                  src={manga.coverImage || manga.cover}
                                  coverUrl={manga.coverUrl}
                                  alt={item.mangaTitle}
                                  title={item.mangaTitle}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {item.mangaTitle}
                              </h4>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400">
                                {item.lastChapterNumber && (
                                  <>
                                    <span className="font-mono tabular-nums">
                                      Ch. {item.lastChapterNumber}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                  </>
                                )}
                                <span className="font-mono tabular-nums">
                                  {item.readCount} {item.readCount === 1 ? 'session' : 'sessions'}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{new Date(item.lastReadAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {manga && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectDetailManga(manga);
                                }}
                                className="min-h-[38px] rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1.5 text-xs font-semibold transition"
                              >
                                Details
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveHistoryItem(item.mangaId)}
                              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
                              aria-label={`Remove ${item.mangaTitle} from history`}
                              title="Remove from history"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick Log Series to Reading History */}
                {unloggedCatalogManga.length > 0 && (
                  <div className="pt-2 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-300">
                      Mark catalog series you have read to refine recommendations:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {unloggedCatalogManga.slice(0, 6).map((manga) => (
                        <button
                          key={`log-read-${manga.id}`}
                          type="button"
                          onClick={() => handleLogReadSeries(manga)}
                          className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-amber-500/40 text-slate-300 hover:text-white px-3.5 py-2 text-xs font-medium transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{manga.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TASTE PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Apply a curated reader persona to see how favorite genres and reading history reshape your Recommended for You feed.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {TASTE_PRESETS.map((preset) => (
                    <div
                      key={`rec-preset-${preset.id}`}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition gap-3.5"
                    >
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-white">{preset.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {preset.description}
                        </p>
                        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-amber-300 pt-1">
                          {preset.likedGenres.map((genre, idx) => (
                            <React.Fragment key={`${preset.id}-${genre}`}>
                              {idx > 0 && (
                                <span className="text-slate-600" aria-hidden="true">
                                  ·
                                </span>
                              )}
                              <span>{genre}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset.id)}
                        className="min-h-[40px] w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950 py-2 px-4 text-xs font-bold transition"
                      >
                        <span>Apply {preset.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: HOW IT WORKS */}
            {activeTab === 'engine' && (
              <div className="space-y-4 text-xs text-slate-300">
                <p className="leading-relaxed">
                  Recommendations are ranked using a hybrid scoring model combining your explicit genre preferences, narrative similarity to series in your reading history, and reader co-engagement patterns.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1.5">
                    <h4 className="text-sm font-bold text-white">
                      01. Content & Genre Alignment (55%)
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Compares your favorite genres and thematic keywords from series in your reading history against every public series in the OVERVERSE catalog.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1.5">
                    <h4 className="text-sm font-bold text-white">
                      02. Community Co-Reading & Quality (45%)
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Weights item-to-item reader affinity (35%) alongside reader ratings and award citations (10%) to surface standout titles.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span className="font-mono tabular-nums text-slate-200">
              {profile.likedGenres.length}
            </span>
            <span>favorite {profile.likedGenres.length === 1 ? 'genre' : 'genres'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-200">
              {profile.readingHistory.length}
            </span>
            <span>history {profile.readingHistory.length === 1 ? 'title' : 'titles'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 text-xs font-bold transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
