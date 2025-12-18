import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cache, TTL } from '../../client/storage';
import { 
  fetchPrayerTimes, 
  fetchTodayPrayerTimes, 
  fetchPrayerTimesByDate, 
  convertToIslamicDate, 
  fetchMonthlyPrayerTimesFromFirebase, 
  fetchDailyPrayerTimeFromFirebase, // ✅ ADD THIS
  getTodayDateForAPI 
} from './api';
import { 
  PrayerTimesParams, 
  PrayerTimesResponse, 
  IslamicDateResponse, 
  PRAYER_QUERY_KEYS, 
  LocationCoordinates, 
  DailyPrayerTime, 
  HijriDate 
} from './types';
import { ENGLISH_TO_MONTH_NUMBER, SINGAPORE_ISLAMIC_MONTHS } from '../../../constants/prayer.constants';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firebase MUIS times to PrayerTimesResponse format
 * ✅ FIXED: Now fetches Islamic date or uses cached value
 */
async function convertMUISToResponse(
  muisTime: DailyPrayerTime,
  location: LocationCoordinates
): Promise<PrayerTimesResponse> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // ✅ Fetch Islamic date (with cache)
  let hijriData: HijriDate | null = null;
  try {
    // Format date as DD-MM-YYYY for Aladhan API
    const dateStr = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const cacheKey = `islamic-date-${dateStr}`;
    
    const cached = cache.get<IslamicDateResponse>(cacheKey);
    if (cached) {
      hijriData = cached.data.hijri;
    } else {
      const islamicResponse = await convertToIslamicDate(dateStr);
      cache.set(cacheKey, islamicResponse, TTL.ONE_MONTH * 12);
      hijriData = islamicResponse.data.hijri;
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch Islamic date:', error);
  }

  return {
    code: 200,
    status: 'OK',
    data: {
      timings: {
        Fajr: muisTime.subuh,
        Sunrise: muisTime.syuruk,
        Dhuhr: muisTime.zohor,
        Asr: muisTime.asar,
        Maghrib: muisTime.maghrib,
        Isha: muisTime.isyak,
      },
      date: {
        readable: format(now, 'dd MMM yyyy'),
        timestamp: Math.floor(now.getTime() / 1000).toString(),
        gregorian: {
          date: format(now, 'dd-MM-yyyy'),
          format: 'DD-MM-YYYY',
          day: day.toString(),
          weekday: { en: format(now, 'EEEE') },
          month: { number: month, en: format(now, 'MMMM') },
          year: year.toString(),
          designation: { abbreviated: 'AD', expanded: 'Anno Domini' },
        },
        hijri: hijriData || {
          // ✅ Fallback with safe default values
          date: '01-01-1446',
          format: 'DD-MM-YYYY',
          day: '1',
          weekday: { en: 'Friday' },
          month: { number: 1, en: 'Muharram' },
          year: '1446',
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
          holidays: [],
        },
      },
      meta: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: 'Asia/Singapore',
        method: {
          id: 11,
          name: 'MUIS Official (Singapore)',
          params: { Fajr: 20, Isha: 18 },
        },
        latitudeAdjustmentMethod: 'ANGLE_BASED',
        midnightMode: 'STANDARD',
        school: 'Shafi',
        offset: {},
      },
    },
  };
}

// ============================================================================
// PRAYER TIMES QUERIES
// ============================================================================

export function usePrayerTimes(params: PrayerTimesParams) {
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.times(params),
    queryFn: async () => {
      const cacheKey = `prayer-times-${params.latitude}-${params.longitude}-${params.date || 'today'}`;
      const cached = cache.get<PrayerTimesResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 Using cached prayer times');
        return cached;
      }

      console.log('🌐 Fetching prayer times from API');
      const response = await fetchPrayerTimes(params);
      
      cache.set(cacheKey, response, TTL.ONE_DAY);
      
      return response;
    },
    staleTime: TTL.ONE_DAY,
    gcTime: TTL.ONE_WEEK,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetch today's prayer times with MUIS priority
 * ✅ OPTIMIZED: Now uses fetchDailyPrayerTimeFromFirebase (more efficient)
 */
export function useTodayPrayerTimes(location: LocationCoordinates) {
  const today = getTodayDateForAPI();
  
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.daily(today, location),
    queryFn: async () => {
      const cacheKey = `prayer-times-today-${location.latitude}-${location.longitude}`;
      
      // ✅ LAYER 1: Check MMKV cache first
      const cached = cache.get<PrayerTimesResponse>(cacheKey);
      if (cached) {
        console.log('⚡ Using cached prayer times');
        const source = cached.data.meta.method.name;
        console.log(`📍 Source: ${source}`);
        return cached;
      }

      // ✅ LAYER 2: Try Firebase MUIS official times (OPTIMIZED)
      try {
        const now = new Date();
        const dateISO = format(now, 'yyyy-MM-dd'); // YYYY-MM-DD format
        
        console.log('🕌 Fetching MUIS official times from Firebase...');
        
        // ✅ OPTIMIZED: Fetch only today's data (not entire month)
        const todayTime = await fetchDailyPrayerTimeFromFirebase(dateISO);
        
        if (todayTime) {
          console.log('✅ SUCCESS: Using MUIS official times from Firebase');
          console.log('📊 Times:', {
            Subuh: todayTime.subuh,
            Syuruk: todayTime.syuruk,
            Zohor: todayTime.zohor,
            Asar: todayTime.asar,
            Maghrib: todayTime.maghrib,
            Isyak: todayTime.isyak,
          });
          
          const muisResponse = await convertMUISToResponse(todayTime, location);
          
          // Cache until end of day
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);
          const ttl = endOfDay.getTime() - now.getTime();
          
          cache.set(cacheKey, muisResponse, ttl);
          return muisResponse;
        } else {
          console.warn(`⚠️ No MUIS data found for ${dateISO}`);
        }
      } catch (error) {
        console.warn('⚠️ Firebase MUIS times unavailable:', error);
      }

      // ❌ LAYER 3: Fallback to Aladhan API
      console.log('🌐 FALLBACK: Fetching from Aladhan API');
      console.log('⚠️ WARNING: Using calculated times - may differ from MUIS official times');
      
      const response = await fetchTodayPrayerTimes(
        location.latitude,
        location.longitude
      );
      
      console.log('📊 Aladhan API times:', response.data.timings);
      
      // Cache until end of day
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const ttl = endOfDay.getTime() - now.getTime();
      
      cache.set(cacheKey, response, ttl);
      
      return response;
    },
    staleTime: TTL.ONE_HOUR,
    gcTime: TTL.ONE_DAY,
    retry: 3,
    enabled: !!(location.latitude && location.longitude),
  });
}

