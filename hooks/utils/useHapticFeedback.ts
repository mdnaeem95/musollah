import { useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { VIBRATION_COOLDOWN } from '../../constants/compass.constants';

interface UseHapticFeedbackOptions {
  enabled?: boolean;
}

/**
 * Custom hook for haptic feedback
 * Provides throttled haptic feedback for Qibla detection
 */
export const useHapticFeedback = ({ enabled = true }: UseHapticFeedbackOptions = {}) => {
  const lastHapticTimeRef = useRef<number>(0);

  /**
   * Trigger success haptic feedback with throttling
   */
  const triggerSuccessHaptic = useCallback(async () => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastHapticTimeRef.current < VIBRATION_COOLDOWN) {
      return;
    }

    lastHapticTimeRef.current = now;

    try {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, [enabled]);

  /**
   * Trigger impact haptic feedback
   */
  const triggerImpactHaptic = useCallback(async () => {
    if (!enabled) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, [enabled]);

  /**
   * Trigger selection haptic feedback
   */
  const triggerSelectionHaptic = useCallback(async () => {
    if (!enabled) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }
  }, [enabled]);

  return {
    triggerSuccessHaptic,
    triggerImpactHaptic,
    triggerSelectionHaptic,
  };
};