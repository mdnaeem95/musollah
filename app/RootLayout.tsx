/**
 * Root Layout Component
 * 
 * Handles app initialization and splash screen display.
 * Uses modern Zustand + TanStack Query architecture.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAppInit } from '../hooks/initialization/useAppInitialization';
import { useLazyInit } from '../hooks/initialization/useLazyInit';
import { ModernSplash } from '../components/ModernSplash';

// Prevent auto-hide of native splash screen
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { isReady, progress, error } = useAppInit();

  // Lazy-load non-critical features after app is ready
  useLazyInit(isReady);

  const handleSplashComplete = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Navigator - always mounted for better performance */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 200,
          }}
        >
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false, 
              gestureEnabled: false 
            }} 
          />
        </Stack>

        {/* Custom splash overlay - shows until ready */}
        {!isReady && (
          <ModernSplash
            progress={progress}
            error={error}
            onAnimationComplete={handleSplashComplete}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});