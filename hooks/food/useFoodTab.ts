/**
 * Food Tab Hook
 *
 * Business logic for the restaurant locator screen.
 * Handles category selection, filtering, and location-based recommendations.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLocationStore } from '../../stores/useLocationStore';

// ❌ Don't import Restaurant type from the API layer
// import { useRestaurants, useRestaurantCategories, Restaurant, calculateDistance, getRecommendedRestaurants } from '../../api/services/food';

// ✅ Import only the API functions you need (no types)
import { useRestaurants, useRestaurantCategories, calculateDistance } from '../../api/services/food';

// ✅ Import the UI Restaurant type that your components expect
import type { Restaurant as UiRestaurant } from '../../utils/types';

// If you still want to reference the API restaurant shape, you can import its type under an alias,
// but it’s optional. We'll treat API data as unknown and adapt it.
type ApiRestaurant = {
  id: string;
  name: string;
  categories: string[];
  coordinates: { latitude: number; longitude: number };
  image?: string;
  status?: string;
  hours?: any;     // unknown shape in API; your UI expects something — we’ll pass through if present
  website?: string;
};

export function useFoodTab() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Location state
  const { userLocation, fetchLocation } = useLocationStore();

  // Fetch user location on mount
  useEffect(() => {
    if (!userLocation) {
      fetchLocation();
    }
  }, [userLocation, fetchLocation]);

  // Restaurant data (API shape)
  const { data: apiRestaurants = [], isLoading } = useRestaurants();
  const { categories } = useRestaurantCategories();

  // User coordinates with Singapore default
  const userCoords = useMemo(() => {
    if (userLocation?.coords) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      };
    }
    return { latitude: 1.3521, longitude: 103.8198 }; // Singapore default
  }, [userLocation]);

  // Map API restaurant -> UI restaurant (adds required fields if missing)
  const uiRestaurants: UiRestaurant[] = useMemo(() => {
    return (apiRestaurants as unknown as ApiRestaurant[]).map((r) => {
      // Provide sane fallbacks for fields the UI expects
      const image = r.image ?? '';
      const status = r.status ?? 'Unknown';
      // Hours format is unknown here; pass through if present, else default to an empty value
      const hours = r.hours ?? [];
      const website = r.website ?? '';

      // Spread API fields and overlay UI-required fields
      const adapted: UiRestaurant = {
        ...r,
        image,
        status,
        hours,
        website,
      } as UiRestaurant;

      return adapted;
    });
  }, [apiRestaurants]);

  // Map region
  const region = useMemo(() => {
    if (!userCoords) return undefined as
      | {
          latitude: number;
          longitude: number;
          latitudeDelta: number;
          longitudeDelta: number;
        }
      | undefined;
    return {
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }, [userCoords]);

  // Filtered restaurants (UI type)
  const filteredRestaurants = useMemo(() => {
    if (selectedCategories.length === 0) return uiRestaurants;

    return uiRestaurants.filter((r) =>
      r.categories?.some((cat) => selectedCategories.includes(cat))
    );
  }, [uiRestaurants, selectedCategories]);

  // Recommended restaurants (closest 5) — compute locally to avoid API-type coupling
  const recommendedRestaurants: UiRestaurant[] = useMemo(() => {
    const withDistance = filteredRestaurants.map((r) => ({
      r,
      d: calculateDistance(userCoords, r.coordinates),
    }));
    withDistance.sort((a, b) => a.d - b.d);
    return withDistance.slice(0, 5).map((x) => x.r);
  }, [filteredRestaurants, userCoords]);

  // Category selection handler
  const handleCategorySelect = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  // Calculate distance for a restaurant (UI type)
  const getRestaurantDistance = (restaurant: UiRestaurant): string => {
    const distance = calculateDistance(userCoords, restaurant.coordinates);
    return distance.toFixed(1);
  };

  return {
    // State
    restaurants: filteredRestaurants,
    recommendedRestaurants,
    categories,
    selectedCategories,
    region,
    userCoords,
    isLoading,

    // Actions
    handleCategorySelect,
    getRestaurantDistance,
  };
}
