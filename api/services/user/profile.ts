/**
 * User Profile Service
 * 
 * Manages user profile data, enrolled courses, and social features.
 * Add this to api/services/user/profile.ts
 * 
 * Authentication is handled by useAuthStore.
 * This service handles user profile data only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firestore from '@react-native-firebase/firestore';
import { cache, TTL } from '../../client/storage';

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
// API FUNCTIONS
// ============================================================================

/**
 * Fetch user profile from Firestore
 */
async function fetchUserProfile(userId: string): Promise<UserProfile> {
  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new Error('User profile not found');
    }
    
    const data = userDoc.data()!;
    
    return {
      id: userId,
      name: data.name || 'User',
      email: data.email || '',
      avatarUrl: data.avatarUrl || 'https://via.placeholder.com/100',
      aboutMe: data.aboutMe || '',
      interests: data.interests || [],
      role: data.role || 'user',
      followers: data.followers || {},
      following: data.following || {},
      enrolledCourses: data.enrolledCourses || [],
      likedQuestions: data.likedQuestions || [],
      favouriteRestaurants: data.favouriteRestaurants || [],
      savedEvents: data.savedEvents || [],
      createdAt: data.createdAt,
      referralCode: data.referralCode,
      referralCount: data.referralCount || 0,
    };
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    await userRef.update(updates);
    
    console.log('✅ User profile updated');
    
    // Fetch updated profile
    return await fetchUserProfile(userId);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
}

/**
 * Toggle enrolled course
 * (refactored to accept a single variables object)
 */
async function toggleEnrolledCourse(vars: ToggleCourseVars): Promise<void> {
  const { userId, courseId, enrolled } = vars;
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    if (enrolled) {
      await userRef.update({
        enrolledCourses: firestore.FieldValue.arrayUnion(courseId),
      });
    } else {
      await userRef.update({
        enrolledCourses: firestore.FieldValue.arrayRemove(courseId),
      });
    }
    
    console.log(`✅ Course ${enrolled ? 'enrolled' : 'unenrolled'}: ${courseId}`);
  } catch (error) {
    console.error('❌ Error toggling course:', error);
    throw error;
  }
}

/**
 * Toggle liked question
 */
async function toggleLikedQuestion(vars: ToggleQuestionVars): Promise<void> {
  const { userId, questionId, liked } = vars;
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    if (liked) {
      await userRef.update({
        likedQuestions: firestore.FieldValue.arrayUnion(questionId),
      });
    } else {
      await userRef.update({
        likedQuestions: firestore.FieldValue.arrayRemove(questionId),
      });
    }
    
    console.log(`✅ Question ${liked ? 'liked' : 'unliked'}: ${questionId}`);
  } catch (error) {
    console.error('❌ Error toggling question like:', error);
    throw error;
  }
}

/**
 * Toggle favourite restaurant
 */
async function toggleFavouriteRestaurant(vars: ToggleRestaurantVars): Promise<void> {
  const { userId, restaurantId, favourite } = vars;
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    if (favourite) {
      await userRef.update({
        favouriteRestaurants: firestore.FieldValue.arrayUnion(restaurantId),
      });
    } else {
      await userRef.update({
        favouriteRestaurants: firestore.FieldValue.arrayRemove(restaurantId),
      });
    }
    
    console.log(`✅ Restaurant ${favourite ? 'favourited' : 'unfavourited'}: ${restaurantId}`);
  } catch (error) {
    console.error('❌ Error toggling restaurant favourite:', error);
    throw error;
  }
}

/**
 * Toggle saved event
 */
async function toggleSavedEvent(vars: ToggleEventVars): Promise<void> {
  const { userId, eventId, saved } = vars;
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    if (saved) {
      await userRef.update({
        savedEvents: firestore.FieldValue.arrayUnion(eventId),
      });
    } else {
      await userRef.update({
        savedEvents: firestore.FieldValue.arrayRemove(eventId),
      });
    }
    
    console.log(`✅ Event ${saved ? 'saved' : 'unsaved'}: ${eventId}`);
  } catch (error) {
    console.error('❌ Error toggling event save:', error);
    throw error;
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Fetch user profile
 */
export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile(userId ?? 'anon'),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const cacheKey = `user-profile-${userId}`;
      const cached = cache.get<UserProfile>(cacheKey);
      
      if (cached) {
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
  });
}

/**
 * Update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation<UserProfile, unknown, { userId: string; updates: UpdateProfileData }, { previous?: UserProfile }>({
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

/**
 * Toggle enrolled course
 */
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

/**
 * Toggle liked question
 */
export function useToggleLikedQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleQuestionVars>({
    mutationFn: (vars) => toggleLikedQuestion(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
    },
  });
}

/**
 * Toggle favourite restaurant
 */
export function useToggleFavouriteRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleRestaurantVars>({
    mutationFn: (vars) => toggleFavouriteRestaurant(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
    },
  });
}

/**
 * Toggle saved event
 */
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

/**
 * Check if user is enrolled in a course
 */
export function useIsEnrolledInCourse(userId: string | null, courseId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.enrolledCourses.includes(courseId) ?? false;
}

/**
 * Check if user liked a question
 */
export function useIsQuestionLiked(userId: string | null, questionId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.likedQuestions.includes(questionId) ?? false;
}

/**
 * Check if restaurant is favourited
 */
export function useIsRestaurantFavourited(userId: string | null, restaurantId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.favouriteRestaurants.includes(restaurantId) ?? false;
}

/**
 * Check if event is saved
 */
export function useIsEventSaved(userId: string | null, eventId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.savedEvents.includes(eventId) ?? false;
}

/**
 * Get follower/following counts
 */
export function useSocialCounts(userId: string | null) {
  const { data: profile } = useUserProfile(userId);
  
  if (!profile) return { followerCount: 0, followingCount: 0 };
  
  return {
    followerCount: Object.keys(profile.followers).length,
    followingCount: Object.keys(profile.following).length,
  };
}
