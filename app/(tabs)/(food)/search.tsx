/**
 * Food Search Page (REDESIGNED)
 * 
 * Modern search with enhanced UI, animations, and better restaurant cards.
 * 
 * @version 2.0
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
import { useRestaurantSearch } from '../../../hooks/food/useRestaurantSearch';
import { enter } from '../../../utils';

const SearchPage = () => {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();
  const router = useRouter();
  const inputRef = useAutoFocus();

  const {
    searchQuery,
    filteredRestaurants,
    recentSearches,
    isLoading,
    handleSearchChange,
    handleSearchSubmit,
    handleRecentSearchTap,
    handleRemoveSearch,
  } = useRestaurantSearch();

  const handleRestaurantPress = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/${id}`);
  };

  const handleRecentPress = (search: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handleRecentSearchTap(search);
  };

  const handleRemovePress = (search: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handleRemoveSearch(search);
  };

  const renderEmptyState = () => {
    if (searchQuery.trim() === '') {
      return null;
    }

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
          No restaurants found
        </Text>
        <Text style={[styles.emptySubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.50)' : theme.colors.text.secondary }]}>
          Try searching with different keywords
        </Text>
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
      {/* Enhanced Search Bar */}
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
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearchChange('')}
              style={styles.clearButton}
            >
              <FontAwesome6 name="circle-xmark" size={18} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      {/* Recent Searches */}
      {recentSearches.length > 0 && searchQuery.trim() === '' && (
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
            {recentSearches.map((search, index) => (
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
                  <TouchableOpacity
                    onPress={() => handleRecentPress(search)}
                    style={styles.recentChipContent}
                  >
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

      {/* Search Results */}
      <FlashList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={enter(0)}
          >
            <TouchableOpacity
              onPress={() => handleRestaurantPress(item.id)}
              activeOpacity={0.7}
            >
              <BlurView
                intensity={20}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[styles.restaurantCard, {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
                }]}
              >
                {/* Restaurant Image */}
                <Image
                  source={{ uri: item.image }}
                  style={styles.restaurantImage}
                  resizeMode="cover"
                />
                
                {/* Certification Badge Overlay */}
                {item.halal && (
                  <View style={styles.certificationOverlay}>
                    <View style={styles.miniCertBadge}>
                      <FontAwesome6 name="certificate" size={12} color="#4CAF50" />
                    </View>
                  </View>
                )}

                {/* Restaurant Info */}
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantHeader}>
                    <Text
                      style={[styles.restaurantName, { color: isDarkMode ? 'rgba(255,255,255,0.92)' : theme.colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    
                    {/* Distance Badge */}
                    <View style={[styles.distanceBadge, {
                      backgroundColor: accent + '15',
                    }]}>
                      <FontAwesome6
                        name="location-dot"
                        size={10}
                        color={accent}
                      />
                      <Text style={[styles.distanceText, { color: accent }]}>
                        1.2 km
                      </Text>
                    </View>
                  </View>

                  {/* Categories */}
                  <View style={styles.categoriesRow}>
                    {item.categories.slice(0, 2).map((category, idx) => (
                      <View
                        key={`${category}-${idx}`}
                        style={[styles.categoryPill, {
                          backgroundColor: accent + '10',
                        }]}
                      >
                        <Text style={[styles.categoryText, { color: accent }]}>
                          {category}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Address */}
                  <Text
                    style={[styles.restaurantAddress, { color: isDarkMode ? 'rgba(255,255,255,0.50)' : theme.colors.text.secondary }]}
                    numberOfLines={1}
                  >
                    {item.address}
                  </Text>
                </View>

                {/* Chevron */}
                <View style={styles.chevronContainer}>
                  <FontAwesome6
                    name="chevron-right"
                    size={16}
                    color={isDarkMode ? 'rgba(255,255,255,0.35)' : theme.colors.text.muted}
                  />
                </View>
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        )}
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
  restaurantCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  certificationOverlay: {
    position: 'absolute',
    left: 16,
    top: 16,
  },
  miniCertBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
  },
  restaurantAddress: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  chevronContainer: {
    marginLeft: 8,
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
  },
});

export default SearchPage;