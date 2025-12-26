import { useState, useCallback, useMemo, useEffect } from 'react';
import { addDays, subDays, format, isAfter, startOfDay } from 'date-fns';
import { prayerTimeKeys } from '../../api/services/prayer';
import { useQueryClient } from '@tanstack/react-query';
import { Coordinates } from '../../api/services/prayer/types/index';

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
  location?: Coordinates | null,
  initialDate: Date = new Date()
): UsePrayerDateNavigationReturn => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const queryClient = useQueryClient();
  
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

  // Prefetch adjacent dates
  useEffect(() => {
    if (!location) return;

    const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    
    // ✅ Prefetch using query keys
    queryClient.prefetchQuery({
      queryKey: prayerTimeKeys.date(location, prevDate),
    });
    queryClient.prefetchQuery({
      queryKey: prayerTimeKeys.date(location, nextDate),
    });
  }, [formattedDate, queryClient]);

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