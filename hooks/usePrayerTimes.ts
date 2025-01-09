import { useEffect, useMemo, useState, useCallback } from "react";
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
    const mutedNotifications = useSelector((state: RootState) => state.userPreferences.mutedNotifications)

    //@ts-ignore
    const backgroundImage = useMemo(() => {
        const themeKey = `${currentPrayer}${currentTheme.charAt(0).toUpperCase()}${currentTheme.slice(1)}`;
        //@ts-ignore
        return prayerBackgrounds[themeKey] || prayerBackgrounds.Subuh; 
    }, [currentPrayer, currentTheme]);

    const fetchAndScheduleNotifications = useCallback(async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const numDays = 5;

            // get monthly prayer times (cached or fetched)
            const monthlyPrayerTimes = await fetchMonthlyPrayerTimes(year, month);
            console.log('Monthly Prayer Times:', monthlyPrayerTimes);

            // extract prayer times for next 5 days
            const nextDaysPrayerTimes = extractNextDaysPrayerTimes(monthlyPrayerTimes, numDays);
            console.log('Next 5 days prayer times: ', nextDaysPrayerTimes)

            // schedule notifications for the extracted days
            console.log('Scheduling notifications for:', nextDaysPrayerTimes, 'with interval:', reminderInterval);
            await scheduleNextDaysNotifications(nextDaysPrayerTimes, reminderInterval, mutedNotifications);
        } catch (error) {
            console.error('Error fetching or scheduling notifications: ', error);
        }
    }, [reminderInterval]);

    useEffect(() => {
        if (prayerTimes) {
            const { currentPrayer, nextPrayer, timeUntilNextPrayer } = getPrayerTimesInfo(prayerTimes, new Date());
            setCurrentPrayer(currentPrayer);
            setNextPrayerInfo({ nextPrayer, timeUntilNextPrayer });
        }
    }, [prayerTimes]);

    return { currentPrayer, nextPrayerInfo, fetchAndScheduleNotifications, backgroundImage }
}