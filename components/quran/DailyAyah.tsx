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
import { View, Text, TouchableOpacity, Animated, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSurahWithTranslation } from '../../api/services/quran';
import { defaultStorage } from '../../api/client/storage';
import { getRandomAyahByMood } from '../../utils';
import { useTheme } from '../../context/ThemeContext';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Daily Ayah');

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
    logger.error('Error storing mood', error as Error);
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
    logger.error('Error reading cached ayah selection', error as Error);
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
    logger.error('Error caching ayah selection', error as Error);
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

const DailyAyah: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
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
        logger.debug('Using cached ayah selection', cached);
        setSelectedAyah({
          surahNumber: cached.surahNumber,
          ayahIndex: cached.ayahIndex,
        });
        return;
      }

      // Generate new random ayah
      logger.debug('Generating new random ayah for mood', { mood });
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
      logger.error('Invalid ayah index', new Error(`Invalid ayah index: ${ayahIndex}`));
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
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.ayahCard, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          }]}
        >
          <Text style={styles.errorText}>
            Failed to load daily ayah. Please try again.
          </Text>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mood Selector */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[styles.headerText, { color: isDarkMode ? 'rgba(255,255,255,0.75)' : theme.colors.text.secondary, fontSize: 13, marginBottom: 10 }]}>
          How are you feeling today?
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
            {MOODS.map((m) => {
              const isSelected = mood === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => handleMoodChange(m.value as Mood)}
                  disabled={isLoading}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    backgroundColor: isSelected ? theme.colors.accent + '20' : isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
                    borderColor: isSelected ? theme.colors.accent : isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Text style={{
                    fontFamily: isSelected ? 'Outfit_600SemiBold' : 'Outfit_500Medium',
                    fontSize: 13,
                    color: isSelected ? theme.colors.accent : isDarkMode ? 'rgba(255,255,255,0.70)' : theme.colors.text.secondary,
                  }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Ayah Card */}
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.ayahCard, {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
      >
        <Text style={styles.headerText}>Ayah of the Day</Text>

        {showSkeleton ? (
          <View style={styles.ayahContent}>
            <Animated.View style={[styles.skeleton, styles.skeletonArabic]} />
            <Animated.View style={[styles.skeleton, styles.skeletonEnglish]} />
            <Animated.View style={[styles.skeleton, styles.skeletonInfo]} />
          </View>
        ) : (
          <TouchableOpacity onPress={handleAyahClick} style={styles.ayahContent}>
            <Text style={[styles.arabicText, { color: isDarkMode ? 'rgba(255,255,255,0.92)' : theme.colors.text.primary }]}>{ayahData.arabicText}</Text>
            <Text style={[styles.englishText, { color: isDarkMode ? 'rgba(255,255,255,0.60)' : theme.colors.text.secondary }]}>"{ayahData.englishText}"</Text>
            <Text style={[styles.ayahInfo, { color: isDarkMode ? 'rgba(255,255,255,0.40)' : theme.colors.text.muted }]}>
              Surah {ayahData.surahNumber}, Ayah {ayahData.ayahNumber}
            </Text>
          </TouchableOpacity>
        )}
      </BlurView>
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
    headerText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    ayahCard: {
      backgroundColor: 'transparent',
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      marginVertical: theme.spacing.large,
      overflow: 'hidden',
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