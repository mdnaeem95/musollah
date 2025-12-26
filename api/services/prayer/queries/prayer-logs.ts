/**
 * Prayer Logs Queries
 * 
 * TanStack Query hooks for prayer logging with optimistic updates.
 * 
 * Features:
 * - Instant UI feedback (optimistic updates)
 * - Automatic rollback on errors
 * - Streak tracking
 * - Statistics calculation
 * 
 * @version 4.0
 * @since 2025-12-24
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchPrayerLog, savePrayerLog, fetchWeeklyPrayerLogs, calculatePrayerStats } from '../api/firebase';
import { prayerQueryKeys } from './query-keys';
import { PrayerLog, PrayerServiceError, PrayerErrorCode, LoggablePrayerName } from '../types/index';
import { STALE_TIME, CACHE_TTL, DATE_FORMATS, ERROR_MESSAGES } from '../types/constants';
import { logger } from '../../../../services/logging/logger';

// ============================================================================
// SINGLE DAY PRAYER LOG
// ============================================================================

/**
 * Fetch prayer log for a specific date
 * 
 * @param userId - User ID (null if not authenticated)
 * @param date - Date string (YYYY-MM-DD)
 * @returns Prayer log or null
 * 
 * @example
 * ```tsx
 * function PrayerLogForDate({ date }: { date: string }) {
 *   const userId = useUserId();
 *   const { data, isLoading } = usePrayerLog(userId, date);
 *   
 *   if (isLoading) return <Loading />;
 *   return <PrayerStatus prayers={data?.prayers} />;
 * }
 * ```
 */
