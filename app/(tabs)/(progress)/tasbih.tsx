/**
 * Tasbih — customizable digital dhikr counter.
 *
 * Tap anywhere to count. Post-salah mode auto-cycles SubhanAllah 33 →
 * Alhamdulillah 33 → Allahu Akbar 34; single mode counts one chosen dhikr to a
 * chosen target (33 / 99 / 100 / free). Counts feed the Progress tab's daily
 * dhikr total via useTasbihStore.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { useAccent } from '../../../hooks/useAccent';
import { useTasbihStore, computeSteps, activeStepOf } from '../../../stores/useTasbihStore';
import TasbihSettingsSheet from './TasbihSettingsSheet';

const RING_SIZE = 260;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TasbihScreen() {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();
  const [showSettings, setShowSettings] = useState(false);

  const mode = useTasbihStore((s) => s.mode);
  const singleId = useTasbihStore((s) => s.singleId);
  const singleTarget = useTasbihStore((s) => s.singleTarget);
  const custom = useTasbihStore((s) => s.custom);
  const stepIndex = useTasbihStore((s) => s.stepIndex);
  const count = useTasbihStore((s) => s.count);
  const rounds = useTasbihStore((s) => s.rounds);
  const todayTotal = useTasbihStore((s) => s.todayTotal);
  const increment = useTasbihStore((s) => s.increment);
  const resetCycle = useTasbihStore((s) => s.resetCycle);

  const steps = useMemo(
    () => computeSteps({ mode, singleId, singleTarget, custom }),
    [mode, singleId, singleTarget, custom]
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? steps[0];
  const dhikr = step.dhikr;
  const target = step.target;
  const isFree = target <= 0;
  const progress = isFree ? (count % 100) / 100 : Math.min(1, count / target);

  const handleTap = useCallback(() => {
    increment();
    const st = useTasbihStore.getState();
    const active = activeStepOf(st);
    if (active.target > 0 && st.count === active.target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [increment]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetCycle();
  }, [resetCycle]);

  const gradientColors = isDarkMode
    ? (['#060B18', '#0C1428', '#080F1E'] as const)
    : (['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const);

  const trackColor = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const roundsLabel = mode === 'postSalah' ? 'sets of 100' : 'rounds';

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Pressable style={styles.tapArea} onPress={handleTap}>
        {/* Customize */}
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettings(true); }}
          activeOpacity={0.8}
          style={[styles.gearButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
        >
          <FontAwesome6 name="sliders" size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        {/* Top stats */}
        <View style={styles.topStats}>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{todayTotal}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>today</Text>
          </View>
          {!isFree && (
            <View style={styles.statBlock}>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{rounds}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>{roundsLabel}</Text>
            </View>
          )}
        </View>

        {/* Ring + count */}
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={trackColor} strokeWidth={STROKE} fill="none" />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={accent}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>

          <View style={styles.ringCenter} pointerEvents="none">
            <MotiView
              key={count}
              from={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'timing', duration: 140 }}
            >
              <Text style={[styles.count, { color: theme.colors.text.primary }]}>{count}</Text>
            </MotiView>
            <Text style={[styles.countTarget, { color: theme.colors.text.muted }]}>
              {isFree ? 'free count' : `of ${target}`}
            </Text>
          </View>
        </View>

        {/* Current dhikr */}
        <MotiView
          key={dhikr.id + dhikr.transliteration}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.dhikrBlock}
        >
          {!!dhikr.arabic && <Text style={[styles.dhikrArabic, { color: accent }]}>{dhikr.arabic}</Text>}
          <Text style={[styles.dhikrTranslit, { color: theme.colors.text.primary }]}>{dhikr.transliteration}</Text>
          {!!dhikr.meaning && <Text style={[styles.dhikrMeaning, { color: theme.colors.text.secondary }]}>{dhikr.meaning}</Text>}
        </MotiView>

        <Text style={[styles.hint, { color: theme.colors.text.muted }]}>Tap anywhere to count</Text>

        {/* Reset (won't count — handles its own press) */}
        <TouchableOpacity
          onPress={handleReset}
          activeOpacity={0.8}
          style={[styles.resetButton, { borderColor: isDarkMode ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)' }]}
        >
          <FontAwesome6 name="rotate-left" size={14} color={theme.colors.text.secondary} />
          <Text style={[styles.resetText, { color: theme.colors.text.secondary }]}>Reset</Text>
        </TouchableOpacity>
      </Pressable>

      <TasbihSettingsSheet visible={showSettings} onClose={() => setShowSettings(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tapArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  gearButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topStats: {
    flexDirection: 'row',
    gap: 40,
    position: 'absolute',
    top: 24,
  },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Outfit_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Outfit_400Regular' },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontSize: 76, fontFamily: 'Outfit_700Bold', lineHeight: 84 },
  countTarget: { fontSize: 16, fontFamily: 'Outfit_500Medium', marginTop: -4 },
  dhikrBlock: { alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  dhikrArabic: { fontSize: 38, fontFamily: 'Amiri_400Regular', lineHeight: 56, textAlign: 'center' },
  dhikrTranslit: { fontSize: 20, fontFamily: 'Outfit_700Bold', textAlign: 'center' },
  dhikrMeaning: { fontSize: 14, fontFamily: 'Outfit_400Regular', textAlign: 'center' },
  hint: { fontSize: 13, fontFamily: 'Outfit_400Regular' },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    position: 'absolute',
    bottom: 32,
  },
  resetText: { fontSize: 14, fontFamily: 'Outfit_500Medium' },
});
