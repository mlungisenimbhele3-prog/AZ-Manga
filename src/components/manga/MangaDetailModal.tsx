import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chapter, Manga, UserSubscription, Comment, BonusContentItem, isMangaComingSoon, getMangaType } from '../../types';
import { BonusContentViewerModal } from '../modals/BonusContentViewerModal';
import { getSimilarManga } from '../../services/recommendationEngine';
import { MangaCoverImage } from '../common/MangaCoverImage';
import { RatingAverageDisplay, StarRatingInput } from '../common/StarRating';
import {
  buildPreviewChapterId,
  getChapterRatingStats,
  getMangaOverallRatingStats,
  getVolumeRatingStats,
  getVolumesForManga,
  submitUserRating,
  useRatingRevision,
} from '../../services/ratingService';
import { uploadCoverFile } from '../../services/coverStorage';
import { publishMangaToSupabase } from '../../services/supabase';
import { getCurrentUserProfile, isMangaBookmarked, toggleMangaBookmark } from '../../services/userProfile';
import {
  isFollowingCreator,
  toggleFollowCreator,
  subscribeToFollowedCreators,
} from '../../services/creatorFollowService';
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
  UserPlus,
  UserCheck,
  Bell,
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
  Layers,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { isMangaRecentlyPublished } from './MangaCard';
