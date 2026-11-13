import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Search,
  BookOpen,
  Send,
  Layers,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  X,
  Filter,
  Wallet,
  Lock,
} from 'lucide-react';
import { Manga, Chapter } from '../../types';
import { SafetyReport, getAllSafetyReports, updateReportStatus } from '../../services/safetyService';
import { getInMemoryAccessToken } from '../../services/oververseAuth';

interface AdminPayoutRow {
  id: string;
  creatorId: string;
  creatorEmail: string;
  amountZar: number;
  method: string;
  accountReference: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}

interface AdminApprovalViewProps {
  mangaList: Manga[];
  currentUserEmail?: string;
  onApproveManga: (mangaId: string) => void;
  onRejectManga: (mangaId: string, reason?: string) => void;
  onApproveChapter?: (mangaId: string, chapterId: string) => void;
  onRejectChapter?: (mangaId: string, chapterId: string, reason?: string) => void;
  onBackToHome?: () => void;
  onBackToCatalog?: () => void;
}

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({
  mangaList,
  currentUserEmail,
  onApproveManga,
  onRejectManga,
  onBackToHome,
  onBackToCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'approved' | 'rejected' | 'payouts'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMangaId, setPreviewMangaId] = useState<string | null>(null);
  const [previewChapter, setPreviewChapter] = useState<{ manga: Manga; chapter: Chapter } | null>(null);

  // Rejection modal state
  const [rejectingManga, setRejectingManga] = useState<Manga | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Safety reports state
  const [reports, setReports] = useState<SafetyReport[]>(() => getAllSafetyReports());

  // Admin-only Creator Payouts Review state
  const [adminPayouts, setAdminPayouts] = useState<AdminPayoutRow[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const isAdminViewer =
    (currentUserEmail || '').trim().toLowerCase() === 'mlungisenimbhele3@gmail.com';

  const loadAdminPayouts = React.useCallback(async () => {
    if (!isAdminViewer) return;
    const token = getInMemoryAccessToken();
    if (!token) return;
    setLoadingPayouts(true);
    try {
      const res = await fetch('/api/creator/admin/payouts', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.payouts)) {
          setAdminPayouts(data.payouts);
        }
      }
    } catch {
      // ignore network error
    } finally {
      setLoadingPayouts(false);
    }
  }, [isAdminViewer]);

  React.useEffect(() => {
    if (activeTab === 'payouts' && isAdminViewer) {
      void loadAdminPayouts();
    }
  }, [activeTab, isAdminViewer, loadAdminPayouts]);

  const handleAdminUpdatePayoutStatus = async (
    payoutId: string,
    nextStatus: 'Pending' | 'Approved' | 'Paid'
  ) => {
    const token = getInMemoryAccessToken();
    if (!token || !isAdminViewer) return;
    try {
      const res = await fetch(`/api/creator/admin/payouts/${encodeURIComponent(payoutId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.payout) {
          setAdminPayouts((prev) =>
            prev.map((row) => (row.id === payoutId ? { ...row, ...data.payout } : row))
          );
          return;
        }
      }
    } catch {
      // ignore
    }
  };

  const refreshReports = () => {
    setReports(getAllSafetyReports());
  };

  const pendingMangas = mangaList.filter(
    (m) => m.approvalStatus === 'pending_review' || (!m.approvalStatus && m.id.startsWith('submitted-'))
  );

  const approvedMangas = mangaList.filter(
    (m) => m.approvalStatus === 'approved' || (!m.approvalStatus && !m.id.startsWith('submitted-'))
  );

  const rejectedMangas = mangaList.filter((m) => m.approvalStatus === 'rejected');

  const pendingReports = reports.filter((r) => r.status === 'pending');

  const handleOpenRejectModal = (manga: Manga) => {
    setRejectingManga(manga);
    setRejectionReason('Please refine chapter artwork resolution, lettering margins, and pan-African storyline depth.');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingManga) return;
    const finalReason = rejectionReason.trim() || 'Submission requires revisions to meet AZ OVERVERSE publishing guidelines.';
    onRejectManga(rejectingManga.id, finalReason);
    setRejectingManga(null);
    setRejectionReason('');
  };

  const handleResolveReport = (reportId: string, action: 'resolved' | 'dismissed') => {
    updateReportStatus(reportId, action);
    refreshReports();
  };

  const previewTargetManga = previewMangaId ? mangaList.find((m) => m.id === previewMangaId) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              AZ OVERVERSE Admin Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executive Producer Portal (mlungisenimbhele3@gmail.com) · Content Approvals & Moderation
          </p>
        </div>

        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            Back to Catalog
          </button>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'pending'
              ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pending Submissions
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{pendingMangas.length}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'reports'
              ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Safety Reports
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{pendingReports.length}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'approved'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-lg'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Live Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{approvedMangas.length}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            activeTab === 'rejected'
              ? 'bg-slate-800 border-slate-600 text-white shadow-lg'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rejected Titles
            </span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">{rejectedMangas.length}</div>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Submissions ({pendingMangas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-rose-500 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Safety Reports ({pendingReports.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'approved'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved Catalog ({approvedMangas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected Archive ({rejectedMangas.length})</span>
        </button>

        {isAdminViewer && (
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Creator Payouts (ZAR)</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT: PENDING MANGA SUBMISSIONS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-300">
              Review creator submissions before publishing. Approved titles immediately become visible on the public Home Page.
            </p>
          </div>

          {pendingMangas.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">All caught up!</h3>
              <p className="text-xs text-slate-400">
                No creator submissions currently waiting in the review queue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMangas.map((manga) => (
                <div
                  key={`pending-manga-${manga.id}`}
                  className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-amber-500/40 flex flex-col md:flex-row gap-4 items-start shadow-xl"
                >
                  <img
                    src={manga.coverUrl || manga.cover || manga.coverImage}
                    alt={manga.title}
                    className="w-24 h-32 sm:w-28 sm:h-36 rounded-2xl object-cover border border-slate-800 shrink-0 mx-auto md:mx-0 shadow-md"
                  />

                  <div className="flex-1 space-y-2.5 min-w-0 w-full">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{manga.title}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs text-amber-400 font-semibold">
                          Author: {manga.author} {manga.artist ? `· Artist: ${manga.artist}` : ''}
                        </p>
                      </div>

                      {manga.submittedByEmail && (
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {manga.submittedByEmail}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {manga.synopsis}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {manga.chapters?.length || 0} Chapters
                      </span>
                      {manga.genres && manga.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span>Genres: {manga.genres.join(', ')}</span>
                        </>
                      )}
                    </div>

                    {/* Chapter Pages Thumbnail Preview */}
                    {manga.chapters && manga.chapters.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Chapter 1 Sample Pages ({manga.chapters[0].pages?.length || 0} pages)
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {(manga.chapters[0].pages || []).slice(0, 6).map((page, idx) => (
                            <img
                              key={`admin-ch-page-${idx}`}
                              src={page.imageUrl}
                              alt={`Page ${page.pageNumber}`}
                              className="w-14 h-20 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-col items-stretch gap-2 shrink-0 w-full md:w-36 pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => setPreviewMangaId(previewMangaId === manga.id ? null : manga.id)}
                      className="flex-1 md:flex-none px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{previewMangaId === manga.id ? 'Close' : 'Inspect'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onApproveManga(manga.id)}
                      className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-105 text-white font-black text-xs transition shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(manga)}
                      className="flex-1 md:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
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

      {/* TAB CONTENT: SAFETY REPORTS (From Chat) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Safety reports submitted by readers against messages or user accounts. Saved in the <code className="text-amber-400 font-mono">reports</code> collection.
          </p>

          {reports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No reports recorded</h3>
              <p className="text-xs text-slate-400">Zero safety incidents reported across chat channels.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase">
                        {report.reason}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(report.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        report.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : report.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Status: {report.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">
                        Reported User ID
                      </span>
                      <span className="font-mono text-white select-all">{report.reportedUserId}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">
                        Reporter User ID
                      </span>
                      <span className="font-mono text-white select-all">{report.reporterUserId}</span>
                    </div>
                  </div>

                  {report.messageText && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">
                        Flagged Message Content
                      </span>
                      &ldquo;{report.messageText}&rdquo;
                    </div>
                  )}

                  {report.details && (
                    <div className="text-xs text-slate-300">
                      <strong className="text-slate-400">Reporter Explanation:</strong> {report.details}
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report.id, 'resolved')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: APPROVED CATALOG */}
      {activeTab === 'approved' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Titles live on the AZ OVERVERSE Public Home Page:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {approvedMangas.map((manga) => (
              <div
                key={`approved-manga-${manga.id}`}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex gap-3 items-center"
              >
                <img
                  src={manga.coverUrl || manga.cover || manga.coverImage}
                  alt={manga.title}
                  className="w-14 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{manga.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate">By {manga.author}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Live on Home Page
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REJECTED ARCHIVE */}
      {activeTab === 'rejected' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Titles rejected with reason feedback shown to creator:
          </p>
          {rejectedMangas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
              No rejected titles in the archive.
            </div>
          ) : (
            <div className="space-y-3">
              {rejectedMangas.map((manga) => (
                <div
                  key={`rejected-manga-${manga.id}`}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-rose-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{manga.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      Rejected
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 text-xs text-rose-300 border border-rose-500/20">
                    <span className="font-bold text-slate-400 block mb-0.5">Feedback to Creator:</span>
                    {manga.rejectionReason || 'No specific reason recorded.'}
                  </div>
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onApproveManga(manga.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                    >
                      Re-approve & Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ADMIN-ONLY CREATOR PAYOUTS REVIEW */}
      {activeTab === 'payouts' && isAdminViewer && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Creator Payouts (ZAR) · Admin Settlement Queue</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Review creator payout requests (7-14 working days, min R100). Bank details below are confidential and strictly visible only to the creator and admin.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Private View</span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4">Creator &amp; Bank Details</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Paid Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {loadingPayouts ? (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-slate-400">
                      Loading Neon payout queue...
                    </td>
                  </tr>
                ) : adminPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 px-4 text-center text-slate-400">
                      No creator payout requests pending review.
                    </td>
                  </tr>
                ) : (
                  adminPayouts.map((row) => {
                    const labelStatus =
                      row.status === 'Paid'
                        ? 'Paid'
                        : row.status === 'Approved'
                        ? 'Approved'
                        : 'Pending Review';

                    return (
                      <tr key={row.id} className="hover:bg-slate-900/60">
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {new Date(row.createdAt).toLocaleDateString('en-ZA')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{row.creatorEmail}</div>
                          <div className="text-[11px] text-amber-300 font-mono">
                            {row.method}: {row.accountReference}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          R {Number(row.amountZar || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              labelStatus === 'Paid'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : labelStatus === 'Approved'
                                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            }`}
                          >
                            {labelStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-ZA') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {labelStatus !== 'Approved' && labelStatus !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleAdminUpdatePayoutStatus(row.id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {labelStatus !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => handleAdminUpdatePayoutStatus(row.id, 'Paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      <AnimatePresence>
        {rejectingManga && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-slate-950 p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Reject Submission: {rejectingManga.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Provide detailed feedback. The creator will see this explanation in their Creator Dashboard.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectingManga(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Rejection Reason / Creator Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain what the creator needs to fix or why this submission was rejected..."
                    required
                    className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none leading-relaxed"
                  />
                </div>

                {/* Pre-fill Quick Reasons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Quick Templates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Chapter pages resolution too low.',
                      'Dialogue text overlaps page margins.',
                      'Cover artwork requires higher resolution.',
                      'Pan-African story background needs further depth.',
                    ].map((tpl) => (
                      <button
                        key={tpl}
                        type="button"
                        onClick={() => setRejectionReason(tpl)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 text-left transition"
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRejectingManga(null)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
