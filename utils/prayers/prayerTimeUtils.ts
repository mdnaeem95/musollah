import { parse, isAfter, isBefore, format } from 'date-fns';
import { PrayerName } from '../../utils/types/prayer.types';
import { LOGGABLE_PRAYERS } from '../../constants/prayer.constants';

export const getPrayerTimesInfo = (
  prayers: Record<PrayerName, string>,
  currentTime: Date
) => {
  const prayerTimes = LOGGABLE_PRAYERS.map(name => {
    const timeStr = prayers[name];
    const [hours, minutes] = timeStr.split(':').map(Number);
    const time = new Date(currentTime);
    time.setHours(hours, minutes, 0, 0);
    
    return { name, time, timeStr };
  });

  // Find current and next prayer
  let currentPrayer = PrayerName.ISYAK;
  let nextPrayer = PrayerName.SUBUH;
  let timeUntilNextPrayer = '';

  for (let i = 0; i < prayerTimes.length; i++) {
    const current = prayerTimes[i];
    const next = prayerTimes[i + 1] || prayerTimes[0]; // Loop to first prayer

    if (isBefore(currentTime, current.time)) {
      // Before first prayer of the day
      currentPrayer = PrayerName.ISYAK;
      nextPrayer = current.name;
      timeUntilNextPrayer = getTimeUntil(current.time, currentTime);
      break;
    } else if (
      isAfter(currentTime, current.time) && 
      (i === prayerTimes.length - 1 || isBefore(currentTime, next.time))
    ) {
      currentPrayer = current.name;
      nextPrayer = next.name;
      
      // Handle next day's prayer
      const nextTime = i === prayerTimes.length - 1
        ? getNextDayPrayerTime(prayerTimes[0].time)
        : next.time;
        
      timeUntilNextPrayer = getTimeUntil(nextTime, currentTime);
      break;
    }
  }

  return { currentPrayer, nextPrayer, timeUntilNextPrayer };
};

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