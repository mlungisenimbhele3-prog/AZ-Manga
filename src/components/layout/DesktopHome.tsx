import React from 'react';
import { Manga } from '../../types';
import { MangaCard } from '../manga/MangaCard';
import { MangaCoverImage } from '../common/MangaCoverImage';
import { SouthAfricaFlameLogo } from '../common/SouthAfricaFlameLogo';
import { RecommendationsTray } from '../recommendations/RecommendationsTray';
import { UserTasteProfile } from '../../services/recommendationEngine';
import {
  Search,
  Upload,
  BookOpen,
  Sparkles,
  Wallet,
  Trophy,
  MessageSquare,
  Flame,
  Star,
  Play,
  Heart,
  ChevronRight,
  ShieldCheck,
  Bot,
  RefreshCw,
  Crown,
  Layers,
  X,
  Plus,
} from 'lucide-react';

export interface DesktopHomeProps {
  mangaList: Manga[];
  filteredManga: Manga[];
  featuredManga: Manga | null;
  favoriteIds: string[];
  onToggleFavorite: (mangaId: string) => void;
  onStartReading: (manga: Manga, chapterId: string) => void;
  onSelectDetailManga: (manga: Manga) => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  isVipUser: boolean;
  ads: any[];
  onOpenSubscriptionModal: () => void;
  onOpenCreatorDashboard: () => void;
  onOpenPublishModal: () => void;
  onNavigateToAwards: () => void;
  onNavigateToWallet: () => void;
  onNavigateToStudio: () => void;
  onNavigateToChats: () => void;
  onNavigateToCanvas?: () => void;
  onOpenAiReport?: (manga: Manga) => void;
  onRunAiScanCatalog?: () => void;
  isScanningAi?: boolean;
  activeTab?: string;
  onOpenTasteProfileModal?: () => void;
  userTasteProfile?: UserTasteProfile;
  isAdmin?: boolean;
}

