import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from 'react';
import { TouchableOpacity, Platform } from "react-native";
import { useTheme } from '../../../../context/ThemeContext';
import BackButton from '../../../../components/BackButton'

const EventsLayout = () => {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerTitle: "Notifications" }} />
    </Stack>
  );
};

export default EventsLayout;