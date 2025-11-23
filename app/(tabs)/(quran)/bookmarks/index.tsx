/**
 * Bookmarks Page
 * 
 * Displays user's saved bookmarks for:
 * - Quran ayahs
 * - Duas
 * 
 * ARCHITECTURE:
 * - Uses Zustand stores (no Redux)
 * - Organized in expandable folders
 * - Optimized renders with React.memo
 * - Type-safe with TypeScript
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { useQuranStore, QuranBookmark } from '../../../../stores/useQuranStore';
import { useDoaBookmarksStore, DoaBookmark } from '../../../../stores/useDoaBookmarkStore';

// ============================================================================
// TYPES
// ============================================================================

interface FolderHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  theme: any;
}

interface QuranBookmarkItemProps {
  item: QuranBookmark;
  onPress: (surahNumber: number, ayahNumber: number) => void;
  theme: any;
}

interface DoaBookmarkItemProps {
  item: DoaBookmark;
  onPress: (doaId: string) => void;
  theme: any;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Folder header with expand/collapse
 */
const FolderHeader = React.memo<FolderHeaderProps>(({ 
  title, 
  count, 
  isExpanded, 
  onToggle, 
  theme 
}) => {
  const styles = createStyles(theme);
  
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.folderHeader}
      activeOpacity={0.7}
    >
      <FontAwesome6
        name={isExpanded ? 'folder-open' : 'folder'}
        size={20}
        color={theme.colors.text.primary}
        solid
      />
      <Text style={styles.folderTitle}>
        {title} ({count})
      </Text>
      <FontAwesome6
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={theme.colors.text.primary}
      />
    </TouchableOpacity>
  );
});

FolderHeader.displayName = 'FolderHeader';

/**
 * Quran bookmark item
 */
const QuranBookmarkItem = React.memo<QuranBookmarkItemProps>(({ 
  item, 
  onPress, 
  theme 
}) => {
  const styles = createStyles(theme);
  
  const handlePress = useCallback(() => {
    onPress(item.surahNumber, item.ayahNumber);
  }, [item.surahNumber, item.ayahNumber, onPress]);
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.bookmarkItem}
      activeOpacity={0.7}
    >
      <View>
        <Text style={styles.surahName}>{item.surahName}</Text>
        <Text style={styles.ayahInfo}>Ayah {item.ayahNumber}</Text>
      </View>
      <FontAwesome6
        name="chevron-right"
        size={16}
        color={theme.colors.text.muted}
      />
    </TouchableOpacity>
  );
});

QuranBookmarkItem.displayName = 'QuranBookmarkItem';

/**
 * Dua bookmark item
 */
const DoaBookmarkItem = React.memo<DoaBookmarkItemProps>(({ 
  item, 
  onPress, 
  theme 
}) => {
  const styles = createStyles(theme);
  
  const handlePress = useCallback(() => {
    onPress(item.doaId);
  }, [item.doaId, onPress]);
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.bookmarkItem}
      activeOpacity={0.7}
    >
      <Text style={styles.surahName}>{item.doaTitle}</Text>
      <FontAwesome6
        name="chevron-right"
        size={16}
        color={theme.colors.text.muted}
      />
    </TouchableOpacity>
  );
});

DoaBookmarkItem.displayName = 'DoaBookmarkItem';

/**
 * Empty state component
 */
