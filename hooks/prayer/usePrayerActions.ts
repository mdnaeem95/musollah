/**
 * Prayer Actions Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Action tracking and navigation monitoring
 * 
 * Provides prayer-related quick actions (Qiblat, Doa, Calendar, etc.)
 * with navigation and callback handling.
 * 
 * @version 2.0
 * @since 2025-12-24
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Prayer Actions');

// ============================================================================
// TYPES
// ============================================================================

export interface PrayerAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface UsePrayerActionsOptions {
  onLocationPress: () => void;
  onActionComplete?: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing prayer quick actions
 * Provides navigation and action handlers for the prayer FAB menu
 * 
 * @param {UsePrayerActionsOptions} options - Configuration options
 * @returns {PrayerAction[]} Array of prayer actions
 * 
 * @example
 * ```tsx
 * const actions = usePrayerActions({
 *   onLocationPress: () => setLocationModalVisible(true),
 *   onActionComplete: () => setActionsModalVisible(false),
 * });
 * 
 * <ActionSheet actions={actions} />
 * ```
 */
export const usePrayerActions = ({
  onLocationPress,
  onActionComplete,
}: UsePrayerActionsOptions): PrayerAction[] => {
  const router = useRouter();

  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Prayer actions hook mounted', {
      hasLocationCallback: !!onLocationPress,
      hasCompleteCallback: !!onActionComplete,
    });
    
    return () => {
      logger.debug('Prayer actions hook unmounted');
    };
  }, []);

  // ✅ Navigation with logging
  const navigateTo = useCallback((path: string, actionLabel: string) => {
    logger.info('Prayer action navigation', {
      action: actionLabel,
      destination: path,
    });
    
    // Call completion callback if provided
    if (onActionComplete) {
      logger.debug('Calling action complete callback');
      onActionComplete();
    }
    
    // Navigate
    router.push(path as any);
    
    logger.debug('Navigation completed', { path });
  }, [router, onActionComplete]);

  // ✅ Location action with logging
  const handleLocationPress = useCallback(() => {
    logger.info('Prayer action pressed', {
      action: 'Change City',
      type: 'location-modal',
    });
    
    onLocationPress();
    
    logger.debug('Location modal opened');
  }, [onLocationPress]);

  // ✅ Define actions with logged handlers
  const actions = useMemo<PrayerAction[]>(() => {
    const actionList: PrayerAction[] = [
      {
        icon: 'compass',
        label: 'Qiblat',
        onPress: () => navigateTo('/qiblat', 'Qiblat'),
      },
      {
        icon: 'hands-praying',
        label: 'Doa',
        onPress: () => navigateTo('/doa', 'Doa'),
      },
      {
        icon: 'calendar-alt',
        label: 'Calendar',
        onPress: () => navigateTo('/monthlyPrayerTimes', 'Calendar'),
      },
      {
        icon: 'location-dot',
        label: 'Change City',
        onPress: handleLocationPress,
      },
      {
        icon: 'chart-simple',
        label: 'Dashboard',
        onPress: () => navigateTo('/prayerDashboard', 'Dashboard'),
      },
      {
        icon: 'message',
        label: 'Khutbah',
        onPress: () => navigateTo('/khutbah', 'Khutbah'),
      },
    ];

    logger.debug('Prayer actions created', {
      count: actionList.length,
      actions: actionList.map(a => a.label),
    });

    return actionList;
  }, [navigateTo, handleLocationPress]);

  return actions;
};