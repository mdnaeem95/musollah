import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { submitReview } from '../../../../api/firebase';
import { getAuth } from '@react-native-firebase/auth';

const SubmitReview = () => {
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const user = getAuth();
  const currentUser = user.currentUser;

  const { id } = useLocalSearchParams(); // Restaurant ID from the URL
  const router = useRouter();

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
      await submitReview(id as string, currentUser.uid, rating, reviewText);
      Alert.alert('Success', 'Review submitted successfully!');
      router.back(); // Navigate back to the restaurant details page
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit the review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rating (1-5):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={rating.toString()}
        onChangeText={(text) => setRating(Number(text) || 5)}
        maxLength={1}
      />

      <Text style={styles.label}>Your Review:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={reviewText}
        onChangeText={setReviewText}
        multiline
        placeholder="Write your review here..."
      />

      <Button
        title={loading ? 'Submitting...' : 'Submit Review'}
        onPress={handleSubmit}
        color="#F4E2C1"
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    padding: 16,
    justifyContent: 'center',
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
});

export default SubmitReview;
