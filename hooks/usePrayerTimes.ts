import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getPrayerTimesInfo, extractNextDaysPrayerTimes } from "../utils/index";
import { scheduleNextDaysNotifications } from "../utils/notificationsScheduler";
import prayerBackgrounds from "../assets/prayerBackgroundImages/prayerBackgrounds";
import { useTheme } from "../context/ThemeContext";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store/store";
import { fetchMonthlyPrayerTimesFromFirebase } from "../api/prayers";

export const usePrayerTimes = (
  prayerTimes: Record<string, string>, // Explicitly define expected type
  reminderInterval: number
) => {
  const [currentPrayer, setCurrentPrayer] = useState<string>('');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{
    nextPrayer: string;
    timeUntilNextPrayer: string;
  } | null>(null);

  const { currentTheme } = useTheme();
  const mutedNotifications = useSelector(
    (state: RootState) => state.userPreferences.mutedNotifications
  );

  // Track last schedule to prevent multiple triggers
  const lastScheduleRef = useRef<number | null>(null);

  // Compute background image dynamically
  const backgroundImage = useMemo(() => {
    const themeKey = `${currentPrayer}${currentTheme.charAt(0).toUpperCase()}${currentTheme.slice(1)}`;
    //@ts-ignore
    return prayerBackgrounds[themeKey] || prayerBackgrounds.Subuh;
  }, [currentPrayer, currentTheme]);

  // Fetch and schedule notifications for the next 5 days
  const fetchAndScheduleNotifications = useCallback(async () => {
    try {
      console.log("🚀 Running fetchAndScheduleNotifications...");

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const numDays = 5;

      // Get monthly prayer times
      const monthlyPrayerTimes = await fetchMonthlyPrayerTimesFromFirebase(year, month);

      // Extract next 5 days' prayer times
      const nextDaysPrayerTimes = extractNextDaysPrayerTimes(monthlyPrayerTimes, numDays);
      console.log("🔍 Extracted Next 5 Days Prayer Times:", nextDaysPrayerTimes);

      await scheduleNextDaysNotifications(
        nextDaysPrayerTimes,
        reminderInterval,
        mutedNotifications
      );
    } catch (error) {
      console.error("❌ Error in fetchAndScheduleNotifications:", error);
    }
  }, [reminderInterval, mutedNotifications]);

  useEffect(() => {
    if (prayerTimes) {
      console.log("🔍 usePrayerTimes - Received Prayer Times:", prayerTimes);

      const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo(prayerTimes, new Date());
      setCurrentPrayer(currentPrayer);
      setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });

      console.log("📌 usePrayerTimes - Parsed Values:", {
        currentPrayer,
        nextPrayer,
        timeUntilNextPrayer,
      });
    }
  }, [prayerTimes]);

  // Trigger re-scheduling when settings change
  useEffect(() => {
    fetchAndScheduleNotifications();
  }, [fetchAndScheduleNotifications]);

  return { currentPrayer, nextPrayerInfo, fetchAndScheduleNotifications, backgroundImage };
};