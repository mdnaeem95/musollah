import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../redux/store/store'
import { fetchUserLocation } from '../redux/actions/userLocationActions';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchMusollahData } from '../redux/actions/musollahActions'
import { fetchSurahsData } from '../redux/actions/quranActions'

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, errorMsg, userLocation } = useSelector((state: RootState) => state.location);
  const { isLoading: prayerLoading } = useSelector((state: RootState) => state.prayer);
  const { isLoading: musollahLoading } = useSelector((state: RootState) => state.musollah);
  const { isLoading: surahsLoading } = useSelector((state: RootState) => state.quran);
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
    dispatch(fetchUserLocation());
    dispatch(fetchPrayerTimesData());
    dispatch(fetchSurahsData());
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      dispatch(fetchMusollahData(userLocation))
    }
  }, [userLocation, dispatch]);

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

    if (isAppReady) {
      SplashScreen.hideAsync().then(() => {
        console.log('SplashScreen hidden');
      }).catch(error => {
        console.error('Error hiding SplashScreen', error)
      });
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

export default RootLayout;