export const DesktopHome: React.FC<DesktopHomeProps> = ({
  mangaList,
  filteredManga,
  featuredManga,
  favoriteIds,
  onToggleFavorite,
  onStartReading,
  onSelectDetailManga,
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  onClearSearch,
  isVipUser,
  onOpenSubscriptionModal,
  onOpenCreatorDashboard,
  onOpenPublishModal,
  onNavigateToAwards,
  onNavigateToWallet,
  onNavigateToStudio,
  onNavigateToChats,
  onNavigateToCanvas,
  onOpenAiReport,
  onRunAiScanCatalog,
  isScanningAi = false,
  activeTab = 'readers',
  onOpenTasteProfileModal,
  userTasteProfile,
  isAdmin = false,
}) => {
  const aiMangaCount = mangaList.filter((m) => m.isAiGenerated && !m.isBanned).length;
  const bannedCount = mangaList.filter((m) => m.isBanned).length;

  const spotlightManga = featuredManga || mangaList[0];

  const isDefaultView = selectedFilter === 'all' && !searchQuery;
  const originalSeries = mangaList.filter((m) => m.isOriginal && m.id !== 'placeholder');
  const canvasSeries = mangaList.filter((m) => (!m.isOriginal || m.isCanvas || m.isBackdrop) && m.id !== 'placeholder');

  return (
    <div id="shonen-desktop-home" className="flex w-full items-start gap-6 pt-2 pb-12">
      {/* =======================================================================
          LEFT SIDE: Logo + Home / Studio / Wallet (Vertical Sidebar)
          ======================================================================= */}
      <aside className="w-64 shrink-0 sticky top-24 space-y-4">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-md p-4 shadow-xl">
          {/* Logo & Magazine Branding */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <SouthAfricaFlameLogo size="sm" variant="sa_flag" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Bebas_Neue',sans-serif] text-xl tracking-wider text-white">
                  AZ <span className="text-amber-400">OVERVERSE</span>
                </span>
                <span className="rounded bg-amber-500 text-black font-black text-[9px] px-1.5 py-0.2 tracking-wider">
                  MANGA
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
                Manga Magazine & Studio
              </p>
            </div>
          </div>

          {/* Navigation Links: Home / Studio / Wallet */}
          <nav className="mt-3 space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 py-1">
              Magazine Menu
            </div>

            {/* Home / Readers */}
            <button
              onClick={() => onSelectFilter('all')}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                activeTab === 'readers' && selectedFilter === 'all'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Home / Readers</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                activeTab === 'readers' && selectedFilter === 'all'
                  ? 'bg-black/20 text-black'
                  : 'bg-slate-800 text-amber-400'
              }`}>
                FREE
              </span>
            </button>

            {/* AZ BACKDROP (Indie & Rising Creators) */}
            {onNavigateToCanvas && (
              <button
                onClick={onNavigateToCanvas}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>AZ BACKDROP</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  INDIE
                </span>
              </button>
            )}

            {/* Creator Studio */}
            <button
              onClick={onNavigateToStudio}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition group"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Creator Studio</span>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                70% REV
              </span>
            </button>

            {/* Community Chats */}
            <button
              onClick={onNavigateToChats}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition group ${
                activeTab === 'chats'
                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Community Chats</span>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300">
                CHATS
              </span>
            </button>

            {/* Wallet & Payouts - ONLY visible to Admin */}
            {isAdmin && (
              <button
                onClick={onNavigateToWallet}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition group ${
                  activeTab === 'wallet'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Wallet & Payouts</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300">
                  ZAR
                </span>
              </button>
            )}

            {/* Awards 2026 */}
            <button
              onClick={onNavigateToAwards}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition group"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Awards '26 Gala</span>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300">
                GALA
              </span>
            </button>

            {/* Community Chats */}
            <button
              onClick={onNavigateToChats}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white transition group"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Fan Club & Chats</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-blue-400">
                LIVE
              </span>
            </button>

            {/* Taste Profile & Recommendations */}
            {onOpenTasteProfileModal && (
              <button
                onClick={onOpenTasteProfileModal}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-950/40 border border-amber-500/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Taste Profile</span>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-black">
                  AI TASTE
                </span>
              </button>
            )}
          </nav>

          {/* Quick Upload Button */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={onOpenPublishModal}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-2.5 px-3 text-xs font-black transition shadow-lg shadow-amber-500/10 active:scale-98"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Manga Series</span>
            </button>
          </div>
        </div>

        {/* VIP Pass Card / Reader Status */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 p-4 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white">VIP Membership</span>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              isVipUser ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {isVipUser ? 'Active' : 'Free Tier'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {isVipUser
              ? 'Zero interruptions, early chapter simulpubs, and offline reading.'
              : 'Upgrade to remove all sponsor banner ads and unlock early chapter access.'}
          </p>

          <button
            onClick={onOpenSubscriptionModal}
            className="w-full rounded-xl border border-purple-500/40 hover:border-purple-400 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 py-1.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isVipUser ? 'Manage Subscription' : 'Upgrade (R89/mo)'}</span>
          </button>
        </div>

        {/* AI Artisan Protection Badge */}
        <div className="rounded-2xl border border-cyan-900/40 bg-slate-950/60 p-3 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Artisan Guard Active</span>
          </div>
          <span className="text-cyan-400 font-mono font-bold text-[10px]">
            {aiMangaCount} AI • {bannedCount} Ban
          </span>
        </div>
      </aside>

      {/* =======================================================================
          MIDDLE: Search Bar + [Upload] Button + Manga Grid 4 Columns
          ======================================================================= */}
      <section className="flex-1 min-w-0 space-y-5">
        {/* Search Bar + [Upload] Button Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search manga series, creators, genres..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* [Upload] Button */}
          <button
            id="desktop-middle-upload-btn"
            onClick={onOpenPublishModal}
            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-black transition shadow-lg shadow-amber-500/20 shrink-0 active:scale-95"
            title="Upload new manga series or chapter"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Upload</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Series' },
              { id: 'favorites', label: `❤️ Favorites (${favoriteIds.length})` },
              { id: 'moty_awards', label: '🏆 MOTY Awardees' },
              { id: 'Shonen', label: '🔥 Shonen' },
              { id: 'Seinen', label: '🛡️ Seinen' },
              { id: 'Romance', label: '💖 Romance' },
              { id: 'Slice of Life', label: '☕ Slice of Life' },
              { id: 'Action', label: '⚔️ Action' },
              { id: 'Fantasy', label: '✨ Fantasy' },
              { id: 'Sci-Fi', label: '🤖 Sci-Fi' },
              { id: 'Pan-African', label: '🌍 Pan-African' },
              { id: 'vip_only', label: 'VIP Pass' },
              { id: 'free_only', label: 'Free Chapters' },
            ].map((tab, idx) => (
              <button
                key={`desktop-tab-${tab.id}-${idx}`}
                onClick={() => onSelectFilter(tab.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedFilter === tab.id
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-semibold text-slate-400">
            <strong className="text-white">{filteredManga.length}</strong> titles • <span className="text-amber-400">4 per row</span>
          </span>
        </div>

        {/* Personalized Manga Recommendation Engine Tray */}
        {selectedFilter === 'all' && !searchQuery && (
          <RecommendationsTray
            mangaList={mangaList}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onSelectDetailManga={onSelectDetailManga}
            onStartReading={onStartReading}
            onOpenTasteProfileModal={onOpenTasteProfileModal || (() => {})}
            userTasteProfile={userTasteProfile}
          />
        )}

        {/* AZ Vertical-Style Separation on Homepage:
            1. KA+ ORIGINALS 👑 (Top horizontal scroll)
            2. BACKDROP - Rising Creators (4-column grid below)
            Fallback to filtered grid if a genre filter or search is active */}
        {filteredManga.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No manga found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No series match your current filter or search query.
            </p>
            <button
              onClick={onClearSearch}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition shadow"
            >
              Reset Filters
            </button>
          </div>
        ) : isDefaultView ? (
          <div className="space-y-8">
            {/* ==============================================================
                SECTION 1: AZ ORIGINALS 👑 (Top Horizontal Scroll)
                ============================================================== */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20">
                    <Crown className="w-4 h-4 fill-black stroke-black" />
                  </div>
                  <div>
                    <h3 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white flex items-center gap-2">
                      OVERVERSE <span className="text-amber-400">AZ ORIGINALS</span> 👑
                    </h3>
                    <p className="text-[11px] text-slate-400">Official flagship original serializations produced in-house</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/40 px-3 py-0.5 text-[10px] font-black uppercase text-amber-300">
                    {originalSeries.length} Originals Active
                  </span>
                </div>
              </div>

              {/* Horizontal Scroll Track or Empty State */}
              {originalSeries.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">No Originals yet - Publish your first</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    AZ OVERVERSE is waiting for its flagship original serializations. Be the pioneer mangaka to launch!
                  </p>
                  <button
                    onClick={onOpenPublishModal}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black px-4 py-2 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Your First Original</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-amber-500/30 overscroll-x-contain smooth-scroll-container">
                  {originalSeries.map((manga, idx) => (
                    <div key={`desktop-orig-${manga.id}-${idx}`} className="w-56 shrink-0">
                      <MangaCard
                        manga={manga}
                        isFavorite={favoriteIds.includes(manga.id)}
                        onToggleFavorite={(_e, id) => onToggleFavorite(id)}
                        onSelect={onSelectDetailManga}
                        onOpenAiReport={(_e, m) => onOpenAiReport?.(m)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ==============================================================
                SECTION 2: BACKDROP - Rising Creators (4 Columns Grid)
                ============================================================== */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 shadow">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white flex items-center gap-2">
                      BACKDROP <span className="text-slate-400">- Rising Creators</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Independent indie artists, African az verticals, and community stories</p>
                  </div>
                </div>

                {onNavigateToCanvas && (
                  <button
                    onClick={onNavigateToCanvas}
                    className="flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
                  >
                    <span>Explore All Backdrop</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 4 Columns Grid or Empty State */}
              {canvasSeries.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">No Backdrop series uploaded yet. Start publishing your indie manga!</p>
                  <button
                    onClick={onOpenPublishModal}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 text-xs font-bold transition"
                  >
                    Publish on Backdrop
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {canvasSeries.map((manga, idx) => (
                    <MangaCard
                      key={`desktop-canvas-${manga.id}-${idx}`}
                      manga={manga}
                      isFavorite={favoriteIds.includes(manga.id)}
                      onToggleFavorite={(_e, id) => onToggleFavorite(id)}
                      onSelect={onSelectDetailManga}
                      onOpenAiReport={(_e, m) => onOpenAiReport?.(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Filtered or Search View: Standard 4-column Grid */
          <div className="grid grid-cols-4 gap-4">
            {filteredManga.map((manga, idx) => (
              <MangaCard
                key={`desktop-filtered-${manga.id}-${idx}`}
                manga={manga}
                isFavorite={favoriteIds.includes(manga.id)}
                onToggleFavorite={(_e, id) => onToggleFavorite(id)}
                onSelect={onSelectDetailManga}
                onOpenAiReport={(_e, m) => onOpenAiReport?.(m)}
              />
            ))}
          </div>
        )}

        {/* Creator 70% Revenue Share Banner */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 flex items-center justify-between gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px] px-2 py-0.5 uppercase tracking-wider border border-emerald-500/30">
                Author & Artist Monetization
              </span>
              <span className="text-xs text-slate-400">70% Ad & Subscription Payouts</span>
            </div>
            <h4 className="text-sm font-black text-white mt-1">
              Publish Original Manga. Monetize via Google AdMob & Google Play Billing.
            </h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCreatorDashboard}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 text-xs font-bold transition"
            >
              Analytics
            </button>
            <button
              onClick={onOpenPublishModal}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-black transition shadow"
            >
              Upload Chapter
            </button>
          </div>
        </div>
      </section>

      {/* =======================================================================
          RIGHT SIDE: Featured Manga Large Banner
          ======================================================================= */}
      {spotlightManga && (
        <aside className="w-80 shrink-0 sticky top-24 space-y-4">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-md p-4 shadow-xl space-y-4">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>#1 FEATURED SPOTLIGHT</span>
              </span>
              {spotlightManga.award && (
                <span className="text-[10px] font-bold text-amber-300">
                  🏆 {spotlightManga.award.badge}
                </span>
              )}
            </div>

            {/* Poster / Artwork */}
            <div
              onClick={() => onSelectDetailManga(spotlightManga)}
              className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-slate-800 cursor-pointer shadow-lg"
            >
              <MangaCoverImage
                coverUrl={spotlightManga.coverUrl || (spotlightManga as any).cover || spotlightManga.coverImage}
                src={spotlightManga.coverUrl || (spotlightManga as any).cover || spotlightManga.coverImage}
                alt={spotlightManga.title}
                title={spotlightManga.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

              {/* Status Pills */}
              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                <span className="rounded bg-black/80 backdrop-blur-sm text-purple-300 text-[10px] font-bold px-2 py-0.5 border border-purple-500/30">
                  {spotlightManga.status}
                </span>
              </div>

              {/* Title & Metadata at bottom of poster */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-['Bebas_Neue',sans-serif] text-2xl tracking-wide text-white leading-tight drop-shadow">
                  {spotlightManga.title}
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  By {spotlightManga.author} • {spotlightManga.chapters.length} Chapters
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{spotlightManga.rating.toFixed(2)}</span>
                  <span className="text-slate-400 font-normal">•</span>
                  <span className="text-slate-300 font-normal">{spotlightManga.genres[0]}</span>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Synopsis
              </span>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {spotlightManga.synopsis}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                id="desktop-featured-read-btn"
                onClick={() => onStartReading(spotlightManga, spotlightManga.chapters[0].id)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-2.5 px-4 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-98"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Read Chapter 1 Free</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onToggleFavorite(spotlightManga.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs font-bold transition ${
                    favoriteIds.includes(spotlightManga.id)
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                      : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${
                    favoriteIds.includes(spotlightManga.id) ? 'fill-rose-500 text-rose-500' : ''
                  }`} />
                  <span>{favoriteIds.includes(spotlightManga.id) ? 'Favorited' : 'Favorite'}</span>
                </button>

                <button
                  onClick={() => onSelectDetailManga(spotlightManga)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 px-3 text-xs font-bold transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chapters</span>
                </button>
              </div>
            </div>

            {/* Weekly Issue Notification */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-2.5 text-center text-[10px] text-amber-300 font-semibold">
              Weekly Shonen Pulse Issue #42 Simulpub Available
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
