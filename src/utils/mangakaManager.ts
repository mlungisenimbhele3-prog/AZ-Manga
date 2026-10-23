import { safeStorage } from './safeStorage';
import { MangakaApplication, MangakaStatus } from '../types';

const STORAGE_KEY = 'ka_pulse_mangaka_applications';

export const INITIAL_MANGAKA_APPLICATIONS: MangakaApplication[] = [
  {
    id: 'app-mangaka-1',
    userEmail: 'mlungisenimbhele3@gmail.com',
    legalName: 'Mlungiseni Mbhele',
    penName: 'Mbhele Studio',
    bio: 'Founder, lead author, and producer of AZ Oververse. Pioneering indigenous action manga with Shonen Jump pacing and Pan-African heritage.',
    idPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    portfolioUrl: 'https://artstation.com/mlungisenimbhele',
    country: 'South Africa',
    region: 'KwaZulu-Natal / Durban',
    primaryGenres: ['Action', 'Sci-Fi', 'Afro-Futurism', 'Shonen'],
    submittedAt: '2026-09-01T08:00:00.000Z',
    status: 'approved',
    reviewedAt: '2026-09-01T09:30:00.000Z',
    reviewedBy: 'Admin (System)',
    adminNotes: 'Executive creator verified with master publishing rights.',
  },
  {
    id: 'app-mangaka-2',
    userEmail: 'zola.dlamini@inkwarriors.co.za',
    legalName: 'Zola Dlamini',
    penName: 'Zola-Sensei',
    bio: 'Self-taught digital illustrator from Soweto. Creator of high-energy African battle manga with traditional Zulu warrior combat and mythic creatures.',
    idPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    portfolioUrl: 'https://instagram.com/zola_ink',
    country: 'South Africa',
    region: 'Gauteng / Johannesburg',
    primaryGenres: ['Action', 'Martial Arts', 'Folklore'],
    submittedAt: '2026-09-26T14:20:00.000Z',
    status: 'pending',
    adminNotes: 'ID document verified. Portfolio exhibits excellent dynamic line work and anatomy.',
  },
  {
    id: 'app-mangaka-3',
    userEmail: 'amara.okafor@lagosanimelab.ng',
    legalName: 'Amara Okafor',
    penName: 'Solaris Ink',
    bio: 'Lagos-based comic artist and animator. Working on a 5-chapter series exploring solar-powered mecha guarding sacred West African shrines.',
    idPhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    portfolioUrl: 'https://behance.net/amaraokafor',
    country: 'Nigeria',
    region: 'Lagos Island',
    primaryGenres: ['Sci-Fi', 'Cyberpunk', 'Mecha'],
    submittedAt: '2026-09-27T06:15:00.000Z',
    status: 'pending',
  },
];

export function getMangakaApplications(): MangakaApplication[] {
  const stored = safeStorage.getJSON<MangakaApplication[] | null>(STORAGE_KEY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    safeStorage.setJSON(STORAGE_KEY, INITIAL_MANGAKA_APPLICATIONS);
    return INITIAL_MANGAKA_APPLICATIONS;
  }
  return stored;
}

export function saveMangakaApplications(apps: MangakaApplication[]): void {
  safeStorage.setJSON(STORAGE_KEY, apps);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ka_pulse_mangaka_updated', { detail: apps }));
  }
}

export function getMangakaApplicationByEmail(email: string): MangakaApplication | null {
  const apps = getMangakaApplications();
  return apps.find((a) => a.userEmail.toLowerCase() === email.toLowerCase()) || null;
}

export function isUserApprovedMangaka(email: string): boolean {
  if (!email) return false;
  // Admin is always an approved mangaka
  const ADMIN_EMAILS = ['mlungisenimbhele3@gmail.com', 'azoververse@gmail.com'];
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  const app = getMangakaApplicationByEmail(email);
  return app?.status === 'approved';
}

export function submitMangakaApplication(
  data: Omit<MangakaApplication, 'id' | 'submittedAt' | 'status'>
): MangakaApplication {
  const apps = getMangakaApplications();
  const existingIdx = apps.findIndex((a) => a.userEmail.toLowerCase() === data.userEmail.toLowerCase());

  const newApp: MangakaApplication = {
    ...data,
    id: `app-mangaka-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };

  let updated: MangakaApplication[];
  if (existingIdx >= 0) {
    updated = [...apps];
    updated[existingIdx] = newApp;
  } else {
    updated = [newApp, ...apps];
  }

  saveMangakaApplications(updated);
  return newApp;
}

export function approveMangakaApplication(id: string, notes?: string): MangakaApplication | null {
  const apps = getMangakaApplications();
  const target = apps.find((a) => a.id === id);
  if (!target) return null;

  const updatedTarget: MangakaApplication = {
    ...target,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Admin (Mlungiseni Mbhele)',
    adminNotes: notes || target.adminNotes || 'Approved by Executive Producer for full publishing rights.',
  };

  const updated = apps.map((a) => (a.id === id ? updatedTarget : a));
  saveMangakaApplications(updated);
  return updatedTarget;
}

export function rejectMangakaApplication(id: string, reason?: string): MangakaApplication | null {
  const apps = getMangakaApplications();
  const target = apps.find((a) => a.id === id);
  if (!target) return null;

  const updatedTarget: MangakaApplication = {
    ...target,
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Admin (Mlungiseni Mbhele)',
    adminNotes: reason || 'Application needs more sample manga pages or higher resolution ID photo.',
  };

  const updated = apps.map((a) => (a.id === id ? updatedTarget : a));
  saveMangakaApplications(updated);
  return updatedTarget;
}