import {
  postChapterComment,
  toggleChapterCommentLike,
  useChapterComments,
  ThreadedCommentNode,
} from '../../services/chapterCommentService';

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
  onAddComment: (text: string, chapterNumber?: number, parentComment?: Comment) => void;
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
  const MAX_COMMENT_LENGTH = 500;
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);
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
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyDraftText, setReplyDraftText] = useState('');
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<Record<string, boolean>>({});

  const handleClearComment = () => {
    setNewCommentText('');
    commentInputRef.current?.focus();
  };

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
  const [showApplyOriginalModal, setShowApplyOriginalModal] = useState(false);
  const [applicationPitch, setApplicationPitch] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);
  const modalId = React.useId();
  const ratingRevision = useRatingRevision();

  const activeManga = manga || cachedManga;

  useEffect(() => {
    setShowApplyOriginalModal(false);
    setApplicationPitch('');
    setApplicationSuccess(null);
  }, [activeManga?.id, isOpen]);

  const handleApplyToOriginal = () => {
    if (!activeManga) return;
    const applicantEmail = getCurrentUserProfile()?.email || 'creator@azoververse.com';
    const existingApps = JSON.parse(localStorage.getItem('az_backdrop_original_applications') || '[]');
    const newApp = {
      id: `app-${Date.now()}`,
      mangaId: activeManga.id,
      mangaTitle: activeManga.title,
      author: activeManga.author,
      applicantEmail,
      pitch: applicationPitch.trim() || 'Submitted for AZ ORIGINAL promotion.',
      views: activeManga.views,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    localStorage.setItem('az_backdrop_original_applications', JSON.stringify([newApp, ...existingApps]));
    window.dispatchEvent(new Event('az_backdrop_app_submitted'));
    setApplicationSuccess(
      `Application sent for "${activeManga.title}"! Admin review takes 48h to grant official AZ ORIGINAL status.`
    );
    setShowApplyOriginalModal(false);
    setApplicationPitch('');
    setTimeout(() => setApplicationSuccess(null), 6000);
  };

  // Author Follow System
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(() => {
    return activeManga?.author ? isFollowingCreator(activeManga.author) : false;
  });
  const [isFollowPulsing, setIsFollowPulsing] = useState(false);
  const [followFeedback, setFollowFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (activeManga?.author) {
      setIsFollowingAuthor(isFollowingCreator(activeManga.author));
    }
  }, [activeManga?.author]);

  useEffect(() => {
    return subscribeToFollowedCreators(() => {
      if (activeManga?.author) {
        setIsFollowingAuthor(isFollowingCreator(activeManga.author));
      }
    });
  }, [activeManga?.author]);

  const handleToggleFollowAuthor = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeManga?.author) return;
    setIsFollowPulsing(true);
    setTimeout(() => setIsFollowPulsing(false), 500);

    const nextState = await toggleFollowCreator({
      name: activeManga.author,
      role: 'Author',
      mangaContext: {
        title: activeManga.title,
        coverImage: activeManga.coverImage,
        mangaId: activeManga.id,
      },
    });

    setIsFollowingAuthor(nextState);
    setFollowFeedback(
      nextState
        ? `Following ${activeManga.author}! You'll receive instant push alerts for new releases.`
        : `Unfollowed ${activeManga.author}.`
    );
    setTimeout(() => setFollowFeedback(null), 3500);
  };

  const mangaRatingStats = useMemo(() => {
    if (!activeManga) {
      return {
        summaryId: '',
        averageRating: 0,
        ratingCount: 0,
        ratingSum: 0,
        userScore: null,
      };
    }
    return getMangaOverallRatingStats(activeManga);
  }, [activeManga, ratingRevision]);

  const mangaVolumes = useMemo(() => {
    if (!activeManga) return [];
    return getVolumesForManga(activeManga);
  }, [activeManga, ratingRevision]);

  const handleRateMangaSeries = (score: 1 | 2 | 3 | 4 | 5) => {
    if (!activeManga) return;
    void submitUserRating({
      targetType: 'manga',
      targetId: activeManga.id,
      mangaId: activeManga.id,
      score,
      mangaTitle: activeManga.title,
    });
  };

  const handleRateVolume = (volumeNumber: number, volumeId: string, score: 1 | 2 | 3 | 4 | 5) => {
    if (!activeManga) return;
    void submitUserRating({
      targetType: 'volume',
      targetId: volumeId,
      mangaId: activeManga.id,
      volumeNumber,
      score,
      mangaTitle: activeManga.title,
    });
  };

  const handleRateChapter = (chapterId: string, score: 1 | 2 | 3 | 4 | 5) => {
    if (!activeManga) return;
    void submitUserRating({
      targetType: 'chapter',
      targetId: chapterId,
      mangaId: activeManga.id,
      chapterId,
      score,
      mangaTitle: activeManga.title,
    });
  };

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

  const activeChapterForSync = useMemo(() => {
    if (!activeManga) {
      return { chapterId: 'preview-ch-1', chapterNumber: 1 };
    }
    const desiredNum =
      typeof selectedChapterFilter === 'number'
        ? selectedChapterFilter
        : targetCommentChapter || activeManga.chapters[0]?.number || 1;
    const matchedCh = activeManga.chapters.find((c) => c.number === desiredNum);
    return {
      chapterId: matchedCh?.id || buildPreviewChapterId(activeManga.id, desiredNum),
      chapterNumber: desiredNum,
    };
  }, [activeManga, selectedChapterFilter, targetCommentChapter]);

  const { threads: syncedChapterThreads, totalCount: syncedChapterTotalCount } =
    useChapterComments({
      mangaId: activeManga?.id || 'manga',
      chapterId: activeChapterForSync.chapterId,
      chapterNumber: activeChapterForSync.chapterNumber,
      userBadge: isVipUser ? 'VIP Reader' : undefined,
    });

  // Flatten synced chapter nodes into Comment objects so both ReaderView and MangaDetailModal share threads seamlessly
  const { flattenedSyncedComments, syncedLikedIdSet } = useMemo(() => {
    if (!activeManga) {
      return { flattenedSyncedComments: [] as Comment[], syncedLikedIdSet: new Set<string>() };
    }
    const list: Comment[] = [];
    const likedSet = new Set<string>();
    const walk = (nodes: ThreadedCommentNode[]) => {
      for (const n of nodes) {
        if (n.isLikedByCurrentUser) {
          likedSet.add(n.id);
        }
        list.push({
          id: n.id,
          mangaId: activeManga.id,
          userId: n.authorUid,
          userName: n.authorName,
          text: n.text,
          timestamp: n.createdAt,
          chapterId: n.chapterId,
          chapterNumber: n.chapterNumber,
          parentId: n.parentId,
          rootId: n.rootId,
          depth: n.depth,
          replyToUserName: n.replyToUserName,
          pageNumber: n.pageNumber,
          isSpoiler: n.isSpoiler,
          userBadge: n.authorBadge,
          likes: n.likesCount,
        });
        if (n.replies.length > 0) {
          walk(n.replies);
        }
      }
    };
    walk(syncedChapterThreads);
    return { flattenedSyncedComments: list, syncedLikedIdSet: likedSet };
  }, [activeManga, syncedChapterThreads]);

  const combinedComments = useMemo<Comment[]>(() => {
    const byId = new Map<string, Comment>();
    for (const c of flattenedSyncedComments) {
      byId.set(c.id, c);
    }
    for (const c of comments) {
      if (!byId.has(c.id)) {
        byId.set(c.id, c);
      }
    }
    return Array.from(byId.values());
  }, [flattenedSyncedComments, comments]);

  // Filtered comments based on selected chapter tab
  const filteredComments = useMemo(() => {
    if (selectedChapterFilter === 'all') {
      return combinedComments;
    }
    return combinedComments.filter((c) => c.chapterNumber === selectedChapterFilter);
  }, [combinedComments, selectedChapterFilter]);

  interface DetailCommentTreeNode extends Comment {
    replies: DetailCommentTreeNode[];
    descendantCount: number;
    isSyncedChapterNode: boolean;
  }

  const threadedDetailComments = useMemo<DetailCommentTreeNode[]>(() => {
    const syncedIdSet = new Set(flattenedSyncedComments.map((c) => c.id));
    const map = new Map<string, DetailCommentTreeNode>();

    for (const c of filteredComments) {
      map.set(c.id, {
        ...c,
        replies: [],
        descendantCount: 0,
        isSyncedChapterNode: syncedIdSet.has(c.id),
      });
    }

    const roots: DetailCommentTreeNode[] = [];
    map.forEach((node) => {
      if ((node.depth || 0) > 0 && node.parentId) {
        const parent = map.get(node.parentId) || (node.rootId ? map.get(node.rootId) : undefined);
        if (parent && parent.id !== node.id) {
          parent.replies.push(node);
          return;
        }
      }
      roots.push(node);
    });

    const countReplies = (n: DetailCommentTreeNode): number => {
      n.replies.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      let total = 0;
      for (const child of n.replies) {
        total += 1 + countReplies(child);
      }
      n.descendantCount = total;
      return total;
    };

    for (const r of roots) {
      countReplies(r);
    }

    roots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return roots;
  }, [filteredComments, flattenedSyncedComments]);

  const handleNameChange = (name: string) => {
    const trimmed = name.slice(0, 20);
    setReaderName(trimmed);
    localStorage.setItem('ka_reader_username', trimmed);
  };

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed || !activeManga) return;

    if (targetCommentChapter) {
      const targetCh = activeManga.chapters.find((c) => c.number === targetCommentChapter);
      const targetChId = targetCh?.id || buildPreviewChapterId(activeManga.id, targetCommentChapter);
      void postChapterComment({
        mangaId: activeManga.id,
        chapterId: targetChId,
        chapterNumber: targetCommentChapter,
        text: trimmed,
        authorNameOverride: readerName,
        authorBadge: isVipUser ? 'VIP Reader' : undefined,
      });
    } else {
      onAddComment(trimmed, targetCommentChapter);
    }
    setNewCommentText('');
  };

  const handleSubmitDetailReply = (parent: DetailCommentTreeNode) => {
    const trimmed = replyDraftText.trim();
    if (!trimmed || !activeManga) return;

    if (parent.isSyncedChapterNode || parent.chapterNumber) {
      const chNum = parent.chapterNumber || targetCommentChapter || 1;
      const targetCh = activeManga.chapters.find((c) => c.number === chNum);
      const chId = parent.chapterId || targetCh?.id || buildPreviewChapterId(activeManga.id, chNum);

      void postChapterComment({
        mangaId: activeManga.id,
        chapterId: chId,
        chapterNumber: chNum,
        text: trimmed,
        parentComment: parent.isSyncedChapterNode
          ? {
              id: parent.id,
              parentId: parent.parentId || null,
              rootId: parent.rootId || null,
              depth: (Math.min(4, Math.max(0, parent.depth || 0)) as 0 | 1 | 2 | 3 | 4),
              authorName: parent.userName,
            }
          : null,
        authorNameOverride: readerName,
        authorBadge: isVipUser ? 'VIP Reader' : undefined,
      });

      if (!parent.isSyncedChapterNode) {
        onAddComment(trimmed, chNum, parent);
      }
    } else {
      onAddComment(trimmed, parent.chapterNumber, parent);
    }

    setReplyDraftText('');
    setActiveReplyCommentId(null);
    setCollapsedThreadIds((prev) => ({ ...prev, [parent.id]: false }));
  };

  const handleToggleLike = (comment: DetailCommentTreeNode) => {
    if (comment.isSyncedChapterNode && activeManga) {
      const chNum = comment.chapterNumber || 1;
      const chId = comment.chapterId || buildPreviewChapterId(activeManga.id, chNum);
      void toggleChapterCommentLike({
        commentId: comment.id,
        chapterId: chId,
        mangaId: activeManga.id,
      });
      return;
    }

    setLikedCommentIds((prev) => ({
      ...prev,
      [comment.id]: !prev[comment.id],
    }));
    onLikeComment?.(comment.id);
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

            {/* Follow Author Feedback Toast */}
            {followFeedback && (
              <div className="absolute top-4 left-4 right-16 z-30 rounded-xl bg-amber-950/95 border border-amber-500/80 p-3 text-xs text-amber-200 shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-fadeIn">
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold">{followFeedback}</span>
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
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-mono tabular-nums">
                        <RatingAverageDisplay
                          rating={mangaRatingStats.averageRating}
                          ratingCount={mangaRatingStats.ratingCount}
                          size="xs"
                          showCount
                        />
                        {!isMangaComingSoon(activeManga) && (
                          <span>• {(activeManga.views || 0).toLocaleString()} reads</span>
                        )}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white truncate drop-shadow">
                      {activeManga.title}
                    </h2>
                    <div className="mt-0.5">
                      <p className="text-xs text-slate-300 truncate">
                        By <span className="font-semibold text-white">{activeManga.author}</span> • Art by {activeManga.artist}
                      </p>
                    </div>
                    <p className="text-[11px] text-amber-400/90 font-semibold mt-0.5">
                      Executive Producer: Mlungiseni Mbhele
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-5">
                {/* 1. Genres */}
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

                {/* 2. Action Button Row — ONLY 3 buttons: Favorite, Add to Library, Follow Author */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <button
                    id="detail-toggle-favorite-btn"
                    type="button"
                    onClick={() => onToggleFavorite?.(activeManga.id)}
                    className={`min-h-[42px] min-w-0 flex items-center justify-center gap-1.5 rounded-xl border px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition ${
                      isFavorite
                        ? 'border-rose-500 bg-rose-600/20 text-rose-300'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to personal favorites collection'}
                  >
                    <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                    <span className="truncate">{isFavorite ? 'Favorited' : 'Favorite'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (manga) {
                        toggleMangaBookmark(manga.id, manga.title, manga.coverImage);
                        setIsBookmarked(!isBookmarked);
                      }
                    }}
                    className={`min-h-[42px] min-w-0 flex items-center justify-center gap-1.5 rounded-xl border px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition ${
                      isBookmarked
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span className="truncate">{isBookmarked ? 'In Library' : 'Add to Library'}</span>
                  </button>

                  <button
                    type="button"
                    id="detail-follow-author-action-btn"
                    onClick={handleToggleFollowAuthor}
                    className={`follow-button min-h-[42px] min-w-0 flex items-center justify-center gap-1.5 rounded-xl border px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isFollowPulsing
                        ? 'scale-95 animate-pulse ring-2 ring-amber-400 bg-amber-500/30'
                        : 'active:scale-95'
                    } ${
                      isFollowingAuthor
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title={isFollowingAuthor ? `Unfollow ${activeManga.author}` : `Follow ${activeManga.author} for new chapter push notifications`}
                  >
                    {isFollowingAuthor ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                        <span className="truncate">Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                        <span className="truncate">Follow Author</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Full-Width Non-Clickable Coming Soon Banner (or Start Ch. 1 CTA when live) */}
                {isMangaComingSoon(activeManga) ? (
                  <div
                    id="detail-coming-soon-banner"
                    className="w-full flex items-center justify-start gap-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 px-4 py-3 text-xs font-bold shadow-sm select-none"
                  >
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Coming Soon • Panels In Production</span>
                  </div>
                ) : firstChapter ? (
                  <button
                    id="detail-start-reading-btn"
                    type="button"
                    onClick={() => onStartReading(firstChapter.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-xs font-black text-black transition shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Start Ch. 1</span>
                  </button>
                ) : null}

                {/* 4. Synopsis */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Synopsis
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeManga.synopsis}
                  </p>
                </div>

                {/* Backdrop -> Apply to become ORIGINAL CTA (detail page only) */}
                {getMangaType(activeManga) === 'backdrop' && (
                  <div className="space-y-2.5">
                    {applicationSuccess && (
                      <div
                        id="detail-apply-original-success"
                        className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-3 text-xs font-medium text-emerald-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{applicationSuccess}</span>
                      </div>
                    )}
                    <button
                      id="detail-apply-original-btn"
                      type="button"
                      onClick={() => setShowApplyOriginalModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/35 hover:bg-amber-900/50 px-4 py-2.5 text-xs font-black text-amber-300 transition shadow-sm active:scale-[0.99]"
                    >
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Apply to become ORIGINAL</span>
                    </button>
                  </div>
                )}

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

                {/* 5. Series Overall Average Rating & Interactive 1–5 Star Rating Bar */}
                <div
                  id="manga-series-rating-card"
                  className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 min-w-[78px]">
                      <div className="flex items-center gap-1 font-mono tabular-nums text-lg font-black text-amber-400">
                        <Star
                          className={`w-4 h-4 ${
                            mangaRatingStats.ratingCount > 0
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-500'
                          }`}
                        />
                        <span>{mangaRatingStats.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {mangaRatingStats.ratingCount > 0
                          ? `${mangaRatingStats.ratingCount} ${
                              mangaRatingStats.ratingCount === 1 ? 'rating' : 'ratings'
                            }`
                          : 'No ratings'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Series Average Rating
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Aggregated across series, tankōbon volumes, and chapter ratings (1–5 stars).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <StarRatingInput
                      idPrefix={`detail-manga-rate-${activeManga.id}`}
                      value={mangaRatingStats.userScore}
                      averageRating={mangaRatingStats.averageRating}
                      ratingCount={mangaRatingStats.ratingCount}
                      onRate={handleRateMangaSeries}
                      size="md"
                      showAverageSummary={false}
                      showStatusLabel
                    />
                  </div>
                </div>

                {/* Volumes & Tankōbon Ratings (1–5 Stars) */}
                <div id="manga-volumes-rating-section" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>Volumes ({mangaVolumes.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Rate each volume 1–5 stars
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mangaVolumes.map((vol) => {
                      const volStats = getVolumeRatingStats(
                        activeManga.id,
                        vol.number,
                        vol.chapterIds
                      );
                      return (
                        <div
                          key={`${modalId}-volume-${vol.id}`}
                          id={`volume-rating-card-${vol.id}`}
                          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex items-center gap-3.5 hover:border-slate-700 transition"
                        >
                          <div className="h-16 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                            <MangaCoverImage
                              src={vol.coverImage || activeManga.coverImage}
                              alt={`${activeManga.title} ${vol.title}`}
                              title={vol.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                                  {vol.title}
                                </h5>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {vol.chapterRangeLabel}
                                </p>
                              </div>
                              <RatingAverageDisplay
                                rating={volStats.averageRating}
                                ratingCount={volStats.ratingCount}
                                size="sm"
                                showCount
                              />
                            </div>

                            <StarRatingInput
                              idPrefix={`detail-vol-rate-${vol.id}`}
                              value={volStats.userScore}
                              averageRating={volStats.averageRating}
                              ratingCount={volStats.ratingCount}
                              onRate={(score) => handleRateVolume(vol.number, vol.id, score)}
                              size="sm"
                              showAverageSummary={false}
                              showStatusLabel
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                    <div className="space-y-3">
                      {(() => {
                        const previewChId = buildPreviewChapterId(activeManga.id, 1);
                        const previewChStats = getChapterRatingStats(previewChId);
                        return (
                          <div
                            id={`chapter-preview-rating-row-${previewChId}`}
                            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-amber-400">
                                  Ch. 1
                                </span>
                                <h5 className="text-sm font-semibold text-white">
                                  Episode 1 · Serialization Preview
                                </h5>
                                <RatingAverageDisplay
                                  rating={previewChStats.averageRating}
                                  ratingCount={previewChStats.ratingCount}
                                  size="xs"
                                  showCount
                                />
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Rate Chapter 1 preview on a 1–5 star scale or open cover preview.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                              <StarRatingInput
                                idPrefix={`detail-ch-preview-${previewChId}`}
                                value={previewChStats.userScore}
                                averageRating={previewChStats.averageRating}
                                ratingCount={previewChStats.ratingCount}
                                onRate={(score) => handleRateChapter(previewChId, score)}
                                size="xs"
                                showAverageSummary={false}
                                showStatusLabel
                              />
                              <button
                                type="button"
                                onClick={() => onStartReading(previewChId)}
                                className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                              >
                                <span>Preview</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

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
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden max-h-80 overflow-y-auto">
                    {activeManga.chapters.map((ch, idx) => {
                      const isEarlyAccessLocked = ch.isEarlyAccess && !hasEarlyAccess;
                      const isVipLocked =
                        !ch.isEarlyAccess &&
                        ch.accessType === 'premium' &&
                        !isVipUser &&
                        !userSubscription.unlockedChapters.includes(ch.id);
                      const chStats = getChapterRatingStats(ch.id);
                      const resolvedVolNum =
                        ch.volumeNumber || Math.max(1, Math.ceil((ch.number || 1) / 5));

                      return (
                        <div
                          key={`${modalId}-ch-${ch.id}-${idx}`}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/80 transition"
                        >
                          <div className="min-w-0 pr-2 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                                Ch. {ch.number}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                                Vol. {resolvedVolNum}
                              </span>
                              <h5 className="text-sm font-semibold text-white truncate">{ch.title}</h5>
                              {ch.isEarlyAccess && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-[10px] font-black text-cyan-300">
                                  <Zap className="w-3 h-3 fill-cyan-400" />
                                  <span>EARLY ACCESS ({ch.earlyAccessDaysLeft || 7}d ahead)</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 tabular-nums">
                              <RatingAverageDisplay
                                rating={chStats.averageRating}
                                ratingCount={chStats.ratingCount}
                                size="xs"
                                showCount
                              />
                              <span>•</span>
                              <span>{ch.releaseDate}</span>
                              <span>•</span>
                              <span>{ch.pageCount} Pages</span>
                              <span>•</span>
                              <span>{ch.likesCount.toLocaleString()} Likes</span>
                            </div>
                            <div className="pt-0.5">
                              <StarRatingInput
                                idPrefix={`detail-ch-rate-${ch.id}`}
                                value={chStats.userScore}
                                averageRating={chStats.averageRating}
                                ratingCount={chStats.ratingCount}
                                onRate={(score) => handleRateChapter(ch.id, score)}
                                size="xs"
                                showAverageSummary={false}
                                showStatusLabel
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
                      All ({combinedComments.length})
                    </button>
                    {activeManga.chapters.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChapterFilter(1);
                          setTargetCommentChapter(1);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition ${
                          selectedChapterFilter === 1
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Ch. 1 Preview ({syncedChapterTotalCount})
                      </button>
                    ) : (
                      activeManga.chapters.map((ch, idx) => {
                        const chCommentCount = combinedComments.filter(
                          (c) => c.chapterNumber === ch.number
                        ).length;
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
                      })
                    )}
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
                          {activeManga.chapters.length === 0 ? (
                            <option value={1}>Chapter 1: Serialization Preview</option>
                          ) : (
                            activeManga.chapters.map((ch, idx) => (
                              <option key={`${modalId}-select-ch-${ch.id}-${idx}`} value={ch.number}>
                                Chapter {ch.number}: {ch.title}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <span
                        aria-live="polite"
                        className={`text-[11px] font-mono tabular-nums font-semibold transition-colors ${
                          newCommentText.length >= MAX_COMMENT_LENGTH
                            ? 'text-rose-400'
                            : newCommentText.length >= Math.floor(MAX_COMMENT_LENGTH * 0.85)
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {newCommentText.length} / {MAX_COMMENT_LENGTH} chars
                      </span>
                    </div>

                    {/* Quick Reaction suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {quickReactions.map((reaction, idx) => (
                        <button
                          key={`${modalId}-reaction-${reaction}-${idx}`}
                          type="button"
                          onClick={() =>
                            setNewCommentText((prev) => {
                              const next = prev ? `${prev} ${reaction}` : reaction;
                              return next.slice(0, MAX_COMMENT_LENGTH);
                            })
                          }
                          className="rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 px-2.5 py-0.5 text-[11px] font-medium transition"
                        >
                          {reaction}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900 focus-within:border-amber-500 transition overflow-hidden">
                      <textarea
                        id="manga-detail-comment-textarea"
                        ref={commentInputRef}
                        value={newCommentText}
                        maxLength={MAX_COMMENT_LENGTH}
                        onChange={(e) => setNewCommentText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostComment();
                          }
                        }}
                        rows={2}
                        placeholder={`Share your thoughts on ${targetCommentChapter ? `Chapter ${targetCommentChapter}` : activeManga.title}...`}
                        className="w-full bg-transparent px-3 pt-2.5 pb-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none"
                      />

                      <div className="flex items-center justify-between gap-2 border-t border-slate-800/90 bg-slate-950/60 px-3 py-2">
                        <div
                          id="comment-character-counter"
                          className="flex items-center gap-2 text-[11px] font-mono tabular-nums"
                        >
                          <span
                            className={
                              newCommentText.length >= MAX_COMMENT_LENGTH
                                ? 'text-rose-400 font-bold'
                                : newCommentText.length >= Math.floor(MAX_COMMENT_LENGTH * 0.85)
                                ? 'text-amber-400 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            {newCommentText.length}/{MAX_COMMENT_LENGTH}
                          </span>
                          {newCommentText.length >= Math.floor(MAX_COMMENT_LENGTH * 0.85) && (
                            <span className="text-[10px] text-slate-500">
                              ({MAX_COMMENT_LENGTH - newCommentText.length} left)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id="clear-comment-input-btn"
                            type="button"
                            disabled={newCommentText.length === 0}
                            onClick={handleClearComment}
                            aria-label="Clear comment"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:text-white disabled:opacity-35 disabled:pointer-events-none px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>

                          <button
                            id="submit-comment-btn"
                            type="submit"
                            disabled={!newCommentText.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black px-3.5 py-1.5 text-xs font-bold transition shadow-md shrink-0"
                          >
                            <Send className="w-3.5 h-3.5 fill-black" />
                            <span>Post</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Threaded Comments & Direct Replies Feed */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {threadedDetailComments.length === 0 ? (
                      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 text-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">
                          {selectedChapterFilter === 'all'
                            ? 'No comments yet. Start the conversation for this series!'
                            : `No discussion yet for Chapter ${selectedChapterFilter}. Share your chapter thoughts above!`}
                        </p>
                      </div>
                    ) : (
                      (() => {
                        const renderCommentBranch = (
                          comment: DetailCommentTreeNode,
                          isNested = false
                        ): React.ReactNode => {
                          const isLiked = comment.isSyncedChapterNode
                            ? syncedLikedIdSet.has(comment.id)
                            : Boolean(likedCommentIds[comment.id]);
                          const initialLikes = comment.likes || 0;
                          const displayLikes = comment.isSyncedChapterNode
                            ? initialLikes
                            : initialLikes + (isLiked ? 1 : 0);
                          const userInitial = (comment.userName || 'R').charAt(0).toUpperCase();
                          const isReplyingHere = activeReplyCommentId === comment.id;
                          const isCollapsed = Boolean(collapsedThreadIds[comment.id]);

                          return (
                            <div
                              key={`${modalId}-comment-${comment.id}`}
                              className={
                                isNested
                                  ? 'pt-2.5 space-y-1.5'
                                  : 'rounded-2xl bg-slate-950 border border-slate-800/80 p-3.5 space-y-2 transition hover:border-slate-700'
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`flex items-center justify-center rounded-full font-bold shrink-0 ${
                                      isNested
                                        ? 'h-6 w-6 text-[11px] bg-slate-800 text-slate-200 border border-slate-700'
                                        : 'h-7 w-7 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {userInitial}
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                    <span className="font-bold text-white">{comment.userName}</span>

                                    {comment.userBadge && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-600">
                                          ·
                                        </span>
                                        <span className="text-[11px] font-medium text-amber-400/90">
                                          {comment.userBadge}
                                        </span>
                                      </>
                                    )}

                                    {comment.chapterNumber && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-600">
                                          ·
                                        </span>
                                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                                          Ch. {comment.chapterNumber}
                                          {comment.pageNumber ? ` · Pg ${comment.pageNumber}` : ''}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div
                                  className="flex items-center gap-1 text-[10px] text-slate-500 font-mono tabular-nums shrink-0"
                                  title={new Date(comment.timestamp).toLocaleString()}
                                >
                                  <Clock className="w-3 h-3 text-slate-600" />
                                  <span>{formatTimestamp(comment.timestamp)}</span>
                                </div>
                              </div>

                              {comment.replyToUserName && (
                                <p className="text-[11px] text-slate-400 pl-8">
                                  Replying to{' '}
                                  <span className="font-semibold text-amber-300/90">
                                    @{comment.replyToUserName}
                                  </span>
                                </p>
                              )}

                              <p className="text-xs text-slate-300 leading-relaxed pl-8 whitespace-pre-wrap break-words">
                                {comment.text}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 pl-8 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLike(comment)}
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold transition whitespace-nowrap shrink-0 ${
                                    isLiked
                                      ? 'text-rose-400 font-bold'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      isLiked ? 'fill-rose-500 text-rose-500' : ''
                                    }`}
                                  />
                                  <span className="font-mono tabular-nums">
                                    {displayLikes > 0 ? displayLikes : 'Like'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReplyCommentId((prev) =>
                                      prev === comment.id ? null : comment.id
                                    );
                                    setReplyDraftText('');
                                  }}
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold transition whitespace-nowrap shrink-0 ${
                                    isReplyingHere
                                      ? 'text-amber-300'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                  <span>{isReplyingHere ? 'Cancel' : 'Reply'}</span>
                                </button>

                                {comment.replies.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCollapsedThreadIds((prev) => ({
                                        ...prev,
                                        [comment.id]: !prev[comment.id],
                                      }))
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/90 hover:text-amber-300 transition whitespace-nowrap shrink-0"
                                  >
                                    {isCollapsed ? (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        <span className="tabular-nums">
                                          View {comment.descendantCount}{' '}
                                          {comment.descendantCount === 1 ? 'reply' : 'replies'}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                        <span className="tabular-nums">
                                          Hide {comment.descendantCount}{' '}
                                          {comment.descendantCount === 1 ? 'reply' : 'replies'}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              {isReplyingHere && (
                                <div className="pl-8 pt-2">
                                  <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-300">
                                        Replying to{' '}
                                        <span className="font-semibold text-amber-300">
                                          @{comment.userName}
                                        </span>
                                      </span>
                                      <span className="font-mono tabular-nums text-slate-500">
                                        {replyDraftText.length}/{MAX_COMMENT_LENGTH}
                                      </span>
                                    </div>
                                    <textarea
                                      value={replyDraftText}
                                      maxLength={MAX_COMMENT_LENGTH}
                                      onChange={(e) =>
                                        setReplyDraftText(e.target.value.slice(0, MAX_COMMENT_LENGTH))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSubmitDetailReply(comment);
                                        }
                                      }}
                                      rows={2}
                                      autoFocus
                                      placeholder={`Reply to ${comment.userName}...`}
                                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      {replyDraftText.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setReplyDraftText('')}
                                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Clear</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setActiveReplyCommentId(null)}
                                        className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!replyDraftText.trim()}
                                        onClick={() => handleSubmitDetailReply(comment)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black px-3 py-1 text-xs font-bold transition whitespace-nowrap shrink-0"
                                      >
                                        <Send className="w-3 h-3 fill-black" />
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {comment.replies.length > 0 && !isCollapsed && (
                                <div className="relative ml-3.5 pl-4 space-y-2">
                                  <div
                                    aria-hidden="true"
                                    className="absolute left-0 top-2 bottom-1 w-px bg-slate-800/90"
                                  />
                                  {comment.replies.map((replyNode) =>
                                    renderCommentBranch(replyNode, true)
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        };

                        return threadedDetailComments.map((rootComment) =>
                          renderCommentBranch(rootComment, false)
                        );
                      })()
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

    {/* Apply to Become AZ ORIGINAL Modal */}
    {showApplyOriginalModal && activeManga && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-slate-900 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">Apply for AZ ORIGINAL Status</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowApplyOriginalModal(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-xl bg-amber-950/30 border border-amber-500/20 p-3 space-y-1 text-xs text-amber-200">
            <p className="font-bold text-white">Series: {activeManga.title}</p>
            <p className="text-slate-300">
              Promoting from Backdrop to official AZ ORIGINAL unlocks:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-300/90">
              <li>70% creator revenue share from Google Play Billing VIP &amp; AdMob</li>
              <li>Gold AZ ORIGINAL crown badge &amp; Awards eligibility</li>
              <li>Featured placement on the Home carousel</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Creator Pitch &amp; Serialization Schedule
            </label>
            <textarea
              value={applicationPitch}
              onChange={(e) => setApplicationPitch(e.target.value)}
              placeholder="Tell AZ Editors about your story arc, update frequency (e.g. Weekly), and visual quality..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none min-h-[100px]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowApplyOriginalModal(false)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyToOriginal}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-2.5 text-xs font-black transition shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Application</span>
            </button>
          </div>
        </div>
      </div>
    )}
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
