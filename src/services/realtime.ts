// Firebase Realtime DB Service Stub for AZ OVERVERSE
import { rtdb } from './firebase';

export const syncRealtimeReadingPresence = (mangaId: string, userId: string) => {
  if (!rtdb) return;
  console.log(`[Firebase Realtime DB]: User ${userId} reading manga ${mangaId}`);
};
