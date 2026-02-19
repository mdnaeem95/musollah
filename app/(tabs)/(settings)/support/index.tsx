/**
 * Support Page - Modern Design
 * 
 * Submit feedback and bug reports
 * 
 * @version 2.0
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, Switch, ScrollView } from 'react-native';
import { getFirestore, collection, addDoc } from '@react-native-firebase/firestore';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import ThemedButton from '../../../../components/ThemedButton';
import { enter } from '../../../../utils';
import { createLogger } from '../../../../services/logging/logger';

const logger = createLogger('Support');

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SupportPage = () => {
  const { theme, isDarkMode } = useTheme();
  const firestore = getFirestore();

  const [feedback, setFeedback] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleSubmit = async () => {
    // Validation
    if (feedback.trim() === '') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Missing Feedback', 'Please enter your feedback before submitting.');
      return;
    }

    if (!isAnonymous && email.trim() === '') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Missing Email', 'Please provide an email or choose to submit anonymously.');
      return;
    }

    // Email validation
    if (!isAnonymous && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const feedbackRef = collection(firestore, 'feedback');
      await addDoc(feedbackRef, {
        feedback: feedback.trim(),
        email: isAnonymous ? 'Anonymous' : email.trim(),
        timestamp: new Date(),
        platform: 'mobile',
      });

      // Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setFeedback('');
        setEmail('');
        setIsAnonymous(true);
        setShowSuccess(false);
      }, 2000);

    } catch (error) {
      logger.error('Error submitting feedback', error as Error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'There was an issue submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <FontAwesome6 name="comment-dots" size={28} color={theme.colors.accent} />
            </View>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Share Your Feedback
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                Help us improve Musollah
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.formCard, { backgroundColor: theme.colors.secondary }]}
          >
            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <View style={[styles.instructionIcon, { backgroundColor: theme.colors.text.muted + '15' }]}>
                <FontAwesome6 name="circle-info" size={16} color={theme.colors.text.muted} />
              </View>
              <Text style={[styles.instructions, { color: theme.colors.text.secondary }]}>
                Let us know about any issues or feedback you have for the app
              </Text>
            </View>

            {/* Feedback Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <FontAwesome6 name="pen" size={14} color={theme.colors.accent} />
                <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                  Your Feedback
                </Text>
              </View>
              <View style={[styles.textAreaWrapper, { backgroundColor: theme.colors.primary + '50' }]}>
                <TextInput
                  style={[styles.feedbackInput, { color: theme.colors.text.primary }]}
                  placeholder="Type your feedback here..."
                  placeholderTextColor={theme.colors.text.muted}
                  multiline
                  numberOfLines={6}
                  value={feedback}
                  onChangeText={setFeedback}
                  editable={!isSubmitting}
                />
              </View>
              <Text style={[styles.characterCount, { color: theme.colors.text.muted }]}>
                {feedback.length} characters
              </Text>
            </View>

            {/* Anonymous Toggle */}
            <View style={[styles.toggleContainer, { backgroundColor: theme.colors.primary + '30' }]}>
              <View style={styles.toggleContent}>
                <View style={[styles.toggleIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                  <FontAwesome6 name="user-secret" size={16} color={theme.colors.accent} />
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
                    Submit Anonymously
                  </Text>
                  <Text style={[styles.toggleDescription, { color: theme.colors.text.secondary }]}>
                    No email required
                  </Text>
                </View>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAnonymous(value);
                }}
                trackColor={{
                  false: theme.colors.muted,
                  true: theme.colors.accent + '80',
                }}
                thumbColor={theme.colors.primary}
                ios_backgroundColor={theme.colors.muted}
                disabled={isSubmitting}
              />
            </View>

            {/* Email Input (conditional) */}
            {!isAnonymous && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'timing', duration: 200 }}
              >
                <View style={styles.inputGroup}>
                  <View style={styles.inputHeader}>
                    <FontAwesome6 name="envelope" size={14} color={theme.colors.accent} />
                    <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>
                      Your Email (Optional)
                    </Text>
                  </View>
                  <View style={[styles.emailInputWrapper, { backgroundColor: theme.colors.primary + '50' }]}>
                    <FontAwesome6
                      name="at"
                      size={16}
                      color={theme.colors.text.muted}
                      style={styles.emailIcon}
                    />
                    <TextInput
                      style={[styles.emailInput, { color: theme.colors.text.primary }]}
                      placeholder="your.email@example.com"
                      placeholderTextColor={theme.colors.text.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      editable={!isSubmitting}
                    />
                  </View>
                </View>
              </MotiView>
            )}

            {/* Submit Button */}
            <ThemedButton
              text={isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />

            {/* Success Message */}
            {showSuccess && (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={enter(0)}
                style={[styles.successBanner, { backgroundColor: theme.colors.text.success + '15' }]}
              >
                <View style={[styles.successIcon, { backgroundColor: theme.colors.text.success }]}>
                  <FontAwesome6 name="check" size={16} color="#fff" />
                </View>
                <Text style={[styles.successText, { color: theme.colors.text.success }]}>
                  Thank you for your feedback!
                </Text>
              </MotiView>
            )}
          </BlurView>
        </MotiView>

        {/* Info Cards */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={enter(0)}
        >
          <View style={styles.infoCards}>
            {/* Response Time Card */}
            <BlurView
              intensity={20}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.infoCard, { backgroundColor: theme.colors.secondary }]}
            >
              <View style={[styles.infoCardIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <FontAwesome6 name="clock" size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardTitle, { color: theme.colors.text.primary }]}>
                  Quick Response
                </Text>
                <Text style={[styles.infoCardText, { color: theme.colors.text.secondary }]}>
                  We typically respond within 24-48 hours
                </Text>
              </View>
            </BlurView>

            {/* Privacy Card */}
            <BlurView
              intensity={20}
              tint={isDarkMode ? 'dark' : 'light'}
              style={[styles.infoCard, { backgroundColor: theme.colors.secondary }]}
            >
              <View style={[styles.infoCardIcon, { backgroundColor: theme.colors.text.success + '15' }]}>
                <FontAwesome6 name="shield-halved" size={20} color={theme.colors.text.success} />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardTitle, { color: theme.colors.text.primary }]}>
                  Your Privacy
                </Text>
                <Text style={[styles.infoCardText, { color: theme.colors.text.secondary }]}>
                  Your feedback is confidential and secure
                </Text>
              </View>
            </BlurView>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },

  // Form Card
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    gap: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Instructions
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  instructionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructions: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 20,
  },

  // Input Group
  inputGroup: {
    gap: 10,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Feedback Input
  textAreaWrapper: {
    borderRadius: 12,
    padding: 12,
    minHeight: 150,
  },
  feedbackInput: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 22,
    minHeight: 126,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'right',
  },

  // Toggle Container
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTextContainer: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  toggleDescription: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },

  // Email Input
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  emailIcon: {
    marginLeft: 2,
  },
  emailInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    padding: 0,
  },

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Info Cards
  infoCards: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardContent: {
    flex: 1,
    gap: 4,
  },
  infoCardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  infoCardText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
  },
});

export default SupportPage;