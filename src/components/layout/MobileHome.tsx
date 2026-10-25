import React from 'react';
import { motion } from 'motion/react';
import { Manga } from '../../types';
import { MangaCard } from '../manga/MangaCard';
import { MangaGrid } from '../manga/MangaGrid';
import { RecommendationsTray } from '../recommendations/RecommendationsTray';
import { UserTasteProfile } from '../../services/recommendationEngine';
import {
  Search,
  X,
  BookOpen,
  Upload,
  Flame,
  Sparkles,
  SlidersHorizontal,
  Crown,
  Plus,
} from 'lucide-react';

export interface MobileHomeProps {
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
  onOpenAiReport?: (manga: Manga) => void;
  onOpenTasteProfileModal?: () => void;
  userTasteProfile?: UserTasteProfile;
  onNavigateToCanvas?: () => void;
}

export const MobileHome: React.FC<MobileHomeProps> = ({
  mangaList,
  filteredManga,
  favoriteIds,
  onToggleFavorite,
  onStartReading,
  onSelectDetailManga,
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onOpenPublishModal,
  onOpenAiReport,
  onOpenTasteProfileModal,
  userTasteProfile,
  onNavigateToCanvas,
}) => {
  const isDefaultView = selectedFilter === 'all' && !searchQuery;
  const originalSeries = mangaList.filter((m) => m.isOriginal && m.id !== 'placeholder');
  const canvasSeries = mangaList.filter((m) => (!m.isOriginal || m.isCanvas || m.isBackdrop) && m.id !== 'placeholder');
  return (
    <div id="shonen-mobile-home" className="space-y-4 pb-6">
      {/* Mobile Top Search Bar + Upload Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Taste Profile button */}
        {onOpenTasteProfileModal && (
          <button
            onClick={onOpenTasteProfileModal}
            className="flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 px-2.5 py-2 text-xs font-bold transition shadow shrink-0"
            title="Taste Profile"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden min-[380px]:inline">Taste</span>
          </button>
        )}

        <button
          onClick={onOpenPublishModal}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 text-xs font-black transition shadow shrink-0"
          title="Upload series"
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload</span>
        </button>
      </div>

      {/* Filter Pills (Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All' },
          { id: 'favorites', label: `❤️ Favs (${favoriteIds.length})` },
          { id: 'moty_awards', label: '🏆 MOTY' },
          { id: 'Shonen', label: '🔥 Shonen' },
          { id: 'Seinen', label: '🛡️ Seinen' },
          { id: 'Romance', label: '💖 Romance' },
          { id: 'Slice of Life', label: '☕ Slice of Life' },
          { id: 'Action', label: '⚔️ Action' },
          { id: 'Fantasy', label: '✨ Fantasy' },
          { id: 'Sci-Fi', label: '🤖 Sci-Fi' },
          { id: 'vip_only', label: 'VIP Pass' },
          { id: 'free_only', label: 'Free' },
        ].map((tab, idx) => (
          <button
            key={`mobile-tab-${tab.id}-${idx}`}
            onClick={() => onSelectFilter(tab.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition shrink-0 ${
              selectedFilter === tab.id
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Personalized Recommendations Tray */}
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

      {/* AZ Vertical-Style Separation on Mobile:
          1. KA+ ORIGINALS 👑 (Top horizontal scroll)
          2. BACKDROP - Rising Creators (2-column mobile grid below) */}
      {filteredManga.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No manga found</h4>
          <p className="text-[11px] text-slate-400">Try adjusting your search query.</p>
          <button
            onClick={onClearSearch}
            className="rounded-lg bg-amber-500 text-black px-3 py-1.5 text-xs font-bold"
          >
            Clear Search
          </button>
        </div>
      ) : isDefaultView ? (
        <div className="space-y-6">
          {/* SECTION 1: AZ ORIGINALS 👑 (Horizontal Scroll) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-['Bebas_Neue',sans-serif] tracking-wide text-white flex items-center gap-1">
                  OVERVERSE <span className="text-amber-400">AZ ORIGINALS</span> 👑
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.2 rounded-full uppercase">
                {originalSeries.length} Titles
              </span>
            </div>

            {originalSeries.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center space-y-2.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crown className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">No Originals yet - Publish your first</h4>
                <p className="text-[11px] text-slate-400">
                  AZ OVERVERSE is waiting for its first flagship original manga!
                </p>
                <button
                  onClick={onOpenPublishModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-black px-3.5 py-1.5 text-xs font-black shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish First Original</span>
                </button>
              </div>
            ) : (
              <motion.div
                key={`mobile-orig-track-${selectedFilter}-${searchQuery}`}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
                  },
                }}
                className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain smooth-scroll-container"
              >
                {originalSeries.map((manga, idx) => (
                  <motion.div
                    key={`mobile-orig-${manga.id}-${idx}`}
                    variants={{
                      hidden: { opacity: 0, y: 16, scale: 0.96 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                      },
                    }}
                    className="w-40 shrink-0"
                  >
                    <MangaCard
                      manga={manga}
                      isFavorite={favoriteIds.includes(manga.id)}
                      onToggleFavorite={(_e, id) => onToggleFavorite(id)}
                      onSelect={onSelectDetailManga}
                      onOpenAiReport={(_e, m) => onOpenAiReport?.(m)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* SECTION 2: BACKDROP - Rising Creators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-['Bebas_Neue',sans-serif] tracking-wide text-white">
                BACKDROP <span className="text-slate-400">- Rising Creators</span>
              </span>
              {onNavigateToCanvas && (
                <button
                  onClick={onNavigateToCanvas}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300"
                >
                  View All &gt;
                </button>
              )}
            </div>

            <MangaGrid
              mangaList={canvasSeries}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectDetailManga}
              onOpenAiReport={onOpenAiReport}
              columns={2}
              filterKey={`mobile-backdrop-${selectedFilter}-${searchQuery}`}
            />
          </div>
        </div>
      ) : (
        /* Filtered Search Grid */
        <MangaGrid
          mangaList={filteredManga}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelectDetailManga}
          onOpenAiReport={onOpenAiReport}
          columns={2}
          filterKey={`mobile-filtered-${selectedFilter}-${searchQuery}`}
        />
      )}
    </div>
  );
};

