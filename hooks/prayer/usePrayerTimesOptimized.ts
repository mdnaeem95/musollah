import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { differenceInMinutes, isAfter, isBefore, startOfMinute } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { PrayerName } from '../../utils/types/prayer.types';
import { PRAYER_BACKGROUNDS, LOGGABLE_PRAYERS, ThemeColor } from '../../constants/prayer.constants';

interface PrayerTimeInfo {
  currentPrayer: PrayerName;
  nextPrayerInfo: {
    nextPrayer: PrayerName;
    timeUntilNextPrayer: string;
    minutesRemaining: number;
  } | null;
  backgroundImage: any;
  isPrayerTime: boolean;
}

interface PrayerTimeEntry {
  name: PrayerName;
  time: Date;
}

/**
 * Optimized hook for calculating prayer times and current status
 * 
 * Improvements over original:
 * - Better interval cleanup
 * - Memoized prayer time parsing
 * - Extracted logic into smaller functions
 * - Better TypeScript types
 * - Performance optimizations
 */
export const usePrayerTimesOptimized = (
  prayers: Record<PrayerName, string> | null
): PrayerTimeInfo => {
  const { isDarkMode, currentTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(() => startOfMinute(new Date()));
  const intervalRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef(AppState.currentState);

  /**
   * Update current time (rounded to minute for consistency)
   */
  const updateTime = useCallback(() => {
    setCurrentTime(startOfMinute(new Date()));
  }, []);

  /**
   * Parse prayer times into Date objects
   * Memoized to avoid recalculation on every render
   */
  const prayerTimesList = useMemo<PrayerTimeEntry[]>(() => {
    if (!prayers) return [];

    const now = new Date();
    
    return LOGGABLE_PRAYERS.map(name => {
      const timeStr = prayers[name];
      if (!timeStr) return null;

      const [hours, minutes] = timeStr.split(':').map(Number);
      const prayerTime = new Date(now);
      prayerTime.setHours(hours, minutes, 0, 0);

      return { name, time: prayerTime };
    }).filter(Boolean) as PrayerTimeEntry[];
  }, [prayers]);

  /**
   * Calculate current prayer period
   */
  const calculateCurrentPrayer = useCallback((
    now: Date,
    times: PrayerTimeEntry[]
  ): PrayerName => {
    if (times.length === 0) return PrayerName.ISYAK;

    // Before first prayer -> previous day's Isyak
    if (isBefore(now, times[0].time)) {
      return PrayerName.ISYAK;
    }

    // Between prayers
    for (let i = 0; i < times.length - 1; i++) {
      if (isAfter(now, times[i].time) && isBefore(now, times[i + 1].time)) {
        return times[i].name;
      }
    }

    // After last prayer
    return times[times.length - 1].name;
  }, []);

  /**
   * Calculate next prayer info
   */
  const calculateNextPrayerInfo = useCallback((
    now: Date,
    times: PrayerTimeEntry[],
    currentPrayer: PrayerName
  ) => {
    if (times.length === 0 || !prayers) return null;

    let nextPrayer: PrayerName | null = null;
    let nextPrayerTime: Date | null = null;

    // Find next prayer
    for (const entry of times) {
      if (isAfter(entry.time, now)) {
        nextPrayer = entry.name;
        nextPrayerTime = entry.time;
        break;
      }
    }

    // If no prayer found today, next is tomorrow's Subuh
    if (!nextPrayer && prayers[PrayerName.SUBUH]) {
      const [hours, minutes] = prayers[PrayerName.SUBUH].split(':').map(Number);
      const tomorrowSubuh = new Date(now);
      tomorrowSubuh.setDate(tomorrowSubuh.getDate() + 1);
      tomorrowSubuh.setHours(hours, minutes, 0, 0);
      
      nextPrayer = PrayerName.SUBUH;
      nextPrayerTime = tomorrowSubuh;
    }

    if (!nextPrayer || !nextPrayerTime) return null;

    // Calculate time remaining
    const minutesRemaining = differenceInMinutes(nextPrayerTime, now);
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    
    const timeUntilNextPrayer = hours > 0 
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

    return {
      nextPrayer,
      timeUntilNextPrayer,
      minutesRemaining,
    };
  }, [prayers]);

  /**
   * Check if currently within prayer time window (±15 minutes)
   */
  const checkIsPrayerTime = useCallback((
    now: Date,
    times: PrayerTimeEntry[]
  ): boolean => {
    return times.some(({ time }) => {
      const diff = Math.abs(differenceInMinutes(now, time));
      return diff <= 15;
    });
  }, []);

  /**
   * Get background image for current prayer
   */
  const getBackgroundImage = useCallback((prayer: PrayerName): any => {
    const themeColor = (currentTheme as ThemeColor) || 'green';
    return PRAYER_BACKGROUNDS[prayer]?.[themeColor] || 
           PRAYER_BACKGROUNDS[PrayerName.SUBUH].green;
  }, [currentTheme]);

  /**
   * Main computation - calculate all prayer info
   */
  const prayerInfo = useMemo<PrayerTimeInfo>(() => {
    // Default state when no prayer data
    if (!prayers || prayerTimesList.length === 0) {
      return {
        currentPrayer: PrayerName.SUBUH,
        nextPrayerInfo: null,
        backgroundImage: getBackgroundImage(PrayerName.SUBUH),
        isPrayerTime: false,
      };
    }

    const currentPrayer = calculateCurrentPrayer(currentTime, prayerTimesList);
    const nextPrayerInfo = calculateNextPrayerInfo(currentTime, prayerTimesList, currentPrayer);
    const isPrayerTime = checkIsPrayerTime(currentTime, prayerTimesList);
    const backgroundImage = getBackgroundImage(currentPrayer);

    return {
      currentPrayer,
      nextPrayerInfo,
      backgroundImage,
      isPrayerTime,
    };
  }, [
    prayers,
    prayerTimesList,
    currentTime,
    calculateCurrentPrayer,
    calculateNextPrayerInfo,
    checkIsPrayerTime,
    getBackgroundImage,
  ]);

  /**
   * Set up time update interval
   */
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update every minute
    intervalRef.current = setInterval(updateTime, 60000);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateTime]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Update time when app comes to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        updateTime();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [updateTime]);

  return prayerInfo;
};