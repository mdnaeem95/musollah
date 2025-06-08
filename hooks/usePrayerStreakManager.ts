import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { isYesterday, isToday, differenceInDays } from 'date-fns';
import { AppDispatch } from '../redux/store/store';
import { fetchPrayerStats } from '../redux/slices/prayerSlice';
import { PrayerLog } from '../utils/types/prayer.types';
import { LOGGABLE_PRAYERS } from '../constants/prayer.constants';

export const usePrayerStreakManager = (
  weeklyLogs: Record<string, PrayerLog>,
  userId: string | null
) => {
  const dispatch = useDispatch<AppDispatch>();

  const streakInfo = useMemo(() => {
    if (!userId || Object.keys(weeklyLogs).length === 0) {
      return { current: 0, longest: 0, todayCompleted: false };
    }

    // Sort logs by date
    const sortedDates = Object.keys(weeklyLogs).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    sortedDates.forEach(dateStr => {
      const log = weeklyLogs[dateStr];
      const date = new Date(dateStr);
      
      // Count completed prayers for the day
      const completedCount = LOGGABLE_PRAYERS.filter(
        prayer => log.prayers[prayer] === true
      ).length;
      
      const isFullyCompleted = completedCount === LOGGABLE_PRAYERS.length;

      if (isFullyCompleted) {
        if (lastDate === null || differenceInDays(date, lastDate) === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
        
        if (isToday(date) || isYesterday(date)) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
        if (isToday(date)) {
          currentStreak = 0;
        }
      }

      lastDate = date;
    });

    const todayLog = weeklyLogs[new Date().toISOString().split('T')[0]];
    const todayCompleted = todayLog 
      ? LOGGABLE_PRAYERS.every(prayer => todayLog.prayers[prayer] === true)
      : false;

    return { current: currentStreak, longest: longestStreak, todayCompleted };
  }, [weeklyLogs, userId]);

  // Update stats in Redux
  useEffect(() => {
    if (userId) {
      dispatch(fetchPrayerStats(userId));
    }
  }, [dispatch, userId, weeklyLogs]);

  return streakInfo;
};