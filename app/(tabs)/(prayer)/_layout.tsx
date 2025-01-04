import { FontAwesome6 } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";

const PrayerLayout = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;

  const router = useRouter();
  const date = new Date();
  const year = date.getFullYear();
  const month = date.toLocaleString('default', { month: 'long' }); // Convert month to full name, e.g., 'October'
  const formattedMonth = `${month} ${year}`;

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="qiblat/index"
        options={{
          headerShown: true,
          headerTitle: 'Qiblat',
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
                style={{ padding: 10 }}
              />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="doa/index"
        options={{
          headerShown: true,
          headerTitle: 'Post-Prayer Doa',
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
                style={{ padding: 10 }}
              />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="monthlyPrayerTimes/index"
        options={{
          headerShown: true,
          headerTitle: formattedMonth,
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
                style={{ padding: 10 }}
              />
            </TouchableOpacity>
          )
        }}
      />
      <Stack.Screen 
        name="prayerDashboard/index"
        options={{
          headerShown: true,
          headerTitle: 'Prayer Dashboard',
          headerStyle: {
            backgroundColor: activeTheme.colors.primary,
          },
          headerTintColor: activeTheme.colors.text.primary,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: activeTheme.colors.text.primary,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome6
                name="arrow-left"
                size={24}
                color={activeTheme.colors.text.primary}
                style={{ padding: 10 }}
              />
            </TouchableOpacity>
          )
        }}
      />
    </Stack>
  );
};

export default PrayerLayout;
