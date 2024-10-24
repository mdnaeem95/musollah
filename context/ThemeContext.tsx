import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  textSize: 30, // Add text size default
  setTextSize: (size: number) => {},
  reciter: 'alafasy',
  setReciter: (reciter: string) => {}
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textSize, setTextSize] = useState(30); // Default text size
  const [reciter, setReciter] = useState('alafasy')

  // Load the theme state from AsyncStorage when the app loads
  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedTextSize = await AsyncStorage.getItem('textSize');
      const savedReciter = await AsyncStorage.getItem('reciter');

      if (savedTheme !== null) setIsDarkMode(JSON.parse(savedTheme));
      if (savedTextSize !== null) setTextSize(parseInt(savedTextSize, 10));
      if (savedReciter !== null) setReciter(savedReciter);
    };
    loadSettings();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('theme', JSON.stringify(newMode));
  };

  const updateTextSize = async (size: number) => {
    setTextSize(size);
    await AsyncStorage.setItem('textSize', size.toString());
  };

  const updateReciter = async (newReciter: string) => {
    setReciter(newReciter);
    await AsyncStorage.setItem('reciter', newReciter)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, textSize, setTextSize: updateTextSize, reciter, setReciter: updateReciter }}>
      {children}
    </ThemeContext.Provider>
  );
};
