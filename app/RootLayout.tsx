import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { persistor } from '../redux/store/store';
import { useAppInit } from '../hooks/initialization/useAppInitialization';
import { useLazyInit } from '../hooks/initialization/useLazyInit';
import { ModernSplash } from '../components/ModernSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const isRehydrated = persistor.getState().bootstrapped;
  const { isReady, progress, error } = useAppInit(isRehydrated);

  // Lazy-load non-critical features after app is ready
  useLazyInit(isReady);

  const handleSplashComplete = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Navigator - always mounted */}
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

        {/* Splash overlay - only shows until ready */}
        {!isReady && (
          <ModernSplash
            progress={progress}
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