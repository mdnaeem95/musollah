import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { modernPrayerService } from '../../services/prayer.service';
import { useNetworkStatus } from '../useNetworkStatus';
import { DailyPrayerTimes } from '../../utils/types/prayer.types';
import { CACHE_KEYS } from '../../constants/prayer.constants';

interface UsePrayerQueryOptions {
  date: string;
  onSuccess?: (data: DailyPrayerTimes) => void;
  onError?: (error: Error) => void;
}

type UsePrayerQueryReturn = UseQueryResult<DailyPrayerTimes, Error> & {
  isOffline: boolean;
  usingStaleData: boolean;
};


/**
 * React Query wrapper for fetching prayer times
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Stale-while-revalidate strategy
 * - Offline support with cached data
 * - Auto-refetch on app foreground
 * - Type-safe with proper error handling
 */
export const usePrayerQuery = ({
  date,
  onSuccess,
  onError,
}: UsePrayerQueryOptions): UsePrayerQueryReturn => {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  // Main query
  const query = useQuery<DailyPrayerTimes, Error>({
    queryKey: [CACHE_KEYS.PRAYER_TIMES, date],
    queryFn: () => modernPrayerService.fetchPrayerTimesForDate(date),
    
    // Cache configuration
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    
    // Only fetch if online OR if we have cached data
    enabled: isOnline || !!queryClient.getQueryData([CACHE_KEYS.PRAYER_TIMES, date]),
    
    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch configuration
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
    refetchOnMount: false, // Use cached data on mount
    
    // Network mode - prioritize cache when offline
    networkMode: 'offlineFirst',
  });

  // Handle success callback
  useEffect(() => {
    if (query.isSuccess && query.data && onSuccess) {
      onSuccess(query.data);
    }
  }, [query.isSuccess, query.data, onSuccess]);

  // Handle error callback
  useEffect(() => {
    if (query.isError && query.error && onError) {
      onError(query.error);
    }
  }, [query.isError, query.error, onError]);

  // Auto-refetch when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnline) {
        query.refetch();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isOnline, query.refetch]);

  // Determine if using stale data
  const usingStaleData = !isOnline && !!query.data;

  return {
    ...query,
    isOffline: !isOnline,
    usingStaleData,
  };
};

/**
 * Hook for prefetching prayer times
 * Useful for preloading adjacent dates
 */
export const usePrefetchPrayerTimes = () => {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const prefetchDate = async (date: string) => {
    if (!isOnline) return;

    await queryClient.prefetchQuery({
      queryKey: [CACHE_KEYS.PRAYER_TIMES, date],
      queryFn: () => modernPrayerService.fetchPrayerTimesForDate(date),
      staleTime: 1000 * 60 * 60, // 1 hour
    });
  };

  const prefetchMultipleDates = async (dates: string[]) => {
    if (!isOnline) return;

    await Promise.all(dates.map(date => prefetchDate(date)));
  };

  return {
    prefetchDate,
    prefetchMultipleDates,
  };
};

/**
 * Hook for invalidating prayer time cache
 */
export const useInvalidatePrayerCache = () => {
  const queryClient = useQueryClient();

  const invalidateDate = async (date: string) => {
    await queryClient.invalidateQueries({
      queryKey: [CACHE_KEYS.PRAYER_TIMES, date],
    });
  };

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: [CACHE_KEYS.PRAYER_TIMES],
    });
  };

  return {
    invalidateDate,
    invalidateAll,
  };
};