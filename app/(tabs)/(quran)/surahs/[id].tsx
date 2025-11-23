// [id].tsx

import React, { useCallback, useLayoutEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
import { calculateContrastColor } from '../../../../utils'; // ✅ for ayah number contrast

// ============================================================================
// READ TOGGLE COMPONENT (COLORS ONLY)
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
            backgroundColor: accentColor, // ✅ themed
            transform: [{ scale: scaleAnim }] 
          }
        ]}>
          <FontAwesome6
            name="check"
            size={16}
            color={checkColor} // ✅ themed contrast
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
          borderColor: mutedBorderColor, // ✅ themed
          transform: [{ scale: scaleAnim }] 
        }
      ]} />
    </TouchableOpacity>
  );
};

// ============================================================================
// COMPONENT
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

  const { theme, textSize, reciter } = useTheme();
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

  const renderAyah = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      if (!surah) return null;

      const ayahNumber = index + 1;
      const englishText = surah.englishTranslations[index];
      const isAyahBookmarked = isBookmarked(ayahNumber);
      const isAyahRead = isRead(ayahNumber);

      const ayahPillBg = theme.colors.accent; // ✅ themed
      const ayahPillText = calculateContrastColor(ayahPillBg); // ✅ auto-contrast

      return (
        <View style={styles.ayahContainer}>
          <View style={[styles.topRow, { backgroundColor: theme.colors.secondary }]}>
            <View style={[styles.ayahNumber, { backgroundColor: ayahPillBg }]}>
              <Text style={[styles.ayahNumberText, { color: ayahPillText }]}>
                {ayahNumber}
              </Text>
            </View>

            <View style={styles.iconGroup}>
              <PlayPauseButton
                iconSize={20}
                color={theme.colors.text.primary}
                isActiveAyah={currentAyahIndex === index}
                currentAyahIndex={currentAyahIndex}
                trackIndex={index}
              />

              <TouchableOpacity
                onPress={() => toggleBookmark(ayahNumber)}
                style={styles.iconButton}
              >
                <BookmarkIcon 
                  isBookmarked={isAyahBookmarked}
                  onToggle={() => toggleBookmark(ayahNumber)} 
                />
              </TouchableOpacity>

              <ReadToggle
                isRead={isAyahRead}
                onToggle={() => toggleReadAyah(ayahNumber)}
                accentColor={theme.colors.accent}             // ✅ themed
                mutedBorderColor={theme.colors.text.muted}   // ✅ themed
              />
            </View>
          </View>

          <Text
            style={[
              styles.quranText,
              { color: theme.colors.text.arabic, fontSize: textSize },
            ]}
          >
            {item}
          </Text>

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

          <View
            style={[styles.separator, { backgroundColor: theme.colors.muted }]}
          />
        </View>
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
      textSize,
    ]
  );

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

  if (error) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.text.primary }}>
          Error loading surah: {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} /> {/* ✅ visible in dark */}
      </SafeAreaView>
    );
  }

  if (!surah) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <Text style={{ color: theme.colors.text.primary }}>Surah not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {renderProgressTracker()}

      <FlashList
        ref={listRef}
        estimatedItemSize={219}
        data={surah.arabicAyahs}
        renderItem={renderAyah}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        extraData={[readAyahsCount, theme.colors.primary]} // ✅ forces re-render on theme change
      />

      <FloatingPlayer
        style={[
          styles.floatingPlayer,
          { backgroundColor: theme.colors.secondary } // ✅ themed
        ]}
      />

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
// STYLES (UNCHANGED)
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
  readBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  unreadBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    backgroundColor: 'transparent',
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
