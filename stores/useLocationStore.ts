/**
 * Location Store v2.0 (WITH MMKV PERSISTENCE)
 * 
 * Persists location preference and coordinates
 * - useCustomLocation: Boolean flag (use GPS vs. Singapore)
 * - lastKnownLocation: Cached coordinates
 * - Auto-loads on app startup
 * 
 * @version 2.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Location from 'expo-location';
import { defaultStorage } from '../api/client/storage';

// ============================================================================
// TYPES
// ============================================================================

interface LocationState {
  // Current location
  userLocation: Location.LocationObject | null;
  
  // Persistence flags
  useCustomLocation: boolean;  // ✅ NEW: Use GPS instead of Singapore
  lastKnownCoords: {           // ✅ NEW: Cached coordinates
    latitude: number;
    longitude: number;
  } | null;
  
  // UI states
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

interface LocationActions {
  // Fetch current location
  fetchLocation: () => Promise<void>;
  
  // Set location manually
  setLocation: (location: Location.LocationObject) => void;
  
  // Enable/disable custom location
  enableCustomLocation: (coords: { latitude: number; longitude: number }) => void;  // ✅ NEW
  resetToSingapore: () => void;  // ✅ NEW
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

type LocationStore = LocationState & LocationActions;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const SINGAPORE_COORDS = {
  latitude: 1.3521,
  longitude: 103.8198,
};

// ============================================================================
// STORE
// ============================================================================

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      // State
      userLocation: null,
      useCustomLocation: false,
      lastKnownCoords: null,
      isLoading: false,
      error: null,
      hasPermission: false,

      // Actions
      fetchLocation: async () => {
        try {
          set({ isLoading: true, error: null });

          // Request permission
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            set({ 
              hasPermission: false,
              isLoading: false,
              error: 'Location permission denied'
            });
            return;
          }

          set({ hasPermission: true });

          // Get location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          set({ 
            userLocation: location,
            lastKnownCoords: coords,  // ✅ Cache coordinates
            useCustomLocation: true,   // ✅ Enable custom location
            isLoading: false,
            error: null
          });

        } catch (error) {
          console.error('Error fetching location:', error);
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch location'
          });
        }
      },

      setLocation: (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        set({ 
          userLocation: location,
          lastKnownCoords: coords,
          useCustomLocation: true,
          error: null
        });
      },

      // ✅ NEW: Enable custom location with specific coordinates
      enableCustomLocation: (coords) => {
        set({
          lastKnownCoords: coords,
          useCustomLocation: true,
        });
      },

      // ✅ NEW: Reset to Singapore default
      resetToSingapore: () => {
        set({
          userLocation: null,
          useCustomLocation: false,
          lastKnownCoords: null,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      reset: () => set({
        userLocation: null,
        useCustomLocation: false,
        lastKnownCoords: null,
        isLoading: false,
        error: null,
        hasPermission: false,
      }),
    }),
    {
      name: 'location-store',  // ✅ MMKV key
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = defaultStorage.getString(name);
          return value ? value : null;
        },
        setItem: (name, value) => {
          defaultStorage.set(name, value);
        },
        removeItem: (name) => {
          defaultStorage.delete(name);
        },
      })),
      // ✅ Only persist these fields
      partialize: (state) => ({
        useCustomLocation: state.useCustomLocation,
        lastKnownCoords: state.lastKnownCoords,
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useCoordinates = () => {
  const { useCustomLocation, lastKnownCoords } = useLocationStore();
  
  // ✅ Return cached coords if custom location enabled, otherwise Singapore
  return useCustomLocation && lastKnownCoords 
    ? lastKnownCoords 
    : SINGAPORE_COORDS;
};

export const useIsUsingCustomLocation = () => {
  return useLocationStore(state => state.useCustomLocation);
};