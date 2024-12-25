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

const MAX_REVIEW_LENGTH = 500;

const SubmitReview = () => {
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const user = getAuth();
  const currentUser = user.currentUser;

  const { id } = useLocalSearchParams(); // Restaurant ID from the URL
  const router = useRouter();

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setSelectedImages((prev) => [...prev, selectedUri]);
    }
  }

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
        selectedImages.map((image, index) => uploadImageToFirebase(image, `reviews/${id}/image_${index}.jpg`)
      ));

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
    setRating(selectedRating)
  }

  const removeImage = (uri: string) => {
    setSelectedImages((prev) => prev.filter((image) => image!== uri));
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container}>
        <Text style={styles.label}>Rating (1-5):</Text>

        <AirbnbRating 
          count={5}
          defaultRating={0}
          size={30}
          onFinishRating={handleRatingCompleted}
          showRating={false}
          starContainerStyle={{ gap: 5 }}
        />

        <Text style={styles.label}>Your Review:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reviewText}
          onChangeText={(text) => {
            if (text.length <= MAX_REVIEW_LENGTH) setReviewText(text);
          }}
          multiline
          placeholder="Write your review here..."
        />
        <Text style={styles.characterCount}>{`${reviewText.length}/${MAX_REVIEW_LENGTH}`}</Text>

        <Text style={styles.label}>Images: </Text>
        <View style={styles.imageContainer}>
          {selectedImages.map((uri) => (
            <View key={uri} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(uri)}>
                <Text style={styles.removeText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addImage} onPress={handleImagePicker}>
            <Text style={styles.addText}>+ Add Image</Text>
          </TouchableOpacity>
        </View>


        <TouchableOpacity
          onPress={handleSubmit}
          //@ts-ignore
          style={[styles.button, (reviewText.trim() === '' || rating === 0) && styles.disabled]}
          disabled={loading || reviewText.trim() === '' || rating === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#F4E2C1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#F4E2C1',
    marginBottom: 16,
    fontFamily: 'Outfit_400Regular'
  },
  button: {
    backgroundColor: '#F4E2C1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  disabled: {
    color: '#CCC',
  },
  buttonText: {
    color: '#2E3D3A',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold'
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8
  },
  removeImage: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    padding: 5
  },
  removeText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12
  },
  addImage: {
    backgroundColor: '#3D4F4C',
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addText: {
    color: '#F4E2C1',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular'
  }
});

export default SubmitReview;
