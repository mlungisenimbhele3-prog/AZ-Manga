import { safeStorage } from './safeStorage';

export interface StreakMilestone {
  id: string;
  name: string;
  days: number;
  unlocked: boolean;
  unlockedDate?: string;
  badge: string; // Emoji / Icon badge
  rewardPerk: string;
  tierColor: string;
}

export interface DailyGoalReward {
  id: string;
  date: string; // YYYY-MM-DD
  streakDays: number;
  bonusCoins: number;
  bonusXp: number;
  rewardTitle: string;
  rewardSubtitle: string;
  badge: string; // '🔥' | '⚡' | '🌟' | '👑' | '💎'
  claimed: boolean;
  claimedAt?: string;
  isMilestoneBonus?: boolean;
  milestoneTitle?: string;
}

export interface ReadingStreakData {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string; // YYYY-MM-DD
  todayRead: boolean;
  dailyChaptersToday: number;
  dailyGoalTarget?: number; // Daily chapter goal, default 1
  dailyGoalRewardClaimedToday?: boolean; // Whether today's streak bonus has been claimed
  totalChaptersRead: number;
  totalReadingDays: number;
  readHistory: string[]; // List of YYYY-MM-DD dates
  tierTitle: string; // 'Flame Starter' | 'Blaze Reader' | 'Inferno Scholar' | 'Phoenix Master' | 'Centurion Legend'
  streakFreezeAvailable: number; // Streak protection freezes
  milestones: StreakMilestone[];
  lastReadChapterTitle?: string;
  lastReadTimestamp?: string;
  userCoinsBalance: number;
  lastClaimedRewardDate?: string;
  recentRewards: DailyGoalReward[];
}

