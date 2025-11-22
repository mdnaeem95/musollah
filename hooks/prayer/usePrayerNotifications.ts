import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePreferencesStore } from '../../stores/userPreferencesStore';
import { DailyPrayerTimes, validatePrayerNames } from '../../utils/types/prayer.types';
import { notificationService } from '../../services/notification.service';

/**
 * Hook for scheduling prayer notifications
 * 
 * Improvements:
 * - Uses Zustand instead of Redux
 * - Better memoization with scheduleKey
 * - Proper cleanup and re-scheduling
 */
export const usePrayerNotifications = (prayerData: DailyPrayerTimes | null) => {
  const lastScheduledRef = useRef<string | null>(null);
  
  const mutedNotifications = usePreferencesStore((state: any) => state.mutedNotifications);
  const reminderInterval = usePreferencesStore((state: any) => state.reminderInterval);
  const selectedAdhan = usePreferencesStore((state: any) => state.selectedAdhan);

  useEffect(() => {
    // Skip if no data or all notifications muted
    if (!prayerData || mutedNotifications.length === 5) return;

    // Create unique key to prevent redundant scheduling
    const mutedKey = [...mutedNotifications].sort().join(',');
    const scheduleKey = `${prayerData.date}_${reminderInterval}_${selectedAdhan}`;
    
    if (lastScheduledRef.current === scheduleKey) return;

    let mounted = true;

    const scheduleNotifications = async () => {
      if (!mounted) return;

      try {
        await notificationService.cancelAllNotifications();
        
        const validMutedPrayers = validatePrayerNames(mutedNotifications);
        
        await notificationService.schedulePrayerNotifications(
          prayerData,
          reminderInterval,
          validMutedPrayers,
          selectedAdhan
        );

        if (mounted) {
          lastScheduledRef.current = scheduleKey;
          console.log('✅ Prayer notifications scheduled');
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ Failed to schedule notifications:', error);
        }
      }
    };

    scheduleNotifications();

    // Re-schedule when app becomes active
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (mounted && nextAppState === 'active') {
        scheduleNotifications();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [prayerData?.date, mutedNotifications, reminderInterval, selectedAdhan]);
};