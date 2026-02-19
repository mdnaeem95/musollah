/**
 * Ramadan Notification Service
 *
 * Schedules Ramadan-specific notifications:
 * - Suhoor reminder (configurable: 30/45/60 min before Imsak)
 * - Iftar alert (at Maghrib)
 * - Tarawih reminder (after Isyak)
 * - Last 10 nights emphasis
 * - Laylatul Qadr odd night special notifications
 *
 * Separate from prayer service to avoid coupling.
 * Same patterns: singleton, scheduling lock, MMKV, 5-day lookahead.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, format } from 'date-fns';
import { defaultStorage } from '../../api/client/storage';
import { fetchTodayRamadanTimes } from '../../api/services/ramadan/api/ramadan-times';
import type { RamadanNotificationPrefs } from '../../api/services/ramadan/types';
import {
  LAYLATUL_QADR_NIGHTS,
  LAST_TEN_NIGHTS_START,
} from '../../api/services/ramadan/types/constants';
import { createLogger } from '../logging/logger';

const logger = createLogger('Ramadan Notifications');

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledRamadanNotification {
  id: string;
  type: 'suhoor' | 'iftar' | 'tarawih' | 'last_ten' | 'laylatul_qadr';
  scheduledFor: string;
  date: string;
}

interface RamadanNotifMetadata {
  lastScheduledDate: string;
  scheduledCount: number;
  lastUpdated: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'ramadan_scheduled_notifications';
const METADATA_KEY = 'ramadan_notification_metadata';
const DAYS_TO_SCHEDULE = 5;
const ANDROID_CHANNEL_ID = 'ramadan';

// ============================================================================
// SERVICE
// ============================================================================

class RamadanNotificationService {
  private isScheduling = false;

  constructor() {
    this.setupAndroidChannel();
  }

  private async setupAndroidChannel() {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Ramadan',
        description: 'Suhoor, Iftar, and Tarawih reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      logger.debug('Android Ramadan channel created');
    } catch (error) {
      logger.warn('Failed to create Android channel', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  /**
   * Schedule Ramadan notifications for the next N days.
   */
  async scheduleNotifications(
    prefs: RamadanNotificationPrefs,
    currentRamadanDay: number,
    totalDays: number
  ): Promise<void> {
    if (this.isScheduling) {
      logger.warn('Scheduling already in progress');
      return;
    }

    this.isScheduling = true;
    const startTime = performance.now();

    try {
      logger.info('Scheduling Ramadan notifications', {
        currentDay: currentRamadanDay,
        totalDays,
        prefs: Object.entries(prefs)
          .filter(([, v]) => v === true)
          .map(([k]) => k),
      });

      // Cancel existing Ramadan notifications
      await this.cancelAllRamadanNotifications();

      const scheduled: ScheduledRamadanNotification[] = [];

      for (let offset = 0; offset < DAYS_TO_SCHEDULE; offset++) {
        const ramadanDay = currentRamadanDay + offset;
        if (ramadanDay > totalDays) break;

        const date = addDays(new Date(), offset);
        const dateStr = format(date, 'yyyy-MM-dd');

        // Fetch times for this day
        let imsak = '05:20';
        let maghrib = '19:10';
        let isyak = '20:20';

        try {
          const times = await fetchTodayRamadanTimes();
          imsak = times.imsak;
          maghrib = times.iftar;
        } catch {
          logger.warn('Using fallback times for notifications', { dateStr });
        }

        const isLastTen = ramadanDay >= LAST_TEN_NIGHTS_START;
        const isLaylatulQadr = (LAYLATUL_QADR_NIGHTS as readonly number[]).includes(ramadanDay);

        // Suhoor reminder
        if (prefs.suhoorReminderEnabled) {
          const suhoorTime = this.subtractMinutes(imsak, prefs.suhoorReminderMinutes);
          const trigger = this.createTriggerDate(date, suhoorTime);

          if (trigger > new Date()) {
            const id = await this.scheduleNotification({
              title: 'Suhoor Time',
              body: `${prefs.suhoorReminderMinutes} minutes until Imsak (${imsak}). Time for Suhoor!`,
              trigger,
              data: { type: 'suhoor', ramadanDay },
            });
            scheduled.push({ id, type: 'suhoor', scheduledFor: trigger.toISOString(), date: dateStr });
          }
        }

        // Iftar alert
        if (prefs.iftarAlertEnabled) {
          const trigger = this.createTriggerDate(date, maghrib);

          if (trigger > new Date()) {
            const id = await this.scheduleNotification({
              title: 'Iftar Time!',
              body: `It's Maghrib. Break your fast. Allahumma inni laka sumtu...`,
              trigger,
              data: { type: 'iftar', ramadanDay },
            });
            scheduled.push({ id, type: 'iftar', scheduledFor: trigger.toISOString(), date: dateStr });
          }
        }

        // Tarawih reminder (30 min after Isyak)
        if (prefs.tarawihReminderEnabled) {
          const tarawihTime = this.addMinutes(isyak, 30);
          const trigger = this.createTriggerDate(date, tarawihTime);

          if (trigger > new Date()) {
            const id = await this.scheduleNotification({
              title: 'Tarawih Reminder',
              body: isLastTen
                ? `Night ${ramadanDay} — Last 10 nights! Don't miss Tarawih.`
                : `Night ${ramadanDay} — Time for Tarawih prayers.`,
              trigger,
              data: { type: 'tarawih', ramadanDay },
            });
            scheduled.push({ id, type: 'tarawih', scheduledFor: trigger.toISOString(), date: dateStr });
          }
        }

        // Last 10 nights special
        if (prefs.lastTenNightsEnabled && isLastTen) {
          const trigger = this.createTriggerDate(date, maghrib);
          trigger.setMinutes(trigger.getMinutes() + 5); // 5 min after iftar

          if (trigger > new Date()) {
            const body = isLaylatulQadr
              ? `Night ${ramadanDay} — Potential Laylatul Qadr! This night is better than a thousand months.`
              : `Night ${ramadanDay} of the last 10 nights. Increase your worship and dua.`;

            const id = await this.scheduleNotification({
              title: isLaylatulQadr ? 'Laylatul Qadr Night' : 'Last 10 Nights',
              body,
              trigger,
              data: { type: isLaylatulQadr ? 'laylatul_qadr' : 'last_ten', ramadanDay },
            });
            scheduled.push({
              id,
              type: isLaylatulQadr ? 'laylatul_qadr' : 'last_ten',
              scheduledFor: trigger.toISOString(),
              date: dateStr,
            });
          }
        }
      }

      // Save metadata
      this.saveMetadata({
        lastScheduledDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledCount: scheduled.length,
        lastUpdated: Date.now(),
      });

      this.saveScheduledNotifications(scheduled);

      const duration = performance.now() - startTime;
      logger.success('Ramadan notifications scheduled', {
        count: scheduled.length,
        duration: `${duration.toFixed(0)}ms`,
      });
    } catch (error) {
      logger.error('Failed to schedule Ramadan notifications', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    } finally {
      this.isScheduling = false;
    }
  }

  /**
   * Cancel all Ramadan notifications.
   */
  async cancelAllRamadanNotifications(): Promise<void> {
    try {
      const existing = this.getScheduledNotifications();
      for (const notif of existing) {
        await Notifications.cancelScheduledNotificationAsync(notif.id);
      }
      this.saveScheduledNotifications([]);
      logger.debug('Cancelled all Ramadan notifications', {
        count: existing.length,
      });
    } catch (error) {
      logger.warn('Failed to cancel notifications', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async scheduleNotification(config: {
    title: string;
    body: string;
    trigger: Date;
    data: Record<string, unknown>;
  }): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: config.data,
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: ANDROID_CHANNEL_ID,
        }),
      },
      trigger: { date: config.trigger, type: Notifications.SchedulableTriggerInputTypes.DATE },
    });
  }

  private createTriggerDate(baseDate: Date, time: string): Date {
    const [h, m] = time.split(':').map(Number);
    const trigger = new Date(baseDate);
    trigger.setHours(h, m, 0, 0);
    return trigger;
  }

  private subtractMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m - minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  private saveScheduledNotifications(notifications: ScheduledRamadanNotification[]) {
    defaultStorage.setString(STORAGE_KEY, JSON.stringify(notifications));
  }

  private getScheduledNotifications(): ScheduledRamadanNotification[] {
    const raw = defaultStorage.getString(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveMetadata(metadata: RamadanNotifMetadata) {
    defaultStorage.setString(METADATA_KEY, JSON.stringify(metadata));
  }
}

// Singleton
export const ramadanNotificationService = new RamadanNotificationService();