const STORAGE_KEY = 'ka_pulse_reading_streak';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, '0');
  const d = String(yesterday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysBetween(dateStrA: string, dateStrB: string): number {
  if (!dateStrA || !dateStrB) return 999;
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const dateA = new Date(y1, m1 - 1, d1);
  const dateB = new Date(y2, m2 - 1, d2);
  const diffTime = dateB.getTime() - dateA.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export const DEFAULT_MILESTONES: StreakMilestone[] = [
  {
    id: 'streak-1',
    name: 'First Spark',
    days: 1,
    unlocked: true,
    unlockedDate: '2026-09-22',
    badge: '🔥',
    rewardPerk: 'Spark Badge + 20 Pulse Coins',
    tierColor: 'from-amber-600 to-orange-600',
  },
  {
    id: 'streak-3',
    name: 'Spark of Habit',
    days: 3,
    unlocked: true,
    unlockedDate: '2026-09-24',
    badge: '⚡',
    rewardPerk: 'Bronze Reader Badge + 50 Pulse Coins',
    tierColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'streak-5',
    name: 'Torchbearer',
    days: 5,
    unlocked: false,
    badge: '🌟',
    rewardPerk: 'Amber Torch Badge + 75 Pulse Coins',
    tierColor: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'streak-7',
    name: 'Weekly Blaze',
    days: 7,
    unlocked: false,
    badge: '✨',
    rewardPerk: 'Silver Reader Crown + 100 Coins & +1 Streak Shield Freeze',
    tierColor: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'streak-10',
    name: 'Iron Reader',
    days: 10,
    unlocked: false,
    badge: '🛡️',
    rewardPerk: 'Iron Reader Crest + 150 Pulse Coins',
    tierColor: 'from-slate-400 to-blue-500',
  },
  {
    id: 'streak-14',
    name: 'Fortnight Inferno',
    days: 14,
    unlocked: false,
    badge: '🌋',
    rewardPerk: 'Gold Reader Flame + Ad-Free Weekend Pass + 200 Coins',
    tierColor: 'from-orange-500 to-red-500',
  },
  {
    id: 'streak-21',
    name: 'Habit Vanguard',
    days: 21,
    unlocked: false,
    badge: '⚔️',
    rewardPerk: 'Vanguard Crest + 300 Pulse Coins',
    tierColor: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'streak-30',
    name: 'Monthly Titan',
    days: 30,
    unlocked: false,
    badge: '👑',
    rewardPerk: 'Exclusive Monthly Manga Box + VIP Patron Title + 500 Coins',
    tierColor: 'from-purple-500 to-pink-500',
  },
  {
    id: 'streak-60',
    name: 'Phoenix Sovereign',
    days: 60,
    unlocked: false,
    badge: '💎',
    rewardPerk: 'Permanent Diamond Badge + Creator Tipping Multiplier + 1000 Coins',
    tierColor: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'streak-100',
    name: 'Centurion Legend',
    days: 100,
    unlocked: false,
    badge: '🏆',
    rewardPerk: 'Hall of Fame Profile Trophy + MOTY VIP Voting Rights + 2500 Coins',
    tierColor: 'from-amber-300 via-yellow-400 to-amber-600',
  },
];

export function getStreakTier(streakDays: number): string {
  if (streakDays >= 60) return 'Phoenix Sovereign';
  if (streakDays >= 30) return 'Monthly Titan';
  if (streakDays >= 14) return 'Inferno Scholar';
  if (streakDays >= 7) return 'Blaze Reader';
  if (streakDays >= 3) return 'Flame Starter';
  return 'Spark Reader';
}

function getInitialStreakData(): ReadingStreakData {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Create a realistic 4-day existing streak ending yesterday so user is prompted to read today to hit day 5!
  const dMinus2 = new Date();
  dMinus2.setDate(dMinus2.getDate() - 2);
  const d2Str = `${dMinus2.getFullYear()}-${String(dMinus2.getMonth() + 1).padStart(2, '0')}-${String(dMinus2.getDate()).padStart(2, '0')}`;

  const dMinus3 = new Date();
  dMinus3.setDate(dMinus3.getDate() - 3);
  const d3Str = `${dMinus3.getFullYear()}-${String(dMinus3.getMonth() + 1).padStart(2, '0')}-${String(dMinus3.getDate()).padStart(2, '0')}`;

  const dMinus4 = new Date();
  dMinus4.setDate(dMinus4.getDate() - 4);
  const d4Str = `${dMinus4.getFullYear()}-${String(dMinus4.getMonth() + 1).padStart(2, '0')}-${String(dMinus4.getDate()).padStart(2, '0')}`;

  return {
    currentStreak: 4,
    longestStreak: 12,
    lastReadDate: yesterday,
    todayRead: false,
    dailyChaptersToday: 0,
    totalChaptersRead: 42,
    totalReadingDays: 28,
    readHistory: [d4Str, d3Str, d2Str, yesterday],
    tierTitle: 'Flame Starter',
    streakFreezeAvailable: 1,
    milestones: DEFAULT_MILESTONES.map((m) => ({
      ...m,
      unlocked: m.days <= 4,
      unlockedDate: m.days <= 4 ? dMinus2.toISOString() : undefined,
    })),
    lastReadChapterTitle: 'Chapter 1: The Gathering Tempest',
    lastReadTimestamp: new Date(Date.now() - 86400000).toISOString(),
    userCoinsBalance: 120,
    lastClaimedRewardDate: yesterday,
    recentRewards: [
      {
        id: 'reward-yesterday',
        date: yesterday,
        streakDays: 4,
        bonusCoins: 45,
        bonusXp: 90,
        rewardTitle: 'Day 4 Streak Secured!',
        rewardSubtitle: 'Daily reading goal met: +45 Pulse Coins',
        badge: '🔥',
        claimed: true,
        claimedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
}

/**
 * Retrieves the current reading streak data, evaluating whether the streak is intact
 */
export function getReadingStreak(): ReadingStreakData {
  const saved = safeStorage.getJSON<ReadingStreakData | null>(STORAGE_KEY, null);
  const today = getTodayDateString();

  if (!saved) {
    const initial = getInitialStreakData();
    initial.dailyGoalTarget = 1;
    initial.dailyGoalRewardClaimedToday = false;
    safeStorage.setJSON(STORAGE_KEY, initial);
    return initial;
  }

  // Calculate day difference between last read and today
  const daysDiff = getDaysBetween(saved.lastReadDate, today);

  let updated = { ...saved };
  let hasChanged = false;

  // Ensure dailyGoalTarget exists
  if (typeof updated.dailyGoalTarget !== 'number') {
    updated.dailyGoalTarget = 1;
    hasChanged = true;
  }

  // Ensure milestones includes all current DEFAULT_MILESTONES
  if (!updated.milestones || updated.milestones.length < DEFAULT_MILESTONES.length) {
    const existingMap = new Map((updated.milestones || []).map((m) => [m.id, m]));
    updated.milestones = DEFAULT_MILESTONES.map((dm) => {
      const existing = existingMap.get(dm.id);
      if (existing) {
        return {
          ...dm,
          unlocked: existing.unlocked || updated.currentStreak >= dm.days,
          unlockedDate: existing.unlockedDate || (updated.currentStreak >= dm.days ? new Date().toISOString() : undefined),
        };
      }
      return {
        ...dm,
        unlocked: updated.currentStreak >= dm.days,
        unlockedDate: updated.currentStreak >= dm.days ? new Date().toISOString() : undefined,
      };
    });
    hasChanged = true;
  }

  if (daysDiff === 0) {
    // Read today!
    if (!updated.todayRead) {
      updated.todayRead = true;
      hasChanged = true;
    }
  } else if (daysDiff === 1) {
    // Read yesterday; streak is alive, today is pending
    if (updated.todayRead) {
      updated.todayRead = false;
      updated.dailyChaptersToday = 0;
      hasChanged = true;
    }
  } else if (daysDiff > 1) {
    // Missed at least one day.
    // Check if streak freeze is available
    if (updated.streakFreezeAvailable > 0 && daysDiff === 2) {
      // Automatic streak freeze used!
      updated.streakFreezeAvailable -= 1;
      updated.todayRead = false;
      updated.dailyChaptersToday = 0;
      hasChanged = true;
    } else {
      // Streak broken
      if (updated.currentStreak > 0) {
        updated.currentStreak = 0;
        updated.todayRead = false;
        updated.dailyChaptersToday = 0;
        hasChanged = true;
      }
    }
  }

  updated.dailyGoalRewardClaimedToday = updated.lastClaimedRewardDate === today;
  updated.tierTitle = getStreakTier(updated.currentStreak);

  if (hasChanged) {
    safeStorage.setJSON(STORAGE_KEY, updated);
  }

  return updated;
}

/**
 * Calculates the coins and XP bonus awarded for a given consecutive day streak
 * Scales from +33 to +825 coins (Day 1: 33, Day 25+: 825)
 */
export function calculateDailyStreakBonus(streakDays: number): {
  coins: number;
  xp: number;
  badge: string;
  title: string;
} {
  const safeStreak = Math.max(1, streakDays);
  // User specification: Daily streak coins scale from +33 to +825
  const coins = Math.min(825, Math.max(33, safeStreak * 33));
  const xp = 40 + safeStreak * 12;

  let badge = '🔥';
  let title = 'Daily Spark Bonus';

  if (safeStreak >= 100) {
    badge = '🏆';
    title = 'Centurion Titan Bonus';
  } else if (safeStreak >= 60) {
    badge = '💎';
    title = 'Diamond Sovereign Bonus';
  } else if (safeStreak >= 30) {
    badge = '👑';
    title = 'Monthly Sovereign Bonus';
  } else if (safeStreak >= 14) {
    badge = '🌋';
    title = 'Fortnight Inferno Bonus';
  } else if (safeStreak >= 7) {
    badge = '✨';
    title = 'Weekly Blaze Bonus';
  } else if (safeStreak >= 3) {
    badge = '⚡';
    title = 'Flame Starter Bonus';
  }

  return { coins, xp, badge, title };
}

/**
 * Updates the user's daily reading chapter goal (1, 2, 3, or 5 chapters/day)
 */
export function setDailyGoalTarget(target: number): ReadingStreakData {
  const current = getReadingStreak();
  const validTarget = Math.max(1, Math.min(10, target));
  const updated: ReadingStreakData = {
    ...current,
    dailyGoalTarget: validTarget,
  };
  safeStorage.setJSON(STORAGE_KEY, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ka_pulse_streak_updated', { detail: { streak: updated } }));
  }
  return updated;
}

/**
 * Claims today's daily streak bonus for consecutive day reading
 */
export function claimDailyStreakBonus(): {
  success: boolean;
  reward?: DailyGoalReward;
  message: string;
  updatedStreak?: ReadingStreakData;
} {
  const current = getReadingStreak();
  const today = getTodayDateString();

  if (current.lastClaimedRewardDate === today) {
    return {
      success: false,
      message: 'You have already claimed today’s streak bonus! Come back tomorrow for your next consecutive bonus.',
    };
  }

  const goalTarget = current.dailyGoalTarget || 1;
  const hasMetGoal = current.todayRead || current.dailyChaptersToday >= goalTarget;

  if (!hasMetGoal) {
    return {
      success: false,
      message: `Complete your daily goal (read at least ${goalTarget} chapter today) to claim your streak bonus!`,
    };
  }

  const streak = Math.max(1, current.currentStreak);
  const bonus = calculateDailyStreakBonus(streak);

  const reward: DailyGoalReward = {
    id: `streak-bonus-${today}-${Date.now()}`,
    date: today,
    streakDays: streak,
    bonusCoins: bonus.coins,
    bonusXp: bonus.xp,
    rewardTitle: `${bonus.badge} Day ${streak} Streak Bonus: ${bonus.title}`,
    rewardSubtitle: `+${bonus.coins} Pulse Coins & +${bonus.xp} XP earned for reading chapters on ${streak} consecutive days!`,
    badge: bonus.badge,
    claimed: true,
    claimedAt: new Date().toISOString(),
    isMilestoneBonus: streak === 1 || streak === 3 || streak === 7 || streak === 14 || streak === 30,
  };

  const updatedStreakData: ReadingStreakData = {
    ...current,
    todayRead: true,
    lastClaimedRewardDate: today,
    dailyGoalRewardClaimedToday: true,
    userCoinsBalance: (current.userCoinsBalance || 0) + bonus.coins,
    recentRewards: [reward, ...(current.recentRewards || [])].slice(0, 10),
  };

  safeStorage.setJSON(STORAGE_KEY, updatedStreakData);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ka_pulse_streak_updated', {
        detail: { streak: updatedStreakData, dailyGoalReward: reward },
      })
    );
    window.dispatchEvent(
      new CustomEvent('ka_pulse_daily_goal_reward', {
        detail: reward,
      })
    );
  }

  return {
    success: true,
    reward,
    message: `🎉 +${bonus.coins} Coins & +${bonus.xp} XP claimed for Day ${streak} Streak Bonus!`,
    updatedStreak: updatedStreakData,
  };
}

export interface RecordStreakResult {
  streak: ReadingStreakData;
  streakIncremented: boolean;
  newStreakCount: number;
  newMilestoneUnlocked?: StreakMilestone;
  dailyGoalReward?: DailyGoalReward;
  message: string;
}

/**
 * Records a chapter read event and updates the daily streak
 */
export function recordChapterRead(
  mangaId: string,
  chapterId: string,
  chapterTitle?: string
): RecordStreakResult {
  const current = getReadingStreak();
  const today = getTodayDateString();
  const daysDiff = getDaysBetween(current.lastReadDate, today);

  let streakIncremented = false;
  let updatedStreak = current.currentStreak;
  let updatedDailyChapters = current.dailyChaptersToday + 1;
  let updatedTotalChapters = current.totalChaptersRead + 1;
  let updatedTotalDays = current.totalReadingDays;
  const historySet = new Set(current.readHistory);

  if (daysDiff === 0) {
    // Already read today, increment chapter count but streak count stays at current
    historySet.add(today);
  } else if (daysDiff === 1) {
    // Consecutive day! Streak increases
    updatedStreak = current.currentStreak + 1;
    streakIncremented = true;
    updatedTotalDays += 1;
    updatedDailyChapters = 1;
    historySet.add(today);
  } else {
    // Streak reset or started fresh
    updatedStreak = 1;
    streakIncremented = true;
    updatedTotalDays += 1;
    updatedDailyChapters = 1;
    historySet.add(today);
  }

  const updatedLongest = Math.max(current.longestStreak, updatedStreak);
  const updatedTier = getStreakTier(updatedStreak);

  // Check milestones
  const newlyReached = current.milestones.find(
    (m) => !m.unlocked && updatedStreak >= m.days
  );
  const newMilestoneUnlocked: StreakMilestone | undefined = newlyReached
    ? {
        ...newlyReached,
        unlocked: true,
        unlockedDate: new Date().toISOString(),
      }
    : undefined;

  const updatedMilestones = current.milestones.map((milestone) => {
    if (!milestone.unlocked && updatedStreak >= milestone.days) {
      return {
        ...milestone,
        unlocked: true,
        unlockedDate: new Date().toISOString(),
      };
    }
    return milestone;
  });

  // Calculate Daily Reading Goal Reward
  // Trigger a reward notification when user meets their daily reading goal (first read today or streak milestone)
  const isGoalJustMet = current.lastClaimedRewardDate !== today || streakIncremented;
  let dailyGoalReward: DailyGoalReward | undefined = undefined;

  if (isGoalJustMet) {
    const baseCoins = 30;
    const streakMultiplier = Math.min(100, updatedStreak * 5);
    const milestoneBonus = newMilestoneUnlocked ? 75 : 0;
    const totalCoins = baseCoins + streakMultiplier + milestoneBonus;
    const totalXp = 50 + updatedStreak * 10;

    let badge = '🔥';
    if (updatedStreak >= 30) badge = '👑';
    else if (updatedStreak >= 14) badge = '🌟';
    else if (updatedStreak >= 7) badge = '⚡';

    dailyGoalReward = {
      id: `reward-${today}-${Date.now()}`,
      date: today,
      streakDays: updatedStreak,
      bonusCoins: totalCoins,
      bonusXp: totalXp,
      rewardTitle: `Daily Reading Goal Met! 🔥 Day ${updatedStreak} Streak`,
      rewardSubtitle: `+${totalCoins} Pulse Coins & +${totalXp} XP awarded for keeping your African Manga pulse alive!`,
      badge,
      claimed: true,
      claimedAt: new Date().toISOString(),
      isMilestoneBonus: Boolean(newMilestoneUnlocked),
      milestoneTitle: newMilestoneUnlocked?.name,
    };
  }

  const updatedCoins = (current.userCoinsBalance || 0) + (dailyGoalReward ? dailyGoalReward.bonusCoins : 0);
  const updatedRecentRewards = dailyGoalReward
    ? [dailyGoalReward, ...(current.recentRewards || [])].slice(0, 10)
    : current.recentRewards || [];

  const newStreakData: ReadingStreakData = {
    ...current,
    currentStreak: updatedStreak,
    longestStreak: updatedLongest,
    lastReadDate: today,
    todayRead: true,
    dailyChaptersToday: updatedDailyChapters,
    totalChaptersRead: updatedTotalChapters,
    totalReadingDays: updatedTotalDays,
    readHistory: Array.from(historySet).slice(-60), // Keep last 60 days
    tierTitle: updatedTier,
    milestones: updatedMilestones,
    lastReadChapterTitle: chapterTitle || current.lastReadChapterTitle,
    lastReadTimestamp: new Date().toISOString(),
    userCoinsBalance: updatedCoins,
    lastClaimedRewardDate: dailyGoalReward ? today : current.lastClaimedRewardDate,
    recentRewards: updatedRecentRewards,
  };

  safeStorage.setJSON(STORAGE_KEY, newStreakData);

  // Notify active listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ka_pulse_streak_updated', {
        detail: {
          streak: newStreakData,
          streakIncremented,
          newMilestoneUnlocked,
          dailyGoalReward,
        },
      })
    );

    // Trigger Dedicated Daily Goal Reward Notification
    if (dailyGoalReward) {
      window.dispatchEvent(
        new CustomEvent('ka_pulse_daily_goal_reward', {
          detail: dailyGoalReward,
        })
      );
    }

    // Trigger visual Milestone Celebration overlay when reaching 7, 30, or 100 consecutive days
    if ([7, 30, 100].includes(updatedStreak) || (newMilestoneUnlocked && [7, 30, 100].includes(newMilestoneUnlocked.days))) {
      const milestoneDays = [7, 30, 100].includes(updatedStreak)
        ? updatedStreak
        : (newMilestoneUnlocked?.days || 7);
      window.dispatchEvent(
        new CustomEvent('ka_pulse_celebrate_milestone', {
          detail: { days: milestoneDays },
        })
      );
    }
  }

  let message = `Daily streak active: ${updatedStreak} ${updatedStreak === 1 ? 'day' : 'days'}!`;
  if (streakIncremented) {
    message = `🔥 Day ${updatedStreak} streak recorded! Keep the reading momentum going!`;
  } else {
    message = `✨ Chapter read logged! Daily reading goal completed (${updatedDailyChapters} chapters today).`;
  }

  return {
    streak: newStreakData,
    streakIncremented,
    newStreakCount: updatedStreak,
    newMilestoneUnlocked,
    dailyGoalReward,
    message,
  };
}

