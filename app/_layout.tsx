import React, { useContext, useEffect } from 'react'
import { Stack, SplashScreen, Tabs } from 'expo-router'
import 'react-native-reanimated'
import { Providers } from '../providers/index'
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from "@expo-google-fonts/outfit"
import { Amiri_400Regular } from "@expo-google-fonts/amiri"
import { useFonts } from 'expo-font'
import { QuranDataContext } from '../providers/QuranDataProvider'

SplashScreen.preventAutoHideAsync();
const RootLayout = () => {
  const { loading } = useContext(QuranDataContext);
  
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }
  
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
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </Providers>
  )
}

export default RootLayout