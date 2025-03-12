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
    console.log(`🕒 Current system time: ${now.toLocaleString()} (Timestamp: ${now.getTime()})`);

    // Retrieve previously scheduled notifications
    let storedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    let scheduledDays = storedNotifications ? JSON.parse(storedNotifications) : {};

    // Fetch all currently scheduled notifications
    let allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📌 All currently scheduled notifications:', allScheduled);

    if (allScheduled.length === 0 && Object.keys(scheduledDays).length > 0) {
      console.log('⚠️ AsyncStorage has scheduled notifications, but Expo has none. Keeping storage intact.');
    } else if (allScheduled.length === 0) {
      console.log('⚠️ No active notifications found. Resetting stored notification data.');
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
      scheduledDays = {};
    }

    // Get current user preference for Adhan sound
    const state: RootState = store.getState();
    const selectedAdhan = state.userPreferences.selectedAdhan;
    const adhanAudio = adhanOptions[selectedAdhan] || null;

    let notificationsChanged = false; 

    for (const [date, prayerTimes] of Object.entries(prayerTimesForDays)) {
      for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
        if (mutedNotifications.includes(prayerName)) {
          console.log(`🔕 Skipping muted prayer: ${prayerName}`);
          continue;
        }

        //@ts-ignore
        const timeMatch = prayerTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!timeMatch) {
          console.error(`❌ Invalid time format for ${prayerName} on ${date}: ${prayerTime}`);
          continue;
        }

        const [, hour, minute, second] = timeMatch.map(Number);
        let prayerDate = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second || 0).padStart(2, '0')}`);
        
        // Add buffer time (30 seconds) to ensure it doesn't fire too early
        prayerDate = new Date(prayerDate.getTime() + 30 * 1000);

        console.log(`📅 Scheduling target time for ${prayerName}: ${prayerDate.toLocaleString()} (Timestamp: ${prayerDate.getTime()})`);

        // Ensure prayer time is in the future
        if (prayerDate <= now) {
          console.log(`⏩ Skipping past prayer time for ${prayerName} on ${date}.`);
          continue;
        }

        // Check if notification exists
        let isMismatched = false;
        if (scheduledDays[date]?.[prayerName]) {
          console.log(`🔄 Checking existing notifications for ${prayerName} on ${date}...`);
          const existingNotifications = scheduledDays[date][prayerName];

          for (const notificationId of existingNotifications) {
            const scheduledNotification = allScheduled.find(n => n.identifier === notificationId);
            if (scheduledNotification) {
              //@ts-ignore
              const scheduledTime = new Date(scheduledNotification.trigger?.value);
              console.log(`🔍 Scheduled notification time: ${scheduledTime.toLocaleString()} (Timestamp: ${scheduledTime.getTime()})`);

              if (scheduledTime.getTime() !== prayerDate.getTime()) {
                isMismatched = true;
                console.log(`⏰ Mismatch found for ${prayerName} on ${date}: Expected ${prayerDate.toLocaleString()}, Found ${scheduledTime.toLocaleString()}`);
                await Notifications.cancelScheduledNotificationAsync(notificationId);
              }
            } else {
              isMismatched = true;
            }
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

        scheduledDays[date] ??= {};
        scheduledDays[date][prayerName] = [notificationId];
        notificationsChanged = true;
      }
    }

    if (notificationsChanged) {
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledDays));
      console.log(`✅ Updated scheduled notifications saved.`);
    } else {
      console.log(`🔍 No changes detected. Notifications remain the same.`);
    }

    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📜 Currently Scheduled Notifications:', allNotifications);
  } catch (error) {
    console.error('🚨 Error scheduling notifications:', error);
  }
};
