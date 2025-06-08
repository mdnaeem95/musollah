import { useEffect, useMemo, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { differenceInMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { PrayerName } from '../utils/types/prayer.types';
import { PRAYER_BACKGROUNDS, LOGGABLE_PRAYERS, ThemeColor } from '../constants/prayer.constants';

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

export const usePrayerTimes = (
  prayers: Record<PrayerName, string> | null
): PrayerTimeInfo => {
  const { isDarkMode, currentTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    
    intervalRef.current = setInterval(updateTime, 60000); // Update every minute
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateTime();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, []);

  const prayerInfo = useMemo(() => {
    if (!prayers) {
      return {
        currentPrayer: PrayerName.SUBUH,
        nextPrayerInfo: null,
        backgroundImage: PRAYER_BACKGROUNDS[PrayerName.SUBUH][currentTheme as ThemeColor] || PRAYER_BACKGROUNDS[PrayerName.SUBUH].green,
        isPrayerTime: false,
      };
    }

    const now = currentTime;
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Parse prayer times
    const prayerTimesList = LOGGABLE_PRAYERS.map(name => {
      const timeStr = prayers[name];
      if (!timeStr) return null;

      const [hours, minutes] = timeStr.split(':').map(Number);
      const prayerTime = new Date(now);
      prayerTime.setHours(hours, minutes, 0, 0);

      return { name, time: prayerTime };
    }).filter(Boolean) as Array<{ name: PrayerName; time: Date }>;

    // Find current prayer
    let currentPrayer = PrayerName.ISYAK; // Default to Isyak (after last prayer)
    let nextPrayer: PrayerName | null = null;
    let nextPrayerTime: Date | null = null;

    for (let i = 0; i < prayerTimesList.length; i++) {
      const current = prayerTimesList[i];
      const next = prayerTimesList[i + 1];

      if (isBefore(now, current.time)) {
        // Before first prayer
        if (i === 0) {
          currentPrayer = PrayerName.ISYAK; // Still in previous day's Isyak
          nextPrayer = current.name;
          nextPrayerTime = current.time;
        }
        break;
      } else if (next && isAfter(now, current.time) && isBefore(now, next.time)) {
        // Between two prayers
        currentPrayer = current.name;
        nextPrayer = next.name;
        nextPrayerTime = next.time;
        break;
      } else if (i === prayerTimesList.length - 1 && isAfter(now, current.time)) {
        // After last prayer
        currentPrayer = current.name;
        // Next prayer is tomorrow's Subuh
        const tomorrowSubuh = new Date(now);
        tomorrowSubuh.setDate(tomorrowSubuh.getDate() + 1);
        const [hours, minutes] = prayers[PrayerName.SUBUH].split(':').map(Number);
        tomorrowSubuh.setHours(hours, minutes, 0, 0);
        nextPrayer = PrayerName.SUBUH;
        nextPrayerTime = tomorrowSubuh;
        break;
      }
    }

    // Calculate time until next prayer
    let nextPrayerInfo = null;
    if (nextPrayer && nextPrayerTime) {
      const minutesRemaining = differenceInMinutes(nextPrayerTime, now);
      const hours = Math.floor(minutesRemaining / 60);
      const minutes = minutesRemaining % 60;
      
      const timeUntilNextPrayer = hours > 0 
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

      nextPrayerInfo = {
        nextPrayer,
        timeUntilNextPrayer,
        minutesRemaining,
      };
    }

    // Check if it's prayer time (within 15 minutes of adhan)
    const isPrayerTime = prayerTimesList.some(({ time }) => {
      const diff = Math.abs(differenceInMinutes(now, time));
      return diff <= 15;
    });

    // Get background image - handle SYURUK case by using SUBUH background
    const themeColor = (currentTheme as ThemeColor) || 'green';
    const backgroundImage = PRAYER_BACKGROUNDS[currentPrayer]?.[themeColor] || PRAYER_BACKGROUNDS[PrayerName.SUBUH].green;

    return {
      currentPrayer,
      nextPrayerInfo,
      backgroundImage,
      isPrayerTime,
    };
  }, [prayers, currentTime, isDarkMode]);

  return prayerInfo;
};
