import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { RootState, store } from "../redux/store/store"

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

const adhanOptions = { 
  'Ahmad Al-Nafees': require('../assets/adhans/ahmadAlNafees.mp3'),
  'Mishary Rashid Alafasy': require('../assets/adhans/mishary.mp3'),
  'None': null
};

export const scheduleNextDaysNotifications = async (
  prayerTimesForDays: Record<string, any>,
  reminderInterval: number,
  mutedNotifications: string[]
) => {
  try {
    const now = new Date(); // Current time for validation
    const scheduledNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const scheduledDays = scheduledNotifications ? JSON.parse(scheduledNotifications) : {};

    const state: RootState = store.getState();
    const selectedAdhan = state.userPreferences.selectedAdhan;
    const adhanAudio = adhanOptions[selectedAdhan] || null;

    for (const [date, prayerTimes] of Object.entries(prayerTimesForDays)) {
      const shouldReschedule = reminderInterval !== scheduledDays[date]?.reminderInterval;

      for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
        if (mutedNotifications.includes(prayerName)) {
          console.log(`Skipping notifications for muted prayer: ${prayerName}`);
          
          // Cancel existing notifications for this prayer
          const existingNotifications = scheduledDays[date]?.[prayerName];
          if (existingNotifications && Array.isArray(existingNotifications)) {
            for (const notificationId of existingNotifications) {
              console.log(`Cancelling notification ID: ${notificationId}`);
              await Notifications.cancelScheduledNotificationAsync(notificationId);
            }
          }

          // remove muted prayer from scheduled days recoed
          if (scheduledDays[date]?.[prayerName]) {
            delete scheduledDays[date][prayerName];
          }

          continue;
        }

        //@ts-ignore
        const [hour, minute] = prayerTime.split(':').map(Number);
        const prayerDate = new Date(date);
        prayerDate.setHours(hour, minute);

        // Ensure prayer time is in the future
        if (prayerDate <= now) {
          console.log(`Skipping ${prayerName} notification for ${date} because the time is in the past.`);
          continue;
        }

        // Handle Syuruk differently
        if (prayerName.toLowerCase() === 'syuruk') {
          console.log(`Scheduling Syuruk notification for ${date} at ${prayerDate}.`);
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `It's Sunrise`,
              body: `The sun is rising now. Reflect and prepare for the day.`,
              sound: true,
            },
            trigger: prayerDate,
          });
          
          scheduledDays[date] = {
            ...scheduledDays[date],
            [prayerName]: [notificationId]
          };
          // No reminder for Syuruk as it's not a prayer
          continue;
        }

        // Exact prayer time notification
        console.log(`Scheduling notification for ${prayerName} on ${date} at ${prayerDate}.`);
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayerName}`,
            body: `It's time for ${prayerName} prayer.`,
            sound: adhanAudio,
          },
          trigger: prayerDate,
        });

        // Pre-prayer reminder
        if (reminderInterval > 0) {
          const reminderDate = new Date(prayerDate.getTime() - reminderInterval * 60 * 1000);
          if (reminderDate > now) {
            console.log(`Scheduling reminder for ${prayerName} ${reminderInterval} minutes before at ${reminderDate}.`);
            const reminderId = await Notifications.scheduleNotificationAsync({
              content: {
                title: `${reminderInterval} minutes until ${prayerName}`,
                body: `Get ready for ${prayerName} prayer in ${reminderInterval} minutes.`,
                sound: true,
              },
              trigger: reminderDate,
            });
            
            scheduledDays[date] = {
              ...scheduledDays[date],
              [prayerName]: [
                ...(scheduledDays[date]?.[prayerName] || []),
                notificationId,
                reminderId
              ]
            }
          } else {
            console.log(`Skipping reminder for ${prayerName} because the reminder time is in the past.`);
          }
        } else {
          scheduledDays[date] = {
            ...scheduledDays[date],
            [prayerName]: [
              ...(scheduledDays[date]?.[prayerName] || []),
              notificationId
            ]
          }
        }
      }
    }

    // Save updated scheduled days
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledDays));
    console.log(`Updated scheduled notifications saved successfully`)
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw error;
  }
};
