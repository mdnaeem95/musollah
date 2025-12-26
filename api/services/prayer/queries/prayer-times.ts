/**
 * Prayer Times Queries
 * 
 * TanStack Query hooks for fetching prayer times from multiple sources.
 * 
 * Strategy:
 * 1. Try MMKV cache (instant)
 * 2. **ALWAYS try Firebase FIRST** (official MUIS timings)
 * 3. Fallback to Aladhan API (only if Firebase unavailable)
 * 
 * @version 3.1
 * @since 2025-12-23
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchTodayPrayerTimesFromAladhan, fetchPrayerTimesByDateFromAladhan, convertToIslamicDate } from '../api/aladhan';
import { fetchDailyPrayerTimeFromFirebase, fetchMonthlyPrayerTimesFromFirebase } from '../api/firebase';
import { normalizeAladhanResponse, normalizeFirebaseTime, normalizeFirebaseTimesBatch, convertISOToAladhanDate } from '../api/transformers';
import { prayerQueryKeys } from './query-keys';
import { Coordinates, NormalizedPrayerTimes, IslamicDateConversion, PrayerServiceError, PrayerErrorCode } from '../types/index';
import { STALE_TIME, CACHE_TTL, DATE_FORMATS, ERROR_MESSAGES } from '../types/constants';
import { cache } from '../../../client/storage';
import { logger } from '../../../../services/logging/logger';

function pickPrayerTimes(t: NormalizedPrayerTimes) {
  return {
    subuh: t.subuh,
    syuruk: t.syuruk,
    zohor: t.zohor,
    asar: t.asar,
    maghrib: t.maghrib,
    isyak: t.isyak,
  };
}

// ============================================================================
// TODAY'S PRAYER TIMES
// ============================================================================

/**
 * Fetch today's prayer times
 * 
 * Multi-source strategy:
 * 1. MMKV cache (instant)
 * 2. **Firebase (ALWAYS FIRST - Official MUIS timings)**
 * 3. Aladhan API (fallback only)
 * 
 * @param location - User location coordinates
 * @returns Today's prayer times
 * 
 * @example
 * ```tsx
 * function PrayerTimesScreen() {
 *   const location = useUserLocation();
 *   const { data, isLoading } = useTodayPrayerTimes(location);
 *   
 *   if (isLoading) return <Loading />;
 *   return <PrayerTimes times={data} />;
 * }
 * ```
 */
