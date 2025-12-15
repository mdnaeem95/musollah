/**
 * Bookmarks Page - Modern Design (Fixed Empty State)
 * 
 * @version 2.1 - Fixed empty state centering
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useQuranStore, QuranBookmark } from '../../../../stores/useQuranStore';
import { useDoaBookmarksStore, DoaBookmark } from '../../../../stores/useDoaBookmarkStore';
import { calculateContrastColor, enter } from '../../../../utils';

// ============================================================================
// TYPES
// ============================================================================

interface FolderHeaderProps {
  title: string;
  icon: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  theme: any;
  isDarkMode: boolean;
}

interface QuranBookmarkItemProps {
  item: QuranBookmark;
  index: number;
  onPress: (surahNumber: number, ayahNumber: number) => void;
  theme: any;
  isDarkMode: boolean;
}

interface DoaBookmarkItemProps {
  item: DoaBookmark;
  index: number;
  onPress: (doaId: string) => void;
  theme: any;
  isDarkMode: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Modern folder header with glassmorphism
 */
const FolderHeader = React.memo<FolderHeaderProps>(({ 
  title,
  icon,
  count, 
  isExpanded, 
  onToggle, 
  theme,
  isDarkMode,
}) => {
  const badgeBg = theme.colors.accent;
  const badgeText = calculateContrastColor(badgeBg);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.folderHeader, { backgroundColor: theme.colors.secondary }]}
        >
          {/* Left Side: Icon + Title */}
          <View style={styles.folderLeft}>
            <View style={[styles.folderIconBadge, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6
                name={icon}
                size={18}
                color={theme.colors.accent}
                solid
              />
            </View>
            <Text style={[styles.folderTitle, { color: theme.colors.text.primary }]}>
              {title}
            </Text>
          </View>

          {/* Right Side: Count + Chevron */}
          <View style={styles.folderRight}>
            <View style={[styles.countBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.countText, { color: badgeText }]}>
                {count}
              </Text>
            </View>
            <FontAwesome6
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.text.secondary}
            />
          </View>
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
});

FolderHeader.displayName = 'FolderHeader';

/**
 * Modern Quran bookmark item
 */
const QuranBookmarkItem = React.memo<QuranBookmarkItemProps>(({ 
  item,
  index,
  onPress, 
  theme,
  isDarkMode,
}) => {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item.surahNumber, item.ayahNumber);
  }, [item.surahNumber, item.ayahNumber, onPress]);
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.bookmarkItem, { backgroundColor: theme.colors.secondary }]}
        >
          {/* Left Side: Book Icon + Info */}
          <View style={styles.bookmarkLeft}>
            <View style={[styles.bookIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6
                name="book-quran"
                size={16}
                color={theme.colors.accent}
              />
            </View>
            <View style={styles.bookmarkInfo}>
              <Text style={[styles.surahName, { color: theme.colors.text.primary }]}>
                {item.surahName}
              </Text>
              <View style={styles.ayahRow}>
                <FontAwesome6
                  name="bookmark"
                  size={11}
                  color={theme.colors.text.secondary}
                  solid
                />
                <Text style={[styles.ayahInfo, { color: theme.colors.text.secondary }]}>
                  Ayah {item.ayahNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Side: Chevron */}
          <FontAwesome6
            name="chevron-right"
            size={16}
            color={theme.colors.text.muted}
          />
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
});

QuranBookmarkItem.displayName = 'QuranBookmarkItem';

/**
 * Modern Dua bookmark item
 */
const DoaBookmarkItem = React.memo<DoaBookmarkItemProps>(({ 
  item,
  index,
  onPress, 
  theme,
  isDarkMode,
}) => {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item.doaId);
  }, [item.doaId, onPress]);
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.bookmarkItem, { backgroundColor: theme.colors.secondary }]}
        >
          {/* Left Side: Hands Icon + Title */}
          <View style={styles.bookmarkLeft}>
            <View style={[styles.bookIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6
                name="hands-praying"
                size={16}
                color={theme.colors.accent}
              />
            </View>
            <Text style={[styles.doaTitle, { color: theme.colors.text.primary }]}>
              {item.doaTitle}
            </Text>
          </View>

          {/* Right Side: Chevron */}
          <FontAwesome6
            name="chevron-right"
            size={16}
            color={theme.colors.text.muted}
          />
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );
});

DoaBookmarkItem.displayName = 'DoaBookmarkItem';

/**
 * Modern empty state with glassmorphism
 */
