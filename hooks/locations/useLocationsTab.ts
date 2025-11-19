/**
 * useMusollahTab Hook
 * 
 * Business logic for Musollah tab
 * Handles location filtering, search, and sheet management
 */

import { useState, useMemo, useCallback } from 'react';
import { LocationObject } from 'expo-location';
import { 
  useMusollahData, 
  BidetLocation, 
  MusollahLocation, 
  MosqueLocation, 
  Region 
} from '../../api/services/musollah';

type LocationUnion = BidetLocation | MusollahLocation | MosqueLocation;

export function useLocationsTab(userLocation: LocationObject | null) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationUnion | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  // Fetch musollah data
  const { data, isLoading } = useMusollahData(userLocation);

  // Extract locations
  const bidetLocations = data?.bidetLocations || [];
  const musollahLocations = data?.musollahLocations || [];
  const mosqueLocations = data?.mosqueLocations || [];

  // Current locations based on selected tab
  const currentLocations = useMemo<LocationUnion[]>(() => {
    return selectedIndex === 0 
      ? bidetLocations 
      : selectedIndex === 1 
      ? musollahLocations 
      : mosqueLocations;
  }, [selectedIndex, bidetLocations, musollahLocations, mosqueLocations]);

  // Filter locations based on search query
  const filteredLocations = useMemo<LocationUnion[]>(() => {
    if (!searchQuery.trim()) return [];
    
    const lowerQuery = searchQuery.toLowerCase();
    return currentLocations.filter(loc => 
      loc.building.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, currentLocations]);

  // Map region centered on user location
  const region = useMemo<Region | undefined>(() => {
    if (!userLocation) return undefined;
    
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }, [userLocation]);

  // Handle location selection
  const handleSelectLocation = useCallback((location: LocationUnion) => {
    setSelectedLocation(location);
    setIsSheetVisible(true);
  }, []);

  // Handle sheet close
  const handleCloseSheet = useCallback(() => {
    setIsSheetVisible(false);
    setTimeout(() => {
      setSelectedLocation(null);
    }, 300); // Wait for close animation
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
    
    // Actions
    setSelectedIndex,
    setSearchQuery,
    handleSelectLocation,
    handleCloseSheet,
  };
}