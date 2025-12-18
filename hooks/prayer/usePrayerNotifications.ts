import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { format } from 'date-fns';
import { usePreferencesStore } from '../../stores/userPreferencesStore';
import { DailyPrayerTimes, validatePrayerNames } from '../../utils/types/prayer.types';
import { notificationService } from '../../services/notification.service';

/**
 * Hook for scheduling prayer notifications
 * 
 * ✅ FIXED: Only schedules notifications for today or future dates
 * 
 * Improvements:
 * - Uses Zustand instead of Redux
 * - Better memoization with scheduleKey
 * - Proper cleanup and re-scheduling
 * - Skips past dates to prevent unnecessary cancellation/rescheduling
 */
export const usePrayerNotifications = (prayerData: DailyPrayerTimes | null) => {
  const lastScheduledRef = useRef<string | null>(null);
  
  const mutedNotifications = usePreferencesStore((state: any) => state.mutedNotifications);
  const reminderInterval = usePreferencesStore((state: any) => state.reminderInterval);
  const selectedAdhan = usePreferencesStore((state: any) => state.selectedAdhan);

  useEffect(() => {
    // ✅ CRITICAL: Skip if no data
    if (!prayerData) {
      console.log('⏭️ No prayer data, skipping notifications');
      return;
    }

    // ✅ CRITICAL: Only schedule notifications for today or future dates
    const today = format(new Date(), 'yyyy-MM-dd');
    const selectedDate = prayerData.date;
    
    if (selectedDate < today) {
      console.log(`⏭️ Skipping notification scheduling for past date: ${selectedDate}`);
      return; // Don't schedule notifications for past dates
    }

    console.log(`📅 Current date is ${selectedDate}, scheduling notifications...`);

    // Skip if all notifications muted
    if (mutedNotifications.length === 5) {
      console.log('🔇 All notifications muted, skipping');
      return;
    }

    // Create unique key to prevent redundant scheduling
    const scheduleKey = `${prayerData.date}_${reminderInterval}_${selectedAdhan}_${mutedNotifications.sort().join(',')}`;
    
    if (lastScheduledRef.current === scheduleKey) {
      console.log('✅ Notifications already scheduled with same config');
      return;
    }

    let mounted = true;

    const scheduleNotifications = async () => {
      if (!mounted) return;

      try {
        console.log('🗑️ Cancelling all existing notifications...');
        await notificationService.cancelAllNotifications();
        
        const validMutedPrayers = validatePrayerNames(mutedNotifications);
        
        console.log('📅 Scheduling notifications for next 5 days');
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

    // ✅ Re-schedule when app becomes active (only for current/future dates)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (mounted && nextAppState === 'active') {
        // Re-check date in case day changed while app was in background
        const currentToday = format(new Date(), 'yyyy-MM-dd');
        if (prayerData.date >= currentToday) {
          console.log('📱 App resumed, re-scheduling notifications');
          scheduleNotifications();
        } else {
          console.log('⏭️ App resumed but viewing past date, skipping notification update');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [prayerData?.date, mutedNotifications, reminderInterval, selectedAdhan]);
};