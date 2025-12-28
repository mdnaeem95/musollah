/**
 * Restaurant Locator - REAL FIX (No Unmount/Remount)
 *
 * ✅ FIXED: Components no longer unmount/remount on filter changes
 * ✅ ROOT CAUSE: Using component instead of render function for ListHeaderComponent
 * 
 * Key Change:
 * - Before: ListHeaderComponent={renderListHeader} (function - recreates on every change)
 * - After: ListHeaderComponent={<ListHeader />} (component - stable)
 *
 * @version 4.2 - Unmount/remount fixed
 */

import React, { memo, useCallback, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
} from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';

// Theme & Hooks
import { useTheme } from '../../../context/ThemeContext';
import { useFoodTab } from '../../../hooks/food/useFoodTab';
import { useUserFavorites, useToggleFavorite, calculateDistance } from '../../../api/services/food';
import { useAuthStore } from '../../../stores/useAuthStore';

// Components
import DynamicHero from '../../../components/food/DynamicHero';
import SearchBar from '../../../components/food/SearchBar';
import CategoryPill from '../../../components/food/CategoryPill';
import RestaurantCard from '../../../components/food/RestaurantCard';
import RestaurantCardSkeleton from '../../../components/food/RestaurantCardSkeleton';
import SignInModal from '../../../components/SignInModal';

// Types
import { Restaurant } from '../../../api/services/food';
import { enter } from '../../../utils';

// ============================================================================
// CONSTANTS
// ============================================================================

type SortOption = 'distance' | 'rating' | 'name';

const SKELETON_COUNT = 5;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

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

// ============================================================================
// STATIC HEADER COMPONENTS (Never receive changing props)
// ============================================================================

/**
 * ✅ Hero Section - Completely independent, no props
 */
const HeroSection = memo(() => (
  <MotiView
    from={{ opacity: 0, translateY: -20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={enter(0)}
  >
    <DynamicHero />
  </MotiView>
));
HeroSection.displayName = 'HeroSection';

/**
 * ✅ Search Section - Completely independent, no props
 */
const SearchSection = memo(() => (
  <MotiView
    from={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={enter(0)}
  >
    <SearchBar />
  </MotiView>
));
SearchSection.displayName = 'SearchSection';

// ============================================================================
// CATEGORIES SECTION (Isolated)
// ============================================================================

interface CategoriesSectionProps {
  categories: string[];
  selectedCategories: string[];
  restaurants: Restaurant[];
  onCategorySelect: (category: string) => void;
}

const CategoriesSection = memo<CategoriesSectionProps>(({ 
  categories, 
  selectedCategories,
  restaurants,
  onCategorySelect 
}) => {
  const keyExtractor = useCallback((item: string) => item, []);
  
  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const isSelected = selectedCategories.includes(item);
      const count = restaurants.filter(r => r.categories?.includes(item)).length;
      
      return (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 50 }}
          key={item}
        >
          <CategoryPill
            category={item}
            isSelected={isSelected}
            count={count}
            onPress={() => onCategorySelect(item)}
          />
        </MotiView>
      );
    },
    [selectedCategories, restaurants, onCategorySelect]
  );

  return (
    <View style={styles.categoriesSection}>
      <FlatList
        data={categories}
        horizontal
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      />
    </View>
  );
});
CategoriesSection.displayName = 'CategoriesSection';

// ============================================================================
// SORT CONTROLS
// ============================================================================

interface SortControlsProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  theme: any;
}

const SortControls = memo<SortControlsProps>(({ sortBy, onSortChange, theme }) => (
  <MotiView
    from={{ opacity: 0, translateY: 10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ delay: 200 }}
    style={styles.controlsContainer}
  >
    <View style={styles.sortControls}>
        <TouchableOpacity
          style={[styles.sortButton, { 
            backgroundColor: theme.colors.secondary,
            borderColor: sortBy === 'distance' ? theme.colors.accent : 'transparent',
          }]}
          onPress={() => onSortChange('distance')}
        >
          <FontAwesome6 
            name="location-arrow" 
            size={14} 
            color={sortBy === 'distance' ? theme.colors.accent : theme.colors.text.secondary} 
          />
          <Text style={[
            styles.sortButtonText, 
            { color: sortBy === 'distance' ? theme.colors.accent : theme.colors.text.secondary }
          ]}>
            Distance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, { 
            backgroundColor: theme.colors.secondary,
            borderColor: sortBy === 'rating' ? theme.colors.accent : 'transparent',
          }]}
          onPress={() => onSortChange('rating')}
        >
          <FontAwesome6 
            name="star" 
            size={14} 
            color={sortBy === 'rating' ? theme.colors.accent : theme.colors.text.secondary} 
          />
          <Text style={[
            styles.sortButtonText, 
            { color: sortBy === 'rating' ? theme.colors.accent : theme.colors.text.secondary }
          ]}>
            Rating
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, { 
            backgroundColor: theme.colors.secondary,
            borderColor: sortBy === 'name' ? theme.colors.accent : 'transparent',
          }]}
          onPress={() => onSortChange('name')}
        >
          <FontAwesome6 
            name="arrow-down-a-z" 
            size={14} 
            color={sortBy === 'name' ? theme.colors.accent : theme.colors.text.secondary} 
          />
          <Text style={[
            styles.sortButtonText, 
            { color: sortBy === 'name' ? theme.colors.accent : theme.colors.text.secondary }
          ]}>
            Name
          </Text>
        </TouchableOpacity>
    </View>
  </MotiView>
));
SortControls.displayName = 'SortControls';

