/**
 * App Initialization Hook
 * 
 * ✅ REFACTORED: Using structured logging system
 * 
 * Critical initialization that blocks app rendering:
 * - Font loading (40% progress)
 * - Location acquisition (30% progress)
 * - Prayer times prefetching (30% progress)
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { cache } from '../../api/client/storage';
import { useLocationStore } from '../../stores/useLocationStore';
import { storage as mmkvStorage } from '../../api/client/storage';
import { FontAwesome } from '@expo/vector-icons';
import { DEFAULT_LOCATION, fetchDailyPrayerTimeFromFirebase, prayerTimeKeys } from '../../api/services/prayer';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';
import { LocationObject } from 'expo-location';

// ✅ Create category-specific logger
const logger = createLogger('App Init');
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
  const userLocation = useLocationStore((s) => s.userLocation);
  const fetchLocation = useLocationStore((s) => s.fetchLocation);

  // ✅ Debug: Log MMKV keys
  logger.debug('MMKV storage keys', { 
    keys: mmkvStorage.getAllKeys(),
    count: mmkvStorage.getAllKeys().length 
  });

  // ==========================================================================
  // STEP 1: Font Loading
  // ==========================================================================
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font, 
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Amiri_400Regular,
  });

  // ==========================================================================
  // STEP 2: Critical Task States
  // ==========================================================================
  const [locationDone, setLocationDone] = useState(false);
  const [prayerTimesDone, setPrayerTimesDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Log font loading status
  useEffect(() => {
    if (fontError) {
      logger.error('Font loading failed', fontError, {
        errorName: fontError.name,
        errorMessage: fontError.message,
      });
    } else if (fontsLoaded) {
      logger.success('Fonts loaded successfully', {
        fontCount: 7, // 5 Outfit weights + Amiri + FontAwesome
        fonts: ['Outfit', 'Amiri', 'FontAwesome'],
      });
    } else {
      logger.debug('Font loading in progress...');
    }
  }, [fontsLoaded, fontError]);

  // ==========================================================================
  // Progress Calculation
  // ==========================================================================
  const calculateProgress = useCallback(() => {
    let completed = 0;
    const breakdown = {
      fonts: 0,
      location: 0,
      prayers: 0,
    };

    if (fontsLoaded) {
      completed += 40;
      breakdown.fonts = 40;
    }
    if (locationDone) {
      completed += 30;
      breakdown.location = 30;
    }
    if (prayerTimesDone) {
      completed += 30;
      breakdown.prayers = 30;
    }
    
    logger.debug('Progress updated', {
      total: completed,
      percentage: `${completed}%`,
      breakdown,
    });
    
    return completed;
  }, [fontsLoaded, locationDone, prayerTimesDone]);

  // Update progress
  useEffect(() => {
    setProgress(calculateProgress());
  }, [calculateProgress]);

  // ==========================================================================
  // STEP 3: Get Location (cached or fetch)
  // ==========================================================================
  useEffect(() => {
    const getLocation = async () => {
      logger.time('location-fetch');

      try {
        logger.info('Acquiring user location...');

        if (userLocation) {
          logger.success('Using cached location', {
            latitude: userLocation.coords.latitude.toFixed(4),
            longitude: userLocation.coords.longitude.toFixed(4),
          });
          setLocationDone(true);
          logger.timeEnd('location-fetch');
          return;
        }

        logger.debug('Fetching fresh location (3s timeout)');

        const loc = await Promise.race<LocationObject>([
          fetchLocation(),
          new Promise<LocationObject>((_, reject) =>
            setTimeout(() => reject(new Error('Location timeout')), 3000)
          ),
        ]);

        logger.success('Location obtained', {
          latitude: loc.coords.latitude.toFixed(4),
          longitude: loc.coords.longitude.toFixed(4),
        });

        setLocationDone(true);
        logger.timeEnd('location-fetch');
      } catch (err) {
        logger.warn('Location fetch failed, using default Singapore location', {
          error: err instanceof Error ? err.message : String(err),
          fallback: DEFAULT_LOCATION,
        });
        setLocationDone(true);
        logger.timeEnd('location-fetch');
      }
    };

    getLocation();
  }, [userLocation, fetchLocation]);

  // ==========================================================================
  // STEP 4: Prefetch Prayer Times (cache-first, after location)
  // ==========================================================================
  useEffect(() => {
    if (!locationDone) {
      logger.debug('Waiting for location before fetching prayer times', {
        locationDone,
        hasUserLocation: !!userLocation,
      });
      return;
    }

    const prefetchPrayerTimes = async () => {
      logger.time('prayer-times-prefetch');
      
      try {
        logger.info('Prefetching prayer times...');

        const today = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
        const location = userLocation?.coords || DEFAULT_LOCATION;
        
        // Query key
        const queryKey = prayerTimeKeys.today({ 
          latitude: location.latitude, 
          longitude: location.longitude 
        });
        
        // Check MMKV cache first
        const cacheKey = `prayer_times_${today}`;
        const cached = cache.get(cacheKey);

        if (cached) {
          logger.success('Using cached prayer times', {
            date: today,
            source: 'MMKV',
            cacheKey,
          });
          queryClient.setQueryData(queryKey, cached);
          setPrayerTimesDone(true);
          logger.timeEnd('prayer-times-prefetch');
          return;
        }

        // Fetch from Firebase
        logger.debug('Fetching prayer times from Firebase', {
          date: today,
          location: {
            latitude: location.latitude.toFixed(4),
            longitude: location.longitude.toFixed(4),
          },
        });
        
        const prayerData = await fetchDailyPrayerTimeFromFirebase(today);
        
        if (prayerData) {
          logger.success('Prayer times fetched successfully', {
            date: today,
            source: 'Firebase',
            prayerCount: Object.keys(prayerData).length,
          });
          
          // Seed QueryClient and MMKV cache
          queryClient.setQueryData(queryKey, prayerData);
          cache.set(cacheKey, prayerData, 86400000); // 24 hours
          
          logger.debug('Prayer times cached', {
            cacheKey,
            ttl: '24 hours',
          });
        } else {
          logger.warn('No prayer data returned from Firebase', { date: today });
        }
        
        setPrayerTimesDone(true);
        logger.timeEnd('prayer-times-prefetch');
      } catch (err) {
        logger.error('Prayer times prefetch failed', err, {
          willContinue: 'yes (non-blocking)',
        });
        setError(err instanceof Error ? err : new Error('Failed to load prayer times'));
        setPrayerTimesDone(true); // Don't block app on error
        logger.timeEnd('prayer-times-prefetch');
      }
    };

    prefetchPrayerTimes();
  }, [locationDone, userLocation, queryClient]);

  // ==========================================================================
  // Ready State
  // ==========================================================================
  const isReady = fontsLoaded && locationDone && prayerTimesDone;

  useEffect(() => {
    if (isReady) {
      logger.success('🚀 App initialization complete!', {
        progress: '100%',
        fontsLoaded,
        locationDone,
        prayerTimesDone,
        hasError: !!error,
      });
    } else {
      logger.debug('App initialization in progress', {
        progress: `${progress}%`,
        fontsLoaded,
        locationDone,
        prayerTimesDone,
      });
    }
  }, [isReady, fontsLoaded, locationDone, prayerTimesDone, error, progress]);

  return {
    isReady,
    progress,
    error: fontError || error,
  };
};