/**
 * Triggers a simulated daily goal reward for testing or manual preview
 */
export function triggerSimulatedDailyGoalReward(): DailyGoalReward {
  const current = getReadingStreak();
  const today = getTodayDateString();
  const reward: DailyGoalReward = {
    id: `reward-sim-${Date.now()}`,
    date: today,
    streakDays: current.currentStreak || 5,
    bonusCoins: 50,
    bonusXp: 100,
    rewardTitle: `Daily Reading Goal Met! 🔥 Day ${current.currentStreak || 5} Streak`,
    rewardSubtitle: `+50 Pulse Coins & +100 XP awarded for maintaining your daily reading habit!`,
    badge: '🔥',
    claimed: true,
    claimedAt: new Date().toISOString(),
    isMilestoneBonus: false,
  };

  const updatedData: ReadingStreakData = {
    ...current,
    todayRead: true,
    userCoinsBalance: (current.userCoinsBalance || 0) + 50,
    recentRewards: [reward, ...(current.recentRewards || [])].slice(0, 10),
    lastClaimedRewardDate: today,
  };
  safeStorage.setJSON(STORAGE_KEY, updatedData);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ka_pulse_streak_updated', { detail: { streak: updatedData, dailyGoalReward: reward } })
    );
    window.dispatchEvent(
      new CustomEvent('ka_pulse_daily_goal_reward', { detail: reward })
    );
  }

  return reward;
}

