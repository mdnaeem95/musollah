/**
 * Quran Khatam Tracker Screen
 *
 * 30 juz grid to track Quran reading progress during Ramadan.
 * Mark juz complete, track pages read per juz.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useRamadanStore, useQuranKhatamLogs } from '../../../stores/useRamadanStore';
import { TOTAL_JUZ, PAGES_PER_JUZ } from '../../../api/services/ramadan/types/constants';

const QuranKhatamTracker = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const quranLogs = useQuranKhatamLogs();
  const logJuzProgress = useRamadanStore((s) => s.logJuzProgress);
  const markJuzComplete = useRamadanStore((s) => s.markJuzComplete);
  const unmarkJuzComplete = useRamadanStore((s) => s.unmarkJuzComplete);

  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [pagesRead, setPagesRead] = useState(0);

  const stats = useMemo(() => {
    const logs = Object.values(quranLogs);
    const completed = logs.filter((l) => l.completed).length;
    const totalPages = logs.reduce((sum, l) => sum + l.pagesRead, 0);
    const progressPercent = Math.round((completed / TOTAL_JUZ) * 100);
    return { completed, totalPages, progressPercent };
  }, [quranLogs]);

  const handleJuzPress = useCallback((juz: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedJuz(juz);
    const existing = quranLogs[juz];
    setPagesRead(existing?.pagesRead ?? 0);
  }, [quranLogs]);

  const handleToggleComplete = useCallback(() => {
    if (selectedJuz === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const existing = quranLogs[selectedJuz];
    if (existing?.completed) {
      unmarkJuzComplete(selectedJuz);
    } else {
      markJuzComplete(selectedJuz);
    }
    setSelectedJuz(null);
  }, [selectedJuz, quranLogs, markJuzComplete, unmarkJuzComplete]);

  const handleSavePages = useCallback(() => {
    if (selectedJuz === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    logJuzProgress(selectedJuz, pagesRead);
    setSelectedJuz(null);
  }, [selectedJuz, pagesRead, logJuzProgress]);

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressCircleOuter}>
            <View style={styles.progressCircleInner}>
              <Text style={styles.progressPercent}>{stats.progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.progressDetails}>
            <View style={styles.progressItem}>
              <FontAwesome6 name="book-quran" size={14} color={theme.colors.accent} />
              <Text style={styles.progressLabel}>
                {stats.completed}/{TOTAL_JUZ} juz completed
              </Text>
            </View>
            <View style={styles.progressItem}>
              <FontAwesome6 name="file-lines" size={14} color={theme.colors.accent} />
              <Text style={styles.progressLabel}>
                {stats.totalPages} pages read
              </Text>
            </View>
            <View style={styles.progressItem}>
              <FontAwesome6
                name={stats.completed >= TOTAL_JUZ ? 'trophy' : 'bullseye'}
                size={14}
                color={stats.completed >= TOTAL_JUZ ? '#FFD700' : theme.colors.accent}
              />
              <Text style={styles.progressLabel}>
                {stats.completed >= TOTAL_JUZ
                  ? 'Khatam Complete!'
                  : `${TOTAL_JUZ - stats.completed} juz remaining`}
              </Text>
            </View>
          </View>
        </View>
      </MotiView>

      {/* Juz Grid */}
      <View style={styles.juzGrid}>
        {Array.from({ length: TOTAL_JUZ }, (_, i) => {
          const juz = i + 1;
          const log = quranLogs[juz];
          const isComplete = log?.completed ?? false;
          const pages = log?.pagesRead ?? 0;
          const hasProgress = pages > 0 && !isComplete;

          return (
            <MotiView
              key={juz}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300, delay: i * 20 }}
            >
              <TouchableOpacity
                style={[
                  styles.juzCell,
                  isComplete && styles.juzCellComplete,
                  hasProgress && styles.juzCellInProgress,
                ]}
                onPress={() => handleJuzPress(juz)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.juzNumber,
                    isComplete && styles.juzNumberComplete,
                  ]}
                >
                  {juz}
                </Text>
                {isComplete ? (
                  <FontAwesome6 name="circle-check" size={14} color="#10B981" solid />
                ) : hasProgress ? (
                  <Text style={styles.juzPages}>{pages}/{PAGES_PER_JUZ}</Text>
                ) : null}
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
          <Text style={styles.legendText}>In Progress</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.text.muted }]} />
          <Text style={styles.legendText}>Not Started</Text>
        </View>
      </View>

      {/* Continue Reading */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/(tabs)/(quran)/surahs');
        }}
        activeOpacity={0.7}
      >
        <FontAwesome6 name="book-open-reader" size={16} color={theme.colors.accent} />
        <Text style={styles.continueButtonText}>Continue Reading</Text>
        <FontAwesome6 name="chevron-right" size={12} color={theme.colors.text.secondary} />
      </TouchableOpacity>

      {/* Log Modal */}
      <Modal
        visible={selectedJuz !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedJuz(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Juz {selectedJuz}</Text>

            {quranLogs[selectedJuz ?? 0]?.completed && (
              <View style={styles.completeBanner}>
                <FontAwesome6 name="circle-check" size={16} color="#10B981" solid />
                <Text style={styles.completeBannerText}>Completed</Text>
              </View>
            )}

            {/* Pages Slider */}
            <Text style={styles.sliderLabel}>Pages read</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderValue}>{pagesRead}</Text>
              <Text style={styles.sliderTotal}>/{PAGES_PER_JUZ}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={PAGES_PER_JUZ}
              step={1}
              value={pagesRead}
              onValueChange={setPagesRead}
              minimumTrackTintColor={theme.colors.accent}
              maximumTrackTintColor={theme.colors.text.muted}
              thumbTintColor={theme.colors.accent}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={handleToggleComplete}
              >
                <FontAwesome6
                  name={quranLogs[selectedJuz ?? 0]?.completed ? 'rotate-left' : 'circle-check'}
                  size={14}
                  color={quranLogs[selectedJuz ?? 0]?.completed ? '#EF4444' : '#10B981'}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    {
                      color: quranLogs[selectedJuz ?? 0]?.completed
                        ? '#EF4444'
                        : '#10B981',
                    },
                  ]}
                >
                  {quranLogs[selectedJuz ?? 0]?.completed
                    ? 'Mark Incomplete'
                    : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSavePages}
              >
                <Text style={styles.saveButtonText}>Save Progress</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setSelectedJuz(null)}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.primary },
    contentContainer: { padding: 16, paddingBottom: 100 },

    // Progress Header
    progressHeader: {
      flexDirection: 'row',
      backgroundColor: theme.colors.secondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      gap: 20,
    },
    progressCircleOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.accent + '15',
      borderWidth: 3,
      borderColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressCircleInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressPercent: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
      color: theme.colors.accent,
    },
    progressDetails: { flex: 1, gap: 8 },
    progressItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressLabel: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.secondary,
    },

    // Juz Grid
    juzGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-start',
      marginBottom: 20,
    },
    juzCell: {
      width: 60,
      height: 60,
      backgroundColor: theme.colors.secondary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    juzCellComplete: {
      backgroundColor: '#10B98115',
      borderWidth: 1.5,
      borderColor: '#10B981',
    },
    juzCellInProgress: {
      borderWidth: 1.5,
      borderColor: theme.colors.accent,
    },
    juzNumber: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    juzNumberComplete: {
      color: '#10B981',
    },
    juzPages: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 10,
      color: theme.colors.accent,
    },

    // Legend
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginBottom: 20,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 12,
      color: theme.colors.text.secondary,
    },

    // Continue Reading
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.secondary,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
    },
    continueButtonText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 15,
      color: theme.colors.text.primary,
      flex: 1,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.primary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    modalTitle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 22,
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    completeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#10B98115',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 16,
    },
    completeBannerText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: '#10B981',
    },
    sliderLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 8,
    },
    sliderRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 8,
    },
    sliderValue: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 32,
      color: theme.colors.accent,
    },
    sliderTotal: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
    slider: {
      width: '100%',
      height: 40,
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      marginBottom: 12,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.secondary,
    },
    toggleButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 14,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
    },
    saveButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 15,
      color: '#FFFFFF',
    },
    cancelLink: { padding: 10 },
    cancelLinkText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.muted,
    },
  });

export default QuranKhatamTracker;
