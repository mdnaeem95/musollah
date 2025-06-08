import React from "react";
import { Animated, StyleSheet as RNStyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter, Stack, usePathname } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeTransition } from "../../../hooks/useThemeTransition"; // NEW

const SettingsLayout = () => {
  const { theme } = useTheme();
  const { themeTransitionAnim } = useThemeTransition(); // SHARED
  const router = useRouter();
  const path = usePathname();
  const transitionColor = theme.colors.primary;

  const getHeaderOptions = (title: string, showHeaderLeft: boolean = true) => {
    const isAppearance = title === "Appearance";

    return {
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
      headerBackground: isAppearance
        ? () => (
            <Animated.View
              pointerEvents="none"
              style={[
                RNStyleSheet.absoluteFillObject,
                {
                  zIndex: 100,
                  opacity: themeTransitionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      scale: themeTransitionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[transitionColor, `${transitionColor}99`, `${transitionColor}00`]}
                locations={[0, 0.4, 1]}
                style={{ flex: 1 }}
              />
            </Animated.View>
          )
        : undefined,
    };
  };

  const screens = [
    { name: "index", title: "Settings & Others", showHeaderLeft: false },
    { name: "account/index", title: "Account Information" },
    { name: "prayers/index", title: "Prayer Settings" },
    { name: "prayers/adhanSelection", title: "Adhan" },
    { name: "support/index", title: "Support & Feedback" },
    { name: "appearance/index", title: "Appearance" },
    { name: "food-additives/index", title: "Food Additives" },
    { name: "food-additives/foodScanner", title: "Ingredients Scanner" },
    { name: "zakat/index", title: "Zakat" },
    { name: "zakat/fidyah/index", title: "Zakat Fidyah" },
    { name: "zakat/harta/index", title: "Zakat Harta" },
    { name: "referral/index", title: "Referral" },
    { name: "referral/leaderboard", title: "Leaderboard" },
    { name: "procedureBot/index", title: "Procuedure Bot" },
    { name: "moe/index", title: "Muslim-Owned Businesses" },
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