import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { format } from 'date-fns';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import mobileAds from 'react-native-google-mobile-ads';
import { getTrackingPermissionsAsync, PermissionStatus, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import TrackPlayer from 'react-native-track-player';

// Store and Redux
import { AppDispatch, persistor } from '../redux/store/store';
import { fetchPrayerTimesForDate } from '../redux/slices/prayerSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { fetchDailyDoasData } from '../redux/slices/doasSlice';

// Components
import LoadingScreen from '../components/LoadingScreen';

// Hooks
import { useLogTrackPlayerState } from '../hooks/useLogTrackPlayerState';
import { useSetupTrackPlayer } from "../hooks/useSetupTrackPlayer";

// Utils
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
import { seedPrayerTimesToWidget } from '../api/firebase/prayer';
import { playbackService } from '../constants/playbackService';
import { migrateFromAsyncStorage } from '../utils/storageMigration';
import { storage } from '../utils/storage';

// Fonts
import { 
  Outfit_300Light, 
  Outfit_400Regular, 
  Outfit_500Medium, 
  Outfit_600SemiBold, 
  Outfit_700Bold 
} from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";

// Prevent auto-hide of splash screen
if (AppState.currentState === 'active') {
  SplashScreen.preventAutoHideAsync();
}

// Register TrackPlayer service
TrackPlayer.registerPlaybackService(() => playbackService);

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});

