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

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

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

export function useToggleFavouriteRestaurant() {
  const queryClient = useQueryClient();
  
  return useMutation<void, unknown, ToggleRestaurantVars>({
    mutationFn: (vars) => toggleFavouriteRestaurant(vars),
    
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(userId) });
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useIsRestaurantFavourited(userId: string | null, restaurantId: string) {
  const { data: profile } = useUserProfile(userId);
  return profile?.favouriteRestaurants.includes(restaurantId) ?? false;
}