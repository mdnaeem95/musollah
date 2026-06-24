/**
 * Musollah Service - Structured Logging Version
 * 
 * Manages prayer facility locations across Singapore:
 * - Bidets (public restrooms with water facilities)
 * - Musollahs (prayer rooms with amenities)
 * - Mosques (full-service mosques)
 * 
 * Features:
 * - Multi-layer caching (MMKV)
 * - Distance calculation (Haversine formula)
 * - Real-time location updates
 * - Community status reporting
 * - Flexible coordinate extraction
 * 
 * @version 6.0 - Structured logging migration
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationObject } from 'expo-location';
import { db, storageService } from '../../client/firebase';
import { cache, TTL, cacheStorage } from '../../client/storage';
import { logger } from '../../../services/logging/logger';
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, query as fsQuery, setDoc, updateDoc, writeBatch } from '@react-native-firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from '@react-native-firebase/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BidetLocation {
  id: string;
  address: string;
  building: string;
  postal: number;
  coordinates: Coordinates;
  female: string;
  handicap: string;
  male: string;
  distance?: number;
  status?: 'Available' | 'Unavailable' | 'Unknown';
  statusReason?: string; // shown when Unavailable (e.g. "Maintenance")
  lastUpdated?: number;
  // Distinct users who have confirmed this location ("still here"); drives the
  // community-verified badge and refreshes status freshness.
  verifiedBy?: string[];
  // Aggregated community cleanliness rating (sum / count of 1–5 ratings).
  cleanlinessSum?: number;
  cleanlinessCount?: number;
}

export interface MosqueLocation {
  id: string;
  building: string;
  address: string;
  coordinates: Coordinates;
  shia: string;
  distance?: number;
}

export interface MusollahLocation {
  id: string;
  building: string;
  address: string;
  coordinates: Coordinates;
  segregated: string;
  airConditioned: string;
  ablutionArea: string;
  slippers: string;
  prayerMats: string;
  telekung: string;
  accessible: string; // wheelchair / step-free access
  directions: string;
  distance?: number;
  status?: 'Available' | 'Unavailable' | 'Unknown';
  statusReason?: string; // shown when Unavailable (e.g. "Maintenance")
  lastUpdated?: number;
  // Distinct users who have confirmed this location ("still here"); drives the
  // community-verified badge and refreshes status freshness.
  verifiedBy?: string[];
  // Aggregated community cleanliness rating (sum / count of 1–5 ratings).
  cleanlinessSum?: number;
  cleanlinessCount?: number;
}

export type LocationUnion = BidetLocation | MusollahLocation | MosqueLocation;

export interface MusollahData {
  bidetLocations: BidetLocation[];
  mosqueLocations: MosqueLocation[];
  musollahLocations: MusollahLocation[];
}

// Raw data without distances (what we cache/fetch)
interface RawMusollahData {
  bidets: BidetLocation[];
  mosques: MosqueLocation[];
  musollahs: MusollahLocation[];
}

export interface LocationRequest {
  type: 'Bidet' | 'Musollah';
  buildingName: string;
  address: string;
  postal: string;

  // Bidet-specific fields
  maleFacility?: boolean;
  femaleFacility?: boolean;
  accessibleFacility?: boolean;

  // Musollah-specific fields
  segregated?: boolean;
  airConditioned?: boolean;
  ablutionArea?: boolean;
  slippers?: boolean;
  prayerMats?: boolean;
  telekung?: boolean;
  directions?: string;

  // Metadata
  submittedAt: string;
  status?: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLECTIONS = {
  bidets: 'Bidets',
  mosques: 'Mosques',
  musollahs: 'Musollahs',
} as const;

const CACHE_KEYS = {
  allBidets: 'musollah-all-bidets-v5',
  allMosques: 'musollah-all-mosques-v5',
  allMusollahs: 'musollah-all-musollahs-v5',
} as const;

// ============================================================================
// DISTANCE CALCULATION (Haversine Formula)
// ============================================================================

/**
 * Calculates distance between two coordinates using Haversine formula
 * 
 * @function calculateDistance
 * @param {Coordinates} from - Starting coordinates
 * @param {Coordinates} to - Destination coordinates
 * @returns {number} Distance in kilometers
 * 
 * @example
 * const distance = calculateDistance(
 *   { latitude: 1.3521, longitude: 103.8198 },
 *   { latitude: 1.3000, longitude: 103.8000 }
 * );
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  if (
    !from ||
    !to ||
    !isValidCoordinate(from.latitude, from.longitude) ||
    !isValidCoordinate(to.latitude, to.longitude)
  ) {
    logger.debug('Invalid coordinates for distance calculation', {
      from,
      to,
      result: 0,
    });
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  logger.debug('Distance calculated', {
    from: `${from.latitude.toFixed(4)}, ${from.longitude.toFixed(4)}`,
    to: `${to.latitude.toFixed(4)}, ${to.longitude.toFixed(4)}`,
    distance: `${distance.toFixed(2)}km`,
  });

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validates coordinate values
 * 
 * @function isValidCoordinate
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid coordinates
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  const valid =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!valid) {
    logger.debug('Invalid coordinate validation', {
      lat,
      lng,
      checks: {
        isNumber: typeof lat === 'number' && typeof lng === 'number',
        notNaN: !isNaN(lat) && !isNaN(lng),
        notZero: lat !== 0 && lng !== 0,
        latRange: lat >= -90 && lat <= 90,
        lngRange: lng >= -180 && lng <= 180,
      },
    });
  }

  return valid;
}

/**
 * Adds distances to locations and sorts by proximity
 * 
 * @function addDistancesAndSort
 * @param {T[]} locations - Array of locations
 * @param {Coordinates | null} userCoords - User's coordinates
 * @returns {(T & { distance: number })[]} Locations with distances, sorted
 */
