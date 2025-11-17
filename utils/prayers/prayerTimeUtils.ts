import { isAfter } from 'date-fns';
import { PrayerName } from '../../utils/types/prayer.types';

const getTimeUntil = (targetTime: Date, currentTime: Date): string => {
  const diffMs = targetTime.getTime() - currentTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getNextDayPrayerTime = (time: Date): Date => {
  const nextDay = new Date(time);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
};

export const isPrayerAvailable = (
  prayerName: PrayerName,
  prayerTime: string,
  currentTime: Date
): boolean => {
  const [hours, minutes] = prayerTime.split(':').map(Number);
  const prayerDate = new Date(currentTime);
  prayerDate.setHours(hours, minutes, 0, 0);
  
  return isAfter(currentTime, prayerDate);
};