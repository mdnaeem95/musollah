/**
 * Food Tab Hook
 *
 * Business logic for the restaurant locator screen.
 * Handles category selection, filtering, and location-based recommendations.
 *
 * @version 2.1 - Simplified to use normalized service data
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocationStore } from '../../stores/useLocationStore';
import {
  useRestaurants,
  useRestaurantCategories,
  calculateDistance,
  Restaurant,
} from '../../api/services/food';

// ============================================================================
// LOCAL UTILITIES (fallback if not in service layer)
// ============================================================================

/**
 * Format distance for display
 * Shows meters if < 1km, otherwise km with 1 decimal
 */
function formatDistance(distanceKm: number): string {
  if (!isFinite(distanceKm) || distanceKm < 0) return 'N/A';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

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
// HELPERS
// ============================================================================

/**
 * Validate coordinates are valid numbers within bounds
 */
function isValidCoordinates(coords: unknown): coords is Coordinates {
  if (!coords || typeof coords !== 'object') return false;
  const { latitude, longitude } = coords as Coordinates;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Extract coordinates from restaurant - handles both 'coordinates' and 'location' fields
 * This provides backwards compatibility during migration from Firebase GeoPoint
 */
function getRestaurantCoordinates(restaurant: Restaurant): Coordinates | null {
  // First try 'coordinates' (normalized format)
  if (isValidCoordinates(restaurant.coordinates)) {
    return restaurant.coordinates;
  }

  // Fallback to 'location' (Firebase GeoPoint format)
  const locationField = (restaurant as any).location;
  if (isValidCoordinates(locationField)) {
    return {
      latitude: locationField.latitude,
      longitude: locationField.longitude,
    };
  }

  return null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFoodTab() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Location state
  const { userLocation, fetchLocation, isLoading: isLocationLoading } = useLocationStore();

  // Fetch user location on mount
  useEffect(() => {
    if (!userLocation) {
      fetchLocation();
    }
  }, [userLocation, fetchLocation]);

  // Restaurant data (already normalized by service layer)
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useRestaurants();
  const { categories = [] } = useRestaurantCategories();

  // Combined loading state
  const isLoading = isRestaurantsLoading || isLocationLoading;

  // User coordinates with Singapore fallback
  const userCoords = useMemo(() => {
    if (userLocation?.coords) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
    }
    return SINGAPORE_DEFAULT_COORDS;
  }, [userLocation]);

  // Map region - always defined
  const region = useMemo<Region>(() => ({
    latitude: userCoords.latitude,
    longitude: userCoords.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }), [userCoords]);

  // Filtered restaurants by selected categories
  const filteredRestaurants = useMemo(() => {
    if (selectedCategories.length === 0) return restaurants;

    return restaurants.filter((restaurant) =>
      restaurant.categories?.some((cat) => selectedCategories.includes(cat))
    );
  }, [restaurants, selectedCategories]);

  // Recommended restaurants (closest 5)
  const recommendedRestaurants = useMemo(() => {
    if (filteredRestaurants.length === 0) return [];

    const withDistance = filteredRestaurants
      .map((restaurant) => {
        const coords = getRestaurantCoordinates(restaurant);
        if (!coords) return null;
        return {
          restaurant,
          distance: calculateDistance(userCoords, coords),
        };
      })
      .filter((item): item is { restaurant: Restaurant; distance: number } => item !== null);

    return withDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, RECOMMENDED_COUNT)
      .map(({ restaurant }) => restaurant);
  }, [filteredRestaurants, userCoords]);

  // Category selection handler
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  }, []);

  // Calculate formatted distance string for display
  const getRestaurantDistance = useCallback(
    (restaurant: Restaurant): string => {
      const coords = getRestaurantCoordinates(restaurant);
      if (!coords) return 'N/A';
      const distance = calculateDistance(userCoords, coords);
      return formatDistance(distance);
    },
    [userCoords]
  );

  // Clear all category filters
  const clearCategoryFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  return {
    // State
    restaurants: filteredRestaurants,
    recommendedRestaurants,
    categories,
    selectedCategories,
    region,
    userCoords,
    isLoading,
    hasLocationPermission: !!userLocation,

    // Actions
    handleCategorySelect,
    getRestaurantDistance,
    clearCategoryFilters,
  };
}