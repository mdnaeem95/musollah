/**
 * Duas List Page - Modern Design
 * 
 * Browse and search Islamic supplications with modern UI
 * 
 * @version 2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { Doa, useDoas, searchDoas } from '../../../../api/services/duas';
import { useTheme } from '../../../../context/ThemeContext';
import DoaItem from '../../../../components/quran/DoaItem';
import { calculateContrastColor } from '../../../../utils';

const Doas = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  const { data: doas = [], isLoading, refetch } = useDoas();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDoaPress = useCallback(
    (doa: Doa) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/doas/${doa.number}`);
    },
    [router]
  );

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
  }, []);

  const handleBookmarkPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/bookmarks');
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredDoas = useMemo(() => {
    const filtered = searchDoas(doas, debounceQuery);
    return filtered.sort((a, b) => {
      const numA = parseInt(a.number, 10);
      const numB = parseInt(b.number, 10);
      return numA - numB;
    });
  }, [doas, debounceQuery]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderDoaItem = useCallback(
    ({ item, index }: { item: Doa; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'spring',
          delay: Math.min(index * 50, 500),
          damping: 20,
        }}
      >
        <DoaItem doa={item} onPress={handleDoaPress} />
      </MotiView>
    ),
    [handleDoaPress]
  );

  const renderHeader = useCallback(() => {
    const accentBg = theme.colors.accent;
    const accentText = calculateContrastColor(accentBg);

    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.headerWrapper}
      >
        {/* Search Bar */}
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.searchBar, { backgroundColor: theme.colors.secondary }]}
        >
          {/* Search Icon Badge */}
          <View style={[styles.searchIcon, { backgroundColor: accentBg }]}>
            <FontAwesome6 
              name="magnifying-glass" 
              size={16} 
              color={accentText} 
            />
          </View>

          {/* Search Input */}
          <TextInput
            placeholder="Search duas..."
            placeholderTextColor={theme.colors.text.muted}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />

          {/* Clear Button */}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="circle-xmark"
                size={20}
                color={theme.colors.text.muted}
                solid
              />
            </TouchableOpacity>
          )}

          {/* Bookmark Button */}
          <TouchableOpacity
            onPress={handleBookmarkPress}
            style={[styles.bookmarkButton, { backgroundColor: theme.colors.accent + '15' }]}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name="bookmark"
              size={18}
              color={theme.colors.accent}
              solid
            />
          </TouchableOpacity>
        </BlurView>

        {/* Results Count */}
        {searchQuery.length > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <Text style={[styles.resultsCount, { color: theme.colors.text.secondary }]}>
              {filteredDoas.length} {filteredDoas.length === 1 ? 'dua' : 'duas'} found
            </Text>
          </MotiView>
        )}
      </MotiView>
    );
  }, [
    searchQuery,
    filteredDoas.length,
    theme,
    isDarkMode,
    handleSearchChange,
    handleClearSearch,
    handleBookmarkPress,
  ]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.emptyContainer}
      >
        <BlurView
          intensity={20}
          tint={isDarkMode ? 'dark' : 'light'}
          style={[styles.emptyCard, { backgroundColor: theme.colors.secondary }]}
        >
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
            <FontAwesome6
              name="hands-praying"
              size={48}
              color={theme.colors.accent}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            {searchQuery ? 'No Duas Found' : 'No Duas Available'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}>
            {searchQuery
              ? `No duas match "${searchQuery}"`
              : 'Duas will appear here once loaded'}
          </Text>
        </BlurView>
      </MotiView>
    );
  }, [isLoading, searchQuery, theme, isDarkMode]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading State
  if (isLoading && !refreshing) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading Duas...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {/* Header */}
      {renderHeader()}

      {/* Duas List */}
      <FlashList
        estimatedItemSize={80}
        data={filteredDoas}
        renderItem={renderDoaItem}
        keyExtractor={(item) => `doa-${item.number}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        extraData={theme.colors.primary}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },

  // Header
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Results Count
  resultsCount: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 4,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    maxWidth: 340,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default Doas;