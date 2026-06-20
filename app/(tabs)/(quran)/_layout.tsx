/**
 * Quran Layout (MODERN REDESIGN v2.0)
 * 
 * Features:
 * - Custom header with gradient background
 * - Better typography and spacing
 * - Consistent navigation styling
 * - Theme-aware colors
 * 
 * @version 2.0
 * @lastUpdated December 2025
 */

import { Stack, useRouter, usePathname } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import React from 'react';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { AccentHeaderBackground } from '../../../components/AccentHeaderBackground';
import { FloatingPlayer } from '../../../components/quran/FloatingPlayer';

const QuranLayout = () => {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();

  // Custom back button with haptics
  const BackButton = () => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
      }}
      hitSlop={10}
      style={styles.backButton}
    >
      <FontAwesome6
        name="arrow-left"
        size={20}
        color={theme.colors.text.primary}
      />
    </TouchableOpacity>
  );

  const headerBg = isDarkMode ? '#060B18' : '#EEF2FF';

  // Persistent mini-player across the Quran tab, so audio can be controlled
  // (and stopped) from anywhere — hidden on the Listen screen, which is itself
  // the full player.
  const pathname = usePathname();
  const showMiniPlayer = !pathname?.includes('/listen');

  return (
    <View style={{ flex: 1 }}>
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {/* Main Dashboard */}
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: false,
          headerShown: true,
          headerTitle: 'Quran & Duas',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 22,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
        }}
      />

      {/* Bookmarks Screen */}
      <Stack.Screen
        name="bookmarks/index"
        options={{
          headerShown: true,
          headerTitle: 'My Bookmarks',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Surahs List Screen */}
      <Stack.Screen
        name="surahs/index"
        options={{
          headerShown: true,
          headerTitle: 'Surahs',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Individual Surah Screen */}
      <Stack.Screen
        name="surahs/[id]"
        options={{
          headerShown: true,
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Duas Screen */}
      <Stack.Screen
        name="doas/index"
        options={{
          headerShown: true,
          headerTitle: 'Duas',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Search Screen — route is /quran-search to avoid colliding with the
          Nearby tab's /search (both groups are URL-transparent in Expo Router). */}
      <Stack.Screen
        name="quran-search/index"
        options={{
          headerShown: true,
          headerTitle: 'Search Quran',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Listen — dedicated audio player */}
      <Stack.Screen
        name="listen/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Now Playing',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />

      {/* Recitation Plan Screen */}
      <Stack.Screen
        name="recitationPlan/index"
        options={{
          headerShown: true,
          headerTitle: 'Recitation Plan',
          headerTitleStyle: {
            fontFamily: 'Outfit_700Bold',
            fontSize: 20,
            color: theme.colors.text.primary,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#060B18' : '#EEF2FF',
          },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
    {showMiniPlayer && <FloatingPlayer />}
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QuranLayout;