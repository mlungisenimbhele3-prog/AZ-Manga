import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AwardCategory, Manga, isMangaComingSoon } from '../../types';
import { CatalogAwardsState } from '../../services/catalogApi';
import {
  Trophy,
  Award,
  Crown,
  Clock,
  Star,
  Eye,
  Play,
  CheckCircle,
  X,
  ChevronRight,
  ThumbsUp,
} from 'lucide-react';

interface MangaOfTheYearAwardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AwardCategory[];
  mangaList: Manga[];
  awardsState?: CatalogAwardsState;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onSelectManga: (manga: Manga) => void;
}

export const MangaOfTheYearAwardsModal: React.FC<MangaOfTheYearAwardsModalProps> = ({
  isOpen,
  onClose,
  categories,
  mangaList,
  awardsState,
  onStartReading,
  onSelectManga,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'grand-prix');
  const [userVotedMangaId, setUserVotedMangaId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const resolvedWinnerId =
    (activeCategory?.id === 'grand-prix' ? awardsState?.winnerMangaId : '') ||
    activeCategory?.winnerMangaId ||
    '';
  const winnerManga = resolvedWinnerId
    ? mangaList.find((m) => m.id === resolvedWinnerId) || null
    : null;
  const isComingSoon = !winnerManga || awardsState?.status === 'coming_soon';

  const handleCastVote = (mangaId: string, mangaTitle: string) => {
    if (isComingSoon || userVotedMangaId === mangaId) return;

    setVoteCounts((prev) => ({
      ...prev,
      [mangaId]: (prev[mangaId] || 0) + 1,
    }));
    setUserVotedMangaId(mangaId);

    setToastMessage(`Vote recorded for "${mangaTitle}".`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const totalCategoryVotes = activeCategory
    ? activeCategory.nominees.reduce((acc, nom) => acc + (voteCounts[nom.mangaId] || 0), 0)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="moty-awards-overlay"
          key="moty-awards-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
        >
          <motion.div
            id="moty-awards-modal"
            key="moty-awards-modal-content"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 300,
              mass: 0.75,
            }}
            className="relative my-6 w-full max-w-4xl rounded-3xl border border-amber-500/40 bg-[#0c1017] text-white shadow-2xl shadow-amber-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="relative border-b border-amber-500/20 bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 text-black shadow-lg shadow-amber-500/30">
                    <Trophy className="w-6 h-6 fill-black text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {isComingSoon ? 'COMING SOON' : 'AZ OVERVERSE HONORS'}
                      </span>
                      <span className="text-xs text-slate-400">• Season 1</span>
                    </div>
                    <h2 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wide text-white">
                      {isComingSoon
                        ? 'Manga of the Year Awards — Coming Soon'
                        : `MANGA OF THE YEAR AWARDS ${awardsState?.year || 2026}`}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-slate-900 border border-slate-700 p-2 text-slate-300 hover:text-white hover:border-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {toastMessage && (
              <div className="bg-amber-500 text-black text-xs font-bold px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 fill-black text-amber-500" />
                  <span>{toastMessage}</span>
                </div>
                <button type="button" onClick={() => setToastMessage(null)} className="text-black font-black">
                  ✕
                </button>
              </div>
            )}

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {isComingSoon ? (
                <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-6 sm:p-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Manga of the Year Awards — Coming Soon
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                    Voting opens after our first season. Stay tuned.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 px-5 py-2.5 text-xs font-bold cursor-not-allowed opacity-60"
                    >
                      <Award className="w-4 h-4" />
                      <span>Vote</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 px-5 py-2.5 text-xs font-bold cursor-not-allowed opacity-60"
                    >
                      <Play className="w-4 h-4" />
                      <span>Read Winner</span>
                    </button>
                  </div>
                </div>
              ) : winnerManga ? (
                <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-slate-950 to-slate-950 shadow-2xl">
                  <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-4 py-1.5 flex items-center justify-between text-black text-xs font-black tracking-wider uppercase">
                    <span className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 fill-black" />
                      <span>OFFICIAL CATEGORY WINNER</span>
                    </span>
                  </div>

                  <div className="p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6">
                    <div className="relative shrink-0 group cursor-pointer" onClick={() => onSelectManga(winnerManga)}>
                      <img
                        src={winnerManga.coverImage}
                        alt={winnerManga.title}
                        className="h-60 w-44 rounded-2xl object-cover shadow-2xl border border-amber-500/40 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold">
                            {winnerManga.genres[0]}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-yellow-400" />
                            <span>{(winnerManga.rating || 0).toFixed(1)}</span>
                          </span>
                          {!isMangaComingSoon(winnerManga) && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{(winnerManga.views || 0).toLocaleString()} reads</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white drop-shadow">
                          {winnerManga.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          Created by <strong className="text-slate-200">{winnerManga.author}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          disabled={!winnerManga.chapters?.[0]?.id}
                          onClick={() => {
                            const chId = winnerManga.chapters?.[0]?.id;
                            if (chId) onStartReading(winnerManga, chId);
                          }}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-black px-5 py-2.5 text-xs font-black transition shadow-lg shadow-amber-500/20"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Read Winner</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectManga(winnerManga)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 text-xs font-bold transition"
                        >
                          <span>View Chapters ({winnerManga.chapters.length})</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Nominees Preview */}
              {activeCategory && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Season 1 Nominees ({activeCategory.nominees.length})</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {isComingSoon
                          ? 'Voting opens after our first season. Stay tuned.'
                          : `Verified votes: ${totalCategoryVotes.toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCategory.nominees.map((nom, idx) => {
                      const manga = mangaList.find((m) => m.id === nom.mangaId);
                      if (!manga) return null;
                      const mangaComingSoon = isMangaComingSoon(manga);
                      const firstChId = manga.chapters?.[0]?.id;
                      const hasVotedForThis = userVotedMangaId === nom.mangaId;

                      return (
                        <div
                          key={`moty-modal-nom-${nom.mangaId}-${idx}`}
                          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={manga.coverImage}
                              alt={manga.title}
                              className="h-20 w-16 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer"
                              onClick={() => onSelectManga(manga)}
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <h5
                                onClick={() => onSelectManga(manga)}
                                className="text-xs font-bold text-white truncate cursor-pointer hover:text-amber-400 transition"
                              >
                                {manga.title}
                              </h5>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                                {nom.nominationReason}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              disabled={mangaComingSoon || !firstChId}
                              onClick={() => {
                                if (!mangaComingSoon && firstChId) {
                                  onStartReading(manga, firstChId);
                                }
                              }}
                              className={`text-[11px] font-bold flex items-center gap-1 transition ${
                                mangaComingSoon || !firstChId
                                  ? 'text-slate-500 cursor-not-allowed opacity-60'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              <Play className="w-3 h-3" />
                              <span>{mangaComingSoon ? 'Coming Soon' : 'Read Ch. 1'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isComingSoon}
                              onClick={() => handleCastVote(nom.mangaId, manga.title)}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                                isComingSoon
                                  ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                                  : hasVotedForThis
                                  ? 'bg-emerald-500 text-black font-black shadow'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{hasVotedForThis ? 'Voted' : 'Vote'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>AZ OVERVERSE Manga of the Year Awards</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
