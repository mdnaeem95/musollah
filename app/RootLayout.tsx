import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

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

// Prevent SplashScreen from hiding automatically
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userLocation } = useSelector((state: RootState) => state.location);
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

  // Monitor Authentication State
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log('Authentication state changed, user:', user ? user.email : 'None');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch Data (User Location, Prayer Times, Surahs)
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching initial data...');
        await dispatch(fetchUserLocation()).unwrap();  // Fetch user location first
        await dispatch(fetchPrayerTimesData()).unwrap();  // Fetch prayer times
        await dispatch(fetchSurahsData()).unwrap();  // Fetch Quran surahs
        setIsDataFetched(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    // Only fetch data if it hasn't been fetched yet
    if (!isDataFetched) {
      fetchData();
    }
  }, [dispatch, isDataFetched]);

  // Fetch Musollah Data once user location is available
  useEffect(() => {
    if (userLocation) {
      const fetchMusollah = async () => {
        try {
          await dispatch(fetchMusollahData(userLocation)).unwrap();
        } catch (error) {
          console.error('Error fetching Musollah data:', error);
        }
      };

      fetchMusollah();
    }
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
  if (!isFontsLoaded || !isDataFetched) {
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
