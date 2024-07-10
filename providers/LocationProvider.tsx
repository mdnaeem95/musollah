import * as Location from 'expo-location';
import React from 'react';
import { ReactNode, createContext, useEffect, useState } from 'react';

interface LocationContextProps {
    userLocation: Location.LocationObject | null;
    errorMsg: string | null;
}

const defaultValue: LocationContextProps = {
    userLocation: null,
    errorMsg: null,
}

const LocationContext = createContext<LocationContextProps>(defaultValue);

const LocationProvider = ({ children }: { children: ReactNode }) => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            };

            let userLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest
            });
            setUserLocation(userLocation);

            Location.watchPositionAsync({
                accuracy: Location.Accuracy.High,
                timeInterval: 10000,
                distanceInterval: 10,
            }, (newLocation) => {
                setUserLocation(newLocation);
            });
        })();
    }, []);

    return (
        <LocationContext.Provider value={{ userLocation, errorMsg }}>
            {children}
        </LocationContext.Provider>
    );
};

export { LocationProvider, LocationContext };