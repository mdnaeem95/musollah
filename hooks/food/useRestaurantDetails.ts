/**
 * Restaurant Details Hook
 *
 * ✅ REFACTORED: Using structured logging system
 * ✅ IMPROVED: Better rating calculation, review normalization, error handling
 *
 * Business logic for restaurant detail page:
 * - Restaurant data loading
 * - Reviews with normalization
 * - Favorite toggle
 * - Average rating calculation
 * - UI state management
 *
 * @version 3.0
 * @since 2025-12-24
 */

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useRestaurantDetail, useRestaurantReviews, useUserFavorites, useToggleFavorite, RestaurantReview } from '../../api/services/food';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Restaurant Details');

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert various timestamp formats to millis (number)
 * Handles: Firestore Timestamp, number (millis), string (ISO)
 */
function toMillisTimestamp(ts: unknown): number {
  try {
    // Firestore Timestamp
    if (ts && typeof ts === 'object' && typeof (ts as any).toDate === 'function') {
      const date = (ts as any).toDate();
      return date.getTime();
    }

    // Numeric millis (or seconds - optional guard)
    if (typeof ts === 'number') {
      // If you ever store seconds, uncomment the guard:
      // const millis = ts < 1e12 ? ts * 1000 : ts;
      const date = new Date(ts);
      return isNaN(date.getTime()) ? Date.now() : date.getTime();
    }

    // ISO string
    if (typeof ts === 'string') {
      const date = new Date(ts);
      return isNaN(date.getTime()) ? Date.now() : date.getTime();
    }

    return Date.now();
  } catch (e) {
    return Date.now();
  }
}

/**
 * Calculate average rating from reviews
 * Filters invalid ratings and returns 1 decimal place
 */
function calculateAverageRating(reviews: RestaurantReview[]): number {
  if (!reviews || reviews.length === 0) {
    logger.debug('No reviews for average calculation');
    return 0;
  }
  
  // Filter valid ratings (1-5 stars)
  const validReviews = reviews.filter((r) => {
    const rating = r.rating;
    const isValid = typeof rating === 'number' && rating > 0 && rating <= 5;
    if (!isValid) {
      logger.warn('Invalid review rating', {
        reviewId: r.id,
        rating,
        ratingType: typeof rating,
      });
    }
    return isValid;
  });
  
  if (validReviews.length === 0) {
    logger.warn('No valid ratings found in reviews', {
      totalReviews: reviews.length,
    });
    return 0;
  }
  
  const total = validReviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Number((total / validReviews.length).toFixed(1));
  
  logger.debug('Average rating calculated', {
    totalReviews: reviews.length,
    validReviews: validReviews.length,
    average,
    distribution: {
      '5star': validReviews.filter(r => r.rating === 5).length,
      '4star': validReviews.filter(r => r.rating === 4).length,
      '3star': validReviews.filter(r => r.rating === 3).length,
      '2star': validReviews.filter(r => r.rating === 2).length,
      '1star': validReviews.filter(r => r.rating === 1).length,
    },
  });
  
  return average;
}

/**
 * Parse rating from various formats (string, number)
 */
function parseRating(rating: unknown): number {
  if (typeof rating === 'number') {
    return rating;
  }
  
  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    if (!isNaN(parsed)) {
      logger.debug('Parsed string rating', {
        original: rating,
        parsed,
      });
      return parsed;
    }
  }
  
  logger.warn('Could not parse rating', {
    rating,
    type: typeof rating,
  });
  return 0;
}

// ============================================================================
// HOOK
// ============================================================================

