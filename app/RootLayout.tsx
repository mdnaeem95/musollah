import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Slot } from 'expo-router';
import useAppSetup from '../hooks/useAppSetup';

const RootLayout = () => {
  const { isReady, animatedStyle } = useAppSetup();

  if (!isReady) {
    return (
      <Text>Loading...</Text>
    )
  }

  return (
    <Slot />
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
