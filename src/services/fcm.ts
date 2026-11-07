// Web Push & In-App Chapter Drop Notification Engine for AZ OVERVERSE
// Pure W3C Notification + ServiceWorker API — Zero Firebase SDK Dependencies
import { Manga, Chapter } from '../types';
import { safeStorage } from '../utils/safeStorage';
import { APP_LOGO_SRC } from '../components/common/KAAfricaLogo';

const PUSH_TOKEN_STORAGE_KEY = 'az_oververse_webpush_token';
const PUSH_SUBSCRIPTIONS_STORAGE_KEY = 'ka_pulse_fcm_chapter_subscriptions';
const PUSH_NOTIFICATIONS_HISTORY_KEY = 'ka_pulse_fcm_notifications_history';

export interface ChapterDropNotificationPayload {
  id: string;
  mangaId: string;
  mangaTitle: string;
  coverImage: string;
  chapterNumber: number;
  chapterTitle: string;
  timestamp: string;
  readUrl: string;
  isRead?: boolean;
  isFromFollowedCreator?: boolean;
  creatorName?: string;
}

type NotificationCallback = (payload: ChapterDropNotificationPayload) => void;
const notificationListeners: Set<NotificationCallback> = new Set();

export async function isFcmSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function initFcmMessaging(): Promise<null> {
  return null;
}

