import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationObject } from 'expo-location';
import { db } from '../../client/firebase';
import { TTL } from '../../client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface BidetLocation {
  id: string;
  address: string;
  building: string;
  postal: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
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
  coordinates: {
    latitude: number;
    longitude: number;
  };
  shia: string;
  distance?: number;
}

export interface MusollahLocation {
  id: string;
  building: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  segregated: string;
  airConditioned: string;
  ablutionArea: string;
  slippers: string;
  prayerMats: string;
  telekung: string;
  directions: string;
  distance?: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function getBidetLocations(region: Region): Promise<BidetLocation[]> {
  const snapshot = await db
    .collection('bidetLocations')
    .where('coordinates.latitude', '>=', region.latitude - region.latitudeDelta)
    .where('coordinates.latitude', '<=', region.latitude + region.latitudeDelta)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BidetLocation[];
}

async function getMosqueLocations(region: Region): Promise<MosqueLocation[]> {
  const snapshot = await db
    .collection('mosqueLocations')
    .where('coordinates.latitude', '>=', region.latitude - region.latitudeDelta)
    .where('coordinates.latitude', '<=', region.latitude + region.latitudeDelta)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MosqueLocation[];
}

async function getMusollahsLocations(region: Region): Promise<MusollahLocation[]> {
  const snapshot = await db
    .collection('musollahLocations')
    .where('coordinates.latitude', '>=', region.latitude - region.latitudeDelta)
    .where('coordinates.latitude', '<=', region.latitude + region.latitudeDelta)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MusollahLocation[];
}

async function updateLocationStatus(
  type: 'bidet' | 'musollah',
  id: string,
  status: 'Available' | 'Unavailable' | 'Unknown'
): Promise<void> {
  const collection = type === 'bidet' ? 'bidetLocations' : 'musollahLocations';
  await db.collection(collection).doc(id).update({
    status,
    lastUpdated: Date.now(),
  });
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const MUSOLLAH_QUERY_KEYS = {
  all: ['musollah'] as const,
  bidet: (region: Region) => ['musollah', 'bidet', region] as const,
  mosque: (region: Region) => ['musollah', 'mosque', region] as const,
  musollah: (region: Region) => ['musollah', 'musollah', region] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

export function useMusollahData(userLocation: LocationObject | null) {
  const region = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return useQuery({
    queryKey: ['musollah', 'all', region],
    queryFn: async () => {
      if (!region) throw new Error('No location');

      console.log('🌐 Fetching musollah data');
      
      const [bidetData, mosqueData, musollahData] = await Promise.all([
        getBidetLocations(region),
        getMosqueLocations(region),
        getMusollahsLocations(region),
      ]);

      return {
        bidetLocations: bidetData,
        mosqueLocations: mosqueData,
        musollahLocations: musollahData,
      };
    },
    staleTime: TTL.FIFTEEN_MINUTES,
    gcTime: TTL.ONE_HOUR,
    enabled: !!region,
  });
}

export function useBidetLocations(userLocation: LocationObject | null) {
  const region = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.bidet(region!),
    queryFn: () => getBidetLocations(region!),
    staleTime: TTL.FIFTEEN_MINUTES,
    enabled: !!region,
  });
}

export function useMosqueLocations(userLocation: LocationObject | null) {
  const region = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.mosque(region!),
    queryFn: () => getMosqueLocations(region!),
    staleTime: TTL.FIFTEEN_MINUTES,
    enabled: !!region,
  });
}

export function useMusollahLocations(userLocation: LocationObject | null) {
  const region = userLocation ? {
    latitude: userLocation.coords.latitude,
    longitude: userLocation.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : null;

  return useQuery({
    queryKey: MUSOLLAH_QUERY_KEYS.musollah(region!),
    queryFn: () => getMusollahsLocations(region!),
    staleTime: TTL.FIFTEEN_MINUTES,
    enabled: !!region,
  });
}

export function useUpdateLocationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      type, 
      id, 
      status 
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