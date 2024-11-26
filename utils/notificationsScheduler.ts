import * as Notifications from 'expo-notifications';
import { PrayerTimes } from './types';

export const schedulePrayerNotifications = async (
  prayerTimes: PrayerTimes, 
  reminderInterval: number,
  scheduledReminders: Set<string>
) => {
  try {
    const today = new Date();

    // Cancel all previously scheduled notifications to apply new settings
    console.log('Cancelling all existing notifications to apply new settings.');
    await Notifications.cancelAllScheduledNotificationsAsync();

    console.log('Scheduling notifications for the following prayer times:', prayerTimes);

    for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
      const [hour, minute] = prayerTime.split(':').map(Number);
      const prayerDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

      // Schedule a notification at the exact prayer time
      if (prayerDate > today) {
        console.log(`Scheduling notification for ${prayerName} at ${prayerDate}`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayerName}`,
            body: `It's time for ${prayerName} prayer.`,
            sound: true,
          },
          trigger: prayerDate,
        });
      }

      // Schedule a pre-prayer reminder notification
      if (reminderInterval > 0 && !scheduledReminders.has(prayerName)) {
        const reminderDate = new Date(prayerDate.getTime() - reminderInterval * 60 * 1000);
        if (reminderDate > today) {
          console.log(`Scheduling reminder for ${prayerName} ${reminderInterval} minutes before at ${reminderDate}`);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${reminderInterval} minutes until ${prayerName}`,
              body: `Get ready for ${prayerName} prayer in ${reminderInterval} minutes.`,
              sound: true,
            },
            trigger: reminderDate,
          });
          scheduledReminders.add(prayerName);
        }
      }
    }

    console.log('All notifications for the day successfully scheduled.');

  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
  }
};
