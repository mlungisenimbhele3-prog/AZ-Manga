import { Manga, AdData, CreatorStats, AwardCategory, Comment } from '../types';
import { INITIAL_CREATOR_PAYOUT_SETTINGS } from './paymentData';

export const ADS_DATABASE: AdData[] = [];

export const INITIAL_CREATOR_STATS: CreatorStats = {
  totalRevenueUSD: 0,
  monthlyAdRevenue: 0,
  monthlySubShareRevenue: 0,
  totalReads: 0,
  adImpressions: 0,
  subscriberViews: 0,
  ecpm: 0,
  payoutSettings: INITIAL_CREATOR_PAYOUT_SETTINGS,
  payoutHistory: [],
};

export const NKOSI_COVER_SRC =
  '/assets/aistudio/862620681_1304598868406485_898394409428393681_n_8fa8ea5a.webp';

// Original Manga requested by user: "Nkosi the tale of Myths" (No panels inside -> Coming Soon)
export const NKOSI_MANGA: Manga = {
  id: 'nkosi-the-tale-of-myths',
  title: 'Nkosi the tale of Myths',
  japaneseTitle: 'ンコシ：神話の物語',
  author: 'Mlungiseni Mbhele',
  artist: 'Mlungiseni Mbhele & Studio Pulse',
  cover: NKOSI_COVER_SRC,
  coverImage: NKOSI_COVER_SRC,
  coverUrl: NKOSI_COVER_SRC,
  bannerImage: NKOSI_COVER_SRC,
  genres: ['Afro-Fantasy', 'Action', 'Fantasy', 'Shonen', 'Adventure'],
  status: 'ONGOING',
  synopsis: 'Born with the sacred lineage of mythical African deities and ancient kings, young Nkosi embarks on an epic odyssey through forgotten kingdoms to unravel celestial lore and protect the realm from mythological titans.',
  rating: 0,
  views: 0,
  bookmarksCount: 0,
  monetizationModel: 'hybrid',
  featured: true,
  isOriginal: true,
  isBackdrop: false,
  isCanvas: false,
  isComingSoon: true,
  approvalStatus: 'approved',
  publishedAt: '2026-10-22T08:00:00.000Z',
  submittedAt: '2026-10-22T08:00:00.000Z',
  createdAt: '2026-10-22T08:00:00.000Z',
  chapters: [], // No panels inside -> Coming Soon
};

// Backdrop Manga 1: "The Last Shaman of Zambezi" (No panels inside -> Coming Soon)
export const ZAMBEZI_MANGA: Manga = {
  id: 'last-shaman-of-zambezi',
  title: 'The Last Shaman of Zambezi',
  japaneseTitle: 'ザンベジの最後のシャーマン',
  author: 'Sipho Dlamini',
  artist: 'Kabelo M.',
  cover: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
  coverImage: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
  coverUrl: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
  bannerImage: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
  genres: ['Ancestral Horror', 'Afro-Fantasy', 'Fantasy', 'Adventure', 'Action', 'Supernatural'],
  status: 'ONGOING',
  synopsis: 'Deep within the thundering mists and towering baobabs of the Zambezi, ancient guardian spirits and ancestral masks awaken. A young shaman apprentice wielding the sacred feather staff must master ancestral lightning before the river falls silent.',
  rating: 0,
  views: 0,
  bookmarksCount: 0,
  monetizationModel: 'hybrid',
  featured: false,
  isOriginal: false,
  isBackdrop: true,
  isCanvas: true,
  isComingSoon: true,
  approvalStatus: 'approved',
  publishedAt: '2026-10-21T10:00:00.000Z',
  submittedAt: '2026-10-21T10:00:00.000Z',
  createdAt: '2026-10-21T10:00:00.000Z',
  chapters: [], // No panels inside -> Coming Soon
};

