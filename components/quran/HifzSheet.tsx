/**
 * HifzSheet — Quran memorization controls
 *
 * Playback speed, repeat-each-ayah, and a hide-text "test" mode. Writes to
 * useHifzStore, which the audio player and Mushaf reader read.
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { useAccent } from '../../hooks/useAccent';
import { useHifzStore, REPEAT_OFF, REPEAT_INFINITE } from '../../stores/useHifzStore';

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const REPEATS: { label: string; value: number }[] = [
  { label: 'Off', value: REPEAT_OFF },
  { label: '3×', value: 3 },
  { label: '5×', value: 5 },
  { label: '∞', value: REPEAT_INFINITE },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const HifzSheet: React.FC<Props> = ({ visible, onClose }) => {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();

  const playbackRate = useHifzStore((s) => s.playbackRate);
  const repeatEachAyah = useHifzStore((s) => s.repeatEachAyah);
  const testMode = useHifzStore((s) => s.testMode);
  const setPlaybackRate = useHifzStore((s) => s.setPlaybackRate);
  const setRepeatEachAyah = useHifzStore((s) => s.setRepeatEachAyah);
  const setTestMode = useHifzStore((s) => s.setTestMode);

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const cardBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => { tap(); onPress(); }}
      style={[styles.chip, {
        backgroundColor: selected ? accent : cardBg,
        borderColor: selected ? accent : cardBorder,
      }]}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.colors.text.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#080F1E' : '#E8EFFF' }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.text.muted }]} />

          <View style={styles.titleRow}>
            <FontAwesome6 name="brain" size={16} color={accent} />
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Memorization</Text>
          </View>

          {/* Playback speed */}
          <Text style={[styles.section, { color: theme.colors.text.muted }]}>PLAYBACK SPEED</Text>
          <View style={styles.chipsRow}>
            {SPEEDS.map((s) => (
              <Chip key={s} label={`${s}×`} selected={playbackRate === s} onPress={() => setPlaybackRate(s)} />
            ))}
          </View>

          {/* Repeat each ayah */}
          <Text style={[styles.section, { color: theme.colors.text.muted }]}>REPEAT EACH AYAH</Text>
          <View style={styles.chipsRow}>
            {REPEATS.map((r) => (
              <Chip key={r.value} label={r.label} selected={repeatEachAyah === r.value} onPress={() => setRepeatEachAyah(r.value)} />
            ))}
          </View>

          {/* Test mode */}
          <View style={[styles.testRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.testLeft}>
              <View style={[styles.testIcon, { backgroundColor: accent + '18' }]}>
                <FontAwesome6 name="eye-slash" size={15} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.testTitle, { color: theme.colors.text.primary }]}>Test mode</Text>
                <Text style={[styles.testSub, { color: theme.colors.text.muted }]}>
                  Hides the text — tap a page to reveal & check your recall
                </Text>
              </View>
            </View>
            <Switch
              value={testMode}
              onValueChange={(v) => { tap(); setTestMode(v); }}
              trackColor={{ false: theme.colors.muted, true: accent }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={[styles.doneButton, { backgroundColor: accent }]}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center',
    marginTop: SPACING.md, marginBottom: SPACING.lg, opacity: 0.4,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  title: { fontSize: 20, fontFamily: 'Outfit_700Bold' },
  section: {
    fontSize: 11, fontFamily: 'Outfit_600SemiBold', letterSpacing: 1.2,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  chipsRow: { flexDirection: 'row', gap: SPACING.sm },
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
    borderRadius: 10, borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: 'Outfit_600SemiBold' },
  testRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: 14, borderWidth: 1, padding: SPACING.md, marginTop: SPACING.xl,
  },
  testLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  testIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  testTitle: { fontSize: 15, fontFamily: 'Outfit_600SemiBold' },
  testSub: { fontSize: 12, fontFamily: 'Outfit_400Regular', marginTop: 1 },
  doneButton: {
    alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, marginTop: SPACING.xl,
  },
  doneText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
});

export default HifzSheet;
