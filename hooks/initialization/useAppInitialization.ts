/**
 * App Initialization Hook
 * 
 * ✅ ENHANCED: Added detailed logging to debug stuck splash screen
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { cache } from '../../api/client/storage';
import { useLocationStore } from '../../stores/useLocationStore';
import { modernPrayerService } from '../../services/prayer.service';
import { storage as mmkvStorage } from '../../api/client/storage';

interface InitState {
  isReady: boolean;
  progress: number;
  error: Error | null;
}

/**
 * Critical initialization - blocks app rendering
 */
export const useAppInit = (): InitState => {
  const queryClient = useQueryClient();
  const { userLocation, fetchLocation } = useLocationStore();

  console.log('default keys:', mmkvStorage.getAllKeys());

  // 1. Font Loading
  const [fontsLoaded, fontError] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
  });

  // 2. Critical Task States
  const [locationDone, setLocationDone] = useState(false);
  const [prayerTimesDone, setPrayerTimesDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Log font loading status
  useEffect(() => {
    console.log('🔍 Font Status:', {
      fontsLoaded,
      fontError: fontError?.message,
    });
  }, [fontsLoaded, fontError]);

  // Calculate overall progress
  const calculateProgress = useCallback(() => {
    let completed = 0;
    if (fontsLoaded) completed += 40;
    if (locationDone) completed += 30;
    if (prayerTimesDone) completed += 30;
    
    console.log('📊 Progress:', {
      total: completed,
      fonts: fontsLoaded ? 40 : 0,
      location: locationDone ? 30 : 0,
      prayers: prayerTimesDone ? 30 : 0,
    });
    
    return completed;
  }, [fontsLoaded, locationDone, prayerTimesDone]);

  // Update progress
  useEffect(() => {
    setProgress(calculateProgress());
  }, [calculateProgress]);

  // STEP 1: Get Location (cached or fetch)
  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('📍 Getting location...');

        if (userLocation) {
          console.log('✅ Using cached location');
          setLocationDone(true);
          return;
        }

        await Promise.race([
          fetchLocation(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 3000)
          ),
        ]);

        console.log('✅ Location obtained');
        setLocationDone(true);
      } catch (err) {
        console.warn('⚠️ Location failed, using default Singapore location');
        setLocationDone(true);
      }
    };

    getLocation();
  }, [userLocation, fetchLocation]);

  // STEP 2: Prefetch Prayer Times (cache-first, after location)
  useEffect(() => {
    if (!locationDone || !userLocation) {
      console.log('⏳ Waiting for location...', { locationDone, hasLocation: !!userLocation });
      return;
    }

    const prefetchPrayerTimes = async () => {
      try {
        console.log('🕌 Prefetching prayer times...');

        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `prayer_times_${today}`;
        const cached = cache.get(cacheKey);

        if (cached) {
          console.log('✅ Using cached prayer times');
          queryClient.setQueryData(
            ['prayer-times', 'daily', today],
            cached
          );
          setPrayerTimesDone(true);
          return;
        }

        console.log('🌐 Fetching prayer times from service');
        const prayerData = await modernPrayerService.fetchPrayerTimesForDate(today);
        
        queryClient.setQueryData(
          ['prayer-times', 'daily', today],
          prayerData
        );

        console.log('✅ Prayer times prefetched');
        setPrayerTimesDone(true);
      } catch (err) {
        console.error('❌ Prayer times prefetch error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load prayer times'));
        setPrayerTimesDone(true); // Don't block app on error
      }
    };

    prefetchPrayerTimes();
  }, [locationDone, userLocation, queryClient]);

  // ✅ Determine if app is ready (with detailed logging)
  const isReady = fontsLoaded && locationDone && prayerTimesDone;

  useEffect(() => {
    console.log('🚀 App Ready Status:', {
      isReady,
      fontsLoaded,
      locationDone,
      prayerTimesDone,
      hasError: !!error,
    });
  }, [isReady, fontsLoaded, locationDone, prayerTimesDone, error]);

  return {
    isReady,
    progress,
    error: fontError || error,
  };
};