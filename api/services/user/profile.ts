/**
 * User Profile Service - Production Safe with Structured Logging
 * 
 * Handles user profile data with comprehensive validation and logging
 * 
 * ✅ FIXES: Production crashes from Turbo Module bridge errors in user data
 * ✅ LOGGING: Comprehensive structured logging for observability
 *
 * @version 3.0 - Structured Logging Migration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// SAFE WRAPPER IMPORTS
// ============================================================================

import {
  safeFirestoreGet,
  safeFirestoreUpdate,
} from '../utils/query-wrapper';
import { logger } from '../../../services/logging/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  aboutMe: string;
  interests: string[];
  role: 'user' | 'admin';
  
  // Social
  followers: Record<string, boolean>;
  following: Record<string, boolean>;
  
  // Content
  enrolledCourses: string[];
  likedQuestions: string[];
  favouriteRestaurants: string[];
  savedEvents: string[];
  
  // Metadata
  createdAt: any;
  referralCode?: string;
  referralCount?: number;
}

export interface UpdateProfileData {
  name?: string;
  avatarUrl?: string;
  aboutMe?: string;
  interests?: string[];
}

// Variables for mutations
type ToggleCourseVars = { userId: string; courseId: string; enrolled: boolean };
type ToggleQuestionVars = { userId: string; questionId: string; liked: boolean };
type ToggleRestaurantVars = { userId: string; restaurantId: string; favourite: boolean };
type ToggleEventVars = { userId: string; eventId: string; saved: boolean };

// ============================================================================
// QUERY KEYS
// ============================================================================

const USER_QUERY_KEYS = {
  all: ['user'] as const,
  profile: (userId: string) => ['user', 'profile', userId] as const,
  enrolledCourses: (userId: string) => ['user', 'courses', userId] as const,
  savedEvents: (userId: string) => ['user', 'events', userId] as const,
  social: (userId: string) => ['user', 'social', userId] as const,
};

// ============================================================================
// VALIDATION HELPERS (WITH LOGGING)
// ============================================================================

/**
 * Sanitize string fields to prevent UTF-8 crashes
 * Removes control characters that crash NSString conversion
 */
function sanitizeString(str: any, fallback: string = ''): string {
  const startTime = Date.now();
  
  if (typeof str !== 'string') {
    logger.debug('String sanitization: non-string input', {
      inputType: typeof str,
      usedFallback: true,
      fallback,
      operation: 'sanitize-string',
    });
    return fallback;
  }
  
  // Remove control characters that crash NSString conversion
  const sanitized = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  const hadControlChars = sanitized !== str;
  const duration = Date.now() - startTime;
  
  if (hadControlChars) {
    logger.debug('String sanitization: removed control characters', {
      originalLength: str.length,
      sanitizedLength: sanitized.length,
      removedChars: str.length - sanitized.length,
      sanitizeDuration: `${duration}ms`,
      operation: 'sanitize-string',
    });
  }
  
  return sanitized;
}

/**
 * Validate and sanitize array fields
 */
function sanitizeArray(arr: any, fallback: any[] = []): any[] {
  if (!Array.isArray(arr)) {
    logger.debug('Array sanitization: non-array input', {
      inputType: typeof arr,
      usedFallback: true,
      operation: 'sanitize-array',
    });
    return fallback;
  }
  
  const originalLength = arr.length;
  const sanitized = arr.filter(item => item !== null && item !== undefined);
  const removedItems = originalLength - sanitized.length;
  
  if (removedItems > 0) {
    logger.debug('Array sanitization: removed null/undefined items', {
      originalLength,
      sanitizedLength: sanitized.length,
      removedItems,
      operation: 'sanitize-array',
    });
  }
  
  return sanitized;
}

/**
 * Validate and sanitize string array
 */
function sanitizeStringArray(arr: any): string[] {
  const startTime = Date.now();
  
  if (!Array.isArray(arr)) {
    logger.debug('String array sanitization: non-array input', {
      inputType: typeof arr,
      usedFallback: true,
      operation: 'sanitize-string-array',
    });
    return [];
  }
  
  const originalLength = arr.length;
  const sanitized = arr
    .filter(item => typeof item === 'string' && item.length > 0)
    .map(item => sanitizeString(item));
  
  const duration = Date.now() - startTime;
  const removedItems = originalLength - sanitized.length;
  
  if (removedItems > 0) {
    logger.debug('String array sanitization: filtered invalid items', {
      originalLength,
      sanitizedLength: sanitized.length,
      removedItems,
      sanitizeDuration: `${duration}ms`,
      operation: 'sanitize-string-array',
    });
  }
  
  return sanitized;
}

