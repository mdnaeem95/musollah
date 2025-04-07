import { addDays, subDays, format } from 'date-fns';

export const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const goToPreviousDay = (date: Date) => subDays(date, 1);

export const goToNextDay = (date: Date) => addDays(date, 1);

export const isToday = (date: Date) =>
  date.toDateString() === new Date().toDateString();

export const getCurrentDayIndex = () => {
  const today = new Date();
  const dayIndex = today.getDay() - 1; // Monday = 0
  return dayIndex < 0 ? 6 : dayIndex;
};

export const getStorageFormattedDate = (date: Date): string =>
    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

export const isSameDate = (d1: Date, d2: Date): boolean => {
  const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return date1.getTime() === date2.getTime();
};
