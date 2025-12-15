/**
 * Surah Detail Page - Modern Design
 * 
 * Read Quran with glassmorphism cards, audio playback, and progress tracking
 * 
 * @version 2.0
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useSurahDetailPage } from '../../../../hooks/quran/useSurahDetailPage';
import { useSurahs } from '../../../../api/services/quran';
import { PlayPauseButton } from '../../../../components/quran/AyahPlayPauseButton';
import { FloatingPlayer } from '../../../../components/quran/FloatingPlayer';
import BookmarkIcon from '../../../../components/quran/BookmarkIcon';
import { calculateContrastColor, enter } from '../../../../utils';
import IslamicPatternOverlay from '../../../../components/food/IslamicPatternOverlay';

// ============================================================================
// READ TOGGLE COMPONENT (MODERNIZED)
// ============================================================================

const ReadToggle = ({ 
  isRead, 
  onToggle, 
  accentColor, 
  mutedBorderColor,
}: { 
  isRead: boolean; 
  onToggle: () => void; 
  accentColor: string; 
  mutedBorderColor: string;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const checkColor = calculateContrastColor(accentColor);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  if (isRead) {
    return (
      <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
        <Animated.View style={[
          styles.readBadge, 
          { 
            backgroundColor: accentColor,
            transform: [{ scale: scaleAnim }] 
          }
        ]}>
          <FontAwesome6
            name="check"
            size={14}
            color={checkColor}
            solid
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
      <Animated.View style={[
        styles.unreadBadge, 
        { 
          borderColor: mutedBorderColor,
          transform: [{ scale: scaleAnim }] 
        }
      ]} />
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SurahDetailScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

  const { id, ayahIndex } = useLocalSearchParams<{
    id: string;
    ayahIndex?: string;
  }>();

  const surahNumber = id ? parseInt(id, 10) : 1;
  const initialAyahIndex = ayahIndex ? parseInt(ayahIndex, 10) : undefined;

  const { theme, isDarkMode, textSize, reciter } = useTheme();
  const { data: surahs = [] } = useSurahs();

  const {
    surah,
    isLoading,
    error,
    currentAyahIndex,
    isPickerVisible,
    selectedSurah,
    readAyahsCount,
    toggleBookmark,
    toggleReadAyah,
    isBookmarked,
    isRead,
    handleSurahChange,
    togglePickerVisibility,
    listRef,
  } = useSurahDetailPage({
    surahNumber,
    initialAyahIndex,
    reciter,
  });

  useLayoutEffect(() => {
    if (surah) {
      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              togglePickerVisibility();
            }}
            style={styles.headerContainer}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>
              {surah.englishName}
            </Text>
            <FontAwesome6
              name={isPickerVisible ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, surah, isPickerVisible, theme, togglePickerVisibility]);

  const renderAyah = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      if (!surah) return null;

      const ayahNumber = index + 1;
      const englishText = surah.englishTranslations[index];
      const isAyahBookmarked = isBookmarked(ayahNumber);
      const isAyahRead = isRead(ayahNumber);
      const isPlaying = currentAyahIndex === index;

      const ayahPillBg = theme.colors.accent;
      const ayahPillText = calculateContrastColor(ayahPillBg);

      return (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
          style={styles.ayahWrapper}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.ayahCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Top Row: Number & Actions */}
            <View style={styles.topRow}>
              {/* Ayah Number Badge */}
              <View style={[styles.ayahNumberBadge, { backgroundColor: ayahPillBg }]}>
                <Text style={[styles.ayahNumberText, { color: ayahPillText }]}>
                  {ayahNumber}
                </Text>
              </View>

              {/* Action Icons */}
              <View style={styles.iconGroup}>
                <PlayPauseButton
                  iconSize={20}
                  color={isPlaying ? theme.colors.accent : theme.colors.text.primary}
                  isActiveAyah={isPlaying}
                  currentAyahIndex={currentAyahIndex}
                  trackIndex={index}
                />

                <BookmarkIcon 
                  isBookmarked={isAyahBookmarked}
                  onToggle={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleBookmark(ayahNumber);
                  }}
                  size={36}
                />

                <ReadToggle
                  isRead={isAyahRead}
                  onToggle={() => toggleReadAyah(ayahNumber)}
                  accentColor={theme.colors.accent}
                  mutedBorderColor={theme.colors.text.muted}
                />
              </View>
            </View>

            {/* Arabic Text */}
            <Text
              style={[
                styles.quranText,
                { 
                  color: theme.colors.text.primary,
                  fontSize: textSize 
                },
              ]}
            >
              {item}
            </Text>

            {/* Translation */}
            <View style={styles.translationContainer}>
              <Text style={[styles.translationText, { color: theme.colors.text.secondary }]}>
                {englishText}
              </Text>
            </View>
          </BlurView>
        </MotiView>
      );
    },
    [
      surah,
      currentAyahIndex,
      isBookmarked,
      isRead,
      toggleBookmark,
      toggleReadAyah,
      theme,
      isDarkMode,
      textSize,
    ]
  );

  const renderProgressTracker = useCallback(() => {
    if (!surah) return null;

    const progressPercentage = Math.round((readAyahsCount / surah.numberOfAyahs) * 100);

    return (
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.progressCard, { backgroundColor: theme.colors.secondary }]}
      >
        {/* Header */}
        <View style={styles.progressHeader}>
          <View style={styles.progressTitleRow}>
            <FontAwesome6 name="book-quran" size={16} color={theme.colors.accent} />
            <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>
              {surah.number}. {surah.englishName}
            </Text>
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.progressCount, { color: theme.colors.accent }]}>
              {readAyahsCount}/{surah.numberOfAyahs}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.muted }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: theme.colors.accent 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressPercentage, { color: theme.colors.text.secondary }]}>
            {progressPercentage}%
          </Text>
        </View>
      </BlurView>
    );
  }, [surah, readAyahsCount, theme, isDarkMode]);

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <IslamicPatternOverlay opacity={0.04} />
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading Surah...
        </Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={enter(0)}
          style={styles.errorContainer}
        >
          <View style={[styles.errorIcon, { backgroundColor: theme.colors.text.error + '15' }]}>
            <FontAwesome6 name="triangle-exclamation" size={48} color={theme.colors.text.error} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>
            Something Went Wrong
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.text.secondary }]}>
            {error.message}
          </Text>
        </MotiView>
      </SafeAreaView>
    );
  }

  // No Surah Found
  if (!surah) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <IslamicPatternOverlay opacity={0.04} />
        <Text style={[styles.errorMessage, { color: theme.colors.text.primary }]}>
          Surah not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {/* Progress Tracker */}
      {renderProgressTracker()}

      {/* Ayah List */}
      <FlashList
        ref={listRef}
        data={surah.arabicAyahs}
        renderItem={renderAyah}
        keyExtractor={(item, index) => `ayah-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        extraData={[readAyahsCount, currentAyahIndex, theme.colors.primary]}
      />

      {/* Floating Audio Player */}
      <FloatingPlayer />

      {/* Surah Picker Modal */}
      {isPickerVisible && (
        <BlurView
          intensity={40}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.pickerContainer, { backgroundColor: theme.colors.secondary }]}
        >
          <Picker
            selectedValue={selectedSurah}
            onValueChange={(value) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSurahChange(value);
            }}
            style={styles.picker}
          >
            {surahs.map((s) => (
              <Picker.Item
                key={s.number}
                label={`${s.number}. ${s.englishName}`}
                value={s.number}
                color={theme.colors.text.primary}
              />
            ))}
          </Picker>
        </BlurView>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },

  // Progress Card
  progressCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCount: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    minWidth: 40,
    textAlign: 'right',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Ayah Card
  ayahWrapper: {
    marginBottom: 16,
  },
  ayahCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ayahNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ayahNumberText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },

  // Read Toggle
  readBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },

  // Text Content
  quranText: {
    fontFamily: 'Amiri_400Regular',
    lineHeight: 40,
    textAlign: 'right',
    marginBottom: 16,
  },
  translationContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  translationText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },

  // Picker Modal
  pickerContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 8,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },

  // Loading State
  loadingText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    marginTop: 16,
  },

  // Error State
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
});

export default SurahDetailScreen;