import type { ReleaseDay } from '../types';

export const RELEASE_DAYS_MON_SUN: ReleaseDay[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
];

export const WEEK_STRIP_ORDER: ReleaseDay[] = [
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
  'MON',
  'TUE',
];

const JS_DAY_TO_RELEASE_DAY: ReleaseDay[] = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
];

const RELEASE_DAY_TO_JS_DAY: Record<ReleaseDay, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function normalizeReleaseDay(
  rawDay?: string | null,
  mangaIdOrFallback?: string
): ReleaseDay {
  const upper = String(rawDay || '').trim().toUpperCase();
  if ((RELEASE_DAYS_MON_SUN as string[]).includes(upper)) {
    return upper as ReleaseDay;
  }
  const fbUpper = String(mangaIdOrFallback || '').trim().toUpperCase();
  if ((RELEASE_DAYS_MON_SUN as string[]).includes(fbUpper)) {
    return fbUpper as ReleaseDay;
  }
  if (mangaIdOrFallback === 'nkosi-the-tale-of-myths') return 'WED';
  if (mangaIdOrFallback === 'last-shaman-of-zambezi') return 'FRI';
  if (mangaIdOrFallback === 'echoes-of-the-highveld') return 'SUN';
  return 'WED';
}

export function getSeedReleaseDay(mangaId?: string): ReleaseDay {
  if (mangaId === 'last-shaman-of-zambezi') return 'FRI';
  if (mangaId === 'echoes-of-the-highveld') return 'SUN';
  return 'WED';
}

/**
 * Returns current South Africa Standard Time (UTC+2, no DST) calendar components.
 */
export function getCurrentSastParts(now = new Date()): {
  isoDate: string;
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  dayOfWeek: ReleaseDay;
} {
  const sastMs = now.getTime() + 2 * 60 * 60 * 1000;
  const sastDate = new Date(sastMs);
  const year = sastDate.getUTCFullYear();
  const month = sastDate.getUTCMonth() + 1;
  const day = sastDate.getUTCDate();
  const hours = sastDate.getUTCHours();
  const minutes = sastDate.getUTCMinutes();
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dayOfWeek = JS_DAY_TO_RELEASE_DAY[sastDate.getUTCDay()];
  return { isoDate, year, month, day, hours, minutes, dayOfWeek };
}

export function getCurrentSastDateString(now = new Date()): string {
  return getCurrentSastParts(now).isoDate;
}

export function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate || '').trim());
  if (!match) {
    const fallback = getCurrentSastParts();
    return { year: fallback.year, month: fallback.month, day: fallback.day };
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const { year, month, day } = parseIsoDateParts(isoDate);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return dt.toISOString().split('T')[0];
}

export function getDayNameFromIsoDate(isoDate: string): ReleaseDay {
  const { year, month, day } = parseIsoDateParts(isoDate);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return JS_DAY_TO_RELEASE_DAY[dt.getUTCDay()];
}

export function formatShortReleaseLabel(releaseDay: ReleaseDay, isoDate: string): string {
  const { month, day } = parseIsoDateParts(isoDate);
  const monthLabel = MONTH_NAMES_SHORT[Math.max(0, Math.min(11, month - 1))] || 'Nov';
  return `${releaseDay} ${monthLabel} ${day}`;
}

export function getNextReleaseDateForDay(
  releaseDay: ReleaseDay,
  anchorIsoDate?: string,
  includeTodayIfSameDay = false
): {
  isoDate: string;
  dayName: ReleaseDay;
  label: string;
  formattedForUi: string;
} {
  const baseIso = anchorIsoDate || getCurrentSastDateString();
  const { year, month, day } = parseIsoDateParts(baseIso);
  const baseUtc = new Date(Date.UTC(year, month - 1, day));
  const currentJsDay = baseUtc.getUTCDay();
  const targetJsDay = RELEASE_DAY_TO_JS_DAY[releaseDay];

  let diff = (targetJsDay - currentJsDay + 7) % 7;
  if (diff === 0 && !includeTodayIfSameDay) {
    diff = 7;
  }

  const targetIso = addDaysToIsoDate(baseIso, diff);
  const label = formatShortReleaseLabel(releaseDay, targetIso);

  return {
    isoDate: targetIso,
    dayName: releaseDay,
    label,
    formattedForUi: `${label} (12:00 AM SAST)`,
  };
}

/**
 * Computes the 7-day release-week window starting on the series' configured releaseDay
 * that contains targetIsoDate. Used to enforce max 1 chapter per release week.
 */
export function getReleaseWeekWindow(
  releaseDay: ReleaseDay,
  targetIsoDate?: string
): {
  weekStartIso: string;
  weekEndIso: string;
  nextReleaseLabel: string;
  nextReleaseIso: string;
} {
  const anchor = (targetIsoDate || getCurrentSastDateString()).slice(0, 10);
  const { year, month, day } = parseIsoDateParts(anchor);
  const anchorUtc = new Date(Date.UTC(year, month - 1, day));
  const currentJsDay = anchorUtc.getUTCDay();
  const startJsDay = RELEASE_DAY_TO_JS_DAY[releaseDay];

  const daysSinceWeekStart = (currentJsDay - startJsDay + 7) % 7;
  const weekStartIso = addDaysToIsoDate(anchor, -daysSinceWeekStart);
  const weekEndIso = addDaysToIsoDate(weekStartIso, 6);
  const nextReleaseIso = addDaysToIsoDate(weekStartIso, 7);
  const nextReleaseLabel = formatShortReleaseLabel(releaseDay, nextReleaseIso);

  return {
    weekStartIso,
    weekEndIso,
    nextReleaseLabel,
    nextReleaseIso,
  };
}

export function buildWedToTueCalendarDays(anchorIsoDate?: string): Array<{
  dayName: ReleaseDay;
  isoDate: string;
  dateNumber: number;
  monthLabel: string;
  isToday: boolean;
}> {
  const todayIso = getCurrentSastDateString();
  const baseIso = anchorIsoDate || todayIso;
  const { year, month, day } = parseIsoDateParts(baseIso);
  const baseUtc = new Date(Date.UTC(year, month - 1, day));
  const currentJsDay = baseUtc.getUTCDay();
  // Anchor week strip starting on Wednesday (JS day = 3)
  const daysSinceWednesday = (currentJsDay - 3 + 7) % 7;
  const wednesdayIso = addDaysToIsoDate(baseIso, -daysSinceWednesday);

  return WEEK_STRIP_ORDER.map((dayName, idx) => {
    const isoDate = addDaysToIsoDate(wednesdayIso, idx);
    const parts = parseIsoDateParts(isoDate);
    return {
      dayName,
      isoDate,
      dateNumber: parts.day,
      monthLabel: MONTH_NAMES_SHORT[parts.month - 1] || 'Nov',
      isToday: isoDate === todayIso,
    };
  });
}
