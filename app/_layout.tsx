import React, { useEffect } from 'react'
import { Stack, SplashScreen } from 'expo-router'
import 'react-native-reanimated'
import { Providers } from '../providers/index'
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from "@expo-google-fonts/outfit"
import { Amiri_400Regular } from "@expo-google-fonts/amiri"
import { useFonts } from 'expo-font'
import { useLoading } from '../providers/LoadingProvider'

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const { isAppReady } = useLoading();
  
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Amiri_400Regular
  });

  useEffect(() => {
    if (fontsLoaded && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAppReady])
  
  if (!fontsLoaded || !isAppReady) {
    return null;
  }

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </Providers>
  )
}

export default RootLayout