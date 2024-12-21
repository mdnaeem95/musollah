import { useMemo } from "react";
import { differenceInDays } from 'date-fns';

export const useStreakCalculator = (prayerLogs: { [date: string]: any}) => {
    const calculateStreak = () => {
        const dates = Object.keys(prayerLogs)
          .filter((date) => Object.values(prayerLogs[date]).every((logged) => logged)) // Only fully logged days
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort dates descending
      
        console.log('Valid streak dates:', dates);
      
        let streak = 0;
        let previousDate = null;
      
        for (let i = 0; i < dates.length; i++) {
          const currentDate = new Date(dates[i]);
      
          if (i === 0) {
            previousDate = currentDate; // Set initial previous date
            streak++;
          } else {
            const diff = differenceInDays(previousDate!, currentDate);
            if (diff === 1) {
              streak++;
              previousDate = currentDate; // Update previous date
            } else {
              break; // Streak is broken
            }
          }
        }
      
        console.log('Calculated streak:', streak);
        return streak;
      };
      

    const current = useMemo(() => calculateStreak(), [prayerLogs]);
    const highest = useMemo(() => Math.max(current, 0), [current]);

    return { current, highest };
}