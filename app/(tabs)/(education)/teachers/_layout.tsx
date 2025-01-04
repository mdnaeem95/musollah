import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useContext } from "react";
import { TouchableOpacity } from "react-native";
import { ThemeContext } from "../../../../context/ThemeContext";

const TeachersLayout = () => {
  const router = useRouter();
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: "Teacher Details",
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 8 }}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Teachers",
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/(education)/dashboard/")} style={{ paddingLeft: 8 }}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default TeachersLayout;
