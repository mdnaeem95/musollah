import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import * as SplashScreen from 'expo-splash-screen';

import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';

import { AppDispatch, RootState } from '../redux/store/store';
import { fetchUserLocation } from '../redux/slices/userLocationSlice';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchMusollahData } from '../redux/slices/musollahSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AuthScreen from './(auth)/AuthScreen';
import LoadingScreen from '../components/LoadingScreen';
import { Platform } from 'react-native';

// Prevent SplashScreen from hiding automatically
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, userLocation } = useSelector((state: RootState) => state.location);
  const { isLoading: prayerLoading } = useSelector((state: RootState) => state.prayer);
  const { isLoading: musollahLoading } = useSelector((state: RootState) => state.musollah);
  const { isLoading: surahsLoading } = useSelector((state: RootState) => state.quran);

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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log('Authentication state changed, user:', user ? user.email : 'None');
    });

    return () => {
      console.log('Unsubscribing from auth state changes.');
      unsubscribe();
    };
  }, []);

  // Fetch initial data during loading screen
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching initial data...');
        await dispatch(fetchUserLocation()).unwrap();
        await dispatch(fetchPrayerTimesData()).unwrap();
        await dispatch(fetchSurahsData()).unwrap();

        if (userLocation) {
          await dispatch(fetchMusollahData(userLocation)).unwrap();
        }
        // Mark data fetching as complete
        setIsDataFetched(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchData();
  }, [dispatch, userLocation]);

  // Configure Purchases SDK
  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

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

    configurePurchases();
  }, []);

  // Hide the SplashScreen once the app is ready
  useEffect(() => {
    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('SplashScreen hidden');
      } catch (error) {
        console.error('Error hiding SplashScreen: ', error);
      }
    };

    if (isFontsLoaded) {
      hideSplashScreen();
    }
  }, [isFontsLoaded]);

  // Show the Loading Screen while data is being fetched and the user isn't authenticated
  if (!isFontsLoaded || !isDataFetched) {
    return <LoadingScreen message="Setting up the app..." />;
  }

  // If user is not authenticated, show the AuthScreen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Return the main app layout once the user is authenticated
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
};

export default RootLayout;
