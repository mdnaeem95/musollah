import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../redux/store/store'
import { signIn, signUp } from '../../redux/slices/userSlice'
import { Redirect, useRouter } from 'expo-router'
import { UserInfo } from '../../utils/types'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Alert } from 'react-native'

const emailRules = {
  required: 'Email is required',
  pattern: {
    value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
    message: 'Enter a valid email address',
  },
};

const passwordRules = {
  required: 'Password is required',
  minLength: {
    value: 6,
    message: 'Password should be at least 6 characters long',
  },
};


const AuthScreen = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<UserInfo>()
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [signInSuccessful, setSignInSuccessful] = useState<boolean>(false);
  const [signUpSuccessful, setSignUpSuccessful] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState(true);

  console.log('AuthScreen rendered');

  const onSignIn: SubmitHandler<UserInfo> = async ({ email, password }) => {
    try {
      const resultAction = await dispatch(signIn({ email, password })).unwrap();
      console.log('Sign in successful:', resultAction);
      setSignInSuccessful(true);
    } catch (error) {
      console.error('Sign in failed: ', error);
      Alert.alert('Sign in failed. Please check your credentials.')
    }
  };

  if (signInSuccessful) {
    return <Redirect href="/(tabs)" />
  }

  const onSignUp: SubmitHandler<UserInfo> = async ({ email, password }) => {
    console.log('Sign Up button clicked');
    console.log('Form data:', { email, password });

    try {
      const resultAction = await dispatch(signUp({ email, password })).unwrap();
      console.log('Sign Up successful:', resultAction);
      setSignUpSuccessful(true);
    } catch (error) {
      console.error('Sign Up failed: ', error);
    }
  };

  if (signUpSuccessful) {
    return <Redirect href="/(tabs)" />
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <KeyboardAwareScrollView
        style={{ flex: 1, width: '100%', marginTop: 150 }}
        enableOnAndroid={true}
      >
      <View style={{ marginBottom: 30, alignSelf: 'center' }}>
        <Text style={styles.headerText}>RIHLAH</Text>
      </View>

      <View style={{ width: '100%', paddingHorizontal: 16, gap: 20 }}>
        <Controller 
          control={control}
          rules={emailRules}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
            placeholder='email@domain.com'
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.fieldContainer}
            />
          )}
          name="email"
          />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Controller 
          control={control}
          rules={passwordRules}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
            placeholder='Password'
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.fieldContainer}
            />
          )}
          name="password"
          />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit(isSignUp ? onSignUp : onSignIn)} style={styles.btn}>
          <Text style={styles.btnText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        </TouchableOpacity>

        {/* Toggle between Sign Up and Sign In */}
        <TouchableOpacity onPress={toggleAuthMode} style={{ alignItems: 'center' }}>
            <Text style={[styles.signUpSubText, { textDecorationLine: 'underline' }]}>
              {isSignUp ? 'Already have an account? Sign In' : 'Don’t have an account? Sign Up'}
            </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: '#B9D0CC', 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  formDescContainer: {
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 5, 
    marginBottom: 20
  },
  formContainer: {
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '80%', 
    gap: 20
  },
  fieldContainer: {
    backgroundColor: '#FFFFFF', 
    width: '100%', 
    paddingHorizontal: 8, 
    paddingVertical: 16, 
    borderRadius: 8
  },
  headerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 32,
    color: '#4D6561',
  },
  signUpText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#000000'
  },
  signUpSubText: {
    fontFamily: 'Outfit_300Light',
    fontSize: 14,
    color: '#000000'
  },
  btn: {
    backgroundColor: '#4D6561', 
    width: '100%', 
    paddingHorizontal: 8, 
    paddingVertical: 16, 
    borderRadius: 8, 
    alignItems: 'center'
  },
  btnText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#FFFFFF'
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
})

export default AuthScreen