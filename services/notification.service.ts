// services/notification.service.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, format, startOfDay } from 'date-fns';
import { defaultStorage } from '../api/client/storage';
import { fetchPrayerTimesByDate, normalizePrayerTimes } from '../api/services/prayer';
import { 
  DailyPrayerTimes, 
  PrayerName, 
  PrayerNotificationSettings 
} from '../utils/types/prayer.types';
import { LOGGABLE_PRAYERS } from '../constants/prayer.constants';

interface ScheduledNotification {
  id: string;
  prayerName: PrayerName;
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

class NotificationService {
  private readonly NOTIFICATION_STORAGE_KEY = 'scheduled_notifications';
  private readonly METADATA_STORAGE_KEY = 'notification_metadata';
  private readonly DAYS_TO_SCHEDULE = 5;
  
  constructor() {
    this.initialize();
  }

  private async initialize() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    await this.requestPermissions();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Prayer Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          bypassDnd: false,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          showBadge: true,
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  private hasExistingNotifications(): boolean {
    const metadata = this.getMetadata();
    if (!metadata) return false;

    const today = format(new Date(), 'yyyy-MM-dd');
    const scheduledDates = metadata.scheduledDates || [];
    
    const futureDates = scheduledDates.filter(date => date >= today);
    const hasEnoughScheduled = futureDates.length >= 3;

    console.log('📊 Notification check:', {
      scheduledDates: futureDates.length,
      hasEnough: hasEnoughScheduled,
      dates: futureDates
    });

    return hasEnoughScheduled;
  }

  async schedulePrayerNotifications(
    prayerData: DailyPrayerTimes,
    reminderMinutes: number,
    mutedPrayers: PrayerName[],
    selectedAdhan: string,
    userLocation?: LocationCoords
  ): Promise<void> {
    try {
      if (this.hasExistingNotifications()) {
        console.log('✅ Notifications already scheduled, skipping');
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      console.log(`📅 Scheduling notifications for next ${this.DAYS_TO_SCHEDULE} days`);

      await this.cancelAllNotifications();

      const scheduledNotifications: ScheduledNotification[] = [];
      const scheduledDates: string[] = [];

      const location = userLocation || {
        latitude: 1.3521,
        longitude: 103.8198
      };

      for (let i = 0; i < this.DAYS_TO_SCHEDULE; i++) {
        const targetDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(targetDate, 'yyyy-MM-dd');

        try {
          let dayPrayerData: DailyPrayerTimes;

          if (i === 0) {
            dayPrayerData = prayerData;
          } else {
            console.log(`📡 Fetching prayer times for ${dateStr}`);
            const response = await fetchPrayerTimesByDate(
              location.latitude,
              location.longitude,
              targetDate
            );

            const normalized = normalizePrayerTimes(response.data);

            dayPrayerData = {
              date: dateStr,
              hijriDate: response.data.date.hijri.date || '',
              prayers: {
                Subuh: normalized.fajr,
                Syuruk: normalized.sunrise,
                Zohor: normalized.dhuhr,
                Asar: normalized.asr,
                Maghrib: normalized.maghrib,
                Isyak: normalized.isha,
              },
            };
          }

          const dayNotifications = await this.scheduleDayNotifications(
            dayPrayerData,
            reminderMinutes,
            mutedPrayers,
            selectedAdhan,
            dateStr
          );

          scheduledNotifications.push(...dayNotifications);
          scheduledDates.push(dateStr);

          console.log(`✅ Scheduled ${dayNotifications.length} notifications for ${dateStr}`);
        } catch (error) {
          console.error(`❌ Failed to schedule notifications for ${dateStr}:`, error);
        }
      }

      this.saveScheduledNotifications(scheduledNotifications);
      this.saveMetadata({
        lastScheduledDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledDates,
        scheduledCount: scheduledNotifications.length,
        lastUpdated: Date.now(),
      });
      
      console.log(`✅ Total: ${scheduledNotifications.length} notifications for ${scheduledDates.length} days`);
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
      throw error;
    }
  }

  private async scheduleDayNotifications(
    prayerData: DailyPrayerTimes,
    reminderMinutes: number,
    mutedPrayers: PrayerName[],
    selectedAdhan: string,
    dateStr: string
  ): Promise<ScheduledNotification[]> {
    const scheduledNotifications: ScheduledNotification[] = [];
    const now = new Date();

    for (const prayerName of LOGGABLE_PRAYERS) {
      if (mutedPrayers.includes(prayerName)) continue;

      const prayerTimeStr = prayerData.prayers[prayerName];
      if (!prayerTimeStr) continue;

      const [hours, minutes] = prayerTimeStr.split(':').map(Number);
      const prayerTime = new Date(prayerData.date);
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime <= now) continue;

      if (reminderMinutes > 0) {
        const reminderTime = new Date(prayerTime.getTime() - reminderMinutes * 60 * 1000);
        if (reminderTime > now) {
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
        }
      }

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
    }

    return scheduledNotifications;
  }

