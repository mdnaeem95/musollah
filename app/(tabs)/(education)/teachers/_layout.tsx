import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";

const TeachersLayout = () => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Teachers",
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/(education)/dashboard/")} style={{ paddingLeft: 8 }}>
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
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: "Teacher Details",
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 8 }}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default TeachersLayout;
