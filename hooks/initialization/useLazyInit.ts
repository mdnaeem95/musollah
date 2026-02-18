/**
 * Lazy Initialization Hook
 * 
 * REFACTORED: Using structured logging system
 * FIXED: Graceful handling of simulator push notification errors
 * 
 * Runs AFTER app is ready - handles non-critical background tasks:
 * - Auth state monitoring
 * - AdMob initialization
 * - Push notifications
 * - Quran data preloading
 * - iOS widget updates
 * 
 * @version 2.1
 * @since 2025-12-24
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import mobileAds from 'react-native-google-mobile-ads';
import { 
  getTrackingPermissionsAsync, 
  requestTrackingPermissionsAsync, 
  PermissionStatus 
} from 'expo-tracking-transparency';
import { registerForPushNotificationsAsync } from '../../services/notifications/registerForPushNotificationsAsync';
import { initializeAuthListener } from '../../stores/useAuthStore';
import { cache } from '../../api/client/storage';
import { fetchSurahs } from '../../api/services/quran';
import { QURAN_QUERY_KEYS } from '../../api/services/quran';
import { updatePrayerTimesWidget } from '../../utils/widgetBridge';
import { CACHE_KEYS } from '../../constants/prayer.constants';
import { fetchMonthlyPrayerTimesFromFirebase } from '../../api/services/prayer';
import { useRamadanStore } from '../../stores/useRamadanStore';

import { createLogger } from '../../services/logging/logger';

// Category-specific logger
const logger = createLogger('Lazy Init');

// Track if lazy init has run (singleton pattern)
let hasInitialized = false;

/**
 * Lazy initialization hook - runs AFTER app is ready
 * 
 * @param isReady - Whether the app has completed critical initialization
 */
