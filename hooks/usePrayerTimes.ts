import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getPrayerTimesInfo, extractNextDaysPrayerTimes } from "../utils/index"
import { fetchMonthlyPrayerTimes } from "../api/prayers"
import { scheduleNextDaysNotifications } from "../utils/notificationsScheduler"
import prayerBackgrounds from "../assets/prayerBackgroundImages/prayerBackgrounds";
import { useTheme } from "../context/ThemeContext";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store/store";

export const usePrayerTimes = (
    prayerTimes: any,
    reminderInterval: number
) => {
    const [currentPrayer, setCurrentPrayer] = useState<string>('');
    const [nextPrayerInfo, setNextPrayerInfo] = useState<{
        nextPrayer: string;
        timeUntilNextPrayer: string;
    } | null>(null)

    const { currentTheme } = useTheme();
    const mutedNotifications = useSelector((state: RootState) => state.userPreferences.mutedNotifications);

      // Track last schedule to prevent multiple triggers
    const lastScheduleRef = useRef<number | null>(null);

    //@ts-ignore
    const backgroundImage = useMemo(() => {
        const themeKey = `${currentPrayer}${currentTheme.charAt(0).toUpperCase()}${currentTheme.slice(1)}`;
        //@ts-ignore
        return prayerBackgrounds[themeKey] || prayerBackgrounds.Subuh; 
    }, [currentPrayer, currentTheme]);

    const fetchAndScheduleNotifications = useCallback(async () => {
        const now = Date.now();
        const MIN_SCHEDULE_INTERVAL = 5000; // 5 seconds (adjust as needed)
    
        // Prevent multiple schedules within the debounce interval
        if (lastScheduleRef.current && now - lastScheduleRef.current < MIN_SCHEDULE_INTERVAL) {
        //console.log("Skipping redundant notification scheduling...");
          return;
        }
    
        lastScheduleRef.current = now;
        
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const numDays = 5;

            // get monthly prayer times (cached or fetched)
            const monthlyPrayerTimes = await fetchMonthlyPrayerTimes(year, month);

            // extract prayer times for next 5 days
            const nextDaysPrayerTimes = extractNextDaysPrayerTimes(monthlyPrayerTimes, numDays);

            // schedule notifications for the extracted days
            // console.log('Scheduling notifications for:', nextDaysPrayerTimes, 'with interval:', reminderInterval);
            await scheduleNextDaysNotifications(nextDaysPrayerTimes, reminderInterval, mutedNotifications);
        } catch (error) {
            console.error('Error fetching or scheduling notifications: ', error);
        }
    }, [reminderInterval, mutedNotifications]);

    useEffect(() => {
        if (prayerTimes) {
            const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo(prayerTimes, new Date());
            setCurrentPrayer(currentPrayer);
            setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });
        }
    }, [prayerTimes]);

    // Trigger re-scheduling immediately when settings change
    useEffect(() => {
        fetchAndScheduleNotifications();
    }, [fetchAndScheduleNotifications]);

    return { currentPrayer, nextPrayerInfo, fetchAndScheduleNotifications, backgroundImage }
}