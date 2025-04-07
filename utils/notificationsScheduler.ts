import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { RootState, store } from "../redux/store/store";
import { parse, isBefore, subMinutes, format } from "date-fns";

const SCHEDULED_NOTIFICATIONS_KEY = "scheduled_notifications";

const adhanOptions: Record<string, any> = {
  "Ahmad Al-Nafees": require("../assets/adhans/ahmadAlNafees.mp3"),
  "Mishary Rashid Alafasy": require("../assets/adhans/mishary.mp3"),
  None: null,
};

/**
 * Schedule prayer notifications based on user preferences.
 */
export const scheduleNextDaysNotifications = async (
  prayerTimesForDays: Record<string, any>,
  reminderInterval: number
) => {
  try {
    // console.log("🚀 Starting notification scheduling with updated settings...");

    // **Step 1: Retrieve User Preferences**
    const state: RootState = store.getState();
    const selectedAdhan = state.userPreferences.selectedAdhan;
    const mutedNotifications = state.userPreferences.mutedNotifications || [];
    const prePrayerReminder = state.userPreferences.reminderInterval || 0;

    // console.log("🔄 User Settings:", {
    //   selectedAdhan,
    //   mutedNotifications,
    //   prePrayerReminder,
    // });

    // **Step 2: Clear Existing Notifications**
    await Notifications.cancelAllScheduledNotificationsAsync();
    // console.log("🗑 Cleared all previously scheduled notifications.");

    const now = new Date();

    // **Step 3: Retrieve Stored Notifications (For AsyncStorage Tracking)**
    const storedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    let scheduledDays = storedNotifications ? JSON.parse(storedNotifications) : {};

    let notificationsChanged = false;

    for (const [dateString, prayerTimes] of Object.entries(prayerTimesForDays)) {
      try {
        const parsedDate = parse(dateString, "d/M/yyyy", new Date());

        for (const [prayerName, prayerTime] of Object.entries(prayerTimes)) {
          try {
            // **Skip Muted Prayers**
            if (mutedNotifications.includes(prayerName)) {
              // console.log(`⏩ Skipping ${prayerName} due to user preferences.`);
              continue;
            }

            // **Extract Hour & Minute**
            const [hourStr, minuteStr] = (prayerTime as string).split(":");
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            // **Construct Full Date Object**
            const prayerDate = new Date(parsedDate);
            prayerDate.setHours(hour, minute, 0, 0);
            const formattedPrayerDate = format(prayerDate, "yyyy-MM-dd HH:mm:ss");

            // **Skip Past Prayer Times**
            if (isBefore(prayerDate, now)) {
              // console.log(`⏩ Skipping past prayer time for ${prayerName} on ${formattedPrayerDate}.`);
              continue;
            }

            // **Set Adhan Sound**
            const adhanAudio = adhanOptions[selectedAdhan] || null;

            // **Handle Syuruk with a Different Message**
            let notificationTitle = `Time for ${prayerName}`;
            let notificationBody = `It's time for ${prayerName} prayer.`;
            if (prayerName.toLowerCase() === "syuruk") {
              notificationTitle = "🌅 A New Day Begins";
              notificationBody = "Bismillah! May your day be filled with barakah and goodness.";
            }

            // **Schedule Pre-Prayer Reminder if Enabled**
            if (prePrayerReminder > 0) {
              const reminderTime = subMinutes(prayerDate, prePrayerReminder);
              if (isBefore(now, reminderTime)) {
                // console.log(`📅 Scheduling ${prayerName} pre-prayer reminder for ${format(reminderTime, "yyyy-MM-dd HH:mm:ss")}`);
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: `⏳ Reminder: ${prayerName} Soon`,
                    body: `Your prayer time is in ${prePrayerReminder} minutes.`,
                    //@ts-ignore
                    sound: null, // No adhan for reminder
                  },
                  trigger: new Date(reminderTime),
                });
                notificationsChanged = true;
              }
            }

            // **Schedule Actual Prayer Notification**
            // console.log(`📅 Scheduling ${prayerName} notification for ${formattedPrayerDate}.`);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: notificationTitle,
                body: notificationBody,
                sound: prayerName.toLowerCase() === "syuruk" ? null : adhanAudio,
              },
              trigger: new Date(prayerDate),
            });

            // **Update AsyncStorage**
            if (!scheduledDays[dateString]) scheduledDays[dateString] = {};
            scheduledDays[dateString][prayerName] = prayerDate.getTime();
            notificationsChanged = true;

            // console.log(`✅ Scheduled ${prayerName} at ${formattedPrayerDate}`);
          } catch (error) {
            console.error(`❌ Error scheduling ${prayerName} notification:`, error);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing prayer times for ${dateString}:`, error);
      }
    }

    // **Step 4: Save Updated Notifications**
    if (notificationsChanged) {
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledDays));
      // console.log(`✅ Updated scheduled notifications saved.`);
    } else {
      // console.log(`🔍 No changes detected. Notifications remain the same.`);
    }

    // **Final Log: Verify All Scheduled Notifications**
    const allUpdatedNotifications = await Notifications.getAllScheduledNotificationsAsync();
    // console.log("📜 Currently Scheduled Notifications:", allUpdatedNotifications);
  } catch (error) {
    // console.error("🚨 Error scheduling notifications:", error);
  }
};