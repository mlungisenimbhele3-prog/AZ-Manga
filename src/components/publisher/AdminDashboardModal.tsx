import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  BookOpen,
  UserCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Layers,
  Filter,
  ArrowUp,
  ArrowDown,
  Crown,
  Bot,
  CheckSquare,
  Square,
  Search,
  SlidersHorizontal,
  AlertOctagon,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Manga, MangakaApplication } from '../../types';
import {
  getMangakaApplications,
  approveMangakaApplication,
  rejectMangakaApplication,
} from '../../utils/mangakaManager';
import { detectAiContent } from '../../utils/aiDetector';
import { MangaCoverImage } from '../common/MangaCoverImage';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaList: Manga[];
  onApproveManga: (mangaId: string) => void;
  onRejectManga: (mangaId: string, reason?: string) => void;
  onToggleFeatured: (mangaId: string) => void;
  onToggleOriginal?: (mangaId: string) => void;
  onReorderManga?: (newList: Manga[]) => void;
  onBulkModerateManga?: (newList: Manga[]) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  mangaList,
  onApproveManga,
  onRejectManga,
  onToggleFeatured,
  onToggleOriginal,
  onReorderManga,
  onBulkModerateManga,
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'submissions' | 'featured' | 'canvas_approvals' | 'bulk_moderate'>('applications');
  const [applications, setApplications] = useState<MangakaApplication[]>(() => getMangakaApplications());
  const [canvasApps, setCanvasApps] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('ka_canvas_original_applications');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [filterAppStatus, setFilterAppStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Bulk Moderate & Multi-Manga AI Scanning States
  const [selectedMangaIds, setSelectedMangaIds] = useState<string[]>([]);
  const [isScanningBulk, setIsScanningBulk] = useState<boolean>(false);
  const [bulkScanProgress, setBulkScanProgress] = useState<number>(0);
  const [bulkScanCurrentIndex, setBulkScanCurrentIndex] = useState<number>(0);
  const [bulkScanTotal, setBulkScanTotal] = useState<number>(0);
  const [bulkScanCurrentTitle, setBulkScanCurrentTitle] = useState<string>('');
  const [bulkScanCurrentAuthor, setBulkScanCurrentAuthor] = useState<string>('');
  const [bulkScanCurrentCover, setBulkScanCurrentCover] = useState<string>('');
  const [bulkScanStageText, setBulkScanStageText] = useState<string>('');
  const [bulkScanStageNumber, setBulkScanStageNumber] = useState<number>(1);
  const [bulkScanLiveStats, setBulkScanLiveStats] = useState<{
    completed: number;
    clean: number;
    flagged: number;
    banned: number;
  }>({ completed: 0, clean: 0, flagged: 0, banned: 0 });
  const [itemScanStatuses, setItemScanStatuses] = useState<Record<string, {
    status: 'queued' | 'scanning' | 'clean' | 'flagged' | 'banned';
    score?: number;
    reason?: string;
  }>>({});
  const abortScanRef = React.useRef<boolean>(false);
  const [bulkScanResults, setBulkScanResults] = useState<{
    manga: Manga;
    scan: ReturnType<typeof detectAiContent>;
    initialBanned: boolean;
  }[] | null>(null);
  const [bulkCategoryFilter, setBulkCategoryFilter] = useState<'all' | 'submissions' | 'originals' | 'backdrop' | 'flagged'>('all');
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setApplications(getMangakaApplications());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setApplications(getMangakaApplications());
    };
    window.addEventListener('ka_pulse_mangaka_updated', handleUpdate);
    return () => window.removeEventListener('ka_pulse_mangaka_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleApproveApp = (appId: string) => {
    const approved = approveMangakaApplication(appId);
    if (approved) {
      setApplications(getMangakaApplications());
      setActionToast(`Approved ${approved.penName} (${approved.legalName}) as official Mangaka!`);
      setTimeout(() => setActionToast(null), 4000);
    }
  };

  const handleRejectApp = (appId: string) => {
    const rejected = rejectMangakaApplication(appId, 'Portfolio requires further pan-African story elaboration.');
    if (rejected) {
      setApplications(getMangakaApplications());
      setActionToast(`Rejected application for ${rejected.penName}. Feedback recorded.`);
      setTimeout(() => setActionToast(null), 4000);
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const filteredApps = applications.filter((a) => filterAppStatus === 'all' || a.status === filterAppStatus);

  const pendingMangaSubmissions = mangaList.filter(
    (m) =>
      m.approvalStatus !== 'draft' &&
      (m.approvalStatus === 'pending_review' || (!m.approvalStatus && m.id.startsWith('submitted-')))
  );

  const allApprovedManga = mangaList.filter(
    (m) =>
      m.approvalStatus !== 'pending_review' &&
      m.approvalStatus !== 'rejected' &&
      m.approvalStatus !== 'draft'
  );
  const featuredCount = mangaList.filter((m) => m.featured).length;

  // Filter manga for Bulk Moderation view
  const filteredMangaForBulk = mangaList.filter((m) => {
    if (bulkSearchQuery.trim()) {
      const q = bulkSearchQuery.toLowerCase();
      const match =
        m.title.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (bulkCategoryFilter === 'submissions') {
      return (
        m.approvalStatus !== 'draft' &&
        (m.approvalStatus === 'pending_review' || (!m.approvalStatus && m.id.startsWith('submitted-')))
      );
    }
    if (bulkCategoryFilter === 'originals') {
      return Boolean(m.isOriginal);
    }
    if (bulkCategoryFilter === 'backdrop') {
      return !m.isOriginal || m.isBackdrop || m.isCanvas;
    }
    if (bulkCategoryFilter === 'flagged') {
      return Boolean(m.isAiGenerated || (m.aiConfidenceScore && m.aiConfidenceScore > 35) || m.isBanned);
    }
    return true;
  });

  const toggleSelectManga = (mangaId: string) => {
    setSelectedMangaIds((prev) =>
      prev.includes(mangaId) ? prev.filter((id) => id !== mangaId) : [...prev, mangaId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredMangaForBulk.map((m) => m.id);
    setSelectedMangaIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedMangaIds([]);
  };

  const handleSelectHighRisk = () => {
    const highRisk = mangaList.filter(
      (m) =>
        m.isAiGenerated ||
        (m.aiConfidenceScore && m.aiConfidenceScore > 30) ||
        m.approvalStatus === 'pending_review' ||
        !m.aiDetection
    );
    setSelectedMangaIds(highRisk.map((m) => m.id));
  };

  const handleCancelBulkScan = () => {
    abortScanRef.current = true;
    setActionToast('AI Scan stopped by admin. Results collected so far have been preserved.');
    setTimeout(() => setActionToast(null), 4000);
  };

  // Multi-Manga AI Scan Trigger with Progressive Telemetry
  const handleRunBulkAiScan = async () => {
    if (selectedMangaIds.length === 0 || isScanningBulk) return;
    abortScanRef.current = false;
    setIsScanningBulk(true);
    setBulkScanProgress(0);

    const targetMangas = mangaList.filter((m) => selectedMangaIds.includes(m.id));
    const total = targetMangas.length;
    setBulkScanTotal(total);
    setBulkScanCurrentIndex(0);

    // Initialize all selected manga statuses to 'queued'
    const initialStatuses: Record<string, { status: 'queued' }> = {};
    targetMangas.forEach((m) => {
      initialStatuses[m.id] = { status: 'queued' };
    });
    setItemScanStatuses(initialStatuses);

    let completed = 0;
    let clean = 0;
    let flagged = 0;
    let banned = 0;
    setBulkScanLiveStats({ completed: 0, clean: 0, flagged: 0, banned: 0 });

    const accumulatedResults: {
      manga: Manga;
      scan: ReturnType<typeof detectAiContent>;
      initialBanned: boolean;
    }[] = [];

    for (let i = 0; i < targetMangas.length; i++) {
      if (abortScanRef.current) break;

      const manga = targetMangas[i];
      setBulkScanCurrentIndex(i + 1);
      setBulkScanCurrentTitle(manga.title);
      setBulkScanCurrentAuthor(manga.author);
      setBulkScanCurrentCover(manga.cover || manga.coverImage || '');
      setBulkScanStageNumber(1);
      setBulkScanStageText(`Analyzing lexical markers & creator disclosure tokens for "${manga.title}"...`);

      // Update item status to scanning
      setItemScanStatuses((prev) => ({
        ...prev,
        [manga.id]: { status: 'scanning' },
      }));

      // Small async delay for phase 1
      await new Promise((resolve) => setTimeout(resolve, 140));
      if (abortScanRef.current) break;

      setBulkScanStageNumber(2);
      setBulkScanStageText(`Inspecting panel line weights & synthetic diffusion artifacts in ${manga.chapters?.length || 0} chapters...`);
      await new Promise((resolve) => setTimeout(resolve, 160));
      if (abortScanRef.current) break;

      setBulkScanStageNumber(3);
      setBulkScanStageText(`Evaluating heuristic confidence & applying policy thresholds...`);

      // Execute detectAiContent on the manga asset
      const scan = detectAiContent(
        {
          title: manga.title,
          synopsis: manga.synopsis,
          author: manga.author,
          artist: manga.artist,
          coverImage: manga.coverImage || manga.cover,
          bannerImage: manga.bannerImage,
          genres: manga.genres,
          pages: manga.chapters?.flatMap((c) =>
            c.pages ? c.pages.map((p) => ({ imageUrl: p.imageUrl, caption: p.caption })) : []
          ) || [],
          declaredAi: manga.isAiGenerated,
        },
        { strictAutoBan: true }
      );

      const isBanned = scan.bannedStatus === 'auto_banned';
      const isAi = scan.isAiGenerated;
      const resultStatus: 'clean' | 'flagged' | 'banned' = isBanned
        ? 'banned'
        : isAi
        ? 'flagged'
        : 'clean';

      completed++;
      if (isBanned) banned++;
      else if (isAi) flagged++;
      else clean++;

      setBulkScanLiveStats({ completed, clean, flagged, banned });

      setItemScanStatuses((prev) => ({
        ...prev,
        [manga.id]: {
          status: resultStatus,
          score: scan.confidenceScore,
          reason: scan.banReason,
        },
      }));

      accumulatedResults.push({
        manga,
        scan,
        initialBanned: Boolean(manga.isBanned),
      });

      const currentPercent = Math.round(((i + 1) / total) * 100);
      setBulkScanProgress(currentPercent);

      // Pacing pause so progress is clearly visible and smooth
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    if (abortScanRef.current) {
      setIsScanningBulk(false);
      if (accumulatedResults.length > 0) {
        setBulkScanResults(accumulatedResults);
      }
      return;
    }

    setBulkScanProgress(100);
    setBulkScanStageText('Bulk multi-manga scan completed! Compiling moderation verdicts...');
    await new Promise((resolve) => setTimeout(resolve, 350));

    setIsScanningBulk(false);
    setBulkScanResults(accumulatedResults);

    const aiCount = accumulatedResults.filter((r) => r.scan.isAiGenerated || r.scan.bannedStatus === 'auto_banned').length;
    const bannedCount = accumulatedResults.filter((r) => r.scan.bannedStatus === 'auto_banned').length;

    setActionToast(
      `⚡ Multi-manga AI scan complete for ${accumulatedResults.length} titles: ${aiCount} flagged as AI, ${bannedCount} auto-banned.`
    );
    setTimeout(() => setActionToast(null), 5000);
  };

  const handleApplyBulkResults = () => {
    if (!bulkScanResults) return;

    const resultMap = new Map<string, any>();
    bulkScanResults.forEach((r) => {
      resultMap.set(r.manga.id, r.scan);
    });

    const updatedList = mangaList.map((m) => {
      const scan = resultMap.get(m.id);
      if (!scan) return m;
      const isBanned = scan.bannedStatus === 'auto_banned';
      return {
        ...m,
        isAiGenerated: scan.isAiGenerated,
        aiConfidenceScore: scan.confidenceScore,
        isBanned,
        banReason: isBanned ? scan.banReason : undefined,
        aiDetection: scan,
      };
    });

    if (onBulkModerateManga) {
      onBulkModerateManga(updatedList);
    } else if (onReorderManga) {
      onReorderManga(updatedList);
    }

    setActionToast(`Successfully updated ${bulkScanResults.length} manga with AI moderation verdicts!`);
    setTimeout(() => setActionToast(null), 4000);
    setBulkScanResults(null);
    setSelectedMangaIds([]);
  };

  return (
    <div
      id="admin-dashboard-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Admin Dashboard"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-amber-500/50 bg-slate-950 p-5 sm:p-7 text-white shadow-2xl z-10 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950 font-black text-amber-400">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Your Admin Dashboard
                </h3>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">
                  Executive Producer: Mlungiseni Mbhele
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review Mangaka applications, approve manga submissions, and control homepage Featured manga.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dedicated Bulk Moderate Button */}
            <button
              id="admin-bulk-moderate-header-btn"
              type="button"
              onClick={() => {
                setActiveTab('bulk_moderate');
                setBulkScanResults(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition shadow-lg ${
                activeTab === 'bulk_moderate'
                  ? 'bg-purple-600 text-white shadow-purple-500/25 ring-2 ring-purple-400'
                  : 'bg-purple-950/90 hover:bg-purple-900 border border-purple-500/50 text-purple-200'
              }`}
              title="Bulk Moderate manga with detectAiContent AI Scanner"
            >
              <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Bulk Moderate</span>
              {selectedMangaIds.length > 0 && (
                <span className="rounded-full bg-purple-500 text-white text-[10px] px-1.5 py-0.2 font-mono">
                  {selectedMangaIds.length}
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toast */}
        {actionToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{actionToast}</span>
            </div>
            <button onClick={() => setActionToast(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'applications'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Applications</span>
            {pendingApps.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'applications' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
              }`}>
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'submissions'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Submissions</span>
            {pendingMangaSubmissions.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'submissions' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
              }`}>
                {pendingMangaSubmissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('featured')}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'featured'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Featured</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'featured' ? 'bg-black text-amber-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {featuredCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('canvas_approvals')}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'canvas_approvals'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Backdrop</span>
            {canvasApps.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'canvas_approvals' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
              }`}>
                {canvasApps.length}
              </span>
            )}
          </button>

          {/* TAB 5: BULK MODERATE */}
          <button
            id="tab-bulk-moderate"
            onClick={() => {
              setActiveTab('bulk_moderate');
              setBulkScanResults(null);
            }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'bulk_moderate'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-black ring-1 ring-purple-400'
                : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Bulk Moderate</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
              activeTab === 'bulk_moderate' ? 'bg-black text-purple-300' : 'bg-purple-500/30 text-purple-200'
            }`}>
              AI Scan
            </span>
          </button>
        </div>

        {/* TAB 1: MANGAKA APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Review creators who tapped "Become a Mangaka" and applied with their ID verification:
              </span>
              <div className="flex items-center gap-1.5">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st, idx) => (
                  <button
                    key={`admin-filter-status-${st}-${idx}`}
                    onClick={() => setFilterAppStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                      filterAppStatus === st
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                No Mangaka applications found for "{filterAppStatus}".
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app, idx) => (
                  <div
                    key={`admin-mangaka-app-${app.id}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={app.idPhotoUrl}
                        alt={app.legalName}
                        className="w-14 h-14 rounded-xl object-cover border border-amber-500/40 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white">{app.penName}</h4>
                          <span className="text-xs text-slate-400 font-medium">({app.legalName})</span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            app.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2">{app.bio}</p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>📍 {app.country} • {app.region}</span>
                          <span>•</span>
                          <span className="text-amber-400">Genres: {app.primaryGenres.join(', ')}</span>
                          {app.portfolioUrl && (
                            <>
                              <span>•</span>
                              <a
                                href={app.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>Portfolio</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 md:self-center">
                      {app.status !== 'approved' && (
                        <button
                          onClick={() => handleApproveApp(app.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => handleRejectApp(app.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-500/40 font-bold text-xs transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANGA SUBMISSIONS REVIEW */}
        {activeTab === 'submissions' && (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-slate-300">
              Mangakas submit new series and chapters for your review before they are visible to readers:
            </p>

            {pendingMangaSubmissions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                No manga submissions currently waiting in review. All catalog titles are up to date!
              </div>
            ) : (
              <div className="space-y-4">
                {pendingMangaSubmissions.map((manga, idx) => (
                  <div
                    key={`admin-pending-sub-${manga.id}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-amber-500/40 flex flex-col md:flex-row gap-4"
                  >
                    <MangaCoverImage
                      coverUrl={manga.coverUrl || (manga as any).cover || manga.coverImage}
                      src={manga.coverUrl || (manga as any).cover || manga.coverImage}
                      alt={manga.title}
                      title={manga.title}
                      className="w-24 h-32 rounded-xl object-cover border border-slate-800 shrink-0 mx-auto md:mx-0"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-base font-black text-white">{manga.title}</h4>
                          <span className="text-xs text-amber-400 font-semibold">
                            By {manga.author} ({manga.artist})
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                          Pending Admin Review
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{manga.synopsis}</p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {manga.chapters.length} Chapters
                        </span>
                        <span>•</span>
                        <span>Genres: {manga.genres.join(', ')}</span>
                      </div>

                      {/* Chapter 1 Pages Sample Strip */}
                      {manga.chapters[0] && (
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Chapter 1 Preview ({manga.chapters[0].pages.length} Pages)
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {manga.chapters[0].pages.slice(0, 4).map((p, pIdx) => (
                              <img
                                key={`ch-preview-${manga.id}-${pIdx}`}
                                src={p.imageUrl}
                                alt={`Page ${p.pageNumber}`}
                                className="w-14 h-18 rounded-lg object-cover border border-slate-700 shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Decision Actions */}
                    <div className="flex md:flex-col justify-end gap-2 shrink-0">
                      <button
                        onClick={() => onApproveManga(manga.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-95 text-white font-black text-xs transition shadow flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>

                      <button
                        onClick={() => onRejectManga(manga.id, 'Needs refined chapter flow and dialogue bubbles.')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-500/40 font-bold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CATALOG, REORDER & FEATURE CONTROL */}
        {activeTab === 'featured' && (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/40 flex items-center justify-between text-xs">
              <span className="text-amber-200 font-medium">
                👑 <strong>Hero Banner & Featured Control:</strong> Toggle the switch or use the Up/Down buttons to re-order which manga appears first in the main hero spotlight.
              </span>
              <span className="font-mono font-bold text-amber-400">
                {featuredCount} / {allApprovedManga.length} Featured
              </span>
            </div>

            <div className="space-y-3">
              {allApprovedManga.map((manga, idx) => (
                <div
                  key={`admin-catalog-manga-${manga.id}-${idx}`}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-4 ${
                    manga.featured
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: #1 rank + arrows */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-400 w-6 text-center">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const targetIdx = idx - 1;
                          if (targetIdx < 0) return;
                          const newList = [...allApprovedManga];
                          const temp = newList[idx];
                          newList[idx] = newList[targetIdx];
                          newList[targetIdx] = temp;
                          onReorderManga?.(newList);
                          setActionToast(`Moved "${temp.title}" UP in hero banner lineup!`);
                          setTimeout(() => setActionToast(null), 3000);
                        }}
                        disabled={idx === 0}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move higher in hero banner lineup"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const targetIdx = idx + 1;
                          if (targetIdx >= allApprovedManga.length) return;
                          const newList = [...allApprovedManga];
                          const temp = newList[idx];
                          newList[idx] = newList[targetIdx];
                          newList[targetIdx] = temp;
                          onReorderManga?.(newList);
                          setActionToast(`Moved "${temp.title}" DOWN in hero banner lineup!`);
                          setTimeout(() => setActionToast(null), 3000);
                        }}
                        disabled={idx === allApprovedManga.length - 1}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move lower in hero banner lineup"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Cover Image */}
                  <div className="shrink-0 relative">
                    <MangaCoverImage
                      coverUrl={manga.coverUrl || (manga as any).cover || manga.coverImage}
                      src={manga.coverUrl || (manga as any).cover || manga.coverImage}
                      alt={manga.title}
                      title={manga.title}
                      className="w-12 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                  </div>

                  {/* Middle-Right: Title & Stacked Badges (relative flex-col gap-1, no absolute) */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                    <h4 className="text-sm font-bold text-white truncate">{manga.title}</h4>
                    <p className="text-xs text-slate-400 truncate">
                      By {manga.author} • {manga.chapters.length} Chapters • {manga.views.toLocaleString()} Reads
                    </p>

                    {/* Stash badges vertically with relative flex column and gap-1 */}
                    <div className="relative flex flex-col items-start gap-1 mt-0.5">
                      {manga.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-black px-2 py-0.5 text-[9px] font-black uppercase shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-black" />
                          <span>HERO SPOTLIGHT</span>
                        </span>
                      )}
                      {manga.isOriginal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-2 py-0.5 uppercase">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          <span>ORIGINAL 👑</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-bold px-2 py-0.5 uppercase">
                          BACKDROP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Featured Toggle Switch & Original Badge Switch */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* AZ ORIGINAL Promotion Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onToggleOriginal?.(manga.id);
                        setActionToast(`Toggled ORIGINAL status for "${manga.title}"!`);
                        setTimeout(() => setActionToast(null), 3000);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                        manga.isOriginal
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                      title="Promote to AZ ORIGINAL or demote to BACKDROP"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>{manga.isOriginal ? 'ORIGINAL 👑' : 'Promote to ORIGINAL'}</span>
                    </button>

                    {/* Featured Modern Switch Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                        {manga.featured ? 'Featured' : 'Standard'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={manga.featured}
                        onClick={() => onToggleFeatured(manga.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          manga.featured ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                        title={manga.featured ? 'Remove from Featured homepage spotlight' : 'Make Featured on homepage spotlight'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            manga.featured ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BACKDROP IP APPROVALS (Promote Backdrop to AZ ORIGINAL 👑) */}
        {activeTab === 'canvas_approvals' && (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/40 text-xs text-amber-200">
              👑 <strong>Backdrop IP Promotion Desk:</strong> Review independent creators who published under BACKDROP with original IP ownership or requested promotion to AZ ORIGINALS. Once you approve, the title is crowned an official <strong>AZ ORIGINAL 👑</strong> and placed into the top showcase!
            </div>

            <div className="space-y-3">
              {mangaList.filter((m) => !m.isOriginal || m.isBackdrop || m.isCanvas || m.isOwnedIP).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
                  No pending Backdrop titles at this moment.
                </div>
              ) : (
                mangaList
                  .filter((m) => !m.isOriginal || m.isBackdrop || m.isCanvas || m.isOwnedIP)
                  .map((manga, idx) => (
                    <div
                      key={`${manga.id}-${idx}`}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={manga.cover || manga.coverImage}
                          alt={manga.title}
                          className="w-12 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{manga.title}</h4>
                            <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.2 text-[9px] font-bold uppercase">
                              BACKDROP
                            </span>
                            {manga.isOwnedIP && (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold uppercase">
                                Verified IP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Creator: {manga.author} • {manga.views.toLocaleString()} Reads • {manga.genres.join(', ')}
                          </p>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">{manga.synopsis}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onToggleOriginal?.(manga.id);
                            setActionToast(`Promoted "${manga.title}" to AZ ORIGINAL 👑!`);
                            setTimeout(() => setActionToast(null), 4000);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs transition shadow-lg flex items-center gap-1.5"
                        >
                          <Crown className="w-4 h-4 fill-black stroke-black" />
                          <span>Approve as AZ ORIGINAL 👑</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BULK MODERATE (SIMULTANEOUS AI SCANNING VIA detectAiContent) */}
        {activeTab === 'bulk_moderate' && (
          <div className="mt-5 space-y-5">
            {/* Header Description Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 text-xs text-purple-200 space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-black text-white tracking-wide">
                  CATALOG BULK MODERATION & SIMULTANEOUS AI SCANNER
                </span>
                <span className="rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[9px] font-black px-2 py-0.5 uppercase">
                  detectAiContent Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Select multiple manga titles across the catalog and trigger the <strong>detectAiContent</strong> heuristic scanner simultaneously. The model evaluates prompt tokens, latent diffusion markers, synthetic line-weight coherence, and creator declarations to uphold genuine human craftsmanship.
              </p>
            </div>

            {/* If Results are ready, display Results View */}
            {bulkScanResults ? (
              <div className="space-y-4">
                {/* Results Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Scanned</span>
                    <span className="text-2xl font-black text-white">{bulkScanResults.length}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
                    <span className="text-[10px] text-rose-300 uppercase font-bold block">Auto-Banned (≥75%)</span>
                    <span className="text-2xl font-black text-rose-400">
                      {bulkScanResults.filter((r) => r.scan.bannedStatus === 'auto_banned').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center">
                    <span className="text-[10px] text-amber-300 uppercase font-bold block">AI Labeled (35-74%)</span>
                    <span className="text-2xl font-black text-amber-400">
                      {bulkScanResults.filter((r) => r.scan.isAiGenerated && r.scan.bannedStatus !== 'auto_banned').length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center">
                    <span className="text-[10px] text-emerald-300 uppercase font-bold block">Human Artisan (&lt;35%)</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {bulkScanResults.filter((r) => !r.scan.isAiGenerated && r.scan.bannedStatus === 'clean').length}
                    </span>
                  </div>
                </div>

                {/* Primary Apply / Reset Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-purple-500/50">
                  <div>
                    <h4 className="text-sm font-bold text-white">Simultaneous Moderation Analysis Complete</h4>
                    <p className="text-xs text-slate-400">
                      Apply detected AI confidence scores, transparency stickers, and quarantine bans to the global database.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setBulkScanResults(null)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Back to Selection</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBulkResults}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Apply & Save to Catalog</span>
                    </button>
                  </div>
                </div>

                {/* Scanned Titles Detail List */}
                <div className="space-y-3">
                  {bulkScanResults.map(({ manga, scan }, idx) => {
                    const isBanned = scan.bannedStatus === 'auto_banned';
                    const isAi = scan.isAiGenerated;
                    const score = scan.confidenceScore;

                    return (
                      <div
                        key={`admin-scan-result-${manga.id || 'scan'}-${idx}`}
                        className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          isBanned
                            ? 'bg-rose-950/30 border-rose-500/50'
                            : isAi
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={manga.cover || manga.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                            alt={manga.title}
                            className="w-14 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-white">{manga.title}</h5>
                              {isBanned ? (
                                <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 text-[9px] font-black uppercase">
                                  AUTO-BANNED
                                </span>
                              ) : isAi ? (
                                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[9px] font-black uppercase">
                                  AI LABELED
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase">
                                  CLEAN HUMAN ARTISAN
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              By {manga.author} • {manga.genres.join(', ')}
                            </p>

                            {/* Detected Heuristic Markers */}
                            {scan.detectedFeatures && scan.detectedFeatures.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {scan.detectedFeatures.map((feat: string, fIdx: number) => (
                                  <span
                                    key={`feat-${manga.id || idx}-${fIdx}`}
                                    className="rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 px-2 py-0.5"
                                  >
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-emerald-400 pt-0.5">
                                ✓ No generative tokens or synthetic line-weight markers detected
                              </p>
                            )}

                            {scan.banReason && (
                              <p className="text-[11px] text-rose-300 font-mono">
                                Policy Violation: {scan.banReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Confidence Score Gauge */}
                        <div className="w-full md:w-44 text-right md:text-right shrink-0 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="text-slate-400">AI Confidence:</span>
                            <span
                              className={`font-black ${
                                score >= 75
                                  ? 'text-rose-400'
                                  : score >= 35
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {score}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                score >= 75
                                  ? 'bg-rose-500'
                                  : score >= 35
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-1">
                            {score >= 75 ? 'Mandatory Quarantine' : score >= 35 ? 'Reader Tagged' : 'Authentic Certified'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Selection and Scan Trigger Mode */
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bulkSearchQuery}
                      onChange={(e) => setBulkSearchQuery(e.target.value)}
                      placeholder="Search series title, mangaka, or genre..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {(
                      [
                        { id: 'all', label: `All (${mangaList.length})` },
                        { id: 'submissions', label: `Submissions (${pendingMangaSubmissions.length})` },
                        { id: 'originals', label: `Originals (${mangaList.filter((m) => m.isOriginal).length})` },
                        { id: 'backdrop', label: `Backdrop (${mangaList.filter((m) => !m.isOriginal || m.isBackdrop || m.isCanvas).length})` },
                        {
                          id: 'flagged',
                          label: `Flagged (${mangaList.filter((m) => m.isAiGenerated || (m.aiConfidenceScore && m.aiConfidenceScore > 35) || m.isBanned).length})`,
                        },
                      ] as const
                    ).map((cat, idx) => (
                      <button
                        key={`admin-bulk-cat-${cat.id}-${idx}`}
                        type="button"
                        onClick={() => setBulkCategoryFilter(cat.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition shrink-0 ${
                          bulkCategoryFilter === cat.id
                            ? 'bg-purple-600 text-white font-black shadow'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition border border-slate-700 flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                      <span>Select All Filtered ({filteredMangaForBulk.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectHighRisk}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition border border-slate-700 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select High-Risk & Unscanned</span>
                    </button>

                    {selectedMangaIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white transition border border-slate-700"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {/* Launch Scan Button */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {selectedMangaIds.length} Selected
                    </span>

                    <button
                      id="trigger-simultaneous-ai-scan-btn"
                      type="button"
                      disabled={selectedMangaIds.length === 0 || isScanningBulk}
                      onClick={handleRunBulkAiScan}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center gap-2 ${
                        selectedMangaIds.length === 0 || isScanningBulk
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-95 ring-2 ring-purple-400/50'
                      }`}
                    >
                      {isScanningBulk ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                          <span>Scanning ({bulkScanCurrentIndex}/{bulkScanTotal} · {bulkScanProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 text-purple-200" />
                          <span>⚡ Scan Selected Simultaneously ({selectedMangaIds.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Comprehensive Visual Progress Bar & Status Indicator when Scanning */}
                {isScanningBulk && (
                  <div
                    id="admin-bulk-scan-progress-panel"
                    className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 p-4 sm:p-5 shadow-2xl shadow-purple-950/40 space-y-4"
                  >
                    {/* Progress Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/50 text-purple-300 shrink-0">
                          <Bot className="w-5 h-5 text-purple-300 animate-pulse" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                              Multi-Manga AI Scan in Progress
                            </h4>
                            <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-bold px-2 py-0.5 uppercase">
                              Phase {bulkScanStageNumber}/3
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Heuristic verification engine inspecting selected catalog titles in real time
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Progress Percentage Badge */}
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 font-mono">
                            <span className="text-lg font-black text-purple-300 tabular-nums">{bulkScanProgress}%</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {bulkScanCurrentIndex} of {bulkScanTotal} Titles
                          </span>
                        </div>

                        {/* Stop/Cancel Button */}
                        <button
                          type="button"
                          onClick={handleCancelBulkScan}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
                          title="Abort scan and retain results collected so far"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Stop</span>
                        </button>
                      </div>
                    </div>

                    {/* The Visual Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-3.5 rounded-full bg-slate-950 border border-purple-900/60 p-0.5 overflow-hidden shadow-inner relative">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 transition-all duration-300 ease-out shadow-lg shadow-purple-500/50 relative overflow-hidden"
                          style={{ width: `${Math.max(bulkScanProgress, 4)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>0% (Scan Start)</span>
                        <span className="text-purple-300 font-bold">
                          {bulkScanTotal > 0 ? `${bulkScanCurrentIndex} / ${bulkScanTotal} manga processed` : 'Initializing...'}
                        </span>
                        <span>100% (Completed)</span>
                      </div>
                    </div>

                    {/* Active Target Manga Spotlight & Real-Time Status Indicator */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={bulkScanCurrentCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
                            alt={bulkScanCurrentTitle || 'Active Scan Target'}
                            className="w-10 h-14 rounded-lg object-cover border border-purple-500/40"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full p-0.5 shadow">
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-mono font-bold text-purple-400 tracking-wider">
                              Target Manga:
                            </span>
                            <span className="text-xs font-black text-white truncate max-w-[200px] sm:max-w-xs">
                              {bulkScanCurrentTitle || 'Preparing manga assets...'}
                            </span>
                            {bulkScanCurrentAuthor && (
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                by {bulkScanCurrentAuthor}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-purple-200 flex items-center gap-1.5 font-medium truncate">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0 animate-spin" />
                            <span className="truncate">{bulkScanStageText}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Current Status</span>
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-300">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                          <span>Active Inspection</span>
                        </span>
                      </div>
                    </div>

                    {/* Live Status Counters Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Scanned</span>
                        <span className="text-lg font-black text-white font-mono tabular-nums">
                          {bulkScanLiveStats.completed} <span className="text-xs text-slate-500">/ {bulkScanTotal}</span>
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Clean Artisan
                        </span>
                        <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">
                          {bulkScanLiveStats.clean}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                        <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> AI Labeled
                        </span>
                        <span className="text-lg font-black text-amber-400 font-mono tabular-nums">
                          {bulkScanLiveStats.flagged}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center">
                        <span className="text-[10px] text-rose-400 uppercase font-bold block flex items-center justify-center gap-1">
                          <AlertOctagon className="w-3 h-3" /> Auto-Banned
                        </span>
                        <span className="text-lg font-black text-rose-400 font-mono tabular-nums">
                          {bulkScanLiveStats.banned}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticky Compact Status Bar when scanning during scroll */}
                {isScanningBulk && (
                  <div className="sticky top-0 z-20 -mx-1 px-3 py-2 rounded-xl bg-slate-950/95 backdrop-blur-md border border-purple-500/60 shadow-lg flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
                      <span className="font-bold text-white truncate">
                        Scanning: {bulkScanCurrentTitle || 'Catalog Manga'}
                      </span>
                      <span className="font-mono text-purple-300 font-bold hidden sm:inline">
                        ({bulkScanCurrentIndex}/{bulkScanTotal})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 sm:w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
                          style={{ width: `${bulkScanProgress}%` }}
                        />
                      </div>
                      <span className="font-mono font-black text-purple-300 text-xs tabular-nums">
                        {bulkScanProgress}%
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelBulkScan}
                        className="px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:text-white text-[10px] font-bold"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}

                {/* Manga Selection List */}
                <div className="space-y-2.5">
                  {filteredMangaForBulk.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
                      No manga found matching the current search query or filter.
                    </div>
                  ) : (
                    filteredMangaForBulk.map((manga, idx) => {
                      const isSelected = selectedMangaIds.includes(manga.id);
                      const isBanned = Boolean(manga.isBanned);
                      const isAi = Boolean(manga.isAiGenerated);
                      const confidence = manga.aiConfidenceScore;
                      const itemScan = itemScanStatuses[manga.id];
                      const isCurrentlyScanningThis = isScanningBulk && itemScan?.status === 'scanning';

                      return (
                        <div
                          key={`admin-bulk-manga-${manga.id}-${idx}`}
                          onClick={() => {
                            if (!isScanningBulk) {
                              toggleSelectManga(manga.id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                            isScanningBulk ? 'cursor-default' : 'cursor-pointer'
                          } ${
                            isCurrentlyScanningThis
                              ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400'
                              : isSelected
                              ? 'bg-purple-950/30 border-purple-500 shadow-md ring-1 ring-purple-500/30'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox */}
                            <div className="p-1 text-purple-400 shrink-0">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 fill-purple-600 text-white" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                              )}
                            </div>

                            <div className="relative shrink-0">
                              <MangaCoverImage
                                coverUrl={manga.coverUrl || (manga as any).cover || manga.coverImage}
                                src={manga.coverUrl || (manga as any).cover || manga.coverImage}
                                alt={manga.title}
                                title={manga.title}
                                className={`w-12 h-16 rounded-xl object-cover border shrink-0 ${
                                  isCurrentlyScanningThis ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-slate-800'
                                }`}
                              />
                              {isCurrentlyScanningThis && (
                                <div className="absolute inset-0 bg-purple-950/50 rounded-xl flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-bold text-white truncate">{manga.title}</h5>
                                {manga.isOriginal ? (
                                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 text-[9px] font-black uppercase">
                                    AZ ORIGINAL 👑
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.2 text-[9px] font-bold uppercase">
                                    BACKDROP
                                  </span>
                                )}
                                {manga.approvalStatus === 'pending_review' && (
                                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 text-[9px] font-black uppercase">
                                    Pending Review
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                By {manga.author} • {manga.chapters?.length || 0} Chapters • {manga.genres.join(', ')}
                              </p>
                            </div>
                          </div>

                          {/* Dynamic AI Status Badge with Real-Time Scan Telemetry */}
                          <div className="text-right shrink-0">
                            {isScanningBulk && itemScan ? (
                              itemScan.status === 'scanning' ? (
                                <span className="px-2.5 py-1 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-400 text-[10px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                                  <Loader2 className="w-3 h-3 animate-spin text-purple-300" />
                                  <span>Scanning...</span>
                                </span>
                              ) : itemScan.status === 'queued' ? (
                                <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>In Queue</span>
                                </span>
                              ) : itemScan.status === 'clean' ? (
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Artisan ({100 - (itemScan.score || 0)}%)</span>
                                </span>
                              ) : itemScan.status === 'flagged' ? (
                                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>AI Labeled ({itemScan.score}%)</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                                  <span>Auto-Banned ({itemScan.score}%)</span>
                                </span>
                              )
                            ) : isBanned ? (
                              <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase block">
                                AUTO-BANNED
                              </span>
                            ) : isAi ? (
                              <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase block">
                                AI LABELED {confidence ? `(${confidence}%)` : ''}
                              </span>
                            ) : confidence !== undefined ? (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase block">
                                HUMAN ARTISAN ({100 - confidence}%)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium block">
                                Unscanned
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
