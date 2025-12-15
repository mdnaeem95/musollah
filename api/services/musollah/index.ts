/**
 * Musollah Service (v5 - Fixed Distance Calculation)
 *
 * Key Fix: Separates data fetching from distance calculation
 * - Query fetches raw data (no distances)
 * - Distance is computed via useMemo when userLocation changes
 * - This ensures distances update reactively without re-fetching
 *
 * Collections: Bidets, Musollahs, Mosques (capitalized)
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationObject } from 'expo-location';
import { db } from '../../client/firebase';
import { cache, TTL, cacheStorage } from '../../client/storage';

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query as fsQuery,
  updateDoc,
} from '@react-native-firebase/firestore';

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
  lastUpdated?: number;
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
  directions: string;
  distance?: number;
  status?: 'Available' | 'Unavailable' | 'Unknown';
  lastUpdated?: number;
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

export function calculateDistance(from: Coordinates, to: Coordinates): number {
  if (
    !from ||
    !to ||
    !isValidCoordinate(from.latitude, from.longitude) ||
    !isValidCoordinate(to.latitude, to.longitude)
  ) {
    return 0;
  }

  const R = 6371; // km
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function addDistancesAndSort<T extends { coordinates: Coordinates }>(
  locations: T[],
  userCoords: Coordinates | null
): (T & { distance: number })[] {
  if (!locations || locations.length === 0) return [];

  const withDistance = locations.map((loc) => ({
    ...loc,
    distance: userCoords ? calculateDistance(userCoords, loc.coordinates) : 0,
  }));

  return withDistance.sort((a, b) => a.distance - b.distance);
}

// ============================================================================
// COORDINATE EXTRACTION UTILITIES
// ============================================================================

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

  if (data.Coordinates) {
    const coords = extractFromGeoPoint(data.Coordinates);
    if (coords) return coords;
  }

  if (data.coordinates) {
    const coords = extractFromGeoPoint(data.coordinates);
    if (coords) return coords;
  }

  if (data.latitude !== undefined && data.longitude !== undefined) {
    return { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  }

  if (data.Latitude !== undefined && data.Longitude !== undefined) {
    return { latitude: Number(data.Latitude), longitude: Number(data.Longitude) };
  }

  if (data.lat !== undefined && data.lng !== undefined) {
    return { latitude: Number(data.lat), longitude: Number(data.lng) };
  }

  if (data.location) {
    const coords = extractFromGeoPoint(data.location);
    if (coords) return coords;
  }

  if (data.Location) {
    const coords = extractFromGeoPoint(data.Location);
    if (coords) return coords;
  }

  console.warn('⚠️ Could not extract coordinates from:', Object.keys(data));
  return { latitude: 0, longitude: 0 };
}

function extractBuilding(data: any): string {
  return (
    data.building ||
    data.Building ||
    data.name ||
    data.Name ||
    data.title ||
    data.Title ||
    data.locationName ||
    data.placeName ||
    'Unknown'
  );
}

function extractAddress(data: any): string {
  return (
    data.address ||
    data.Address ||
    data.location ||
    data.Location ||
    data.street ||
    data.fullAddress ||
    ''
  );
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

export function clearAllMusollahCache(): void {
  console.log('🧹 Clearing all musollah cache...');
  cache.clear(CACHE_KEYS.allBidets);
  cache.clear(CACHE_KEYS.allMosques);
  cache.clear(CACHE_KEYS.allMusollahs);

  try {
    const allKeys = cacheStorage.getAllKeys();
    const musollahKeys = allKeys.filter((key) => key.includes('musollah'));
    musollahKeys.forEach((key) => cacheStorage.remove(key));
    console.log(`✅ Cleared ${musollahKeys.length} cache entries`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// ============================================================================
// FETCH FUNCTIONS (Raw Data - No Distances) - MODULAR
// ============================================================================

async function fetchAllBidets(): Promise<BidetLocation[]> {
  console.log(`🚽 Fetching from "${COLLECTIONS.bidets}"...`);

  try {
    const colRef = collection(db, COLLECTIONS.bidets);
    const snapshot = await getDocs(colRef);
    console.log(`📦 Got ${snapshot.size} bidet documents`);

    if (snapshot.empty) return [];

    if (__DEV__ && snapshot.size > 0) {
      const firstDoc = snapshot.docs[0].data();
      console.log('📋 First bidet doc fields:', Object.keys(firstDoc));
      console.log(
        '📋 Coordinates field:',
        (firstDoc as any).Coordinates || (firstDoc as any).coordinates || 'NOT FOUND'
      );
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
      } as BidetLocation;
    });

    if (__DEV__ && locations.length > 0) {
      const first = locations[0];
      console.log(
        '✅ First bidet:',
        first.building,
        `coords: (${first.coordinates.latitude}, ${first.coordinates.longitude})`
      );
    }

    return locations;
  } catch (error) {
    console.error('❌ Error fetching bidets:', error);
    throw error;
  }
}

async function fetchAllMosques(): Promise<MosqueLocation[]> {
  console.log(`🕌 Fetching from "${COLLECTIONS.mosques}"...`);

  try {
    const colRef = collection(db, COLLECTIONS.mosques);
    const snapshot = await getDocs(colRef);
    console.log(`📦 Got ${snapshot.size} mosque documents`);

    if (snapshot.empty) return [];

    if (__DEV__ && snapshot.size > 0) {
      const firstDoc = snapshot.docs[0].data();
      console.log('📋 First mosque doc fields:', Object.keys(firstDoc));
      console.log(
        '📋 Coordinates field:',
        (firstDoc as any).Coordinates || (firstDoc as any).coordinates || 'NOT FOUND'
      );
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

    if (__DEV__ && locations.length > 0) {
      const first = locations[0];
      console.log(
        '✅ First mosque:',
        first.building,
        `coords: (${first.coordinates.latitude}, ${first.coordinates.longitude})`
      );
    }

    return locations;
  } catch (error) {
    console.error('❌ Error fetching mosques:', error);
    throw error;
  }
}

async function fetchAllMusollahs(): Promise<MusollahLocation[]> {
  console.log(`🛐 Fetching from "${COLLECTIONS.musollahs}"...`);

  try {
    const colRef = collection(db, COLLECTIONS.musollahs);
    const snapshot = await getDocs(colRef);
    console.log(`📦 Got ${snapshot.size} musollah documents`);

    if (snapshot.empty) return [];

    if (__DEV__ && snapshot.size > 0) {
      const firstDoc = snapshot.docs[0].data();
      console.log('📋 First musollah doc fields:', Object.keys(firstDoc));
      console.log(
        '📋 Coordinates field:',
        (firstDoc as any).Coordinates || (firstDoc as any).coordinates || 'NOT FOUND'
      );
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
      } as MusollahLocation;
    });

    if (__DEV__ && locations.length > 0) {
      const first = locations[0];
      console.log(
        '✅ First musollah:',
        first.building,
        `coords: (${first.coordinates.latitude}, ${first.coordinates.longitude})`
      );
    }

    return locations;
  } catch (error) {
    console.error('❌ Error fetching musollahs:', error);
    throw error;
  }
}

async function updateLocationStatus(
  type: 'bidet' | 'musollah',
  id: string,
  status: 'Available' | 'Unavailable' | 'Unknown'
): Promise<void> {
  const collectionName = type === 'bidet' ? COLLECTIONS.bidets : COLLECTIONS.musollahs;

  const ref = doc(db, collectionName, id);
  await updateDoc(ref, {
    status,
    lastUpdated: Date.now(),
  });

  cache.clear(type === 'bidet' ? CACHE_KEYS.allBidets : CACHE_KEYS.allMusollahs);
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
      console.log('🌐 Fetching musollah data...');

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
        console.log('⚡ Using cached data');
        return {
          bidets: cachedBidets!,
          mosques: cachedMosques!,
          musollahs: cachedMusollahs!,
        };
      }

      console.log('📡 Fetching fresh data from Firebase...');

      const [bidets, mosques, musollahs] = await Promise.all([
        fetchAllBidets(),
        fetchAllMosques(),
        fetchAllMusollahs(),
      ]);

      if (
        bidets.length > 0 &&
        isValidCoordinate(bidets[0].coordinates?.latitude, bidets[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allBidets, bidets, TTL.ONE_HOUR);
        console.log(`💾 Cached ${bidets.length} bidets`);
      }

      if (
        mosques.length > 0 &&
        isValidCoordinate(mosques[0].coordinates?.latitude, mosques[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allMosques, mosques, TTL.ONE_HOUR);
        console.log(`💾 Cached ${mosques.length} mosques`);
      }

      if (
        musollahs.length > 0 &&
        isValidCoordinate(musollahs[0].coordinates?.latitude, musollahs[0].coordinates?.longitude)
      ) {
        cache.set(CACHE_KEYS.allMusollahs, musollahs, TTL.ONE_HOUR);
        console.log(`💾 Cached ${musollahs.length} musollahs`);
      }

      return { bidets, mosques, musollahs };
    },
    staleTime: TTL.FIFTEEN_MINUTES,
    gcTime: TTL.ONE_HOUR,
    retry: 2,
  });

  const dataWithDistances: MusollahData | undefined = useMemo(() => {
    if (!query.data) return undefined;

    const { bidets, mosques, musollahs } = query.data;

    console.log(
      '📏 Computing distances for',
      bidets.length,
      'bidets,',
      mosques.length,
      'mosques,',
      musollahs.length,
      'musollahs',
      userCoords
        ? `from (${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)})`
        : '(no location)'
    );

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

async function submitLocationRequest(data: Omit<LocationRequest, 'status'>): Promise<void> {
  try {
    const requestData: LocationRequest = {
      ...data,
      status: 'pending',
    };

    const colRef = collection(db, 'locationRequests');
    await addDoc(colRef, requestData);

    console.log('✅ Location request submitted successfully');
  } catch (error) {
    console.error('❌ Error submitting location request:', error);
    throw new Error('Failed to submit location request');
  }
}

// ============================================================================
// INDIVIDUAL LOCATION HOOKS
// ============================================================================

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

type GenderStatus = 'Yes' | 'No' | 'Unknown';
type AmenityStatus = 'Yes' | 'No' | 'Unknown';

export interface UpdateBidetStatusPayload {
  id: string;
  status: 'Available' | 'Unavailable' | 'Unknown';
  male?: GenderStatus;
  female?: GenderStatus;
  handicap?: GenderStatus;
}

export interface UpdateMusollahStatusPayload {
  id: string;
  status: 'Available' | 'Unavailable' | 'Unknown';
  segregated?: AmenityStatus;
  airConditioned?: AmenityStatus;
  ablutionArea?: AmenityStatus;
  slippers?: AmenityStatus;
  prayerMats?: AmenityStatus;
  telekung?: AmenityStatus;
}

export async function updateBidetStatus({
  id,
  status,
  male,
  female,
  handicap,
}: UpdateBidetStatusPayload): Promise<void> {
  const updates: Record<string, any> = {
    status,
    lastUpdated: Date.now(),
  };

  if (male !== undefined) updates.Male = male;
  if (female !== undefined) updates.Female = female;
  if (handicap !== undefined) updates.Handicap = handicap;

  const ref = doc(db, COLLECTIONS.bidets, id);
  await updateDoc(ref, updates);

  cache.clear(CACHE_KEYS.allBidets);
}

export async function updateMusollahStatus({
  id,
  status,
  segregated,
  airConditioned,
  ablutionArea,
  slippers,
  prayerMats,
  telekung,
}: UpdateMusollahStatusPayload): Promise<void> {
  const updates: Record<string, any> = {
    status,
    lastUpdated: Date.now(),
  };

  if (segregated !== undefined) updates.Segregated = segregated;
  if (airConditioned !== undefined) updates.AirConditioned = airConditioned;
  if (ablutionArea !== undefined) updates.AblutionArea = ablutionArea;
  if (slippers !== undefined) updates.Slippers = slippers;
  if (prayerMats !== undefined) updates.PrayerMats = prayerMats;
  if (telekung !== undefined) updates.Telekung = telekung;

  const ref = doc(db, COLLECTIONS.musollahs, id);
  await updateDoc(ref, updates);

  cache.clear(CACHE_KEYS.allMusollahs);
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useUpdateLocationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      id,
      status,
    }: {
      type: 'bidet' | 'musollah';
      id: string;
      status: 'Available' | 'Unavailable' | 'Unknown';
    }) => updateLocationStatus(type, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
    },
  });
}

export function useRefreshMusollahData() {
  const queryClient = useQueryClient();

  return () => {
    clearAllMusollahCache();
    queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
  };
}

export function useUpdateBidetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBidetStatusPayload) => updateBidetStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.bidets });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.allLocations });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
    },
  });
}

export function useUpdateMusollahStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMusollahStatusPayload) => updateMusollahStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.musollahs });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.allLocations });
      queryClient.invalidateQueries({ queryKey: MUSOLLAH_QUERY_KEYS.all });
    },
  });
}

export function useSubmitLocationRequest() {
  return useMutation({
    mutationFn: submitLocationRequest,
    onSuccess: () => {
      console.log('✅ Location request mutation successful');
    },
    onError: (error) => {
      console.error('❌ Location request mutation failed:', error);
    },
  });
}

// ============================================================================
// DEBUG UTILITIES (MODULAR)
// ============================================================================

export async function debugFirestoreCollections(): Promise<void> {
  console.log('\n🔍 Debugging Firestore collections...\n');

  for (const collectionName of Object.values(COLLECTIONS)) {
    try {
      const colRef = collection(db, collectionName);
      const q = fsQuery(colRef, limit(1));
      const snapshot = await getDocs(q);

      console.log(`📁 ${collectionName}: ${snapshot.size} doc(s)`);

      if (!snapshot.empty) {
        const first = snapshot.docs[0];
        const data = first.data();
        console.log(`   Fields: ${Object.keys(data as any).join(', ')}`);
        console.log(`   Coordinates:`, extractCoordinates(data));
      }
    } catch (error) {
      console.error(`❌ ${collectionName}:`, error);
    }
  }
}

// Legacy alias for backwards compatibility
export const debugFirestoreStructure = debugFirestoreCollections;
