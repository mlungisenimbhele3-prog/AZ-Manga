import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Bell,
  BellRing,
  BellOff,
  UserCheck,
  UserPlus,
  BookOpen,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search,
  ChevronRight,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import {
  FollowedCreator,
  getFollowedCreators,
  subscribeToFollowedCreators,
  toggleFollowCreator,
  updateCreatorNotificationPreferences,
} from '../../services/creatorFollowService';
import { Manga } from '../../types';

interface FollowedCreatorsViewProps {
  mangaList: Manga[];
  onSelectDetailManga: (manga: Manga) => void;
  onStartReading: (chapterId: string) => void;
  onBackToCatalog?: () => void;
}

export const FollowedCreatorsView: React.FC<FollowedCreatorsViewProps> = ({
  mangaList,
  onSelectDetailManga,
  onStartReading,
  onBackToCatalog,
}) => {
  const [creators, setCreators] = useState<FollowedCreator[]>(() => getFollowedCreators());
  const [pulsingId, setPulsingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'Author' | 'Artist' | 'Producer'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToFollowedCreators((next) => {
      setCreators(next);
    });
  }, []);

  const handleToggleFollow = async (creator: FollowedCreator) => {
    setPulsingId(creator.id);
    setTimeout(() => setPulsingId(null), 480);

    const isNowFollowing = await toggleFollowCreator({
      name: creator.name,
      role: creator.role,
      avatarUrl: creator.avatarUrl,
      bio: creator.bio,
      studioName: creator.studioName,
    });

    setToastMessage(
      isNowFollowing
        ? `Subscribed to push alerts for ${creator.name}!`
        : `Unfollowed ${creator.name}.`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleNotification = (creatorId: string, currentVal: boolean) => {
    updateCreatorNotificationPreferences(creatorId, {
      notifyOnNewChapter: !currentVal,
      notifyOnNewSeries: !currentVal,
    });
    setToastMessage(!currentVal ? 'Push alerts enabled for new chapters & series!' : 'Push alerts paused for this creator.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredCreators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return creators.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.studioName && c.studioName.toLowerCase().includes(q)) ||
        (c.bio && c.bio.toLowerCase().includes(q));
      const matchesRole = filterRole === 'ALL' || c.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [creators, searchQuery, filterRole]);

  // Curated recommendations if user has unfollowed everyone
  const recommendedCreators = [
    {
      name: 'Sipho Zulu',
      role: 'Author' as const,
      studio: 'Amadlozi Comics Lab',
      bio: 'Author of The Spear of Shaka: Origins.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Mlungiseni Mbhele',
      role: 'Producer' as const,
      studio: 'AZ OVERVERSE Studios',
      bio: 'Executive Producer of AZ OVERVERSE & Manga of the Year curator.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Nandi Dlamini',
      role: 'Artist' as const,
      studio: 'Ink & Bead Studios',
      bio: 'Lead Illustrator of The Spear of Shaka & Afro-Mythology series.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    },
    {
      name: 'Kagiso Khumalo',
      role: 'Author' as const,
      studio: 'Jozi Manga Ink',
      bio: 'Author of Taxi Wars: Jozi Nights and Kasi-Punk thrillers.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div id="followed-creators-section" className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 rounded-2xl bg-amber-500 text-black px-4 py-2.5 font-bold text-xs shadow-2xl flex items-center gap-2 animate-fadeIn border border-amber-400">
          <BellRing className="w-4 h-4 text-black shrink-0 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              <span>COMMUNITY & CREATOR NETWORK</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Followed Authors & Artists
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Stay connected with your favorite mangaka and digital illustrators. You will automatically receive real-time push alerts whenever followed creators premiere new chapters or launch new series on AZ OVERVERSE.
            </p>
          </div>

          {onBackToCatalog && (
            <button
              onClick={onBackToCatalog}
              className="self-start sm:self-center flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold px-4 py-2 text-xs transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </button>
          )}
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Followed Creators</span>
            <span className="text-xl font-black text-amber-400 font-mono">{creators.length}</span>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Connected Series</span>
            <span className="text-xl font-black text-white font-mono">
              {creators.reduce((acc, c) => acc + (c.seriesCount || 1), 0)}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Push Alerts Active</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {creators.filter((c) => c.notifyOnNewChapter).length}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">70% Rev-Share Payouts</span>
            <span className="text-xl font-black text-cyan-400 font-mono">Active</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search followed authors, artists, studios..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'Author', 'Artist', 'Producer'] as const).map((role) => (
            <button
              key={`role-filter-${role}`}
              onClick={() => setFilterRole(role)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition shrink-0 ${
                filterRole === role
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Followed Creators List */}
      {filteredCreators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCreators.map((creator) => {
            const isPulsing = pulsingId === creator.id;
            // Find any manga by this creator in current catalog
            const creatorMangas = mangaList.filter(
              (m) =>
                m.author?.toLowerCase().trim() === creator.name.toLowerCase().trim() ||
                m.artist?.toLowerCase().trim() === creator.name.toLowerCase().trim()
            );

            return (
              <div
                key={creator.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-all hover:border-amber-500/50 hover:bg-slate-900 shadow-lg"
              >
                <div>
                  {/* Top Creator Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className="h-14 w-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md group-hover:border-amber-400/80 transition-colors"
                        />
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-0.5 text-black shadow-md" title="Verified Creator">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                            {creator.name}
                          </h3>
                        </div>
                        <span className="inline-block rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider mt-0.5">
                          {creator.role}
                        </span>
                        {creator.studioName && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                            {creator.studioName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Follow Toggle Button with .follow-button and subtle pulse animation */}
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(creator)}
                      className={`follow-button flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all duration-200 select-none shadow-sm cursor-pointer ${
                        isPulsing
                          ? 'scale-95 animate-pulse ring-2 ring-amber-400 bg-amber-500/30'
                          : 'hover:scale-[1.03] active:scale-95'
                      } bg-amber-500/20 border-amber-500/60 text-amber-300 hover:bg-rose-950/60 hover:border-rose-500/60 hover:text-rose-300`}
                      title="Click to toggle follow"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Following</span>
                    </button>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-xs text-slate-300 mt-3.5 leading-relaxed line-clamp-2">
                      {creator.bio}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                    <span>
                      <strong className="text-white">{creator.followersCount.toLocaleString()}</strong> followers
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-white">{creator.seriesCount || creatorMangas.length || 1}</strong> series
                    </span>
                  </div>

                  {/* Creator's Series in Catalog */}
                  {creatorMangas.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                        Published Series:
                      </span>
                      <div className="space-y-1.5">
                        {creatorMangas.slice(0, 2).map((m) => (
                          <div
                            key={m.id}
                            onClick={() => onSelectDetailManga(m)}
                            className="flex items-center justify-between rounded-xl bg-slate-950/70 border border-slate-800/80 p-2 hover:border-amber-500/40 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={m.coverImage}
                                alt={m.title}
                                className="h-8 w-6 rounded object-cover shrink-0"
                              />
                              <span className="text-xs font-bold text-slate-200 truncate">{m.title}</span>
                            </div>
                            <span className="text-[10px] text-amber-400 font-semibold shrink-0 flex items-center gap-1">
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Notification Switch */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Bell className={`w-3.5 h-3.5 ${creator.notifyOnNewChapter ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span>Push Alerts</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleNotification(creator.id, creator.notifyOnNewChapter)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition flex items-center gap-1 ${
                      creator.notifyOnNewChapter
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {creator.notifyOnNewChapter ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3 h-3" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State with Discovery / Recommendations */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Users className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">No Creators Found</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {searchQuery
                ? `No creators matched "${searchQuery}". Try clearing your search.`
                : 'You are not following any authors or artists yet. Follow creators below to receive instant push alerts whenever they release new chapters or series!'}
            </p>
          </div>

          {/* Recommended Creators to Follow */}
          <div className="text-left space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Mangaka & Authors:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedCreators.map((rec) => (
                <div
                  key={rec.name}
                  className="flex items-center justify-between rounded-2xl bg-slate-900 border border-slate-800 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={rec.avatarUrl}
                      alt={rec.name}
                      className="h-10 w-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{rec.name}</h5>
                      <span className="text-[10px] text-amber-400 font-semibold">{rec.role}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleToggleFollow({
                        id: `creator-${rec.name.toLowerCase().replace(/\s+/g, '-')}`,
                        name: rec.name,
                        role: rec.role,
                        avatarUrl: rec.avatarUrl,
                        bio: rec.bio,
                        studioName: rec.studio,
                        followersCount: 15000,
                        seriesCount: 2,
                        seriesTitles: [],
                        followedAt: new Date().toISOString(),
                        notifyOnNewChapter: true,
                        notifyOnNewSeries: true,
                      })
                    }
                    className="follow-button flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 text-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
