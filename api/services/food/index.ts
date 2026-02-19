/**
 * Restaurant Service - PRODUCTION SAFE VERSION with Structured Logging
 *
 * API functions and TanStack Query hooks for restaurant data.
 * Handles Firebase GeoPoint normalization and caching.
 * 
 * ✅ FIXES: Production crashes from Turbo Module bridge errors
 * ✅ NEW: Structured logging with performance tracking
 *
 * @version 3.0 - Production hardened with structured logging
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, arrayUnion, arrayRemove, uploadReviewImage } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';
import { logger } from '../../../services/logging/logger';

import { collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
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
 * ✅ ENHANCED: Prioritizes _latitude (React Native Firebase format)
 * 
 * @param {any} point - Firebase GeoPoint or coordinate object
 * @returns {number | null} Latitude value or null if invalid
 */
function extractLatitude(point: any): number | null {
  try {
    // ✅ PRIORITY 1: Firestore internal property (React Native Firebase)
    // This is how Firebase GeoPoint appears in RN: { _latitude: 1.234, _longitude: 103.456 }
    if (typeof point?._latitude === 'number') {
      return point._latitude;
    }
    
    // PRIORITY 2: Direct property
    if (typeof point?.latitude === 'number') {
      return point.latitude;
    }
    
    // PRIORITY 3: GeoPoint with toJSON method
    if (typeof point?.toJSON === 'function') {
      const json = point.toJSON();
      if (typeof json?.latitude === 'number') {
        return json.latitude;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract longitude from various GeoPoint formats
 * ✅ ENHANCED: Prioritizes _longitude (React Native Firebase format)
 * 
 * @param {any} point - Firebase GeoPoint or coordinate object
 * @returns {number | null} Longitude value or null if invalid
 */
function extractLongitude(point: any): number | null {
  try {
    // ✅ PRIORITY 1: Firestore internal property (React Native Firebase)
    if (typeof point?._longitude === 'number') {
      return point._longitude;
    }
    
    // PRIORITY 2: Direct property
    if (typeof point?.longitude === 'number') {
      return point.longitude;
    }
    
    // PRIORITY 3: GeoPoint with toJSON method
    if (typeof point?.toJSON === 'function') {
      const json = point.toJSON();
      if (typeof json?.longitude === 'number') {
        return json.longitude;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates coordinate object
 * ✅ ENHANCED: Rejects {0, 0} as invalid
 * 
 * @param {unknown} coords - Coordinates to validate
 * @returns {boolean} True if valid coordinates
 */
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
    lon <= 180 &&
    lat !== 0 &&  // ✅ REJECT {0, 0} as invalid
    lon !== 0
  );
}

/**
 * Extract coordinates from Firebase restaurant document
 * ✅ ENHANCED: Better logging and error handling
 * 
 * @param {FirebaseRestaurant} doc - Restaurant document
 * @returns {Object | null} Normalized coordinates or null
 */
function extractCoordinates(doc: FirebaseRestaurant): { latitude: number; longitude: number } | null {
  try {
    // ✅ PRIORITY 1: Try 'location' field (Firestore GeoPoint - YOUR PRIMARY FORMAT)
    if (doc.location) {
      const lat = extractLatitude(doc.location);
      const lon = extractLongitude(doc.location);
      
      if (lat !== null && lon !== null && isValidCoordinates({ latitude: lat, longitude: lon })) {
        logger.debug('✅ Extracted from location field', {
          restaurantId: doc.id,
          restaurantName: doc.name,
          coordinates: { latitude: lat, longitude: lon },
        });
        return { latitude: lat, longitude: lon };
      } else {
        logger.warn('⚠️ Location field exists but extraction failed', {
          restaurantId: doc.id,
          restaurantName: doc.name,
          location: doc.location,
          extractedLat: lat,
          extractedLon: lon,
        });
      }
    }

    // PRIORITY 2: Try 'coordinates' field (plain object)
    if (doc.coordinates && isValidCoordinates(doc.coordinates)) {
      logger.debug('✅ Extracted from coordinates field', {
        restaurantId: doc.id,
        restaurantName: doc.name,
        coordinates: doc.coordinates,
      });
      return { 
        latitude: doc.coordinates.latitude, 
        longitude: doc.coordinates.longitude 
      };
    }

    logger.error('❌ No valid coordinates found', {
      restaurantId: doc.id,
      restaurantName: doc.name,
      hasLocation: !!doc.location,
      hasCoordinates: !!doc.coordinates,
      locationValue: doc.location,
      coordinatesValue: doc.coordinates,
    });

    return null;
  } catch (error: any) {
    logger.error('Error extracting coordinates', {
      error: error.message,
      restaurantId: doc.id,
      restaurantName: doc.name,
      hasLocation: !!doc.location,
      hasCoordinates: !!doc.coordinates,
    });
    return null;
  }
}

/**
 * Production-safe normalization with comprehensive validation
 * Sanitizes data to prevent iOS bridge crashes
 * 
 * @param {string} id - Restaurant ID
 * @param {FirebaseRestaurant} docData - Raw Firestore document
 * @returns {Restaurant | null} Normalized restaurant or null if invalid
 */
function normalizeRestaurant(id: string, docData: FirebaseRestaurant): Restaurant | null {
  try {
    // Validate required fields
    if (!id || typeof id !== 'string') {
      logger.warn('Restaurant has invalid ID', { id });
      return null;
    }

    if (!docData || typeof docData !== 'object') {
      logger.warn('Restaurant has invalid data', { id });
      return null;
    }

    const coordinates = extractCoordinates(docData);

    if (!coordinates) {
      logger.warn('Restaurant has no valid coordinates - using fallback', {
        id,
        name: docData.name,
      });
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
  } catch (error: any) {
    logger.error('Failed to normalize restaurant', {
      error: error.message,
      id,
      name: docData.name,
    });
    return null;
  }
}

/**
 * Safely parse string or number to number
 * Handles: "3.3" → 3.3, "3" → 3, 3.3 → 3.3, null → fallback
 * 
 * @param {any} value - Value to parse
 * @param {number} fallback - Default value if parsing fails
 * @returns {number} Parsed number or fallback
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
// API FUNCTIONS (PRODUCTION SAFE WITH WRAPPERS + STRUCTURED LOGGING)
// ============================================================================

/**
 * Fetches all restaurants from Firebase with production-safe wrappers
 * 
 * @async
 * @function fetchRestaurantsFromFirebase
 * @returns {Promise<Restaurant[]>} Array of normalized restaurants
 * 
 * Cache Strategy:
 * - MMKV: 1 day
 * - Stale time: 1 hour
 * - Fallback to expired cache on error
 */
async function fetchRestaurantsFromFirebase(): Promise<Restaurant[]> {
  const startTime = performance.now();
  const cacheKey = 'restaurants-all';

  try {
    logger.debug('Fetching restaurants from Firebase', {
      collection: 'restaurants',
    });

    // Check cache first (production optimization)
    const cached = cache.get<Restaurant[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Using cached restaurants', {
        count: cached.length,
        cacheKey,
        source: 'MMKV',
        duration: `${duration}ms`,
      });
      return cached;
    }

    logger.debug('Cache miss - fetching from Firestore', { cacheKey });

    // Use safe wrapper instead of direct getDocs
    const colRef = collection(db, 'restaurants');
    const rawResults = await safeFirestoreGet<FirebaseRestaurant>(colRef as any);

    if (!Array.isArray(rawResults)) {
      logger.error('Invalid results from Firestore', {
        resultType: typeof rawResults,
      });
      return [];
    }

    const restaurants: Restaurant[] = [];
    let skippedCount = 0;

    rawResults.forEach((rawDoc) => {
      const normalized = normalizeRestaurant(rawDoc.id || '', rawDoc);
      if (normalized) restaurants.push(normalized);
      else skippedCount++;
    });

    const duration = Math.round(performance.now() - startTime);

    logger.success('Restaurants fetched successfully', {
      count: restaurants.length,
      skipped: skippedCount,
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    // Cache valid results
    if (restaurants.length > 0) {
      cache.set(cacheKey, restaurants, TTL.ONE_DAY);
      logger.debug('Restaurants cached', {
        count: restaurants.length,
        cacheKey,
        ttl: '1 day',
      });
    }

    return restaurants;
    
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    logger.error('Failed to fetch restaurants', {
      error: error.message,
      duration: `${duration}ms`,
      collection: 'restaurants',
    });
    
    // Try to return expired cache as last resort
    const expiredCache = cache.get<Restaurant[]>(cacheKey);
    if (expiredCache && Array.isArray(expiredCache) && expiredCache.length > 0) {
      logger.warn('Using expired cache as fallback', {
        count: expiredCache.length,
      });
      return expiredCache;
    }

    // Don't throw - return empty array to prevent crash
    return [];
  }
}

/**
 * Fetches single restaurant by ID with validation
 * 
 * @async
 * @function fetchRestaurantByIdFromFirebase
 * @param {string} id - Restaurant ID
 * @returns {Promise<Restaurant>} Normalized restaurant
 * @throws {Error} If restaurant not found or invalid
 */
async function fetchRestaurantByIdFromFirebase(id: string): Promise<Restaurant> {
  const startTime = performance.now();
  
  if (!id || typeof id !== 'string') {
    logger.error('Invalid restaurant ID', { id: typeof id });
    throw new Error('Invalid restaurant ID');
  }

  const cacheKey = `restaurant-${id}`;

  try {
    logger.debug('Fetching restaurant by ID', {
      restaurantId: id,
      cacheKey,
    });

    // Check cache
    const cached = cache.get<Restaurant>(cacheKey);
    if (cached && cached.id === id) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Using cached restaurant detail', {
        restaurantId: id,
        name: cached.name,
        cacheKey,
        source: 'MMKV',
        duration: `${duration}ms`,
      });
      return cached;
    }

    logger.debug('Cache miss - fetching from Firestore', {
      restaurantId: id,
      cacheKey,
    });

    // Use safe wrapper
    const ref = doc(db, 'restaurants', id);
    const results = await safeFirestoreGet<FirebaseRestaurant>(ref as any);

    if (!Array.isArray(results) || results.length === 0) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Restaurant not found', {
        restaurantId: id,
        duration: `${duration}ms`,
      });
      throw new Error('Restaurant not found');
    }

    const rawDoc = results[0];
    const normalized = normalizeRestaurant(id, rawDoc);
    
    if (!normalized) {
      const duration = Math.round(performance.now() - startTime);
      logger.error('Restaurant has invalid location data', {
        restaurantId: id,
        duration: `${duration}ms`,
      });
      throw new Error('Restaurant has invalid location data');
    }

    const duration = Math.round(performance.now() - startTime);
    logger.success('Restaurant fetched successfully', {
      restaurantId: id,
      name: normalized.name,
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    // Cache valid result
    cache.set(cacheKey, normalized, TTL.ONE_HOUR);
    logger.debug('Restaurant cached', {
      restaurantId: id,
      cacheKey,
      ttl: '1 hour',
    });

    return normalized;
    
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Failed to fetch restaurant', {
      error: error.message,
      restaurantId: id,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Fetches reviews for a restaurant with validation
 * 
 * @async
 * @function fetchReviewsFromFirebase
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<RestaurantReview[]>} Array of validated reviews
 */
async function fetchReviewsFromFirebase(restaurantId: string): Promise<RestaurantReview[]> {
  const startTime = performance.now();
  
  if (!restaurantId || typeof restaurantId !== 'string') {
    logger.error('Invalid restaurantId for reviews', {
      restaurantId: typeof restaurantId,
    });
    return [];
  }

  const cacheKey = `restaurant-reviews-${restaurantId}`;

  try {
    logger.debug('Fetching reviews', {
      restaurantId,
      cacheKey,
    });

    // Check cache
    const cached = cache.get<RestaurantReview[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('Using cached reviews', {
        restaurantId,
        count: cached.length,
        cacheKey,
        source: 'MMKV',
        duration: `${duration}ms`,
      });
      return cached;
    }

    logger.debug('Cache miss - querying restaurantReviews collection', {
      restaurantId,
      cacheKey,
    });

    // ✅ FIXED: Query top-level collection with restaurantId filter
    const colRef = collection(db, 'restaurantReviews');
    const q = query(
      colRef, 
      where('restaurantId', '==', restaurantId),
      orderBy('timestamp', 'desc')
    );
    
    const rawResults = await safeFirestoreGet<any>(q as any);

    if (!Array.isArray(rawResults) || rawResults.length === 0) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('No reviews found', {
        restaurantId,
        duration: `${duration}ms`,
      });
      return [];
    }

    // Validate and normalize reviews
    let invalidCount = 0;
    const validReviews = rawResults
      .filter((review): review is RestaurantReview => {
        // Validate required fields
        if (!review.userId) {
          invalidCount++;
          return false;
        }

        // Validate rating
        if (typeof review.rating !== 'number' || review.rating < 0 || review.rating > 5) {
          invalidCount++;
          return false;
        }

        // Timestamp can be string or number
        if (!review.timestamp) {
          invalidCount++;
          return false;
        }

        return true;
      })
      .map(review => ({
        id: review.id,
        userId: review.userId,
        userName: review.userName || 'Anonymous', // ✅ Fallback if userName missing
        rating: review.rating,
        // ✅ Support both 'review' and 'comment' fields
        comment: (review.comment || '').replace(/[\u0000-\u001F\u007F-\u009F]/g, ''),
        // ✅ Convert ISO string timestamp to number (milliseconds)
        timestamp: typeof review.timestamp === 'string' 
          ? new Date(review.timestamp).getTime() 
          : review.timestamp,
        images: Array.isArray(review.images) ? review.images : [],
      }));

    const duration = Math.round(performance.now() - startTime);
    logger.success('Reviews fetched successfully', {
      restaurantId,
      count: validReviews.length,
      invalidCount,
      duration: `${duration}ms`,
      source: 'Firestore',
    });

    // Cache valid reviews
    if (validReviews.length > 0) {
      cache.set(cacheKey, validReviews, TTL.FIVE_MINUTES);
      logger.debug('Reviews cached', {
        restaurantId,
        count: validReviews.length,
        cacheKey,
        ttl: '5 minutes',
      });
    }

    return validReviews;
    
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Failed to fetch reviews', {
      error: error.message,
      restaurantId,
      duration: `${duration}ms`,
      collection: 'restaurantReviews',
    });
    return [];
  }
}

/**
 * Fetches user's favorite restaurants
 * 
 * @async
 * @function fetchUserFavoritesFromFirebase
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of favorite restaurant IDs
 */
async function fetchUserFavoritesFromFirebase(userId: string): Promise<string[]> {
  const startTime = performance.now();
  
  if (!userId || typeof userId !== 'string') {
    logger.warn('Invalid userId for favorites', {
      userId: typeof userId,
    });
    return [];
  }

  try {
    logger.debug('Fetching user favorites', { userId });

    const ref = doc(db, 'users', userId);
    const results = await safeFirestoreGet<any>(ref as any);

    if (!Array.isArray(results) || results.length === 0) {
      const duration = Math.round(performance.now() - startTime);
      logger.debug('No user document found', {
        userId,
        duration: `${duration}ms`,
      });
      return [];
    }

    const data = results[0];
    const favorites = data?.favouriteRestaurants || [];

    // Validate array and filter invalid IDs
    if (!Array.isArray(favorites)) {
      logger.warn('Favorites is not an array', {
        userId,
        favoritesType: typeof favorites,
      });
      return [];
    }

    const validFavorites = favorites.filter(id => typeof id === 'string' && id.length > 0);
    
    const duration = Math.round(performance.now() - startTime);
    logger.success('User favorites fetched', {
      userId,
      count: validFavorites.length,
      duration: `${duration}ms`,
    });

    return validFavorites;
    
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Failed to fetch favorites', {
      error: error.message,
      userId,
      duration: `${duration}ms`,
    });
    return [];
  }
}

