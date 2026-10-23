// User Profile, Reading Progress, Bookmarks & Preferences Engine
// Produced by Mlungiseni Mbhele
import { safeStorage } from '../utils/safeStorage';
import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
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
  role: 'reader' | 'creator' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  bookmarks: string[]; // manga IDs
  readingProgress: Record<string, ReadingProgressItem>; // mangaId -> progress
  preferences: ReadingPreferences;
  following: string[]; // user IDs / emails being followed
  followersCount: number;
  followingCount: number;
  streakDays: number;
  coins: number;
}

const STORAGE_KEY_PROFILE = 'ka_pulse_user_profile_v2';
const STORAGE_KEY_BOOKMARKS = 'ka_pulse_user_bookmarks';
const STORAGE_KEY_PROGRESS = 'ka_pulse_reading_progress';
const STORAGE_KEY_PREFS = 'ka_pulse_reading_preferences';

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

export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'u-guest-az',
  email: 'mlungisenimbhele3@gmail.com',
  displayName: 'Mlungiseni Mbhele',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Executive Producer & Creator of AZ OVERVERSE. Manga artist, writer & champion of African visual narrative.',
  isCreator: true,
  penName: 'AZ Oververse Master',
  role: 'admin',
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
  followersCount: 14200,
  followingCount: 38,
  streakDays: 7,
  coins: 450,
};

// Internal active profile state
let activeProfile: UserProfile = loadLocalProfile();

function normalizeReadingDirection(dir?: string): ReadingPreferences['readingDirection'] {
  if (dir === 'vertical' || dir === 'single' || dir === 'horizontal_ltr') {
    return dir;
  }
  return 'horizontal_ltr';
}

function loadLocalProfile(): UserProfile {
  const cached = safeStorage.getJSON<UserProfile | null>(STORAGE_KEY_PROFILE, null);
  if (cached && cached.email) {
    const mergedPrefs: ReadingPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(cached.preferences || {}),
      readingDirection: normalizeReadingDirection((cached.preferences as any)?.readingDirection),
    };
    return {
      ...DEFAULT_USER_PROFILE,
      ...cached,
      preferences: mergedPrefs,
      bookmarks: Array.isArray(cached.bookmarks) ? cached.bookmarks : DEFAULT_USER_PROFILE.bookmarks,
      readingProgress: cached.readingProgress || {},
      following: Array.isArray(cached.following) ? cached.following : ['c-1', 'c-2'],
    };
  }
  return DEFAULT_USER_PROFILE;
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
}

// Broadcast profile update event to React components
function broadcastProfileChange(profile: UserProfile) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('az_profile_updated', { detail: { profile } }));
  }
}

// Apply Theme to document root (dark, light, amoled, sepia)
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

