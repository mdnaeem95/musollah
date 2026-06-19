/**
 * Unified Nearby Search
 *
 * Searches every Nearby layer at once — halal restaurants + community
 * musollahs, mosques and bidets — with per-type badges and recent searches.
 * Food results open the restaurant detail route; facility results hand off to
 * the Nearby map (via useNearbyFocusStore) which opens their sheet.
 */

import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { FontAwesome6 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { useAccent } from '../../../hooks/useAccent';
import useAutoFocus from '../../../hooks/food/useAutoFocus';
import {
  useNearbySearch,
  NearbySearchResult,
  NearbyResultKind,
} from '../../../hooks/locations/useNearbySearch';
import { useNearbyFocusStore } from '../../../stores/useNearbyFocusStore';
import { enter } from '../../../utils';

const KIND_META: Record<NearbyResultKind, { icon: string; label: string; color: string }> = {
  food: { icon: 'utensils', label: 'Halal Food', color: '#F97316' },
  musollah: { icon: 'person-praying', label: 'Musollah', color: '#22C55E' },
  mosque: { icon: 'mosque', label: 'Mosque', color: '#0EA5E9' },
  bidet: { icon: 'toilet', label: 'Bidet', color: '#8B5CF6' },
};

const SearchPage = () => {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();
  const router = useRouter();
  const inputRef = useAutoFocus();
  const setFocus = useNearbyFocusStore((s) => s.setFocus);

  const {
    searchQuery,
    results,
    recentSearches,
    isSearching,
    handleSearchChange,
    handleSearchSubmit,
    handleRecentSearchTap,
    handleRemoveSearch,
  } = useNearbySearch();

  const handleResultPress = (item: NearbySearchResult) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSearchSubmit(); // remember the query
    if (item.kind === 'food') {
      router.push(`/${item.id}`);
    } else {
      // Hand the facility off to the Nearby map, then close the modal.
      setFocus({ kind: item.kind, id: item.id });
      router.back();
    }
  };

  const handleRecentPress = (search: string) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleRecentSearchTap(search);
  };

  const handleRemovePress = (search: string) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleRemoveSearch(search);
  };

  const renderEmptyState = () => {
    if (!isSearching) return null;
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.emptyContainer}
      >
        <View style={[styles.emptyIconContainer, { backgroundColor: accent + '15' }]}>
          <FontAwesome6 name="magnifying-glass" size={40} color={accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: isDarkMode ? 'rgba(255,255,255,0.88)' : theme.colors.text.primary }]}>
          Nothing found nearby
        </Text>
        <Text style={[styles.emptySubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.50)' : theme.colors.text.secondary }]}>
          Try a different name — food, musollahs, mosques or bidets
        </Text>
      </MotiView>
    );
  };

  const renderResult = ({ item, index }: { item: NearbySearchResult; index: number }) => {
    const meta = KIND_META[item.kind];
    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(0)}
      >
        <TouchableOpacity onPress={() => handleResultPress(item)} activeOpacity={0.7}>
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.resultCard, {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
            }]}
          >
            {/* Leading visual: food image, else a kind-coloured icon tile */}
            {item.kind === 'food' && item.image ? (
              <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.iconTile, { backgroundColor: meta.color + '1A' }]}>
                <FontAwesome6 name={meta.icon} size={20} color={meta.color} />
              </View>
            )}

            <View style={styles.resultInfo}>
              <Text
                style={[styles.resultTitle, { color: isDarkMode ? 'rgba(255,255,255,0.92)' : theme.colors.text.primary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>

              <View style={[styles.kindBadge, { backgroundColor: meta.color + '18' }]}>
                <FontAwesome6 name={meta.icon} size={9} color={meta.color} />
                <Text style={[styles.kindBadgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>

              {!!item.subtitle && (
                <Text
                  style={[styles.resultAddress, { color: isDarkMode ? 'rgba(255,255,255,0.50)' : theme.colors.text.secondary }]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>

            <FontAwesome6
              name="chevron-right"
              size={16}
              color={isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted}
            />
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#060B18', '#0C1428', '#080F1E'] : ['#EEF2FF', '#F0F4FF', '#E8EFFF']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <BlurView
            intensity={isDarkMode ? 18 : 22}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.searchBar, {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.90)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
              borderWidth: 1,
            }]}
          >
            <View style={[styles.searchIconContainer, { backgroundColor: accent }]}>
              <FontAwesome6 name="magnifying-glass" size={16} color="#fff" />
            </View>
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Search food, musollahs, mosques, bidets…"
              placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted}
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearchChange('')} style={styles.clearButton}>
                <FontAwesome6 name="circle-xmark" size={18} color={theme.colors.text.muted} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isSearching && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.recentSection}
          >
            <View style={styles.recentHeader}>
              <FontAwesome6 name="clock-rotate-left" size={16} color={accent} />
              <Text style={[styles.recentTitle, { color: isDarkMode ? 'rgba(255,255,255,0.88)' : theme.colors.text.primary }]}>
                Recent Searches
              </Text>
            </View>

            <View style={styles.recentChipsContainer}>
              {recentSearches.map((search) => (
                <MotiView
                  key={search}
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={enter(0)}
                >
                  <BlurView
                    intensity={20}
                    tint={isDarkMode ? 'dark' : 'light'}
                    style={[styles.recentChip, {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.10)' : accent + '20',
                    }]}
                  >
                    <TouchableOpacity onPress={() => handleRecentPress(search)} style={styles.recentChipContent}>
                      <FontAwesome6
                        name="clock"
                        size={12}
                        color={isDarkMode ? 'rgba(255,255,255,0.45)' : theme.colors.text.secondary}
                      />
                      <Text style={[styles.recentChipText, { color: isDarkMode ? 'rgba(255,255,255,0.80)' : theme.colors.text.primary }]}>
                        {search}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemovePress(search)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <FontAwesome6
                        name="xmark"
                        size={12}
                        color={isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted}
                      />
                    </TouchableOpacity>
                  </BlurView>
                </MotiView>
              ))}
            </View>
          </MotiView>
        )}

        {/* Results */}
        <FlashList
          data={results}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          renderItem={renderResult}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  searchBarContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  clearButton: {
    padding: 4,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  recentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentChipText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  iconTile: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 5,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  kindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  kindBadgeText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  resultAddress: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default SearchPage;
