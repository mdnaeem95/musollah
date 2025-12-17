/**
 * Restaurant Locator Screen - PRODUCTION SAFE VERSION
 *
 * Prayer-aware halal food discovery with glassmorphism design,
 * certification badges, and 3D restaurant cards.
 * 
 * ✅ FIXES: Production crashes with comprehensive error handling
 *
 * @version 3.1 - Production hardened with error boundaries
 */

import React, { memo, useCallback, useState, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ListRenderItem, TouchableOpacity } from 'react-native';
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
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Food Tab Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.errorContainer}>
          <FontAwesome6 name="triangle-exclamation" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unable to load restaurants'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleReset}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SKELETON_COUNT = 5;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safely validate restaurant object
 */
function isValidRestaurant(restaurant: any): restaurant is Restaurant {
  try {
    if (!restaurant || typeof restaurant !== 'object') return false;
    if (!restaurant.id || typeof restaurant.id !== 'string') return false;
    if (!restaurant.name || typeof restaurant.name !== 'string') return false;
    if (!restaurant.coordinates || typeof restaurant.coordinates !== 'object') return false;
    if (typeof restaurant.coordinates.latitude !== 'number') return false;
    if (typeof restaurant.coordinates.longitude !== 'number') return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely filter valid restaurants
 */
function filterValidRestaurants(restaurants: any[]): Restaurant[] {
  if (!Array.isArray(restaurants)) return [];
  return restaurants.filter(isValidRestaurant);
}

/**
 * Safely validate categories
 */
function validateCategories(categories: any): string[] {
  if (!Array.isArray(categories)) return [];
  return categories.filter(cat => typeof cat === 'string' && cat.length > 0);
}

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
  ({ item, index, isSelected, count, onPress }) => {
    try {
      return (
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
      );
    } catch (error) {
      console.error('❌ Error rendering category:', error);
      return null;
    }
  }
);

interface RestaurantItemProps {
  item: unknown;
  index: number;
  distance: string;
}

const RestaurantItem = memo<RestaurantItemProps>(({ item, index, distance }) => {
  try {
    // Validate restaurant before rendering
    if (!isValidRestaurant(item)) {
      console.warn('⚠️ Invalid restaurant data:', (item as any)?.id);
      return null;
    }

    return <RestaurantCard restaurant={item} distance={distance} />;
  } catch (error) {
    console.error('❌ Error rendering restaurant:', error);
    return null;
  }
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RestaurantLocatorContent = () => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // Wrap hook in try-catch
  let hookData;
  try {
    hookData = useFoodTab();
  } catch (error) {
    console.error('❌ Error in useFoodTab:', error);
    throw error; // Let error boundary catch it
  }

  const {
    restaurants: rawRestaurants,
    recommendedRestaurants: rawRecommended,
    categories: rawCategories,
    selectedCategories: rawSelected,
    region,
    isLoading,
    handleCategorySelect,
    getRestaurantDistance,
  } = hookData;

  // Validate and sanitize data
  const restaurants = filterValidRestaurants(rawRestaurants || []);
  const recommendedRestaurants = filterValidRestaurants(rawRecommended || []);
  const categories = validateCategories(rawCategories);
  const selectedCategories = validateCategories(rawSelected);

  // Safe category count calculation
  const getCategoryCount = useCallback((category: string) => {
    try {
      if (!Array.isArray(restaurants) || !category) return 0;
      return restaurants.filter(r => {
        return Array.isArray(r.categories) && r.categories.includes(category);
      }).length;
    } catch (error) {
      console.error('❌ Error calculating category count:', error);
      return 0;
    }
  }, [restaurants]);

  // Safe distance getter
  const getSafeDistance = useCallback((restaurant: Restaurant) => {
    try {
      if (!isValidRestaurant(restaurant)) return 'N/A';
      return getRestaurantDistance(restaurant) || 'N/A';
    } catch (error) {
      console.error('❌ Error getting distance:', error);
      return 'N/A';
    }
  }, [getRestaurantDistance]);

  // Memoized render functions
  const renderCategoryItem = useCallback<ListRenderItem<string | null>>(
    ({ item, index }) => {
      try {
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
      } catch (error) {
        console.error('❌ Error rendering category item:', error);
        return null;
      }
    },
    [selectedCategories, handleCategorySelect, getCategoryCount]
  );

  const renderRestaurantItem = useCallback<ListRenderItem<Restaurant | null>>(
    ({ item, index }) => {
      try {
        if (!item) {
          return <RestaurantCardSkeleton />;
        }
        return (
          <RestaurantItem
            item={item}
            index={index}
            distance={getSafeDistance(item)}
          />
        );
      } catch (error) {
        console.error('❌ Error rendering restaurant item:', error);
        return null;
      }
    },
    [getSafeDistance]
  );

  // Key extractors with null safety
  const categoryKeyExtractor = useCallback(
    (item: string | null, index: number) => {
      try {
        return item ?? `skeleton-cat-${index}`;
      } catch {
        return `error-cat-${index}`;
      }
    },
    []
  );

  const restaurantKeyExtractor = useCallback(
    (item: Restaurant | null, index: number) => {
      try {
        return item?.id ?? `skeleton-rest-${index}`;
      } catch {
        return `error-rest-${index}`;
      }
    },
    []
  );

  // Skeleton data with validation
  const skeletonCategories = isLoading 
    ? Array(SKELETON_COUNT).fill(null) 
    : (Array.isArray(categories) ? categories : []);
    
  const skeletonRestaurants = isLoading
    ? Array(SKELETON_COUNT).fill(null)
    : (Array.isArray(recommendedRestaurants) ? recommendedRestaurants : []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.primary }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Dynamic Hero Section - wrapped in error boundary */}
      <ErrorBoundary fallback={<View style={styles.heroPlaceholder} />}>
        <DynamicHero />
      </ErrorBoundary>

      {/* Search Bar - wrapped in error boundary */}
      <ErrorBoundary fallback={null}>
        <SearchBar />
      </ErrorBoundary>

      {/* View Controls - wrapped in error boundary */}
      <ErrorBoundary fallback={null}>
        <ViewControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          location="Singapore"
        />
      </ErrorBoundary>

      {/* Map - wrapped in error boundary */}
      {viewMode === 'map' && (
        <ErrorBoundary 
          fallback={
            <View style={styles.mapError}>
              <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
                Map unavailable
              </Text>
            </View>
          }
        >
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
        </ErrorBoundary>
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
        <ErrorBoundary fallback={<Text style={styles.errorText}>Unable to load categories</Text>}>
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
            onScrollToIndexFailed={() => {
              console.warn('⚠️ Scroll to index failed in categories');
            }}
          />
        </ErrorBoundary>
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
        <ErrorBoundary fallback={<Text style={styles.errorText}>Unable to load restaurants</Text>}>
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
            onScrollToIndexFailed={() => {
              console.warn('⚠️ Scroll to index failed in restaurants');
            }}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="map-location-dot" size={48} color={theme.colors.text.muted} />
                  <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                    No restaurants found nearby
                  </Text>
                </View>
              ) : null
            }
          />
        </ErrorBoundary>
      </View>

      {/* Prayer-Time Quick Bites Section */}
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

// Wrap entire component in error boundary
const RestaurantLocator = () => {
  return (
    <ErrorBoundary>
      <RestaurantLocatorContent />
    </ErrorBoundary>
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
    gap: 12,
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
  // Error boundary styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  heroPlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginBottom: 16,
  },
  mapError: {
    height: 250,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
});

export default RestaurantLocator;