function addDistancesAndSort<T extends { coordinates: Coordinates }>(
  locations: T[],
  userCoords: Coordinates | null
): (T & { distance: number })[] {
  if (!locations || locations.length === 0) {
    logger.debug('No locations to add distances', { count: 0 });
    return [];
  }

  logger.debug('Adding distances and sorting', {
    locationCount: locations.length,
    hasUserCoords: !!userCoords,
    userCoords: userCoords
      ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`
      : null,
  });

  const withDistance = locations.map((loc) => ({
    ...loc,
    distance: userCoords ? calculateDistance(userCoords, loc.coordinates) : 0,
  }));

  const sorted = withDistance.sort((a, b) => a.distance - b.distance);

  logger.debug('Locations sorted by distance', {
    count: sorted.length,
    nearestDistance: sorted[0]?.distance.toFixed(2) + 'km',
    farthestDistance: sorted[sorted.length - 1]?.distance.toFixed(2) + 'km',
  });

  return sorted;
}

// ============================================================================
// COORDINATE EXTRACTION UTILITIES
// ============================================================================

/**
 * Extracts coordinates from various Firestore document formats
 * 
 * Supports multiple field naming conventions:
 * - coordinates, Coordinates (GeoPoint)
 * - latitude/longitude, Latitude/Longitude
 * - lat/lng
 * - location, Location (GeoPoint)
 * 
 * @function extractCoordinates
 * @param {any} data - Firestore document data
 * @returns {Coordinates} Extracted coordinates or {0, 0} if failed
 */
function extractCoordinates(data: any): Coordinates {
  const extractFromGeoPoint = (geoPoint: any): Coordinates | null => {
    if (!geoPoint) return null;

    const lat = geoPoint.latitude ?? geoPoint._latitude;
    const lng = geoPoint.longitude ?? geoPoint._longitude;

    if (lat !== undefined && lng !== undefined) {
      return { latitude: Number(lat), longitude: Number(lng) };
    }
    return null;
  };

  // Try all possible field names
  const attempts = [
    { field: 'Coordinates', value: extractFromGeoPoint(data.Coordinates) },
    { field: 'coordinates', value: extractFromGeoPoint(data.coordinates) },
    {
      field: 'latitude/longitude',
      value:
        data.latitude !== undefined && data.longitude !== undefined
          ? { latitude: Number(data.latitude), longitude: Number(data.longitude) }
          : null,
    },
    {
      field: 'Latitude/Longitude',
      value:
        data.Latitude !== undefined && data.Longitude !== undefined
          ? { latitude: Number(data.Latitude), longitude: Number(data.Longitude) }
          : null,
    },
    {
      field: 'lat/lng',
      value:
        data.lat !== undefined && data.lng !== undefined
          ? { latitude: Number(data.lat), longitude: Number(data.lng) }
          : null,
    },
    { field: 'location', value: extractFromGeoPoint(data.location) },
    { field: 'Location', value: extractFromGeoPoint(data.Location) },
  ];

  for (const attempt of attempts) {
    if (attempt.value) {
      logger.debug('Coordinates extracted successfully', {
        field: attempt.field,
        coordinates: attempt.value,
      });
      return attempt.value;
    }
  }

  logger.warn('Could not extract coordinates - using default', {
    availableFields: Object.keys(data),
    attemptedFields: attempts.map((a) => a.field),
  });

  return { latitude: 0, longitude: 0 };
}

/**
 * Extracts building name from Firestore document
 */
function extractBuilding(data: any): string {
  const value =
    data.building ||
    data.Building ||
    data.name ||
    data.Name ||
    data.title ||
    data.Title ||
    data.locationName ||
    data.placeName ||
    'Unknown';

  logger.debug('Building name extracted', {
    value,
    source: Object.keys(data).find((k) =>
      ['building', 'Building', 'name', 'Name'].includes(k)
    ),
  });

  return value;
}

/**
 * Extracts address from Firestore document
 */
function extractAddress(data: any): string {
  const value =
    data.address ||
    data.Address ||
    data.location ||
    data.Location ||
    data.street ||
    data.fullAddress ||
    '';

  logger.debug('Address extracted', {
    value,
    hasValue: !!value,
  });

  return value;
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Clears all musollah-related caches
 * 
 * @function clearAllMusollahCache
 * @returns {void}
 */
export function clearAllMusollahCache(): void {
  const startTime = performance.now();

  logger.info('Clearing all musollah caches');

  cache.clear(CACHE_KEYS.allBidets);
  cache.clear(CACHE_KEYS.allMosques);
  cache.clear(CACHE_KEYS.allMusollahs);

  try {
    const allKeys = cacheStorage.getAllKeys();
    const musollahKeys = allKeys.filter((key) => key.includes('musollah'));
    musollahKeys.forEach((key) => cacheStorage.remove(key));

    const duration = Math.round(performance.now() - startTime);

    logger.success('Musollah caches cleared', {
      clearedKeys: musollahKeys.length,
      totalKeys: allKeys.length,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to clear musollah caches', {
      error: error.message,
      duration: `${duration}ms`,
    });
  }
}

// ============================================================================
// FETCH FUNCTIONS (Raw Data - No Distances) - MODULAR
// ============================================================================

/**
 * Fetches all bidet locations from Firestore
 * 
 * @async
 * @function fetchAllBidets
 * @returns {Promise<BidetLocation[]>} Array of bidet locations
 * @throws {Error} If Firestore query fails
 */
async function fetchAllBidets(): Promise<BidetLocation[]> {
  const startTime = performance.now();

  logger.debug('Fetching bidets from Firestore', {
    collection: COLLECTIONS.bidets,
  });

  try {
    const colRef = collection(db, COLLECTIONS.bidets);
    const snapshot = await getDocs(colRef);
    const duration = Math.round(performance.now() - startTime);

    logger.debug('Bidet documents retrieved', {
      count: snapshot.size,
      isEmpty: snapshot.empty,
      duration: `${duration}ms`,
    });

    if (snapshot.empty) return [];

    // Log first document structure in dev mode
    if (__DEV__ && snapshot.size > 0) {
      const firstDoc = snapshot.docs[0].data();
      logger.debug('First bidet document structure', {
        fields: Object.keys(firstDoc),
        coordinatesField:
          (firstDoc as any).Coordinates || (firstDoc as any).coordinates || 'NOT FOUND',
      });
    }

    const locations = snapshot.docs.map((d: any) => {
      const data: any = d.data();
      const coords = extractCoordinates(data);

      return {
        id: d.id,
        building: extractBuilding(data),
        address: extractAddress(data),
        postal: data.postal || data.Postal || 0,
        coordinates: coords,
        female: data.female || data.Female || 'No',
        handicap: data.handicap || data.Handicap || 'No',
        male: data.male || data.Male || 'No',
        status: data.status || data.Status,
        lastUpdated: data.lastUpdated || data.updatedAt,
        cleanlinessSum: data.cleanlinessSum || 0,
        cleanlinessCount: data.cleanlinessCount || 0,
      } as BidetLocation;
    });

    // Log first location in dev mode
    if (__DEV__ && locations.length > 0) {
      const first = locations[0];
      logger.debug('First bidet location parsed', {
        building: first.building,
        coordinates: `${first.coordinates.latitude}, ${first.coordinates.longitude}`,
        hasValidCoords: isValidCoordinate(
          first.coordinates.latitude,
          first.coordinates.longitude
        ),
      });
    }

    const finalDuration = Math.round(performance.now() - startTime);

    logger.success('Bidets fetched successfully', {
      count: locations.length,
      duration: `${finalDuration}ms`,
      source: 'Firestore',
      collection: COLLECTIONS.bidets,
    });

    return locations;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to fetch bidets', {
      error: error.message,
      duration: `${duration}ms`,
      collection: COLLECTIONS.bidets,
    });

    throw error;
  }
}

/**
 * Fetches all mosque locations from Firestore
 * 
 * @async
 * @function fetchAllMosques
 * @returns {Promise<MosqueLocation[]>} Array of mosque locations
 * @throws {Error} If Firestore query fails
 */
async function fetchAllMosques(): Promise<MosqueLocation[]> {
  const startTime = performance.now();

  logger.debug('Fetching mosques from Firestore', {
    collection: COLLECTIONS.mosques,
  });

  try {
    const colRef = collection(db, COLLECTIONS.mosques);
    const snapshot = await getDocs(colRef);
    const duration = Math.round(performance.now() - startTime);

    logger.debug('Mosque documents retrieved', {
      count: snapshot.size,
      isEmpty: snapshot.empty,
      duration: `${duration}ms`,
    });

    if (snapshot.empty) return [];

    // Log first document structure in dev mode
    if (__DEV__ && snapshot.size > 0) {
      const firstDoc = snapshot.docs[0].data();
      logger.debug('First mosque document structure', {
        fields: Object.keys(firstDoc),
        coordinatesField:
          (firstDoc as any).Coordinates || (firstDoc as any).coordinates || 'NOT FOUND',
      });
    }

    const locations = snapshot.docs.map((d: any) => {
      const data: any = d.data();
      const coords = extractCoordinates(data);

      return {
        id: d.id,
        building: extractBuilding(data),
        address: extractAddress(data),
        coordinates: coords,
        shia: data.shia || data.Shia || 'No',
      } as MosqueLocation;
    });

    // Log first location in dev mode
    if (__DEV__ && locations.length > 0) {
      const first = locations[0];
      logger.debug('First mosque location parsed', {
        building: first.building,
        coordinates: `${first.coordinates.latitude}, ${first.coordinates.longitude}`,
        hasValidCoords: isValidCoordinate(
          first.coordinates.latitude,
          first.coordinates.longitude
        ),
      });
    }

    const finalDuration = Math.round(performance.now() - startTime);

    logger.success('Mosques fetched successfully', {
      count: locations.length,
      duration: `${finalDuration}ms`,
      source: 'Firestore',
      collection: COLLECTIONS.mosques,
    });

    return locations;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to fetch mosques', {
      error: error.message,
      duration: `${duration}ms`,
      collection: COLLECTIONS.mosques,
    });

    throw error;
  }
}

/**
 * Fetches all musollah locations from Firestore
 * 
 * @async
 * @function fetchAllMusollahs
 * @returns {Promise<MusollahLocation[]>} Array of musollah locations
 * @throws {Error} If Firestore query fails
 */
async function fetchAllMusollahs(): Promise<MusollahLocation[]> {
  const startTime = performance.now();

  logger.debug('Fetching musollahs from Firestore', {
    collection: COLLECTIONS.musollahs,
  });

  try {
    const colRef = collection(db, COLLECTIONS.musollahs);
    const snapshot = await getDocs(colRef);
    const duration = Math.round(performance.now() - startTime);

    logger.debug('Musollah documents retrieved', {
      count: snapshot.size,
      isEmpty: snapshot.empty,
      duration: `${duration}ms`,
    });

    if (snapshot.empty) return [];

    // Log first document structure in dev mode
    if (__DEV__ && snapshot.size > 0) {
      const firstDoc = snapshot.docs[0].data();
      logger.debug('First musollah document structure', {
        fields: Object.keys(firstDoc),
        coordinatesField:
          (firstDoc as any).Coordinates || (firstDoc as any).coordinates || 'NOT FOUND',
      });
    }

    const locations = snapshot.docs.map((d: any) => {
      const data: any = d.data();
      const coords = extractCoordinates(data);

      return {
        id: d.id,
        building: extractBuilding(data),
        address: extractAddress(data),
        coordinates: coords,
        segregated: data.segregated || data.Segregated || 'No',
        airConditioned: data.airConditioned || data.AirConditioned || data.aircon || 'No',
        ablutionArea: data.ablutionArea || data.AblutionArea || data.ablution || 'No',
        slippers: data.slippers || data.Slippers || 'No',
        prayerMats: data.prayerMats || data.PrayerMats || data.mats || 'No',
        telekung: data.telekung || data.Telekung || 'No',
        directions: data.directions || data.Directions || data.howToGet || '',
        status: data.status || data.Status,
        lastUpdated: data.lastUpdated || data.updatedAt,
        cleanlinessSum: data.cleanlinessSum || 0,
        cleanlinessCount: data.cleanlinessCount || 0,
      } as MusollahLocation;
    });

    // Log first location in dev mode
    if (__DEV__ && locations.length > 0) {
      const first = locations[0];
      logger.debug('First musollah location parsed', {
        building: first.building,
        coordinates: `${first.coordinates.latitude}, ${first.coordinates.longitude}`,
        hasValidCoords: isValidCoordinate(
          first.coordinates.latitude,
          first.coordinates.longitude
        ),
        amenities: {
          segregated: first.segregated,
          airConditioned: first.airConditioned,
          ablutionArea: first.ablutionArea,
        },
      });
    }

    const finalDuration = Math.round(performance.now() - startTime);

    logger.success('Musollahs fetched successfully', {
      count: locations.length,
      duration: `${finalDuration}ms`,
      source: 'Firestore',
      collection: COLLECTIONS.musollahs,
    });

    return locations;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to fetch musollahs', {
      error: error.message,
      duration: `${duration}ms`,
      collection: COLLECTIONS.musollahs,
    });

    throw error;
  }
}

/**
 * Updates location status (bidet or musollah)
 * 
 * @async
 * @function updateLocationStatus
 * @param {'bidet' | 'musollah'} type - Location type
 * @param {string} id - Location document ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
async function updateLocationStatus(
  type: 'bidet' | 'musollah',
  id: string,
  status: 'Available' | 'Unavailable' | 'Unknown',
  statusReason?: string
): Promise<void> {
  const startTime = performance.now();
  const collectionName = type === 'bidet' ? COLLECTIONS.bidets : COLLECTIONS.musollahs;
  const cacheKey = type === 'bidet' ? CACHE_KEYS.allBidets : CACHE_KEYS.allMusollahs;

  logger.debug('Updating location status', {
    type,
    id,
    status,
    collection: collectionName,
  });

  try {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, {
      status,
      lastUpdated: Date.now(),
      statusReason: status === 'Unavailable' ? (statusReason ?? '') : '',
    });

    const duration = Math.round(performance.now() - startTime);

    logger.success('Location status updated', {
      type,
      id,
      status,
      duration: `${duration}ms`,
    });

    // Clear cache
    cache.clear(cacheKey);
    logger.debug('Cache cleared after status update', { cacheKey });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to update location status', {
      error: error.message,
      type,
      id,
      status,
      duration: `${duration}ms`,
    });

    throw error;
  }
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const MUSOLLAH_QUERY_KEYS = {
  all: ['musollah'] as const,
  allLocations: ['musollah', 'all-locations'] as const,
  bidets: ['musollah', 'bidets'] as const,
  mosques: ['musollah', 'mosques'] as const,
  musollahs: ['musollah', 'musollahs'] as const,
};

// ============================================================================
// MAIN HOOK - reacts to location changes
// ============================================================================

/**
 * Hook to fetch all musollah data with distance calculation
 * 
 * @function useMusollahData
 * @param {LocationObject | null} userLocation - User's current location
 * @returns {UseQueryResult<MusollahData>} Query result with all location types
 * 
 * Features:
 * - Multi-layer caching (MMKV)
 * - Parallel fetching (all 3 types)
 * - Reactive distance calculation (useMemo)
 * - Distance sorting (nearest first)
 * 
 * @example
 * const { data, isLoading } = useMusollahData(userLocation);
 * const { bidetLocations, mosqueLocations, musollahLocations } = data || {};
 */
export function useMusollahData(userLocation: LocationObject | null) {
  const userCoords: Coordinates | null = useMemo(() => {
    if (!userLocation?.coords) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation?.coords?.latitude, userLocation?.coords?.longitude]);

  const query = useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.allLocations,
    queryFn: async (): Promise<RawMusollahData> => {
      const startTime = performance.now();

      logger.debug('Fetching musollah data (all types)');

      const cachedBidets = cache.get<BidetLocation[]>(CACHE_KEYS.allBidets);
      const cachedMosques = cache.get<MosqueLocation[]>(CACHE_KEYS.allMosques);
      const cachedMusollahs = cache.get<MusollahLocation[]>(CACHE_KEYS.allMusollahs);

      const hasValidCache =
        cachedBidets &&
        cachedBidets.length > 0 &&
        isValidCoordinate(cachedBidets[0].coordinates?.latitude, cachedBidets[0].coordinates?.longitude) &&
        cachedMosques &&
        cachedMosques.length > 0 &&
        cachedMusollahs &&
        cachedMusollahs.length > 0;

      if (hasValidCache) {
        const duration = Math.round(performance.now() - startTime);
        logger.debug('Using cached musollah data', {
          bidets: cachedBidets!.length,
          mosques: cachedMosques!.length,
          musollahs: cachedMusollahs!.length,
          source: 'MMKV',
          duration: `${duration}ms`,
        });

        return {
          bidets: cachedBidets!,
          mosques: cachedMosques!,
          musollahs: cachedMusollahs!,
        };
      }

      logger.debug('Cache miss - fetching fresh data from Firebase');

      const [bidets, mosques, musollahs] = await Promise.all([
        fetchAllBidets(),
        fetchAllMosques(),
        fetchAllMusollahs(),
      ]);

      // Cache each type if valid
      if (
        bidets.length > 0 &&
        isValidCoordinate(bidets[0].coordinates?.latitude, bidets[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allBidets, bidets, TTL.ONE_HOUR);
        logger.debug('Bidets cached', {
          count: bidets.length,
          cacheKey: CACHE_KEYS.allBidets,
          ttl: '1 hour',
        });
      }

      if (
        mosques.length > 0 &&
        isValidCoordinate(mosques[0].coordinates?.latitude, mosques[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allMosques, mosques, TTL.ONE_HOUR);
        logger.debug('Mosques cached', {
          count: mosques.length,
          cacheKey: CACHE_KEYS.allMosques,
          ttl: '1 hour',
        });
      }

      if (
        musollahs.length > 0 &&
        isValidCoordinate(musollahs[0].coordinates?.latitude, musollahs[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allMusollahs, musollahs, TTL.ONE_HOUR);
        logger.debug('Musollahs cached', {
          count: musollahs.length,
          cacheKey: CACHE_KEYS.allMusollahs,
          ttl: '1 hour',
        });
      }

      const duration = Math.round(performance.now() - startTime);
      logger.success('Musollah data fetched and cached', {
        bidets: bidets.length,
        mosques: mosques.length,
        musollahs: musollahs.length,
        duration: `${duration}ms`,
      });

      return { bidets, mosques, musollahs };
    },
    staleTime: TTL.FIFTEEN_MINUTES,
    gcTime: TTL.ONE_HOUR,
    retry: 2,
  });

  const dataWithDistances: MusollahData | undefined = useMemo(() => {
    if (!query.data) return undefined;

    const { bidets, mosques, musollahs } = query.data;

    logger.debug('Computing distances for all locations', {
      bidets: bidets.length,
      mosques: mosques.length,
      musollahs: musollahs.length,
      userLocation: userCoords
        ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`
        : 'no location',
    });

    return {
      bidetLocations: addDistancesAndSort(bidets, userCoords),
      mosqueLocations: addDistancesAndSort(mosques, userCoords),
      musollahLocations: addDistancesAndSort(musollahs, userCoords),
    };
  }, [query.data, userCoords]);

  return {
    ...query,
    data: dataWithDistances,
  };
}

