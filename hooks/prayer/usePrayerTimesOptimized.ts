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
      backgroundImage = PRAYER_BACKGROUNDS[currentPrayer][themeColor] || PRAYER_BACKGROUNDS[currentPrayer].green;
      logger.info('Background selected:', {
        prayer: currentPrayer,
        theme: themeColor,
        hasThemeBackground: !!PRAYER_BACKGROUNDS[currentPrayer][themeColor],
      });
    } else {
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