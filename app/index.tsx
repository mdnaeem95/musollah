import { Redirect, useRootNavigationState } from 'expo-router';
import { defaultStorage } from '../api/client/storage';

export default function Index() {
  const navState = useRootNavigationState();
  if (!navState?.key) return null;

  const hasSeenOnboarding = !!defaultStorage.getBoolean('hasSeenOnboarding');

  return (
    <Redirect href={hasSeenOnboarding ? '/(tabs)' : '/onboarding/AssistantOnboardingScreen'} />
  );
}
