import React, { useState, useMemo } from 'react';
import { Manga } from '../../types';
import {
  UserTasteProfile,
  getUserTasteProfile,
  saveUserTasteProfile,
  toggleUserLikedGenre,
  extractUniqueGenres,
  clearReadingHistory,
  TASTE_PRESETS,
  applyTastePreset,
  getRecommendedManga,
} from '../../services/recommendationEngine';
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
  Brain,
  Star,
  RefreshCw,
} from 'lucide-react';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaList: Manga[];
  onSelectDetailManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onProfileUpdated?: (updated: UserTasteProfile) => void;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  mangaList,
  onSelectDetailManga,
  onStartReading,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserTasteProfile>(() => getUserTasteProfile());
  const [activeTab, setActiveTab] = useState<'genres' | 'history' | 'presets' | 'engine'>('genres');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const allGenres = useMemo(() => {
    return extractUniqueGenres(mangaList);
  }, [mangaList]);

  const recommendedPreview = useMemo(() => {
    return getRecommendedManga(mangaList, {
      mode: 'hybrid',
      limit: 4,
      customTasteProfile: profile,
    });
  }, [mangaList, profile]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleToggleGenre = (genre: string) => {
    const updated = toggleUserLikedGenre(genre);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast(`Updated taste preferences: ${updated.likedGenres.includes(genre) ? 'Added' : 'Removed'} ${genre}`);
  };

  const handleApplyPreset = (presetId: string) => {
    const updated = applyTastePreset(presetId, mangaList);
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast(`Loaded "${TASTE_PRESETS.find((p) => p.id === presetId)?.name}" taste preset!`);
  };

  const handleClearHistory = () => {
    const updated = clearReadingHistory();
    setProfile({ ...updated });
    onProfileUpdated?.(updated);
    showToast('Reading history reset.');
  };

  const handleRemoveHistoryItem = (mangaId: string) => {
    const updated: UserTasteProfile = {
      ...profile,
      readingHistory: profile.readingHistory.filter((h) => h.mangaId !== mangaId),
      lastUpdated: new Date().toISOString(),
    };
    saveUserTasteProfile(updated);
    setProfile(updated);
    onProfileUpdated?.(updated);
    showToast('Item removed from reading history.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-amber-500/40 bg-slate-950 shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Brain className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Manga Taste Profile & Recommendation Engine</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tune your liked genres and reading history to generate personalized recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('genres')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'genres'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Liked Genres ({profile.likedGenres.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reading History ({profile.readingHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Taste Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'engine'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </button>
        </div>

        {/* Toast alert */}
        {toastNotice && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-xs px-4 py-2 font-medium flex items-center justify-between animate-fadeIn">
            <span>✨ {toastNotice}</span>
            <button onClick={() => setToastNotice(null)} className="text-amber-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* TAB 1: LIKED GENRES */}
          {activeTab === 'genres' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Select Your Favorite Genres</h3>
                  <p className="text-xs text-slate-400">
                    Content-based filtering matches these genres directly with series attributes.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {profile.likedGenres.length} selected
                </span>
              </div>

              {/* Genre Pills Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {allGenres.map((genre, idx) => {
                  const isSelected = profile.likedGenres.includes(genre);
                  return (
                    <button
                      key={`rec-genre-${genre}-${idx}`}
                      onClick={() => handleToggleGenre(genre)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{genre}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Instant Recommendations Generated
                  </span>
                  <span className="text-[11px] text-slate-400">Top 4 Matches</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {recommendedPreview.map((rec, idx) => (
                    <div
                      key={`rec-preview-${rec.manga.id}-${idx}`}
                      onClick={() => {
                        onClose();
                        onSelectDetailManga(rec.manga);
                      }}
                      className="group cursor-pointer rounded-lg border border-slate-800 bg-slate-950 p-2 hover:border-amber-500/50 transition flex flex-col gap-1"
                    >
                      <div className="relative aspect-[3/4] w-full rounded overflow-hidden bg-slate-900">
                        <img
                          src={rec.manga.coverImage}
                          alt={rec.manga.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-emerald-500 text-black font-black text-[9px] px-1 py-0.2">
                          {rec.matchPercentage}%
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-white truncate group-hover:text-amber-400 transition">
                        {rec.manga.title}
                      </p>
                      <p className="text-[9px] text-amber-400/90 truncate">
                        {rec.primaryReason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: READING HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Your Reading History</h3>
                  <p className="text-xs text-slate-400">
                    Read items provide seed signals for content similarity & collaborative co-occurrence.
                  </p>
                </div>
                {profile.readingHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-red-300 px-2.5 py-1 text-xs font-semibold transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {profile.readingHistory.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-white">No Reading History Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Start reading any manga chapter to automatically record signals for the recommendation engine, or apply a taste preset below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.readingHistory.map((item, idx) => {
                    const manga = mangaList.find((m) => m.id === item.mangaId);
                    return (
                      <div
                        key={`rec-history-${item.mangaId}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {manga && (
                            <img
                              src={manga.coverImage}
                              alt={item.mangaTitle}
                              className="h-12 w-9 rounded object-cover border border-slate-800 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.mangaTitle}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              {item.lastChapterNumber && (
                                <span>Ch. {item.lastChapterNumber}</span>
                              )}
                              <span>•</span>
                              <span>{item.readCount} read session{item.readCount > 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span>{new Date(item.lastReadAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {manga && (
                            <button
                              onClick={() => {
                                onClose();
                                onSelectDetailManga(manga);
                              }}
                              className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 text-xs font-bold transition"
                            >
                              Explore
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveHistoryItem(item.mangaId)}
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                            title="Remove from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TASTE PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">One-Click Taste Presets</h3>
                <p className="text-xs text-slate-400">
                  Switch personas to test how the collaborative and content-based recommendation models dynamically adapt in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TASTE_PRESETS.map((preset, idx) => (
                  <div
                    key={`rec-preset-${preset.id}-${idx}`}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-amber-500/40 transition gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{preset.icon}</span>
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          {preset.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {preset.likedGenres.map((g, gIdx) => (
                          <span
                            key={`rec-preset-${preset.id}-genre-${g}-${gIdx}`}
                            className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-amber-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyPreset(preset.id)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black py-2 px-3 text-xs font-bold transition shadow active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply "{preset.name}" Taste</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HOW IT WORKS (ENGINE DETAILS) */}
          {activeTab === 'engine' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  AZ OVERVERSE Recommendation Engine Architecture
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Our recommendation engine implements a hybrid ensemble combining classic <strong>Content-Based Filtering</strong> and <strong>Collaborative Filtering</strong> to surface the best Pan-African manga series for every individual reader.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>1. Content-Based Filtering</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Extracts multi-dimensional feature vectors including genre taxonomy, synopsis keywords (e.g. ancestral spirits, cyberpunk, solar martial arts), author affinity, and demographic types. Computes Jaccard & Cosine similarity against your reading history and liked genres.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Users className="w-3.5 h-3.5" />
                      <span>2. Collaborative Filtering</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Leverages item-item co-occurrence matrices calculated across the African manga reader community. Predicts high affinity when series share frequent co-reading, bookmarking, and chapter progression paths.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-200">
                  <strong>Hybrid Formula:</strong> Score = <code>0.55 × ContentSim + 0.35 × CollabAffinity + 0.10 × QualityRating</code>. Handles the cold-start problem automatically by falling back gracefully to user-selected Liked Genres.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            <span>Taste Profile Active • </span>
            <span className="text-amber-400">{profile.likedGenres.length} Genres</span>
            <span> • </span>
            <span className="text-emerald-400">{profile.readingHistory.length} Titles in History</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
