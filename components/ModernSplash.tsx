/**
 * Modern Splash Screen Component
 * 
 * ✅ ENHANCED: Added detailed animation logging and guaranteed callback execution
 */

import { useEffect } from 'react';
import { StyleSheet, View, Image, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LOGO from '../assets/rihlahLogo.png';

interface ModernSplashProps {
  progress: number;
  error?: Error | null;
  onAnimationComplete?: () => void;
}

/**
 * Modern splash screen with gradient, blur, and smooth animations
 * Follows iOS design guidelines for splash screens
 * 
 * @param progress - 0-100, automatically triggers exit animation at 100
 * @param error - Optional error (shows "Using offline data" message)
 * @param onAnimationComplete - Called when exit animation completes
 */
export const ModernSplash: React.FC<ModernSplashProps> = ({
  progress,
  error,
  onAnimationComplete,
}) => {
  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const slideY = useSharedValue(0);

  // Entrance animation
  useEffect(() => {
    console.log('🎨 Starting entrance animation');
    logoScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  // Pulse animation for logo
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  // Exit animation (triggers when progress reaches 100)
  useEffect(() => {
    if (progress >= 100) {
      console.log('🚀 Progress 100% - Starting exit animation');
      
      slideY.value = withTiming(
        -1000,
        {
          duration: 600,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          console.log('✨ Exit animation finished:', { finished, hasCallback: !!onAnimationComplete });
          
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          } else if (!finished) {
            console.warn('⚠️ Animation did not finish naturally');
            // Call callback anyway to prevent hanging
            if (onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          }
        }
      );
    }
  }, [progress, onAnimationComplete]);

  // Animated styles
  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { translateY: slideY.value },
    ],
    opacity: logoOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const progressOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress,
      [0, 10],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#1A2B28', '#2E3D3A', '#3D4F4C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Blur overlay for iOS glassmorphism effect */}
      {Platform.OS === 'ios' && (
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      )}

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        <View style={styles.logoShadow}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </View>
      </Animated.View>

      {/* Progress indicator */}
      <Animated.View style={[styles.progressContainer, progressOpacity]}>
        <SplashProgress progress={progress} error={error} />
      </Animated.View>
    </Animated.View>
  );
};

/**
 * Progress bar component with optional error message
 */
interface SplashProgressProps {
  progress: number;
  error?: Error | null;
}

const SplashProgress: React.FC<SplashProgressProps> = ({ progress, error }) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.progressWrapper}>
      {/* Show error message if present */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ Using offline data</Text>
        </View>
      )}
      
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>

      <Animated.Text style={styles.progressPercentage}>
        {Math.round(progress)}%
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  logo: {
    width: 180,
    height: 180,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    width: '80%',
    alignItems: 'center',
  },
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  errorContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#FFC107',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#BFE1DB',
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
    marginTop: 8,
    opacity: 0.7,
  },
});