// ============================================================================
// SUBMIT LOCATION REQUEST - MODULAR
// ============================================================================

/**
 * Submits new location request to Firestore
 * 
 * @async
 * @function submitLocationRequest
 * @param {Omit<LocationRequest, 'status'>} data - Request data
 * @returns {Promise<void>}
 * @throws {Error} If submission fails
 */
async function submitLocationRequest(data: Omit<LocationRequest, 'status'>): Promise<void> {
  const startTime = performance.now();

  logger.debug('Submitting location request', {
    type: data.type,
    building: data.buildingName,
    address: data.address,
  });

  try {
    const requestData: LocationRequest = {
      ...data,
      status: 'pending',
    };

    const colRef = collection(db, 'locationRequests');
    await addDoc(colRef, requestData);

    const duration = Math.round(performance.now() - startTime);

    logger.success('Location request submitted', {
      type: data.type,
      building: data.buildingName,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to submit location request', {
      error: error.message,
      type: data.type,
      building: data.buildingName,
      duration: `${duration}ms`,
    });

    throw new Error('Failed to submit location request');
  }
}

// ============================================================================
// INDIVIDUAL LOCATION HOOKS
// ============================================================================

/**
 * Hook to fetch bidet locations with distance calculation
 * 
 * @function useBidetLocations
 * @param {LocationObject | null} userLocation - User's current location
 * @returns {UseQueryResult<BidetLocation[]>} Query result with bidets sorted by distance
 */