const EmptyState = React.memo<{ 
  type: 'quran' | 'dua'; 
  theme: any;
  isDarkMode: boolean;
}>(({ type, theme, isDarkMode }) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={enter(0)}
      style={styles.emptyStateWrapper}
    >
      <BlurView
        intensity={20}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[styles.emptyState, { backgroundColor: theme.colors.secondary }]}
      >
        <View style={[styles.emptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6
            name={type === 'quran' ? 'book-quran' : 'hands-praying'}
            size={32}
            color={theme.colors.accent}
          />
        </View>
        <Text style={[styles.emptyStateText, { color: theme.colors.text.primary }]}>
          No {type === 'quran' ? 'Quran' : 'Dua'} bookmarks yet
        </Text>
        <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.secondary }]}>
          {type === 'quran'
            ? 'Bookmark ayahs while reading to save them here'
            : 'Bookmark duas to access them quickly'}
        </Text>
      </BlurView>
    </MotiView>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Overall empty state (no bookmarks at all)
 */
const OverallEmptyState = React.memo<{ 
  theme: any; 
  isDarkMode: boolean;
}>(({ theme, isDarkMode }) => {
  return (
    <View style={styles.overallEmptyContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(0)}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.overallEmptyCard, { backgroundColor: theme.colors.secondary }]}
        >
          <View style={[styles.overallEmptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6
              name="book-bookmark"
              size={48}
              color={theme.colors.accent}
            />
          </View>
          <Text style={[styles.overallEmptyTitle, { color: theme.colors.text.primary }]}>
            No Bookmarks Yet
          </Text>
          <Text style={[styles.overallEmptySubtext, { color: theme.colors.text.secondary }]}>
            Start saving your favorite ayahs and duas to access them quickly here
          </Text>
        </BlurView>
      </MotiView>
    </View>
  );
});

OverallEmptyState.displayName = 'OverallEmptyState';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BookmarkPage: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  // State
  const [isQuranExpanded, setIsQuranExpanded] = useState<boolean>(true);
  const [isDoasExpanded, setIsDoasExpanded] = useState<boolean>(true);

  // Zustand stores
  const quranBookmarks = useQuranStore((state) => state.bookmarks);
  const doaBookmarks = useDoaBookmarksStore((state) => state.bookmarks);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleQuranFolder = useCallback(() => {
    setIsQuranExpanded((prev) => !prev);
  }, []);

  const toggleDoasFolder = useCallback(() => {
    setIsDoasExpanded((prev) => !prev);
  }, []);

  const handleQuranBookmarkPress = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      router.push({
        pathname: `/surahs/${surahNumber}` as any,
        params: { ayahIndex: ayahNumber.toString() },
      });
    },
    [router]
  );

  const handleDoaBookmarkPress = useCallback(
    (doaId: string) => {
      router.push(`/doas/${doaId}` as any);
    },
    [router]
  );

  // Check if completely empty
  const hasNoBookmarks = quranBookmarks.length === 0 && doaBookmarks.length === 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {hasNoBookmarks ? (
        // Overall Empty State - Centered in full screen
        <OverallEmptyState theme={theme} isDarkMode={isDarkMode} />
      ) : (
        // Bookmarks List
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quran Folder */}
          <View style={styles.section}>
            <FolderHeader
              title="Quran Bookmarks"
              icon="book-quran"
              count={quranBookmarks.length}
              isExpanded={isQuranExpanded}
              onToggle={toggleQuranFolder}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            {isQuranExpanded && (
              <View style={styles.folderContent}>
                {quranBookmarks.length === 0 ? (
                  <EmptyState type="quran" theme={theme} isDarkMode={isDarkMode} />
                ) : (
                  quranBookmarks.map((item, index) => (
                    <QuranBookmarkItem
                      key={`quran-${item.surahNumber}-${item.ayahNumber}`}
                      item={item}
                      index={index}
                      onPress={handleQuranBookmarkPress}
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  ))
                )}
              </View>
            )}
          </View>

          {/* Duas Folder */}
          <View style={styles.section}>
            <FolderHeader
              title="Dua Bookmarks"
              icon="hands-praying"
              count={doaBookmarks.length}
              isExpanded={isDoasExpanded}
              onToggle={toggleDoasFolder}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            {isDoasExpanded && (
              <View style={styles.folderContent}>
                {doaBookmarks.length === 0 ? (
                  <EmptyState type="dua" theme={theme} isDarkMode={isDarkMode} />
                ) : (
                  doaBookmarks.map((item, index) => (
                    <DoaBookmarkItem
                      key={`doa-${item.doaId}`}
                      item={item}
                      index={index}
                      onPress={handleDoaBookmarkPress}
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },

  // Folder Header
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  folderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  folderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  folderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  countText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },

  // Folder Content
  folderContent: {
    marginTop: 12,
    gap: 12,
  },

  // Bookmark Item
  bookmarkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookmarkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkInfo: {
    flex: 1,
    gap: 4,
  },
  surahName: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  ayahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ayahInfo: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  doaTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },

  // Empty State
  emptyStateWrapper: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    maxWidth: 260,
  },

  // Overall Empty State - KEY FIX HERE
  overallEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  overallEmptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  overallEmptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  overallEmptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  overallEmptySubtext: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default BookmarkPage;