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
    console.log("Starting notification scheduling...");
    const now = new Date();
    const storedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const scheduledDays = storedNotifications ? JSON.parse(storedNotifications) : {};

    const state: RootState = store.getState();
    const selectedAdhan = state.userPreferences.selectedAdhan;
    const adhanAudio = adhanOptions[selectedAdhan] || null;

    for (const [date, prayerTimes] of Object.entries(prayerTimesForDays)) {
      for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
        // Skip muted prayers
        if (mutedNotifications.includes(prayerName)) {
          console.log(`Skipping muted prayer: ${prayerName}`);
          continue;
        }

        //@ts-ignore
        const [hour, minute] = prayerTime.split(':').map(Number);
        const prayerDate = new Date(date);
        prayerDate.setHours(hour, minute);

        // Ensure prayer time is in the future
        if (prayerDate <= now) {
          console.log(`Skipping past prayer time for ${prayerName} on ${date}.`);
          continue;
        }

        // Handle Syuruk separately
        if (prayerName.toLowerCase() === 'syuruk') {
          if (scheduledDays[date]?.[prayerName]) {
            console.log(`Notification for Syuruk on ${date} already scheduled. Skipping.`);
            continue;
          }

          console.log(`Scheduling Syuruk notification for ${date} at ${prayerDate}.`);
          const syurukNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `It's Sunrise`,
              body: `The sun is rising now. Reflect and prepare for the day.`,
              sound: true,
            },
            trigger: prayerDate,
          });

          // Store Syuruk notification ID
          scheduledDays[date] = {
            ...scheduledDays[date],
            [prayerName]: [syurukNotificationId],
          };

          continue; // Skip reminder logic for Syuruk
        }

        // Check if this prayer is already scheduled
        if (scheduledDays[date]?.[prayerName]) {
          console.log(`Notification already scheduled for ${prayerName} on ${date}. Skipping.`);
          continue;
        }

        // Schedule prayer time notification
        console.log(`Scheduling ${prayerName} notification for ${date} at ${prayerDate}.`);
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayerName}`,
            body: `It's time for ${prayerName} prayer.`,
            sound: adhanAudio,
          },
          trigger: prayerDate,
        });

        // Schedule reminder notification
        if (reminderInterval > 0) {
          const reminderDate = new Date(prayerDate.getTime() - reminderInterval * 60 * 1000);
          if (reminderDate > now) {
            console.log(
              `Scheduling reminder for ${prayerName} ${reminderInterval} minutes before at ${reminderDate}.`
            );
            const reminderId = await Notifications.scheduleNotificationAsync({
              content: {
                title: `${reminderInterval} minutes until ${prayerName}`,
                body: `Get ready for ${prayerName} prayer.`,
                sound: true,
              },
              trigger: reminderDate,
            });

            // Store notification IDs
            scheduledDays[date] = {
              ...scheduledDays[date],
              [prayerName]: [notificationId, reminderId],
            };
          }
        } else {
          // Store only prayer time notification ID
          scheduledDays[date] = {
            ...scheduledDays[date],
            [prayerName]: [notificationId],
          };
        }
      }
    }

    // Save updated schedule
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledDays));
    console.log(`Scheduled notifications saved successfully.`);

    // Log all scheduled notifications
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Currently Scheduled Notifications:', allNotifications);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};
