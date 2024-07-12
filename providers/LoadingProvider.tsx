import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { LocationContext } from './LocationProvider';
import { LocationDataContext } from './LocationDataProvider'
import { PrayerTimeContext } from './PrayerTimesProvider'
import { QuranDataContext } from './QuranDataProvider'

const LoadingContext = createContext<{ isAppReady: boolean }>({ isAppReady: false })

const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isAppReady, setIsAppReady] = useState(false);
    const { isLoading: isUserLocationLoading } = useContext(LocationContext);
    const { isLoading: isLocationDataLoading } = useContext(LocationDataContext);
    const { isLoading: isPrayerTimesLoading } = useContext(PrayerTimeContext);
    const { isLoading: isQuranDataLoading } = useContext(QuranDataContext);

    useEffect(() => {
        const prepare = async () => {
            try {
                console.log('Starting data loading check...');
                while (isLocationDataLoading || isPrayerTimesLoading || isQuranDataLoading || isUserLocationLoading) {
                    console.log('Loading states:', {
                        isLocationDataLoading,
                        isPrayerTimesLoading,
                        isQuranDataLoading,
                        isUserLocationLoading,
                      });
                }
            } catch (error) {
                console.warn(error);
            } finally {
                setIsAppReady(true);
                console.log('App is ready');
            }
        }

        prepare();
    }, [isLocationDataLoading, isPrayerTimesLoading, isQuranDataLoading, isUserLocationLoading])

    return (
        <LoadingContext.Provider value={{ isAppReady }}>
            {children}
        </LoadingContext.Provider>
    )
}

export { LoadingContext, LoadingProvider }