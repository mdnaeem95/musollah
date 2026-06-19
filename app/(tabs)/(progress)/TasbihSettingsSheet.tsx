/**
 * TasbihSettingsSheet
 *
 * Customize the tasbih: post-salah set vs a single dhikr, which dhikr (library
 * or your own), and the target (33 / 99 / 100 / free).
 */

import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { useAccent } from '../../../hooks/useAccent';
import {
  useTasbihStore,
  ADHKAR_LIBRARY,
  TARGET_PRESETS,
  CUSTOM_DHIKR_ID,
} from '../../../stores/useTasbihStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

const targetLabel = (t: number) => (t === 0 ? 'Free' : String(t));

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TasbihSettingsSheet: React.FC<Props> = ({ visible, onClose }) => {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();

  const mode = useTasbihStore((s) => s.mode);
  const singleId = useTasbihStore((s) => s.singleId);
  const singleTarget = useTasbihStore((s) => s.singleTarget);
  const custom = useTasbihStore((s) => s.custom);
  const setMode = useTasbihStore((s) => s.setMode);
  const setSingleDhikr = useTasbihStore((s) => s.setSingleDhikr);
  const setSingleTarget = useTasbihStore((s) => s.setSingleTarget);
  const setCustomDhikr = useTasbihStore((s) => s.setCustomDhikr);

  const [showCustomForm, setShowCustomForm] = useState(singleId === CUSTOM_DHIKR_ID);
  const [customTranslit, setCustomTranslit] = useState(custom?.transliteration ?? '');
  const [customArabic, setCustomArabic] = useState(custom?.arabic ?? '');
  const [customMeaning, setCustomMeaning] = useState(custom?.meaning ?? '');

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const cardBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)';
  const cardBorder = isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

  const saveCustom = () => {
    if (!customTranslit.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCustomDhikr({
      transliteration: customTranslit.trim(),
      arabic: customArabic.trim(),
      meaning: customMeaning.trim(),
    });
  };

  const ModeOption = ({ value, title, subtitle }: { value: 'postSalah' | 'single'; title: string; subtitle: string }) => {
    const selected = mode === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { tap(); setMode(value); }}
        style={[styles.modeCard, {
          backgroundColor: selected ? accent + '18' : cardBg,
          borderColor: selected ? accent : cardBorder,
        }]}
      >
        <Text style={[styles.modeTitle, { color: selected ? accent : theme.colors.text.primary }]}>{title}</Text>
        <Text style={[styles.modeSub, { color: theme.colors.text.muted }]}>{subtitle}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#080F1E' : '#E8EFFF' }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.text.muted }]} />
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Customize tasbih</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Mode */}
            <Text style={[styles.section, { color: theme.colors.text.muted }]}>MODE</Text>
            <View style={styles.modeRow}>
              <ModeOption value="postSalah" title="Post-salah" subtitle="33 · 33 · 34" />
              <ModeOption value="single" title="Single dhikr" subtitle="Your choice" />
            </View>

            {mode === 'single' && (
              <>
                {/* Target */}
                <Text style={[styles.section, { color: theme.colors.text.muted }]}>COUNT TO</Text>
                <View style={styles.chipsRow}>
                  {TARGET_PRESETS.map((t) => {
                    const selected = singleTarget === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        activeOpacity={0.8}
                        onPress={() => { tap(); setSingleTarget(t); }}
                        style={[styles.chip, {
                          backgroundColor: selected ? accent : cardBg,
                          borderColor: selected ? accent : cardBorder,
                        }]}
                      >
                        <Text style={[styles.chipText, { color: selected ? '#fff' : theme.colors.text.primary }]}>
                          {targetLabel(t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Dhikr library */}
                <Text style={[styles.section, { color: theme.colors.text.muted }]}>DHIKR</Text>
                {ADHKAR_LIBRARY.map((d) => {
                  const selected = singleId === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      activeOpacity={0.8}
                      onPress={() => { tap(); setShowCustomForm(false); setSingleDhikr(d.id); }}
                      style={[styles.dhikrRow, { backgroundColor: cardBg, borderColor: selected ? accent : cardBorder }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dhikrTranslit, { color: theme.colors.text.primary }]}>{d.transliteration}</Text>
                        <Text style={[styles.dhikrMeaning, { color: theme.colors.text.muted }]} numberOfLines={1}>{d.meaning}</Text>
                      </View>
                      <Text style={[styles.dhikrArabic, { color: theme.colors.text.secondary }]}>{d.arabic}</Text>
                      {selected && <FontAwesome6 name="circle-check" size={18} color={accent} solid style={{ marginLeft: SPACING.sm }} />}
                    </TouchableOpacity>
                  );
                })}

                {/* Custom dhikr */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { tap(); setShowCustomForm((v) => !v); }}
                  style={[styles.dhikrRow, {
                    backgroundColor: cardBg,
                    borderColor: singleId === CUSTOM_DHIKR_ID ? accent : cardBorder,
                  }]}
                >
                  <FontAwesome6 name="plus" size={14} color={accent} />
                  <Text style={[styles.customLabel, { color: theme.colors.text.primary }]}>
                    {custom ? `Custom: ${custom.transliteration}` : 'Add your own dhikr'}
                  </Text>
                  {singleId === CUSTOM_DHIKR_ID && <FontAwesome6 name="circle-check" size={18} color={accent} solid />}
                </TouchableOpacity>

                {showCustomForm && (
                  <View style={[styles.customForm, { borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: theme.colors.text.primary, backgroundColor: cardBg, borderColor: cardBorder }]}
                      placeholder="Transliteration (e.g. SubhanAllah) *"
                      placeholderTextColor={theme.colors.text.muted}
                      value={customTranslit}
                      onChangeText={setCustomTranslit}
                    />
                    <TextInput
                      style={[styles.input, styles.arabicInput, { color: theme.colors.text.primary, backgroundColor: cardBg, borderColor: cardBorder }]}
                      placeholder="Arabic (optional)"
                      placeholderTextColor={theme.colors.text.muted}
                      value={customArabic}
                      onChangeText={setCustomArabic}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text.primary, backgroundColor: cardBg, borderColor: cardBorder }]}
                      placeholder="Meaning (optional)"
                      placeholderTextColor={theme.colors.text.muted}
                      value={customMeaning}
                      onChangeText={setCustomMeaning}
                    />
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={saveCustom}
                      disabled={!customTranslit.trim()}
                      style={[styles.saveButton, { backgroundColor: customTranslit.trim() ? accent : theme.colors.text.muted }]}
                    >
                      <Text style={styles.saveButtonText}>Use this dhikr</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={[styles.doneButton, { backgroundColor: accent }]}>
            <Text style={styles.doneButtonText}>Done</Text>
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
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center',
    marginTop: SPACING.md, marginBottom: SPACING.md, opacity: 0.4,
  },
  title: {
    fontSize: 22, fontFamily: 'Outfit_700Bold', textAlign: 'center', marginBottom: SPACING.md,
  },
  scroll: { paddingBottom: SPACING.lg },
  section: {
    fontSize: 11, fontFamily: 'Outfit_600SemiBold', letterSpacing: 1.2,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  modeRow: { flexDirection: 'row', gap: SPACING.md },
  modeCard: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, padding: SPACING.md, gap: 2,
  },
  modeTitle: { fontSize: 15, fontFamily: 'Outfit_600SemiBold' },
  modeSub: { fontSize: 12, fontFamily: 'Outfit_400Regular' },
  chipsRow: { flexDirection: 'row', gap: SPACING.sm },
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm,
    borderRadius: 10, borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: 'Outfit_600SemiBold' },
  dhikrRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dhikrTranslit: { fontSize: 15, fontFamily: 'Outfit_600SemiBold' },
  dhikrMeaning: { fontSize: 12, fontFamily: 'Outfit_400Regular', marginTop: 1 },
  dhikrArabic: { fontSize: 18, fontFamily: 'Amiri_400Regular' },
  customLabel: { flex: 1, fontSize: 15, fontFamily: 'Outfit_500Medium' },
  customForm: { gap: SPACING.sm, marginTop: SPACING.xs, marginBottom: SPACING.sm },
  input: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    fontSize: 14, fontFamily: 'Outfit_400Regular',
  },
  arabicInput: { fontFamily: 'Amiri_400Regular', fontSize: 18, textAlign: 'right' },
  saveButton: { alignItems: 'center', paddingVertical: SPACING.md, borderRadius: 12, marginTop: SPACING.xs },
  saveButtonText: { color: '#fff', fontSize: 15, fontFamily: 'Outfit_600SemiBold' },
  doneButton: {
    alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, marginTop: SPACING.md,
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
});

export default TasbihSettingsSheet;