/**
 * Validate record/object fields
 */
function sanitizeRecord(obj: any, fallback: Record<string, boolean> = {}): Record<string, boolean> {
  const startTime = Date.now();
  
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    logger.debug('Record sanitization: invalid input', {
      inputType: typeof obj,
      isArray: Array.isArray(obj),
      usedFallback: true,
      operation: 'sanitize-record',
    });
    return fallback;
  }
  
  const result: Record<string, boolean> = {};
  const originalKeys = Object.keys(obj);
  let invalidEntries = 0;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'boolean' && typeof key === 'string' && key.length > 0) {
      result[sanitizeString(key)] = value;
    } else {
      invalidEntries++;
    }
  }
  
  const duration = Date.now() - startTime;
  
  if (invalidEntries > 0) {
    logger.debug('Record sanitization: removed invalid entries', {
      originalKeys: originalKeys.length,
      validKeys: Object.keys(result).length,
      invalidEntries,
      sanitizeDuration: `${duration}ms`,
      operation: 'sanitize-record',
    });
  }
  
  return result;
}

/**
 * Validate timestamp
 */
function sanitizeTimestamp(timestamp: any): any {
  if (!timestamp) {
    logger.debug('Timestamp sanitization: null/undefined input', {
      operation: 'sanitize-timestamp',
    });
    return null;
  }
  
  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    logger.debug('Timestamp sanitization: valid Firestore timestamp', {
      hasToDate: true,
      operation: 'sanitize-timestamp',
    });
    return timestamp;
  }
  
  // Handle number timestamps
  if (typeof timestamp === 'number' && timestamp > 0) {
    logger.debug('Timestamp sanitization: valid numeric timestamp', {
      timestamp,
      operation: 'sanitize-timestamp',
    });
    return timestamp;
  }
  
  logger.debug('Timestamp sanitization: invalid format, returning null', {
    inputType: typeof timestamp,
    operation: 'sanitize-timestamp',
  });
  
  return null;
}

/**
 * Create default profile for missing/corrupt data
 */
function createDefaultProfile(userId: string, partialData?: any): UserProfile {
  const startTime = Date.now();
  
  const defaultProfile: UserProfile = {
    id: userId,
    name: sanitizeString(partialData?.name, 'User'),
    email: sanitizeString(partialData?.email, ''),
    avatarUrl: sanitizeString(partialData?.avatarUrl, 'https://via.placeholder.com/100'),
    aboutMe: sanitizeString(partialData?.aboutMe, ''),
    interests: [],
    role: 'user',
    followers: {},
    following: {},
    enrolledCourses: [],
    likedQuestions: [],
    favouriteRestaurants: [],
    savedEvents: [],
    createdAt: partialData?.createdAt || null,
    referralCode: partialData?.referralCode ? sanitizeString(partialData.referralCode) : undefined,
    referralCount: typeof partialData?.referralCount === 'number' ? partialData.referralCount : 0,
  };
  
  const duration = Date.now() - startTime;
  
  logger.info('Created default user profile', {
    userId: userId.substring(0, 8) + '...',
    hasPartialData: !!partialData,
    createDuration: `${duration}ms`,
    operation: 'create-default-profile',
  });
  
  return defaultProfile;
}

// ============================================================================
// API FUNCTIONS (PRODUCTION SAFE WITH LOGGING)
// ============================================================================

