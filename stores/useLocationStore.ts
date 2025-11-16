/**
 * Location Store
 * 
 * Manages user location state with caching and permission handling.
 * Uses Zustand for client-side state management with MMKV persistence.
 */

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import { defaultStorage } from '../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

// Default location in central Singapore (Marina Bay Sands)
const DEFAULT_LOCATION: LocationObject = {
  coords: {
    latitude: 1.2831,
    longitude: 103.8603,
    altitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    altitudeAccuracy: null,
  },
  timestamp: new Date().getTime(),
};

interface LocationState {
  // State
  userLocation: LocationObject | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  
  // Actions
  fetchLocation: () => Promise<void>;
  setLocation: (location: LocationObject) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      // Initial state
      userLocation: null,
      isLoading: false,
      error: null,
      hasPermission: false,
      
      // Actions
      fetchLocation: async () => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('📍 Requesting location permission...');
          
          // Request permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            console.warn('⚠️ Location permission denied');
            
            // Use cached location if available
            const cachedLocation = get().userLocation;
            if (cachedLocation) {
              console.log('✅ Using cached location');
              set({
                isLoading: false,
                hasPermission: false,
                error: 'Permission denied - using cached location',
              });
              return;
            }
            
            // Fall back to default location
            console.log('📍 Using default Singapore location');
            set({
              userLocation: DEFAULT_LOCATION,
              isLoading: false,
              hasPermission: false,
              error: 'Permission denied - using default location',
            });
            return;
          }
          
          console.log('✅ Location permission granted');
          
          // Fetch current location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          if (!location) {
            throw new Error('Failed to get location');
          }
          
          console.log('✅ Location fetched:', {
            lat: location.coords.latitude,
            lon: location.coords.longitude,
          });
          
          set({
            userLocation: location,
            isLoading: false,
            hasPermission: true,
            error: null,
          });
          
        } catch (error: any) {
          console.error('❌ Failed to fetch location:', error);
          
          // Use cached location if available
          const cachedLocation = get().userLocation;
          if (cachedLocation) {
            console.log('✅ Using cached location after error');
            set({
              isLoading: false,
              error: error.message || 'Failed to fetch location',
            });
            return;
          }
          
          // Fall back to default location
          set({
            userLocation: DEFAULT_LOCATION,
            isLoading: false,
            error: error.message || 'Failed to fetch location',
          });
        }
      },
      
      setLocation: (location) => {
        console.log('📍 Setting location manually:', {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
        set({ userLocation: location, error: null });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      reset: () => {
        console.log('🔄 Resetting location state');
        set({
          userLocation: null,
          isLoading: false,
          error: null,
          hasPermission: false,
        });
      },
    }),
    {
      name: 'location',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
      // Only persist location, not loading/error states
      partialize: (state) => ({
        userLocation: state.userLocation,
        hasPermission: state.hasPermission,
      }),
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useUserLocation = () => 
  useLocationStore((state) => state.userLocation);

export const useLocationLoading = () => 
  useLocationStore((state) => state.isLoading);

export const useLocationError = () => 
  useLocationStore((state) => state.error);

export const useHasLocationPermission = () => 
  useLocationStore((state) => state.hasPermission);

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get current coordinates (simplified)
 */
export const useCoordinates = () => {
  const location = useUserLocation();
  
  if (!location) return null;
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};

/**
 * Check if using default Singapore location
 */
export const useIsDefaultLocation = () => {
  const location = useUserLocation();
  
  if (!location) return false;
  
  return (
    location.coords.latitude === DEFAULT_LOCATION.coords.latitude &&
    location.coords.longitude === DEFAULT_LOCATION.coords.longitude
  );
};

/**
 * Get location with automatic fetch on mount
 */
export const useLocationWithFetch = () => {
  const location = useUserLocation();
  const isLoading = useLocationLoading();
  const error = useLocationError();
  const fetchLocation = useLocationStore((state) => state.fetchLocation);
  
  // Auto-fetch if no location
  React.useEffect(() => {
    if (!location && !isLoading) {
      fetchLocation();
    }
  }, [location, isLoading, fetchLocation]);
  
  return { location, isLoading, error };
};