export function useRestaurantDetails(restaurantId: string | null) {
  logger.time('restaurant-details-init');
  logger.info('Initializing restaurant details', { restaurantId });

  // UI state
  const [showHours, setShowHours] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // Auth state
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.uid || null;

  logger.debug('Auth state', {
    isAuthenticated,
    hasUserId: !!userId,
  });

  // Data queries
  const {
    data: restaurant,
    isLoading: isLoadingRestaurant,
    error: restaurantError,
  } = useRestaurantDetail(restaurantId);

  const {
    data: rawReviews = [],
    isLoading: isLoadingReviews,
  } = useRestaurantReviews(restaurantId);

  const { data: favorites = [] } = useUserFavorites(userId);

  // Mutations
  const { mutate: toggleFavoriteMutation } = useToggleFavorite();

  // Log data loading status
  if (restaurant) {
    logger.debug('Restaurant data loaded', {
      restaurantId: restaurant.id,
      name: restaurant.name,
      hasCategories: !!restaurant.categories?.length,
      hasCoordinates: !!restaurant.coordinates,
      hasAverageRating: !!restaurant.averageRating,
    });
    logger.timeEnd('restaurant-details-init');
  }

  if (restaurantError) {
    logger.error('Restaurant loading failed', restaurantError as Error, {
      restaurantId,
    });
  }

  // Normalize reviews to match UI expectations
  const reviews: RestaurantReview[] = useMemo(() => {
    logger.time('normalize-reviews');
    
    if (!restaurantId) {
      logger.debug('No restaurantId, skipping review normalization');
      logger.timeEnd('normalize-reviews');
      return [];
    }
    
    if (rawReviews.length === 0) {
      logger.debug('No reviews to normalize');
      logger.timeEnd('normalize-reviews');
      return [];
    }
    
    logger.debug('Normalizing reviews', {
      restaurantId,
      rawCount: rawReviews.length,
      sampleReview: rawReviews[0],
    });
    
    const normalized = rawReviews.map((r: any, index: number) => {
      const rating = parseRating(r.rating);
      
      const review: RestaurantReview = {
        id: r.id,
        userId: r.userId,
        userName: r.userName ?? 'Anonymous',
        rating,
        comment: r.comment ?? r.review ?? '',
        timestamp: toMillisTimestamp(r.timestamp),
        images: Array.isArray(r.images) ? r.images : [],
      };
      
      if (index === 0) {
        logger.debug('Sample normalized review', {
          original: r,
          normalized: review,
        });
      }
      
      return review;
    });
    
    logger.success('Reviews normalized', {
      normalizedCount: normalized.length,
      withImages: normalized.filter(r => (r.images?.length ?? 0) > 0).length,
      averageRating: calculateAverageRating(normalized),
    });
    logger.timeEnd('normalize-reviews');
    
    return normalized;
  }, [rawReviews, restaurantId]);

  // Check if restaurant is favorited
  const isFavorited = useMemo(() => {
    if (!restaurantId) return false;
    
    const favorited = favorites.includes(restaurantId);
    logger.debug('Favorite status checked', {
      restaurantId,
      isFavorited: favorited,
      totalFavorites: favorites.length,
    });
    
    return favorited;
  }, [favorites, restaurantId]);

  // Calculate average rating (prioritize pre-calculated, fallback to reviews)
  const averageRating = useMemo(() => {
    logger.time('calculate-average-rating');
    
    // Try pre-calculated average from restaurant document
    if (restaurant?.averageRating) {
      const rating = parseRating(restaurant.averageRating);
      
      if (rating > 0 && rating <= 5) {
        logger.success('Using pre-calculated average rating', {
          rating,
          source: 'restaurant-document',
        });
        logger.timeEnd('calculate-average-rating');
        return rating;
      } else {
        logger.warn('Invalid pre-calculated rating', {
          rating,
          originalValue: restaurant.averageRating,
        });
      }
    }
    
    // Fallback to calculating from reviews
    const calculated = calculateAverageRating(reviews);
    logger.info('Using calculated average rating', {
      rating: calculated,
      source: 'reviews-calculation',
      reviewCount: reviews.length,
    });
    logger.timeEnd('calculate-average-rating');
    
    return calculated;
  }, [restaurant, reviews]);

  // Combined loading state
  const isLoading = isLoadingRestaurant || isLoadingReviews;

  // Actions
  const toggleFavorite = useCallback(() => {
    logger.debug('Toggle favorite triggered', {
      isAuthenticated,
      restaurantId,
      currentStatus: isFavorited,
    });
    
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
      action: isFavorited ? 'remove' : 'add',
    });

    toggleFavoriteMutation({
      userId,
      restaurantId,
      isFavorited: !isFavorited,
    }, {
      onSuccess: () => {
        logger.success('Favorite toggled successfully', {
          restaurantId,
          newStatus: !isFavorited,
        });
      },
      onError: (error) => {
        logger.error('Favorite toggle failed', error as Error, {
          userId,
          restaurantId,
          attemptedAction: isFavorited ? 'remove' : 'add',
        });
      },
    });
  }, [isAuthenticated, userId, restaurantId, isFavorited, toggleFavoriteMutation]);

  const toggleHours = useCallback(() => {
    const newState = !showHours;
    logger.debug(newState ? 'Showing hours' : 'Hiding hours', {
      restaurantId,
    });
    setShowHours(newState);
  }, [showHours, restaurantId]);

  const toggleSocials = useCallback(() => {
    const newState = !showSocials;
    logger.debug(newState ? 'Showing socials' : 'Hiding socials', {
      restaurantId,
    });
    setShowSocials(newState);
  }, [showSocials, restaurantId]);

  const closeAuthModal = useCallback(() => {
    logger.debug('Closing auth modal');
    setIsAuthModalVisible(false);
  }, []);

  return {
    // State
    restaurant,
    reviews,
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