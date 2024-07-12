import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { LocationContext } from './LocationProvider';
import { LocationDataContext } from './LocationDataProvider'
import { PrayerTimeContext } from './PrayerTimesProvider'
import { QuranDataContext } from './QuranDataProvider'

const LoadingContext = createContext<{ isAppReady: boolean }>({ isAppReady: false })

const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isAppReady, setIsAppReady] = useState(false);
    const { isLoading: isUserLocationLoading } = useContext(LocationContext);
    const { loading: isLocationDataLoading } = useContext(LocationDataContext);
    const { isLoading: isPrayerTimesLoading } = useContext(PrayerTimeContext);
    const { loading: isQuranDataLoading } = useContext(QuranDataContext);

    useEffect(() => {
        const prepare = async () => {
            try {
                SplashScreen.preventAutoHideAsync();

                while (isLocationDataLoading || isPrayerTimesLoading || isQuranDataLoading || isUserLocationLoading) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.warn(error);
            } finally {
                setIsAppReady(true);
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