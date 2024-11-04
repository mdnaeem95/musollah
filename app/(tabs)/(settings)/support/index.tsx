import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getFirestore, collection, addDoc } from '@react-native-firebase/firestore';
import { Switch } from '@rneui/themed'; 

const SupportPage = () => {
  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState<string>(''); // Manage user email
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true); 
  const firestore = getFirestore(); // Initialize Firestore

  // Handle feedback submission
  const handleSubmit = async () => {
    if (feedback.trim() === '') {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
      return;
    }

    if (!isAnonymous && email.trim() === '') {
        Alert.alert('Error', 'Please provide an email or choose to submit anonymously.');
        return;
    }

    try {
      // Save feedback to Firestore
      const feedbackRef = collection(firestore, 'feedback');
      await addDoc(feedbackRef, {
        feedback,
        email: isAnonymous ? 'Anonymous' : email,
        timestamp: new Date(),
      });

      // Show success alert and clear the form
      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedback(''); // Clear the feedback input
      setEmail('');
      setIsAnonymous(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'There was an issue submitting your feedback. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.form}>
            <Text style={styles.instructions}>Let us know about any issues or feedback you have for the app:</Text>

            {/* Feedback Input */}
            <TextInput
                style={styles.feedbackInput}
                placeholder="Type your feedback here..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                value={feedback}
                onChangeText={setFeedback}
            />

            {/* Anonymous Toggle */}
            <View style={styles.anonymousSwitchContainer}>
            <Text style={styles.switchLabel}>Submit anonymously</Text>
            <Switch
                value={isAnonymous}
                onValueChange={(value) => setIsAnonymous(value)}
            />
            </View>

            {/* Email Input (visible only if not anonymous) */}
            {!isAnonymous && (
            <TextInput
                style={styles.emailInput}
                placeholder="Enter your email (optional)"
                placeholderTextColor="#999"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            )}

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
        </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    padding: 16,
  },
  form: {
    backgroundColor: '#3D4F4C',
    borderRadius: 15,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  instructions: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#ECDFCC',
    marginBottom: 10,
  },
  feedbackInput: {
    backgroundColor: '#2E3D3A',
    borderRadius: 10,
    padding: 15,
    color: '#ECDFCC',
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    height: 150, // Adjust height for multiline input
    textAlignVertical: 'top',
  },
  submitButton: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 10
  },
  submitButtonText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF'
  },
  anonymousSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#ECDFCC',
  },
  emailInput: {
    backgroundColor: '#2E3D3A',
    borderRadius: 10,
    padding: 15,
    color: '#ECDFCC',
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
});

export default SupportPage;
