/**
 * Recitation Plan Layout - Modern Design
 * 
 * @version 2.0
 */
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../../context/ThemeContext';
import { PlanProvider } from '../../../../context/PlanContext';

export default function RecitationPlanLayout() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <PlanProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          animation: 'slide_from_right',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTitleStyle: {
            color: theme.colors.text.primary,
            fontFamily: 'Outfit_700Bold',
            fontSize: 18,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitle: '',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBack}
              style={{ paddingHorizontal: 16 }}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="arrow-left"
                size={22}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </PlanProvider>
  );
}