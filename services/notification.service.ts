// services/notification.service.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parse, addMinutes, subMinutes } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

class NotificationService {
  private readonly NOTIFICATION_STORAGE_KEY = 'scheduled_notifications';
  
  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions
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

      // Configure notification channel for Android
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

  async schedulePrayerNotifications(
    prayerData: DailyPrayerTimes,
    reminderMinutes: number,
    mutedPrayers: PrayerName[],
    selectedAdhan: string
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      // Cancel existing notifications for this date
      await this.cancelNotificationsForDate(prayerData.date);

      const scheduledNotifications: ScheduledNotification[] = [];

      for (const prayerName of LOGGABLE_PRAYERS) {
        if (mutedPrayers.includes(prayerName)) continue;

        const prayerTimeStr = prayerData.prayers[prayerName];
        if (!prayerTimeStr) continue;

        const [hours, minutes] = prayerTimeStr.split(':').map(Number);
        const prayerTime = new Date(prayerData.date);
        prayerTime.setHours(hours, minutes, 0, 0);

        // Skip if prayer time has passed
        if (prayerTime < new Date()) continue;

        // Schedule reminder notification
        if (reminderMinutes > 0) {
          const reminderTime = subMinutes(prayerTime, reminderMinutes);
          if (reminderTime > new Date()) {
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
            });
          }
        }

        // Schedule adhan notification
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
        });
      }

      // Save scheduled notifications
      await this.saveScheduledNotifications(scheduledNotifications);
      
      console.log(`✅ Scheduled ${scheduledNotifications.length} notifications`);
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
      throw error;
    }
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

    // Create the trigger
    const trigger = this.createTrigger(config.trigger);

    return await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
  }

  private createTrigger(trigger: Date | number): Notifications.NotificationTriggerInput {
    if (typeof trigger === 'number') {
      // Trigger in X seconds
      return {
        type: 'timeInterval',
        seconds: trigger,
        repeats: false,
      } as Notifications.TimeIntervalTriggerInput;
    }

    // Convert Date to seconds from now
    const now = new Date().getTime();
    const triggerTime = trigger.getTime();
    const secondsUntilTrigger = Math.max(1, Math.floor((triggerTime - now) / 1000));

    // Use TimeInterval trigger for dates
    // Note: For more precise scheduling, consider using CalendarNotificationTrigger
    // with hour, minute, and day components, but it's more complex to implement
    return {
      type: 'timeInterval',
      seconds: secondsUntilTrigger,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput;
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.NOTIFICATION_STORAGE_KEY);
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  async cancelNotificationsForDate(date: string): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const toCancel = scheduled.filter(n => 
        n.scheduledFor.toISOString().startsWith(date)
      );

      for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }

      const remaining = scheduled.filter(n => 
        !n.scheduledFor.toISOString().startsWith(date)
      );
      
      await this.saveScheduledNotifications(remaining);
    } catch (error) {
      console.error('❌ Error cancelling notifications for date:', error);
    }
  }

  private async saveScheduledNotifications(
    notifications: ScheduledNotification[]
  ): Promise<void> {
    await AsyncStorage.setItem(
      this.NOTIFICATION_STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }

  private async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(this.NOTIFICATION_STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        scheduledFor: new Date(n.scheduledFor),
      }));
    } catch {
      return [];
    }
  }

  // Schedule notifications for multiple days
  async scheduleMultipleDayNotifications(
    prayerTimesList: DailyPrayerTimes[],
    settings: PrayerNotificationSettings
  ): Promise<void> {
    for (const prayerData of prayerTimesList) {
      await this.schedulePrayerNotifications(
        prayerData,
        settings.reminderMinutes,
        settings.mutedPrayers,
        settings.selectedAdhan
      );
    }
  }

  // Get pending notifications count
  async getPendingNotificationsCount(): Promise<number> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  }
}

export const notificationService = new NotificationService();