  private async scheduleNotification(config: {
    title: string;
    body: string;
    data: any;
    trigger: Date | number;
    sound?: string;
  }): Promise<string> {
    const notificationContent: Notifications.NotificationContentInput = {
      title: config.title,
      body: config.body,
      data: config.data,
      sound: config.sound || 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };

    const trigger = this.createTrigger(config.trigger);

    return await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
  }

  private createTrigger(trigger: Date | number): Notifications.NotificationTriggerInput {
    if (typeof trigger === 'number') {
      return {
        type: 'timeInterval',
        seconds: trigger,
        repeats: false,
      } as Notifications.TimeIntervalTriggerInput;
    }

    const now = new Date().getTime();
    const triggerTime = trigger.getTime();
    const secondsUntilTrigger = Math.max(1, Math.floor((triggerTime - now) / 1000));

    return {
      type: 'timeInterval',
      seconds: secondsUntilTrigger,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput;
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      defaultStorage.delete(this.NOTIFICATION_STORAGE_KEY);
      defaultStorage.delete(this.METADATA_STORAGE_KEY);
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  async cancelNotificationsForDate(date: string): Promise<void> {
    try {
      const scheduled = this.getScheduledNotifications();
      const toCancel = scheduled.filter(n => n.date === date);

      for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }

      const remaining = scheduled.filter(n => n.date !== date);
      this.saveScheduledNotifications(remaining);
      
      console.log(`✅ Cancelled ${toCancel.length} notifications for ${date}`);
    } catch (error) {
      console.error('❌ Error cancelling notifications for date:', error);
    }
  }

  async forceReschedule(): Promise<void> {
    await this.cancelAllNotifications();
    console.log('🔄 Forced reschedule - call schedulePrayerNotifications again');
  }

  private saveScheduledNotifications(notifications: ScheduledNotification[]): void {
    const serialized = notifications.map(n => ({
      ...n,
      scheduledFor: n.scheduledFor.toISOString(),
    }));
    defaultStorage.set(this.NOTIFICATION_STORAGE_KEY, serialized);
  }

  private getScheduledNotifications(): ScheduledNotification[] {
    try {
      const stored = defaultStorage.get<any[]>(this.NOTIFICATION_STORAGE_KEY);
      if (!stored) return [];
      
      return stored.map(n => ({
        ...n,
        scheduledFor: new Date(n.scheduledFor),
      }));
    } catch {
      return [];
    }
  }

  private saveMetadata(metadata: NotificationMetadata): void {
    defaultStorage.set(this.METADATA_STORAGE_KEY, metadata);
  }

  private getMetadata(): NotificationMetadata | null {
    return defaultStorage.get<NotificationMetadata>(this.METADATA_STORAGE_KEY);
  }

  async getPendingNotificationsCount(): Promise<number> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  }

  async getScheduledDatesInfo(): Promise<{
    dates: string[];
    count: number;
    nextSchedule: string | null;
  }> {
    const metadata = this.getMetadata();
    if (!metadata) {
      return { dates: [], count: 0, nextSchedule: null };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const futureDates = metadata.scheduledDates.filter(date => date >= today);

    return {
      dates: futureDates,
      count: metadata.scheduledCount,
      nextSchedule: futureDates[0] || null,
    };
  }
}

export const notificationService = new NotificationService();