import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store/store';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { UserInfo } from '../utils/types';
import { signUp, signIn } from '../redux/slices/userSlice';
import { useRouter, useSegments } from 'expo-router';

interface SignInModalProps {
  isVisible: boolean;
  onClose: () => void;
  allowGuest?: boolean;
}

const SignInModal: React.FC<SignInModalProps> = ({ isVisible, onClose, allowGuest = false }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const segments = useSegments();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<UserInfo>();

  const onSignUpSubmit: SubmitHandler<UserInfo> = async ({ email, password }) => {
    try {
      await dispatch(signUp({ email, password })).unwrap();
      handleModalClose();
      router.replace('/(tabs)');
    } catch (error) {
      alert('Error: Failed to sign up. Please try again.');
    }
  };

  const onSignInSubmit: SubmitHandler<UserInfo> = async ({ email, password }) => {
    try {
      await dispatch(signIn({ email, password })).unwrap();
      handleModalClose();
      router.replace('/(tabs)');
    } catch (error) {
      alert('Error: Failed to sign in. Please try again.');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const handleContinueAsGuest = () => {
    handleModalClose();
    router.replace('/(tabs)');
  };

  return (
    <Modal transparent={true} visible={isVisible} onRequestClose={handleModalClose} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.headerText}>{isSignUp ? 'Create an account' : 'Sign in'}</Text>
          <Text style={styles.privacyText}>
            {isSignUp ? 'By creating an account, you agree to our Terms of Service and Privacy Policy.' : 'By signing in, you agree to our Terms of Service and Privacy Policy.'}
          </Text>

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

            {allowGuest && (
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#6c757d' }]}
                onPress={handleContinueAsGuest}
              >
                <Text style={styles.submitButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.footerLink} onPress={toggleMode}>
            <Text style={styles.footerText}>
              {isSignUp ? 'Have an account? ' : 'New here? '}
              <Text style={styles.footerLinkText}>{isSignUp ? 'Sign in' : 'Create account'}</Text>
            </Text>
          </TouchableOpacity>

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