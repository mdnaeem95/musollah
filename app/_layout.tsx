import React, { useEffect } from 'react'
import { Stack, SplashScreen } from 'expo-router'
import 'react-native-reanimated'

SplashScreen.preventAutoHideAsync();

import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from "@expo-google-fonts/outfit"
import { Amiri_400Regular } from "@expo-google-fonts/amiri"
import { useFonts } from 'expo-font'

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Amiri_400Regular
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded])
  
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  )
}

export default RootLayout