/**
 * Musollah Layout (MODERN DESIGN v2.0)
 * 
 * Premium navigation layout with:
 * - Glassmorphism header
 * - Smooth animations
 * - Haptic feedback
 * 
 * @version 2.0
 * @updated December 2025
 */

import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';

const MusollahLayout = () => {
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
                  backgroundColor: theme.colors.primary + (isDarkMode ? 'DD' : 'F5'),
                }}
              />
            ) : null,
          
          // Header Style (Android)
          headerStyle: {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.primary,
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
              style={{
                padding: 12,
                marginLeft: 4,
                borderRadius: 12,
                backgroundColor: theme.colors.secondary + '80',
              }}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <FontAwesome6 
                name="arrow-left" 
                size={20} 
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
        
        {/* Add other screens here as needed */}
      </Stack>
    </GestureHandlerRootView>
  );
};

export default MusollahLayout;