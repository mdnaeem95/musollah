import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { store } from '../redux/store/store';
import { schedulePrayerNotifications } from './notificationsScheduler';

// Task name
const PRAYER_NOTIFICATION_TASK = 'PRAYER_NOTIFICATION_TASK';

// Helper function to calculate seconds until midnight
const calculateSecondsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Set to midnight of the next day
  const secondsUntilMidnight = (midnight.getTime() - now.getTime()) / 1000;
  return Math.max(secondsUntilMidnight, 60); // Ensure at least 1 minute
};

// Define the background task
TaskManager.defineTask(PRAYER_NOTIFICATION_TASK, async () => {
  try {
    console.log('Background task started:', PRAYER_NOTIFICATION_TASK);

    const state = store.getState();
    const { prayerTimes } = state.prayer;
    const { reminderInterval } = state.userPreferences;

    if (prayerTimes) {
      // Call the notification scheduling function with Redux state data
      console.log('Prayer times and reminder interval found:', prayerTimes, reminderInterval);
      await schedulePrayerNotifications(prayerTimes, reminderInterval, new Set());
      console.log('Notifications scheduled successfully.');
      await registerBackgroundFetch();
      return "NewData"
    } else {
      return "NoData";
    }
  } catch (error) {
    console.error('Error in PRAYER_NOTIFICATION_TASK:', error);
    return "Failed";
  }
});

// Register the background fetch task
export const registerBackgroundFetch = async () => {
  try {
    const secondsUntilMidnight = calculateSecondsUntilMidnight();
    await BackgroundFetch.registerTaskAsync(PRAYER_NOTIFICATION_TASK, {
      minimumInterval: secondsUntilMidnight,
      stopOnTerminate: false, // iOS
      startOnBoot: true, // Android
    });
    console.log('Background fetch task registered successfully');
  } catch (error) {
    console.error('Error registering background fetch task:', error);
  }
};