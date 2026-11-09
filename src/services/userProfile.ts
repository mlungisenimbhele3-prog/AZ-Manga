// User Profile, Creator Studio Account Gate, Reading Progress & Bookmarks Engine
// Powered 100% by AZ OVERVERSE Custom Auth (PostgreSQL + JWT + bcrypt + Resend) — Zero Firebase / Supabase Auth
import { safeStorage } from '../utils/safeStorage';
import {
  getMangakaApplications,
  saveMangakaApplications,
} from '../utils/mangakaManager';
import {
  OververseAuthUser,
  getOververseAuthSnapshot,
  subscribeToOververseAuth,
  registerOververseUser,
  loginOververseUser,
  verifyOververseLoginTwoFactor,
  patchOververseCreatorProfile,
  logoutOververseSession,
} from './oververseAuth';

export interface ReadingProgressItem {
  mangaId: string;
  mangaTitle: string;
  mangaCover: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  pageNumber: number;
  totalPages: number;
  progressPercent: number;
  updatedAt: string;
  completed?: boolean;
  durationSeconds?: number;
}

export interface ReadingPreferences {
  theme: 'dark' | 'light' | 'amoled' | 'sepia';
  textSize: 'small' | 'medium' | 'large' | 'xlarge';
  readingDirection: 'horizontal_ltr' | 'vertical' | 'single';
  autoScroll: boolean;
  autoScrollSpeed: number; // 1 to 5
  soundEffects: boolean;
  hapticFeedback: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  backupEmail?: string | null;
  phone?: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isCreator: boolean;
  penName?: string;
  studioName?: string;
  primaryGenres?: string[];
  role: 'reader' | 'creator' | 'admin';
  creatorStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  blockedUsers?: string[];
  createdAt: string;
  lastLoginAt: string;
  bookmarks: string[];
  readingProgress: Record<string, ReadingProgressItem>;
  preferences: ReadingPreferences;
  following: string[];
  followersCount: number;
  followingCount: number;
  streakDays: number;
  coins: number;
}

export interface CreatorAuthState {
  authReady: boolean;
  authUser: OververseAuthUser | null;
  profile: UserProfile;
  hasCreatorAccount: boolean;
}

export interface CreateCreatorAccountInput {
  penName: string;
  studioName: string;
  bio: string;
  primaryGenres: string[];
}

const STORAGE_KEY_PROFILE = 'ka_pulse_user_profile_v2';
const STORAGE_KEY_CREATOR_DRAFT = 'az_oververse_creator_form_draft';

export const DEFAULT_CREATOR_PEN_NAME = 'Mlungiseni';
export const DEFAULT_CREATOR_STUDIO_NAME = 'Mlungiseni NM Studio';

export const DEFAULT_PREFERENCES: ReadingPreferences = {
  theme: 'dark',
  textSize: 'medium',
  readingDirection: 'horizontal_ltr',
  autoScroll: false,
  autoScrollSpeed: 2,
  soundEffects: true,
  hapticFeedback: true,
};

export const ADMIN_EMAILS = ['mlungisenimbhele3@gmail.com'];

export function getCreatorFormDraft(): CreateCreatorAccountInput {
  const saved = safeStorage.getJSON<Partial<CreateCreatorAccountInput> | null>(
    STORAGE_KEY_CREATOR_DRAFT,
    null
  );
  return {
    penName:
      typeof saved?.penName === 'string' && saved.penName.trim().length > 0
        ? saved.penName
        : DEFAULT_CREATOR_PEN_NAME,
    studioName:
      typeof saved?.studioName === 'string' && saved.studioName.trim().length > 0
        ? saved.studioName
        : DEFAULT_CREATOR_STUDIO_NAME,
    bio: typeof saved?.bio === 'string' ? saved.bio : '',
    primaryGenres:
      Array.isArray(saved?.primaryGenres) && saved.primaryGenres.length > 0
        ? saved.primaryGenres
        : ['Action', 'Fantasy'],
  };
}

