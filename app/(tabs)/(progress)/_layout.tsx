/**
 * Progress Layout
 *
 * Hosts the unified "spiritual progress" surface (prayer + Quran consistency,
 * Khatam plan, community). Gradient accent header to match the other tabs.
 */

import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../context/ThemeContext';
import { AccentHeaderBackground } from '../../../components/AccentHeaderBackground';

const ProgressLayout = () => {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const headerBg = isDarkMode ? '#060B18' : '#EEF2FF';

  const BackButton = () => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
      }}
      style={[styles.backButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }]}
    >
      <FontAwesome6 name="arrow-left" size={20} color={theme.colors.text.primary} />
    </TouchableOpacity>
  );

  const titleStyle = {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: theme.colors.text.primary,
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: 'Progress',
          headerTitleStyle: titleStyle,
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
        }}
      />
      <Stack.Screen
        name="tasbih"
        options={{
          headerShown: true,
          headerTitle: 'Tasbih',
          headerTitleStyle: { ...titleStyle, fontSize: 20 },
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />
      {/* Prayer log — moved here from the Prayer tab; reached from the Today card */}
      <Stack.Screen
        name="prayerDashboard/index"
        options={{
          headerShown: true,
          headerTitle: 'Prayer Log',
          headerTitleStyle: { ...titleStyle, fontSize: 20 },
          headerStyle: { backgroundColor: headerBg },
          headerShadowVisible: false,
          headerBackground: () => <AccentHeaderBackground backgroundColor={headerBg} />,
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressLayout;
