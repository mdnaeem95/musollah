/**
 * Restaurant Detail Hook
 *
 * Business logic for restaurant detail page.
 */

import { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  useRestaurantDetail,
  useRestaurantReviews,
  useUserFavorites,
  useToggleFavorite,
  // ❌ remove calculateAverageRating import to avoid type mismatch
} from '../../api/services/food';
import type { RestaurantReview as UIReview } from '../../utils/types';

function toIsoStringTimestamp(ts: unknown): string {
  // Firestore Timestamp
  if (ts && typeof ts === 'object' && typeof (ts as any).toDate === 'function') {
    return (ts as any).toDate().toISOString();
  }
  // numeric millis
  if (typeof ts === 'number') return new Date(ts).toISOString();
  // ISO string or fallback
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

// Local average calculator for UIReview[]
function averageFromUIReviews(reviews: UIReview[]): number {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Number((total / reviews.length).toFixed(1));
}

export function useRestaurantDetails(restaurantId: string | null) {
  const [showHours, setShowHours] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // Auth
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.uid || null;

  // Data queries
  const {
    data: restaurant,
    isLoading: isLoadingRestaurant,
    error: restaurantError,
  } = useRestaurantDetail(restaurantId);

  // Keep service as-is; normalize reviews here
  const { data: rawReviews = [], isLoading: isLoadingReviews } = useRestaurantReviews(restaurantId);

  const { data: favorites = [] } = useUserFavorites(userId);

  // Mutations
  const { mutate: toggleFavoriteMutation } = useToggleFavorite();

  // Normalize reviews to match utils/types RestaurantReview
  const reviews: UIReview[] = useMemo(() => {
    if (!restaurantId) return [];
    return rawReviews.map((r: any) => ({
      id: r.id,
      restaurantId,                                 // required by canonical type
      userId: r.userId,                             // optional
      rating: r.rating ?? 0,
      review: r.review ?? r.comment ?? '',          // support legacy "comment"
      timestamp: toIsoStringTimestamp(r.timestamp), // ISO string
      images: Array.isArray(r.images) ? r.images : [],
    }));
  }, [rawReviews, restaurantId]);

  // Computed values
  const isFavorited = useMemo(() => {
    if (!restaurantId) return false;
    return favorites.includes(restaurantId);
  }, [favorites, restaurantId]);

  const averageRating = useMemo(() => averageFromUIReviews(reviews), [reviews]);

  const isLoading = isLoadingRestaurant || isLoadingReviews;

  // Actions
  const toggleFavorite = () => {
    if (!isAuthenticated) {
      setIsAuthModalVisible(true);
      return;
    }
    if (!userId || !restaurantId) return;

    toggleFavoriteMutation({
      userId,
      restaurantId,
      isFavorited,
    });
  };

  const toggleHours = () => setShowHours(prev => !prev);
  const toggleSocials = () => setShowSocials(prev => !prev);
  const closeAuthModal = () => setIsAuthModalVisible(false);

  return {
    // State
    restaurant,
    reviews,            // ✅ matches utils/types for ReviewPreviewCarousel
    averageRating,
    isFavorited,
    isLoading,
    error: restaurantError,
    showHours,
    showSocials,
    isAuthModalVisible,

    // Actions
    toggleFavorite,
    toggleHours,
    toggleSocials,
    closeAuthModal,
  };
}
