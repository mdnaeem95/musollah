/**
 * Query Keys Factory
 * 
 * Centralized, type-safe query keys for TanStack Query.
 * 
 * Benefits:
 * - Type-safe keys (no typos)
 * - Consistent structure
 * - Easy invalidation
 * - Hierarchical organization
 * 
 * @version 3.0
 * @since 2025-12-22
 */

import { Coordinates, PrayerTimesParams } from '../types/index';

// ============================================================================
// PRAYER TIMES KEYS
// ============================================================================

/**
 * Prayer times query keys
 * 
 * Hierarchy:
 * - ['prayer'] - All prayer-related queries
 * - ['prayer', 'times'] - All prayer times
 * - ['prayer', 'times', params] - Specific prayer times
 */
export const prayerTimeKeys = {
  /**
   * Base key for all prayer times
   */
  all: ['prayer', 'times'] as const,

  /**
   * All prayer times lists
   */
  lists: () => [...prayerTimeKeys.all, 'list'] as const,

  /**
   * Prayer times list with filters
   */
  list: (filters: string) => [...prayerTimeKeys.lists(), filters] as const,

  /**
   * Prayer times details
   */
  details: () => [...prayerTimeKeys.all, 'detail'] as const,

  /**
   * Prayer times for specific location and date
   */
  detail: (params: PrayerTimesParams) =>
    [...prayerTimeKeys.details(), params] as const,

  /**
   * Today's prayer times for a location
   */
  today: (location: Coordinates) =>
    [...prayerTimeKeys.all, 'today', location] as const,

  /**
   * Prayer times for a specific date
   */
  date: (location: Coordinates, date: string) =>
    [...prayerTimeKeys.all, 'date', location, date] as const,

  /**
   * Monthly prayer times
   */
  monthly: (year: number, month: number) =>
    [...prayerTimeKeys.all, 'monthly', year, month] as const,
} as const;

// ============================================================================
// ISLAMIC DATE KEYS
// ============================================================================

/**
 * Islamic date conversion query keys
 */
export const islamicDateKeys = {
  /**
   * Base key for all Islamic dates
   */
  all: ['prayer', 'islamic-date'] as const,

  /**
   * Islamic date for specific Gregorian date
   */
  date: (gregorianDate: string) =>
    [...islamicDateKeys.all, gregorianDate] as const,

  /**
   * Today's Islamic date
   */
  today: () => [...islamicDateKeys.all, 'today'] as const,
} as const;

// ============================================================================
// PRAYER LOGS KEYS
// ============================================================================

/**
 * Prayer logs query keys
 */
export const prayerLogKeys = {
  /**
   * Base key for all prayer logs
   */
  all: ['prayer', 'logs'] as const,

  /**
   * All logs for a user
   */
  user: (userId: string) => [...prayerLogKeys.all, userId] as const,

  /**
   * Log for specific user and date
   */
  daily: (userId: string, date: string) =>
    [...prayerLogKeys.user(userId), 'daily', date] as const,

  /**
   * Today's log for a user
   */
  today: (userId: string) => [...prayerLogKeys.user(userId), 'today'] as const,

  /**
   * Weekly logs for a user
   */
  weekly: (userId: string, startDate: string, endDate: string) =>
    [...prayerLogKeys.user(userId), 'weekly', startDate, endDate] as const,

  /**
   * Monthly logs for a user
   */
  monthly: (userId: string, year: number, month: number) =>
    [...prayerLogKeys.user(userId), 'monthly', year, month] as const,
} as const;

// ============================================================================
// PRAYER STATISTICS KEYS
// ============================================================================

/**
 * Prayer statistics query keys
 */
export const prayerStatsKeys = {
  /**
   * Base key for all prayer stats
   */
  all: ['prayer', 'stats'] as const,

  /**
   * Stats for a specific user
   */
  user: (userId: string) => [...prayerStatsKeys.all, userId] as const,

  /**
   * Streak data for a user
   */
  streak: (userId: string) =>
    [...prayerStatsKeys.user(userId), 'streak'] as const,

  /**
   * Completion rate for a user
   */
  completionRate: (userId: string) =>
    [...prayerStatsKeys.user(userId), 'completion'] as const,
} as const;

// ============================================================================
// COMBINED FACTORY
// ============================================================================

/**
 * Master query keys factory
 * 
 * Single source of truth for all prayer-related query keys
 */
export const prayerQueryKeys = {
  times: prayerTimeKeys,
  islamicDate: islamicDateKeys,
  logs: prayerLogKeys,
  stats: prayerStatsKeys,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all prayer-related query keys
 * 
 * Useful for invalidating entire prayer cache
 */
export function getAllPrayerKeys() {
  return ['prayer'] as const;
}

/**
 * Get all keys for a specific user
 * 
 * Useful for invalidating user-specific data (e.g., on logout)
 */
export function getUserPrayerKeys(userId: string) {
  return [
    ...prayerLogKeys.user(userId),
    ...prayerStatsKeys.user(userId),
  ] as const;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type helpers for query key inference
 */
export type PrayerTimeQueryKey = 
  | ReturnType<typeof prayerTimeKeys.lists>
  | ReturnType<typeof prayerTimeKeys.list>
  | ReturnType<typeof prayerTimeKeys.details>
  | ReturnType<typeof prayerTimeKeys.detail>
  | ReturnType<typeof prayerTimeKeys.today>
  | ReturnType<typeof prayerTimeKeys.date>
  | ReturnType<typeof prayerTimeKeys.monthly>;

export type PrayerLogQueryKey = 
  | ReturnType<typeof prayerLogKeys.user>
  | ReturnType<typeof prayerLogKeys.daily>
  | ReturnType<typeof prayerLogKeys.today>
  | ReturnType<typeof prayerLogKeys.weekly>
  | ReturnType<typeof prayerLogKeys.monthly>;

export type PrayerStatsQueryKey = 
  | ReturnType<typeof prayerStatsKeys.user>
  | ReturnType<typeof prayerStatsKeys.streak>
  | ReturnType<typeof prayerStatsKeys.completionRate>;

export type IslamicDateQueryKey = 
  | ReturnType<typeof islamicDateKeys.date>
  | ReturnType<typeof islamicDateKeys.today>;

/**
 * Union of all prayer query key types
 */
export type PrayerQueryKey =
  | PrayerTimeQueryKey
  | PrayerLogQueryKey
  | PrayerStatsQueryKey
  | IslamicDateQueryKey;

// ============================================================================
// EXAMPLES
// ============================================================================

/**
 * Usage examples:
 * 
 * ```ts
 * // In a component
 * const { data } = useQuery({
 *   queryKey: prayerQueryKeys.times.today(location),
 *   queryFn: () => fetchTodayPrayerTimes(location),
 * });
 * 
 * // Invalidate specific query
 * queryClient.invalidateQueries({
 *   queryKey: prayerQueryKeys.times.today(location),
 * });
 * 
 * // Invalidate all prayer times
 * queryClient.invalidateQueries({
 *   queryKey: prayerQueryKeys.times.all,
 * });
 * 
 * // Invalidate all data for a user
 * queryClient.invalidateQueries({
 *   queryKey: prayerQueryKeys.logs.user(userId),
 * });
 * ```
 */