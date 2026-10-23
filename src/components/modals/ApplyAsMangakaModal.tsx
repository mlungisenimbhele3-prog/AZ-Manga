import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  User,
  Image,
  Globe,
  FileText,
  AlertCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import {
  getMangakaApplicationByEmail,
  submitMangakaApplication,
  isUserApprovedMangaka,
} from '../../utils/mangakaManager';
import { MangakaApplication } from '../../types';

interface ApplyAsMangakaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onOpenMangakaDashboard?: () => void;
}

const SAMPLE_ID_PHOTOS = [
  {
    name: 'National ID Card (Verified)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Passport Document (Verified)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Artist Studio ID (Verified)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  },
];

export const ApplyAsMangakaModal: React.FC<ApplyAsMangakaModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onOpenMangakaDashboard,
}) => {
  const [currentApp, setCurrentApp] = useState<MangakaApplication | null>(null);
  const [legalName, setLegalName] = useState('');
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState(SAMPLE_ID_PHOTOS[0].url);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [country, setCountry] = useState('South Africa');
  const [region, setRegion] = useState('Gauteng / Johannesburg');
  const [primaryGenres, setPrimaryGenres] = useState('Action, Shonen, Afro-Futurism');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state on open or custom event
  useEffect(() => {
    if (isOpen) {
      const app = getMangakaApplicationByEmail(currentUserEmail);
      setCurrentApp(app);
      if (app) {
        setLegalName(app.legalName);
        setPenName(app.penName);
        setBio(app.bio);
        setIdPhotoUrl(app.idPhotoUrl);
        setPortfolioUrl(app.portfolioUrl || '');
        setCountry(app.country);
        setRegion(app.region);
        setPrimaryGenres(app.primaryGenres.join(', '));
      } else {
        // Defaults based on email
        setLegalName(currentUserEmail.split('@')[0].replace('.', ' ').toUpperCase());
        setPenName(`${currentUserEmail.split('@')[0]}-Sensei`);
        setBio('Aspiring African manga author passionate about high-octane storytelling.');
      }
    }
  }, [isOpen, currentUserEmail]);

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentApp(getMangakaApplicationByEmail(currentUserEmail));
    };
    window.addEventListener('ka_pulse_mangaka_updated', handleUpdate);
    return () => window.removeEventListener('ka_pulse_mangaka_updated', handleUpdate);
  }, [currentUserEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim() || !penName.trim() || !bio.trim()) {
      setToastMessage('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const created = submitMangakaApplication({
        userEmail: currentUserEmail,
        legalName: legalName.trim(),
        penName: penName.trim(),
        bio: bio.trim(),
        idPhotoUrl,
        portfolioUrl: portfolioUrl.trim(),
        country,
        region,
        primaryGenres: primaryGenres.split(',').map((g) => g.trim()).filter(Boolean),
      });

      setCurrentApp(created);
      setIsSubmitting(false);
      setToastMessage('Application submitted to Admin (Mlungiseni Mbhele) for review!');
    }, 400);
  };

  const isApproved = currentApp?.status === 'approved' || isUserApprovedMangaka(currentUserEmail);
  const isPending = currentApp?.status === 'pending';
  const isRejected = currentApp?.status === 'rejected';

  return (
    <div
      id="apply-as-mangaka-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Apply as Mangaka"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-slate-950 p-5 sm:p-7 text-white shadow-2xl z-10 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <UploadCloud className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Apply as Mangaka
                </h3>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5">
                  CREATOR PASS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Create original African manga, publish chapters & earn 70% revenue share.
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

        {/* Toast */}
        {toastMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-amber-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Existing Application Status Callout */}
        {isApproved ? (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border border-emerald-500/50 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">
                  You are an Approved Mangaka! 🎉
                </h4>
                <p className="text-xs text-emerald-300">
                  Approved by Executive Producer Mlungiseni Mbhele. You have full publishing rights!
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              You can now access your **Mangaka Dashboard** to upload original series, release new chapters, and track real-time ZAR earnings.
            </p>

            <div className="flex items-center gap-2 pt-2">
              {onOpenMangakaDashboard && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMangakaDashboard();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-black text-xs transition shadow flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open Mangaka Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : isPending ? (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/50 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-300">
                  Application Under Review
                </h4>
                <p className="text-xs text-slate-300">
                  Submitted on {new Date(currentApp!.submittedAt).toLocaleDateString()}. Admin (Mlungiseni Mbhele) is verifying your creator identity.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pl-9">
              Tip: The Admin Dashboard can approve your application instantly from the Admin Role switcher in the top navigation bar.
            </p>
          </div>
        ) : isRejected ? (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/50 border border-rose-500/50 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-rose-300">
                  Application Needs Revision
                </h4>
                <p className="text-xs text-slate-300">
                  {currentApp?.adminNotes || 'Please provide updated art samples or higher resolution ID photo.'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 pl-9">
              Update your details below and re-submit for review.
            </p>
          </div>
        ) : null}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Zola Dlamini"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Artist / Pen Name *
              </label>
              <input
                type="text"
                required
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="e.g. Zola-Sensei / InkWarrior"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Mangaka Bio & Art Background *
            </label>
            <textarea
              required
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your art style, drawing background, experience with digital drawing tools, and what African stories you want to tell..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* ID Photo Verification */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              ID Document / Creator Photo Verification *
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select or provide a verified government ID or creator verification photo for POPIA & copyright compliance.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {SAMPLE_ID_PHOTOS.map((sample, idx) => (
                <button
                  type="button"
                  key={`id-photo-${sample.name}-${idx}`}
                  onClick={() => setIdPhotoUrl(sample.url)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col items-center gap-1.5 ${
                    idPhotoUrl === sample.url
                      ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                  />
                  <span className="text-[10px] text-center font-bold text-slate-300 leading-tight">
                    {sample.name}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={idPhotoUrl}
              onChange={(e) => setIdPhotoUrl(e.target.value)}
              placeholder="Or enter custom ID Photo URL..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Country & Region *
              </label>
              <input
                type="text"
                required
                value={`${country} • ${region}`}
                onChange={(e) => {
                  const parts = e.target.value.split('•');
                  setCountry(parts[0]?.trim() || 'South Africa');
                  setRegion(parts[1]?.trim() || 'KwaZulu-Natal');
                }}
                placeholder="Country • Province / City"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Portfolio / Art Link (Optional)
              </label>
              <input
                type="text"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://artstation.com/... or Instagram"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Primary Genres
            </label>
            <input
              type="text"
              value={primaryGenres}
              onChange={(e) => setPrimaryGenres(e.target.value)}
              placeholder="e.g. Action, Fantasy, Sci-Fi, Afro-Futurism"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Submission CTA */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Reviewed by Executive Producer Mlungiseni Mbhele</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:opacity-95 text-black font-black text-xs transition shadow-md disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Submitting...'
                  : isApproved
                  ? 'Update Creator Profile'
                  : 'Submit Application for Review'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
