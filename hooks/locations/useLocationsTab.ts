/**
 * useLocationsTab Hook (v4 - Clean)
 * 
 * Business logic for the Locations/Musollah tab.
 * Works with the fixed musollah service (v5) that properly
 * handles distance calculation reactively.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { LocationObject } from 'expo-location';
import { 
  useMusollahData, 
  BidetLocation, 
  MusollahLocation, 
  MosqueLocation, 
  Region,
  LocationUnion,
  useRefreshMusollahData,
} from '../../api/services/musollah';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { LocationUnion };
export type LocationType = 'bidet' | 'musollah' | 'mosque';

export interface UseLocationsTabReturn {
  // State
  selectedIndex: number;
  searchQuery: string;
  filteredLocations: LocationUnion[];
  currentLocations: LocationUnion[];
  region: Region | undefined;
  selectedLocation: LocationUnion | null;
  isSheetVisible: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  locationType: LocationType;
  locationCount: number;
  hasResults: boolean;
  hasUserLocation: boolean;
  
  // Actions
  setSelectedIndex: (index: number) => void;
  setSearchQuery: (query: string) => void;
  handleSelectLocation: (location: LocationUnion) => void;
  handleCloseSheet: () => void;
  clearSearch: () => void;
  refreshData: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLocationsTab(userLocation: LocationObject | null): UseLocationsTabReturn {
  // UI State
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationUnion | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  
  // Data fetching
  const { data, isLoading, isError, error } = useMusollahData(userLocation);
  const refreshData = useRefreshMusollahData();

  // Debug logging (dev only)
  useEffect(() => {
    if (__DEV__) {
      console.log('📍 useLocationsTab:', {
        hasLocation: !!userLocation,
        coords: userLocation?.coords 
          ? `(${userLocation.coords.latitude.toFixed(4)}, ${userLocation.coords.longitude.toFixed(4)})`
          : 'none',
        isLoading,
        bidets: data?.bidetLocations?.length ?? 0,
        mosques: data?.mosqueLocations?.length ?? 0,
        musollahs: data?.musollahLocations?.length ?? 0,
        // Sample distance check
        firstBidetDistance: data?.bidetLocations?.[0]?.distance?.toFixed(2) ?? 'N/A',
      });
    }
  }, [userLocation, isLoading, data]);

  // Extract location arrays
  const bidetLocations = useMemo(() => 
    data?.bidetLocations ?? [], 
    [data?.bidetLocations]
  );
  
  const musollahLocations = useMemo(() => 
    data?.musollahLocations ?? [], 
    [data?.musollahLocations]
  );
  
  const mosqueLocations = useMemo(() => 
    data?.mosqueLocations ?? [], 
    [data?.mosqueLocations]
  );

  // Current location type
  const locationType = useMemo<LocationType>(() => {
    switch (selectedIndex) {
      case 0: return 'bidet';
      case 1: return 'musollah';
      case 2: return 'mosque';
      default: return 'bidet';
    }
  }, [selectedIndex]);

  // Current tab's locations (already sorted by distance from service)
  const currentLocations = useMemo<LocationUnion[]>(() => {
    switch (selectedIndex) {
      case 0: return bidetLocations;
      case 1: return musollahLocations;
      case 2: return mosqueLocations;
      default: return [];
    }
  }, [selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  // Filtered locations (search)
  const filteredLocations = useMemo<LocationUnion[]>(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return currentLocations;
    
    return currentLocations.filter(loc => {
      const building = loc.building?.toLowerCase() ?? '';
      const address = loc.address?.toLowerCase() ?? '';
      return building.includes(trimmedQuery) || address.includes(trimmedQuery);
    });
  }, [searchQuery, currentLocations]);

  // Map region centered on user location
  const region = useMemo<Region | undefined>(() => {
    // Default to Singapore center if no user location
    const lat = userLocation?.coords.latitude ?? 1.3521;
    const lng = userLocation?.coords.longitude ?? 103.8198;
    
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [userLocation?.coords?.latitude, userLocation?.coords?.longitude]);

  // Derived state
  const locationCount = filteredLocations.length;
  const hasResults = locationCount > 0;
  const hasUserLocation = !!userLocation;

  // Actions
  const handleSelectLocation = useCallback((location: LocationUnion) => {
    if (__DEV__) {
      console.log('📌 Selected:', location.building, `(${location.distance?.toFixed(2)} km)`);
    }
    setSelectedLocation(location);
    setIsSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsSheetVisible(false);
    // Delay clearing to allow close animation
    setTimeout(() => setSelectedLocation(null), 300);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    // State
    selectedIndex,
    searchQuery,
    filteredLocations,
    currentLocations,
    region,
    selectedLocation,
    isSheetVisible,
    isLoading,
    isError,
    error: error as Error | null,
    locationType,
    locationCount,
    hasResults,
    hasUserLocation,
    
    // Actions
    setSelectedIndex,
    setSearchQuery,
    handleSelectLocation,
    handleCloseSheet,
    clearSearch,
    refreshData,
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isBidetLocation(location: LocationUnion): location is BidetLocation {
  return 'female' in location && 'male' in location && 'handicap' in location;
}

export function isMusollahLocation(location: LocationUnion): location is MusollahLocation {
  return 'segregated' in location && 'airConditioned' in location;
}

export function isMosqueLocation(location: LocationUnion): location is MosqueLocation {
  return 'shia' in location && !('female' in location) && !('segregated' in location);
}