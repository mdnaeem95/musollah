/**
 * Prayer Service - Public API
 * 
 * Central export point for all prayer-related functionality.
 * 
 * @version 3.0
 * @since 2025-12-22
 * 
 * @example
 * ```ts
 * // Import everything you need from a single location
 * import {
 *   // Hooks
 *   useTodayPrayerTimes,
 *   useSavePrayerLog,
 *   
 *   // Types
 *   NormalizedPrayerTimes,
 *   PrayerLog,
 *   
 *   // Utilities
 *   getCurrentPrayer,
 *   calculateQiblaDirection,
 *   
 *   // Constants
 *   PRAYER_ORDER,
 *   LOGGABLE_PRAYERS,
 * } from '@/api/services/prayer';
 * ```
 */

// Import hooks for re-export
import {
  useTodayPrayerTimes,
  usePrayerTimesByDate,
  useMonthlyPrayerTimes,
  useIslamicDate,
  useTodayIslamicDate,
} from './queries/prayer-times';

import {
  useTodayPrayerLog,
  usePrayerLog,
  useWeeklyPrayerLogs,
  usePrayerStats,
  useSavePrayerLog,
  useIsPrayerLogged,
  usePrayerCompletionCount,
  useIsDateFullyLogged,
} from './queries/prayer-logs';

// Import prayer utilities
import {
  getCurrentPrayer,
  getNextPrayer,
  isWithinPrayerTimeWindow,
  canLogPrayer,
  calculateStreak,
  areAllPrayersCompleted,
  getCompletedPrayersCount,
  getMissedPrayers,
  formatMinutesToTimeString,
  getTimeOfDayGreeting,
} from './utils/prayer';

// Import date utilities
import {
  formatToISO,
  formatToDisplay,
  getTimeUntil,
  getToday,
  getTomorrow,
  getYesterday,
  getDatesInWeek,
  getDatesInMonth,
  isTodayDate,
  isTomorrowDate,
  isYesterdayDate,
  getRelativeDateString,
} from './utils/date';

// Import qibla utilities
import {
  calculateQiblaDirection,
  calculateDistanceToKaaba,
  isPointingToQibla,
  getCardinalDirection,
} from './utils/qibla';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export * from './types';
export * from './types/constants';

// ============================================================================
// API CLIENTS
// ============================================================================

// Aladhan API
export {
  fetchTodayPrayerTimesFromAladhan,
  fetchPrayerTimesByDateFromAladhan,
  fetchMonthlyCalendar,
  convertToIslamicDate,
  getTodayIslamicDate,
  checkAladhanApiStatus,
} from './api/aladhan';

// Firebase API
export {
  fetchDailyPrayerTimeFromFirebase,
  fetchMonthlyPrayerTimesFromFirebase,
  fetchPrayerLog,
  savePrayerLog,
  fetchWeeklyPrayerLogs,
  calculatePrayerStats,
  checkUserExists,
  getAvailablePrayerTimeYears,
} from './api/firebase';

// Data Transformers
export {
  normalizeAladhanResponse,
  normalizeFirebaseTime,
  normalizeFirebaseTimesBatch,
  extractAladhanTimings,
  convertFirebaseDateToISO,
  convertISOToFirebaseDate,
  convertISOToAladhanDate,
  cleanTimeString,
  parseTimeToDate,
  formatTimeForDisplay,
  convertPrayerName,
  convertPrayerNameToEnglish,
  formatIslamicDate,
  mergePrayerTimes,
  createEmptyPrayerTimes,
  validatePrayerTimes as validatePrayerTimesFormat,
  sanitizePrayerTimes,
} from './api/transformers';

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

// Prayer Times Queries
export {
  useTodayPrayerTimes,
  usePrayerTimesByDate,
  useMonthlyPrayerTimes,
  useIslamicDate,
  useTodayIslamicDate,
  usePrefetchPrayerTimes,
  usePrefetchMonthlyPrayerTimes,
  useInvalidatePrayerTimes,
  useInvalidatePrayerTimesByDate,
} from './queries/prayer-times';

// Prayer Logs Queries & Mutations
export {
  usePrayerLog,
  useTodayPrayerLog,
  useWeeklyPrayerLogs,
  usePrayerStats,
  useSavePrayerLog,
  useBatchSavePrayerLogs,
  usePrefetchPrayerLog,
  usePrefetchWeeklyPrayerLogs,
  useInvalidatePrayerLogs,
  useInvalidatePrayerLogByDate,
  useIsPrayerLogged,
  usePrayerCompletionCount,
  useIsDateFullyLogged,
} from './queries/prayer-logs';

// Query Keys
export {
  prayerQueryKeys,
  prayerTimeKeys,
  islamicDateKeys,
  prayerLogKeys,
  prayerStatsKeys,
  getAllPrayerKeys,
  getUserPrayerKeys,
} from './queries/query-keys';

