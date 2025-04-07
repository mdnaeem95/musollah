import { Stack } from "expo-router";
import React from 'react';
import { Platform } from "react-native";
import { useTheme } from '../../../../context/ThemeContext';
import BackButton from '../../../../components/BackButton'

const ProfileLayout = () => {
  const { theme } = useTheme();

  const sharedScreenOptions = {
    headerShown: true,
    headerStyle: {
      backgroundColor: theme.colors.primary,
    },
    headerTintColor: theme.colors.text.primary,
    headerTitleStyle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: Platform.OS === 'android' ? 18 : 20,
      color: theme.colors.text.primary,
    },
    headerLeft: () => <BackButton />,
  };

  return (
    <Stack screenOptions={sharedScreenOptions}>
      <Stack.Screen name="index" options={{ headerTitle: "Profile" }} />
      <Stack.Screen name="edit" options={{ headerTitle: "Edit Profile" }} />
      <Stack.Screen name="users" options={{ headerTitle: "Find People" }} />
      <Stack.Screen name="[uid]" options={{ headerTitle: "Profile" }} />
    </Stack>
  );
};

export default ProfileLayout;