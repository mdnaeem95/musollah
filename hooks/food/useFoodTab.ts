/**
 * Food Tab Hook v3.5
 *
 * ✅ SIMPLIFIED: Relies on service layer for coordinate normalization
 * ✅ CLEAN: No GeoPoint handling - service layer does it all
 *
 * @version 3.5 - Clean separation of concerns
 * @since 2025-12-26
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import * as Location from 'expo-location';
import { useRestaurants, useRestaurantCategories, calculateDistance, Restaurant } from '../../api/services/food';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Food Tab');

// ============================================================================
// CONSTANTS
// ============================================================================

const SINGAPORE_DEFAULT_COORDS = {
  latitude: 1.3521,
  longitude: 103.8198,
} as const;

const RECOMMENDED_COUNT = 5;

// ============================================================================
// TYPES
// ============================================================================

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format distance for display
 * Shows meters if < 1km, otherwise km with 1 decimal
 */
function formatDistance(distanceKm: number): string {
  if (!isFinite(distanceKm) || distanceKm < 0) {
    logger.warn('Invalid distance value', { distanceKm });
    return 'N/A';
  }
  
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFoodTab() {
  logger.time('food-tab-init');
  logger.debug('Initializing Food Tab');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // ✅ Fresh GPS location state
  const [userCoords, setUserCoords] = useState<Coordinates>(SINGAPORE_DEFAULT_COORDS);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // ✅ Fetch FRESH GPS location on mount
  useEffect(() => {
    let isMounted = true;

    const fetchFreshLocation = async () => {
      try {
        logger.debug('Fetching fresh GPS location...');
        
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          logger.warn('Location permission denied - using Singapore default');
          if (isMounted) {
            setUserCoords(SINGAPORE_DEFAULT_COORDS);
            setIsLocationLoading(false);
            setHasLocationPermission(false);
          }
          return;
        }

        setHasLocationPermission(true);

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        logger.success('Fresh GPS location obtained', {
          latitude: newCoords.latitude.toFixed(4),
          longitude: newCoords.longitude.toFixed(4),
        });

        if (isMounted) {
          setUserCoords(newCoords);
          setIsLocationLoading(false);
        }
      } catch (error: any) {
        logger.error('GPS location fetch failed', {
          error: error?.message || String(error),
        });
        // Fallback to Singapore
        if (isMounted) {
          setUserCoords(SINGAPORE_DEFAULT_COORDS);
          setIsLocationLoading(false);
        }
      }
    };

    fetchFreshLocation();

    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount

  // Restaurant data (✅ Already normalized by service layer with proper coordinates)
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useRestaurants();
  const { categories = [] } = useRestaurantCategories();

  // Log data availability
  useEffect(() => {
    if (restaurants.length > 0 && !isLocationLoading) {
      logger.info('Restaurants loaded', {
        count: restaurants.length,
        categoriesCount: categories.length,
        userLocation: {
          latitude: userCoords.latitude.toFixed(4),
          longitude: userCoords.longitude.toFixed(4),
        },
      });
      logger.timeEnd('food-tab-init');
    }
  }, [restaurants.length, categories.length, isLocationLoading, userCoords]);

  // Combined loading state
  const isLoading = isRestaurantsLoading || isLocationLoading;

  // Map region
  const region = useMemo<Region>(() => {
    return {
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [userCoords]);

  // Filtered restaurants by selected categories
  const filteredRestaurants = useMemo(() => {
    if (selectedCategories.length === 0) {
      return restaurants;
    }

    const filtered = restaurants.filter((restaurant) =>
      restaurant.categories?.some((cat) => selectedCategories.includes(cat))
    );

    logger.info('Restaurants filtered by category', {
      selectedCategories,
      totalRestaurants: restaurants.length,
      filteredCount: filtered.length,
    });

    return filtered;
  }, [restaurants, selectedCategories]);

  // Recommended restaurants (closest 5)
  const recommendedRestaurants = useMemo(() => {
    if (filteredRestaurants.length === 0) {
      return [];
    }

    // ✅ SIMPLIFIED: Service layer guarantees coordinates exist, just use them directly
    const withDistance = filteredRestaurants
      .map((restaurant) => {
        // Service layer already normalized coordinates, so they're guaranteed to exist
        const distance = calculateDistance(userCoords, restaurant.coordinates);
        return { restaurant, distance };
      })
      .filter((item) => isFinite(item.distance) && item.distance >= 0);

    const recommended = withDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, RECOMMENDED_COUNT)
      .map(({ restaurant }) => restaurant);

    if (withDistance.length > 0) {
      logger.success('Recommendations calculated', {
        recommendedCount: recommended.length,
        validRestaurants: withDistance.length,
        closestDistance: withDistance[0]?.distance.toFixed(2) + 'km',
      });
    }

    return recommended;
  }, [filteredRestaurants, userCoords]);

  // Category selection handler
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const isRemoving = prev.includes(category);
      const newCategories = isRemoving
        ? prev.filter((cat) => cat !== category)
        : [...prev, category];
      
      logger.info(isRemoving ? 'Category removed' : 'Category added', {
        category,
        selectedCount: newCategories.length,
      });
      
      return newCategories;
    });
  }, []);

  // Calculate formatted distance string for display
  const getRestaurantDistance = useCallback(
    (restaurant: Restaurant): string => {
      // ✅ SIMPLIFIED: Service layer guarantees coordinates exist
      const distance = calculateDistance(userCoords, restaurant.coordinates);
      return formatDistance(distance);
    },
    [userCoords]
  );

  // Clear all category filters
  const clearCategoryFilters = useCallback(() => {
    if (selectedCategories.length > 0) {
      logger.info('Clearing category filters', {
        previousCount: selectedCategories.length,
      });
      setSelectedCategories([]);
    }
  }, [selectedCategories]);

  return {
    // State
    restaurants: filteredRestaurants,
    recommendedRestaurants,
    categories,
    selectedCategories,
    region,
    userCoords,
    isLoading,
    hasLocationPermission,

    // Actions
    handleCategorySelect,
    getRestaurantDistance,
    clearCategoryFilters,
  };
}