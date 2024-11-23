import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';

const LocalBusinessesLayout = () => {
  const router = useRouter();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: 'Local Businesses',
          headerStyle: { backgroundColor: '#2E3D3A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ECDFCC' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={24} color="#ECDFCC" style={{ padding: 10 }} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="addbusiness/index"
        options={{
          headerShown: true,
          headerTitle: 'Ask Your Business',
          headerStyle: { backgroundColor: '#2E3D3A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#ECDFCC' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6 name="arrow-left" size={24} color="#ECDFCC" style={{ padding: 10 }} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default LocalBusinessesLayout;
