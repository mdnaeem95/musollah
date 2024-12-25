import { useMemo } from "react";
import { differenceInDays, parseISO } from "date-fns";

export const useStreakCalculator = (prayerLogs: { [date: string]: any }) => {
  const calculateStreak = () => {
    console.log("Calculating streak with prayer Logs:", prayerLogs);

    const dates = Object.keys(prayerLogs)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    console.log("Sorted dates:", dates);

    let streak = 0;

    for (let i = 0; i < dates.length; i++) {
      const currentDate = parseISO(dates[i]);

      // Check if all prayers are logged for the current day
      const allPrayersLogged = Object.values(prayerLogs[dates[i]]).every((logged) => logged);

      if (!allPrayersLogged) {
        // Break the streak if any day's prayers are incomplete
        console.log(`Streak broken on ${dates[i]}: Not all prayers logged.`);
        break;
      }

      if (i > 0) {
        const prevDate = parseISO(dates[i - 1]);

        // Check for a gap in consecutive days
        if (differenceInDays(prevDate, currentDate) > 1) {
          console.log(`Streak broken on ${dates[i]}: Gap detected.`);
          break;
        }
      }

      // Increment the streak if all conditions are met
      streak++;
    }

    console.log("Calculated streak:", streak);
    return streak;
  };

  const currentStreak = useMemo(() => calculateStreak(), [prayerLogs]);
  const highestStreak = useMemo(() => Math.max(currentStreak, 0), [currentStreak]);

  console.log("Current streak:", currentStreak);

  return { current: currentStreak, highest: highestStreak };
};
