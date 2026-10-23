import React, { useState, useRef, useEffect } from 'react';
import { Chapter, ChapterPage, ChapterDialog, Manga, AccessType } from '../../types';
import {
  UploadCloud,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Coins,
  Sparkles,
  CheckCircle2,
  FileImage,
  Eye,
  MessageSquare,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { SouthAfricaFlameLogo } from '../common/SouthAfricaFlameLogo';

interface ChapterUploadManagerProps {
  mangaList: Manga[];
  selectedMangaId?: string;
  onPublishChapter: (mangaId: string, chapter: Chapter) => void;
  onSuccess?: (mangaId: string, newChapter: Chapter) => void;
  onCancel?: () => void;
}

const DEFAULT_SAMPLE_PAGES = [
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop&q=80',
];

interface DraftPage {
  id: string;
  imageUrl: string;
  fileName?: string;
  dialogs?: ChapterDialog[];
}

export const ChapterUploadManager: React.FC<ChapterUploadManagerProps> = ({
  mangaList,
  selectedMangaId,
  onPublishChapter,
  onSuccess,
  onCancel,
}) => {
  const [targetMangaId, setTargetMangaId] = useState<string>(
    selectedMangaId || mangaList[0]?.id || ''
  );

  const selectedManga = mangaList.find((m) => m.id === targetMangaId) || mangaList[0];

  // Compute next chapter number based on existing chapters
  const maxExistingChapterNum = selectedManga?.chapters?.length
    ? Math.max(...selectedManga.chapters.map((c) => c.number), 0)
    : 0;

  const [chapterNumber, setChapterNumber] = useState<number>(maxExistingChapterNum + 1);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [accessType, setAccessType] = useState<AccessType>('free');
  const [releaseDate, setReleaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Uploaded Pages state
  const [pages, setPages] = useState<DraftPage[]>([
    {
      id: `draft-p-1`,
      imageUrl: DEFAULT_SAMPLE_PAGES[0],
      fileName: 'page_01_cover_art.jpg',
      dialogs: [
        {
          speaker: 'Narrator',
          text: 'The celestial seal has shattered after a millennium.',
          position: 'top-left',
        },
      ],
    },
    {
      id: `draft-p-2`,
      imageUrl: DEFAULT_SAMPLE_PAGES[1],
      fileName: 'page_02_action.jpg',
    },
  ]);

  // Direct image URL input state
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeDialogPageId, setActiveDialogPageId] = useState<string | null>(null);
  const [dialogSpeaker, setDialogSpeaker] = useState<string>('');
  const [dialogText, setDialogText] = useState<string>('');
  const [dialogPos, setDialogPos] = useState<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  >('top-left');

  // Preview lightbox
  const [previewPageUrl, setPreviewPageUrl] = useState<string | null>(null);

  // Submit / Publish state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isPublishedSuccess, setIsPublishedSuccess] = useState<boolean>(false);
  const [lastUploadedChapter, setLastUploadedChapter] = useState<Chapter | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // When selected series changes, recompute next chapter number
  useEffect(() => {
    if (selectedManga) {
      const nextNum = selectedManga.chapters?.length
        ? Math.max(...selectedManga.chapters.map((c) => c.number), 0) + 1
        : 1;
      setChapterNumber(nextNum);
      if (!chapterTitle) {
        setChapterTitle(`Chapter ${nextNum}: Awakening`);
      }
    }
  }, [targetMangaId]);

  // Handle local file uploads (drag-drop or file picker)
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setValidationError(null);

    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      setValidationError('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newDraftPage: DraftPage = {
            id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            imageUrl: e.target.result as string,
            fileName: file.name,
          };
          setPages((prev) => [...prev, newDraftPage]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Add from URL
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setPages((prev) => [
      ...prev,
      {
        id: `page-url-${Date.now()}`,
        imageUrl: urlInput.trim(),
        fileName: `web_asset_${prev.length + 1}.jpg`,
      },
    ]);
    setUrlInput('');
    setValidationError(null);
  };

  // Add sample art pages
  const handleAddSamplePages = () => {
    const nextIdx = pages.length % DEFAULT_SAMPLE_PAGES.length;
    setPages((prev) => [
      ...prev,
      {
        id: `sample-${Date.now()}`,
        imageUrl: DEFAULT_SAMPLE_PAGES[nextIdx],
        fileName: `manga_illustration_${prev.length + 1}.jpg`,
      },
    ]);
    setValidationError(null);
  };

  // Reordering pages
  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const updated = [...pages];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPages(updated);
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Dialog Speech Balloon Editor
  const openDialogEditor = (pageId: string) => {
    const targetPage = pages.find((p) => p.id === pageId);
    setActiveDialogPageId(pageId);
    if (targetPage?.dialogs && targetPage.dialogs.length > 0) {
      setDialogSpeaker(targetPage.dialogs[0].speaker);
      setDialogText(targetPage.dialogs[0].text);
      setDialogPos(targetPage.dialogs[0].position || 'top-left');
    } else {
      setDialogSpeaker('');
      setDialogText('');
      setDialogPos('top-left');
    }
  };

  const saveDialogToPage = () => {
    if (!activeDialogPageId) return;
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === activeDialogPageId) {
          if (!dialogText.trim()) {
            return { ...p, dialogs: undefined };
          }
          return {
            ...p,
            dialogs: [
              {
                speaker: dialogSpeaker.trim() || 'Character',
                text: dialogText.trim(),
                position: dialogPos,
              },
            ],
          };
        }
        return p;
      })
    );
    setActiveDialogPageId(null);
  };

  // Handle Publishing Action
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMangaId) {
      setValidationError('Please select a manga series to upload to.');
      return;
    }

    if (pages.length === 0) {
      setValidationError('Please upload at least 1 manga page for this chapter.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    setUploadProgress(15);

    // Simulate realistic upload progress bar
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const formattedPages: ChapterPage[] = pages.map((p, index) => ({
        id: `page-${Date.now()}-${index + 1}`,
        pageNumber: index + 1,
        imageUrl: p.imageUrl,
        dialogs: p.dialogs,
      }));

      const newChapter: Chapter = {
        id: `ch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        mangaId: targetMangaId,
        number: Number(chapterNumber),
        title: chapterTitle.trim() || `Chapter ${chapterNumber}`,
        releaseDate: releaseDate || new Date().toISOString().split('T')[0],
        pageCount: pages.length,
        accessType: accessType,
        likesCount: 0,
        commentsCount: 0,
        pages: formattedPages,
      };

      onPublishChapter(targetMangaId, newChapter);
      setLastUploadedChapter(newChapter);
      setIsSubmitting(false);
      setIsPublishedSuccess(true);

      if (onSuccess) {
        onSuccess(targetMangaId, newChapter);
      }
    }, 850);
  };

  const handleResetForAnotherUpload = () => {
    setIsPublishedSuccess(false);
    setLastUploadedChapter(null);
    setChapterNumber((prev) => prev + 1);
    setChapterTitle(`Chapter ${chapterNumber + 1}`);
    setPages([]);
  };

  // Success view
  if (isPublishedSuccess && lastUploadedChapter) {
    return (
      <div
        id="chapter-upload-success-panel"
        className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-10 text-center space-y-6 shadow-2xl"
      >
        <div className="flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-950/50">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
            <div className="absolute -top-1 -right-1">
              <SouthAfricaFlameLogo size="xs" variant="sa_flag" />
            </div>
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 text-xs font-bold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            Chapter Published & Monetized!
          </span>
          <h3 className="text-2xl font-black text-white">
            Chapter {lastUploadedChapter.number} is Live
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Uploaded to <strong className="text-amber-300">{selectedManga?.title}</strong> with{' '}
            {lastUploadedChapter.pageCount} pages.
          </p>
        </div>

        {/* Monetization Share Summary */}
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Monetization Model:</span>
            <span className="font-bold text-amber-300 uppercase">
              {lastUploadedChapter.accessType === 'free'
                ? 'Free (70% Ad Revenue Share)'
                : 'VIP Fast Pass (70% Subscription Share)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Supported Payout Rails:</span>
            <span className="text-emerald-400 font-medium">
              Google AdMob · Google Play Billing
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="btn-upload-another-chapter"
            onClick={handleResetForAnotherUpload}
            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Another Chapter</span>
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 text-xs font-bold transition"
            >
              Done & Return to Studio
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="chapter-upload-workspace" className="space-y-6 text-slate-100">
      {/* Top Banner & Instructions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-white">
                Manga Chapter Upload Studio
              </h3>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">
                70% Creator Revenue
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag & drop manga page scans, configure early access passes, and publish immediately.
            </p>
          </div>
        </div>

        {selectedManga && (
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 shrink-0">
            <img
              src={selectedManga.coverImage}
              alt={selectedManga.title}
              className="h-9 w-7 rounded object-cover border border-slate-700"
            />
            <div className="text-left">
              <span className="block text-[10px] text-slate-400">Target Manga Series</span>
              <span className="block text-xs font-bold text-white max-w-[130px] truncate">
                {selectedManga.title}
              </span>
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Step 1: Target Manga & Chapter Metadata */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black text-[11px] font-black">
              1
            </span>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Series & Chapter Details
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Select Target Manga Series */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Manga Series *
              </label>
              <select
                id="upload-select-target-manga"
                value={targetMangaId}
                onChange={(e) => setTargetMangaId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {mangaList.map((m, idx) => (
                  <option key={`${m.id}-${idx}`} value={m.id}>
                    {m.title} ({m.chapters.length} Chs)
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chapter Number *
              </label>
              <div className="relative">
                <input
                  id="upload-chapter-number"
                  type="number"
                  min="1"
                  step="0.5"
                  required
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                  Ch.
                </span>
              </div>
            </div>

            {/* Chapter Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chapter Title *
              </label>
              <input
                id="upload-chapter-title"
                type="text"
                required
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. Awakening the Dragon"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Release Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Scheduled Release Date</span>
              </label>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Total Pages Counter Indicator */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Uploaded Page Count</span>
              </label>
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 flex items-center justify-between">
                <span>{pages.length} Pages Queued</span>
                <span className="text-[11px] text-amber-400 font-mono">
                  {pages.length >= 1 ? 'Ready for render' : 'Upload required'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Access & Monetization Model */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black text-[11px] font-black">
                2
              </span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Monetization & Reader Access
              </h4>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">
              Original Creator Receives 70% Share
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Free Ad-Supported */}
            <div
              id="upload-tier-free"
              onClick={() => setAccessType('free')}
              className={`cursor-pointer rounded-2xl border p-4 transition relative ${
                accessType === 'free'
                  ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Free (Ad-Supported)</span>
                  <span className="rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5">
                    MAX REACH
                  </span>
                </div>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Free readers view persistent bottom AdMob banners & rewarded chapter ads. You earn{' '}
                <strong className="text-emerald-300">70% of AdMob ad impressions</strong> settled via
                Google AdMob & Google Play Billing.
              </p>
            </div>

            {/* VIP Fast Pass */}
            <div
              id="upload-tier-premium"
              onClick={() => setAccessType('premium')}
              className={`cursor-pointer rounded-2xl border p-4 transition relative ${
                accessType === 'premium'
                  ? 'border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    VIP Subscriber Early Pass
                  </span>
                  <span className="rounded bg-purple-900 text-purple-200 text-[10px] font-bold px-1.5 py-0.5">
                    FAST PASS
                  </span>
                </div>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exclusive to VIP members and rewarded ad viewers. You earn from the monthly{' '}
                <strong className="text-purple-300">70% VIP subscriber revenue pool</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Manga Page Image Artwork Upload */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black text-[11px] font-black">
                3
              </span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Manga Artwork & Page Files ({pages.length} Pages)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSamplePages}
                className="text-[11px] rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 transition flex items-center gap-1"
                title="Append a sample illustrated manga page"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>+ Sample Page</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-slate-700 bg-slate-950/60 hover:border-amber-500/50 hover:bg-slate-950/90'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Drag and drop manga pages here, or <span className="text-amber-400 underline">Browse Files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG, WEBP • Multiple files uploaded in sequence
                </p>
              </div>
            </div>
          </div>

          {/* Alternate: Paste Image URL */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or paste direct image URL (https://...)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white px-3.5 py-2 transition"
            >
              Add URL
            </button>
          </div>

          {/* Uploaded Pages Grid */}
          {pages.length > 0 ? (
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Page Sequence (Drag or use arrows to reorder)</span>
                <span>{pages.length} Pages Total</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {pages.map((p, idx) => (
                  <div
                    key={`${p.id}-${idx}`}
                    className="group relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md flex flex-col"
                  >
                    {/* Page Thumbnail */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                      <img
                        src={p.imageUrl}
                        alt={`Page ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Number Badge */}
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-sm">
                        P. {idx + 1}
                      </span>

                      {/* Dialog Indicator */}
                      {p.dialogs && p.dialogs.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 rounded-full bg-blue-500 p-1 text-white shadow" title="Has speech bubble">
                          <MessageSquare className="w-2.5 h-2.5" />
                        </span>
                      )}

                      {/* Quick Preview Eye */}
                      <button
                        type="button"
                        onClick={() => setPreviewPageUrl(p.imageUrl)}
                        className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        title="View Full Size"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Page Card Actions */}
                    <div className="p-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                      {/* Left / Right Reorder */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => movePage(idx, 'left')}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pages.length - 1}
                          onClick={() => movePage(idx, 'right')}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Speech Balloon / Dialog Button */}
                      <button
                        type="button"
                        onClick={() => openDialogEditor(p.id)}
                        className={`p-1 rounded transition ${
                          p.dialogs ? 'text-blue-400 bg-blue-950/60' : 'text-slate-400 hover:text-blue-300'
                        }`}
                        title="Add Speech Bubble"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>

                      {/* Delete Page */}
                      <button
                        type="button"
                        onClick={() => removePage(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              No manga pages uploaded yet. Please drop files above or click "+ Sample Page".
            </div>
          )}
        </div>

        {/* Dialog / Speech Balloon Inline Editor Modal */}
        {activeDialogPageId && (
          <div className="rounded-2xl border border-blue-500/40 bg-blue-950/30 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Manga Page Speech Bubble Overlay
              </span>
              <button
                type="button"
                onClick={() => setActiveDialogPageId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Character / Speaker Name
                </label>
                <input
                  type="text"
                  value={dialogSpeaker}
                  onChange={(e) => setDialogSpeaker(e.target.value)}
                  placeholder="e.g. Jin, Narrator, Shadow Lord..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Bubble Position on Page
                </label>
                <select
                  value={dialogPos}
                  onChange={(e) => setDialogPos(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center Panel</option>
                </select>
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={saveDialogToPage}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 transition"
                >
                  Save Speech Bubble
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Spoken Dialogue / Monologue Text
              </label>
              <textarea
                rows={2}
                value={dialogText}
                onChange={(e) => setDialogText(e.target.value)}
                placeholder="Write the manga dialogue line that renders over this page..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Progress Bar during submit */}
        {isSubmitting && (
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Publishing Chapter to KA Plus: Africa Pulse CDN...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 pt-5 gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <SouthAfricaFlameLogo size="xs" variant="sa_flag" />
            <span>
              All uploads immediately sync with 70% rev-share South Africa banking payouts.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-300 transition"
              >
                Cancel
              </button>
            )}

            <button
              id="submit-publish-chapter-btn"
              type="submit"
              disabled={isSubmitting || pages.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black px-6 py-2.5 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Publishing...'
                  : `Publish Chapter ${chapterNumber} (${pages.length} Pages)`}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Lightbox Image Preview Modal */}
      {previewPageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewPageUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2">
            <img
              src={previewPageUrl}
              alt="Page Preview"
              className="max-h-[85vh] w-auto object-contain mx-auto rounded-xl"
            />
            <button
              onClick={() => setPreviewPageUrl(null)}
              className="absolute top-4 right-4 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
