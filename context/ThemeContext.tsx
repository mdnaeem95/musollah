import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store/store';
import {
  toggleDarkMode,
  setTheme,
  setTextSize,
  setReciter,
} from '../redux/slices/userPreferencesSlice';
import { greenTheme, blueTheme, purpleTheme } from '../theme/theme';

const themes = {
  green: greenTheme,
  blue: blueTheme,
  purple: purpleTheme,
};

export type ThemeType = typeof greenTheme['light'] | typeof greenTheme['dark'];

export const ThemeContext = createContext({
  theme: greenTheme.light, // Default theme (light mode of greenTheme)
  currentTheme: 'green',
  isDarkMode: false,
  switchTheme: (themeName: string) => {},
  toggleDarkMode: () => {},
  textSize: 30,
  setTextSize: (size: number) => {},
  reciter: 'ar.alafasy',
  setReciter: (reciter: string) => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme: currentThemeName, isDarkMode, textSize, reciter } = useSelector(
    (state: RootState) => state.userPreferences
  );

  const theme = isDarkMode ? themes[currentThemeName].dark : themes[currentThemeName].light;

  const switchTheme = (themeName: string) => {
    //@ts-ignore
    if (themes[themeName]) {
      dispatch(setTheme(themeName));
    }
  };

  const toggleThemeMode = () => {
    dispatch(toggleDarkMode());
  };

  const updateTextSize = (size: number) => {
    dispatch(setTextSize(size));
  };

  const updateReciter = (newReciter: string) => {
    dispatch(setReciter(newReciter));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentTheme: currentThemeName,
        isDarkMode,
        switchTheme,
        toggleDarkMode: toggleThemeMode,
        textSize,
        setTextSize: updateTextSize,
        reciter,
        setReciter: updateReciter,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
