import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AirbnbRating } from 'react-native-ratings';
import { submitReview } from '../../../../../api/firebase';
import { getAuth } from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToFirebase } from '../../../../../api/storage/uploadImage';
import { useTheme } from '../../../../../context/ThemeContext';

const MAX_REVIEW_LENGTH = 500;

const SubmitReview = () => {
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const user = getAuth();
  const currentUser = user.currentUser;

  const { id } = useLocalSearchParams(); // Restaurant ID from the URL
  const router = useRouter();

  const { theme } = useTheme();

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setSelectedImages((prev) => [...prev, selectedUri]);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to submit a review.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write something before submitting.');
      return;
    }

    try {
      setLoading(true);

      // upload images to storage
      const uploadedImageUrls = await Promise.all(
        selectedImages.map((image, index) =>
          uploadImageToFirebase(image, `reviews/${id}/image_${index}.jpg`)
        )
      );

      await submitReview(id as string, currentUser.uid, rating, reviewText, uploadedImageUrls);
      Alert.alert('Success', 'Review submitted successfully!');
      router.back(); // Navigate back to the restaurant details page
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit the review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingCompleted = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const removeImage = (uri: string) => {
    setSelectedImages((prev) => prev.filter((image) => image !== uri));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>Rating (1-5):</Text>

        <AirbnbRating
          count={5}
          defaultRating={5}
          size={30}
          onFinishRating={handleRatingCompleted}
          showRating={false}
          starContainerStyle={{ gap: 5 }}
        />

        <Text style={[styles.label, { color: theme.colors.text.primary }]}>Your Review:</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.secondary,
              color: theme.colors.text.primary,
            },
          ]}
          value={reviewText}
          onChangeText={(text) => {
            if (text.length <= MAX_REVIEW_LENGTH) setReviewText(text);
          }}
          multiline
          placeholder="Write your review here..."
          placeholderTextColor={theme.colors.text.muted}
        />
        <Text
          style={[
            styles.characterCount,
            { color: theme.colors.text.secondary },
          ]}
        >{`${reviewText.length}/${MAX_REVIEW_LENGTH}`}</Text>

        <Text style={[styles.label, { color: theme.colors.text.primary }]}>Images: </Text>
        <View style={styles.imageContainer}>
          {selectedImages.map((uri) => (
            <View key={uri} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={[styles.removeImage, { backgroundColor: theme.colors.text.error }]}
                onPress={() => removeImage(uri)}
              >
                <Text style={[styles.removeText, { color: theme.colors.text.primary }]}>
                  X
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[
              styles.addImage,
              { backgroundColor: theme.colors.secondary },
            ]}
            onPress={handleImagePicker}
          >
            <Text style={[styles.addText, { color: theme.colors.text.primary }]}>
              + Add Image
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.button,
            (reviewText.trim() === '' || rating === 0) && styles.disabled,
            { backgroundColor: theme.colors.accent },
          ]}
          disabled={loading || reviewText.trim() === '' || rating === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.text.primary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
              Submit Review
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Outfit_600SemiBold',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    marginBottom: 16,
    fontFamily: 'Outfit_400Regular',
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 10,
    padding: 5,
  },
  removeText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
  },
  addImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});

export default SubmitReview;