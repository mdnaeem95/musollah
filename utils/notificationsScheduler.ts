import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { RootState, store } from "../redux/store/store";
import { parse } from "date-fns";

const SCHEDULED_NOTIFICATIONS_KEY = "scheduled_notifications";

const adhanOptions: Record<string, any> = {
  "Ahmad Al-Nafees": require("../assets/adhans/ahmadAlNafees.mp3"),
  "Mishary Rashid Alafasy": require("../assets/adhans/mishary.mp3"),
  None: null,
};

export const scheduleNextDaysNotifications = async (
  prayerTimesForDays: Record<string, any>,
  reminderInterval: number,
  mutedNotifications: string[]
) => {
  try {
    console.log("🚀 Starting notification scheduling...");
    const now = new Date();

    // Retrieve previously scheduled notifications from AsyncStorage
    const storedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const scheduledDays = storedNotifications ? JSON.parse(storedNotifications) : {};

    // Get current user preference for Adhan sound
    const state: RootState = store.getState();
    const selectedAdhan = state.userPreferences.selectedAdhan;
    const adhanAudio = adhanOptions[selectedAdhan] || null;

    // Get all currently scheduled notifications
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();

    let notificationsChanged = false; // Track changes for logging

    for (const [dateString, prayerTimes] of Object.entries(prayerTimesForDays)) {
      try {
        // Convert `d/M/yyyy` string into a proper Date object
        const parsedDate = parse(dateString, "d/M/yyyy", new Date());

        for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
          try {
            // Extract hour & minute
            const [hourStr, minuteStr] = (prayerTime as string).split(":");
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            console.log(`🕒 Extracted Time for ${prayerName}:`, {
              original: prayerTime,
              hour,
              minute,
            });

            // 🔵 Construct the full Date object with correct time
            const prayerDate = new Date(parsedDate);
            prayerDate.setHours(hour, minute, 0, 0);

            console.log(`📅 Parsed Prayer Time for ${prayerName}:`, {
              prayerName,
              date: dateString,
              expectedPrayerDate: prayerDate.toLocaleString(),
              timestamp: prayerDate.getTime(),
            });

            // Skip past prayer times
            if (prayerDate <= now) {
              console.log(`⏩ Skipping past prayer time for ${prayerName} on ${dateString}.`);
              continue;
            }

            // Convert to seconds timestamp for accurate comparison
            const prayerTimestampSeconds = Math.floor(prayerDate.getTime() / 1000);

            // **🚨 Prevent duplicate notifications** (within ±1 min threshold)
            const isDuplicate = allScheduled.some((notif) => {
              if (
                typeof notif.trigger === "object" &&
                "timestamp" in notif.trigger!! &&
                typeof notif.trigger.timestamp === "number"
              ) {
                const scheduledTime = new Date(notif.trigger.timestamp).getTime();
                return (
                  notif.content.title === `Time for ${prayerName}` &&
                  Math.abs(scheduledTime - prayerDate.getTime()) < 60000 // 1-minute threshold
                );
              }
              return false;
            });           

            if (isDuplicate) {
              console.log(`🔍 True duplicate detected: Skipping ${prayerName} at ${prayerDate.toLocaleString()}`);
              continue;
            }

            console.log(`📅 Scheduling ${prayerName} notification for ${dateString} at ${prayerDate}.`);
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: `Time for ${prayerName}`,
                body: `It's time for ${prayerName} prayer.`,
                sound: adhanAudio,
              },
              trigger: new Date(prayerDate),
            });

            // Store notification time
            if (!scheduledDays[dateString]) scheduledDays[dateString] = {};
            scheduledDays[dateString][prayerName] = prayerDate.getTime();
            notificationsChanged = true;

            console.log(`✅ Scheduled ${prayerName} at`, prayerDate.toLocaleString());
          } catch (error) {
            console.error(`❌ Error scheduling ${prayerName} notification:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing prayer times for ${dateString}:`, error);
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
    const allUpdatedNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log("📜 Currently Scheduled Notifications:", allUpdatedNotifications);
  } catch (error) {
    console.error("🚨 Error scheduling notifications:", error);
  }
};