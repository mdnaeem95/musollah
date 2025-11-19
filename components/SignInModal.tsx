import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';

// ============================================================================
// TYPES
// ============================================================================

interface SignInModalProps {
  isVisible: boolean;
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
  isVisible, 
  onClose, 
  allowGuest = false 
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const router = useRouter();
  
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
    if (!isVisible) {
      clearError();
      reset();
    }
  }, [isVisible, clearError, reset]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onSignUpSubmit: SubmitHandler<AuthFormData> = async ({ email, password }) => {
    try {
      await signUp(email, password);
      handleModalClose();
      router.replace('/(tabs)');
    } catch (err) {
      // Error is stored in Zustand store, will be displayed below form
      console.error('Sign up error:', err);
    }
  };

  const onSignInSubmit: SubmitHandler<AuthFormData> = async ({ email, password }) => {
    try {
      await signIn(email, password);
      handleModalClose();
      router.replace('/(tabs)');
    } catch (err) {
      // Error is stored in Zustand store, will be displayed below form
      console.error('Sign in error:', err);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
    clearError();
  };

  const handleModalClose = () => {
    reset();
    clearError();
    onClose();
  };

  const handleContinueAsGuest = () => {
    handleModalClose();
    router.replace('/(tabs)');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Modal 
      transparent 
      visible={isVisible} 
      onRequestClose={handleModalClose} 
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleModalClose}
            disabled={isLoading}
          >
            <FontAwesome6 name="xmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.headerText}>
            {isSignUp ? 'Create an account' : 'Sign in'}
          </Text>
          <Text style={styles.privacyText}>
            {isSignUp 
              ? 'By creating an account, you agree to our Terms of Service and Privacy Policy.' 
              : 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
          </Text>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
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
                <TextInput
                  placeholder="Enter your email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={styles.inputField}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}

            {/* Password Input */}
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
                <TextInput
                  placeholder="Password (6+ characters)"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={styles.inputField}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            {/* Auth Error from Store */}
            {error && (
              <View style={styles.errorContainer}>
                <FontAwesome6 name="circle-exclamation" size={16} color="#ff6b6b" />
                <Text style={styles.authErrorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                isLoading && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Guest Button */}
            {allowGuest && (
              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  styles.guestButton,
                  isLoading && styles.submitButtonDisabled
                ]}
                onPress={handleContinueAsGuest}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer Toggle */}
          <TouchableOpacity 
            style={styles.footerLink} 
            onPress={toggleMode}
            disabled={isLoading}
          >
            <Text style={styles.footerText}>
              {isSignUp ? 'Have an account? ' : 'New here? '}
              <Text style={styles.footerLinkText}>
                {isSignUp ? 'Sign in' : 'Create account'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  formContainer: {
    marginVertical: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  privacyText: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Outfit_400Regular',
    paddingHorizontal: 20,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    fontFamily: 'Outfit_400Regular',
  },
  submitButton: {
    backgroundColor: '#4D6561',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  guestButton: {
    backgroundColor: '#6c757d',
  },
  footerLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  footerLinkText: {
    color: '#D6B0FF',
    textDecorationLine: 'underline',
    fontFamily: 'Outfit_600SemiBold',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 10,
    marginTop: -10,
    fontFamily: 'Outfit_400Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  authErrorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    flex: 1,
  },
});

export default SignInModal;