export async function requestFcmToken(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Notifications not supported in this browser' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Push notification permission was denied' };
    }

    const devicePushId = `az_push_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    safeStorage.setItem(PUSH_TOKEN_STORAGE_KEY, devicePushId);
    return { success: true, token: devicePushId };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to request notification permission',
    };
  }
}

export function getStoredFcmToken(): string | null {
  return safeStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

export function isPushNotificationEnabled(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted' && Boolean(getStoredFcmToken());
}

export function subscribeToMangaChapterDrops(mangaId: string, mangaTitle: string): boolean {
  const current = safeStorage.getJSON<Record<string, string>>(PUSH_SUBSCRIPTIONS_STORAGE_KEY, {});
  current[mangaId] = mangaTitle;
  safeStorage.setJSON(PUSH_SUBSCRIPTIONS_STORAGE_KEY, current);
  return true;
}

export function unsubscribeFromMangaChapterDrops(mangaId: string): boolean {
  const current = safeStorage.getJSON<Record<string, string>>(PUSH_SUBSCRIPTIONS_STORAGE_KEY, {});
  delete current[mangaId];
  safeStorage.setJSON(PUSH_SUBSCRIPTIONS_STORAGE_KEY, current);
  return true;
}

export function isSubscribedToMangaChapterDrops(mangaId: string): boolean {
  const current = safeStorage.getJSON<Record<string, string>>(PUSH_SUBSCRIPTIONS_STORAGE_KEY, {});
  return Boolean(current[mangaId]);
}

export function onChapterDropNotification(callback: NotificationCallback): () => void {
  notificationListeners.add(callback);
  return () => {
    notificationListeners.delete(callback);
  };
}

function broadcastNotification(payload: ChapterDropNotificationPayload) {
  notificationListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.error('[Push] Error in notification callback:', e);
    }
  });
}

function saveNotificationToHistory(payload: ChapterDropNotificationPayload) {
  const history = safeStorage.getJSON<ChapterDropNotificationPayload[]>(
    PUSH_NOTIFICATIONS_HISTORY_KEY,
    []
  );
  const updated = [payload, ...history.filter((n) => n.id !== payload.id)].slice(0, 25);
  safeStorage.setJSON(PUSH_NOTIFICATIONS_HISTORY_KEY, updated);
}

export function getNotificationsHistory(): ChapterDropNotificationPayload[] {
  return safeStorage.getJSON<ChapterDropNotificationPayload[]>(
    PUSH_NOTIFICATIONS_HISTORY_KEY,
    []
  );
}

export function clearNotificationsHistory(): void {
  safeStorage.removeItem(PUSH_NOTIFICATIONS_HISTORY_KEY);
}

export async function dispatchChapterDropPush(
  manga: Manga,
  chapter: Chapter,
  options?: {
    isFromFollowedCreator?: boolean;
    creatorName?: string;
    creatorRole?: string;
  }
): Promise<{ success: boolean; deliveredCount: number }> {
  const isFollowed = Boolean(options?.isFromFollowedCreator);
  const creatorDisplay = options?.creatorName || manga.author || 'Author';

  const payload: ChapterDropNotificationPayload = {
    id: `notif-${Date.now()}`,
    mangaId: manga.id,
    mangaTitle: manga.title,
    coverImage: manga.coverImage,
    chapterNumber: chapter.number,
    chapterTitle: chapter.title,
    timestamp: new Date().toISOString(),
    readUrl: `/?manga=${manga.id}&chapter=${chapter.id}`,
    isRead: false,
    isFromFollowedCreator: isFollowed,
    creatorName: creatorDisplay,
  };

  saveNotificationToHistory(payload);

  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      const title = isFollowed
        ? `🔔 Followed Creator Alert: ${creatorDisplay} dropped ${manga.title}!`
        : `New Chapter Drop: ${manga.title}`;
      const notificationOptions: NotificationOptions = {
        body: isFollowed
          ? `Creator you follow released Chapter ${chapter.number}: "${chapter.title}"! Tap to read now on AZ OVERVERSE.`
          : `Chapter ${chapter.number}: "${chapter.title}" is out now on AZ OVERVERSE.`,
        icon: manga.coverImage || APP_LOGO_SRC,
        badge: '/pwa-192x192.png',
        tag: `chapter-drop-${manga.id}-${chapter.number}`,
        data: {
          url: `/?manga=${manga.id}&chapter=${chapter.id}`,
        },
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, notificationOptions))
          .catch(() => {
            new Notification(title, notificationOptions);
          });
      } else {
        new Notification(title, notificationOptions);
      }
    } catch {
      // Ignore native notification restriction inside sandboxed iframes
    }
  }

  broadcastNotification(payload);
  return { success: true, deliveredCount: 1 };
}

export async function dispatchNewSeriesPush(
  manga: Manga,
  creatorName?: string
): Promise<{ success: boolean; deliveredCount: number }> {
  const creatorDisplay = creatorName || manga.author || 'Author';
  const payload: ChapterDropNotificationPayload = {
    id: `notif-series-${Date.now()}`,
    mangaId: manga.id,
    mangaTitle: manga.title,
    coverImage: manga.coverImage,
    chapterNumber: 1,
    chapterTitle: 'Series Premiere',
    timestamp: new Date().toISOString(),
    readUrl: `/?manga=${manga.id}`,
    isRead: false,
    isFromFollowedCreator: true,
    creatorName: creatorDisplay,
  };

  saveNotificationToHistory(payload);

  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      const title = `✨ New Series Premiere by ${creatorDisplay}!`;
      const notificationOptions: NotificationOptions = {
        body: `"${manga.title}" has just launched on AZ OVERVERSE! Tap to explore.`,
        icon: manga.coverImage || APP_LOGO_SRC,
        badge: '/pwa-192x192.png',
        tag: `series-launch-${manga.id}`,
        data: {
          url: `/?manga=${manga.id}`,
        },
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, notificationOptions))
          .catch(() => {
            new Notification(title, notificationOptions);
          });
      } else {
        new Notification(title, notificationOptions);
      }
    } catch {
      // Ignore native notification restriction inside sandboxed iframes
    }
  }

  broadcastNotification(payload);
  return { success: true, deliveredCount: 1 };
}

export async function triggerTestChapterDropFcmPush(): Promise<ChapterDropNotificationPayload> {
  const sampleManga: Manga = {
    id: 'manga-1',
    title: 'The Spear of Shaka: Origins',
    japaneseTitle: 'シャカの槍',
    author: 'Sipho Zulu',
    artist: 'Nandi Dlamini',
    coverImage:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    bannerImage:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    genres: ['Action', 'Historical', 'Mythology'],
    status: 'ONGOING',
    synopsis: 'A warrior discovers an ancient spear blessed by ancestral spirits.',
    rating: 0,
    views: 0,
    bookmarksCount: 0,
    monetizationModel: 'hybrid',
    chapters: [],
  };

  const sampleChapter: Chapter = {
    id: `chap-${Date.now()}`,
    mangaId: 'manga-1',
    number: 14,
    title: 'Echoes of the Ancestral Thunder',
    releaseDate: 'Just Now',
    pageCount: 28,
    accessType: 'free',
    pages: [],
    likesCount: 0,
    commentsCount: 0,
  };

  await dispatchChapterDropPush(sampleManga, sampleChapter);

  return {
    id: `notif-${Date.now()}`,
    mangaId: sampleManga.id,
    mangaTitle: sampleManga.title,
    coverImage: sampleManga.coverImage,
    chapterNumber: sampleChapter.number,
    chapterTitle: sampleChapter.title,
    timestamp: new Date().toISOString(),
    readUrl: `/?manga=${sampleManga.id}&chapter=${sampleChapter.id}`,
  };
}
