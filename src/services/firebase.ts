// Firebase Core, Auth & Hardened Firestore Integration for AZ OVERVERSE
// Produced by Mlungiseni Mbhele
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

// Prevent internal WebChannel 10s offline fallback notices from triggering runtime error overlays
// when readers use the PWA on high-latency mobile networks or in offline mode.
// Explicit security/permission errors are still logged and thrown via handleFirestoreError().
setLogLevel('silent');

export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

function createFirestoreInstance(firebaseApp: FirebaseApp): Firestore {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(
        firebaseApp,
        {
          // Force HTTP long-polling in browser/iframe/mobile-proxy environments so buffered
          // WebChannel streams never hang for 10 seconds waiting on an open chunked response.
          experimentalForceLongPolling: true,
          experimentalLongPollingOptions: {
            timeoutSeconds: 15,
          },
          ignoreUndefinedProperties: true,
        },
        databaseId
      );
    } catch {
      // Instance was already initialized (e.g., during module re-evaluation)
      return getFirestore(firebaseApp, databaseId);
    }
  }
  return getFirestore(firebaseApp, databaseId);
}

export const db: Firestore = createFirestoreInstance(app);

const configuredRtdbUrl = (firebaseConfig as Record<string, unknown>).databaseURL;
export const rtdb: Database | null =
  typeof configuredRtdbUrl === 'string' && configuredRtdbUrl.length > 0
    ? getDatabase(app)
    : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const FIREBASE_WEB_CLIENT_ID =
  firebaseConfig.oAuthClientId ||
  '197009931605-p16sjppjk069g41lt740g920k9cb9m8s.apps.googleusercontent.com';

interface OververseNativeAuthBridge {
  signInWithGoogle: () => void;
  getWebClientId?: () => string;
}

declare global {
  interface Window {
    OververseNativeAuth?: OververseNativeAuthBridge;
    __onOververseNativeGoogleToken?: (idToken: string, email?: string) => void;
    __onOververseNativeGoogleError?: (errorMessage: string) => void;
  }
}

export function hasAndroidNativeGoogleAuth(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.OververseNativeAuth && typeof window.OververseNativeAuth.signInWithGoogle === 'function')
  );
}

export function isEmbeddedAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  return /;\s*wv\)/i.test(ua) || (/Android/i.test(ua) && /Version\/\d+\.\d+/i.test(ua) && !/Firefox/i.test(ua));
}

/**
 * Verifies a Google ID Token with the OVERVERSE backend and signs into Firebase Auth
 * via GoogleAuthProvider.credential(idToken) without opening accounts.google.com in WebView.
 */
export async function signInToOververseWithToken(idToken: string): Promise<FirebaseUser> {
  const trimmedToken = (idToken || '').trim();
  if (!trimmedToken) {
    throw new Error('Missing Google ID token from Credential Manager.');
  }

  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: trimmedToken }),
    });
    if (response.status === 401) {
      throw new Error('Google ID token rejected by OVERVERSE verification service.');
    }
  } catch (err: any) {
    if (err?.message?.includes('rejected by OVERVERSE')) {
      throw err;
    }
    // Non-blocking when running from offline bundled Capacitor assets; Firebase verifies the JWT signature directly
  }

  const googleCredential = GoogleAuthProvider.credential(trimmedToken);
  const userCredential = await signInWithCredential(auth, googleCredential);
  return userCredential.user;
}

let pendingNativeSignInPromise: Promise<FirebaseUser> | null = null;

/**
 * Unified Google Sign-In for AZ OVERVERSE:
 * - On Android (StudioActivity / MainActivity): launches native AndroidX CredentialManager
 *   (GetGoogleIdOption + GoogleIdTokenCredential) and exchanges the ID token — NEVER opens
 *   https://accounts.google.com inside WebView.
 * - On standard Web browsers: uses Firebase GoogleAuthProvider popup.
 */
export async function authenticateWithOververseGoogle(): Promise<FirebaseUser> {
  if (hasAndroidNativeGoogleAuth()) {
    if (pendingNativeSignInPromise) {
      return pendingNativeSignInPromise;
    }

    pendingNativeSignInPromise = new Promise<FirebaseUser>((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('Google Sign-In timed out. Please try again.'));
        }
      }, 90000);

      const handleTokenEvent = async (event: Event) => {
        const customEvent = event as CustomEvent<{ idToken?: string }>;
        const token = customEvent.detail?.idToken;
        if (!token || settled) return;
        settled = true;
        cleanup();
        try {
          const user = await signInToOververseWithToken(token);
          resolve(user);
        } catch (err) {
          reject(err);
        }
      };

      const handleErrorEvent = (event: Event) => {
        if (settled) return;
        settled = true;
        cleanup();
        const customEvent = event as CustomEvent<{ error?: string }>;
        reject(new Error(customEvent.detail?.error || 'Google Sign-In cancelled or failed.'));
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener('oververse_native_google_token', handleTokenEvent);
        window.removeEventListener('oververse_native_google_error', handleErrorEvent);
        pendingNativeSignInPromise = null;
      };

      window.addEventListener('oververse_native_google_token', handleTokenEvent);
      window.addEventListener('oververse_native_google_error', handleErrorEvent);

      try {
        window.OververseNativeAuth!.signInWithGoogle();
      } catch (err) {
        settled = true;
        cleanup();
        reject(err);
      }
    });

    return pendingNativeSignInPromise;
  }

  // Prevent opening https://accounts.google.com inside any embedded Android WebView
  if (isEmbeddedAndroidWebView()) {
    throw new Error(
      'WebView Google Sign-In is disabled for security. Please use the latest AZ OVERVERSE Android app with native Google Credential Manager.'
    );
  }

  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isPermissionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return msg.includes('missing or insufficient permissions') || msg.includes('permission-denied');
}

function hasProvisionedFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== 'remixed-project-id' &&
      firebaseConfig.appId &&
      firebaseConfig.firestoreDatabaseId
  );
}

async function testConnection() {
  if (!hasProvisionedFirebaseConfig()) {
    console.error('Please check your Firebase configuration.');
    return;
  }

  // Skip remote probe if the browser explicitly reports offline mode (PWA offline reading)
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // If browser went offline mid-flight or hit a transient mobile network drop while config is valid,
      // retry once after a short backoff and degrade gracefully to offline cache mode.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return;
      }
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (retryError) {
        const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
        if (retryMsg.includes('the client is offline') && !hasProvisionedFirebaseConfig()) {
          console.error('Please check your Firebase configuration.');
        } else if (retryMsg.includes('the client is offline')) {
          console.info(
            '[OVERVERSE Firebase] Operating in offline-resilient mode until network connectivity stabilizes.'
          );
        }
      }
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
};

export type { FirebaseUser };

export async function clearMangasCollectionInFirestore() {
  const path = 'mangas';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db, path, document.id))
    );
    await Promise.all(deletePromises);
  } catch (e) {
    if (isPermissionError(e)) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
    console.warn('Firestore offline or not fully provisioned yet.', e);
  }
}
