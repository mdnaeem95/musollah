import { useMemo } from "react";
import { differenceInDays } from 'date-fns';

export const useStreakCalculator = (prayerLogs: { [date: string]: any}) => {
    const calculateStreak = () => {
        const dates = Object.keys(prayerLogs).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
        let streak = 0;

        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            if (differenceInDays(new Date(), new Date(date)) !== streak) break;

            const allPrayersLogged = Object.values(prayerLogs[date]).every((logged) => logged);

            if (allPrayersLogged) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    };

    const current = useMemo(() => calculateStreak(), [prayerLogs]);
    const highest = useMemo(() => Math.max(current, 0), [current]);

    return { current, highest };
}