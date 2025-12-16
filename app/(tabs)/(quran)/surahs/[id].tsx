/**
 * Surah Detail Page - Modern Design
 *
 * - Active ayah indicator: TEXT COLOR ONLY (Arabic + translation)
 * - Bigger Arabic line-height so harakat isn’t clipped
 * - Auto-scroll: keep active ayah centered while playing
 *
 * @version 2.1
 */

import React, { useCallback, useLayoutEffect, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
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

// ============================================================================
// READ TOGGLE COMPONENT
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
        <Animated.View
          style={[
            styles.readBadge,
            { backgroundColor: accentColor, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <FontAwesome6 name="check" size={14} color={checkColor} solid />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
      <Animated.View
        style={[
          styles.unreadBadge,
          { borderColor: mutedBorderColor, transform: [{ scale: scaleAnim }] },
        ]}
      />
    </TouchableOpacity>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SurahDetailScreen = () => {
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

  // --- dynamic Arabic line height (bigger so harakat isn't clipped)
  const arabicLineHeight = useMemo(() => {
    // conservative, works well across sizes
    return Math.round(textSize * 2.35);
  }, [textSize]);

  // --- keep header tappable to open picker
  useLayoutEffect(() => {
    if (!surah) return;

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
  }, [navigation, surah, isPickerVisible, theme.colors.text.primary, togglePickerVisibility]);

  // --- auto-scroll active ayah into middle while playing
  useEffect(() => {
    if (!surah) return;
    if (typeof currentAyahIndex !== 'number') return;
    if (currentAyahIndex < 0) return;
    if (!listRef?.current) return;

    // FlashList scrollToIndex supports viewPosition (0 = top, 0.5 = center)
    try {
      listRef.current.scrollToIndex({
        index: currentAyahIndex,
        animated: true,
        viewPosition: 0.5,
      });
    } catch {
      // ignore: index might be out of range briefly during surah switches
    }
  }, [currentAyahIndex, surah, listRef]);

  const renderAyah = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      if (!surah) return null;

      const ayahNumber = index + 1;
      const englishText = surah.englishTranslations[index];
      const isAyahBookmarked = isBookmarked(ayahNumber);
      const isAyahRead = isRead(ayahNumber);
      const isPlaying = currentAyahIndex === index;

      // ✅ ACTIVE INDICATOR: TEXT COLOR ONLY
      const activeTextColor = theme.colors.accent;
      const arabicColor = isPlaying ? activeTextColor : theme.colors.text.primary;
      const translationColor = isPlaying ? activeTextColor : theme.colors.text.secondary;

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
              <View style={[styles.ayahNumberBadge, { backgroundColor: ayahPillBg }]}>
                <Text style={[styles.ayahNumberText, { color: ayahPillText }]}>
                  {ayahNumber}
                </Text>
              </View>

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
                  color: arabicColor,
                  fontSize: textSize,
                  lineHeight: arabicLineHeight,
                  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
                },
              ]}
            >
              {item}
            </Text>

            {/* Translation */}
            <View style={styles.translationContainer}>
              <Text style={[styles.translationText, { color: translationColor }]}>
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
      arabicLineHeight,
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

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%`, backgroundColor: theme.colors.accent },
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

  // Loading
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading Surah...
        </Text>
      </SafeAreaView>
    );
  }

  // Error
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

  // No Surah
  if (!surah) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.errorMessage, { color: theme.colors.text.primary }]}>
          Surah not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {renderProgressTracker()}

      <FlashList
        ref={listRef}
        data={surah.arabicAyahs}
        renderItem={renderAyah}
        keyExtractor={(_, index) => `ayah-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        extraData={[readAyahsCount, currentAyahIndex, theme.colors.primary, textSize]}
      />

      <FloatingPlayer />

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
  mainContainer: { flex: 1 },
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
    paddingBottom: 110, // leave space for floating player
  },

  // Ayah Card
  ayahWrapper: { marginBottom: 16 },
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
  iconButton: { padding: 4 },

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
  picker: { width: '100%' },

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
