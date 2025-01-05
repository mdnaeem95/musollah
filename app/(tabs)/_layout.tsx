import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const TabLayout = () => {
  const { theme } = useTheme();

  return (
    <Tabs
      initialRouteName="(prayer)"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.tabBar.activeTintColor,
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
            case "(education)":
              iconName = "book-open-reader";
              break;
            case "(food)":
              iconName = "utensils";
              break;
            case "musollah":
              iconName = "location-dot";
              break;
            case "(quran)":
              iconName = "book-quran";
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
      <Tabs.Screen name="(education)" options={{ title: "Education", headerShown: false }} />
      <Tabs.Screen name="(food)" options={{ title: "Halal Food", headerShown: false }} />
      <Tabs.Screen name="musollah" options={{ title: "Musollah", headerShown: false }} />
      <Tabs.Screen name="(quran)" options={{ title: "Quran", headerShown: false }} />
      <Tabs.Screen name="(settings)" options={{ title: "Settings", headerShown: false }} />
    </Tabs>
  );
};

export default TabLayout;