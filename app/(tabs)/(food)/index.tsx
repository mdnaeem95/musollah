/**
 * Restaurant Locator Screen
 *
 * Main food tab displaying halal restaurants with map, categories,
 * and location-based recommendations.
 *
 * @version 2.0 - Fixed region undefined crash, improved performance
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../../context/ThemeContext';
import { useFoodTab } from '../../../hooks/food/useFoodTab';

// Components
import SearchBar from '../../../components/food/SearchBar';
import CategoryPill from '../../../components/food/CategoryPill';
import RestaurantCard from '../../../components/food/RestaurantCard';
import RestaurantMap from '../../../components/food/RestaurantMap';
import RestaurantCardSkeleton from '../../../components/food/RestaurantCardSkeleton';
import CategoryPillSkeleton from '../../../components/food/CategoryPillSkeleton';

// Types
import type { Restaurant } from '../../../utils/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SKELETON_COUNT = 5;
const ANIMATION_STAGGER_DELAY = 80;

// ============================================================================
// MEMOIZED SUB-COMPONENTS
// ============================================================================

interface CategoryItemProps {
  item: string;
  index: number;
  isSelected: boolean;
  onPress: (category: string) => void;
}

const CategoryItem = memo<CategoryItemProps>(
  ({ item, index, isSelected, onPress }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * ANIMATION_STAGGER_DELAY }}
    >
      <CategoryPill
        label={item}
        selected={isSelected}
        onPress={() => onPress(item)}
      />
    </MotiView>
  )
);

interface RestaurantItemProps {
  item: Restaurant;
  index: number;
  distance: string;
}

const RestaurantItem = memo<RestaurantItemProps>(({ item, index, distance }) => (
  <MotiView
    from={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 100 }}
  >
    <RestaurantCard restaurant={item} distance={distance} />
  </MotiView>
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RestaurantLocator = () => {
  const { theme } = useTheme();

  const {
    restaurants,
    recommendedRestaurants,
    categories,
    selectedCategories,
    region,
    isLoading,
    handleCategorySelect,
    getRestaurantDistance,
  } = useFoodTab();

  // Memoized render functions for FlatList
  const renderCategoryItem = useCallback<ListRenderItem<string | null>>(
    ({ item, index }) => {
      if (!item) {
        return <CategoryPillSkeleton />;
      }
      return (
        <CategoryItem
          item={item}
          index={index}
          isSelected={selectedCategories.includes(item)}
          onPress={handleCategorySelect}
        />
      );
    },
    [selectedCategories, handleCategorySelect]
  );

  const renderRestaurantItem = useCallback<ListRenderItem<Restaurant | null>>(
    ({ item, index }) => {
      if (!item) {
        return <RestaurantCardSkeleton />;
      }
      return (
        <RestaurantItem
          item={item}
          index={index}
          distance={getRestaurantDistance(item)}
        />
      );
    },
    [getRestaurantDistance]
  );

  // Key extractors
  const categoryKeyExtractor = useCallback(
    (item: string | null, index: number) => item ?? `skeleton-cat-${index}`,
    []
  );

  const restaurantKeyExtractor = useCallback(
    (item: Restaurant | null, index: number) => item?.id ?? `skeleton-rest-${index}`,
    []
  );

  // Skeleton data for loading state
  const skeletonCategories = isLoading ? Array(SKELETON_COUNT).fill(null) : categories;
  const skeletonRestaurants = isLoading
    ? Array(SKELETON_COUNT).fill(null)
    : recommendedRestaurants;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.primary }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Bar */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
      >
        <SearchBar />
      </MotiView>

      {/* Map */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 500, delay: 100 }}
      >
        <RestaurantMap
          region={region}
          restaurants={isLoading ? [] : restaurants}
        />
      </MotiView>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Categories
        </Text>
        <FlatList
          data={skeletonCategories}
          horizontal
          keyExtractor={categoryKeyExtractor}
          renderItem={renderCategoryItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>

      {/* Recommended Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Recommended for You
          </Text>
          {!isLoading && recommendedRestaurants.length > 0 && (
            <Text style={[styles.sectionCount, { color: theme.colors.text.secondary }]}>
              {recommendedRestaurants.length} nearby
            </Text>
          )}
        </View>
        <FlatList
          data={skeletonRestaurants}
          horizontal
          keyExtractor={restaurantKeyExtractor}
          renderItem={renderRestaurantItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={3}
          // Empty state
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                  No restaurants found nearby
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </ScrollView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 10,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 10,
  },
  horizontalListContent: {
    paddingRight: 16,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
});

export default RestaurantLocator;