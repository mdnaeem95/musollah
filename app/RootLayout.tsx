import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch } from 'react-redux';
import Purchases from 'react-native-purchases';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';

import { AppDispatch, persistor } from '../redux/store/store';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import LoadingScreen from '../components/LoadingScreen';
import { fetchDailyDoasData } from '../redux/slices/doasSlice';

SplashScreen.preventAutoHideAsync();

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

  // Monitor Authentication State
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

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
    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('SplashScreen hidden');
      } catch (error) {
        console.error('Error hiding SplashScreen:', error);
      }
    };

    if (isFontsLoaded && isEssentialDataFetched) {
      hideSplashScreen();
    }
  }, [isFontsLoaded, isEssentialDataFetched]);

  // Show loading screen while setting up the app
  if (!isFontsLoaded || !isEssentialDataFetched || !isRehydrated) {
    return <LoadingScreen message="Setting up the app..." />;
  }

  // Main app layout after authentication and data fetch
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
};

export default RootLayout;
