import { useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';

export interface PrayerAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface UsePrayerActionsOptions {
  onLocationPress: () => void;
  onActionComplete?: () => void;
}

/**
 * Hook for managing prayer action handlers
 * Returns memoized action configurations
 * 
 * Provides actions for:
 * - Qiblat compass
 * - Dua collection
 * - Monthly calendar
 * - City/location change
 * - Prayer dashboard
 * - Khutbah content
 */
export const usePrayerActions = ({
  onLocationPress,
  onActionComplete,
}: UsePrayerActionsOptions): PrayerAction[] => {
  const router = useRouter();

  // Wrapped navigation handler
  const navigateTo = useCallback((path: string) => {
    onActionComplete?.();
    router.push(path as any);
  }, [router, onActionComplete]);

  // Memoized actions array
  const actions = useMemo<PrayerAction[]>(() => [
    {
      icon: 'compass',
      label: 'Qiblat',
      onPress: () => navigateTo('/qiblat'),
    },
    {
      icon: 'hands-praying',
      label: 'Doa',
      onPress: () => navigateTo('/doa'),
    },
    {
      icon: 'calendar-alt',
      label: 'Calendar',
      onPress: () => navigateTo('/monthlyPrayerTimes'),
    },
    {
      icon: 'location-dot',
      label: 'Change City',
      onPress: () => {
        onActionComplete?.();
        onLocationPress();
      },
    },
    {
      icon: 'chart-simple',
      label: 'Dashboard',
      onPress: () => navigateTo('/prayerDashboard'),
    },
    {
      icon: 'message',
      label: 'Khutbah',
      onPress: () => navigateTo('/khutbah'),
    },
  ], [navigateTo, onLocationPress, onActionComplete]);

  return actions;
};