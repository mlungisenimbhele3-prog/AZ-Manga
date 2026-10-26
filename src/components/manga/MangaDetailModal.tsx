import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, Manga, UserSubscription, Comment, BonusContentItem, isMangaComingSoon } from '../../types';
import { BonusContentViewerModal } from '../modals/BonusContentViewerModal';
import { getSimilarManga } from '../../services/recommendationEngine';
import { MangaCoverImage } from '../common/MangaCoverImage';
import { uploadCoverFile } from '../../services/coverStorage';
import { publishMangaToSupabase } from '../../services/supabase';
import { isMangaBookmarked, toggleMangaBookmark } from '../../services/userProfile';
import {
  X,
  Star,
  Eye,
  Bookmark,
  Sparkles,
  BookOpen,
  Calendar,
  Lock,
  Play,
  Heart,
  ChevronRight,
  Trophy,
  UploadCloud,
  MessageSquare,
  Send,
  ThumbsUp,
  User,
  Clock,
  Filter,
  Bot,
  ShieldAlert,
  Cpu,
  Crown,
  Zap,
  Download,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { isMangaRecentlyPublished } from './MangaCard';

interface MangaDetailModalProps {
  manga: Manga | null;
  isOpen: boolean;
  onClose: () => void;
  userSubscription: UserSubscription;
  onStartReading: (chapterId: string) => void;
  onRequestRewardedAd: (chapter: Chapter) => void;
  onUpgradeClick: () => void;
  onUploadChapterClick?: (mangaId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (mangaId: string) => void;
  comments: Comment[];
  onAddComment: (text: string, chapterNumber?: number) => void;
  onLikeComment?: (commentId: string) => void;
  onOpenAiReport?: (manga: Manga) => void;
  allManga?: Manga[];
  onSelectManga?: (manga: Manga) => void;
}

export const MangaDetailModal: React.FC<MangaDetailModalProps> = ({
  manga,
  isOpen,
  onClose,
  userSubscription,
  onStartReading,
  onRequestRewardedAd,
  onUpgradeClick,
  onUploadChapterClick,
  isFavorite = false,
  onToggleFavorite,
  comments,
  onAddComment,
  onLikeComment,
  onOpenAiReport,
  allManga = [],
  onSelectManga,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(() => manga ? isMangaBookmarked(manga.id) : false);
  const [cachedManga, setCachedManga] = useState<Manga | null>(manga);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<number | 'all'>('all');
  const [targetCommentChapter, setTargetCommentChapter] = useState<number | undefined>(undefined);
  const [readerName, setReaderName] = useState<string>(() => {
    return localStorage.getItem('ka_reader_username') || 'Reader';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (manga) {
      setCachedManga(manga);
      // Default discussion chapter to first chapter if available
      if (manga.chapters.length > 0) {
        setTargetCommentChapter(manga.chapters[0].number);
      }
    }
  }, [manga]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [selectedBonusItem, setSelectedBonusItem] = useState<BonusContentItem | null>(null);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadToast, setCoverUploadToast] = useState<string | null>(null);
  const modalId = React.useId();

  const activeManga = manga || cachedManga;

  const handleDetailCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeManga) return;
    try {
      setIsUploadingCover(true);
      const newCoverUrl = await uploadCoverFile(file);
      if (newCoverUrl) {
        const updated: Manga = {
          ...activeManga,
          coverUrl: newCoverUrl,
          coverImage: newCoverUrl,
          cover: newCoverUrl,
        };
        setCachedManga(updated);
        await publishMangaToSupabase(updated);
        setCoverUploadToast('Cover artwork uploaded & synced to cloud storage successfully!');
        setTimeout(() => setCoverUploadToast(null), 4500);
      }
    } catch (err) {
      console.error('Failed to upload cover:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };
  const isVipUser =
    userSubscription.tier === 'vip' ||
    userSubscription.tier === 'early_access' ||
    userSubscription.tier === 'patron';
  const hasEarlyAccess =
    userSubscription.tier === 'early_access' || userSubscription.tier === 'patron';
  const hasPatronAccess = userSubscription.tier === 'patron';
  const firstChapter = activeManga?.chapters[0];

  // Compute similar manga using recommendation engine content-based + collaborative affinity
  const similarManga = useMemo(() => {
    if (!activeManga || !allManga || allManga.length === 0) return [];
    return getSimilarManga(activeManga, allManga, 4);
  }, [activeManga, allManga]);

  // Filtered comments based on selected chapter tab
  const filteredComments = useMemo(() => {
    if (selectedChapterFilter === 'all') {
      return comments;
    }
    return comments.filter((c) => c.chapterNumber === selectedChapterFilter);
  }, [comments, selectedChapterFilter]);

  const handleNameChange = (name: string) => {
    const trimmed = name.slice(0, 20);
    setReaderName(trimmed);
    localStorage.setItem('ka_reader_username', trimmed);
  };

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;

    onAddComment(newCommentText.trim(), targetCommentChapter);
    setNewCommentText('');
  };

  const handleToggleLike = (commentId: string) => {
    setLikedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
    onLikeComment?.(commentId);
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 45) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Recently';
    }
  };

  const quickReactions = [
    '🔥 Peak Chapter!',
    'Mind-blown 🤯',
    'Incredible Artwork ✨',
    'Pan-African Gold 🇿🇦',
    'Need next chapter ASAP!',
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && activeManga && (
        <motion.div
          id="manga-detail-overlay"
          key="manga-detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
        >
          <motion.div
            id="manga-detail-modal"
            key="manga-detail-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 300,
              mass: 0.75,
            }}
            className="relative my-6 w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Cover Upload Toast Notification */}
            {coverUploadToast && (
              <div className="absolute top-4 left-4 right-16 z-30 rounded-xl bg-emerald-950/95 border border-emerald-500/80 p-3 text-xs text-emerald-200 shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{coverUploadToast}</span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 rounded-full bg-black/60 p-2 text-slate-300 hover:text-white hover:bg-black/80 backdrop-blur-sm transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Container */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {/* Hero Banner with Cover */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-950 shrink-0">
                <MangaCoverImage
                  coverUrl={activeManga.bannerImage || (activeManga as any).coverUrl || (activeManga as any).cover || activeManga.coverImage}
                  src={activeManga.bannerImage || (activeManga as any).coverUrl || (activeManga as any).cover || activeManga.coverImage}
                  alt={`${activeManga.title} banner`}
                  title={activeManga.title}
                  className="h-full w-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

                {/* Floating Header Info */}
                <div className="absolute bottom-4 left-6 right-6 flex items-end gap-5">
                  <div className="relative group/cover shrink-0">
                    <div className="h-32 w-24 sm:h-40 sm:w-28 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
                      <MangaCoverImage
                        coverUrl={(activeManga as any).coverUrl || (activeManga as any).cover || activeManga.coverImage}
                        src={(activeManga as any).coverUrl || (activeManga as any).cover || activeManga.coverImage}
                        alt={activeManga.title}
                        title={activeManga.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Upload Cover Overlay Affordance */}
                    <label
                      title="Upload new cover image (saves to cloud storage)"
                      className="absolute inset-0 rounded-xl bg-black/70 backdrop-blur-xs opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white p-2 text-center z-10"
                    >
                      {isUploadingCover ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-bold text-amber-300">Saving...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5 text-amber-400 mb-1" />
                          <span className="text-[10px] font-bold tracking-tight">Upload Cover</span>
                          <span className="text-[8px] text-slate-300">HTTPS Cloud</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingCover}
                        onChange={handleDetailCoverUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {isMangaComingSoon(activeManga) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-black font-black text-[9px] px-2.5 py-0.5 uppercase tracking-wider shadow-md shadow-amber-950/60 ring-1 ring-amber-300">
                          <Clock className="w-2.5 h-2.5 text-black" />
                          <span>COMING SOON</span>
                        </span>
                      )}
                      {isMangaRecentlyPublished(activeManga) && !isMangaComingSoon(activeManga) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 uppercase tracking-wider shadow-md shadow-emerald-950/60 ring-1 ring-emerald-300/80 animate-pulse">
                          <Sparkles className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                          <span>NEW RELEASE</span>
                        </span>
                      )}
                      <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {isMangaComingSoon(activeManga) ? 'COMING SOON' : activeManga.status}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        ★ {(activeManga.rating || 0).toFixed(1)} ({(activeManga.views || 0).toLocaleString()} reads)
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white truncate drop-shadow">
                      {activeManga.title}
                    </h2>
                    <p className="text-xs text-slate-300 truncate">
                      By {activeManga.author} • Art by {activeManga.artist}
                    </p>
                    <p className="text-[11px] text-amber-400/90 font-semibold mt-0.5">
                      Executive Producer: Mlungiseni Mbhele
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Banned Alert Banner */}
                {activeManga.isBanned && (
                  <div className="rounded-2xl border border-rose-500/80 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 p-4 flex items-center justify-between gap-3 shadow-lg shadow-rose-950/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md animate-pulse">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                            AUTO-BANNED CONTENT
                          </span>
                          <span className="text-[9px] text-white font-bold bg-rose-600 px-1.5 py-0.2 rounded font-mono">
                            {activeManga.aiConfidenceScore || 96}% AI Synthetic
                          </span>
                        </div>
                        <p className="text-xs text-rose-200 mt-0.5 leading-relaxed">
                          {activeManga.banReason || 'Quarantined due to unauthorized AI diffusion artwork violation.'}
                        </p>
                      </div>
                    </div>

                    {onOpenAiReport && (
                      <button
                        type="button"
                        onClick={() => onOpenAiReport(activeManga)}
                        className="rounded-xl border border-rose-400/60 bg-rose-900/60 hover:bg-rose-800 text-white px-3 py-1.5 text-xs font-bold shrink-0 transition"
                      >
                        Inspect Audit
                      </button>
                    )}
                  </div>
                )}

                {/* AI Generative Transparency Sticker Banner */}
                {!activeManga.isBanned && activeManga.isAiGenerated && (
                  <div className="rounded-2xl border border-cyan-500/60 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-cyan-950/40 p-4 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-black shadow-md">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                            AI TRANSPARENCY STICKER AFFIXED
                          </span>
                          <span className="text-[9px] text-cyan-200 font-bold bg-cyan-900/60 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono">
                            {activeManga.aiConfidenceScore || 84}% Confidence
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          This series contains disclosed or auto-detected generative modeling. Certified pursuant to AZ OVERVERSE Reader Disclosure standard.
                        </p>
                      </div>
                    </div>

                    {onOpenAiReport && (
                      <button
                        type="button"
                        onClick={() => onOpenAiReport(activeManga)}
                        className="rounded-xl border border-cyan-400/60 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 px-3 py-1.5 text-xs font-bold shrink-0 transition"
                      >
                        View AI Report
                      </button>
                    )}
                  </div>
                )}

                {/* Manga of the Year Honor Citation */}
                {activeManga.award && (
                  <div className="rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 p-3.5 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black shadow">
                        <Trophy className="w-5 h-5 fill-black" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                            {activeManga.award.category}
                          </span>
                          <span className="text-[9px] text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded">
                            MOTY '26 Gold Winner
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-0.5 italic leading-relaxed">
                          "{activeManga.award.citation}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Row & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeManga.genres.map((genre, idx) => (
                      <span
                        key={`${modalId}-genre-${genre}-${idx}`}
                        className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                        style={{
                          backgroundColor: getGenreColor(genre),
                        }}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="detail-toggle-favorite-btn"
                      onClick={() => onToggleFavorite?.(activeManga.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        isFavorite
                          ? 'border-rose-500 bg-rose-600/20 text-rose-300'
                          : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      }`}
                      title={isFavorite ? 'Remove from favorites' : 'Add to personal favorites collection'}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (manga) {
                          toggleMangaBookmark(manga.id, manga.title, manga.coverImage);
                          setIsBookmarked(!isBookmarked);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        isBookmarked
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                      <span>{isBookmarked ? 'In Library' : 'Add to Library'}</span>
                    </button>

                    {isMangaComingSoon(activeManga) ? (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 px-4 py-2 text-xs font-bold shadow-sm">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Coming Soon • Panels In Production</span>
                      </div>
                    ) : firstChapter ? (
                      <button
                        id="detail-start-reading-btn"
                        onClick={() => onStartReading(firstChapter.id)}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-black transition shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>Start Ch. 1</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Synopsis */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Synopsis
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeManga.synopsis}
                  </p>
                </div>

                {/* Chapters List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Chapters ({activeManga.chapters.length})</span>
                    </h4>
                    <div className="flex items-center gap-3">
                      {onUploadChapterClick && (
                        <button
                          id="detail-upload-chapter-btn"
                          onClick={() => onUploadChapterClick(activeManga.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-1 text-xs font-bold transition shadow-sm"
                          title={`Upload Chapter ${activeManga.chapters.length + 1} to ${activeManga.title}`}
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          <span>+ Upload Chapter</span>
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {isVipUser ? 'VIP All-Access' : 'Ad-Supported & Fast Pass'}
                      </span>
                    </div>
                  </div>

                  {activeManga.chapters.length === 0 ? (
                    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-950 p-6 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-block rounded-full bg-amber-500 text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            COMING SOON
                          </span>
                        </div>
                        <h5 className="text-base font-bold text-white">No Panels Uploaded Yet</h5>
                        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                          The mangaka is currently drawing and producing the official story panels for this serialization. Bookmark or add to your library to be alerted as soon as Chapter 1 drops!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden max-h-72 overflow-y-auto">
                    {activeManga.chapters.map((ch, idx) => {
                      const isEarlyAccessLocked = ch.isEarlyAccess && !hasEarlyAccess;
                      const isVipLocked =
                        !ch.isEarlyAccess &&
                        ch.accessType === 'premium' &&
                        !isVipUser &&
                        !userSubscription.unlockedChapters.includes(ch.id);

                      return (
                        <div
                          key={`${modalId}-ch-${ch.id}-${idx}`}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-900/80 transition"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-amber-400">
                                Ch. {ch.number}
                              </span>
                              <h5 className="text-sm font-semibold text-white truncate">{ch.title}</h5>
                              {ch.isEarlyAccess && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-[10px] font-black text-cyan-300">
                                  <Zap className="w-3 h-3 fill-cyan-400" />
                                  <span>EARLY ACCESS ({ch.earlyAccessDaysLeft || 7}d ahead)</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                              <span>{ch.releaseDate}</span>
                              <span>•</span>
                              <span>{ch.pageCount} Pages</span>
                              <span>•</span>
                              <span>{ch.likesCount.toLocaleString()} Likes</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {ch.isEarlyAccess ? (
                              isEarlyAccessLocked ? (
                                <button
                                  id={`early-access-unlock-btn-${ch.id}`}
                                  onClick={onUpgradeClick}
                                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 px-3 py-1.5 text-xs font-black text-white transition shadow"
                                  title="Requires Pro Early Access or Patron Tier"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Pro Fast-Pass</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onStartReading(ch.id)}
                                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 px-3 py-1.5 text-xs font-black text-black transition shadow"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-black" />
                                  <span>Read Early</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )
                            ) : ch.accessType === 'premium' ? (
                              isVipLocked ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Watch Ad to Unlock Next Chapter (AdMob) */}
                                  <button
                                    type="button"
                                    onClick={() => onRequestRewardedAd(ch)}
                                    className="min-h-[40px] flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-bold transition shadow whitespace-nowrap shrink-0"
                                    title="Watch Google AdMob rewarded video to unlock this chapter"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                                    <span>Watch ad to unlock next chapter</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={onUpgradeClick}
                                    className="min-h-[40px] flex items-center gap-1 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-500/50 px-3 py-1.5 text-xs font-bold text-purple-200 transition shadow whitespace-nowrap shrink-0"
                                    title="Unlock all chapters with Google Play Billing"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>Google Play VIP</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => onStartReading(ch.id)}
                                  className="flex items-center gap-1 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-bold text-white transition shadow"
                                >
                                  <span>Read (VIP)</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => onStartReading(ch.id)}
                                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                              >
                                <span className="text-[10px] text-amber-400 font-bold">FREE</span>
                                <span>Read</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

                {/* Exclusive Bonus Content Section (Patron Tier) */}
                {activeManga.bonusContent && activeManga.bonusContent.length > 0 && (
                  <div id="manga-bonus-content-section" className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                          <Crown className="w-3.5 h-3.5 fill-rose-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <span>Exclusive Bonus Content</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              PATRON PASS TIER
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Author rough sketches, multi-page omake side-stories, lore archives & 4K wallpapers
                          </p>
                        </div>
                      </div>

                      {!hasPatronAccess && (
                        <button
                          onClick={onUpgradeClick}
                          className="hidden sm:flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-black px-3 py-1 text-xs font-black transition shadow"
                        >
                          <Crown className="w-3.5 h-3.5 fill-black" />
                          <span>Unlock All Bonus Items</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeManga.bonusContent.map((bonus, idx) => {
                        return (
                          <div
                            key={`${modalId}-bonus-${bonus.id}-${idx}`}
                            onClick={() => {
                              setSelectedBonusItem(bonus);
                              setIsBonusModalOpen(true);
                            }}
                            className="group relative cursor-pointer rounded-2xl border border-slate-800 hover:border-rose-500/50 bg-slate-950/70 hover:bg-slate-900/80 p-3 flex items-center gap-3 transition shadow"
                          >
                            <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                              <img
                                src={bonus.coverImage}
                                alt={bonus.title}
                                className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                                  !hasPatronAccess ? 'blur-xs opacity-75' : ''
                                }`}
                              />
                              {!hasPatronAccess && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-rose-400" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                                  {bonus.category.toUpperCase()}
                                </span>
                                {bonus.resolution && (
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {bonus.resolution}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                                {bonus.title}
                              </h5>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {bonus.description}
                              </p>
                            </div>

                            <div className="shrink-0 text-slate-400 group-hover:text-white transition">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Similar Series You May Like (Recommendation Engine) */}
                {similarManga && similarManga.length > 0 && (
                  <div id="manga-similar-series-section" className="pt-5 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <span>You May Also Like</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              SIMILAR SERIES
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Algorithmic similarity based on shared genres, themes & reader co-engagement
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {similarManga.map((item, idx) => (
                        <div
                          key={`${modalId}-similar-${item.manga.id}-${idx}`}
                          onClick={() => {
                            if (onSelectManga) {
                              onSelectManga(item.manga);
                            }
                          }}
                          className="group cursor-pointer rounded-xl border border-slate-800 hover:border-amber-500/60 bg-slate-950/80 p-2.5 flex flex-col gap-1.5 transition shadow"
                        >
                          <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-slate-900">
                            <MangaCoverImage
                              src={item.manga.cover || item.manga.coverImage}
                              alt={item.manga.title}
                              title={item.manga.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500 text-black font-black text-[9px] px-1.5 py-0.2">
                              {item.matchPercentage}%
                            </div>
                            <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                              <Star className="w-2.5 h-2.5 fill-amber-300" />
                              <span>{(item.manga.rating || 0).toFixed(1)}</span>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-white group-hover:text-amber-300 truncate transition">
                              {item.manga.title}
                            </h5>
                            <p className="text-[10px] text-amber-400/90 truncate mt-0.5">
                              ✨ {item.reason}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-auto">
                            {(item.sharedGenres || []).slice(0, 2).map((g, idx) => (
                              <span
                                key={`${modalId}-sim-genre-${item.manga.id}-${g}-${idx}`}
                                className="rounded bg-slate-800/90 text-slate-300 px-1.5 py-0.2 text-[9px] font-semibold"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Chapter Discussion & Comments Section */}
                <div id="manga-comments-discussion-section" className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <span>Chapter Discussion & Reactions</span>
                        <span className="rounded-full bg-slate-800 text-slate-300 text-xs px-2 py-0.5 font-mono">
                          {filteredComments.length}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Discuss storylines, art style, and chapter theories with reader timestamps.
                      </p>
                    </div>

                    {/* Reader Profile Handle Pill */}
                    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 self-start sm:self-auto text-xs">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      {isEditingName ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={readerName}
                            onChange={(e) => handleNameChange(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setIsEditingName(false);
                            }}
                            autoFocus
                            placeholder="Your name"
                            className="bg-slate-900 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-24 font-bold"
                          />
                          <button
                            onClick={() => setIsEditingName(false)}
                            className="text-[10px] text-amber-400 hover:underline"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200">{readerName}</span>
                          <span className="text-[10px] text-slate-500">({userSubscription.tier === 'vip' ? 'VIP' : 'Reader'})</span>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="text-[10px] text-amber-400/80 hover:text-amber-300 underline underline-offset-2 ml-1"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapter Filter Selector Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-slate-500" /> Filter:
                    </span>
                    <button
                      onClick={() => setSelectedChapterFilter('all')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition ${
                        selectedChapterFilter === 'all'
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({comments.length})
                    </button>
                    {activeManga.chapters.map((ch, idx) => {
                      const chCommentCount = comments.filter((c) => c.chapterNumber === ch.number).length;
                      return (
                        <button
                          key={`${modalId}-comment-tab-${ch.id}-${idx}`}
                          onClick={() => {
                            setSelectedChapterFilter(ch.number);
                            setTargetCommentChapter(ch.number);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition ${
                            selectedChapterFilter === ch.number
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Ch. {ch.number} ({chCommentCount})
                        </button>
                      );
                    })}
                  </div>

                  {/* Comment Input Box */}
                  <form onSubmit={handlePostComment} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Commenting on:</span>
                        <select
                          value={targetCommentChapter || ''}
                          onChange={(e) => setTargetCommentChapter(e.target.value ? Number(e.target.value) : undefined)}
                          className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="">General Series Discussion</option>
                          {activeManga.chapters.map((ch, idx) => (
                            <option key={`${modalId}-select-ch-${ch.id}-${idx}`} value={ch.number}>
                              Chapter {ch.number}: {ch.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {newCommentText.length}/500
                      </span>
                    </div>

                    {/* Quick Reaction suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {quickReactions.map((reaction, idx) => (
                        <button
                          key={`${modalId}-reaction-${reaction}-${idx}`}
                          type="button"
                          onClick={() => setNewCommentText((prev) => (prev ? `${prev} ${reaction}` : reaction))}
                          className="rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 px-2.5 py-0.5 text-[11px] font-medium transition"
                        >
                          {reaction}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <textarea
                        value={newCommentText}
                        maxLength={500}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostComment();
                          }
                        }}
                        rows={2}
                        placeholder={`Share your thoughts on ${targetCommentChapter ? `Chapter ${targetCommentChapter}` : activeManga.title}...`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none transition"
                      />

                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black px-4 py-2 text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-md shrink-0"
                      >
                        <Send className="w-4 h-4 fill-black" />
                        <span>Post</span>
                      </button>
                    </div>
                  </form>

                  {/* Comments Feed */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {filteredComments.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 text-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">
                          {selectedChapterFilter === 'all'
                            ? 'No comments yet. Start the conversation for this series!'
                            : `No discussion yet for Chapter ${selectedChapterFilter}. Share your chapter thoughts above!`}
                        </p>
                      </div>
                    ) : (
                      filteredComments.map((comment, idx) => {
                        const isLiked = Boolean(likedCommentIds[comment.id]);
                        const initialLikes = comment.likes || 0;
                        const displayLikes = initialLikes + (isLiked ? 1 : 0);
                        const userInitial = (comment.userName || 'R').charAt(0).toUpperCase();

                        return (
                          <div
                            key={`${modalId}-comment-${comment.id}-${idx}`}
                            className="rounded-2xl bg-slate-950 border border-slate-800/80 p-3.5 space-y-2 transition hover:border-slate-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                {/* Avatar Initial */}
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-black font-black text-xs shadow-sm">
                                  {userInitial}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-white">
                                    {comment.userName}
                                  </span>

                                  {comment.userBadge && (
                                    <span className="rounded bg-purple-950/80 border border-purple-500/40 px-1.5 py-0.2 text-[9px] font-bold text-purple-300">
                                      {comment.userBadge}
                                    </span>
                                  )}

                                  {comment.chapterNumber && (
                                    <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 font-mono">
                                      Ch. {comment.chapterNumber}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Timestamp with Clock Icon */}
                              <div
                                className="flex items-center gap-1 text-[10px] text-slate-500 font-mono"
                                title={new Date(comment.timestamp).toLocaleString()}
                              >
                                <Clock className="w-3 h-3 text-slate-600" />
                                <span>{formatTimestamp(comment.timestamp)}</span>
                              </div>
                            </div>

                            {/* Message Text */}
                            <p className="text-xs text-slate-300 leading-relaxed pl-9">
                              {comment.text}
                            </p>

                            {/* Comment Actions (Like / Upvote) */}
                            <div className="flex items-center justify-between pl-9 pt-1">
                              <button
                                onClick={() => handleToggleLike(comment.id)}
                                className={`flex items-center gap-1 text-[11px] font-semibold transition ${
                                  isLiked
                                    ? 'text-rose-400 font-bold'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                <span>{displayLikes > 0 ? displayLikes : 'Like'}</span>
                              </button>

                              <span className="text-[10px] text-slate-600 font-mono">
                                {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Bonus Content Viewer Modal */}
    <BonusContentViewerModal
      key="detail-bonus-content-modal"
      item={selectedBonusItem}
      isOpen={isBonusModalOpen}
      onClose={() => setIsBonusModalOpen(false)}
      userSubscription={userSubscription}
      onUpgradeClick={onUpgradeClick}
    />
  </>
);
};

const getGenreColor = (genre: string): string => {
  const colors: { [key: string]: string } = {
    'Action': '#ef4444',
    'Fantasy': '#8b5cf6',
    'Sci-Fi': '#06b6d4',
    'Slice of Life': '#10b981',
    'Romance': '#ec4899',
    'Horror': '#374151',
    'Adventure': '#f59e0b',
    'Pan-African': '#d97706',
  };
  return colors[genre] || '#64748b';
};