const EmptyState = React.memo<{ type: 'quran' | 'dua'; theme: any }>(({ type, theme }) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.emptyState}>
      <FontAwesome6
        name="bookmark"
        size={48}
        color={theme.colors.text.muted}
        solid={false}
      />
      <Text style={styles.emptyStateText}>
        No {type === 'quran' ? 'Quran' : 'Dua'} bookmarks yet
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {type === 'quran'
          ? 'Tap the bookmark icon while reading to save ayahs'
          : 'Tap the bookmark icon on duas to save them here'}
      </Text>
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BookmarkPage: React.FC = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  // State
  const [isQuranExpanded, setIsQuranExpanded] = useState<boolean>(false);
  const [isDoasExpanded, setIsDoasExpanded] = useState<boolean>(false);

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

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderQuranBookmark = useCallback(
    ({ item }: { item: QuranBookmark }) => (
      <QuranBookmarkItem
        item={item}
        onPress={handleQuranBookmarkPress}
        theme={theme}
      />
    ),
    [handleQuranBookmarkPress, theme]
  );

  const renderDoaBookmark = useCallback(
    ({ item }: { item: DoaBookmark }) => (
      <DoaBookmarkItem
        item={item}
        onPress={handleDoaBookmarkPress}
        theme={theme}
      />
    ),
    [handleDoaBookmarkPress, theme]
  );

  const keyExtractorQuran = useCallback(
    (item: QuranBookmark) => `${item.surahNumber}-${item.ayahNumber}`,
    []
  );

  const keyExtractorDoa = useCallback(
    (item: DoaBookmark) => item.doaId,
    []
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.mainContainer}>
      {/* Quran Folder */}
      <FolderHeader
        title="Quran"
        count={quranBookmarks.length}
        isExpanded={isQuranExpanded}
        onToggle={toggleQuranFolder}
        theme={theme}
      />

      {isQuranExpanded && (
        <>
          {quranBookmarks.length === 0 ? (
            <EmptyState type="quran" theme={theme} />
          ) : (
            <FlatList
              data={quranBookmarks}
              renderItem={renderQuranBookmark}
              keyExtractor={keyExtractorQuran}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* Doas Folder */}
      <FolderHeader
        title="Duas"
        count={doaBookmarks.length}
        isExpanded={isDoasExpanded}
        onToggle={toggleDoasFolder}
        theme={theme}
      />

      {isDoasExpanded && (
        <>
          {doaBookmarks.length === 0 ? (
            <EmptyState type="dua" theme={theme} />
          ) : (
            <FlatList
              data={doaBookmarks}
              renderItem={renderDoaBookmark}
              keyExtractor={keyExtractorDoa}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* Overall Empty State */}
      {quranBookmarks.length === 0 && doaBookmarks.length === 0 && (
        <View style={styles.overallEmptyState}>
          <FontAwesome6
            name="book-bookmark"
            size={64}
            color={theme.colors.text.muted}
            solid={false}
          />
          <Text style={styles.overallEmptyTitle}>No bookmarks yet</Text>
          <Text style={styles.overallEmptySubtext}>
            Start saving your favorite ayahs and duas to access them quickly
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (theme: any) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    folderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.medium,
      ...theme.shadows.default,
    },
    folderTitle: {
      flex: 1,
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.small,
    },
    listContent: {
      paddingBottom: theme.spacing.small,
    },
    bookmarkItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      marginBottom: theme.spacing.small,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      ...theme.shadows.default,
    },
    surahName: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xSmall,
    },
    ayahInfo: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.secondary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xLarge,
      paddingHorizontal: theme.spacing.large,
    },
    emptyStateText: {
      fontSize: theme.fontSizes.large,
      fontFamily: 'Outfit_600SemiBold',
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.medium,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
      marginTop: theme.spacing.small,
      textAlign: 'center',
    },
    overallEmptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.large,
    },
    overallEmptyTitle: {
      fontSize: theme.fontSizes.xLarge,
      fontFamily: 'Outfit_700Bold',
      color: theme.colors.text.primary,
      marginTop: theme.spacing.large,
      textAlign: 'center',
    },
    overallEmptySubtext: {
      fontSize: theme.fontSizes.medium,
      fontFamily: 'Outfit_400Regular',
      color: theme.colors.text.muted,
      marginTop: theme.spacing.small,
      textAlign: 'center',
      maxWidth: 280,
    },
  });

export default BookmarkPage;