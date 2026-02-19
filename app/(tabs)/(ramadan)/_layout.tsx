/**
 * Ramadan Tab Layout
 *
 * Stack navigator for Ramadan screens.
 * Follows the same pattern as prayer tab layout.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

const RamadanLayout = () => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.primary,
        },
        animation: 'slide_from_right',
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
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="fasting" options={{ headerShown: true, title: 'Fasting Tracker' }} />
      <Stack.Screen name="tarawih" options={{ headerShown: true, title: 'Tarawih Logger' }} />
      <Stack.Screen name="quran-khatam" options={{ headerShown: true, title: 'Quran Khatam' }} />
      <Stack.Screen name="calendar" options={{ headerShown: true, title: 'Ramadan Calendar' }} />
      <Stack.Screen name="share" options={{ headerShown: true, title: 'Share Progress' }} />
    </Stack>
  );
};

export default RamadanLayout;
