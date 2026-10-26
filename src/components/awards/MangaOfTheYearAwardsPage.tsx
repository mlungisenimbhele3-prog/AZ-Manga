import React, { useState } from 'react';
import { AwardCategory, Manga } from '../../types';
import {
  Trophy,
  Crown,
  Award,
  Sparkles,
  Flame,
  Star,
  Play,
  Heart,
  BookOpen,
  CheckCircle2,
  Share2,
  ChevronRight,
  ArrowLeft,
  Users,
  Shield,
} from 'lucide-react';

interface MangaOfTheYearAwardsPageProps {
  categories: AwardCategory[];
  mangaList: Manga[];
  onStartReading: (manga: Manga, chapterId: string) => void;
  onSelectManga: (manga: Manga) => void;
  onNavigateToReader: () => void;
}

export const MangaOfTheYearAwardsPage: React.FC<MangaOfTheYearAwardsPageProps> = ({
  categories,
  mangaList,
  onStartReading,
  onSelectManga,
  onNavigateToReader,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'grand-prix');
  
  // Track votes per category in state + localStorage
  const [userVotes, setUserVotes] = useState<Record<string, string>>(() => {
    const savedVotes: Record<string, string> = {};
    categories.forEach((cat) => {
      const stored = localStorage.getItem(`ka_moty_voted_${cat.id}`);
      if (stored) {
        savedVotes[cat.id] = stored;
      }
    });
    return savedVotes;
  });

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      cat.nominees.forEach((nom) => {
        counts[`${cat.id}_${nom.mangaId}`] = nom.votes;
      });
    });
    return counts;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const winnerManga = mangaList.find((m) => m.id === activeCategory.winnerMangaId) || mangaList[0];

  const handleCastVote = (categoryId: string, mangaId: string, mangaTitle: string, catTitle: string) => {
    const currentVoted = userVotes[categoryId];
    if (currentVoted === mangaId) return; // already voted for this candidate

    setVoteCounts((prev) => {
      const key = `${categoryId}_${mangaId}`;
      const prevKey = currentVoted ? `${categoryId}_${currentVoted}` : null;
      return {
        ...prev,
        [key]: (prev[key] || 0) + 1,
        ...(prevKey && prev[prevKey] ? { [prevKey]: Math.max(0, prev[prevKey] - 1) } : {}),
      };
    });

    setUserVotes((prev) => ({
      ...prev,
      [categoryId]: mangaId,
    }));
    localStorage.setItem(`ka_moty_voted_${categoryId}`, mangaId);

    setToastMessage(`🎉 Official vote cast for "${mangaTitle}" in ${catTitle}!`);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Total votes in the selected category
  const totalCategoryVotes = activeCategory.nominees.reduce((sum, nom) => {
    return sum + (voteCounts[`${activeCategory.id}_${nom.mangaId}`] || nom.votes);
  }, 0);

  const grandPrixCategory = categories.find((c) => c.id === 'grand-prix') || categories[0];
  const grandWinnerManga = mangaList.find((m) => m.id === grandPrixCategory.winnerMangaId) || mangaList[0];

  return (
    <div id="manga-of-the-year-awards-page" className="space-y-10 pb-16">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-amber-500 text-black px-5 py-3 text-xs font-black shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 fill-black text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Gala Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <button
          onClick={onNavigateToReader}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-400 transition bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reader Page</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 text-[11px] font-bold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>ANNUAL GALA {new Date().getFullYear()} EDITION</span>
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Executive Producer: Mlungiseni Mbhele
          </span>
        </div>
      </div>

      {/* Hero Gala Stage Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/50 via-slate-950 to-slate-950 p-6 sm:p-12 shadow-2xl">
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1 text-xs font-black text-amber-300 tracking-wider uppercase shadow-sm">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>OFFICIAL AZ OVERVERSE CEREMONY</span>
          </div>

          <h1 className="font-['Bebas_Neue',sans-serif] text-4xl sm:text-6xl lg:text-7xl tracking-wide text-white drop-shadow-md">
            MANGA OF THE YEAR <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">AWARDS 2026</span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
            Honoring the pinnacle of Pan-African visual storytelling, groundbreaking fight choreography, and indigenous mythology. Explore category awardees and cast your official vote for the Reader’s Choice awards.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onStartReading(grandWinnerManga, grandWinnerManga.chapters[0].id)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black px-6 py-3 text-xs font-black transition shadow-lg shadow-amber-500/30"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Read Grand Prix Winner</span>
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('moty-category-voting-arena');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-slate-900/80 hover:bg-slate-800 text-amber-300 px-5 py-3 text-xs font-bold transition"
            >
              <Award className="w-4 h-4" />
              <span>Vote in Categories</span>
            </button>
          </div>
        </div>

        {/* Gala Metrics Pills */}
        <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-amber-500/20 pt-6">
          <div className="rounded-2xl bg-slate-900/60 border border-amber-500/20 p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-black text-amber-400 font-mono">6</span>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Categories</span>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-amber-500/20 p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-black text-emerald-400 font-mono">54,000+</span>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Reader Votes</span>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-amber-500/20 p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-black text-white font-mono">70% ZAR</span>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Creator Royalties</span>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-amber-500/20 p-3.5 text-center">
            <span className="block text-xl sm:text-2xl font-black text-yellow-300 font-mono">#1 Pan-Africa</span>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Official Gala</span>
          </div>
        </div>
      </div>

      {/* Supreme Grand Prix Winner Podium */}
      <div className="rounded-3xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-lg">
            <Crown className="w-5 h-5 fill-black" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              SUPREME RECOGNITION
            </span>
            <h2 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wide text-white">
              MANGA OF THE YEAR <span className="text-amber-400">GRAND PRIX WINNER</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Cover Art with Gold Halo */}
          <div className="lg:col-span-4 flex justify-center">
            <div
              className="relative group cursor-pointer"
              onClick={() => onSelectManga(grandWinnerManga)}
            >
              <img
                src={grandWinnerManga.coverImage}
                alt={grandWinnerManga.title}
                className="h-80 w-56 rounded-2xl object-cover border-2 border-amber-400 shadow-2xl shadow-amber-500/20 group-hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 rounded-lg bg-amber-500 text-black px-2.5 py-1 text-[10px] font-black uppercase flex items-center gap-1 shadow-lg">
                <Crown className="w-3.5 h-3.5 fill-black" />
                <span>GOLD WINNER</span>
              </div>
            </div>
          </div>

          {/* Winner Details & Official Citation */}
          <div className="lg:col-span-8 space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-black text-amber-300">
                ★ 4.96 Rating
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 font-mono">
                {grandWinnerManga.views.toLocaleString()} Total Reads
              </span>
              <span className="rounded-md bg-purple-900/60 border border-purple-500/30 px-2.5 py-1 text-xs font-bold text-purple-200">
                Pan-African Action / Sci-Fi
              </span>
            </div>

            <h3
              onClick={() => onSelectManga(grandWinnerManga)}
              className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-5xl tracking-wide text-white hover:text-amber-400 transition cursor-pointer"
            >
              {grandWinnerManga.title}
            </h3>

            <p className="text-xs text-amber-300 font-medium">
              Written & Illustrated by <strong>{grandWinnerManga.author}</strong> • Executive Producer: Mlungiseni Mbhele
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {grandWinnerManga.synopsis}
            </p>

            {/* Advisory Board Citation Box */}
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Official Jury Citation
              </span>
              <p className="text-xs sm:text-sm text-amber-100 italic leading-relaxed">
                "{grandPrixCategory.winnerCitation}"
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onStartReading(grandWinnerManga, grandWinnerManga.chapters[0].id)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-black transition shadow-lg"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Read Episode 1: The Golden Shell</span>
              </button>

              <button
                onClick={() => onSelectManga(grandWinnerManga)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>View All Chapters ({grandWinnerManga.chapters.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Voting Arena */}
      <div id="moty-category-voting-arena" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide text-white">
              CATEGORY AWARDS & <span className="text-amber-400">COMMUNITY VOTING</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select any category below to view winner citations, compare nominees, and register your reader vote.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <Users className="w-4 h-4" />
            <span>Live Voting Active</span>
          </div>
        </div>

        {/* Category Pills Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategoryId === cat.id;
            const hasVotedInCat = Boolean(userVotes[cat.id]);

            return (
              <button
                key={`moty-page-cat-${cat.id}-${idx}`}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-amber-500/20 font-black'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <Award className={`w-3.5 h-3.5 ${isSelected ? 'fill-black text-black' : 'text-amber-400'}`} />
                <span>{cat.title.replace('AZ OVERVERSE ', '').replace('AZ Oververse ', '').replace('KA Plus: Africa Pulse ', '').replace('KA Plus ', '').replace('KA+ ', '')}</span>
                {hasVotedInCat && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                    isSelected ? 'bg-black text-amber-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    Voted ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Category Header Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase">
                  {activeCategory.year} CATEGORY SPOTLIGHT
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Total Votes: {totalCategoryVotes.toLocaleString()}
                </span>
              </div>
              <h4 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl text-white">
                {activeCategory.title}
              </h4>
              <p className="text-xs text-slate-400">{activeCategory.subtitle}</p>
            </div>

            {winnerManga && (
              <div className="flex items-center gap-3 bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3">
                <img
                  src={winnerManga.coverImage}
                  alt={winnerManga.title}
                  className="h-12 w-9 rounded-lg object-cover border border-amber-400 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase text-amber-400 block">
                    Gold Laureate
                  </span>
                  <span className="text-xs font-bold text-white block truncate max-w-[140px]">
                    {winnerManga.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Winner Citation */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Category Winner Citation
            </span>
            <p className="text-xs text-slate-200 italic leading-relaxed">
              "{activeCategory.winnerCitation}"
            </p>
          </div>

          {/* Nominees Grid & Interactive Voting */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Official Nominees & Reader Standings</span>
              <span className="text-[11px] text-amber-400 lowercase font-normal">
                Click "Vote" to support your series
              </span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCategory.nominees.map((nom, idx) => {
                const manga = mangaList.find((m) => m.id === nom.mangaId);
                if (!manga) return null;

                const currentCount = voteCounts[`${activeCategory.id}_${nom.mangaId}`] || nom.votes;
                const percentage = totalCategoryVotes > 0 ? ((currentCount / totalCategoryVotes) * 100).toFixed(1) : '0';
                const isWinner = manga.id === activeCategory.winnerMangaId;
                const isUserVote = userVotes[activeCategory.id] === manga.id;

                return (
                  <div
                    key={`moty-page-nom-${nom.mangaId}-${idx}`}
                    className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition ${
                      isWinner
                        ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-slate-900/90 shadow-lg shadow-amber-950/30'
                        : isUserVote
                        ? 'border-emerald-500/60 bg-slate-900/90 shadow-lg shadow-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex gap-3">
                        <img
                          src={manga.coverImage}
                          alt={manga.title}
                          onClick={() => onSelectManga(manga)}
                          className="h-28 w-20 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition"
                          referrerPolicy="no-referrer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {isWinner && (
                              <span className="rounded bg-amber-500 text-black px-1.5 py-0.2 text-[9px] font-black uppercase">
                                Winner
                              </span>
                            )}
                            <span className="text-[10px] text-amber-400 font-bold">
                              ★ {(manga.rating || 0).toFixed(1)}
                            </span>
                          </div>

                          <h6
                            onClick={() => onSelectManga(manga)}
                            className="text-sm font-bold text-white truncate cursor-pointer hover:text-amber-400 transition"
                          >
                            {manga.title}
                          </h6>
                          <p className="text-[10px] text-slate-400 truncate">
                            By {manga.author}
                          </p>

                          <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                            "{nom.nominationReason}"
                          </p>
                        </div>
                      </div>

                      {/* Vote Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>{currentCount.toLocaleString()} votes</span>
                          <span className="font-bold text-amber-300">{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isWinner
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                                : isUserVote
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, parseFloat(percentage)))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions: Vote & Read */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCastVote(activeCategory.id, manga.id, manga.title, activeCategory.title)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition shadow-sm ${
                          isUserVote
                            ? 'bg-emerald-500 text-black font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isUserVote ? 'fill-black' : 'text-rose-400'}`} />
                        <span>{isUserVote ? 'Voted' : 'Vote'}</span>
                      </button>

                      <button
                        onClick={() => onStartReading(manga, manga.chapters[0].id)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3 py-2 text-xs font-bold transition shadow"
                        title="Start reading chapter 1"
                      >
                        <Play className="w-3 h-3 fill-black" />
                        <span>Read</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hall of Fame & Executive Producer Statement */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center lg:justify-start gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Executive Producer Statement • Mlungiseni Mbhele
            </span>
            <h4 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl text-white">
              Building the Future of African Manga Publishing
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              "KA Plus: Africa Pulse was founded to elevate independent creators from South Africa, Nigeria, Kenya, Ghana and across the continent. By honoring these creators at the Manga of the Year Gala and guaranteeing 70% creator revenue shares through Google AdMob and Google Play Billing, we ensure the next generation of storytellers thrive."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToReader}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black px-5 py-2.5 text-xs font-black transition shadow-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore All Manga on Reader Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
