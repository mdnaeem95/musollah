/**
 * User Profile Service - PRODUCTION SAFE VERSION
 * 
 * Handles user profile data with comprehensive validation
 * 
 * ✅ FIXES: Production crashes from Turbo Module bridge errors in user data
 *
 * @version 2.0 - Production hardened with safe wrappers
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
// VALIDATION HELPERS
// ============================================================================

/**
 * Sanitize string fields to prevent UTF-8 crashes
 */
function sanitizeString(str: any, fallback: string = ''): string {
  if (typeof str !== 'string') return fallback;
  // Remove control characters that crash NSString conversion
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

/**
 * Validate and sanitize array fields
 */
function sanitizeArray(arr: any, fallback: any[] = []): any[] {
  if (!Array.isArray(arr)) return fallback;
  return arr.filter(item => item !== null && item !== undefined);
}

/**
 * Validate and sanitize string array
 */
function sanitizeStringArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(item => typeof item === 'string' && item.length > 0)
    .map(item => sanitizeString(item));
}

/**
 * Validate record/object fields
 */
function sanitizeRecord(obj: any, fallback: Record<string, boolean> = {}): Record<string, boolean> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fallback;
  
  const result: Record<string, boolean> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'boolean' && typeof key === 'string' && key.length > 0) {
      result[sanitizeString(key)] = value;
    }
  }
  
  return result;
}

/**
 * Validate timestamp
 */
function sanitizeTimestamp(timestamp: any): any {
  if (!timestamp) return null;
  
  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp;
  }
  
  // Handle number timestamps
  if (typeof timestamp === 'number' && timestamp > 0) {
    return timestamp;
  }
  
  return null;
}

/**
 * Create default profile for missing/corrupt data
 */
function createDefaultProfile(userId: string, partialData?: any): UserProfile {
  return {
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
}

// ============================================================================
// API FUNCTIONS (PRODUCTION SAFE)
// ============================================================================

/**
 * ✅ PRODUCTION SAFE: Fetch user profile with comprehensive validation
 */
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  const cacheKey = `user-profile-${userId}`;

  try {
    // Check cache first
    const cached = cache.get<UserProfile>(cacheKey);
    if (cached && cached.id === userId) {
      console.log('⚡ Using cached user profile');
      return cached;
    }

    console.log('🌐 Fetching user profile from Firestore');

    // Use safe wrapper
    const userRef = firestore().collection('users').doc(userId);
    const results = await safeFirestoreGet<any>(userRef as any);

    if (!Array.isArray(results) || results.length === 0) {
      console.warn('⚠️ User profile not found, creating default');
      return createDefaultProfile(userId);
    }

    const rawData = results[0];

    // Comprehensive validation and sanitization
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

    // Cache valid profile
    cache.set(cacheKey, profile, TTL.FIFTEEN_MINUTES);

    return profile;
    
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    
    // Try to return expired cache
    const expiredCache = cache.get<UserProfile>(cacheKey);
    if (expiredCache) {
      console.warn('⚠️ Using expired cache');
      return expiredCache;
    }
    
    // Last resort: return default profile
    console.warn('⚠️ Returning default profile');
    return createDefaultProfile(userId);
  }
}

/**
 * ✅ PRODUCTION SAFE: Update user profile with validation
 */
async function updateUserProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    // Sanitize updates before sending
    const sanitizedUpdates: any = {};
    
    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeString(updates.name, 'User');
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

    // Use safe update
    const success = await safeFirestoreUpdate(userRef as any, sanitizedUpdates);
    
    if (!success) {
      throw new Error('Failed to update profile');
    }
    
    console.log('✅ User profile updated');
    
    // Clear cache to force refresh
    const cacheKey = `user-profile-${userId}`;
    cache.clear(cacheKey);
    
    // Fetch updated profile
    return await fetchUserProfile(userId);
    
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Toggle enrolled course
 */
