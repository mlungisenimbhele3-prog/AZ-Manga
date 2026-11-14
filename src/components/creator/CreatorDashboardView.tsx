import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  UploadCloud,
  Plus,
  BookOpen,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
  Baby,
  Users,
  Flame,
  Skull,
  Eye,
  EyeOff,
  Lock,
  Heart,
  Coins,
  Wallet,
  BarChart3,
  MessageSquare,
  Calendar,
  Send,
  TrendingUp,
  Building2,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { Manga, Chapter, ChapterPage, Comment } from '../../types';
import {
  UserProfile,
  getCurrentUserProfile,
  subscribeToCreatorAuth,
} from '../../services/userProfile';
import { getInMemoryAccessToken } from '../../services/oververseAuth';
import { safeStorage } from '../../utils/safeStorage';

interface CreatorDashboardViewProps {
  currentUserEmail: string;
  isAdmin?: boolean;
  mangaList: Manga[];
  allComments?: Comment[];
  onCreateManga: (newManga: Manga) => void;
  onUpdateManga: (updatedManga: Manga) => void;
  onDeleteManga: (mangaId: string) => void;
  onViewManga?: (manga: Manga) => void;
  onOpenApplyCreator?: () => void;
  onBackToCatalog?: () => void;
}

interface PayoutRow {
  id: string;
  creatorId?: string;
  creatorEmail?: string;
  amountZar: number;
  method: 'Bank' | 'Capitec' | 'PayFast';
  accountReference: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}

interface EarningsSnapshot {
  totalZar: number;
  thisMonthZar: number;
  availableBalanceZar: number;
  breakdown: {
    adsZar: number;
    vipZar: number;
    tipsZar: number;
  };
  monthlySeries: Array<{
    month: string;
    adsZar: number;
    vipZar: number;
    tipsZar: number;
    totalZar: number;
  }>;
}

type DashboardSectionTab = 'all' | 'manga' | 'upload' | 'earnings' | 'payouts' | 'audience';

const GENRE_OPTIONS = ['Action', 'Romance', 'Comedy', 'Fantasy', 'Drama', 'Horror'];
const LANGUAGE_OPTIONS = ['English', 'isiZulu', 'Afrikaans', 'Swahili', 'Yoruba', 'French'];
const AGE_RATING_OPTIONS = ['All Ages', '13+', '16+', '18+'] as const;
const PAYOUT_METHODS: Array<{ id: 'Bank' | 'Capitec' | 'PayFast'; label: string; hint: string }> = [
  { id: 'Bank', label: 'Bank EFT', hint: 'SA Bank Account (Payouts Only)' },
  { id: 'Capitec', label: 'Capitec', hint: 'Capitec Account (Payouts Only)' },
  { id: 'PayFast', label: 'PayFast', hint: 'PayFast Email (Payouts Only)' },
];

const LEGACY_LOCAL_PAYOUTS_KEY = 'az_creator_local_payouts_v1';
const getScopedPayoutsKey = (identity: string) =>
  `az_creator_local_payouts_v1_${(identity || 'anon').trim().toLowerCase()}`;

