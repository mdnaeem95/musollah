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

export const usePrayerActions = ({
  onLocationPress,
  onActionComplete,
}: UsePrayerActionsOptions): PrayerAction[] => {
  const router = useRouter();

  const navigateTo = useCallback((path: string) => {
    onActionComplete?.();
    router.push(path as any);
  }, [router, onActionComplete]);

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
      // ✅ Just call onLocationPress directly
      onPress: onLocationPress,
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
  ], [navigateTo, onLocationPress]);

  return actions;
};