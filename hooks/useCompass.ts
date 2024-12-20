import { useState, useEffect } from "react";
import * as Location from 'expo-location';

const KAABA_LAT = 21.4225; 
const KAABA_LON = 39.8262;

const useCompass = () => {
    const [userHeading, setUserHeading] = useState<number | null>(null);
    const [qiblaAzimuth, setQiblaAzimuth] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null)

    const calculateAzimuth = (userLat: any, userLon: any) => {
        const dLon = (KAABA_LON - userLon) * (Math.PI / 180);
        const lat1 = userLat * (Math.PI / 180);
        const lat2 = KAABA_LAT * (Math.PI / 180);

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        let azimuth = Math.atan2(y, x) * (180 / Math.PI);
        azimuth = (azimuth + 360) % 360; // Ensure the azimuth is within 0-360 degrees
        return azimuth;
    };

    useEffect(() => {
        const getUserLocationAndHeading = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Location permission denied.');
                    setLoading(false);
                    return;
                }

                const locationPromise = Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                const headingPromise = Location.watchHeadingAsync((heading) => {
                    if (heading.trueHeading !== null) {
                        setUserHeading(heading.trueHeading);
                    }
                })

                const [location] = await Promise.all([locationPromise, headingPromise]);
                const { latitude, longitude } = location.coords;

                // Calculate azimuth (Qibla direction) from the user's location
                const azimuth = calculateAzimuth(latitude, longitude);
                setQiblaAzimuth(azimuth);

                setLoading(false);
            } catch (error) {
                console.log('Error accessing location or compass:', error);
                setLoading(false);
            }
        };

        getUserLocationAndHeading();

        return () => {
            Location.watchHeadingAsync(() => {}).then((sub) => sub.remove());
        }
    }, []);

    return { userHeading, qiblaAzimuth, loading, error }
}

export default useCompass;