import * as Location from 'expo-location';
import React from 'react';
import { ReactNode, createContext, useEffect, useState } from 'react';
import fetchUserLocation from '../hooks/fetchUserLocation'

interface LocationContextProps {
    userLocation: Location.LocationObject | null;
    errorMsg: string | null;
    isLoading: boolean;
}

const defaultValue: LocationContextProps = {
    userLocation: null,
    errorMsg: null,
    isLoading: true
}

const LocationContext = createContext<LocationContextProps>(defaultValue);

const LocationProvider = ({ children }: { children: ReactNode }) => {
    const { userLocation, errorMsg, isLoading: fetchLoading } = fetchUserLocation();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      console.log('Loading user location...');
      if (!fetchLoading) {
        setIsLoading(false);
        console.log('User location loaded.');
      }
    }, [fetchLoading]);
    
    return (
        <LocationContext.Provider value={{ userLocation, errorMsg, isLoading }}>
            {children}
        </LocationContext.Provider>
    );
};

export { LocationProvider, LocationContext };