/**
 * Recitation Progress Component
 * 
 * Displays user's Quran reading progress based on their plan.
 * Shows completion percentage, days passed, and resume button.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Progress from 'react-native-progress';
import { useQuranStore } from '../../stores/useQuranStore';
import { defaultStorage } from '../../api/client/storage';
import { useTheme } from '../../context/ThemeContext';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Recitation Progress');

// ============================================================================
// CONSTANTS
// ============================================================================

const TOTAL_AYAHS = 6236;
const TOTAL_SURAHS = 114;
const TOTAL_JUZ = 30;

const STORAGE_KEY_OVERALL_SURAHS = 'readSurahsOverall';

// ============================================================================
// COMPONENT
// ============================================================================

const RecitationProgress: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();

  // Zustand store
  const plan = useQuranStore((state) => state.recitationPlan);

  // Local state for overall progress (when no plan)
  const [overallSurahsRead, setOverallSurahsRead] = useState(0);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useFocusEffect(
    React.useCallback(() => {
      const loadSurahProgress = () => {
        try {
          const stored = defaultStorage.getString(STORAGE_KEY_OVERALL_SURAHS);
          if (stored) {
            const readSurahs = JSON.parse(stored);
            setOverallSurahsRead(Array.isArray(readSurahs) ? readSurahs.length : 0);
          } else {
            setOverallSurahsRead(0);
          }
        } catch (error) {
          logger.error('Error loading surah progress', error as Error);
          setOverallSurahsRead(0);
        }
      };

      loadSurahProgress();
    }, [])
  );

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const today = new Date();
  const startDate = plan ? new Date(plan.startDate) : null;
  const daysPassed = startDate
    ? Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  let expected = 0;
  let total = 0;

  if (plan) {
    switch (plan.planType) {
      case 'ayahs':
        total = TOTAL_AYAHS;
        expected = (TOTAL_AYAHS / plan.daysToFinish) * daysPassed;
        break;
      case 'surahs':
        total = TOTAL_SURAHS;
        expected = (TOTAL_SURAHS / plan.daysToFinish) * daysPassed;
        break;
      case 'juz':
        total = TOTAL_JUZ;
        expected = (TOTAL_JUZ / plan.daysToFinish) * daysPassed;
        break;
    }
    expected = Math.ceil(expected);
  }

  const actual = plan?.completedAyahKeys?.length || 0;
  const progressRatio = plan 
    ? Math.min(actual / expected, 1) 
    : overallSurahsRead / TOTAL_SURAHS;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleResume = () => {
    if (!plan?.lastReadAyah) return;

    const [surah, ayah] = plan.lastReadAyah.split(':');
    router.push({
      pathname: `/surahs/${surah}`,
      params: { ayahIndex: ayah },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.secondary }]}>
      {/* Header */}
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>
        {plan ? 'My Reading Plan' : 'All-Time Quran Progress'}
      </Text>

      {/* Sub-header */}
      <Text style={[styles.subHeader, { color: theme.colors.text.secondary }]}>
        {plan
          ? `Day ${daysPassed} of ${plan.daysToFinish}`
          : `Surahs read: ${overallSurahsRead} / ${TOTAL_SURAHS}`}
      </Text>

      {/* Progress Bar */}
      <Progress.Bar
        progress={progressRatio}
        width={null}
        height={10}
        color={theme.colors.accent}
        unfilledColor={theme.colors.primary}
        borderWidth={0}
        style={styles.progressBar}
      />

      {/* Progress Label */}
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {plan
          ? `Completed ${actual} / ${expected} ${plan.planType}`
          : `${((overallSurahsRead / TOTAL_SURAHS) * 100).toFixed(2)}% complete`}
      </Text>

      {/* Resume Button */}
      {plan?.lastReadAyah && (
        <TouchableOpacity
          style={[styles.resumeButton, { backgroundColor: theme.colors.accent }]}
          onPress={handleResume}
        >
          <Text style={styles.resumeText}>
            📖 Resume from Surah {plan.lastReadAyah}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  header: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  progressBar: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginTop: 8,
  },
  resumeButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },
});

export default RecitationProgress;