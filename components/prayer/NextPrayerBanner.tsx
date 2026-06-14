/**
 * NextPrayerBanner
 *
 * Floating pill displayed between the clock and the prayer list.
 * Shows the next upcoming prayer and time remaining.
 * Pulses when the prayer is within 30 minutes.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NextPrayerBannerProps {
  nextPrayer: string;
  timeUntil: string;
}

export function NextPrayerBanner({ nextPrayer, timeUntil }: NextPrayerBannerProps) {
  const { theme } = useTheme();

  // Detect urgency: "4m", "12m", "1h 4m", etc. — urgent if only minutes and < 30
  const onlyMinutes = /^\d+m$/.test(timeUntil.trim());
  const minuteCount = onlyMinutes ? parseInt(timeUntil) : Infinity;
  const isUrgent = minuteCount <= 30;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isUrgent) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1100, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isUrgent]);

  return (
    <BlurView intensity={28} tint="dark" style={styles.container}>
      {/* Pulsing dot */}
      <Animated.View
        style={[styles.dot, { backgroundColor: theme.colors.accent, opacity: pulseAnim }]}
      />

      <Text style={styles.label}>Next</Text>

      <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />

      <Text style={[styles.prayerName, { color: theme.colors.accent }]}>
        {nextPrayer}
      </Text>

      <Text style={styles.dot2}> · </Text>

      <Text style={styles.timeUntil}>in {timeUntil}</Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 12,
    borderRadius: 1,
  },
  prayerName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  dot2: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: -4,
  },
  timeUntil: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
});
