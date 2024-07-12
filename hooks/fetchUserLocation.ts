import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const fetchUserLocation = () => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    useEffect(() => {
        (async () => {
            try {

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
            } catch (error) {
                console.error('Failed to fetch user location', error);
            } finally {
                setIsLoading(false);
            }
            })();
    }, []);

    return { userLocation, errorMsg, isLoading };
}

export default fetchUserLocation