import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert,
  TouchableOpacity, ActivityIndicator, Image,
  ScrollView, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AirbnbRating } from 'react-native-ratings';
import { getAuth } from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';

import { useTheme } from '../../../../../context/ThemeContext';
import { submitReview } from '../../../../../api/firebase';
import { uploadImageToFirebase } from '../../../../../api/storage/uploadImage';
import SignInModal from '../../../../../components/SignInModal';

const MAX_REVIEW_LENGTH = 500;
const MAX_IMAGES = 5;

const SubmitReview = () => {
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const user = getAuth();
  const currentUser = user.currentUser;
  const { id } = useLocalSearchParams(); // Restaurant ID
  const router = useRouter();
  const { theme } = useTheme();

  const showAuthAlert = () => {
    Alert.alert(
      "Sign in Required",
      "You need to be signed in to write a review.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => setAuthModalVisible(true) } // Redirect to login
      ]
    );
  };

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

  const handleSubmit = async () => {
    if (!currentUser) {
      showAuthAlert();
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write something before submitting.');
      return;
    }

    try {
      setLoading(true);

      const uploadedImageUrls = await Promise.all(
        selectedImages.map((uri, idx) =>
          uploadImageToFirebase(uri, `reviews/${id}/image_${idx}.jpg`)
        )
      );

      await submitReview(id as string, currentUser.uid, rating, reviewText, uploadedImageUrls);
      Alert.alert('Success', 'Review submitted successfully!');
      router.back();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit the review.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (uri: string) => {
    setSelectedImages((prev) => prev.filter((img) => img !== uri));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} delay={100}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Rating (1-5):</Text>
          <AirbnbRating
            count={5}
            defaultRating={5}
            size={30}
            onFinishRating={setRating}
            showRating={false}
            starContainerStyle={{ gap: 5 }}
          />
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} delay={200}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Your Review:</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.colors.secondary, color: theme.colors.text.primary },
            ]}
            multiline
            value={reviewText}
            onChangeText={(text) => {
              if (text.length <= MAX_REVIEW_LENGTH) setReviewText(text);
            }}
            placeholder="Write your review here..."
            placeholderTextColor={theme.colors.text.muted}
          />
          <Text style={[styles.characterCount, { color: theme.colors.text.secondary }]}>
            {`${reviewText.length}/${MAX_REVIEW_LENGTH}`}
          </Text>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} delay={300}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>Images:</Text>
          <View style={styles.imageContainer}>
            {selectedImages.map((uri) => (
              <View key={uri} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={[styles.removeImage, { backgroundColor: theme.colors.text.error }]}
                  onPress={() => removeImage(uri)}
                >
                  <Text style={[styles.removeText, { color: theme.colors.text.primary }]}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
            {selectedImages.length < MAX_IMAGES && (
              <TouchableOpacity
                style={[styles.addImage, { backgroundColor: theme.colors.secondary }]}
                onPress={handleImagePicker}
              >
                <Text style={[styles.addText, { color: theme.colors.text.primary }]}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </MotiView>

        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} delay={400}>
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
        </MotiView>
        <SignInModal isVisible={authModalVisible} onClose={() => setAuthModalVisible(false)} />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, marginBottom: 8, fontFamily: 'Outfit_600SemiBold' },
  input: { padding: 12, borderRadius: 8, marginBottom: 8, fontSize: 16, fontFamily: 'Outfit_400Regular' },
  textArea: { height: 100, textAlignVertical: 'top' },
  characterCount: { alignSelf: 'flex-end', fontSize: 12, marginBottom: 16, fontFamily: 'Outfit_400Regular' },
  button: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  imageWrapper: { position: 'relative', width: 100, height: 100 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 8 },
  removeImage: { position: 'absolute', top: 5, right: 5, borderRadius: 10, padding: 5 },
  removeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  addImage: {
    width: 100, height: 100, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  addText: { fontSize: 14, fontFamily: 'Outfit_400Regular' },
});

export default SubmitReview;