// Firebase Core & Auth & Firestore Integration for AZ OVERVERSE
// Produced by Mlungiseni Mbhele
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

// Configuration targeting the user's project: ai-studio-remixazoververse-648a4769-f458-4b18-9f3a-ffcf58ba714f
const firebaseConfig = {
  projectId: "ai-studio-remixazoververse-648a4769-f458-4b18-9f3a-ffcf58ba714f",
  appId: "1:197009931605:web:44f5316bd7a009fb0883dc",
  apiKey: "AIzaSyAxRhD8LHsjb4JNqzZfEpgXYzsSeVRVbSo",
  authDomain: "ai-studio-remixazoververse.firebaseapp.com",
  storageBucket: "ai-studio-remixazoververse.appspot.com",
  messagingSenderId: "197009931605",
  databaseURL: "https://ai-studio-remixazoververse-default-rtdb.firebaseio.com",
};

export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  onSnapshot,
};

export type { FirebaseUser };

// Helper to reset / clear mangas collection in Firestore if needed
export async function clearMangasCollectionInFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "mangas"));
    const deletePromises = querySnapshot.docs.map((document) => deleteDoc(doc(db, "mangas", document.id)));
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn("Firestore offline or not fully provisioned yet.", e);
  }
}