async function toggleEnrolledCourse(vars: ToggleCourseVars): Promise<void> {
  const { userId, courseId, enrolled } = vars;
  
  if (!userId || !courseId) {
    throw new Error('Invalid userId or courseId');
  }

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = enrolled
      ? { enrolledCourses: firestore.FieldValue.arrayUnion(courseId) }
      : { enrolledCourses: firestore.FieldValue.arrayRemove(courseId) };
    
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    
    if (!success) {
      throw new Error('Failed to toggle course enrollment');
    }
    
    console.log(`✅ Course ${enrolled ? 'enrolled' : 'unenrolled'}: ${courseId}`);
  } catch (error) {
    console.error('❌ Error toggling course enrollment:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Toggle liked question
 */
async function toggleLikedQuestion(vars: ToggleQuestionVars): Promise<void> {
  const { userId, questionId, liked } = vars;
  
  if (!userId || !questionId) {
    throw new Error('Invalid userId or questionId');
  }

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = liked
      ? { likedQuestions: firestore.FieldValue.arrayUnion(questionId) }
      : { likedQuestions: firestore.FieldValue.arrayRemove(questionId) };
    
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    
    if (!success) {
      throw new Error('Failed to toggle question like');
    }
    
    console.log(`✅ Question ${liked ? 'liked' : 'unliked'}: ${questionId}`);
  } catch (error) {
    console.error('❌ Error toggling question like:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Toggle favourite restaurant
 */
async function toggleFavouriteRestaurant(vars: ToggleRestaurantVars): Promise<void> {
  const { userId, restaurantId, favourite } = vars;
  
  if (!userId || !restaurantId) {
    throw new Error('Invalid userId or restaurantId');
  }

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = favourite
      ? { favouriteRestaurants: firestore.FieldValue.arrayUnion(restaurantId) }
      : { favouriteRestaurants: firestore.FieldValue.arrayRemove(restaurantId) };
    
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    
    if (!success) {
      throw new Error('Failed to toggle restaurant favourite');
    }
    
    console.log(`✅ Restaurant ${favourite ? 'favourited' : 'unfavourited'}: ${restaurantId}`);
  } catch (error) {
    console.error('❌ Error toggling restaurant favourite:', error);
    throw error;
  }
}

/**
 * ✅ PRODUCTION SAFE: Toggle saved event
 */
async function toggleSavedEvent(vars: ToggleEventVars): Promise<void> {
  const { userId, eventId, saved } = vars;
  
  if (!userId || !eventId) {
    throw new Error('Invalid userId or eventId');
  }

  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const updateData = saved
      ? { savedEvents: firestore.FieldValue.arrayUnion(eventId) }
      : { savedEvents: firestore.FieldValue.arrayRemove(eventId) };
    
    const success = await safeFirestoreUpdate(userRef as any, updateData);
    
    if (!success) {
      throw new Error('Failed to toggle saved event');
    }
    
    console.log(`✅ Event ${saved ? 'saved' : 'unsaved'}: ${eventId}`);
  } catch (error) {
    console.error('❌ Error toggling saved event:', error);
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS (Production Safe)
// ============================================================================

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile(userId ?? 'anon'),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const cacheKey = `user-profile-${userId}`;
      const cached = cache.get<UserProfile>(cacheKey);
      
      if (cached && cached.id === userId) {
        console.log('⚡ Using cached user profile');
        return cached;
      }
      
      console.log('🌐 Fetching user profile from Firestore');
      const profile = await fetchUserProfile(userId);
      
      cache.set(cacheKey, profile, TTL.FIFTEEN_MINUTES);
      
      return profile;
    },
    staleTime: TTL.FIVE_MINUTES,
    gcTime: TTL.FIFTEEN_MINUTES,
    enabled: !!userId,
    retry: 2,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation<
    UserProfile, 
    unknown, 
    { userId: string; updates: UpdateProfileData }, 
    { previous?: UserProfile }
  >({
    mutationFn: async ({ userId, updates }) => updateUserProfile(userId, updates),
    
    // Optimistic update
    onMutate: async ({ userId, updates }) => {
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      
      const previous = queryClient.getQueryData<UserProfile>(USER_QUERY_KEYS.profile(userId));
      
      queryClient.setQueryData<UserProfile | undefined>(
        USER_QUERY_KEYS.profile(userId),
        (old) => (old ? { ...old, ...updates } : old)
      );
      
      return { previous };
    },
    
    onError: (_err, { userId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(USER_QUERY_KEYS.profile(userId), context.previous);
      }
    },
    
    onSuccess: (data, { userId }) => {
      console.log('✅ Profile updated successfully');
      const cacheKey = `user-profile-${userId}`;
      cache.set(cacheKey, data, TTL.FIFTEEN_MINUTES);
    },
  });
}

export function useToggleEnrolledCourse() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleCourseVars>({
    mutationFn: (vars) => toggleEnrolledCourse(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.enrolledCourses(userId) });
    },
  });
}

export function useToggleLikedQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleQuestionVars>({
    mutationFn: (vars) => toggleLikedQuestion(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
    },
  });
}

export function useToggleFavouriteRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleRestaurantVars>({
    mutationFn: (vars) => toggleFavouriteRestaurant(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
    },
  });
}

export function useToggleSavedEvent() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleEventVars>({
    mutationFn: (vars) => toggleSavedEvent(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.savedEvents(userId) });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
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