/**
 * ModernSplash - Animated Splash Screen
 *
 * Night-sky aesthetic matching the prayer tab.
 * Native splash background (#010409) matches the gradient start so
 * the OS → JS transition is invisible.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

import LOGO from '../assets/rihlahLogo.png';
import { createLogger } from '../services/logging/logger';

const logger = createLogger('Splash');
const { width: W, height: H } = Dimensions.get('window');

// ─── Hardcoded star positions (fraction of screen) ───────────────────────────
const STARS: { cx: number; cy: number; r: number; delay: number; twinkle: boolean }[] = [
  { cx: 0.08, cy: 0.06, r: 1.2, delay: 0,    twinkle: false },
  { cx: 0.22, cy: 0.04, r: 1.8, delay: 120,  twinkle: true  },
  { cx: 0.45, cy: 0.07, r: 1.0, delay: 250,  twinkle: false },
  { cx: 0.65, cy: 0.03, r: 2.2, delay: 80,   twinkle: true  },
  { cx: 0.82, cy: 0.09, r: 1.4, delay: 350,  twinkle: false },
  { cx: 0.93, cy: 0.05, r: 1.0, delay: 480,  twinkle: true  },
  { cx: 0.14, cy: 0.16, r: 1.6, delay: 200,  twinkle: false },
  { cx: 0.57, cy: 0.13, r: 1.2, delay: 600,  twinkle: true  },
  { cx: 0.77, cy: 0.19, r: 1.8, delay: 150,  twinkle: false },
  { cx: 0.96, cy: 0.22, r: 1.0, delay: 700,  twinkle: false },
  { cx: 0.03, cy: 0.24, r: 1.4, delay: 420,  twinkle: true  },
  { cx: 0.32, cy: 0.27, r: 2.4, delay: 90,   twinkle: true  },
  { cx: 0.72, cy: 0.30, r: 1.0, delay: 530,  twinkle: false },
  { cx: 0.89, cy: 0.36, r: 1.6, delay: 310,  twinkle: false },
  { cx: 0.11, cy: 0.38, r: 1.2, delay: 760,  twinkle: true  },
  { cx: 0.52, cy: 0.76, r: 1.4, delay: 640,  twinkle: false },
  { cx: 0.26, cy: 0.82, r: 1.0, delay: 820,  twinkle: true  },
  { cx: 0.69, cy: 0.84, r: 1.8, delay: 170,  twinkle: false },
  { cx: 0.91, cy: 0.79, r: 1.2, delay: 900,  twinkle: true  },
  { cx: 0.38, cy: 0.89, r: 1.6, delay: 55,   twinkle: false },
  { cx: 0.83, cy: 0.93, r: 1.0, delay: 680,  twinkle: true  },
  { cx: 0.06, cy: 0.87, r: 2.0, delay: 370,  twinkle: false },
  { cx: 0.59, cy: 0.91, r: 1.4, delay: 580,  twinkle: true  },
  { cx: 0.18, cy: 0.72, r: 1.2, delay: 290,  twinkle: false },
  { cx: 0.94, cy: 0.67, r: 1.6, delay: 460,  twinkle: true  },
];

// ─── Star component ───────────────────────────────────────────────────────────
const Star: React.FC<{ cx: number; cy: number; r: number; delay: number; twinkle: boolean }> = ({
  cx, cy, r, delay, twinkle,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(0.75, { duration: 800, easing: Easing.out(Easing.ease) })
    );

    if (twinkle) {
      // Start twinkling after the fade-in completes
      setTimeout(() => {
        opacity.value = withDelay(
          delay + 900,
          withRepeat(
            withSequence(
              withTiming(0.9, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
              withTiming(0.35, { duration: 1800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
          )
        );
      }, delay + 900);
    }
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.star,
        style,
        {
          left: cx * W - r,
          top: cy * H - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
        },
      ]}
    />
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
interface ModernSplashProps {
  progress: number;
  error?: Error | null;
  onAnimationComplete?: () => void;
}

export const ModernSplash: React.FC<ModernSplashProps> = ({
  progress,
  error,
  onAnimationComplete,
}) => {
  const logoScale   = useSharedValue(0.72);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale   = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(18);
  const exitOpacity = useSharedValue(1);

  // Hide the native OS splash immediately when this component mounts so the
  // transition from native → JS is seamless (same background colour).
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    logger.debug('Native splash hidden, starting entrance animation');

    // Logo entrance
    logoScale.value   = withDelay(80, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    logoOpacity.value = withDelay(80, withTiming(1, { duration: 550, easing: Easing.out(Easing.ease) }));

    // Glow bloom
    glowOpacity.value = withDelay(200, withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }));
    glowScale.value   = withDelay(200, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));

    // Subtle glow pulse (after bloom)
    setTimeout(() => {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.00, { duration: 2200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, 1200);

    // App name slides up
    textOpacity.value = withDelay(450, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
    textY.value       = withDelay(450, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  // Exit animation when app init completes
  useEffect(() => {
    if (progress >= 100) {
      logger.info('Progress 100% — starting exit fade');
      exitOpacity.value = withDelay(
        200,
        withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
    }
  }, [progress, onAnimationComplete]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: exitOpacity.value }));
  const logoStyle      = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background gradient — matches native splash backgroundColor exactly */}
      <LinearGradient
        colors={['#010409', '#040C1E', '#060B18', '#04091A']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <Star key={i} {...s} />
      ))}

      {/* Centre content */}
      <View style={styles.centre}>
        {/* Outer ambient glow */}
        <Animated.View style={[styles.glowOuter, glowStyle]} />

        {/* Inner glow */}
        <Animated.View style={[styles.glowInner, glowStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {/* App name */}
        <Animated.View style={[styles.textWrap, textStyle]}>
          <Text style={styles.appName}>rihlah</Text>
          <Text style={styles.appNameArabic}>رحلة</Text>
        </Animated.View>
      </View>

      {/* Bottom progress */}
      <View style={styles.bottomArea}>
        {error && (
          <Text style={styles.errorText}>Using offline data</Text>
        )}
        <ProgressBar progress={progress} />
      </View>
    </Animated.View>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 280, easing: Easing.out(Easing.ease) });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stars
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  // Centre
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(56,189,248,0.06)',
  },
  glowInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99,179,237,0.10)',
  },
  logoWrap: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 40,
    elevation: 20,
  },
  logo: {
    width: 160,
    height: 160,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 28,
    gap: 4,
  },
  appName: {
    fontFamily: 'Outfit_300Light',
    fontSize: 34,
    letterSpacing: 10,
    color: 'rgba(255,255,255,0.90)',
    textTransform: 'lowercase',
  },
  appNameArabic: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 20,
    color: 'rgba(148,217,255,0.65)',
    letterSpacing: 2,
  },

  // Bottom
  bottomArea: {
    position: 'absolute',
    bottom: 80,
    width: '50%',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(255,193,7,0.75)',
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(148,217,255,0.70)',
    borderRadius: 1,
  },
});
