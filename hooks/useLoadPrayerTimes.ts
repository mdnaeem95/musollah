import { useState, useEffect, useContext, useCallback } from 'react';
import { PrayerTimes } from '../providers/PrayerTimesProvider';
import { getShortFormattedDate, formatIslamicDate, getPrayerTimesInfo } from '../utils/index';
import { fetchPrayerTimes, fetchIslamicDate } from '../api/prayers'

const useLoadPrayerTimes = () => {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [islamicDate, setIslamicDate] = useState<string | null>(null);
    const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
    const [nextPrayerInfo, setNextPrayerInfo] = useState<{ nextPrayer: string, timeUntilNextPrayer: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updatePrayerTimes = async () => {
      try {
        const currentDate = new Date();
        const shortFormattedDate = getShortFormattedDate(currentDate);
        
        const prayerData = await fetchPrayerTimes();
        const { Fajr, Dhuhr, Asr, Maghrib, Isha } = prayerData.data.timings;
        const newPrayerTimes = { Fajr, Dhuhr, Asr, Maghrib, Isha };
        setPrayerTimes((prev) => (JSON.stringify(prev) !== JSON.stringify(newPrayerTimes) ? newPrayerTimes : prev));
  
        const islamicDateData = await fetchIslamicDate(shortFormattedDate);
        const formattedIslamicDate = formatIslamicDate(islamicDateData.data.hijri.date);
        setIslamicDate((prev) => (prev !== formattedIslamicDate ? formattedIslamicDate : prev));
  
        const prayerInfo = getPrayerTimesInfo(newPrayerTimes, currentDate);
        setCurrentPrayer(prayerInfo.currentPrayer);
        setNextPrayerInfo({ nextPrayer: prayerInfo.nextPrayer, timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer });
      } catch (error) {
        console.error('Failed to fetch prayer times or Islamic date', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    useEffect(() => {
      updatePrayerTimes();
    }, []);
  
    useEffect(() => {
      const interval = setInterval(() => {
        if (prayerTimes) {
          const prayerInfo = getPrayerTimesInfo(prayerTimes, new Date());
          setCurrentPrayer(prayerInfo.currentPrayer);
          setNextPrayerInfo({ nextPrayer: prayerInfo.nextPrayer, timeUntilNextPrayer: prayerInfo.timeUntilNextPrayer });
        }
      }, 10); // Update every minute
  
      return () => clearInterval(interval);
    }, [prayerTimes]);

    return { prayerTimes, islamicDate, currentPrayer, nextPrayerInfo, isLoading }
}

export default useLoadPrayerTimes