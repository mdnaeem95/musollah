import { useMemo } from 'react';
import { isYesterday, isToday, differenceInDays } from 'date-fns';
import { PrayerLog } from '../utils/types/prayer.types';
import { LOGGABLE_PRAYERS } from '../constants/prayer.constants';

interface StreakInfo {
  current: number;
  longest: number;
  todayCompleted: boolean;
}

/**
 * Hook to calculate prayer streak information
 * 
 * Improvements over Redux version:
 * - Pure calculation, no side effects
 * - No Redux dependency
 * - Memoized for performance
 * - Type-safe
 * 
 * @param weeklyLogs - Record of prayer logs by date
 * @returns Streak information (current, longest, todayCompleted)
 */
export const usePrayerStreakManager = (
  weeklyLogs: Record<string, PrayerLog> | undefined,
  userId: string | null
): StreakInfo => {
  const streakInfo = useMemo<StreakInfo>(() => {
    // Default state when no user or no logs
    if (!userId || !weeklyLogs || Object.keys(weeklyLogs).length === 0) {
      return { current: 0, longest: 0, todayCompleted: false };
    }

    // Sort logs by date (oldest to newest)
    const sortedDates = Object.keys(weeklyLogs).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Calculate streaks by iterating through sorted dates
    sortedDates.forEach(dateStr => {
      const log = weeklyLogs[dateStr];
      const date = new Date(dateStr);
      
      // Count completed prayers for this day
      const completedCount = LOGGABLE_PRAYERS.filter(
        prayer => log.prayers[prayer] === true
      ).length;
      
      // Day is fully completed if all loggable prayers are done
      const isFullyCompleted = completedCount === LOGGABLE_PRAYERS.length;

      if (isFullyCompleted) {
        // Check if this day continues the streak (consecutive days)
        if (lastDate === null || differenceInDays(date, lastDate) === 1) {
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
    });

    // Check if today is completed
    const todayDateStr = new Date().toISOString().split('T')[0];
    const todayLog = weeklyLogs[todayDateStr];
    const todayCompleted = todayLog 
      ? LOGGABLE_PRAYERS.every(prayer => todayLog.prayers[prayer] === true)
      : false;

    return { 
      current: currentStreak, 
      longest: longestStreak, 
      todayCompleted 
    };
  }, [weeklyLogs, userId]);

  return streakInfo;
};