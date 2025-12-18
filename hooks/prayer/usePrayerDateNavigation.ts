import { useState, useCallback, useMemo, useEffect } from 'react';
import { addDays, subDays, format, isAfter, startOfDay } from 'date-fns';
import { usePrefetchPrayerTimes } from './usePrayerQuery';

interface UsePrayerDateNavigationReturn {
  selectedDate: Date;
  formattedDate: string;
  displayDate: string;
  canGoNext: boolean;
  canGoPrev: boolean;
  goToNextDay: () => void;
  goToPrevDay: () => void;
  goToToday: () => void;
  setDate: (date: Date) => void;
}

export const usePrayerDateNavigation = (
  initialDate: Date = new Date()
): UsePrayerDateNavigationReturn => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const { prefetchDate } = usePrefetchPrayerTimes();

  // Calculate boundaries
  const tomorrow = useMemo(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return startOfDay(tom);
  }, []);

  const formattedDate = useMemo(
    () => format(selectedDate, 'yyyy-MM-dd'),
    [selectedDate]
  );

  const displayDate = useMemo(
    () => format(selectedDate, 'dd MMM yyyy'),
    [selectedDate]
  );

  const canGoNext = useMemo(
    () => selectedDate < tomorrow,
    [selectedDate, tomorrow]
  );

  const canGoPrev = useMemo(() => true, []);

  // ✅ NEW: Prefetch adjacent dates when selected date changes
  useEffect(() => {
    const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    
    // Prefetch previous and next dates silently in background
    prefetchDate(prevDate).catch(() => {});
    prefetchDate(nextDate).catch(() => {});
    
    console.log(`🔮 Prefetched adjacent dates: ${prevDate}, ${nextDate}`);
  }, [formattedDate, prefetchDate]);

  // Navigation handlers
  const goToNextDay = useCallback(() => {
    setSelectedDate(current => {
      const next = addDays(current, 1);
      return isAfter(next, tomorrow) ? current : next;
    });
  }, [tomorrow]);

  const goToPrevDay = useCallback(() => {
    setSelectedDate(current => subDays(current, 1));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const setDate = useCallback((date: Date) => {
    if (isAfter(date, tomorrow)) {
      console.warn('Cannot set date beyond tomorrow');
      return;
    }
    setSelectedDate(date);
  }, [tomorrow]);

  return {
    selectedDate,
    formattedDate,
    displayDate,
    canGoNext,
    canGoPrev,
    goToNextDay,
    goToPrevDay,
    goToToday,
    setDate,
  };
};