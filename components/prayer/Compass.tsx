import { View, Text, Image, StyleSheet, Dimensions, Vibration, Animated, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import useCompass from '../../hooks/useCompass';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const compassSize = screenWidth * 0.8;
const vibrationDebounce = 1000;

const Compass = () => {
    const { theme } = useTheme();
    const { userHeading, qiblaAzimuth, loading, error } = useCompass();
    const [bgColor] = useState(new Animated.Value(0));

    // Trigger vibration and background color animation when facing Qibla
    useEffect(() => {
        if (userHeading === null || qiblaAzimuth === null) return;

        const proximityToQibla = Math.abs(userHeading - qiblaAzimuth);
        const isCloseEnough = proximityToQibla < 5;

        if (isCloseEnough) {
            Vibration.vibrate(vibrationDebounce);
        }

        const proximityFactor = Math.min(proximityToQibla / 5, 1);
        Animated.timing(bgColor, {
            toValue: 1 - proximityFactor,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [userHeading, bgColor, qiblaAzimuth]);

    const interpolateColor = bgColor.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.colors.secondary, theme.colors.accent],
    });

    if (error) {
        Alert.alert('Compass Error', error);
    }

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.text.muted} />
                    <Text style={[styles.loadingText, { color: theme.colors.text.muted }]}>Calibrating Compass...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.textContainer}>
                        <Text style={[styles.qiblatText, { color: theme.colors.text.primary }]}>
                            Your heading: {Math.round(userHeading!)}°
                        </Text>
                        <Text style={[styles.qiblatText, { color: theme.colors.text.primary }]}>
                            Qibla heading: {Math.round(qiblaAzimuth!)}°
                        </Text>
                        <Text style={[styles.qiblatText, { color: theme.colors.text.secondary }]}>
                            When your heading matches the Kaaba's, you are facing the right direction.
                        </Text>
                    </View>

                    <View style={styles.compassContainer}>
                        <Animated.View style={[styles.compassCircle, { backgroundColor: interpolateColor }]}>
                            <Image source={require('../../assets/kaabah.png')} style={styles.kaabahIcon} />
                            <Image 
                                source={require('../../assets/arrow-up.png')} 
                                style={[
                                    styles.compassArrow, 
                                    { transform: [{ rotate: `${qiblaAzimuth! - userHeading!}deg` }] } 
                                ]}
                            />
                        </Animated.View>
                    </View>              
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    textContainer: {
        alignItems: 'center',
        gap: 10,
    },
    qiblatText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 18,
        lineHeight: 21,
        textAlign: 'center',
    },
    compassContainer: {
        top: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compassCircle: {
        width: compassSize, 
        height: compassSize, 
        borderRadius: compassSize / 2,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    kaabahIcon: {
        position: 'absolute',
        top: -120,
        left: 115, 
        height: 90,
        width: 90,
        resizeMode: 'contain',
    },
    compassArrow: {
        height: 80, 
        width: 80, 
        resizeMode: 'contain',
    },
});

export default Compass;
