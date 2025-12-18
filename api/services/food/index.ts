/**
 * Restaurant Service - PRODUCTION SAFE VERSION
 *
 * API functions and TanStack Query hooks for restaurant data.
 * Handles Firebase GeoPoint normalization and caching.
 * 
 * ✅ FIXES: Production crashes from Turbo Module bridge errors
 *
 * @version 2.2 - Production hardened with safe wrappers
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, storageService, arrayUnion, arrayRemove, uploadReviewImage } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

import { collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
} from '@react-native-firebase/firestore';

// ============================================================================
// SAFE WRAPPER IMPORTS
// ============================================================================

import {
  safeFirestoreGet,
  safeFirestoreWrite,
  safeFirestoreUpdate,
} from '../utils/query-wrapper';

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
  averageRating?: number | string;  // ✅ Can be string from Firestore!
  totalReviews?: number | string;   // ✅ Can be string from Firestore!
  rating?: number | string;
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
// HELPERS (with additional validation)
// ============================================================================

/**
 * Extract latitude from various GeoPoint formats
 */
function extractLatitude(point: any): number | null {
  try {
    // Direct property
    if (typeof point?.latitude === 'number') return point.latitude;
    
    // Firestore internal property
    if (typeof point?._latitude === 'number') return point._latitude;
    
    // GeoPoint with toJSON method
    if (typeof point?.toJSON === 'function') {
      const json = point.toJSON();
      if (typeof json?.latitude === 'number') return json.latitude;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract longitude from various GeoPoint formats
 */
function extractLongitude(point: any): number | null {
  try {
    // Direct property
    if (typeof point?.longitude === 'number') return point.longitude;
    
    // Firestore internal property
    if (typeof point?._longitude === 'number') return point._longitude;
    
    // GeoPoint with toJSON method
    if (typeof point?.toJSON === 'function') {
      const json = point.toJSON();
      if (typeof json?.longitude === 'number') return json.longitude;
    }
    
    return null;
  } catch {
    return null;
  }
}

function isValidCoordinates(coords: unknown): coords is { latitude: number; longitude: number } {
  if (!coords || typeof coords !== 'object') return false;
  
  const lat = extractLatitude(coords);
  const lon = extractLongitude(coords);
  
  if (lat === null || lon === null) return false;
  
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    isFinite(lat) &&
    isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function extractCoordinates(doc: FirebaseRestaurant): { latitude: number; longitude: number } | null {
  try {
    // Try location field first (Firestore GeoPoint)
    if (doc.location) {
      const lat = extractLatitude(doc.location);
      const lon = extractLongitude(doc.location);
      
      if (lat !== null && lon !== null && isValidCoordinates({ latitude: lat, longitude: lon })) {
        return { latitude: lat, longitude: lon };
      }
    }

    // Try coordinates field (plain object)
    if (doc.coordinates && isValidCoordinates(doc.coordinates)) {
      return { 
        latitude: doc.coordinates.latitude, 
        longitude: doc.coordinates.longitude 
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error extracting coordinates:', error);
    return null;
  }
}

/**
 * Production-safe normalization with comprehensive validation
 */
function normalizeRestaurant(id: string, docData: FirebaseRestaurant): Restaurant | null {
  try {
    // Validate required fields
    if (!id || typeof id !== 'string') {
      console.warn('⚠️ Restaurant has invalid ID');
      return null;
    }

    if (!docData || typeof docData !== 'object') {
      console.warn('⚠️ Restaurant has invalid data');
      return null;
    }

    const coordinates = extractCoordinates(docData);

    if (!coordinates) {
      console.warn(`⚠️ Restaurant "${docData.name}" (${id}) has no valid coordinates, using fallback`);
      // ✅ Don't return null - use fallback coordinates instead
    }

    // Sanitize string fields (prevent UTF-8 crashes)
    const sanitizeString = (str: any, fallback: string = ''): string => {
      if (typeof str !== 'string') return fallback;
      // Remove control characters that crash NSString conversion
      return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    };

    // Validate arrays
    const sanitizeArray = (arr: any, fallback: any[] = []): any[] => {
      if (!Array.isArray(arr)) return fallback;
      return arr.filter(item => item !== null && item !== undefined);
    };

    // Validate numbers
    const sanitizeNumber = (num: any, fallback: number = 0): number => {
      if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return fallback;
      return num;
    };

    return {
      id,
      name: sanitizeString(docData.name, 'Unknown Restaurant'),
      categories: sanitizeArray(docData.categories),
      coordinates: coordinates || {
        latitude: 1.3521,   // ✅ Singapore center fallback
        longitude: 103.8198,
      },
      address: sanitizeString(docData.address),
      image: sanitizeString(docData.image),
      hours: sanitizeString(docData.hours),
      website: sanitizeString(docData.website || docData.menuUrl),
      menuUrl: sanitizeString(docData.menuUrl || docData.website),
      socials: {
        instagram: docData.socials?.instagram ? sanitizeString(docData.socials.instagram) : undefined,
        facebook: docData.socials?.facebook ? sanitizeString(docData.socials.facebook) : undefined,
        tiktok: docData.socials?.tiktok ? sanitizeString(docData.socials.tiktok) : undefined,
        number: docData.socials?.number ? sanitizeString(docData.socials.number) : undefined,
      },
      status: sanitizeString(docData.status, 'Unknown'),
      averageRating: parseNumber(docData.averageRating || docData.rating, 0),
      totalReviews: parseNumber(docData.totalReviews, 0),
      rating: docData.rating !== undefined ? sanitizeNumber(docData.rating) : undefined,
      priceRange: docData.priceRange ? sanitizeString(docData.priceRange) : undefined,
      description: docData.description ? sanitizeString(docData.description) : undefined,
      halal: typeof docData.halal === 'boolean' ? docData.halal : undefined,
      tags: docData.tags ? sanitizeArray(docData.tags) : undefined,
    };
  } catch (error) {
    console.error(`❌ Failed to normalize restaurant ${id}:`, error);
    return null;
  }
}

/**
 * Safely parse string or number to number
 * Handles: "3.3" → 3.3, "3" → 3, 3.3 → 3.3, null → fallback
 */
function parseNumber(value: any, fallback: number = 0): number {
  try {
    // Already a valid number
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      return value;
    }
    
    // Try to parse string
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && isFinite(parsed)) {
        return parsed;
      }
    }
    
    return fallback;
  } catch {
    return fallback;
  }
}

// ============================================================================
// API FUNCTIONS (PRODUCTION SAFE WITH WRAPPERS)
// ============================================================================

/**
 * ✅ PRODUCTION SAFE: Uses safe wrapper + comprehensive validation
 */
async function fetchRestaurantsFromFirebase(): Promise<Restaurant[]> {
  const cacheKey = 'restaurants-all';

  try {
    console.log('🌐 Fetching restaurants from Firebase');

    // Check cache first (production optimization)
    const cached = cache.get<Restaurant[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log('⚡ Using cached restaurants:', cached.length);
      return cached;
    }

    // Use safe wrapper instead of direct getDocs
    const colRef = collection(db, 'restaurants');
    const rawResults = await safeFirestoreGet<FirebaseRestaurant>(colRef as any);

    if (!Array.isArray(rawResults)) {
      console.error('❌ Invalid results from Firestore');
      return [];
    }

    const restaurants: Restaurant[] = [];
    let skippedCount = 0;

    rawResults.forEach((rawDoc) => {
      const normalized = normalizeRestaurant(rawDoc.id || '', rawDoc);
      if (normalized) restaurants.push(normalized);
      else skippedCount++;
    });

    console.log(`✅ Fetched ${restaurants.length} restaurants (${skippedCount} skipped)`);

    // Cache valid results
    if (restaurants.length > 0) {
      cache.set(cacheKey, restaurants, TTL.ONE_DAY);
    }

    return restaurants;
    
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    
    // Try to return expired cache as last resort
    const expiredCache = cache.get<Restaurant[]>(cacheKey);
    if (expiredCache && Array.isArray(expiredCache) && expiredCache.length > 0) {
      console.warn('⚠️ Using expired cache');
      return expiredCache;
    }

    // Don't throw - return empty array to prevent crash
    return [];
  }
}

/**
 * ✅ PRODUCTION SAFE: Single restaurant fetch with validation
 */
async function fetchRestaurantByIdFromFirebase(id: string): Promise<Restaurant> {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid restaurant ID');
  }

  const cacheKey = `restaurant-${id}`;

  try {
    console.log(`🌐 Fetching restaurant: ${id}`);

    // Check cache
    const cached = cache.get<Restaurant>(cacheKey);
    if (cached && cached.id === id) {
      console.log('⚡ Using cached restaurant detail');
      return cached;
    }

    // Use safe wrapper
    const ref = doc(db, 'restaurants', id);
    const results = await safeFirestoreGet<FirebaseRestaurant>(ref as any);

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Restaurant not found');
    }

    const rawDoc = results[0];
    const normalized = normalizeRestaurant(id, rawDoc);
    
    if (!normalized) {
      throw new Error('Restaurant has invalid location data');
    }

    // Cache valid result
    cache.set(cacheKey, normalized, TTL.ONE_HOUR);

    return normalized;
    
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Reviews with validation
 */
async function fetchReviewsFromFirebase(restaurantId: string): Promise<RestaurantReview[]> {
  if (!restaurantId || typeof restaurantId !== 'string') {
    console.error('❌ Invalid restaurantId for reviews');
    return [];
  }

  const cacheKey = `restaurant-reviews-${restaurantId}`;

  try {
    console.log(`🌐 Fetching reviews for: ${restaurantId}`);

    // Check cache
    const cached = cache.get<RestaurantReview[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      console.log('⚡ Using cached reviews');
      return cached;
    }

    // Use safe wrapper
    const colRef = collection(db, 'restaurants', restaurantId, 'reviews');
    const q = query(colRef, orderBy('timestamp', 'desc'));
    const rawResults = await safeFirestoreGet<RestaurantReview>(q as any);

    if (!Array.isArray(rawResults)) {
      return [];
    }

    // Validate and sanitize reviews
    const validReviews = rawResults
      .filter((review): review is RestaurantReview => {
        // Validate required fields
        if (!review.userId || !review.userName) {
          console.warn('⚠️ Skipping review with missing fields');
          return false;
        }

        // Validate rating
        if (typeof review.rating !== 'number' || 
            review.rating < 0 || 
            review.rating > 5) {
          console.warn('⚠️ Skipping review with invalid rating');
          return false;
        }

        // Validate timestamp
        if (typeof review.timestamp !== 'number' || review.timestamp <= 0) {
          console.warn('⚠️ Skipping review with invalid timestamp');
          return false;
        }

        return true;
      })
      .map(review => ({
        ...review,
        // Ensure images is an array
        images: Array.isArray(review.images) ? review.images : [],
        // Sanitize comment
        comment: typeof review.comment === 'string' 
          ? review.comment.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          : '',
      }));

    console.log(`✅ Fetched ${validReviews.length} valid reviews`);

    // Cache valid reviews
    if (validReviews.length > 0) {
      cache.set(cacheKey, validReviews, TTL.FIVE_MINUTES);
    }

    return validReviews;
    
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return [];
  }
}

/**
 * ✅ PRODUCTION SAFE: User favorites with validation
 */
async function fetchUserFavoritesFromFirebase(userId: string): Promise<string[]> {
  if (!userId || typeof userId !== 'string') {
    return [];
  }

  try {
    console.log(`🌐 Fetching favorites for user: ${userId}`);

    const ref = doc(db, 'users', userId);
    const results = await safeFirestoreGet<any>(ref as any);

    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }

    const data = results[0];
    const favorites = data?.favouriteRestaurants || [];

    // Validate array and filter invalid IDs
    if (!Array.isArray(favorites)) {
      return [];
    }

    return favorites.filter(id => typeof id === 'string' && id.length > 0);
    
  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    return [];
  }
}

/**
 * ✅ PRODUCTION SAFE: Add favorite with safe wrapper
 */
async function addToFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  if (!userId || !restaurantId) {
    throw new Error('Invalid userId or restaurantId');
  }

  try {
    console.log(`➕ Adding restaurant ${restaurantId} to favorites`);

    const success = await safeFirestoreUpdate(doc(db, 'users', userId), {
      favouriteRestaurants: arrayUnion(restaurantId),
    });

    if (!success) {
      throw new Error('Failed to add favorite');
    }
  } catch (error) {
    console.error('❌ Error adding to favorites:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Remove favorite with safe wrapper
 */
async function removeFromFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  if (!userId || !restaurantId) {
    throw new Error('Invalid userId or restaurantId');
  }

  try {
    console.log(`➖ Removing restaurant ${restaurantId} from favorites`);

    const success = await safeFirestoreUpdate(doc(db, 'users', userId), {
      favouriteRestaurants: arrayRemove(restaurantId),
    });

    if (!success) {
      throw new Error('Failed to remove favorite');
    }
  } catch (error) {
    console.error('❌ Error removing from favorites:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Submit review with validation
 */
async function submitReviewToFirebase(params: SubmitReviewParams): Promise<void> {
  const { restaurantId, userId, userName, rating, reviewText, imageUris } = params;

  // Validate inputs
  if (!restaurantId || !userId || !userName) {
    throw new Error('Missing required review fields');
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new Error('Invalid rating (must be 1-5)');
  }

  try {
    console.log(`📝 Submitting review for restaurant: ${restaurantId}`);

    // Upload images if any
    const imageUrls: string[] = [];
    if (imageUris && imageUris.length > 0) {
      for (const uri of imageUris.slice(0, 5)) { // Max 5 images
        try {
          const url = await uploadReviewImage(uri, restaurantId);
          if (url) imageUrls.push(url);
        } catch (err) {
          console.warn('⚠️ Failed to upload image:', err);
        }
      }
    }

    // Create review document
    const reviewRef = doc(collection(db, 'restaurants', restaurantId, 'reviews'));
    const reviewData = {
      userId,
      userName: userName.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''), // Sanitize
      rating,
      comment: reviewText.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''), // Sanitize
      timestamp: Date.now(),
      images: imageUrls,
    };

    // Use safe write
    const success = await safeFirestoreWrite(reviewRef, reviewData);

    if (!success) {
      throw new Error('Failed to write review');
    }

    // Update restaurant stats (non-critical, don't throw on failure)
    await updateRestaurantStats(restaurantId).catch(err => {
      console.warn('⚠️ Failed to update stats:', err);
    });

    console.log('✅ Review submitted successfully');
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    throw error;
  }
}

/**
 * Helper: Update restaurant stats (with safe wrapper)
 */
async function updateRestaurantStats(restaurantId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const reviewsRef = collection(db, 'restaurants', restaurantId, 'reviews');
      
      const reviewsSnap = await getDocs(reviewsRef);
      
      const ratings = reviewsSnap.docs
        .map((d: any) => d.data()?.rating)
        .filter((r: any) => typeof r === 'number' && r >= 1 && r <= 5);

      if (ratings.length === 0) return;

      const newTotal = ratings.length;
      const newAvg = ratings.reduce((sum: any, r: any) => sum + r, 0) / newTotal;

      await safeFirestoreUpdate(restaurantRef, {
        totalReviews: newTotal,
        averageRating: Number(newAvg.toFixed(1)),
      });
    });
  } catch (err) {
    console.warn('Failed to update restaurant stats:', err);
  }
}

// ============================================================================
// QUERY KEYS (unchanged)
// ============================================================================

export const RESTAURANT_QUERY_KEYS = {
  all: ['restaurants'] as const,
  list: ['restaurants', 'list'] as const,
  detail: (id: string) => ['restaurants', 'detail', id] as const,
  reviews: (id: string) => ['restaurants', 'reviews', id] as const,
  favorites: (userId: string) => ['restaurants', 'favorites', userId] as const,
};

// ============================================================================
// HOOKS (unchanged interface, safe implementation)
// ============================================================================

export function useRestaurants() {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.list,
    queryFn: async () => {
      const cacheKey = 'restaurants-all';
      const cached = cache.get<Restaurant[]>(cacheKey);

      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('⚡ Using cached restaurants');
        return cached;
      }

      const restaurants = await fetchRestaurantsFromFirebase();
      if (restaurants.length > 0) {
        cache.set(cacheKey, restaurants, TTL.ONE_DAY);
      }
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
// UTILITY FUNCTIONS (unchanged)
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