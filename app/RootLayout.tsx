import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../redux/store/store'
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';

import { fetchUserLocation } from '../redux/slices/userLocationSlice';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchMusollahData } from '../redux/slices/musollahSlice'
import { fetchSurahsData } from '../redux/slices/quranSlice'
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AuthScreen from './(auth)/AuthScreen';

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, errorMsg, userLocation } = useSelector((state: RootState) => state.location);
  const { isLoading: prayerLoading } = useSelector((state: RootState) => state.prayer);
  const { isLoading: musollahLoading } = useSelector((state: RootState) => state.musollah);
  const { isLoading: surahsLoading } = useSelector((state: RootState) => state.quran);

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => {
      console.log('Unsubscribing from auth state changes.');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchUserLocation()).unwrap();
        await dispatch(fetchPrayerTimesData()).unwrap();
        await dispatch(fetchSurahsData()).unwrap();
      } catch (error) {
        console.log('Error fetching initial data: ', error);
      }
    }

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      const fetchLocations = async () => {
        try {
          await dispatch(fetchMusollahData(userLocation)).unwrap();
        } catch (error) {
          console.error('Error fetching Locations data: ', error);
        }
      }
      fetchLocations();
    }
  }, [userLocation, dispatch]);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: 'appl_MajNlUmfjhcjaiAeGxrjxxmNlMl' });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: 'goog_eNONXJAXWNVctmKATKkiJgdtZoB' })
    }
  })

  useEffect(() => {
    if (!isLoading && !prayerLoading && !musollahLoading && !surahsLoading && fontsLoaded) {
      setIsAppReady(true);
      console.log('App is ready...')
    }
  }, [isLoading, prayerLoading, musollahLoading, surahsLoading, fontsLoaded]);

  useEffect(() => {
    console.log('Fonts loaded:', fontsLoaded);
    console.log('Location loading:', isLoading);
    console.log('Prayer loading:', prayerLoading);
    console.log('Musollah loading:', musollahLoading);
    console.log('Quran loading:', surahsLoading);

    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log('SplashScreen hidden')
      } catch (error) {
        console.error('Error hiding SplashScreen: ', error);
      }
    }

    if (isAppReady) {
      hideSplashScreen();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

export default RootLayout;