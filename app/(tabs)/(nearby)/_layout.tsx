/**
 * Nearby Layout (MODERN DESIGN v2.0)
 *
 * Hosts the unified map-first discovery screen (Food / Musollah / Mosque /
 * Bidet) plus the food restaurant detail + search routes.
 *
 * Premium navigation layout with:
 * - Glassmorphism header
 * - Smooth animations
 * - Haptic feedback
 *
 * @version 3.0
 * @updated June 2026
 */

import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';

// Round back button reused by the full-screen search modal.
export const CircleButton = ({ onPress }: { onPress: () => void }) => {
  const { theme, isDarkMode } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.circleButton, {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }]}
    >
      <FontAwesome6
        name="arrow-left"
        size={18}
        color={isDarkMode ? 'rgba(255,255,255,0.80)' : theme.colors.text.primary}
      />
    </TouchableOpacity>
  );
};

const NearbyLayout = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: true,
          
          // Premium Header Background
          headerTransparent: Platform.OS === 'ios',
          headerBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? '#060B18DD' : '#EEF2FFF5',
                }}
              />
            ) : null,
          
          // Header Style (Android)
          headerStyle: {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDarkMode ? '#060B18' : '#EEF2FF'),
          },
          
          // Header Text
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          
          // Back Button
          headerLeft: () => (
            <TouchableOpacity
              style={[styles.circleButton, {
                marginLeft: 4,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
              }]}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="arrow-left"
                size={18}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
          
          // Remove default back button
          headerBackVisible: false,
          
          // Animations
          animation: 'fade',
          animationDuration: 250,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            gestureEnabled: false, // Disable swipe back on main screen
          }}
        />

        {/* Restaurant detail (moved from the old Food tab) */}
        <Stack.Screen
          name="[id]"
          options={{
            headerShown: false,
            headerTitle: '',
            headerTransparent: true,
            gestureEnabled: false,
          }}
        />

        {/* Restaurant search modal (moved from the old Food tab) */}
        <Stack.Screen
          name="search"
          options={{
            presentation: 'fullScreenModal',
            headerShown: true,
            headerTitle: 'Search',
            gestureEnabled: false,
            headerLeft: () => <CircleButton onPress={() => router.back()} />,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  // Flex-centred circle — no padding, so the arrow glyph sits dead-centre.
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NearbyLayout;