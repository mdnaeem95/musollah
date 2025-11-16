import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import auth from '@react-native-firebase/auth';
import mobileAds from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';
import { registerForPushNotificationsAsync } from '../../utils/registerForPushNotificationsAsync';
import { fetchSurahsData } from '../../redux/slices/quranSlice';
import { fetchDailyDoasData } from '../../redux/slices/doasSlice';
import { storage } from '../../utils/storage';
import type { AppDispatch } from '../../redux/store/store';

/**
 * Lazy initialization hook - runs AFTER app is ready
 * Handles all non-critical background tasks:
 * - Auth state monitoring
 * - AdMob initialization
 * - Push notifications
 * - Quran/Duas data preloading
 * 
 * @param isReady - Whether the app has completed critical initialization
 */
export const useLazyInit = (isReady: boolean) => {
  const dispatch = useDispatch<AppDispatch>();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isReady || hasRun.current) return;
    hasRun.current = true;

    // Small delay to prioritize UI rendering
    const timeoutId = setTimeout(() => {
      initializeNonCriticalFeatures();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isReady]);

  const initializeNonCriticalFeatures = async () => {
    console.log('🔧 Starting lazy initialization...');

    // 1. Auth State Monitoring (async, doesn't block)
    initAuthMonitoring();

    // 2. AdMob (async, doesn't block)
    initAdMob();

    // 3. Push Notifications (async, doesn't block)
    initPushNotifications();

    // 4. Preload Quran/Duas data (async, doesn't block)
    preloadData();
  };

  const initAuthMonitoring = () => {
    try {
      const unsubscribe = auth().onAuthStateChanged((user) => {
        if (user) {
          console.log('✅ User authenticated:', user.uid);
        } else {
          console.log('ℹ️ Guest mode');
        }
      });

      // Cleanup on unmount (though this hook rarely unmounts)
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

  const preloadData = async () => {
    try {
      console.log('📚 Preloading data...');

      // Check cache for Quran data
      const cachedSurahs = storage.getString('cached_surahs');
      if (!cachedSurahs) {
        await dispatch(fetchSurahsData()).unwrap();
        console.log('✅ Quran data loaded');
      } else {
        console.log('✅ Using cached Quran data');
      }

      // Fetch daily duas
      await dispatch(fetchDailyDoasData()).unwrap();
      console.log('✅ Daily duas loaded');
    } catch (err) {
      console.warn('⚠️ Data preloading failed:', err);
    }
  };
};