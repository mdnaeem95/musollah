/**
 * Quran Section Layout - Modern Design
 * 
 * @version 2.0
 */

import React, { useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import SettingsModal from '../../../../components/quran/SettingsModal';
import { useTheme } from '../../../../context/ThemeContext';

const SurahDetailLayout = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalVisible, setModalVisible] = useState(false);
  const { theme, isDarkMode, toggleDarkMode, textSize, setTextSize, reciter, setReciter } = useTheme();

  const toggleModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(!isModalVisible);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerTitle: 'Quran',
            headerStyle: { 
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: theme.colors.text.primary,
            },
            headerLeft: () => (
              <TouchableOpacity 
                onPress={handleBack}
                style={styles.headerButton}
              >
                <FontAwesome6
                  name="arrow-left"
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity 
                onPress={toggleModal}
                style={styles.headerButton}
              >
                <FontAwesome6
                  name="gear"
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            headerShown: true,
            headerTitle: 'Surah',
            headerStyle: { 
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: theme.colors.text.primary,
            },
            headerLeft: () => (
              <TouchableOpacity 
                onPress={handleBack}
                style={styles.headerButton}
              >
                <FontAwesome6
                  name="arrow-left"
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity 
                onPress={toggleModal}
                style={styles.headerButton}
              >
                <FontAwesome6
                  name="gear"
                  size={20}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>

      <SettingsModal
        isVisible={isModalVisible}
        onClose={toggleModal}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        reciter={reciter}
        onReciterChange={setReciter}
        activeTheme={theme}
        showReciter={pathname.includes('/surahs')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 12,
  },
});

export default SurahDetailLayout;