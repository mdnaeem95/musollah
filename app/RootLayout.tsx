import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import { useFonts } from 'expo-font';
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../redux/store/store'
import { fetchUserLocation } from '../redux/actions/userLocationActions';
import { fetchPrayerTimesData } from '../redux/actions/prayerTimesActions';
import { fetchMusollahData } from '../redux/actions/musollahActions'
import { fetchQuranData } from '../redux/actions/quranActions'

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, errorMsg, userLocation } = useSelector((state: RootState) => state.location);
  const { isLoading: prayerLoading } = useSelector((state: RootState) => state.prayer);
  const { isLoading: musollahLoading } = useSelector((state: RootState) => state.musollah);
  const { isLoading: quranLoading } = useSelector((state: RootState) => state.quran);

  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Amiri_400Regular
  });

  useEffect(() => {
    dispatch(fetchUserLocation());
    dispatch(fetchPrayerTimesData());
    dispatch(fetchQuranData());
  }, [dispatch]);

  useEffect(() => {
    if (userLocation) {
      dispatch(fetchMusollahData(userLocation))
    }
  }, [userLocation, dispatch]);

  useEffect(() => {
    console.log('Fonts loaded:', fontsLoaded);

    if (!isLoading && !prayerLoading && !musollahLoading && !quranLoading && fontsLoaded) {
      SplashScreen.hideAsync().then(() => {
        console.log('SplashScreen hidden');
      }).catch(error => {
        console.error('Error hiding SplashScreen', error)
      });
    }
  }, [isLoading, prayerLoading, musollahLoading, quranLoading, fontsLoaded]);

  if (!fontsLoaded || isLoading || prayerLoading || musollahLoading || quranLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

export default RootLayout;
