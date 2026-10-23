import React from 'react';
import { Manga, AwardCategory } from '../../types';
import { Trophy, Crown, Sparkles, Star, Play, ChevronRight, Award, ThumbsUp } from 'lucide-react';

interface MangaOfTheYearShowcaseProps {
  categories: AwardCategory[];
  mangaList: Manga[];
  onOpenAwardsModal: () => void;
  onSelectManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
}

export const MangaOfTheYearShowcase: React.FC<MangaOfTheYearShowcaseProps> = ({
  categories,
  mangaList,
  onOpenAwardsModal,
  onSelectManga,
  onStartReading,
}) => {
  const grandPrixCategory = categories.find((c) => c.id === 'grand-prix') || categories[0];
  const grandWinner = mangaList.find((m) => m.id === grandPrixCategory?.winnerMangaId) || mangaList[0];

  return (
    <div id="moty-showcase-section" className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-2xl">
      {/* Background glow accents */}
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 text-black shadow-lg shadow-amber-500/30">
            <Trophy className="w-6 h-6 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                ANNUAL HONORS
              </span>
              <span className="text-xs text-slate-400 font-mono">{new Date().getFullYear()} EDITION</span>
            </div>
            <h2 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wide text-white">
              KA PLUS MANGA OF THE YEAR <span className="text-amber-400">AWARDS</span>
            </h2>
          </div>
        </div>

        <button
          onClick={onOpenAwardsModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs px-4 py-2.5 transition shadow-lg shadow-amber-500/20 self-start sm:self-auto"
        >
          <Award className="w-4 h-4 fill-black" />
          <span>View All Categories & Vote</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Spotlight & Winners Grid */}
      <div className="relative mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Grand Prix Spotlight (Left 7 cols) */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5">
          <div
            className="relative shrink-0 group cursor-pointer"
            onClick={() => onSelectManga(grandWinner)}
          >
            <img
              src={grandWinner.coverImage}
              alt={grandWinner.title}
              className="h-56 w-40 rounded-xl object-cover border border-amber-500/40 shadow-xl group-hover:scale-102 transition"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 left-2 rounded-md bg-amber-500 text-black px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 shadow">
              <Crown className="w-3 h-3 fill-black" />
              <span>GRAND PRIX</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between space-y-3 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Manga of the Year Grand Prix Winner
                </span>
                <span className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  <span>{grandWinner.rating}</span>
                </span>
              </div>

              <h3
                onClick={() => onSelectManga(grandWinner)}
                className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide text-white cursor-pointer hover:text-amber-400 transition"
              >
                {grandWinner.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                {grandWinner.synopsis}
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-200/90 italic">
              "{grandPrixCategory?.winnerCitation || 'Exceptional storytelling and artistry.'}"
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                onClick={() => onStartReading(grandWinner, grandWinner.chapters[0].id)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-black transition shadow"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Read Grand Winner</span>
              </button>

              <button
                onClick={() => onSelectManga(grandWinner)}
                className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2 text-xs font-semibold transition"
              >
                Details & Chapters
              </button>
            </div>
          </div>
        </div>

        {/* Category Winners Mini List (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>OTHER 2026 CATEGORY WINNERS</span>
            <button
              onClick={onOpenAwardsModal}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>See Citations</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {categories
              .filter((c) => c.id !== 'grand-prix')
              .slice(0, 3)
              .map((cat, idx) => {
                const manga = mangaList.find((m) => m.id === cat.winnerMangaId);
                if (!manga) return null;

                return (
                  <div
                    key={`moty-showcase-cat-${cat.id}-${idx}`}
                    onClick={() => onSelectManga(manga)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-2.5 hover:border-amber-500/40 hover:bg-slate-900 transition cursor-pointer group"
                  >
                    <img
                      src={manga.coverImage}
                      alt={manga.title}
                      className="h-14 w-11 rounded-lg object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <Award className="w-3 h-3" />
                        <span className="truncate">{cat.title.replace('AZ OVERVERSE ', '').replace('AZ Oververse ', '').replace('KA Plus: Africa Pulse ', '').replace('KA Plus ', '').replace('KA+ ', '')}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                        {manga.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        By {manga.author} • {manga.rating} ★
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
