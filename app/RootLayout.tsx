import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, StyleSheet, View } from 'react-native';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';
import { AppDispatch, persistor } from '../redux/store/store';
import { useLogTrackPlayerState } from '../hooks/useLogTrackPlayerState'
import { useSetupTrackPlayer } from "../hooks/useSetupTrackPlayer"
import { fetchPrayerTimesFromFirebase } from '../redux/slices/prayerSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { fetchDailyDoasData } from '../redux/slices/doasSlice';
import LoadingScreen from '../components/LoadingScreen';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import TrackPlayer from 'react-native-track-player';
import { playbackService } from '../constants/playbackService';
import mobileAds from 'react-native-google-mobile-ads';
import { getTrackingPermissionsAsync, PermissionStatus, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { seedPrayerTimesToWidget } from '../api/firebase/prayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (AppState.currentState === 'active') {
  SplashScreen.preventAutoHideAsync();
}
TrackPlayer.registerPlaybackService(() => playbackService)

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isEssentialDataFetched, setIsEssentialDataFetched] = useState<boolean>(false);
  const [isTrackPlayerSetup, setIsTrackPlayerSetup] = useState(false);
  const [isNonEssentialDataFetched, setIsNonEssentialDataFetched] = useState<boolean>(false);
  const [isAdMobInitialized, setIsAdMobInitialized] = useState(false);
  const [isFontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
  });
  const isRehydrated = persistor.getState().bootstrapped;
  const translateY = useSharedValue(0);
  const hideSplashScreen = useCallback(() => {
    translateY.value = withTiming(1000, { duration: 300, easing: Easing.inOut(Easing.ease) }, () => {
      runOnJS(SplashScreen.hideAsync)();
    });
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initializeAdMob = async () => {
      try {
        const { status } = await getTrackingPermissionsAsync();

        if (status === PermissionStatus.UNDETERMINED) {
          await requestTrackingPermissionsAsync();
        }

        const adapterStatuses = await mobileAds().initialize();
        console.log('AdMob initialized:', adapterStatuses);
        setIsAdMobInitialized(true);
      } catch (error) {
        console.error('Error initializing AdMob:', error);
      }
    };
    initializeAdMob();
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (!isRehydrated) return;
    const fetchEssentialData = async () => {
      try {
        console.log('Fetching essential data from Firebase');
        const prayerData = await dispatch(fetchPrayerTimesFromFirebase({})).unwrap();
        seedPrayerTimesToWidget();
        console.log('✅ Retrieved Prayer Times from Firebase:', JSON.stringify(prayerData, null, 2));
        setIsEssentialDataFetched(true);
      } catch (error) {
        console.error('Error fetching essential data:', error);
        setIsEssentialDataFetched(true);
      }
    };
    if (!isEssentialDataFetched) {
      fetchEssentialData();
    }
  }, [dispatch, isEssentialDataFetched, isRehydrated]);

  useEffect(() => {
    const fetchNonEssentialData = async () => {
      try {
        console.log('Fetching non-essential data (surahs)...');
        await dispatch(fetchSurahsData()).unwrap();
        await dispatch(fetchDailyDoasData()).unwrap();
        setIsNonEssentialDataFetched(true);
      } catch (error) {
        console.error('Error fetching non-essential data:', error);
      }
    };
    if (!isNonEssentialDataFetched) {
      fetchNonEssentialData();
    }
  }, [dispatch, isNonEssentialDataFetched]);

  const handleTrackPlayerLoaded = useCallback(() => {
    setIsTrackPlayerSetup(true);
  }, [])
  useSetupTrackPlayer({ onLoad: handleTrackPlayerLoaded });
  useLogTrackPlayerState();

  useEffect(() => {
    if (isFontsLoaded && isEssentialDataFetched && isTrackPlayerSetup && isAdMobInitialized) {
      hideSplashScreen();
    }
  }, [isFontsLoaded, isEssentialDataFetched, hideSplashScreen, isTrackPlayerSetup, isAdMobInitialized]);

  const animatedSplashStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    }
  });

  if (!isFontsLoaded || !isEssentialDataFetched || !isRehydrated || !isAdMobInitialized) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingScreen message="Setting up the app..." />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[styles.splashScreen, animatedSplashStyle]} />
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = {
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2E3D3A',
    zIndex: 1
  }
}

export default RootLayout;