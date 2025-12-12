/**
 * Quran Layout (MODERN REDESIGN v2.0)
 * 
 * Features:
 * - Custom header with gradient background
 * - Better typography and spacing
 * - Consistent navigation styling
 * - Theme-aware colors
 * 
 * @version 2.0
 * @lastUpdated December 2025
 */

import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import React from 'react';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';

const QuranLayout = () => {
  const router = useRouter();
  const { theme } = useTheme();

  // Custom back button with haptics
  const BackButton = () => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
      }}
      style={styles.backButton}
    >
      <FontAwesome6
        name="arrow-left"
        size={20}
        color={theme.colors.text.primary}
      />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {/* Main Dashboard */}
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Quran & Duas',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 22,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShadowVisible: false,
          // Add subtle gradient background (optional)
          headerBackground: () => (
            <View style={{ flex: 1, backgroundColor: theme.colors.primary }} />
          ),
        }}
      />

      {/* Bookmarks Screen */}
      <Stack.Screen
        name="bookmarks/index"
        options={{
          headerShown: true,
          headerTitle: 'My Bookmarks',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Surahs List Screen */}
      <Stack.Screen
        name="surahs/index"
        options={{
          headerShown: true,
          headerTitle: 'Surahs',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Individual Surah Screen */}
      <Stack.Screen
        name="surahs/[id]"
        options={{
          headerShown: true,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Duas Screen */}
      <Stack.Screen
        name="doas/index"
        options={{
          headerShown: true,
          headerTitle: 'Duas',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Recitation Plan Screen */}
      <Stack.Screen
        name="recitationPlan/index"
        options={{
          headerShown: true,
          headerTitle: 'Recitation Plan',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShadowVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
};

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default QuranLayout;