export function saveCreatorFormDraft(draft: Partial<CreateCreatorAccountInput>): void {
  const current = getCreatorFormDraft();
  safeStorage.setJSON(STORAGE_KEY_CREATOR_DRAFT, {
    ...current,
    ...draft,
  });
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'u-guest-reader',
  email: 'reader@azoververse.com',
  displayName: 'Guest Reader',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Manga reader on AZ OVERVERSE.',
  isCreator: false,
  penName: undefined,
  studioName: undefined,
  primaryGenres: [],
  role: 'reader',
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  bookmarks: ['manga-1', 'manga-3'],
  readingProgress: {
    'manga-1': {
      mangaId: 'manga-1',
      mangaTitle: 'The Lost Kingdom of Mapungubwe',
      mangaCover:
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      chapterId: 'chap-1-1',
      chapterNumber: 1,
      chapterTitle: 'The Golden Rhino Awakens',
      pageNumber: 3,
      totalPages: 8,
      progressPercent: 37,
      updatedAt: new Date().toISOString(),
      completed: false,
    },
  },
  preferences: DEFAULT_PREFERENCES,
  following: ['c-1', 'c-2'],
  followersCount: 0,
  followingCount: 2,
  streakDays: 7,
  coins: 0,
};

function sanitizeBoundedString(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function normalizeReadingDirection(dir?: string): ReadingPreferences['readingDirection'] {
  if (dir === 'vertical' || dir === 'single' || dir === 'horizontal_ltr') {
    return dir;
  }
  return 'horizontal_ltr';
}

function isGuestUid(uid?: string): boolean {
  if (!uid) return true;
  return uid.startsWith('u-guest') || uid.startsWith('u-local');
}

function loadLocalProfile(): UserProfile {
  const cached = safeStorage.getJSON<UserProfile | null>(STORAGE_KEY_PROFILE, null);
  if (cached && cached.uid) {
    const mergedPrefs: ReadingPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(cached.preferences || {}),
      readingDirection: normalizeReadingDirection((cached.preferences as any)?.readingDirection),
    };
    const guest = isGuestUid(cached.uid);
    return {
      ...DEFAULT_USER_PROFILE,
      ...cached,
      isCreator: guest ? false : Boolean(cached.isCreator && cached.penName?.trim()),
      penName: guest ? undefined : cached.penName,
      studioName: guest ? undefined : cached.studioName,
      role: guest ? 'reader' : cached.role || 'reader',
      preferences: mergedPrefs,
      bookmarks: Array.isArray(cached.bookmarks)
        ? cached.bookmarks
        : DEFAULT_USER_PROFILE.bookmarks,
      readingProgress: cached.readingProgress || {},
      following: Array.isArray(cached.following) ? cached.following : ['c-1', 'c-2'],
    };
  }
  return { ...DEFAULT_USER_PROFILE };
}

let activeProfile: UserProfile = loadLocalProfile();
let activeAuthUser: OververseAuthUser | null = getOververseAuthSnapshot().user;
let isAuthReady = getOververseAuthSnapshot().ready;

type CreatorAuthListener = (state: CreatorAuthState) => void;
const creatorAuthListeners = new Set<CreatorAuthListener>();

function computeHasCreatorAccount(
  authUser: OververseAuthUser | null,
  profile: UserProfile
): boolean {
  if (!authUser || !authUser.email_verified) return false;
  if (isGuestUid(profile.uid) || profile.uid !== authUser.id) return false;
  return Boolean(profile.isCreator && profile.penName && profile.penName.trim().length >= 2);
}

export function getCreatorAuthState(): CreatorAuthState {
  return {
    authReady: isAuthReady,
    authUser: activeAuthUser,
    profile: activeProfile,
    hasCreatorAccount: computeHasCreatorAccount(activeAuthUser, activeProfile),
  };
}

function notifyCreatorAuthListeners() {
  const snapshot = getCreatorAuthState();
  creatorAuthListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (err) {
      console.error('[CreatorAuth] Listener error:', err);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('az_creator_auth_changed', { detail: snapshot }));
  }
}

export function subscribeToCreatorAuth(listener: CreatorAuthListener): () => void {
  creatorAuthListeners.add(listener);
  listener(getCreatorAuthState());
  return () => {
    creatorAuthListeners.delete(listener);
  };
}

