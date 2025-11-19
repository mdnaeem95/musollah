/**
 * Daily Ayah Component
 * 
 * Displays a random Quranic verse based on user's mood.
 * Caches ayah for 24 hours per mood to show consistent daily content.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { useSurahs } from '../../api/services/quran';
import { defaultStorage } from '../../api/client/storage';
import { getRandomAyahByMood } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const MOOD_KEY = 'selectedMood';
const AYAH_KEY_PREFIX = 'dailyAyah';
const TIMESTAMP_KEY = 'dailyAyahTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const MOODS = [
  { label: 'Neutral', value: 'Neutral' },
  { label: 'Down', value: 'Down' },
  { label: 'Grateful', value: 'Grateful' },
  { label: 'Motivated', value: 'Motivated' },
  { label: 'Hopeful', value: 'Hopeful' },
  { label: 'Afraid', value: 'Afraid' },
  { label: 'Patient', value: 'Patient' },
] as const;

// ============================================================================
// TYPES
// ============================================================================

type Mood = typeof MOODS[number]['value'];

interface DailyAyahData {
  arabicText: string;
  englishText: string;
  surahNumber: number;
  ayahNumber: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const DailyAyah: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  // State
  const [ayah, setAyah] = useState<DailyAyahData | null>(null);
  const [mood, setMood] = useState<Mood>('Neutral');
  const [isSkeleton, setIsSkeleton] = useState<boolean>(false);

  // Fetch all surahs from service
  const { data: surahs, isLoading } = useSurahs();

  // ============================================================================
  // STORAGE HELPERS
  // ============================================================================

  const getCachedAyah = (currentMood: Mood): DailyAyahData | null => {
    try {
      const cacheKey = `${AYAH_KEY_PREFIX}_${currentMood}`;
      const cached = defaultStorage.getString(cacheKey);
      const timestamp = defaultStorage.getString(TIMESTAMP_KEY);

      if (!cached || !timestamp) return null;

      const lastFetchedTime = parseInt(timestamp, 10);
      const currentTime = Date.now();

      // Check if cache is still valid (< 24 hours old)
      if (currentTime - lastFetchedTime < CACHE_DURATION) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error('Error reading cached ayah:', error);
      return null;
    }
  };

  const setCachedAyah = (currentMood: Mood, ayahData: DailyAyahData) => {
    try {
      const cacheKey = `${AYAH_KEY_PREFIX}_${currentMood}`;
      defaultStorage.setString(cacheKey, JSON.stringify(ayahData));
      defaultStorage.setString(TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching ayah:', error);
    }
  };

  const getStoredMood = (): Mood => {
    try {
      const stored = defaultStorage.getString(MOOD_KEY);
      return (stored as Mood) || 'Neutral';
    } catch {
      return 'Neutral';
    }
  };

  const setStoredMood = (newMood: Mood) => {
    try {
      defaultStorage.setString(MOOD_KEY, newMood);
    } catch (error) {
      console.error('Error storing mood:', error);
    }
  };

  // put this helper above the effect (or inside it)
  function getAyahArrays(surah: any) {
    // Preferred shape used in your app
    if (Array.isArray(surah?.arabicAyahs) && Array.isArray(surah?.englishTranslations)) {
      return {
        arabicAyahs: surah.arabicAyahs as string[],
        englishAyahs: surah.englishTranslations as string[],
      };
    }
    // Back-compat: ayahs: [{ text, translation? }]
    if (Array.isArray(surah?.ayahs)) {
      return {
        arabicAyahs: surah.ayahs.map((a: any) => a?.text ?? ''),
        englishAyahs: surah.ayahs.map((a: any) => a?.translation ?? ''),
      };
    }
    // Fallback
    return { arabicAyahs: [] as string[], englishAyahs: [] as string[] };
  }

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const initializeMood = () => {
      const storedMood = getStoredMood();
      setMood(storedMood);
    };

    initializeMood();
  }, []);

  useEffect(() => {
    if (!surahs || surahs.length === 0) return;

    const fetchDailyAyah = () => {
      const cachedAyah = getCachedAyah(mood);
      if (cachedAyah) {
        setAyah(cachedAyah);
        return;
      }

      const randomAyah = getRandomAyahByMood(mood);
      const surah = surahs.find((s: any) => s.number === randomAyah.surahNumber);
      if (!surah) {
        console.error('Surah not found:', randomAyah.surahNumber);
        return;
      }

      const { arabicAyahs, englishAyahs } = getAyahArrays(surah);

      const selectedAyah: DailyAyahData = {
        arabicText: arabicAyahs[randomAyah.ayahNumber - 1] || '',
        englishText: englishAyahs[randomAyah.ayahNumber - 1] || '',
        surahNumber: randomAyah.surahNumber,
        ayahNumber: randomAyah.ayahNumber,
      };

      setCachedAyah(mood, selectedAyah);
      setAyah(selectedAyah);
    };

    fetchDailyAyah();
  }, [surahs, mood]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMoodChange = (selectedMood: Mood) => {
    setIsSkeleton(true);
    setMood(selectedMood);
    setStoredMood(selectedMood);

    // Show skeleton for smooth transition
    setTimeout(() => {
      setIsSkeleton(false);
    }, 500);
  };

  const handleAyahClick = () => {
    if (!ayah) return;

    router.push({
      pathname: `/surahs/${ayah.surahNumber}`,
      params: { ayahIndex: ayah.ayahNumber },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const showSkeleton = isLoading || isSkeleton || !ayah;

  return (
    <View style={styles.container}>
      {/* Mood Selector */}
      <View style={styles.moodContainer}>
        <Text style={styles.headerText}>I am feeling: </Text>
        <Dropdown
          data={[...MOODS] as any[]} 
          labelField="label"
          valueField="value"
          placeholder="Select mood"
          value={mood}
          onChange={(item) => handleMoodChange(item.value as Mood)}
          style={styles.dropdown}
          placeholderStyle={styles.dropdownPlaceholder}
          selectedTextStyle={styles.dropdownSelectedText}
          iconStyle={styles.dropdownIcon}
          containerStyle={styles.dropdownContainer}
          disable={isLoading}
        />
      </View>

      {/* Ayah Card */}
      <View style={styles.ayahCard}>
        <Text style={styles.headerText}>Ayah of the Day</Text>

        {showSkeleton ? (
          <View style={styles.ayahContent}>
            <Animated.View style={[styles.skeleton, styles.skeletonArabic]} />
            <Animated.View style={[styles.skeleton, styles.skeletonEnglish]} />
            <Animated.View style={[styles.skeleton, styles.skeletonInfo]} />
          </View>
        ) : (
          <TouchableOpacity onPress={handleAyahClick} style={styles.ayahContent}>
            <Text style={styles.arabicText}>{ayah.arabicText}</Text>
            <Text style={styles.englishText}>"{ayah.englishText}"</Text>
            <Text style={styles.ayahInfo}>
              Surah {ayah.surahNumber}, Ayah {ayah.ayahNumber}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.medium,
    },
    moodContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    dropdown: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: theme.spacing.medium,
      height: 40,
      marginLeft: theme.spacing.small,
    },
    dropdownPlaceholder: {
      color: theme.colors.text.muted,
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
    },
    dropdownSelectedText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.text.primary,
      fontFamily: 'Outfit_400Regular',
    },
    dropdownIcon: {
      width: 20,
      height: 20,
      tintColor: theme.colors.text.primary,
    },
    dropdownContainer: {
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.secondary,
      shadowColor: theme.shadows.default.shadowColor,
      shadowOffset: theme.shadows.default.shadowOffset,
      shadowOpacity: theme.shadows.default.shadowOpacity,
      shadowRadius: theme.shadows.default.shadowRadius,
    },
    ayahCard: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      marginVertical: theme.spacing.large,
    },
    ayahContent: {
      alignItems: 'center',
    },
    arabicText: {
      marginTop: theme.spacing.medium,
      fontFamily: 'Amiri_400Regular',
      fontSize: theme.fontSizes.xxLarge,
      lineHeight: theme.fontSizes.xxLarge * 2.5,
      textAlign: 'center',
      color: theme.colors.text.primary,
    },
    englishText: {
      fontSize: theme.fontSizes.medium,
      fontStyle: 'italic',
      textAlign: 'center',
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.medium,
      fontFamily: 'Outfit_400Regular',
    },
    ayahInfo: {
      marginTop: theme.spacing.small,
      fontSize: theme.fontSizes.small,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    skeleton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      marginVertical: theme.spacing.small,
    },
    skeletonArabic: {
      width: '80%',
      height: 30,
    },
    skeletonEnglish: {
      width: '90%',
      height: 20,
    },
    skeletonInfo: {
      width: '60%',
      height: 15,
    },
  });

export default DailyAyah;