/**
 * PRODUCTION SAFE: Fetch user profile with comprehensive validation
 */
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const startTime = Date.now();
  
  // Validate user ID
  if (!userId || typeof userId !== 'string') {
    logger.error('Invalid user ID provided', {
      userId: userId ? String(userId).substring(0, 8) + '...' : 'null',
      type: typeof userId,
      operation: 'fetch-user-profile',
    });
    throw new Error('Invalid user ID');
  }

  const cacheKey = `user-profile-${userId}`;
  
  logger.debug('Initiating user profile fetch', {
    userId: userId.substring(0, 8) + '...',
    cacheKey,
    operation: 'fetch-user-profile',
  });

  try {
    // Check cache first
    const cacheCheckStart = Date.now();
    const cached = cache.get<UserProfile>(cacheKey);
    const cacheCheckDuration = Date.now() - cacheCheckStart;
    
    if (cached && cached.id === userId) {
      logger.success('User profile retrieved from MMKV cache', {
        userId: userId.substring(0, 8) + '...',
        source: 'MMKV',
        name: cached.name,
        role: cached.role,
        enrolledCoursesCount: cached.enrolledCourses.length,
        favouriteRestaurantsCount: cached.favouriteRestaurants.length,
        cacheCheckDuration: `${cacheCheckDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
        cacheHit: true,
      });
      return cached;
    }
    
    logger.debug('MMKV cache miss, fetching from Firestore', {
      userId: userId.substring(0, 8) + '...',
      cacheCheckDuration: `${cacheCheckDuration}ms`,
      cacheHit: false,
    });

    // Use safe wrapper
    const firestoreStart = Date.now();
    const userRef = firestore().collection('users').doc(userId);
    const results = await safeFirestoreGet<any>(userRef as any);
    const firestoreDuration = Date.now() - firestoreStart;

    if (!Array.isArray(results) || results.length === 0) {
      logger.warn('User profile not found in Firestore, creating default', {
        userId: userId.substring(0, 8) + '...',
        resultsType: typeof results,
        resultsLength: Array.isArray(results) ? results.length : 0,
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      return createDefaultProfile(userId);
    }

    const rawData = results[0];
    
    logger.debug('Firestore document retrieved, beginning validation', {
      userId: userId.substring(0, 8) + '...',
      hasData: !!rawData,
      firestoreDuration: `${firestoreDuration}ms`,
    });

    // Comprehensive validation and sanitization
    const validationStart = Date.now();
    const profile: UserProfile = {
      id: userId,
      name: sanitizeString(rawData.name, 'User'),
      email: sanitizeString(rawData.email, ''),
      avatarUrl: sanitizeString(rawData.avatarUrl, 'https://via.placeholder.com/100'),
      aboutMe: sanitizeString(rawData.aboutMe, ''),
      interests: sanitizeStringArray(rawData.interests),
      role: rawData.role === 'admin' ? 'admin' : 'user',
      
      // Social fields with validation
      followers: sanitizeRecord(rawData.followers, {}),
      following: sanitizeRecord(rawData.following, {}),
      
      // Content arrays with validation
      enrolledCourses: sanitizeStringArray(rawData.enrolledCourses),
      likedQuestions: sanitizeStringArray(rawData.likedQuestions),
      favouriteRestaurants: sanitizeStringArray(rawData.favouriteRestaurants),
      savedEvents: sanitizeStringArray(rawData.savedEvents),
      
      // Metadata
      createdAt: sanitizeTimestamp(rawData.createdAt),
      referralCode: rawData.referralCode ? sanitizeString(rawData.referralCode) : undefined,
      referralCount: typeof rawData.referralCount === 'number' ? rawData.referralCount : 0,
    };
    const validationDuration = Date.now() - validationStart;

    // Cache valid profile
    const cacheSetStart = Date.now();
    cache.set(cacheKey, profile, TTL.FIFTEEN_MINUTES);
    const cacheSetDuration = Date.now() - cacheSetStart;

    logger.success('User profile fetched from Firestore and validated', {
      userId: userId.substring(0, 8) + '...',
      source: 'Firestore',
      name: profile.name,
      role: profile.role,
      enrolledCoursesCount: profile.enrolledCourses.length,
      favouriteRestaurantsCount: profile.favouriteRestaurants.length,
      savedEventsCount: profile.savedEvents.length,
      followersCount: Object.keys(profile.followers).length,
      followingCount: Object.keys(profile.following).length,
      firestoreDuration: `${firestoreDuration}ms`,
      validationDuration: `${validationDuration}ms`,
      cacheSetDuration: `${cacheSetDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      cached: true,
      cacheTTL: 'FIFTEEN_MINUTES',
    });

    return profile;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error fetching user profile', {
      userId: userId.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'fetch-user-profile',
    });
    
    // Try to return expired cache
    const expiredCache = cache.get<UserProfile>(cacheKey);
    if (expiredCache) {
      logger.warn('Using expired cache after fetch error', {
        userId: userId.substring(0, 8) + '...',
        source: 'MMKV-expired',
        totalDuration: `${duration}ms`,
      });
      return expiredCache;
    }
    
    // Last resort: return default profile
    logger.warn('Returning default profile after all recovery attempts failed', {
      userId: userId.substring(0, 8) + '...',
      totalDuration: `${duration}ms`,
    });
    return createDefaultProfile(userId);
  }
}

