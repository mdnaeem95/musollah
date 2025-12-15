/**
 * Restaurant Service
 *
 * API functions and TanStack Query hooks for restaurant data.
 * Handles Firebase GeoPoint normalization and caching.
 *
 * @version 2.1 - Modular Firestore migration (no namespaced APIs)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, storageService, arrayUnion, arrayRemove } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

interface FirebaseGeoPoint {
  latitude: number;
  longitude: number;
}

interface FirebaseRestaurant {
  id?: string;
  name: string;
  categories?: string[];
  location?: FirebaseGeoPoint;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  image?: string;
  hours?: string;
  website?: string;
  menuUrl?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    number?: string;
  };
  status?: string;
  averageRating?: number;
  totalReviews?: number;
  rating?: number;
  priceRange?: string;
  description?: string;
  halal?: boolean;
  tags?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  image: string;
  hours: string;
  website: string;
  menuUrl: string;
  socials: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    number?: string;
  };
  status: string;
  averageRating: number;
  totalReviews: number;
  rating?: number;
  priceRange?: string;
  description?: string;
  halal?: boolean;
  tags?: string[];
}

export interface RestaurantReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: number;
  images?: string[];
}

type SubmitReviewParams = {
  restaurantId: string;
  userId: string;
  userName: string;
  rating: number;
  reviewText: string;
  imageUris: string[];
};

// ============================================================================
// HELPERS
// ============================================================================

function isValidCoordinates(coords: unknown): coords is { latitude: number; longitude: number } {
  if (!coords || typeof coords !== 'object') return false;
  const { latitude, longitude } = coords as { latitude: number; longitude: number };
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

function extractCoordinates(doc: FirebaseRestaurant): { latitude: number; longitude: number } | null {
  if (doc.location && isValidCoordinates(doc.location)) {
    return { latitude: doc.location.latitude, longitude: doc.location.longitude };
  }

  if (doc.coordinates && isValidCoordinates(doc.coordinates)) {
    return { latitude: doc.coordinates.latitude, longitude: doc.coordinates.longitude };
  }

  return null;
}

function normalizeRestaurant(id: string, docData: FirebaseRestaurant): Restaurant | null {
  const coordinates = extractCoordinates(docData);

  if (!coordinates) {
    if (__DEV__) console.warn(`⚠️ Restaurant "${docData.name}" (${id}) has no valid coordinates, skipping`);
    return null;
  }

  return {
    id,
    name: docData.name || 'Unknown Restaurant',
    categories: docData.categories ?? [],
    coordinates,
    address: docData.address ?? '',
    image: docData.image ?? '',
    hours: docData.hours ?? '',
    website: docData.website ?? docData.menuUrl ?? '',
    menuUrl: docData.menuUrl ?? docData.website ?? '',
    socials: docData.socials ?? {},
    status: docData.status ?? 'Unknown',
    averageRating: docData.averageRating ?? docData.rating ?? 0,
    totalReviews: docData.totalReviews ?? 0,
    rating: docData.rating,
    priceRange: docData.priceRange,
    description: docData.description,
    halal: docData.halal,
    tags: docData.tags,
  };
}

// ============================================================================
// API FUNCTIONS (MODULAR FIRESTORE)
// ============================================================================

async function fetchRestaurantsFromFirebase(): Promise<Restaurant[]> {
  try {
    console.log('🌐 Fetching restaurants from Firebase');

    const colRef = collection(db, 'restaurants');
    const snapshot = await getDocs(colRef);

    const restaurants: Restaurant[] = [];
    let skippedCount = 0;

    snapshot.docs.forEach((d: any) => {
      const normalized = normalizeRestaurant(d.id, d.data() as FirebaseRestaurant);
      if (normalized) restaurants.push(normalized);
      else skippedCount++;
    });

    console.log(`✅ Fetched ${restaurants.length} restaurants (${skippedCount} skipped - no coordinates)`);
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    throw error;
  }
}

async function fetchRestaurantByIdFromFirebase(id: string): Promise<Restaurant> {
  try {
    console.log(`🌐 Fetching restaurant: ${id}`);

    const ref = doc(db, 'restaurants', id);
    const snap = await getDoc(ref);

    if (!snap.exists) throw new Error('Restaurant not found');

    const normalized = normalizeRestaurant(snap.id, snap.data() as FirebaseRestaurant);
    if (!normalized) throw new Error('Restaurant has invalid location data');

    return normalized;
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
    throw error;
  }
}

async function fetchReviewsFromFirebase(restaurantId: string): Promise<RestaurantReview[]> {
  try {
    console.log(`🌐 Fetching reviews for: ${restaurantId}`);

    const colRef = collection(db, 'restaurants', restaurantId, 'reviews');
    const q = query(colRef, orderBy('timestamp', 'desc'));

    const snapshot = await getDocs(q);

    const reviews = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...(d.data() as Omit<RestaurantReview, 'id'>),
    }));

    console.log(`✅ Fetched ${reviews.length} reviews`);
    return reviews;
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    throw error;
  }
}

async function fetchUserFavoritesFromFirebase(userId: string): Promise<string[]> {
  try {
    console.log(`🌐 Fetching favorites for user: ${userId}`);

    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);

    if (!snap.exists) return [];

    const data = snap.data() as any;
    return data?.favouriteRestaurants || [];
  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    return [];
  }
}

async function addToFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  try {
    console.log(`➕ Adding restaurant ${restaurantId} to favorites`);

    await updateDoc(doc(db, 'users', userId), {
      favouriteRestaurants: arrayUnion(restaurantId),
    });

    console.log('✅ Added to favorites');
  } catch (error) {
    console.error('❌ Error adding to favorites:', error);
    throw error;
  }
}

async function removeFromFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  try {
    console.log(`➖ Removing restaurant ${restaurantId} from favorites`);

    await updateDoc(doc(db, 'users', userId), {
      favouriteRestaurants: arrayRemove(restaurantId),
    });

    console.log('✅ Removed from favorites');
  } catch (error) {
    console.error('❌ Error removing from favorites:', error);
    throw error;
  }
}

async function submitReviewToFirebase({
  restaurantId,
  userId,
  userName,
  rating,
  reviewText,
  imageUris,
}: SubmitReviewParams): Promise<void> {
  // Create review doc ref with auto ID
  const reviewsCol = collection(db, 'restaurants', restaurantId, 'reviews');
  const reviewRef = doc(reviewsCol);
  const reviewId = reviewRef.id;

  // Upload images (Storage kept as-is)
  const imageUrls: string[] = [];
  for (let i = 0; i < (imageUris?.length ?? 0); i++) {
    const localUri = imageUris[i];
    const ext = localUri.split('.').pop() || 'jpg';
    const objectPath = `restaurants/${restaurantId}/reviews/${reviewId}/${i}.${ext}`;

    const ref = storageService.ref(objectPath);
    await ref.putFile(localUri);
    const url = await ref.getDownloadURL();
    imageUrls.push(url);
  }

  // Write the review document
  await setDoc(reviewRef, {
    userId,
    userName,
    rating,
    comment: reviewText,
    timestamp: Date.now(),
    images: imageUrls,
  });

  // Update restaurant stats (transaction)
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);

    await runTransaction(db, async (tx) => {
      const restaurantSnap = await tx.get(restaurantRef);
      if (!restaurantSnap.exists) return;

      const data = restaurantSnap.data() as any;
      const currentTotal = data?.totalReviews ?? 0;
      const currentAvg = data?.averageRating ?? 0;

      const newTotal = currentTotal + 1;
      const newAvg = (currentAvg * currentTotal + rating) / newTotal;

      tx.update(restaurantRef, {
        totalReviews: newTotal,
        averageRating: Number(newAvg.toFixed(1)),
      });
    });
  } catch (err) {
    console.warn('Failed to update restaurant stats:', err);
  }
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const RESTAURANT_QUERY_KEYS = {
  all: ['restaurants'] as const,
  list: ['restaurants', 'list'] as const,
  detail: (id: string) => ['restaurants', 'detail', id] as const,
  reviews: (id: string) => ['restaurants', 'reviews', id] as const,
  favorites: (userId: string) => ['restaurants', 'favorites', userId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

export function useRestaurants() {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.list,
    queryFn: async () => {
      const cacheKey = 'restaurants-all';
      const cached = cache.get<Restaurant[]>(cacheKey);

      if (cached) {
        console.log('⚡ Using cached restaurants');
        return cached;
      }

      const restaurants = await fetchRestaurantsFromFirebase();
      cache.set(cacheKey, restaurants, TTL.ONE_DAY);
      return restaurants;
    },
    staleTime: TTL.ONE_HOUR,
    gcTime: TTL.ONE_DAY,
    retry: 2,
  });
}

export function useRestaurantDetail(id: string | null) {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.detail(id!),
    queryFn: async () => {
      const cacheKey = `restaurant-${id}`;
      const cached = cache.get<Restaurant>(cacheKey);

      if (cached) {
        console.log('⚡ Using cached restaurant detail');
        return cached;
      }

      const restaurant = await fetchRestaurantByIdFromFirebase(id!);
      cache.set(cacheKey, restaurant, TTL.ONE_HOUR);
      return restaurant;
    },
    staleTime: TTL.FIFTEEN_MINUTES,
    gcTime: TTL.ONE_HOUR,
    retry: 2,
    enabled: !!id,
  });
}

export function useRestaurantReviews(restaurantId: string | null) {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.reviews(restaurantId!),
    queryFn: async () => {
      const cacheKey = `restaurant-reviews-${restaurantId}`;
      const cached = cache.get<RestaurantReview[]>(cacheKey);

      if (cached) {
        console.log('⚡ Using cached reviews');
        return cached;
      }

      const reviews = await fetchReviewsFromFirebase(restaurantId!);
      cache.set(cacheKey, reviews, TTL.FIVE_MINUTES);
      return reviews;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.FIFTEEN_MINUTES,
    retry: 2,
    enabled: !!restaurantId,
  });
}

export function useUserFavorites(userId: string | null) {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.favorites(userId!),
    queryFn: async () => fetchUserFavoritesFromFirebase(userId!),
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.FIFTEEN_MINUTES,
    retry: 2,
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      restaurantId,
      isFavorited,
    }: {
      userId: string;
      restaurantId: string;
      isFavorited: boolean;
    }) => {
      if (isFavorited) await removeFromFavoritesInFirebase(userId, restaurantId);
      else await addToFavoritesInFirebase(userId, restaurantId);
    },

    onMutate: async ({ userId, restaurantId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: RESTAURANT_QUERY_KEYS.favorites(userId) });

      const previousFavorites = queryClient.getQueryData<string[]>(
        RESTAURANT_QUERY_KEYS.favorites(userId)
      );

      queryClient.setQueryData<string[]>(RESTAURANT_QUERY_KEYS.favorites(userId), (old = []) => {
        return isFavorited ? old.filter((id) => id !== restaurantId) : [...old, restaurantId];
      });

      return { previousFavorites };
    },

    onError: (_err, { userId }, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(RESTAURANT_QUERY_KEYS.favorites(userId), context.previousFavorites);
      }
    },

    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.favorites(userId) });
    },
  });
}

export function useRestaurantCategories() {
  const { data: restaurants } = useRestaurants();

  return {
    categories: restaurants
      ? Array.from(new Set(restaurants.flatMap((r) => r.categories).filter(Boolean))).sort()
      : [],
  };
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: SubmitReviewParams) => submitReviewToFirebase(vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.reviews(vars.restaurantId) });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.detail(vars.restaurantId) });
    },
  });
}

export function calculateAverageRating(reviews: RestaurantReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Number((total / reviews.length).toFixed(1));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateDistance(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  if (!from || !to) return Infinity;
  if (typeof from.latitude !== 'number' || typeof from.longitude !== 'number') return Infinity;
  if (typeof to.latitude !== 'number' || typeof to.longitude !== 'number') return Infinity;

  const R = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function sortByDistance(
  restaurants: Restaurant[],
  userLocation: { latitude: number; longitude: number }
): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    const distA = calculateDistance(userLocation, a.coordinates);
    const distB = calculateDistance(userLocation, b.coordinates);
    return distA - distB;
  });
}

export function getRecommendedRestaurants(
  restaurants: Restaurant[],
  userLocation: { latitude: number; longitude: number },
  limit: number = 5
): Restaurant[] {
  return sortByDistance(restaurants, userLocation).slice(0, limit);
}

export function searchRestaurants(restaurants: Restaurant[], queryText: string): Restaurant[] {
  const lowerQuery = queryText.toLowerCase().trim();
  if (!lowerQuery) return restaurants;

  return restaurants.filter((restaurant) => {
    const name = restaurant.name?.toLowerCase() || '';
    const address = restaurant.address?.toLowerCase() || '';
    const categories = restaurant.categories || [];

    return (
      name.includes(lowerQuery) ||
      address.includes(lowerQuery) ||
      categories.some((cat) => cat?.toLowerCase().includes(lowerQuery))
    );
  });
}

export function formatDistance(distanceKm: number): string {
  if (!isFinite(distanceKm) || distanceKm < 0) return 'N/A';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
}

export function useInvalidateRestaurants() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      cache.clear('restaurants-all');
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.all });
    },
    invalidateDetail: (id: string) => {
      cache.clear(`restaurant-${id}`);
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.detail(id) });
    },
    invalidateReviews: (id: string) => {
      cache.clear(`restaurant-reviews-${id}`);
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.reviews(id) });
    },
  };
}
