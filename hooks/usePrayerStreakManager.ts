import { useMemo } from 'react';
import { isYesterday, isToday, differenceInDays, format } from 'date-fns';
import { PrayerLog } from '../utils/types/prayer.types';
import { LOGGABLE_PRAYERS } from '../constants/prayer.constants';

// ============================================================================
// TYPES
// ============================================================================

export interface StreakInfo {
  current: number;
  longest: number;
  todayCompleted: boolean;
}

// Default state - extracted as constant to avoid recreation
const DEFAULT_STREAK_INFO: StreakInfo = Object.freeze({
  current: 0,
  longest: 0,
  todayCompleted: false,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a prayer log has all prayers completed
 */
const isDayFullyCompleted = (log: PrayerLog | undefined): boolean => {
  if (!log?.prayers) return false;
  return LOGGABLE_PRAYERS.every((prayer) => log.prayers[prayer] === true);
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayDateStr = (): string => format(new Date(), 'yyyy-MM-dd');

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to calculate prayer streak information
 *
 * Features:
 * - Pure calculation, no side effects
 * - Defensive programming against undefined/null values
 * - Memoized for performance
 * - Type-safe with proper null checks
 *
 * @param weeklyLogs - Record of prayer logs by date (YYYY-MM-DD format)
 * @param userId - User ID (required for valid calculation)
 * @returns Streak information (current, longest, todayCompleted)
 */
export const usePrayerStreakManager = (
  weeklyLogs: Record<string, PrayerLog> | undefined | null,
  userId: string | null
): StreakInfo => {
  return useMemo<StreakInfo>(() => {
    // Early return for missing user
    if (!userId) {
      return DEFAULT_STREAK_INFO;
    }

    // Safe access to logs - handle undefined, null, or non-object values
    const logs = weeklyLogs ?? {};
    const dateKeys = Object.keys(logs);

    // Early return for empty logs
    if (dateKeys.length === 0) {
      return DEFAULT_STREAK_INFO;
    }

    // Sort logs by date (oldest to newest for streak calculation)
    const sortedDates = dateKeys.sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Calculate streaks by iterating through sorted dates
    for (const dateStr of sortedDates) {
      const log = logs[dateStr];
      
      // Skip if log is undefined (defensive check)
      if (!log) continue;

      const date = new Date(dateStr);

      // Check if day is fully completed
      const isFullyCompleted = isDayFullyCompleted(log);

      if (isFullyCompleted) {
        // Check if this day continues the streak (consecutive days)
        const isConsecutive = lastDate === null || differenceInDays(date, lastDate) === 1;

        if (isConsecutive) {
          tempStreak++;
        } else {
          // Streak broken, start new streak
          tempStreak = 1;
        }

        // Update longest streak
        longestStreak = Math.max(longestStreak, tempStreak);

        // Update current streak if this is today or yesterday
        if (isToday(date) || isYesterday(date)) {
          currentStreak = tempStreak;
        }
      } else {
        // Day not completed, reset temporary streak
        tempStreak = 0;

        // If today is not completed, current streak is 0
        if (isToday(date)) {
          currentStreak = 0;
        }
      }

      lastDate = date;
    }

    // Check if today is completed
    const todayDateStr = getTodayDateStr();
    const todayCompleted = isDayFullyCompleted(logs[todayDateStr]);

    return {
      current: currentStreak,
      longest: longestStreak,
      todayCompleted,
    };
  }, [weeklyLogs, userId]);
};

// ============================================================================
// STANDALONE UTILITY (for use outside React components)
// ============================================================================

/**
 * Calculate streak info without React hooks
 * Useful for background calculations or testing
 */
export const calculateStreakInfo = (
  weeklyLogs: Record<string, PrayerLog> | undefined | null,
  userId: string | null
): StreakInfo => {
  if (!userId) return DEFAULT_STREAK_INFO;

  const logs = weeklyLogs ?? {};
  const dateKeys = Object.keys(logs);

  if (dateKeys.length === 0) return DEFAULT_STREAK_INFO;

  const sortedDates = dateKeys.sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const log = logs[dateStr];
    if (!log) continue;

    const date = new Date(dateStr);
    const isFullyCompleted = isDayFullyCompleted(log);

    if (isFullyCompleted) {
      const isConsecutive = lastDate === null || differenceInDays(date, lastDate) === 1;
      tempStreak = isConsecutive ? tempStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, tempStreak);

      if (isToday(date) || isYesterday(date)) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      if (isToday(date)) currentStreak = 0;
    }

    lastDate = date;
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    todayCompleted: isDayFullyCompleted(logs[getTodayDateStr()]),
  };
};