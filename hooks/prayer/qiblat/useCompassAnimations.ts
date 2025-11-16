import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { ANIMATION_DURATION, KAABAH_PULSE_ITERATIONS } from '../../../constants/compass.constants';

interface UseCompassAnimationProps {
  angle: number;
  isClose: boolean;
  isReduceMotionEnabled: boolean;
}

/**
 * Custom hook for compass animations using Reanimated 3
 * Separates animation logic from component logic (SRP)
 */
export const useCompassAnimation = ({
  angle,
  isClose,
  isReduceMotionEnabled,
}: UseCompassAnimationProps) => {
  // Shared values for animations
  const arrowRotation = useSharedValue(0);
  const backgroundProgress = useSharedValue(0);
  const kaabahScale = useSharedValue(1);

  // Update arrow rotation
  useEffect(() => {
    if (isReduceMotionEnabled) {
      arrowRotation.value = angle;
    } else {
      arrowRotation.value = withTiming(angle, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [angle, isReduceMotionEnabled, arrowRotation]);

  // Update background color progress
  useEffect(() => {
    const targetValue = isClose ? 1 : 0;
    
    if (isReduceMotionEnabled) {
      backgroundProgress.value = targetValue;
    } else {
      backgroundProgress.value = withTiming(targetValue, {
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isClose, isReduceMotionEnabled, backgroundProgress]);

  // Pulse animation for Kaabah when close to Qibla
  const triggerKaabahPulse = () => {
    if (!isReduceMotionEnabled) {
      kaabahScale.value = withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(1, {
            duration: ANIMATION_DURATION,
            easing: Easing.in(Easing.ease),
          })
        ),
        KAABAH_PULSE_ITERATIONS,
        false
      );
    }
  };

  // Animated styles
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotation.value}deg` }],
  }));

  const kaabahAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kaabahScale.value }],
  }));

  return {
    backgroundProgress,
    arrowAnimatedStyle,
    kaabahAnimatedStyle,
    triggerKaabahPulse,
  };
};