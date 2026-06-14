/**
 * Quran Search Screen
 *
 * Full-text search across all 6236 ayahs (English translation + surah names).
 * Builds a search index in the background on first open; instant on subsequent opens
 * thanks to MMKV permanent caching.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useQuranSearch, SearchResult } from '../../../../hooks/quran/useQuranSearch';
import { enter } from '../../../../utils';

// ============================================================================
// HELPERS
// ============================================================================

function getSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) {
    return text.length > 120 ? text.slice(0, 120) + '...' : text;
  }
  const start = Math.max(0, idx - 35);
  const end = Math.min(text.length, idx + query.length + 65);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet += '...';
  return snippet;
}

// ============================================================================
// HIGHLIGHTED TEXT
// ============================================================================

const HighlightedText = React.memo(
  ({
    text,
    query,
    style,
    accentColor,
  }: {
    text: string;
    query: string;
    style: any;
    accentColor: string;
  }) => {
    if (!query || query.length < 2) {
      return <Text style={style}>{text}</Text>;
    }
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) return <Text style={style}>{text}</Text>;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);

    return (
      <Text style={style}>
        {before}
        <Text style={[style, { color: accentColor, fontFamily: 'Outfit_600SemiBold' }]}>
          {match}
        </Text>
        {after}
      </Text>
    );
  }
);

// ============================================================================
// RESULT CARD
// ============================================================================

const ResultCard = React.memo(
  ({
    result,
    query,
    isDarkMode,
    accentColor,
    onPress,
  }: {
    result: SearchResult;
    query: string;
    isDarkMode: boolean;
    accentColor: string;
    onPress: (result: SearchResult) => void;
  }) => {
    const snippet = getSnippet(result.translation, query);

    return (
      <TouchableOpacity onPress={() => onPress(result)} activeOpacity={0.75}>
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.resultCard,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.88)',
              borderWidth: 1,
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.09)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          {/* Reference badge */}
          <View style={styles.resultHeader}>
            <View style={[styles.refBadge, { backgroundColor: accentColor + '18' }]}>
              <Text style={[styles.refText, { color: accentColor }]}>
                {result.surahNumber}:{result.ayahNumber}
              </Text>
            </View>
            <Text
              style={[
                styles.surahName,
                {
                  color: isDarkMode
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(0,0,0,0.45)',
                },
              ]}
              numberOfLines={1}
            >
              {result.surahName}
              {result.surahNameTranslation
                ? ` · ${result.surahNameTranslation}`
                : ''}
            </Text>
            <FontAwesome6
              name="chevron-right"
              size={12}
              color={isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
            />
          </View>

          {/* Translation snippet */}
          <HighlightedText
            text={snippet}
            query={query}
            accentColor={accentColor}
            style={[
              styles.snippet,
              {
                color: isDarkMode
                  ? 'rgba(255,255,255,0.80)'
                  : 'rgba(0,0,0,0.75)',
              },
            ]}
          />
        </BlurView>
      </TouchableOpacity>
    );
  }
);

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function QuranSearchScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const { query, setQuery, results, isIndexing, indexProgress, loadedCount } =
    useQuranSearch();

  // Auto-focus the search input
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: `/surahs/${result.surahNumber}`,
        params: { ayahIndex: result.ayahNumber },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(0)}
        style={{ marginBottom: 10 }}
      >
        <ResultCard
          result={item}
          query={query}
          isDarkMode={isDarkMode}
          accentColor={theme.colors.accent}
          onPress={handleResultPress}
        />
      </MotiView>
    ),
    [query, isDarkMode, theme.colors.accent, handleResultPress]
  );

  const renderEmpty = useCallback(() => {
    if (!query || query.length < 2) {
      return (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconBg,
              { backgroundColor: theme.colors.accent + '15' },
            ]}
          >
            <FontAwesome6
              name="magnifying-glass"
              size={32}
              color={theme.colors.accent}
            />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              {
                color: isDarkMode
                  ? 'rgba(255,255,255,0.88)'
                  : theme.colors.text.primary,
              },
            ]}
          >
            Search 6,236 Ayahs
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: isDarkMode
                  ? 'rgba(255,255,255,0.45)'
                  : theme.colors.text.secondary,
              },
            ]}
          >
            {isIndexing
              ? `Loading ${loadedCount}/114 surahs...`
              : 'Search by keyword, surah name, or translation'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconBg,
            { backgroundColor: theme.colors.accent + '15' },
          ]}
        >
          <FontAwesome6
            name="circle-xmark"
            size={32}
            color={theme.colors.accent}
          />
        </View>
        <Text
          style={[
            styles.emptyTitle,
            {
              color: isDarkMode
                ? 'rgba(255,255,255,0.88)'
                : theme.colors.text.primary,
            },
          ]}
        >
          No Results
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {
              color: isDarkMode
                ? 'rgba(255,255,255,0.45)'
                : theme.colors.text.secondary,
            },
          ]}
        >
          {`No ayahs found for "${query}"`}
        </Text>
      </View>
    );
  }, [query, isIndexing, loadedCount, isDarkMode, theme]);

  return (
    <LinearGradient
      colors={
        isDarkMode
          ? (['#060B18', '#0C1428', '#080F1E'] as const)
          : (['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const)
      }
      style={styles.container}
    >
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.90)',
              borderWidth: 1,
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.10)'
                : 'rgba(0,0,0,0.07)',
            },
          ]}
        >
          <FontAwesome6
            name="magnifying-glass"
            size={16}
            color={
              isDarkMode ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)'
            }
          />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by keyword or surah name..."
            placeholderTextColor={
              isDarkMode ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)'
            }
            style={[
              styles.searchInput,
              {
                color: isDarkMode
                  ? 'rgba(255,255,255,0.88)'
                  : theme.colors.text.primary,
              },
            ]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesome6
                name="circle-xmark"
                size={18}
                color={
                  isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)'
                }
                solid
              />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      {/* Index progress (shown only while indexing and no query yet) */}
      {isIndexing && query.length === 0 && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={enter(0)}
          style={styles.progressWrapper}
        >
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text
              style={[
                styles.progressLabel,
                {
                  color: isDarkMode
                    ? 'rgba(255,255,255,0.45)'
                    : theme.colors.text.secondary,
                },
              ]}
            >
              {`Building index... ${loadedCount}/114`}
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(indexProgress * 100)}%`,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
        </MotiView>
      )}

      {/* Results count */}
      {results.length > 0 && (
        <Text
          style={[
            styles.resultsCount,
            {
              color: isDarkMode
                ? 'rgba(255,255,255,0.40)'
                : theme.colors.text.secondary,
            },
          ]}
        >
          {results.length === 50
            ? 'Showing first 50 results'
            : `${results.length} ${results.length === 1 ? 'ayah' : 'ayahs'} found`}
        </Text>
      )}

      {/* Results list */}
      <FlashList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.surahNumber}:${item.ayahNumber}`}
        estimatedItemSize={100}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        extraData={query}
      />
    </LinearGradient>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Search bar
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    padding: 0,
  },

  // Index progress
  progressWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Results count
  resultsCount: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Result card
  resultCard: {
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  refBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refText: {
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  surahName: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  snippet: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
  },
});
