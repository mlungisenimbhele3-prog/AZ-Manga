import React, { useState, useMemo } from 'react';
import { Manga } from '../../types';
import {
  RecommendationResult,
  RecommendationAlgorithmMode,
  getRecommendedManga,
  getUserTasteProfile,
  UserTasteProfile,
} from '../../services/recommendationEngine';
import {
  Sparkles,
  Zap,
  SlidersHorizontal,
  Flame,
  Users,
  Compass,
  ChevronRight,
  BookOpen,
  Star,
  Info,
} from 'lucide-react';

interface RecommendationsTrayProps {
  mangaList: Manga[];
  favoriteIds: string[];
  onToggleFavorite: (mangaId: string) => void;
  onSelectDetailManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onOpenTasteProfileModal: () => void;
  userTasteProfile?: UserTasteProfile;
}

export const RecommendationsTray: React.FC<RecommendationsTrayProps> = ({
  mangaList,
  favoriteIds,
  onToggleFavorite,
  onSelectDetailManga,
  onStartReading,
  onOpenTasteProfileModal,
  userTasteProfile,
}) => {
  const instanceId = React.useId();
  const [selectedMode, setSelectedMode] = useState<RecommendationAlgorithmMode>('hybrid');
  const [showExplanationId, setShowExplanationId] = useState<string | null>(null);

  const profile = useMemo(() => {
    return userTasteProfile || getUserTasteProfile();
  }, [userTasteProfile]);

  const recommendations = useMemo(() => {
    return getRecommendedManga(mangaList, {
      mode: selectedMode,
      limit: 6,
      customTasteProfile: profile,
    });
  }, [mangaList, selectedMode, profile]);

  if (recommendations.length === 0) {
    return null;
  }

  const modes: { id: RecommendationAlgorithmMode; label: string; icon: any; hint: string }[] = [
    {
      id: 'hybrid',
      label: 'Smart Hybrid',
      icon: Sparkles,
      hint: 'Blends content similarity, collaborative reader behavior & ratings',
    },
    {
      id: 'content_based',
      label: 'Based on History',
      icon: Flame,
      hint: 'Content-based match to your reading history & themes',
    },
    {
      id: 'collaborative',
      label: 'Readers Also Liked',
      icon: Users,
      hint: 'Item-item collaborative filtering from community reading habits',
    },
    {
      id: 'liked_genres',
      label: 'Liked Genres',
      icon: Compass,
      hint: 'Matches your explicitly selected preferred genres',
    },
  ];

  return (
    <div
      id="manga-recommendations-shelf"
      className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 p-4 sm:p-5 shadow-xl transition-all"
    >
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black shadow-md shadow-amber-500/20">
            <Sparkles className="w-4 h-4 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Bebas_Neue',sans-serif] text-lg sm:text-xl tracking-wider text-white">
                Recommended For You
              </h3>
              <span className="rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[9px] px-1.5 py-0.5 uppercase font-bold tracking-wider">
                Recommendation Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized suggestions derived from your reading history & liked genres.
            </p>
          </div>
        </div>

        {/* Action: Customize Taste & Algorithms */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTasteProfileModal}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 px-3 py-1.5 text-xs font-bold transition shadow-sm"
            title="Adjust liked genres and review reading history"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Taste Profile ({profile.likedGenres.length} Genres)</span>
          </button>
        </div>
      </div>

      {/* Algorithm Mode Switcher Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
          Model:
        </span>
        {modes.map((m, idx) => {
          const Icon = m.icon;
          const isActive = selectedMode === m.id;
          return (
            <button
              key={`${instanceId}-mode-${m.id}-${idx}`}
              onClick={() => setSelectedMode(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20 scale-102'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={m.hint}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Recommended Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {recommendations.map((rec, idx) => {
          const { manga, matchPercentage, primaryReason, explanation } = rec;
          const isFav = favoriteIds.includes(manga.id);
          const isExpanded = showExplanationId === manga.id;

          return (
            <div
              key={`${instanceId}-rec-${manga.id}-${idx}`}
              className="group relative flex flex-col rounded-xl border border-slate-800/90 bg-slate-950/70 hover:border-amber-500/60 transition duration-200 overflow-hidden shadow-md flex-1"
            >
              {/* Cover Art with Match Badge Overlay */}
              <div
                onClick={() => onSelectDetailManga(manga)}
                className="relative aspect-[3/4] w-full overflow-hidden cursor-pointer bg-slate-900"
              >
                <img
                  src={manga.coverImage}
                  alt={manga.title}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Match Percentage Glow Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-black font-black text-[10px] px-2 py-0.5 shadow-lg shadow-emerald-500/30">
                  <Zap className="w-2.5 h-2.5 fill-black" />
                  <span>{matchPercentage}% Match</span>
                </div>

                {/* Info pill to reveal algorithm explanation */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExplanationId(isExpanded ? null : manga.id);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-amber-300 p-1 backdrop-blur-sm transition"
                  title="Why was this recommended?"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {/* Rating overlay */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                  <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                  <span>{manga.rating}</span>
                </div>
              </div>

              {/* Card Meta & Explanatory Reason */}
              <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                <div>
                  <h4
                    onClick={() => onSelectDetailManga(manga)}
                    className="text-xs font-bold text-white hover:text-amber-400 line-clamp-1 cursor-pointer transition"
                    title={manga.title}
                  >
                    {manga.title}
                  </h4>

                  {/* Explainability reason */}
                  <p className="text-[10px] text-amber-400/90 font-medium line-clamp-1 mt-0.5">
                    ✨ {primaryReason}
                  </p>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1">
                  {(manga.genres || []).slice(0, 2).map((g, gIdx) => (
                    <span
                      key={`${instanceId}-genre-${manga.id}-${g}-${gIdx}`}
                      className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[9px] font-semibold text-slate-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Quick Read Button */}
                <button
                  onClick={() => {
                    const firstChapter = manga.chapters[0]?.id || 'ch-1';
                    onStartReading(manga, firstChapter);
                  }}
                  className="mt-1 w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-black py-1 px-2 text-[10px] font-bold flex items-center justify-center gap-1 transition shadow active:scale-95"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Read Ch. 1</span>
                </button>
              </div>

              {/* Explanatory Drawer Popover */}
              {isExpanded && (
                <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-3 flex flex-col justify-between text-left text-xs animate-fadeIn">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Algorithm Breakdown
                      </span>
                      <button
                        onClick={() => setShowExplanationId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[11px] text-white font-semibold">
                      {manga.title} ({matchPercentage}% Match)
                    </p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      {primaryReason}
                    </p>
                    <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 space-y-1 text-[10px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Thematic Alignment:</span>
                        <span className="text-amber-300 font-mono font-bold">
                          {Math.round(rec.thematicSimilarity * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Co-Reader Affinity:</span>
                        <span className="text-emerald-300 font-mono font-bold">
                          {Math.round(rec.collaborativeScore * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Matched Genres:</span>
                        <span className="text-purple-300 font-mono">
                          {rec.matchedGenres.join(', ') || 'Catalog Prior'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowExplanationId(null);
                      onSelectDetailManga(manga);
                    }}
                    className="w-full rounded bg-slate-800 hover:bg-slate-700 text-slate-200 py-1 text-[10px] font-bold text-center"
                  >
                    View Series Details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