/**
 * Returns past 7 days status for weekly visual dot cards
 */
export function getWeeklyStreakDays(streak: ReadingStreakData): {
  date: string;
  dayShort: string;
  dayNumber: number;
  isToday: boolean;
  completed: boolean;
}[] {
  const result = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const historySet = new Set(streak.readHistory);

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${dayStr}`;

    const isToday = i === 0;
    const completed = isToday ? streak.todayRead : historySet.has(isoDate);

    result.push({
      date: isoDate,
      dayShort: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      isToday,
      completed,
    });
  }

  return result;
}

/**
 * Returns dynamic motivational messages based on streak status
 */
export function getStreakMotivation(streak: ReadingStreakData): {
  title: string;
  description: string;
  actionText: string;
} {
  if (streak.todayRead) {
    return {
      title: `🔥 Day ${streak.currentStreak} Reading Goal Achieved!`,
      description: `Great job! You've logged ${streak.dailyChaptersToday} ${streak.dailyChaptersToday === 1 ? 'chapter' : 'chapters'} today. Return tomorrow to push your streak to Day ${streak.currentStreak + 1}!`,
      actionText: 'Explore More Manga',
    };
  }

  if (streak.currentStreak === 0) {
    return {
      title: '🌱 Light Your Daily Reading Flame',
      description: 'Read just 1 chapter today to launch your daily streak and begin climbing the reader leaderboard!',
      actionText: 'Read 1 Chapter Now',
    };
  }

  return {
    title: `⚡ ${streak.currentStreak}-Day Streak at Risk!`,
    description: `Read at least 1 chapter before midnight to lock in Day ${streak.currentStreak + 1} and preserve your ${streak.tierTitle} standing!`,
    actionText: 'Read Today’s Chapter',
  };
}

