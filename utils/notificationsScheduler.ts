import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { RootState, store } from "../redux/store/store";

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

const adhanOptions = {
  'Ahmad Al-Nafees': require('../assets/adhans/ahmadAlNafees.mp3'),
  'Mishary Rashid Alafasy': require('../assets/adhans/mishary.mp3'),
  'None': null,
};

export const scheduleNextDaysNotifications = async (
  prayerTimesForDays: Record<string, any>,
  reminderInterval: number,
  mutedNotifications: string[]
) => {
  try {
    console.log("🚀 Starting notification scheduling...");
    const now = new Date();

    // Retrieve previously scheduled notifications
    const storedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const scheduledDays = storedNotifications ? JSON.parse(storedNotifications) : {};

    // Get current user preference for Adhan sound
    const state: RootState = store.getState();
    const selectedAdhan = state.userPreferences.selectedAdhan;
    const adhanAudio = adhanOptions[selectedAdhan] || null;

    let notificationsChanged = false; // Track changes for logging

    for (const [date, prayerTimes] of Object.entries(prayerTimesForDays)) {
      for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
        if (mutedNotifications.includes(prayerName)) {
          console.log(`🔕 Skipping muted prayer: ${prayerName}`);
          continue;
        }

        // Validate and parse prayer time string
        //@ts-ignore
        const timeMatch = prayerTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!timeMatch) {
          console.error(`❌ Invalid time format for ${prayerName} on ${date}: ${prayerTime}`);
          continue;
        }

        // Extract hour, minute, second
        const [, hourStr, minuteStr, secondStr] = timeMatch;
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const second = secondStr ? parseInt(secondStr, 10) : 0;

        console.log(`🕒 Extracted Time for ${prayerName}:`, {
          original: prayerTime,
          hour,
          minute,
          second,
        });

        // Correctly create a date object for the prayer time
        const prayerDate = new Date(date);
        prayerDate.setHours(hour, minute, second, 0); // Ensure exact time

        console.log(`📅 Parsed Prayer Time for ${prayerName}:`, {
          prayerName,
          date,
          expectedPrayerDate: prayerDate.toLocaleString(),
          timestamp: prayerDate.getTime(),
        });

        // Ensure prayer time is in the future
        if (prayerDate <= now) {
          console.log(`⏩ Skipping past prayer time for ${prayerName} on ${date}.`);
          continue;
        }

        // Handle Syuruk separately
        if (prayerName.toLowerCase() === 'syuruk') {
          if (scheduledDays[date]?.[prayerName]) {
            console.log(`🌅 Notification for Syuruk on ${date} already scheduled. Skipping.`);
            continue;
          }

          console.log(`📅 Scheduling Syuruk notification for ${date} at ${prayerDate}.`);
          const syurukNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `🌅 It's Sunrise`,
              body: `The sun is rising now. Reflect and prepare for the day.`,
              sound: true,
            },
            trigger: new Date(prayerDate)
          });

          scheduledDays[date] ??= {};
          scheduledDays[date][prayerName] = [syurukNotificationId];
          notificationsChanged = true;
          continue;
        }

        // Check if this prayer is already scheduled and matches the correct time
        if (scheduledDays[date]?.[prayerName]) {
          console.log(`🔄 Checking existing notifications for ${prayerName} on ${date}...`);

          // Fetch current scheduled notifications
          const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
          const existingNotifications = scheduledDays[date][prayerName];

          let isMismatched = false;
          for (const notificationId of existingNotifications) {
            const scheduledNotification = allScheduled.find(n => n.identifier === notificationId);
            if (scheduledNotification) {
              //@ts-ignore
              const scheduledTime = new Date(scheduledNotification.trigger?.value || 0);

              console.log(`🔍 Checking notification timing for ${prayerName}:`, {
                expected: prayerDate.getTime(),
                localScheduled: scheduledTime.toLocaleString(),
                scheduled: scheduledTime.getTime(),
                utcScheduled: scheduledTime.toUTCString(),
              });

              // If the scheduled time doesn't match, reschedule
              if (scheduledTime.getTime() !== prayerDate.getTime()) {
                isMismatched = true;
                console.log(`⏰ Mismatch found for ${prayerName} on ${date}: Expected ${prayerDate}, Found ${scheduledTime}`);
                await Notifications.cancelScheduledNotificationAsync(notificationId);
              }
            } else {
              isMismatched = true;
            }
          }

          if (!isMismatched) {
            console.log(`✅ Notification for ${prayerName} on ${date} is correct. Skipping reschedule.`);
            continue;
          } else {
            console.log(`🔁 Rescheduling ${prayerName} for ${date} at ${prayerDate}.`);
            notificationsChanged = true;
          }
        }

        // Schedule the prayer notification
        console.log(`📅 Scheduling ${prayerName} notification for ${date} at ${prayerDate}.`);
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayerName}`,
            body: `It's time for ${prayerName} prayer.`,
            sound: adhanAudio,
          },
          trigger: new Date(prayerDate)
        });

        let reminderId: string | null = null;
        if (reminderInterval > 0) {
          const reminderDate = new Date(prayerDate.getTime() - reminderInterval * 60 * 1000);
          if (reminderDate > now) {
            console.log(`🔔 Scheduling reminder for ${prayerName} ${reminderInterval} minutes before at ${reminderDate}.`);
            reminderId = await Notifications.scheduleNotificationAsync({
              content: {
                title: `${reminderInterval} minutes until ${prayerName}`,
                body: `Get ready for ${prayerName} prayer.`,
                sound: true,
              },
              trigger: new Date(reminderDate)
            });
          }
        }

        // Store notification IDs
        scheduledDays[date] ??= {};
        scheduledDays[date][prayerName] = [notificationId, reminderId].filter(Boolean);
      }
    }

    // Save updated schedule if changes occurred
    if (notificationsChanged) {
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledDays));
      console.log(`✅ Updated scheduled notifications saved.`);
    } else {
      console.log(`🔍 No changes detected. Notifications remain the same.`);
    }

    // Log all scheduled notifications
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📜 Currently Scheduled Notifications:', allNotifications);
  } catch (error) {
    console.error('🚨 Error scheduling notifications:', error);
  }
};