/**
 * Restaurant Map Component
 *
 * Interactive map displaying restaurant locations with markers.
 * Handles edge cases for missing coordinates gracefully.
 *
 * @version 2.0 - Added defensive checks, loading state, improved performance
 */

import React, { memo, useCallback, useMemo, useRef } from 'react';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Restaurant } from '../../api/services/food';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Restaurant Map');

// ============================================================================
// CONSTANTS
// ============================================================================

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.3;

const SINGAPORE_DEFAULT_REGION: Region = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ============================================================================
// TYPES
// ============================================================================

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapRegion extends Coordinates {
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Props {
  region?: MapRegion;
  restaurants: Restaurant[];
  onMarkerPress?: (restaurant: Restaurant) => void;
  showsUserLocation?: boolean;
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
 * This provides backwards compatibility during migration
 */
function getRestaurantCoordinates(restaurant: Restaurant): Coordinates | null {
  // First try 'coordinates' (normalized format)
  if (isValidCoordinates(restaurant.coordinates)) {
    return restaurant.coordinates;
  }

  // Fallback to 'location' (Firebase GeoPoint format - for backwards compatibility)
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
// COMPONENT
// ============================================================================

const RestaurantMap: React.FC<Props> = ({
  region,
  restaurants,
  onMarkerPress,
  showsUserLocation = true,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);

  // Use provided region or fall back to Singapore default
  const mapRegion = useMemo<Region>(() => {
    if (region && isValidCoordinates(region)) {
      return region;
    }
    return SINGAPORE_DEFAULT_REGION;
  }, [region]);

  // Filter restaurants with valid coordinates only
  const validRestaurants = useMemo(() => {
    const valid = restaurants
      .map((restaurant) => {
        const coords = getRestaurantCoordinates(restaurant);
        if (!coords) return null;
        return { ...restaurant, _resolvedCoords: coords };
      })
      .filter((r): r is Restaurant & { _resolvedCoords: Coordinates } => r !== null);

    if (__DEV__ && valid.length !== restaurants.length) {
      logger.debug('Restaurants with valid coordinates', { valid: valid.length, total: restaurants.length });
    }

    return valid;
  }, [restaurants]);

  // Handle marker press - navigate to restaurant detail
  const handleMarkerPress = useCallback(
    (restaurant: Restaurant) => {
      if (onMarkerPress) {
        onMarkerPress(restaurant);
      }
    },
    [onMarkerPress]
  );

  // Handle callout press - navigate to detail page
  const handleCalloutPress = useCallback(
    (restaurantId: string) => {
      router.push(`/food/${restaurantId}`);
    },
    [router]
  );

  // Show empty state if no restaurants at all
  if (restaurants.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.accent || '#f0f0f0' }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          No restaurants to display
        </Text>
      </View>
    );
  }

  // Show error state if restaurants provided but none have valid coordinates
  if (validRestaurants.length === 0 && restaurants.length > 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.accent || '#f0f0f0' }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Unable to load restaurant locations
        </Text>
        {__DEV__ && (
          <Text style={[styles.debugText, { marginTop: 4 }]}>
            Check coordinates in Firebase data
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={mapRegion}
        initialRegion={SINGAPORE_DEFAULT_REGION}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={Platform.OS === 'android'}
        showsCompass={true}
        zoomEnabled={true}
        zoomControlEnabled={Platform.OS === 'android'}
        rotateEnabled={true}
        pitchEnabled={false}
        loadingEnabled={true}
        loadingIndicatorColor={theme.colors.accent}
        loadingBackgroundColor={theme.colors.primary}
        // Performance optimizations
        moveOnMarkerPress={false}
        toolbarEnabled={false}
      >
        {validRestaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            identifier={restaurant.id}
            coordinate={restaurant._resolvedCoords}
            title={restaurant.name}
            description={restaurant.address || restaurant.categories?.join(', ')}
            onPress={() => handleMarkerPress(restaurant)}
            onCalloutPress={() => handleCalloutPress(restaurant.id)}
            pinColor={theme.colors.accent}
          />
        ))}
      </MapView>

      {/* Overlay for debugging - remove in production */}
      {__DEV__ && validRestaurants.length !== restaurants.length && (
        <View style={styles.debugBadge}>
          <Text style={styles.debugText}>
            {validRestaurants.length}/{restaurants.length} valid
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: MAP_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  map: {
    flex: 1,
  },
  debugBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// ============================================================================
// EXPORT
// ============================================================================

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(RestaurantMap);