function ensureCreatorApprovedInMangakaDirectory(profile: UserProfile) {
  if (!profile.email || !profile.isCreator || !profile.penName) return;
  const apps = getMangakaApplications();
  const existingIdx = apps.findIndex(
    (a) => a.userEmail.toLowerCase() === profile.email.toLowerCase()
  );
  const record = {
    id: existingIdx >= 0 ? apps[existingIdx].id : `app-creator-${profile.uid.slice(0, 12)}`,
    userEmail: profile.email,
    legalName: profile.displayName || profile.penName,
    penName: profile.penName,
    bio: profile.bio || `Verified Creator at ${profile.studioName || DEFAULT_CREATOR_STUDIO_NAME}.`,
    idPhotoUrl: profile.avatarUrl || DEFAULT_USER_PROFILE.avatarUrl,
    portfolioUrl: 'https://az-oververse.ai.studio',
    country: 'South Africa',
    region: profile.studioName || DEFAULT_CREATOR_STUDIO_NAME,
    primaryGenres:
      profile.primaryGenres && profile.primaryGenres.length > 0
        ? profile.primaryGenres
        : ['Action', 'Fantasy'],
    submittedAt: existingIdx >= 0 ? apps[existingIdx].submittedAt : new Date().toISOString(),
    status: 'approved' as const,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'OVERVERSE Custom Auth',
    adminNotes: 'Verified PostgreSQL Creator Account',
  };

  if (existingIdx >= 0) {
    const next = [...apps];
    next[existingIdx] = record;
    saveMangakaApplications(next);
  } else {
    saveMangakaApplications([record, ...apps]);
  }
}

function mapOververseUserToProfile(user: OververseAuthUser): UserProfile {
  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.role === 'admin';
  const isCreator =
    user.role === 'creator' ||
    user.role === 'admin' ||
    Boolean(user.pen_name && user.pen_name.trim().length >= 2);
  const draft = getCreatorFormDraft();

  return {
    ...activeProfile,
    uid: user.id,
    email: user.email,
    backupEmail: user.backup_email !== undefined ? user.backup_email : activeProfile.backupEmail ?? null,
    displayName: user.pen_name || user.email.split('@')[0] || 'OVERVERSE Creator',
    avatarUrl: user.avatar_url || activeProfile.avatarUrl || DEFAULT_USER_PROFILE.avatarUrl,
    bio: user.bio || `Creator at ${user.studio_name || DEFAULT_CREATOR_STUDIO_NAME}.`,
    isCreator,
    penName: user.pen_name,
    studioName: user.studio_name || draft.studioName || `${user.pen_name} Studio`,
    primaryGenres: draft.primaryGenres || ['Action', 'Fantasy'],
    role: isAdmin ? 'admin' : isCreator ? 'creator' : 'reader',
    createdAt: user.created_at || activeProfile.createdAt,
    lastLoginAt: new Date().toISOString(),
  };
}

if (typeof window !== 'undefined') {
  subscribeToOververseAuth((snapshot) => {
    activeAuthUser = snapshot.user;
    isAuthReady = snapshot.ready;

    if (snapshot.user) {
      const mapped = mapOververseUserToProfile(snapshot.user);
      if (mapped.isCreator && mapped.penName) {
        ensureCreatorApprovedInMangakaDirectory(mapped);
      }
      saveLocalProfile(mapped);
    } else if (snapshot.ready) {
      if (!isGuestUid(activeProfile.uid) || activeProfile.isCreator) {
        const guestReset: UserProfile = {
          ...DEFAULT_USER_PROFILE,
          bookmarks: activeProfile.bookmarks,
          readingProgress: activeProfile.readingProgress,
          preferences: activeProfile.preferences,
        };
        saveLocalProfile(guestReset);
      } else {
        notifyCreatorAuthListeners();
      }
    }
  });
}

export function getCurrentUserProfile(): UserProfile {
  return activeProfile;
}

