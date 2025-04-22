import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../redux/store/store';
import { useTheme } from '../../context/ThemeContext';

const TOTAL_AYAHS = 6236;
const TOTAL_SURAHS = 114;
const TOTAL_JUZ = 30;

const QuranProgressSection = () => {
  const { theme } = useTheme();
  const plan = useSelector((state: RootState) => state.quran.recitationPlan);
  const router = useRouter();

  const [overallSurahsRead, setOverallSurahsRead] = useState(0);

  useFocusEffect(() => {
    const loadSurahProgress = async () => {
      const stored = await AsyncStorage.getItem('readSurahsOverall');
      const total = stored ? JSON.parse(stored).length : 0;
      setOverallSurahsRead(total);
    };
    loadSurahProgress();
  });

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

  const actual = plan?.completedAyahKeys.length || 0;
  const progressRatio = plan ? Math.min(actual / expected, 1) : overallSurahsRead / TOTAL_SURAHS;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.secondary }]}>
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>
        {plan ? 'My Reading Plan' : 'All-Time Quran Progress'}
      </Text>

      <Text style={[styles.subHeader, { color: theme.colors.text.secondary }]}>
        {plan
          ? `Day ${daysPassed} of ${plan.daysToFinish}`
          : `Surahs read: ${overallSurahsRead} / ${TOTAL_SURAHS}`}
      </Text>

      <Progress.Bar
        progress={progressRatio}
        width={null}
        height={10}
        color={theme.colors.accent}
        unfilledColor={theme.colors.primary}
        borderWidth={0}
        style={{ marginVertical: 12 }}
      />

      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {plan
          ? `Completed ${actual} / ${expected} ${plan.planType}`
          : `${((overallSurahsRead / TOTAL_SURAHS) * 100).toFixed(2)}% complete`}
      </Text>

      {plan?.lastReadAyah && (
        <TouchableOpacity
          style={[styles.resumeButton, { backgroundColor: theme.colors.accent }]}
          onPress={() => {
            const [surah, ayah] = plan.lastReadAyah.split(':');
            router.push({
              pathname: `/surahs/${surah}`,
              params: { ayahIndex: ayah },
            });
          }}
        >
          <Text style={styles.resumeText}>📖 Resume from Surah {plan.lastReadAyah}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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

export default QuranProgressSection;