export function useBidetLocations(userLocation: LocationObject | null) {
  const userCoords: Coordinates | null = useMemo(() => {
    if (!userLocation?.coords) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation?.coords?.latitude, userLocation?.coords?.longitude]);

  const query = useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.bidets,
    queryFn: async () => {
      const cached = cache.get<BidetLocation[]>(CACHE_KEYS.allBidets);
      if (
        cached &&
        cached.length > 0 &&
        isValidCoordinate(cached[0].coordinates?.latitude, cached[0].coordinates?.longitude)
      ) {
        logger.debug('Using cached bidets', { count: cached.length, source: 'MMKV' });
        return cached;
      }
      const bidets = await fetchAllBidets();
      if (
        bidets.length > 0 &&
        isValidCoordinate(bidets[0].coordinates?.latitude, bidets[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allBidets, bidets, TTL.ONE_HOUR);
      }
      return bidets;
    },
    staleTime: TTL.FIFTEEN_MINUTES,
  });

  const dataWithDistances = useMemo(() => {
    if (!query.data) return undefined;
    return addDistancesAndSort(query.data, userCoords);
  }, [query.data, userCoords]);

  return { ...query, data: dataWithDistances };
}

/**
 * Hook to fetch mosque locations with distance calculation
 * 
 * @function useMosqueLocations
 * @param {LocationObject | null} userLocation - User's current location
 * @returns {UseQueryResult<MosqueLocation[]>} Query result with mosques sorted by distance
 */
