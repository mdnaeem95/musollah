/**
 * Submit Review Page (REDESIGNED)
 * 
 * Modern review submission with enhanced UI, better image picker, and animations.
 * 
 * @version 2.0
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AirbnbRating } from 'react-native-ratings';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../../context/ThemeContext';
import SignInModal from '../../../../../components/SignInModal';
import { useSubmitReviewPage } from '../../../../../hooks/food/useSubmitReview';

const RATING_DESCRIPTIONS = [
  { rating: 1, label: 'Terrible', emoji: '😞' },
  { rating: 2, label: 'Poor', emoji: '😕' },
  { rating: 3, label: 'Average', emoji: '😐' },
  { rating: 4, label: 'Good', emoji: '😊' },
  { rating: 5, label: 'Excellent', emoji: '🤩' },
];

const SubmitReview = () => {
  const { id } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  const {
    rating,
    reviewText,
    selectedImages,
    isSubmitting,
    authModalVisible,
    canSubmit,
    MAX_REVIEW_LENGTH,
    MAX_IMAGES,
    setRating,
    handleReviewTextChange,
    handleImagePicker,
    handleSubmit,
    removeImage,
    setAuthModalVisible,
  } = useSubmitReviewPage(id as string);

  const currentRatingInfo = RATING_DESCRIPTIONS.find(r => r.rating === rating) || RATING_DESCRIPTIONS[4];

  const handleRatingChange = (newRating: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRating(newRating);
  };

  const handleImageRemove = (uri: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    removeImage(uri);
  };

  const handleSubmitPress = async () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await handleSubmit();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.primary }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6 name="pen-to-square" size={24} color={theme.colors.accent} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              Share Your Experience
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Help others discover great halal food
            </Text>
          </View>
        </MotiView>

        {/* Rating Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 100, damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.section, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="star" size={16} color={theme.colors.accent} solid />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Rating
              </Text>
            </View>

            <AirbnbRating
              count={5}
              defaultRating={5}
              size={36}
              onFinishRating={handleRatingChange}
              showRating={false}
              selectedColor="#FFD700"
              starContainerStyle={styles.starContainer}
            />

            <View style={[styles.ratingFeedback, { backgroundColor: theme.colors.accent + '10' }]}>
              <Text style={styles.ratingEmoji}>{currentRatingInfo.emoji}</Text>
              <Text style={[styles.ratingLabel, { color: theme.colors.accent }]}>
                {currentRatingInfo.label}
              </Text>
            </View>
          </BlurView>
        </MotiView>

        {/* Review Text Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200, damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.section, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="message" size={16} color={theme.colors.accent} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Your Review
              </Text>
            </View>

            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.text.primary,
                  borderColor: reviewText.length > 0 ? theme.colors.accent : theme.colors.text.muted + '30',
                },
              ]}
              multiline
              value={reviewText}
              onChangeText={handleReviewTextChange}
              placeholder="What did you think? Share details about the food, service, atmosphere..."
              placeholderTextColor={theme.colors.text.muted}
              maxLength={MAX_REVIEW_LENGTH}
              textAlignVertical="top"
            />

            <View style={styles.textAreaFooter}>
              <Text style={[styles.characterHint, { color: theme.colors.text.muted }]}>
                Minimum 10 characters
              </Text>
              <Text
                style={[
                  styles.characterCount,
                  {
                    color:
                      reviewText.length > MAX_REVIEW_LENGTH * 0.9
                        ? '#ff6b6b'
                        : theme.colors.text.secondary,
                  },
                ]}
              >
                {reviewText.length}/{MAX_REVIEW_LENGTH}
              </Text>
            </View>
          </BlurView>
        </MotiView>

        {/* Images Section */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 300, damping: 20 }}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.section, { backgroundColor: theme.colors.secondary }]}
          >
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="images" size={16} color={theme.colors.accent} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Photos
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.muted }]}>
                (Optional, max {MAX_IMAGES})
              </Text>
            </View>

            <View style={styles.imageGrid}>
              {selectedImages.map((uri, index) => (
                <MotiView
                  key={uri}
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: index * 50, damping: 15 }}
                  style={styles.imageWrapper}
                >
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleImageRemove(uri)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View style={styles.removeImageCircle}>
                      <FontAwesome6 name="xmark" size={12} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}

              {selectedImages.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    { backgroundColor: theme.colors.primary, borderColor: theme.colors.accent + '30' },
                  ]}
                  onPress={handleImagePicker}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="camera" size={24} color={theme.colors.accent} />
                  <Text style={[styles.addImageText, { color: theme.colors.accent }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedImages.length > 0 && (
              <Text style={[styles.imageHint, { color: theme.colors.text.muted }]}>
                <FontAwesome6 name="circle-info" size={12} color={theme.colors.text.muted} />{' '}
                Tap X to remove a photo
              </Text>
            )}
          </BlurView>
        </MotiView>

        {/* Submit Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400, damping: 20 }}
        >
          <TouchableOpacity
            onPress={handleSubmitPress}
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.accent },
              !canSubmit && styles.submitButtonDisabled,
            ]}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="paper-plane" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>

          {!canSubmit && !isSubmitting && (
            <Text style={[styles.submitHint, { color: theme.colors.text.muted }]}>
              Please add a rating and write at least 10 characters
            </Text>
          )}
        </MotiView>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />

        {/* Sign In Modal */}
        <SignInModal isVisible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 'auto',
  },
  starContainer: {
    gap: 8,
    marginBottom: 16,
  },
  ratingFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  ratingEmoji: {
    fontSize: 28,
  },
  ratingLabel: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  textArea: {
    height: 140,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    borderWidth: 1.5,
    lineHeight: 22,
  },
  textAreaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterHint: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  removeImageCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  imageHint: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  submitHint: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginTop: 12,
  },
  bottomPadding: {
    height: 20,
  },
});

export default SubmitReview;