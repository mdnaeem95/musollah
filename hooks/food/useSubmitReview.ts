/**
 * Submit Review Hook
 *
 * ✅ REFACTORED: Using structured logging system
 * ✅ IMPROVED: Image upload tracking, validation logging, submission flow tracking
 *
 * Business logic for submitting restaurant reviews:
 * - Rating selection
 * - Review text input with character limit
 * - Image picker (up to 5 images)
 * - Form validation
 * - Review submission with error handling
 * - Authentication checks
 *
 * @version 3.0
 * @since 2025-12-24
 */

import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSubmitReview } from '../../api/services/food';

// ✅ Import structured logging
import { createLogger } from '../../services/logging/logger';

// ✅ Create category-specific logger
const logger = createLogger('Submit Review');

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_REVIEW_LENGTH = 500;
const MAX_IMAGES = 5;

// ============================================================================
// HOOK
// ============================================================================

export function useSubmitReviewPage(restaurantId: string) {
  logger.time('submit-review-init');
  logger.info('Initializing submit review page', { restaurantId });

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Auth state
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // Review submission mutation
  const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview();

  logger.debug('Initial state', {
    restaurantId,
    isAuthenticated,
    hasUser: !!user,
    defaultRating: rating,
  });
  logger.timeEnd('submit-review-init');

  // Image picker handler
  const handleImagePicker = useCallback(async () => {
    logger.time('image-picker');
    
    // Check image limit
    if (selectedImages.length >= MAX_IMAGES) {
      logger.warn('Image limit reached', {
        currentCount: selectedImages.length,
        maxLimit: MAX_IMAGES,
      });
      Alert.alert(
        'Image Limit Reached',
        `You can only add up to ${MAX_IMAGES} images.`
      );
      logger.timeEnd('image-picker');
      return;
    }

    logger.debug('Opening image picker', {
      currentImages: selectedImages.length,
      remainingSlots: MAX_IMAGES - selectedImages.length,
    });

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled) {
        logger.debug('Image picker canceled by user');
        logger.timeEnd('image-picker');
        return;
      }

      if (result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        
        logger.success('Image selected', {
          uri: imageUri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
          newImageCount: selectedImages.length + 1,
        });
        
        setSelectedImages((prev) => [...prev, imageUri]);
      } else {
        logger.warn('Image picker returned no assets');
      }
      
      logger.timeEnd('image-picker');
    } catch (error) {
      logger.error('Image picker failed', error as Error, {
        currentImages: selectedImages.length,
      });
      logger.timeEnd('image-picker');
      
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.'
      );
    }
  }, [selectedImages]);

  // Submit review handler
  const handleSubmit = useCallback(() => {
    logger.time('submit-review');
    logger.info('Review submission started', {
      restaurantId,
      rating,
      reviewLength: reviewText.trim().length,
      imageCount: selectedImages.length,
      isAuthenticated,
    });

    // Authentication check
    if (!isAuthenticated || !user) {
      logger.warn('User not authenticated, showing auth modal', {
        isAuthenticated,
        hasUser: !!user,
      });
      
      Alert.alert(
        'Sign in Required',
        'You need to be signed in to write a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => {
              logger.debug('Opening auth modal');
              setAuthModalVisible(true);
            },
          },
        ]
      );
      logger.timeEnd('submit-review');
      return;
    }

    // Validation: Review text required
    if (!reviewText.trim()) {
      logger.warn('Review submission failed - empty text', {
        rawLength: reviewText.length,
        trimmedLength: reviewText.trim().length,
      });
      
      Alert.alert('Error', 'Please write something before submitting.');
      logger.timeEnd('submit-review');
      return;
    }

    // Validation: Rating must be valid
    if (rating <= 0 || rating > 5) {
      logger.error('Invalid rating value', new Error('Invalid rating'), {
        rating,
        validRange: '1-5',
      });
      
      Alert.alert('Error', 'Please select a valid rating.');
      logger.timeEnd('submit-review');
      return;
    }

    logger.debug('Validation passed, submitting review', {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      rating,
      reviewLength: reviewText.trim().length,
      imageCount: selectedImages.length,
    });

    // Submit review
    submitReview(
      {
        restaurantId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating,
        reviewText: reviewText.trim(),
        imageUris: selectedImages,
      },
      {
        onSuccess: () => {
          logger.success('Review submitted successfully', {
            restaurantId,
            userId: user.uid,
            rating,
            reviewLength: reviewText.trim().length,
            imageCount: selectedImages.length,
          });
          logger.timeEnd('submit-review');
          
          Alert.alert('Success', 'Review submitted successfully!');
          router.back();
        },
        onError: (error: any) => {
          logger.error('Review submission failed', error, {
            restaurantId,
            userId: user.uid,
            rating,
            reviewLength: reviewText.trim().length,
            imageCount: selectedImages.length,
            errorMessage: error?.message,
            errorCode: error?.code,
          });
          logger.timeEnd('submit-review');
          
          Alert.alert(
            'Error',
            'Failed to submit the review. Please try again.'
          );
        },
      }
    );
  }, [
    isAuthenticated,
    user,
    restaurantId,
    rating,
    reviewText,
    selectedImages,
    submitReview,
    router,
  ]);

  // Remove image handler
  const removeImage = useCallback((uri: string) => {
    logger.debug('Removing image', {
      uri,
      currentCount: selectedImages.length,
    });
    
    setSelectedImages((prev) => {
      const newImages = prev.filter((img) => img !== uri);
      
      logger.success('Image removed', {
        removedUri: uri,
        previousCount: prev.length,
        newCount: newImages.length,
      });
      
      return newImages;
    });
  }, [selectedImages]);

  // Review text change handler with character limit
  const handleReviewTextChange = useCallback((text: string) => {
    if (text.length > MAX_REVIEW_LENGTH) {
      logger.warn('Text exceeds character limit', {
        attemptedLength: text.length,
        maxLength: MAX_REVIEW_LENGTH,
        overflow: text.length - MAX_REVIEW_LENGTH,
      });
      return;
    }
    
    logger.debug('Review text updated', {
      newLength: text.length,
      remainingChars: MAX_REVIEW_LENGTH - text.length,
      percentage: ((text.length / MAX_REVIEW_LENGTH) * 100).toFixed(1) + '%',
    });
    
    setReviewText(text);
  }, []);

  // Rating change handler
  const handleRatingChange = useCallback((newRating: number) => {
    logger.debug('Rating changed', {
      previousRating: rating,
      newRating,
      change: newRating - rating,
    });
    
    setRating(newRating);
  }, [rating]);

  // Form validation state
  const canSubmit = useMemo(() => {
    const isValid = reviewText.trim() !== '' && rating > 0 && !isSubmitting;
    
    logger.debug('Form validation checked', {
      hasText: reviewText.trim() !== '',
      hasValidRating: rating > 0,
      isSubmitting,
      canSubmit: isValid,
    });
    
    return isValid;
  }, [reviewText, rating, isSubmitting]);

  // Character count for display
  const characterCount = useMemo(() => {
    const count = reviewText.length;
    const remaining = MAX_REVIEW_LENGTH - count;
    const percentage = (count / MAX_REVIEW_LENGTH) * 100;
    
    return {
      current: count,
      max: MAX_REVIEW_LENGTH,
      remaining,
      percentage,
      isNearLimit: percentage > 80,
      isAtLimit: percentage >= 100,
    };
  }, [reviewText]);

  return {
    // State
    rating,
    reviewText,
    selectedImages,
    isSubmitting,
    authModalVisible,
    canSubmit,
    characterCount,
    
    // Constants
    MAX_REVIEW_LENGTH,
    MAX_IMAGES,
    
    // Computed
    hasImages: selectedImages.length > 0,
    canAddMoreImages: selectedImages.length < MAX_IMAGES,
    
    // Actions
    setRating: handleRatingChange,
    handleReviewTextChange,
    handleImagePicker,
    handleSubmit,
    removeImage,
    setAuthModalVisible,
  };
}