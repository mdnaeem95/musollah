import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { AccentHeaderBackground } from '../../../components/AccentHeaderBackground';

export const CircleButton = ({ onPress }: any) => {
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

const FoodLayout = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  const gradientHeaderBg = isDarkMode ? '#060B18' : '#EEF2FF';
  const headerTextColor = isDarkMode ? 'rgba(255,255,255,0.90)' : theme.colors.text.primary;

  const commonHeaderStyles = {
    headerTitleStyle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 20,
      color: headerTextColor,
    },
    headerStyle: {
      backgroundColor: gradientHeaderBg,
    },
    headerShadowVisible: false,
    headerBackground: () => <AccentHeaderBackground backgroundColor={gradientHeaderBg} />,
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Food',
          ...commonHeaderStyles,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Search',
          ...commonHeaderStyles,
          headerLeft: () => <CircleButton onPress={() => router.back()} />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          gestureEnabled: false,
          headerShown: false,
          headerTitle: '',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="reviews/submit/[id]"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Submit Your Review',
          ...commonHeaderStyles,
          headerLeft: () => <CircleButton onPress={() => router.back()} />,
        }}
      />
      <Stack.Screen
        name="reviews/[id]"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'All Reviews',
          ...commonHeaderStyles,
          headerLeft: () => <CircleButton onPress={() => router.back()} />,
        }}
      />
    </Stack>
  );
};

const styles = StyleSheet.create({
  circleButton: {
    width: 40, // Diameter of the circle
    height: 40,
    borderRadius: 20, // Half of width/height to make it a circle
    alignItems: 'center', // Center the icon horizontally
    justifyContent: 'center', // Center the icon vertically
    padding: 8, // Padding around the icon
  },
});

export default FoodLayout;
