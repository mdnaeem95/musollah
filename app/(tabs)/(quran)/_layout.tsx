import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import React, { useContext } from 'react';
import { ThemeContext } from '../../../context/ThemeContext';

const QuranLayout = () => {
  const router = useRouter();
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Default: no header for all screens
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Quran & Duas',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
        }}
      />
      <Stack.Screen
        name="bookmarks/index"
        options={{
          headerShown: true,
          headerTitle: 'My Bookmarks',
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
                style={{ padding: 10 }}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default QuranLayout;
