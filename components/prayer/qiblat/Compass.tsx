import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import useCompass from '../../../hooks/prayer/qiblat/useCompass';
import { useCompassAnimation } from '../../../hooks/prayer/qiblat/useCompassAnimations';
import { useHapticFeedback } from '../../../hooks/utils/useHapticFeedback';
import { useAccessibility } from '../../../hooks/utils/useAccessiblity';
import CompassCircle from './CompassCircle';
import CompassInfo from './CompassInfo';
import { LoadingState, ErrorState } from './CompassStates';
import { calculateCompassValues, formatDistance, calculateAccuracyPercentage } from '../../../utils/prayers/compass.utils';
import type { CompassProps } from '../../../types/compass.types';

/**
 * Main Compass component
 * Displays Qibla direction with visual and haptic feedback
 * 
 * Features:
 * - Real-time compass tracking
 * - Qibla direction calculation
 * - Distance to Mecca
 * - Haptic feedback
 * - Accessibility support
 * - Smooth animations with Reanimated 3
 */
const Compass: React.FC<CompassProps> = ({
  onQiblaFound,
  enableVibration = true,
  enablePulseAnimation = true,
}) => {
  const { theme } = useTheme();
  const { 
    userHeading, 
    qiblaAzimuth, 
    loading, 
    error, 
    distanceToMecca,
    retryInitialization,
  } = useCompass();
  
  // Accessibility
  const { isReduceMotionEnabled } = useAccessibility();
  
  // Haptic feedback
  const { triggerSuccessHaptic } = useHapticFeedback({ enabled: enableVibration });
  
  // Local state
  const [isNearQibla, setIsNearQibla] = useState(false);

  // Calculate compass values
  const compassValues = useMemo(
    () => calculateCompassValues(userHeading, qiblaAzimuth),
    [userHeading, qiblaAzimuth]
  );

  // Animations
  const {
    backgroundProgress,
    arrowAnimatedStyle,
    kaabahAnimatedStyle,
    triggerKaabahPulse,
  } = useCompassAnimation({
    angle: compassValues.angle,
    isClose: compassValues.isClose,
    isReduceMotionEnabled,
  });

  // Format distance
  const formattedDistance = useMemo(
    () => formatDistance(distanceToMecca),
    [distanceToMecca]
  );

  // Calculate accuracy percentage
  const accuracyPercentage = useMemo(
    () => calculateAccuracyPercentage(compassValues.proximityToQibla),
    [compassValues.proximityToQibla]
  );

  // Handle Qibla proximity
  const handleQiblaProximity = useCallback((isClose: boolean) => {
    if (isClose && !isNearQibla) {
      setIsNearQibla(true);
      onQiblaFound?.();

      // Trigger haptic feedback
      triggerSuccessHaptic();

      // Trigger pulse animation
      if (enablePulseAnimation && !isReduceMotionEnabled) {
        triggerKaabahPulse();
      }
    } else if (!isClose && isNearQibla) {
      setIsNearQibla(false);
    }
  }, [
    isNearQibla,
    onQiblaFound,
    triggerSuccessHaptic,
    enablePulseAnimation,
    isReduceMotionEnabled,
    triggerKaabahPulse,
  ]);

  // Monitor proximity changes
  useEffect(() => {
    handleQiblaProximity(compassValues.isClose);
  }, [compassValues.isClose, handleQiblaProximity]);

  // Render loading state
  if (loading) {
    return (
      <LoadingState
        color={theme.colors.text.primary}
        mutedColor={theme.colors.text.muted}
      />
    );
  }

  // Render error state
  if (error) {
    return (
      <ErrorState
        error={error}
        textColor={theme.colors.text.primary}
        buttonColor={theme.colors.secondary}
        onRetry={retryInitialization}
      />
    );
  }

  // Ensure we have valid data before rendering main UI
  if (userHeading === null || qiblaAzimuth === null) {
    return (
      <LoadingState
        color={theme.colors.text.primary}
        mutedColor={theme.colors.text.muted}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CompassInfo
        userHeading={userHeading}
        qiblaHeading={qiblaAzimuth}
        distance={formattedDistance}
        isNearQibla={isNearQibla}
        accuracyPercentage={accuracyPercentage}
        textColor={theme.colors.text.primary}
        accentColor={theme.colors.accent}
        mutedColor={theme.colors.text.muted}
      />

      <CompassCircle
        backgroundProgress={backgroundProgress}
        arrowAnimatedStyle={arrowAnimatedStyle}
        kaabahAnimatedStyle={kaabahAnimatedStyle}
        isNearQibla={isNearQibla}
        backgroundColor={theme.colors.secondary}
        accentColor={theme.colors.accent}
        borderColor={theme.colors.text.muted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
});

export default Compass;