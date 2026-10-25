// User Profile, Creator Studio Account Gate, Reading Progress & Bookmarks Engine
// Produced by Mlungiseni Mbhele
import { safeStorage } from '../utils/safeStorage';
import {
  getMangakaApplications,
  saveMangakaApplications,
} from '../utils/mangakaManager';
import {
  auth,
  db,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  handleFirestoreError,
  isPermissionError,
  OperationType,
  FirebaseUser,
} from './firebase';

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
  displayName: string;
  avatarUrl: string;
  bio: string;
  isCreator: boolean;
  penName?: string;
  studioName?: string;
  primaryGenres?: string[];
  role: 'reader' | 'creator' | 'admin';
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
  firebaseUser: FirebaseUser | null;
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

// Unauthenticated Guest Reader default — NEVER pre-granted Creator Studio access
export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'u-guest-reader',
  email: 'reader@azoververse.com',
  displayName: 'Guest Reader',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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
      mangaCover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
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

function sanitizeSafeId(val: string): string {
  const cleaned = val.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  return cleaned || 'item-1';
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
      // Enforce strict rule: Guest / unauthenticated local profiles NEVER count as Creator Accounts
      isCreator: guest ? false : Boolean(cached.isCreator && cached.penName?.trim()),
      penName: guest ? undefined : cached.penName,
      studioName: guest ? undefined : cached.studioName,
      role: guest ? 'reader' : cached.role || 'reader',
      preferences: mergedPrefs,
      bookmarks: Array.isArray(cached.bookmarks) ? cached.bookmarks : DEFAULT_USER_PROFILE.bookmarks,
      readingProgress: cached.readingProgress || {},
      following: Array.isArray(cached.following) ? cached.following : ['c-1', 'c-2'],
    };
  }
  return { ...DEFAULT_USER_PROFILE };
}

let activeProfile: UserProfile = loadLocalProfile();
let activeFirebaseUser: FirebaseUser | null = auth.currentUser;
let isAuthReady = false;

type CreatorAuthListener = (state: CreatorAuthState) => void;
const creatorAuthListeners = new Set<CreatorAuthListener>();

function computeHasCreatorAccount(fbUser: FirebaseUser | null, profile: UserProfile): boolean {
  if (!fbUser) return false;
  if (isGuestUid(profile.uid) || profile.uid !== fbUser.uid) return false;
  return Boolean(profile.isCreator && profile.penName && profile.penName.trim().length >= 2);
}

export function getCreatorAuthState(): CreatorAuthState {
  return {
    authReady: isAuthReady,
    firebaseUser: activeFirebaseUser,
    profile: activeProfile,
    hasCreatorAccount: computeHasCreatorAccount(activeFirebaseUser, activeProfile),
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
    bio: profile.bio || `Verified Creator at ${profile.studioName || 'OVERVERSE Studio'}.`,
    idPhotoUrl: profile.avatarUrl || DEFAULT_USER_PROFILE.avatarUrl,
    portfolioUrl: 'https://az-oververse.ai.studio',
    country: 'South Africa',
    region: profile.studioName || 'OVERVERSE Creator Studio',
    primaryGenres:
      profile.primaryGenres && profile.primaryGenres.length > 0
        ? profile.primaryGenres
        : ['Action', 'Fantasy'],
    submittedAt: existingIdx >= 0 ? apps[existingIdx].submittedAt : new Date().toISOString(),
    status: 'approved' as const,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'OVERVERSE Creator Auth',
    adminNotes: 'Verified Creator Studio Account',
  };

  if (existingIdx >= 0) {
    const next = [...apps];
    next[existingIdx] = record;
    saveMangakaApplications(next);
  } else {
    saveMangakaApplications([record, ...apps]);
  }
}

