/**
 * Prayer Utilities
 * 
 * Functions for prayer time calculations, current prayer determination,
 * and prayer-related logic.
 * 
 * @version 3.0
 * @since 2025-12-22
 */

import { parseTimeToDate, cleanTimeString } from '../api/transformers';
import { getMinutesDifference, getCurrentHour } from './date';
import { NormalizedPrayerTimes, PrayerName, isLoggablePrayerName } from '../types/index';
import { LOGGABLE_PRAYERS, logger, PRAYER_ORDER } from '../types/constants';

// ============================================================================
// CURRENT PRAYER DETERMINATION
// ============================================================================

/**
 * Get current prayer name based on current time
 * 
 * Logic:
 * - Between Subuh-Syuruk: Subuh period
 * - Between Syuruk-Zohor: Between prayers (returns null)
 * - Between Zohor-Asar: Zohor period
 * - Between Asar-Maghrib: Asar period
 * - Between Maghrib-Isyak: Maghrib period
 * - Between Isyak-Midnight: Isyak period
 * - Between Midnight-Subuh: Isyak period (from previous day)
 * 
 * @param prayerTimes - Normalized prayer times
 * @returns Current prayer name or null if between prayers
 * 
 * @example
 * ```ts
 * const times = {
 *   subuh: '05:30',
 *   syuruk: '07:00',
 *   zohor: '13:15',
 *   // ...
 * };
 * 
 * // If current time is 14:00
 * getCurrentPrayer(times) // 'Zohor'
 * 
 * // If current time is 10:00 (between Syuruk and Zohor)
 * getCurrentPrayer(times) // null
 * 
 * // If current time is 02:00 (after midnight, before Subuh)
 * getCurrentPrayer(times) // 'Isyak'
 * ```
 */
export function getCurrentPrayer(
  prayerTimes: NormalizedPrayerTimes | null
): PrayerName | null {
  if (!prayerTimes) return null;

  const now = new Date();

  // Parse all prayer times
  const subuhTime = parseTimeToDate(prayerTimes.subuh);
  const syurukTime = parseTimeToDate(prayerTimes.syuruk);
  const zohorTime = parseTimeToDate(prayerTimes.zohor);
  const asarTime = parseTimeToDate(prayerTimes.asar);
  const maghribTime = parseTimeToDate(prayerTimes.maghrib);
  const isakTime = parseTimeToDate(prayerTimes.isyak);

  if (!subuhTime || !syurukTime || !zohorTime || !asarTime || !maghribTime || !isakTime) {
    logger.warn('Invalid prayer times', prayerTimes);
    return null;
  }

  // Check each prayer period
  if (now >= subuhTime && now < syurukTime) return 'Subuh';
  if (now >= zohorTime && now < asarTime) return 'Zohor';
  if (now >= asarTime && now < maghribTime) return 'Asar';
  if (now >= maghribTime && now < isakTime) return 'Maghrib';
  if (now >= isakTime) return 'Isyak'; // After Isyak until midnight
  
  // ✅ NEW: After midnight, before Subuh - still Isyak period from yesterday
  if (now < subuhTime) return 'Isyak';

  // ✅ NEW: Between Syuruk and Zohor - no current prayer
  return null;
}

// ============================================================================
// NEXT PRAYER DETERMINATION
// ============================================================================

/**
 * Get next prayer name and time until it
 * 
 * @param prayerTimes - Normalized prayer times
 * @returns Object with next prayer name and time remaining
 * 
 * @example
 * ```ts
 * const next = getNextPrayer(times);
 * console.log(next.prayer); // 'Zohor'
 * console.log(next.timeUntil); // '2h 15m'
 * console.log(next.minutesUntil); // 135
 * ```
 */
