import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { greenTheme, blueTheme, purpleTheme } from '../theme/theme';

const themes = {
  green: greenTheme,
  blue: blueTheme,
  purple: purpleTheme,
};

export const ThemeContext = createContext({
  theme: greenTheme, // Default to green theme
  currentTheme: 'green',
  switchTheme: (themeName: string) => {},
  isDarkMode: false,
  toggleDarkMode: () => {},
  textSize: 30, // Add text size default
  setTextSize: (size: number) => {},
  reciter: 'alafasy',
  setReciter: (reciter: string) => {}
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState('green');
  const [theme, setTheme] = useState(themes.green); 
  const [isDarkMode, setIsDarkMode] = useState(true) // default is darker theme
  const [textSize, setTextSize] = useState(30); // Default text size
  const [reciter, setReciter] = useState('ar.alafasy')

  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedTextSize = await AsyncStorage.getItem('textSize');
      const savedReciter = await AsyncStorage.getItem('reciter');

      //@ts-ignore
      if (savedTheme && themes[savedTheme]) {
        setCurrentTheme(savedTheme);
        //@ts-ignore
        setTheme(themes[savedTheme]);
      }
      if (savedTextSize !== null) setTextSize(parseInt(savedTextSize, 10));
      if (savedReciter !== null) setReciter(savedReciter);
    };
    loadSettings();
  }, []);

  const switchTheme = async (themeName: string) => {
    //@ts-ignore
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      //@ts-ignore
      setTheme(themes[themeName]);
      await AsyncStorage.setItem('theme', themeName);
    }
  };

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
    <ThemeContext.Provider value={{
      theme,
      currentTheme,
      switchTheme, 
      isDarkMode, 
      toggleDarkMode, 
      textSize, 
      setTextSize: updateTextSize, 
      reciter, 
      setReciter: updateReciter }}
    >
      {children}
    </ThemeContext.Provider>
  );
};