// Apply theme on initial script execution
if (typeof window !== 'undefined') {
  applyReadingThemeClass(activeProfile.preferences.theme);
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

  // Sync to Firestore if available
  try {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid, 'reading_progress', progress.mangaId);
      await setDoc(userRef, fullItem, { merge: true });
    }
  } catch (err) {
    console.warn('[UserProfile] Firestore progress sync fallback to local:', err);
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

export async function toggleMangaBookmark(mangaId: string, mangaTitle?: string, coverImage?: string): Promise<boolean> {
  const isCurrentlyBookmarked = activeProfile.bookmarks.includes(mangaId);
  let newBookmarks: string[];

  if (isCurrentlyBookmarked) {
    newBookmarks = activeProfile.bookmarks.filter((id) => id !== mangaId);
  } else {
    newBookmarks = [...activeProfile.bookmarks, mangaId];
  }

  const updatedProfile: UserProfile = {
    ...activeProfile,
    bookmarks: newBookmarks,
  };

  saveLocalProfile(updatedProfile);

  // Sync to Firestore
  try {
    if (auth.currentUser) {
      const bookmarkRef = doc(db, 'users', auth.currentUser.uid, 'bookmarks', mangaId);
      if (isCurrentlyBookmarked) {
        await deleteDoc(bookmarkRef);
      } else {
        await setDoc(bookmarkRef, {
          mangaId,
          mangaTitle: mangaTitle || '',
          coverImage: coverImage || '',
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[UserProfile] Bookmark remote sync fallback to local:', err);
  }

  return !isCurrentlyBookmarked;
}

// -------------------------------------------------------------
// READING PREFERENCES
// -------------------------------------------------------------
export async function updateReadingPreferences(prefs: Partial<ReadingPreferences>): Promise<ReadingPreferences> {
  const merged: ReadingPreferences = {
    ...activeProfile.preferences,
    ...prefs,
  };

  const updatedProfile: UserProfile = {
    ...activeProfile,
    preferences: merged,
  };

  saveLocalProfile(updatedProfile);

  // Sync to Firestore
  try {
    if (auth.currentUser) {
      const prefRef = doc(db, 'users', auth.currentUser.uid, 'preferences', 'settings');
      await setDoc(prefRef, merged, { merge: true });
    }
  } catch (err) {
    console.warn('[UserProfile] Preferences remote sync fallback:', err);
  }

  return merged;
}

// -------------------------------------------------------------
// SOCIAL FOLLOWING (Facebook / TikTok style)
// -------------------------------------------------------------
export function isUserFollowed(targetUserId: string): boolean {
  return activeProfile.following.includes(targetUserId);
}

export async function toggleFollowUser(targetUserId: string): Promise<boolean> {
  const isFollowing = activeProfile.following.includes(targetUserId);
  let newFollowing: string[];

  if (isFollowing) {
    newFollowing = activeProfile.following.filter((id) => id !== targetUserId);
  } else {
    newFollowing = [...activeProfile.following, targetUserId];
  }

  const updatedProfile: UserProfile = {
    ...activeProfile,
    following: newFollowing,
    followingCount: newFollowing.length,
  };

  saveLocalProfile(updatedProfile);
  return !isFollowing;
}

// -------------------------------------------------------------
// AUTHENTICATION (Register / Login / Logout / Profile Edit)
// -------------------------------------------------------------
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  isCreator = false,
  penName?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    let uid = `u-${Date.now()}`;
    let firebaseUser: FirebaseUser | null = null;

    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      firebaseUser = res.user;
      uid = res.user.uid;
      if (displayName) {
        await updateFirebaseProfile(res.user, { displayName });
      }
    } catch (fbErr: any) {
      console.warn('[UserProfile] Firebase Auth offline/error, falling back to local credentials:', fbErr.message);
      // Fallback allows offline sign-up seamlessly
    }

    const newProfile: UserProfile = {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName || email)}`,
      bio: isCreator ? `Mangaka & Creator of AZ Oververse.` : `Passionate African manga reader & anime fan.`,
      isCreator,
      penName: penName || (isCreator ? displayName : undefined),
      role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : isCreator ? 'creator' : 'reader',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      bookmarks: [],
      readingProgress: {},
      preferences: activeProfile.preferences,
      following: ['c-1'],
      followersCount: 1,
      followingCount: 1,
      streakDays: 1,
      coins: 100, // Welcome signup bonus!
    };

    saveLocalProfile(newProfile);

    // Save to Firestore
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, newProfile, { merge: true });
    } catch {}

    return { success: true, user: newProfile };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to create account.' };
  }
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    let uid = `u-${Date.now()}`;

    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      uid = res.user.uid;
    } catch (fbErr: any) {
      console.warn('[UserProfile] Firebase login fallback:', fbErr.message);
    }

    // Try to load user document from Firestore
    let existingProfile: UserProfile | null = null;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        existingProfile = userDoc.data() as UserProfile;
      }
    } catch {}

    const profile: UserProfile = existingProfile || {
      ...activeProfile,
      uid,
      email,
      displayName: email.split('@')[0],
      lastLoginAt: new Date().toISOString(),
      role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : activeProfile.role,
    };

    saveLocalProfile(profile);
    return { success: true, user: profile };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to sign in.' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}

  const guestProfile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    uid: `u-guest-${Date.now()}`,
    email: 'reader@azoververse.com',
    displayName: 'Guest Reader',
    isCreator: false,
    role: 'reader',
    bookmarks: [],
    readingProgress: {},
  };

  saveLocalProfile(guestProfile);
}

export async function updateUserBioAndAvatar(displayName: string, bio: string, avatarUrl?: string): Promise<UserProfile> {
  const updated: UserProfile = {
    ...activeProfile,
    displayName,
    bio,
    avatarUrl: avatarUrl || activeProfile.avatarUrl,
  };

  saveLocalProfile(updated);

  try {
    if (auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, { displayName, photoURL: avatarUrl });
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { displayName, bio, avatarUrl }, { merge: true });
    }
  } catch {}

  return updated;
}