export function useMosqueLocations(userLocation: LocationObject | null) {
  const userCoords: Coordinates | null = useMemo(() => {
    if (!userLocation?.coords) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation?.coords?.latitude, userLocation?.coords?.longitude]);

  const query = useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.mosques,
    queryFn: async () => {
      const cached = cache.get<MosqueLocation[]>(CACHE_KEYS.allMosques);
      if (
        cached &&
        cached.length > 0 &&
        isValidCoordinate(cached[0].coordinates?.latitude, cached[0].coordinates?.longitude)
      ) {
        logger.debug('Using cached mosques', { count: cached.length, source: 'MMKV' });
        return cached;
      }
      const mosques = await fetchAllMosques();
      if (
        mosques.length > 0 &&
        isValidCoordinate(mosques[0].coordinates?.latitude, mosques[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allMosques, mosques, TTL.ONE_HOUR);
      }
      return mosques;
    },
    staleTime: TTL.FIFTEEN_MINUTES,
  });

  const dataWithDistances = useMemo(() => {
    if (!query.data) return undefined;
    return addDistancesAndSort(query.data, userCoords);
  }, [query.data, userCoords]);

  return { ...query, data: dataWithDistances };
}

/**
 * Hook to fetch musollah locations with distance calculation
 * 
 * @function useMusollahLocations
 * @param {LocationObject | null} userLocation - User's current location
 * @returns {UseQueryResult<MusollahLocation[]>} Query result with musollahs sorted by distance
 */
export function useMusollahLocations(userLocation: LocationObject | null) {
  const userCoords: Coordinates | null = useMemo(() => {
    if (!userLocation?.coords) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation?.coords?.latitude, userLocation?.coords?.longitude]);

  const query = useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.musollahs,
    queryFn: async () => {
      const cached = cache.get<MusollahLocation[]>(CACHE_KEYS.allMusollahs);
      if (
        cached &&
        cached.length > 0 &&
        isValidCoordinate(cached[0].coordinates?.latitude, cached[0].coordinates?.longitude)
      ) {
        logger.debug('Using cached musollahs', { count: cached.length, source: 'MMKV' });
        return cached;
      }
      const musollahs = await fetchAllMusollahs();
      if (
        musollahs.length > 0 &&
        isValidCoordinate(musollahs[0].coordinates?.latitude, musollahs[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allMusollahs, musollahs, TTL.ONE_HOUR);
      }
      return musollahs;
    },
    staleTime: TTL.FIFTEEN_MINUTES,
  });

  const dataWithDistances = useMemo(() => {
    if (!query.data) return undefined;
    return addDistancesAndSort(query.data, userCoords);
  }, [query.data, userCoords]);

  return { ...query, data: dataWithDistances };
}

