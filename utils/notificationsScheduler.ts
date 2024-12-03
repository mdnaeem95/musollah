import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

export const scheduleNextDaysNotifications = async (
  prayerTimesForDays: Record<string, any>,
  reminderInterval: number
) => {
  try {
    const now = new Date(); // Current time for validation
    const scheduledNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const scheduledDays = scheduledNotifications ? JSON.parse(scheduledNotifications) : {};

    for (const [date, prayerTimes] of Object.entries(prayerTimesForDays)) {
      const shouldReschedule = reminderInterval !== scheduledDays[date]?.reminderInterval;

      // Skip if already scheduled and no interval change
      if (scheduledDays[date] && !shouldReschedule) {
        console.log(`Notifications for ${date} are already scheduled.`);
        continue;
      }

      console.log(`Scheduling notifications for ${date}.`);
      for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
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
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `It's Sunrise`,
              body: `The sun is rising now. Reflect and prepare for the day.`,
              sound: true,
            },
            trigger: prayerDate,
          });

          // No reminder for Syuruk as it's not a prayer
          continue;
        }

        // Exact prayer time notification
        console.log(`Scheduling notification for ${prayerName} on ${date} at ${prayerDate}.`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayerName}`,
            body: `It's time for ${prayerName} prayer.`,
            sound: true,
          },
          trigger: prayerDate,
        });

        // Pre-prayer reminder
        if (reminderInterval > 0) {
          const reminderDate = new Date(prayerDate.getTime() - reminderInterval * 60 * 1000);
          if (reminderDate > now) {
            console.log(`Scheduling reminder for ${prayerName} ${reminderInterval} minutes before at ${reminderDate}.`);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${reminderInterval} minutes until ${prayerName}`,
                body: `Get ready for ${prayerName} prayer in ${reminderInterval} minutes.`,
                sound: true,
              },
              trigger: reminderDate,
            });
          } else {
            console.log(`Skipping reminder for ${prayerName} because the reminder time is in the past.`);
          }
        }
      }

      // Mark day as scheduled
      scheduledDays[date] = { reminderInterval };
    }

    // Save updated scheduled days
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledDays));
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw error;
  }
};