export const useLazyInit = (isReady: boolean) => {
  const queryClient = useQueryClient();
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!isReady) {
      logger.debug('Waiting for app to be ready before lazy init', { isReady });
      return;
    }

    if (hasInitialized) {
      logger.debug('Lazy init already completed (singleton)', { hasInitialized });
      return;
    }

    if (initStartedRef.current) {
      logger.debug('Lazy init already in progress', { initStarted: initStartedRef.current });
      return;
    }
    
    initStartedRef.current = true;
    hasInitialized = true;

    logger.info('Starting lazy initialization (500ms delay for UI priority)');

    // Small delay to prioritize UI rendering
    const timeoutId = setTimeout(() => {
      initializeNonCriticalFeatures();
    }, 500);

    return () => {
      logger.debug('Cleanup: clearing lazy init timeout');
      clearTimeout(timeoutId);
    };
  }, [isReady, queryClient]);

  // ==========================================================================
  // Main Initialization Function
  // ==========================================================================
  const initializeNonCriticalFeatures = async () => {
    logger.time('lazy-init-total');
    logger.info('Starting all non-critical features initialization...');

    try {
      // Run all tasks in parallel (they're independent)
      const results = await Promise.allSettled([
        initAuthMonitoring(),
        initAdMob(),
        initPushNotifications(),
        preloadQuranData(),
        updateIOSWidget(),
        initRamadanDetection(),
      ]);

      // Log summary of results
      const summary = {
        total: results.length,
        fulfilled: results.filter(r => r.status === 'fulfilled').length,
        rejected: results.filter(r => r.status === 'rejected').length,
      };

      if (summary.rejected > 0) {
        logger.warn('Some lazy init tasks failed (non-critical)', summary);
      } else {
        logger.success('All lazy initialization tasks completed', summary);
      }

      logger.timeEnd('lazy-init-total');
    } catch (err) {
      logger.error('Unexpected error in lazy initialization', err);
      logger.timeEnd('lazy-init-total');
    }
  };

  // ==========================================================================
  // Task 1: Auth State Monitoring
  // ==========================================================================
  const initAuthMonitoring = async () => {
    logger.time('auth-monitoring-init');
    
    try {
      logger.info('Initializing auth state monitoring...');

      // Initialize Firebase auth listener (from useAuthStore)
      const unsubscribe = initializeAuthListener();
      
      logger.success('Auth monitoring initialized', {
        hasUnsubscribe: typeof unsubscribe === 'function',
      });
      
      logger.timeEnd('auth-monitoring-init');
      return unsubscribe;
    } catch (err) {
      logger.error('Auth monitoring initialization failed', err);
      logger.timeEnd('auth-monitoring-init');
      throw err;
    }
  };

  // ==========================================================================
  // Task 2: AdMob Initialization
  // ==========================================================================
  const initAdMob = async () => {
    logger.time('admob-init');
    
    try {
      logger.info('Initializing AdMob...');

      // Step 1: Request ATT permission (iOS 14.5+)
      logger.debug('Checking ATT permission status');
      const { status } = await getTrackingPermissionsAsync();
      
      logger.debug('ATT permission status', { status });
      
      if (status === PermissionStatus.UNDETERMINED) {
        logger.info('Requesting ATT permission...');
        const { status: newStatus } = await requestTrackingPermissionsAsync();
        logger.info('ATT permission result', { status: newStatus });
      }

      // Step 2: Initialize AdMob SDK
      logger.debug('Initializing AdMob SDK...');
      await mobileAds().initialize();
      
      logger.success('AdMob initialized successfully');
      logger.timeEnd('admob-init');
    } catch (err) {
      logger.error('AdMob initialization failed (non-critical)', err, {
        willContinue: 'yes',
      });
      logger.timeEnd('admob-init');
    }
  };

  // ==========================================================================
  // Task 3: Push Notifications
  // FIXED: Gracefully handles null return from registerForPushNotificationsAsync
  // ==========================================================================
  const initPushNotifications = async () => {
    logger.time('push-notifications-init');
    
    try {
      logger.info('Registering for push notifications...');
      
      // registerForPushNotificationsAsync returns null on simulators/errors
      // instead of throwing - correct behavior for a non-critical feature
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        logger.success('Push notifications registered', {
          hasToken: true,
          tokenLength: token.length,
        });
      } else {
        logger.info('Push notifications not available', {
          hasToken: false,
          reason: 'Likely simulator or permission denied',
        });
      }
      
      logger.timeEnd('push-notifications-init');
    } catch (err) {
      // Rarely happens since registerForPushNotificationsAsync
      // catches its own errors, but keep as safety net
      logger.error('Push notification registration failed (non-critical)', err, {
        willContinue: 'yes',
      });
      logger.timeEnd('push-notifications-init');
    }
  };

  // ==========================================================================
  // Task 4: Preload Quran Data
  // ==========================================================================
  const preloadQuranData = async () => {
    logger.time('quran-data-preload');
    
    try {
      logger.info('Preloading Quran data...');

      // Step 1: Check MMKV cache first
      const cacheKey = 'quran-surahs';
      const cached = cache.get(cacheKey);
      
      if (cached) {
        logger.success('Using cached Quran data', {
          source: 'MMKV',
          cacheKey,
          surahCount: Array.isArray(cached) ? cached.length : 'unknown',
        });
        
        // Seed cache into QueryClient
        queryClient.setQueryData(QURAN_QUERY_KEYS.surahs, cached);
        logger.timeEnd('quran-data-preload');
        return;
      }

      // Step 2: Prefetch from API
      logger.debug('Fetching Quran surahs from API');
      await queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahs,
        queryFn: fetchSurahs,
        staleTime: Infinity, // Quran data never changes
      });

      logger.success('Quran data loaded from API', {
        source: 'API',
        staleTime: 'Infinity',
      });
      
      logger.timeEnd('quran-data-preload');
    } catch (err) {
      logger.error('Quran data preloading failed (non-critical)', err, {
        willContinue: 'yes',
      });
      logger.timeEnd('quran-data-preload');
    }
  };

  // ==========================================================================
  // Task 5: Update iOS Widget
  // ==========================================================================
  const updateIOSWidget = async () => {
    if (Platform.OS !== 'ios') {
      logger.debug('Skipping widget update (not iOS)', { 
        platform: Platform.OS 
      });
      return;
    }

    logger.time('ios-widget-update');
    
    try {
      logger.info('Updating iOS prayer times widget...');

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      logger.debug('Widget update parameters', {
        year: currentYear,
        month: currentMonth,
        monthName: now.toLocaleString('default', { month: 'long' }),
      });

      // Step 1: Check MMKV cache
      const cacheKey = `${CACHE_KEYS.MONTHLY_TIMES}_${currentYear}_${currentMonth}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        logger.success('Using cached monthly times for widget', {
          source: 'MMKV',
          cacheKey,
          dayCount: cachedData.length,
          firstDay: cachedData[0]?.date,
          lastDay: cachedData[cachedData.length - 1]?.date,
        });
        
        // Debug: Validate data format
        if (cachedData[0]) {
          logger.debug('Cached data sample', {
            date: cachedData[0].date,
            dateType: typeof cachedData[0].date,
            hasSubuh: !!cachedData[0].subuh,
            hasSyuruk: !!cachedData[0].syuruk,
            prayerKeys: Object.keys(cachedData[0]),
          });
        }
        
        await updatePrayerTimesWidget(cachedData);
        logger.success('Widget updated successfully (from cache)');
        logger.timeEnd('ios-widget-update');
        return;
      }

      // Step 2: Fetch from Firebase
      logger.debug('Fetching monthly prayer times from Firebase');
      const monthlyData = await fetchMonthlyPrayerTimesFromFirebase(currentYear, currentMonth);
      
      if (monthlyData && monthlyData.length > 0) {
        logger.success('Monthly prayer times fetched', {
          source: 'Firebase',
          dayCount: monthlyData.length,
          firstDay: monthlyData[0]?.date,
          lastDay: monthlyData[monthlyData.length - 1]?.date,
        });

        // Update widget with fresh data
        await updatePrayerTimesWidget(monthlyData);
        
        // Cache for 30 days
        cache.set(cacheKey, monthlyData, 86400000 * 30);
        logger.debug('Cached monthly times', {
          cacheKey,
          ttl: '30 days',
        });
        
        logger.success('Widget updated successfully (from network)');
        logger.timeEnd('ios-widget-update');
      } else {
        logger.warn('No monthly data returned from Firebase', {
          year: currentYear,
          month: currentMonth,
        });
        logger.timeEnd('ios-widget-update');
      }
    } catch (err) {
      logger.error('Widget update failed (non-critical)', err, {
        willContinue: 'yes',
        platform: 'iOS',
      });
      logger.timeEnd('ios-widget-update');
    }
  };

  // ==========================================================================
  // Task 6: Ramadan Detection & Notification Init
  // ==========================================================================
  const initRamadanDetection = async () => {
    logger.time('ramadan-detection-init');

    try {
      logger.info('Checking Ramadan status...');

      const { convertToIslamicDate } = await import('../../api/services/prayer/api/aladhan');
      const { format: formatDate, parseISO, differenceInDays, isWithinInterval } = await import('date-fns');
      const { ramadanNotificationService } = await import(
        '../../services/notifications/ramadanNotificationService'
      );
      const { MUIS_RAMADAN_DATES } = await import(
        '../../api/services/ramadan/types/constants'
      );

      const now = new Date();
      const todayAPI = formatDate(now, 'dd-MM-yyyy');
      const hijriResult = await convertToIslamicDate(todayAPI);
      const monthName = hijriResult.hijri.month.toLowerCase();
      const hijriYear = parseInt(hijriResult.hijri.year, 10);

      // Check MUIS override first (Aladhan can be off by 1 day vs MUIS)
      const muisOverride = MUIS_RAMADAN_DATES[hijriYear] ?? MUIS_RAMADAN_DATES[hijriYear + 1];
      let isRamadan: boolean;
      let currentDay: number;
      let startDate: Date;
      let endDate: Date;

      if (muisOverride) {
        const muisStart = parseISO(muisOverride.start);
        const muisEnd = parseISO(muisOverride.end);
        isRamadan = isWithinInterval(now, { start: muisStart, end: muisEnd });
        currentDay = isRamadan ? differenceInDays(now, muisStart) + 1 : 0;
        startDate = muisStart;
        endDate = muisEnd;

        logger.info('Using MUIS override for Ramadan detection', {
          muisStart: muisOverride.start,
          muisEnd: muisOverride.end,
          isRamadan,
          aladhanSays: hijriResult.hijri.month,
        });
      } else {
        // Fallback to Aladhan API
        isRamadan = monthName.includes('ramad') || monthName.includes('رمض');
        currentDay = parseInt(hijriResult.hijri.day, 10);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (currentDay - 1));
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + (30 - currentDay));
      }

      if (isRamadan) {
        logger.success('Ramadan detected! Auto-enabling Ramadan mode', {
          hijriMonth: hijriResult.hijri.month,
          currentDay,
          usedMuisOverride: !!muisOverride,
        });

        // Auto-enable Ramadan mode so the tab appears
        const { usePreferencesStore } = await import('../../stores/userPreferencesStore');
        if (!usePreferencesStore.getState().ramadanMode) {
          usePreferencesStore.getState().toggleRamadanMode();
        }

        useRamadanStore.getState().initializeRamadan(
          hijriYear,
          formatDate(startDate, 'yyyy-MM-dd'),
          formatDate(endDate, 'yyyy-MM-dd'),
          30
        );

        const tracker = useRamadanStore.getState().tracker;
        const prefs = useRamadanStore.getState().notificationPrefs;

        if (tracker) {
          await ramadanNotificationService.scheduleNotifications(
            prefs,
            currentDay,
            tracker.totalDays
          );
        }
      } else {
        logger.debug('Not Ramadan currently', {
          hijriMonth: hijriResult.hijri.month,
          usedMuisOverride: !!muisOverride,
        });
      }

      logger.timeEnd('ramadan-detection-init');
    } catch (err) {
      logger.error('Ramadan detection failed (non-critical)', err, {
        willContinue: 'yes',
      });
      logger.timeEnd('ramadan-detection-init');
    }
  };
};