// ============================================================================
// BIDET / MUSOLLAH UPDATE HELPERS
// ============================================================================

// UPDATED: Changed from literal types to string to support location details like "Level 4R"
// GenderStatus can now be: "Yes", "No", "Unknown", OR location text like "Level 4R, near Food Court"
type AmenityStatus = 'Yes' | 'No' | 'Unknown';

export interface UpdateBidetStatusPayload {
  id: string;
  status: 'Available' | 'Unavailable' | 'Unknown';
  male?: string;      // Can be "Yes", "No", "Unknown", or location text
  female?: string;    // Can be "Yes", "No", "Unknown", or location text
  handicap?: string;  // Can be "Yes", "No", "Unknown", or location text
  statusReason?: string; // why it's Unavailable (cleared otherwise)
}

export interface UpdateMusollahStatusPayload {
  id: string;
  status: 'Available' | 'Unavailable' | 'Unknown';
  statusReason?: string; // why it's Unavailable (cleared otherwise)
  segregated?: AmenityStatus;
  airConditioned?: AmenityStatus;
  ablutionArea?: AmenityStatus;
  slippers?: AmenityStatus;
  prayerMats?: AmenityStatus;
  accessible?: AmenityStatus;
  telekung?: AmenityStatus;
}

/**
 * Updates bidet status and amenities
 * 
 * @async
 * @function updateBidetStatus
 * @param {UpdateBidetStatusPayload} payload - Update payload
 * @returns {Promise<void>}
 */
export async function updateBidetStatus({
  id,
  status,
  male,
  female,
  handicap,
  statusReason,
}: UpdateBidetStatusPayload): Promise<void> {
  const startTime = performance.now();

  const updates: Record<string, any> = {
    status,
    lastUpdated: Date.now(),
    // Only meaningful when Unavailable; cleared otherwise.
    statusReason: status === 'Unavailable' ? (statusReason ?? '') : '',
  };

  if (male !== undefined) updates.Male = male;
  if (female !== undefined) updates.Female = female;
  if (handicap !== undefined) updates.Handicap = handicap;

  logger.debug('Updating bidet status', {
    id,
    status,
    updates: Object.keys(updates),
  });

  try {
    const ref = doc(db, COLLECTIONS.bidets, id);
    await updateDoc(ref, updates);

    const duration = Math.round(performance.now() - startTime);

    logger.success('Bidet status updated', {
      id,
      status,
      fieldsUpdated: Object.keys(updates).length,
      duration: `${duration}ms`,
    });

    cache.clear(CACHE_KEYS.allBidets);
    logger.debug('Bidet cache cleared after update');
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to update bidet status', {
      error: error.message,
      id,
      status,
      duration: `${duration}ms`,
    });

    throw error;
  }
}

/**
 * Updates musollah status and amenities
 * 
 * @async
 * @function updateMusollahStatus
 * @param {UpdateMusollahStatusPayload} payload - Update payload
 * @returns {Promise<void>}
 */
export async function updateMusollahStatus({
  id,
  status,
  statusReason,
  segregated,
  airConditioned,
  ablutionArea,
  slippers,
  prayerMats,
  telekung,
  accessible,
}: UpdateMusollahStatusPayload): Promise<void> {
  const startTime = performance.now();

  const updates: Record<string, any> = {
    status,
    lastUpdated: Date.now(),
    // Only meaningful when Unavailable; cleared otherwise.
    statusReason: status === 'Unavailable' ? (statusReason ?? '') : '',
  };

  if (segregated !== undefined) updates.Segregated = segregated;
  if (airConditioned !== undefined) updates.AirConditioned = airConditioned;
  if (ablutionArea !== undefined) updates.AblutionArea = ablutionArea;
  if (slippers !== undefined) updates.Slippers = slippers;
  if (prayerMats !== undefined) updates.PrayerMats = prayerMats;
  if (telekung !== undefined) updates.Telekung = telekung;
  if (accessible !== undefined) updates.Accessible = accessible;

  logger.debug('Updating musollah status', {
    id,
    status,
    updates: Object.keys(updates),
  });

  try {
    const ref = doc(db, COLLECTIONS.musollahs, id);
    await updateDoc(ref, updates);

    const duration = Math.round(performance.now() - startTime);

    logger.success('Musollah status updated', {
      id,
      status,
      fieldsUpdated: Object.keys(updates).length,
      duration: `${duration}ms`,
    });

    cache.clear(CACHE_KEYS.allMusollahs);
    logger.debug('Musollah cache cleared after update');
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);

    logger.error('Failed to update musollah status', {
      error: error.message,
      id,
      status,
      duration: `${duration}ms`,
    });

    throw error;
  }
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to update location status (bidet or musollah)
 * 
 * @function useUpdateLocationStatus
 * @returns {UseMutationResult} Mutation result
 */
export function useUpdateLocationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      id,
      status,
      statusReason,
    }: {
      type: 'bidet' | 'musollah';
      id: string;
      status: 'Available' | 'Unavailable' | 'Unknown';
      statusReason?: string;
    }) => updateLocationStatus(type, id, status, statusReason),
    onSuccess: (_, variables) => {
      logger.success('Location status mutation successful', {
        type: variables.type,
        id: variables.id,
        status: variables.status,
      });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
    },
    onError: (error: any, variables) => {
      logger.error('Location status mutation failed', {
        error: error.message,
        type: variables.type,
        id: variables.id,
        status: variables.status,
      });
    },
  });
}

/**
 * Hook to refresh all musollah data
 * 
 * @function useRefreshMusollahData
 * @returns {Function} Refresh function
 */
export function useRefreshMusollahData() {
  const queryClient = useQueryClient();

  return () => {
    logger.info('Refreshing all musollah data');
    clearAllMusollahCache();
    queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
  };
}

/**
 * Hook to update bidet status
 * 
 * @function useUpdateBidetStatus
 * @returns {UseMutationResult} Mutation result
 */
export function useUpdateBidetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBidetStatusPayload) => updateBidetStatus(payload),
    onSuccess: (_, payload) => {
      logger.success('Bidet status mutation successful', {
        id: payload.id,
        status: payload.status,
      });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.bidets });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.allLocations });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
    },
    onError: (error: any, payload) => {
      logger.error('Bidet status mutation failed', {
        error: error.message,
        id: payload.id,
        status: payload.status,
      });
    },
  });
}

