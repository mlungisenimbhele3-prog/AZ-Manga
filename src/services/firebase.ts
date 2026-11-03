// Zero-Firebase Local Compatibility Layer for AZ OVERVERSE
// Authentication is handled 100% by AZ OVERVERSE Custom Auth (PostgreSQL + JWT + bcrypt + Resend)
// in /src/services/oververseAuth.ts and /src/server/authRoutes.ts.
// No Firebase, No Firestore, No Supabase Auth SDKs are imported or initialized here.

import { getOververseAuthSnapshot, subscribeToOververseAuth } from './oververseAuth';

export interface LocalAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: Array<{ providerId: string; email: string | null }>;
}

export type FirebaseUser = LocalAuthUser;

function buildLocalAuthUser(): LocalAuthUser | null {
  const u = getOververseAuthSnapshot().user;
  if (!u) return null;
  return {
    uid: u.id,
    email: u.email,
    displayName: u.pen_name,
    photoURL: u.avatar_url,
    emailVerified: u.email_verified,
    isAnonymous: false,
    tenantId: null,
    providerData: [{ providerId: 'oververse-jwt', email: u.email }],
  };
}

export const auth = {
  get currentUser(): LocalAuthUser | null {
    return buildLocalAuthUser();
  },
};

export const db: Record<string, never> = {};
export const rtdb = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function isPermissionError(_error: unknown): boolean {
  return false;
}

export function handleFirestoreError(
  error: unknown,
  _operationType: OperationType,
  _path: string | null
): never {
  throw error instanceof Error ? error : new Error(String(error));
}

export function onAuthStateChanged(
  _authObj: unknown,
  callback: (user: LocalAuthUser | null) => void
): () => void {
  return subscribeToOververseAuth(() => {
    callback(buildLocalAuthUser());
  });
}

export function collection(_dbObj: unknown, ...segments: string[]) {
  return { path: segments.join('/') };
}

export function doc(_dbObj: unknown, ...segments: string[]) {
  return { id: segments[segments.length - 1] || '', path: segments.join('/') };
}

export function query(target: unknown, ..._constraints: unknown[]) {
  return target;
}

export function where(_field: string, _op: string, _value: unknown) {
  return {};
}

export function orderBy(_field: string, _dir?: string) {
  return {};
}

export function limit(_count: number) {
  return {};
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function onSnapshot(
  _target: unknown,
  _onNext: (snapshot: {
    docs: Array<{ id: string; data: () => Record<string, any> }>;
    forEach: (cb: (docSnap: { id: string; data: () => Record<string, any> }) => void) => void;
  }) => void,
  _onError?: (err: Error) => void
): () => void {
  // No-op: local safeStorage store in ratingService & chapterCommentService handles persistence directly
  return () => {};
}

export async function setDoc(_ref: unknown, _data: unknown, _options?: unknown): Promise<void> {}
export async function updateDoc(_ref: unknown, _data: unknown): Promise<void> {}
export async function deleteDoc(_ref: unknown): Promise<void> {}
export async function getDoc(_ref: unknown) {
  return { exists: () => false, data: () => undefined };
}
export async function getDocs(_q: unknown) {
  return { docs: [] as Array<{ id: string; data: () => Record<string, any> }> };
}
export async function runTransaction<T>(
  _dbObj: unknown,
  updateFn: (tx: {
    get: (_ref: unknown) => Promise<{ exists: () => boolean; data: () => Record<string, any> | undefined }>;
    set: (_ref: unknown, _data: unknown, _opts?: unknown) => void;
    update: (_ref: unknown, _data: unknown) => void;
    delete: (_ref: unknown) => void;
  }) => Promise<T>
): Promise<T> {
  return updateFn({
    get: async () => ({ exists: () => false, data: () => undefined }),
    set: () => {},
    update: () => {},
    delete: () => {},
  });
}

export async function clearMangasCollectionInFirestore(): Promise<void> {}