// ============================================================================
// UTILITIES
// ============================================================================

// Date Utilities
export {
  formatToISO,
  formatToDisplay,
  formatToFirebase,
  formatToAladhan,
  parseISODate,
  parseFirebaseDate,
  parseAladhanDate,
  getToday,
  getTomorrow,
  getYesterday,
  addDaysToDate,
  subtractDaysFromDate,
  getWeekStart,
  getWeekEnd,
  getWeekRange,
  getMonthStart,
  getMonthEnd,
  getDatesInWeek,
  getDatesInMonth,
  isSameDate,
  isTodayDate,
  isTomorrowDate,
  isYesterdayDate,
  isPast,
  isFuture,
  getDaysDifference,
  getHoursDifference,
  getMinutesDifference,
  getCurrentHour,
  getCurrentMinute,
  isTimeInRange,
  getRelativeDateString,
  getTimeUntil,
  isValidDateString,
  isValidTimeString,
  getCurrentTimestamp,
  getCurrentISOTimestamp,
  sleep,
} from './utils/date';

// Prayer Utilities
export {
  getCurrentPrayer,
  getNextPrayer,
  isWithinPrayerTimeWindow,
  canLogPrayer,
  getPrayerIndex,
  getNextPrayerInSequence,
  getPreviousPrayerInSequence,
  formatMinutesToTimeString,
  getTimeOfDayGreeting,
  getIslamicGreeting,
  calculateCompletionPercentage,
  areAllPrayersCompleted,
  getMissedPrayers,
  getCompletedPrayersCount,
  calculateStreak,
  validatePrayerTimes,
  validatePrayerLog,
  debugLogPrayerTimes,
  debugLogCurrentPrayerStatus,
} from './utils/prayer';

// Qibla Utilities
export {
  KAABA_COORDINATES,
  calculateQiblaDirection,
  calculateDistanceToKaaba,
  calculateDistanceBetween,
  formatDistance,
  normalizeHeading,
  calculateHeadingDifference,
  isPointingToQibla,
  getCardinalDirection,
  getCardinalDirectionName,
  validateCoordinates,
  formatCoordinates,
  toRadians,
  toDegrees,
  interpolateAngle,
  correctMagneticDeclination,
  getSingaporeMagneticDeclination,
  smoothCompassReading,
  debugLogQiblaCalculation,
  debugLogCompassStatus,
} from './utils/qibla';

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * Commonly used prayer times hooks
 */
export const prayerHooks = {
  // Prayer Times
  useTodayPrayerTimes,
  usePrayerTimesByDate,
  useMonthlyPrayerTimes,
  useIslamicDate,
  useTodayIslamicDate,
  
  // Prayer Logs
  useTodayPrayerLog,
  usePrayerLog,
  useWeeklyPrayerLogs,
  usePrayerStats,
  useSavePrayerLog,
  
  // Utilities
  useIsPrayerLogged,
  usePrayerCompletionCount,
  useIsDateFullyLogged,
} as const;

/**
 * Commonly used prayer utilities
 */
export const prayerUtils = {
  // Current prayer
  getCurrentPrayer,
  getNextPrayer,
  isWithinPrayerTimeWindow,
  canLogPrayer,
  
  // Streak & completion
  calculateStreak,
  areAllPrayersCompleted,
  getCompletedPrayersCount,
  getMissedPrayers,
  
  // Time formatting
  formatMinutesToTimeString,
  getTimeUntil,
  getTimeOfDayGreeting,
  
  // Qibla
  calculateQiblaDirection,
  calculateDistanceToKaaba,
  isPointingToQibla,
  getCardinalDirection,
} as const;

/**
 * Commonly used date utilities
 */
export const dateUtils = {
  formatToISO,
  formatToDisplay,
  getToday,
  getTomorrow,
  getYesterday,
  getDatesInWeek,
  getDatesInMonth,
  isTodayDate,
  isTomorrowDate,
  isYesterdayDate,
  getRelativeDateString,
} as const;

// ============================================================================
// VERSION INFO
// ============================================================================

export const PRAYER_SERVICE_VERSION = '3.0.0';
export const PRAYER_SERVICE_BUILD_DATE = '2025-12-22';

/**
 * Get prayer service version information
 */
export function getPrayerServiceVersion() {
  return {
    version: PRAYER_SERVICE_VERSION,
    buildDate: PRAYER_SERVICE_BUILD_DATE,
    architecture: 'TanStack Query + Zustand + MMKV',
    features: [
      'Multi-source prayer times (Firebase + Aladhan)',
      'Optimistic prayer logging',
      'Streak tracking',
      'Qibla direction calculation',
      'Islamic date conversion',
      'Comprehensive type safety with Zod',
      'Error handling with typed errors',
      'Debug logging',
      'MMKV caching',
    ],
  };
}