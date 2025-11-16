import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useFonts } from 'expo-font';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { storage } from '../../utils/storage';
import { migrateFromAsyncStorage } from '../../utils/storageMigration';
import { fetchPrayerTimesForDate } from '../../redux/slices/prayerSlice';
import { seedPrayerTimesToWidget } from '../../api/firebase/prayer';
import { todayKeySGT } from '../../utils/dateKey';
import type { AppDispatch } from '../../redux/store/store';

const MIGRATION_KEY = 'mmkv_migration_completed';
const PRAYER_CACHE_KEY = 'cached_prayer_times';
const PRAYER_TIMESTAMP_KEY = 'prayer_times_timestamp';
const CACHE_DURATION_MS = 3600000; // 1 hour

interface InitState {
  isReady: boolean;
  progress: number;
  error: Error | null;
}

/**
 * Consolidated initialization hook - handles ONLY critical startup tasks
 * 
 * Critical (blocks app):
 * - Storage migration (one-time)
 * - Font loading
 * - Prayer times (cache-first)
 * 
 * Non-critical (lazy/background):
 * - Auth monitoring
 * - AdMob
 * - Push notifications
 * - Quran data
 * - Duas
 * - TrackPlayer
 */
export const useAppInit = (isRehydrated: boolean): InitState => {
  const dispatch = useDispatch<AppDispatch>();

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
  const [migrationDone, setMigrationDone] = useState(false);
  const [prayerTimesDone, setPrayerTimesDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Calculate overall progress
  const calculateProgress = useCallback(() => {
    let completed = 0;
    if (migrationDone) completed += 33;
    if (fontsLoaded) completed += 33;
    if (prayerTimesDone) completed += 34;
    return completed;
  }, [migrationDone, fontsLoaded, prayerTimesDone]);

  // Update progress
  useEffect(() => {
    setProgress(calculateProgress());
  }, [calculateProgress]);

  // STEP 1: Storage Migration (runs immediately, one-time only)
  useEffect(() => {
    const runMigration = async () => {
      try {
        const alreadyMigrated = storage.getBoolean(MIGRATION_KEY);
        if (alreadyMigrated) {
          setMigrationDone(true);
          return;
        }

        console.log('🔄 Starting storage migration...');
        const start = Date.now();

        await Promise.race([
          migrateFromAsyncStorage(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Migration timeout')), 5000)
          ),
        ]);

        storage.set(MIGRATION_KEY, true);
        console.log(`✅ Migration completed in ${Date.now() - start}ms`);
        setMigrationDone(true);
      } catch (err) {
        console.warn('⚠️ Migration failed, continuing anyway:', err);
        setMigrationDone(true); // Don't block app
      }
    };

    runMigration();
  }, []);

  // STEP 2: Load Prayer Times (cache-first, after migration + rehydration)
  useEffect(() => {
    if (!migrationDone || !isRehydrated) return;

    const loadPrayerTimes = async () => {
      try {
        console.log('📱 Loading prayer times...');

        // Cache-first strategy
        const cached = storage.getString(PRAYER_CACHE_KEY);
        const timestamp = storage.getNumber(PRAYER_TIMESTAMP_KEY);
        const isCacheValid = cached && timestamp && Date.now() - timestamp < CACHE_DURATION_MS;

        if (isCacheValid) {
          console.log('✅ Using cached prayer times');
          seedPrayerTimesToWidget().catch(console.warn);
          setPrayerTimesDone(true);
          return;
        }

        // Fetch fresh data
        const dateKey = todayKeySGT();
        console.log(`🔎 Fetching fresh prayer times for ${dateKey}`);

        const prayerData = await Promise.race([
          dispatch(fetchPrayerTimesForDate(dateKey)).unwrap(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Prayer fetch timeout')), 8000)
          ),
        ]);

        // Cache fresh data
        storage.set(PRAYER_CACHE_KEY, JSON.stringify(prayerData));
        storage.set(PRAYER_TIMESTAMP_KEY, Date.now());
        seedPrayerTimesToWidget().catch(console.warn);

        console.log('✅ Prayer times loaded');
        setPrayerTimesDone(true);
      } catch (err) {
        console.error('❌ Prayer times error:', err);

        // Fallback to stale cache
        const staleCache = storage.getString(PRAYER_CACHE_KEY);
        if (staleCache) {
          console.log('⚠️ Using stale cache');
          seedPrayerTimesToWidget().catch(console.warn);
          setPrayerTimesDone(true);
          return;
        }

        // Last resort: mark done but surface error
        setError(err instanceof Error ? err : new Error('Failed to load prayer times'));
        setPrayerTimesDone(true);
      }
    };

    loadPrayerTimes();
  }, [migrationDone, isRehydrated, dispatch]);

  // Determine if app is ready
  const isReady = migrationDone && fontsLoaded && prayerTimesDone;

  return {
    isReady,
    progress,
    error: fontError || error,
  };
};