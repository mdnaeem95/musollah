import { View, Text, Image, StyleSheet, Dimensions, Vibration, Animated } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';

const screenWidth = Dimensions.get('window').width;
const compassSize = screenWidth * 0.8;
const QIBLA_HEADING = 293;
const KAABA_LAT = 21.4225;   // Latitude of Kaaba
const KAABA_LON = 39.8262;   // Longitude of Kaaba

const Compass = () => {
    const [userHeading, setUserHeading] = useState(0);
    const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });
    const [qiblaAzimuth, setQiblaAzimuth] = useState(0);
    const [bgColor] = useState(new Animated.Value(0));

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
                    return;
                }

                const { coords } = await Location.getCurrentPositionAsync({});
                setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });

                // Calculate azimuth (Qibla direction) from the user's location
                const azimuth = calculateAzimuth(coords.latitude, coords.longitude);
                setQiblaAzimuth(azimuth);

                // Watch heading updates
                const headingSubscription = await Location.watchHeadingAsync((heading) => {
                    setUserHeading(heading.trueHeading || 0);
                });

                return () => headingSubscription && headingSubscription.remove();
            } catch (error) {
                console.log('Error accessing location or compass:', error);
            }
        };

        getUserLocationAndHeading();
    }, []);

    // Trigger vibration and background color animation when facing Qibla
    useEffect(() => {
        const proximityToQibla = Math.abs(userHeading - QIBLA_HEADING);
        const isCloseEnough = proximityToQibla < 5;  // Increase threshold to 5 degrees

        if (isCloseEnough) {
            Vibration.vibrate();
        }

        const proximityFactor = Math.min(proximityToQibla / 5, 1);
        Animated.timing(bgColor, {
            toValue: 1 - proximityFactor,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [userHeading, bgColor]);

    const interpolateColor = bgColor.interpolate({
        inputRange: [0, 1],
        outputRange: ['#3A504C', '#A3C0BB']
    });

    return (
        <View style={styles.mainContainer}>
            <View style={styles.textContainer}>
                <Text style={styles.qiblatText}>Your heading: {Math.round(userHeading)}°</Text>
                <Text style={styles.qiblatText}>Qibla heading: {Math.round(qiblaAzimuth)}°</Text>
                <Text style={styles.qiblatText}>When your heading matches the Kaaba's, you are facing the right direction.</Text>
            </View>

            <View style={styles.compassContainer}>
                <Animated.View style={[styles.compassCircle, { backgroundColor: interpolateColor }]}>
                    <Image source={require('../assets/kaabah.png')} style={styles.kaabahIcon} />
                    <Image 
                        source={require('../assets/arrow-up.png')} 
                        style={[
                            styles.compassArrow, 
                            { transform: [{ rotate: `${qiblaAzimuth - userHeading}deg` }] } 
                        ]} 
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    },
    textContainer: {
        alignItems: 'center',
        marginVertical: 20,
        gap: 10,
    },
    qiblatText: {
        fontFamily: 'Outfit_300Light',
        fontWeight: '300',
        fontSize: 18,
        lineHeight: 21,
        color: '#ECDFCC',
        textAlign: 'center'
    },
    compassContainer: {
        top: 150,
        justifyContent: 'center',
        alignItems: 'center'
    },
    compassCircle: {
        width: compassSize, 
        height: compassSize, 
        borderRadius: compassSize /2,
        borderWidth: 2,
        borderColor: '#ECDFCC',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    kaabahIcon: {
        position: 'absolute',
        top: -120,
        left: 100, 
        height: 90,
        width: 90,
        resizeMode: 'contain'
    },
    compassArrow: {
        height: 80, 
        width: 80, 
        resizeMode: 'contain'
    }
})

export default Compass