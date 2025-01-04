import React, { useContext } from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../../../context/ThemeContext';

const QALayout = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const activeTheme = isDarkMode ? theme.dark : theme.light;
  const router = useRouter();

  const headerOptions = (title: string) => ({
    headerShown: true,
    headerTitle: title,
    headerStyle: { backgroundColor: activeTheme.colors.primary },
    headerTintColor: activeTheme.colors.text.primary,
    headerTitleStyle: {
      fontFamily: 'Outfit_700Bold',
      fontSize: 20,
      color: activeTheme.colors.text.secondary,
    },
    headerLeft: () => (
      <TouchableOpacity onPress={() => router.back()}>
        <FontAwesome6
          name="arrow-left"
          size={24}
          color={activeTheme.colors.text.secondary}
          style={{ padding: 10 }}
        />
      </TouchableOpacity>
    ),
  });
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={headerOptions('Ask Anything')}
      />
      <Stack.Screen
        name="newQuestion/index"
        options={headerOptions('Ask a Question')}
      />
      <Stack.Screen
        name="questionThread/[id]"
        options={{
          ...headerOptions(''),
          headerTitle: '',
        }}
      />
    </Stack>
  );
};

export default QALayout;
