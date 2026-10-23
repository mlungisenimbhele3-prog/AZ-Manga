import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AwardCategory, Manga } from '../../types';
import {
  Trophy,
  Award,
  Crown,
  Sparkles,
  Star,
  Eye,
  Play,
  CheckCircle,
  X,
  ChevronRight,
  Flame,
  ThumbsUp,
  Share2,
} from 'lucide-react';

interface MangaOfTheYearAwardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AwardCategory[];
  mangaList: Manga[];
  onStartReading: (manga: Manga, chapterId: string) => void;
  onSelectManga: (manga: Manga) => void;
}

export const MangaOfTheYearAwardsModal: React.FC<MangaOfTheYearAwardsModalProps> = ({
  isOpen,
  onClose,
  categories,
  mangaList,
  onStartReading,
  onSelectManga,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'grand-prix');
  
  // Local vote counts state initialized from category data, with user vote tracking
  const [userVotedMangaId, setUserVotedMangaId] = useState<string | null>(() => {
    return localStorage.getItem('ka_moty_voted_manga_id') || null;
  });

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      cat.nominees.forEach((nom) => {
        counts[nom.mangaId] = (counts[nom.mangaId] || 0) + nom.votes;
      });
    });
    return counts;
  });

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
  const winnerManga = mangaList.find((m) => m.id === activeCategory.winnerMangaId) || mangaList[0];

  const handleCastVote = (mangaId: string, mangaTitle: string) => {
    if (userVotedMangaId === mangaId) return;

    setVoteCounts((prev) => ({
      ...prev,
      [mangaId]: (prev[mangaId] || 0) + 1,
    }));
    setUserVotedMangaId(mangaId);
    localStorage.setItem('ka_moty_voted_manga_id', mangaId);

    setToastMessage(`Vote recorded for "${mangaTitle}"! Thank you for participating in MOTY 2026.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calculate total votes in active category for progress bars
  const totalCategoryVotes = activeCategory.nominees.reduce(
    (acc, nom) => acc + (voteCounts[nom.mangaId] || nom.votes),
    0
  );

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
            className="relative my-6 w-full max-w-5xl rounded-3xl border border-amber-500/40 bg-[#0c1017] text-white shadow-2xl shadow-amber-500/10 overflow-hidden"
          >
            {/* Top Gala Header */}
            <div className="relative border-b border-amber-500/20 bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 text-black shadow-lg shadow-amber-500/30">
                    <Trophy className="w-6 h-6 fill-black text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                        KA PLUS ANNUAL HONORS
                      </span>
                      <span className="text-xs text-slate-400">• Official 2026 Selections</span>
                    </div>
                    <h2 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wide text-white">
                      MANGA OF THE YEAR <span className="text-amber-400">AWARDS 2026</span>
                    </h2>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-full bg-slate-900 border border-slate-700 p-2 text-slate-300 hover:text-white hover:border-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Selector Tabs */}
              <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map((cat, idx) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={`moty-modal-cat-${cat.id}-${idx}`}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <Crown className={`w-3.5 h-3.5 ${isSelected ? 'fill-black' : 'text-amber-400'}`} />
                      <span>{cat.title.replace('AZ OVERVERSE ', '').replace('AZ Oververse ', '').replace('KA Plus: Africa Pulse ', '').replace('KA Plus ', '').replace('KA+ ', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-500 text-black text-xs font-bold px-4 py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 fill-black text-amber-500" />
                    <span>{toastMessage}</span>
                  </div>
                  <button onClick={() => setToastMessage(null)} className="text-black font-black">
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Active Category Intro */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span>{activeCategory.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeCategory.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-full w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Editorial Board Gold Standard</span>
                </div>
              </div>

              {/* Category Winner Card Showcase */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-slate-950 to-slate-950 shadow-2xl">
                {/* Gold Laurel Ribbon Banner */}
                <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-4 py-1.5 flex items-center justify-between text-black text-xs font-black tracking-wider uppercase">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 fill-black" />
                    <span>OFFICIAL 2026 CATEGORY WINNER</span>
                  </span>
                  <span className="hidden sm:inline font-mono">AWARD OF EXCELLENCE</span>
                </div>

                <div className="p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6">
                  {/* Cover with Golden Frame */}
                  <div className="relative shrink-0 group cursor-pointer" onClick={() => onSelectManga(winnerManga)}>
                    <img
                      src={winnerManga.coverImage}
                      alt={winnerManga.title}
                      className="h-60 w-44 rounded-2xl object-cover shadow-2xl border border-amber-500/40 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 rounded-lg bg-black/80 backdrop-blur-sm border border-amber-400/50 px-2 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span>#1 WINNER</span>
                    </div>
                  </div>

                  {/* Details & Citation */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold">
                          {winnerManga.genres[0]}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          <span>{winnerManga.rating}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{winnerManga.views.toLocaleString()} reads</span>
                        </span>
                      </div>

                      <h4 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white drop-shadow">
                        {winnerManga.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Created by <strong className="text-slate-200">{winnerManga.author}</strong> • Art by{' '}
                        <strong className="text-slate-200">{winnerManga.artist}</strong>
                      </p>

                      {/* Official Jury Citation */}
                      <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          Official Jury Citation
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                          "{activeCategory.winnerCitation}"
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => onStartReading(winnerManga, winnerManga.chapters[0].id)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black px-5 py-2.5 text-xs font-black transition shadow-lg shadow-amber-500/20"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>Read Winner Ch. 1</span>
                      </button>

                      <button
                        onClick={() => onSelectManga(winnerManga)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 text-xs font-bold transition"
                      >
                        <span>View All Chapters ({winnerManga.chapters.length})</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reader's Choice Live Voting Arena & Nominees */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      <span>Reader's Choice Voting Arena ({activeCategory.nominees.length} Nominees)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cast your live community ballot. Total verified reader votes: {totalCategoryVotes.toLocaleString()}
                    </p>
                  </div>

                  {userVotedMangaId && (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-xs font-bold flex items-center gap-1.5 w-fit">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Your Ballot Recorded</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCategory.nominees.map((nom, idx) => {
                    const manga = mangaList.find((m) => m.id === nom.mangaId);
                    if (!manga) return null;

                    const isWinner = manga.id === activeCategory.winnerMangaId;
                    const votes = voteCounts[nom.mangaId] || nom.votes;
                    const votePercentage = Math.round((votes / (totalCategoryVotes || 1)) * 100);
                    const hasVotedForThis = userVotedMangaId === nom.mangaId;

                    return (
                      <div
                        key={`moty-modal-nom-${nom.mangaId}-${idx}`}
                        className={`rounded-2xl border p-4 transition ${
                          hasVotedForThis
                            ? 'border-emerald-500/60 bg-emerald-950/15'
                            : isWinner
                            ? 'border-amber-500/40 bg-slate-950/80'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
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
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h5
                                onClick={() => onSelectManga(manga)}
                                className="text-xs font-bold text-white truncate cursor-pointer hover:text-amber-400 transition"
                              >
                                {manga.title}
                              </h5>
                              {isWinner && (
                                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-black uppercase">
                                  Winner
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                              {nom.nominationReason}
                            </p>

                            {/* Live Vote Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>{votes.toLocaleString()} votes</span>
                                <span className="text-amber-400 font-bold">{votePercentage}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isWinner ? 'bg-amber-400' : 'bg-purple-500'
                                  }`}
                                  style={{ width: `${votePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onStartReading(manga, manga.chapters[0].id)}
                            className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition"
                          >
                            <Play className="w-3 h-3 text-amber-400" />
                            <span>Read Ch. 1</span>
                          </button>

                          <button
                            onClick={() => handleCastVote(nom.mangaId, manga.title)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                              hasVotedForThis
                                ? 'bg-emerald-500 text-black font-black shadow'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasVotedForThis ? 'fill-black' : ''}`} />
                            <span>{hasVotedForThis ? 'Your Choice' : 'Vote'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>
                  KA Plus: Africa Pulse Annual Awards recognize original storytelling excellence and community engagement.
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                Close Gala
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