export function getNextPrayer(
  prayerTimes: NormalizedPrayerTimes | null
): {
  prayer: PrayerName;
  time: string;
  timeUntil: string;
  minutesUntil: number;
} | null {
  if (!prayerTimes) return null;

  const now = new Date();

  // Parse all prayer times
  const prayers: Array<{ name: PrayerName; time: Date }> = [
    { name: 'Subuh', time: parseTimeToDate(prayerTimes.subuh)! },
    { name: 'Syuruk', time: parseTimeToDate(prayerTimes.syuruk)! },
    { name: 'Zohor', time: parseTimeToDate(prayerTimes.zohor)! },
    { name: 'Asar', time: parseTimeToDate(prayerTimes.asar)! },
    { name: 'Maghrib', time: parseTimeToDate(prayerTimes.maghrib)! },
    { name: 'Isyak', time: parseTimeToDate(prayerTimes.isyak)! },
  ];

  // Find next prayer
  const nextPrayer = prayers.find((p) => p.time > now);

  if (!nextPrayer) {
    // All prayers passed, next is tomorrow's Subuh
    const tomorrowSubuh = parseTimeToDate(prayerTimes.subuh)!;
    tomorrowSubuh.setDate(tomorrowSubuh.getDate() + 1);

    const minutesUntil = getMinutesDifference(tomorrowSubuh, now);

    return {
      prayer: 'Subuh',
      time: prayerTimes.subuh,
      timeUntil: formatMinutesToTimeString(minutesUntil),
      minutesUntil,
    };
  }

  const minutesUntil = getMinutesDifference(nextPrayer.time, now);

  return {
    prayer: nextPrayer.name,
    time: cleanTimeString(prayerTimes[nextPrayer.name.toLowerCase() as keyof NormalizedPrayerTimes]),
    timeUntil: formatMinutesToTimeString(minutesUntil),
    minutesUntil,
  };
}

// ============================================================================
// PRAYER PERIOD CHECKS
// ============================================================================

/**
 * Check if current time is within prayer time window
 * 
 * Prayer time window: ±15 minutes around prayer time
 * 
 * @param prayerTimes - Normalized prayer times
 * @param prayerName - Prayer to check
 * @param windowMinutes - Window size in minutes (default: 15)
 * @returns True if within window
 * 
 * @example
 * ```ts
 * // If current time is 13:10 and Zohor is 13:15
 * isWithinPrayerTimeWindow(times, 'Zohor') // true
 * 
 * // If current time is 12:30
 * isWithinPrayerTimeWindow(times, 'Zohor') // false
 * ```
 */
export function isWithinPrayerTimeWindow(
  prayerTimes: NormalizedPrayerTimes | null,
  prayerName: PrayerName,
  windowMinutes: number = 15
): boolean {
  if (!prayerTimes) return false;

  const prayerTimeKey = prayerName.toLowerCase() as keyof NormalizedPrayerTimes;
  const prayerTimeStr = prayerTimes[prayerTimeKey];
  const prayerTime = parseTimeToDate(prayerTimeStr);

  if (!prayerTime) return false;

  const now = new Date();
  const minutesDiff = Math.abs(getMinutesDifference(prayerTime, now));

  return minutesDiff <= windowMinutes;
}

/**
 * Check if a prayer can be logged
 * 
 * Rules:
 * - Prayer must be loggable (not Syuruk)
 * - Prayer time must have passed
 * - Cannot log future prayers
 * 
 * @param prayerTimes - Normalized prayer times
 * @param prayerName - Prayer to check
 * @returns True if can be logged
 * 
 * @example
 * ```ts
 * // If current time is 14:00 and Zohor is 13:15
 * canLogPrayer(times, 'Zohor') // true
 * 
 * // If current time is 12:00
 * canLogPrayer(times, 'Zohor') // false (not yet time)
 * ```
 */
export function canLogPrayer(
  prayerTimes: NormalizedPrayerTimes | null,
  prayerName: string
): boolean {
  if (!prayerTimes) return false;

  // Check if prayer is loggable
  if (!isLoggablePrayerName(prayerName)) {
    logger.warn('Prayer not loggable', { prayerName });
    return false;
  }

  const prayerTimeKey = prayerName.toLowerCase() as keyof NormalizedPrayerTimes;
  const prayerTimeStr = prayerTimes[prayerTimeKey];
  const prayerTime = parseTimeToDate(prayerTimeStr);

  if (!prayerTime) return false;

  // Prayer time must have passed
  const now = new Date();
  return now >= prayerTime;
}

// ============================================================================
// PRAYER ORDER & NAVIGATION
// ============================================================================