/**
 * PRODUCTION SAFE: Update user profile with validation
 */
async function updateUserProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  const startTime = Date.now();
  
  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    logger.error('Invalid user ID for profile update', {
      userId: userId ? String(userId).substring(0, 8) + '...' : 'null',
      operation: 'update-user-profile',
    });
    throw new Error('Invalid user ID');
  }

  logger.debug('Initiating user profile update', {
    userId: userId.substring(0, 8) + '...',
    updatedFields: Object.keys(updates),
    operation: 'update-user-profile',
  });

  try {
    // Sanitize update data
    const sanitizeStart = Date.now();
    const sanitizedUpdates: Partial<UpdateProfileData> = {};
    
    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeString(updates.name);
    }
    if (updates.avatarUrl !== undefined) {
      sanitizedUpdates.avatarUrl = sanitizeString(updates.avatarUrl);
    }
    if (updates.aboutMe !== undefined) {
      sanitizedUpdates.aboutMe = sanitizeString(updates.aboutMe);
    }
    if (updates.interests !== undefined) {
      sanitizedUpdates.interests = sanitizeStringArray(updates.interests);
    }
    const sanitizeDuration = Date.now() - sanitizeStart;

    logger.debug('Update data sanitized', {
      userId: userId.substring(0, 8) + '...',
      sanitizedFields: Object.keys(sanitizedUpdates),
      sanitizeDuration: `${sanitizeDuration}ms`,
    });

    // Update in Firestore
    const firestoreStart = Date.now();
    const userRef = firestore().collection('users').doc(userId);
    const success = await safeFirestoreUpdate(userRef as any, sanitizedUpdates);
    const firestoreDuration = Date.now() - firestoreStart;

    if (!success) {
      logger.error('Firestore update failed', {
        userId: userId.substring(0, 8) + '...',
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error('Failed to update user profile');
    }

    // Fetch updated profile
    const fetchStart = Date.now();
    const updatedProfile = await fetchUserProfile(userId);
    const fetchDuration = Date.now() - fetchStart;

    logger.success('User profile updated successfully', {
      userId: userId.substring(0, 8) + '...',
      updatedFields: Object.keys(sanitizedUpdates),
      sanitizeDuration: `${sanitizeDuration}ms`,
      firestoreDuration: `${firestoreDuration}ms`,
      fetchDuration: `${fetchDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      operation: 'update-user-profile',
    });

    return updatedProfile;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to update user profile', {
      userId: userId.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'update-user-profile',
    });
    
    throw error;
  }
}

/**
 * PRODUCTION SAFE: Toggle enrolled course
 */
async function toggleEnrolledCourse(vars: ToggleCourseVars): Promise<void> {
  const startTime = Date.now();
  const { userId, courseId, enrolled } = vars;
  
  // Validate inputs
  if (!userId || !courseId) {
    logger.error('Invalid userId or courseId for course enrollment toggle', {
      userId: userId ? userId.substring(0, 8) + '...' : 'null',
      courseId: courseId ? courseId.substring(0, 8) + '...' : 'null',
      operation: 'toggle-enrolled-course',
    });
    throw new Error('Invalid userId or courseId');
  }

  logger.debug('Toggling course enrollment', {
    userId: userId.substring(0, 8) + '...',
    courseId: courseId.substring(0, 8) + '...',
    action: enrolled ? 'enroll' : 'unenroll',
    operation: 'toggle-enrolled-course',
  });

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = enrolled
      ? { enrolledCourses: firestore.FieldValue.arrayUnion(courseId) }
      : { enrolledCourses: firestore.FieldValue.arrayRemove(courseId) };
    
    const firestoreStart = Date.now();
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    const firestoreDuration = Date.now() - firestoreStart;
    
    if (!success) {
      logger.error('Failed to toggle course enrollment', {
        userId: userId.substring(0, 8) + '...',
        courseId: courseId.substring(0, 8) + '...',
        action: enrolled ? 'enroll' : 'unenroll',
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error('Failed to toggle course enrollment');
    }
    
    logger.success('Course enrollment toggled successfully', {
      userId: userId.substring(0, 8) + '...',
      courseId: courseId.substring(0, 8) + '...',
      action: enrolled ? 'enrolled' : 'unenrolled',
      firestoreDuration: `${firestoreDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      operation: 'toggle-enrolled-course',
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error toggling course enrollment', {
      userId: userId.substring(0, 8) + '...',
      courseId: courseId.substring(0, 8) + '...',
      action: enrolled ? 'enroll' : 'unenroll',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'toggle-enrolled-course',
    });
    
    throw error;
  }
}

/**
 * PRODUCTION SAFE: Toggle liked question
 */
async function toggleLikedQuestion(vars: ToggleQuestionVars): Promise<void> {
  const startTime = Date.now();
  const { userId, questionId, liked } = vars;
  
  // Validate inputs
  if (!userId || !questionId) {
    logger.error('Invalid userId or questionId for question like toggle', {
      userId: userId ? userId.substring(0, 8) + '...' : 'null',
      questionId: questionId ? questionId.substring(0, 8) + '...' : 'null',
      operation: 'toggle-liked-question',
    });
    throw new Error('Invalid userId or questionId');
  }

  logger.debug('Toggling question like', {
    userId: userId.substring(0, 8) + '...',
    questionId: questionId.substring(0, 8) + '...',
    action: liked ? 'like' : 'unlike',
    operation: 'toggle-liked-question',
  });

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = liked
      ? { likedQuestions: firestore.FieldValue.arrayUnion(questionId) }
      : { likedQuestions: firestore.FieldValue.arrayRemove(questionId) };
    
    const firestoreStart = Date.now();
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    const firestoreDuration = Date.now() - firestoreStart;
    
    if (!success) {
      logger.error('Failed to toggle question like', {
        userId: userId.substring(0, 8) + '...',
        questionId: questionId.substring(0, 8) + '...',
        action: liked ? 'like' : 'unlike',
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error('Failed to toggle question like');
    }
    
    logger.success('Question like toggled successfully', {
      userId: userId.substring(0, 8) + '...',
      questionId: questionId.substring(0, 8) + '...',
      action: liked ? 'liked' : 'unliked',
      firestoreDuration: `${firestoreDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      operation: 'toggle-liked-question',
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error toggling question like', {
      userId: userId.substring(0, 8) + '...',
      questionId: questionId.substring(0, 8) + '...',
      action: liked ? 'like' : 'unlike',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'toggle-liked-question',
    });
    
    throw error;
  }
}

/**
 * PRODUCTION SAFE: Toggle favourite restaurant
 */
async function toggleFavouriteRestaurant(vars: ToggleRestaurantVars): Promise<void> {
  const startTime = Date.now();
  const { userId, restaurantId, favourite } = vars;
  
  // Validate inputs
  if (!userId || !restaurantId) {
    logger.error('Invalid userId or restaurantId for favourite toggle', {
      userId: userId ? userId.substring(0, 8) + '...' : 'null',
      restaurantId: restaurantId ? restaurantId.substring(0, 8) + '...' : 'null',
      operation: 'toggle-favourite-restaurant',
    });
    throw new Error('Invalid userId or restaurantId');
  }

  logger.debug('Toggling restaurant favourite', {
    userId: userId.substring(0, 8) + '...',
    restaurantId: restaurantId.substring(0, 8) + '...',
    action: favourite ? 'favourite' : 'unfavourite',
    operation: 'toggle-favourite-restaurant',
  });

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = favourite
      ? { favouriteRestaurants: firestore.FieldValue.arrayUnion(restaurantId) }
      : { favouriteRestaurants: firestore.FieldValue.arrayRemove(restaurantId) };
    
    const firestoreStart = Date.now();
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    const firestoreDuration = Date.now() - firestoreStart;
    
    if (!success) {
      logger.error('Failed to toggle restaurant favourite', {
        userId: userId.substring(0, 8) + '...',
        restaurantId: restaurantId.substring(0, 8) + '...',
        action: favourite ? 'favourite' : 'unfavourite',
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error('Failed to toggle restaurant favourite');
    }
    
    logger.success('Restaurant favourite toggled successfully', {
      userId: userId.substring(0, 8) + '...',
      restaurantId: restaurantId.substring(0, 8) + '...',
      action: favourite ? 'favourited' : 'unfavourited',
      firestoreDuration: `${firestoreDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      operation: 'toggle-favourite-restaurant',
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error toggling restaurant favourite', {
      userId: userId.substring(0, 8) + '...',
      restaurantId: restaurantId.substring(0, 8) + '...',
      action: favourite ? 'favourite' : 'unfavourite',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'toggle-favourite-restaurant',
    });
    
    throw error;
  }
}

/**
 * PRODUCTION SAFE: Toggle saved event
 */
async function toggleSavedEvent(vars: ToggleEventVars): Promise<void> {
  const startTime = Date.now();
  const { userId, eventId, saved } = vars;
  
  // Validate inputs
  if (!userId || !eventId) {
    logger.error('Invalid userId or eventId for saved event toggle', {
      userId: userId ? userId.substring(0, 8) + '...' : 'null',
      eventId: eventId ? eventId.substring(0, 8) + '...' : 'null',
      operation: 'toggle-saved-event',
    });
    throw new Error('Invalid userId or eventId');
  }

  logger.debug('Toggling saved event', {
    userId: userId.substring(0, 8) + '...',
    eventId: eventId.substring(0, 8) + '...',
    action: saved ? 'save' : 'unsave',
    operation: 'toggle-saved-event',
  });

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = saved
      ? { savedEvents: firestore.FieldValue.arrayUnion(eventId) }
      : { savedEvents: firestore.FieldValue.arrayRemove(eventId) };
    
    const firestoreStart = Date.now();
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    const firestoreDuration = Date.now() - firestoreStart;
    
    if (!success) {
      logger.error('Failed to toggle saved event', {
        userId: userId.substring(0, 8) + '...',
        eventId: eventId.substring(0, 8) + '...',
        action: saved ? 'save' : 'unsave',
        firestoreDuration: `${firestoreDuration}ms`,
        totalDuration: `${Date.now() - startTime}ms`,
      });
      throw new Error('Failed to toggle saved event');
    }
    
    logger.success('Saved event toggled successfully', {
      userId: userId.substring(0, 8) + '...',
      eventId: eventId.substring(0, 8) + '...',
      action: saved ? 'saved' : 'unsaved',
      firestoreDuration: `${firestoreDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      operation: 'toggle-saved-event',
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error toggling saved event', {
      userId: userId.substring(0, 8) + '...',
      eventId: eventId.substring(0, 8) + '...',
      action: saved ? 'save' : 'unsave',
      error: error instanceof Error ? error.message : String(error),
      totalDuration: `${duration}ms`,
      operation: 'toggle-saved-event',
    });
    
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS (Production Safe with Logging)
// ============================================================================

/**
 * Fetch user profile with caching and error recovery
 */
export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile(userId ?? 'anon'),
    queryFn: async () => {
      const queryStart = Date.now();
      
      if (!userId) {
        logger.error('User profile query attempted without authentication', {
          queryType: 'user-profile',
        });
        throw new Error('User not authenticated');
      }
      
      logger.debug('User profile query function executing', {
        userId: userId.substring(0, 8) + '...',
        queryType: 'user-profile',
      });
      
      const cacheKey = `user-profile-${userId}`;
      const cached = cache.get<UserProfile>(cacheKey);
      
      if (cached && cached.id === userId) {
        logger.debug('Returning cached user profile from query function', {
          userId: userId.substring(0, 8) + '...',
          source: 'MMKV',
          queryDuration: `${Date.now() - queryStart}ms`,
        });
        return cached;
      }
      
      logger.debug('Fetching user profile from Firestore via query function', {
        userId: userId.substring(0, 8) + '...',
        source: 'Firestore',
      });
      
      const profile = await fetchUserProfile(userId);
      
      const cacheSetStart = Date.now();
      cache.set(cacheKey, profile, TTL.FIFTEEN_MINUTES);
      const cacheSetDuration = Date.now() - cacheSetStart;
      
      logger.debug('User profile query completed', {
        userId: userId.substring(0, 8) + '...',
        cacheSetDuration: `${cacheSetDuration}ms`,
        totalQueryDuration: `${Date.now() - queryStart}ms`,
      });
      
      return profile;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.FIFTEEN_MINUTES,
    enabled: !!userId,
    retry: 2,
  });
}

/**
 * Update user profile with optimistic updates
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation<
    UserProfile, 
    unknown, 
    { userId: string; updates: UpdateProfileData }, 
    { previous?: UserProfile }
  >({
    mutationFn: async ({ userId, updates }) => {
      logger.debug('Starting user profile update mutation', {
        userId: userId.substring(0, 8) + '...',
        updatedFields: Object.keys(updates),
        mutationType: 'update-profile',
      });
      
      return updateUserProfile(userId, updates);
    },
    
    // Optimistic update
    onMutate: async ({ userId, updates }) => {
      const mutateStart = Date.now();
      
      logger.debug('Applying optimistic update to user profile', {
        userId: userId.substring(0, 8) + '...',
        updatedFields: Object.keys(updates),
        phase: 'optimistic-update',
      });
      
      const cancelStart = Date.now();
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      const cancelDuration = Date.now() - cancelStart;
      
      const previous = queryClient.getQueryData<UserProfile>(USER_QUERY_KEYS.profile(userId));
      
      logger.debug('Previous state snapshot captured', {
        userId: userId.substring(0, 8) + '...',
        hadPreviousState: !!previous,
        cancelDuration: `${cancelDuration}ms`,
        phase: 'snapshot',
      });
      
      queryClient.setQueryData<UserProfile | undefined>(
        USER_QUERY_KEYS.profile(userId),
        (old) => (old ? { ...old, ...updates } : old)
      );
      
      const mutateDuration = Date.now() - mutateStart;
      
      logger.success('Optimistic update applied to cache', {
        userId: userId.substring(0, 8) + '...',
        updatedFields: Object.keys(updates),
        mutateDuration: `${mutateDuration}ms`,
        phase: 'optimistic-update',
        instant: true,
      });
      
      return { previous };
    },
    
    onError: (error, { userId }, context) => {
      const errorStart = Date.now();
      
      logger.error('User profile update mutation failed, initiating rollback', {
        userId: userId.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : String(error),
        phase: 'error-handler',
      });
      
      if (context?.previous) {
        queryClient.setQueryData(USER_QUERY_KEYS.profile(userId), context.previous);
        const errorDuration = Date.now() - errorStart;
        
        logger.success('Rolled back to previous profile state', {
          userId: userId.substring(0, 8) + '...',
          rollbackDuration: `${errorDuration}ms`,
          phase: 'rollback',
        });
      } else {
        logger.warn('No previous state to rollback to', {
          userId: userId.substring(0, 8) + '...',
          phase: 'rollback',
        });
      }
    },
    
    onSuccess: (data, { userId }) => {
      const successStart = Date.now();
      
      logger.debug('User profile update mutation succeeded', {
        userId: userId.substring(0, 8) + '...',
        phase: 'success-handler',
      });
      
      const cacheSetStart = Date.now();
      const cacheKey = `user-profile-${userId}`;
      cache.set(cacheKey, data, TTL.FIFTEEN_MINUTES);
      const cacheSetDuration = Date.now() - cacheSetStart;
      
      const successDuration = Date.now() - successStart;
      
      logger.success('User profile updated and cached', {
        userId: userId.substring(0, 8) + '...',
        cacheSetDuration: `${cacheSetDuration}ms`,
        totalSuccessDuration: `${successDuration}ms`,
        phase: 'success-handler',
      });
    },
  });
}

/**
 * Toggle course enrollment with cache invalidation
 */
export function useToggleEnrolledCourse() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleCourseVars>({
    mutationFn: (vars) => {
      logger.debug('Starting course enrollment toggle mutation', {
        userId: vars.userId.substring(0, 8) + '...',
        courseId: vars.courseId.substring(0, 8) + '...',
        action: vars.enrolled ? 'enroll' : 'unenroll',
        mutationType: 'toggle-course',
      });
      
      return toggleEnrolledCourse(vars);
    },
    
    onSuccess: (_data, { userId, courseId, enrolled }) => {
      const successStart = Date.now();
      
      logger.debug('Course toggle succeeded, invalidating queries', {
        userId: userId.substring(0, 8) + '...',
        courseId: courseId.substring(0, 8) + '...',
        action: enrolled ? 'enrolled' : 'unenrolled',
        phase: 'success-handler',
      });
      
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.enrolledCourses(userId) });
      
      const successDuration = Date.now() - successStart;
      
      logger.success('Course toggle: queries invalidated', {
        userId: userId.substring(0, 8) + '...',
        queriesInvalidated: ['profile', 'enrolledCourses'],
        invalidateDuration: `${successDuration}ms`,
        phase: 'invalidation',
      });
    },
  });
}

/**
 * Toggle liked question with cache invalidation
 */
export function useToggleLikedQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleQuestionVars>({
    mutationFn: (vars) => {
      logger.debug('Starting question like toggle mutation', {
        userId: vars.userId.substring(0, 8) + '...',
        questionId: vars.questionId.substring(0, 8) + '...',
        action: vars.liked ? 'like' : 'unlike',
        mutationType: 'toggle-question',
      });
      
      return toggleLikedQuestion(vars);
    },
    
    onSuccess: (_data, { userId, questionId, liked }) => {
      const successStart = Date.now();
      
      logger.debug('Question like toggle succeeded, invalidating profile', {
        userId: userId.substring(0, 8) + '...',
        questionId: questionId.substring(0, 8) + '...',
        action: liked ? 'liked' : 'unliked',
        phase: 'success-handler',
      });
      
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      
      const successDuration = Date.now() - successStart;
      
      logger.success('Question like toggle: profile invalidated', {
        userId: userId.substring(0, 8) + '...',
        queriesInvalidated: ['profile'],
        invalidateDuration: `${successDuration}ms`,
        phase: 'invalidation',
      });
    },
  });
}

/**
 * Toggle favourite restaurant with cache invalidation
 */
export function useToggleFavouriteRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleRestaurantVars>({
    mutationFn: (vars) => {
      logger.debug('Starting restaurant favourite toggle mutation', {
        userId: vars.userId.substring(0, 8) + '...',
        restaurantId: vars.restaurantId.substring(0, 8) + '...',
        action: vars.favourite ? 'favourite' : 'unfavourite',
        mutationType: 'toggle-restaurant',
      });
      
      return toggleFavouriteRestaurant(vars);
    },
    
    onSuccess: (_data, { userId, restaurantId, favourite }) => {
      const successStart = Date.now();
      
      logger.debug('Restaurant favourite toggle succeeded, invalidating profile', {
        userId: userId.substring(0, 8) + '...',
        restaurantId: restaurantId.substring(0, 8) + '...',
        action: favourite ? 'favourited' : 'unfavourited',
        phase: 'success-handler',
      });
      
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      
      const successDuration = Date.now() - successStart;
      
      logger.success('Restaurant favourite toggle: profile invalidated', {
        userId: userId.substring(0, 8) + '...',
        queriesInvalidated: ['profile'],
        invalidateDuration: `${successDuration}ms`,
        phase: 'invalidation',
      });
    },
  });
}

/**
 * Toggle saved event with cache invalidation
 */
export function useToggleSavedEvent() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleEventVars>({
    mutationFn: (vars) => {
      logger.debug('Starting saved event toggle mutation', {
        userId: vars.userId.substring(0, 8) + '...',
        eventId: vars.eventId.substring(0, 8) + '...',
        action: vars.saved ? 'save' : 'unsave',
        mutationType: 'toggle-event',
      });
      
      return toggleSavedEvent(vars);
    },
    
    onSuccess: (_data, { userId, eventId, saved }) => {
      const successStart = Date.now();
      
      logger.debug('Saved event toggle succeeded, invalidating queries', {
        userId: userId.substring(0, 8) + '...',
        eventId: eventId.substring(0, 8) + '...',
        action: saved ? 'saved' : 'unsaved',
        phase: 'success-handler',
      });
      
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.savedEvents(userId) });
      
      const successDuration = Date.now() - successStart;
      
      logger.success('Saved event toggle: queries invalidated', {
        userId: userId.substring(0, 8) + '...',
        queriesInvalidated: ['profile', 'savedEvents'],
        invalidateDuration: `${successDuration}ms`,
        phase: 'invalidation',
      });
    },
  });
}

// ============================================================================
// UTILITY HOOKS (No logging needed - simple derived state)
// ============================================================================

export function useIsEnrolledInCourse(userId: string | null, courseId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.enrolledCourses.includes(courseId) ?? false;
}

export function useIsQuestionLiked(userId: string | null, questionId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.likedQuestions.includes(questionId) ?? false;
}

export function useIsRestaurantFavourited(userId: string | null, restaurantId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.favouriteRestaurants.includes(restaurantId) ?? false;
}

export function useIsEventSaved(userId: string | null, eventId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.savedEvents.includes(eventId) ?? false;
}

export function useSocialCounts(userId: string | null) {
  const { data: profile } = useUserProfile(userId);
  
  return {
    followersCount: profile ? Object.keys(profile.followers).length : 0,
    followingCount: profile ? Object.keys(profile.following).length : 0,
    coursesCount: profile?.enrolledCourses.length ?? 0,
    savedEventsCount: profile?.savedEvents.length ?? 0,
    favouriteRestaurantsCount: profile?.favouriteRestaurants.length ?? 0,
  };
}