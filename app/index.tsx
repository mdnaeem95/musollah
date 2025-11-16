/**
 * Index Route
 * 
 * Handles initial navigation based on onboarding status.
 * Uses MMKV storage for fast synchronous reads.
 */

import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { defaultStorage } from '../api/client/storage';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    // Wait until the root navigator is mounted
    if (!navState?.key) return;

    // Only redirect if we're actually on the index route
    const inTabsGroup = segments?.[0] === '(tabs)';
    if (inTabsGroup) return;

    // Check if user has seen onboarding (synchronous read from MMKV)
    const hasSeenOnboarding = defaultStorage.getBoolean('hasSeenOnboarding');
    
    const destination = hasSeenOnboarding 
      ? '/(tabs)' 
      : '/onboarding/AssistantOnboardingScreen';

    router.replace(destination);
  }, [navState?.key, segments, router]);

  return null;
}