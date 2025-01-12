import React from "react";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

const SettingsLayout = () => {
  const { theme } = useTheme();
  const router = useRouter();

  // Reusable function for header options
  const getHeaderOptions = (title: string, showHeaderLeft: boolean = true) => ({
    headerShown: true,
    headerTitle: title,
    headerStyle: {
      backgroundColor: theme.colors.primary,
    },
    headerTintColor: theme.colors.text.primary,
    headerTitleStyle: {
      fontFamily: "Outfit_700Bold",
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    headerLeft: showHeaderLeft
      ? () => (
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 10 }}>
            <FontAwesome6 name="arrow-left" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )
      : undefined,
  });

  // Define screens with their titles and whether to show the header left
  const screens = [
    { name: "index", title: "Settings & Others", showHeaderLeft: false },
    { name: "account/index", title: "Account Information" },
    { name: "prayers/index", title: "Prayer Settings" },
    { name: "prayers/adhanSelection", title: "Adhan"},
    { name: "support/index", title: "Support & Feedback" },
    { name: "appearance/index", title: "Appearance" },
    { name: "food-additives/index", title: "Food Additives" },
    { name: "zakat/index", title: "Zakat" },
    { name: "zakat/fidyah/index", title: "Zakat Fidyah" },
    { name: "zakat/harta/index", title: "Zakat Harta" },
    { name: "referral/index", title: "Referral" },
    { name: "referral/leaderboard", title: "Leaderboard" }
  ];

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          options={getHeaderOptions(screen.title, screen.showHeaderLeft ?? true)}
        />
      ))}
    </Stack>
  );
};

export default SettingsLayout;
