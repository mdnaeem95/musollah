import { useQuery } from 'react-query';
import { PrayerTimes } from '../providers/PrayerTimesProvider';
import { getShortFormattedDate, formatIslamicDate, getPrayerTimesInfo } from '../utils/index';
import { fetchPrayerTimes, fetchIslamicDate } from '../api/prayers';

const useLoadPrayerTimes = () => {
  const fetchPrayerTimesData = async () => {
    const currentDate = new Date();
    const shortFormattedDate = getShortFormattedDate(currentDate);

    const prayerData = await fetchPrayerTimes();
    const { Fajr, Dhuhr, Asr, Maghrib, Isha } = prayerData.data.timings;
    const newPrayerTimes = { Fajr, Dhuhr, Asr, Maghrib, Isha };

    const islamicDateData = await fetchIslamicDate(shortFormattedDate);
    const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);

    const prayerInfo = getPrayerTimesInfo(newPrayerTimes, currentDate);

    return {
      prayerTimes: newPrayerTimes,
      islamicDate: formattedIslamicDate,
      currentPrayer: prayerInfo.currentPrayer,
      nextPrayerInfo: { nextPrayer: prayerInfo.nextPrayer, timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer },
    };
  };

  const { data, error, isLoading } = useQuery('prayerTimes', fetchPrayerTimesData);

  return {
    prayerTimes: data?.prayerTimes ?? null,
    islamicDate: data?.islamicDate ?? null,
    currentPrayer: data?.currentPrayer ?? null,
    nextPrayerInfo: data?.nextPrayerInfo ?? null,
    isLoading,
    error,
  };
};

export default useLoadPrayerTimes;
