import React, { createContext, ReactNode, useEffect, useState } from 'react';
import useLoadPrayerTimes from '../hooks/useLoadPrayerTimes';

export interface PrayerTimes {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  }

interface PrayerTimesContextProps {
    prayerTimes: PrayerTimes | null;
    islamicDate: string | null;
    currentPrayer: string | null;
    nextPrayerInfo: { nextPrayer: string; timeUntilNextPrayer: string } | null;
    isLoading: boolean;
  }

const defaultValue: PrayerTimesContextProps = {
    prayerTimes: { Fajr: '', Dhuhr: '', Asr: '', Maghrib: '', Isha: '' },
    islamicDate: '',
    currentPrayer: '',
    nextPrayerInfo: { nextPrayer: '', timeUntilNextPrayer: '' },
    isLoading: true,
}

const PrayerTimeContext = createContext<PrayerTimesContextProps>(defaultValue)

const PrayerTimesProvider = ({ children }: { children: ReactNode }) => {
    const { prayerTimes, islamicDate, currentPrayer, nextPrayerInfo, isLoading: loadLoading } = useLoadPrayerTimes();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('Loading prayer times...');
        if (!loadLoading) {
          setIsLoading(false);
          console.log('Prayer times loaded.');
        }
      }, [loadLoading]);

    return (
        <PrayerTimeContext.Provider value={{ prayerTimes, islamicDate, currentPrayer, nextPrayerInfo, isLoading }}>
            {children}
        </PrayerTimeContext.Provider>
    )
}

export { PrayerTimeContext, PrayerTimesProvider }