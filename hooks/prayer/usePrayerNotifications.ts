import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { format } from 'date-fns';
import { usePreferencesStore } from '../../stores/userPreferencesStore';
import { NormalizedPrayerTimes, LoggablePrayerName } from '../../api/services/prayer/types/index';
import { prayerNotificationService } from '../../services/notifications/prayerNotificationService';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Prayer Notifications');

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
      logger.debug('No prayer data, skipping notifications');
      return;
    }

    // Only schedule for today or future
    const today = format(new Date(), 'yyyy-MM-dd');
    const selectedDate = prayerData.date;
    
    if (selectedDate < today) {
      logger.debug(`Skipping notification for past date: ${selectedDate}`);
      return;
    }

    logger.info(`Scheduling notifications for ${selectedDate}`);

    // Skip if all muted
    if (mutedNotifications.length === 5) {
      logger.debug('All notifications muted');
      return;
    }

    // Create unique key
    const scheduleKey = `${prayerData.date}_${reminderInterval}_${selectedAdhan}_${mutedNotifications.sort().join(',')}`;
    
    if (lastScheduledRef.current === scheduleKey) {
      logger.debug('Notifications already scheduled');
      return;
    }

    // ✅ FIX: Set ref IMMEDIATELY to prevent race condition
    // This prevents duplicate calls if hook runs twice before async completes
    lastScheduledRef.current = scheduleKey;
    logger.debug('Locked scheduling with key', { scheduleKey });

    let mounted = true;

    const scheduleNotifications = async () => {
      if (!mounted) {
        logger.debug('Component unmounted, skipping schedule');
        return;
      }

      try {
        logger.debug('Cancelling existing notifications...');
        await prayerNotificationService.cancelAllNotifications();
        
        // Validate muted prayers
        const validMutedPrayers = mutedNotifications.filter(
          (name): name is LoggablePrayerName => 
            ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'].includes(name)
        );
        
        logger.info('Scheduling notifications for next 5 days');
        // ✅ prayerData is already in NormalizedPrayerTimes format (lowercase keys)
        await prayerNotificationService.schedulePrayerNotifications(
          prayerData, // ✅ Pass directly - already has lowercase keys (subuh, zohor, etc.)
          reminderInterval,
          validMutedPrayers as any,
          selectedAdhan
        );

        if (mounted) {
          logger.success('Notifications scheduled successfully');
        }
      } catch (error) {
        // ✅ Reset ref on error so retry is possible
        lastScheduledRef.current = null;
        
        if (mounted) {
          logger.error('Failed to schedule notifications', error as Error);
        }
      }
    };

    scheduleNotifications();

    // Re-schedule on app foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (mounted && nextAppState === 'active') {
        const currentToday = format(new Date(), 'yyyy-MM-dd');
        if (prayerData.date >= currentToday) {
          logger.info('App resumed, re-scheduling');
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