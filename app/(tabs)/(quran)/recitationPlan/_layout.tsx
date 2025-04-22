import { Stack, useRouter } from 'expo-router';
import { PlanProvider } from './context';
import { TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../../../../context/ThemeContext';

export default function RecitationPlanLayout() {
  const { theme } = useTheme();
  const router = useRouter();

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
            color: theme.colors.primary,
            fontFamily: 'Outfit_700Bold',
            fontSize: 18,
          },
          headerTintColor: theme.colors.text.primary,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={22}
                color={theme.colors.text.primary}
                style={{ paddingHorizontal: 16 }}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </PlanProvider>
  );
}