/**
 * Gets the current user's Pulse Coins balance
 */
export function getUserCoinsBalance(): number {
  const current = getReadingStreak();
  return current.userCoinsBalance || 0;
}

/**
 * Adds Pulse Coins to user's wallet (e.g. from coin pack purchase or rewarded ad)
 */
export function addUserCoins(amount: number): number {
  const current = getReadingStreak();
  const updatedCoins = (current.userCoinsBalance || 0) + amount;
  const updatedStreak: ReadingStreakData = {
    ...current,
    userCoinsBalance: updatedCoins,
  };
  safeStorage.setJSON(STORAGE_KEY, updatedStreak);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ka_pulse_streak_updated', { detail: { streak: updatedStreak } }));
    window.dispatchEvent(new CustomEvent('ka_pulse_coins_updated', { detail: { coins: updatedCoins } }));
  }
  return updatedCoins;
}

/**
 * Deducts Pulse Coins from user's wallet
 */
export function deductUserCoins(amount: number): boolean {
  const current = getReadingStreak();
  const balance = current.userCoinsBalance || 0;
  if (balance < amount) return false;

  const updatedCoins = balance - amount;
  const updatedStreak: ReadingStreakData = {
    ...current,
    userCoinsBalance: updatedCoins,
  };
  safeStorage.setJSON(STORAGE_KEY, updatedStreak);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ka_pulse_streak_updated', { detail: { streak: updatedStreak } }));
    window.dispatchEvent(new CustomEvent('ka_pulse_coins_updated', { detail: { coins: updatedCoins } }));
  }
  return true;
}

