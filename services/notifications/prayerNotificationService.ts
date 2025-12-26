/**
 * Prayer Notification Service
 * 
 * ✅ REFACTORED: Using structured logging system
 * ✅ IMPROVED: Added performance timers, better error context, detailed scheduling logs
 * 
 * Schedules prayer time notifications with:
 * - 5-day lookahead scheduling
 * - Reminder + Adhan notifications
 * - Firebase (MUIS official) + Aladhan (fallback)
 * - Smart rescheduling (only when needed)
 * - Per-prayer muting support
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, format, startOfDay } from 'date-fns';
import { defaultStorage } from '../../api/client/storage';
import { fetchPrayerTimesByDateFromAladhan } from '../../api/services/prayer/api/aladhan';
import { fetchDailyPrayerTimeFromFirebase } from '../../api/services/prayer/api/firebase';
import { normalizeAladhanResponse, normalizeFirebaseTime } from '../../api/services/prayer/api/transformers';
import type { NormalizedPrayerTimes, LocalPrayerName } from '../../api/services/prayer/types';
import { LOGGABLE_PRAYERS } from '../../api/services/prayer/';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Prayer Notifications');

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledNotification {
  id: string;
  prayerName: LocalPrayerName;
  type: 'reminder' | 'adhan';
  scheduledFor: Date;
  date: string;
}

interface NotificationMetadata {
  lastScheduledDate: string;
  scheduledDates: string[];
  scheduledCount: number;
  lastUpdated: number;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Internal helper: Fetch prayer times for a specific date
 * 
 * **Priority: Firebase (MUIS official) → Aladhan (fallback)**
 */
