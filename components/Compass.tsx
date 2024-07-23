import { View, Text, Image, StyleSheet, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';

interface LocationData {
    coords: {
        latitude: number;
        longitude: number;
    }
}

const screenWidth = Dimensions.get('window').width;
const compassSize = screenWidth * 0.8;

const QIBLA_HEADING = 293;

const Compass = () => {
    const { isLoading, errorMsg, userLocation } = useSelector((state: RootState) => state.location);
    const [userHeading, setUserHeading] = useState(0);

    useEffect(() => {
        if (userLocation) {
            Location.watchHeadingAsync((heading) => {
                setUserHeading(heading.trueHeading);
            })
        }
    }, [userLocation]);

    return (
        <View style={styles.mainContainer}>
            <View style={styles.textContainer}>
                <Text style={styles.qiblatText}>Your heading: {Math.round(userHeading)} deg</Text>
                <Text style={styles.qiblatText}>Kaabah's heading: {QIBLA_HEADING} deg</Text>
                <Text style={styles.qiblatText}>When your heading and the Kaaba's heading match, you are facing the right direction.</Text>
            </View>

            <View style={{ top: 150, justifyContent: 'center', alignItems: 'center' }}>
                <View style={styles.compassCircle}>
                    <Image source={require('../assets/kaabah.png')} style={styles.kaabahIcon} />
                    <Image source={require('../assets/arrow-up.png')} style={[styles.compassArrow, { transform: [{ rotate: `${QIBLA_HEADING - userHeading}deg`}] }]} />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
        marginVertical: 20,
        gap: 10
    },
    qiblatText: {
        fontFamily: 'Outfit_300Light',
        fontWeight: '300',
        fontSize: 18,
        lineHeight: 21,
        color: '#EAFFFC'
    },
    compassCircle: {
        width: compassSize, 
        height: compassSize, 
        borderRadius: compassSize /2,
        borderWidth: 2,
        borderColor: '#FFFFFF',
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