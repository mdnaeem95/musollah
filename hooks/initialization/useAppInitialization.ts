/**
 * App Initialization Hook
 * 
 * Handles ONLY critical startup tasks that block app rendering:
 * - Font loading
 * - Prayer times prefetch (cache-first)
 * 
 * Non-critical tasks are handled by useLazyInit
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { cache, TTL } from '../../api/client/storage';
import { useLocationStore } from '../../stores/useLocationStore';
import { fetchTodayPrayerTimes } from '../../api/services/prayer/api';
import { PRAYER_QUERY_KEYS } from '../../api/services/prayer/types';

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

  // Calculate overall progress
  const calculateProgress = useCallback(() => {
    let completed = 0;
    if (fontsLoaded) completed += 40;
    if (locationDone) completed += 30;
    if (prayerTimesDone) completed += 30;
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

        // Use cached location if available
        if (userLocation) {
          console.log('✅ Using cached location');
          setLocationDone(true);
          return;
        }

        // Fetch location with timeout
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
        // Default location is already set in store
        setLocationDone(true);
      }
    };

    getLocation();
  }, [userLocation, fetchLocation]);

  // STEP 2: Prefetch Prayer Times (cache-first, after location)
  useEffect(() => {
    if (!locationDone || !userLocation) return;

    const prefetchPrayerTimes = async () => {
      try {
        console.log('🕌 Prefetching prayer times...');

        const location = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        };

        // Check MMKV cache first
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `prayer-times-today-${location.latitude}-${location.longitude}`;
        const cached = cache.get(cacheKey);

        if (cached) {
          console.log('✅ Using cached prayer times');
          // Seed cache into QueryClient
          queryClient.setQueryData(
            PRAYER_QUERY_KEYS.daily(today, location),
            cached
          );
          setPrayerTimesDone(true);
          return;
        }

        // Prefetch from API
        console.log('🌐 Fetching prayer times from API');
        
        await queryClient.prefetchQuery({
          queryKey: PRAYER_QUERY_KEYS.daily(today, location),
          queryFn: () => fetchTodayPrayerTimes(location.latitude, location.longitude),
          staleTime: TTL.ONE_HOUR,
        });

        console.log('✅ Prayer times prefetched');
        setPrayerTimesDone(true);
      } catch (err) {
        console.error('❌ Prayer times prefetch error:', err);

        // Try to use any stale cache
        const staleCache = cache.get('prayer-times-stale-fallback');
        if (staleCache) {
          console.log('⚠️ Using stale cache');
          setPrayerTimesDone(true);
          return;
        }

        // Surface error but don't block app
        setError(err instanceof Error ? err : new Error('Failed to load prayer times'));
        setPrayerTimesDone(true);
      }
    };

    prefetchPrayerTimes();
  }, [locationDone, userLocation, queryClient]);

  // Determine if app is ready
  const isReady = fontsLoaded && locationDone && prayerTimesDone;

  return {
    isReady,
    progress,
    error: fontError || error,
  };
};