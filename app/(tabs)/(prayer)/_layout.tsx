import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { TouchableOpacity } from 'react-native';

// Top color of the gradient backgrounds used in secondary prayer screens
const GRADIENT_HEADER_BG = { dark: '#060B18', light: '#EEF2FF' };

const PrayerLayout = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  const gradientHeaderBg = isDarkMode ? GRADIENT_HEADER_BG.dark : GRADIENT_HEADER_BG.light;
  const headerTextColor = isDarkMode ? 'rgba(255,255,255,0.90)' : theme.colors.text.primary;

  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: gradientHeaderBg,
        },
        headerTintColor: headerTextColor,
        headerTitleStyle: {
          fontFamily: 'Outfit_700Bold',
          fontSize: 20,
          color: headerTextColor,
        },
        headerLeft: () => (
          <TouchableOpacity style={{ padding: 10 }} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={22} color={isDarkMode ? 'rgba(255,255,255,0.80)' : theme.colors.text.primary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="qiblat/index"
        options={{
          title: 'Qiblat',
        }}
      />
      <Stack.Screen
        name="doa/index"
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="monthlyPrayerTimes/index"
        options={{
          title: new Date().toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }),
        }}
      />
      <Stack.Screen
        name="prayerDashboard/index"
        options={{
          title: 'Prayer Dashboard',
        }}
      />
      <Stack.Screen
        name="khutbah/index"
        options={{
          title: '',
        }}
      />
    </Stack>
  );
};

export default PrayerLayout;