import React, { useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store/store';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { UserInfo } from '../utils/types';
import { signUp, signIn } from '../redux/slices/userSlice';
import { useRouter } from 'expo-router';

interface SignInModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isVisible, onClose }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter()

  const { control, handleSubmit, formState: { errors }, reset } = useForm<UserInfo>();

  // Handle form submission for sign-up
  const onSignUpSubmit: SubmitHandler<UserInfo> = async ({ email, password }) => {
    try {
      await dispatch(signUp({ email, password })).unwrap();
      handleModalClose(); // Close modal after successful sign-up
      router.replace('/(tabs)/(prayer)')
    } catch (error) {
      alert('Error: Failed to sign up. Please try again.');
    }
  };

  // Handle form submission for sign-in
  const onSignInSubmit: SubmitHandler<UserInfo> = async ({ email, password }) => {
    try {
      await dispatch(signIn({ email, password })).unwrap();
      handleModalClose(); // Close modal after successful sign-in
      router.replace('/(tabs)/(prayer)')
    } catch (error) {
      alert('Error: Failed to sign in. Please try again.');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset(); // Reset form fields when toggling between Sign Up and Sign In
  };

  // Modified onClose to reset the modal state when closed
  const handleModalClose = () => {
    reset(); // Reset the form fields when the modal closes
    onClose(); // Trigger the original close action
  };

  return (
    <Modal transparent={true} visible={isVisible} onRequestClose={handleModalClose} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Form Header */}
          <Text style={styles.headerText}>{isSignUp ? 'Create an account' : 'Sign in'}</Text>
          <Text style={styles.privacyText}>
            {isSignUp ? 'By creating an account, you agree to our Terms of Service and Privacy Policy.' : 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
          </Text>

          {/* Email Form */}
          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Email is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter your email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={styles.inputField}
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            <Controller
              control={control}
              name="password"
              rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Password (6+ characters)"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={styles.inputField}
                />
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
            >
              <Text style={styles.submitButtonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link for toggling between Sign In and Sign Up */}
          <TouchableOpacity style={styles.footerLink} onPress={toggleMode}>
            <Text style={styles.footerText}>
              {isSignUp ? 'Have an account? ' : 'New here? '}
              <Text style={styles.footerLinkText}>{isSignUp ? 'Sign in' : 'Create account'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
            <FontAwesome6 name="xmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
    justifyContent: 'center', // Ensure the form is centered
    position: 'relative',
  },
  formContainer: {
    marginVertical: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
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
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4D6561',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
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
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
});

export default SignInModal;
