import {
  DbAward,
  DbChapter,
  DbComment,
  DbIssue,
  DbManga,
  DbPageView,
} from './schema.ts';
import { getSeedReleaseDay, normalizeReleaseDay } from '../utils/releaseSchedule.ts';

export interface DevLayeredStore {
  mangas: Map<string, DbManga>;
  chapters: Map<string, DbChapter>;
  comments: Map<string, DbComment>;
  pageViews: DbPageView[];
  userFollowedManga: Map<string, string[]>;
  creatorFollows: Map<string, Set<string>>;
  issue: DbIssue;
  award: DbAward;
}

declare global {
  var _oververseDevLayeredStore: DevLayeredStore | undefined;
}

function createInitialStore(): DevLayeredStore {
  const now = new Date();
  const mangas = new Map<string, DbManga>();

  const seeds: Array<{
    id: string;
    creatorId: string;
    creatorEmail: string;
    title: string;
    synopsis: string;
    coverUrl: string;
    genres: string;
    type: 'original' | 'backdrop';
    releaseDay: string;
  }> = [
    {
      id: 'nkosi-the-tale-of-myths',
      creatorId: 'creator-mlungiseni-mbhele',
      creatorEmail: 'mlungisenimbhele3@gmail.com',
      title: 'Nkosi the tale of Myths',
      synopsis:
        'Born with the sacred lineage of mythical African deities and ancient kings, young Nkosi embarks on an epic odyssey through forgotten kingdoms to unravel celestial lore and protect the realm from mythological titans.',
      coverUrl:
        '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
      genres: JSON.stringify(['Afro-Fantasy', 'Action', 'Fantasy', 'Shonen', 'Adventure']),
      type: 'original',
      releaseDay: 'WED',
    },
    {
      id: 'last-shaman-of-zambezi',
      creatorId: 'creator-sipho-dlamini',
      creatorEmail: 'sipho@azoververse.com',
      title: 'The Last Shaman of Zambezi',
      synopsis:
        'Deep within the thundering mists and towering baobabs of the Zambezi, ancient guardian spirits and ancestral masks awaken. A young shaman apprentice wielding the sacred feather staff must master ancestral lightning before the river falls silent.',
      coverUrl:
        '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
      genres: JSON.stringify([
        'Ancestral Horror',
        'Afro-Fantasy',
        'Fantasy',
        'Adventure',
        'Action',
        'Supernatural',
      ]),
      type: 'backdrop',
      releaseDay: 'FRI',
    },
    {
      id: 'echoes-of-the-highveld',
      creatorId: 'creator-tendai-moyo',
      creatorEmail: 'tendai@azoververse.com',
      title: 'Echoes of the Highveld',
      synopsis:
        'A journey through the plateau. Beneath radiant sunbeams breaking over rolling golden grasslands and ancient mountains, a lone traveler follows whispered winds to uncover the timeless echoes and lost memories of the Highveld.',
      coverUrl:
        '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
      genres: JSON.stringify([
        'Kasi-Punk',
        'Sci-Fi',
        'Adventure',
        'Drama',
        'Historical',
        'Seinen',
      ]),
      type: 'backdrop',
      releaseDay: 'SUN',
    },
  ];

  for (const s of seeds) {
    mangas.set(s.id, {
      id: s.id,
      creatorId: s.creatorId,
      creatorEmail: s.creatorEmail,
      title: s.title,
      synopsis: s.synopsis,
      coverUrl: s.coverUrl,
      genres: s.genres,
      ageRating: '13+',
      language: 'English',
      type: s.type,
      releaseDay: normalizeReleaseDay(s.releaseDay, getSeedReleaseDay(s.id)),
      status: 'Coming Soon',
      approvalStatus: 'approved',
      views: 0,
      totalViewsCached: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    mangas,
    chapters: new Map<string, DbChapter>(),
    comments: new Map<string, DbComment>(),
    pageViews: [],
    userFollowedManga: new Map<string, string[]>(),
    creatorFollows: new Map<string, Set<string>>(),
    issue: {
      id: 'issue-01-launch',
      issueNumber: 1,
      editionLabel: 'ISSUE #01 • NOVEMBER 2026 • LAUNCH EDITION',
      headline: 'Weekly AZ Stories • Launch Week',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    award: {
      id: 'moty-season-1',
      year: 2026,
      title: 'Manga of the Year Awards — Coming Soon',
      subtitle: 'Voting opens after our first season. Stay tuned.',
      status: 'coming_soon',
      winnerMangaId: null,
      winnerCitation: null,
      votesCount: 0,
      updatedAt: now,
    },
  };
}

export function getDevLayeredStore(): DevLayeredStore {
  if (!global._oververseDevLayeredStore) {
    global._oververseDevLayeredStore = createInitialStore();
  }
  return global._oververseDevLayeredStore;
}
