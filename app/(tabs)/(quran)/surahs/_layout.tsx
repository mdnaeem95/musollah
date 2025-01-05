import React, { useContext, useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsModal from '../../../../components/quran/SettingsModal';
import { useTheme } from '../../../../context/ThemeContext';

const SurahDetailLayout = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalVisible, setModalVisible] = useState(false);
  const { theme, isDarkMode, toggleDarkMode, textSize, setTextSize, reciter, setReciter } =
    useTheme();

  const toggleModal = () => setModalVisible(!isModalVisible);

  useEffect(() => {
    const loadTextSize = async () => {
      const savedTextSize = await AsyncStorage.getItem('textSize');
      if (savedTextSize !== null) {
        setTextSize(parseInt(savedTextSize, 10));
      }
    };
    loadTextSize();
  }, []);

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerTitle: 'Surahs',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: theme.colors.text.primary,
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <FontAwesome6
                  name="arrow-left"
                  size={24}
                  color={theme.colors.text.primary}
                  style={{ padding: 10 }}
                />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={toggleModal}>
                <FontAwesome6
                  name="gear"
                  size={24}
                  color={theme.colors.text.primary}
                  style={{ padding: 10 }}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            headerShown: true,
            headerTitle: 'Surahs',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: theme.colors.text.primary,
            },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <FontAwesome6
                  name="arrow-left"
                  size={24}
                  color={theme.colors.text.primary}
                  style={{ padding: 10 }}
                />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={toggleModal}>
                <FontAwesome6
                  name="gear"
                  size={24}
                  color={theme.colors.text.primary}
                  style={{ padding: 10 }}
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
});

export default SurahDetailLayout;