// Backdrop Manga 2: "Echoes of the Highveld" (No panels inside -> Coming Soon)
export const HIGHVELD_MANGA: Manga = {
  id: 'echoes-of-the-highveld',
  title: 'Echoes of the Highveld',
  japaneseTitle: 'ハイベルトの残響',
  author: 'Tendai Moyo',
  artist: 'Lindiwe Sithole',
  cover: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
  coverImage: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
  coverUrl: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
  bannerImage: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
  genres: ['Kasi-Punk', 'Sci-Fi', 'Adventure', 'Drama', 'Historical', 'Seinen'],
  status: 'ONGOING',
  synopsis: 'A journey through the plateau. Beneath radiant sunbeams breaking over rolling golden grasslands and ancient mountains, a lone traveler follows whispered winds to uncover the timeless echoes and lost memories of the Highveld.',
  rating: 0,
  views: 0,
  bookmarksCount: 0,
  monetizationModel: 'hybrid',
  featured: false,
  isOriginal: false,
  isBackdrop: true,
  isCanvas: true,
  isComingSoon: true,
  approvalStatus: 'approved',
  publishedAt: '2026-10-20T14:00:00.000Z',
  submittedAt: '2026-10-20T14:00:00.000Z',
  createdAt: '2026-10-20T14:00:00.000Z',
  chapters: [], // No panels inside -> Coming Soon
};

// Placeholder entry kept for backward compatibility
export const PLACEHOLDER_MANGA: Manga = {
  id: 'placeholder',
  title: 'No Manga Yet',
  japaneseTitle: 'AZ OVERVERSE',
  author: 'AZ Creator',
  artist: 'AZ Artist',
  cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  genres: ['Action', 'Fantasy'],
  status: 'ONGOING',
  synopsis: 'No manga uploaded yet. Publish your first original serialization on AZ Oververse!',
  rating: 0,
  views: 0,
  bookmarksCount: 0,
  monetizationModel: 'hybrid',
  featured: false,
  isOriginal: true,
  approvalStatus: 'approved',
  publishedAt: '2026-10-10T12:00:00.000Z',
  submittedAt: '2026-10-10T12:00:00.000Z',
  createdAt: '2026-10-10T12:00:00.000Z',
  chapters: [],
};

// Initial manga list containing Nkosi the tale of Myths (Original) and two Backdrop series
export const INITIAL_MANGA_LIST: Manga[] = [
  NKOSI_MANGA,
  ZAMBEZI_MANGA,
  HIGHVELD_MANGA,
];

export const MOTY_CATEGORIES: AwardCategory[] = [
  {
    id: 'grand-prix',
    title: 'AZ Oververse Manga of the Year Grand Prix',
    subtitle: 'The supreme honor in original manga publishing',
    year: 2026,
    winnerMangaId: 'nkosi-the-tale-of-myths',
    winnerCitation: 'Awarded for groundbreaking original storytelling, unmatched visual cadence, and world-building.',
    nominees: [
      { mangaId: 'nkosi-the-tale-of-myths', nominationReason: 'Pioneering African mythological epic & cultural resonance', votes: 0 },
      { mangaId: 'last-shaman-of-zambezi', nominationReason: 'Stunning supernatural folklore and spiritual world-building', votes: 0 },
      { mangaId: 'echoes-of-the-highveld', nominationReason: 'Visionary African cyberpunk aesthetics and narrative depth', votes: 0 },
    ],
  },
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    mangaId: 'nkosi-the-tale-of-myths',
    userId: 'u-user1',
    userName: 'AZ_Reader',
    text: 'So excited for Nkosi the tale of Myths! The character designs look legendary! 🔥👑',
    timestamp: new Date().toISOString(),
    chapterNumber: 1,
    userBadge: 'VIP Reader',
    likes: 0,
  },
  {
    id: 'comm-2',
    mangaId: 'last-shaman-of-zambezi',
    userId: 'u-user2',
    userName: 'Pulse_Fan',
    text: 'Can not wait for The Last Shaman of Zambezi panels! Zambezi folklore in manga form is a dream come true.',
    timestamp: new Date().toISOString(),
    chapterNumber: 1,
    userBadge: 'VIP Reader',
    likes: 0,
  },
];
