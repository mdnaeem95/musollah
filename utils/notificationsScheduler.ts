import * as Notifications from 'expo-notifications';
import { PrayerTimes } from './types';

export const schedulePrayerNotifications = async (
  prayerTimes: PrayerTimes, 
  reminderInterval: number,
  scheduledReminders: Set<string>
) => {
  try {
    // Cancel any existing notifications to avoid duplicates
    console.log('Cancelling any existing notifications.');
    await Notifications.cancelAllScheduledNotificationsAsync();

    const today = new Date();
    console.log('Scheduling notifications for the following prayer times:', prayerTimes);

    for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
      const [hour, minute] = prayerTime.split(':').map(Number);
      const prayerDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

      // Schedule a notification at the exact prayer time
      if (prayerDate > today) {
        console.log(`Scheduling exact notification for ${prayerName} at ${prayerDate}`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time for ${prayerName}`,
            body: `It's time for ${prayerName} prayer.`,
            sound: true,
          },
          trigger: prayerDate,
        });
        console.log(`${prayerName} notification scheduled for ${prayerDate}`);
      }
      
      // Schedule an additional notification before the prayer based on reminderInterval
      if (reminderInterval > 0 && !scheduledReminders.has(prayerName)) {
        const reminderDate = new Date(prayerDate.getTime() - reminderInterval * 60 * 1000);
        if (reminderDate > today) {
          console.log(`Scheduling reminder notification for ${prayerName} ${reminderInterval} minutes before, at ${reminderDate}`);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${reminderInterval} minutes until ${prayerName}`,
              body: `Get ready for ${prayerName} prayer in ${reminderInterval} minutes.`,
              sound: true,
            },
            trigger: reminderDate
          });
          console.log(`${prayerName} reminder notification scheduled for ${reminderDate}`);
          scheduledReminders.add(prayerName);
        }
      }
    }

    console.log("All notifications scheduled for the day.");

  } catch (error) {
    console.error('Error scheduling prayer notifications:', error);
  }
};