function maskBankReference(ref: string): string {
  const clean = (ref || '').trim();
  if (!clean) return '••••';
  if (clean.includes('@')) {
    const [local, domain] = clean.split('@');
    return `${local.slice(0, 2)}••••@${domain}`;
  }
  if (clean.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(8, clean.length - 4))}${clean.slice(-4)}`;
}

function getDisplayPayoutStatus(rawStatus: string): 'Pending Review' | 'Approved' | 'Paid' {
  const normalized = (rawStatus || '').trim().toLowerCase();
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'approved') return 'Approved';
  return 'Pending Review';
}

function formatZar(amount: number): string {
  return `R ${Number(amount || 0).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getSeriesStatusMeta(manga: Manga): {
  label: 'Draft' | 'Coming Soon' | 'Live';
  className: string;
} {
  const hasChapters = Array.isArray(manga.chapters) && manga.chapters.length > 0;
  const hasLiveChapter = hasChapters && manga.chapters.some((c) => c.accessType !== undefined && (c as any).publishStatus !== 'Coming Soon • Panels In Production' && (c as any).publishStatus !== 'Scheduled');

  if (manga.approvalStatus === 'draft') {
    return {
      label: 'Draft',
      className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    };
  }
  if (manga.approvalStatus === 'approved' && hasLiveChapter) {
    return {
      label: 'Live',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    };
  }
  return {
    label: 'Coming Soon',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  };
}

export const CreatorDashboardView: React.FC<CreatorDashboardViewProps> = ({
  currentUserEmail,
  isAdmin: propIsAdmin = false,
  mangaList,
  allComments = [],
  onCreateManga,
  onUpdateManga,
  onDeleteManga,
  onViewManga,
  onOpenApplyCreator,
  onBackToCatalog,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUserProfile());
  const [authReady, setAuthReady] = useState<boolean>(true);
  const [hasVerifiedCreatorAuth, setHasVerifiedCreatorAuth] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToCreatorAuth((snap) => {
      setProfile(snap.profile);
      setAuthReady(snap.authReady);
      setHasVerifiedCreatorAuth(snap.hasCreatorAccount);
    });
    return unsub;
  }, []);

  const isAdmin =
    propIsAdmin ||
    profile.role === 'admin' ||
    (currentUserEmail || profile.email || '').toLowerCase() === 'mlungisenimbhele3@gmail.com';
  const isCreator =
    isAdmin ||
    hasVerifiedCreatorAuth ||
    profile.isCreator ||
    profile.role === 'creator';

  // Active dashboard view tab
  const [activeSection, setActiveSection] = useState<DashboardSectionTab>('all');

  // Collapsible NEVER ALLOWED warning box
  const [isWarningBoxExpanded, setIsWarningBoxExpanded] = useState(false);
  const [showContentRulesModal, setShowContentRulesModal] = useState(false);

  // Filter creator's own manga + scoped payout key for privacy
  const normalizedUserEmail = (currentUserEmail || profile.email || '').toLowerCase();
  const scopedPayoutsStorageKey = getScopedPayoutsKey(normalizedUserEmail || profile.uid);

  // Neon dashboard sync state
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbEarnings, setDbEarnings] = useState<EarningsSnapshot | null>(null);
  const [dbPayouts, setDbPayouts] = useState<PayoutRow[]>(() => {
    // Purge legacy unscoped bank details cache so other accounts never inherit them
    safeStorage.removeItem(LEGACY_LOCAL_PAYOUTS_KEY);
    return safeStorage.getJSON<PayoutRow[]>(
      getScopedPayoutsKey((currentUserEmail || profile.email || profile.uid || 'anon').toLowerCase()),
      []
    );
  });

  // New Manga Modal
  const [showNewMangaModal, setShowNewMangaModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGenres, setNewGenres] = useState<string[]>(['Action']);
  const [newLanguage, setNewLanguage] = useState('English');
  const [newAgeRating, setNewAgeRating] = useState<'All Ages' | '13+' | '16+' | '18+'>('13+');

  // Edit Manga Modal
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Section 2: Upload Chapter flow (inline + jump from card)
  const [uploadMangaId, setUploadMangaId] = useState<string>('');
  const [uploadChapterNumber, setUploadChapterNumber] = useState<number>(1);
  const [uploadChapterTitle, setUploadChapterTitle] = useState<string>('');
  const [uploadPanels, setUploadPanels] = useState<string[]>([]);
  const [uploadMode, setUploadMode] = useState<'live' | 'schedule'>('live');
  const [uploadScheduleDate, setUploadScheduleDate] = useState<string>(() => {
    const tmr = new Date(Date.now() + 86400000);
    return tmr.toISOString().split('T')[0];
  });
  const [isUploadingChapter, setIsUploadingChapter] = useState(false);

  // Section 4: Payout request state
  const [payoutMethod, setPayoutMethod] = useState<'Bank' | 'Capitec' | 'PayFast'>('Capitec');
  const [payoutAmountInput, setPayoutAmountInput] = useState<string>('100');
  const [payoutReference, setPayoutReference] = useState<string>('');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [showPrivateBankDetails, setShowPrivateBankDetails] = useState(false);

  // Deletion Confirmation States
  const [mangaToDelete, setMangaToDelete] = useState<Manga | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<{ manga: Manga; chapter: Chapter } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  useEffect(() => {
    setDbPayouts(safeStorage.getJSON<PayoutRow[]>(scopedPayoutsStorageKey, []));
  }, [scopedPayoutsStorageKey]);
  const myMangas = useMemo(() => {
    const owned = mangaList.filter((m) => {
      const submitter = (m.submittedByEmail || '').toLowerCase();
      const authorName = (m.author || '').toLowerCase();
      const penName = (profile.penName || '').toLowerCase();
      return (
        (submitter && submitter === normalizedUserEmail) ||
        (penName && authorName === penName) ||
        m.id.startsWith(`creator-${profile.uid}`)
      );
    });
    return owned;
  }, [mangaList, normalizedUserEmail, profile.penName, profile.uid]);

  // Default selected manga in Upload tab
  useEffect(() => {
    if (myMangas.length > 0 && (!uploadMangaId || !myMangas.some((m) => m.id === uploadMangaId))) {
      const first = myMangas[0];
      setUploadMangaId(first.id);
      const nextNum = (first.chapters?.length || 0) + 1;
      setUploadChapterNumber(nextNum);
      setUploadChapterTitle(`Episode ${nextNum}`);
    }
  }, [myMangas, uploadMangaId]);

  const handleSelectUploadManga = (mangaId: string) => {
    setUploadMangaId(mangaId);
    const target = myMangas.find((m) => m.id === mangaId);
    if (target) {
      const nextNum = (target.chapters?.length || 0) + 1;
      setUploadChapterNumber(nextNum);
      setUploadChapterTitle(`Episode ${nextNum}`);
    }
  };

  // Load Neon Creator Dashboard snapshot on mount (if creator & token present)
  const fetchDashboardFromApi = useCallback(async () => {
    const token = getInMemoryAccessToken();
    if (!token || !isCreator) return;

    try {
      const res = await fetch('/api/creator/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setDbConnected(Boolean(data.dbConnected));
      if (data.earnings) {
        setDbEarnings(data.earnings);
      }
      if (Array.isArray(data.payouts) && data.payouts.length > 0) {
        setDbPayouts(data.payouts);
        safeStorage.setJSONDeferred(scopedPayoutsStorageKey, data.payouts);
      }
    } catch {
      setDbConnected(false);
    }
  }, [isCreator, scopedPayoutsStorageKey]);

  useEffect(() => {
    void fetchDashboardFromApi();
  }, [fetchDashboardFromApi]);

  // Audience & Earnings metrics derived cleanly from Neon + creator catalog
  const metrics = useMemo(() => {
    let totalReads = 0;
    let totalLikes = 0;
    let topManga: Manga | null = null;
    let topChapter: { mangaTitle: string; chapterNumber: number; title: string; reads: number } | null = null;

    for (const m of myMangas) {
      const mReads = Number(m.views || 0);
      totalReads += mReads;
      totalLikes += Number(m.bookmarksCount || 0) + Number((m as any).likes || 0);
      if (!topManga || mReads >= (topManga.views || 0)) {
        topManga = m;
      }
      for (const ch of m.chapters || []) {
        const chLikes = Number(ch.likesCount || 0);
        const chReads = Number((ch as any).reads || 0);
        totalLikes += chLikes;
        if (!topChapter || chReads > topChapter.reads) {
          topChapter = {
            mangaTitle: m.title,
            chapterNumber: ch.number,
            title: ch.title,
            reads: chReads,
          };
        }
      }
    }

    const myMangaIdSet = new Set(myMangas.map((m) => m.id));
    const commentsCount = allComments.filter((c) => myMangaIdSet.has(c.mangaId)).length;
    const followers = Number(profile.followersCount || 0);

    // Computed ZAR earnings (overridden by Neon DB snapshot when populated)
    const computedGrossZar = Number(((totalReads * 0.042 + totalLikes * 0.35) * 0.7).toFixed(2));
    const totalZar = dbEarnings ? Math.max(dbEarnings.totalZar, computedGrossZar) : computedGrossZar;
    const paidOutTotal = dbPayouts.reduce(
      (sum, p) => (p.status !== 'Rejected' ? sum + Number(p.amountZar || 0) : sum),
      0
    );
    const availableBalanceZar = Number(Math.max(0, totalZar - paidOutTotal).toFixed(2));
    const adsZar = dbEarnings?.breakdown?.adsZar ?? Number((totalZar * 0.56).toFixed(2));
    const vipZar = dbEarnings?.breakdown?.vipZar ?? Number((totalZar * 0.31).toFixed(2));
    const tipsZar = dbEarnings?.breakdown?.tipsZar ?? Number((totalZar * 0.13).toFixed(2));

    const monthlySeries = (() => {
      if (dbEarnings?.monthlySeries && dbEarnings.monthlySeries.length > 0 && dbEarnings.totalZar >= computedGrossZar) {
        return dbEarnings.monthlySeries;
      }
      const weights = [0.11, 0.14, 0.15, 0.18, 0.2, 0.22];
      const now = new Date();
      return weights.map((w, idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
        const total = Number((totalZar * w).toFixed(2));
        return {
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          adsZar: Number((total * 0.56).toFixed(2)),
          vipZar: Number((total * 0.31).toFixed(2)),
          tipsZar: Number((total * 0.13).toFixed(2)),
          totalZar: total,
        };
      });
    })();

    const thisMonthZar = monthlySeries[monthlySeries.length - 1]?.totalZar ?? 0;

    return {
      followers,
      totalReads,
      totalLikes,
      commentsCount,
      topManga,
      topChapter,
      totalZar,
      thisMonthZar,
      availableBalanceZar,
      adsZar,
      vipZar,
      tipsZar,
      monthlySeries,
    };
  }, [myMangas, allComments, profile.followersCount, dbEarnings, dbPayouts]);

  // Helper: upload cover image
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isEditing) {
        setEditCover(result);
      } else {
        setNewCoverImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper: multiple chapter panel upload
  const handlePanelsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const sortedFiles = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    Promise.all(
      sortedFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (evt) => resolve(String(evt.target?.result || ''));
            r.readAsDataURL(file);
          })
      )
    ).then((loaded) => {
      setUploadPanels((prev) => [...prev, ...loaded.filter(Boolean)]);
    });
  };

  const movePanel = (index: number, direction: -1 | 1) => {
    setUploadPanels((prev) => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIdx, 0, item);
      return next;
    });
  };

  // Create Manga
  const handleCreateMangaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const mangaId = `creator-${profile.uid}-${Date.now()}`;
    const defaultCover =
      newCoverImage.trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

    const newManga: Manga = {
      id: mangaId,
      title: newTitle.trim(),
      author: profile.penName || profile.displayName || 'Creator',
      artist: profile.penName || profile.displayName || 'Creator',
      cover: defaultCover,
      coverImage: defaultCover,
      coverUrl: defaultCover,
      bannerImage: defaultCover,
      genres: newGenres,
      status: 'ONGOING',
      synopsis: newDescription.trim() || 'Original series published on AZ OVERVERSE.',
      rating: 0,
      ratingCount: 0,
      views: 0,
      bookmarksCount: 0,
      monetizationModel: 'hybrid',
      chapters: [],
      approvalStatus: 'pending_review',
      submittedByEmail: currentUserEmail || profile.email,
      submittedAt: new Date().toISOString(),
    };

    onCreateManga(newManga);
    setUploadMangaId(mangaId);
    setShowNewMangaModal(false);
    setNewTitle('');
    setNewCoverImage('');
    setNewDescription('');
    setNewGenres(['Action']);

    const token = getInMemoryAccessToken();
    if (token) {
      fetch('/api/creator/mangas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          id: mangaId,
          title: newManga.title,
          synopsis: newManga.synopsis,
          coverUrl: defaultCover,
          genres: newManga.genres,
          ageRating: newAgeRating,
          language: newLanguage,
          status: 'Coming Soon',
          approvalStatus: 'pending_review',
        }),
      }).catch(() => {});
    }

    showToast('Series created! Upload Chapter 1 below to launch.');
  };

  // Edit Manga
  const handleSaveEditManga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManga) return;

    const cleanCover = editCover.trim() || editingManga.cover;
    const updated: Manga = {
      ...editingManga,
      title: editTitle.trim(),
      synopsis: editDescription.trim(),
      cover: cleanCover,
      coverImage: cleanCover,
      coverUrl: cleanCover,
    };

    onUpdateManga(updated);
    setEditingManga(null);

    const token = getInMemoryAccessToken();
    if (token) {
      fetch(`/api/creator/mangas/${encodeURIComponent(updated.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: updated.title,
          synopsis: updated.synopsis,
          coverUrl: cleanCover,
        }),
      }).catch(() => {});
    }

    showToast('Series updated.');
  };

  // Section 2: Submit Chapter Upload
  const handleUploadChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetManga = myMangas.find((m) => m.id === uploadMangaId);
    if (!targetManga) {
      showToast('Please create or select a manga series first.');
      return;
    }

    setIsUploadingChapter(true);
    try {
      const finalPages: ChapterPage[] =
        uploadPanels.length > 0
          ? uploadPanels.map((url, idx) => ({
              id: `p-${idx + 1}`,
              pageNumber: idx + 1,
              imageUrl: url,
            }))
          : [
              {
                id: 'p-1',
                pageNumber: 1,
                imageUrl: targetManga.coverUrl || targetManga.coverImage,
                caption: 'Chapter Cover Panel',
              },
            ];

      const isPublishNow = uploadMode === 'live';
      const releaseDate = isPublishNow
        ? new Date().toISOString().split('T')[0]
        : uploadScheduleDate || new Date().toISOString().split('T')[0];

      const chapterId = `ch-${targetManga.id}-${Date.now()}`;
      const publishStatus = isPublishNow
        ? 'Live'
        : 'Coming Soon • Panels In Production';

      const newChapter: Chapter & { publishStatus?: string; scheduledFor?: string } = {
        id: chapterId,
        mangaId: targetManga.id,
        number: Math.max(1, Number(uploadChapterNumber) || 1),
        title: uploadChapterTitle.trim() || `Chapter ${uploadChapterNumber}`,
        releaseDate,
        pageCount: finalPages.length,
        accessType: 'free',
        pages: finalPages,
        likesCount: 0,
        commentsCount: 0,
        rating: 0,
        publishStatus,
        ...(isPublishNow ? {} : { scheduledFor: releaseDate }),
      };

      const token = getInMemoryAccessToken();
      if (token) {
        await fetch('/api/creator/chapters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            id: chapterId,
            mangaId: targetManga.id,
            number: newChapter.number,
            title: newChapter.title,
            panels: finalPages,
            publishMode: uploadMode,
            scheduledFor: isPublishNow ? null : releaseDate,
            releaseDate,
          }),
        }).catch(() => {});
      }

      const updatedManga: Manga = {
        ...targetManga,
        chapters: [...(targetManga.chapters || []), newChapter],
        publishedAt: isPublishNow ? new Date().toISOString() : targetManga.publishedAt,
        approvalStatus: isPublishNow ? 'approved' : targetManga.approvalStatus || 'pending_review',
      };

      onUpdateManga(updatedManga);
      setUploadPanels([]);
      const nextNum = updatedManga.chapters.length + 1;
      setUploadChapterNumber(nextNum);
      setUploadChapterTitle(`Episode ${nextNum}`);
      setActiveSection('manga');

      showToast(
        isPublishNow
          ? `Ch. ${newChapter.number} is now LIVE on Updates & Reader!`
          : `Ch. ${newChapter.number} saved as "Coming Soon • Panels In Production".`
      );
    } finally {
      setIsUploadingChapter(false);
    }
  };

  // Publish an in-production chapter live immediately
  const handlePublishChapterLive = async (manga: Manga, chapter: Chapter) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedChapters = (manga.chapters || []).map((c) =>
      c.id === chapter.id
        ? {
            ...c,
            releaseDate: today,
            publishStatus: 'Live',
            scheduledFor: undefined,
          }
        : c
    );

    const updatedManga: Manga = {
      ...manga,
      chapters: updatedChapters,
      approvalStatus: 'approved',
      publishedAt: new Date().toISOString(),
    };

    onUpdateManga(updatedManga);

    const token = getInMemoryAccessToken();
    if (token) {
      fetch(`/api/creator/chapters/${encodeURIComponent(chapter.id)}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      }).catch(() => {});
    }

    showToast(`Ch. ${chapter.number} published Live to Updates & Reader!`);
  };

  // Delete Chapter / Manga
  const handleConfirmDeleteChapter = () => {
    if (!chapterToDelete) return;
    const { manga, chapter } = chapterToDelete;
    onUpdateManga({
      ...manga,
      chapters: (manga.chapters || []).filter((c) => c.id !== chapter.id),
    });
    setChapterToDelete(null);
    showToast('Chapter deleted.');
  };

  const handleConfirmDeleteManga = async () => {
    if (!mangaToDelete) return;
    const targetId = mangaToDelete.id;
    onDeleteManga(targetId);
    setMangaToDelete(null);

    const token = getInMemoryAccessToken();
    if (token) {
      fetch(`/api/creator/mangas/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      }).catch(() => {});
    }
    showToast('Series deleted.');
  };

  // Section 4: Request ZAR Payout (Google Play compliant: Pending review 7-14 working days, min R100)
  const handleRequestPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(payoutAmountInput);
    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      showToast('Minimum payout is R100.');
      return;
    }
    if (!payoutReference.trim()) {
      showToast('Please enter your account number or PayFast email for creator payouts.');
      return;
    }

    setIsRequestingPayout(true);
    try {
      const token = getInMemoryAccessToken();
      let createdPayout: PayoutRow = {
        id: `pay-${Date.now()}`,
        creatorId: profile.uid,
        creatorEmail: normalizedUserEmail,
        amountZar: Number(numericAmount.toFixed(2)),
        method: payoutMethod,
        accountReference: payoutReference.trim(),
        status: 'Pending',
        paidAt: null,
        createdAt: new Date().toISOString(),
      };

      if (token) {
        const res = await fetch('/api/creator/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            amountZar: numericAmount,
            method: payoutMethod,
            accountReference: payoutReference.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || 'Could not submit payout request.');
          return;
        }
        if (data.payout) {
          createdPayout = {
            id: data.payout.id,
            creatorId: data.payout.creatorId || profile.uid,
            creatorEmail: data.payout.creatorEmail || normalizedUserEmail,
            amountZar: Number(data.payout.amountZar ?? numericAmount),
            method: data.payout.method || payoutMethod,
            accountReference: data.payout.accountReference || payoutReference.trim(),
            status: data.payout.status || 'Pending',
            paidAt: data.payout.paidAt ?? null,
            createdAt: data.payout.createdAt || new Date().toISOString(),
          };
        }
      }

      setDbPayouts((prev) => {
        const next = [createdPayout, ...prev];
        safeStorage.setJSONDeferred(scopedPayoutsStorageKey, next);
        return next;
      });
      setPayoutReference('');
      showToast(
        `Payout request of ${formatZar(createdPayout.amountZar)} submitted for review (Status: Pending Review · 7-14 working days).`
      );
    } finally {
      setIsRequestingPayout(false);
    }
  };

  // Jump straight to Section 2 Upload with preselected manga
  const jumpToUploadForManga = (manga: Manga) => {
    setUploadMangaId(manga.id);
    const nextNum = (manga.chapters?.length || 0) + 1;
    setUploadChapterNumber(nextNum);
    setUploadChapterTitle(`Episode ${nextNum}`);
    setActiveSection('upload');
    setTimeout(() => {
      document.getElementById('creator-upload-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // =========================================================================
  // ACCESS GATE: Non-creators see ONLY "Become a Creator — Apply Now"
  // =========================================================================
  if (authReady && !isCreator) {
    return (
      <div className="min-h-[75vh] bg-[#0A0A0A] text-white p-4 sm:p-8 max-w-3xl mx-auto flex flex-col justify-center space-y-6">
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/35 via-[#111216] to-slate-950 p-7 sm:p-10 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/25 to-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              Creator Studio Access
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Become a Creator — Apply Now
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The Creator Dashboard is reserved for approved AZ OVERVERSE creators. Apply with your pen name &amp; sample portfolio to publish manga, upload chapters, and earn 70% revenue share in ZAR.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="creator-gate-apply-btn"
              onClick={() => {
                if (onOpenApplyCreator) {
                  onOpenApplyCreator();
                } else {
                  onBackToCatalog?.();
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs shadow-lg hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Become a Creator — Apply Now</span>
            </button>
            {onBackToCatalog && (
              <button
                type="button"
                onClick={onBackToCatalog}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Reader</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-black/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* CREATOR DASHBOARD HEADER                                            */}
      {/* =================================================================== */}
      <div className="rounded-3xl border border-slate-800/90 bg-gradient-to-br from-[#121318] via-[#0E0F13] to-slate-950 p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {onBackToCatalog && (
              <button
                type="button"
                onClick={onBackToCatalog}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition shrink-0"
                aria-label="Back to Reader"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <img
              src={
                profile.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={profile.penName || profile.displayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">
                  {profile.penName || profile.displayName || 'Creator Studio'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  <span>Verified Creator</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {profile.email || currentUserEmail}
              </p>
              <div className="flex items-center gap-4 mt-1.5 text-xs font-mono tabular-nums">
                <span className="text-slate-300">
                  <strong className="text-white">{metrics.followers.toLocaleString()}</strong> Followers
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">
                  <strong className="text-amber-400">{metrics.totalReads.toLocaleString()}</strong> Total Reads
                </span>
                {dbConnected === false && (
                  <span className="text-[10px] text-amber-400/80 font-sans">Local Sync Active</span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Header CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="creator-dashboard-content-rules-btn"
              onClick={() => setShowContentRulesModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white font-bold text-xs transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Content Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewMangaModal(true)}
              className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Manga</span>
            </button>

            <button
              type="button"
              id="creator-header-upload-chapter-btn"
              onClick={() => {
                if (myMangas.length === 0) {
                  setShowNewMangaModal(true);
                  return;
                }
                setActiveSection('upload');
                setTimeout(() => {
                  document.getElementById('creator-upload-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 text-black font-black text-xs shadow-lg shadow-orange-950/50 hover:brightness-105 active:scale-95 transition flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>+ Upload New Chapter</span>
            </button>
          </div>
        </div>

        {/* Section Switcher Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/80 no-scrollbar">
          {(
            [
              { id: 'all', label: 'All Overview' },
              { id: 'manga', label: `My Manga (${myMangas.length})` },
              { id: 'upload', label: 'Upload' },
              { id: 'earnings', label: 'Earnings' },
              { id: 'payouts', label: 'Payouts' },
              { id: 'audience', label: 'Audience' },
            ] as Array<{ id: DashboardSectionTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                activeSection === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* COLLAPSIBLE NEVER ALLOWED CONTENT RULES WARNING BOX */}
      <div className="rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/50 via-slate-900 to-red-950/40 overflow-hidden shadow-lg transition-all">
        <button
          type="button"
          onClick={() => setIsWarningBoxExpanded((prev) => !prev)}
          className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left hover:bg-red-500/10 transition cursor-pointer"
          aria-expanded={isWarningBoxExpanded}
        >
          <div className="flex items-center gap-2.5">
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-red-300 uppercase tracking-wide">
                NEVER ALLOWED — Even in 18+
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-500/30 text-[10px] font-bold">
                AZ OVERVERSE Content Rules
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
            <span>{isWarningBoxExpanded ? 'Collapse' : 'Tap to Expand'}</span>
            {isWarningBoxExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {isWarningBoxExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 pt-1 border-t border-red-500/20 space-y-3"
            >
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-red-300">No explicit sex acts or visible genitals</strong>
                </li>
                <li>
                  <strong className="text-red-300">No pornographic / hentai content</strong>
                </li>
                <li>
                  <strong className="text-red-300">No sexual content involving minors</strong> or characters who look like minors
                </li>
                <li>
                  <strong className="text-red-300">No real photos</strong> of sexual content or real gore
                </li>
              </ul>
              <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowContentRulesModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>View All Rules &amp; Detailed Age Rating Guide →</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1 - MY MANGA                                                */}
      {/* =================================================================== */}
      {(activeSection === 'all' || activeSection === 'manga') && (
        <section id="creator-my-manga-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Section 1 · My Manga ({myMangas.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowNewMangaModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Manga</span>
            </button>
          </div>

          {myMangas.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Manga Series Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first series to start uploading chapters and tracking reads &amp; ZAR earnings.
              </p>
              <button
                type="button"
                onClick={() => setShowNewMangaModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs"
              >
                Create Your First Manga
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myMangas.map((manga) => {
                const badge = getSeriesStatusMeta(manga);
                const likesTotal =
                  (manga.bookmarksCount || 0) +
                  (manga.chapters || []).reduce((acc, ch) => acc + (ch.likesCount || 0), 0);

                return (
                  <div
                    key={manga.id}
                    className="rounded-3xl border border-slate-800 bg-[#111216] p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <img
                        src={manga.coverUrl || manga.cover || manga.coverImage}
                        alt={manga.title}
                        loading="lazy"
                        decoding="async"
                        className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl object-cover border border-slate-800 shrink-0 shadow-md"
                      />

                      <div className="flex-1 min-w-0 w-full space-y-2.5">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-white truncate">{manga.title}</h3>
                            <span className="text-xs text-slate-400">
                              {manga.genres?.join(', ') || 'Action'}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.className}`}
                          >
                            {badge.label === 'Live' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            {(manga.views || 0).toLocaleString()} reads
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-400" />
                            {likesTotal.toLocaleString()} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                            {(manga.chapters || []).length} chapters
                          </span>
                        </div>

                        {/* Required Action Buttons: Edit Manga | Upload Chapter | View */}
                        <div className="flex items-center flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingManga(manga);
                              setEditTitle(manga.title);
                              setEditDescription(manga.synopsis);
                              setEditCover(manga.coverUrl || manga.cover || manga.coverImage);
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit Manga</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => jumpToUploadForManga(manga)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:brightness-105 text-black font-black text-xs transition flex items-center gap-1.5 shadow"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Chapter</span>
                          </button>

                          {onViewManga && (
                            <button
                              type="button"
                              onClick={() => onViewManga(manga)}
                              className="px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setMangaToDelete(manga)}
                            className="px-3 py-2 rounded-xl border border-slate-800 hover:bg-rose-950/60 text-rose-400 text-xs font-semibold transition flex items-center gap-1"
                            title="Delete Manga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chapters Status List */}
                    <div className="border-t border-slate-800/80 pt-3 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Chapters ({manga.chapters?.length || 0})
                      </span>
                      {!manga.chapters || manga.chapters.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No chapters uploaded yet. Click &ldquo;Upload Chapter&rdquo; above.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {manga.chapters.map((chapter) => {
                            const chStatus = (chapter as any).publishStatus || (manga.approvalStatus === 'approved' ? 'Live' : 'Coming Soon • Panels In Production');
                            const isInProduction = chStatus !== 'Live';
                            return (
                              <div
                                key={chapter.id}
                                className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-mono font-bold text-amber-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded shrink-0">
                                    Ch. {chapter.number}
                                  </span>
                                  <span className="font-semibold text-white truncate">{chapter.title}</span>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    ({chapter.pages?.length || chapter.pageCount} panels)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      isInProduction
                                        ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    }`}
                                  >
                                    {chStatus}
                                  </span>
                                  {isInProduction && (
                                    <button
                                      type="button"
                                      onClick={() => handlePublishChapterLive(manga, chapter)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] transition"
                                    >
                                      Publish Now
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setChapterToDelete({ manga, chapter })}
                                    className="p-1 rounded-lg hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition"
                                    title="Delete chapter"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 2 - UPLOAD CHAPTER                                          */}
      {/* =================================================================== */}
      {(activeSection === 'all' || activeSection === 'upload') && (
        <section
          id="creator-upload-section"
          className="rounded-3xl border border-slate-800 bg-[#111216] p-4 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <UploadCloud className="w-4 h-4 text-orange-400" />
                <span>Section 2 · Upload Chapter</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select Manga &gt; Chapter Number &gt; Chapter Title &gt; Reorder Panels &gt; Publish Now or Schedule
              </p>
            </div>
            {myMangas.length === 0 && (
              <button
                type="button"
                onClick={() => setShowNewMangaModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
              >
                + Create Manga First
              </button>
            )}
          </div>

          <form onSubmit={handleUploadChapterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 block">
                  1. Select Manga
                </label>
                <select
                  value={uploadMangaId}
                  onChange={(e) => handleSelectUploadManga(e.target.value)}
                  disabled={myMangas.length === 0}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {myMangas.length === 0 ? (
                    <option value="">No series created yet</option>
                  ) : (
                    myMangas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 block">
                  2. Chapter #
                </label>
                <input
                  type="number"
                  min={1}
                  value={uploadChapterNumber}
                  onChange={(e) => setUploadChapterNumber(Number(e.target.value))}
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 block">
                  3. Chapter Title
                </label>
                <input
                  type="text"
                  value={uploadChapterTitle}
                  onChange={(e) => setUploadChapterTitle(e.target.value)}
                  placeholder="e.g. Awakening"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 4. Panel Images Upload & Reordering */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 block">
                4. Upload Panel Images (Multiple, Reorderable in Reading Sequence)
              </label>
              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-800 hover:border-orange-500/60 rounded-2xl bg-slate-950/60 cursor-pointer transition">
                <UploadCloud className="w-7 h-7 text-amber-400 mb-1" />
                <span className="text-xs font-bold text-white">Select Panel Images (JPG, PNG, WEBP)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Sorted automatically or reorder below using arrows
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePanelsUpload}
                  className="hidden"
                />
              </label>

              {uploadPanels.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 max-h-64 overflow-y-auto">
                  {uploadPanels.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-[3/4] group"
                    >
                      <img src={url} alt={`Panel ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300">
                        #{idx + 1}
                      </span>
                      <div className="absolute bottom-1 inset-x-1 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePanel(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded bg-black/80 text-white disabled:opacity-30 hover:bg-amber-500 hover:text-black transition"
                            title="Move earlier"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePanel(idx, 1)}
                            disabled={idx === uploadPanels.length - 1}
                            className="p-1 rounded bg-black/80 text-white disabled:opacity-30 hover:bg-amber-500 hover:text-black transition"
                            title="Move later"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadPanels((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500 transition"
                          title="Remove panel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Publish Now / Schedule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadMode('live')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    uploadMode === 'live'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Now (Moves to Updates / Reader)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('schedule')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    uploadMode === 'schedule'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule / Panels In Production</span>
                </button>
                {uploadMode === 'schedule' && (
                  <input
                    type="date"
                    value={uploadScheduleDate}
                    onChange={(e) => setUploadScheduleDate(e.target.value)}
                    className="rounded-xl bg-slate-950 border border-amber-500/40 px-2.5 py-1.5 text-xs text-white"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isUploadingChapter || myMangas.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs shadow-lg hover:brightness-105 disabled:opacity-50 transition"
              >
                {isUploadingChapter
                  ? 'Saving Chapter...'
                  : uploadMode === 'live'
                  ? 'Publish Chapter Live'
                  : 'Save as Coming Soon'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 3 - EARNINGS                                                */}
      {/* =================================================================== */}
      {(activeSection === 'all' || activeSection === 'earnings') && (
        <section
          id="creator-earnings-section"
          className="rounded-3xl border border-slate-800 bg-[#111216] p-4 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Section 3 · Earnings (ZAR)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track creator royalties across Google AdMob, VIP Passes, and Reader Tips
              </p>
            </div>

            {/* Moved from Menu -> Creator Dashboard > Earnings */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2.5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-emerald-300">70% Creator Rev-Share</div>
                <div className="text-[10px] text-slate-300">
                  Google AdMob • Google Play Billing — 70% to you, 30% to OVERVERSE
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-950 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Total Earnings (ZAR)
              </span>
              <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
                {formatZar(metrics.totalZar)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                70% Creator Share Active
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                This Month
              </span>
              <span className="text-lg font-black text-orange-400 font-mono tabular-nums mt-1 block">
                {formatZar(metrics.thisMonthZar)}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Current cycle</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ads · VIP · Tips
              </span>
              <div className="mt-1 space-y-0.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ads</span>
                  <span className="text-orange-400 font-bold">{formatZar(metrics.adsZar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VIP</span>
                  <span className="text-amber-400 font-bold">{formatZar(metrics.vipZar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tips</span>
                  <span className="text-emerald-400 font-bold">{formatZar(metrics.tipsZar)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Available Balance
              </span>
              <span className="text-lg font-black text-emerald-300 font-mono tabular-nums mt-1 block">
                {formatZar(metrics.availableBalanceZar)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Ready to withdraw</span>
            </div>
          </div>

          {/* Monthly Earnings Bar Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span>Monthly Revenue Trend (ZAR)</span>
              </span>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-orange-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block" /> Ads
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> VIP &amp; Tips
                </span>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#f59e0b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => [formatZar(Number(value)), '']}
                  />
                  <Bar dataKey="adsZar" name="Ads (ZAR)" stackId="rev" fill="#f97316" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="vipZar" name="VIP (ZAR)" stackId="rev" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tipsZar" name="Tips (ZAR)" stackId="rev" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 4 - CREATOR PAYOUTS (ZAR)                                   */}
      {/* =================================================================== */}
      {(activeSection === 'all' || activeSection === 'payouts') && (
        <section
          id="creator-payouts-section"
          className="rounded-3xl border border-slate-800 bg-[#111216] p-4 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5 max-w-2xl">
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Creator Payouts (ZAR)</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Earnings come from AdMob ads + Google Play Billing VIP. OVERVERSE receives payment from Google, then pays creators their 70% share. Payouts are reviewed and paid within 7-14 working days. Minimum payout R100.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Available ZAR Balance
              </span>
              <span className="text-lg font-black text-emerald-300 font-mono tabular-nums">
                {formatZar(metrics.availableBalanceZar)}
              </span>
            </div>
          </div>

          {/* Payout Request Form — Bank/Capitec/PayFast ONLY for outgoing creator payouts */}
          <form
            onSubmit={handleRequestPayoutSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-bold text-slate-300">
                Outgoing Creator Payout Destination (Bank / Capitec / PayFast)
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Private: Only visible to you and OVERVERSE Admin</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PAYOUT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayoutMethod(m.id)}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                    payoutMethod === m.id
                      ? 'border-amber-500 bg-amber-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {m.id === 'Bank' ? (
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : m.id === 'Capitec' ? (
                    <Smartphone className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black">{m.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{m.hint}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 block">
                  Amount (ZAR · Min R100)
                </label>
                <input
                  type="number"
                  min={100}
                  step="10"
                  value={payoutAmountInput}
                  onChange={(e) => setPayoutAmountInput(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400 block">
                  {payoutMethod} Account / Email (Private)
                </label>
                <input
                  type="text"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder={
                    payoutMethod === 'PayFast'
                      ? 'creator@email.com'
                      : 'Account number or Capitec ID'
                  }
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isRequestingPayout}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-black text-xs shadow-lg hover:brightness-105 disabled:opacity-50 transition"
              >
                {isRequestingPayout ? 'Submitting Request...' : 'Request Payout'}
              </button>
            </div>
          </form>

          {/* Creator/Admin-only toggle to unmask stored payout account reference */}
          {(isCreator || isAdmin) && dbPayouts.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Your payout destination details are private (Creator &amp; Admin only).</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPrivateBankDetails((prev) => !prev)}
                className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition"
              >
                {showPrivateBankDetails ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Bank Details</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Bank Details</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Payout History Table: Requested Date | Amount | Status | Paid Date */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                {dbPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center font-sans text-slate-500">
                      No payouts requested yet. Minimum payout R100.
                    </td>
                  </tr>
                ) : (
                  dbPayouts.map((row) => {
                    const displayStatus = getDisplayPayoutStatus(row.status);
                    const isOwner =
                      !row.creatorId ||
                      row.creatorId === profile.uid ||
                      (row.creatorEmail && row.creatorEmail.toLowerCase() === normalizedUserEmail);
                    const canViewBankDetails = isAdmin || isOwner;

                    return (
                      <tr key={row.id} className="hover:bg-slate-900/50">
                        <td className="py-3 px-4 text-slate-300">
                          <div>{new Date(row.createdAt).toLocaleDateString('en-ZA')}</div>
                          {canViewBankDetails && row.accountReference && (
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              {row.method}:{' '}
                              <span className="font-mono">
                                {showPrivateBankDetails
                                  ? row.accountReference
                                  : maskBankReference(row.accountReference)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-bold">
                          {formatZar(row.amountZar)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block font-sans px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              displayStatus === 'Paid'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : displayStatus === 'Approved'
                                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {row.paidAt
                            ? new Date(row.paidAt).toLocaleDateString('en-ZA')
                            : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* SECTION 5 - AUDIENCE                                                */}
      {/* =================================================================== */}
      {(activeSection === 'all' || activeSection === 'audience') && (
        <section
          id="creator-audience-section"
          className="rounded-3xl border border-slate-800 bg-[#111216] p-4 sm:p-6 space-y-4"
        >
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Section 5 · Audience</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Followers
              </span>
              <span className="text-xl font-black text-white font-mono tabular-nums mt-1 block">
                {metrics.followers.toLocaleString()}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-orange-400" /> Total Reads
              </span>
              <span className="text-xl font-black text-orange-400 font-mono tabular-nums mt-1 block">
                {metrics.totalReads.toLocaleString()}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Top Chapter
              </span>
              <span className="text-sm font-black text-white mt-1 block truncate">
                {metrics.topChapter
                  ? `Ch. ${metrics.topChapter.chapterNumber} · ${metrics.topChapter.title}`
                  : 'No chapters yet'}
              </span>
              {metrics.topChapter && (
                <span className="text-[10px] font-mono text-amber-400">
                  {metrics.topChapter.reads.toLocaleString()} reads
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Top Manga
              </span>
              <span className="text-sm font-black text-white mt-1 block truncate">
                {metrics.topManga ? metrics.topManga.title : 'No series yet'}
              </span>
              {metrics.topManga && (
                <span className="text-[10px] font-mono text-emerald-400">
                  {(metrics.topManga.views || 0).toLocaleString()} reads
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Comments
              </span>
              <span className="text-xl font-black text-white font-mono tabular-nums mt-1 block">
                {metrics.commentsCount.toLocaleString()}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* MODALS: NEW MANGA, EDIT MANGA, DELETE CONFIRMATIONS & CONTENT RULES */}
      {/* =================================================================== */}
      <AnimatePresence>
        {showNewMangaModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-slate-950 p-4 sm:p-5 shadow-2xl text-white space-y-3.5 my-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">New Manga Series</h3>
                    <p className="text-[11px] text-slate-400">Add your cover, synopsis &amp; age rating</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewMangaModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMangaSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">
                    Manga Title *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Chronicles of Nkosi"
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">
                    Cover Image *
                  </label>
                  <div className="flex items-center gap-2.5">
                    {newCoverImage ? (
                      <img
                        src={newCoverImage}
                        alt="Cover preview"
                        className="w-12 h-14 rounded-lg object-cover border border-amber-400 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-14 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <label className="block cursor-pointer px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition text-center font-semibold">
                        <span>Upload Cover Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverFileUpload(e, false)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={newCoverImage.startsWith('data:') ? '' : newCoverImage}
                        onChange={(e) => setNewCoverImage(e.target.value)}
                        placeholder="Or paste cover URL..."
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">
                    Synopsis *
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief synopsis of story and themes..."
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block">Genre</label>
                  <div className="flex flex-wrap gap-1">
                    {GENRE_OPTIONS.map((genre) => {
                      const isSelected = newGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() =>
                            setNewGenres(
                              isSelected ? newGenres.filter((g) => g !== genre) : [...newGenres, genre]
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block">Language</label>
                    <select
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block">
                        Age Rating *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowContentRulesModal(true)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        View All Rules -&gt;
                      </button>
                    </div>
                    <select
                      value={newAgeRating}
                      onChange={(e) => setNewAgeRating(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    >
                      {AGE_RATING_OPTIONS.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {newAgeRating === 'All Ages' && (
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1.5 font-medium">
                    <Baby className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>All Ages: No blood, gore, or swearing.</span>
                  </div>
                )}
                {newAgeRating === '13+' && (
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 flex items-center gap-1.5 font-medium">
                    <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>13+: Mild action, crushes, fantasy. No gore or sexual content.</span>
                  </div>
                )}
                {newAgeRating === '16+' && (
                  <div className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5 font-medium">
                    <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>16+: Stronger violence &amp; horror. No explicit sex.</span>
                  </div>
                )}
                {newAgeRating === '18+' && (
                  <div className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300 flex items-center gap-1.5 font-medium">
                    <Skull className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>18+: Dark themes, mature violence. NO pornography.</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewMangaModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg hover:brightness-105 transition"
                  >
                    Create Series
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT MANGA */}
      <AnimatePresence>
        {editingManga && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Edit Manga: {editingManga.title}</h3>
                <button
                  type="button"
                  onClick={() => setEditingManga(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditManga} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">Cover Image</label>
                  <div className="flex items-center gap-3">
                    {editCover && (
                      <img
                        src={editCover}
                        alt="Cover"
                        className="w-12 h-16 rounded-xl object-cover border border-amber-400"
                      />
                    )}
                    <label className="flex-1 cursor-pointer px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-center">
                      <span>Change Cover</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCoverFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingManga(null)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MANGA */}
      <AnimatePresence>
        {mangaToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl border border-rose-500/40 bg-slate-950 p-6 shadow-2xl text-white space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Manga Series?</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Delete <strong className="text-white">&ldquo;{mangaToDelete.title}&rdquo;</strong>? This cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMangaToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteManga}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE CHAPTER */}
      <AnimatePresence>
        {chapterToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-3xl border border-rose-500/40 bg-slate-950 p-6 shadow-2xl text-white space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Chapter?</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Delete <strong className="text-white">&ldquo;{chapterToDelete.chapter.title}&rdquo;</strong> (Ch. {chapterToDelete.chapter.number})?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setChapterToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteChapter}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONTENT RULES MODAL */}
      <AnimatePresence>
        {showContentRulesModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowContentRulesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-slate-950 p-6 sm:p-8 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      AZ OVERVERSE - Age Rating Rules
                    </h2>
                    <p className="text-xs text-slate-400">Content Rules &amp; Publishing Standards</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContentRulesModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                    ALL AGES
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No blood, no gore, no swearing, no scary horror.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs">
                    13+
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mild action violence, mild swearing, romance crushes. No gore or sexual content.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                    16+
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Stronger violence, blood, horror, trauma, implied intimacy only. No explicit sex.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-1">
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs">
                    18+
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Intense gore, graphic violence, dark mature themes. Strictly NO pornography.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/40 border-2 border-red-500/50 space-y-2">
                <h4 className="text-xs font-black uppercase text-red-300 tracking-wide flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>NEVER ALLOWED — Even in 18+:</span>
                </h4>
                <ul className="text-xs text-red-100/90 space-y-1 list-disc list-inside">
                  <li>No explicit sex acts or visible genitals</li>
                  <li>No pornographic / hentai content</li>
                  <li>No sexual content involving minors or characters who look like minors</li>
                  <li>No real photos of sexual content or real gore</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowContentRulesModal(false)}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
