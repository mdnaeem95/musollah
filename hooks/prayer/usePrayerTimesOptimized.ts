import { useEffect, useMemo, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { NormalizedPrayerTimes, LocalPrayerName } from '../../api/services/prayer/types/index';
import { getCurrentPrayer, getNextPrayer, isWithinPrayerTimeWindow } from '../../api/services/prayer/utils/prayer';
import { PRAYER_BACKGROUNDS, type ThemeColor } from '../../constants/prayer.constants';
import { logger } from '../../services/logging/logger';

interface PrayerTimeInfo {
  currentPrayer: LocalPrayerName | null;
  nextPrayerInfo: {
    prayer: LocalPrayerName;
    time: string;
    timeUntil: string;
    minutesUntil: number;
  } | null;
  backgroundImage: any;
  isPrayerTime: boolean;
}

/**
 * Hook for calculating current prayer status
 */
export const usePrayerTimesOptimized = (
  prayers: NormalizedPrayerTimes | null
): PrayerTimeInfo => {
  const { currentTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const updateTime = useCallback(() => {
    setCurrentTime(new Date());
  }, []);

  const prayerInfo = useMemo<PrayerTimeInfo>(() => {
    if (!prayers) {
      return {
        currentPrayer: null,
        nextPrayerInfo: null,
        backgroundImage: PRAYER_BACKGROUNDS.Subuh.green,
        isPrayerTime: false,
      };
    }

    const currentPrayer = getCurrentPrayer(prayers);
    const nextPrayerInfo = getNextPrayer(prayers);
    const isPrayerTime = currentPrayer ? isWithinPrayerTimeWindow(prayers, currentPrayer) : false;

    // Validate theme color
    const themeColor: ThemeColor = 
      (currentTheme === 'green' || currentTheme === 'blue' || currentTheme === 'purple')
        ? currentTheme
        : 'green';

    // Get background with fallback chain
    let backgroundImage;
    
    if (currentPrayer && PRAYER_BACKGROUNDS[currentPrayer]) {
      // Active prayer: use its background
      backgroundImage = PRAYER_BACKGROUNDS[currentPrayer][themeColor] || PRAYER_BACKGROUNDS[currentPrayer].green;
      logger.info('Background selected:', {
        prayer: currentPrayer,
        theme: themeColor,
        hasThemeBackground: !!PRAYER_BACKGROUNDS[currentPrayer][themeColor],
      });
    } else if (!currentPrayer) {
      // Between prayers: find most recent prayer (skip Syuruk)
      const now = new Date();
      const prayerOrder: LocalPrayerName[] = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
      
      // Parse prayer times and find which have passed
      const passedPrayers = prayerOrder.filter(prayer => {
        const prayerTimeStr = prayers[prayer.toLowerCase() as keyof NormalizedPrayerTimes];
        const [hours, minutes] = prayerTimeStr.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);
        return now >= prayerTime;
      });
      
      // Use the most recent prayer's background, or Isyak if before Subuh
      const mostRecentPrayer = passedPrayers.length > 0 
        ? passedPrayers[passedPrayers.length - 1]
        : 'Isyak'; // Before Subuh = still Isyak period
      
      backgroundImage = PRAYER_BACKGROUNDS[mostRecentPrayer][themeColor] || PRAYER_BACKGROUNDS[mostRecentPrayer].green;
      
      logger.info('Between prayers - using most recent prayer background:', {
        mostRecentPrayer,
        theme: themeColor,
        currentTime: now.toLocaleTimeString('en-SG'),
      });
    } else {
      // Fallback (shouldn't happen)
      backgroundImage = PRAYER_BACKGROUNDS.Subuh.green;
      logger.warn('Using fallback background', {
        currentPrayer,
        reason: 'Prayer not found in PRAYER_BACKGROUNDS',
      });
    }

    // Structured debug logging
    logger.info('Prayer time calculation:', {
      currentTime: currentTime.toLocaleTimeString('en-SG'),
      currentPrayer,
      nextPrayer: nextPrayerInfo?.prayer,
      timeUntilNext: nextPrayerInfo?.timeUntil,
      isPrayerTime,
      theme: themeColor,
      prayerTimes: {
        Subuh: prayers.subuh,
        Syuruk: prayers.syuruk,
        Zohor: prayers.zohor,
        Asar: prayers.asar,
        Maghrib: prayers.maghrib,
        Isyak: prayers.isyak,
      },
    });

    return {
      currentPrayer,
      nextPrayerInfo,
      backgroundImage,
      isPrayerTime,
    };
  }, [prayers, currentTime, currentTheme]);

  useEffect(() => {
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [updateTime]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateTime();
        logger.info('App became active, updating prayer time');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [updateTime]);

  return prayerInfo;
};