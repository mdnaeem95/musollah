import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { TouchableOpacity } from 'react-native';

const PrayerLayout = () => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontFamily: 'Outfit_700Bold',
          fontSize: 20,
          color: theme.colors.text.primary,
        },
        headerLeft: () => (
          <TouchableOpacity style={{ padding: 10 }} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="qiblat/index"
        options={{
          title: 'Qiblat',
        }}
      />
      <Stack.Screen
        name="doa/index"
        options={{
          title: 'Post-Prayer Doa',
        }}
      />
      <Stack.Screen
        name="monthlyPrayerTimes/index"
        options={{
          title: new Date().toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }),
        }}
      />
      <Stack.Screen
        name="prayerDashboard/index"
        options={{
          title: 'Prayer Dashboard',
        }}
      />
    </Stack>
  );
};

export default PrayerLayout;