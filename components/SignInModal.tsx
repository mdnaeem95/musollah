/**
 * SignInModal (MODERN GLASSMORPHISM DESIGN - FIXED)
 * 
 * Authentication modal with:
 * - Full-screen bottom sheet (90% height)
 * - Slides up from bottom
 * - Smooth animations (minimal bounce)
 * - Glassmorphism backdrop and card
 * - Theme-aware colors (light/dark mode)
 * - ✅ FIXED: Visible input fields with color
 * - ✅ FIXED: Opaque bottom (no transparency)
 * 
 * @version 3.3 - Visual fixes
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../stores/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { createLogger } from '../services/logging/logger';

const logger = createLogger('Auth');

// ============================================================================
// TYPES
// ============================================================================

interface SignInModalProps {
  visible: boolean;
  onClose: () => void;
  allowGuest?: boolean;
}

interface AuthFormData {
  email: string;
  password: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const SignInModal: React.FC<SignInModalProps> = ({ 
  visible, 
  onClose, 
  allowGuest = false 
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  
  // Zustand store
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  // React Hook Form
  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    reset 
  } = useForm<AuthFormData>();

  // Clear errors when modal closes
  useEffect(() => {
    if (!visible) {
      clearError();
      reset();
      setFocusedField(null);
    }
  }, [visible, clearError, reset]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSignUpSubmit: SubmitHandler<AuthFormData> = async ({ email, password }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signUp(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleModalClose();
      router.replace('/(tabs)');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logger.error('Sign up error:', err);
    }
  };

  const onSignInSubmit: SubmitHandler<AuthFormData> = async ({ email, password }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signIn(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleModalClose();
      router.replace('/(tabs)');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logger.error('Sign in error:', err);
    }
  };

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSignUp(!isSignUp);
    reset();
    clearError();
  };

  const handleModalClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    clearError();
    onClose();
  };

  const handleContinueAsGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleModalClose();
    router.replace('/(tabs)');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Modal 
      transparent 
      visible={visible} 
      onRequestClose={handleModalClose} 
      animationType="fade"
    >
      {/* Glassmorphism Backdrop */}
      <BlurView 
        intensity={40} 
        tint="dark"
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleModalClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 50 }}
            transition={{ 
              type: 'timing',
              duration: 300
            }}
            style={styles.modalWrapper}
          >
            {/* ✅ FIXED: Solid background instead of BlurView */}
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }
              ]}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Close Button */}
                <TouchableOpacity 
                  style={[
                    styles.closeButton,
                    { backgroundColor: theme.colors.accent }
                  ]} 
                  onPress={handleModalClose}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <FontAwesome6 name="xmark" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Header */}
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ 
                    type: 'timing',
                    delay: 100,
                    duration: 300
                  }}
                >
                  <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>
                    {isSignUp ? 'Create an account' : 'Welcome back'}
                  </Text>
                  <Text style={[styles.privacyText, { color: theme.colors.text.secondary }]}>
                    {isSignUp 
                      ? 'Join Rihlah to track your prayers and more' 
                      : 'Sign in to continue your spiritual journey'}
                  </Text>
                </MotiView>

                {/* Form */}
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    type: 'timing',
                    delay: 150,
                    duration: 300
                  }}
                  style={styles.formContainer}
                >
                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                      Email
                    </Text>
                    <Controller
                      control={control}
                      name="email"
                      rules={{ 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={[
                          styles.inputContainer,
                          { 
                            // ✅ FIXED: More visible background with opacity
                            backgroundColor: isDarkMode 
                              ? 'rgba(255, 255, 255, 0.08)'  // Light overlay in dark mode
                              : 'rgba(0, 0, 0, 0.04)',        // Dark overlay in light mode
                            borderColor: focusedField === 'email' 
                              ? theme.colors.accent 
                              : isDarkMode 
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.08)'
                          }
                        ]}>
                          <FontAwesome6 
                            name="envelope" 
                            size={16} 
                            color={focusedField === 'email' 
                              ? theme.colors.accent 
                              : theme.colors.text.muted
                            } 
                          />
                          <TextInput
                            placeholder="your@email.com"
                            placeholderTextColor={theme.colors.text.muted}
                            onBlur={() => {
                              onBlur();
                              setFocusedField(null);
                            }}
                            onFocus={() => setFocusedField('email')}
                            onChangeText={onChange}
                            value={value}
                            style={[styles.inputField, { color: theme.colors.text.primary }]}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                          />
                        </View>
                      )}
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email.message}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                      Password
                    </Text>
                    <Controller
                      control={control}
                      name="password"
                      rules={{ 
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={[
                          styles.inputContainer,
                          { 
                            // ✅ FIXED: More visible background with opacity
                            backgroundColor: isDarkMode 
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.04)',
                            borderColor: focusedField === 'password' 
                              ? theme.colors.accent 
                              : isDarkMode 
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.08)'
                          }
                        ]}>
                          <FontAwesome6 
                            name="lock" 
                            size={16} 
                            color={focusedField === 'password' 
                              ? theme.colors.accent 
                              : theme.colors.text.muted
                            } 
                          />
                          <TextInput
                            placeholder="6+ characters"
                            placeholderTextColor={theme.colors.text.muted}
                            onBlur={() => {
                              onBlur();
                              setFocusedField(null);
                            }}
                            onFocus={() => setFocusedField('password')}
                            onChangeText={onChange}
                            value={value}
                            style={[styles.inputField, { color: theme.colors.text.primary }]}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                          />
                        </View>
                      )}
                    />
                    {errors.password && (
                      <Text style={styles.errorText}>{errors.password.message}</Text>
                    )}
                  </View>

                  {/* Auth Error from Store */}
                  {error && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'timing', duration: 200 }}
                      style={styles.errorContainer}
                    >
                      <FontAwesome6 name="circle-exclamation" size={16} color="#ff6b6b" />
                      <Text style={styles.authErrorText}>{error}</Text>
                    </MotiView>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton, 
                      { backgroundColor: theme.colors.accent },
                      isLoading && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <FontAwesome6 
                          name={isSignUp ? "user-plus" : "right-to-bracket"} 
                          size={16} 
                          color="#fff" 
                        />
                        <Text style={styles.submitButtonText}>
                          {isSignUp ? 'Create account' : 'Sign in'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Guest Button */}
                  {allowGuest && (
                    <TouchableOpacity
                      style={[
                        styles.guestButton,
                        { 
                          borderColor: theme.colors.accent,
                          backgroundColor: 'transparent'
                        },
                        isLoading && styles.submitButtonDisabled
                      ]}
                      onPress={handleContinueAsGuest}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <FontAwesome6 name="user" size={16} color={theme.colors.accent} />
                      <Text style={[styles.guestButtonText, { color: theme.colors.accent }]}>
                        Continue as Guest
                      </Text>
                    </TouchableOpacity>
                  )}
                </MotiView>

                {/* Footer Toggle */}
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    type: 'timing',
                    delay: 200,
                    duration: 300
                  }}
                >
                  <TouchableOpacity 
                    style={styles.footerLink} 
                    onPress={toggleMode}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
                      {isSignUp ? 'Already have an account? ' : 'New to Rihlah? '}
                      <Text style={[styles.footerLinkText, { color: theme.colors.accent }]}>
                        {isSignUp ? 'Sign in' : 'Create account'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              </ScrollView>
            </View>
          </MotiView>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    width: '100%',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,  // ✅ Increased for better bottom spacing
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1.5,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  guestButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  footerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  footerLinkText: {
    fontFamily: 'Outfit_600SemiBold',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  authErrorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    flex: 1,
  },
});

export default SignInModal;