/**
 * Adds restaurant to user's favorites
 * 
 * @async
 * @function addToFavoritesInFirebase
 * @param {string} userId - User ID
 * @param {string} restaurantId - Restaurant ID
 * @throws {Error} If update fails
 */
async function addToFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  const startTime = performance.now();
  
  if (!userId || !restaurantId) {
    logger.error('Invalid parameters for adding favorite', {
      hasUserId: !!userId,
      hasRestaurantId: !!restaurantId,
    });
    throw new Error('Invalid userId or restaurantId');
  }

  logger.debug('Adding restaurant to favorites', {
    userId,
    restaurantId,
  });
  
  // ✅ Define userRef OUTSIDE try block for catch scope
  const userRef = doc(db, 'users', userId);

  try {
    // ✅ Direct update without wrapper
    await userRef.update({
      favouriteRestaurants: arrayUnion(restaurantId),
    });
    
    const duration = Math.round(performance.now() - startTime);
    logger.success('Restaurant added to favorites', {
      userId,
      restaurantId,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    // Create user document if it doesn't exist
    if (error.code === 'not-found') {
      logger.info('User document not found - creating', { userId });
      
      await userRef.set({
        favouriteRestaurants: [restaurantId],
      }, { merge: true });
      
      const totalDuration = Math.round(performance.now() - startTime);
      logger.success('User document created with favorite', {
        userId,
        restaurantId,
        duration: `${totalDuration}ms`,
      });
    } else {
      logger.error('Failed to add favorite', {
        error: error.message,
        errorCode: error.code,
        userId,
        restaurantId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

/**
 * Removes restaurant from user's favorites
 * 
 * @async
 * @function removeFromFavoritesInFirebase
 * @param {string} userId - User ID
 * @param {string} restaurantId - Restaurant ID
 * @throws {Error} If update fails
 */
async function removeFromFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  const startTime = performance.now();
  
  if (!userId || !restaurantId) {
    logger.error('Invalid parameters for removing favorite', {
      hasUserId: !!userId,
      hasRestaurantId: !!restaurantId,
    });
    throw new Error('Invalid userId or restaurantId');
  }

  logger.debug('Removing restaurant from favorites', {
    userId,
    restaurantId,
  });
  
  // ✅ Define userRef OUTSIDE try block
  const userRef = doc(db, 'users', userId);

  try {
    // ✅ Direct update without wrapper
    await userRef.update({
      favouriteRestaurants: arrayRemove(restaurantId),
    });
    
    const duration = Math.round(performance.now() - startTime);
    logger.success('Restaurant removed from favorites', {
      userId,
      restaurantId,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Failed to remove favorite', {
      error: error.message,
      errorCode: error.code,
      userId,
      restaurantId,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Submits a restaurant review with image uploads
 * 
 * @async
 * @function submitReviewToFirebase
 * @param {SubmitReviewParams} params - Review parameters
 * @throws {Error} If validation fails or submission error
 */
async function submitReviewToFirebase(params: SubmitReviewParams): Promise<void> {
  const startTime = performance.now();
  const { restaurantId, userId, userName, rating, reviewText, imageUris } = params;

  // Validate inputs
  if (!restaurantId || !userId || !userName) {
    logger.error('Missing required review fields', {
      hasRestaurantId: !!restaurantId,
      hasUserId: !!userId,
      hasUserName: !!userName,
    });
    throw new Error('Missing required review fields');
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    logger.error('Invalid rating', { rating, type: typeof rating });
    throw new Error('Invalid rating (must be 1-5)');
  }

  try {
    logger.info('Submitting review', {
      restaurantId,
      userId,
      rating,
      imageCount: imageUris?.length || 0,
    });

    // Upload images if any
    const imageUrls: string[] = [];
    if (imageUris && imageUris.length > 0) {
      logger.debug('Uploading review images', {
        count: imageUris.length,
        limit: Math.min(imageUris.length, 5),
      });

      for (const uri of imageUris.slice(0, 5)) { // Max 5 images
        try {
          const url = await uploadReviewImage(uri, restaurantId);
          if (url) imageUrls.push(url);
        } catch (err: any) {
          logger.warn('Failed to upload review image', {
            error: err.message,
            uri: uri.substring(0, 50), // Log truncated URI
          });
        }
      }

      logger.debug('Review images uploaded', {
        uploaded: imageUrls.length,
        failed: imageUris.length - imageUrls.length,
      });
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
      logger.warn('Failed to update restaurant stats', {
        error: err.message,
        restaurantId,
      });
    });

    const duration = Math.round(performance.now() - startTime);
    logger.success('Review submitted successfully', {
      restaurantId,
      userId,
      rating,
      imagesUploaded: imageUrls.length,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('Failed to submit review', {
      error: error.message,
      restaurantId,
      userId,
      rating,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Helper: Update restaurant stats after review submission
 * 
 * @async
 * @function updateRestaurantStats
 * @param {string} restaurantId - Restaurant ID
 */
async function updateRestaurantStats(restaurantId: string): Promise<void> {
  const startTime = performance.now();
  
  try {
    logger.debug('Updating restaurant stats', { restaurantId });

    await runTransaction(db, async (transaction) => {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const reviewsRef = collection(db, 'restaurants', restaurantId, 'reviews');
      
      const reviewsSnap = await getDocs(reviewsRef);
      
      const ratings = reviewsSnap.docs
        .map((d: any) => d.data()?.rating)
        .filter((r: any) => typeof r === 'number' && r >= 1 && r <= 5);

      if (ratings.length === 0) {
        logger.debug('No valid ratings found', { restaurantId });
        return;
      }

      const newTotal = ratings.length;
      const newAvg = ratings.reduce((sum: any, r: any) => sum + r, 0) / newTotal;

      await safeFirestoreUpdate(restaurantRef, {
        totalReviews: newTotal,
        averageRating: Number(newAvg.toFixed(1)),
      });

      const duration = Math.round(performance.now() - startTime);
      logger.success('Restaurant stats updated', {
        restaurantId,
        totalReviews: newTotal,
        averageRating: Number(newAvg.toFixed(1)),
        duration: `${duration}ms`,
      });
    });
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.warn('Failed to update restaurant stats', {
      error: err.message,
      restaurantId,
      duration: `${duration}ms`,
    });
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
// HOOKS (unchanged interface, safe implementation + logging)
// ============================================================================

/**
 * Hook to fetch all restaurants
 * 
 * @function useRestaurants
 * @returns {UseQueryResult<Restaurant[]>} Query result with restaurants
 * 
 * Cache Strategy:
 * - MMKV: 1 day
 * - Stale time: 1 hour
 * - GC time: 1 day
 * - Retry: 2 attempts
 */
export function useRestaurants() {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.list,
    queryFn: async () => {
      const cacheKey = 'restaurants-all';
      const cached = cache.get<Restaurant[]>(cacheKey);

      if (cached && Array.isArray(cached) && cached.length > 0) {
        logger.debug('Hook: Using cached restaurants', { count: cached.length });
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

/**
 * Hook to fetch single restaurant by ID
 * 
 * @function useRestaurantDetail
 * @param {string | null} id - Restaurant ID
 * @returns {UseQueryResult<Restaurant>} Query result with restaurant
 */
export function useRestaurantDetail(id: string | null) {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.detail(id!),
    queryFn: async () => {
      const cacheKey = `restaurant-${id}`;
      const cached = cache.get<Restaurant>(cacheKey);

      if (cached) {
        logger.debug('Hook: Using cached restaurant detail', {
          restaurantId: id,
          name: cached.name,
        });
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

/**
 * Hook to fetch restaurant reviews
 * 
 * @function useRestaurantReviews
 * @param {string | null} restaurantId - Restaurant ID
 * @returns {UseQueryResult<RestaurantReview[]>} Query result with reviews
 */
export function useRestaurantReviews(restaurantId: string | null) {
  return useQuery({
    queryKey: RESTAURANT_QUERY_KEYS.reviews(restaurantId!),
    queryFn: async () => {
      const cacheKey = `restaurant-reviews-${restaurantId}`;
      const cached = cache.get<RestaurantReview[]>(cacheKey);

      if (cached) {
        logger.debug('Hook: Using cached reviews', {
          restaurantId,
          count: cached.length,
        });
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

/**
 * Fixed useUserFavorites query
 * 
 * Add this to: api/services/restaurant/index.ts
 */
export function useUserFavorites(userId: string | null) {
  return useQuery({
    queryKey: ['user-favorites', userId], // ✅ Must match mutation key
    queryFn: async () => {
      if (!userId) return [];

      logger.debug('Fetching user favorites', { userId });
      const startTime = Date.now();

      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef); // ✅ Use new modular API

        if (!userSnap.exists()) {
          logger.warn('User document not found', { userId });
          return [];
        }

        const data = userSnap.data();
        const favorites = data?.favouriteRestaurants || [];

        logger.info('User favorites fetched', {
          userId,
          count: favorites.length,
          duration: `${Date.now() - startTime}ms`
        });

        return favorites as string[];
      } catch (error) {
        logger.error('Fetching favorites failed', error as Error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fixed useToggleFavorite mutation
 * 
 * Add this to: api/services/restaurant/index.ts
 */
interface ToggleFavoriteParams {
  userId: string;
  restaurantId: string;
  isFavorited: boolean;
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, restaurantId, isFavorited }: ToggleFavoriteParams) => {
      logger.debug('Toggle favorite mutation started', { userId, restaurantId, isFavorited });

      const userRef = doc(db, 'users', userId);

      if (isFavorited) {
        // Adding to favorites
        await updateDoc(userRef, {
          favouriteRestaurants: arrayUnion(restaurantId)
        });
        logger.info('Restaurant added to favorites', { userId, restaurantId });
      } else {
        // Removing from favorites
        await updateDoc(userRef, {
          favouriteRestaurants: arrayRemove(restaurantId)
        });
        logger.info('Restaurant removed from favorites', { userId, restaurantId });
      }

      return { userId, restaurantId, isFavorited };
    },

    onMutate: async ({ userId, restaurantId, isFavorited }) => {
      logger.debug('Optimistic update starting', { userId, restaurantId, isFavorited });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-favorites', userId] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<string[]>(['user-favorites', userId]);

      // Optimistically update cache
      queryClient.setQueryData<string[]>(['user-favorites', userId], (old = []) => {
        if (isFavorited) {
          // Adding
          return [...old, restaurantId];
        } else {
          // Removing
          return old.filter(id => id !== restaurantId);
        }
      });

      logger.debug('Optimistic update applied', {
        previousCount: previousFavorites?.length ?? 0,
        action: isFavorited ? 'added' : 'removed'
      });

      // Return context for rollback
      return { previousFavorites };
    },

    onError: (err, variables, context) => {
      logger.error('Toggle favorite failed', err as Error);
      
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          ['user-favorites', variables.userId],
          context.previousFavorites
        );
        logger.warn('Rolled back optimistic update');
      }
    },

    onSuccess: (data) => {
      logger.info('Favorite toggled successfully', {
        userId: data.userId,
        restaurantId: data.restaurantId,
        action: data.isFavorited ? 'added' : 'removed'
      });
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ 
        queryKey: ['user-favorites', variables.userId] 
      });
      logger.debug('Invalidated favorites cache', { userId: variables.userId });
    },
  });
}

/**
 * Hook to get unique restaurant categories
 * 
 * @function useRestaurantCategories
 * @returns {Object} Object with categories array
 */
export function useRestaurantCategories() {
  const { data: restaurants } = useRestaurants();

  const categories = restaurants
    ? Array.from(new Set(restaurants.flatMap((r) => r.categories).filter(Boolean))).sort()
    : [];

  logger.debug('Restaurant categories extracted', {
    totalCategories: categories.length,
    categories: categories.slice(0, 10).join(', ') + '...',
  });

  return { categories };
}

/**
 * Hook to submit a restaurant review
 * 
 * @function useSubmitReview
 * @returns {UseMutationResult} Mutation function and state
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: SubmitReviewParams) => submitReviewToFirebase(vars),
    onSuccess: (_data, vars) => {
      logger.success('Review submission successful - invalidating caches', {
        restaurantId: vars.restaurantId,
      });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.reviews(vars.restaurantId) });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.detail(vars.restaurantId) });
    },
    onError: (error: any, vars) => {
      logger.error('Review submission failed', {
        error: error.message,
        restaurantId: vars.restaurantId,
        rating: vars.rating,
      });
    },
  });
}

/**
 * Calculates average rating from reviews
 * 
 * @function calculateAverageRating
 * @param {RestaurantReview[]} reviews - Array of reviews
 * @returns {number} Average rating (0 if no reviews)
 */
export function calculateAverageRating(reviews: RestaurantReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Number((total / reviews.length).toFixed(1));
  
  logger.debug('Average rating calculated', {
    reviewCount: reviews.length,
    average,
  });
  
  return average;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates distance between two coordinates using Haversine formula
 * 
 * @function calculateDistance
 * @param {Object} from - Origin coordinates
 * @param {Object} to - Destination coordinates
 * @returns {number} Distance in kilometers
 * 
 * @example
 * const distance = calculateDistance(
 *   { latitude: 1.3521, longitude: 103.8198 },
 *   { latitude: 1.2897, longitude: 103.8501 }
 * );
 */
export function calculateDistance(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  if (!from || !to) return Infinity;
  if (typeof from.latitude !== 'number' || typeof from.longitude !== 'number') return Infinity;
  if (typeof to.latitude !== 'number' || typeof to.longitude !== 'number') return Infinity;

  const R = 6371; // Earth's radius in km
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

/**
 * Converts degrees to radians
 * 
 * @function toRad
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Sorts restaurants by distance from user location
 * 
 * @function sortByDistance
 * @param {Restaurant[]} restaurants - Array of restaurants
 * @param {Object} userLocation - User's coordinates
 * @returns {Restaurant[]} Sorted array (nearest first)
 * 
 * @example
 * const sorted = sortByDistance(restaurants, userLocation);
 */
export function sortByDistance(
  restaurants: Restaurant[],
  userLocation: { latitude: number; longitude: number }
): Restaurant[] {
  logger.debug('Sorting restaurants by distance', {
    count: restaurants.length,
    userLat: userLocation.latitude.toFixed(4),
    userLon: userLocation.longitude.toFixed(4),
  });

  const sorted = [...restaurants].sort((a, b) => {
    const distA = calculateDistance(userLocation, a.coordinates);
    const distB = calculateDistance(userLocation, b.coordinates);
    return distA - distB;
  });

  logger.debug('Restaurants sorted', {
    count: sorted.length,
    closestDistance: calculateDistance(userLocation, sorted[0]?.coordinates).toFixed(2) + 'km',
  });

  return sorted;
}

/**
 * Gets recommended restaurants (closest to user)
 * 
 * @function getRecommendedRestaurants
 * @param {Restaurant[]} restaurants - All restaurants
 * @param {Object} userLocation - User's coordinates
 * @param {number} limit - Number of recommendations (default: 5)
 * @returns {Restaurant[]} Top N closest restaurants
 * 
 * @example
 * const recommended = getRecommendedRestaurants(restaurants, userLocation, 5);
 */
export function getRecommendedRestaurants(
  restaurants: Restaurant[],
  userLocation: { latitude: number; longitude: number },
  limit: number = 5
): Restaurant[] {
  const sorted = sortByDistance(restaurants, userLocation);
  const recommended = sorted.slice(0, limit);
  
  logger.debug('Recommended restaurants generated', {
    totalRestaurants: restaurants.length,
    recommended: recommended.length,
    limit,
  });
  
  return recommended;
}

/**
 * Searches restaurants by name, address, or categories
 * 
 * @function searchRestaurants
 * @param {Restaurant[]} restaurants - Restaurants to search
 * @param {string} queryText - Search query
 * @returns {Restaurant[]} Filtered restaurants
 * 
 * @example
 * const results = searchRestaurants(restaurants, 'nasi goreng');
 */
export function searchRestaurants(restaurants: Restaurant[], queryText: string): Restaurant[] {
  const lowerQuery = queryText.toLowerCase().trim();
  
  if (!lowerQuery) {
    logger.debug('Empty search query - returning all', {
      count: restaurants.length,
    });
    return restaurants;
  }

  logger.debug('Searching restaurants', {
    query: queryText,
    totalCount: restaurants.length,
  });

  const results = restaurants.filter((restaurant) => {
    const name = restaurant.name?.toLowerCase() || '';
    const address = restaurant.address?.toLowerCase() || '';
    const categories = restaurant.categories || [];

    return (
      name.includes(lowerQuery) ||
      address.includes(lowerQuery) ||
      categories.some((cat) => cat?.toLowerCase().includes(lowerQuery))
    );
  });

  logger.debug('Search results', {
    query: queryText,
    resultCount: results.length,
    matchRate: `${((results.length / restaurants.length) * 100).toFixed(1)}%`,
  });

  return results;
}

/**
 * Formats distance for display
 * 
 * @function formatDistance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 * 
 * @example
 * formatDistance(0.8) // "800m"
 * formatDistance(2.5) // "2.5km"
 */
export function formatDistance(distanceKm: number): string {
  if (!isFinite(distanceKm) || distanceKm < 0) return 'N/A';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Hook to invalidate restaurant caches
 * 
 * @function useInvalidateRestaurants
 * @returns {Object} Invalidation functions
 * 
 * @example
 * const { invalidateAll, invalidateDetail } = useInvalidateRestaurants();
 * invalidateAll(); // Refresh all restaurants
 */
export function useInvalidateRestaurants() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      logger.info('Invalidating all restaurants cache');
      cache.clear('restaurants-all');
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.all });
    },
    invalidateDetail: (id: string) => {
      logger.info('Invalidating restaurant detail cache', { restaurantId: id });
      cache.clear(`restaurant-${id}`);
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.detail(id) });
    },
    invalidateReviews: (id: string) => {
      logger.info('Invalidating restaurant reviews cache', { restaurantId: id });
      cache.clear(`restaurant-reviews-${id}`);
      queryClient.invalidateQueries({ queryKey: RESTAURANT_QUERY_KEYS.reviews(id) });
    },
  };
}