import { useState, useCallback, useMemo } from 'react';
import { addDays, subDays, format, isAfter, startOfDay } from 'date-fns';
import { DATE_FORMATS } from '../../constants/prayer.constants';

interface UsePrayerDateNavigationReturn {
  selectedDate: Date;
  formattedDate: string;
  canGoNext: boolean;
  canGoPrev: boolean;
  goToNextDay: () => void;
  goToPrevDay: () => void;
  goToToday: () => void;
  setDate: (date: Date) => void;
}

/**
 * Hook for managing prayer date navigation
 * Implements date state and navigation logic
 * 
 * Features:
 * - Navigate previous/next day
 * - Prevent future dates beyond tomorrow
 * - Jump to today
 * - Formatted date output
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

  // Format date for API/Firebase
  const formattedDate = useMemo(
    () => format(selectedDate, DATE_FORMATS.FIREBASE),
    [selectedDate]
  );

  // Check if can navigate
  const canGoNext = useMemo(
    () => selectedDate < tomorrow,
    [selectedDate, tomorrow]
  );

  const canGoPrev = useMemo(
    () => true, // Can always go to past dates
    []
  );

  // Navigation handlers
  const goToNextDay = useCallback(() => {
    setSelectedDate(current => {
      const next = addDays(current, 1);
      // Don't allow future dates beyond tomorrow
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
    // Validate date is not too far in future
    if (isAfter(date, tomorrow)) {
      console.warn('Cannot set date beyond tomorrow');
      return;
    }
    setSelectedDate(date);
  }, [tomorrow]);

  return {
    selectedDate,
    formattedDate,
    canGoNext,
    canGoPrev,
    goToNextDay,
    goToPrevDay,
    goToToday,
    setDate,
  };
};