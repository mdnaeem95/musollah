import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { format } from 'date-fns';
import { usePreferencesStore } from '../../stores/userPreferencesStore';
import { NormalizedPrayerTimes, LoggablePrayerName } from '../../api/services/prayer/types/index';
import { prayerNotificationService } from '../../services/notifications/prayerNotificationService';

/**
 * Hook for scheduling prayer notifications
 * Updated to use new prayer types
 */
export const usePrayerNotifications = (prayerData: NormalizedPrayerTimes | null) => {
  const lastScheduledRef = useRef<string | null>(null);
  
  const mutedNotifications = usePreferencesStore((state) => state.mutedNotifications);
  const reminderInterval = usePreferencesStore((state) => state.reminderInterval);
  const selectedAdhan = usePreferencesStore((state) => state.selectedAdhan);

  useEffect(() => {
    if (!prayerData) {
      console.log('⏭️ No prayer data, skipping notifications');
      return;
    }

    // Only schedule for today or future
    const today = format(new Date(), 'yyyy-MM-dd');
    const selectedDate = prayerData.date;
    
    if (selectedDate < today) {
      console.log(`⏭️ Skipping notification for past date: ${selectedDate}`);
      return;
    }

    console.log(`📅 Scheduling notifications for ${selectedDate}`);

    // Skip if all muted
    if (mutedNotifications.length === 5) {
      console.log('🔇 All notifications muted');
      return;
    }

    // Create unique key
    const scheduleKey = `${prayerData.date}_${reminderInterval}_${selectedAdhan}_${mutedNotifications.sort().join(',')}`;
    
    if (lastScheduledRef.current === scheduleKey) {
      console.log('✅ Notifications already scheduled');
      return;
    }

    let mounted = true;

    const scheduleNotifications = async () => {
      if (!mounted) return;

      try {
        console.log('🗑️ Cancelling existing notifications...');
        await prayerNotificationService.cancelAllNotifications();
        
        // Validate muted prayers
        const validMutedPrayers = mutedNotifications.filter(
          (name): name is LoggablePrayerName => 
            ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'].includes(name)
        );
        
        // ✅ Transform NormalizedPrayerTimes to format notification service expects
        const prayerTimesForNotification = {
          date: prayerData.date,
          hijriDate: undefined,
          prayers: {
            Subuh: prayerData.subuh,
            Syuruk: prayerData.syuruk,
            Zohor: prayerData.zohor,
            Asar: prayerData.asar,
            Maghrib: prayerData.maghrib,
            Isyak: prayerData.isyak,
          }
        };
        
        console.log('📅 Scheduling notifications for next 5 days');
        await prayerNotificationService.schedulePrayerNotifications(
          prayerTimesForNotification as any, // ✅ Cast to avoid type conflict
          reminderInterval,
          validMutedPrayers as any,
          selectedAdhan
        );

        if (mounted) {
          lastScheduledRef.current = scheduleKey;
          console.log('✅ Notifications scheduled');
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ Failed to schedule notifications:', error);
        }
      }
    };

    scheduleNotifications();

    // Re-schedule on app foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (mounted && nextAppState === 'active') {
        const currentToday = format(new Date(), 'yyyy-MM-dd');
        if (prayerData.date >= currentToday) {
          console.log('📱 App resumed, re-scheduling');
          scheduleNotifications();
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