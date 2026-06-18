/**
 * NextPrayerHero
 *
 * The prayer home's focal point: a glanceable, phase-tinted "next prayer" card.
 * Replaces the old small pill — the next prayer + countdown is what users open
 * the app for, so it leads the hierarchy. The accent + glow track the live sky
 * phase (via useSkyPhase), tying the UI to the real time of day.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { SkyPrayerTimes } from '../../hooks/prayer/useSkyPhase';
import { useAccent } from '../../hooks/useAccent';
import { usePreferencesStore } from '../../stores/userPreferencesStore';

interface NextPrayerHeroProps {
  /** Full day's normalized times — used for the phase accent + the prayer's clock time. */
  prayerData: SkyPrayerTimes | null;
  nextPrayer: string;
  timeUntil: string;
}

/** Format an "HH:MM" (24h) string to the user's clock preference. */
function formatClock(hhmm: string | undefined, timeFormat: string): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (timeFormat === '12-hour') {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function NextPrayerHero({ prayerData, nextPrayer, timeUntil }: NextPrayerHeroProps) {
  const { accent, label: phaseLabel } = useAccent(prayerData);
  const timeFormat = usePreferencesStore((s) => s.timeFormat);

  const nextTime = formatClock(
    prayerData ? prayerData[nextPrayer.toLowerCase() as keyof SkyPrayerTimes] : undefined,
    timeFormat
  );

  // Urgent when only minutes remain and within 30.
  const onlyMinutes = /^\d+m$/.test(timeUntil.trim());
  const isUrgent = onlyMinutes && parseInt(timeUntil, 10) <= 30;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480 }}
      style={[styles.wrapper, { shadowColor: accent }]}
    >
      <BlurView intensity={32} tint="dark" style={styles.card}>
        {/* Phase accent edge */}
        <View style={[styles.accentEdge, { backgroundColor: accent }]} />

        {/* Soft phase glow when urgent */}
        {isUrgent && (
          <MotiView
            from={{ opacity: 0.15 }}
            animate={{ opacity: 0.5 }}
            transition={{ type: 'timing', duration: 1100, loop: true, repeatReverse: true }}
            style={[styles.urgentGlow, { backgroundColor: accent }]}
          />
        )}

        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={styles.label}>NEXT PRAYER</Text>
          {phaseLabel && <Text style={styles.phaseLabel}>{phaseLabel}</Text>}
        </View>

        <Text style={[styles.prayerName, { color: accent }]} numberOfLines={1}>
          {nextPrayer}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.countdown}>in {timeUntil}</Text>
          {nextTime && (
            <>
              <Text style={styles.bullet}>·</Text>
              <Text style={styles.clockTime}>{nextTime}</Text>
            </>
          )}
        </View>
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    marginHorizontal: 24,
    marginBottom: 18,
    borderRadius: 24,
    // Phase-tinted glow (shadowColor set dynamically).
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  accentEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  urgentGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.6)',
  },
  phaseLabel: {
    marginLeft: 'auto',
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.42)',
  },
  prayerName: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 30,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdown: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.2,
  },
  bullet: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
  },
  clockTime: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 0.2,
  },
});
