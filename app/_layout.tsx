import React, { useContext, useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen  from 'expo-splash-screen'
import 'react-native-reanimated'
import { Providers } from '../providers/index'
import QueryClientProvider from '../hooks/QueryClientProvider';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from "@expo-google-fonts/outfit"
import { Amiri_400Regular } from "@expo-google-fonts/amiri"
import { useFonts } from 'expo-font'
import { LoadingContext } from '../providers/LoadingProvider'

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const { isAppReady } = useContext(LoadingContext);
  
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_500Medium,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Amiri_400Regular
  });

  useEffect(() => {
    console.log('Fonts loaded:', fontsLoaded);
    console.log('App ready:', isAppReady);

    if (fontsLoaded && isAppReady) {
      SplashScreen.hideAsync().then(() => {
        console.log('SplashScreen hidden');
      }).catch(error => {
        console.error('Error hiding SplashScreen', error)
      });
    }
  }, [fontsLoaded, isAppReady])
  
  if (!fontsLoaded || !isAppReady) {
    return null;
  }

  return (
    <QueryClientProvider>
      <Providers>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </Providers>
    </QueryClientProvider>
  )
}

export default RootLayout