import React, { useState, useMemo } from 'react';
import {
  X,
  UploadCloud,
  Plus,
  BookOpen,
  Eye,
  TrendingUp,
  Coins,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  Star,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  FileText,
  Image,
  Edit3,
  Bookmark,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Heart,
  MessageSquare,
  BarChart3,
  Settings,
  Filter,
  Calendar,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { Manga, CreatorStats, Chapter, Comment } from '../../types';
import { isUserApprovedMangaka } from '../../utils/mangakaManager';
import { USD_TO_ZAR_RATE } from '../../data/paymentData';
import { uploadCoverFile } from '../../services/coverStorage';
import { MangaCoverImage } from '../common/MangaCoverImage';
import { ChapterUploadManager } from './ChapterUploadManager';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface MangakaDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  mangaList: Manga[];
  creatorStats: CreatorStats;
  onSubmitNewManga: (newManga: Manga) => void;
  onOpenApplyModal: () => void;
  onDeleteManga?: (mangaId: string) => void;
  onPublishChapter?: (mangaId: string, chapter: Chapter) => void;
  comments?: Comment[];
}

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
];

const SAMPLE_PAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=800&auto=format&fit=crop&q=80',
];

export const MangakaDashboardModal: React.FC<MangakaDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  mangaList,
  creatorStats,
  onSubmitNewManga,
  onOpenApplyModal,
  onDeleteManga,
  onPublishChapter,
  comments = [],
}) => {
  const [activeTab, setActiveTab] = useState<'my_mangas' | 'upload_chapter' | 'views' | 'earnings'>('my_mangas');
  const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);
  const [editingMangaId, setEditingMangaId] = useState<string | null>(null);

  // Sub-filter for My Mangas tab: 'all' | 'draft' | 'pending' | 'published'
  const [mangaSubFilter, setMangaSubFilter] = useState<'all' | 'draft' | 'pending' | 'published'>('all');

  // Selected manga for upload chapter flow
  const [selectedChapterUploadMangaId, setSelectedChapterUploadMangaId] = useState<string | undefined>(undefined);

  // Selected manga for Analytics drilldown
  const [analyticsMangaFilter, setAnalyticsMangaFilter] = useState<string>('all');
  const [expandedChapterTableMangaId, setExpandedChapterTableMangaId] = useState<string | null>(null);

  // Form State for Series Creation & Managing Series Details
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState(SAMPLE_COVERS[0]);
  const [bannerImage, setBannerImage] = useState(SAMPLE_COVERS[0]);
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('Mbhele Studio');
  const [artistName, setArtistName] = useState('Mbhele Studio');
  const [genres, setGenres] = useState('Action, Shonen, Afro-Futurism');
  const [status, setStatus] = useState<'ONGOING' | 'COMPLETED'>('ONGOING');

  // Chapter 1 / Draft Chapter form state
  const [chapter1Title, setChapter1Title] = useState('Episode 1: Dawn of the Blade');
  const [chapter1Number, setChapter1Number] = useState(1);
  const [chapter1AccessType, setChapter1AccessType] = useState<'free' | 'premium'>('free');
  const [chapter1Pages, setChapter1Pages] = useState<string[]>(SAMPLE_PAGES);
  const [customPageUrl, setCustomPageUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadMsg, setCoverUploadMsg] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  if (!isOpen) return null;

  const isApproved = isUserApprovedMangaka(currentUserEmail);

  // Filter creator's mangas
  const myMangas = mangaList.filter(
    (m) =>
      m.submittedByEmail?.toLowerCase() === currentUserEmail.toLowerCase() ||
      m.author.toLowerCase().includes(currentUserEmail.split('@')[0].toLowerCase()) ||
      currentUserEmail.toLowerCase() === 'mlungisenimbhele3@gmail.com' ||
      currentUserEmail.toLowerCase() === 'azoververse@gmail.com'
  );

  const draftMangas = myMangas.filter((m) => m.approvalStatus === 'draft');
  const pendingMangas = myMangas.filter((m) => m.approvalStatus === 'pending_review');
  const publishedMangas = myMangas.filter(
    (m) => m.approvalStatus !== 'draft' && m.approvalStatus !== 'pending_review' && m.approvalStatus !== 'rejected'
  );

  const filteredMyMangas = myMangas.filter((m) => {
    if (mangaSubFilter === 'draft') return m.approvalStatus === 'draft';
    if (mangaSubFilter === 'pending') return m.approvalStatus === 'pending_review';
    if (mangaSubFilter === 'published')
      return m.approvalStatus !== 'draft' && m.approvalStatus !== 'pending_review' && m.approvalStatus !== 'rejected';
    return true;
  });

  // Calculate Aggregated Performance Analytics
  const totalViews = publishedMangas.reduce((acc, m) => acc + (m.views || 0), 0);
  const totalChapters = myMangas.reduce((acc, m) => acc + (m.chapters ? m.chapters.length : 0), 0);

  // Total Likes across all chapters of creator's mangas
  const totalLikes = myMangas.reduce((acc, m) => {
    const mangaLikes = (m.chapters || []).reduce((sum, ch) => sum + (ch.likesCount || 0), 0);
    return acc + mangaLikes;
  }, 0);

  // Total Comments on creator's mangas
  const myMangaIds = myMangas.map((m) => m.id);
  const relevantComments = comments.filter((c) => myMangaIds.includes(c.mangaId));
  const totalComments = myMangas.reduce((acc, m) => {
    const directCommentsCount = relevantComments.filter((c) => c.mangaId === m.id).length;
    const chapterCommentsCount = (m.chapters || []).reduce((sum, ch) => sum + (ch.commentsCount || 0), 0);
    return acc + Math.max(directCommentsCount, chapterCommentsCount);
  }, 0);

  const overallEngagementRate = totalViews > 0
    ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1)
    : '0.0';

  const totalEarningsUSD = 0;
  const totalEarningsZAR = 0;

  // Handle Cover File Upload to cloud storage
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const url = await uploadCoverFile(file);
      setCoverImage(url);
      setBannerImage(url);
      setCoverUploadMsg('Cover uploaded to cloud storage successfully!');
      setTimeout(() => setCoverUploadMsg(null), 4000);
    } catch (err) {
      console.error('Failed to upload cover:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Open fresh upload form for new manga series
  const handleStartNewUpload = () => {
    setEditingMangaId(null);
    setTitle('');
    setDescription('');
    setAuthorName('Mbhele Studio');
    setArtistName('Mbhele Studio');
    setGenres('Action, Shonen, Afro-Futurism');
    setStatus('ONGOING');
    setCoverImage(SAMPLE_COVERS[0]);
    setBannerImage(SAMPLE_COVERS[0]);
    setChapter1Title('Episode 1: Dawn of the Blade');
    setChapter1Number(1);
    setChapter1AccessType('free');
    setChapter1Pages([...SAMPLE_PAGES]);
    setCustomPageUrl('');
    setIsUploadFormOpen(true);
  };

  // Open series details editor (for draft, pending, or published series)
  const handleEditSeriesDetails = (manga: Manga) => {
    setEditingMangaId(manga.id);
    setTitle(manga.title);
    setDescription(manga.synopsis || '');
    setAuthorName(manga.author || 'Mbhele Studio');
    setArtistName(manga.artist || manga.author || 'Mbhele Studio');
    setGenres(manga.genres ? manga.genres.join(', ') : 'Action, Shonen');
    setStatus(manga.status || 'ONGOING');
    setCoverImage(manga.coverImage || manga.coverUrl || (manga as any).cover || SAMPLE_COVERS[0]);
    setBannerImage(manga.bannerImage || manga.coverImage || SAMPLE_COVERS[0]);

    if (manga.chapters && manga.chapters.length > 0) {
      const ch1 = manga.chapters[0];
      setChapter1Title(ch1.title);
      setChapter1Number(ch1.number || 1);
      setChapter1AccessType(ch1.accessType || 'free');
      setChapter1Pages(
        ch1.pages && ch1.pages.length > 0
          ? ch1.pages.map((p) => p.imageUrl)
          : [...SAMPLE_PAGES]
      );
    } else {
      setChapter1Title('Episode 1: Dawn of the Blade');
      setChapter1Number(1);
      setChapter1AccessType('free');
      setChapter1Pages([...SAMPLE_PAGES]);
    }

    setCustomPageUrl('');
    setIsUploadFormOpen(true);
  };

  // Save changes to series details
  const handleSaveSeriesDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setToastMessage({
        text: 'Please provide both a Manga Title and Synopsis before saving series details.',
        type: 'error',
      });
      return;
    }

    const existingManga = editingMangaId ? mangaList.find((m) => m.id === editingMangaId) : null;
    const mangaId = editingMangaId || `manga-${Date.now()}`;

    const updatedManga: Manga = {
      ...(existingManga || {}),
      id: mangaId,
      title: title.trim(),
      author: authorName.trim() || 'Mangaka Creator',
      artist: artistName.trim() || authorName.trim() || 'Mangaka Artist',
      cover: coverImage || SAMPLE_COVERS[0],
      coverUrl: coverImage || SAMPLE_COVERS[0],
      coverImage: coverImage || SAMPLE_COVERS[0],
      bannerImage: bannerImage || coverImage || SAMPLE_COVERS[0],
      genres: genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      status: status,
      synopsis: description.trim(),
      rating: existingManga?.rating || 5.0,
      views: existingManga?.views || 0,
      bookmarksCount: existingManga?.bookmarksCount || 0,
      monetizationModel: existingManga?.monetizationModel || 'hybrid',
      chapters: existingManga && existingManga.chapters && existingManga.chapters.length > 0
        ? existingManga.chapters
        : [
            {
              id: `ch-1-${Date.now()}`,
              mangaId,
              number: chapter1Number || 1,
              title: chapter1Title.trim() || 'Episode 1: The Beginning',
              releaseDate: new Date().toISOString().split('T')[0],
              pageCount: chapter1Pages.length,
              accessType: chapter1AccessType,
              likesCount: 0,
              commentsCount: 0,
              pages: chapter1Pages.map((url, idx) => ({
                id: `p-${idx + 1}-${Date.now()}`,
                pageNumber: idx + 1,
                imageUrl: url,
              })),
            },
          ],
      approvalStatus: existingManga?.approvalStatus || (isApproved ? 'approved' : 'pending_review'),
      submittedByEmail: existingManga?.submittedByEmail || currentUserEmail,
      submittedAt: existingManga?.submittedAt || new Date().toISOString(),
      featured: existingManga?.featured || false,
    };

    onSubmitNewManga(updatedManga);
    setIsUploadFormOpen(false);
    setEditingMangaId(null);
    setToastMessage({
      text: `Series details for "${updatedManga.title}" saved successfully!`,
      type: 'success',
    });
  };

  // Save as Draft
  const handleSaveAsDraft = () => {
    const draftTitle = title.trim() || 'Untitled Manga Draft';
    const mangaId = editingMangaId || `draft-${Date.now()}`;
    const chapterId = `ch-1-${Date.now()}`;

    const draftChapter: Chapter = {
      id: chapterId,
      mangaId,
      number: chapter1Number || 1,
      title: chapter1Title.trim() || 'Episode 1 (Draft)',
      releaseDate: new Date().toISOString().split('T')[0],
      pageCount: chapter1Pages.length,
      accessType: chapter1AccessType,
      likesCount: 0,
      commentsCount: 0,
      pages: chapter1Pages.map((url, idx) => ({
        id: `p-${idx + 1}-${Date.now()}`,
        pageNumber: idx + 1,
        imageUrl: url,
      })),
    };

    const draftManga: Manga = {
      id: mangaId,
      title: draftTitle,
      author: authorName.trim() || 'Mangaka Creator',
      artist: artistName.trim() || authorName.trim() || 'Mangaka Artist',
      cover: coverImage || SAMPLE_COVERS[0],
      coverUrl: coverImage || SAMPLE_COVERS[0],
      coverImage: coverImage || SAMPLE_COVERS[0],
      bannerImage: bannerImage || coverImage || SAMPLE_COVERS[0],
      genres: genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      status: status,
      synopsis: description.trim() || 'Draft work in progress. Synopsis will be finalized before official review.',
      rating: 5.0,
      views: 0,
      bookmarksCount: 0,
      monetizationModel: 'hybrid',
      chapters: [draftChapter],
      approvalStatus: 'draft',
      submittedByEmail: currentUserEmail,
      featured: false,
    };

    onSubmitNewManga(draftManga);
    setIsUploadFormOpen(false);
    setMangaSubFilter('draft');
    setToastMessage({
      text: `Draft "${draftTitle}" saved! You can edit metadata and chapter pages anytime before submitting for official review.`,
      type: 'success',
    });
  };

  // Submit for Official Review
  const handleSubmitForReview = (e?: React.FormEvent, directManga?: Manga) => {
    if (e) e.preventDefault();

    if (directManga) {
      const updated: Manga = {
        ...directManga,
        approvalStatus: 'pending_review',
        submittedAt: new Date().toISOString(),
      };
      onSubmitNewManga(updated);
      setToastMessage({
        text: `"${directManga.title}" submitted for official review! Admin (Mlungiseni Mbhele) will evaluate your series.`,
        type: 'success',
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      setToastMessage({
        text: 'Please provide both a Manga Title and Synopsis before submitting for official review.',
        type: 'error',
      });
      return;
    }

    if (chapter1Pages.length === 0) {
      setToastMessage({
        text: 'Please attach at least one page to Chapter 1 before submitting for review.',
        type: 'error',
      });
      return;
    }

    const mangaId = editingMangaId || `submitted-${Date.now()}`;
    const chapterId = `ch-1-${Date.now()}`;

    const newChapter1: Chapter = {
      id: chapterId,
      mangaId,
      number: chapter1Number || 1,
      title: chapter1Title.trim() || 'Episode 1: The Beginning',
      releaseDate: new Date().toISOString().split('T')[0],
      pageCount: chapter1Pages.length,
      accessType: chapter1AccessType,
      likesCount: 0,
      commentsCount: 0,
      pages: chapter1Pages.map((url, idx) => ({
        id: `p-${idx + 1}-${Date.now()}`,
        pageNumber: idx + 1,
        imageUrl: url,
      })),
    };

    const newManga: Manga = {
      id: mangaId,
      title: title.trim(),
      author: authorName.trim() || 'Mangaka Creator',
      artist: artistName.trim() || authorName.trim() || 'Mangaka Artist',
      cover: coverImage || SAMPLE_COVERS[0],
      coverUrl: coverImage || SAMPLE_COVERS[0],
      coverImage: coverImage || SAMPLE_COVERS[0],
      bannerImage: bannerImage || coverImage || SAMPLE_COVERS[0],
      genres: genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      status: status,
      synopsis: description.trim(),
      rating: 5.0,
      views: 0,
      bookmarksCount: 0,
      monetizationModel: 'hybrid',
      chapters: [newChapter1],
      approvalStatus: 'pending_review',
      submittedByEmail: currentUserEmail,
      submittedAt: new Date().toISOString(),
      featured: false,
    };

    onSubmitNewManga(newManga);
    setIsUploadFormOpen(false);
    setMangaSubFilter('pending');
    setToastMessage({
      text: `"${newManga.title}" submitted for official review! Admin (Mlungiseni Mbhele) will evaluate your series.`,
      type: 'success',
    });
  };

  // Delete draft
  const handleDeleteDraft = (mangaId: string, mangaTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the draft "${mangaTitle}"? This cannot be undone.`)) {
      onDeleteManga?.(mangaId);
      setToastMessage({
        text: `Draft "${mangaTitle}" deleted.`,
        type: 'info',
      });
    }
  };

  // Add custom page URL to chapter 1
  const handleAddPage = () => {
    if (!customPageUrl.trim()) return;
    setChapter1Pages((prev) => [...prev, customPageUrl.trim()]);
    setCustomPageUrl('');
  };

  // Remove page from chapter 1
  const handleRemovePage = (index: number) => {
    setChapter1Pages((prev) => prev.filter((_, i) => i !== index));
  };

  // Move page position
  const handleMovePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapter1Pages.length) return;
    const newPages = [...chapter1Pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setChapter1Pages(newPages);
  };

  // Prepare Chart Data for Analytics
  const analyticsChartData = useMemo(() => {
    return myMangas.map((m) => {
      const likes = (m.chapters || []).reduce((s, c) => s + (c.likesCount || 0), 0);
      const mComments = relevantComments.filter((c) => c.mangaId === m.id).length ||
        (m.chapters || []).reduce((s, c) => s + (c.commentsCount || 0), 0);
      return {
        name: m.title.length > 14 ? m.title.substring(0, 14) + '...' : m.title,
        fullTitle: m.title,
        views: m.views || 0,
        likes: likes,
        comments: mComments,
      };
    });
  }, [myMangas, relevantComments]);

  // Selected Manga for chapter drilldown in Analytics
  const drilldownManga = analyticsMangaFilter === 'all'
    ? myMangas[0] || mangaList[0]
    : myMangas.find((m) => m.id === analyticsMangaFilter) || myMangas[0];

  return (
    <div
      id="mangaka-dashboard-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Mangaka Dashboard"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-amber-500/50 bg-slate-950 p-5 sm:p-7 text-white shadow-2xl z-10 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Author & Mangaka Studio
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isApproved ? 'Approved Author' : 'Verification Needed'}
                </span>
                {draftMangas.length > 0 && (
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                    {draftMangas.length} Draft{draftMangas.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Upload new chapters, manage series details & cover art, and track real-time reader performance (views, likes, comments).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white text-xs ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Approval Needed Banner if NOT approved */}
        {!isApproved && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Mangaka Verification Required to Publish
                </h4>
                <p className="text-[11px] text-slate-300">
                  Submit your name, bio, and ID photo to unlock full series publishing and instant chapter drops.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenApplyModal();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-black text-xs transition shadow shrink-0"
            >
              Apply as Mangaka Now
            </button>
          </div>
        )}

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>My Series</span>
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black font-mono text-white">{myMangas.length}</div>
            <span className="text-[10px] text-slate-400">
              {publishedMangas.length} Live • <strong className="text-amber-400">{draftMangas.length} Drafts</strong>
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Total Views</span>
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black font-mono text-cyan-400">
              {totalViews.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">{totalChapters} Chapters</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Reader Likes</span>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
            </div>
            <div className="text-xl font-black font-mono text-rose-400">
              {totalLikes.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Total Chapter Hearts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Discussions</span>
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black font-mono text-purple-400">
              {totalComments.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">{overallEngagementRate}% Eng. Rate</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
              <span>Live Earnings</span>
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black font-mono tabular-nums text-emerald-400 truncate">
              R0
            </div>
            <span className="text-[10px] text-slate-400">70% Royalty Splits</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {/* TAB 1: Series Manager */}
            <button
              onClick={() => {
                setActiveTab('my_mangas');
                setIsUploadFormOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'my_mangas' && !isUploadFormOpen
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Series & Details ({myMangas.length})</span>
            </button>

            {/* TAB 2: Upload Chapter */}
            <button
              onClick={() => {
                setActiveTab('upload_chapter');
                setIsUploadFormOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'upload_chapter' && !isUploadFormOpen
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Upload Chapter</span>
            </button>

            {/* TAB 3: Views & Analytics */}
            <button
              onClick={() => {
                setActiveTab('views');
                setIsUploadFormOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'views' && !isUploadFormOpen
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analytics (Views, Likes, Comments)</span>
            </button>

            {/* TAB 4: Earnings */}
            <button
              onClick={() => {
                setActiveTab('earnings');
                setIsUploadFormOpen(false);
              }}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'earnings' && !isUploadFormOpen
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>70% Payouts</span>
            </button>
          </div>

          {/* + NEW MANGA SERIES BUTTON */}
          <button
            id="mangaka-upload-manga-btn"
            disabled={!isApproved}
            onClick={handleStartNewUpload}
            className={`flex items-center justify-center gap-1.5 py-2 px-3.5 sm:px-4 rounded-xl text-xs font-black transition shadow-md shrink-0 ${
              isApproved
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            title={
              isApproved
                ? 'Create a new manga series or draft'
                : 'Approval required from Admin before creating new series'
            }
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ NEW SERIES</span>
          </button>
        </div>

        {/* =======================================================================
            SERIES DETAILS & DRAFT EDITOR FORM
            Allows authors to manage title, synopsis, status, genres, cover art, etc.
            ======================================================================= */}
        {isUploadFormOpen ? (
          <div className="mt-5 p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-amber-500/50 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-black text-white">
                    {editingMangaId ? 'Manage Series Details & Metadata' : 'Create New Manga Series'}
                  </h4>
                  {editingMangaId && (
                    <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5">
                      Editing: {title || 'Series'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your manga title, synopsis, serialization status, genres, and cover art.
                </p>
              </div>
              <button
                onClick={() => setIsUploadFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                title="Close editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSeriesDetails} className="space-y-5">
              {/* Title & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Manga Series Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Nkosi the tale of Myths"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Serialization Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ONGOING' | 'COMPLETED')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="ONGOING">ONGOING (Active Series)</option>
                    <option value="COMPLETED">COMPLETED (Finished Series)</option>
                  </select>
                </div>
              </div>

              {/* Author, Artist & Genres */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Story / Author Pen Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Mlungiseni Mbhele"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Illustration / Artist Pen Name
                  </label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="e.g. Mbhele Studio"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Genres * (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Action, Shonen, Pan-African, Fantasy"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Manga Cover Artwork */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Series Cover Artwork
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer transition shadow">
                    {isUploadingCover ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Cover File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingCover}
                      onChange={handleCoverFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {coverUploadMsg && (
                  <p className="text-[11px] text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{coverUploadMsg}</span>
                  </p>
                )}

                <div className="grid grid-cols-5 gap-2 mb-2">
                  {SAMPLE_COVERS.map((cov, idx) => (
                    <button
                      type="button"
                      key={`sample-cov-${idx}`}
                      onClick={() => setCoverImage(cov)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition ${
                        coverImage === cov
                          ? 'border-amber-500 ring-2 ring-amber-400'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <MangaCoverImage src={cov} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover" />
                      {coverImage === cov && (
                        <div className="absolute top-1 right-1 rounded-full bg-amber-500 p-0.5 text-black">
                          <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Or paste custom Cover Image URL"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Description / Synopsis */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Synopsis *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an enticing summary of the lore, protagonists, conflict, and world-building..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  <span className="text-amber-400 font-semibold">• Manage Details</span> updates series metadata and art in real time.
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsUploadFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>

                  {!editingMangaId && (
                    <button
                      type="button"
                      id="mangaka-save-draft-btn"
                      onClick={handleSaveAsDraft}
                      className="px-4 py-2 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      <span>SAVE AS DRAFT</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    id="mangaka-save-series-details-btn"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-black text-xs transition shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>SAVE SERIES DETAILS</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}

        {/* =======================================================================
            TAB 1: MY MANGAS & SERIES DETAILS
            ======================================================================= */}
        {!isUploadFormOpen && activeTab === 'my_mangas' && (
          <div className="mt-5 space-y-4">
            {/* Sub-Filters: All | Drafts | Pending Review | Published */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${myMangas.length})` },
                  { id: 'draft', label: `Drafts (${draftMangas.length})`, highlight: draftMangas.length > 0 },
                  { id: 'pending', label: `Pending Review (${pendingMangas.length})` },
                  { id: 'published', label: `Published (${publishedMangas.length})` },
                ].map((f, idx) => (
                  <button
                    key={`${f.id}-${idx}`}
                    onClick={() => setMangaSubFilter(f.id as any)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      mangaSubFilter === f.id
                        ? 'bg-amber-500 text-black font-black shadow'
                        : f.highlight
                        ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-400">
                Showing <strong className="text-white">{filteredMyMangas.length}</strong> series
              </span>
            </div>

            {/* List of Creator Mangas & Series */}
            {filteredMyMangas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  {mangaSubFilter === 'draft'
                    ? 'No Draft Mangas Saved'
                    : mangaSubFilter === 'pending'
                    ? 'No Mangas Pending Review'
                    : mangaSubFilter === 'published'
                    ? 'No Published Mangas Yet'
                    : 'No Mangas in Studio Yet'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {mangaSubFilter === 'draft'
                    ? 'You can create a new series and choose "Save as Draft" to work on it without publishing.'
                    : 'Tap "+ NEW SERIES" above to create and publish your original manga work.'}
                </p>
                {isApproved && (
                  <button
                    onClick={handleStartNewUpload}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs transition shadow"
                  >
                    + CREATE NEW MANGA SERIES
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMyMangas.map((manga, idx) => {
                  const isDraft = manga.approvalStatus === 'draft';
                  const isPending = manga.approvalStatus === 'pending_review';
                  const isApprovedSeries =
                    manga.approvalStatus !== 'draft' &&
                    manga.approvalStatus !== 'pending_review' &&
                    manga.approvalStatus !== 'rejected';

                  const mangaLikes = (manga.chapters || []).reduce((sum, ch) => sum + (ch.likesCount || 0), 0);
                  const mangaComments = relevantComments.filter((c) => c.mangaId === manga.id).length ||
                    (manga.chapters || []).reduce((sum, ch) => sum + (ch.commentsCount || 0), 0);

                  return (
                    <div
                      key={`${manga.id}-${idx}`}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isDraft
                          ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/70 to-slate-950 shadow-md'
                          : isPending
                          ? 'border-cyan-500/40 bg-slate-900/70'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Cover & Info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <MangaCoverImage
                          coverUrl={manga.coverUrl || (manga as any).cover || manga.coverImage}
                          src={manga.coverUrl || (manga as any).cover || manga.coverImage}
                          alt={manga.title}
                          title={manga.title}
                          className="w-16 h-24 rounded-xl object-cover border border-slate-800 shrink-0 shadow"
                        />
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-black text-white truncate">{manga.title}</h4>

                            {/* Status Badge */}
                            {isDraft && (
                              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 text-[9px] font-black uppercase">
                                <Bookmark className="w-2.5 h-2.5 text-amber-400" />
                                <span>Draft • Unpublished</span>
                              </span>
                            )}

                            {isPending && (
                              <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 text-[9px] font-black uppercase">
                                Pending Admin Review
                              </span>
                            )}

                            {isApprovedSeries && (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 text-[9px] font-black uppercase">
                                Live & Published
                              </span>
                            )}

                            <span className="rounded-full bg-slate-800 text-slate-300 px-2 py-0.5 text-[9px] font-bold uppercase">
                              {manga.status || 'ONGOING'}
                            </span>

                            {manga.featured && (
                              <span className="flex items-center gap-0.5 rounded-full bg-amber-400 text-black px-1.5 py-0.2 text-[9px] font-black uppercase">
                                <Star className="w-2.5 h-2.5 fill-black" />
                                FEATURED
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{manga.synopsis}</p>

                          {/* Quick Stats Pill */}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0.5">
                            <span className="font-semibold text-white">
                              {manga.chapters ? manga.chapters.length : 0} Chapters
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-cyan-300 font-mono">
                              <Eye className="w-3 h-3" /> {(manga.views || 0).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-rose-300 font-mono">
                              <Heart className="w-3 h-3 fill-rose-400/20" /> {mangaLikes.toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-purple-300 font-mono">
                              <MessageSquare className="w-3 h-3" /> {mangaComments.toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="text-amber-400">{manga.genres ? manga.genres.join(', ') : 'Manga'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* + Upload Chapter Button */}
                          <button
                            id={`mangaka-upload-chapter-btn-${manga.id}`}
                            onClick={() => {
                              setSelectedChapterUploadMangaId(manga.id);
                              setActiveTab('upload_chapter');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                            title="Upload a new chapter to this series"
                          >
                            <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>+ Upload Chapter</span>
                          </button>

                          {/* Manage Series Details Button */}
                          <button
                            id={`mangaka-manage-details-btn-${manga.id}`}
                            onClick={() => handleEditSeriesDetails(manga)}
                            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 hover:border-amber-500/40 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                            title="Manage series details, title, synopsis, status, genres, and cover artwork"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Manage Details</span>
                          </button>

                          {/* Submit Draft Button */}
                          {isDraft && (
                            <button
                              onClick={() => handleSubmitForReview(undefined, manga)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition flex items-center gap-1.5 shadow"
                              title="Submit this draft to Admin for official review"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit</span>
                            </button>
                          )}

                          {/* Delete Draft */}
                          {isDraft && onDeleteManga && (
                            <button
                              onClick={() => handleDeleteDraft(manga.id, manga.title)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            TAB 2: UPLOAD NEW CHAPTER
            Interactive workflow to upload chapter scans, page numbering, access type
            ======================================================================= */}
        {!isUploadFormOpen && activeTab === 'upload_chapter' && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Upload New Manga Chapter</span>
                    <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5">
                      70% MONETIZED
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Select your series, upload panel pages, and publish Day-1 chapters to your audience.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('my_mangas')}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900"
              >
                ← Back to Series
              </button>
            </div>

            <ChapterUploadManager
              mangaList={myMangas.length > 0 ? myMangas : mangaList}
              selectedMangaId={selectedChapterUploadMangaId || myMangas[0]?.id}
              onPublishChapter={(mangaId, chapter) => {
                if (onPublishChapter) {
                  onPublishChapter(mangaId, chapter);
                }
                setToastMessage({
                  text: `Chapter ${chapter.number} ("${chapter.title}") published successfully! Readers will receive a drop notification.`,
                  type: 'success',
                });
                setActiveTab('my_mangas');
              }}
              onCancel={() => setActiveTab('my_mangas')}
            />
          </div>
        )}

        {/* =======================================================================
            TAB 3: PERFORMANCE ANALYTICS (VIEWS, LIKES, COMMENTS)
            Detailed series metrics, charts, chapter drilldown, and reader comments
            ======================================================================= */}
        {!isUploadFormOpen && activeTab === 'views' && (
          <div className="mt-5 space-y-6 animate-fadeIn">
            {/* Filter & Series Selection Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Audience Performance Metrics
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Drilldown Series:</span>
                <select
                  value={analyticsMangaFilter}
                  onChange={(e) => setAnalyticsMangaFilter(e.target.value)}
                  className="rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 px-3 py-1.5 focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">All Series (Aggregated)</option>
                  {myMangas.map((m) => (
                    <option key={`opt-${m.id}`} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Performance Bar Chart (Views, Likes, Comments across series) */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Engagement Comparison (Views, Likes & Discussions)</h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Views
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Likes
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Comments
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                {analyticsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="views" name="Views" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="likes" name="Likes" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="comments" name="Comments" fill="#c084fc" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No series published yet to display comparative chart
                  </div>
                )}
              </div>
            </div>

            {/* Comprehensive Series Breakdown Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Series Performance Breakdown
                </span>
                <span className="text-xs text-slate-400">{myMangas.length} Registered Works</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="p-3">Series</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Chapters</th>
                      <th className="p-3 text-right">Views</th>
                      <th className="p-3 text-right">Likes</th>
                      <th className="p-3 text-right">Comments</th>
                      <th className="p-3 text-right">Eng. Rate</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {myMangas.map((manga) => {
                      const mLikes = (manga.chapters || []).reduce((s, c) => s + (c.likesCount || 0), 0);
                      const mComments = relevantComments.filter((c) => c.mangaId === manga.id).length ||
                        (manga.chapters || []).reduce((s, c) => s + (c.commentsCount || 0), 0);
                      const mViews = manga.views || 0;
                      const eng = mViews > 0 ? (((mLikes + mComments) / mViews) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={`row-${manga.id}`} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 flex items-center gap-2.5">
                            <MangaCoverImage
                              src={manga.coverImage}
                              alt={manga.title}
                              className="w-8 h-11 rounded-md object-cover border border-slate-800 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white line-clamp-1">{manga.title}</div>
                              <span className="text-[10px] text-slate-400">{manga.genres ? manga.genres[0] : 'Manga'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase">
                              {manga.status || 'ONGOING'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {manga.chapters ? manga.chapters.length : 0} chs
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">
                            {mViews.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            {mLikes.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-purple-400">
                            {mComments.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-400 font-bold">
                            {eng}%
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedChapterUploadMangaId(manga.id);
                                  setActiveTab('upload_chapter');
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition"
                                title="Upload new chapter"
                              >
                                + Chapter
                              </button>
                              <button
                                onClick={() => handleEditSeriesDetails(manga)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition"
                                title="Edit series details"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chapter-by-Chapter Performance Table */}
            {drilldownManga && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">
                      Chapter-by-Chapter Breakdown: <span className="text-amber-400">{drilldownManga.title}</span>
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {drilldownManga.chapters ? drilldownManga.chapters.length : 0} Chapters Published
                  </span>
                </div>

                {drilldownManga.chapters && drilldownManga.chapters.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="p-2.5">Chapter</th>
                          <th className="p-2.5">Title</th>
                          <th className="p-2.5">Release</th>
                          <th className="p-2.5">Tier</th>
                          <th className="p-2.5 text-right">Reads</th>
                          <th className="p-2.5 text-right">Likes</th>
                          <th className="p-2.5 text-right">Comments</th>
                          <th className="p-2.5 text-right">Like Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {drilldownManga.chapters.map((ch, cIdx) => {
                          const chReads = Math.max(1, Math.round((drilldownManga.views || 0) / (drilldownManga.chapters.length || 1)));
                          const chRatio = chReads > 0 ? (((ch.likesCount || 0) / chReads) * 100).toFixed(1) : '0.0';

                          return (
                            <tr key={`ch-row-${ch.id || cIdx}`} className="hover:bg-slate-800/30">
                              <td className="p-2.5 font-mono font-bold text-amber-400">
                                Ch. {ch.number}
                              </td>
                              <td className="p-2.5 font-medium text-white max-w-[200px] truncate">
                                {ch.title}
                              </td>
                              <td className="p-2.5 text-slate-400 text-[11px]">
                                {ch.releaseDate || '2026-10-01'}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                    ch.accessType === 'premium'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {ch.accessType === 'premium' ? 'VIP Pass' : 'Free'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono text-cyan-300">
                                {chReads.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono text-rose-400 font-bold">
                                {(ch.likesCount || 0).toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono text-purple-400">
                                {(ch.commentsCount || 0).toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono text-amber-300 font-bold">
                                {chRatio}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No chapters uploaded to this series yet. Tap "+ Upload Chapter" to start.
                  </div>
                )}
              </div>
            )}

            {/* Real-time Reader Discussion & Comments Feed */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">
                    Reader Discussions & Feedback ({relevantComments.length} Comments)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">Latest reader reactions</span>
              </div>

              {relevantComments.length > 0 ? (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {relevantComments.map((comment) => (
                    <div
                      key={`comm-feed-${comment.id}`}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300">{comment.userName}</span>
                          {comment.userBadge && (
                            <span className="rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.2">
                              {comment.userBadge}
                            </span>
                          )}
                          {comment.chapterNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              on Ch. {comment.chapterNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 leading-relaxed">{comment.text}</p>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 shrink-0 text-[10px] font-mono">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" />
                        <span>{comment.likes || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No reader comments yet. As readers discover your manga chapters, their comments and feedback will stream here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            TAB 4: IN-APP WALLET & 70% ZAR PAYOUTS (PENDING / PAYABLE / PAID)
            ======================================================================= */}
        {!isUploadFormOpen && activeTab === 'earnings' && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="font-bold text-white text-sm">
                    In-App Creator Wallet · Pending, Payable & Paid
                  </h5>
                  <p className="text-xs text-slate-400">
                    70% direct creator split · Google Play Billing & Google AdMob (R{USD_TO_ZAR_RATE} ZAR/USD)
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-emerald-400 font-semibold">
                  Threshold: R0.00 / R1,000.00 (0%)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-xs font-semibold text-amber-400 block">Pending</span>
                  <div className="text-2xl font-black font-mono tabular-nums text-white mt-1">
                    R0.00
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums block mt-0.5">
                    Est. Oct 2026 · Finalizes 7th – 12th
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40">
                  <span className="text-xs font-semibold text-emerald-400 block">Payable</span>
                  <div className="text-2xl font-black font-mono tabular-nums text-emerald-300 mt-1">
                    R0.00
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums block mt-0.5">
                    Finalized · Disburses 21st – 26th
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-xs font-semibold text-sky-400 block">Paid</span>
                  <div className="text-2xl font-black font-mono tabular-nums text-white mt-1">
                    R0.00
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums block mt-0.5">
                    Lifetime disbursed · 0 payouts
                  </span>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="h-full w-0 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs text-slate-300">
              <h5 className="font-bold text-white text-sm">Revenue Monetization Breakdown</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">01. Ad Revenue Splits · 70%</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Earn 70% of persistent AdMob banners, interstitial ads between chapters, and rewarded chapter unlocks.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-purple-400 font-bold block mb-1">02. VIP Subscription Pool · 70%</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    70% of Google Play VIP and Pro Patron subscriptions distribute proportionally based on verified read-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MangakaDashboardModal;