export function usePrayerLog(userId: string | null, date: string) {
  return useQuery({
    queryKey: prayerQueryKeys.logs.daily(userId!, date),
    queryFn: async (): Promise<PrayerLog | null> => {
      const startTime = Date.now();
      
      if (!userId) {
        logger.error('Prayer log query failed: User not authenticated', {
          error: 'Missing userId',
          errorCode: PrayerErrorCode.UNAUTHORIZED,
          requestedDate: date,
        });
        throw new PrayerServiceError(
          PrayerErrorCode.UNAUTHORIZED,
          ERROR_MESSAGES.UNAUTHORIZED
        );
      }

      logger.debug('Fetching prayer log for date', {
        userId: userId.substring(0, 8) + '...',
        date,
        queryType: 'daily-log',
      });

      const fetchStart = Date.now();
      const log = await fetchPrayerLog(userId, date);
      const fetchDuration = Date.now() - fetchStart;

      if (log) {
        const prayersLogged = Object.values(log.prayers).filter(Boolean).length;
        const totalPrayers = Object.keys(log.prayers).length;
        const completionRate = Math.round((prayersLogged / totalPrayers) * 100);
        
        logger.success('Prayer log fetched successfully', {
          date,
          prayersLogged,
          totalPrayers,
          completionRate: `${completionRate}%`,
          prayers: log.prayers,
          fetchDuration: `${fetchDuration}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        });
      } else {
        logger.debug('No prayer log found for date', {
          date,
          reason: 'Log not created yet',
          fetchDuration: `${fetchDuration}ms`,
          totalDuration: `${Date.now() - startTime}ms`,
        });
      }

      return log;
    },
    staleTime: STALE_TIME.PRAYER_LOG,
    gcTime: CACHE_TTL.ONE_HOUR,
    enabled: !!userId && !!date,
    retry: 1,
  });
}

/**
 * Fetch today's prayer log
 * 
 * Convenience hook for current day's log
 * 
 * @param userId - User ID
 * @returns Today's prayer log
 * 
 * @example
 * ```tsx
 * function TodayPrayerLog() {
 *   const userId = useUserId();
 *   const { data } = useTodayPrayerLog(userId);
 *   
 *   return <PrayerChecklist prayers={data?.prayers} />;
 * }
 * ```
 */
export function useTodayPrayerLog(userId: string | null) {
  const today = format(new Date(), DATE_FORMATS.ISO);
  
  logger.debug('Fetching today\'s prayer log', {
    date: today,
    queryType: 'today-log',
  });
  
  return usePrayerLog(userId, today);
}

// ============================================================================
// WEEKLY PRAYER LOGS
// ============================================================================

/**
 * Fetch weekly prayer logs
 * 
 * Returns logs for a 7-day period
 * 
 * @param userId - User ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Weekly prayer logs
 * 
 * @example
 * ```tsx
 * function WeeklyCalendar() {
 *   const userId = useUserId();
 *   const { data } = useWeeklyPrayerLogs(userId, '2025-12-16', '2025-12-22');
 *   
 *   return (
 *     <View>
 *       {Object.entries(data || {}).map(([date, prayers]) => (
 *         <DayRow key={date} date={date} prayers={prayers} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useWeeklyPrayerLogs(
  userId: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: prayerQueryKeys.logs.weekly(userId!, startDate, endDate),
    queryFn: async (): Promise<Record<string, PrayerLog['prayers']>> => {
      const startTime = Date.now();
      
      if (!userId) {
        logger.error('Weekly prayer logs query failed: User not authenticated', {
          error: 'Missing userId',
          errorCode: PrayerErrorCode.UNAUTHORIZED,
          dateRange: `${startDate} to ${endDate}`,
        });
        throw new PrayerServiceError(
          PrayerErrorCode.UNAUTHORIZED,
          ERROR_MESSAGES.UNAUTHORIZED
        );
      }

      logger.debug('Fetching weekly prayer logs', {
        userId: userId.substring(0, 8) + '...',
        startDate,
        endDate,
        dateRange: `${startDate} to ${endDate}`,
        queryType: 'weekly-logs',
      });

      const fetchStart = Date.now();
      const logs = await fetchWeeklyPrayerLogs(userId, startDate, endDate);
      const fetchDuration = Date.now() - fetchStart;
      
      const daysWithLogs = Object.keys(logs).length;
      let totalPrayersLogged = 0;
      let totalPossiblePrayers = 0;
      
      Object.values(logs).forEach(prayers => {
        const prayersLogged = Object.values(prayers).filter(Boolean).length;
        totalPrayersLogged += prayersLogged;
        totalPossiblePrayers += Object.keys(prayers).length;
      });
      
      const weeklyCompletionRate = totalPossiblePrayers > 0 
        ? Math.round((totalPrayersLogged / totalPossiblePrayers) * 100)
        : 0;

      logger.success('Weekly prayer logs fetched successfully', {
        dateRange: `${startDate} to ${endDate}`,
        daysWithLogs,
        totalPrayersLogged,
        totalPossiblePrayers,
        weeklyCompletionRate: `${weeklyCompletionRate}%`,
        fetchDuration: `${fetchDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });

      return logs;
    },
    staleTime: STALE_TIME.PRAYER_LOG,
    gcTime: CACHE_TTL.ONE_HOUR,
    enabled: !!userId && !!startDate && !!endDate,
    retry: 1,
  });
}

// ============================================================================
// PRAYER STATISTICS
// ============================================================================

/**
 * Fetch prayer statistics for a user
 * 
 * Calculates:
 * - Total prayers logged
 * - Completion rate
 * - Current streak
 * - Longest streak
 * 
 * @param userId - User ID
 * @returns Prayer statistics
 * 
 * @example
 * ```tsx
 * function StatsDisplay() {
 *   const userId = useUserId();
 *   const { data } = usePrayerStats(userId);
 *   
 *   return (
 *     <View>
 *       <Text>Streak: {data?.currentStreak} days</Text>
 *       <Text>Rate: {data?.completionRate}%</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function usePrayerStats(userId: string | null) {
  return useQuery({
    queryKey: prayerQueryKeys.stats.user(userId!),
    queryFn: async () => {
      const startTime = Date.now();
      
      if (!userId) {
        logger.error('Prayer stats query failed: User not authenticated', {
          error: 'Missing userId',
          errorCode: PrayerErrorCode.UNAUTHORIZED,
        });
        throw new PrayerServiceError(
          PrayerErrorCode.UNAUTHORIZED,
          ERROR_MESSAGES.UNAUTHORIZED
        );
      }

      logger.debug('Calculating prayer statistics', {
        userId: userId.substring(0, 8) + '...',
        queryType: 'stats',
      });

      const calcStart = Date.now();
      const stats = await calculatePrayerStats(userId);
      const calcDuration = Date.now() - calcStart;

      logger.success('Prayer statistics calculated successfully', {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        completionRate: `${stats.completionRate}%`,
        totalPrayers: stats.totalPrayers,
        completedPrayers: stats.completedPrayers,
        calcDuration: `${calcDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });

      return stats;
    },
    staleTime: STALE_TIME.PRAYER_STATS,
    gcTime: CACHE_TTL.ONE_HOUR,
    enabled: !!userId,
    retry: 1,
  });
}

// ============================================================================
// SAVE PRAYER LOG MUTATION
// ============================================================================

/**
 * Save prayer log mutation with optimistic updates
 * 
 * Features:
 * - Instant UI feedback
 * - Automatic rollback on error
 * - Invalidates related queries on success
 * 
 * @returns Mutation object
 * 
 * @example
 * ```tsx
 * function PrayerCheckbox({ prayer, date }: Props) {
 *   const userId = useUserId();
 *   const { data: log } = usePrayerLog(userId, date);
 *   const { mutate } = useSavePrayerLog();
 *   
 *   const handleToggle = () => {
 *     const newPrayers = {
 *       ...log?.prayers,
 *       [prayer]: !log?.prayers[prayer],
 *     };
 *     
 *     mutate({ userId, date, prayers: newPrayers });
 *   };
 *   
 *   return (
 *     <Checkbox
 *       checked={log?.prayers[prayer] ?? false}
 *       onChange={handleToggle}
 *     />
 *   );
 * }
 * ```
 */
export function useSavePrayerLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      date,
      prayers,
    }: {
      userId: string;
      date: string;
      prayers: PrayerLog['prayers'];
    }) => {
      const startTime = Date.now();
      const prayersLogged = Object.values(prayers).filter(Boolean).length;
      const totalPrayers = Object.keys(prayers).length;
      
      logger.debug('Starting prayer log mutation', {
        userId: userId.substring(0, 8) + '...',
        date,
        prayersLogged,
        totalPrayers,
        prayers,
        mutationType: 'save-log',
      });

      const saveStart = Date.now();
      const result = await savePrayerLog(userId, date, prayers);
      const saveDuration = Date.now() - saveStart;

      logger.success('Prayer log saved to Firebase', {
        date,
        prayersLogged,
        totalPrayers,
        completionRate: `${Math.round((prayersLogged / totalPrayers) * 100)}%`,
        saveDuration: `${saveDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
        mutationType: 'save-log',
      });

      return result;
    },

    // ========================================================================
    // OPTIMISTIC UPDATE
    // ========================================================================
    onMutate: async ({ userId, date, prayers }) => {
      const mutateStart = Date.now();
      const prayersLogged = Object.values(prayers).filter(Boolean).length;
      const totalPrayers = Object.keys(prayers).length;
      
      logger.debug('Applying optimistic update', {
        userId: userId.substring(0, 8) + '...',
        date,
        prayersLogged,
        totalPrayers,
        phase: 'optimistic-update',
      });

      // Cancel outgoing queries to avoid race conditions
      const cancelStart = Date.now();
      await queryClient.cancelQueries({
        queryKey: prayerQueryKeys.logs.daily(userId, date),
      });
      const cancelDuration = Date.now() - cancelStart;
      
      logger.debug('Outgoing queries cancelled', {
        date,
        cancelDuration: `${cancelDuration}ms`,
        phase: 'query-cancellation',
      });

      // Snapshot previous value
      const previousLog = queryClient.getQueryData<PrayerLog | null>(
        prayerQueryKeys.logs.daily(userId, date)
      );
      
      logger.debug('Previous state snapshot captured', {
        date,
        hadPreviousLog: !!previousLog,
        previousPrayersLogged: previousLog 
          ? Object.values(previousLog.prayers).filter(Boolean).length 
          : 0,
        phase: 'snapshot',
      });

      // Optimistically update query data
      const optimisticLog: PrayerLog = {
        userId,
        date,
        prayers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        prayerQueryKeys.logs.daily(userId, date),
        optimisticLog
      );

      const mutateDuration = Date.now() - mutateStart;
      logger.success('Optimistic update applied to cache', {
        date,
        prayersLogged,
        totalPrayers,
        mutateDuration: `${mutateDuration}ms`,
        phase: 'optimistic-update',
        instant: true,
      });

      // Return context for rollback
      return { previousLog };
    },

    // ========================================================================
    // ERROR ROLLBACK
    // ========================================================================
    onError: (error, { userId, date }, context) => {
      const errorStart = Date.now();
      
      logger.error('Prayer log mutation failed, initiating rollback', {
        date,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof PrayerServiceError ? error.code : 'UNKNOWN',
        phase: 'error-handler',
      });

      // Rollback to previous value
      if (context?.previousLog !== undefined) {
        queryClient.setQueryData(
          prayerQueryKeys.logs.daily(userId, date),
          context.previousLog
        );
        
        const errorDuration = Date.now() - errorStart;
        logger.success('Rolled back to previous state', {
          date,
          hadPreviousLog: !!context.previousLog,
          rollbackDuration: `${errorDuration}ms`,
          phase: 'rollback',
        });
      } else {
        logger.warn('No previous state to rollback to', {
          date,
          phase: 'rollback',
        });
      }
    },

    // ========================================================================
    // SUCCESS INVALIDATION
    // ========================================================================
    onSuccess: (data, { userId, date }) => {
      const successStart = Date.now();
      
      logger.debug('Prayer log mutation succeeded, invalidating related queries', {
        date,
        phase: 'success-handler',
      });

      // Invalidate related queries
      const invalidateStart = Date.now();
      
      queryClient.invalidateQueries({
        queryKey: prayerQueryKeys.logs.user(userId),
      });

      queryClient.invalidateQueries({
        queryKey: prayerQueryKeys.stats.user(userId),
      });
      
      const invalidateDuration = Date.now() - invalidateStart;
      const successDuration = Date.now() - successStart;

      logger.success('Related queries invalidated', {
        userId: userId.substring(0, 8) + '...',
        queriesInvalidated: ['logs.user', 'stats.user'],
        invalidateDuration: `${invalidateDuration}ms`,
        totalSuccessDuration: `${successDuration}ms`,
        phase: 'invalidation',
      });
    },

    // ========================================================================
    // SETTLED
    // ========================================================================
    onSettled: (data, error, { userId, date }) => {
      const settledStart = Date.now();
      
      logger.debug('Prayer log mutation settled, ensuring data consistency', {
        date,
        hadError: !!error,
        phase: 'settled',
      });

      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: prayerQueryKeys.logs.daily(userId, date),
      });

      const settledDuration = Date.now() - settledStart;
      logger.success('Mutation settled, daily log invalidated', {
        date,
        settledDuration: `${settledDuration}ms`,
        phase: 'settled',
        ensuredConsistency: true,
      });
    },
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Save multiple prayer logs at once
 * 
 * Useful for bulk operations or syncing offline data
 * 
 * @returns Mutation object
 * 
 * @example
 * ```tsx
 * const { mutate } = useBatchSavePrayerLogs();
 * 
 * mutate({
 *   userId,
 *   logs: [
 *     { date: '2025-12-22', prayers: { Subuh: true, Zohor: true } },
 *     { date: '2025-12-21', prayers: { Subuh: true, Zohor: false } },
 *   ],
 * });
 * ```
 */
export function useBatchSavePrayerLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      logs,
    }: {
      userId: string;
      logs: Array<{ date: string; prayers: PrayerLog['prayers'] }>;
    }) => {
      const startTime = Date.now();
      const totalLogs = logs.length;
      
      logger.debug('Starting batch prayer log save', {
        userId: userId.substring(0, 8) + '...',
        totalLogs,
        dates: logs.map(l => l.date),
        mutationType: 'batch-save',
      });

      // Save all logs
      const saveStart = Date.now();
      const results = await Promise.all(
        logs.map(({ date, prayers }) => savePrayerLog(userId, date, prayers))
      );
      const saveDuration = Date.now() - saveStart;

      const totalPrayersLogged = logs.reduce((sum, log) => {
        return sum + Object.values(log.prayers).filter(Boolean).length;
      }, 0);

      logger.success('Batch prayer log save complete', {
        totalLogs,
        savedLogs: results.length,
        totalPrayersLogged,
        saveDuration: `${saveDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
        avgDurationPerLog: `${Math.round(saveDuration / totalLogs)}ms`,
        mutationType: 'batch-save',
      });

      return results;
    },

    onSuccess: (data, { userId, logs }) => {
      const successStart = Date.now();
      
      logger.debug('Batch save succeeded, invalidating user queries', {
        userId: userId.substring(0, 8) + '...',
        totalLogs: logs.length,
        phase: 'batch-success',
      });

      // Invalidate all user logs
      queryClient.invalidateQueries({
        queryKey: prayerQueryKeys.logs.user(userId),
      });

      queryClient.invalidateQueries({
        queryKey: prayerQueryKeys.stats.user(userId),
      });

      const successDuration = Date.now() - successStart;
      logger.success('Batch save: user queries invalidated', {
        userId: userId.substring(0, 8) + '...',
        queriesInvalidated: ['logs.user', 'stats.user'],
        successDuration: `${successDuration}ms`,
        phase: 'batch-invalidation',
      });
    },

    onError: (error, { userId, logs }) => {
      logger.error('Batch prayer log save failed', {
        userId: userId.substring(0, 8) + '...',
        totalLogs: logs.length,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof PrayerServiceError ? error.code : 'UNKNOWN',
        phase: 'batch-error',
      });
    },
  });
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Prefetch prayer log for a date
 * 
 * @example
 * ```tsx
 * const prefetchLog = usePrefetchPrayerLog();
 * 
 * // Prefetch tomorrow's log when viewing today
 * useEffect(() => {
 *   const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
 *   prefetchLog(userId, tomorrow);
 * }, [userId]);
 * ```
 */
export function usePrefetchPrayerLog() {
  const queryClient = useQueryClient();

  return async (userId: string, date: string) => {
    const startTime = Date.now();
    
    logger.debug('Prefetching prayer log for date', {
      userId: userId.substring(0, 8) + '...',
      date,
      operation: 'prefetch',
    });

    try {
      await queryClient.prefetchQuery({
        queryKey: prayerQueryKeys.logs.daily(userId, date),
        queryFn: () => fetchPrayerLog(userId, date),
      });

      logger.success('Prayer log prefetched successfully', {
        date,
        duration: `${Date.now() - startTime}ms`,
        operation: 'prefetch',
      });
    } catch (error) {
      logger.error('Prayer log prefetch failed', {
        date,
        error: error instanceof Error ? error.message : String(error),
        duration: `${Date.now() - startTime}ms`,
        operation: 'prefetch',
      });
    }
  };
}

/**
 * Prefetch weekly prayer logs
 */
export function usePrefetchWeeklyPrayerLogs() {
  const queryClient = useQueryClient();

  return async (userId: string, startDate: string, endDate: string) => {
    const startTime = Date.now();
    
    logger.debug('Prefetching weekly prayer logs', {
      userId: userId.substring(0, 8) + '...',
      dateRange: `${startDate} to ${endDate}`,
      operation: 'prefetch',
    });

    try {
      await queryClient.prefetchQuery({
        queryKey: prayerQueryKeys.logs.weekly(userId, startDate, endDate),
        queryFn: () => fetchWeeklyPrayerLogs(userId, startDate, endDate),
      });

      logger.success('Weekly prayer logs prefetched successfully', {
        dateRange: `${startDate} to ${endDate}`,
        duration: `${Date.now() - startTime}ms`,
        operation: 'prefetch',
      });
    } catch (error) {
      logger.error('Weekly prayer logs prefetch failed', {
        dateRange: `${startDate} to ${endDate}`,
        error: error instanceof Error ? error.message : String(error),
        duration: `${Date.now() - startTime}ms`,
        operation: 'prefetch',
      });
    }
  };
}

// ============================================================================
// INVALIDATION UTILITIES
// ============================================================================

/**
 * Invalidate all logs for a user
 * 
 * Forces refetch of all prayer logs
 * 
 * @example
 * ```tsx
 * const invalidateLogs = useInvalidatePrayerLogs();
 * 
 * // After manual sync or logout
 * invalidateLogs(userId);
 * ```
 */
export function useInvalidatePrayerLogs() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    logger.info('Invalidating all prayer logs for user', {
      userId: userId.substring(0, 8) + '...',
      operation: 'invalidate',
      scope: 'all-user-logs',
    });

    queryClient.invalidateQueries({
      queryKey: prayerQueryKeys.logs.user(userId),
    });

    queryClient.invalidateQueries({
      queryKey: prayerQueryKeys.stats.user(userId),
    });

    logger.success('All user prayer logs invalidated', {
      userId: userId.substring(0, 8) + '...',
      queriesInvalidated: ['logs.user', 'stats.user'],
      operation: 'invalidate',
    });
  };
}

/**
 * Invalidate prayer log for specific date
 */
export function useInvalidatePrayerLogByDate() {
  const queryClient = useQueryClient();

  return (userId: string, date: string) => {
    logger.info('Invalidating prayer log for specific date', {
      userId: userId.substring(0, 8) + '...',
      date,
      operation: 'invalidate',
      scope: 'specific-date',
    });

    queryClient.invalidateQueries({
      queryKey: prayerQueryKeys.logs.daily(userId, date),
    });

    logger.success('Prayer log for date invalidated', {
      date,
      operation: 'invalidate',
    });
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Check if a prayer is logged for a specific date
 * 
 * @param userId - User ID
 * @param date - Date string
 * @param prayerName - Prayer name
 * @returns True if prayer is logged
 * 
 * @example
 * ```tsx
 * function PrayerStatus({ date, prayer }: Props) {
 *   const userId = useUserId();
 *   const isLogged = useIsPrayerLogged(userId, date, prayer);
 *   
 *   return <Icon name={isLogged ? 'check' : 'x'} />;
 * }
 * ```
 */
export function useIsPrayerLogged(
  userId: string | null,
  date: string,
  prayerName: LoggablePrayerName
): boolean {
  const { data } = usePrayerLog(userId, date);
  const isLogged = data?.prayers?.[prayerName] ?? false;
  
  logger.debug('Checking if prayer is logged', {
    date,
    prayer: prayerName,
    isLogged,
    queryType: 'prayer-status-check',
  });
  
  return isLogged;
}

/**
 * Get completion count for a date
 * 
 * @param userId - User ID
 * @param date - Date string
 * @returns Number of completed prayers (0-5)
 */
export function usePrayerCompletionCount(
  userId: string | null,
  date: string
): number {
  const { data } = usePrayerLog(userId, date);
  
  if (!data?.prayers) {
    logger.debug('No prayer data for completion count', {
      date,
      count: 0,
      queryType: 'completion-count',
    });
    return 0;
  }
  
  const count = Object.values(data.prayers).filter(Boolean).length;
  const totalPrayers = Object.keys(data.prayers).length;
  
  logger.debug('Prayer completion count calculated', {
    date,
    count,
    totalPrayers,
    completionRate: `${Math.round((count / totalPrayers) * 100)}%`,
    queryType: 'completion-count',
  });
  
  return count;
}

/**
 * Check if all prayers are completed for a date
 * 
 * @param userId - User ID
 * @param date - Date string
 * @returns True if all 5 prayers logged
 */
export function useIsDateFullyLogged(
  userId: string | null,
  date: string
): boolean {
  const count = usePrayerCompletionCount(userId, date);
  const isFullyLogged = count === 5; // Subuh, Zohor, Asar, Maghrib, Isyak
  
  logger.debug('Checking if date is fully logged', {
    date,
    count,
    isFullyLogged,
    requiredPrayers: 5,
    queryType: 'full-completion-check',
  });
  
  return isFullyLogged;
}