// ============================================================================
// LIST HEADER COMPONENT (Stable - NOT a render function)
// ============================================================================

interface ListHeaderProps {
  categories: string[];
  selectedCategories: string[];
  restaurants: Restaurant[];
  onCategorySelect: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  theme: any;
}

/**
 * ✅ CRITICAL FIX: This is a COMPONENT, not a render function
 * FlatList will keep the same instance, preventing unmount/remount
 */
const ListHeader = memo<ListHeaderProps>(({
  categories,
  selectedCategories,
  restaurants,
  onCategorySelect,
  sortBy,
  onSortChange,
  theme,
}) => (
  <>
    {/* Static sections - never change */}
    <HeroSection />
    <SearchSection />

    {/* Dynamic section - only this re-renders */}
    <CategoriesSection
      categories={categories}
      selectedCategories={selectedCategories}
      restaurants={restaurants}
      onCategorySelect={onCategorySelect}
    />

    {/* Sort controls - only re-renders when sort changes */}
    <SortControls
      sortBy={sortBy}
      onSortChange={onSortChange}
      theme={theme}
    />

    {/* Divider */}
    <View style={[styles.divider, { backgroundColor: theme.colors.text.muted + '20' }]} />
  </>
));
ListHeader.displayName = 'ListHeader';

// ============================================================================
// RESTAURANT ITEM
// ============================================================================

interface RestaurantItemProps {
  item: Restaurant;
  index: number;
  distance: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

const RestaurantItem = memo<RestaurantItemProps>(({ 
  item, 
  index, 
  distance,
  isFavorited,
  onToggleFavorite,
}) => {
  if (!isValidRestaurant(item)) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={enter(0)}
    >
      <RestaurantCard 
        restaurant={item} 
        distance={distance}
        isFavorited={isFavorited}
        onToggleFavorite={onToggleFavorite}
        index={index}
      />
    </MotiView>
  );
});
RestaurantItem.displayName = 'RestaurantItem';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RestaurantLocator = () => {
  const { theme } = useTheme();
  const { user } = useAuthStore();

  // State
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Food tab hook
  const {
    restaurants,
    categories,
    selectedCategories,
    handleCategorySelect,
    getRestaurantDistance,
    userCoords,
    isLoading,
  } = useFoodTab();

  // Favorites
  const { data: favorites = [] } = useUserFavorites(user?.uid || null);
  const { mutate: toggleFavorite } = useToggleFavorite();

  // Sort restaurants
  const sortedRestaurants = useMemo(() => {
    if (!restaurants.length) return [];

    const sorted = [...restaurants];

    switch (sortBy) {
      case 'distance':
        // ✅ Sort by actual distance from user
        return sorted.sort((a, b) => {
          const distA = calculateDistance(userCoords, a.coordinates);
          const distB = calculateDistance(userCoords, b.coordinates);
          return distA - distB;
        });
      
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = a.averageRating || a.rating || 0;
          const ratingB = b.averageRating || b.rating || 0;
          return ratingB - ratingA;
        });
      
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      default:
        return sorted;
    }
  }, [restaurants, sortBy, userCoords]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  // Handlers
  const handleToggleFavorite = useCallback((restaurantId: string, currentlyFavorited: boolean) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    toggleFavorite({ 
      userId: user.uid, 
      restaurantId, 
      isFavorited: !currentlyFavorited 
    });
  }, [user, toggleFavorite]);

  // Render functions
  const restaurantKeyExtractor = useCallback((item: Restaurant) => item.id, []);

  const renderRestaurantItem = useCallback(
    ({ item, index }: { item: Restaurant; index: number }) => {
      const distance = getRestaurantDistance(item);
      const isFavorited = favorites.includes(item.id);

      return (
        <RestaurantItem
          item={item}
          index={index}
          distance={distance}
          isFavorited={isFavorited}
          onToggleFavorite={() => handleToggleFavorite(item.id, isFavorited)}
        />
      );
    },
    [getRestaurantDistance, favorites, handleToggleFavorite]
  );

  // ✅ CRITICAL: Render ListHeader as JSX element, not function
  // This creates a stable component instance that won't unmount/remount
  const listHeader = useMemo(
    () => (
      <ListHeader
        categories={categories}
        selectedCategories={selectedCategories}
        restaurants={restaurants}
        onCategorySelect={handleCategorySelect}
        sortBy={sortBy}
        onSortChange={setSortBy}
        theme={theme}
      />
    ),
    [
      categories,
      selectedCategories,
      restaurants,
      handleCategorySelect,
      sortBy,
      theme,
    ]
  );

  const renderListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </View>
      );
    }

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(0)}
        style={styles.emptyContainer}
      >
        <View style={[styles.emptyIcon, { backgroundColor: theme.colors.accent + '15' }]}>
          <FontAwesome6 name="utensils" size={48} color={theme.colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
          No Restaurants Found
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
          Try adjusting your filters or search in a different area
        </Text>
      </MotiView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <FlatList
        data={sortedRestaurants}
        keyExtractor={restaurantKeyExtractor}
        renderItem={renderRestaurantItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={5}
      />

      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Categories
  categoriesSection: {
    marginTop: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },

  // Controls
  controlsContainer: {
    marginTop: 16,
  },
  sortControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  sortButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Divider
  divider: {
    height: 1,
    marginTop: 16,
    marginBottom: 8,
  },

  // Loading
  loadingContainer: {
    gap: 12,
    paddingTop: 16,
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
});

export default RestaurantLocator;