import { View, Text, Image, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location'
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationData {
    coords: {
        latitude: number;
        longitude: number;
    }
}

const QIBLA_HEADING = 293;

const Compass = () => {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [userHeading, setUserHeading] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);

            const heading = await Location.watchHeadingAsync((heading) => {
                setUserHeading(heading.trueHeading);
            })
        })();
    }, [])

    return (
        <SafeAreaView style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 343, alignItems: 'center', gap: 10 }}>
                <Text style={styles.qiblatText}>Your heading: {Math.round(userHeading)} deg</Text>
                <Text style={styles.qiblatText}>Kaabah's heading: {QIBLA_HEADING} deg</Text>
                <Text style={styles.qiblatText}>When your heading and the Kaaba's heading match, you are facing the right direction.</Text>
            </View>

            <View style={{ top: 150, justifyContent: 'center', alignItems: 'center' }}>
                <View style={styles.compassCircle}>
                    <Image source={require('../assets/kaabah.png')} style={styles.kaabahIcon} />
                    <Image source={require('../assets/arrow-up.png')} style={{ transform: [{ rotate: `${QIBLA_HEADING - userHeading}deg`}], height: 80, width: 80, resizeMode: 'contain' }} />
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    qiblatText: {
        fontFamily: 'Outfit_300Light',
        fontWeight: '300',
        fontSize: 18,
        lineHeight: 21
    },
    compassCircle: {
        width: 300, 
        height: 300, 
        borderRadius: 150,
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

    }
})

export default Compass