/**
 * Hook to update musollah status
 * 
 * @function useUpdateMusollahStatus
 * @returns {UseMutationResult} Mutation result
 */
export function useUpdateMusollahStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMusollahStatusPayload) => updateMusollahStatus(payload),
    onSuccess: (_, payload) => {
      logger.success('Musollah status mutation successful', {
        id: payload.id,
        status: payload.status,
      });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.musollahs });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.allLocations });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
    },
    onError: (error: any, payload) => {
      logger.error('Musollah status mutation failed', {
        error: error.message,
        id: payload.id,
        status: payload.status,
      });
    },
  });
}

/**
 * Hook to submit location request
 * 
 * @function useSubmitLocationRequest
 * @returns {UseMutationResult} Mutation result
 */
export function useSubmitLocationRequest() {
  return useMutation({
    mutationFn: submitLocationRequest,
    onSuccess: (_, data) => {
      logger.success('Location request mutation successful', {
        type: data.type,
        building: data.buildingName,
      });
    },
    onError: (error: any, data) => {
      logger.error('Location request mutation failed', {
        error: error.message,
        type: data.type,
        building: data.buildingName,
      });
    },
  });
}

// ============================================================================
// CLEANLINESS RATINGS (community, one per user)
// ============================================================================

export type RatingTargetType = 'bidet' | 'musollah';

const RATING_COLLECTION: Record<RatingTargetType, string> = {
  bidet: COLLECTIONS.bidets,
  musollah: COLLECTIONS.musollahs,
};

export interface SubmitCleanlinessRatingPayload {
  type: RatingTargetType;
  id: string;
  userId: string;
  rating: number; // 1–5
  note?: string;
}

export interface UserRating {
  rating: number;
  note: string;
}

/**
 * Submit (or update) a user's cleanliness rating for a location. Stores the
 * per-user rating in a `ratings/{userId}` subcollection and keeps the
 * aggregate (cleanlinessSum / cleanlinessCount) on the location doc via atomic
 * increments — re-rating adjusts the sum by the delta and never double-counts.
 */
export async function submitCleanlinessRating({
  type,
  id,
  userId,
  rating,
  note,
}: SubmitCleanlinessRatingPayload): Promise<void> {
  const startTime = performance.now();
  const colName = RATING_COLLECTION[type];
  const locRef = doc(db, colName, id);
  const userRatingRef = doc(db, colName, id, 'ratings', userId);

  try {
    // Prior rating (if any) lets us adjust the aggregate without double-counting.
    const prevSnap = await getDoc(userRatingRef);
    const prev = prevSnap.exists() ? (prevSnap.data()?.rating as number | undefined) : undefined;
    const sumDelta = prev !== undefined ? rating - prev : rating;
    const countDelta = prev !== undefined ? 0 : 1;

    const batch = writeBatch(db);
    batch.update(locRef, {
      cleanlinessSum: increment(sumDelta),
      cleanlinessCount: increment(countDelta),
      lastRatedAt: Date.now(),
    });
    batch.set(
      userRatingRef,
      { rating, note: note ?? '', userId, updatedAt: Date.now() },
      { merge: true }
    );
    await batch.commit();

    cache.clear(type === 'bidet' ? CACHE_KEYS.allBidets : CACHE_KEYS.allMusollahs);

    logger.success('Cleanliness rating submitted', {
      type,
      id,
      rating,
      updated: prev !== undefined,
      duration: `${Math.round(performance.now() - startTime)}ms`,
    });
  } catch (error: any) {
    logger.error('Failed to submit cleanliness rating', { error: error.message, type, id });
    throw error;
  }
}

/**
 * Hook: submit a cleanliness rating.
 */
export function useSubmitCleanlinessRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitCleanlinessRating,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ['musollah', 'user-rating', variables.type, variables.id, variables.userId],
      });
    },
  });
}

/**
 * Hook: the signed-in user's existing rating for a location (to prefill the
 * rate sheet). Returns null when unrated / signed out.
 */
export function useUserRating(
  type: RatingTargetType,
  id: string | null,
  userId: string | null
) {
  return useQuery<UserRating | null>({
    queryKey: ['musollah', 'user-rating', type, id, userId],
    enabled: !!id && !!userId,
    queryFn: async () => {
      if (!id || !userId) return null;
      const ref = doc(db, RATING_COLLECTION[type], id, 'ratings', userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data();
      return { rating: (data?.rating as number) ?? 0, note: (data?.note as string) ?? '' };
    },
  });
}

// ============================================================================
// STATUS FRESHNESS & COMMUNITY VERIFICATION
// ============================================================================

/** A reported status older than this is treated as stale ("may be outdated"). */
export const STATUS_STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/** Distinct confirmations needed for the community-verified badge. */
export const VERIFY_THRESHOLD = 3;

export function isStatusStale(lastUpdated?: number | null): boolean {
  if (!lastUpdated) return true;
  return Date.now() - lastUpdated > STATUS_STALE_MS;
}

export function isLocationVerified(verifiedBy?: string[] | null): boolean {
  return (verifiedBy?.length ?? 0) >= VERIFY_THRESHOLD;
}

/**
 * One-tap "still here / still accurate" confirmation. Refreshes status freshness
 * (lastUpdated) and records the user as a distinct confirmer (idempotent via
 * arrayUnion) — enough distinct confirmers earns the verified badge.
 */
export async function confirmLocationStatus({
  type,
  id,
  userId,
}: {
  type: RatingTargetType;
  id: string;
  userId: string;
}): Promise<void> {
  const colName = RATING_COLLECTION[type];
  try {
    await updateDoc(doc(db, colName, id), {
      lastUpdated: Date.now(),
      verifiedBy: arrayUnion(userId),
    });
    cache.clear(type === 'bidet' ? CACHE_KEYS.allBidets : CACHE_KEYS.allMusollahs);
    logger.success('Location status confirmed', { type, id });
  } catch (error: any) {
    logger.error('Failed to confirm location status', { error: error.message, type, id });
    throw error;
  }
}

export function useConfirmLocationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmLocationStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all }),
  });
}

