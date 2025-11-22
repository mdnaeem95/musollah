import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, FieldValue, storageService } from '../../client/firebase';
import { cache, TTL } from '../../client/storage';

// ============================================================================
// TYPES
// ============================================================================

export interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  image?: string;
  hours?: string;
  website?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
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
// API FUNCTIONS
// ============================================================================

async function fetchRestaurantsFromFirebase(): Promise<Restaurant[]> {
  try {
    console.log('🌐 Fetching restaurants from Firebase');
    
    const snapshot = await db.collection('restaurants').get();
    
    const restaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[];
    
    console.log(`✅ Fetched ${restaurants.length} restaurants`);
    return restaurants;
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    throw error;
  }
}

async function fetchRestaurantByIdFromFirebase(id: string): Promise<Restaurant> {
  try {
    console.log(`🌐 Fetching restaurant: ${id}`);
    
    const doc = await db.collection('restaurants').doc(id).get();
    
    if (!doc.exists) {
      throw new Error('Restaurant not found');
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as Restaurant;
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
    throw error;
  }
}

async function fetchReviewsFromFirebase(restaurantId: string): Promise<RestaurantReview[]> {
  try {
    console.log(`🌐 Fetching reviews for: ${restaurantId}`);
    
    const snapshot = await db
      .collection('restaurants')
      .doc(restaurantId)
      .collection('reviews')
      .orderBy('timestamp', 'desc')
      .get();
    
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RestaurantReview[];
    
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
    
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return [];
    }
    
    const data = doc.data();
    return data?.favouriteRestaurants || [];
  } catch (error) {
    console.error('❌ Error fetching favorites:', error);
    return [];
  }
}

async function addToFavoritesInFirebase(userId: string, restaurantId: string): Promise<void> {
  try {
    console.log(`➕ Adding restaurant ${restaurantId} to favorites`);
    
    await db.collection('users').doc(userId).update({
      favouriteRestaurants: FieldValue.arrayUnion(restaurantId)
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
    
    await db.collection('users').doc(userId).update({
      favouriteRestaurants: FieldValue.arrayRemove(restaurantId)
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
  // Create the review doc first to get a stable ID for storage paths
  const reviewRef = db
    .collection('restaurants')
    .doc(restaurantId)
    .collection('reviews')
    .doc();
  const reviewId = reviewRef.id;

  // Upload images (if any) and collect download URLs
  const imageUrls: string[] = [];
  for (let i = 0; i < (imageUris?.length ?? 0); i++) {
    const localUri = imageUris[i];
    const ext = localUri.split('.').pop() || 'jpg';
    const objectPath = `restaurants/${restaurantId}/reviews/${reviewId}/${i}.${ext}`;

    // RN Firebase Storage: use putFile on file:// URIs
    const ref = storageService.ref(objectPath);
    await ref.putFile(localUri);
    const url = await ref.getDownloadURL();
    imageUrls.push(url);
  }

  // Write the review document (keep your service's shape: comment + numeric timestamp)
  await reviewRef.set({
    userId,
    userName,
    rating,
    comment: reviewText,
    timestamp: Date.now(),
    images: imageUrls,
  });
}

// ============================================================================
// QUERY KEYS
// ============================================================================

const RESTAURANT_QUERY_KEYS = {
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
      
      // Cache for 1 day (restaurant data changes infrequently)
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
      
      // Cache for 1 hour
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
      
      // Cache for 5 minutes
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
    queryFn: async () => {
      const favorites = await fetchUserFavoritesFromFirebase(userId!);
      return favorites;
    },
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
      if (isFavorited) {
        await removeFromFavoritesInFirebase(userId, restaurantId);
      } else {
        await addToFavoritesInFirebase(userId, restaurantId);
      }
    },
    
    // Optimistic update
    onMutate: async ({ userId, restaurantId, isFavorited }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: RESTAURANT_QUERY_KEYS.favorites(userId),
      });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData<string[]>(
        RESTAURANT_QUERY_KEYS.favorites(userId)
      );

      // Optimistically update
      queryClient.setQueryData<string[]>(
        RESTAURANT_QUERY_KEYS.favorites(userId),
        (old = []) => {
          return isFavorited
            ? old.filter(id => id !== restaurantId)
            : [...old, restaurantId];
        }
      );

      return { previousFavorites };
    },
    
    // Rollback on error
    onError: (err, { userId }, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          RESTAURANT_QUERY_KEYS.favorites(userId),
          context.previousFavorites
        );
      }
    },
    
    // Refetch on success
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: RESTAURANT_QUERY_KEYS.favorites(userId),
      });
    },
  });
}

export function useRestaurantCategories() {
  const { data: restaurants } = useRestaurants();
  
  return {
    categories: restaurants 
      ? Array.from(new Set(restaurants.flatMap(r => r.categories)))
      : [],
  };
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: SubmitReviewParams) => submitReviewToFirebase(vars),
    onSuccess: (_data, vars) => {
      // Refresh the reviews list for this restaurant
      queryClient.invalidateQueries({
        queryKey: RESTAURANT_QUERY_KEYS.reviews(vars.restaurantId),
      });
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

export function searchRestaurants(
  restaurants: Restaurant[],
  query: string
): Restaurant[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) return restaurants;
  
  return restaurants.filter(restaurant => {
    const name = restaurant.name?.toLowerCase() || '';
    const address = restaurant.address?.toLowerCase() || '';
    const categories = restaurant.categories || [];
    
    return (
      name.includes(lowerQuery) ||
      address.includes(lowerQuery) ||
      categories.some(cat => cat?.toLowerCase().includes(lowerQuery))
    );
  });
}