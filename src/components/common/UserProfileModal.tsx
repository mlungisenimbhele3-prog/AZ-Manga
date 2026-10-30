import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Award,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Share2,
  User,
  Heart,
  Smartphone,
  Info,
  Coins,
  Target,
  Gift,
  Star,
  Medal,
  Lock,
  Play,
  Bookmark,
  Sun,
  Moon,
  Type,
  ArrowRight,
  LogOut,
  UserCheck,
  UserPlus,
  Palette,
  Volume2,
  Sliders,
  Check,
  Compass,
} from 'lucide-react';
import {
  ReadingStreakData,
  getReadingStreak,
  getWeeklyStreakDays,
  getStreakMotivation,
  calculateDailyStreakBonus,
  addUserCoins,
} from '../../utils/readingStreak';
import { UserSubscription, Manga } from '../../types';
import {
  isUserApprovedMangaka,
  getMangakaApplicationByEmail,
} from '../../utils/mangakaManager';
import {
  UserProfile,
  getCurrentUserProfile,
  saveLocalProfile,
  updateReadingPreferences,
  toggleMangaBookmark,
  signInWithGoogleCreator,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  updateUserBioAndAvatar,
  toggleFollowUser,
  ReadingPreferences,
} from '../../services/userProfile';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  userSubscription: UserSubscription;
  mangas?: Manga[];
  onUpgradeClick?: () => void;
  onStartReading?: (manga?: Manga, chapterId?: string) => void;
  onOpenApplyMangaka?: () => void;
  onOpenMangakaDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  onSwitchUserEmail?: (email: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  userSubscription,
  mangas = [],
  onUpgradeClick,
  onStartReading,
  onOpenApplyMangaka,
  onOpenMangakaDashboard,
  onOpenAdminDashboard,
  onSwitchUserEmail,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUserProfile());
  const [streakData, setStreakData] = useState<ReadingStreakData>(() => getReadingStreak());
  const [activeTab, setActiveTab] = useState<'profile' | 'progress' | 'bookmarks' | 'preferences' | 'streak'>('profile');
  const [justLoggedToast, setJustLoggedToast] = useState<string | null>(null);

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authIsCreator, setAuthIsCreator] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Edit profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.displayName);
  const [editBio, setEditBio] = useState(profile.bio);

  const isApprovedMangaka = isUserApprovedMangaka(profile.email);
  const mangakaApp = getMangakaApplicationByEmail(profile.email);
  const ADMIN_EMAILS = ['mlungisenimbhele3@gmail.com', 'azoververse@gmail.com'];
  const isAdmin = ADMIN_EMAILS.includes(profile.email.toLowerCase()) || profile.role === 'admin';

  // Sync profile when opened or event fired
  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUserProfile();
      setProfile(current);
      setEditName(current.displayName);
      setEditBio(current.bio);
      setStreakData(getReadingStreak());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.profile) {
        setProfile(e.detail.profile);
      }
    };
    window.addEventListener('az_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('az_profile_updated', handleProfileUpdate);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!authEmail.trim() || !authPassword.trim()) {
          setAuthError('Please fill in email and password.');
          setAuthLoading(false);
          return;
        }
        const res = await registerWithEmail(authEmail, authPassword, authDisplayName, authIsCreator);
        if (res.success && res.user) {
          setProfile(res.user);
          onSwitchUserEmail?.(res.user.email);
          setJustLoggedToast(`Welcome to AZ OVERVERSE, ${res.user.displayName}! 🎉`);
          setTimeout(() => setJustLoggedToast(null), 3500);
        } else {
          setAuthError(res.error || 'Failed to create account.');
        }
      } else {
        const res = await loginWithEmail(authEmail, authPassword);
        if (res.success && res.user) {
          setProfile(res.user);
          onSwitchUserEmail?.(res.user.email);
          setJustLoggedToast(`Welcome back, ${res.user.displayName}!`);
          setTimeout(() => setJustLoggedToast(null), 3500);
        } else {
          setAuthError(res.error || 'Sign in failed. Check your credentials.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignInDirect = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await signInWithGoogleCreator();
      if (res.success && res.profile) {
        setProfile(res.profile);
        onSwitchUserEmail?.(res.profile.email);
        setJustLoggedToast(`Signed in as ${res.profile.displayName}!`);
        setTimeout(() => setJustLoggedToast(null), 3500);
      } else {
        setAuthError(res.error || 'Google Sign-In cancelled or failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    const updated = getCurrentUserProfile();
    setProfile(updated);
    onSwitchUserEmail?.(updated.email);
    setJustLoggedToast('Logged out. You are currently in Guest Reader mode.');
    setTimeout(() => setJustLoggedToast(null), 3000);
  };

  const handleSaveProfileEdits = async () => {
    const updated = await updateUserBioAndAvatar(editName, editBio);
    setProfile(updated);
    setIsEditingProfile(false);
    setJustLoggedToast('Profile updated successfully!');
    setTimeout(() => setJustLoggedToast(null), 2500);
  };

  const handlePreferenceChange = async (prefs: Partial<ReadingPreferences>) => {
    const updated = await updateReadingPreferences(prefs);
    setProfile((prev) => ({ ...prev, preferences: updated }));
    setJustLoggedToast('Reading preferences saved!');
    setTimeout(() => setJustLoggedToast(null), 1800);
  };

  // Find bookmarked mangas
  const bookmarkedMangas = mangas.filter((m) => profile.bookmarks.includes(m.id));
  const readingProgressList = Object.values(profile.readingProgress || {});

  return (
    <div
      id="user-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="user-profile-modal"
        className="relative my-2 sm:my-6 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden"
      >
        {/* Toast Notification */}
        {justLoggedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-amber-500 text-black px-4 py-2 font-bold text-xs shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{justLoggedToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="relative border-b border-slate-800 bg-gradient-to-r from-amber-950/70 via-slate-900 to-purple-950/60 p-5 sm:p-6 shrink-0">
          <button
            id="profile-modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="h-16 w-16 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md"
                />
                {isAdmin ? (
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 text-black p-1 text-[9px] font-black shadow" title="Executive Producer Admin">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                ) : profile.isCreator ? (
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-purple-500 text-white p-1 text-[9px] font-black shadow" title="Creator Verified">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                ) : null}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    <span>{profile.displayName}</span>
                    {isAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Admin / Producer
                      </span>
                    )}
                    {profile.isCreator && !isAdmin && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        Mangaka Creator
                      </span>
                    )}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{streakData.currentStreak} Day Streak</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{profile.coins} Coins</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">
                    <strong className="text-white">{profile.bookmarks.length}</strong> Bookmarks
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase tracking-wider text-[11px] font-black text-amber-400">
                  {userSubscription.tier.toUpperCase()} MEMBER
                </span>
              </span>
              {userSubscription.tier === 'free' && onUpgradeClick && (
                <button
                  onClick={() => {
                    onClose();
                    onUpgradeClick();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs hover:brightness-110 transition shadow flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Upgrade</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile & Account</span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'progress'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading Progress ({readingProgressList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'bookmarks'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks ({profile.bookmarks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'preferences'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Reading Preferences</span>
            </button>

            <button
              onClick={() => setActiveTab('streak')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'streak'
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Streak & Awards</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: PROFILE & ACCOUNT */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Details & Bio */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Reader Bio & Creator Info</span>
                  </h3>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs text-amber-400 hover:text-white font-bold transition"
                    >
                      Edit Bio
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="text-xs text-slate-400 hover:text-white font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfileEdits}
                        className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold hover:brightness-110"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Bio / Status</label>
                      <textarea
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        placeholder="Tell the community about yourself or your favorite manga genres..."
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{profile.bio || 'Passionate African manga reader & creator on AZ OVERVERSE.'}"
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Role</span>
                        <span className="text-xs font-bold text-white capitalize">{profile.role}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Followers</span>
                        <span className="text-xs font-bold text-amber-400">{profile.followersCount.toLocaleString()}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Following</span>
                        <span className="text-xs font-bold text-white">{profile.followingCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Member Since</span>
                        <span className="text-xs font-bold text-slate-300">
                          {new Date(profile.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Registration & Switcher */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Account Credentials & Cloud Sync</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Register or switch account to synchronize your reading progress, bookmarks, and preferences across devices.
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="profile-google-signin-btn"
                  disabled={authLoading}
                  onClick={handleGoogleSignInDirect}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-black text-xs transition shadow flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{authLoading ? 'Signing in with Google...' : 'Sign In with Google'}</span>
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      authMode === 'login'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In to Existing Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      authMode === 'register'
                        ? 'bg-amber-500 text-black font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create New Account (+100 Coins)
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authMode === 'register' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name / Pen Name</label>
                      <input
                        type="text"
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        placeholder="e.g. Sipho Dlamini"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="reader@azoververse.com"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Password</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {authMode === 'register' && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={authIsCreator}
                        onChange={(e) => setAuthIsCreator(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs text-slate-300 font-medium">
                        I am a Manga Creator / Artist (enable Mangaka Publisher tools)
                      </span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-xs hover:brightness-110 transition shadow flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>{authMode === 'register' ? 'Complete Registration' : 'Sign In Now'}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Creator & Admin Portal Shortcut */}
              <div className="flex flex-wrap gap-3 pt-2">
                {isApprovedMangaka && onOpenMangakaDashboard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMangakaDashboard();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 transition shadow flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open Mangaka Dashboard (Upload Chapters & View Stats)</span>
                  </button>
                )}

                {isAdmin && onOpenAdminDashboard && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdminDashboard();
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-slate-700 transition flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Producer Panel</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: READING PROGRESS */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Your Reading History & Progress</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chapters and pages saved automatically as you read. Click to pick up where you left off.
                  </p>
                </div>
              </div>

              {readingProgressList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl p-6 bg-slate-950/40">
                  <Compass className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">No Reading History Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Start reading any original African manga on AZ OVERVERSE to track your chapters, pages, and reading streaks!
                  </p>
                  {onStartReading && mangas[0] && (
                    <button
                      onClick={() => {
                        onClose();
                        onStartReading(mangas[0]);
                      }}
                      className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:brightness-110"
                    >
                      Start Reading "{mangas[0].title}"
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {readingProgressList.map((item) => {
                    const matchedManga = mangas.find((m) => m.id === item.mangaId);
                    return (
                      <div
                        key={`prog-${item.mangaId}`}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex gap-3.5 hover:border-amber-500/50 transition group"
                      >
                        <img
                          src={item.mangaCover || matchedManga?.coverImage}
                          alt={item.mangaTitle}
                          className="w-16 h-22 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition">
                              {item.mangaTitle}
                            </h4>
                            <p className="text-[11px] text-amber-300/90 font-medium mt-0.5 truncate">
                              Chapter {item.chapterNumber}: {item.chapterTitle}
                            </p>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Page {item.pageNumber} of {item.totalPages} ({item.progressPercent}%)
                            </span>
                          </div>

                          <div className="space-y-1.5 mt-2">
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(5, item.progressPercent))}%` }}
                              />
                            </div>

                            <button
                              onClick={() => {
                                onClose();
                                if (matchedManga && onStartReading) {
                                  onStartReading(matchedManga, item.chapterId);
                                }
                              }}
                              className="w-full py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[11px] transition flex items-center justify-center gap-1.5"
                            >
                              <span>Continue Reading</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>Favorite Bookmarked Series</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Your personal library shelf for quick access to followed series.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {bookmarkedMangas.length} Series Saved
                </span>
              </div>

              {bookmarkedMangas.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl p-6 bg-slate-950/40">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">No Bookmarks Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Click the bookmark ribbon on any manga card or in the reader to save series into your favorites shelf.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bookmarkedMangas.map((m) => (
                    <div
                      key={`bookmark-${m.id}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex gap-3 hover:border-slate-700 transition"
                    >
                      <img
                        src={m.coverImage}
                        alt={m.title}
                        className="w-16 h-22 rounded-xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                          <span className="text-[10px] text-slate-400 block">{m.author}</span>
                          <span className="text-[10px] text-amber-400/90 font-medium block mt-0.5">
                            ★ {m.rating} • {m.chapters.length} Chaps
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2">
                          <button
                            onClick={() => {
                              onClose();
                              onStartReading?.(m, m.chapters[0]?.id);
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition"
                          >
                            Read
                          </button>
                          <button
                            onClick={() => toggleMangaBookmark(m.id)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 text-[10px] transition"
                            title="Remove bookmark"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: READING PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Reader Customization & Display Settings</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Settings are instantly applied to the reader and saved to your profile.
                </p>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Theme & Color Palette</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Slate', desc: 'Default contrast', bg: 'bg-slate-950 text-white' },
                    { id: 'amoled', label: 'AMOLED Black', desc: 'Zero battery drain', bg: 'bg-black text-white' },
                    { id: 'sepia', label: 'Warm Sepia', desc: 'Eye soothing paper', bg: 'bg-[#f4ecd8] text-[#5c4033]' },
                    { id: 'light', label: 'Daylight', desc: 'Clean bright', bg: 'bg-white text-slate-900' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handlePreferenceChange({ theme: t.id as any })}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        profile.preferences.theme === t.id
                          ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{t.label}</span>
                        {profile.preferences.theme === t.id && (
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Size Setting */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>Overlay Text & Subtitle Size</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'small', label: 'Small (12px)', scale: 'text-xs' },
                    { id: 'medium', label: 'Medium (14px)', scale: 'text-sm' },
                    { id: 'large', label: 'Large (16px)', scale: 'text-base' },
                    { id: 'xlarge', label: 'Extra Large (18px)', scale: 'text-lg' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handlePreferenceChange({ textSize: s.id as any })}
                      className={`p-3 rounded-2xl border text-center transition ${
                        profile.preferences.textSize === s.id
                          ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`font-bold block ${s.scale}`}>Aa</span>
                      <span className="text-[10px] text-slate-400 block mt-1">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Direction */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reading Direction</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'horizontal_ltr', label: 'Left-to-Right (LTR)', desc: 'Standard LTR Manga' },
                    { id: 'vertical', label: 'Vertical Scroll', desc: 'Webtoon continuous' },
                    { id: 'single', label: 'Single Page LTR', desc: 'Tap right or arrow keys' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        handlePreferenceChange({ readingDirection: d.id as any });
                        try {
                          localStorage.setItem(
                            'az_reader_mode',
                            d.id === 'vertical' ? 'vertical' : 'horizontal_ltr'
                          );
                        } catch (e) {}
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                        profile.preferences.readingDirection === d.id
                          ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{d.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{d.desc}</span>
                      </div>
                      {profile.preferences.readingDirection === d.id && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles (Sound, Haptics, Auto-Scroll) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Page Turn Sound Effects</span>
                      <span className="text-[10px] text-slate-400">Tactile paper flip audio</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.preferences.soundEffects}
                    onChange={(e) => handlePreferenceChange({ soundEffects: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Haptic Vibration Feedback</span>
                      <span className="text-[10px] text-slate-400">Mobile device haptics</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.preferences.hapticFeedback}
                    onChange={(e) => handlePreferenceChange({ hapticFeedback: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: DAILY STREAK & AWARDS */}
          {activeTab === 'streak' && (
            <div className="space-y-6">
              {/* Daily Streak Highlight */}
              <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/50 via-slate-900 to-purple-950/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/50">
                    <Flame className="w-10 h-10 fill-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      Active Reading Streak
                    </span>
                    <h3 className="text-3xl font-black text-white font-mono">
                      {streakData.currentStreak} <span className="text-sm font-bold text-slate-300">Days</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-sm">
                      {getStreakMotivation(streakData).description}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-center sm:items-end gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Longest Streak
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {streakData.longestStreak} Days
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    🛡️ {streakData.streakFreezeAvailable} Freezes available
                  </span>
                </div>
              </div>

              {/* Weekly Streak Tracker */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Weekly Consistency</span>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {getWeeklyStreakDays(streakData).map((d) => (
                    <div
                      key={d.date}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 ${
                        d.completed
                          ? 'border-amber-500/60 bg-amber-500/15 text-white font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-500'
                      }`}
                    >
                      <span>{d.dayShort}</span>
                      {d.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>AZ OVERVERSE • Produced by Mlungiseni Mbhele</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
