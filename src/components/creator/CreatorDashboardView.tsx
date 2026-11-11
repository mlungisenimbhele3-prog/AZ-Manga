import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowLeft,
  User,
  ShieldCheck,
  ShieldAlert,
  Baby,
  Users,
  Flame,
  Skull,
  Flag,
  FileText,
  Check,
} from 'lucide-react';
import { Manga, Chapter, ChapterPage } from '../../types';
import {
  UserProfile,
  getCurrentUserProfile,
  becomeCreatorAccount,
} from '../../services/userProfile';

interface CreatorDashboardViewProps {
  currentUserEmail: string;
  mangaList: Manga[];
  onCreateManga: (newManga: Manga) => void;
  onUpdateManga: (updatedManga: Manga) => void;
  onDeleteManga: (mangaId: string) => void;
  onBackToCatalog?: () => void;
}

const GENRE_OPTIONS = [
  'Action',
  'Romance',
  'Comedy',
  'Fantasy',
  'Drama',
  'Horror',
];

const LANGUAGE_OPTIONS = ['English', 'isiZulu', 'Afrikaans', 'Swahili', 'Yoruba', 'French'];

const AGE_RATING_OPTIONS = ['All Ages', '13+', '16+', '18+'] as const;

export const CreatorDashboardView: React.FC<CreatorDashboardViewProps> = ({
  currentUserEmail,
  mangaList,
  onCreateManga,
  onUpdateManga,
  onDeleteManga,
  onBackToCatalog,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUserProfile());

  // Check if current user is creator
  const isCreator = profile.isCreator || profile.role === 'creator' || profile.creatorStatus === 'approved';

  // "Become a Creator" form states
  const [showBecomeCreatorModal, setShowBecomeCreatorModal] = useState(false);
  const [penNameInput, setPenNameInput] = useState(profile.penName || profile.displayName || '');
  const [bioInput, setBioInput] = useState(profile.bio || '');
  const [emailInput, setEmailInput] = useState(profile.email || currentUserEmail || '');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || '');
  const [isSubmittingCreator, setIsSubmittingCreator] = useState(false);

  // New Manga Modal States
  const [showNewMangaModal, setShowNewMangaModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGenres, setNewGenres] = useState<string[]>(['Action']);
  const [newLanguage, setNewLanguage] = useState('English');
  const [newAgeRating, setNewAgeRating] = useState<'All Ages' | '13+' | '16+' | '18+'>('All Ages');
  const [showContentRulesModal, setShowContentRulesModal] = useState(false);

  // Edit Manga Modal States
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Add Chapter Modal States
  const [chapterTargetManga, setChapterTargetManga] = useState<Manga | null>(null);
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [chapterPages, setChapterPages] = useState<string[]>([]);

  // Deletion Confirmation States
  const [mangaToDelete, setMangaToDelete] = useState<Manga | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<{ manga: Manga; chapter: Chapter } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Filter only mangas owned by the current creator
  const normalizedUserEmail = (currentUserEmail || profile.email || '').toLowerCase();
  const myMangas = mangaList.filter((m) => {
    const submitter = (m.submittedByEmail || '').toLowerCase();
    const authorName = (m.author || '').toLowerCase();
    const penName = (profile.penName || '').toLowerCase();
    return (
      (submitter && submitter === normalizedUserEmail) ||
      (penName && authorName === penName) ||
      m.id.startsWith(`creator-${profile.uid}`)
    );
  });

  // Handle Become Creator Submit
  const handleBecomeCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreator(true);
    try {
      const updated = await becomeCreatorAccount({
        penName: penNameInput.trim() || 'Creator',
        bio: bioInput.trim() || 'AZ OVERVERSE Official Manga Creator.',
        avatarUrl: avatarPreview || undefined,
        email: emailInput.trim() || currentUserEmail,
      });
      setProfile(updated);
      setShowBecomeCreatorModal(false);
      showToast('🎉 Congratulations! You are now an approved Creator.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCreator(false);
    }
  };

  // Handle Cover Image File Upload
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  // Handle Avatar Image File Upload
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Chapter Pages Multiple Files Upload
  const handlePagesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const readers = Array.from(files).map((file) => {
        return new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = (evt) => resolve(evt.target?.result as string);
          r.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((newPages) => {
        setChapterPages((prev) => [...prev, ...newPages]);
      });
    }
  };

  // Handle Create New Manga
  const handleCreateMangaSubmit = (e: React.FormEvent) => {
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
      synopsis: newDescription.trim() || 'New creator serialization published on AZ OVERVERSE.',
      rating: 0,
      ratingCount: 0,
      views: 0,
      bookmarksCount: 0,
      monetizationModel: 'hybrid',
      chapters: [],
      // VERY IMPORTANT: save as pending_review
      approvalStatus: 'pending_review',
      submittedByEmail: currentUserEmail || profile.email,
      submittedAt: new Date().toISOString(),
    };

    onCreateManga(newManga);
    setShowNewMangaModal(false);
    setNewTitle('');
    setNewCoverImage('');
    setNewDescription('');
    setNewGenres(['Action']);
    showToast('Manga created! Status: Pending Review. Add chapters now.');
  };

  // Handle Edit Manga
  const handleSaveEditManga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManga) return;

    const updated: Manga = {
      ...editingManga,
      title: editTitle.trim(),
      synopsis: editDescription.trim(),
      cover: editCover.trim() || editingManga.cover,
      coverImage: editCover.trim() || editingManga.coverImage,
      coverUrl: editCover.trim() || editingManga.coverUrl,
    };

    onUpdateManga(updated);
    setEditingManga(null);
    showToast('Manga updated successfully.');
  };

  // Handle Open Add Chapter Modal
  const handleOpenAddChapter = (manga: Manga) => {
    setChapterTargetManga(manga);
    setNewChapterNumber((manga.chapters?.length || 0) + 1);
    setNewChapterTitle(`Episode ${(manga.chapters?.length || 0) + 1}`);
    setChapterPages([]);
  };

  // Handle Add Chapter Submit
  const handleAddChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTargetManga) return;

    const finalPages: ChapterPage[] =
      chapterPages.length > 0
        ? chapterPages.map((url, idx) => ({
            id: `p-${idx + 1}`,
            pageNumber: idx + 1,
            imageUrl: url,
          }))
        : [
            {
              id: 'p-1',
              pageNumber: 1,
              imageUrl: chapterTargetManga.coverUrl || chapterTargetManga.coverImage,
              caption: 'Chapter Title Page',
            },
          ];

    const chapterId = `ch-${chapterTargetManga.id}-${Date.now()}`;
    const newChapter: Chapter = {
      id: chapterId,
      mangaId: chapterTargetManga.id,
      number: Number(newChapterNumber),
      title: newChapterTitle.trim() || `Chapter ${newChapterNumber}`,
      releaseDate: new Date().toISOString().split('T')[0],
      pageCount: finalPages.length,
      accessType: 'free',
      pages: finalPages,
      likesCount: 0,
      commentsCount: 0,
      rating: 0,
    };

    const updatedManga: Manga = {
      ...chapterTargetManga,
      chapters: [...(chapterTargetManga.chapters || []), newChapter],
      // Re-mark as pending_review when new chapters drop
      approvalStatus: 'pending_review',
    };

    onUpdateManga(updatedManga);
    setChapterTargetManga(null);
    showToast('Chapter submitted for review! It will be published once approved by admin.');
  };

  // Handle Delete Chapter
  const handleConfirmDeleteChapter = () => {
    if (!chapterToDelete) return;
    const { manga, chapter } = chapterToDelete;
    const updatedChapters = (manga.chapters || []).filter((c) => c.id !== chapter.id);
    const updatedManga: Manga = {
      ...manga,
      chapters: updatedChapters,
    };
    onUpdateManga(updatedManga);
    setChapterToDelete(null);
    showToast('Chapter deleted.');
  };

  // Handle Delete Manga
  const handleConfirmDeleteManga = () => {
    if (!mangaToDelete) return;
    onDeleteManga(mangaToDelete.id);
    setMangaToDelete(null);
    showToast('Manga series deleted.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-black/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation & Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          {onBackToCatalog && (
            <button
              type="button"
              onClick={onBackToCatalog}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition"
              aria-label="Back to catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Creator Dashboard
              </h1>
              {isCreator && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase">
                  Creator Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Publish original African manga, manage chapters, and track editorial review status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="creator-dashboard-content-rules-btn"
            onClick={() => setShowContentRulesModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white font-bold text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            title="AZ OVERVERSE Age Rating & Content Rules"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Content Rules</span>
          </button>

          {isCreator ? (
            <button
              type="button"
              onClick={() => setShowNewMangaModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg hover:brightness-105 active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Manga</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowBecomeCreatorModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg hover:brightness-105 active:scale-95 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Become a Creator</span>
            </button>
          )}
        </div>
      </div>

      {/* NON-CREATOR STATE: PROMPT TO BECOME CREATOR */}
      {!isCreator && (
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-white">
              Activate Your Creator Account
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Join Mlungiseni Mbhele and pan-African mangakas publishing original series on AZ OVERVERSE. Retain 70% revenue share with instant Google AdMob monetization.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBecomeCreatorModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-xl hover:brightness-105 transition"
          >
            Become a Creator
          </button>
        </div>
      )}

      {/* CREATOR PROFILE & SUMMARY STATS */}
      {isCreator && (
        <>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={profile.penName || 'Creator'}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {profile.penName || profile.displayName}
                  </h2>
                  <span className="text-amber-400 text-xs">✨ Verified Creator</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 max-w-md">
                  {profile.bio || 'Manga artist and author on AZ OVERVERSE.'}
                </p>
                <span className="text-[11px] font-mono text-slate-500">
                  Account: {profile.email || currentUserEmail}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-around">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  My Series
                </span>
                <span className="text-xl font-black text-white">{myMangas.length}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Chapters
                </span>
                <span className="text-xl font-black text-amber-400">
                  {myMangas.reduce((acc, m) => acc + (m.chapters?.length || 0), 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Revenue Share
                </span>
                <span className="text-xl font-black text-emerald-400">70%</span>
              </div>
            </div>
          </div>

          {/* MANGA CATALOG SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>My Manga Series ({myMangas.length})</span>
              </h3>

              <button
                type="button"
                onClick={() => setShowNewMangaModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Series</span>
              </button>
            </div>

            {myMangas.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Manga Uploaded Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the &ldquo;New Manga&rdquo; button above to create your first series and start uploading chapters.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewMangaModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Create Your First Manga
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myMangas.map((manga) => {
                  const status = manga.approvalStatus || 'approved';
                  return (
                    <div
                      key={manga.id}
                      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <img
                          src={manga.coverUrl || manga.cover || manga.coverImage}
                          alt={manga.title}
                          className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl object-cover border border-slate-800 shrink-0 mx-auto sm:mx-0 shadow-md"
                        />

                        <div className="flex-1 space-y-2 min-w-0 w-full">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h4 className="text-base font-black text-white">{manga.title}</h4>
                              <span className="text-xs text-slate-400">
                                {manga.genres?.join(', ') || 'Action'} · {manga.status}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {status === 'pending_review' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pending Review</span>
                                </span>
                              )}
                              {status === 'approved' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approved & Live</span>
                                </span>
                              )}
                              {status === 'rejected' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                            {manga.synopsis}
                          </p>

                          {/* Rejection Reason Alert if Rejected */}
                          {status === 'rejected' && (
                            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-1">
                              <span className="font-bold block flex items-center gap-1 text-rose-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Rejection Reason from Admin:</span>
                              </span>
                              <p className="leading-relaxed">
                                {manga.rejectionReason || 'Please review your pages resolution and dialogue flow before resubmitting.'}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons Row */}
                          <div className="flex items-center flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAddChapter(manga)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Chapter</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingManga(manga);
                                setEditTitle(manga.title);
                                setEditDescription(manga.synopsis);
                                setEditCover(manga.coverUrl || manga.cover || manga.coverImage);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Manga</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setMangaToDelete(manga)}
                              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-rose-950/60 text-rose-400 text-xs font-semibold transition flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Manga</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Chapters List Table */}
                      <div className="border-t border-slate-800 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Chapters ({manga.chapters?.length || 0})
                          </span>
                        </div>

                        {!manga.chapters || manga.chapters.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-2">
                            No chapters added yet. Click &ldquo;Add Chapter&rdquo; to upload pages.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {manga.chapters.map((chapter) => (
                              <div
                                key={chapter.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono font-bold text-amber-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded">
                                    Ch. {chapter.number}
                                  </span>
                                  <span className="font-semibold text-white">{chapter.title}</span>
                                  <span className="text-[10px] text-slate-400">
                                    ({chapter.pages?.length || chapter.pageCount} pages)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {chapter.releaseDate}
                                  </span>
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
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL: BECOME A CREATOR */}
      <AnimatePresence>
        {showBecomeCreatorModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Become a Creator</h3>
                    <p className="text-xs text-slate-400">Publish original manga on AZ OVERVERSE</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBecomeCreatorModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBecomeCreatorSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Pen Name / Studio Name
                  </label>
                  <input
                    type="text"
                    value={penNameInput}
                    onChange={(e) => setPenNameInput(e.target.value)}
                    placeholder="e.g. Mlungiseni Mbhele"
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Creator Bio
                  </label>
                  <textarea
                    rows={2}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell readers about your art, inspiration, and serialization style..."
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-3">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-12 h-12 rounded-xl object-cover border border-amber-400"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-center">
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your-email@example.com"
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowBecomeCreatorModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreator}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-lg hover:brightness-105 transition"
                  >
                    {isSubmittingCreator ? 'Saving...' : 'Activate Creator Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW MANGA */}
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
              className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl text-white space-y-4 my-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">New Manga Series</h3>
                    <p className="text-xs text-slate-400">Submitted as Pending Review for Admin approval</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewMangaModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMangaSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Manga Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Chronicles of Nkosi"
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Cover Image
                  </label>
                  <div className="flex items-center gap-3">
                    {newCoverImage ? (
                      <img
                        src={newCoverImage}
                        alt="Cover preview"
                        className="w-16 h-20 rounded-xl object-cover border border-amber-400 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <label className="block cursor-pointer px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-center font-semibold">
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
                        placeholder="Or paste cover image URL..."
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Description / Synopsis
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Synopsis of your story, themes, and characters..."
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {/* Genre Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Genre
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRE_OPTIONS.map((genre) => {
                      const isSelected = newGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewGenres(newGenres.filter((g) => g !== genre));
                            } else {
                              setNewGenres([...newGenres, genre]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language & Age Rating */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block">
                      Language
                    </label>
                    <select
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                      <label className="text-[11px] font-bold uppercase text-slate-400 block">
                        Age Rating *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowContentRulesModal(true)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        Rules Guide
                      </button>
                    </div>
                    <select
                      value={newAgeRating}
                      onChange={(e) => setNewAgeRating(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    >
                      {AGE_RATING_OPTIONS.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Rating Guidance */}
                {newAgeRating === 'All Ages' && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <Baby className="w-3.5 h-3.5" />
                      <span>ALL AGES — For Everyone</span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      No blood, no gore, no swearing, no kissing beyond a quick peck, no scary horror. Think: Sunday morning cartoon.
                    </p>
                  </div>
                )}

                {newAgeRating === '13+' && (
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                      <Users className="w-3.5 h-3.5" />
                      <span>13+ — Young Teen Readers</span>
                    </div>
                    <p className="text-[11px] text-cyan-100/90 leading-relaxed">
                      Mild action violence, a little blood, mild swearing, crushes and romance, spooky but not scary. No gore, no sexual content, no detailed injuries.
                    </p>
                  </div>
                )}

                {newAgeRating === '16+' && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <Flame className="w-3.5 h-3.5" />
                      <span>16+ — Older Teen Readers</span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed">
                      Stronger violence, blood, horror, death, trauma, strong language, suggestive outfits, kissing and romantic tension, implied intimacy off-screen. No explicit sex, no genitalia, no graphic sexual violence.
                    </p>
                  </div>
                )}

                {newAgeRating === '18+' && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-300">
                      <Skull className="w-3.5 h-3.5" />
                      <span>18+ — Mature Readers Only</span>
                    </div>
                    <p className="text-[11px] text-rose-100/90 leading-relaxed">
                      Intense gore, graphic violence, horror, dark themes, strong language, suggestive themes, implied sex. This is for MATURE readers only.
                    </p>
                  </div>
                )}

                {/* NEVER ALLOWED Notice Box */}
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-red-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-red-400 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>NEVER ALLOWED — Even in 18+</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowContentRulesModal(true)}
                      className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline"
                    >
                      View All Rules →
                    </button>
                  </div>
                  <ul className="text-[10px] text-slate-300 space-y-0.5 list-disc list-inside">
                    <li>No explicit sex acts or visible genitals</li>
                    <li>No pornographic / hentai content</li>
                    <li>No sexual content involving minors or characters who look like minors</li>
                    <li>No real photos of sexual content or real gore</li>
                  </ul>
                  <p className="text-[10px] text-amber-200 font-medium pt-1 border-t border-red-500/20">
                    Choosing 18+ does not mean you can post porn. It means you can post darker, more violent stories. All uploads stay as &ldquo;Pending Review&rdquo; until approved by an Admin.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewMangaModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-lg hover:brightness-105 transition"
                  >
                    Create Series (Pending Review)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD CHAPTER */}
      <AnimatePresence>
        {chapterTargetManga && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl text-white space-y-4 my-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Add Chapter to {chapterTargetManga.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload page images in order. Will be submitted as Pending Review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChapterTargetManga(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddChapterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block">
                      Chapter #
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newChapterNumber}
                      onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                      required
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block">
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="e.g. The Awakening"
                      required
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Upload Pages */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-400 block">
                    Upload Pages (multiple images in order)
                  </label>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-2xl bg-slate-900/50 cursor-pointer transition">
                    <UploadCloud className="w-8 h-8 text-amber-400 mb-1.5" />
                    <span className="text-xs font-bold text-white">Click or drag pages here</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Select JPG, PNG, WEBP files in reading sequence
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePagesFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Pages Preview Thumbnails */}
                {chapterPages.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pages Added ({chapterPages.length}):
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-900/80 rounded-xl border border-slate-800">
                      {chapterPages.map((pageUrl, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-[3/4]">
                          <img
                            src={pageUrl}
                            alt={`Page ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/80 px-1 rounded text-[9px] font-mono text-amber-300">
                            p.{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setChapterPages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-0.5 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                            title="Remove page"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setChapterTargetManga(null)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-lg hover:brightness-105 transition"
                  >
                    Publish Chapter (Pending Review)
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

      {/* CONFIRMATION: DELETE MANGA */}
      <AnimatePresence>
        {mangaToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
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
                  Are you sure you want to delete <strong className="text-white">&ldquo;{mangaToDelete.title}&rdquo;</strong>? This action cannot be undone.
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

      {/* CONFIRMATION: DELETE CHAPTER */}
      <AnimatePresence>
        {chapterToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
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
                  Are you sure you want to delete <strong className="text-white">&ldquo;{chapterToDelete.chapter.title}&rdquo;</strong> (Ch. {chapterToDelete.chapter.number})?
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
            aria-label="AZ OVERVERSE Age Rating Rules"
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

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold leading-relaxed">
                All manga must follow these rules, no matter what rating you choose. If you break them, your series will be removed.
              </div>

              {/* 4 Tiers */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                      ALL AGES
                    </span>
                    <span className="text-xs font-bold text-white">For everyone</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No blood, no gore, no swearing, no kissing beyond a quick peck, no scary horror. Think: Sunday morning cartoon.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs">
                      13+
                    </span>
                    <span className="text-xs font-bold text-white">Young Teen Readers</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mild action violence, a little blood, mild swearing, crushes and romance, spooky but not scary. No gore, no sexual content, no detailed injuries.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                      16+
                    </span>
                    <span className="text-xs font-bold text-white">Older Teen Readers</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Stronger violence, blood, horror, death, trauma, strong language, suggestive outfits, kissing and romantic tension, implied intimacy off-screen. No explicit sex, no genitalia, no graphic sexual violence.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs">
                      18+
                    </span>
                    <span className="text-xs font-bold text-white">Mature Readers Only</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Intense gore, graphic violence, horror, dark themes, strong language, suggestive themes, implied sex. This is for MATURE readers only.
                  </p>
                </div>
              </div>

              {/* NEVER ALLOWED */}
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

              <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 leading-relaxed">
                Your series will stay as <strong className="text-amber-400">&ldquo;Pending Review&rdquo;</strong> until an Admin checks it. Choosing 18+ does not mean you can post porn. It means you can post darker, more violent stories.
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  If you see something that breaks these rules, report it.
                </span>
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
