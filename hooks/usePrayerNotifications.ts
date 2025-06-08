import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AppState, AppStateStatus } from 'react-native';
import { RootState } from '../redux/store/store';
import { DailyPrayerTimes, validatePrayerNames } from '../utils/types/prayer.types';
import { notificationService } from '../services/notification.service';

export const usePrayerNotifications = (prayerData: DailyPrayerTimes | null) => {
  const lastScheduledRef = useRef<string | null>(null);
  const { mutedNotifications, reminderInterval, selectedAdhan } = useSelector(
    (state: RootState) => state.userPreferences
  );

  useEffect(() => {
    if (!prayerData || mutedNotifications.length === 5) return;

    const scheduleKey = `${prayerData.date}_${reminderInterval}_${selectedAdhan}`;
    
    // Avoid re-scheduling if nothing changed
    if (lastScheduledRef.current === scheduleKey) return;

    const scheduleNotifications = async () => {
      try {
        await notificationService.cancelAllNotifications();
        
        // Validate and convert string[] to PrayerName[]
        const validMutedPrayers = validatePrayerNames(mutedNotifications);
        
        await notificationService.schedulePrayerNotifications(
          prayerData,
          reminderInterval,
          validMutedPrayers,
          selectedAdhan
        );

        lastScheduledRef.current = scheduleKey;
      } catch (error) {
        console.error('Failed to schedule notifications:', error);
      }
    };

    scheduleNotifications();

    // Re-schedule when app becomes active
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        scheduleNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [prayerData, mutedNotifications, reminderInterval, selectedAdhan]);
};