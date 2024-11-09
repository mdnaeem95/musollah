import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch } from 'react-redux';
import Purchases from 'react-native-purchases';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';

import { AppDispatch, persistor } from '../redux/store/store';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { fetchDailyDoasData } from '../redux/slices/doasSlice';
import LoadingScreen from '../components/LoadingScreen';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { listenForUserUpdates } from '../redux/slices/userSlice';
import { registerBackgroundFetch } from '../utils/backgroundPrayerNotificationScheduler';


if (AppState.currentState === 'active') {
  SplashScreen.preventAutoHideAsync();
}

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isEssentialDataFetched, setIsEssentialDataFetched] = useState<boolean>(false);
  const [isNonEssentialDataFetched, setIsNonEssentialDataFetched] = useState<boolean>(false);
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
    translateY.value = withTiming(1000, { duration: 300, easing: Easing.inOut(Easing.ease) })
  }, [])

  // Monitor Authentication State
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    registerBackgroundFetch();
  }, []);
  
  // Listener to monitor changes in user documents
  useEffect(() => {
    dispatch(listenForUserUpdates());
  }, [dispatch]);

  // Fetch only essential data (Prayer Times) first
  useEffect(() => {
    if (!isRehydrated) return;

    const fetchEssentialData = async () => {
      try {
        console.log('Fetching essential data: Prayer Times...');
        await dispatch(fetchPrayerTimesData()).unwrap();
        setIsEssentialDataFetched(true);
      } catch (error) {
        console.error('Error fetching essential data:', error);
      }
    };

    if (!isEssentialDataFetched) {
      fetchEssentialData();
    }
  }, [dispatch, isEssentialDataFetched, isRehydrated]);

  // Fetch some non-essential data (surahs) after the app has loaded but defer fetching user location and musollah data until necessary
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

  // Lazy-load Purchases SDK after authentication
  useEffect(() => {
    const configurePurchases = async () => {
      try {
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: 'appl_MajNlUmfjhcjaiAeGxrjxxmNlMl' });
        } else if (Platform.OS === 'android') {
          await Purchases.configure({ apiKey: 'goog_eNONXJAXWNVctmKATKkiJgdtZoB' });
        }
        console.log('Purchases SDK configured.');
      } catch (error) {
        console.error('Error configuring Purchases SDK:', error);
      }
    };

    if (isAuthenticated) {
      configurePurchases(); // Load SDK only after authentication
    }
  }, [isAuthenticated]);

  // Hide the splash screen once fonts and essential data are ready
  useEffect(() => {
    const hideSplashScreenandAnimate = async () => {
      try {
        hideSplashScreen();
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error hiding SplashScreen:', error);
      }
    };

    if (isFontsLoaded && isEssentialDataFetched) {
      hideSplashScreenandAnimate();
    }
  }, [isFontsLoaded, isEssentialDataFetched, hideSplashScreen]);

  // reanimated style for splash screen sliding animation
  const animatedSplashStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    }
  })

  // Show loading screen while setting up the app
  if (!isFontsLoaded || !isEssentialDataFetched || !isRehydrated) {
    return <LoadingScreen message="Setting up the app..." />;
  }

  // Main app layout after authentication and data fetch
  return (
    <View style={{ flex: 1 }}>
      {/* SplashScreen */}
      <Animated.View style={[styles.splashScreen, animatedSplashStyle]} />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </View>
  );
};

const styles = {
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2E3D3A',
    zIndex: 1
  }
}

export default RootLayout;
