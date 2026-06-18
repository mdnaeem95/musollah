/**
 * Restaurant Details Hook
 *
 * Business logic for the restaurant detail page:
 * - Restaurant data loading
 * - Favorite toggle
 * - Aggregated (Google) rating exposure
 * - UI state management
 *
 * Note: user-submitted reviews were removed — the app surfaces the aggregated
 * Google Places rating instead of user-generated content.
 *
 * @version 4.0
 */

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRestaurantDetail, useUserFavorites, useToggleFavorite } from '../../api/services/food';

import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Restaurant Details');

/**
 * Parse a rating from various formats (string, number) into a number.
 */
function parseRating(rating: unknown): number {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

export function useRestaurantDetails(restaurantId: string | null) {
  logger.info('Initializing restaurant details', { restaurantId });

  // UI state
  const [showHours, setShowHours] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // Auth state
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.uid || null;

  // Data queries
  const {
    data: restaurant,
    isLoading,
    error: restaurantError,
  } = useRestaurantDetail(restaurantId);

  const { data: favorites = [] } = useUserFavorites(userId);

  // Mutations
  const { mutate: toggleFavoriteMutation } = useToggleFavorite();

  if (restaurantError) {
    logger.error('Restaurant loading failed', restaurantError as Error, { restaurantId });
  }

  // Aggregated rating from the restaurant document (Google Places rating).
  const rating = useMemo(() => {
    const r = parseRating(restaurant?.rating);
    return r > 0 && r <= 5 ? r : 0;
  }, [restaurant]);

  // Check if restaurant is favorited
  const isFavorited = useMemo(() => {
    if (!restaurantId) return false;
    return favorites.includes(restaurantId);
  }, [favorites, restaurantId]);

  // Actions
  const toggleFavorite = useCallback(() => {
    // Check authentication
    if (!isAuthenticated) {
      logger.info('User not authenticated, showing auth modal');
      setIsAuthModalVisible(true);
      return;
    }

    // Validate required data
    if (!userId || !restaurantId) {
      logger.warn('Cannot toggle favorite, missing data', {
        hasUserId: !!userId,
        hasRestaurantId: !!restaurantId,
      });
      return;
    }

    logger.info(isFavorited ? 'Removing from favorites' : 'Adding to favorites', {
      userId,
      restaurantId,
    });

    toggleFavoriteMutation(
      { userId, restaurantId, isFavorited: !isFavorited },
      {
        onSuccess: () => {
          logger.success('Favorite toggled successfully', { restaurantId, newStatus: !isFavorited });
        },
        onError: (err) => {
          logger.error('Favorite toggle failed', err as Error, { userId, restaurantId });
        },
      }
    );
  }, [isAuthenticated, userId, restaurantId, isFavorited, toggleFavoriteMutation]);

  const toggleHours = useCallback(() => setShowHours((s) => !s), []);
  const toggleSocials = useCallback(() => setShowSocials((s) => !s), []);
  const closeAuthModal = useCallback(() => setIsAuthModalVisible(false), []);

  return {
    // State
    restaurant,
    rating,
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
