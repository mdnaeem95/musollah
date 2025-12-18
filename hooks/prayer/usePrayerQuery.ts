import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { modernPrayerService } from '../../services/prayer.service';
import { useNetworkStatus } from '../useNetworkStatus';
import { DailyPrayerTimes } from '../../utils/types/prayer.types';

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
 * ✅ FIXED: Removed placeholderData, using proper cache behavior
 */
export const usePrayerQuery = ({
  date,
  onSuccess,
  onError,
}: UsePrayerQueryOptions): UsePrayerQueryReturn => {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  
  // Track callbacks to prevent duplicates
  const lastSuccessDate = useRef<string | null>(null);
  const lastErrorMessage = useRef<string | null>(null);

  // ✅ Main query - SIMPLIFIED, no placeholderData
  const query = useQuery<DailyPrayerTimes, Error>({
    queryKey: PRAYER_QUERY_KEYS.daily(date),
    queryFn: async () => {
      console.log('🌐 Fetching prayer times for:', date);
      const result = await modernPrayerService.fetchPrayerTimesForDate(date);
      console.log('✅ Prayer times fetched:', result ? 'success' : 'null');
      return result;
    },
    
    staleTime: 1000 * 60 * 60 * 24, // ✅ 24 hours (Firebase data doesn't change)
    gcTime: 1000 * 60 * 60 * 24 * 7, // ✅ Keep in cache for 7 days
    
    // ✅ IMPORTANT: Enable refetch on mount to ensure fresh data
    refetchOnMount: 'always', // Always check if data is stale
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    networkMode: isOnline ? 'online' : 'offlineFirst',
  });

  // Success callback
  useEffect(() => {
    if (query.isSuccess && query.data && onSuccess) {
      const dataDate = query.data.date || date;
      if (lastSuccessDate.current !== dataDate) {
        lastSuccessDate.current = dataDate;
        onSuccess(query.data);
      }
    }
  }, [query.isSuccess, query.data, onSuccess, date]);

  // Error callback
  useEffect(() => {
    if (query.isError && query.error && onError) {
      const errorMsg = query.error.message;
      if (lastErrorMessage.current !== errorMsg) {
        lastErrorMessage.current = errorMsg;
        onError(query.error);
      }
    }
  }, [query.isError, query.error, onError]);

  // ✅ FIXED: Only invalidate on app foreground, NOT on date change
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Only refetch when app comes to foreground AND we're online
      if (nextAppState === 'active' && isOnline) {
        console.log('📱 App foregrounded, refreshing current date:', date);
        queryClient.invalidateQueries({ 
          queryKey: PRAYER_QUERY_KEYS.daily(date),
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [date, isOnline, queryClient]);

  // Determine if using stale data
  const usingStaleData = !isOnline && !!query.data;

  return {
    ...query,
    isOffline: !isOnline,
    usingStaleData,
  };
};

export const usePrefetchPrayerTimes = () => {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();

  const prefetchDate = async (date: string) => {
    if (!isOnline) return;

    await queryClient.prefetchQuery({
      queryKey: PRAYER_QUERY_KEYS.daily(date),
      queryFn: () => modernPrayerService.fetchPrayerTimesForDate(date),
      staleTime: 1000 * 60 * 60 * 24,
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
      queryKey: PRAYER_QUERY_KEYS.daily(date),
    });
  };

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: PRAYER_QUERY_KEYS.all,
    });
  };

  return { invalidateDate, invalidateAll };
};