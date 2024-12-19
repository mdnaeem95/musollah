import { useEffect, useMemo, useState, useCallback } from "react";
import { getPrayerTimesInfo, extractNextDaysPrayerTimes } from "../utils/index"
import { fetchMonthlyPrayerTimes } from "../api/prayers"
import { scheduleNextDaysNotifications } from "../utils/notificationsScheduler"
import prayerBackgrounds from "../assets/prayerBackgroundImages/prayerBackgrounds";

export const usePrayerTimes = (
    prayerTimes: any,
    reminderInterval: number
) => {
    const [currentPrayer, setCurrentPrayer] = useState<string>('');
    const [nextPrayerInfo, setNextPrayerInfo] = useState<{
        nextPrayer: string;
        timeUntilNextPrayer: string;
    } | null>(null)

    //@ts-ignore
    const backgroundImage = useMemo(() => prayerBackgrounds[currentPrayer] || prayerBackgrounds.Subuh, [currentPrayer]);

    const fetchAndScheduleNotifications = useCallback(async () => {
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
            await scheduleNextDaysNotifications(nextDaysPrayerTimes, reminderInterval);
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