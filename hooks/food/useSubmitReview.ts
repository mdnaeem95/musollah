/**
 * Submit Review Hook
 * 
 * Business logic for submitting restaurant reviews.
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSubmitReview } from '../../api/services/food';

const MAX_REVIEW_LENGTH = 500;
const MAX_IMAGES = 5;

export function useSubmitReviewPage(restaurantId: string) {
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview();

  const handleImagePicker = async () => {
    if (selectedImages.length >= MAX_IMAGES) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Sign in Required',
        'You need to be signed in to write a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => setAuthModalVisible(true) },
        ]
      );
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write something before submitting.');
      return;
    }

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
          Alert.alert('Success', 'Review submitted successfully!');
          router.back();
        },
        onError: (error: any) => {
          console.error('Error submitting review:', error);
          Alert.alert('Error', 'Failed to submit the review.');
        },
      }
    );
  };

  const removeImage = (uri: string) => {
    setSelectedImages((prev) => prev.filter((img) => img !== uri));
  };

  const handleReviewTextChange = (text: string) => {
    if (text.length <= MAX_REVIEW_LENGTH) {
      setReviewText(text);
    }
  };

  const canSubmit = reviewText.trim() !== '' && rating > 0 && !isSubmitting;

  return {
    // State
    rating,
    reviewText,
    selectedImages,
    isSubmitting,
    authModalVisible,
    canSubmit,
    
    // Constants
    MAX_REVIEW_LENGTH,
    MAX_IMAGES,
    
    // Actions
    setRating,
    handleReviewTextChange,
    handleImagePicker,
    handleSubmit,
    removeImage,
    setAuthModalVisible,
  };
}