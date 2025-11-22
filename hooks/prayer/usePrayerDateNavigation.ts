import { useState, useCallback, useMemo } from 'react';
import { addDays, subDays, format, isAfter, startOfDay } from 'date-fns';

interface UsePrayerDateNavigationReturn {
  selectedDate: Date;
  formattedDate: string; // ISO format: YYYY-MM-DD
  displayDate: string;   // Display format: DD MMM YYYY
  canGoNext: boolean;
  canGoPrev: boolean;
  goToNextDay: () => void;
  goToPrevDay: () => void;
  goToToday: () => void;
  setDate: (date: Date) => void;
}

/**
 * Hook for managing prayer date navigation
 * 
 * ✅ FIXED: Uses consistent ISO date format (YYYY-MM-DD) for all queries
 */
export const usePrayerDateNavigation = (
  initialDate: Date = new Date()
): UsePrayerDateNavigationReturn => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  // Calculate boundaries
  const tomorrow = useMemo(() => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return startOfDay(tom);
  }, []);

  // ✅ Format date for queries (ISO format for consistency)
  const formattedDate = useMemo(
    () => format(selectedDate, 'yyyy-MM-dd'), // ISO format
    [selectedDate]
  );

  // ✅ Format date for display
  const displayDate = useMemo(
    () => format(selectedDate, 'dd MMM yyyy'),
    [selectedDate]
  );

  // Check if can navigate
  const canGoNext = useMemo(
    () => selectedDate < tomorrow,
    [selectedDate, tomorrow]
  );

  const canGoPrev = useMemo(() => true, []);

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
    formattedDate,   // ISO format for queries
    displayDate,     // Display format for UI
    canGoNext,
    canGoPrev,
    goToNextDay,
    goToPrevDay,
    goToToday,
    setDate,
  };
};