export function saveLocalProfile(profile: UserProfile): void {
  const normalizedProfile: UserProfile = {
    ...profile,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(profile.preferences || {}),
      readingDirection: normalizeReadingDirection((profile.preferences as any)?.readingDirection),
    },
  };
  activeProfile = normalizedProfile;
  safeStorage.setJSON(STORAGE_KEY_PROFILE, normalizedProfile);
  applyReadingThemeClass(normalizedProfile.preferences.theme);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('az_profile_updated', { detail: { profile: normalizedProfile } })
    );
  }
  notifyCreatorAuthListeners();
}

export function applyReadingThemeClass(theme: ReadingPreferences['theme']) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light', 'theme-amoled', 'theme-sepia');
  root.classList.add(`theme-${theme}`);

  if (theme === 'light') {
    root.classList.add('light-mode-active');
  } else {
    root.classList.remove('light-mode-active');
  }
}

if (typeof window !== 'undefined') {
  applyReadingThemeClass(activeProfile.preferences.theme);
}

export async function createCreatorAccount(
  input: CreateCreatorAccountInput
): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const cleanPenName = sanitizeBoundedString(input.penName, 60) || DEFAULT_CREATOR_PEN_NAME;
  const cleanStudioName =
    sanitizeBoundedString(input.studioName, 80) || DEFAULT_CREATOR_STUDIO_NAME;
  const cleanBio = sanitizeBoundedString(
    input.bio,
    500,
    `Creator at ${cleanStudioName}.`
  );

  saveCreatorFormDraft({
    penName: cleanPenName,
    studioName: cleanStudioName,
    bio: cleanBio,
    primaryGenres: input.primaryGenres,
  });

  const res = await patchOververseCreatorProfile({
    pen_name: cleanPenName,
    studio_name: cleanStudioName,
    bio: cleanBio,
    role: 'creator',
  });

  if (!res.success || !res.user) {
    return {
      success: false,
      error: res.error || 'Please sign in first to activate your Creator Studio.',
    };
  }

  return {
    success: true,
    profile: activeProfile,
  };
}

export function saveCurrentUserProfile(profile: UserProfile): void {
  saveLocalProfile(profile);
}

export async function becomeCreatorAccount(input: {
  penName: string;
  bio: string;
  avatarUrl?: string;
  email?: string;
}): Promise<UserProfile> {
  const current = getCurrentUserProfile();
  const updated: UserProfile = {
    ...current,
    penName: input.penName.trim(),
    bio: input.bio.trim(),
    avatarUrl: input.avatarUrl || current.avatarUrl,
    email: input.email?.trim() || current.email,
    displayName: input.penName.trim() || current.displayName,
    role: 'creator',
    creatorStatus: 'approved',
    isCreator: true,
  };

  saveLocalProfile(updated);

  // Sync with oververse backend if logged in
  try {
    await patchOververseCreatorProfile({
      pen_name: input.penName.trim(),
      bio: input.bio.trim(),
      role: 'creator',
    });
  } catch (e) {
    // ignore
  }

  return updated;
}

export async function signInWithGoogleCreator(): Promise<{
  success: boolean;
  hasCreatorAccount: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  if (typeof window !== 'undefined') {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  return {
    success: false,
    hasCreatorAccount: false,
    error: 'Use your AZ OVERVERSE Email & Password account to sign in.',
  };
}

export async function signOutCreatorAccount(): Promise<void> {
  await logoutUser();
}

// -------------------------------------------------------------
// READING PROGRESS & BOOKMARKS
// -------------------------------------------------------------
export async function saveReadingProgress(
  progress: Omit<ReadingProgressItem, 'updatedAt'>
): Promise<void> {
  const fullItem: ReadingProgressItem = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };

  saveLocalProfile({
    ...activeProfile,
    readingProgress: {
      ...activeProfile.readingProgress,
      [progress.mangaId]: fullItem,
    },
  });
}

export function getMangaReadingProgress(mangaId: string): ReadingProgressItem | null {
  return activeProfile.readingProgress[mangaId] || null;
}

export function isMangaBookmarked(mangaId: string): boolean {
  return activeProfile.bookmarks.includes(mangaId);
}

