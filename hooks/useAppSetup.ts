import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSetupTrackPlayer } from '../hooks/useSetupTrackPlayer';
import { useLogTrackPlayerState } from '../hooks/useLogTrackPlayerState';
import { AppDispatch, persistor } from '../redux/store/store';
import { fetchPrayerTimesData } from '../redux/slices/prayerSlice';
import { fetchSurahsData } from '../redux/slices/quranSlice';
import { fetchDailyDoasData } from '../redux/slices/doasSlice';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { Amiri_400Regular } from "@expo-google-fonts/amiri";

const useAppSetup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [isEssentialDataFetched, setIsEssentialDataFetched] = useState(false);
  const [isTrackPlayerSetup, setIsTrackPlayerSetup] = useState(false);
  const [isNonEssentialDataFetched, setIsNonEssentialDataFetched] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isFontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
  });

  const translateY = useSharedValue(0);
  const isRehydrated = persistor.getState().bootstrapped;

  const fetchEssentialData = useCallback(async () => {
    await dispatch(fetchPrayerTimesData()).unwrap();
    setIsEssentialDataFetched(true);
  }, [dispatch]);

  const fetchNonEssentialData = useCallback(async () => {
    await dispatch(fetchSurahsData()).unwrap();
    await dispatch(fetchDailyDoasData()).unwrap();
    setIsNonEssentialDataFetched(true);
  }, [dispatch]);

  const hideSplashScreen = useCallback(async () => {
    translateY.value = withTiming(1000, { duration: 300, easing: Easing.inOut(Easing.ease) });
    await SplashScreen.hideAsync();
    setIsReady(true);
  }, [router, translateY]);

  const handleTrackPlayerLoaded = useCallback(() => {
    setIsTrackPlayerSetup(true);
  }, []);

  useSetupTrackPlayer({ onLoad: handleTrackPlayerLoaded });
  useLogTrackPlayerState();

  useEffect(() => {
    if (isRehydrated && !isEssentialDataFetched) {
      fetchEssentialData();
    }
  }, [isRehydrated, isEssentialDataFetched, fetchEssentialData]);

  useEffect(() => {
    if (isEssentialDataFetched && !isNonEssentialDataFetched) {
      fetchNonEssentialData();
    }
  }, [isEssentialDataFetched, isNonEssentialDataFetched, fetchNonEssentialData]);

  useEffect(() => {
    if (isFontsLoaded && isEssentialDataFetched && isTrackPlayerSetup) {
      hideSplashScreen();
    }
  }, [isFontsLoaded, isEssentialDataFetched, isTrackPlayerSetup, hideSplashScreen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { isReady, animatedStyle };
};

export default useAppSetup;
