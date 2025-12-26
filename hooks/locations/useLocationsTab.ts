/**
 * useLocationsTab Hook
 * 
 * ✅ UPDATED: Added structured logging
 * ✅ IMPROVED: Better performance tracking and debug info
 * 
 * Business logic for the Locations/Musollah tab.
 * Works with the musollah service that properly
 * handles distance calculation reactively.
 * 
 * @version 5.0
 * @since 2025-12-24
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
  useRefreshMusollahData 
} from '../../api/services/musollah';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Locations Tab');

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
// CONSTANTS
// ============================================================================

const LOCATION_TYPE_NAMES: Record<LocationType, string> = {
  bidet: 'Bidets',
  musollah: 'Musollahs',
  mosque: 'Mosques',
};

const SINGAPORE_DEFAULT = {
  latitude: 1.3521,
  longitude: 103.8198,
} as const;

// ============================================================================
// HOOK
// ============================================================================

export function useLocationsTab(userLocation: LocationObject | null): UseLocationsTabReturn {
  // ✅ Log hook initialization
  useEffect(() => {
    logger.info('Locations tab mounted', {
      hasUserLocation: !!userLocation,
      coords: userLocation?.coords 
        ? {
            lat: userLocation.coords.latitude.toFixed(4),
            lng: userLocation.coords.longitude.toFixed(4),
          }
        : SINGAPORE_DEFAULT,
    });
    
    return () => {
      logger.debug('Locations tab unmounted');
    };
  }, []);

  // UI State
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationUnion | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  
  // Data fetching
  const { data, isLoading, isError, error } = useMusollahData(userLocation);
  const refreshData = useRefreshMusollahData();

  // ✅ Log user location changes
  useEffect(() => {
    if (userLocation) {
      logger.debug('User location updated', {
        latitude: userLocation.coords.latitude.toFixed(4),
        longitude: userLocation.coords.longitude.toFixed(4),
        accuracy: userLocation.coords.accuracy?.toFixed(0) + 'm',
      });
    } else {
      logger.warn('No user location available, using default Singapore coords', SINGAPORE_DEFAULT);
    }
  }, [userLocation?.coords.latitude, userLocation?.coords.longitude]);

  // ✅ Log data fetch results
  useEffect(() => {
    if (isLoading) {
      logger.debug('Loading location data...');
      return;
    }

    if (isError && error) {
      logger.error('Failed to load location data', error as Error);
      return;
    }

    if (data) {
      const stats = {
        bidets: data.bidetLocations?.length ?? 0,
        musollahs: data.musollahLocations?.length ?? 0,
        mosques: data.mosqueLocations?.length ?? 0,
        total: (data.bidetLocations?.length ?? 0) + 
               (data.musollahLocations?.length ?? 0) + 
               (data.mosqueLocations?.length ?? 0),
      };

      logger.success('Location data loaded', stats);

      // Log sample distances for validation
      if (data.bidetLocations?.[0]?.distance !== undefined) {
        logger.debug('Distance calculation verified', {
          firstBidet: data.bidetLocations[0].building,
          distance: data.bidetLocations[0].distance.toFixed(2) + ' km',
        });
      }
    }
  }, [isLoading, isError, error, data]);

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

  // ✅ Log tab changes
  useEffect(() => {
    logger.info('Tab switched', {
      index: selectedIndex,
      type: locationType,
      displayName: LOCATION_TYPE_NAMES[locationType],
    });
  }, [selectedIndex, locationType]);

  // Current tab's locations (already sorted by distance from service)
  const currentLocations = useMemo<LocationUnion[]>(() => {
    logger.time('get-current-locations');
    
    let locations: LocationUnion[];
    switch (selectedIndex) {
      case 0: locations = bidetLocations; break;
      case 1: locations = musollahLocations; break;
      case 2: locations = mosqueLocations; break;
      default: locations = [];
    }

    logger.timeEnd('get-current-locations');
    logger.debug('Current locations retrieved', {
      type: locationType,
      count: locations.length,
      sortedByDistance: locations.length > 0 && locations[0].distance !== undefined,
    });

    return locations;
  }, [selectedIndex, bidetLocations, musollahLocations, mosqueLocations, locationType]);

  // ✅ Filtered locations with performance tracking
  const filteredLocations = useMemo<LocationUnion[]>(() => {
    logger.time('filter-locations');
    
    const trimmedQuery = searchQuery.trim().toLowerCase();
    
    if (!trimmedQuery) {
      logger.timeEnd('filter-locations');
      logger.debug('No search query, showing all locations', {
        count: currentLocations.length,
      });
      return currentLocations;
    }
    
    const filtered = currentLocations.filter(loc => {
      const building = loc.building?.toLowerCase() ?? '';
      const address = loc.address?.toLowerCase() ?? '';
      return building.includes(trimmedQuery) || address.includes(trimmedQuery);
    });

    logger.timeEnd('filter-locations');
    logger.debug('Search filtering completed', {
      query: searchQuery,
      results: filtered.length,
      total: currentLocations.length,
      matchRate: currentLocations.length > 0 
        ? ((filtered.length / currentLocations.length) * 100).toFixed(1) + '%'
        : 'N/A',
    });

    return filtered;
  }, [searchQuery, currentLocations]);

  // Map region centered on user location
  const region = useMemo<Region | undefined>(() => {
    const lat = userLocation?.coords.latitude ?? SINGAPORE_DEFAULT.latitude;
    const lng = userLocation?.coords.longitude ?? SINGAPORE_DEFAULT.longitude;
    
    const regionData: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    logger.debug('Map region calculated', {
      center: {
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
      },
      delta: '0.02',
      radiusKm: '~1.1 km',
    });

    return regionData;
  }, [userLocation?.coords?.latitude, userLocation?.coords?.longitude]);

  // Derived state
  const locationCount = filteredLocations.length;
  const hasResults = locationCount > 0;
  const hasUserLocation = !!userLocation;

  // ✅ Actions with logging
  const handleSelectLocation = useCallback((location: LocationUnion) => {
    logger.info('Location selected', {
      type: locationType,
      building: location.building,
      distance: location.distance !== undefined 
        ? location.distance.toFixed(2) + ' km'
        : 'N/A',
      hasStatus: 'status' in location,
    });
    
    setSelectedLocation(location);
    setIsSheetVisible(true);
  }, [locationType]);

  const handleCloseSheet = useCallback(() => {
    logger.debug('Detail sheet closed', {
      wasViewing: selectedLocation?.building,
    });
    
    setIsSheetVisible(false);
    // Delay clearing to allow close animation
    setTimeout(() => setSelectedLocation(null), 300);
  }, [selectedLocation?.building]);

  const clearSearch = useCallback(() => {
    logger.debug('Search cleared', {
      previousQuery: searchQuery,
      resultsBefore: filteredLocations.length,
    });
    setSearchQuery('');
  }, [searchQuery, filteredLocations.length]);

  // ✅ Enhanced refresh with logging
  const handleRefreshData = useCallback(() => {
    logger.info('Refreshing location data', {
      currentType: locationType,
      hasUserLocation,
    });
    refreshData();
  }, [refreshData, locationType, hasUserLocation]);

  // ✅ Log empty results
  useEffect(() => {
    if (!isLoading && !hasResults && currentLocations.length === 0) {
      logger.warn('No locations available', {
        type: locationType,
        hasUserLocation,
        isError,
      });
    }
  }, [isLoading, hasResults, currentLocations.length, locationType, hasUserLocation, isError]);

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
    refreshData: handleRefreshData,
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