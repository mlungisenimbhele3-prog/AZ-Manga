import React, { useState, useEffect } from 'react';
import { Chapter, Manga, MonetizationModel, AccessType, AiDetectionResult } from '../../types';
import {
  UploadCloud,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  Image,
  BookOpen,
  Bot,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { ChapterUploadManager } from './ChapterUploadManager';
import { detectAiContent } from '../../utils/aiDetector';
import { uploadCoverFile } from '../../services/coverStorage';
import { MangaCoverImage } from '../common/MangaCoverImage';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  mangaList: Manga[];
  onPublishChapter: (mangaId: string, chapter: Chapter) => void;
  onPublishManga: (newManga: Manga) => void;
  selectedMangaId?: string;
  initialPublishType?: 'new_chapter' | 'new_series';
}

const SAMPLE_PAGE_IMAGES = [
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop&q=80',
];

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  mangaList,
  onPublishChapter,
  onPublishManga,
  selectedMangaId,
  initialPublishType = 'new_chapter',
}) => {
  const [publishType, setPublishType] = useState<'new_chapter' | 'new_series'>(initialPublishType);

  useEffect(() => {
    if (initialPublishType) {
      setPublishType(initialPublishType);
    }
  }, [initialPublishType, isOpen]);

  // New Series Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newGenres, setNewGenres] = useState<string>('Afro-Fantasy, Action, Fantasy');
  const [newSynopsis, setNewSynopsis] = useState<string>('');
  const [newMonetization, setNewMonetization] = useState<MonetizationModel>('hybrid');
  const [declaredAi, setDeclaredAi] = useState<boolean>(false);
  const [strictAutoBan, setStrictAutoBan] = useState<boolean>(true);
  const [isOwnedIP, setIsOwnedIP] = useState<boolean>(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(SAMPLE_PAGE_IMAGES[0]);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [coverUploadMsg, setCoverUploadMsg] = useState<string | null>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const url = await uploadCoverFile(file);
      setCoverImageUrl(url);
      setCoverUploadMsg('Cover uploaded to cloud storage successfully!');
      setTimeout(() => setCoverUploadMsg(null), 3500);
    } catch (err) {
      console.error('Failed to upload cover in PublishModal:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // AI Detector Scan State
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [previewAiResult, setPreviewAiResult] = useState<AiDetectionResult | null>(null);

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [publishedMangaSummary, setPublishedMangaSummary] = useState<{
    title: string;
    isBanned: boolean;
    isAi: boolean;
    score: number;
    banReason?: string;
  } | null>(null);

  // Auto-run AI check whenever title or synopsis changes
  useEffect(() => {
    if (newTitle.trim() || newSynopsis.trim() || declaredAi) {
      const scan = detectAiContent(
        {
          title: newTitle,
          synopsis: newSynopsis,
          author: newAuthor,
          genres: newGenres.split(',').map((g) => g.trim()),
          declaredAi,
        },
        { strictAutoBan }
      );
      setPreviewAiResult(scan);
    } else {
      setPreviewAiResult(null);
    }
  }, [newTitle, newSynopsis, newAuthor, newGenres, declaredAi, strictAutoBan]);

  if (!isOpen) return null;

  const handleLaunchSeries = (e: React.FormEvent) => {
    e.preventDefault();

    // Run final auto-detection scan on submission
    const scan = detectAiContent(
      {
        title: newTitle,
        synopsis: newSynopsis,
        author: newAuthor,
        artist: newAuthor,
        coverImage: coverImageUrl || SAMPLE_PAGE_IMAGES[0],
        bannerImage: coverImageUrl || SAMPLE_PAGE_IMAGES[1],
        genres: newGenres.split(',').map((g) => g.trim()),
        declaredAi,
      },
      { strictAutoBan }
    );

    const isBanned = scan.bannedStatus === 'auto_banned';
    const isAi = scan.isAiGenerated;

    const createdManga: Manga = {
      id: `manga-${Date.now()}`,
      title: newTitle || 'Untitled Chronicle',
      author: newAuthor || 'Independent Creator',
      artist: newAuthor || 'Studio Pulse',
      cover: coverImageUrl || SAMPLE_PAGE_IMAGES[0],
      coverUrl: coverImageUrl || SAMPLE_PAGE_IMAGES[0],
      coverImage: coverImageUrl || SAMPLE_PAGE_IMAGES[0],
      bannerImage: coverImageUrl || SAMPLE_PAGE_IMAGES[1],
      genres: newGenres.split(',').map((g) => g.trim()),
      status: 'ONGOING',
      synopsis: newSynopsis || 'A newly published manga journey on KA Plus: Africa Pulse.',
      rating: 0,
      views: 0,
      bookmarksCount: 0,
      monetizationModel: newMonetization,
      isAiGenerated: isAi,
      aiConfidenceScore: scan.confidenceScore,
      isBanned: isBanned,
      banReason: isBanned ? scan.banReason : undefined,
      aiDetection: scan,
      isOwnedIP: isOwnedIP,
      isBackdrop: isOwnedIP ? true : false,
      isCanvas: isOwnedIP ? true : false,
      isOriginal: false,
      approvalStatus: 'approved',
      submittedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      chapters: [
        {
          id: `ch-${Date.now()}-1`,
          mangaId: `manga-${Date.now()}`,
          number: 1,
          title: 'Chapter 1: The First Resonance',
          releaseDate: new Date().toISOString().split('T')[0],
          pageCount: 3,
          accessType: 'free',
          likesCount: 0,
          commentsCount: 0,
          pages: [
            {
              id: `p1`,
              pageNumber: 1,
              imageUrl: SAMPLE_PAGE_IMAGES[0],
              dialogs: [{ speaker: 'Protagonist', text: 'My journey begins here.', position: 'top-left' }],
            },
            {
              id: `p2`,
              pageNumber: 2,
              imageUrl: SAMPLE_PAGE_IMAGES[1],
            },
            {
              id: `p3`,
              pageNumber: 3,
              imageUrl: SAMPLE_PAGE_IMAGES[2],
            },
          ],
        },
      ],
    };

    onPublishManga(createdManga);
    setPublishedMangaSummary({
      title: createdManga.title,
      isBanned,
      isAi,
      score: scan.confidenceScore,
      banReason: scan.banReason,
    });
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2400);
  };

  return (
    <div
      id="publish-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="publish-modal"
        className="relative my-6 w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Creator Publishing Studio</h3>
              <p className="text-xs text-slate-400">Auto-Detect AI Guard & 70% Creator Revenue Share</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: New Chapter vs New Series */}
        <div className="flex border-b border-slate-800 bg-slate-900/70 p-2">
          <button
            id="tab-publish-chapter"
            type="button"
            onClick={() => setPublishType('new_chapter')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              publishType === 'new_chapter'
                ? 'bg-amber-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Publish New Chapter
          </button>
          <button
            id="tab-publish-series"
            type="button"
            onClick={() => setPublishType('new_series')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              publishType === 'new_series'
                ? 'bg-amber-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Launch New Manga Series
          </button>
        </div>

        {publishType === 'new_chapter' ? (
          <div className="p-6">
            <ChapterUploadManager
              mangaList={mangaList}
              selectedMangaId={selectedMangaId}
              onPublishChapter={onPublishChapter}
              onCancel={onClose}
              onSuccess={() => {
                setTimeout(onClose, 1600);
              }}
            />
          </div>
        ) : isSuccess && publishedMangaSummary ? (
          <div className="p-10 text-center flex flex-col items-center space-y-3">
            {publishedMangaSummary.isBanned ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-950/80 ring-4 ring-rose-400/40 animate-pulse">
                  <ShieldAlert className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-bold text-white">Auto-Ban Issued: AI Content Detected</h4>
                <p className="text-xs text-rose-300 max-w-md">
                  {publishedMangaSummary.banReason}
                </p>
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-mono text-rose-200">
                  Confidence: {publishedMangaSummary.score}% Synthetic • Quarantined on Home Screen
                </div>
              </>
            ) : publishedMangaSummary.isAi ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-black shadow-xl shadow-cyan-950/80">
                  <Bot className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-bold text-white">Series Published with AI Transparency Sticker</h4>
                <p className="text-xs text-slate-300 max-w-md">
                  Auto-detection flagged AI assistance ({publishedMangaSummary.score}%). A prominent "🤖 AI GENERATED" sticker will be displayed on the home screen.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-1 animate-bounce" />
                <h4 className="text-xl font-bold text-white">Artisan Series Launched Successfully!</h4>
                <p className="text-xs text-emerald-300">
                  Passed KA Plus: Africa Pulse Human Artisan integrity audit without synthetic strikes.
                </p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleLaunchSeries} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Series Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Blade of the Celestial Horizon"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Creator Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. Kenji & Studio Pulse"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Genres (comma-separated)
                </label>
                <input
                  type="text"
                  value={newGenres}
                  onChange={(e) => setNewGenres(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-medium text-slate-400">
                Quick-select genres:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Afro-Fantasy',
                  'Kasi-Punk',
                  'Ancestral Horror',
                  'Afro-Romance',
                  'Action',
                  'Romance',
                  'Fantasy',
                  'Comedy',
                  'Shonen',
                  'Seinen',
                ].map((genreTag) => {
                  const currentList = newGenres
                    .split(',')
                    .map((g) => g.trim())
                    .filter(Boolean);
                  const isActive = currentList.some(
                    (g) => g.toLowerCase() === genreTag.toLowerCase()
                  );
                  return (
                    <button
                      key={`pub-genre-${genreTag}`}
                      type="button"
                      onClick={() => {
                        const nextList = isActive
                          ? currentList.filter(
                              (g) => g.toLowerCase() !== genreTag.toLowerCase()
                            )
                          : [...currentList, genreTag];
                        setNewGenres(nextList.join(', '));
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-black font-bold'
                          : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {genreTag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cover Artwork Upload & Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Cover Artwork
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
                      <span>Upload Cover</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingCover}
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {coverUploadMsg && (
                <p className="text-[11px] text-emerald-400 font-bold mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{coverUploadMsg}</span>
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="h-20 w-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                  <MangaCoverImage
                    src={coverImageUrl}
                    alt={newTitle || 'Cover preview'}
                    title={newTitle || 'Cover preview'}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="Cover Image HTTPS URL (or click Upload Cover)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Upload a file from your device to save to cloud storage, or enter an HTTPS image link.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monetization Model
              </label>
              <select
                value={newMonetization}
                onChange={(e) => setNewMonetization(e.target.value as MonetizationModel)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white"
              >
                <option value="hybrid">Hybrid (Free Ad-Supported + VIP Fast Pass)</option>
                <option value="ad_supported">100% Ad-Supported (Free for all)</option>
                <option value="subscription_only">VIP Subscribers Exclusive</option>
              </select>
            </div>

            {/* Original IP Ownership Checkbox */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOwnedIP}
                  onChange={(e) => setIsOwnedIP(e.target.checked)}
                  className="accent-amber-500 rounded h-5 w-5 mt-0.5 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">This is original IP owned by me</span>
                    <span className="rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold px-1.5 py-0.2">
                      BACKDROP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    If checked, your title is published as a <strong>BACKDROP</strong> series. Admin <strong className="text-amber-400">mlungisenimbhele3@gmail.com</strong> can review and promote your series to <strong className="text-amber-300">AZ ORIGINAL 👑</strong>.
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Synopsis / Story Pitch
              </label>
              <textarea
                rows={3}
                value={newSynopsis}
                onChange={(e) => setNewSynopsis(e.target.value)}
                placeholder="What is the story about? Hook the readers..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Automated AI Detector & Ban Policy Card */}
            <div className="rounded-2xl border border-cyan-800/60 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>KA Plus: Africa Pulse AI Auto-Detect & Artisan Integrity Engine</span>
                      <span className="rounded bg-cyan-500/20 text-cyan-300 text-[9px] px-1.5 py-0.2 font-mono">
                        Active
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Auto-detects synthetic diffusion models, prompt artifacts, and applies stickers/bans.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strictAutoBan}
                    onChange={(e) => setStrictAutoBan(e.target.checked)}
                    className="accent-amber-500 rounded h-4 w-4"
                  />
                  <span className="font-semibold text-[11px]">Strict Auto-Ban (&gt;75%)</span>
                </label>
              </div>

              {/* Creator AI declaration toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="text-xs">
                  <span className="font-semibold text-slate-200">Disclose AI Tooling:</span>
                  <p className="text-[10px] text-slate-400">Did you use Midjourney, SDXL, or AI inking for this series?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeclaredAi(!declaredAi)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                    declaredAi
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{declaredAi ? 'AI Disclosed (Sticker Affixed)' : '100% Handcrafted'}</span>
                </button>
              </div>

              {/* Real-time AI preview indicator */}
              {previewAiResult && (
                <div
                  className={`rounded-xl border p-2.5 text-xs space-y-1.5 ${
                    previewAiResult.bannedStatus === 'auto_banned'
                      ? 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                      : previewAiResult.isAiGenerated
                      ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                      : 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {previewAiResult.bannedStatus === 'auto_banned' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      ) : previewAiResult.isAiGenerated ? (
                        <Bot className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>
                        {previewAiResult.bannedStatus === 'auto_banned'
                          ? 'Trigger Warning: Will Auto-Ban on Publish'
                          : previewAiResult.isAiGenerated
                          ? 'Will Publish with "🤖 AI GENERATED" Sticker'
                          : 'Artisan Verified: Handcrafted Manga'}
                      </span>
                    </span>
                    <span className="font-mono text-xs font-black">
                      {previewAiResult.confidenceScore}% AI Confidence
                    </span>
                  </div>
                  {previewAiResult.detectedFeatures.length > 0 && (
                    <p className="text-[11px] opacity-90">
                      Detected: {previewAiResult.detectedFeatures.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="submit-launch-series-btn"
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 text-xs font-bold transition shadow-md"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Publish Series (With AI Guard)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
