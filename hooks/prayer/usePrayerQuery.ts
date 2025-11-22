import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { modernPrayerService } from '../../services/prayer.service';
import { useNetworkStatus } from '../useNetworkStatus';
import { DailyPrayerTimes } from '../../utils/types/prayer.types';
import { CACHE_KEYS } from '../../constants/prayer.constants';

const PRAYER_QUERY_KEYS = {
  all: ['prayer-times'] as const,
  daily: (date: string) => ['prayer-times', 'daily', date] as const,
};

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
 * ✅ SIMPLIFIED: Removed complex logic that was causing issues
 */
export const usePrayerQuery = ({
  date,
  onSuccess,
  onError,
}: UsePrayerQueryOptions): UsePrayerQueryReturn => {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  
  // Track last successful invocation to prevent duplicate callbacks
  const lastSuccessDate = useRef<string | null>(null);
  const lastErrorMessage = useRef<string | null>(null);

  // Main query - SIMPLIFIED
  const query = useQuery<DailyPrayerTimes, Error>({
    queryKey: PRAYER_QUERY_KEYS.daily(date), // ✅ Standard key format
    queryFn: async () => {
      console.log('🌐 Executing query function for date:', date);
      const result = await modernPrayerService.fetchPrayerTimesForDate(date);
      console.log('✅ Query function returned:', {
        date: result?.date,
        hasData: !!result,
      });
      return result;
    },
    
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: isOnline ? 'online' : 'offlineFirst',
  });

  // ✅ SIMPLIFIED: Success callback with duplicate prevention
  useEffect(() => {
    if (query.isSuccess && query.data && onSuccess) {
      const dataDate = query.data.date || date;
      if (lastSuccessDate.current !== dataDate) {
        lastSuccessDate.current = dataDate;
        onSuccess(query.data);
      }
    }
  }, [query.isSuccess, query.data, onSuccess, date]);

  // ✅ SIMPLIFIED: Error callback with duplicate prevention
  useEffect(() => {
    if (query.isError && query.error && onError) {
      const errorMsg = query.error.message;
      if (lastErrorMessage.current !== errorMsg) {
        lastErrorMessage.current = errorMsg;
        onError(query.error);
      }
    }
  }, [query.isError, query.error, onError]);

  // ✅ SIMPLIFIED: Auto-refetch on foreground (no dependencies on query.refetch)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnline) {
        // Use queryClient directly to avoid dependency issues
        queryClient.invalidateQueries({ 
          queryKey: [CACHE_KEYS.PRAYER_TIMES, date],
        });
      }
    });

    return () => subscription.remove();
  }, [date, isOnline, queryClient]); // ✅ Stable dependencies only

  // Determine if using stale data
  const usingStaleData = !isOnline && !!query.data;

  return {
    ...query,
    isOffline: !isOnline,
    usingStaleData,
  };
};

// Keep prefetch and invalidate hooks unchanged
export const usePrefetchPrayerTimes = () => {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const prefetchDate = async (date: string) => {
    if (!isOnline) return;

    await queryClient.prefetchQuery({
      queryKey: [CACHE_KEYS.PRAYER_TIMES, date],
      queryFn: () => modernPrayerService.fetchPrayerTimesForDate(date),
      staleTime: 1000 * 60 * 60,
    });
  };

  const prefetchMultipleDates = async (dates: string[]) => {
    if (!isOnline) return;
    await Promise.all(dates.map(date => prefetchDate(date)));
  };

  return { prefetchDate, prefetchMultipleDates };
};

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

  return { invalidateDate, invalidateAll };
};