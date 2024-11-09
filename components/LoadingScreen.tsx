import { View, Animated, StyleSheet, ActivityIndicator, Image } from 'react-native'
import React, { useEffect, useState } from 'react'

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen = ({ message = 'Setting up the app...' }: LoadingScreenProps) => {
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, [fadeAnim]);

    return (
    <View style={styles.container}>
        {/* App Logo */}
        <Image
        source={require('../assets/rihlahLogo.png')} // Replace with your app's logo path
        style={styles.logo}
        resizeMode="contain"
        />

        {/* Activity Indicator */}
        <ActivityIndicator size="large" color="#4D6561" style={styles.spinner} />

        {/* Animated Text */}
        <Animated.Text style={[styles.loadingText, { opacity: fadeAnim }]}>
        {message}
        </Animated.Text>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center', // Center content vertically
        alignItems: 'center', // Center content horizontally
        backgroundColor: '#2E3D3A', // White background for clean appearance
      },
      logo: {
        width: 150, // Adjust size as needed
        height: 150, // Adjust size as needed
        marginBottom: 30, // Space between logo and spinner
      },
      spinner: {
        marginBottom: 20, // Space between spinner and text
      },
      loadingText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#ECDFCC',
      },
})

export default LoadingScreen