async function hydrateProfileFromFirestore(fbUser: FirebaseUser): Promise<UserProfile> {
  const userPath = `users/${fbUser.uid}`;
  let remoteData: Record<string, any> | null = null;

  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      remoteData = snap.data();
    }
  } catch (err) {
    if (isPermissionError(err)) {
      handleFirestoreError(err, OperationType.GET, userPath);
    }
    console.warn('[UserProfile] Firestore profile fetch notice:', err);
  }

  const email = fbUser.email || activeProfile.email || '';
  const isCreator = Boolean(remoteData?.isCreator && typeof remoteData?.penName === 'string' && remoteData.penName.trim().length >= 2);
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  const hydrated: UserProfile = {
    ...activeProfile,
    uid: fbUser.uid,
    email,
    displayName:
      sanitizeBoundedString(remoteData?.displayName, 80) ||
      sanitizeBoundedString(fbUser.displayName, 80) ||
      email.split('@')[0] ||
      'OVERVERSE User',
    avatarUrl:
      sanitizeBoundedString(remoteData?.avatarUrl, 1000) ||
      sanitizeBoundedString(fbUser.photoURL, 1000) ||
      DEFAULT_USER_PROFILE.avatarUrl,
    bio:
      sanitizeBoundedString(remoteData?.bio, 500) ||
      (isCreator ? 'Creator on AZ OVERVERSE.' : 'Manga reader on AZ OVERVERSE.'),
    isCreator,
    penName: isCreator ? sanitizeBoundedString(remoteData?.penName, 80) : undefined,
    studioName: isCreator ? sanitizeBoundedString(remoteData?.studioName, 80) : undefined,
    primaryGenres: Array.isArray(remoteData?.primaryGenres)
      ? remoteData.primaryGenres.slice(0, 6).map((g: unknown) => sanitizeBoundedString(g, 40)).filter(Boolean)
      : [],
    role: isAdmin ? 'admin' : isCreator ? 'creator' : 'reader',
    followersCount: typeof remoteData?.followersCount === 'number' ? remoteData.followersCount : 0,
    followingCount: typeof remoteData?.followingCount === 'number' ? remoteData.followingCount : activeProfile.following.length,
    lastLoginAt: new Date().toISOString(),
  };

  if (hydrated.isCreator) {
    ensureCreatorApprovedInMangakaDirectory(hydrated);
  }

  saveLocalProfile(hydrated);
  return hydrated;
}

// Listen to Firebase Auth state changes across sessions
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (fbUser) => {
    activeFirebaseUser = fbUser;
    if (fbUser) {
      try {
        await hydrateProfileFromFirestore(fbUser);
      } catch (err) {
        console.error('[UserProfile] Failed to hydrate user profile:', err);
      }
    } else {
      // Signed out: ensure Creator Studio access is locked
      if (!isGuestUid(activeProfile.uid) || activeProfile.isCreator) {
        const guestReset: UserProfile = {
          ...DEFAULT_USER_PROFILE,
          bookmarks: activeProfile.bookmarks,
          readingProgress: activeProfile.readingProgress,
          preferences: activeProfile.preferences,
        };
        saveLocalProfile(guestReset);
      }
    }
    isAuthReady = true;
    notifyCreatorAuthListeners();
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
  broadcastProfileChange(normalizedProfile);
  notifyCreatorAuthListeners();
}

function broadcastProfileChange(profile: UserProfile) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('az_profile_updated', { detail: { profile } }));
  }
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

// -------------------------------------------------------------
// CREATOR STUDIO ACCOUNT AUTHENTICATION & CREATION (GOOGLE + FIRESTORE)
// -------------------------------------------------------------

/**
 * Signs in with Google via popup and checks if an active Creator Account exists in Firestore.
 */
export async function signInWithGoogleCreator(): Promise<{
  success: boolean;
  hasCreatorAccount: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    activeFirebaseUser = credential.user;
    const hydrated = await hydrateProfileFromFirestore(credential.user);
    isAuthReady = true;
    notifyCreatorAuthListeners();

    return {
      success: true,
      hasCreatorAccount: computeHasCreatorAccount(credential.user, hydrated),
      profile: hydrated,
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        hasCreatorAccount: false,
        error: 'Sign-in window was closed before completing authentication.',
      };
    }
    return {
      success: false,
      hasCreatorAccount: false,
      error: err?.message || 'Failed to sign in with Google.',
    };
  }
}

/**
 * Creates or activates a Creator Studio Account in Firestore (isolated public + private PII records).
 * Automatically prompts Google Sign-In first if the user is not yet authenticated.
 */
