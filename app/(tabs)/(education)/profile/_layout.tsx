import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useContext } from "react";
import { TouchableOpacity } from "react-native";
import { ThemeContext } from "../../../../context/ThemeContext";

const ProfileLayout = () => {
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
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Profile",
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 6 }}>
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

export default ProfileLayout;
