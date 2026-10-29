import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserPlus,
  LogIn,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  LogOut,
  UploadCloud,
} from 'lucide-react';
import {
  CreatorAuthState,
  signInWithGoogleCreator,
  createCreatorAccount,
  signOutCreatorAccount,
} from '../../services/userProfile';
import { APP_LOGO_SRC } from '../common/KAAfricaLogo';

interface CreatorAccountGateProps {
  authState: CreatorAuthState;
  onBackToReader: () => void;
}

const AVAILABLE_GENRES = [
  'Action',
  'Fantasy',
  'Sci-Fi',
  'Mythology',
  'Drama',
  'Thriller',
  'Historical',
  'Afro-Futurism',
];

export const CreatorAccountGate: React.FC<CreatorAccountGateProps> = ({
  authState,
  onBackToReader,
}) => {
  const isGoogleConnectedWithoutCreator = Boolean(
    authState.firebaseUser && !authState.hasCreatorAccount
  );

  const [mode, setMode] = useState<'create' | 'signin'>(
    isGoogleConnectedWithoutCreator ? 'create' : 'create'
  );
  const [penName, setPenName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Action', 'Fantasy']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authState.firebaseUser && !authState.hasCreatorAccount) {
      setMode('create');
      if (!penName && authState.firebaseUser.displayName) {
        setPenName(authState.firebaseUser.displayName.slice(0, 80));
      }
      if (!studioName && authState.firebaseUser.displayName) {
        const firstWord = authState.firebaseUser.displayName.split(' ')[0] || 'Oververse';
        setStudioName(`${firstWord} Studio`.slice(0, 80));
      }
    }
  }, [authState.firebaseUser, authState.hasCreatorAccount]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.length > 1 ? prev.filter((g) => g !== genre) : prev;
      }
      if (prev.length >= 6) return prev;
      return [...prev, genre];
    });
  };

  const handleSignInExistingCreator = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsSubmitting(true);

    try {
      const res = await signInWithGoogleCreator();
      if (!res.success) {
        setErrorMsg(res.error || 'Could not sign in to Creator Account.');
        return;
      }

      if (!res.hasCreatorAccount) {
        setMode('create');
        if (res.profile?.displayName && !penName) {
          setPenName(res.profile.displayName.slice(0, 80));
        }
        if (res.profile?.displayName && !studioName) {
          const base = res.profile.displayName.split(' ')[0] || 'Oververse';
          setStudioName(`${base} Studio`.slice(0, 80));
        }
        setInfoMsg(
          'Google account verified. No Creator Account was found for this email yet—complete the Studio details below to create your Creator Account.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (penName.trim().length < 2) {
      setErrorMsg('Enter a Creator Pen Name (at least 2 characters).');
      return;
    }
    if (studioName.trim().length < 2) {
      setErrorMsg('Enter a Studio or Imprint Name (at least 2 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCreatorAccount({
        penName: penName.trim(),
        studioName: studioName.trim(),
        bio: bio.trim(),
        primaryGenres: selectedGenres,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Could not create Creator Account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchGoogleAccount = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    await signOutCreatorAccount();
  };

  return (
    <section
      id="creator-studio-account-gate"
      aria-labelledby="creator-gate-heading"
      className="mx-auto w-full max-w-4xl py-4 sm:py-8"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToReader}
          className="min-h-[44px] inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reader</span>
        </button>

        <span className="text-xs text-slate-400">
          OVERVERSE Publishing · Studio Access Control
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Editorial Studio Context */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO_SRC}
                alt="AZ OVERVERSE Logo"
                className="h-12 w-12 rounded-full bg-black object-contain shadow-lg shrink-0"
              />
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              <h1
                id="creator-gate-heading"
                className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white leading-tight [text-wrap:balance]"
              >
                Creator Account Required to Open Studio
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                To access the OVERVERSE Publishing Studio, upload manga chapters, or manage royalty settlements, you must sign in with an existing Creator Account or create one.
              </p>
            </div>

            <div className="border-t border-slate-800/80 pt-5 space-y-4 text-xs text-slate-300">
              <div>
                <h2 className="font-semibold text-white text-sm mb-1">
                  01. Verified Creator Identity
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Your Pen Name and Studio Imprint are linked to your authenticated account so only you can publish chapters to your series.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-white text-sm mb-1">
                  02. Chapter &amp; Series Publishing
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Upload original series, schedule chapter drops, and manage reader access tiers directly inside Studio.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-white text-sm mb-1">
                  03. Private Royalty Ledger
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Track your personal series reads and Google Play / AdMob royalty settlements privately.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sign-In / Create Creator Account Panel */}
          <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-10 space-y-6">
            {/* Functional Mode Switcher */}
            <div
              role="tablist"
              aria-label="Creator Studio authentication mode"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800"
            >
              <button
                type="button"
                role="tab"
                id="tab-create-creator-account"
                aria-selected={mode === 'create'}
                onClick={() => {
                  setMode('create');
                  setErrorMsg(null);
                }}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  mode === 'create'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Create Creator Account</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-signin-creator-account"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Sign In to Creator Account</span>
              </button>
            </div>

            {/* Connected Google Account Notice (if signed in as Reader, awaiting Creator completion) */}
            {isGoogleConnectedWithoutCreator && authState.firebaseUser && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-slate-400 block">Connected Google Account</span>
                  <span className="font-semibold text-white truncate block">
                    {authState.firebaseUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchGoogleAccount}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-medium transition shrink-0 inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch</span>
                </button>
              </div>
            )}

            {infoMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-950/30 p-3.5 flex items-start gap-2.5 text-xs text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreateCreatorSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="creator-pen-name"
                      className="block text-xs font-semibold text-slate-200 mb-1.5"
                    >
                      Creator Pen Name
                    </label>
                    <input
                      id="creator-pen-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      placeholder="e.g. Nandi Dlamini"
                      className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="creator-studio-name"
                      className="block text-xs font-semibold text-slate-200 mb-1.5"
                    >
                      Studio or Imprint Name
                    </label>
                    <input
                      id="creator-studio-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. Mapungubwe Ink Studio"
                      className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-200 mb-2">
                    Primary Genres (select up to 6)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GENRES.map((genre) => {
                      const active = selectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                            active
                              ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="creator-bio"
                      className="text-xs font-semibold text-slate-200"
                    >
                      Creator Bio (optional)
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {bio.length}/500
                    </span>
                  </div>
                  <textarea
                    id="creator-bio"
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell readers about your manga series, visual style, or publishing schedule..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none transition resize-none"
                  />
                </div>

                <button
                  id="submit-create-creator-account-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting
                      ? 'Setting Up Creator Account...'
                      : isGoogleConnectedWithoutCreator
                      ? 'Complete Creator Account & Open Studio'
                      : 'Continue with Google & Create Creator Account'}
                  </span>
                </button>
              </form>
            ) : (
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-white">
                    Already have an OVERVERSE Creator Account?
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sign in with the Google account linked to your Creator Studio profile to unlock your dashboard, series uploads, and royalty statements.
                  </p>
                </div>

                <button
                  id="signin-existing-creator-account-btn"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSignInExistingCreator}
                  className="min-h-[48px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold text-sm px-5 py-3 transition flex items-center justify-center gap-2.5 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting ? 'Verifying Creator Account...' : 'Sign In with Google'}
                  </span>
                </button>

                <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>New to publishing on OVERVERSE?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('create');
                      setErrorMsg(null);
                    }}
                    className="min-h-[40px] px-2 font-semibold text-amber-400 hover:text-amber-300 transition"
                  >
                    Create a Creator Account →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
