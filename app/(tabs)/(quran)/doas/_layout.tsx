import { Stack, usePathname, useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsModal from '../../../../components/quran/SettingsModal';
import { useTheme } from '../../../../context/ThemeContext';

const DoaLayout = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalVisible, setModalVisible] = useState(false);
  const {
    theme,
    isDarkMode,
    toggleDarkMode,
    textSize,
    setTextSize,
    reciter,
    setReciter,
  } = useTheme();

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

  const handleTextSizeChange = async (value: number) => {
    setTextSize(value);
    await AsyncStorage.setItem('textSize', value.toString());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            gestureEnabled: false,
            headerShown: true,
            headerTitle: 'Duas',
            headerTitleStyle: {
              fontFamily: 'Outfit_700Bold',
              fontSize: 20,
              color: theme.colors.text.primary,
            },
            headerStyle: {
              backgroundColor: theme.colors.secondary,
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
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            headerShown: true,
            headerTitle: 'Doas',
            headerStyle: {
              backgroundColor: theme.colors.secondary,
            },
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

      {/* Settings Modal */}
      <SettingsModal
        isVisible={isModalVisible}
        onClose={toggleModal}
        textSize={textSize}
        onTextSizeChange={handleTextSizeChange}
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
    position: 'relative',
  },
});

export default DoaLayout;
