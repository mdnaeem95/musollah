/**
 * Prayer Service Queries
 * 
 * TanStack Query hooks for prayer times and Islamic dates.
 * Provides automatic caching, refetching, and state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cache, TTL } from '../../client/storage';
import {
  fetchPrayerTimes,
  fetchTodayPrayerTimes,
  fetchPrayerTimesByDate,
  convertToIslamicDate,
  fetchMonthlyPrayerTimesFromFirebase,
  normalizePrayerTimes,
  getTodayDateForAPI,
} from './api';
import {
  PrayerTimesParams,
  PrayerTimesResponse,
  IslamicDateResponse,
  PRAYER_QUERY_KEYS,
  LocationCoordinates,
  DailyPrayerTime,
} from './types';

// ============================================================================
// PRAYER TIMES QUERIES
// ============================================================================

/**
 * Fetch prayer times for a specific location and date
 * 
 * Features:
 * - 24-hour cache (prayer times don't change within a day)
 * - Automatic refetch on mount if stale
 * - Background refetch on window focus
 */
export function usePrayerTimes(params: PrayerTimesParams) {
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.times(params),
    queryFn: async () => {
      // Check cache first
      const cacheKey = `prayer-times-${params.latitude}-${params.longitude}-${params.date || 'today'}`;
      const cached = cache.get<PrayerTimesResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 Using cached prayer times');
        return cached;
      }

      // Fetch from API
      console.log('🌐 Fetching prayer times from API');
      const response = await fetchPrayerTimes(params);
      
      // Cache for 24 hours
      cache.set(cacheKey, response, TTL.ONE_DAY);
      
      return response;
    },
    staleTime: TTL.ONE_DAY, // Consider data fresh for 24 hours
    gcTime: TTL.ONE_WEEK, // Keep in cache for 1 week
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetch today's prayer times for a specific location
 * 
 * Most commonly used query - optimized with aggressive caching
 */
export function useTodayPrayerTimes(location: LocationCoordinates) {
  const today = getTodayDateForAPI();
  
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.daily(today, location),
    queryFn: async () => {
      const cacheKey = `prayer-times-today-${location.latitude}-${location.longitude}`;
      const cached = cache.get<PrayerTimesResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 Using cached today prayer times');
        return cached;
      }

      console.log('🌐 Fetching today prayer times from API');
      const response = await fetchTodayPrayerTimes(
        location.latitude,
        location.longitude
      );
      
      // Cache until end of day
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const ttl = endOfDay.getTime() - now.getTime();
      
      cache.set(cacheKey, response, ttl);
      
      return response;
    },
    staleTime: TTL.ONE_HOUR, // Refetch every hour during active use
    gcTime: TTL.ONE_DAY,
    retry: 3,
    enabled: !!(location.latitude && location.longitude), // Only fetch if we have a location
  });
}

/**
 * Fetch prayer times for a specific date
 */
export function usePrayerTimesByDate(
  location: LocationCoordinates,
  date: Date
) {
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.daily(date.toISOString(), location),
    queryFn: async () => {
      const response = await fetchPrayerTimesByDate(
        location.latitude,
        location.longitude,
        date
      );
      return response;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
    enabled: !!(location.latitude && location.longitude),
  });
}

// ============================================================================
// MONTHLY PRAYER TIMES QUERY
// ============================================================================

/**
 * Fetch monthly prayer times from Firebase
 * 
 * @deprecated This will be replaced with client-side calculations
 */
export function useMonthlyPrayerTimes(year: number, month: number) {
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.monthly(year, month),
    queryFn: async () => {
      const cacheKey = `prayer-times-monthly-${year}-${month}`;
      const cached = cache.get<DailyPrayerTime[]>(cacheKey);
      
      if (cached) {
        console.log('🎯 Using cached monthly prayer times');
        return cached;
      }

      console.log('🌐 Fetching monthly prayer times from Firebase');
      const times = await fetchMonthlyPrayerTimesFromFirebase(year, month);
      
      // Cache for 1 month (data doesn't change)
      cache.set(cacheKey, times, TTL.ONE_MONTH);
      
      return times;
    },
    staleTime: TTL.ONE_MONTH, // Monthly data is static
    gcTime: TTL.ONE_MONTH * 3, // Keep for 3 months
    retry: 2,
  });
}

