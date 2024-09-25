import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import React from 'react'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../redux/store/store'
import { signIn, signUp } from '../../redux/slices/userSlice'
import { useRouter } from 'expo-router'
import { UserInfo } from '../../utils/types'

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
  const { loading, error } = useSelector((state: RootState) => state.user)
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  console.log('AuthScreen rendered');

  // const onSignIn: SubmitHandler<UserInfo> = async ({ email, password }) => {
  //   const resultAction = await dispatch(signIn({ email, password }));
  //   if (signIn.fulfilled.match(resultAction)) {
  //     router.push('(prayer)/index');
  //   }
  // };

  const onSignUp: SubmitHandler<UserInfo> = async ({ email, password }) => {
    console.log('Sign Up button clicked');
    console.log('Form data:', { email, password });

    try {
      const resultAction = await dispatch(signUp({ email, password })).unwrap();
      console.log('Sign Up successful:', resultAction);
      router.push('(tabs)');
    } catch (error) {
      console.error('Sign Up failed: ', error);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={{ marginBottom: 60 }}>
        <Text style={styles.headerText}>RIHLAH</Text>
      </View>

      <View style={styles.formDescContainer}>
        <Text style={styles.signUpText}>Create An Account</Text>
        <Text style={styles.signUpSubText}>Enter your email to sign up for this app.</Text>
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

        <TouchableOpacity onPress={handleSubmit(onSignUp)} style={styles.btn}>
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={handleSubmit(onSignIn)} style={styles.btn}>
            <Text style={{ color: '#000000' }}>Sign In</Text>
        </TouchableOpacity> */}
      </View>

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