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
    const { userLocation, errorMsg, isLoading } = fetchUserLocation();
    
    return (
        <LocationContext.Provider value={{ userLocation, errorMsg, isLoading }}>
            {children}
        </LocationContext.Provider>
    );
};

export { LocationProvider, LocationContext };