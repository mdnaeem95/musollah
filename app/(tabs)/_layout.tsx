import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccent } from '../../hooks/useAccent';
const TabLayout = () => {
  const { theme } = useTheme();
  // Active tab tint follows the live sky phase (falls back to the theme accent).
  const { accent } = useAccent();

  return (
    <Tabs
      initialRouteName="(prayer)"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: theme.colors.tabBar.inactiveTintColor,
        tabBarStyle: {
          height: 70,
          backgroundColor: theme.colors.tabBar.backgroundColor,
          borderTopColor: theme.colors.tabBar.borderColor,
          paddingBottom: 25,
          paddingTop: 10,
          borderTopWidth: 1,
          shadowColor: theme.colors.text.muted,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          switch (route.name) {
            case "(prayer)":
              iconName = "person-praying";
              break;
            case "(nearby)":
              iconName = "map-location-dot";
              break;
            case "(quran)":
              iconName = "book-quran";
              break;
            case "(progress)":
              iconName = "chart-line";
              break;
            case "(settings)":
              iconName = "bars";
              break;
            default:
              iconName = "circle";
          }
          return <FontAwesome6 name={iconName} size={20} color={color} solid={focused} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ href: null, title: "Prayers", headerShown: false }} />
      <Tabs.Screen name="(prayer)" options={{ title: "Prayers", headerShown: false }} />
      <Tabs.Screen name="(nearby)" options={{ title: "Nearby", headerShown: false }} />
      <Tabs.Screen name="(quran)" options={{ title: "Quran", headerShown: false }} />
      <Tabs.Screen name="(progress)" options={{ title: "Progress", headerShown: false }} />
      <Tabs.Screen name="(settings)" options={{ title: "Settings", headerShown: false }} />
    </Tabs>
  );
};

export default TabLayout;