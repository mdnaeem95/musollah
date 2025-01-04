import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { getFirestore, collection, addDoc } from '@react-native-firebase/firestore';
import { Switch } from '@rneui/themed';
import { ThemeContext } from '../../../../context/ThemeContext';
import ThemedButton from '../../../../components/ThemedButton';

const SupportPage = () => {
  const { theme, currentTheme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;
  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const firestore = getFirestore();

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
      const feedbackRef = collection(firestore, 'feedback');
      await addDoc(feedbackRef, {
        feedback,
        email: isAnonymous ? 'Anonymous' : email,
        timestamp: new Date(),
      });

      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedback('');
      setEmail('');
      setIsAnonymous(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'There was an issue submitting your feedback. Please try again.');
    }
  };

  const styles = createStyles(activeTheme);

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.instructions}>
          Let us know about any issues or feedback you have for the app:
        </Text>

        {/* Feedback Input */}
        <TextInput
          style={styles.feedbackInput}
          placeholder="Type your feedback here..."
          placeholderTextColor={activeTheme.colors.text.muted}
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
            onValueChange={setIsAnonymous}
            trackColor={{
              false: activeTheme.colors.text.muted,
              true: activeTheme.colors.accent,
            }}
            thumbColor={isAnonymous ? activeTheme.colors.primary : activeTheme.colors.secondary}
          />
        </View>

        {/* Email Input (visible only if not anonymous) */}
        {!isAnonymous && (
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email (optional)"
            placeholderTextColor={activeTheme.colors.text.muted}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        )}

        {/* Submit Button */}
        <ThemedButton 
          text="Submit Feedback"
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.medium,
    },
    form: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      gap: theme.spacing.large,
      ...theme.shadows.default,
    },
    instructions: {
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.large,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.small,
    },
    feedbackInput: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      color: theme.colors.text.secondary,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
      height: 150,
      textAlignVertical: 'top',
    },
    anonymousSwitchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    switchLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: theme.fontSizes.large,
      color: theme.colors.text.primary,
    },
    emailInput: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      color: theme.colors.secondary,
      fontFamily: 'Outfit_400Regular',
      fontSize: theme.fontSizes.medium,
    },
  });

export default SupportPage;
