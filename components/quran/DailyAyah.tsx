/**
 * Daily Ayah Component
 * 
 * Displays a random Quranic verse based on user's mood.
 * Caches ayah for 24 hours per mood to show consistent daily content.
 * 
 * ARCHITECTURE:
 * - Uses TanStack Query for surah data fetching
 * - MMKV storage for mood and ayah caching
 * - Fetches full surah with translation when needed
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { useSurahWithTranslation } from '../../api/services/quran';
import { defaultStorage } from '../../api/client/storage';
import { getRandomAyahByMood } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const MOOD_KEY = 'selectedMood';
const AYAH_CACHE_KEY_PREFIX = 'dailyAyah';
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

interface CachedAyahSelection {
  surahNumber: number;
  ayahIndex: number; // 0-based index
  timestamp: number;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const getStoredMood = (): Mood => {
  try {
    const stored = defaultStorage.getString(MOOD_KEY);
    return (stored as Mood) || 'Neutral';
  } catch {
    return 'Neutral';
  }
};

const setStoredMood = (mood: Mood) => {
  try {
    defaultStorage.setString(MOOD_KEY, mood);
  } catch (error) {
    console.error('Error storing mood:', error);
  }
};

const getCachedAyahSelection = (mood: Mood): CachedAyahSelection | null => {
  try {
    const cacheKey = `${AYAH_CACHE_KEY_PREFIX}_${mood}`;
    const cached = defaultStorage.getString(cacheKey);
    
    if (!cached) return null;
    
    const selection = JSON.parse(cached) as CachedAyahSelection;
    const now = Date.now();
    
    // Check if cache is still valid (< 24 hours)
    if (now - selection.timestamp < CACHE_DURATION) {
      return selection;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading cached ayah selection:', error);
    return null;
  }
};

const setCachedAyahSelection = (mood: Mood, surahNumber: number, ayahIndex: number) => {
  try {
    const cacheKey = `${AYAH_CACHE_KEY_PREFIX}_${mood}`;
    const selection: CachedAyahSelection = {
      surahNumber,
      ayahIndex,
      timestamp: Date.now(),
    };
    defaultStorage.setString(cacheKey, JSON.stringify(selection));
  } catch (error) {
    console.error('Error caching ayah selection:', error);
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

const DailyAyah: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  // State
  const [mood, setMood] = useState<Mood>(() => getStoredMood());
  const [selectedAyah, setSelectedAyah] = useState<{
    surahNumber: number;
    ayahIndex: number;
  } | null>(null);
  const [isSwitchingMood, setIsSwitchingMood] = useState(false);

  // ============================================================================
  // DETERMINE WHICH AYAH TO SHOW
  // ============================================================================

  useEffect(() => {
    const determineAyah = () => {
      // Check cache first
      const cached = getCachedAyahSelection(mood);
      
      if (cached) {
        console.log('📖 Using cached ayah selection:', cached);
        setSelectedAyah({
          surahNumber: cached.surahNumber,
          ayahIndex: cached.ayahIndex,
        });
        return;
      }

      // Generate new random ayah
      console.log('🎲 Generating new random ayah for mood:', mood);
      const randomAyah = getRandomAyahByMood(mood);
      
      // Convert to 0-based index for API
      const ayahIndex = randomAyah.ayahNumber - 1;
      
      setSelectedAyah({
        surahNumber: randomAyah.surahNumber,
        ayahIndex,
      });
      
      // Cache the selection
      setCachedAyahSelection(mood, randomAyah.surahNumber, ayahIndex);
    };

    determineAyah();
  }, [mood]);

  // ============================================================================
  // FETCH SURAH DATA
  // ============================================================================

  const {
    data: surahData,
    isLoading,
    error,
  } = useSurahWithTranslation(selectedAyah?.surahNumber ?? 1);

  // ============================================================================
  // EXTRACT AYAH TEXT
  // ============================================================================

  const ayahData: DailyAyahData | null = React.useMemo(() => {
    if (!surahData || !selectedAyah) return null;

    const { arabic, translation } = surahData;
    const ayahIndex = selectedAyah.ayahIndex;

    // Validate index
    if (ayahIndex < 0 || ayahIndex >= arabic.ayahs.length) {
      console.error('Invalid ayah index:', ayahIndex);
      return null;
    }

    const arabicAyah = arabic.ayahs[ayahIndex];
    const englishAyah = translation.ayahs[ayahIndex];

    return {
      arabicText: arabicAyah.text,
      englishText: englishAyah.text,
      surahNumber: selectedAyah.surahNumber,
      ayahNumber: ayahIndex + 1, // Convert back to 1-based for display
    };
  }, [surahData, selectedAyah]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMoodChange = (newMood: Mood) => {
    setIsSwitchingMood(true);
    setMood(newMood);
    setStoredMood(newMood);

    // Reset switching state after transition
    setTimeout(() => {
      setIsSwitchingMood(false);
    }, 300);
  };

  const handleAyahClick = () => {
    if (!ayahData) return;

    router.push({
      pathname: `/surahs/${ayahData.surahNumber}`,
      params: { ayahIndex: ayahData.ayahNumber },
    });
  };

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  const showSkeleton = isLoading || isSwitchingMood || !ayahData;

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.ayahCard}>
          <Text style={styles.errorText}>
            Failed to load daily ayah. Please try again.
          </Text>
        </View>
      </View>
    );
  }

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
            <Text style={styles.arabicText}>{ayahData.arabicText}</Text>
            <Text style={styles.englishText}>"{ayahData.englishText}"</Text>
            <Text style={styles.ayahInfo}>
              Surah {ayahData.surahNumber}, Ayah {ayahData.ayahNumber}
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
    errorText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.error,
      textAlign: 'center',
      fontFamily: 'Outfit_400Regular',
      marginTop: theme.spacing.medium,
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