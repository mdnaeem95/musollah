import React, { createContext, useContext, useMemo } from 'react';
import { usePreferencesStore } from '../stores/userPreferencesStore';
import { greenTheme, blueTheme, purpleTheme } from '../theme/theme';

// Theme object mapping
const themes = {
  green: greenTheme,
  blue: blueTheme,
  purple: purpleTheme,
};

// Types
export type ThemeType = typeof greenTheme['light'] | typeof greenTheme['dark'];
export type ThemeColor = 'green' | 'blue' | 'purple';

interface ThemeContextValue {
  theme: ThemeType;
  currentTheme: ThemeColor;
  isDarkMode: boolean;
  switchTheme: (themeName: ThemeColor) => void;
  toggleDarkMode: () => void;
  textSize: number;
  setTextSize: (size: number) => void;
  reciter: string;
  setReciter: (reciter: string) => void;
}

// Context with default values
const ThemeContext = createContext<ThemeContextValue>({
  theme: greenTheme.light,
  currentTheme: 'green',
  isDarkMode: false,
  switchTheme: () => {},
  toggleDarkMode: () => {},
  textSize: 30,
  setTextSize: () => {},
  reciter: 'ar.alafasy',
  setReciter: () => {},
});

/**
 * Theme Provider using Zustand
 * 
 * Improvements over Redux version:
 * - No Redux dependency
 * - Simpler implementation
 * - Better performance with selective subscriptions
 * - Memoized theme object
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Selective subscriptions for performance
  const currentThemeName = usePreferencesStore(state => state.theme);
  const isDarkMode = usePreferencesStore(state => state.isDarkMode);
  const textSize = usePreferencesStore(state => state.textSize);
  const reciter = usePreferencesStore(state => state.reciter);
  
  // Actions
  const setTheme = usePreferencesStore(state => state.setTheme);
  const toggleDarkMode = usePreferencesStore(state => state.toggleDarkMode);
  const setTextSize = usePreferencesStore(state => state.setTextSize);
  const setReciter = usePreferencesStore(state => state.setReciter);

  // Memoized theme object
  const theme = useMemo(
    () => isDarkMode ? themes[currentThemeName].dark : themes[currentThemeName].light,
    [currentThemeName, isDarkMode]
  );

  // Memoized context value
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      currentTheme: currentThemeName,
      isDarkMode,
      switchTheme: setTheme,
      toggleDarkMode,
      textSize,
      setTextSize,
      reciter,
      setReciter,
    }),
    [theme, currentThemeName, isDarkMode, setTheme, toggleDarkMode, textSize, setTextSize, reciter, setReciter]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Export for backwards compatibility
export { themes };