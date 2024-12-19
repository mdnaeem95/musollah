import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Stack } from 'expo-router';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import useAppSetup from '../hooks/useAppSetup';

const RootLayout = () => {
  const { isReady, animatedStyle } = useAppSetup();

  if (!isReady) {
    return <AnimatedSplashScreen animatedStyle={animatedStyle} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.splashScreen, animatedStyle]} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
    </View>
  );
};

const styles = {
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2E3D3A',
    zIndex: 1,
  },
};

export default RootLayout;
