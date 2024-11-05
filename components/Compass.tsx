import { View, Text, Image, StyleSheet, Dimensions, Vibration, Animated } from 'react-native'
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location'
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';

const screenWidth = Dimensions.get('window').width;
const compassSize = screenWidth * 0.8;
const QIBLA_HEADING = 293;

const Compass = () => {
    const [userHeading, setUserHeading] = useState(0);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [bgColor] = useState(new Animated.Value(0));

    // Watch user heading and update it in real-time
    useEffect(() => {
        const startHeadingUpdates = async () => {
        try {
            // Request location permissions from the user
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
            setLocationError('Location permission denied.');
            return;
            }

            // Start watching the device's heading (compass)
            const headingSubscription = await Location.watchHeadingAsync((heading) => {
            setUserHeading(heading.trueHeading || 0);
            });

            // Cleanup the heading subscription when the component unmounts
            return () => {
            if (headingSubscription) {
                headingSubscription.remove();
            }
            };
        } catch (error) {
            setLocationError('Error accessing compass.');
        }
        };

        startHeadingUpdates();
    }, []);

    // Trigger vibration and background color animation when facing Qibla
    useEffect(() => {
        const proximityToQibla = Math.abs(userHeading - QIBLA_HEADING);

        if (proximityToQibla < 0.5) {
            Vibration.vibrate();
        }

        // Animate the background color based on proximity
        const proximityFactor = Math.min(proximityToQibla / 5, 1);
        Animated.timing(bgColor, {
            toValue: 1 - proximityFactor,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [userHeading, bgColor])

    const interpolateColor = bgColor.interpolate({
        inputRange: [0, 1],
        outputRange: ['#3A504C', '#A3C0BB']
    })

    return (
        <View style={styles.mainContainer}>
            <View style={styles.textContainer}>
                <Text style={styles.qiblatText}>Your heading: {Math.round(userHeading)} deg</Text>
                <Text style={styles.qiblatText}>Kaabah's heading: {QIBLA_HEADING} deg</Text>
                <Text style={styles.qiblatText}>When your heading and the Kaaba's heading match, you are facing the right direction.</Text>
            </View>

            <View style={styles.compassContainer}>
                <Animated.View style={[styles.compassCircle, { backgroundColor: interpolateColor }]}>
                    <Image source={require('../assets/kaabah.png')} style={styles.kaabahIcon} />
                    <Image source={require('../assets/arrow-up.png')} style={[styles.compassArrow, { transform: [{ rotate: `${QIBLA_HEADING - userHeading}deg`}] }]} />
                </Animated.View>
            </View>
        </View>
    )
}

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