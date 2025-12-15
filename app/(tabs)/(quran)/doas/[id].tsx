/**
 * Dua Detail Page - Modern Design
 * 
 * Beautiful Islamic supplication display with glassmorphism
 * 
 * @version 2.0
 */

import React, { useCallback } from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../../../context/ThemeContext';
import { useDoaBookmarksStore } from '../../../../stores/useDoaBookmarkStore';
import { useDoa } from '../../../../api/services/duas';
import BookmarkIcon from '../../../../components/quran/BookmarkIcon';
import { enter } from '../../../../utils';

const DoaContent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, textSize, isDarkMode } = useTheme();
  
  const doa = useDoa(id);
  
  const { 
    addBookmark, 
    removeBookmark, 
    isBookmarked: checkIsBookmarked 
  } = useDoaBookmarksStore();

  const isBookmarked = checkIsBookmarked(id);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const showAddBookMarkToast = useCallback(() => {
    Toast.show({
      type: 'success',
      text1: 'Dua Added to Bookmarks',
      text2: 'You can find it in your bookmarks',
      visibilityTime: 2000,
      autoHide: true,
    });
  }, []);

  const showRemoveBookMarkToast = useCallback(() => {
    Toast.show({
      type: 'info',
      text1: 'Dua Removed from Bookmarks',
      visibilityTime: 2000,
      autoHide: true,
    });
  }, []);

  const toggleBookmark = useCallback(() => {
    if (!doa) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isBookmarked) {
      removeBookmark(id);
      showRemoveBookMarkToast();
    } else {
      addBookmark(id, doa.title);
      showAddBookMarkToast();
    }
  }, [doa, id, isBookmarked, removeBookmark, addBookmark, showAddBookMarkToast, showRemoveBookMarkToast]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (!doa) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading Dua...
        </Text>
      </View>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {/* Islamic Pattern Background */}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.headerCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.headerContent}>
              {/* Icon Badge */}
              <View style={[styles.iconBadge, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="hands-praying"
                  size={24}
                  color={theme.colors.accent}
                />
              </View>

              {/* Title */}
              <Text style={[styles.titleText, { color: theme.colors.text.primary }]}>
                {doa.title}
              </Text>

              {/* Bookmark */}
              <BookmarkIcon 
                isBookmarked={isBookmarked} 
                onToggle={toggleBookmark} 
                size={42} 
              />
            </View>
          </BlurView>
        </MotiView>

        {/* Arabic Text Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.contentCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Section Label */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="book-quran"
                  size={14}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                Arabic Text
              </Text>
            </View>

            {/* Arabic Text */}
            <Text
              style={[
                styles.arabicText,
                { 
                  color: theme.colors.text.primary, 
                  fontSize: textSize + 2,
                  lineHeight: (textSize + 2) * 2.2,
                },
              ]}
            >
              {doa.arabicText}
            </Text>
          </BlurView>
        </MotiView>

        {/* Romanization Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.contentCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Section Label */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="language"
                  size={14}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                Romanization
              </Text>
            </View>

            {/* Romanized Text */}
            <Text 
              style={[
                styles.romanizedText, 
                { 
                  color: theme.colors.text.primary, 
                  fontSize: textSize - 4,
                  lineHeight: (textSize - 4) * 1.6,
                }
              ]}
            >
              {doa.romanizedText}
            </Text>
          </BlurView>
        </MotiView>

        {/* Translation Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.contentCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Section Label */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6
                  name="message"
                  size={14}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.secondary }]}>
                Translation
              </Text>
            </View>

            {/* English Translation */}
            <Text 
              style={[
                styles.translationText, 
                { 
                  color: theme.colors.text.primary, 
                  fontSize: textSize - 4,
                  lineHeight: (textSize - 4) * 1.6,
                }
              ]}
            >
              {doa.englishTranslation}
            </Text>
          </BlurView>
        </MotiView>

        {/* Source Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.sourceCard, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.sourceRow}>
              <FontAwesome6
                name="book"
                size={14}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.sourceLabel, { color: theme.colors.text.secondary }]}>
                Source:
              </Text>
              <Text style={[styles.sourceText, { color: theme.colors.text.primary }]}>
                {doa.source}
              </Text>
            </View>
          </BlurView>
        </MotiView>
      </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Header Card
  headerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
    gap: 16,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  titleText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
  },

  // Content Cards
  contentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Text Styles
  arabicText: {
    fontFamily: 'Amiri_400Regular',
    textAlign: 'right',
  },
  romanizedText: {
    fontFamily: 'Outfit_400Regular',
  },
  translationText: {
    fontFamily: 'Outfit_400Regular',
  },

  // Source Card
  sourceCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  sourceText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});

export default DoaContent;