export async function toggleMangaBookmark(
  mangaId: string,
  _title?: string,
  _coverImage?: string
): Promise<boolean> {
  const isCurrentlyBookmarked = activeProfile.bookmarks.includes(mangaId);
  const newBookmarks = isCurrentlyBookmarked
    ? activeProfile.bookmarks.filter((id) => id !== mangaId)
    : [...activeProfile.bookmarks, mangaId];

  saveLocalProfile({
    ...activeProfile,
    bookmarks: newBookmarks,
  });

  return !isCurrentlyBookmarked;
}

export async function updateReadingPreferences(
  prefs: Partial<ReadingPreferences>
): Promise<ReadingPreferences> {
  const merged: ReadingPreferences = {
    ...activeProfile.preferences,
    ...prefs,
  };

  saveLocalProfile({
    ...activeProfile,
    preferences: merged,
  });

  return merged;
}

export function isUserFollowed(targetUserId: string): boolean {
  return activeProfile.following.includes(targetUserId);
}

export async function toggleFollowUser(targetUserId: string): Promise<boolean> {
  const isFollowing = activeProfile.following.includes(targetUserId);
  const newFollowing = isFollowing
    ? activeProfile.following.filter((id) => id !== targetUserId)
    : [...activeProfile.following, targetUserId];

  saveLocalProfile({
    ...activeProfile,
    following: newFollowing,
    followingCount: newFollowing.length,
  });
  return !isFollowing;
}

// -------------------------------------------------------------
// MODAL AUTH HELPERS (CUSTOM POSTGRESQL + JWT + RESEND)
// -------------------------------------------------------------
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  isCreator = true,
  penName?: string
): Promise<{
  success: boolean;
  user?: UserProfile;
  message?: string;
  previewVerificationUrl?: string;
  error?: string;
}> {
  const resolvedPenName =
    sanitizeBoundedString(penName || displayName || email.split('@')[0], 60) ||
    DEFAULT_CREATOR_PEN_NAME;

  const res = await registerOververseUser({
    email,
    pen_name: resolvedPenName,
    password: pass,
    confirmPassword: pass,
    studio_name: `${resolvedPenName} Studio`,
    role: isCreator ? 'creator' : 'reader',
  });

  if (!res.success) {
    return { success: false, error: res.error };
  }

  return {
    success: true,
    message: res.message,
    previewVerificationUrl: res.previewVerificationUrl,
  };
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{
  success: boolean;
  requiresTwoFactor?: boolean;
  mfaToken?: string;
  user?: UserProfile;
  error?: string;
}> {
  const res = await loginOververseUser({ email, password: pass });
  if (res.requiresTwoFactor && res.mfaToken) {
    return {
      success: false,
      requiresTwoFactor: true,
      mfaToken: res.mfaToken,
    };
  }
  if (!res.success) {
    return {
      success: false,
      error: res.error,
    };
  }
  return {
    success: true,
    user: activeProfile,
  };
}

export async function verifyLoginTwoFactorCode(
  mfaToken: string,
  code: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const res = await verifyOververseLoginTwoFactor({ mfaToken, code });
  if (!res.success) {
    return {
      success: false,
      error: res.error || 'Invalid 6-digit authenticator code.',
    };
  }
  return {
    success: true,
    user: activeProfile,
  };
}

export async function logoutUser(): Promise<void> {
  await logoutOververseSession();
}

export async function updateUserBioAndAvatar(
  displayName: string,
  bio: string,
  avatarUrl?: string
): Promise<UserProfile> {
  const cleanName = sanitizeBoundedString(displayName, 60, activeProfile.displayName || 'Creator');
  const cleanBio = sanitizeBoundedString(bio, 500, activeProfile.bio || '');
  const cleanAvatar = sanitizeBoundedString(
    avatarUrl || activeProfile.avatarUrl,
    1000,
    DEFAULT_USER_PROFILE.avatarUrl
  );

  if (activeAuthUser) {
    await patchOververseCreatorProfile({
      pen_name: cleanName,
      bio: cleanBio,
      avatar_url: cleanAvatar,
    });
  }

  const updated: UserProfile = {
    ...activeProfile,
    displayName: cleanName,
    penName: activeProfile.isCreator ? cleanName : activeProfile.penName,
    bio: cleanBio,
    avatarUrl: cleanAvatar,
  };

  saveLocalProfile(updated);
  return updated;
}
