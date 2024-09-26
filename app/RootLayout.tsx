import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';

import { AppDispatch, RootState, persistor } from '../redux/store/store';
import { fetchUserLocation } from '../redux/slices/userLocationSlice';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchMusollahData } from '../redux/slices/musollahSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import AuthScreen from './(auth)/AuthScreen';
import LoadingScreen from '../components/LoadingScreen';

// Prevent SplashScreen from hiding automatically
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userLocation } = useSelector((state: RootState) => state.location);
  const { prayerTimes } = useSelector((state: RootState) => state.prayer);
  const { surahs } = useSelector((state: RootState) => state.quran);
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDataFetched, setIsDataFetched] = useState<boolean>(false);
  const [isFontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
  });

  const isRehydrated = persistor.getState().bootstrapped; // Check if Redux state is rehydrated

  // Monitor Authentication State
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setIsAuthenticated(!!user);
      console.log('Authentication state changed, user:', user ? user.email : 'None');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch Data (User Location, Prayer Times, Surahs) in parallel but only after state is rehydrated
  useEffect(() => {
    if (!isRehydrated) return; // Ensure Redux state is rehydrated before fetching data

    const fetchData = async () => {
      try {
        console.log('Fetching initial data...');

        // Fetch essential data in parallel
        await Promise.all([
          !userLocation && dispatch(fetchUserLocation()).unwrap(),  // Fetch user location if not available
          !prayerTimes && dispatch(fetchPrayerTimesData()).unwrap(), // Fetch prayer times if not available
          (!surahs || surahs.length === 0) && dispatch(fetchSurahsData()).unwrap(),  // Fetch Quran surahs if not available
        ]);

        setIsDataFetched(true);  // Data is fetched and stored in Redux
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    if (!isDataFetched) {
      fetchData();
    }
  }, [dispatch, isDataFetched, isRehydrated, userLocation, prayerTimes, surahs]);

  // Fetch Musollah Data once user location is available but defer it until after the initial app load
  useEffect(() => {
    if (userLocation && isAuthenticated && isDataFetched) {
      const fetchMusollah = async () => {
        try {
          await dispatch(fetchMusollahData(userLocation)).unwrap();
        } catch (error) {
          console.error('Error fetching Musollah data:', error);
        }
      };

      fetchMusollah(); // Deferred after essential data
    }
  }, [dispatch, userLocation, isAuthenticated, isDataFetched]);

  // Lazy load Purchases SDK after authentication
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
      configurePurchases();  // Only load Purchases SDK after user authentication
    }
  }, [isAuthenticated]);

  // Hide SplashScreen when fonts and data are loaded
  useEffect(() => {
    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('SplashScreen hidden');
      } catch (error) {
        console.error('Error hiding SplashScreen:', error);
      }
    };

    if (isFontsLoaded && isDataFetched) {
      hideSplashScreen();
    }
  }, [isFontsLoaded, isDataFetched]);

  // Display the loading screen while the app is setting up
  if (!isFontsLoaded || !isDataFetched || !isRehydrated) {
    return <LoadingScreen message="Setting up the app..." />;
  }

  // If the user is not authenticated, show the authentication screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Return the main app layout once the user is authenticated and data is loaded
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
};

export default RootLayout;