// ============================================================================
// COMMUNITY PHOTOS
// ============================================================================
//
// User-contributed photos for musollahs / bidets, stored at
// `locations/{type}/{id}/{photoId}.jpg` in Storage with a metadata doc in the
// location's `photos` subcollection. Moderation is flag-to-hide: a photo is
// hidden once PHOTO_FLAG_THRESHOLD distinct users report it (no admin gate).

export interface LocationPhoto {
  id: string;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: number;
  flagCount: number;
  flaggedBy: string[];
  hidden: boolean;
}

const PHOTO_FLAG_THRESHOLD = 3;

/** Upload an image and write its metadata doc. Returns the created photo. */
export async function uploadLocationPhoto({
  type,
  id,
  userId,
  uri,
}: {
  type: RatingTargetType;
  id: string;
  userId: string;
  uri: string;
}): Promise<LocationPhoto> {
  const colName = RATING_COLLECTION[type];
  const photoId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const path = `locations/${type}/${id}/${photoId}.jpg`;

  try {
    const fileRef = storageRef(storageService, path);
    const blob = await (await fetch(uri)).blob();
    await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(fileRef);

    const photo: LocationPhoto = {
      id: photoId,
      url,
      storagePath: path,
      uploadedBy: userId,
      uploadedAt: Date.now(),
      flagCount: 0,
      flaggedBy: [],
      hidden: false,
    };

    const { id: _omit, ...docData } = photo;
    await setDoc(doc(db, colName, id, 'photos', photoId), docData);

    logger.success('Location photo uploaded', { type, id, photoId });
    return photo;
  } catch (error: any) {
    logger.error('Failed to upload location photo', { error: error.message, type, id });
    throw error;
  }
}

/** Visible (non-hidden) photos for a location, newest first. */
export async function fetchLocationPhotos(
  type: RatingTargetType,
  id: string
): Promise<LocationPhoto[]> {
  const colName = RATING_COLLECTION[type];
  const snap = await getDocs(collection(db, colName, id, 'photos'));
  const docs = snap.docs as any[];
  return docs
    .map((d): LocationPhoto => ({ id: d.id, ...(d.data() as Omit<LocationPhoto, 'id'>) }))
    .filter((p) => !p.hidden)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export function useLocationPhotos(type: RatingTargetType, id: string | null) {
  return useQuery<LocationPhoto[]>({
    queryKey: ['musollah', 'photos', type, id],
    enabled: !!id,
    queryFn: () => fetchLocationPhotos(type, id as string),
    staleTime: TTL.FIVE_MINUTES,
  });
}

/** Report a photo. One flag per user; auto-hides at the threshold. */
export async function flagLocationPhoto({
  type,
  id,
  photoId,
  userId,
}: {
  type: RatingTargetType;
  id: string;
  photoId: string;
  userId: string;
}): Promise<void> {
  const photoRef = doc(db, RATING_COLLECTION[type], id, 'photos', photoId);
  const snap = await getDoc(photoRef);
  if (!snap.exists()) return;
  const data = snap.data() as Omit<LocationPhoto, 'id'>;
  if ((data.flaggedBy ?? []).includes(userId)) return; // already reported by this user
  const nextCount = (data.flagCount ?? 0) + 1;
  await updateDoc(photoRef, {
    flaggedBy: arrayUnion(userId),
    flagCount: increment(1),
    hidden: nextCount >= PHOTO_FLAG_THRESHOLD,
  });
  logger.info('Location photo flagged', { type, id, photoId, nextCount });
}

/** Delete a photo (uploader only — enforced by the caller / Storage rules). */
export async function deleteLocationPhoto({
  type,
  id,
  photoId,
  storagePath,
}: {
  type: RatingTargetType;
  id: string;
  photoId: string;
  storagePath: string;
}): Promise<void> {
  await deleteDoc(doc(db, RATING_COLLECTION[type], id, 'photos', photoId));
  try {
    await deleteObject(storageRef(storageService, storagePath));
  } catch (e: any) {
    logger.warn('Photo doc deleted but storage object remove failed', { error: e?.message });
  }
}

export function useUploadLocationPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadLocationPhoto,
    onSuccess: (_, v) =>
      queryClient.invalidateQueries({ queryKey: ['musollah', 'photos', v.type, v.id] }),
  });
}

export function useFlagLocationPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: flagLocationPhoto,
    onSuccess: (_, v) =>
      queryClient.invalidateQueries({ queryKey: ['musollah', 'photos', v.type, v.id] }),
  });
}

export function useDeleteLocationPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLocationPhoto,
    onSuccess: (_, v) =>
      queryClient.invalidateQueries({ queryKey: ['musollah', 'photos', v.type, v.id] }),
  });
}

// ============================================================================
// DEBUG UTILITIES (MODULAR)
// ============================================================================

/**
 * Debug utility to inspect Firestore collection structures
 * 
 * @async
 * @function debugFirestoreCollections
 * @returns {Promise<void>}
 */
export async function debugFirestoreCollections(): Promise<void> {
  logger.info('Starting Firestore collections debug');

  for (const collectionName of Object.values(COLLECTIONS)) {
    const startTime = performance.now();

    try {
      const colRef = collection(db, collectionName);
      const q = fsQuery(colRef, limit(1));
      const snapshot = await getDocs(q);
      const duration = Math.round(performance.now() - startTime);

      if (snapshot.empty) {
        logger.debug('Collection empty', {
          collection: collectionName,
          documentCount: 0,
          duration: `${duration}ms`,
        });
      } else {
        const first = snapshot.docs[0];
        const data = first.data();
        const coords = extractCoordinates(data);

        logger.debug('Collection inspected', {
          collection: collectionName,
          documentCount: snapshot.size,
          fields: Object.keys(data as any),
          coordinates: coords,
          duration: `${duration}ms`,
        });
      }
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);

      logger.error('Failed to inspect collection', {
        error: error.message,
        collection: collectionName,
        duration: `${duration}ms`,
      });
    }
  }

  logger.success('Firestore collections debug complete');
}

// Legacy alias for backwards compatibility
export const debugFirestoreStructure = debugFirestoreCollections;