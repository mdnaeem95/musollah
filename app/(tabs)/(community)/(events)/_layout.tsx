import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from 'react';
import { TouchableOpacity, Platform } from "react-native";
import { useTheme } from '../../../../context/ThemeContext';

const EventsLayout = () => {
  const router = useRouter();
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
    headerLeft: ({ canGoBack }: { canGoBack: boolean }) => (
      canGoBack && (
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ 
            paddingLeft: 6, 
            marginRight: Platform.OS === 'android' ? 10 : 0, 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
        >
          <FontAwesome6
            name="arrow-left"
            size={Platform.OS === 'android' ? 20 : 24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      )
    ),
  };
  
  return (
    //@ts-ignore
    <Stack screenOptions={sharedScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Events",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTransparent: true,
          headerTitle: 'Event Details',
          headerLeft: () => (
             (
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={{ 
                  paddingLeft: 6, 
                  marginRight: Platform.OS === 'android' ? 10 : 0, 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}
              >
                <FontAwesome6
                  name="arrow-left"
                  size={Platform.OS === 'android' ? 20 : 24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            )
          ),
        }}
      />
      <Stack.Screen
        name="map"
        options={{
          headerShown: false,
          headerTitle: "Events Map",
        }}
      />
    </Stack>
  );
};

export default EventsLayout;