import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';

import { toastConfig } from '../utils/toastConfig';
import { useAppInit } from '../hooks/initialization/useAppInitialization';
import { useLazyInit } from '../hooks/initialization/useLazyInit';
import { ModernSplash } from '../components/ModernSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function AppShell() {
  const { isReady, progress, error } = useAppInit(); // ✅ now inside QueryClientProvider
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  useLazyInit(isReady);

  const handleSplashComplete = useCallback(() => {
    setSplashAnimationComplete(true);
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const showSplash = !isReady || !splashAnimationComplete;

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }} />

        {showSplash && (
          <ModernSplash
            progress={progress}
            error={error}
            onAnimationComplete={handleSplashComplete}
          />
        )}

        <Toast config={toastConfig} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