export function useTodayPrayerTimes(location: Coordinates | null) {
  return useQuery({
    queryKey: prayerQueryKeys.times.today(location!),
    queryFn: async (): Promise<NormalizedPrayerTimes> => {
      const overallStartTime = Date.now();

      // Validate location
      if (!location) {
        logger.error('Prayer times fetch failed: No location provided', {
          errorCode: PrayerErrorCode.LOCATION_ERROR,
        });
        throw new PrayerServiceError(
          PrayerErrorCode.LOCATION_ERROR,
          ERROR_MESSAGES.LOCATION_ERROR
        );
      }

      const today = format(new Date(), DATE_FORMATS.ISO); // YYYY-MM-DD
      const cacheKey = `prayer-times-${today}-${location.latitude}-${location.longitude}`;

      logger.debug('Fetching today\'s prayer times', {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        date: today,
        dateFormat: DATE_FORMATS.ISO,
        cacheKey,
        queryKey: prayerQueryKeys.times.today(location),
      });

      // ======================================================================
      // LAYER 1: MMKV CACHE (INSTANT)
      // ======================================================================
      const cacheStartTime = Date.now();
      const cached = cache.get<NormalizedPrayerTimes>(cacheKey);
      const cacheDuration = Date.now() - cacheStartTime;

      if (cached) {
        const overallDuration = Date.now() - overallStartTime;
        logger.success('Prayer times retrieved from cache', {
          source: 'MMKV',
          date: today,
          prayers: pickPrayerTimes(cached),
          cacheHit: true,
          cacheDuration: `${cacheDuration}ms`,
          overallDuration: `${overallDuration}ms`,
        });
        return cached;
      }

      logger.debug('Cache miss - proceeding to Firebase', {
        cacheKey,
        cacheDuration: `${cacheDuration}ms`,
      });

      // ======================================================================
      // LAYER 2: FIREBASE (ALWAYS FIRST - MUIS OFFICIAL)
      // ======================================================================
      logger.debug('Attempting Firebase fetch (MUIS official source)', {
        date: today,
        priority: 'primary',
        reason: 'Official MUIS Singapore timings',
      });

      const firebaseStartTime = Date.now();
      try {
        const firebaseData = await fetchDailyPrayerTimeFromFirebase(today);
        const firebaseDuration = Date.now() - firebaseStartTime;

        if (firebaseData) {
          const normalizationStartTime = Date.now();
          const normalized = normalizeFirebaseTime(firebaseData);
          const normalizationDuration = Date.now() - normalizationStartTime;

          // Cache the result
          const cacheSetStartTime = Date.now();
          cache.set(cacheKey, normalized, CACHE_TTL.ONE_DAY);
          const cacheSetDuration = Date.now() - cacheSetStartTime;

          const overallDuration = Date.now() - overallStartTime;

          logger.success('Prayer times fetched from Firebase', {
            source: 'Firebase',
            certification: 'MUIS Official',
            date: today,
            prayers: pickPrayerTimes(normalized),
            firebaseDuration: `${firebaseDuration}ms`,
            normalizationDuration: `${normalizationDuration}ms`,
            cacheSetDuration: `${cacheSetDuration}ms`,
            overallDuration: `${overallDuration}ms`,
            cacheTTL: CACHE_TTL.ONE_DAY,
          });

          return normalized;
        }

        logger.warn('No Firebase data available for today', {
          date: today,
          firebaseDuration: `${firebaseDuration}ms`,
          reason: 'Data not in Firestore',
          nextStep: 'Attempting Aladhan fallback',
        });
      } catch (error) {
        const firebaseDuration = Date.now() - firebaseStartTime;
        logger.warn('Firebase fetch failed - falling back to Aladhan', {
          error,
          date: today,
          firebaseDuration: `${firebaseDuration}ms`,
          nextStep: 'Attempting Aladhan API',
        });
      }

      // ======================================================================
      // LAYER 3: ALADHAN API (FALLBACK ONLY)
      // ======================================================================
      logger.debug('Using Aladhan API as fallback', {
        source: 'Aladhan API',
        certification: 'NOT MUIS Official',
        reason: 'Firebase data unavailable',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      const aladhanStartTime = Date.now();
      try {
        const aladhanData = await fetchTodayPrayerTimesFromAladhan(
          location.latitude,
          location.longitude
        );
        const aladhanDuration = Date.now() - aladhanStartTime;

        const normalizationStartTime = Date.now();
        const normalized = normalizeAladhanResponse(aladhanData);
        const normalizationDuration = Date.now() - normalizationStartTime;

        // Cache the result
        const cacheSetStartTime = Date.now();
        cache.set(cacheKey, normalized, CACHE_TTL.ONE_DAY);
        const cacheSetDuration = Date.now() - cacheSetStartTime;

        const overallDuration = Date.now() - overallStartTime;

        logger.warn('Prayer times fetched from Aladhan (fallback)', {
          source: 'Aladhan API',
          certification: 'NOT MUIS Official',
          date: today,
          prayers: pickPrayerTimes(normalized),
          aladhanDuration: `${aladhanDuration}ms`,
          normalizationDuration: `${normalizationDuration}ms`,
          cacheSetDuration: `${cacheSetDuration}ms`,
          overallDuration: `${overallDuration}ms`,
          cacheTTL: CACHE_TTL.ONE_DAY,
          warning: 'Using calculated times, not official MUIS',
        });

        return normalized;
      } catch (error) {
        const aladhanDuration = Date.now() - aladhanStartTime;
        const overallDuration = Date.now() - overallStartTime;

        logger.error('All sources failed to fetch prayer times', {
          error,
          date: today,
          sources: {
            firebase: 'failed',
            aladhan: 'failed',
            cache: 'miss',
          },
          aladhanDuration: `${aladhanDuration}ms`,
          overallDuration: `${overallDuration}ms`,
        });

        throw error;
      }
    },
    staleTime: STALE_TIME.TODAY_PRAYER_TIMES, // 1 hour
    gcTime: CACHE_TTL.ONE_DAY,
    enabled: !!location,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ============================================================================
// PRAYER TIMES BY DATE
// ============================================================================

/**
 * Fetch prayer times for a specific date
 * 
 * @param location - User location coordinates
 * @param date - Date object
 * @returns Prayer times for the specified date
 * 
 * @example
 * ```tsx
 * function PrayerTimesForDate({ date }: { date: Date }) {
 *   const location = useUserLocation();
 *   const { data } = usePrayerTimesByDate(location, date);
 *   
 *   return <PrayerTimes times={data} />;
 * }
 * ```
 */
export function usePrayerTimesByDate(
  location: Coordinates | null,
  date: Date
) {
  const isoDate = format(date, DATE_FORMATS.ISO);

  return useQuery({
    queryKey: prayerQueryKeys.times.date(location!, isoDate),
    queryFn: async (): Promise<NormalizedPrayerTimes> => {
      const overallStartTime = Date.now();

      // Validate location
      if (!location) {
        logger.error('Prayer times by date fetch failed: No location', {
          date: isoDate,
          errorCode: PrayerErrorCode.LOCATION_ERROR,
        });
        throw new PrayerServiceError(
          PrayerErrorCode.LOCATION_ERROR,
          ERROR_MESSAGES.LOCATION_ERROR
        );
      }

      const cacheKey = `prayer-times-${isoDate}-${location.latitude}-${location.longitude}`;

      logger.debug('Fetching prayer times for specific date', {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        date: isoDate,
        cacheKey,
        queryKey: prayerQueryKeys.times.date(location, isoDate),
      });

      // ======================================================================
      // LAYER 1: MMKV CACHE
      // ======================================================================
      const cacheStartTime = Date.now();
      const cached = cache.get<NormalizedPrayerTimes>(cacheKey);
      const cacheDuration = Date.now() - cacheStartTime;

      if (cached) {
        const overallDuration = Date.now() - overallStartTime;
        logger.success('Prayer times retrieved from cache (specific date)', {
          source: 'MMKV',
          date: isoDate,
          prayers: pickPrayerTimes(cached),
          cacheHit: true,
          cacheDuration: `${cacheDuration}ms`,
          overallDuration: `${overallDuration}ms`,
        });
        return cached;
      }

      logger.debug('Cache miss - proceeding to Firebase (specific date)', {
        cacheKey,
        cacheDuration: `${cacheDuration}ms`,
      });

      // ======================================================================
      // LAYER 2: FIREBASE (MUIS OFFICIAL)
      // ======================================================================
      logger.debug('Attempting Firebase fetch for date (MUIS official)', {
        date: isoDate,
        priority: 'primary',
      });

      const firebaseStartTime = Date.now();
      try {
        const firebaseData = await fetchDailyPrayerTimeFromFirebase(isoDate);
        const firebaseDuration = Date.now() - firebaseStartTime;

        if (firebaseData) {
          const normalizationStartTime = Date.now();
          const normalized = normalizeFirebaseTime(firebaseData);
          const normalizationDuration = Date.now() - normalizationStartTime;

          const cacheSetStartTime = Date.now();
          cache.set(cacheKey, normalized, CACHE_TTL.ONE_WEEK);
          const cacheSetDuration = Date.now() - cacheSetStartTime;

          const overallDuration = Date.now() - overallStartTime;

          logger.success('Prayer times fetched from Firebase (specific date)', {
            source: 'Firebase',
            certification: 'MUIS Official',
            date: isoDate,
            prayers: pickPrayerTimes(normalized),
            firebaseDuration: `${firebaseDuration}ms`,
            normalizationDuration: `${normalizationDuration}ms`,
            cacheSetDuration: `${cacheSetDuration}ms`,
            overallDuration: `${overallDuration}ms`,
            cacheTTL: CACHE_TTL.ONE_WEEK,
          });

          return normalized;
        }

        logger.warn('No Firebase data for date', {
          date: isoDate,
          firebaseDuration: `${firebaseDuration}ms`,
          nextStep: 'Attempting Aladhan fallback',
        });
      } catch (error) {
        const firebaseDuration = Date.now() - firebaseStartTime;
        logger.warn('Firebase fetch failed for date', {
          error,
          date: isoDate,
          firebaseDuration: `${firebaseDuration}ms`,
        });
      }

      // ======================================================================
      // LAYER 3: ALADHAN API (FALLBACK)
      // ======================================================================
      logger.debug('Using Aladhan API as fallback (specific date)', {
        source: 'Aladhan API',
        certification: 'NOT MUIS Official',
        date: isoDate,
      });

      const aladhanStartTime = Date.now();
      const aladhanData = await fetchPrayerTimesByDateFromAladhan(
        location.latitude,
        location.longitude,
        date
      );
      const aladhanDuration = Date.now() - aladhanStartTime;

      const normalizationStartTime = Date.now();
      const normalized = normalizeAladhanResponse(aladhanData);
      const normalizationDuration = Date.now() - normalizationStartTime;

      const cacheSetStartTime = Date.now();
      cache.set(cacheKey, normalized, CACHE_TTL.ONE_WEEK);
      const cacheSetDuration = Date.now() - cacheSetStartTime;

      const overallDuration = Date.now() - overallStartTime;

      logger.warn('Prayer times fetched from Aladhan (specific date fallback)', {
        source: 'Aladhan API',
        certification: 'NOT MUIS Official',
        date: isoDate,
        prayers: pickPrayerTimes(normalized),
        aladhanDuration: `${aladhanDuration}ms`,
        normalizationDuration: `${normalizationDuration}ms`,
        cacheSetDuration: `${cacheSetDuration}ms`,
        overallDuration: `${overallDuration}ms`,
        cacheTTL: CACHE_TTL.ONE_WEEK,
      });

      return normalized;
    },
    staleTime: STALE_TIME.SPECIFIC_DATE,
    gcTime: CACHE_TTL.ONE_WEEK,
    enabled: !!location,
    retry: 2,
  });
}

// ============================================================================
// MONTHLY PRAYER TIMES
// ============================================================================

/**
 * Fetch prayer times for an entire month
 * 
 * Firebase ONLY - Monthly times are pre-calculated by MUIS
 * 
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Array of daily prayer times
 * 
 * @example
 * ```tsx
 * function MonthlyCalendar() {
 *   const { data } = useMonthlyPrayerTimes(2025, 12);
 *   
 *   return (
 *     <FlatList
 *       data={data}
 *       renderItem={({ item }) => <DayRow times={item} />}
 *     />
 *   );
 * }
 * ```
 */
export function useMonthlyPrayerTimes(year: number, month: number) {
  return useQuery({
    queryKey: prayerQueryKeys.times.monthly(year, month),
    queryFn: async (): Promise<NormalizedPrayerTimes[]> => {
      const overallStartTime = Date.now();
      const cacheKey = `prayer-times-monthly-${year}-${month}`;

      logger.debug('Fetching monthly prayer times', {
        year,
        month,
        cacheKey,
        queryKey: prayerQueryKeys.times.monthly(year, month),
        source: 'Firebase only (MUIS official)',
      });

      // ======================================================================
      // LAYER 1: MMKV CACHE
      // ======================================================================
      const cacheStartTime = Date.now();
      const cached = cache.get<NormalizedPrayerTimes[]>(cacheKey);
      const cacheDuration = Date.now() - cacheStartTime;

      if (cached) {
        const overallDuration = Date.now() - overallStartTime;
        logger.success('Monthly prayer times retrieved from cache', {
          source: 'MMKV',
          year,
          month,
          days: cached.length,
          cacheHit: true,
          cacheDuration: `${cacheDuration}ms`,
          overallDuration: `${overallDuration}ms`,
        });
        return cached;
      }

      logger.debug('Cache miss - fetching from Firebase (monthly)', {
        cacheKey,
        cacheDuration: `${cacheDuration}ms`,
      });

      // ======================================================================
      // LAYER 2: FIREBASE (ONLY SOURCE FOR MONTHLY - MUIS OFFICIAL)
      // ======================================================================
      logger.debug('Fetching monthly data from Firebase (MUIS official)', {
        year,
        month,
        certification: 'MUIS Official',
        note: 'Firebase is the ONLY source for monthly times',
      });

      const firebaseStartTime = Date.now();
      const firebaseData = await fetchMonthlyPrayerTimesFromFirebase(year, month);
      const firebaseDuration = Date.now() - firebaseStartTime;

      const normalizationStartTime = Date.now();
      const normalized = normalizeFirebaseTimesBatch(firebaseData);
      const normalizationDuration = Date.now() - normalizationStartTime;

      const cacheSetStartTime = Date.now();
      cache.set(cacheKey, normalized, CACHE_TTL.ONE_MONTH);
      const cacheSetDuration = Date.now() - cacheSetStartTime;

      const overallDuration = Date.now() - overallStartTime;

      logger.success('Monthly prayer times fetched from Firebase', {
        source: 'Firebase',
        certification: 'MUIS Official',
        year,
        month,
        days: normalized.length,
        firebaseDuration: `${firebaseDuration}ms`,
        normalizationDuration: `${normalizationDuration}ms`,
        cacheSetDuration: `${cacheSetDuration}ms`,
        overallDuration: `${overallDuration}ms`,
        cacheTTL: CACHE_TTL.ONE_MONTH,
      });

      return normalized;
    },
    staleTime: STALE_TIME.MONTHLY,
    gcTime: CACHE_TTL.ONE_MONTH * 3,
    enabled: !!year && !!month && month >= 1 && month <= 12,
  });
}

// ============================================================================
// ISLAMIC DATE CONVERSION
// ============================================================================

/**
 * Convert Gregorian date to Islamic (Hijri) date
 * 
 * @param date - Gregorian date string (YYYY-MM-DD)
 * @returns Islamic date conversion
 * 
 * @example
 * ```tsx
 * function IslamicDateDisplay({ date }: { date: string }) {
 *   const { data } = useIslamicDate(date);
 *   
 *   return <Text>{data?.hijri.formatted}</Text>; // "15 Ramadan 1446"
 * }
 * ```
 */
export function useIslamicDate(date: string) {
  return useQuery({
    queryKey: prayerQueryKeys.islamicDate.date(date),
    queryFn: async (): Promise<IslamicDateConversion> => {
      const overallStartTime = Date.now();
      const cacheKey = `islamic-date-${date}`;

      logger.debug('Converting Gregorian to Islamic date', {
        gregorianDate: date,
        cacheKey,
        queryKey: prayerQueryKeys.islamicDate.date(date),
      });

      // ======================================================================
      // LAYER 1: MMKV CACHE (ISLAMIC DATES DON'T CHANGE)
      // ======================================================================
      const cacheStartTime = Date.now();
      const cached = cache.get<IslamicDateConversion>(cacheKey);
      const cacheDuration = Date.now() - cacheStartTime;

      if (cached) {
        const overallDuration = Date.now() - overallStartTime;
        logger.success('Islamic date retrieved from cache', {
          source: 'MMKV',
          gregorianDate: date,
          hijriDate: cached.hijri.formatted,
          hijriMonth: cached.hijri.month,
          hijriYear: cached.hijri.year,
          cacheHit: true,
          cacheDuration: `${cacheDuration}ms`,
          overallDuration: `${overallDuration}ms`,
        });
        return cached;
      }

      logger.debug('Cache miss - converting via Aladhan API', {
        cacheKey,
        cacheDuration: `${cacheDuration}ms`,
      });

      // ======================================================================
      // LAYER 2: ALADHAN API (CONVERSION SERVICE)
      // ======================================================================
      const conversionStartTime = Date.now();
      
      // Convert ISO to Aladhan format (DD-MM-YYYY)
      const formatConversionStart = Date.now();
      const aladhanDate = convertISOToAladhanDate(date);
      const formatConversionDuration = Date.now() - formatConversionStart;

      logger.debug('Date format converted for Aladhan', {
        from: date,
        to: aladhanDate,
        fromFormat: 'YYYY-MM-DD',
        toFormat: 'DD-MM-YYYY',
        duration: `${formatConversionDuration}ms`,
      });

      const apiStartTime = Date.now();
      const islamicDate = await convertToIslamicDate(aladhanDate);
      const apiDuration = Date.now() - apiStartTime;

      const conversionDuration = Date.now() - conversionStartTime;

      // Cache forever (dates don't change)
      const cacheSetStartTime = Date.now();
      cache.set(cacheKey, islamicDate, CACHE_TTL.ONE_MONTH * 12);
      const cacheSetDuration = Date.now() - cacheSetStartTime;

      const overallDuration = Date.now() - overallStartTime;

      logger.success('Islamic date conversion successful', {
        source: 'Aladhan API',
        gregorianDate: date,
        hijriDate: islamicDate.hijri.formatted,
        hijriMonth: islamicDate.hijri.month,
        hijriYear: islamicDate.hijri.year,
        formatConversionDuration: `${formatConversionDuration}ms`,
        apiDuration: `${apiDuration}ms`,
        conversionDuration: `${conversionDuration}ms`,
        cacheSetDuration: `${cacheSetDuration}ms`,
        overallDuration: `${overallDuration}ms`,
        cacheTTL: 'Permanent (dates never change)',
      });

      return islamicDate;
    },
    staleTime: Infinity, // Islamic dates never change
    gcTime: Infinity,
    enabled: !!date,
  });
}

/**
 * Get today's Islamic date
 * 
 * Convenience hook for current Islamic date
 * 
 * @example
 * ```tsx
 * function TodayIslamicDate() {
 *   const { data } = useTodayIslamicDate();
 *   
 *   return <Text>Today is {data?.hijri.formatted}</Text>;
 * }
 * ```
 */
export function useTodayIslamicDate() {
  const today = format(new Date(), DATE_FORMATS.ISO);
  
  logger.debug('Using today\'s Islamic date hook', {
    gregorianToday: today,
    dateFormat: DATE_FORMATS.ISO,
  });

  return useIslamicDate(today);
}

// ============================================================================
// PREFETCHING UTILITIES
// ============================================================================

/**
 * Prefetch prayer times for a specific date
 * 
 * Useful for preloading data before navigation
 * 
 * @example
 * ```tsx
 * function PrayerTimesScreen() {
 *   const prefetchPrayerTimes = usePrefetchPrayerTimes();
 *   
 *   // Prefetch tomorrow's times on mount
 *   useEffect(() => {
 *     const tomorrow = addDays(new Date(), 1);
 *     prefetchPrayerTimes(location, tomorrow);
 *   }, []);
 * }
 * ```
 */
export function usePrefetchPrayerTimes() {
  const queryClient = useQueryClient();

  return async (location: Coordinates, date: Date) => {
    const startTime = Date.now();
    const isoDate = format(date, DATE_FORMATS.ISO);

    logger.debug('Prefetching prayer times for date', {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      date: isoDate,
      queryKey: prayerQueryKeys.times.date(location, isoDate),
    });

    try {
      await queryClient.prefetchQuery({
        queryKey: prayerQueryKeys.times.date(location, isoDate),
        queryFn: async () => {
          // Same multi-source logic - Firebase FIRST
          try {
            const firebaseData = await fetchDailyPrayerTimeFromFirebase(isoDate);
            if (firebaseData) {
              logger.debug('Prefetch: Using Firebase data', {
                date: isoDate,
                source: 'Firebase',
              });
              return normalizeFirebaseTime(firebaseData);
            }
          } catch (error) {
            logger.warn('Prefetch: Firebase failed, using Aladhan', {
              error,
              date: isoDate,
            });
          }

          // Fallback to Aladhan
          logger.debug('Prefetch: Using Aladhan fallback', {
            date: isoDate,
            source: 'Aladhan API',
          });
          const aladhanData = await fetchPrayerTimesByDateFromAladhan(
            location.latitude,
            location.longitude,
            date
          );
          return normalizeAladhanResponse(aladhanData);
        },
      });

      const duration = Date.now() - startTime;

      logger.success('Prayer times prefetched successfully', {
        date: isoDate,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Prefetch failed', {
        error,
        date: isoDate,
        duration: `${duration}ms`,
      });
    }
  };
}

/**
 * Prefetch monthly prayer times
 * 
 * @example
 * ```tsx
 * const prefetchMonthly = usePrefetchMonthlyPrayerTimes();
 * prefetchMonthly(2025, 12);
 * ```
 */
export function usePrefetchMonthlyPrayerTimes() {
  const queryClient = useQueryClient();

  return async (year: number, month: number) => {
    const startTime = Date.now();

    logger.debug('Prefetching monthly prayer times', {
      year,
      month,
      queryKey: prayerQueryKeys.times.monthly(year, month),
    });

    try {
      await queryClient.prefetchQuery({
        queryKey: prayerQueryKeys.times.monthly(year, month),
        queryFn: async () => {
          // Firebase ONLY for monthly (MUIS official)
          logger.debug('Prefetch: Fetching monthly from Firebase', {
            year,
            month,
            source: 'Firebase',
            certification: 'MUIS Official',
          });
          const firebaseData = await fetchMonthlyPrayerTimesFromFirebase(year, month);
          return normalizeFirebaseTimesBatch(firebaseData);
        },
      });

      const duration = Date.now() - startTime;

      logger.success('Monthly prayer times prefetched successfully', {
        year,
        month,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Monthly prefetch failed', {
        error,
        year,
        month,
        duration: `${duration}ms`,
      });
    }
  };
}

// ============================================================================
// INVALIDATION UTILITIES
// ============================================================================

/**
 * Invalidate all prayer times
 * 
 * Forces refetch of all prayer time data
 * 
 * @example
 * ```tsx
 * const invalidatePrayerTimes = useInvalidatePrayerTimes();
 * invalidatePrayerTimes(); // Refetch all prayer times
 * ```
 */
export function useInvalidatePrayerTimes() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: prayerQueryKeys.times.all });
  };

  const invalidateToday = (location: Coordinates) => {
    queryClient.invalidateQueries({
      queryKey: prayerQueryKeys.times.today(location),
    });
  };

  const invalidateDate = (location: Coordinates, isoDate: string) => {
    queryClient.invalidateQueries({
      queryKey: prayerQueryKeys.times.date(location, isoDate),
    });
  };

  return { invalidateAll, invalidateToday, invalidateDate };
}

/**
 * Invalidate prayer times for a specific date
 * 
 * @example
 * ```tsx
 * const invalidateDate = useInvalidatePrayerTimesByDate();
 * invalidateDate(location, new Date());
 * ```
 */
export function useInvalidatePrayerTimesByDate() {
  const queryClient = useQueryClient();

  return (location: Coordinates, date: Date) => {
    const isoDate = format(date, DATE_FORMATS.ISO);

    logger.debug('Invalidating prayer times for specific date', {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      date: isoDate,
      queryKey: prayerQueryKeys.times.date(location, isoDate),
    });

    queryClient.invalidateQueries({
      queryKey: prayerQueryKeys.times.date(location, isoDate),
    });

    logger.success('Prayer times invalidated for date', {
      date: isoDate,
    });
  };
}