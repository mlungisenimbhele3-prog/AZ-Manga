import React, { useState } from 'react';
import { Manga, isMangaComingSoon } from '../types';
import { USD_TO_ZAR_RATE } from '../data/paymentData';
import { MangaCoverImage } from '../components/common/MangaCoverImage';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Coins,
  Crown,
  Eye,
  Star,
  BookOpen,
  Send,
  CheckCircle2,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Search,
} from 'lucide-react';

export interface BackdropPageProps {
  mangaList: Manga[];
  onSelectManga: (manga: Manga) => void;
  onStartReading: (manga: Manga, chapterId?: string) => void;
  onOpenPublishModal: () => void;
  onNavigateToHome: () => void;
  currentUserEmail?: string;
}

export const BackdropPage: React.FC<BackdropPageProps> = ({
  mangaList,
  onSelectManga,
  onStartReading,
  onOpenPublishModal,
  onNavigateToHome,
  currentUserEmail = 'reader@example.com',
}) => {
  const [filterType, setFilterType] = useState<'trending' | 'new' | 'top_earners'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingManga, setApplyingManga] = useState<Manga | null>(null);
  const [applicationPitch, setApplicationPitch] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);

  // All Backdrop series (isOriginal is false or isBackdrop/isCanvas is true)
  const backdropSeries = mangaList.filter((m) => !m.isOriginal || m.isBackdrop || m.isCanvas);

  // Filter & Sort
  const processedSeries = backdropSeries
    .filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (filterType === 'trending') {
        return (b.views || 0) * (b.rating || 1) - (a.views || 0) * (a.rating || 1);
      }
      if (filterType === 'new') {
        const aDate = a.chapters?.[0]?.releaseDate || '2026-09-01';
        const bDate = b.chapters?.[0]?.releaseDate || '2026-09-01';
        return bDate.localeCompare(aDate);
      }
      if (filterType === 'top_earners') {
        return (b.views || 0) - (a.views || 0);
      }
      return 0;
    });

  const handleApplyToOriginal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingManga) return;

    // Save application to localStorage for admin review
    try {
      const stored = localStorage.getItem('az_backdrop_original_applications') || localStorage.getItem('ka_canvas_original_applications') || '[]';
      const parsed = JSON.parse(stored);
      parsed.push({
        id: `app-orig-${Date.now()}`,
        mangaId: applyingManga.id,
        mangaTitle: applyingManga.title,
        author: applyingManga.author,
        applicantEmail: currentUserEmail,
        pitch: applicationPitch || 'Submitted for AZ ORIGINAL promotion.',
        views: applyingManga.views,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      });
      localStorage.setItem('az_backdrop_original_applications', JSON.stringify(parsed));
      window.dispatchEvent(new CustomEvent('az_backdrop_app_submitted'));
    } catch (err) {
      console.error(err);
    }

    setApplicationSuccess(
      `Application for "${applyingManga.title}" submitted to Admin Mlungiseni Mbhele (mlungisenimbhele3@gmail.com)! We will evaluate your art and storytelling for AZ ORIGINALS 👑 promotion.`
    );
    setApplyingManga(null);
    setApplicationPitch('');

    setTimeout(() => {
      setApplicationSuccess(null);
    }, 6000);
  };

  return (
    <div id="backdrop-page-container" className="mx-auto w-full max-w-7xl pb-24 space-y-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="font-['Bebas_Neue',sans-serif] text-4xl sm:text-6xl tracking-wide text-white leading-none">
            AZ <span className="text-slate-400">BACKDROP</span> <span className="text-amber-400">OVERVERSE</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The launchpad for Africa's next manga stars. Self-publish your original IP, grow a loyal fanbase, earn 70% from ads & VIP passes, and get promoted to <strong className="text-amber-400">AZ ORIGINALS</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenPublishModal}
              className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Publish on BACKDROP</span>
            </button>
            <button
              onClick={onNavigateToHome}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2.5 text-xs font-bold transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Explore AZ Originals</span>
            </button>
          </div>
        </div>

        {/* Ambient background watermark */}
        <div className="absolute -right-8 -bottom-8 pointer-events-none select-none text-[140px] font-black text-slate-800/20 font-['Bebas_Neue',sans-serif]">
          BACKDROP
        </div>
      </div>

      {/* Success Banner if application was submitted */}
      {applicationSuccess && (
        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/60 p-4 text-xs text-emerald-200 flex items-start gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">Application Dispatched Successfully</span>
            <p>{applicationSuccess}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('trending')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'trending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending</span>
          </button>

          <button
            onClick={() => setFilterType('new')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'new'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          <button
            onClick={() => setFilterType('top_earners')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterType === 'top_earners'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Top Earners</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Backdrop titles or creators..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Backdrop Series Grid */}
      {processedSeries.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Backdrop series found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Be the first creator to publish an indie serialization on AZ BACKDROP!
          </p>
          <button
            onClick={onOpenPublishModal}
            className="rounded-xl bg-amber-500 text-black px-4 py-2 text-xs font-bold"
          >
            Publish New Backdrop Manga
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {processedSeries.map((manga, idx) => {
            const isComingSoon = isMangaComingSoon(manga);
            // Earnings reduced to R0
            const earningsZAR = 0;

            return (
              <div
                key={`backdrop-series-${manga.id}-${idx}`}
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-600 hover:shadow-2xl transition duration-300"
              >
                {/* Fixed height h-48 cover container */}
                <div
                  onClick={() => onSelectManga(manga)}
                  className="relative h-48 w-full overflow-hidden rounded-t-xl bg-slate-950 cursor-pointer"
                >
                  <MangaCoverImage
                    src={manga.cover || manga.coverImage}
                    alt={manga.title}
                    title={manga.title}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top-left Badges */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/95 border border-slate-600 text-slate-300 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow">
                      <span>BACKDROP</span>
                    </span>
                    {isComingSoon && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-md">
                        <Clock className="w-2.5 h-2.5" />
                        <span>COMING SOON</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Stats */}
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-[11px] text-slate-300 z-10">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{(manga.rating || 4.8).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 bg-black/60 px-2 py-0.5 rounded-full font-mono text-[10px]">
                      <Eye className="w-3 h-3" />
                      <span>{manga.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => onSelectManga(manga)}
                      className="text-sm font-bold text-white hover:text-amber-400 transition cursor-pointer line-clamp-1"
                    >
                      {manga.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">By {manga.author}</p>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1.5 leading-relaxed">
                      {manga.synopsis}
                    </p>
                  </div>

                  {/* Earnings Preview */}
                  <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Earnings Preview</span>
                      <span className="font-mono tabular-nums text-xs font-black text-emerald-400">
                        R{earningsZAR}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                      70% Share
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => setApplyingManga(manga)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 py-2 px-3 text-xs font-bold transition"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Apply to become ORIGINAL</span>
                    </button>

                    {isComingSoon ? (
                      <button
                        onClick={() => onSelectManga(manga)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 py-2 px-3 text-xs font-bold transition shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Coming Soon • Panels in Production</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartReading(manga, manga.chapters[0]?.id)}
                        className="w-full flex items-center justify-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-1.5 px-3 text-xs font-semibold transition"
                      >
                        <span>Read Episode 1</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Apply to Become AZ ORIGINAL */}
      {applyingManga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/50 bg-slate-950 p-6 sm:p-7 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-['Bebas_Neue',sans-serif] text-2xl text-white">
                  Apply for AZ ORIGINAL Status
                </h3>
              </div>
              <button
                onClick={() => setApplyingManga(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Series: <strong className="text-white">{applyingManga.title}</strong>
              </p>
              <p>
                Creator: <strong className="text-amber-400">{applyingManga.author}</strong> ({currentUserEmail})
              </p>
              <p className="text-slate-400 leading-relaxed">
                AZ ORIGINALS receive front-page hero spotlight, dedicated marketing, premium serialization contracts, and prioritized treasury payouts from admin <strong className="text-amber-300">Mlungiseni Mbhele (mlungisenimbhele3@gmail.com)</strong>.
              </p>
            </div>

            <form onSubmit={handleApplyToOriginal} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Why should this series graduate to AZ ORIGINAL?
                </label>
                <textarea
                  rows={3}
                  value={applicationPitch}
                  onChange={(e) => setApplicationPitch(e.target.value)}
                  placeholder="Tell admin Mlungiseni about your weekly publishing cadence, narrative arc, and art craftsmanship..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Admin review guarantees 100% human artisan verification and original African storytelling.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingManga(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-black transition flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Official IP & Backdrop License Mandate */}
      <div className="pt-6 border-t border-slate-800 text-slate-400 text-xs text-center leading-relaxed">
        All AZ Originals are © AZ Oververse / Mlungiseni Mbhele. All Canvas works remain © their respective creators. AZ Oververse has non-exclusive license to display Backdrop works. Any re-upload without permission is prohibited.
      </div>
    </div>
  );
};
