/**
 * Lazy Initialization Hook
 * 
 * Runs AFTER app is ready - handles non-critical background tasks:
 * - Auth state monitoring (from useAuthStore)
 * - AdMob initialization
 * - Push notifications
 * - Quran/Duas data preloading
 * - TrackPlayer registration
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import mobileAds from 'react-native-google-mobile-ads';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync, PermissionStatus } from 'expo-tracking-transparency';
import { registerForPushNotificationsAsync } from '../../utils/registerForPushNotificationsAsync';
import { initializeAuthListener } from '../../stores/useAuthStore';
import { cache } from '../../api/client/storage';
import { fetchSurahs } from '../../api/services/quran';
import { QURAN_QUERY_KEYS } from '../../api/services/quran';
import { updatePrayerTimesWidget } from '../../utils/widgetBridge';
import { Platform } from 'react-native';
import { modernPrayerService } from '../../services/prayer.service';

// Track if lazy init has run
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
    if (!isReady || hasInitialized || initStartedRef.current) return;
    
    initStartedRef.current = true;
    hasInitialized = true;

    // Small delay to prioritize UI rendering
    const timeoutId = setTimeout(() => {
      initializeNonCriticalFeatures();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isReady, queryClient]);

  const initializeNonCriticalFeatures = async () => {
    console.log('🔧 Starting lazy initialization...');

    // 1. Auth State Monitoring (from Zustand store)
    initAuthMonitoring();

    // 2. AdMob (async, doesn't block)
    initAdMob();

    // 3. Push Notifications (async, doesn't block)
    initPushNotifications();

    // 4. Preload Quran data (async, doesn't block)
    preloadQuranData();

    // 5. ✅ Update iOS Widget with monthly prayer times
    updateIOSWidget();
  };

  const initAuthMonitoring = () => {
    try {
      // Initialize Firebase auth listener (from useAuthStore)
      const unsubscribe = initializeAuthListener();
      console.log('✅ Auth monitoring initialized');

      // Cleanup function (though this hook rarely unmounts)
      return unsubscribe;
    } catch (err) {
      console.warn('⚠️ Auth monitoring failed:', err);
    }
  };

  const initAdMob = async () => {
    try {
      console.log('🎯 Initializing AdMob...');

      // Request ATT permission (iOS 14.5+)
      const { status } = await getTrackingPermissionsAsync();
      if (status === PermissionStatus.UNDETERMINED) {
        await requestTrackingPermissionsAsync();
      }

      // Initialize AdMob
      await mobileAds().initialize();
      console.log('✅ AdMob initialized');
    } catch (err) {
      console.warn('⚠️ AdMob initialization failed:', err);
    }
  };

  const initPushNotifications = async () => {
    try {
      await registerForPushNotificationsAsync();
      console.log('✅ Push notifications registered');
    } catch (err) {
      console.warn('⚠️ Push notification registration failed:', err);
    }
  };

  const preloadQuranData = async () => {
    try {
      console.log('📚 Preloading Quran data...');

      // Check cache first
      const cacheKey = 'quran-surahs';
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log('✅ Using cached Quran data');
        // Seed cache into QueryClient
        queryClient.setQueryData(QURAN_QUERY_KEYS.surahs, cached);
        return;
      }

      // Prefetch surahs
      await queryClient.prefetchQuery({
        queryKey: QURAN_QUERY_KEYS.surahs,
        queryFn: fetchSurahs,
        staleTime: Infinity, // Quran data never changes
      });

      console.log('✅ Quran data loaded');
    } catch (err) {
      console.warn('⚠️ Quran data preloading failed:', err);
    }
  };

  const updateIOSWidget = async () => {
    // Only run on iOS
    if (Platform.OS !== 'ios') {
      console.log('⏭️ Skipping widget update (not iOS)');
      return;
    }

    try {
      console.log('📱 Updating iOS widget with monthly prayer times...');

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // Check cache first (instant, synchronous)
      const cacheKey = `monthly_times_${currentYear}_${currentMonth}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('✅ Using cached monthly times for widget');
        
        // Update widget with cached data
        await updatePrayerTimesWidget(cachedData);
        console.log('✅ Widget updated (from cache)');
        return;
      }

      // Fetch from Firebase if not cached
      // This will automatically update the widget inside the service
      console.log('🌐 Fetching monthly prayer times for widget');
      await modernPrayerService.fetchMonthlyPrayerTimes(currentYear, currentMonth);
      
      console.log('✅ Widget updated (from network)');
    } catch (err) {
      console.warn('⚠️ Widget update failed (non-critical):', err);
      // Don't throw - widget failure shouldn't affect app
    }
  };
};