export async function createCreatorAccount(
  input: CreateCreatorAccountInput
): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const cleanPenName = sanitizeBoundedString(input.penName, 80);
  const cleanStudioName = sanitizeBoundedString(input.studioName, 80);
  const cleanBio = sanitizeBoundedString(
    input.bio,
    500,
    `Creator at ${cleanStudioName || 'OVERVERSE Studio'}.`
  );
  const cleanGenres = (input.primaryGenres || [])
    .map((g) => sanitizeBoundedString(g, 40))
    .filter((g) => g.length >= 1)
    .slice(0, 6);

  if (cleanPenName.length < 2) {
    return {
      success: false,
      error: 'Creator Pen Name must be between 2 and 80 characters.',
    };
  }

  if (cleanStudioName.length < 2) {
    return {
      success: false,
      error: 'Studio or Imprint Name must be between 2 and 80 characters.',
    };
  }

  try {
    let fbUser = auth.currentUser;
    if (!fbUser) {
      const credential = await signInWithPopup(auth, googleProvider);
      fbUser = credential.user;
      activeFirebaseUser = fbUser;
    }

    const uid = fbUser.uid;
    const email = sanitizeBoundedString(fbUser.email || '', 254);
    if (!email || !fbUser.emailVerified) {
      return {
        success: false,
        error: 'A verified Google account email is required to create a Creator Account.',
      };
    }

    const cleanDisplayName =
      sanitizeBoundedString(fbUser.displayName, 80) ||
      cleanPenName ||
      email.split('@')[0] ||
      'Creator';
    const cleanAvatarUrl = sanitizeBoundedString(
      fbUser.photoURL || activeProfile.avatarUrl || DEFAULT_USER_PROFILE.avatarUrl,
      1000
    );

    const userRef = doc(db, 'users', uid);
    const privateRef = doc(db, 'users', uid, 'private', 'info');
    const userPath = `users/${uid}`;
    const privatePath = `users/${uid}/private/info`;

    let userExists = false;
    let privateExists = false;

    try {
      const existingUserSnap = await getDoc(userRef);
      userExists = existingUserSnap.exists();
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.GET, userPath);
      }
      throw err;
    }

    if (userExists) {
      try {
        const existingPrivateSnap = await getDoc(privateRef);
        privateExists = existingPrivateSnap.exists();
      } catch (err) {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.GET, privatePath);
        }
        throw err;
      }
    }

    const batch = writeBatch(db);

    if (!userExists) {
      batch.set(userRef, {
        uid,
        displayName: cleanDisplayName,
        avatarUrl: cleanAvatarUrl,
        bio: cleanBio,
        isCreator: true,
        penName: cleanPenName,
        studioName: cleanStudioName,
        primaryGenres: cleanGenres.length > 0 ? cleanGenres : ['Action'],
        followersCount: 0,
        followingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(userRef, {
        displayName: cleanDisplayName,
        avatarUrl: cleanAvatarUrl,
        bio: cleanBio,
        isCreator: true,
        penName: cleanPenName,
        studioName: cleanStudioName,
        primaryGenres: cleanGenres.length > 0 ? cleanGenres : ['Action'],
        updatedAt: serverTimestamp(),
      });
    }

    if (!privateExists) {
      batch.set(privateRef, {
        uid,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(privateRef, {
        email,
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(
          err,
          userExists ? OperationType.UPDATE : OperationType.CREATE,
          userPath
        );
      }
      throw err;
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const createdProfile: UserProfile = {
      ...activeProfile,
      uid,
      email,
      displayName: cleanDisplayName,
      avatarUrl: cleanAvatarUrl,
      bio: cleanBio,
      isCreator: true,
      penName: cleanPenName,
      studioName: cleanStudioName,
      primaryGenres: cleanGenres.length > 0 ? cleanGenres : ['Action'],
      role: isAdmin ? 'admin' : 'creator',
      lastLoginAt: new Date().toISOString(),
    };

    ensureCreatorApprovedInMangakaDirectory(createdProfile);
    isAuthReady = true;
    saveLocalProfile(createdProfile);

    return {
      success: true,
      profile: createdProfile,
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        error: 'Google authentication window was closed before completing setup.',
      };
    }
    return {
      success: false,
      error: err?.message || 'Unable to create Creator Account. Please try again.',
    };
  }
}

export async function signOutCreatorAccount(): Promise<void> {
  await logoutUser();
}

// -------------------------------------------------------------
// READING PROGRESS
// -------------------------------------------------------------
export async function saveReadingProgress(progress: Omit<ReadingProgressItem, 'updatedAt'>): Promise<void> {
  const fullItem: ReadingProgressItem = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };

  const updatedProgress = {
    ...activeProfile.readingProgress,
    [progress.mangaId]: fullItem,
  };

  const updatedProfile: UserProfile = {
    ...activeProfile,
    readingProgress: updatedProgress,
  };

  saveLocalProfile(updatedProfile);

  if (auth.currentUser && auth.currentUser.emailVerified) {
    const uid = auth.currentUser.uid;
    const safeMangaId = sanitizeSafeId(progress.mangaId);
    const path = `users/${uid}/reading_progress/${safeMangaId}`;
    const progressRef = doc(db, 'users', uid, 'reading_progress', safeMangaId);

    try {
      const parentSnap = await getDoc(doc(db, 'users', uid));
      if (!parentSnap.exists()) return;

      const existingSnap = await getDoc(progressRef);
      const payloadBase = {
        mangaTitle: sanitizeBoundedString(progress.mangaTitle, 160),
        mangaCover: sanitizeBoundedString(progress.mangaCover, 1000),
        chapterId: sanitizeSafeId(progress.chapterId),
        chapterNumber: Math.max(0, Math.min(10000, Number(progress.chapterNumber) || 1)),
        chapterTitle: sanitizeBoundedString(progress.chapterTitle, 160),
        pageNumber: Math.max(0, Math.min(5000, Number(progress.pageNumber) || 1)),
        totalPages: Math.max(1, Math.min(5000, Number(progress.totalPages) || 1)),
        progressPercent: Math.max(0, Math.min(100, Number(progress.progressPercent) || 0)),
        completed: Boolean(progress.completed),
        updatedAt: serverTimestamp(),
      };

      if (!existingSnap.exists()) {
        await setDoc(progressRef, {
          uid,
          mangaId: safeMangaId,
          ...payloadBase,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(progressRef, payloadBase);
      }
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      console.warn('[UserProfile] Firestore progress sync fallback to local:', err);
    }
  }
}

export function getMangaReadingProgress(mangaId: string): ReadingProgressItem | null {
  return activeProfile.readingProgress[mangaId] || null;
}

// -------------------------------------------------------------
// BOOKMARKS
// -------------------------------------------------------------
export function isMangaBookmarked(mangaId: string): boolean {
  return activeProfile.bookmarks.includes(mangaId);
}

export async function toggleMangaBookmark(
  mangaId: string,
  mangaTitle?: string,
  coverImage?: string
): Promise<boolean> {
  const isCurrentlyBookmarked = activeProfile.bookmarks.includes(mangaId);
  const newBookmarks = isCurrentlyBookmarked
    ? activeProfile.bookmarks.filter((id) => id !== mangaId)
    : [...activeProfile.bookmarks, mangaId];

  const updatedProfile: UserProfile = {
    ...activeProfile,
    bookmarks: newBookmarks,
  };

  saveLocalProfile(updatedProfile);

  if (auth.currentUser && auth.currentUser.emailVerified) {
    const uid = auth.currentUser.uid;
    const safeMangaId = sanitizeSafeId(mangaId);
    const path = `users/${uid}/bookmarks/${safeMangaId}`;
    const bookmarkRef = doc(db, 'users', uid, 'bookmarks', safeMangaId);

    try {
      const parentSnap = await getDoc(doc(db, 'users', uid));
      if (parentSnap.exists()) {
        if (isCurrentlyBookmarked) {
          await deleteDoc(bookmarkRef);
        } else {
          const existingSnap = await getDoc(bookmarkRef);
          if (!existingSnap.exists()) {
            await setDoc(bookmarkRef, {
              uid,
              mangaId: safeMangaId,
              mangaTitle: sanitizeBoundedString(mangaTitle || '', 160),
              coverImage: sanitizeBoundedString(coverImage || '', 1000),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(bookmarkRef, {
              mangaTitle: sanitizeBoundedString(mangaTitle || '', 160),
              coverImage: sanitizeBoundedString(coverImage || '', 1000),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(
          err,
          isCurrentlyBookmarked ? OperationType.DELETE : OperationType.WRITE,
          path
        );
      }
      console.warn('[UserProfile] Bookmark remote sync fallback to local:', err);
    }
  }

  return !isCurrentlyBookmarked;
}

// -------------------------------------------------------------
// READING PREFERENCES
// -------------------------------------------------------------
export async function updateReadingPreferences(
  prefs: Partial<ReadingPreferences>
): Promise<ReadingPreferences> {
  const merged: ReadingPreferences = {
    ...activeProfile.preferences,
    ...prefs,
  };

  const updatedProfile: UserProfile = {
    ...activeProfile,
    preferences: merged,
  };

  saveLocalProfile(updatedProfile);

  if (auth.currentUser && auth.currentUser.emailVerified) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/preferences/settings`;
    const prefRef = doc(db, 'users', uid, 'preferences', 'settings');

    try {
      const parentSnap = await getDoc(doc(db, 'users', uid));
      if (parentSnap.exists()) {
        const existingSnap = await getDoc(prefRef);
        const prefPayload = {
          theme: merged.theme,
          textSize: merged.textSize,
          readingDirection: merged.readingDirection,
          autoScroll: Boolean(merged.autoScroll),
          autoScrollSpeed: Math.max(1, Math.min(5, Number(merged.autoScrollSpeed) || 2)),
          soundEffects: Boolean(merged.soundEffects),
          hapticFeedback: Boolean(merged.hapticFeedback),
          updatedAt: serverTimestamp(),
        };

        if (!existingSnap.exists()) {
          await setDoc(prefRef, {
            uid,
            ...prefPayload,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(prefRef, prefPayload);
        }
      }
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      console.warn('[UserProfile] Preferences remote sync fallback:', err);
    }
  }

  return merged;
}

// -------------------------------------------------------------
// SOCIAL FOLLOWING
// -------------------------------------------------------------
export function isUserFollowed(targetUserId: string): boolean {
  return activeProfile.following.includes(targetUserId);
}

export async function toggleFollowUser(targetUserId: string): Promise<boolean> {
  const isFollowing = activeProfile.following.includes(targetUserId);
  const newFollowing = isFollowing
    ? activeProfile.following.filter((id) => id !== targetUserId)
    : [...activeProfile.following, targetUserId];

  const updatedProfile: UserProfile = {
    ...activeProfile,
    following: newFollowing,
    followingCount: newFollowing.length,
  };

  saveLocalProfile(updatedProfile);
  return !isFollowing;
}

// -------------------------------------------------------------
// LEGACY MODAL AUTH HELPERS (READER PROFILE MODAL COMPATIBILITY)
// -------------------------------------------------------------
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  isCreator = false,
  penName?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (isCreator) {
    const res = await createCreatorAccount({
      penName: penName || displayName || email.split('@')[0] || 'Creator',
      studioName: `${displayName || 'OVERVERSE'} Studio`,
      bio: 'Creator on AZ OVERVERSE.',
      primaryGenres: ['Action'],
    });
    return { success: res.success, user: res.profile, error: res.error };
  }

  try {
    const res = await signInWithGoogleCreator();
    if (res.success && res.profile) {
      return { success: true, user: res.profile };
    }
    return {
      success: false,
      error: res.error || 'Please sign in with Google to register.',
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to create account.' };
  }
}

export async function loginWithEmail(
  _email: string,
  _pass: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const res = await signInWithGoogleCreator();
  return {
    success: res.success,
    user: res.profile,
    error: res.error,
  };
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[UserProfile] Sign out warning:', err);
  }

  activeFirebaseUser = null;

  const guestProfile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    uid: `u-guest-${Date.now()}`,
    email: 'reader@azoververse.com',
    displayName: 'Guest Reader',
    isCreator: false,
    penName: undefined,
    studioName: undefined,
    role: 'reader',
    bookmarks: activeProfile.bookmarks,
    readingProgress: activeProfile.readingProgress,
    preferences: activeProfile.preferences,
  };

  saveLocalProfile(guestProfile);
}

export async function updateUserBioAndAvatar(
  displayName: string,
  bio: string,
  avatarUrl?: string
): Promise<UserProfile> {
  const cleanName = sanitizeBoundedString(displayName, 80, activeProfile.displayName || 'Reader');
  const cleanBio = sanitizeBoundedString(bio, 500, activeProfile.bio || '');
  const cleanAvatar = sanitizeBoundedString(
    avatarUrl || activeProfile.avatarUrl,
    1000,
    DEFAULT_USER_PROFILE.avatarUrl
  );

  const updated: UserProfile = {
    ...activeProfile,
    displayName: cleanName,
    bio: cleanBio,
    avatarUrl: cleanAvatar,
  };

  saveLocalProfile(updated);

  if (auth.currentUser && auth.currentUser.emailVerified) {
    const uid = auth.currentUser.uid;
    const path = `users/${uid}`;
    const userRef = doc(db, 'users', uid);

    try {
      await updateFirebaseProfile(auth.currentUser, {
        displayName: cleanName,
        photoURL: cleanAvatar,
      });
      const existingSnap = await getDoc(userRef);
      if (existingSnap.exists()) {
        await updateDoc(userRef, {
          displayName: cleanName,
          bio: cleanBio,
          avatarUrl: cleanAvatar,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      console.warn('[UserProfile] Bio remote update warning:', err);
    }
  }

  return updated;
}