// Types for initialization status
interface InitializationStatus {
  mmkvMigration: boolean;
  fonts: boolean;
  auth: boolean;
  essentialData: boolean;
  trackPlayer: boolean;
  adMob: boolean;
  nonEssentialData: boolean;
}

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [initStatus, setInitStatus] = useState<InitializationStatus>({
    mmkvMigration: false,
    fonts: false,
    auth: false,
    essentialData: false,
    trackPlayer: false,
    adMob: false,
    nonEssentialData: false,
  });
  
  const isRehydrated = persistor.getState().bootstrapped;
  const translateY = useSharedValue(0);

  // Font loading
  const [isFontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
  });

  // Update initialization status helper
  const updateInitStatus = useCallback((key: keyof InitializationStatus, value: boolean) => {
    setInitStatus(prev => ({ ...prev, [key]: value }));
  }, []);

  // Check if all critical initializations are complete
  const isCriticalInitComplete = 
    initStatus.mmkvMigration && 
    isFontsLoaded && 
    initStatus.essentialData && 
    initStatus.trackPlayer && 
    initStatus.adMob &&
    isRehydrated;

  // Hide splash screen animation
  const hideSplashScreen = useCallback(() => {
    translateY.value = withTiming(1000, { 
      duration: 300, 
      easing: Easing.inOut(Easing.ease) 
    }, () => {
      runOnJS(SplashScreen.hideAsync)();
    });
  }, [translateY]);

  // 1. MMKV Migration (First priority)
  useEffect(() => {
    const runMigration = async () => {
      try {
        console.log('🔄 Starting MMKV migration...');
        const migrationStart = Date.now();
        
        await migrateFromAsyncStorage();
        
        const migrationTime = Date.now() - migrationStart;
        console.log(`✅ MMKV migration completed in ${migrationTime}ms`);
        
        // Log performance improvement
        const lastStartupTime = storage.getNumber('last_startup_time');
        if (lastStartupTime) {
          console.log(`📊 Startup improvement: ${lastStartupTime - migrationTime}ms faster`);
        }
        storage.set('last_startup_time', migrationTime);
        
        updateInitStatus('mmkvMigration', true);
      } catch (error) {
        console.error('❌ MMKV migration failed:', error);
        // Continue with app startup even if migration fails
        updateInitStatus('mmkvMigration', true);
      }
    };

    if (!initStatus.mmkvMigration) {
      runMigration();
    }
  }, [initStatus.mmkvMigration, updateInitStatus]);

  // 2. Auth State Monitoring
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      updateInitStatus('auth', true);
    });

    return () => unsubscribe();
  }, [updateInitStatus]);

  // 3. AdMob Initialization (can run in parallel)
  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        const { status } = await getTrackingPermissionsAsync();
        if (status === PermissionStatus.UNDETERMINED) {
          await requestTrackingPermissionsAsync();
        }

        await mobileAds().initialize();
        console.log('✅ AdMob initialized');
        updateInitStatus('adMob', true);
      } catch (error) {
        console.error('Error initializing AdMob:', error);
        updateInitStatus('adMob', true); // Continue even if AdMob fails
      }
    };

    if (!initStatus.adMob && initStatus.mmkvMigration) {
      initializeAdMob();
    }
  }, [initStatus.adMob, initStatus.mmkvMigration, updateInitStatus]);

  // 4. Essential Data Fetching (after MMKV migration)
  useEffect(() => {
    const fetchEssentialData = async () => {
      try {
        console.log('📱 Fetching essential data...');
        
        // Check cache first (MMKV is synchronous!)
        const cachedPrayerTimes = storage.getString('cached_prayer_times');
        const cacheTimestamp = storage.getNumber('prayer_times_timestamp');
        const now = Date.now();
        
        // Use cache if less than 1 hour old
        if (cachedPrayerTimes && cacheTimestamp && (now - cacheTimestamp < 3600000)) {
          console.log('✅ Using cached prayer times');
          updateInitStatus('essentialData', true);
          return;
        }
        
        // Fetch fresh data
        const todayFormatted = format(new Date(), 'dd/MM/yyyy');
        const prayerData = await dispatch(fetchPrayerTimesForDate(todayFormatted)).unwrap();
        
        // Cache the data in MMKV
        storage.set('cached_prayer_times', JSON.stringify(prayerData));
        storage.set('prayer_times_timestamp', now);
        
        // Seed to widget
        if (typeof seedPrayerTimesToWidget === 'function') {
          seedPrayerTimesToWidget().catch(console.error);
        }
        
        console.log('✅ Essential data fetched');
        updateInitStatus('essentialData', true);
      } catch (error) {
        console.error('Error fetching essential data:', error);
        updateInitStatus('essentialData', true);
      }
    };

    if (!initStatus.essentialData && initStatus.mmkvMigration && isRehydrated) {
      fetchEssentialData();
    }
  }, [dispatch, initStatus.essentialData, initStatus.mmkvMigration, isRehydrated, updateInitStatus]);

  // 5. TrackPlayer Setup
  const handleTrackPlayerLoaded = useCallback(() => {
    updateInitStatus('trackPlayer', true);
  }, [updateInitStatus]);

  useSetupTrackPlayer({ onLoad: handleTrackPlayerLoaded });
  useLogTrackPlayerState();

  // 6. Non-Essential Data (can load after UI is shown)
  useEffect(() => {
    const fetchNonEssentialData = async () => {
      try {
        console.log('📚 Fetching non-essential data...');
        
        // Check cache for Quran data
        const cachedSurahs = storage.getString('cached_surahs');
        if (!cachedSurahs) {
          const surahData = await dispatch(fetchSurahsData()).unwrap();
          storage.set('cached_surahs', JSON.stringify(surahData));
        }
        
        // Fetch daily duas
        await dispatch(fetchDailyDoasData()).unwrap();
        
        console.log('✅ Non-essential data fetched');
        updateInitStatus('nonEssentialData', true);
      } catch (error) {
        console.error('Error fetching non-essential data:', error);
        updateInitStatus('nonEssentialData', true);
      }
    };

    // Start fetching after critical init is complete
    if (isCriticalInitComplete && !initStatus.nonEssentialData) {
      // Delay non-essential data to prioritize UI responsiveness
      setTimeout(fetchNonEssentialData, 500);
    }
  }, [dispatch, isCriticalInitComplete, initStatus.nonEssentialData, updateInitStatus]);

  // 7. Register push notifications (non-blocking)
  useEffect(() => {
    if (initStatus.mmkvMigration) {
      registerForPushNotificationsAsync().catch(console.error);
    }
  }, [initStatus.mmkvMigration]);

  // 8. Update fonts status
  useEffect(() => {
    if (isFontsLoaded) {
      updateInitStatus('fonts', true);
    }
  }, [isFontsLoaded, updateInitStatus]);

  // 9. Hide splash screen when critical init is complete
  useEffect(() => {
    if (isCriticalInitComplete) {
      hideSplashScreen();
    }
  }, [isCriticalInitComplete, hideSplashScreen]);

  // Animated splash screen style
  const animatedSplashStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Show loading screen while critical initialization is in progress
  if (!isCriticalInitComplete) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingScreen 
          message={
            !initStatus.mmkvMigration ? "Optimizing app performance..." :
            !isFontsLoaded ? "Loading fonts..." :
            !initStatus.essentialData ? "Loading prayer times..." :
            !initStatus.trackPlayer ? "Setting up audio player..." :
            "Almost ready..."
          } 
        />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[styles.splashScreen, animatedSplashStyle]} />
          <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false, 
                gestureEnabled: false 
              }} 
            />
          </Stack>
        </View>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2E3D3A',
    zIndex: 1
  }
});

export default RootLayout;