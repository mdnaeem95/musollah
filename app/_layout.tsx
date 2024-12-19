import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import AppProviders from '../providers/AppProviders';
import useAppSetup from '../hooks/useAppSetup';

const AppLayout = () => {
  const { isReady } = useAppSetup(); // Hook to handle app initialization

  return (
    <AppProviders>
      <View style={{ flex: 1 }}>
        {/* Always render Slot to satisfy Expo Router */}
        <Slot />

        {/* Loading screen while waiting for app setup */}
        {!isReady && (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </AppProviders>
  );
};

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E3D3A',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default AppLayout;
