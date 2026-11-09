import { safeStorage } from '../utils/safeStorage';
import { getCurrentUserProfile, saveCurrentUserProfile } from './userProfile';

export type ReportReason =
  | 'Spam'
  | 'Harassment / Bullying'
  | 'Sexual Content'
  | 'Hate Speech'
  | 'Other';

export interface SafetyReport {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  messageId?: string | null;
  messageText?: string | null;
  reason: ReportReason | string;
  details?: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

const STORAGE_KEY_REPORTS = 'az_oververse_reports_v1';
const STORAGE_KEY_BLOCKED_USERS = 'az_oververse_blocked_users_v1';

export interface BlockedUserInfo {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
  blockedAt: string;
}

const STORAGE_KEY_BLOCKED_METADATA = 'az_oververse_blocked_metadata_v1';

/**
 * Submit a report for a message or user.
 * Persists to reports collection with status = 'pending'.
 */
export async function submitSafetyReport(params: {
  reporterUserId?: string;
  reportedUserId: string;
  messageId?: string | null;
  messageText?: string | null;
  reason: ReportReason | string;
  details?: string;
}): Promise<SafetyReport> {
  const profile = getCurrentUserProfile();
  const reporterId = params.reporterUserId || profile.uid || 'anonymous-reporter';

  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const report: SafetyReport = {
    id: reportId,
    reporterUserId: reporterId,
    reportedUserId: params.reportedUserId,
    messageId: params.messageId || null,
    messageText: params.messageText || null,
    reason: params.reason,
    details: params.details?.trim() || '',
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  // 1. Persist to local cache for instant zero-latency feedback & offline capability
  const existingReports = safeStorage.getJSON<SafetyReport[]>(STORAGE_KEY_REPORTS, []) || [];
  const updatedReports = [report, ...existingReports];
  safeStorage.setJSON(STORAGE_KEY_REPORTS, updatedReports);

  // 2. Dispatch event for UI toasts/listeners
  try {
    window.dispatchEvent(
      new CustomEvent('az_safety_report_submitted', { detail: { report } })
    );
  } catch (e) {
    // ignore in non-browser env
  }

  return report;
}

/**
 * Retrieve all reports (Admin use)
 */
export function getAllSafetyReports(): SafetyReport[] {
  return safeStorage.getJSON<SafetyReport[]>(STORAGE_KEY_REPORTS, []) || [];
}

/**
 * Resolve or dismiss a report (Admin use)
 */
export function updateReportStatus(
  reportId: string,
  newStatus: 'resolved' | 'dismissed'
): void {
  const reports = getAllSafetyReports();
  const updated = reports.map((r) =>
    r.id === reportId ? { ...r, status: newStatus } : r
  );
  safeStorage.setJSON(STORAGE_KEY_REPORTS, updated);
}

/**
 * Check if a specific user is blocked by the current user.
 */
export function isUserBlocked(userId: string): boolean {
  if (!userId) return false;
  const profile = getCurrentUserProfile();
  const list = profile.blockedUsers || safeStorage.getJSON<string[]>(STORAGE_KEY_BLOCKED_USERS, []) || [];
  return list.includes(userId);
}

/**
 * Get list of blocked user IDs.
 */
export function getBlockedUserIds(): string[] {
  const profile = getCurrentUserProfile();
  const fromProfile = profile.blockedUsers || [];
  const fromStorage = safeStorage.getJSON<string[]>(STORAGE_KEY_BLOCKED_USERS, []) || [];
  const merged = Array.from(new Set([...fromProfile, ...fromStorage]));
  return merged;
}

/**
 * Get metadata for all blocked users to show in Settings > Blocked Users.
 */
export function getBlockedUsersList(): BlockedUserInfo[] {
  const ids = getBlockedUserIds();
  const metaMap = safeStorage.getJSON<Record<string, BlockedUserInfo>>(
    STORAGE_KEY_BLOCKED_METADATA,
    {}
  ) || {};

  return ids.map((id) => {
    if (metaMap[id]) return metaMap[id];
    return {
      id,
      name: id.startsWith('c-') ? `Contact ${id}` : `User ${id.slice(0, 8)}`,
      handle: `@${id}`,
      blockedAt: new Date().toLocaleDateString(),
    };
  });
}

/**
 * Block another user.
 * - Stores in user document > blockedUsers
 * - Dispatches 'az_user_blocked' event
 */
export function blockUser(targetUser: {
  id: string;
  name?: string;
  handle?: string;
  avatar?: string;
}): void {
  if (!targetUser?.id) return;
  const targetId = targetUser.id;

  const currentProfile = getCurrentUserProfile();
  const existingBlocked = currentProfile.blockedUsers || [];
  if (!existingBlocked.includes(targetId)) {
    const updatedBlocked = [...existingBlocked, targetId];
    currentProfile.blockedUsers = updatedBlocked;
    saveCurrentUserProfile(currentProfile);

    // Sync storage key
    safeStorage.setJSON(STORAGE_KEY_BLOCKED_USERS, updatedBlocked);

    // Save metadata
    const metaMap = safeStorage.getJSON<Record<string, BlockedUserInfo>>(
      STORAGE_KEY_BLOCKED_METADATA,
      {}
    ) || {};
    metaMap[targetId] = {
      id: targetId,
      name: targetUser.name || `User ${targetId}`,
      handle: targetUser.handle || `@${targetId}`,
      avatar: targetUser.avatar,
      blockedAt: new Date().toLocaleDateString(),
    };
    safeStorage.setJSON(STORAGE_KEY_BLOCKED_METADATA, metaMap);
  }

  try {
    window.dispatchEvent(
      new CustomEvent('az_user_blocked', { detail: { userId: targetId } })
    );
  } catch (e) {}
}

/**
 * Unblock a user.
 */
export function unblockUser(targetUserId: string): void {
  if (!targetUserId) return;

  const currentProfile = getCurrentUserProfile();
  const existingBlocked = currentProfile.blockedUsers || [];
  const updatedBlocked = existingBlocked.filter((id) => id !== targetUserId);
  currentProfile.blockedUsers = updatedBlocked;
  saveCurrentUserProfile(currentProfile);

  safeStorage.setJSON(STORAGE_KEY_BLOCKED_USERS, updatedBlocked);

  const metaMap = safeStorage.getJSON<Record<string, BlockedUserInfo>>(
    STORAGE_KEY_BLOCKED_METADATA,
    {}
  ) || {};
  delete metaMap[targetUserId];
  safeStorage.setJSON(STORAGE_KEY_BLOCKED_METADATA, metaMap);

  try {
    window.dispatchEvent(
      new CustomEvent('az_user_unblocked', { detail: { userId: targetUserId } })
    );
  } catch (e) {}
}
