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
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const prayerReminders = usePreferencesStore((state) => state.prayerReminders);
  const silentPrayers = usePreferencesStore((state) => state.silentPrayers);
  const quietHoursEnabled = usePreferencesStore((state) => state.quietHoursEnabled);
  const quietStartMinutes = usePreferencesStore((state) => state.quietStartMinutes);
  const quietEndMinutes = usePreferencesStore((state) => state.quietEndMinutes);

  useEffect(() => {
    if (!prayerData) {
      logger.debug('No prayer data, skipping notifications');
      return;
    }

    // Master switch off: clear everything and don't schedule.
    if (!notificationsEnabled) {
      logger.info('Notifications disabled by master toggle; cancelling all');
      lastScheduledRef.current = null;
      prayerNotificationService.cancelAllNotifications().catch((e) =>
        logger.error('Failed to cancel notifications', e as Error)
      );
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

    // Create unique key — include every input that affects scheduling so changes
    // trigger a reschedule.
    const quietKey = quietHoursEnabled ? `${quietStartMinutes}-${quietEndMinutes}` : 'off';
    const remindersKey = Object.entries(prayerReminders)
      .sort()
      .map(([p, m]) => `${p}:${m}`)
      .join(',');
    const scheduleKey = `${prayerData.date}_${reminderInterval}_${selectedAdhan}_${mutedNotifications
      .slice()
      .sort()
      .join(',')}_${remindersKey}_${silentPrayers.slice().sort().join(',')}_${quietKey}`;
    
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
        // prayerData is already NormalizedPrayerTimes (lowercase keys).
        await prayerNotificationService.schedulePrayerNotifications(prayerData, {
          reminderMinutes: reminderInterval,
          mutedPrayers: validMutedPrayers as any,
          selectedAdhan,
          prayerReminders,
          silentPrayers,
          quietHours: {
            enabled: quietHoursEnabled,
            startMinutes: quietStartMinutes,
            endMinutes: quietEndMinutes,
          },
        });

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
  }, [
    prayerData?.date,
    mutedNotifications,
    reminderInterval,
    selectedAdhan,
    notificationsEnabled,
    prayerReminders,
    silentPrayers,
    quietHoursEnabled,
    quietStartMinutes,
    quietEndMinutes,
  ]);
};