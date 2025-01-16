import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from 'react';
import { TouchableOpacity } from "react-native";
import { useTheme } from '../../../../context/ThemeContext';

const CoursesLayout = () => {
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
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    headerLeft: ({ canGoBack }: { canGoBack: boolean }) => (
      canGoBack && (
        <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 6 }}>
          <FontAwesome6
            name="arrow-left"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      )
    ),
  };

  return (
    <Stack screenOptions={{
      headerShown: false,
    }}>
      <Stack.Screen
        name="index"
        options={{
          ...sharedScreenOptions,
          headerTitle: 'Courses',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 6 }}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[courseId]/index"
        options={{
          ...sharedScreenOptions,
          headerTitle: 'Courses',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(education)/dashboard/')} style={{ paddingLeft: 6 }}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="[courseId]/modules/[moduleId]"
        //@ts-ignore
        options={{
          ...sharedScreenOptions,
          headerTitle: 'Courses',
        }}
      />
    </Stack>
  );
};

export default CoursesLayout;