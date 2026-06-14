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
  const { theme, isDarkMode } = useTheme();
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
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
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
              style={{ marginLeft: 8, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="arrow-left"
                size={20}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </PlanProvider>
  );
}