/**
 * Fetch prayer times for a specific date with MUIS priority
 * ✅ OPTIMIZED: Now uses fetchDailyPrayerTimeFromFirebase
 */
export function usePrayerTimesByDate(
  location: LocationCoordinates,
  date: Date
) {
  return useQuery({
    queryKey: PRAYER_QUERY_KEYS.daily(date.toISOString(), location),
    queryFn: async () => {
      // ✅ OPTIMIZED: Fetch single day instead of entire month
      try {
        const dateISO = format(date, 'yyyy-MM-dd'); // YYYY-MM-DD format
        
        console.log(`🕌 Fetching MUIS times for ${dateISO} from Firebase...`);
        const dayTime = await fetchDailyPrayerTimeFromFirebase(dateISO);
        
        if (dayTime) {
          console.log(`✅ Using MUIS official times for ${dateISO}`);
          return await convertMUISToResponse(dayTime, location);
        } else {
          console.warn(`⚠️ No MUIS data found for ${dateISO}`);
        }
      } catch (error) {
        console.warn(`⚠️ Firebase MUIS times unavailable for ${format(date, 'yyyy-MM-dd')}:`, error);
      }
      
      // Fallback to Aladhan
      console.log('🌐 FALLBACK: Using Aladhan API for date:', format(date, 'yyyy-MM-dd'));
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

      console.log('🕌 Fetching MUIS monthly prayer times from Firebase');
      const times = await fetchMonthlyPrayerTimesFromFirebase(year, month);
      
      cache.set(cacheKey, times, TTL.ONE_MONTH);
      
      return times;
    },
    staleTime: TTL.ONE_MONTH,
    gcTime: TTL.ONE_MONTH * 3,
    retry: 2,
  });
}

// ============================================================================
// ISLAMIC DATE QUERY
// ============================================================================

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

      console.log('📅 Fetching Islamic date for:', date);
      const response = await convertToIslamicDate(date);
      
      // Cache Islamic dates indefinitely (they never change)
      cache.set(cacheKey, response, TTL.ONE_MONTH * 12);
      
      return response;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    enabled: !!date,
  });
}

/**
 * Convert Singapore Islamic month format
 * ✅ FIXED: Added null safety
 */
export function convertToSingaporeMonth(englishMonth: string | undefined): string {
  if (!englishMonth) {
    console.warn('⚠️ Missing English month name');
    return 'Unknown';
  }
  
  const monthNumber = ENGLISH_TO_MONTH_NUMBER[englishMonth];
  
  if (monthNumber) {
    return SINGAPORE_ISLAMIC_MONTHS[monthNumber];
  }

  console.warn(`Unknown Islamic month: ${englishMonth}`);
  return englishMonth;
}

export function formatIslamicDateSingapore(hijri: HijriDate | null | undefined): string {
  // Guard clause: Return fallback if hijri is missing
  if (!hijri) {
    console.warn('⚠️ No Hijri date provided');
    return 'Loading...';
  }

  // Guard clause: Ensure all required properties exist
  if (!hijri.day || !hijri.month || !hijri.year) {
    console.warn('⚠️ Incomplete Hijri date:', hijri);
    return 'Invalid Date';
  }

  const { day, month, year } = hijri;
  
  // Guard clause: month.number must exist
  if (!month.number) {
    console.warn('⚠️ Missing month number:', month);
    return `${day} Unknown ${year}`;
  }
  
  // Get Singapore month name using month number
  const singaporeMonth = SINGAPORE_ISLAMIC_MONTHS[month.number];
  
  // If month number mapping fails, try English name mapping
  const monthName = singaporeMonth || convertToSingaporeMonth(month.en);
  
  return `${day} ${monthName} ${year}`;
}

export function formatIslamicDateResponseSingapore(data: IslamicDateResponse | null | undefined): string {
  if (!data?.data?.hijri) {
    console.warn('⚠️ Invalid Islamic date response:', data);
    return 'Loading...';
  }
  
  return formatIslamicDateSingapore(data.data.hijri);
}

export function useTodayIslamicDate() {
  const today = getTodayDateForAPI();
  return useIslamicDate(today);
}

// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

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

export function useLogPrayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      prayer: string;
      timestamp: number;
      location?: LocationCoordinates;
    }) => {
      console.log('🕌 Logging prayer:', log);
      return log;
    },
    
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({
        queryKey: ['prayers', 'logs'],
      });

      const previousLogs = queryClient.getQueryData(['prayers', 'logs']);

      queryClient.setQueryData(['prayers', 'logs'], (old: any) => {
        return [...(old || []), newLog];
      });

      return { previousLogs };
    },
    
    onError: (err, newLog, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(['prayers', 'logs'], context.previousLogs);
      }
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['prayers', 'logs'],
      });
    },
  });
}