/**
 * Get index of prayer in prayer order
 * 
 * @param prayerName - Prayer name
 * @returns Index (0-5) or -1 if not found
 */
export function getPrayerIndex(prayerName: PrayerName): number {
  return PRAYER_ORDER.indexOf(prayerName);
}

/**
 * Get next prayer in sequence
 * 
 * @param currentPrayer - Current prayer
 * @returns Next prayer or null if last prayer
 * 
 * @example
 * ```ts
 * getNextPrayerInSequence('Zohor') // 'Asar'
 * getNextPrayerInSequence('Isyak') // null
 * ```
 */
export function getNextPrayerInSequence(currentPrayer: PrayerName): PrayerName | null {
  const index = getPrayerIndex(currentPrayer);
  if (index === -1 || index === PRAYER_ORDER.length - 1) return null;
  return PRAYER_ORDER[index + 1];
}

/**
 * Get previous prayer in sequence
 * 
 * @param currentPrayer - Current prayer
 * @returns Previous prayer or null if first prayer
 */
export function getPreviousPrayerInSequence(currentPrayer: PrayerName): PrayerName | null {
  const index = getPrayerIndex(currentPrayer);
  if (index <= 0) return null;
  return PRAYER_ORDER[index - 1];
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format minutes to time string
 * 
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "2h 15m")
 * 
 * @example
 * ```ts
 * formatMinutesToTimeString(135) // "2h 15m"
 * formatMinutesToTimeString(45) // "45m"
 * formatMinutesToTimeString(120) // "2h"
 * ```
 */