export interface CoinUnlockRecord {
  id: string;
  chapterId: string;
  mangaId: string;
  mangaTitle?: string;
  coinsDeducted: number;
  creatorCutZAR: number; // 70% of coin value (R6.65 for 50 coins)
  platformCutZAR: number; // 30% of coin value (R2.85 for 50 coins)
  timestamp: string;
  authorEmail?: string;
}

/**
 * Unlocks a chapter with 50 Pulse Coins, deducting 50 coins from reader
 * and crediting 70% value (R6.65) to creator's ZAR Payouts balance, 30% to platform.
 */
export function recordCoinChapterUnlock(
  mangaId: string,
  chapterId: string,
  mangaTitle?: string,
  authorEmail?: string
): { success: boolean; creatorCutZAR: number; platformCutZAR: number; message: string } {
  const REQUIRED_COINS = 50;
  const currentBalance = getUserCoinsBalance();
  if (currentBalance < REQUIRED_COINS) {
    return {
      success: false,
      creatorCutZAR: 0,
      platformCutZAR: 0,
      message: `Insufficient Pulse Coins (have ${currentBalance}, need ${REQUIRED_COINS}). Buy coins or watch an ad to unlock!`,
    };
  }

  const deducted = deductUserCoins(REQUIRED_COINS);
  if (!deducted) {
    return {
      success: false,
      creatorCutZAR: 0,
      platformCutZAR: 0,
      message: 'Failed to deduct coins from wallet.',
    };
  }

  // 50 coins value = R9.50 (at R19 / 100 coins)
  // 70% to Creator = R6.65
  // 30% to Platform = R2.85
  const creatorCutZAR = 6.65;
  const platformCutZAR = 2.85;

  const record: CoinUnlockRecord = {
    id: `coin-tx-${Date.now()}`,
    chapterId,
    mangaId,
    mangaTitle: mangaTitle || 'Original Chapter',
    coinsDeducted: REQUIRED_COINS,
    creatorCutZAR,
    platformCutZAR,
    timestamp: new Date().toISOString(),
    authorEmail: authorEmail || 'creator@example.com',
  };

  try {
    const existing = safeStorage.getJSON<CoinUnlockRecord[]>('ka_pulse_coin_unlocks', []) || [];
    safeStorage.setJSON('ka_pulse_coin_unlocks', [record, ...existing].slice(0, 100));

    const currentEarnings = safeStorage.getJSON<number>('ka_pulse_creator_coin_payouts_zar', 0) || 0;
    const newTotal = currentEarnings + creatorCutZAR;
    safeStorage.setJSON('ka_pulse_creator_coin_payouts_zar', newTotal);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ka_pulse_creator_payouts_updated', {
        detail: { totalCoinEarningsZAR: newTotal, newRecord: record }
      }));
    }
  } catch (e) {
    console.error('Failed to save coin unlock record', e);
  }

  return {
    success: true,
    creatorCutZAR,
    platformCutZAR,
    message: `Chapter unlocked for 50 Coins! R${creatorCutZAR.toFixed(2)} (70%) added to creator's ZAR Payouts.`,
  };
}

export function getCreatorCoinEarningsZAR(): number {
  return safeStorage.getJSON<number>('ka_pulse_creator_coin_payouts_zar', 0) || 0;
}

export function getCoinUnlockHistory(): CoinUnlockRecord[] {
  return safeStorage.getJSON<CoinUnlockRecord[]>('ka_pulse_coin_unlocks', []) || [];
}

