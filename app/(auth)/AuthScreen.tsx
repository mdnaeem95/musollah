import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import React from 'react'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../redux/store/store'
import { signIn, signUp, signInAnonymous } from '../../redux/slices/userSlice'
import { useRouter } from 'expo-router'

interface UserInfo {
  email: string,
  password: string
}

const AuthScreen = () => {
  const { control, handleSubmit } = useForm<UserInfo>()
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.user)
  const router = useRouter();

  const onSignIn: SubmitHandler<UserInfo> = async ({ email, password }) => {
    const resultAction = await dispatch(signIn({ email, password }));
    if (signIn.fulfilled.match(resultAction)) {
      router.push('(prayer)/index');
    }
  };

  const onSignUp: SubmitHandler<UserInfo> = async ({ email, password }) => {
    const resultAction = await dispatch(signUp({ email, password }));
    if (signIn.fulfilled.match(resultAction)) {
      router.push('(prayer)/index');
    }
  };

  const onAnonymousSignIn = async () => {
    const resultAction = await dispatch(signInAnonymous());
    if (signIn.fulfilled.match(resultAction)) {
      router.push('(prayer)/index');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#B9D0CC', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ marginBottom: 60 }}>
        <Text style={styles.headerText}>RIHLAH</Text>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 20 }}>
        <Text style={styles.signUpText}>Create An Account</Text>
        <Text style={styles.signUpSubText}>Enter your email to sign up for this app.</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ alignItems: 'center', justifyContent: 'center', width: '80%', gap: 20 }}
      >
        <Controller 
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder='email@domain.com'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={{ backgroundColor: '#FFFFFF', width: '100%', paddingHorizontal: 8, paddingVertical: 16, borderRadius: 8 }}
            />
          )}
          name="email"
        />

        <Controller 
          control={control}
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              placeholder='Password'
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={{ backgroundColor: '#FFFFFF', width: '100%', paddingHorizontal: 8, paddingVertical: 16, borderRadius: 8 }}
            />
          )}
          name="password"
        />

        <TouchableOpacity onPress={handleSubmit(onSignUp)} style={{ backgroundColor: '#4D6561', width: '100%', paddingHorizontal: 8, paddingVertical: 16, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF' }}>Sign up with email</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Text>Or continue anonymously</Text>

      <TouchableOpacity onPress={onAnonymousSignIn} style={{ backgroundColor: '#EEEEEE', width: '80%', paddingHorizontal: 8, paddingVertical: 16, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: '#000000' }}>Sign up anonymously</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  }
})

export default AuthScreen