export function formatMinutesToTimeString(minutes: number): string {
  if (minutes < 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get time of day greeting based on current hour
 * 
 * @returns Greeting string
 * 
 * @example
 * ```ts
 * // If current time is 10:00
 * getTimeOfDayGreeting() // 'Good Morning'
 * 
 * // If current time is 15:00
 * getTimeOfDayGreeting() // 'Good Afternoon'
 * ```
 */
export function getTimeOfDayGreeting(): string {
  const hour = getCurrentHour();

  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

/**
 * Get Islamic greeting based on time of day
 * 
 * @returns Islamic greeting
 */
export function getIslamicGreeting(): string {
  const hour = getCurrentHour();

  if (hour >= 5 && hour < 12) return 'Assalamualaikum';
  if (hour >= 12 && hour < 17) return 'Assalamualaikum';
  if (hour >= 17 && hour < 21) return 'Assalamualaikum wa Rahmatullah';
  return 'Assalamualaikum';
}

// ============================================================================
// PRAYER COMPLETION
// ============================================================================

/**
 * Calculate completion percentage for prayer logs
 * 
 * @param completedPrayers - Array of completed prayer names
 * @param totalPrayers - Total number of prayers (default: 5)
 * @returns Percentage (0-100)
 * 
 * @example
 * ```ts
 * calculateCompletionPercentage(['Subuh', 'Zohor', 'Asar']) // 60
 * ```
 */
export function calculateCompletionPercentage(
  completedPrayers: string[],
  totalPrayers: number = 5
): number {
  if (totalPrayers === 0) return 0;
  return Math.round((completedPrayers.length / totalPrayers) * 100);
}

/**
 * Check if all loggable prayers are completed
 * 
 * @param prayers - Prayer log object
 * @returns True if all 5 prayers logged
 * 
 * @example
 * ```ts
 * const log = {
 *   Subuh: true,
 *   Zohor: true,
 *   Asar: true,
 *   Maghrib: true,
 *   Isyak: true,
 * };
 * 
 * areAllPrayersCompleted(log) // true
 * ```
 */
export function areAllPrayersCompleted(
  prayers: Record<string, boolean> | undefined
): boolean {
  if (!prayers) return false;

  return LOGGABLE_PRAYERS.every((prayer: any) => prayers[prayer] === true);
}

/**
 * Get missed prayers for a day
 * 
 * @param prayers - Prayer log object
 * @returns Array of missed prayer names
 */
export function getMissedPrayers(
  prayers: Record<string, boolean> | undefined
): string[] {
  if (!prayers) return [...LOGGABLE_PRAYERS];

  return LOGGABLE_PRAYERS.filter((prayer: any) => !prayers[prayer]);
}

/**
 * Get completed prayers count
 * 
 * @param prayers - Prayer log object
 * @returns Number of completed prayers (0-5)
 */
export function getCompletedPrayersCount(
  prayers: Record<string, boolean> | undefined
): number {
  if (!prayers) return 0;

  return LOGGABLE_PRAYERS.filter((prayer: any) => prayers[prayer] === true).length;
}

// ============================================================================
// STREAK CALCULATIONS
// ============================================================================

/**
 * Calculate prayer streak from logs
 * 
 * A streak continues when all 5 prayers are completed each day.
 * Breaks if any day is incomplete or there's a gap.
 * 
 * @param logs - Object with date keys and prayer completion values
 * @returns Object with current and longest streak
 * 
 * @example
 * ```ts
 * const logs = {
 *   '2025-12-20': { Subuh: true, Zohor: true, Asar: true, Maghrib: true, Isyak: true },
 *   '2025-12-21': { Subuh: true, Zohor: true, Asar: true, Maghrib: true, Isyak: true },
 *   '2025-12-22': { Subuh: true, Zohor: false, Asar: false, Maghrib: false, Isyak: false },
 * };
 * 
 * calculateStreak(logs) // { currentStreak: 0, longestStreak: 2 }
 * ```
 */
export function calculateStreak(
  logs: Record<string, Record<string, boolean>>
): {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
} {
  const sortedDates = Object.keys(logs).sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let todayCompleted = false;

  const todayStr = new Date().toISOString().split('T')[0];

  sortedDates.forEach((date, index) => {
    const prayers = logs[date];
    const isComplete = areAllPrayersCompleted(prayers);

    if (date === todayStr) {
      todayCompleted = isComplete;
    }

    if (isComplete) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);

      // Update current streak only if it's today or yesterday
      if (date === todayStr || (index === sortedDates.length - 1)) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      
      // Reset current streak if today is incomplete
      if (date === todayStr) {
        currentStreak = 0;
      }
    }
  });

  return { currentStreak, longestStreak, todayCompleted };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate prayer times object
 * 
 * Checks that all required prayers are present and in correct format
 * 
 * @param times - Prayer times object
 * @returns True if valid
 */
export function validatePrayerTimes(times: any): times is NormalizedPrayerTimes {
  if (!times || typeof times !== 'object') return false;

  const required = ['date', 'subuh', 'syuruk', 'zohor', 'asar', 'maghrib', 'isyak'];
  
  return required.every((key) => {
    if (!(key in times)) return false;
    if (key === 'date') return typeof times[key] === 'string';
    return typeof times[key] === 'string' && /^\d{2}:\d{2}$/.test(times[key]);
  });
}

/**
 * Validate prayer log object
 * 
 * Checks that all loggable prayers are present with boolean values
 * 
 * @param prayers - Prayer log object
 * @returns True if valid
 */
export function validatePrayerLog(prayers: any): boolean {
  if (!prayers || typeof prayers !== 'object') return false;

  return LOGGABLE_PRAYERS.every((prayer: any) => {
    return prayer in prayers && typeof prayers[prayer] === 'boolean';
  });
}

// ============================================================================
// DEBUGGING
// ============================================================================

/**
 * Log prayer times for debugging
 * 
 * @param times - Prayer times to log
 */
export function debugLogPrayerTimes(times: NormalizedPrayerTimes): void {
  logger.info('Prayer Times Debug', {
    date: times.date,
    subuh: times.subuh,
    syuruk: times.syuruk,
    zohor: times.zohor,
    asar: times.asar,
    maghrib: times.maghrib,
    isyak: times.isyak,
  });
}

/**
 * Log current prayer status for debugging
 * 
 * @param times - Prayer times
 */
export function debugLogCurrentPrayerStatus(times: NormalizedPrayerTimes): void {
  const current = getCurrentPrayer(times);
  const next = getNextPrayer(times);

  logger.info('Current Prayer Status', {
    currentTime: new Date().toLocaleTimeString(),
    currentPrayer: current,
    nextPrayer: next?.prayer,
    timeUntilNext: next?.timeUntil,
  });
}