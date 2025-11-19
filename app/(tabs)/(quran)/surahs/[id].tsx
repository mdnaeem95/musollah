/**
 * Surah Detail Screen
 * 
 * Displays Quran surah with Arabic text, English translation, and audio playback.
 * Supports bookmarking, read tracking, and navigation between surahs.
 * 
 * Architecture: Presentational component using custom hooks for business logic.
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '../../../../context/ThemeContext';
import { useSurahDetailPage } from '../../../../hooks/quran/useSurahDetailPage';
import { useSurahs } from '../../../../api/services/quran';
import { PlayPauseButton } from '../../../../components/quran/AyahPlayPauseButton';
import { FloatingPlayer } from '../../../../components/quran/FloatingPlayer';
import BookmarkIcon from '../../../../components/quran/BookmarkIcon';

// ============================================================================
// COMPONENT
// ============================================================================

const SurahDetailScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();

  // URL params
  const { id, ayahIndex } = useLocalSearchParams<{
    id: string;
    ayahIndex?: string;
  }>();

  // Parse params
  const surahNumber = id ? parseInt(id, 10) : 1;
  const initialAyahIndex = ayahIndex ? parseInt(ayahIndex, 10) : undefined;

  // Theme
  const { theme, textSize, reciter } = useTheme();

  // Surahs list (for picker)
  const { data: surahs = [] } = useSurahs();

  // Business logic
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

  /**
   * Set dynamic header with surah name and picker toggle
   */
  useLayoutEffect(() => {
    if (surah) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>
              {surah.englishName}
            </Text>
            <TouchableOpacity onPress={togglePickerVisibility}>
              <FontAwesome6
                name={isPickerVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, surah, isPickerVisible, theme, togglePickerVisibility]);

  /**
   * Render individual ayah
   */
  const renderAyah = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      if (!surah) return null;

      const ayahNumber = index + 1;
      const englishText = surah.englishTranslations[index];
      const isAyahBookmarked = isBookmarked(ayahNumber);
      const isAyahRead = isRead(ayahNumber);

      return (
        <View style={styles.ayahContainer}>
          {/* Top row: Ayah number + actions */}
          <View style={[styles.topRow, { backgroundColor: theme.colors.secondary }]}>
            <View style={styles.ayahNumber}>
              <Text style={styles.ayahNumberText}>{ayahNumber}</Text>
            </View>

            <View style={styles.iconGroup}>
              {/* Play/Pause */}
                <PlayPauseButton
                iconSize={20}
                color={theme.colors.text.primary}
                isActiveAyah={currentAyahIndex === index}
                currentAyahIndex={currentAyahIndex}
                trackIndex={index}
                />


              {/* Bookmark */}
              <TouchableOpacity
                onPress={() => toggleBookmark(ayahNumber)}
                style={styles.iconButton}
              >
                <BookmarkIcon 
                    isBookmarked={isAyahBookmarked}
                    onToggle={() => toggleBookmark(ayahNumber)} 
                />
              </TouchableOpacity>

              {/* Read/Unread */}
              <TouchableOpacity
                onPress={() => toggleReadAyah(ayahNumber)}
                style={styles.iconButton}
              >
                <FontAwesome6
                  name={isAyahRead ? 'circle-check' : 'circle'}
                  size={20}
                  color={isAyahRead ? theme.colors.primary : theme.colors.text.secondary}
                  solid={isAyahRead}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Arabic text */}
          <Text
            style={[
              styles.quranText,
              { color: theme.colors.text.primary, fontSize: textSize },
            ]}
          >
            {item}
          </Text>

          {/* English translation */}
          <View style={styles.translationContainer}>
            <Text
              style={[
                styles.translationText,
                { color: theme.colors.text.secondary },
              ]}
            >
              {englishText}
            </Text>
          </View>

          {/* Separator */}
          <View
            style={[styles.separator, { backgroundColor: theme.colors.muted }]}
          />
        </View>
      );
    },
    [
      surah,
      surahNumber,
      currentAyahIndex,
      isBookmarked,
      isRead,
      toggleBookmark,
      toggleReadAyah,
      theme,
      textSize,
    ]
  );

  /**
   * Render progress tracker
   */
  const renderProgressTracker = useCallback(() => {
    if (!surah) return null;

    return (
      <View
        style={[styles.progressContainer, { backgroundColor: theme.colors.secondary }]}
      >
        <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
          {`${surah.number}. ${surah.englishName}`}
        </Text>
        <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
          Progress: {readAyahsCount}/{surah.numberOfAyahs}
        </Text>
      </View>
    );
  }, [surah, readAyahsCount, theme]);

  /**
   * Error state
   */
  if (error) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.text.primary }}>
          Error loading surah: {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  /**
   * Not found state
   */
  if (!surah) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.text.primary }}>Surah not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {/* Progress Tracker */}
      {renderProgressTracker()}

      {/* Ayahs List */}
      <FlashList
        ref={listRef}
        estimatedItemSize={219}
        data={surah.arabicAyahs}
        renderItem={renderAyah}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Floating Audio Player */}
      <FloatingPlayer style={styles.floatingPlayer} />

      {/* Surah Picker Dropdown */}
      {isPickerVisible && (
        <View
          style={[
            styles.pickerContainer,
            { backgroundColor: theme.colors.modalBackground },
          ]}
        >
          <Picker
            selectedValue={selectedSurah}
            onValueChange={handleSurahChange}
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
        </View>
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
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
  },
  pickerContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    zIndex: 10,
    borderRadius: 5,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  picker: {
    width: '100%',
  },
  progressContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
  },
  ayahContainer: {
    flex: 1,
    paddingVertical: 10,
    marginBottom: 10,
  },
  topRow: {
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  ayahNumber: {
    backgroundColor: '#6A807B',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  ayahNumberText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  quranText: {
    fontFamily: 'Amiri_400Regular',
    fontWeight: '400',
    paddingTop: 10,
    paddingBottom: 10,
    textAlign: 'right',
    paddingHorizontal: 20,
  },
  translationContainer: {
    width: '100%',
  },
  translationText: {
    fontFamily: 'Outfit_400Regular',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  separator: {
    width: '100%',
    height: 1,
  },
  floatingPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#252525',
    zIndex: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

export default SurahDetailScreen;