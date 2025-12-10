/**
 * Restaurant Locator Screen (REDESIGNED)
 *
 * Prayer-aware halal food discovery with glassmorphism design,
 * certification badges, and 3D restaurant cards.
 *
 * @version 3.0 - Complete visual overhaul with modern design
 */

import React, { memo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ListRenderItem } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../../context/ThemeContext';
import { useFoodTab } from '../../../hooks/food/useFoodTab';

// Components
import DynamicHero from '../../../components/food/DynamicHero';
import SearchBar from '../../../components/food/SearchBar';
import ViewControls, { ViewMode } from '../../../components/food/ViewControls';
import CategoryPill from '../../../components/food/CategoryPill';
import RestaurantCard from '../../../components/food/RestaurantCard';
import RestaurantMap from '../../../components/food/RestaurantMap';
import RestaurantCardSkeleton from '../../../components/food/RestaurantCardSkeleton';
import CategoryPillSkeleton from '../../../components/food/CategoryPillSkeleton';

// Types
import type { Restaurant } from '../../../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';

// ============================================================================
// CONSTANTS
// ============================================================================

const SKELETON_COUNT = 5;

// ============================================================================
// MEMOIZED SUB-COMPONENTS
// ============================================================================

interface CategoryItemProps {
  item: string;
  index: number;
  isSelected: boolean;
  count: number;
  onPress: (category: string) => void;
}

const CategoryItem = memo<CategoryItemProps>(
  ({ item, index, isSelected, count, onPress }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 80 }}
    >
      <CategoryPill
        label={item}
        selected={isSelected}
        count={count}
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
  <RestaurantCard restaurant={item} distance={distance} />
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RestaurantLocator = () => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('map');

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

  // Get category counts
  const getCategoryCount = useCallback((category: string) => {
    return restaurants.filter(r => r.categories.includes(category)).length;
  }, [restaurants]);

  // Memoized render functions
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
          count={getCategoryCount(item)}
          onPress={handleCategorySelect}
        />
      );
    },
    [selectedCategories, handleCategorySelect, getCategoryCount]
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

  // Skeleton data
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
      {/* Dynamic Hero Section */}
      <DynamicHero />

      {/* Search Bar */}
      <SearchBar />

      {/* View Controls */}
      <ViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        location="Singapore"
      />

      {/* Map (when map view selected) */}
      {viewMode === 'map' && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <RestaurantMap
            region={region}
            restaurants={isLoading ? [] : restaurants}
          />
        </MotiView>
      )}

      {/* Categories Section */}
      <View style={styles.section}>
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ delay: 300 }}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Categories
          </Text>
        </MotiView>
        <FlatList
          data={skeletonCategories}
          horizontal
          keyExtractor={categoryKeyExtractor}
          renderItem={renderCategoryItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>

      {/* Recommended Section */}
      <View style={styles.section}>
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ delay: 400 }}
        >
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
        </MotiView>
        <FlatList
          data={skeletonRestaurants}
          horizontal
          keyExtractor={restaurantKeyExtractor}
          renderItem={renderRestaurantItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={3}
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

      {/* Prayer-Time Quick Bites Section (NEW) */}
      {!isLoading && recommendedRestaurants.length > 0 && (
        <View style={styles.section}>
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 500 }}
          >
            <View style={[styles.prayerSection, { backgroundColor: theme.colors.accent + '10' }]}>
              <View style={styles.prayerHeader}>
                <FontAwesome6 name="clock" size={16} color={theme.colors.accent} />
                <Text style={[styles.prayerTitle, { color: theme.colors.accent }]}>
                  Quick Bites Before Prayer
                </Text>
              </View>
              <Text style={[styles.prayerSubtitle, { color: theme.colors.text.secondary }]}>
                Fast service restaurants nearby
              </Text>
            </View>
          </MotiView>
        </View>
      )}
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
  prayerSection: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  prayerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  prayerSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});

export default RestaurantLocator;