async function fetchPrayerTimesForDate(
  latitude: number,
  longitude: number,
  date: Date
): Promise<NormalizedPrayerTimes> {
  logger.time('fetch-prayer-times');
  const isoDate = format(date, 'yyyy-MM-dd');
  
  logger.debug('Fetching prayer times for date', {
    date: isoDate,
    latitude,
    longitude,
  });
  
  // Try Firebase FIRST (MUIS official timings)
  try {
    logger.debug('Attempting Firebase (MUIS official)...', { date: isoDate });
    const firebaseData = await fetchDailyPrayerTimeFromFirebase(isoDate);
    
    if (firebaseData) {
      const normalized = normalizeFirebaseTime(firebaseData);
      logger.success('Using Firebase (MUIS official)', {
        date: isoDate,
        source: 'firebase',
        prayers: Object.keys(normalized),
      });
      logger.timeEnd('fetch-prayer-times');
      return normalized;
    }
  } catch (error) {
    logger.warn('Firebase failed, using Aladhan fallback', {
      date: isoDate,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  
  // Fallback to Aladhan ONLY if Firebase unavailable
  try {
    logger.debug('Using Aladhan API (fallback)...', { date: isoDate });
    const aladhanData = await fetchPrayerTimesByDateFromAladhan(latitude, longitude, date);
    const normalized = normalizeAladhanResponse(aladhanData);
    
    logger.success('Using Aladhan (fallback)', {
      date: isoDate,
      source: 'aladhan',
      prayers: Object.keys(normalized),
    });
    logger.timeEnd('fetch-prayer-times');
    return normalized;
  } catch (error) {
    logger.error('All prayer time sources failed', error as Error, {
      date: isoDate,
      latitude,
      longitude,
    });
    logger.timeEnd('fetch-prayer-times');
    throw error;
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class PrayerNotificationService {
  private readonly NOTIFICATION_STORAGE_KEY = 'scheduled_notifications';
  private readonly METADATA_STORAGE_KEY = 'notification_metadata';
  private readonly DAYS_TO_SCHEDULE = 5;
  
  constructor() {
    logger.info('Initializing Prayer Notification Service');
    this.initialize();
  }

  /**
   * Initialize notification handler and request permissions
   */
  private async initialize() {
    try {
      logger.debug('Setting up notification handler...');
      
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: false
        }),
      });

      logger.debug('Notification handler configured');
      await this.requestPermissions();
      
      logger.success('Prayer Notification Service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service', error as Error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    logger.time('request-permissions');
    
    try {
      // Step 1: Check existing permissions
      logger.debug('Checking existing notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      logger.debug('Existing permission status', { status: existingStatus });
      
      // Step 2: Request if not granted
      if (existingStatus !== 'granted') {
        logger.debug('Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        logger.info('Permission request result', { status });
      }
      
      // Step 3: Check final status
      if (finalStatus !== 'granted') {
        logger.warn('Notification permissions not granted', { finalStatus });
        logger.timeEnd('request-permissions');
        return false;
      }

      // Step 4: Setup Android notification channel
      if (Platform.OS === 'android') {
        logger.debug('Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync('prayer', {
          name: 'Prayer Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#BFE1DB',
          sound: 'default',
          bypassDnd: false,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          showBadge: true,
        });
        logger.debug('Android notification channel created');
      }

      logger.success('Notification permissions granted', {
        platform: Platform.OS,
        hasChannel: Platform.OS === 'android',
      });
      logger.timeEnd('request-permissions');
      return true;
    } catch (error) {
      logger.error('Error requesting notification permissions', error as Error, {
        platform: Platform.OS,
      });
      logger.timeEnd('request-permissions');
      return false;
    }
  }

  /**
   * Check if notifications are already scheduled for upcoming days
   */
  private hasExistingNotifications(): boolean {
    logger.debug('Checking for existing scheduled notifications...');
    
    const metadata = this.getMetadata();
    if (!metadata) {
      logger.debug('No metadata found, scheduling needed');
      return false;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const scheduledDates = metadata.scheduledDates || [];
    
    // Check if we have at least 3 future days scheduled
    const futureDates = scheduledDates.filter(date => date >= today);
    const hasEnoughScheduled = futureDates.length >= 3;

    logger.info('Existing notifications check', {
      totalScheduled: scheduledDates.length,
      futureDates: futureDates.length,
      hasEnough: hasEnoughScheduled,
      dates: futureDates,
      lastScheduled: metadata.lastScheduledDate,
      totalCount: metadata.scheduledCount,
    });

    return hasEnoughScheduled;
  }

  /**
   * Schedule prayer notifications for the next 5 days
   * 
   * @param prayerData - Today's prayer times (already normalized)
   * @param reminderMinutes - Minutes before prayer to send reminder
   * @param mutedPrayers - Prayers to skip notifications for
   * @param selectedAdhan - Adhan sound to use
   * @param userLocation - User's location for fetching future prayer times
   */
  async schedulePrayerNotifications(
    prayerData: NormalizedPrayerTimes,
    reminderMinutes: number,
    mutedPrayers: LocalPrayerName[],
    selectedAdhan: string,
    userLocation?: LocationCoords
  ): Promise<void> {
    logger.time('schedule-notifications');
    logger.info('Starting notification scheduling', {
      daysToSchedule: this.DAYS_TO_SCHEDULE,
      reminderMinutes,
      mutedCount: mutedPrayers.length,
      mutedPrayers,
      selectedAdhan,
      hasLocation: !!userLocation,
    });

    try {
      // Step 1: Check if already scheduled
      if (this.hasExistingNotifications()) {
        logger.success('Notifications already scheduled, skipping');
        logger.timeEnd('schedule-notifications');
        return;
      }

      // Step 2: Check permissions
      logger.debug('Verifying notification permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        logger.warn('No notification permissions, skipping scheduling');
        logger.timeEnd('schedule-notifications');
        return;
      }

      // Step 3: Cancel existing notifications
      logger.debug('Cancelling existing notifications...');
      await this.cancelAllNotifications();

      const scheduledNotifications: ScheduledNotification[] = [];
      const scheduledDates: string[] = [];

      // Default to Singapore coordinates if location not provided
      const location = userLocation || {
        latitude: 1.3521,
        longitude: 103.8198
      };

      if (!userLocation) {
        logger.warn('No user location provided, using default Singapore coordinates', {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }

      logger.info(`Scheduling notifications for ${this.DAYS_TO_SCHEDULE} days`, {
        startDate: format(new Date(), 'yyyy-MM-dd'),
        location,
      });

      // Step 4: Schedule for each day
      for (let i = 0; i < this.DAYS_TO_SCHEDULE; i++) {
        const targetDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(targetDate, 'yyyy-MM-dd');

        try {
          logger.debug(`Processing day ${i + 1}/${this.DAYS_TO_SCHEDULE}`, {
            date: dateStr,
            isToday: i === 0,
          });

          let dayPrayerData: NormalizedPrayerTimes;

          if (i === 0) {
            // Use today's data (already provided)
            dayPrayerData = prayerData;
            logger.debug('Using provided prayer data for today');
          } else {
            // Fetch future days
            logger.debug(`Fetching prayer times for future date`, { date: dateStr });
            dayPrayerData = await fetchPrayerTimesForDate(
              location.latitude,
              location.longitude,
              targetDate
            );
          }

          // Schedule notifications for this day
          const dayNotifications = await this.scheduleDayNotifications(
            dayPrayerData,
            reminderMinutes,
            mutedPrayers,
            selectedAdhan,
            dateStr
          );

          scheduledNotifications.push(...dayNotifications);
          scheduledDates.push(dateStr);

          logger.success(`Scheduled notifications for ${dateStr}`, {
            date: dateStr,
            dayNumber: i + 1,
            notificationCount: dayNotifications.length,
            reminderCount: dayNotifications.filter(n => n.type === 'reminder').length,
            adhanCount: dayNotifications.filter(n => n.type === 'adhan').length,
          });
        } catch (error) {
          logger.error(`Failed to schedule notifications for ${dateStr}`, error as Error, {
            date: dateStr,
            dayNumber: i + 1,
          });
        }
      }

      // Step 5: Save metadata
      const metadata: NotificationMetadata = {
        lastScheduledDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledDates,
        scheduledCount: scheduledNotifications.length,
        lastUpdated: Date.now(),
      };

      logger.debug('Saving notification metadata...', {
        totalNotifications: scheduledNotifications.length,
        daysScheduled: scheduledDates.length,
      });

      this.saveScheduledNotifications(scheduledNotifications);
      this.saveMetadata(metadata);
      
      logger.success('Notification scheduling complete', {
        totalNotifications: scheduledNotifications.length,
        daysScheduled: scheduledDates.length,
        dates: scheduledDates,
        reminderCount: scheduledNotifications.filter(n => n.type === 'reminder').length,
        adhanCount: scheduledNotifications.filter(n => n.type === 'adhan').length,
      });
      logger.timeEnd('schedule-notifications');
    } catch (error) {
      logger.error('Error scheduling notifications', error as Error, {
        reminderMinutes,
        mutedCount: mutedPrayers.length,
        selectedAdhan,
      });
      logger.timeEnd('schedule-notifications');
      throw error;
    }
  }

  /**
   * Schedule notifications for a single day
   */
  private async scheduleDayNotifications(
    prayerData: NormalizedPrayerTimes,
    reminderMinutes: number,
    mutedPrayers: LocalPrayerName[],
    selectedAdhan: string,
    dateStr: string
  ): Promise<ScheduledNotification[]> {
    logger.debug(`Scheduling day notifications`, {
      date: dateStr,
      prayers: LOGGABLE_PRAYERS.length,
      reminderMinutes,
      mutedCount: mutedPrayers.length,
    });

    const scheduledNotifications: ScheduledNotification[] = [];
    const now = new Date();
    let skippedCount = 0;

    for (const prayerName of LOGGABLE_PRAYERS) {
      // Skip muted prayers
      if (mutedPrayers.includes(prayerName)) {
        logger.debug(`Skipping muted prayer`, { prayer: prayerName, date: dateStr });
        skippedCount++;
        continue;
      }

      // Get prayer time (lowercase property names)
      const prayerTimeStr = prayerData[prayerName.toLowerCase() as keyof NormalizedPrayerTimes];
      if (!prayerTimeStr) {
        logger.warn(`Prayer time not found`, { prayer: prayerName, date: dateStr });
        continue;
      }

      // Parse prayer time
      const [hours, minutes] = prayerTimeStr.split(':').map(Number);
      const prayerTime = new Date(dateStr);
      prayerTime.setHours(hours, minutes, 0, 0);

      // Skip if prayer time has passed
      if (prayerTime <= now) {
        logger.debug(`Prayer time has passed, skipping`, {
          prayer: prayerName,
          time: prayerTimeStr,
          date: dateStr,
        });
        continue;
      }

      logger.debug(`Scheduling notifications for prayer`, {
        prayer: prayerName,
        time: prayerTimeStr,
        date: dateStr,
        hasReminder: reminderMinutes > 0,
      });

      // Schedule reminder notification
      if (reminderMinutes > 0) {
        const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000);
        if (reminderTime > now) {
          try {
            const reminderId = await this.scheduleNotification({
              title: `${prayerName} in ${reminderMinutes} minutes`,
              body: 'Time to prepare for prayer',
              data: { type: 'reminder', prayer: prayerName },
              trigger: reminderTime,
            });

            scheduledNotifications.push({
              id: reminderId,
              prayerName,
              type: 'reminder',
              scheduledFor: reminderTime,
              date: dateStr,
            });

            logger.debug(`Scheduled reminder`, {
              prayer: prayerName,
              reminderTime: format(reminderTime, 'HH:mm'),
              notificationId: reminderId,
            });
          } catch (error) {
            logger.error(`Failed to schedule reminder`, error as Error, {
              prayer: prayerName,
              date: dateStr,
            });
          }
        }
      }

      // Schedule adhan notification (at prayer time)
      try {
        const adhanId = await this.scheduleNotification({
          title: `${prayerName} Prayer Time`,
          body: 'Time for prayer',
          data: { type: 'adhan', prayer: prayerName, sound: selectedAdhan },
          trigger: prayerTime,
          sound: Platform.OS === 'ios' ? selectedAdhan : undefined,
        });

        scheduledNotifications.push({
          id: adhanId,
          prayerName,
          type: 'adhan',
          scheduledFor: prayerTime,
          date: dateStr,
        });

        logger.debug(`Scheduled adhan`, {
          prayer: prayerName,
          prayerTime: prayerTimeStr,
          notificationId: adhanId,
          sound: selectedAdhan,
        });
      } catch (error) {
        logger.error(`Failed to schedule adhan`, error as Error, {
          prayer: prayerName,
          date: dateStr,
        });
      }
    }

    logger.info(`Day scheduling complete`, {
      date: dateStr,
      scheduled: scheduledNotifications.length,
      skipped: skippedCount,
      reminderCount: scheduledNotifications.filter(n => n.type === 'reminder').length,
      adhanCount: scheduledNotifications.filter(n => n.type === 'adhan').length,
    });

    return scheduledNotifications;
  }

  /**
   * Schedule a single notification
   */
  private async scheduleNotification(config: {
    title: string;
    body: string;
    data: any;
    trigger: Date | number;
    sound?: string;
  }): Promise<string> {
    logger.debug('Scheduling notification', {
      title: config.title,
      type: config.data.type,
      prayer: config.data.prayer,
      hasSound: !!config.sound,
    });

    try {
      const notificationContent: Notifications.NotificationContentInput = {
        title: config.title,
        body: config.body,
        data: config.data,
        sound: config.sound || 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };

      const trigger = this.createTrigger(config.trigger);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      logger.debug('Notification scheduled', {
        id: notificationId,
        title: config.title,
        type: config.data.type,
      });

      return notificationId;
    } catch (error) {
      logger.error('Failed to schedule notification', error as Error, {
        title: config.title,
        type: config.data.type,
      });
      throw error;
    }
  }

  /**
   * Create notification trigger from Date or seconds
   */
  private createTrigger(trigger: Date | number): Notifications.NotificationTriggerInput {
    if (typeof trigger === 'number') {
      logger.debug('Creating time interval trigger', { seconds: trigger });
      return {
        type: 'timeInterval',
        seconds: trigger,
        repeats: false,
      } as Notifications.TimeIntervalTriggerInput;
    }

    const now = new Date().getTime();
    const triggerTime = trigger.getTime();
    const secondsUntilTrigger = Math.max(1, Math.floor((triggerTime - now) / 1000));

    logger.debug('Creating date trigger', {
      triggerTime: format(trigger, 'yyyy-MM-dd HH:mm'),
      secondsUntilTrigger,
      minutesUntilTrigger: Math.floor(secondsUntilTrigger / 60),
    });

    return {
      type: 'timeInterval',
      seconds: secondsUntilTrigger,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput;
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    logger.time('cancel-notifications');
    logger.info('Cancelling all scheduled notifications');

    try {
      const beforeCount = await Notifications.getAllScheduledNotificationsAsync();
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      defaultStorage.delete(this.NOTIFICATION_STORAGE_KEY);
      defaultStorage.delete(this.METADATA_STORAGE_KEY);
      
      logger.success('All notifications cancelled', {
        cancelledCount: beforeCount.length,
        storageCleared: true,
      });
      logger.timeEnd('cancel-notifications');
    } catch (error) {
      logger.error('Error cancelling notifications', error as Error);
      logger.timeEnd('cancel-notifications');
    }
  }

  /**
   * Cancel notifications for a specific date
   */
  async cancelNotificationsForDate(date: string): Promise<void> {
    logger.info('Cancelling notifications for date', { date });

    try {
      const scheduled = this.getScheduledNotifications();
      const toCancel = scheduled.filter(n => n.date === date);

      logger.debug('Found notifications to cancel', {
        date,
        count: toCancel.length,
        prayers: toCancel.map(n => n.prayerName),
      });

      for (const notification of toCancel) {
        try {
          await Notifications.cancelScheduledNotificationAsync(notification.id);
          logger.debug('Cancelled notification', {
            id: notification.id,
            prayer: notification.prayerName,
            type: notification.type,
          });
        } catch (error) {
          logger.error('Failed to cancel individual notification', error as Error, {
            id: notification.id,
            prayer: notification.prayerName,
          });
        }
      }

      const remaining = scheduled.filter(n => n.date !== date);
      this.saveScheduledNotifications(remaining);
      
      logger.success('Cancelled notifications for date', {
        date,
        cancelledCount: toCancel.length,
        remainingCount: remaining.length,
      });
    } catch (error) {
      logger.error('Error cancelling notifications for date', error as Error, { date });
    }
  }

  /**
   * Force reschedule all notifications (clears metadata check)
   */
  async forceReschedule(): Promise<void> {
    logger.info('Force rescheduling all notifications');
    await this.cancelAllNotifications();
    logger.success('Force reschedule complete - call schedulePrayerNotifications to reschedule');
  }

  /**
   * Save scheduled notifications to storage
   */
  private saveScheduledNotifications(notifications: ScheduledNotification[]): void {
    try {
      const serialized = notifications.map(n => ({
        ...n,
        scheduledFor: n.scheduledFor.toISOString(),
      }));
      
      defaultStorage.set(this.NOTIFICATION_STORAGE_KEY, JSON.stringify(serialized));
      
      logger.debug('Saved scheduled notifications to storage', {
        count: notifications.length,
        storageKey: this.NOTIFICATION_STORAGE_KEY,
      });
    } catch (error) {
      logger.error('Failed to save scheduled notifications', error as Error, {
        count: notifications.length,
      });
    }
  }

  /**
   * Get scheduled notifications from storage
   */
  private getScheduledNotifications(): ScheduledNotification[] {
    try {
      const stored = defaultStorage.getString(this.NOTIFICATION_STORAGE_KEY);
      if (!stored) {
        logger.debug('No scheduled notifications in storage');
        return [];
      }
      
      const parsed = JSON.parse(stored);
      const notifications = parsed.map((n: any) => ({
        ...n,
        scheduledFor: new Date(n.scheduledFor),
      }));

      logger.debug('Retrieved scheduled notifications from storage', {
        count: notifications.length,
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to retrieve scheduled notifications', error as Error);
      return [];
    }
  }

  /**
   * Save notification metadata
   */
  private saveMetadata(metadata: NotificationMetadata): void {
    try {
      defaultStorage.set(this.METADATA_STORAGE_KEY, JSON.stringify(metadata));
      
      logger.debug('Saved notification metadata', {
        lastScheduled: metadata.lastScheduledDate,
        datesCount: metadata.scheduledDates.length,
        totalCount: metadata.scheduledCount,
      });
    } catch (error) {
      logger.error('Failed to save notification metadata', error as Error);
    }
  }

  /**
   * Get notification metadata
   */
  private getMetadata(): NotificationMetadata | null {
    try {
      const stored = defaultStorage.getString(this.METADATA_STORAGE_KEY);
      if (!stored) {
        logger.debug('No notification metadata in storage');
        return null;
      }

      const metadata = JSON.parse(stored);
      logger.debug('Retrieved notification metadata', {
        lastScheduled: metadata.lastScheduledDate,
        datesCount: metadata.scheduledDates?.length || 0,
        totalCount: metadata.scheduledCount,
      });

      return metadata;
    } catch (error) {
      logger.error('Failed to retrieve notification metadata', error as Error);
      return null;
    }
  }

  /**
   * Get count of pending notifications
   */
  async getPendingNotificationsCount(): Promise<number> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      const count = notifications.length;

      logger.info('Retrieved pending notifications count', { count });
      return count;
    } catch (error) {
      logger.error('Failed to get pending notifications count', error as Error);
      return 0;
    }
  }

  /**
   * Get info about scheduled dates
   */
  async getScheduledDatesInfo(): Promise<{
    dates: string[];
    count: number;
    nextSchedule: string | null;
  }> {
    logger.debug('Getting scheduled dates info');

    const metadata = this.getMetadata();
    if (!metadata) {
      logger.debug('No metadata available for scheduled dates');
      return { dates: [], count: 0, nextSchedule: null };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const futureDates = metadata.scheduledDates.filter(date => date >= today);

    const info = {
      dates: futureDates,
      count: metadata.scheduledCount,
      nextSchedule: futureDates[0] || null,
    };

    logger.info('Scheduled dates info', {
      futureDates: futureDates.length,
      totalCount: info.count,
      nextSchedule: info.nextSchedule,
      allDates: futureDates,
    });

    return info;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance
export const prayerNotificationService = new PrayerNotificationService();

// Export class for testing/extension
export { PrayerNotificationService };