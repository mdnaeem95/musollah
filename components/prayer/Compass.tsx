import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Dimensions,
  Vibration,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import useCompass from '../../hooks/useCompass';

// Constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const COMPASS_SIZE_RATIO = 0.75; // 75% of screen width
const COMPASS_SIZE = SCREEN_WIDTH * COMPASS_SIZE_RATIO;
const QIBLA_PROXIMITY_THRESHOLD = 5; // degrees
const VIBRATION_PATTERN = [0, 200, 100, 200]; // Vibration pattern for accessibility
const ANIMATION_DURATION = 300;
const KAABAH_PULSE_ITERATIONS = 2;

// Types
interface CompassProps {
  onQiblaFound?: () => void;
  enableVibration?: boolean;
  enablePulseAnimation?: boolean;
}

const Compass: React.FC<CompassProps> = ({
  onQiblaFound,
  enableVibration = true,
  enablePulseAnimation = true,
}) => {
  const { theme } = useTheme();
  const { userHeading, qiblaAzimuth, loading, error, retryInitialization } = useCompass();
  
  // Animation values
  const backgroundColorAnimation = useRef(new Animated.Value(0)).current;
  const kaabahScaleAnimation = useRef(new Animated.Value(1)).current;
  const arrowRotationAnimation = useRef(new Animated.Value(0)).current;
  
  // State
  const [isNearQibla, setIsNearQibla] = useState(false);
  const [lastVibrationTime, setLastVibrationTime] = useState(0);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  // Check accessibility settings
  useEffect(() => {
    const checkReduceMotion = async () => {
      if (Platform.OS === 'ios') {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setIsReduceMotionEnabled(reduceMotion);
      }
    };
    checkReduceMotion();
  }, []);

  // Calculate compass values
  const compassValues = useMemo(() => {
    if (userHeading === null || qiblaAzimuth === null) {
      return { angle: 0, proximityToQibla: 360, isClose: false };
    }

    const angle = qiblaAzimuth - userHeading;
    const proximityToQibla = Math.abs(angle % 360);
    const isClose = proximityToQibla < QIBLA_PROXIMITY_THRESHOLD || 
                   proximityToQibla > (360 - QIBLA_PROXIMITY_THRESHOLD);

    return { angle, proximityToQibla, isClose };
  }, [userHeading, qiblaAzimuth]);

  // Handle Qibla proximity feedback
  const handleQiblaProximity = useCallback((isClose: boolean) => {
    const now = Date.now();
    
    if (isClose && !isNearQibla) {
      setIsNearQibla(true);
      onQiblaFound?.();

      // Vibration feedback (with throttling)
      if (enableVibration && now - lastVibrationTime > 2000) {
        Vibration.vibrate(VIBRATION_PATTERN);
        setLastVibrationTime(now);
      }

      // Pulse animation for Kaabah
      if (enablePulseAnimation && !isReduceMotionEnabled) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(kaabahScaleAnimation, {
              toValue: 1.2,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(kaabahScaleAnimation, {
              toValue: 1,
              duration: ANIMATION_DURATION,
              useNativeDriver: true,
            }),
          ]),
          { iterations: KAABAH_PULSE_ITERATIONS }
        ).start();
      }
    } else if (!isClose && isNearQibla) {
      setIsNearQibla(false);
    }
  }, [isNearQibla, onQiblaFound, enableVibration, enablePulseAnimation, 
      lastVibrationTime, kaabahScaleAnimation, isReduceMotionEnabled]);

  // Update compass rotation and background color
  useEffect(() => {
    if (userHeading === null || qiblaAzimuth === null) return;

    const { angle, isClose } = compassValues;

    // Animate arrow rotation
    if (!isReduceMotionEnabled) {
      Animated.timing(arrowRotationAnimation, {
        toValue: angle,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();

      // Animate background color
      Animated.timing(backgroundColorAnimation, {
        toValue: isClose ? 1 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }).start();
    } else {
      // No animation for reduced motion
      arrowRotationAnimation.setValue(angle);
      backgroundColorAnimation.setValue(isClose ? 1 : 0);
    }

    handleQiblaProximity(isClose);
  }, [compassValues, handleQiblaProximity, isReduceMotionEnabled, 
      arrowRotationAnimation, backgroundColorAnimation]);

  // Color interpolation for background
  const interpolatedBackgroundColor = backgroundColorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.secondary, theme.colors.accent],
  });

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.text.primary}
          accessibilityLabel="Loading compass"
        />
        <Text 
          style={[styles.loadingText, { color: theme.colors.text.muted }]}
          accessibilityRole="text"
        >
          Calibrating Compass...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text 
          style={[styles.errorText, { color: theme.colors.text.primary }]}
          accessibilityRole="text"
        >
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.colors.secondary }]}
          onPress={retryInitialization}
          accessibilityRole="button"
          accessibilityLabel="Retry compass initialization"
          accessibilityHint="Tap to retry loading the compass"
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.text.primary }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const proximityPercentage = Math.round(
    ((360 - compassValues.proximityToQibla) / 360) * 100
  );

  return (
    <View style={styles.container}>
      {/* Header Information */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.headingText, { color: theme.colors.text.primary }]}
          accessibilityRole="text"
        >
          Your heading: {Math.round(userHeading || 0)}°
        </Text>
        <Text
          style={[styles.headingText, { color: theme.colors.text.primary }]}
          accessibilityRole="text"
        >
          Qibla heading: {Math.round(qiblaAzimuth || 0)}°
        </Text>
        <Text
          style={[styles.instructionText, { color: theme.colors.text.secondary }]}
          accessibilityRole="text"
        >
          When the arrow points to the Kaabah, you're facing Qiblah.
        </Text>
        {isNearQibla && (
          <Text
            style={[styles.foundText, { color: theme.colors.accent }]}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            🕋 Qibla Found! ({proximityPercentage}% accurate)
          </Text>
        )}
      </View>

      {/* Compass */}
      <View style={styles.compassContainer}>
        <Animated.View
          style={[
            styles.compassCircle,
            { 
              backgroundColor: interpolatedBackgroundColor,
              borderColor: theme.colors.text.muted,
            },
          ]}
          accessibilityRole="image"
          accessibilityLabel={`Compass showing ${isNearQibla ? 'Qibla direction found' : 'searching for Qibla direction'}`}
        >
          {/* Kaabah Icon */}
          <Animated.Image
            source={require('../../assets/kaabah.png')}
            style={[
              styles.kaabahIcon,
              { 
                transform: [{ scale: kaabahScaleAnimation }],
              },
            ]}
            accessibilityRole="image"
            accessibilityLabel="Kaabah direction indicator"
          />
          
          {/* Compass Arrow */}
          <Animated.Image
            source={require('../../assets/arrow-up.png')}
            style={[
              styles.compassArrow,
              {
                transform: [
                  {
                    rotate: arrowRotationAnimation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
            accessibilityRole="image"
            accessibilityLabel="Direction arrow"
          />
        </Animated.View>
      </View>

      {/* Footer Information */}
      <View style={styles.footerContainer}>
        <Text
          style={[styles.accuracyText, { color: theme.colors.text.muted }]}
          accessibilityRole="text"
        >
          Accuracy: {proximityPercentage}%
        </Text>
      </View>
    </View>
  );
};

// Styles will be provided in the next message due to length
const styles = {
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
    gap: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center' as const,
  },
  infoContainer: {
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 16,
  },
  headingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    textAlign: 'center' as const,
  },
  instructionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  foundText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  compassContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1,
  },
  compassCircle: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  kaabahIcon: {
    position: 'absolute' as const,
    top: -45,
    width: 60,
    height: 60,
    resizeMode: 'contain' as const,
  },
  compassArrow: {
    width: 80,
    height: 80,
    resizeMode: 'contain' as const,
  },
  footerContainer: {
    alignItems: 'center' as const,
    paddingHorizontal: 16,
  },
  accuracyText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center' as const,
  },
};

export default Compass;