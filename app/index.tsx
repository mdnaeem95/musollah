import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { storage } from '../utils/storage';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState(); // ✅ tells us when the root nav is ready

  useEffect(() => {
    // Wait until the root navigator is mounted
    if (!navState?.key) return;

    // Only redirect if we're actually on the index route
    const inTabsGroup = segments?.[0] === '(tabs)';
    if (inTabsGroup) return;

    const hasSeenOnboarding = storage.getBoolean('hasSeenOnboarding');
    const destination = hasSeenOnboarding ? '/(tabs)' : '/onboarding/AssistantOnboardingScreen';

    router.replace(destination);
  }, [navState?.key, segments, router]);

  return null;
}