// ============================================================================
// ISLAMIC DATE QUERY
// ============================================================================

/**
 * Convert Gregorian date to Islamic (Hijri) date
 */
export function useIslamicDate(date: string) {
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.islamicDate(date),
    queryFn: async () => {
      const cacheKey = `islamic-date-${date}`;
      const cached = cache.get<IslamicDateResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 Using cached Islamic date');
        return cached;
      }

      console.log('🌐 Fetching Islamic date from API');
      const response = await convertToIslamicDate(date);
      
      // Cache Islamic dates indefinitely (they never change)
      cache.set(cacheKey, response, TTL.ONE_MONTH * 12);
      
      return response;
    },
    staleTime: Infinity, // Islamic dates never change
    gcTime: Infinity,
    retry: 2,
    enabled: !!date,
  });
}

/**
 * Get today's Islamic date
 */
export function useTodayIslamicDate() {
  const today = getTodayDateForAPI();
  return useIslamicDate(today);
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Prefetch prayer times for a location
 * Useful for preloading data before navigation
 */
export function usePrefetchPrayerTimes() {
  const queryClient = useQueryClient();

  return {
    prefetchToday: async (location: LocationCoordinates) => {
      const today = getTodayDateForAPI();
      await queryClient.prefetchQuery({
        queryKey: PRAYER_QUERY_KEYS.daily(today, location),
        queryFn: () =>
          fetchTodayPrayerTimes(location.latitude, location.longitude),
        staleTime: TTL.ONE_DAY,
      });
    },
    
    prefetchDate: async (location: LocationCoordinates, date: Date) => {
      await queryClient.prefetchQuery({
        queryKey: PRAYER_QUERY_KEYS.daily(date.toISOString(), location),
        queryFn: () =>
          fetchPrayerTimesByDate(location.latitude, location.longitude, date),
        staleTime: TTL.ONE_DAY,
      });
    },

    prefetchMonth: async (year: number, month: number) => {
      await queryClient.prefetchQuery({
        queryKey: PRAYER_QUERY_KEYS.monthly(year, month),
        queryFn: () => fetchMonthlyPrayerTimesFromFirebase(year, month),
        staleTime: TTL.ONE_MONTH,
      });
    },
  };
}

// ============================================================================
// INVALIDATION UTILITIES
// ============================================================================

/**
 * Invalidate prayer times cache
 * Use when location changes or manual refresh is needed
 */
export function useInvalidatePrayerTimes() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: PRAYER_QUERY_KEYS.all,
      });
    },
    
    invalidateToday: (location: LocationCoordinates) => {
      const today = getTodayDateForAPI();
      queryClient.invalidateQueries({
        queryKey: PRAYER_QUERY_KEYS.daily(today, location),
      });
    },

    invalidateMonth: (year: number, month: number) => {
      queryClient.invalidateQueries({
        queryKey: PRAYER_QUERY_KEYS.monthly(year, month),
      });
    },
  };
}

// ============================================================================
// OPTIMISTIC UPDATES EXAMPLE (for prayer logs)
// ============================================================================

/**
 * Example mutation for logging prayers with optimistic updates
 */
export function useLogPrayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      prayer: string;
      timestamp: number;
      location?: LocationCoordinates;
    }) => {
      // TODO: Implement actual API call to log prayer
      console.log('🕌 Logging prayer:', log);
      return log;
    },
    
    // Optimistic update
    onMutate: async (newLog) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['prayers', 'logs'],
      });

      // Snapshot previous value
      const previousLogs = queryClient.getQueryData(['prayers', 'logs']);

      // Optimistically update
      queryClient.setQueryData(['prayers', 'logs'], (old: any) => {
        return [...(old || []), newLog];
      });

      return { previousLogs };
    },
    
    // Rollback on error
    onError: (err, newLog, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(['prayers', 'logs'], context.previousLogs);
      }
    },
    
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['prayers', 'logs'],
      });
    },
  });
}