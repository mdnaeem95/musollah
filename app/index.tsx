import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import LoadingScreen from '../components/LoadingScreen';
import { useRouter } from 'expo-router';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

        const destination = user || hasSeenOnboarding === 'true'
          ? '/(tabs)'
          : '/onboarding/AssistantOnboardingScreen';

        // Delay to smooth the transition (prevents white flash)
        setTimeout(() => {
          router.replace(destination);
        }, 200); // 200–300ms is a sweet spot
      } catch (error) {
        console.error('Auth/onboarding check failed:', error);
        router.replace('/(tabs)');
      } finally {
        setIsReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingScreen message="Preparing your Rihlah..." />
      </View>
    );
  }

  // Don’t render anything once redirect is scheduled
  return null;
}